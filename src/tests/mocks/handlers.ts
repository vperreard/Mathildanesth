import { http, HttpResponse } from 'msw';
import { BlocDayPlanning, ValidationResult, BlocRoomAssignment } from '@/types/bloc-planning-types';

// Créer des handlers basiques pour les tests
export const handlers = [
    // Handlers pour blocPlanningApi.ts
    http.get('/api/bloc-planning/network-error-test', () => {
        return HttpResponse.json({ message: 'Simulated network error' }, { status: 500 });
    }),

    http.get('/api/bloc-planning/:date', ({ params }) => {
        const { date } = params;
        // Simuler le cas où le planning n'existe pas pour une date spécifique pour les tests d'erreur 404
        if (date === 'non-existent-date') {
            return HttpResponse.json({ message: 'Planning not found' }, { status: 404 });
        }
        const mockPlanning: BlocDayPlanning = {
            id: `planning-${date}`,
            date: date as string,
            salles: [
                {
                    id: 'assign1',
                    salleId: 'room1',
                    superviseurs: [{ userId: 'user1', periodes: [{ debut: '08:00', fin: '16:00' }], role: 'PRINCIPAL', id: 'sup1' }],
                    heureDebut: '08:00',
                    heureFin: '16:00',
                } as BlocRoomAssignment
            ],
            validationStatus: 'BROUILLON',
            notes: 'Mock notes for ' + date
        };
        return HttpResponse.json(mockPlanning);
    }),

    http.post('/api/bloc-planning/validate', async ({ request }) => {
        const planning = await request.json() as BlocDayPlanning;
        // Simuler une logique de validation simple
        if (planning.salles && planning.salles.length > 3) { // Exemple de règle
            return HttpResponse.json<ValidationResult>({
                isValid: false,
                errors: [{
                    id: 'err-too-many-rooms',
                    type: 'VALIDATION_SALLES',
                    code: 'TOO_MANY_ROOMS',
                    description: 'Trop de salles dans le planning',
                    severite: 'ERREUR',
                    entitesAffectees: [],
                    estResolu: false
                }],
                warnings: [],
                infos: []
            }, { status: 400 });
        }
        return HttpResponse.json<ValidationResult>({
            isValid: true,
            errors: [],
            warnings: [],
            infos: []
        });
    }),

    http.post('/api/bloc-planning', async ({ request }) => {
        const planning = await request.json() as BlocDayPlanning;
        // Simuler une sauvegarde réussie
        return HttpResponse.json<BlocDayPlanning>({ ...planning, id: planning.id || `saved-${Date.now()}` }, { status: 201 });
    }),

    http.get('/api/bloc-planning/supervisors/available', ({ request }) => {
        const url = new URL(request.url);
        const date = url.searchParams.get('date');
        // Logique pour retourner des superviseurs, peut-être en fonction de la date
        const supervisors = [
            { id: 'user1', firstName: 'Jean', lastName: 'BlocSuper', role: 'MAR' },
            { id: 'user2', firstName: 'Marie', lastName: 'BlocSuperAssistant', role: 'IADE' },
        ];
        if (date === 'no-supervisors-date') {
            return HttpResponse.json([], { status: 200 });
        }
        return HttpResponse.json(supervisors);
    }),

    // Exemple de handler pour une API GET
    http.get('/api/example', () => {
        return HttpResponse.json({ data: 'mocked-data' });
    }),

    // Exemple de handler pour une API POST
    http.post('/api/auth/login', () => {
        return HttpResponse.json({
            user: { id: 1, name: 'Test User' },
            token: 'mock-token-123'
        });
    }),

    // API GET /api/quotas
    http.get('/api/quotas', () => {
        return HttpResponse.json([
            { id: '1', userId: 'user1', type: 'ANNUAL', amount: 25, used: 10 },
            { id: '2', userId: 'user1', type: 'SPECIAL', amount: 5, used: 0 }
        ]);
    }),

    // API GET /api/leaves
    http.get('/api/leaves', () => {
        return HttpResponse.json([
            {
                id: '1',
                userId: 'user1',
                startDate: '2023-10-01',
                endDate: '2023-10-05',
                type: 'ANNUAL',
                status: 'APPROVED'
            }
        ]);
    }),

    // API GET /api/assignments
    http.get('/api/assignments', () => {
        return HttpResponse.json([
            {
                id: '1',
                userId: 'user1',
                startDate: '2023-10-10T08:00:00',
                endDate: '2023-10-10T16:00:00',
                type: 'GARDE',
                location: 'Bloc A'
            }
        ]);
    }),

    // API GET /api/auth/me
    http.get('/api/auth/me', () => {
        return HttpResponse.json({
            id: 'user1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'USER'
        });
    }),

    // Mock de l'API de création de congés
    http.post('/api/leaves', async () => {
        return HttpResponse.json(
            {
                id: '3',
                userId: 'user1',
                startDate: '2025-06-01',
                endDate: '2025-06-05',
                type: 'CONGE_PAYE',
                status: 'PENDING',
                reason: 'Vacances'
            },
            { status: 201 }
        );
    }),

    // Mock de l'API des conflits de congés
    http.get('/api/leaves/conflicts', () => {
        return HttpResponse.json([
            {
                id: 'conflict1',
                leaveId: '1',
                conflictType: 'OVERLAP',
                priority: 'HIGH',
                description: 'Chevauchement avec un autre congé'
            }
        ]);
    }),

    // Mock de l'API des événements du calendrier
    http.get('/api/calendar/events', () => {
        return HttpResponse.json([
            {
                id: 'event1',
                title: 'Garde',
                start: '2025-05-01T08:00:00',
                end: '2025-05-01T18:00:00',
                type: 'DUTY'
            }
        ]);
    }),

    // Mock de l'API des notifications
    http.get('/api/notifications', () => {
        return HttpResponse.json([
            {
                id: 'notif1',
                type: 'LEAVE_APPROVED',
                message: 'Votre demande de congé a été approuvée',
                read: false,
                createdAt: '2025-04-20T10:00:00'
            }
        ]);
    }),

    // Mock de l'API d'authentification
    http.get('/api/auth/session', () => {
        return HttpResponse.json({
            user: {
                id: 'user1',
                email: 'user@example.com',
                name: 'John Doe',
                role: 'USER'
            },
            expires: '2025-05-01T00:00:00'
        });
    }),

    // Mock de l'API des préférences utilisateur
    http.get('/api/user/preferences', () => {
        return HttpResponse.json({
            colorScheme: 'light',
            notifications: true,
            defaultView: 'week',
            startDay: 1
        });
    }),

    // Mock GET /api/planning/day
    http.get('/api/planning/day', ({ request }) => {
        const url = new URL(request.url);
        const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
        const mockPlanning: BlocDayPlanning = {
            id: `planning-${date}`,
            date: date,
            salles: [
                {
                    salleId: 'room1',
                    id: 'assign1',
                    superviseurs: [{ userId: 'user1', periodes: [{ debut: '08:00', fin: '16:00' }], role: 'PRINCIPAL', id: 'sup1' }],
                    heureDebut: '08:00',
                    heureFin: '16:00',
                } as BlocRoomAssignment
            ],
            validationStatus: 'BROUILLON',
        };
        return HttpResponse.json(mockPlanning);
    }),

    // Mock POST /api/planning/day
    http.post('/api/planning/day', async ({ request }) => {
        const newPlanning = await request.json() as BlocDayPlanning;
        return HttpResponse.json({ ...newPlanning, id: newPlanning.id || `new-${Date.now()}` }, { status: 201 });
    }),

    // Mock GET /api/planning/supervisors
    http.get('/api/planning/supervisors', () => {
        return HttpResponse.json([
            { id: 'user1', nom: 'Dupont', prenom: 'Jean', role: 'PRINCIPAL' },
            { id: 'user2', nom: 'Durand', prenom: 'Marie', role: 'ASSISTANT' },
        ]);
    }),

    // Mock POST /api/assignments/batch
    http.post('/api/assignments/batch', async ({ request }) => {
        const assignments = await request.json();
        console.log(">>> MSW: Mocking POST /api/assignments/batch", assignments);
        return HttpResponse.json({ success: true, updatedCount: Array.isArray(assignments) ? assignments.length : 0 });
    }),
]; 