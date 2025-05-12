import { BlocPlanningService } from '../blocPlanningService';
import { BlocDayPlanning, OperatingRoom, BlocSector, SupervisionRule, ValidationResult, AffectedEntityType, PlanningConflictSeverity, PlanningConflictType, PlanningConflictCode, BlocPlanningConflict } from '@/types/bloc-planning-types'; // Assurez-vous que les types sont corrects
import { v4 as uuidv4 } from 'uuid';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock du service de logging des erreurs
jest.mock('../../lib/logger', () => ({
    logError: jest.fn() // Forme simple standard
}));

// Étendre le type pour les méthodes de test internes
interface TestBlocPlanningService {
    resetForTesting?: () => void;
    planningsBloc?: any[];
}

describe('BlocPlanningService', () => {
    let blocPlanningService: BlocPlanningService;

    // Réinitialiser avant chaque test pour isoler les cas de test
    // Une nouvelle instance est créée pour s'assurer qu'il n'y a pas d'état partagé entre les tests.
    beforeEach(() => {
        blocPlanningService = new BlocPlanningService();
        // NOTE: resetForTesting() est généralement appelé dans les suites de tests spécifiques
        // (comme pour 'Gestion des plannings journaliers') où l'état initial des données par défaut
        // est crucial et potentiellement modifié par les tests eux-mêmes.
        // Pour les tests CRUD de base (rooms, sectors, rules), on part souvent d'un état vide.
    });

    // Salle d'opération pour les tests
    const testRoom1: OperatingRoom = { id: 'room1', nom: 'Salle 1', numero: '101', secteurId: 'sector1', priorite: 1, estActif: true, type: 'STANDARD', capacite: 1 };
    const testRoom2: OperatingRoom = { id: 'room2', nom: 'Salle 2', numero: '102', secteurId: 'sector1', priorite: 2, estActif: true, type: 'URGENCE', capacite: 1 };

    // Secteur pour les tests
    const testSector1: BlocSector = { id: 'sector1', nom: 'Secteur A', estActif: true };

    // Règle de supervision pour les tests - adaptée selon l'API réelle
    const testRule1: SupervisionRule = { id: 'rule1', nom: 'Règle standard', type: 'BASIQUE', priorite: 10, estActif: true, conditions: { maxSallesParMAR: 2 } };

    // Planning journalier pour les tests
    const testDayPlanning: BlocDayPlanning = {
        id: 'planning-test-day',
        date: '2023-06-14',
        salles: [
            {
                id: 'assignment1',
                salleId: 'room1', // Doit correspondre à une salle existante pour être valide
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
    };

    describe('Gestion des salles d\'opération', () => {
        beforeEach(() => {
            // Assurer un état propre pour ces tests spécifiques si nécessaire,
            // par exemple, si on ne veut pas des salles par défaut de resetForTesting()
            // Pour l'instant, on utilise l'instance fraîche.
        });

        test('doit créer et récupérer une salle d\'opération', () => {
            const createdRoom = blocPlanningService.createOperatingRoom(testRoom1);
            const retrievedRoom = blocPlanningService.getOperatingRoomById(createdRoom.id);
            expect(retrievedRoom).toEqual(createdRoom);
            expect(retrievedRoom?.nom).toBe(testRoom1.nom);
        });

        test('doit retourner toutes les salles d\'opération', () => {
            blocPlanningService.createOperatingRoom(testRoom1);
            blocPlanningService.createOperatingRoom(testRoom2);
            const allRooms = blocPlanningService.getAllOperatingRooms();
            expect(allRooms.length).toBe(2); // Ou plus si resetForTesting ajoute des salles
            expect(allRooms).toEqual(expect.arrayContaining([expect.objectContaining(testRoom1), expect.objectContaining(testRoom2)]));
        });

        test('doit mettre à jour une salle d\'opération', () => {
            const createdRoom = blocPlanningService.createOperatingRoom(testRoom1);
            const updates = { nom: 'Salle Alpha', estActif: false };
            const updatedRoom = blocPlanningService.updateOperatingRoom(createdRoom.id, updates);
            expect(updatedRoom?.nom).toBe('Salle Alpha');
            expect(updatedRoom?.estActif).toBe(false);
        });

        test('doit supprimer une salle d\'opération', () => {
            const createdRoom = blocPlanningService.createOperatingRoom(testRoom1);
            const deleted = blocPlanningService.deleteOperatingRoom(createdRoom.id);
            expect(deleted).toBe(true);
            const retrievedRoom = blocPlanningService.getOperatingRoomById(createdRoom.id);
            expect(retrievedRoom).toBeNull();
        });
    });

    describe('Gestion des secteurs', () => {
        test('doit créer et récupérer un secteur', () => {
            const createdSector = blocPlanningService.createSector(testSector1);
            const retrievedSector = blocPlanningService.getSectorById(createdSector.id);
            expect(retrievedSector).toEqual(createdSector);
        });

        // Ajouter des tests pour getAll, update, delete sectors
    });

    describe('Gestion des règles de supervision', () => {
        test('doit créer et récupérer une règle de supervision', () => {
            const createdRule = blocPlanningService.createSupervisionRule(testRule1);
            const retrievedRule = blocPlanningService.getSupervisionRuleById(createdRule.id);
            expect(retrievedRule).toEqual(createdRule);
        });

        // Ajouter des tests pour getAll, update, delete rules
    });

    describe('Gestion des plannings journaliers', () => {
        // Assurer un état propre avec les données par défaut avant chaque test de CETTE suite
        beforeEach(() => {
            blocPlanningService.resetForTesting(); // Charge les salles 'test-room-101', 'test-room-102', etc.
        });

        test('doit sauvegarder et récupérer un planning journalier', () => {
            const date = '2023-01-01';
            // Utiliser un ID de salle qui existe après resetForTesting
            const planning: BlocDayPlanning = {
                id: 'planning1',
                date: date,
                salles: [{ id: 'assign-p1', salleId: 'test-room-101', superviseurs: [] }],
                validationStatus: 'VALIDE'
            };
            blocPlanningService.saveDayPlanning(planning);
            const retrieved = blocPlanningService.getDayPlanning(date);
            expect(retrieved).toEqual(planning);
        });

        test('doit retourner null si aucun planning n\'existe pour la date', () => {
            const retrieved = blocPlanningService.getDayPlanning('inconnue-2023-01-02');
            expect(retrieved).toBeNull();
        });

        test('doit supprimer un planning journalier', () => {
            const date = '2023-01-03';
            const planning: BlocDayPlanning = { id: 'planning2', date: date, salles: [{ id: 'assign-p2', salleId: 'test-room-101', superviseurs: [] }], validationStatus: 'VALIDE' };
            blocPlanningService.saveDayPlanning(planning);
            const deleted = blocPlanningService.deleteDayPlanning(date);
            expect(deleted).toBe(true);
            const retrieved = blocPlanningService.getDayPlanning(date);
            expect(retrieved).toBeNull();
        });

        test('validateDayPlanning valide un planning sans erreurs', () => {
            // testDayPlanning utilise 'room1', qui n'existe PAS après resetForTesting.
            // Il faut utiliser les salles créées par resetForTesting ou créer 'room1'.
            // Pour ce test, on va créer un planning valide avec les données de test.
            const validPlanningForTest: BlocDayPlanning = {
                id: 'valid-planning-for-test',
                date: '2023-06-14', // Date quelconque
                salles: [
                    {
                        id: 'assignment-vpft-1',
                        salleId: 'test-room-101', // Salle valide de resetForTesting
                        superviseurs: [
                            {
                                id: 'supervisor-vpft-1',
                                userId: 'user-valide-1',
                                role: 'PRINCIPAL',
                                periodes: [{ debut: '08:00', fin: '18:00' }]
                            }
                        ]
                    }
                ],
                validationStatus: 'BROUILLON'
            };
            const validationResult = blocPlanningService.validateDayPlanning(validPlanningForTest);
            expect(validationResult).toBeDefined();
            expect(validationResult.isValid).toBe(true);
            expect(validationResult.errors.length).toBe(0);
        });

        test('validateDayPlanning détecte les erreurs dans un planning invalide', () => {
            // resetForTesting() est appelé dans le beforeEach de cette suite

            const invalidPlanning: BlocDayPlanning = {
                id: 'planning-sans-superviseur',
                date: '2023-06-15',
                salles: [
                    {
                        id: 'assignment-valid-room',
                        salleId: 'test-room-101', // Utiliser un ID de salle valide des données par défaut
                        superviseurs: [] // Aucun superviseur affecté
                    }
                ],
                validationStatus: 'BROUILLON'
            };

            const validationResult = blocPlanningService.validateDayPlanning(invalidPlanning);

            expect(validationResult).toBeDefined();
            expect(validationResult.isValid).toBe(false);
            expect(validationResult.errors.length).toBeGreaterThan(0);

            expect(validationResult.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        code: 'SALLE_NON_SUPERVISEE',
                        type: 'MANQUE_SUPERVISEUR',
                        description: expect.stringContaining('aucun superviseur affecté'),
                        severite: 'ERREUR',
                        entitesAffectees: expect.arrayContaining([
                            { type: 'SALLE', id: 'test-room-101' }
                        ])
                    })
                ])
            );
        });
    });
}); 