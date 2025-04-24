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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

            // Normaliser les dates
            const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const end = endDate ? new Date(endDate as string) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

            const events: any[] = [];

            // --- Préparer les conditions de filtre pour les IDs --- 
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

            // Filtrer les types d'événements à récupérer
            let requestedEventTypes: CalendarEventType[] = [];
            if (eventTypes) {
                requestedEventTypes = (Array.isArray(eventTypes) ? eventTypes : [eventTypes]) as CalendarEventType[];
            } else {
                // Par défaut, récupérer tous les types
                requestedEventTypes = Object.values(CalendarEventType);
            }

            // 1. Récupérer les congés
            if (requestedEventTypes.includes(CalendarEventType.LEAVE)) {
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
            }

            // 2. Récupérer les gardes
            if (requestedEventTypes.includes(CalendarEventType.DUTY)) {
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
            }

            // 3. Récupérer les astreintes
            if (requestedEventTypes.includes(CalendarEventType.ON_CALL)) {
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
            }

            // 4. Récupérer les affectations
            if (requestedEventTypes.includes(CalendarEventType.ASSIGNMENT)) {
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
            }

            // Filtrer par terme de recherche si spécifié
            let filteredEvents = events;

            if (searchTerm) {
                const term = (searchTerm as string).toLowerCase();
                filteredEvents = events.filter(event =>
                    event.title.toLowerCase().includes(term) ||
                    (event.description && event.description.toLowerCase().includes(term)) ||
                    (event.user && `${event.user.prenom} ${event.user.nom}`.toLowerCase().includes(term)) ||
                    (event.locationName && event.locationName.toLowerCase().includes(term)) ||
                    (event.teamName && event.teamName.toLowerCase().includes(term))
                );
            }

            // Tri final des événements par date de début
            filteredEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

            return res.status(200).json(filteredEvents);
        }

        // Méthode non autorisée
        return res.status(405).json({ error: 'Méthode non autorisée' });
    } catch (error) {
        console.error('Erreur API calendrier:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
} 