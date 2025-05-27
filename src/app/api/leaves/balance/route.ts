import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LeaveQueryCacheService } from '@/modules/conges/services/LeaveQueryCacheService';
import { logger } from '@/lib/logger';
import { Prisma, LeaveType as PrismaLeaveType, LeaveStatus as PrismaLeaveStatus } from '@prisma/client';

/**
 * Route GET /api/conges/balance
 * Récupère le solde de congés d'un utilisateur pour une année donnée.
 */
export async function GET(request: NextRequest) {
    // Récupérer les paramètres
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const year = searchParams.get('year');
    const annee = searchParams.get('annee'); // Alternative pour compatibilité

    if (!userId || (!year && !annee)) {
        return NextResponse.json({ error: 'userId and year parameters are required' }, { status: 400 });
    }

    const userIdInt = parseInt(userId, 10);
    const targetYear = parseInt(year || annee || '', 10);

    if (isNaN(userIdInt) || isNaN(targetYear)) {
        return NextResponse.json({ error: 'userId and year must be valid numbers' }, { status: 400 });
    }

    try {
        // Variable pour stocker les données cachées
        let cachedData = null;
        let cacheService = null;
        let cacheKey = '';

        // Essayer d'utiliser le cache, mais continuer même en cas d'erreur
        try {
            // Obtenir le service de cache
            cacheService = LeaveQueryCacheService.getInstance();
            cacheKey = cacheService.generateBalanceKey(userIdInt.toString(), targetYear);
            cachedData = await cacheService.getCachedData(cacheKey);
            if (cachedData) {
                logger.debug(`Solde de congés récupéré depuis le cache: ${cacheKey}`);
                return NextResponse.json(cachedData);
            }
        } catch (cacheError) {
            // Enregistrer l'erreur mais continuer le traitement
            logger.warn(`Erreur avec le cache Redis, continuons sans cache: ${cacheError}`);
        }

        const yearStartDate = new Date(targetYear, 0, 1);
        const yearEndDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);

        // 1. Récupérer tous les types de congés actifs (LeaveTypeSetting)
        const activeLeaveTypes = await prisma.leaveTypeSetting.findMany({
            where: { isActive: true },
            select: { code: true, label: true }
        });

        if (!activeLeaveTypes || activeLeaveTypes.length === 0) {
            logger.warn("Aucun LeaveTypeSetting actif trouvé.", { userIdInt, targetYear });
            const emptyResponse = {
                balances: {},
                totals: { initial: 0, acquired: 0, carryOver: 0, transfers: 0, effectiveInitial: 0, used: 0, pending: 0, remaining: 0 },
                metadata: { userId: userIdInt, year: targetYear, generatedAt: new Date().toISOString() }
            };
            return NextResponse.json(emptyResponse);
        }

        // Initialiser la structure pour les soldes
        const finalBalancesByType: Record<string, {
            label: string;
            initial: number;
            acquired: number;
            carryOver: number;
            transfers: number;
            effectiveInitial: number;
            used: number;
            pending: number;
            remaining: number;
        }> = {};

        activeLeaveTypes.forEach(lt => {
            finalBalancesByType[lt.code] = {
                label: lt.label,
                initial: 0,
                acquired: 0,
                carryOver: 0,
                transfers: 0,
                effectiveInitial: 0,
                used: 0,
                pending: 0,
                remaining: 0
            };
        });

        // 2. Récupérer les LeaveBalance (pour le champ 'initial')
        try {
            const leaveBalances = await prisma.leaveBalance.findMany({
                where: {
                    userId: userIdInt,
                    year: targetYear,
                    leaveType: { in: activeLeaveTypes.map(lt => lt.code as PrismaLeaveType) }
                },
                select: { leaveType: true, initial: true }
            });
            leaveBalances.forEach(lb => {
                if (finalBalancesByType[lb.leaveType]) {
                    finalBalancesByType[lb.leaveType].initial = lb.initial;
                }
            });
        } catch (error) {
            logger.error("Erreur lors de la récupération des LeaveBalance pour le solde initial", { error, userIdInt, targetYear });
        }

        // 3. Récupérer les QuotaCarryOver (reports de N-1 vers N)
        try {
            const carryOvers = await prisma.quotaCarryOver.findMany({
                where: {
                    userId: userIdInt,
                    toYear: targetYear,
                    status: 'APPROVED',
                    leaveType: { in: activeLeaveTypes.map(lt => lt.code as PrismaLeaveType) }
                }
            });
            carryOvers.forEach(co => {
                if (finalBalancesByType[co.leaveType]) {
                    finalBalancesByType[co.leaveType].carryOver += co.amount;
                }
            });
        } catch (error) {
            logger.error("Erreur lors de la récupération des QuotaCarryOver", { error, userIdInt, targetYear });
        }

        // 4. Récupérer les QuotaTransfer (transferts affectant l'année cible)
        try {
            const transfers = await prisma.quotaTransfer.findMany({
                where: {
                    userId: userIdInt,
                    status: 'APPROVED',
                    transferDate: {
                        gte: yearStartDate,
                        lte: yearEndDate,
                    }
                }
            });
            transfers.forEach(qt => {
                if (finalBalancesByType[qt.toType]) {
                    finalBalancesByType[qt.toType].transfers += qt.convertedAmount;
                }
                if (finalBalancesByType[qt.fromType]) {
                    finalBalancesByType[qt.fromType].transfers -= qt.amount;
                }
            });
        } catch (error) {
            logger.error("Erreur lors de la récupération des QuotaTransfer", { error, userIdInt, targetYear });
        }

        // 5. Récupérer les congés posés (Leave) pour calculer used/pending
        try {
            // Requête pour les congés approuvés (used) et en attente (pending)
            const leavesResult = await prisma.$queryRaw`
                SELECT 
                    "typeCode",
                    "status", 
                    COALESCE(SUM("countedDays"), 0)::float as "totalDays"
                FROM "Leave" 
                WHERE 
                    "userId" = ${userIdInt} 
                    AND "startDate" <= ${yearEndDate} 
                    AND "endDate" >= ${yearStartDate} 
                    AND "status" != 'CANCELLED' 
                GROUP BY "typeCode", "status"
            `;

            const leavesConsumedByType = leavesResult as Array<{
                typeCode: string;
                status: PrismaLeaveStatus;
                totalDays: number;
            }>;

            leavesConsumedByType.forEach(lc => {
                if (finalBalancesByType[lc.typeCode]) {
                    if (lc.status === 'APPROVED') {
                        finalBalancesByType[lc.typeCode].used += lc.totalDays;
                    } else if (lc.status === 'PENDING') {
                        finalBalancesByType[lc.typeCode].pending += lc.totalDays;
                    }
                }
            });
        } catch (error) {
            logger.error("Erreur lors de la récupération des congés pour le calcul du solde", { error, userIdInt, targetYear });
        }

        // 6. Calculer les valeurs dérivées (effectiveInitial, remaining)
        Object.keys(finalBalancesByType).forEach(typeCode => {
            const balance = finalBalancesByType[typeCode];
            balance.effectiveInitial = balance.initial + balance.acquired + balance.carryOver + balance.transfers;
            balance.remaining = balance.effectiveInitial - balance.used - balance.pending;
        });

        // 7. Calculer les totaux
        const totals = {
            initial: 0,
            acquired: 0,
            carryOver: 0,
            transfers: 0,
            effectiveInitial: 0,
            used: 0,
            pending: 0,
            remaining: 0
        };

        Object.values(finalBalancesByType).forEach(balance => {
            totals.initial += balance.initial;
            totals.acquired += balance.acquired;
            totals.carryOver += balance.carryOver;
            totals.transfers += balance.transfers;
            totals.effectiveInitial += balance.effectiveInitial;
            totals.used += balance.used;
            totals.pending += balance.pending;
            totals.remaining += balance.remaining;
        });

        // 8. Construire la réponse finale
        const response = {
            balances: finalBalancesByType,
            totals,
            metadata: {
                userId: userIdInt,
                year: targetYear,
                generatedAt: new Date().toISOString()
            }
        };

        // Mettre en cache le résultat seulement si le cache est disponible
        try {
            if (cacheService && cacheKey) {
                await cacheService.cacheData(cacheKey, response, 'BALANCE');
            }
        } catch (cacheError) {
            logger.warn(`Impossible de mettre les données en cache: ${cacheError}`);
            // Ne pas bloquer la réponse en cas d'erreur de cache
        }

        return NextResponse.json(response);
    } catch (error) {
        logger.error("Erreur lors du calcul du solde de congés", { error, userId, year });
        return NextResponse.json({ error: "Une erreur est survenue lors du calcul du solde de congés" }, { status: 500 });
    }
} 