import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import { startOfWeek, endOfWeek, addDays, format } from 'date-fns';
import { logger } from '@/lib/logger';
import { withUserRateLimit } from '@/lib/rateLimit';

// Types pour le planning médical
type ShiftType = 'GARDE_24H' | 'ASTREINTE' | 'VACATION' | 'BLOC' | 'CONSULTATION' | 'REPOS' | 'CONGE';
type ShiftStatus = 'CONFIRME' | 'EN_ATTENTE' | 'URGENT' | 'REMPLACE';

interface MedicalShift {
    id: string;
    type: ShiftType;
    date: string;
    startTime: string;
    endTime: string;
    location?: string;
    room?: string;
    supervisor?: string;
    status: ShiftStatus;
    replacementNeeded: boolean;
}

/**
 * GET /api/mon-planning/semaine
 * Récupère le planning personnel de la semaine courante
 * Optimisé pour un chargement rapide (<1s)
 */
async function handler(req: NextRequest) {
    const startTime = Date.now();

    try {
        // Vérifier l'authentification
        const authResult = await verifyAuthToken();
        
        if (!authResult.authenticated || !authResult.userId) {
            logger.warn('Tentative d\'accès non autorisé au planning personnel');
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const userId = authResult.userId;

        // Récupérer les paramètres de la requête
        const { searchParams } = new URL(req.url);
        const weekOffset = parseInt(searchParams.get('weekOffset') || '0');
        
        // Calculer les dates de début et fin de semaine
        const today = new Date();
        const targetWeek = addDays(today, weekOffset * 7);
        const weekStart = startOfWeek(targetWeek, { weekStartsOn: 1 }); // Lundi
        const weekEnd = endOfWeek(targetWeek, { weekStartsOn: 1 }); // Dimanche

        logger.info(`Chargement planning semaine pour utilisateur ${userId}`, {
            weekStart: weekStart.toISOString(),
            weekEnd: weekEnd.toISOString()
        });

        // Requête optimisée avec sélection des champs nécessaires uniquement
        const [attributions, leaves, blocPlannings] = await Promise.all([
            // Récupérer les gardes/vacations de la semaine
            prisma.attribution.findMany({
                where: {
                    userId: userId,
                    date: {
                        gte: weekStart,
                        lte: weekEnd
                    }
                },
                select: {
                    id: true,
                    date: true,
                    shiftType: true,
                    status: true,
                    period: true,
                    replacementUserId: true,
                    replacementUser: {
                        select: {
                            prenom: true,
                            nom: true
                        }
                    }
                },
                orderBy: {
                    date: 'asc'
                }
            }),

            // Récupérer les congés de la semaine
            prisma.leave.findMany({
                where: {
                    userId: userId,
                    status: 'APPROVED',
                    startDate: { lte: weekEnd },
                    endDate: { gte: weekStart }
                },
                select: {
                    id: true,
                    startDate: true,
                    endDate: true,
                    type: true,
                    halfDayStart: true,
                    halfDayEnd: true
                }
            }),

            // Récupérer les plannings bloc opératoire
            prisma.blocPlanningAssignment.findMany({
                where: {
                    userId: userId,
                    blocDayPlanning: {
                        date: {
                            gte: weekStart,
                            lte: weekEnd
                        }
                    }
                },
                select: {
                    id: true,
                    period: true,
                    blocDayPlanning: {
                        select: {
                            date: true,
                            siteId: true
                        }
                    },
                    room: {
                        select: {
                            name: true,
                            number: true,
                            operatingSector: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    },
                    role: true,
                    supervisedRooms: {
                        select: {
                            name: true,
                            number: true
                        }
                    }
                },
                orderBy: {
                    blocDayPlanning: {
                        date: 'asc'
                    }
                }
            })
        ]);

        // Transformer les données en format médical intuitif
        const shifts: MedicalShift[] = [];

        // Traiter les gardes/vacations standards
        attributions.forEach(attribution => {
            const shift: MedicalShift = {
                id: `attribution-${attribution.id}`,
                type: mapShiftType(attribution.shiftType),
                date: format(attribution.date, 'yyyy-MM-dd'),
                startTime: getShiftTimes(attribution.shiftType, attribution.period).start,
                endTime: getShiftTimes(attribution.shiftType, attribution.period).end,
                status: mapStatus(attribution.status),
                replacementNeeded: attribution.status === 'PENDING_REPLACEMENT',
                supervisor: attribution.replacementUser 
                    ? `${attribution.replacementUser.prenom} ${attribution.replacementUser.nom}`
                    : undefined
            };
            shifts.push(shift);
        });

        // Traiter les congés
        leaves.forEach(leave => {
            let currentDate = new Date(leave.startDate);
            while (currentDate <= leave.endDate && currentDate <= weekEnd) {
                if (currentDate >= weekStart) {
                    const shift: MedicalShift = {
                        id: `leave-${leave.id}-${currentDate.toISOString()}`,
                        type: 'CONGE',
                        date: format(currentDate, 'yyyy-MM-dd'),
                        startTime: leave.halfDayStart && currentDate.getTime() === leave.startDate.getTime() ? '14:00' : '08:00',
                        endTime: leave.halfDayEnd && currentDate.getTime() === leave.endDate.getTime() ? '12:00' : '18:00',
                        status: 'CONFIRME',
                        replacementNeeded: false
                    };
                    shifts.push(shift);
                }
                currentDate = addDays(currentDate, 1);
            }
        });

        // Traiter les plannings bloc opératoire
        blocPlannings.forEach(planning => {
            const shift: MedicalShift = {
                id: `bloc-${planning.id}`,
                type: 'BLOC',
                date: format(planning.blocDayPlanning.date, 'yyyy-MM-dd'),
                startTime: planning.period === 'MORNING' ? '08:00' : '14:00',
                endTime: planning.period === 'MORNING' ? '14:00' : '19:00',
                location: planning.room?.operatingSector?.name,
                room: planning.room ? `${planning.room.name} (${planning.room.number})` : undefined,
                status: 'CONFIRME',
                replacementNeeded: false,
                supervisor: planning.role === 'SUPERVISOR' && planning.supervisedRooms.length > 0
                    ? `Supervision: ${planning.supervisedRooms.map(r => r.number).join(', ')}`
                    : undefined
            };
            shifts.push(shift);
        });

        // Trier les shifts par date et heure
        shifts.sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.startTime.localeCompare(b.startTime);
        });

        // Calculer les statistiques de la semaine
        const stats = {
            totalShifts: shifts.length,
            gardes24h: shifts.filter(s => s.type === 'GARDE_24H').length,
            astreintes: shifts.filter(s => s.type === 'ASTREINTE').length,
            bloc: shifts.filter(s => s.type === 'BLOC').length,
            conges: shifts.filter(s => s.type === 'CONGE').length,
            urgent: shifts.filter(s => s.status === 'URGENT').length,
            needReplacement: shifts.filter(s => s.replacementNeeded).length
        };

        const responseTime = Date.now() - startTime;
        logger.info(`Planning semaine chargé en ${responseTime}ms`, { userId, shiftsCount: shifts.length });

        return NextResponse.json({
            weekStart: weekStart.toISOString(),
            weekEnd: weekEnd.toISOString(),
            shifts,
            stats,
            responseTime
        });

    } catch (error) {
        logger.error('Erreur lors du chargement du planning semaine', { error });
        return NextResponse.json(
            { error: 'Erreur lors du chargement du planning' },
            { status: 500 }
        );
    }
}

