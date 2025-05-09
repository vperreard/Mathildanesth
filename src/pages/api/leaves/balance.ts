import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { LeaveQueryCacheService } from '@/modules/leaves/services/LeaveQueryCacheService';
import { LeaveEvent } from '@/modules/leaves/types/cache';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

// Pour TypeScript, définir des enums manuellement si nécessaire
enum LeaveType {
    CongesPayes = 'CongesPayes',
    RTT = 'RTT',
    Maladie = 'Maladie',
    Formation = 'Formation',
    CongesSansSolde = 'CongesSansSolde',
    Exceptionnel = 'Exceptionnel',
    Recuperation = 'Recuperation'
}

enum LeaveStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED'
}

// Définir le type pour les ajustements de quota
interface QuotaAdjustment {
    id: string;
    userId: number;
    leaveType: string;
    amount: number;
    reason: string;
    year: number;
    createdAt: Date;
    updatedAt: Date;
}

// Définir un type pour le résultat de la requête brute
interface AggregatedLeave {
    typeCode: string;
    status: string;
    totalDays: number | null; // Le SUM peut être null si aucun congé
}

// Obtenir le service de cache
const cacheService = LeaveQueryCacheService.getInstance();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const { userId, year } = req.query;

    if (!userId || !year) {
        return res.status(400).json({ error: 'userId and year parameters are required' });
    }

    const userIdInt = parseInt(userId as string, 10);
    const targetYear = parseInt(year as string, 10);

    if (isNaN(userIdInt) || isNaN(targetYear)) {
        return res.status(400).json({ error: 'userId and year must be valid numbers' });
    }

    try {
        // Générer la clé de cache
        const cacheKey = cacheService.generateBalanceKey(userIdInt.toString(), targetYear);

        // Tenter de récupérer les données depuis le cache
        const cachedData = await cacheService.getCachedData(cacheKey);
        if (cachedData) {
            logger.debug(`Solde de congés récupéré depuis le cache: ${cacheKey}`);
            return res.status(200).json(cachedData);
        }

        // Calculer les dates de début et de fin de l'année cible
        const startDate = new Date(targetYear, 0, 1); // 1er Janvier
        const endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999); // 31 Décembre

        // --- Définir les allocations annuelles par défaut (à rendre configurable plus tard) ---
        const defaultAllowances: Record<string, number> = {
            'CP': 25,       // CongesPayes
            'RTT': 10,      // RTT
            'MAL': 12,      // Maladie
            'FORM': 5,      // Formation
            'CSS': 0,       // CongesSansSolde
            'EXCEP': 3,     // Exceptionnel
            'RECUP': 0,     // Recuperation
            'ANNUAL': 25,   // Au cas où les anciens codes sont encore utilisés
            'RECOVERY': 10,
            'SICK': 12,
            'TRAINING': 5,
            'UNPAID': 0,
            'SPECIAL': 3,
            'OTHER': 0,
        };

        // Utiliser une approche différente pour éviter les problèmes de template string
        // On va utiliser une requête SQL simple pour agréger les données
        logger.info(`Récupération des congés pour userId: ${userIdInt}, année: ${targetYear}`);
        let leavesByType: AggregatedLeave[] = [];

        try {
            // Nous utilisons quand même Prisma.$queryRaw mais avec une approche simplifiée
            const query = `
                SELECT 
                    "typeCode",
                    "status", 
                    COALESCE(SUM("countedDays"), 0)::integer as "totalDays"
                FROM "Leave" 
                WHERE 
                    "userId" = $1 
                    AND (
                        ("startDate" >= $2 AND "startDate" <= $3) 
                        OR ("endDate" >= $2 AND "endDate" <= $3) 
                        OR ("startDate" <= $2 AND "endDate" >= $3)
                    ) 
                    AND "status" != $4
                GROUP BY "typeCode", "status"
            `;

            // Utiliser Prisma.$queryRawUnsafe avec les paramètres passés séparément
            leavesByType = await prisma.$queryRawUnsafe<AggregatedLeave[]>(
                query,
                userIdInt,
                startDate,
                endDate,
                LeaveStatus.CANCELLED
            );

            logger.debug('Résultat requête leavesByType:', { leavesByType });
        } catch (dbError) {
            logger.error('Erreur lors de la récupération des congés', {
                error: dbError,
                userId: userIdInt,
                year: targetYear,
                errorDetails: dbError instanceof Error ? dbError.message : String(dbError)
            });
            return res.status(500).json({ error: 'Erreur base de données lors de la récupération des congés.' });
        }

        // Obtenir la liste des types de congés disponibles (basé sur les clés de defaultAllowances)
        const leaveTypeCodes = Object.keys(defaultAllowances);

        // Initialiser les compteurs avec les allocations par défaut
        const detailsByType: Record<string, { initial: number, used: number, pending: number }> = {};
        leaveTypeCodes.forEach(tc => {
            detailsByType[tc] = {
                initial: defaultAllowances[tc] || 0,
                used: 0,
                pending: 0
            };
        });

        // Remplir les détails (utiliser le type AggregatedLeave)
        leavesByType.forEach((leave: AggregatedLeave) => {
            const { typeCode, status, totalDays } = leave;
            const days = Number(totalDays || 0); // Gérer le cas null et convertir

            // Vérifier si le typeCode existe dans les détails, sinon l'initialiser (ou logguer une alerte)
            if (!detailsByType[typeCode]) {
                logger.warn(`Type de congé (code) inconnu '${typeCode}' trouvé dans les données agrégées. Il n'a pas d'allocation par défaut définie.`);
            }

            // Si detailsByType[typeCode] peut être undefined (si on n'initialise pas ci-dessus), il faut le vérifier
            if (detailsByType[typeCode]) {
                // Utiliser les bonnes valeurs d'enum importées
                if (status === LeaveStatus.APPROVED) {
                    detailsByType[typeCode].used += days;
                } else if (status === LeaveStatus.PENDING) {
                    detailsByType[typeCode].pending += days;
                }
            }
        });

        // Récupérer les ajustements avec une requête sur le modèle LeaveQuotaAdjustment
        logger.info(`Récupération des ajustements de quota pour userId: ${userIdInt}, année: ${targetYear}`);
        let quotaAdjustments: QuotaAdjustment[] = [];
        try {
            // Utiliser le bon modèle Prisma, vérifié dans le schéma
            const adjustments = await prisma.$queryRaw<QuotaAdjustment[]>`
                SELECT * FROM "LeaveQuotaAdjustment"
                WHERE "userId" = ${userIdInt} AND "year" = ${targetYear}
            `;

            quotaAdjustments = adjustments;
            logger.debug('Résultat requête quotaAdjustments:', { quotaAdjustments });
        } catch (dbError) {
            logger.error('Erreur lors de la récupération des ajustements de quota', {
                error: dbError,
                userId: userIdInt,
                year: targetYear,
                errorDetails: dbError instanceof Error ? dbError.message : String(dbError)
            });
            return res.status(500).json({ error: 'Erreur base de données lors de la récupération des ajustements.' });
        }

        // Appliquer les ajustements
        let totalAdjustment = 0;
        const adjustmentsByType: Record<string, number> = {};

        // Initialiser les ajustements par type à 0
        leaveTypeCodes.forEach(tc => {
            adjustmentsByType[tc] = 0;
        });

        quotaAdjustments.forEach((adjustment: QuotaAdjustment) => {
            const type = adjustment.leaveType;
            if (type in adjustmentsByType) {
                adjustmentsByType[type] += adjustment.amount;
                totalAdjustment += adjustment.amount;
            } else {
                logger.warn(`Type d'ajustement de quota inconnu trouvé: ${type} pour l'utilisateur ${userIdInt}. Ajustement ignoré.`);
            }
        });

        // Calculer les totaux globaux et par type
        let totalUsed = 0;
        let totalPending = 0;
        let totalInitial = 0;

        const finalBalancesByType: Record<string, {
            initial: number,
            adjustment: number,
            used: number,
            pending: number,
            remaining: number
        }> = {};

        Object.keys(detailsByType).forEach(type => {
            // Si detailsByType[type] peut être undefined, il faut le gérer
            if (!detailsByType[type]) {
                logger.warn(`Le type ${type} n'a pas pu être traité pour les soldes finaux car il n'était pas dans detailsByType.`);
                return; // Passer au suivant
            }

            const initial = detailsByType[type].initial;
            const adjustmentAmount = adjustmentsByType[type] || 0;
            const used = detailsByType[type].used;
            const pending = detailsByType[type].pending;
            const remaining = initial + adjustmentAmount - used - pending;

            finalBalancesByType[type] = {
                initial,
                adjustment: adjustmentAmount,
                used,
                pending,
                remaining
            };

            totalInitial += initial;
            totalUsed += used;
            totalPending += pending;
        });

        const resultPayload = {
            userId: userIdInt,
            year: targetYear,
            balances: finalBalancesByType,
            totals: {
                initial: totalInitial,
                adjustment: totalAdjustment,
                used: totalUsed,
                pending: totalPending,
                remaining: totalInitial + totalAdjustment - totalUsed - totalPending
            }
        };

        // Mettre en cache les données calculées
        try {
            await cacheService.cacheData(cacheKey, resultPayload, 'BALANCE');
            logger.debug(`Solde de congés mis en cache: ${cacheKey}`);
        } catch (cacheError) {
            logger.error('Erreur lors de la mise en cache du solde de congés', {
                error: cacheError,
                cacheKey,
                errorDetails: cacheError instanceof Error ? cacheError.message : String(cacheError)
            });
            // Ne pas bloquer la réponse si le cache échoue, mais logguer l'erreur
        }

        res.status(200).json(resultPayload);

    } catch (error) {
        logger.error(`Erreur inattendue dans /api/leaves/balance pour userId ${userIdInt}, year ${targetYear}`, {
            error,
            errorDetails: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        res.status(500).json({ error: 'Internal server error' });
    }
} 