import { PlannedAbsence, AbsenceCreateInput, AbsenceUpdateInput } from '@/types/absence';
import { prisma } from '@/lib/prisma';
import { LeaveStatus } from '@prisma/client';
import { notificationService } from './notificationService';

export const absenceService = {
    async getAllAbsences(): Promise<PlannedAbsence[]> {
        const response = await fetch('http://localhost:3000/api/absences');
        if (!response.ok) {
            throw new Error('Failed to fetch absences');
        }
        return response.json();
    },

    async getAbsenceById(id: number): Promise<PlannedAbsence> {
        const response = await fetch(`http://localhost:3000/api/absences/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch absence');
        }
        return response.json();
    },

    async createAbsence(data: AbsenceCreateInput): Promise<PlannedAbsence> {
        const response = await fetch('http://localhost:3000/api/absences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...data,
                impactPlanning: data.impactPlanning ?? true,
                priority: data.priority ?? 5,
                notify: data.notify ?? false,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to create absence');
        }
        return response.json();
    },

    async updateAbsence(id: number, data: AbsenceUpdateInput): Promise<PlannedAbsence> {
        const response = await fetch(`http://localhost:3000/api/absences/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to update absence');
        }
        return response.json();
    },

    async deleteAbsence(id: number): Promise<void> {
        const response = await fetch(`http://localhost:3000/api/absences/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete absence');
        }
    },

    async checkOverlap(userId: number, startDate: Date, endDate: Date): Promise<boolean> {
        const response = await fetch('http://localhost:3000/api/absences/check-overlap', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, startDate, endDate }),
        });
        if (!response.ok) {
            throw new Error('Failed to check overlap');
        }
        return response.json();
    },

    // Nouvelles fonctions manquantes pour les tests
    async getAbsencePatterns(userId: number, year: number): Promise<{
        frequentDays: string[];
        suspiciousPattern: boolean;
        bridgeDays: number;
    }> {
        try {
            // Récupération des absences par jour de la semaine
            const dayOfWeekAbsences = await prisma.$queryRaw<{
                date: Date;
                dayOfWeek: number;
            }[]>`
                SELECT date, EXTRACT(DOW FROM date) as "dayOfWeek"
                FROM "Absence"
                WHERE "userId" = ${userId}
                AND EXTRACT(YEAR FROM date) = ${year}
            `;

            // Comptage par jour de la semaine
            const dayCount: { [key: number]: number } = {};
            dayOfWeekAbsences.forEach(absence => {
                const day = absence.dayOfWeek;
                dayCount[day] = (dayCount[day] || 0) + 1;
            });

            // Détection des jours fréquents (>= 3 absences)
            const frequentDays: string[] = [];
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            Object.entries(dayCount).forEach(([day, count]) => {
                if (count >= 3) {
                    frequentDays.push(dayNames[parseInt(day)]);
                }
            });

            // Pattern suspect si >= 2 jours fréquents ou >5 absences lundi/vendredi
            const suspiciousPattern = frequentDays.length >= 2 || 
                (dayCount[1] >= 3 && dayCount[5] >= 3); // Lundi et Vendredi

            // Calcul des jours pont
            const absences = await prisma.absence.findMany({
                where: {
                    userId,
                    date: {
                        gte: new Date(`${year}-01-01`),
                        lt: new Date(`${year + 1}-01-01`),
                    },
                },
                select: { date: true },
            });

            const holidays = await prisma.publicHoliday.findMany({
                where: {
                    date: {
                        gte: new Date(`${year}-01-01`),
                        lt: new Date(`${year + 1}-01-01`),
                    },
                },
                select: { date: true },
            });

            // Détection des jours pont (absence adjacente à un jour férié)
            let bridgeDays = 0;
            absences.forEach(absence => {
                const absenceDate = new Date(absence.date);
                holidays.forEach(holiday => {
                    const holidayDate = new Date(holiday.date);
                    const dayDiff = Math.abs((absenceDate.getTime() - holidayDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (dayDiff === 1) { // Jour adjacent
                        bridgeDays++;
                    }
                });
            });

            return {
                frequentDays,
                suspiciousPattern,
                bridgeDays,
            };
        } catch (error) {
            console.error('Error getting absence patterns:', error);
            throw new Error('Failed to get absence patterns');
        }
    },

    async getAbsenceStatistics(year: number, siteId?: number, departmentId?: number): Promise<{
        totalAbsences: number;
        byType: Array<{ type: string; count: number }>;
        byMonth: Array<{ month: number; count: number }>;
        averagePerMonth: number;
        averagePerUser?: number;
        topAbsentUsers?: Array<{ userId: number; count: number }>;
    }> {
        try {
            const whereClause: any = {
                date: {
                    gte: new Date(`${year}-01-01`),
                    lt: new Date(`${year + 1}-01-01`),
                },
            };

            if (siteId) {
                whereClause.user = { sites: { some: { id: siteId } } };
            }
            if (departmentId) {
                whereClause.user = { departmentId };
            }

            // Total des absences
            const totalAbsences = await prisma.absence.count({ where: whereClause });

            // Par type
            const byType = await prisma.absence.groupBy({
                by: ['type'],
                where: whereClause,
                _count: { _all: true },
            });

            // Par mois
            const byMonth = await prisma.$queryRaw<Array<{ month: number; count: number }>>`
                SELECT EXTRACT(MONTH FROM date) as month, COUNT(*)::int as count
                FROM "Absence"
                WHERE date >= ${new Date(`${year}-01-01`)}
                AND date < ${new Date(`${year + 1}-01-01`)}
                GROUP BY EXTRACT(MONTH FROM date)
                ORDER BY month
            `;

            const averagePerMonth = totalAbsences / 12;

            let averagePerUser;
            let topAbsentUsers;

            if (departmentId) {
                const userCount = await prisma.user.count({ where: { departmentId } });
                averagePerUser = totalAbsences / userCount;

                topAbsentUsers = await prisma.absence.groupBy({
                    by: ['userId'],
                    where: whereClause,
                    _count: { _all: true },
                    orderBy: { _count: { _all: 'desc' } },
                    take: 5,
                });
            }

            return {
                totalAbsences,
                byType: byType.map(item => ({ type: item.type, count: item._count._all })),
                byMonth,
                averagePerMonth,
                averagePerUser,
                topAbsentUsers: topAbsentUsers?.map(item => ({ userId: item.userId, count: item._count._all })),
            };
        } catch (error) {
            console.error('Error getting absence statistics:', error);
            throw new Error('Failed to get absence statistics');
        }
    },

    async handleLateNotification(absenceData: {
        userId: number;
        date: Date;
        reason: string;
        notifiedAt: Date;
    }): Promise<void> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: absenceData.userId },
                include: { sites: true },
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Trouver les managers du site
            const managers = await prisma.user.findMany({
                where: {
                    role: 'ADMIN_TOTAL',
                    sites: {
                        some: {
                            id: { in: user.sites.map(site => site.id) },
                        },
                    },
                },
                select: { id: true, email: true },
            });

            // Créer les notifications en base de données
            const notifications = await Promise.all(managers.map(manager => 
                prisma.notification.create({
                    data: {
                        userId: manager.id,
                        type: 'ABSENCE_LATE',
                        title: 'Absence tardive signalée',
                        message: `${user.prenom} ${user.nom} a signalé une absence le jour même pour: ${absenceData.reason}`,
                        data: JSON.stringify({
                            absenceDate: absenceData.date,
                            absentUserId: absenceData.userId,
                            reason: absenceData.reason,
                        }),
                        isRead: false,
                    },
                })
            ));

            // Envoyer les notifications via WebSocket
            notifications.forEach(notification => {
                notificationService.sendNotification({
                    type: 'warning',
                    title: notification.title,
                    message: notification.message,
                    data: {
                        component: 'absence',
                        action: 'late_notification',
                        timestamp: notification.createdAt.toISOString(),
                        metadata: {
                            absenceDate: absenceData.date,
                            absentUserId: absenceData.userId,
                            reason: absenceData.reason,
                        },
                    },
                });
            });
        } catch (error) {
            console.error('Error handling late notification:', error);
            throw new Error('Failed to handle late notification');
        }
    },

    async findReplacement(assignmentData: {
        date: Date;
        period: string;
        operatingRoomId: number;
        requiredSkills?: string[];
    }): Promise<{
        available: Array<{ id: number; nom: string; prenom: string; score: number }>;
        unavailable: Array<{ id: number; reason: string }>;
    }> {
        try {
            // Trouver tous les utilisateurs avec les compétences requises
            const allUsers = await prisma.user.findMany({
                where: {
                    isActive: true,
                    ...(assignmentData.requiredSkills ? {
                        skills: {
                            some: {
                                skill: {
                                    code: { in: assignmentData.requiredSkills },
                                },
                            },
                        },
                    } : {}),
                },
                select: { id: true, nom: true, prenom: true },
            });

            // Vérifier la disponibilité
            const busyUsers = await prisma.attribution.findMany({
                where: {
                    date: assignmentData.date,
                    period: assignmentData.period,
                },
                select: { userId: true },
            });

            const usersOnLeave = await prisma.leave.findMany({
                where: {
                    startDate: { lte: assignmentData.date },
                    endDate: { gte: assignmentData.date },
                    status: LeaveStatus.APPROVED,
                },
                select: { userId: true },
            });

            const busyUserIds = new Set(busyUsers.map(u => u.userId));
            const leaveUserIds = new Set(usersOnLeave.map(u => u.userId));

            // Calculer la charge de travail pour le scoring
            const workloadData = await prisma.attribution.groupBy({
                by: ['userId'],
                where: {
                    date: {
                        gte: new Date(assignmentData.date.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 jours avant
                        lte: assignmentData.date,
                    },
                },
                _count: { _all: true },
            });

            const workloadMap = new Map();
            workloadData.forEach(item => {
                workloadMap.set(item.userId, item._count._all);
            });

            const available: Array<{ id: number; nom: string; prenom: string; score: number }> = [];
            const unavailable: Array<{ id: number; reason: string }> = [];

            allUsers.forEach(user => {
                if (busyUserIds.has(user.id)) {
                    unavailable.push({ id: user.id, reason: 'Already assigned' });
                } else if (leaveUserIds.has(user.id)) {
                    unavailable.push({ id: user.id, reason: 'On leave' });
                } else {
                    // Calcul du score (plus c'est bas, mieux c'est)
                    const workload = workloadMap.get(user.id) || 0;
                    const score = 100 - workload * 5; // Score plus élevé = moins de charge
                    
                    available.push({
                        id: user.id,
                        nom: user.nom,
                        prenom: user.prenom,
                        score,
                    });
                }
            });

            // Trier par score décroissant
            available.sort((a, b) => b.score - a.score);

            return { available, unavailable };
        } catch (error) {
            console.error('Error finding replacement:', error);
            throw new Error('Failed to find replacement');
        }
    },

    async convertToLeave(absenceId: number, leaveTypeCode: string): Promise<{
        absence: any;
        leave: any;
    }> {
        try {
            const absence = await prisma.absence.findUnique({
                where: { id: absenceId },
            });

            if (!absence) {
                throw new Error('Absence not found');
            }

            // Créer le congé
            const leave = await prisma.leave.create({
                data: {
                    userId: absence.userId,
                    leaveTypeCode,
                    startDate: absence.date,
                    endDate: absence.date,
                    status: LeaveStatus.APPROVED,
                    reason: absence.reason,
                    countedDays: 1,
                },
            });

            // Marquer l'absence comme convertie
            const updatedAbsence = await prisma.absence.update({
                where: { id: absenceId },
                data: { convertedToLeave: true },
            });

            // Mettre à jour le solde de congés
            await prisma.leaveBalance.updateMany({
                where: {
                    userId: absence.userId,
                    leaveTypeCode,
                },
                data: {
                    usedDays: { increment: 1 },
                },
            });

            return {
                absence: updatedAbsence,
                leave,
            };
        } catch (error) {
            console.error('Error converting to leave:', error);
            throw new Error('Failed to convert absence to leave');
        }
    },
};