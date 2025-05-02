import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { LeaveStatus, LeaveType } from '@prisma/client';
import { LeaveQueryCacheService } from '@/modules/leaves/services/LeaveQueryCacheService';
import { LeaveEvent } from '@/modules/leaves/types/cache';
import { logger } from '@/lib/logger';

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

        // Récupérer l'allocation annuelle pour l'utilisateur depuis la configuration utilisateur
        const userProfile = await prisma.userProfile.findUnique({
            where: { userId: userIdInt },
            select: {
                annualLeaveAllowance: true,
                additionalLeaveAllowance: true,
                sickLeaveAllowance: true
            }
        });

        const totalDays = userProfile?.annualLeaveAllowance || 25; // Valeur par défaut si non trouvée
        const additionalDays = userProfile?.additionalLeaveAllowance || 0;
        const sickDays = userProfile?.sickLeaveAllowance || 12;

        // Optimisation: Utiliser l'agrégation Prisma pour calculer les jours utilisés par type de congé
        // Cette requête est beaucoup plus efficace qu'une requête suivie d'une réduction en mémoire
        const leavesByType = await prisma.$queryRaw`
            SELECT 
                "type", 
                "status",
                SUM("workingDaysCount") as "totalDays"
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

        // Initialiser les compteurs pour chaque type de congé
        const detailsByType = Object.values(LeaveType).reduce((acc, type) => {
            acc[type] = { used: 0, pending: 0 };
            return acc;
        }, {} as Record<string, { used: number, pending: number }>);

        // Remplir les détails par type depuis les résultats agrégés
        leavesByType.forEach((leave: any) => {
            const { type, status, totalDays } = leave;

            if (status === LeaveStatus.APPROUVE) {
                detailsByType[type].used += Number(totalDays);
            } else if (status === LeaveStatus.EN_ATTENTE) {
                detailsByType[type].pending += Number(totalDays);
            }
        });

        // Récupérer les ajustements manuels de quotas pour l'utilisateur
        const quotaAdjustments = await prisma.leaveQuotaAdjustment.findMany({
            where: {
                userId: userIdInt,
                year: targetYear
            }
        });

        // Appliquer les ajustements de quotas
        let totalAdjustment = 0;
        const adjustmentsByType: Record<string, number> = {};

        quotaAdjustments.forEach(adjustment => {
            const type = adjustment.leaveType;
            adjustmentsByType[type] = (adjustmentsByType[type] || 0) + adjustment.amount;
            totalAdjustment += adjustment.amount;
        });

        // Calculer les totaux
        const used = Object.values(detailsByType).reduce((sum, detail) => sum + detail.used, 0);
        const pending = Object.values(detailsByType).reduce((sum, detail) => sum + detail.pending, 0);
        const remaining = totalDays + additionalDays + totalAdjustment - used - pending;

        // Résultat final
        const result = {
            userId: userIdInt,
            year: targetYear,
            initialAllowance: totalDays,
            additionalAllowance: additionalDays,
            adjustments: totalAdjustment,
            adjustmentsByType,
            used,
            pending,
            remaining,
            detailsByType,
            sickLeave: {
                allowance: sickDays,
                used: detailsByType[LeaveType.MALADIE]?.used || 0,
                pending: detailsByType[LeaveType.MALADIE]?.pending || 0,
                remaining: sickDays - (detailsByType[LeaveType.MALADIE]?.used || 0) - (detailsByType[LeaveType.MALADIE]?.pending || 0)
            },
            lastUpdated: new Date()
        };

        // Mettre en cache les résultats avec le système de cache intelligent
        await cacheService.cacheData(cacheKey, result, 'BALANCE');

        return res.status(200).json(result);
    } catch (error) {
        logger.error(`Erreur API /api/leaves/balance:`, { userId, year, error });
        return res.status(500).json({
            error: 'Erreur serveur lors du calcul du solde de congés',
            details: error instanceof Error ? error.message : String(error)
        });
    }
} 