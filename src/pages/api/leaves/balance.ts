import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { LeaveQueryCacheService } from '@/modules/leaves/services/LeaveQueryCacheService';
import { logger } from '@/lib/logger';
import { Prisma, LeaveType as PrismaLeaveType, LeaveStatus as PrismaLeaveStatus } from '@prisma/client';

/**
 * @api {get} /api/leaves/balance Récupérer le solde de congés d'un utilisateur pour une année donnée.
 * @apiName GetLeaveBalance
 * @apiGroup Leaves
 * @apiVersion 1.0.0
 *
 * @apiParam {String} userId ID de l'utilisateur.
 * @apiParam {String} year  Année pour laquelle calculer le solde (format YYYY).
 * @apiParam {String} [annee] Année pour laquelle calculer le solde (alternative à `year`, format YYYY).
 *
 * @apiSuccess {Object} balances Un objet où chaque clé est un `typeCode` de congé (ex: "ANNUAL", "RTT").
 * @apiSuccess {Object} balances.typeCode Détail du solde pour ce type.
 * @apiSuccess {String} balances.typeCode.label Nom lisible du type de congé.
 * @apiSuccess {Number} balances.typeCode.initial Solde initial configuré (depuis `LeaveBalance`).
 * @apiSuccess {Number} balances.typeCode.carryOver Jours reportés de l'année précédente (depuis `QuotaCarryOver`).
 * @apiSuccess {Number} balances.typeCode.transfers Jours transférés (positif si reçu, négatif si donné, depuis `QuotaTransfer`).
 * @apiSuccess {Number} balances.typeCode.effectiveInitial Solde initial effectif (initial + carryOver + transfers).
 * @apiSuccess {Number} balances.typeCode.used Jours approuvés et consommés.
 * @apiSuccess {Number} balances.typeCode.pending Jours demandés et en attente d'approbation.
 * @apiSuccess {Number} balances.typeCode.remaining Solde restant (effectiveInitial - used - pending).
 * @apiSuccess {Object} totals Sommes globales pour tous les types de congés.
 * @apiSuccess {Number} totals.initial Total des soldes initiaux.
 * @apiSuccess {Number} totals.carryOver Total des jours reportés.
 * @apiSuccess {Number} totals.transfers Total net des jours transférés.
 * @apiSuccess {Number} totals.effectiveInitial Total des soldes initiaux effectifs.
 * @apiSuccess {Number} totals.used Total des jours utilisés.
 * @apiSuccess {Number} totals.pending Total des jours en attente.
 * @apiSuccess {Number} totals.remaining Total des soldes restants.
 * @apiSuccess {Object} metadata Informations sur la requête.
 * @apiSuccess {Number} metadata.userId ID de l'utilisateur concerné.
 * @apiSuccess {Number} metadata.year Année concernée.
 * @apiSuccess {String} metadata.generatedAt Timestamp de la génération du solde.
 *
 * @apiSuccessExample {json} Succès:
 * HTTP/1.1 200 OK
 * {
 *   "balances": {
 *     "ANNUAL": {
 *       "label": "Congés Annuels",
 *       "initial": 25,
 *       "carryOver": 2,
 *       "transfers": -1,
 *       "effectiveInitial": 26,
 *       "used": 10,
 *       "pending": 0,
 *       "remaining": 16
 *     },
 *     "RTT": {
 *       "label": "RTT",
 *       "initial": 10,
 *       "carryOver": 0,
 *       "transfers": 1,
 *       "effectiveInitial": 11,
 *       "used": 5,
 *       "pending": 2,
 *       "remaining": 4
 *     }
 *   },
 *   "totals": {
 *     "initial": 35,
 *     "carryOver": 2,
 *     "transfers": 0,
 *     "effectiveInitial": 37,
 *     "used": 15,
 *     "pending": 2,
 *     "remaining": 20
 *   },
 *   "metadata": {
 *     "userId": 123,
 *     "year": 2024,
 *     "generatedAt": "2024-07-30T10:00:00.000Z"
 *   }
 * }
 *
 * @apiError (400 Bad Request) {String} error Message si `userId` ou `year` sont manquants ou invalides.
 * @apiError (500 Internal Server Error) {String} error Message en cas d'erreur serveur.
 */
