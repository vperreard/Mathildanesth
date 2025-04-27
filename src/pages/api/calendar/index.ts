import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { CalendarEventType, CalendarEvent } from '../../../modules/calendar/types/event';
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Vérifier d'abord la connexion à la base de données
    try {
        await prisma.$queryRaw`SELECT 1`;
    } catch (dbConnectionError) {
        console.error('Erreur de connexion à la base de données:', dbConnectionError);
        return res.status(500).json({
            error: 'Erreur de connexion à la base de données',
            details: process.env.NODE_ENV === 'development' ?
                (dbConnectionError instanceof Error ? dbConnectionError.message : String(dbConnectionError)) : undefined
        });
    }

    try {
        // GET: Récupérer les événements du calendrier avec filtres
        if (req.method === 'GET') {
            const {
                userIds,
                userRoles,
                eventTypes,
                startDate,
                endDate,
                leaveTypes,
                leaveStatuses,
                locationIds,
                teamIds,
                specialtyIds,
                searchTerm
            } = req.query;

            // Valider les dates
            const { start, end, isValid, error: dateError } = validateAndParseDates(
                startDate as string | undefined,
                endDate as string | undefined
            );

            if (!isValid) {
                return res.status(400).json({ error: dateError });
            }

            // Valider les types d'événements
            let requestedEventTypes: CalendarEventType[] = [];
            try {
                if (eventTypes) {
                    if (Array.isArray(eventTypes)) {
                        // Vérifier chaque type dans le tableau
                        const validTypes = eventTypes.filter(type =>
                            Object.values(CalendarEventType).includes(type as CalendarEventType)
                        );
                        if (validTypes.length === 0) {
                            return res.status(400).json({ error: 'Aucun type d\'événement valide spécifié' });
                        }
                        requestedEventTypes = validTypes as CalendarEventType[];
                    } else {
                        // Vérifier un seul type
                        if (!Object.values(CalendarEventType).includes(eventTypes as CalendarEventType)) {
                            return res.status(400).json({ error: 'Type d\'événement non valide' });
                        }
                        requestedEventTypes = [eventTypes as CalendarEventType];
                    }
                } else {
                    // Par défaut, récupérer tous les types
                    requestedEventTypes = Object.values(CalendarEventType);
                }
            } catch (typeError) {
                console.error('Erreur lors de la validation des types d\'événements:', typeError);
                return res.status(400).json({ error: 'Format de type d\'événement incorrect' });
            }

            const events: any[] = [];

            // --- Préparer les conditions de filtre pour les IDs ---
            try {
                const parsedUserIds = parseIds(userIds as string | string[] | undefined);
                const userIdFilterCondition = parsedUserIds !== undefined ?
                    (Array.isArray(parsedUserIds) ? { in: parsedUserIds } : parsedUserIds)
                    : undefined;

                const parsedLocationIds = parseIds(locationIds as string | string[] | undefined);
                const locationIdFilterCondition = parsedLocationIds !== undefined ?
                    (Array.isArray(parsedLocationIds) ? { in: parsedLocationIds } : parsedLocationIds)
                    : undefined;

                const parsedSpecialtyIds = parseIds(specialtyIds as string | string[] | undefined);
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
                        if (leaveTypes && (Array.isArray(leaveTypes) ? leaveTypes.length > 0 : leaveTypes)) {
                            leaveFilter.type = Array.isArray(leaveTypes)
                                ? { in: leaveTypes }
                                : leaveTypes;
                        }

                        // Filtres de statuts de congés
                        if (leaveStatuses && (Array.isArray(leaveStatuses) ? leaveStatuses.length > 0 : leaveStatuses)) {
                            leaveFilter.status = Array.isArray(leaveStatuses)
                                ? { in: leaveStatuses }
                                : leaveStatuses;
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
                        console.error('Erreur lors de la récupération des congés:', leavesError);
                        // Continuer sans ajouter d'événements de congés
                    }
                }

                // 2. Récupérer les gardes
                if (requestedEventTypes.includes(CalendarEventType.DUTY)) {
                    try {
                        const dutyFilter: any = {
                            date: {
                                gte: start,
                                lte: end
                            },
                        };

                        if (userIdFilterCondition !== undefined) {
                            dutyFilter.userId = userIdFilterCondition;
                        }

                        if (locationIdFilterCondition !== undefined) {
                            dutyFilter.locationId = locationIdFilterCondition;
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
                                },
                                location: true
                            },
                            orderBy: {
                                date: 'asc'
                            }
                        });

                        // Convertir les gardes en événements de calendrier
                        const dutyEvents = duties.map(duty => {
                            const startDate = new Date(duty.date);
                            const endDate = new Date(duty.date);
                            endDate.setHours(23, 59, 59);

                            return {
                                id: `duty-${duty.id}`,
                                title: `${duty.user.prenom} ${duty.user.nom} - Garde (${duty.location?.name || 'N/A'})`,
                                start: formatISO(startDate),
                                end: formatISO(endDate),
                                allDay: true,
                                userId: duty.userId,
                                user: duty.user,
                                type: CalendarEventType.DUTY,
                                dutyId: duty.id,
                                locationId: duty.locationId,
                                locationName: duty.location?.name || 'Non spécifié',
                                description: ''
                            };
                        });

                        events.push(...dutyEvents);
                    } catch (dutiesError) {
                        console.error('Erreur lors de la récupération des gardes:', dutiesError);
                        // Continuer sans ajouter d'événements de gardes
                    }
                }

                // 3. Récupérer les astreintes
                if (requestedEventTypes.includes(CalendarEventType.ON_CALL)) {
                    try {
                        const onCallFilter: any = {
                            AND: [
                                { startDate: { lte: end } },
                                { endDate: { gte: start } }
                            ],
                        };

                        if (userIdFilterCondition !== undefined) {
                            onCallFilter.userId = userIdFilterCondition;
                        }

                        if (locationIdFilterCondition !== undefined) {
                            onCallFilter.locationId = locationIdFilterCondition;
                        }

                        const onCalls = await prisma.onCall.findMany({
                            where: onCallFilter,
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
                                location: true
                            },
                            orderBy: {
                                startDate: 'asc'
                            }
                        });

                        // Convertir les astreintes en événements de calendrier
                        const onCallEvents = onCalls.map(onCall => ({
                            id: `oncall-${onCall.id}`,
                            title: `${onCall.user.prenom} ${onCall.user.nom} - Astreinte (${onCall.location?.name || 'N/A'})`,
                            start: formatISO(onCall.startDate),
                            end: formatISO(onCall.endDate),
                            allDay: true,
                            userId: onCall.userId,
                            user: onCall.user,
                            type: CalendarEventType.ON_CALL,
                            onCallId: onCall.id,
                            locationId: onCall.locationId,
                            locationName: onCall.location?.name || 'Non spécifié',
                            description: ''
                        }));

                        events.push(...onCallEvents);
                    } catch (onCallsError) {
                        console.error('Erreur lors de la récupération des astreintes:', onCallsError);
                        // Continuer sans ajouter d'événements d'astreintes
                    }
                }

                // 4. Récupérer les affectations
                if (requestedEventTypes.includes(CalendarEventType.ASSIGNMENT)) {
                    try {
                        const assignmentFilter: any = {
                            date: {
                                gte: start,
                                lte: end
                            },
                        };

                        if (userIdFilterCondition !== undefined) {
                            assignmentFilter.userId = userIdFilterCondition;
                        }

                        if (locationIdFilterCondition !== undefined) {
                            assignmentFilter.locationId = locationIdFilterCondition;
                        }

                        if (specialtyIdFilterCondition !== undefined) {
                            assignmentFilter.specialtyId = specialtyIdFilterCondition;
                        }

                        const assignments = await prisma.assignment.findMany({
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
                                location: true,
                                specialty: true
                            },
                            orderBy: {
                                date: 'asc'
                            }
                        });

                        // Convertir les affectations en événements de calendrier
                        const assignmentEvents = assignments.map(assignment => {
                            const startDate = new Date(assignment.date);
                            const endDate = new Date(assignment.date);
                            endDate.setHours(23, 59, 59);

                            return {
                                id: `assign-${assignment.id}`,
                                title: `${assignment.user.prenom} ${assignment.user.nom} - Affectation: ${assignment.location.name} (${assignment.specialty?.name || 'Général'})`,
                                start: formatISO(startDate),
                                end: formatISO(endDate),
                                allDay: true,
                                userId: assignment.userId,
                                user: assignment.user,
                                type: CalendarEventType.ASSIGNMENT,
                                assignmentId: assignment.id,
                                locationId: assignment.locationId,
                                locationName: assignment.location.name,
                                specialtyId: assignment.specialtyId,
                                specialtyName: assignment.specialty?.name || null,
                                description: assignment.description || ''
                            };
                        });

                        events.push(...assignmentEvents);
                    } catch (assignmentsError) {
                        console.error('Erreur lors de la récupération des affectations:', assignmentsError);
                        // Continuer sans ajouter d'événements d'affectations
                    }
                }

                // Filtrer par terme de recherche si spécifié
                let filteredEvents = events;

                if (searchTerm) {
                    try {
                        const term = (searchTerm as string).toLowerCase();
                        filteredEvents = events.filter(event =>
                            event.title.toLowerCase().includes(term) ||
                            (event.description && event.description.toLowerCase().includes(term)) ||
                            (event.user && `${event.user.prenom} ${event.user.nom}`.toLowerCase().includes(term)) ||
                            (event.locationName && event.locationName.toLowerCase().includes(term)) ||
                            (event.teamName && event.teamName.toLowerCase().includes(term))
                        );
                    } catch (searchError) {
                        console.error('Erreur lors du filtrage par terme de recherche:', searchError);
                        // Continuer avec les événements non filtrés
                        filteredEvents = events;
                    }
                }

                // Tri final des événements par date de début
                try {
                    filteredEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
                } catch (sortError) {
                    console.error('Erreur lors du tri des événements:', sortError);
                    // Continuer avec les événements non triés
                }

                return res.status(200).json(filteredEvents);
            } catch (filterError) {
                console.error('Erreur lors du filtrage des événements:', filterError);
                return res.status(500).json({
                    error: 'Erreur lors du traitement des filtres',
                    details: process.env.NODE_ENV === 'development' ?
                        (filterError instanceof Error ? filterError.message : String(filterError)) : undefined
                });
            }
        }

        // Méthode non autorisée
        return res.status(405).json({ error: 'Méthode non autorisée' });
    } catch (error) {
        console.error('Erreur API calendrier:', error);

        // Journalisation détaillée
        if (error instanceof Error) {
            console.error('Message d\'erreur:', error.message);
            console.error('Stack trace:', error.stack);
        }

        // Réponse avec plus de détails en développement
        return res.status(500).json({
            error: 'Erreur serveur',
            details: process.env.NODE_ENV === 'development' ?
                (error instanceof Error ? error.message : String(error)) : undefined
        });
    }
} 