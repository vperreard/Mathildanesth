import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { LeaveQueryCacheService } from '@/modules/leaves/services/LeaveQueryCacheService';
import { LeaveEvent } from '@/modules/leaves/types/cache';
import { logger } from '@/lib/logger';

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
    type: string;
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
            [LeaveType.CongesPayes]: 25,
            [LeaveType.RTT]: 10,
            [LeaveType.Maladie]: 12, // Ou gérer différemment
            [LeaveType.Formation]: 5,
            [LeaveType.CongesSansSolde]: 0,
            [LeaveType.Exceptionnel]: 3,
            [LeaveType.Recuperation]: 0,
            // Ajouter d'autres types si nécessaire
        };

        // Utiliser le type AggregatedLeave[] pour le résultat
        const leavesByType: AggregatedLeave[] = await prisma.$queryRaw<AggregatedLeave[]>`
            SELECT 
                "type", 
                "status",
                SUM("workingDaysCount")::integer as "totalDays" -- Caster en integer
            FROM "Leave"
            WHERE 
                "userId" = ${userIdInt}
                AND (
                    ("startDate" >= ${startDate} AND "startDate" <= ${endDate})
                    OR ("endDate" >= ${startDate} AND "endDate" <= ${endDate})
                    OR ("startDate" <= ${startDate} AND "endDate" >= ${endDate})
                )
            GROUP BY "type", "status"
        `;

        // Obtenir la liste des types de congés disponibles
        const leaveTypes = Object.values(LeaveType);

        // Initialiser les compteurs avec les allocations par défaut
        const detailsByType: Record<string, { initial: number, used: number, pending: number }> = {};
        leaveTypes.forEach(type => {
            detailsByType[type] = {
                initial: defaultAllowances[type] || 0,
                used: 0,
                pending: 0
            };
        });

        // Remplir les détails (utiliser le type AggregatedLeave)
        leavesByType.forEach((leave: AggregatedLeave) => {
            const { type, status, totalDays } = leave;
            const days = Number(totalDays || 0); // Gérer le cas null et convertir

            // Vérifier si le type existe dans les détails, sinon l'initialiser
            if (!detailsByType[type]) {
                detailsByType[type] = { initial: 0, used: 0, pending: 0 };
            }

            // Utiliser les bonnes valeurs d'enum importées
            if (status === LeaveStatus.APPROVED) {
                detailsByType[type].used += days;
            } else if (status === LeaveStatus.PENDING) {
                detailsByType[type].pending += days;
            }
        });

        // Récupérer les ajustements avec une requête simple sans utiliser d'index unique
        const quotaAdjustments = await prisma.leaveQuotaAdjustment.findMany({
            where: {
                userId: userIdInt,
                year: targetYear
            }
        });

        // Appliquer les ajustements
        let totalAdjustment = 0;
        const adjustmentsByType: Record<string, number> = {};

        // Initialiser les ajustements par type à 0
        leaveTypes.forEach(type => {
            adjustmentsByType[type] = 0;
        });

        quotaAdjustments.forEach((adjustment: any) => {
            const type = adjustment.leaveType;
            if (type in adjustmentsByType) {
                adjustmentsByType[type] += adjustment.amount;
                totalAdjustment += adjustment.amount;
            } else {
                logger.warn(`Type d'ajustement de quota inconnu trouvé: ${type} pour l'utilisateur ${userIdInt}`);
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
            const initial = detailsByType[type].initial;
            const adjustment = adjustmentsByType[type] || 0;
            const used = detailsByType[type].used;
            const pending = detailsByType[type].pending;
            const remaining = initial + adjustment - used - pending;

            finalBalancesByType[type] = {
                initial,
                adjustment,
                used,
                pending,
                remaining
            };

            totalInitial += initial;
            totalUsed += used;
            totalPending += pending;
        });

        const totalRemaining = totalInitial + totalAdjustment - totalUsed - totalPending;

        // Résultat final
        const result = {
            userId: userIdInt,
            year: targetYear,
            totalInitialAllowance: totalInitial, // Allocation totale calculée
            totalAdjustments: totalAdjustment,
            totalUsed,
            totalPending,
            totalRemaining,
            detailsByType: finalBalancesByType, // Détails par type
            lastUpdated: new Date()
        };

        // Mettre en cache les résultats avec le système de cache intelligent
        await cacheService.cacheData(cacheKey, result, 'BALANCE');

        return res.status(200).json(result);
    } catch (error) {
        // Log amélioré pour voir la nature de l'erreur
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error(`Erreur API /api/leaves/balance: Message=[${errorMessage}]`, {
            userId,
            year,
            errorObject: error, // Log the original error object too
            stack: errorStack
        });
        return res.status(500).json({
            error: 'Erreur serveur lors du calcul du solde de congés',
            details: errorMessage // Retourner un message d'erreur plus informatif
        });
    }
} 