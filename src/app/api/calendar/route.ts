import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { CalendarEventType, CalendarEvent } from '@/modules/calendrier/types/event';
import { formatISO } from 'date-fns';

// Helper function to parse and convert IDs to numbers
const parseIds = (ids: string | string[] | undefined): number[] | number | undefined => {
    if (!ids) return undefined;
    if (Array.isArray(ids)) {
        return ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    }
    const parsedId = parseInt(ids, 10);
    return isNaN(parsedId) ? undefined : parsedId;
};

// Helper function to validate dates
const validateAndParseDates = (startDateParam?: string, endDateParam?: string) => {
    try {
        // Normaliser les dates
        const start = startDateParam ? new Date(startDateParam) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDateParam ? new Date(endDateParam) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

        // Vérifier que les dates sont valides
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('Dates invalides');
        }

        return { start, end, isValid: true };
    } catch (error) {
        return {
            start: new Date(),
            end: new Date(),
            isValid: false,
            error: error instanceof Error ? error.message : 'Format de date incorrect'
        };
    }
};

export async function GET(request: NextRequest) {
    // Vérifier d'abord la connexion à la base de données
    try {
        await prisma.$queryRaw`SELECT 1`;
    } catch (dbConnectionError) {
        logger.error('Erreur de connexion à la base de données:', dbConnectionError);
        return NextResponse.json({
            error: 'Erreur de connexion à la base de données',
            details: process.env.NODE_ENV === 'development' ?
                (dbConnectionError instanceof Error ? dbConnectionError.message : String(dbConnectionError)) : undefined
        }, { status: 500 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const userIds = searchParams.getAll('userIds');
        const userRoles = searchParams.getAll('userRoles');
        const eventTypes = searchParams.getAll('eventTypes');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const leaveTypes = searchParams.getAll('leaveTypes');
        const leaveStatuses = searchParams.getAll('leaveStatuses');
        const locationIds = searchParams.getAll('locationIds');
        const teamIds = searchParams.getAll('teamIds');
        const specialtyIds = searchParams.getAll('specialtyIds');
        const searchTerm = searchParams.get('searchTerm');

        // Valider les dates
        const { start, end, isValid, error: dateError } = validateAndParseDates(
            startDate || undefined,
            endDate || undefined
        );

        if (!isValid) {
            return NextResponse.json({ error: dateError }, { status: 400 });
        }

        // Valider les types d'événements
        let requestedEventTypes: CalendarEventType[] = [];
        try {
            if (eventTypes.length > 0) {
                // Vérifier chaque type dans le tableau
                const validTypes = eventTypes.filter(type =>
                    Object.values(CalendarEventType).includes(type as CalendarEventType)
                );
                if (validTypes.length === 0) {
                    return NextResponse.json({ error: 'Aucun type d\'événement valide spécifié' }, { status: 400 });
                }
                requestedEventTypes = validTypes as CalendarEventType[];
            } else {
                // Par défaut, récupérer tous les types
                requestedEventTypes = Object.values(CalendarEventType);
            }
        } catch (typeError) {
            logger.error('Erreur lors de la validation des types d\'événements:', typeError);
            return NextResponse.json({ error: 'Format de type d\'événement incorrect' }, { status: 400 });
        }

        const events: any[] = [];

        // --- Préparer les conditions de filtre pour les IDs ---
        try {
            const parsedUserIds = parseIds(userIds.length > 0 ? userIds : undefined);
            const userIdFilterCondition = parsedUserIds !== undefined ?
                (Array.isArray(parsedUserIds) ? { in: parsedUserIds } : parsedUserIds)
                : undefined;

            const parsedLocationIds = parseIds(locationIds.length > 0 ? locationIds : undefined);
            const locationIdFilterCondition = parsedLocationIds !== undefined ?
                (Array.isArray(parsedLocationIds) ? { in: parsedLocationIds } : parsedLocationIds)
                : undefined;

            const parsedSpecialtyIds = parseIds(specialtyIds.length > 0 ? specialtyIds : undefined);
            const specialtyIdFilterCondition = parsedSpecialtyIds !== undefined ?
                (Array.isArray(parsedSpecialtyIds) ? { in: parsedSpecialtyIds } : parsedSpecialtyIds)
                : undefined;

            // 1. Récupérer les congés
            if (requestedEventTypes.includes(CalendarEventType.LEAVE)) {
                try {
                    const leaveFilter: any = {
                        AND: [
                            { startDate: { lte: end } },
                            { endDate: { gte: start } }
                        ],
                    };

                    if (userIdFilterCondition !== undefined) {
                        leaveFilter.userId = userIdFilterCondition;
                    }

                    // Filtres de types de congés
                    if (leaveTypes.length > 0) {
                        leaveFilter.type = leaveTypes.length === 1 ? leaveTypes[0] : { in: leaveTypes };
                    }

                    // Filtres de statuts de congés
                    if (leaveStatuses.length > 0) {
                        leaveFilter.status = leaveStatuses.length === 1 ? leaveStatuses[0] : { in: leaveStatuses };
                    }

                    const leaves = await prisma.leave.findMany({
                        where: leaveFilter,
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    prenom: true,
                                    nom: true,
                                    email: true,
                                    role: true
                                }
                            }
                        },
                        orderBy: {
                            startDate: 'asc'
                        }
                    });

                    // Convertir les congés en événements de calendrier
                    const leaveEvents = leaves.map(leave => ({
                        id: `leave-${leave.id}`,
                        title: `${leave.user.prenom} ${leave.user.nom} - Congé (${leave.type})`,
                        start: formatISO(leave.startDate),
                        end: formatISO(leave.endDate),
                        allDay: true,
                        userId: leave.userId,
                        user: leave.user,
                        type: CalendarEventType.LEAVE,
                        leaveId: leave.id,
                        leaveType: leave.type,
                        status: leave.status,
                        countedDays: leave.countedDays,
                        description: leave.reason || ''
                    }));

                    events.push(...leaveEvents);
                } catch (leavesError) {
                    logger.error('Erreur lors de la récupération des congés:', leavesError);
                    // Continuer sans ajouter d'événements de congés
                }
            }

            // 2. Récupérer les gardes
            if (requestedEventTypes.includes(CalendarEventType.DUTY)) {
                try {
                    const dutyFilter: any = {
                        AND: [
                            { startDate: { lte: end } },
                            { endDate: { gte: start } }
                        ],
                    };

                    if (userIdFilterCondition !== undefined) {
                        dutyFilter.userId = userIdFilterCondition;
                    }

                    const duties = await prisma.duty.findMany({
                        where: dutyFilter,
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    prenom: true,
                                    nom: true,
                                    email: true,
                                    role: true
                                }
                            }
                        },
                        orderBy: {
                            startDate: 'asc'
                        }
                    });

                    // Convertir les gardes en événements de calendrier
                    const dutyEvents = duties.map(duty => ({
                        id: `duty-${duty.id}`,
                        title: `${duty.user.prenom} ${duty.user.nom} - Garde`,
                        start: formatISO(duty.startDate),
                        end: formatISO(duty.endDate),
                        allDay: false,
                        userId: duty.userId,
                        user: duty.user,
                        type: CalendarEventType.DUTY,
                        dutyId: duty.id,
                        description: duty.description || ''
                    }));

                    events.push(...dutyEvents);
                } catch (dutiesError) {
                    logger.error('Erreur lors de la récupération des gardes:', dutiesError);
                    // Continuer sans ajouter d'événements de gardes
                }
            }

            // 3. Récupérer les affectations
            if (requestedEventTypes.includes(CalendarEventType.ASSIGNMENT)) {
                try {
                    const assignmentFilter: any = {
                        AND: [
                            { startDate: { lte: end } },
                            { endDate: { gte: start } }
                        ],
                    };

                    if (userIdFilterCondition !== undefined) {
                        assignmentFilter.userId = userIdFilterCondition;
                    }

                    const attributions = await prisma.attribution.findMany({
                        where: assignmentFilter,
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    prenom: true,
                                    nom: true,
                                    email: true,
                                    role: true
                                }
                            },
                            operatingRoom: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        },
                        orderBy: {
                            startDate: 'asc'
                        }
                    });

                    // Convertir les affectations en événements de calendrier
                    const assignmentEvents = attributions.map(attribution => ({
                        id: `attribution-${attribution.id}`,
                        title: `${attribution.user.prenom} ${attribution.user.nom} - ${attribution.operatingRoom?.name || 'Affectation'}`,
                        start: formatISO(attribution.startDate),
                        end: formatISO(attribution.endDate),
                        allDay: false,
                        userId: attribution.userId,
                        user: attribution.user,
                        type: CalendarEventType.ASSIGNMENT,
                        assignmentId: attribution.id,
                        operatingRoom: attribution.operatingRoom,
                        description: attribution.notes || ''
                    }));

                    events.push(...assignmentEvents);
                } catch (assignmentsError) {
                    logger.error('Erreur lors de la récupération des affectations:', assignmentsError);
                    // Continuer sans ajouter d'événements d'affectations
                }
            }

            // Filtrer par terme de recherche si spécifié
            let filteredEvents = events;
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                filteredEvents = events.filter(event =>
                    event.title.toLowerCase().includes(searchLower) ||
                    event.description.toLowerCase().includes(searchLower) ||
                    (event.user && `${event.user.prenom} ${event.user.nom}`.toLowerCase().includes(searchLower))
                );
            }

            return NextResponse.json(filteredEvents);

        } catch (filterError) {
            logger.error('Erreur lors du filtrage des événements:', filterError);
            return NextResponse.json({
                error: 'Erreur lors du filtrage des événements',
                details: process.env.NODE_ENV === 'development' ?
                    (filterError instanceof Error ? filterError.message : String(filterError)) : undefined
            }, { status: 500 });
        }

    } catch (error) {
        logger.error('Erreur lors de la récupération des événements du calendrier:', error);
        return NextResponse.json({
            error: 'Erreur lors de la récupération des événements du calendrier',
            details: process.env.NODE_ENV === 'development' ?
                (error instanceof Error ? error.message : String(error)) : undefined
        }, { status: 500 });
    }
} 