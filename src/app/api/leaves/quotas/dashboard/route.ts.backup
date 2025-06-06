import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';


/**
 * GET /api/conges/quotas/dashboard
 * Récupère les données pour le tableau de bord des quotas
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // Extraire les paramètres de requête
        const { searchParams } = new URL(req.url);
        const year = searchParams.get('year')
            ? parseInt(searchParams.get('year')!)
            : new Date().getFullYear();
        const departmentId = searchParams.get('departmentId');

        // Vérifier les autorisations
        const isAdmin = ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(session.user.role);
        const isManager = session.user.role === 'MANAGER';

        if (!isAdmin && !isManager && departmentId) {
            return NextResponse.json(
                { error: 'Vous n\'êtes pas autorisé à voir les données des autres départements' },
                { status: 403 }
            );
        }

        // Construire les conditions de filtrage
        const whereClause: any = {};

        if (departmentId) {
            whereClause.departmentId = departmentId;
        } else if (isManager && !isAdmin) {
            // Les managers ne peuvent voir que les données de leur département
            const manager = await prisma.user.findUnique({
                where: { id: parseInt(session.user.id) },
                select: { departmentId: true }
            });

            if (manager?.departmentId) {
                whereClause.departmentId = manager.departmentId;
            }
        }

        // 1. Statistiques d'utilisation des quotas
        const balances = await prisma.leaveBalance.findMany({
            where: {
                year,
                user: whereClause
            },
            include: {
                user: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true,
                        departmentId: true,
                        department: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        // 2. Statistiques des transferts de quotas
        const transfers = await prisma.quotaTransfer.findMany({
            where: {
                user: whereClause,
                transferDate: {
                    gte: new Date(year, 0, 1),
                    lt: new Date(year + 1, 0, 1)
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true
                    }
                }
            }
        });

        // 3. Statistiques des reports annuels
        const carryOvers = await prisma.quotaCarryOver.findMany({
            where: {
                user: whereClause,
                OR: [
                    { fromYear: year - 1, toYear: year },
                    { fromYear: year, toYear: year + 1 }
                ]
            },
            include: {
                user: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true
                    }
                }
            }
        });

        // 4. Utilisateurs avec le plus de congés/transferts
        const userStats = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                nom: true,
                prenom: true,
                departmentId: true,
                department: {
                    select: {
                        name: true
                    }
                },
                LeaveBalance: {
                    where: { year }
                },
                QuotaTransfers: {
                    where: {
                        transferDate: {
                            gte: new Date(year, 0, 1),
                            lt: new Date(year + 1, 0, 1)
                        }
                    }
                },
                Leaves: {
                    where: {
                        startDate: {
                            gte: new Date(year, 0, 1)
                        },
                        endDate: {
                            lt: new Date(year + 1, 0, 1)
                        }
                    }
                }
            },
            take: 10,
            orderBy: {
                Leaves: {
                    _count: 'desc'
                }
            }
        });

        // Calculer les statistiques agrégées

        // Statistiques d'utilisation
        const utilizationStats = {
            total: {
                initial: balances.reduce((sum, b) => sum + b.initial, 0),
                used: balances.reduce((sum, b) => sum + b.used, 0),
                pending: balances.reduce((sum, b) => sum + b.pending, 0),
                remaining: balances.reduce((sum, b) => sum + b.remaining, 0)
            },
            byType: {} as Record<string, { initial: number; used: number; pending: number; remaining: number }>,
            byDepartment: {} as Record<string, { initial: number; used: number; pending: number; remaining: number; name: string }>
        };

        // Regrouper par type de congé
        balances.forEach(balance => {
            if (!utilizationStats.byType[balance.leaveType]) {
                utilizationStats.byType[balance.leaveType] = {
                    initial: 0,
                    used: 0,
                    pending: 0,
                    remaining: 0
                };
            }

            utilizationStats.byType[balance.leaveType].initial += balance.initial;
            utilizationStats.byType[balance.leaveType].used += balance.used;
            utilizationStats.byType[balance.leaveType].pending += balance.pending;
            utilizationStats.byType[balance.leaveType].remaining += balance.remaining;

            // Regrouper par département si disponible
            if (balance.user.departmentId) {
                const deptId = balance.user.departmentId;

                if (!utilizationStats.byDepartment[deptId]) {
                    utilizationStats.byDepartment[deptId] = {
                        initial: 0,
                        used: 0,
                        pending: 0,
                        remaining: 0,
                        name: balance.user.department?.name || 'Inconnu'
                    };
                }

                utilizationStats.byDepartment[deptId].initial += balance.initial;
                utilizationStats.byDepartment[deptId].used += balance.used;
                utilizationStats.byDepartment[deptId].pending += balance.pending;
                utilizationStats.byDepartment[deptId].remaining += balance.remaining;
            }
        });

        // Statistiques des transferts
        const transfersStats = {
            total: {
                count: transfers.length,
                volume: transfers.reduce((sum, t) => sum + t.amount, 0)
            },
            byMonth: {} as Record<string, { count: number; volume: number }>,
            byType: {} as Record<string, { count: number; volume: number }>,
            topDestinations: [] as { fromType: string; toType: string; count: number; volume: number }[]
        };

        // Regrouper par mois
        transfers.forEach(transfer => {
            const monthKey = `${transfer.transferDate.getFullYear()}-${(transfer.transferDate.getMonth() + 1).toString().padStart(2, '0')}`;

            if (!transfersStats.byMonth[monthKey]) {
                transfersStats.byMonth[monthKey] = {
                    count: 0,
                    volume: 0
                };
            }

            transfersStats.byMonth[monthKey].count++;
            transfersStats.byMonth[monthKey].volume += transfer.amount;

            // Regrouper par type de transfert (source vers destination)
            const typeKey = `${transfer.fromType}-${transfer.toType}`;

            if (!transfersStats.byType[typeKey]) {
                transfersStats.byType[typeKey] = {
                    count: 0,
                    volume: 0
                };
            }

            transfersStats.byType[typeKey].count++;
            transfersStats.byType[typeKey].volume += transfer.amount;
        });

        // Calculer les destinations de transfert les plus populaires
        transfersStats.topDestinations = Object.entries(transfersStats.byType)
            .map(([key, stats]) => {
                const [fromType, toType] = key.split('-');
                return {
                    fromType,
                    toType,
                    count: stats.count,
                    volume: stats.volume
                };
            })
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 5);

        // Statistiques des reports
        const carryOverStats = {
            total: {
                count: carryOvers.length,
                volume: carryOvers.reduce((sum, c) => sum + c.amount, 0)
            },
            fromPreviousYear: {
                count: carryOvers.filter(c => c.fromYear === year - 1 && c.toYear === year).length,
                volume: carryOvers
                    .filter(c => c.fromYear === year - 1 && c.toYear === year)
                    .reduce((sum, c) => sum + c.amount, 0)
            },
            toNextYear: {
                count: carryOvers.filter(c => c.fromYear === year && c.toYear === year + 1).length,
                volume: carryOvers
                    .filter(c => c.fromYear === year && c.toYear === year + 1)
                    .reduce((sum, c) => sum + c.amount, 0)
            },
            byType: {} as Record<string, { count: number; volume: number }>
        };

        // Regrouper par type de congé
        carryOvers.forEach(carryOver => {
            if (!carryOverStats.byType[carryOver.leaveType]) {
                carryOverStats.byType[carryOver.leaveType] = {
                    count: 0,
                    volume: 0
                };
            }

            carryOverStats.byType[carryOver.leaveType].count++;
            carryOverStats.byType[carryOver.leaveType].volume += carryOver.amount;
        });

        // Formater les données des utilisateurs les plus actifs
        const topUsers = userStats.map(user => ({
            id: user.id,
            name: `${user.prenom} ${user.nom}`,
            department: user.department?.name || 'Non assigné',
            totalLeaves: user.Leaves.length,
            totalLeaveDays: user.Leaves.reduce((total, leave) => {
                const days = Math.ceil((leave.endDate.getTime() - leave.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                return total + days;
            }, 0),
            remainingBalance: user.LeaveBalance.reduce((total, bal) => total + bal.remaining, 0),
            transferCount: user.QuotaTransfers.length
        }));

        // Retourner les données complètes
        return NextResponse.json({
            utilizationStats,
            transfersStats,
            carryOverStats,
            topUsers
        });
    } catch (error: unknown) {
        logger.error('Erreur lors de la récupération des données du dashboard:', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des données' },
            { status: 500 }
        );
    }
} 