import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '../../../../lib/prisma';
import { verifyAuthToken, getAuthTokenServer } from '../../../../lib/auth-server-utils';
import { startOfWeek, endOfWeek, addDays, format } from 'date-fns';

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
 */
async function handler(req: NextRequest) {
    const startTime = Date.now();

    try {
        // Vérifier l'authentification
        const authToken = await getAuthTokenServer();
        if (!authToken) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }
        
        const authResult = await verifyAuthToken(authToken);
        if (!authResult.authenticated || !authResult.userId) {
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

        // Requête simplifiée - récupérer seulement les assignments et congés pour l'instant
        const [assignments, leaves] = await Promise.all([
            // Récupérer les assignments de la semaine
            prisma.assignment.findMany({
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
                    type: true,
                    statut: true,
                    period: true,
                    heureDebut: true,
                    heureFin: true,
                    Location: {
                        select: {
                            name: true
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
                    isHalfDay: true,
                    halfDayPeriod: true
                }
            })
        ]);

        // Transformer les données en format médical intuitif
        const shifts: MedicalShift[] = [];

        // Traiter les assignments standards
        assignments.forEach(assignment => {
            const shift: MedicalShift = {
                id: `assignment-${assignment.id}`,
                type: mapShiftType(assignment.type),
                date: format(assignment.date, 'yyyy-MM-dd'),
                startTime: assignment.heureDebut || '08:00',
                endTime: assignment.heureFin || '18:00',
                location: assignment.Location?.name,
                status: mapStatus(assignment.statut),
                replacementNeeded: assignment.statut === 'EN_ATTENTE'
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
                        startTime: leave.isHalfDay && leave.halfDayPeriod === 'AFTERNOON' ? '14:00' : '08:00',
                        endTime: leave.isHalfDay && leave.halfDayPeriod === 'MORNING' ? '12:00' : '18:00',
                        status: 'CONFIRME',
                        replacementNeeded: false
                    };
                    shifts.push(shift);
                }
                currentDate = addDays(currentDate, 1);
            }
        });

        // Note: Affectations bloc opératoire temporairement désactivées car le modèle doit être mis à jour

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

        const response = NextResponse.json({
            weekStart: weekStart.toISOString(),
            weekEnd: weekEnd.toISOString(),
            shifts,
            stats,
            responseTime
        });

        // Ajouter des headers de cache pour améliorer les performances
        response.headers.set('Cache-Control', 'private, max-age=300'); // Cache 5 minutes
        response.headers.set('X-Response-Time', responseTime.toString());

        return response;

    } catch (error) {
        logger.error('Erreur lors du chargement du planning semaine', error);
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
        'VACATION': 'VACATION',
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
        'URGENT': 'URGENT',
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

export const GET = handler;