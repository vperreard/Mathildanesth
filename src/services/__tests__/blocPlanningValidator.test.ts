import { validateDayPlanning, validateSupervisorAssignments } from '@/services/blocPlanningValidator';
import { BlocDayPlanning, BlocRoomAssignment, BlocSupervisor } from '@/types/bloc-planning-types';

// Mock des fonctions de validation importées si nécessaire
jest.mock('@/services/errorLoggingService', () => ({
    logError: jest.fn()
}));

describe('Bloc Planning Validator', () => {
    // Planning valide pour les tests
    const validPlanning: BlocDayPlanning = {
        id: 'plan1',
        date: '2023-06-15',
        salles: [
            {
                id: 'assign1',
                salleId: 'room1',
                superviseurs: [
                    {
                        id: 'sup1',
                        userId: 'user1',
                        role: 'PRINCIPAL',
                        periodes: [{ debut: '08:00', fin: '12:00' }]
                    }
                ]
            },
            {
                id: 'assign2',
                salleId: 'room2',
                superviseurs: [
                    {
                        id: 'sup2',
                        userId: 'user2',
                        role: 'PRINCIPAL',
                        periodes: [{ debut: '08:00', fin: '12:00' }]
                    }
                ]
            }
        ],
        validationStatus: 'BROUILLON'
    };

    // Planning avec chevauchement des périodes pour un même superviseur
    const planningWithOverlap: BlocDayPlanning = {
        id: 'plan2',
        date: '2023-06-15',
        salles: [
            {
                id: 'assign1',
                salleId: 'room1',
                superviseurs: [
                    {
                        id: 'sup1',
                        userId: 'user1',
                        role: 'PRINCIPAL',
                        periodes: [{ debut: '08:00', fin: '12:00' }]
                    }
                ]
            },
            {
                id: 'assign2',
                salleId: 'room2',
                superviseurs: [
                    {
                        id: 'sup2',
                        userId: 'user1', // Même utilisateur que la salle précédente
                        role: 'PRINCIPAL',
                        periodes: [{ debut: '10:00', fin: '14:00' }] // Chevauchement avec la période précédente
                    }
                ]
            }
        ],
        validationStatus: 'BROUILLON'
    };

    // Planning sans superviseur principal
    const planningWithoutPrincipal: BlocDayPlanning = {
        id: 'plan3',
        date: '2023-06-15',
        salles: [
            {
                id: 'assign1',
                salleId: 'room1',
                superviseurs: [
                    {
                        id: 'sup1',
                        userId: 'user1',
                        role: 'SECONDAIRE', // Pas de superviseur principal
                        periodes: [{ debut: '08:00', fin: '12:00' }]
                    }
                ]
            }
        ],
        validationStatus: 'BROUILLON'
    };

    // Planning avec trop de salles par MAR
    const planningWithTooManySalles: BlocDayPlanning = {
        id: 'plan4',
        date: '2023-06-15',
        salles: [
            {
                id: 'assign1',
                salleId: 'room1',
                superviseurs: [
                    {
                        id: 'sup1',
                        userId: 'user1',
                        role: 'PRINCIPAL',
                        periodes: [{ debut: '08:00', fin: '12:00' }]
                    }
                ]
            },
            {
                id: 'assign2',
                salleId: 'room2',
                superviseurs: [
                    {
                        id: 'sup2',
                        userId: 'user1', // Même MAR
                        role: 'PRINCIPAL',
                        periodes: [{ debut: '08:00', fin: '12:00' }]
                    }
                ]
            },
            {
                id: 'assign3',
                salleId: 'room3',
                superviseurs: [
                    {
                        id: 'sup3',
                        userId: 'user1', // Même MAR encore
                        role: 'PRINCIPAL',
                        periodes: [{ debut: '08:00', fin: '12:00' }]
                    }
                ]
            }
        ],
        validationStatus: 'BROUILLON'
    };

    test('validateDayPlanning valide un planning correct', async () => {
        // Valider un planning valide
        const result = await validateDayPlanning(validPlanning, { maxSallesParMAR: 2 });

        // Vérifier que le résultat est valide
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(0);
    });

    test('validateDayPlanning détecte le chevauchement des périodes', async () => {
        // Valider un planning avec chevauchement
        const result = await validateDayPlanning(planningWithOverlap, { maxSallesParMAR: 2 });

        // Vérifier que le résultat n'est pas valide et contient une erreur de chevauchement
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.code === 'CHEVAUCHEMENT_PERIODES')).toBe(true);
    });

    test('validateDayPlanning détecte l\'absence de superviseur principal', async () => {
        // Valider un planning sans superviseur principal
        const result = await validateDayPlanning(planningWithoutPrincipal, { maxSallesParMAR: 2 });

        // Vérifier que le résultat n'est pas valide et contient une erreur d'absence de superviseur principal
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.code === 'SUPERVISEUR_PRINCIPAL_REQUIS')).toBe(true);
    });

    test('validateDayPlanning détecte trop de salles par MAR', async () => {
        // Valider un planning avec trop de salles par MAR
        const result = await validateDayPlanning(planningWithTooManySalles, { maxSallesParMAR: 2 });

        // Vérifier que le résultat n'est pas valide et contient une erreur de trop de salles
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.code === 'MAX_SALLES_MAR')).toBe(true);
    });

    test('validateSupervisorAssignments vérifie les règles de supervision', async () => {
        // Créer un tableau d'affectations de superviseurs
        const supervisors: BlocSupervisor[] = [
            {
                id: 'sup1',
                userId: 'user1',
                role: 'PRINCIPAL',
                periodes: [{ debut: '08:00', fin: '12:00' }]
            },
            {
                id: 'sup2',
                userId: 'user1',
                role: 'PRINCIPAL',
                periodes: [{ debut: '13:00', fin: '18:00' }] // Pas de chevauchement
            }
        ];

        // Valider les affectations de superviseurs
        const result = await validateSupervisorAssignments(supervisors);

        // Vérifier que les affectations sont valides
        expect(result.isValid).toBe(true);
    });

    test('validateSupervisorAssignments détecte les périodes chevauchantes', async () => {
        // Créer un tableau d'affectations de superviseurs avec chevauchement
        const supervisorsWithOverlap: BlocSupervisor[] = [
            {
                id: 'sup1',
                userId: 'user1',
                role: 'PRINCIPAL',
                periodes: [{ debut: '08:00', fin: '14:00' }]
            },
            {
                id: 'sup2',
                userId: 'user1',
                role: 'PRINCIPAL',
                periodes: [{ debut: '12:00', fin: '18:00' }] // Chevauchement avec la période précédente
            }
        ];

        // Valider les affectations de superviseurs
        const result = await validateSupervisorAssignments(supervisorsWithOverlap);

        // Vérifier que le résultat détecte le chevauchement
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.code === 'CHEVAUCHEMENT_PERIODES')).toBe(true);
    });
}); 