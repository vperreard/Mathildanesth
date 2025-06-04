import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { QuotaTransferReportOptions, QuotaTransferReportResult } from '@/modules/leaves/types/quota';
import { formatDate } from '@/utils/dateUtils';
import { format, parse, parseISO, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';


/**
 * POST /api/conges/quotas/transfers/report
 * Génère un rapport détaillé sur les transferts de quotas
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // Vérifier les autorisations pour voir les rapports avancés
        const isAdmin = ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(session.user.role);
        const isManager = session.user.role === 'MANAGER';

        if (!isAdmin && !isManager) {
            return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
        }

        // Récupérer les options de rapport
        const options: QuotaTransferReportOptions = await req.json();

        // Construire la requête
        const whereClause: any = {};

        // Filtres de date
        if (options.startDate && options.endDate) {
            whereClause.transferDate = {
                gte: new Date(options.startDate),
                lte: new Date(options.endDate)
            };
        } else if (options.startDate) {
            whereClause.transferDate = {
                gte: new Date(options.startDate)
            };
        } else if (options.endDate) {
            whereClause.transferDate = {
                lte: new Date(options.endDate)
            };
        }

        // Filtres de type de congé
        if (options.leaveTypes && options.leaveTypes.length > 0) {
            whereClause.OR = [
                { fromType: { in: options.leaveTypes } },
                { toType: { in: options.leaveTypes } }
            ];
        }

        // Filtres de département
        if (options.departments && options.departments.length > 0) {
            whereClause.user = {
                departmentId: { in: options.departments }
            };
        }

        // Filtres de statut
        if (options.status && options.status.length > 0) {
            whereClause.status = { in: options.status };
        }

        // Si c'est un manager (non admin), limiter aux utilisateurs de son département
        if (isManager && !isAdmin) {
            const manager = await prisma.user.findUnique({
                where: { id: parseInt(session.user.id) },
                select: { departmentId: true }
            });

            if (manager && manager.departmentId) {
                whereClause.user = {
                    ...whereClause.user,
                    departmentId: manager.departmentId
                };
            }
        }

        // Récupérer les transferts
        const transfers = await prisma.quotaTransfer.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true,
                        email: true,
                        departmentId: true,
                        department: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                approvedBy: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true
                    }
                }
            },
            orderBy: {
                transferDate: 'desc'
            }
        });

        // Formater les données pour la réponse
        const formattedData = transfers.map(transfer => ({
            id: transfer.id,
            userId: transfer.userId.toString(),
            userName: `${transfer.user.prenom} ${transfer.user.nom}`,
            departmentId: transfer.user.departmentId,
            departmentName: transfer.user.department?.name,
            fromType: transfer.fromType,
            toType: transfer.toType,
            amount: transfer.amount,
            convertedAmount: transfer.convertedAmount,
            transferDate: formatDate(transfer.transferDate),
            status: transfer.status,
            approvalDate: transfer.approvalDate ? formatDate(transfer.approvalDate) : undefined,
            approvedById: transfer.approvedById?.toString(),
            approvedByName: transfer.approvedBy ? `${transfer.approvedBy.prenom} ${transfer.approvedBy.nom}` : undefined,
            reason: transfer.reason || undefined
        }));

        // Calculer les statistiques
        const totalTransfers = transfers.length;
        const totalDays = transfers.reduce((total, t) => total + t.amount, 0);

        // Statistiques par type de congé
        const leaveTypeStats: { [key: string]: { count: number; days: number } } = {};

        transfers.forEach(transfer => {
            // Statistiques pour le type source
            if (!leaveTypeStats[transfer.fromType]) {
                leaveTypeStats[transfer.fromType] = { count: 0, days: 0 };
            }
            leaveTypeStats[transfer.fromType].count++;
            leaveTypeStats[transfer.fromType].days += transfer.amount;

            // Statistiques pour le type destination
            if (!leaveTypeStats[transfer.toType]) {
                leaveTypeStats[transfer.toType] = { count: 0, days: 0 };
            }
            leaveTypeStats[transfer.toType].count++;
        });

        const byLeaveType = Object.entries(leaveTypeStats).map(([leaveType, stats]) => ({
            leaveType: leaveType as any,
            count: stats.count,
            days: stats.days
        }));

        // Statistiques par département
        const departmentStats: { [key: string]: { departmentName: string; count: number; days: number } } = {};

        transfers.forEach(transfer => {
            const deptId = transfer.user.departmentId;
            if (deptId) {
                if (!departmentStats[deptId]) {
                    departmentStats[deptId] = {
                        departmentName: transfer.user.department?.name || 'Inconnu',
                        count: 0,
                        days: 0
                    };
                }
                departmentStats[deptId].count++;
                departmentStats[deptId].days += transfer.amount;
            }
        });

        const byDepartment = Object.entries(departmentStats).map(([deptId, stats]) => ({
            departmentId: deptId,
            departmentName: stats.departmentName,
            count: stats.count,
            days: stats.days
        }));

        // Statistiques par mois
        const monthStats: { [key: string]: { count: number; days: number } } = {};

        transfers.forEach(transfer => {
            const monthKey = format(transfer.transferDate, 'yyyy-MM');
            if (!monthStats[monthKey]) {
                monthStats[monthKey] = { count: 0, days: 0 };
            }
            monthStats[monthKey].count++;
            monthStats[monthKey].days += transfer.amount;
        });

        const byMonth = Object.entries(monthStats).map(([monthKey, stats]) => {
            const [year, month] = monthKey.split('-');
            const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);

            return {
                month: format(monthDate, 'MMMM yyyy', { locale: fr }),
                count: stats.count,
                days: stats.days
            };
        }).sort((a, b) => {
            const dateA = parse(a.month, 'MMMM yyyy', new Date(), { locale: fr });
            const dateB = parse(b.month, 'MMMM yyyy', new Date(), { locale: fr });
            return dateA.getTime() - dateB.getTime();
        });

        // Statistiques par statut
        const statusStats: { [key: string]: { count: number; days: number } } = {};

        transfers.forEach(transfer => {
            if (!statusStats[transfer.status]) {
                statusStats[transfer.status] = { count: 0, days: 0 };
            }
            statusStats[transfer.status].count++;
            statusStats[transfer.status].days += transfer.amount;
        });

        const byStatus = Object.entries(statusStats).map(([status, stats]) => ({
            status,
            count: stats.count,
            days: stats.days
        }));

        // Résultat final
        const result: QuotaTransferReportResult = {
            data: formattedData,
            summary: {
                totalTransfers,
                totalDays,
                byLeaveType,
                byDepartment,
                byMonth,
                byStatus
            }
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('Erreur lors de la génération du rapport de transferts :', error);
        return NextResponse.json(
            { error: 'Erreur lors de la génération du rapport de transferts' },
            { status: 500 }
        );
    }
} 