// Définir un type pour le résultat de la requête brute sur les Leaves
interface AggregatedLeave {
    typeCode: string; // Correspond à LeaveTypeSetting.code et Leave.typeCode
    status: PrismaLeaveStatus;
    totalDays: number | null;
}

// Obtenir le service de cache
const cacheService = LeaveQueryCacheService.getInstance();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const { userId, year, annee } = req.query;
    const yearString = (year || annee) as string;
    const userIdString = userId as string;

    if (!userIdString || !yearString) {
        return res.status(400).json({ error: 'userId and year parameters are required' });
    }

    const userIdInt = parseInt(userIdString, 10);
    const targetYear = parseInt(yearString, 10);

    if (isNaN(userIdInt) || isNaN(targetYear)) {
        return res.status(400).json({ error: 'userId and year must be valid numbers' });
    }

    try {
        const cacheKey = cacheService.generateBalanceKey(userIdInt.toString(), targetYear);
        const cachedData = await cacheService.getCachedData(cacheKey);
        if (cachedData) {
            logger.debug(`Solde de congés récupéré depuis le cache: ${cacheKey}`);
            return res.status(200).json(cachedData);
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
            return res.status(200).json(emptyResponse);
        }

        // Initialiser la structure pour les soldes
        const finalBalancesByType: Record<string, {
            label: string;
            initial: number;
            acquired: number; // TODO: Calculer à partir de LeaveBalanceAdjustment si le modèle est identifié
            carryOver: number; // Renommé pour correspondre à l'exemple de l'API (était carryOverIn)
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
                acquired: 0, // Initialisé à 0, source de données à confirmer
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
                select: { leaveType: true, initial: true } // Seul 'initial' est lu depuis LeaveBalance
            });
            leaveBalances.forEach(lb => {
                if (finalBalancesByType[lb.leaveType]) {
                    finalBalancesByType[lb.leaveType].initial = lb.initial;
                }
            });
        } catch (error) {
            logger.error("Erreur lors de la récupération des LeaveBalance pour le solde initial", { error, userIdInt, targetYear });
        }

        // 3. Récupérer les QuotaCarryOver (reports de N-1 vers N, donc toYear = targetYear)
        try {
            const carryOvers = await prisma.quotaCarryOver.findMany({
                where: {
                    userId: userIdInt,
                    toYear: targetYear,
                    status: 'APPROVED', // S'assurer que seuls les reports approuvés sont comptés
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
                    status: 'APPROVED', // S'assurer que seuls les transferts approuvés sont comptés
                    // Un transfert affecte le solde de l'année `targetYear`
                    // Il faut une convention pour dire à quelle année un transfert s'applique.
                    // Supposons que `transferDate` est indicative de l'année d'effet.
                    transferDate: {
                        gte: yearStartDate,
                        lte: yearEndDate,
                    },
                    // Ou si le transfert a un champ `year` explicite: year: targetYear
                }
            });
            transfers.forEach(qt => {
                // Vérifier si le type de congé du transfert est suivi dans finalBalancesByType
                if (finalBalancesByType[qt.toType]) { // Bénéficiaire
                    finalBalancesByType[qt.toType].transfers += qt.convertedAmount;
                }
                if (finalBalancesByType[qt.fromType]) { // Cédant
                    finalBalancesByType[qt.fromType].transfers -= qt.amount;
                }
            });
        } catch (error) {
            logger.error("Erreur lors de la récupération des QuotaTransfer", { error, userIdInt, targetYear });
        }

        // 5. Récupérer les congés posés (Leave) pour calculer used/pending
        let leavesConsumedByType: AggregatedLeave[] = [];
        try {
            const queryLeaves = `
                SELECT 
                    "typeCode",
                    "status", 
                    COALESCE(SUM("countedDays"), 0)::float as "totalDays"
                FROM "Leave" 
                WHERE 
                    "userId" = $1 
                    AND "startDate" <= $3 
                    AND "endDate" >= $2   
                    AND "status" != $4 
                GROUP BY "typeCode", "status"
            `;
            leavesConsumedByType = await prisma.$queryRawUnsafe<AggregatedLeave[]>(
                queryLeaves, userIdInt, yearStartDate, yearEndDate, PrismaLeaveStatus.CANCELLED
            );
        } catch (dbError) {
            logger.error('Erreur lors de la récupération des congés posés pour used/pending', {
                error: dbError, userId: userIdInt, year: targetYear,
                errorDetails: dbError instanceof Error ? dbError.message : String(dbError)
            });
            return res.status(500).json({ error: 'Erreur base de données lors de la récupération des congés posés.' });
        }

        // 6. Appliquer used/pending et calculer les soldes finaux
        activeLeaveTypes.forEach(lt => {
            const balance = finalBalancesByType[lt.code];
            if (!balance) return; // Ne devrait pas arriver si initialisé correctement

            leavesConsumedByType.forEach(consumed => {
                if (consumed.typeCode === lt.code) {
                    if (consumed.status === PrismaLeaveStatus.APPROVED) {
                        balance.used += consumed.totalDays || 0;
                    } else if (consumed.status === PrismaLeaveStatus.PENDING) {
                        balance.pending += consumed.totalDays || 0;
                    }
                }
            });

            balance.effectiveInitial = parseFloat((balance.initial + balance.acquired + balance.carryOver + balance.transfers).toFixed(3));
            balance.used = parseFloat(balance.used.toFixed(3));
            balance.pending = parseFloat(balance.pending.toFixed(3));
            balance.remaining = parseFloat((balance.effectiveInitial - balance.used - balance.pending).toFixed(3));

            // Assurer la précision pour les autres champs aussi
            balance.initial = parseFloat(balance.initial.toFixed(3));
            balance.acquired = parseFloat(balance.acquired.toFixed(3));
            balance.carryOver = parseFloat(balance.carryOver.toFixed(3));
            balance.transfers = parseFloat(balance.transfers.toFixed(3));
        });

        // 7. Calculer les totaux globaux
        const totals = { initial: 0, acquired: 0, carryOver: 0, transfers: 0, effectiveInitial: 0, used: 0, pending: 0, remaining: 0 };
        for (const typeCode in finalBalancesByType) {
            const balance = finalBalancesByType[typeCode];
            totals.initial += balance.initial;
            totals.acquired += balance.acquired;
            totals.carryOver += balance.carryOver;
            totals.transfers += balance.transfers;
            totals.effectiveInitial += balance.effectiveInitial;
            totals.used += balance.used;
            totals.pending += balance.pending;
            totals.remaining += balance.remaining;
        }
        Object.keys(totals).forEach(key => {
            (totals as any)[key] = parseFloat((totals as any)[key].toFixed(3));
        });

        const responseData = {
            balances: finalBalancesByType,
            totals,
            metadata: { userId: userIdInt, year: targetYear, generatedAt: new Date().toISOString() }
        };

        await cacheService.cacheData(cacheKey, responseData, 'BALANCE'); // Utilisation de cacheData
        logger.info(`Solde de congés calculé et mis en cache pour ${userIdInt}, année ${targetYear}`);
        return res.status(200).json(responseData);

    } catch (error: any) {
        logger.error(`Erreur API GetLeaveBalance pour userId ${userIdInt}, année ${targetYear}:`, { error: error.message, stack: error.stack, details: error });
        return res.status(500).json({ error: 'Erreur interne du serveur lors du calcul du solde de congés.' });
    }
}
