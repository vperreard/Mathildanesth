import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { fetchDayPlanning, saveDayPlanning, fetchAvailableSupervisors } from '@/services/blocPlanningApi';
import { BlocDayPlanning } from '@/types/bloc-planning-types';

// Définir un serveur MSW pour mocker les appels API
const server = setupServer(
    // Mock pour récupérer un planning journalier
    rest.get('/api/bloc-planning/:date', (req, res, ctx) => {
        const { date } = req.params;
        return res(
            ctx.delay(50),
            ctx.status(200),
            ctx.json({
                id: 'planning-test',
                date: date,
                salles: [
                    {
                        id: 'assignment1',
                        salleId: 'room1',
                        superviseurs: [
                            {
                                id: 'supervisor1',
                                userId: 'user1',
                                role: 'PRINCIPAL',
                                periodes: [{ debut: '08:00', fin: '18:00' }]
                            }
                        ]
                    }
                ],
                validationStatus: 'BROUILLON'
            })
        );
    }),

    // Mock pour sauvegarder un planning journalier
    rest.post('/api/bloc-planning', (req, res, ctx) => {
        return res(
            ctx.delay(50),
            ctx.status(201),
            ctx.json({
                ...req.body,
                id: req.body.id || 'new-planning-id'
            })
        );
    }),

    // Mock pour les erreurs de validation
    rest.post('/api/bloc-planning/validate', (req, res, ctx) => {
        const planning = req.body;

        // Simuler des erreurs de validation pour certains cas
        if (planning && planning.salles && planning.salles.length > 2) {
            return res(
                ctx.status(400),
                ctx.json({
                    isValid: false,
                    errors: [
                        { code: 'MAX_SALLES_MAR', message: 'Trop de salles pour un MAR' }
                    ],
                    warnings: [],
                    infos: []
                })
            );
        }

        return res(
            ctx.status(200),
            ctx.json({
                isValid: true,
                errors: [],
                warnings: [],
                infos: []
            })
        );
    }),

    // Mock pour récupérer les superviseurs disponibles
    rest.get('/api/bloc-planning/supervisors/available', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json([
                { id: 'user1', firstName: 'Jean', lastName: 'Dupont', role: 'MAR' },
                { id: 'user2', firstName: 'Marie', lastName: 'Durand', role: 'MAR' }
            ])
        );
    })
);

// Configurer le serveur avant les tests
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Bloc Planning API Service', () => {
    test('fetchDayPlanning récupère un planning depuis l\'API', async () => {
        const date = '2023-06-15';
        const planning = await fetchDayPlanning(date);

        expect(planning).toBeDefined();
        expect(planning?.id).toBe('planning-test');
        expect(planning?.date).toBe(date);
        expect(planning?.salles).toHaveLength(1);
        expect(planning?.validationStatus).toBe('BROUILLON');
    });

    test('fetchDayPlanning gère les erreurs réseau', async () => {
        // Utiliser un flag spécial dans l'URL qui déclenchera une erreur dans notre mock
        await expect(fetchDayPlanning('error-test')).rejects.toThrow();
    });

    test('saveDayPlanning sauvegarde un planning via l\'API', async () => {
        const planning: BlocDayPlanning = {
            id: 'test-id',
            date: '2023-06-15',
            salles: [],
            validationStatus: 'BROUILLON'
        };

        const savedPlanning = await saveDayPlanning(planning);

        expect(savedPlanning).toBeDefined();
        expect(savedPlanning.id).toBe('test-id');
    });

    test('saveDayPlanning gère les erreurs de validation', async () => {
        // Créer un planning qui échouera à la validation
        const invalidPlanning: BlocDayPlanning = {
            id: 'invalid-id',
            date: '2023-06-15',
            salles: [
                { id: 'a1', salleId: 'room1', superviseurs: [] },
                { id: 'a2', salleId: 'room2', superviseurs: [] },
                { id: 'a3', salleId: 'room3', superviseurs: [] }
            ],
            validationStatus: 'BROUILLON'
        };

        // Vérifier que l'erreur est correctement gérée
        await expect(saveDayPlanning(invalidPlanning, true)).rejects.toThrow();
    });

    test('fetchAvailableSupervisors récupère les superviseurs disponibles', async () => {
        const date = '2023-06-15';
        const supervisors = await fetchAvailableSupervisors(date);

        expect(supervisors).toBeDefined();
        expect(supervisors).toHaveLength(2);
        expect(supervisors[0].id).toBe('user1');
        expect(supervisors[1].id).toBe('user2');
    });

    test('fetchAvailableSupervisors gère un signal d\'annulation', async () => {
        const controller = new AbortController();
        const date = '2023-06-15';

        // Annuler la requête immédiatement
        controller.abort(); // S'assurer que le signal est déjà annulé avant l'appel de la fonction

        // Vérifier que l'annulation est correctement gérée
        await expect(
            fetchAvailableSupervisors(date, { signal: controller.signal })
        ).rejects.toThrow();
    });
}); 