// Fonctions utilitaires pour mapper les données

function mapShiftType(shiftType: string): ShiftType {
    const mapping: Record<string, ShiftType> = {
        'GUARD_24H': 'GARDE_24H',
        'ON_CALL': 'ASTREINTE',
        'SHIFT': 'VACATION',
        'CONSULTATION': 'CONSULTATION',
        'REST': 'REPOS',
        'LEAVE': 'CONGE'
    };
    return mapping[shiftType] || 'VACATION';
}

function mapStatus(status: string): ShiftStatus {
    const mapping: Record<string, ShiftStatus> = {
        'CONFIRMED': 'CONFIRME',
        'PENDING': 'EN_ATTENTE',
        'PENDING_REPLACEMENT': 'URGENT',
        'REPLACED': 'REMPLACE'
    };
    return mapping[status] || 'EN_ATTENTE';
}

function getShiftTimes(shiftType: string, period?: string): { start: string; end: string } {
    if (shiftType === 'GUARD_24H') {
        return { start: '08:00', end: '08:00+1' };
    }
    
    if (period === 'MORNING') {
        return { start: '08:00', end: '14:00' };
    } else if (period === 'AFTERNOON') {
        return { start: '14:00', end: '19:00' };
    } else if (period === 'NIGHT') {
        return { start: '19:00', end: '08:00+1' };
    }
    
    // Par défaut
    return { start: '08:00', end: '18:00' };
}

// Export avec rate limiting
export const GET = withUserRateLimit(handler);