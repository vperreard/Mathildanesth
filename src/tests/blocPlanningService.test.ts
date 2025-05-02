import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { blocPlanningService } from '../services/blocPlanningService';
import {
    BlocDayPlanning,
    BlocRoomAssignment,
    BlocSector,
    BlocSupervisor,
    OperatingRoom,
    SupervisionRule
} from '../types/bloc-planning-types';
import { format } from 'date-fns';

// Mock du service d'enregistrement des erreurs
vi.mock('../services/errorLoggingService', () => ({
    logError: vi.fn()
}));

describe('BlocPlanningService', () => {
    // Données de test
    const testDate = format(new Date(), 'yyyy-MM-dd');
    let testSalle: OperatingRoom;
    let testSecteur: BlocSector;
    let testRegle: SupervisionRule;
    let testPlanning: BlocDayPlanning;

    // Réinitialiser les données avant chaque test
    beforeEach(async () => {
        // Créer un secteur de test
        testSecteur = {
            id: 'test-secteur',
            nom: 'Secteur Test',
            couleur: '#FF0000',
            salles: [],
            estActif: true
        };
        await blocPlanningService.createSector(testSecteur);

        // Créer une salle de test
        testSalle = {
            id: 'test-salle',
            numero: '101',
            nom: 'Salle Test',
            secteurId: testSecteur.id,
            estActif: true
        };
        await blocPlanningService.createOperatingRoom(testSalle);

        // Mettre à jour le secteur avec l'ID de la salle
        testSecteur.salles = [testSalle.id];
        await blocPlanningService.updateSector(testSecteur.id, testSecteur);

        // Créer une règle de supervision de test
        testRegle = {
            id: 'test-regle',
            nom: 'Règle Test',
            type: 'BASIQUE',
            conditions: {
                maxSallesParMAR: 2
            },
            priorite: 1,
            estActif: true
        };
        await blocPlanningService.createSupervisionRule(testRegle);

        // Créer un planning de test
        const salleAssignment: BlocRoomAssignment = {
            id: 'test-assignment',
            salleId: testSalle.id,
            superviseurs: [
                {
                    id: 'test-superviseur',
                    userId: 'test-user',
                    role: 'PRINCIPAL',
                    periodes: [
                        { debut: '08:00', fin: '12:00' }
                    ]
                }
            ]
        };

        testPlanning = {
            id: 'test-planning',
            date: testDate,
            salles: [salleAssignment],
            validationStatus: 'BROUILLON'
        };
        await blocPlanningService.saveDayPlanning(testPlanning);
    });

    // Nettoyer les données après chaque test
    afterEach(async () => {
        try {
            await blocPlanningService.deleteDayPlanning(testDate);
            await blocPlanningService.deleteSupervisionRule(testRegle.id);
            await blocPlanningService.deleteOperatingRoom(testSalle.id);
            await blocPlanningService.deleteSector(testSecteur.id);
        } catch (error) {
            console.error('Erreur lors du nettoyage des tests:', error);
        }
    });

    // Tests pour la gestion des salles
    describe('Gestion des salles', () => {
        it('devrait récupérer toutes les salles', async () => {
            const salles = await blocPlanningService.getAllOperatingRooms();
            expect(salles).toContainEqual(expect.objectContaining({
                id: testSalle.id,
                numero: testSalle.numero
            }));
        });

        it('devrait récupérer une salle par son ID', async () => {
            const salle = await blocPlanningService.getOperatingRoomById(testSalle.id);
            expect(salle).toEqual(expect.objectContaining({
                id: testSalle.id,
                numero: testSalle.numero
            }));
        });

        it('devrait créer une nouvelle salle', async () => {
            const nouvelleSalle: Omit<OperatingRoom, 'id'> = {
                numero: '102',
                nom: 'Nouvelle Salle',
                secteurId: testSecteur.id,
                estActif: true
            };

            const salleCreee = await blocPlanningService.createOperatingRoom(nouvelleSalle);
            expect(salleCreee).toEqual(expect.objectContaining({
                numero: nouvelleSalle.numero,
                nom: nouvelleSalle.nom
            }));

            // Nettoyer
            await blocPlanningService.deleteOperatingRoom(salleCreee.id);
        });

        it('devrait mettre à jour une salle existante', async () => {
            const miseAJour = {
                nom: 'Salle Mise à Jour',
                estActif: false
            };

            const salleMAJ = await blocPlanningService.updateOperatingRoom(testSalle.id, miseAJour);
            expect(salleMAJ).toEqual(expect.objectContaining({
                id: testSalle.id,
                nom: miseAJour.nom,
                estActif: miseAJour.estActif
            }));
        });

        it('devrait supprimer une salle', async () => {
            // Créer une salle temporaire pour le test de suppression
            const salleTemp: Omit<OperatingRoom, 'id'> = {
                numero: '103',
                secteurId: testSecteur.id,
                estActif: true
            };
            const salleCree = await blocPlanningService.createOperatingRoom(salleTemp);

            // Supprimer la salle
            const resultat = await blocPlanningService.deleteOperatingRoom(salleCree.id);
            expect(resultat).toBe(true);

            // Vérifier que la salle n'existe plus
            const salles = await blocPlanningService.getAllOperatingRooms();
            expect(salles).not.toContainEqual(expect.objectContaining({ id: salleCree.id }));
        });
    });

    // Tests pour la gestion des secteurs
    describe('Gestion des secteurs', () => {
        it('devrait récupérer tous les secteurs', async () => {
            const secteurs = await blocPlanningService.getAllSectors();
            expect(secteurs).toContainEqual(expect.objectContaining({
                id: testSecteur.id,
                nom: testSecteur.nom
            }));
        });

        it('devrait récupérer un secteur par son ID', async () => {
            const secteur = await blocPlanningService.getSectorById(testSecteur.id);
            expect(secteur).toEqual(expect.objectContaining({
                id: testSecteur.id,
                nom: testSecteur.nom
            }));
        });

        it('devrait créer un nouveau secteur', async () => {
            const nouveauSecteur: Omit<BlocSector, 'id'> = {
                nom: 'Nouveau Secteur',
                couleur: '#00FF00',
                salles: [],
                estActif: true
            };

            const secteurCree = await blocPlanningService.createSector(nouveauSecteur);
            expect(secteurCree).toEqual(expect.objectContaining({
                nom: nouveauSecteur.nom,
                couleur: nouveauSecteur.couleur
            }));

            // Nettoyer
            await blocPlanningService.deleteSector(secteurCree.id);
        });

        it('devrait mettre à jour un secteur existant', async () => {
            const miseAJour = {
                nom: 'Secteur Mis à Jour',
                couleur: '#0000FF'
            };

            const secteurMAJ = await blocPlanningService.updateSector(testSecteur.id, miseAJour);
            expect(secteurMAJ).toEqual(expect.objectContaining({
                id: testSecteur.id,
                nom: miseAJour.nom,
                couleur: miseAJour.couleur
            }));
        });
    });

    // Tests pour la gestion des règles de supervision
    describe('Gestion des règles de supervision', () => {
        it('devrait récupérer toutes les règles de supervision', async () => {
            const regles = await blocPlanningService.getAllSupervisionRules();
            expect(regles).toContainEqual(expect.objectContaining({
                id: testRegle.id,
                nom: testRegle.nom
            }));
        });

        it('devrait récupérer une règle par son ID', async () => {
            const regle = await blocPlanningService.getSupervisionRuleById(testRegle.id);
            expect(regle).toEqual(expect.objectContaining({
                id: testRegle.id,
                nom: testRegle.nom
            }));
        });

        it('devrait créer une nouvelle règle de supervision', async () => {
            const nouvelleRegle: Omit<SupervisionRule, 'id' | 'createdAt' | 'updatedAt'> = {
                nom: 'Nouvelle Règle',
                type: 'SPECIFIQUE',
                conditions: {
                    maxSallesParMAR: 3,
                    supervisionInterne: true
                },
                priorite: 2,
                estActif: true
            };

            const regleCree = await blocPlanningService.createSupervisionRule(nouvelleRegle);
            expect(regleCree).toEqual(expect.objectContaining({
                nom: nouvelleRegle.nom,
                type: nouvelleRegle.type,
                conditions: nouvelleRegle.conditions
            }));

            // Nettoyer
            await blocPlanningService.deleteSupervisionRule(regleCree.id);
        });

        it('devrait mettre à jour une règle existante', async () => {
            const miseAJour = {
                nom: 'Règle Mise à Jour',
                priorite: 3
            };

            const regleMAJ = await blocPlanningService.updateSupervisionRule(testRegle.id, miseAJour);
            expect(regleMAJ).toEqual(expect.objectContaining({
                id: testRegle.id,
                nom: miseAJour.nom,
                priorite: miseAJour.priorite
            }));
        });
    });

    // Tests pour la gestion des plannings
    describe('Gestion des plannings', () => {
        it('devrait récupérer un planning par sa date', async () => {
            const planning = await blocPlanningService.getDayPlanning(testDate);
            expect(planning).toEqual(expect.objectContaining({
                id: testPlanning.id,
                date: testPlanning.date
            }));
        });

        it('devrait créer un nouveau planning', async () => {
            // Créer une date de test différente
            const newDate = format(new Date(new Date().getTime() + 86400000), 'yyyy-MM-dd');

            const newPlanning: Omit<BlocDayPlanning, 'id' | 'createdAt' | 'updatedAt'> = {
                date: newDate,
                salles: [{
                    id: 'new-assignment',
                    salleId: testSalle.id,
                    superviseurs: []
                }],
                validationStatus: 'BROUILLON'
            };

            const planningCree = await blocPlanningService.saveDayPlanning(newPlanning);
            expect(planningCree).toEqual(expect.objectContaining({
                date: newPlanning.date,
                validationStatus: newPlanning.validationStatus
            }));

            // Nettoyer
            await blocPlanningService.deleteDayPlanning(newDate);
        });

        it('devrait mettre à jour un planning existant', async () => {
            const miseAJour: Partial<BlocDayPlanning> = {
                validationStatus: 'VALIDE',
                notes: 'Notes de test'
            };

            // Créer une copie du planning avec les mises à jour
            const planningMAJ = {
                ...testPlanning,
                ...miseAJour
            };

            const resultat = await blocPlanningService.saveDayPlanning(planningMAJ);
            expect(resultat).toEqual(expect.objectContaining({
                id: testPlanning.id,
                validationStatus: miseAJour.validationStatus,
                notes: miseAJour.notes
            }));
        });

        it('devrait supprimer un planning', async () => {
            // Créer un planning temporaire pour le test de suppression
            const newDate = format(new Date(new Date().getTime() + 172800000), 'yyyy-MM-dd');
            const tempPlanning: Omit<BlocDayPlanning, 'id' | 'createdAt' | 'updatedAt'> = {
                date: newDate,
                salles: [],
                validationStatus: 'BROUILLON'
            };

            await blocPlanningService.saveDayPlanning(tempPlanning);

            // Supprimer le planning
            const resultat = await blocPlanningService.deleteDayPlanning(newDate);
            expect(resultat).toBe(true);

            // Vérifier que le planning n'existe plus
            const planning = await blocPlanningService.getDayPlanning(newDate);
            expect(planning).toBeNull();
        });
    });
}); 