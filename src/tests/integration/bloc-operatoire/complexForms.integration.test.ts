import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import BlocPlanningEditor from '@/app/bloc-operatoire/components/BlocPlanningEditor';
import { BlocDayPlanning, OperatingRoom, BlocSector, SupervisionRule } from '@/types/bloc-planning-types';
import { blocPlanningService } from '@/services/blocPlanningService';
import { format } from 'date-fns';

// Mock des dépendances
vi.mock('@/services/blocPlanningService', () => ({
    blocPlanningService: {
        getAvailableSupervisors: vi.fn(),
        validateDayPlanning: vi.fn(),
        checkPlanningCompatibility: vi.fn(),
    },
}));

// Données de test
const testDate = new Date();
const formattedDate = format(testDate, 'yyyy-MM-dd');

const mockSalles: OperatingRoom[] = [
    {
        id: 'salle-1',
        numero: '101',
        nom: 'Salle Orthopédie',
        secteurId: 'secteur-1',
        estActif: true,
    },
    {
        id: 'salle-2',
        numero: '102',
        nom: 'Salle Cardiologie',
        secteurId: 'secteur-2',
        estActif: true,
    },
];

const mockSecteurs: BlocSector[] = [
    {
        id: 'secteur-1',
        nom: 'Orthopédie',
        couleur: '#FF0000',
        salles: ['salle-1'],
        estActif: true,
    },
    {
        id: 'secteur-2',
        nom: 'Cardiologie',
        couleur: '#0000FF',
        salles: ['salle-2'],
        estActif: true,
    },
];

const mockRules: SupervisionRule[] = [
    {
        id: 'rule-1',
        nom: 'Règle standard',
        type: 'BASIQUE',
        conditions: {
            maxSallesParMAR: 2,
        },
        priorite: 1,
        estActif: true,
    },
];

const mockSupervisors = [
    { id: 'user-1', firstName: 'Jean', lastName: 'Dupont' },
    { id: 'user-2', firstName: 'Marie', lastName: 'Martin' },
];

const mockPlanning: BlocDayPlanning = {
    id: 'planning-1',
    date: formattedDate,
    salles: [],
    validationStatus: 'BROUILLON',
};

describe("Tests d'intégration des formulaires complexes du bloc opératoire", () => {
    beforeEach(() => {
        vi.mocked(blocPlanningService.getAvailableSupervisors).mockResolvedValue(mockSupervisors);
        vi.mocked(blocPlanningService.validateDayPlanning).mockResolvedValue({
            isValid: true,
            errors: [],
            warnings: [],
            infos: [],
        });
        vi.mocked(blocPlanningService.checkPlanningCompatibility).mockResolvedValue(true);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("Formulaire d'éditeur de planning", () => {
        it("devrait permettre l'ajout et la configuration d'une salle", async () => {
            const onPlanningChangeMock = vi.fn();
            const user = userEvent.setup();

            // Rendu du composant
            render(
                <BlocPlanningEditor
                    date={ testDate }
                    planning = { mockPlanning }
                    salles = { mockSalles }
                    secteurs = { mockSecteurs }
                    rules = { mockRules }
                    onPlanningChange = { onPlanningChangeMock }
                />
            );

            // Vérifier que le formulaire est chargé
            expect(screen.getByText(/Salles assignées/i)).toBeInTheDocument();
            expect(screen.getByText(/0 salle\(s\) pour cette journée/i)).toBeInTheDocument();

            // Ajouter une salle
            const selectElement = screen.getByText(/Ajouter une salle/i);
            await user.click(selectElement);

            // Sélectionner la première salle
            const salleOption = screen.getByText(/Salle 101 - Orthopédie/i);
            await user.click(salleOption);

            // Vérifier que la salle a été ajoutée
            expect(screen.getByText(/1 salle\(s\) pour cette journée/i)).toBeInTheDocument();
            expect(screen.getByText(/Salle Orthopédie/i)).toBeInTheDocument();

            // Vérifier que onPlanningChange a été appelé avec le planning mis à jour
            expect(onPlanningChangeMock).toHaveBeenCalled();
            const updatedPlanning = onPlanningChangeMock.mock.calls[onPlanningChangeMock.mock.calls.length - 1][0];
            expect(updatedPlanning.salles.length).toBe(1);
            expect(updatedPlanning.salles[0].salleId).toBe('salle-1');
        });

        it("devrait permettre la configuration complète d'un superviseur", async () => {
            // Créer un planning avec une salle déjà assignée
            const planningWithRoom: BlocDayPlanning = {
                ...mockPlanning,
                salles: [
                    {
                        id: 'assignment-1',
                        salleId: 'salle-1',
                        superviseurs: [],
                        notes: '',
                    },
                ],
            };

            const onPlanningChangeMock = vi.fn();
            const user = userEvent.setup();

            // Rendu du composant
            render(
                <BlocPlanningEditor
                    date={ testDate }
                    planning = { planningWithRoom }
                    salles = { mockSalles }
                    secteurs = { mockSecteurs }
                    rules = { mockRules }
                    onPlanningChange = { onPlanningChangeMock }
                />
            );

            // Sélectionner la salle pour la modifier
            const salleItem = screen.getByText(/Salle Orthopédie/i);
            await user.click(salleItem);

            // Ajouter un superviseur
            const addSupervisorButton = screen.getByRole('button', { name: /Ajouter un superviseur/i });
            await user.click(addSupervisorButton);

            // Sélectionner un médecin
            const supervisorSelect = screen.getByText(/Sélectionner un médecin/i);
            await user.click(supervisorSelect);
            const medecinOption = screen.getByText(/Jean Dupont/i);
            await user.click(medecinOption);

            // Changer le rôle du superviseur
            const roleSelect = screen.getByDisplayValue('Principal');
            await user.click(roleSelect);
            const roleOption = screen.getByText(/Secondaire/i);
            await user.click(roleOption);

            // Modifier les heures de supervision
            const timeInputs = screen.getAllByRole('textbox', { type: 'time' });
            await user.clear(timeInputs[0]);
            await user.type(timeInputs[0], '09:00');
            await user.clear(timeInputs[1]);
            await user.type(timeInputs[1], '13:00');

            // Ajouter une période supplémentaire
            const addPeriodButton = screen.getByRole('button', { name: /Ajouter période/i });
            await user.click(addPeriodButton);

            // Vérifier que la période a été ajoutée
            expect(screen.getAllByRole('textbox', { type: 'time' }).length).toBe(4);

            // Vérifier que onPlanningChange a été appelé avec le planning mis à jour
            expect(onPlanningChangeMock).toHaveBeenCalled();

            // Récupérer le dernier appel pour vérifier les données
            const lastCallIndex = onPlanningChangeMock.mock.calls.length - 1;
            const updatedPlanning = onPlanningChangeMock.mock.calls[lastCallIndex][0];

            // Vérifier les données du superviseur
            const superviseur = updatedPlanning.salles[0].superviseurs[0];
            expect(superviseur.userId).toBe('user-1');
            expect(superviseur.role).toBe('SECONDAIRE');
            expect(superviseur.periodes.length).toBe(2);
            expect(superviseur.periodes[0].debut).toBe('09:00');
            expect(superviseur.periodes[0].fin).toBe('13:00');
        });

        it("devrait permettre la mise à jour des notes de planning", async () => {
            const onPlanningChangeMock = vi.fn();
            const user = userEvent.setup();

            // Rendu du composant
            render(
                <BlocPlanningEditor
                    date={ testDate }
                    planning = { mockPlanning }
                    salles = { mockSalles }
                    secteurs = { mockSecteurs }
                    rules = { mockRules }
                    onPlanningChange = { onPlanningChangeMock }
                />
            );

            // Trouver le textarea des notes du planning
            const notesTextarea = screen.getByPlaceholderText(/Notes générales pour le planning/i);

            // Ajouter des notes
            await user.type(notesTextarea, 'Notes importantes pour ce planning');

            // Vérifier que onPlanningChange a été appelé avec le planning mis à jour
            expect(onPlanningChangeMock).toHaveBeenCalled();

            // Vérifier que les notes ont été mises à jour
            const lastCallIndex = onPlanningChangeMock.mock.calls.length - 1;
            const updatedPlanning = onPlanningChangeMock.mock.calls[lastCallIndex][0];
            expect(updatedPlanning.notes).toBe('Notes importantes pour ce planning');
        });

        it("devrait permettre de changer le statut de validation du planning", async () => {
            const onPlanningChangeMock = vi.fn();
            const user = userEvent.setup();

            // Rendu du composant
            render(
                <BlocPlanningEditor
                    date={ testDate }
                    planning = { mockPlanning }
                    salles = { mockSalles }
                    secteurs = { mockSecteurs }
                    rules = { mockRules }
                    onPlanningChange = { onPlanningChangeMock }
                />
            );

            // Trouver le sélecteur de statut
            const statusSelect = screen.getByDisplayValue('Brouillon');
            await user.click(statusSelect);

            // Sélectionner le statut "Validé"
            const valideOption = screen.getByText('Validé');
            await user.click(valideOption);

            // Vérifier que onPlanningChange a été appelé avec le planning mis à jour
            expect(onPlanningChangeMock).toHaveBeenCalled();
            const updatedPlanning = onPlanningChangeMock.mock.calls[onPlanningChangeMock.mock.calls.length - 1][0];
            expect(updatedPlanning.validationStatus).toBe('VALIDE');
        });

        it("devrait afficher les couleurs des secteurs dans l'interface", async () => {
            const onPlanningChangeMock = vi.fn();
            const user = userEvent.setup();

            // Planning avec des salles des deux secteurs
            const planningWithRooms: BlocDayPlanning = {
                ...mockPlanning,
                salles: [
                    {
                        id: 'assignment-1',
                        salleId: 'salle-1',
                        superviseurs: [],
                    },
                    {
                        id: 'assignment-2',
                        salleId: 'salle-2',
                        superviseurs: [],
                    }
                ],
            };

            // Rendu du composant
            render(
                <BlocPlanningEditor
                    date={ testDate }
                    planning = { planningWithRooms }
                    salles = { mockSalles }
                    secteurs = { mockSecteurs }
                    rules = { mockRules }
                    onPlanningChange = { onPlanningChangeMock }
                />
            );

            // Vérifier que les éléments UI avec les styles sont présents
            const orthopedieElement = screen.getByText(/Salle Orthopédie/i).closest('div');
            const cardiologieElement = screen.getByText(/Salle Cardiologie/i).closest('div');

            // Vérifier que les classes liées aux couleurs sont appliquées
            expect(orthopedieElement).toHaveAttribute('data-secteur-id', 'secteur-1');
            expect(cardiologieElement).toHaveAttribute('data-secteur-id', 'secteur-2');

            // Vérifier que les indicateurs de couleur sont visibles
            const orthopedieIndicator = screen.getByTestId('secteur-color-indicator-secteur-1');
            const cardiologieIndicator = screen.getByTestId('secteur-color-indicator-secteur-2');

            expect(orthopedieIndicator).toHaveStyle('background-color: #FF0000');
            expect(cardiologieIndicator).toHaveStyle('background-color: #0000FF');
        });

        it("devrait permettre la suppression d'une salle du planning", async () => {
            const onPlanningChangeMock = vi.fn();
            const user = userEvent.setup();

            // Planning avec deux salles déjà assignées
            const planningWithRooms: BlocDayPlanning = {
                ...mockPlanning,
                salles: [
                    {
                        id: 'assignment-1',
                        salleId: 'salle-1',
                        superviseurs: [],
                    },
                    {
                        id: 'assignment-2',
                        salleId: 'salle-2',
                        superviseurs: [],
                    }
                ],
            };

            // Rendu du composant
            render(
                <BlocPlanningEditor
                    date={ testDate }
                    planning = { planningWithRooms }
                    salles = { mockSalles }
                    secteurs = { mockSecteurs }
                    rules = { mockRules }
                    onPlanningChange = { onPlanningChangeMock }
                />
            );

            // Vérifier que les deux salles sont présentes
            expect(screen.getByText(/Salle Orthopédie/i)).toBeInTheDocument();
            expect(screen.getByText(/Salle Cardiologie/i)).toBeInTheDocument();
            expect(screen.getByText(/2 salle\(s\) pour cette journée/i)).toBeInTheDocument();

            // Cliquer sur la première salle pour la sélectionner
            const salleItem = screen.getByText(/Salle Orthopédie/i);
            await user.click(salleItem);

            // Cliquer sur le bouton de suppression
            const deleteButton = screen.getByRole('button', { name: /Supprimer cette salle/i });
            await user.click(deleteButton);

            // Confirmer la suppression
            const confirmButton = screen.getByRole('button', { name: /Confirmer/i });
            await user.click(confirmButton);

            // Vérifier que onPlanningChange a été appelé avec le planning mis à jour
            expect(onPlanningChangeMock).toHaveBeenCalled();
            const lastCallIndex = onPlanningChangeMock.mock.calls.length - 1;
            const updatedPlanning = onPlanningChangeMock.mock.calls[lastCallIndex][0];

            // Vérifier qu'il ne reste qu'une seule salle (la seconde)
            expect(updatedPlanning.salles.length).toBe(1);
            expect(updatedPlanning.salles[0].salleId).toBe('salle-2');
        });

        it("devrait valider les périodes de temps des superviseurs", async () => {
            const onPlanningChangeMock = vi.fn();
            const user = userEvent.setup();

            // Planning avec une salle déjà assignée
            const planningWithRoom: BlocDayPlanning = {
                ...mockPlanning,
                salles: [
                    {
                        id: 'assignment-1',
                        salleId: 'salle-1',
                        superviseurs: [],
                    },
                ],
            };

            // Rendu du composant
            render(
                <BlocPlanningEditor
                    date={ testDate }
                    planning = { planningWithRoom }
                    salles = { mockSalles }
                    secteurs = { mockSecteurs }
                    rules = { mockRules }
                    onPlanningChange = { onPlanningChangeMock }
                />
            );

            // Sélectionner la salle
            const salleItem = screen.getByText(/Salle Orthopédie/i);
            await user.click(salleItem);

            // Ajouter un superviseur
            const addSupervisorButton = screen.getByRole('button', { name: /Ajouter un superviseur/i });
            await user.click(addSupervisorButton);

            // Sélectionner un médecin
            const supervisorSelect = screen.getByText(/Sélectionner un médecin/i);
            await user.click(supervisorSelect);
            const medecinOption = screen.getByText(/Jean Dupont/i);
            await user.click(medecinOption);

            // Essayer de saisir une heure de fin inférieure à l'heure de début
            const timeInputs = screen.getAllByRole('textbox', { type: 'time' });

            // Remplir l'heure de début (08:00)
            await user.clear(timeInputs[0]);
            await user.type(timeInputs[0], '08:00');

            // Remplir une heure de fin inférieure (07:00)
            await user.clear(timeInputs[1]);
            await user.type(timeInputs[1], '07:00');

            // Vérifier que le message d'erreur s'affiche
            expect(screen.getByText(/L'heure de fin doit être postérieure à l'heure de début/i)).toBeInTheDocument();

            // Corriger avec une heure de fin valide
            await user.clear(timeInputs[1]);
            await user.type(timeInputs[1], '12:30');

            // Vérifier que le message d'erreur a disparu
            expect(screen.queryByText(/L'heure de fin doit être postérieure à l'heure de début/i)).not.toBeInTheDocument();

            // Vérifier que onPlanningChange a été appelé avec les données corrigées
            const lastCallIndex = onPlanningChangeMock.mock.calls.length - 1;
            const updatedPlanning = onPlanningChangeMock.mock.calls[lastCallIndex][0];
            const superviseur = updatedPlanning.salles[0].superviseurs[0];
            expect(superviseur.periodes[0].debut).toBe('08:00');
            expect(superviseur.periodes[0].fin).toBe('12:30');
        });

        it("devrait vérifier la compatibilité du superviseur avec son planning existant", async () => {
            const onPlanningChangeMock = vi.fn();
            const user = userEvent.setup();

            // Configurer le mock pour simuler un conflit de planning
            vi.mocked(blocPlanningService.checkPlanningCompatibility).mockResolvedValueOnce(false);

            // Planning avec une salle
            const planningWithRoom: BlocDayPlanning = {
                ...mockPlanning,
                salles: [
                    {
                        id: 'assignment-1',
                        salleId: 'salle-1',
                        superviseurs: [],
                    },
                ],
            };

            // Rendu du composant
            render(
                <BlocPlanningEditor
                    date={ testDate }
                    planning = { planningWithRoom }
                    salles = { mockSalles }
                    secteurs = { mockSecteurs }
                    rules = { mockRules }
                    onPlanningChange = { onPlanningChangeMock }
                />
            );

            // Sélectionner la salle
            const salleItem = screen.getByText(/Salle Orthopédie/i);
            await user.click(salleItem);

            // Ajouter un superviseur
            const addSupervisorButton = screen.getByRole('button', { name: /Ajouter un superviseur/i });
            await user.click(addSupervisorButton);

            // Sélectionner un médecin
            const supervisorSelect = screen.getByText(/Sélectionner un médecin/i);
            await user.click(supervisorSelect);
            const medecinOption = screen.getByText(/Jean Dupont/i);
            await user.click(medecinOption);

            // Définir les périodes de supervision
            const timeInputs = screen.getAllByRole('textbox', { type: 'time' });
            await user.clear(timeInputs[0]);
            await user.type(timeInputs[0], '09:00');
            await user.clear(timeInputs[1]);
            await user.type(timeInputs[1], '14:00');

            // Vérifier que le service checkPlanningCompatibility a été appelé
            await waitFor(() => {
                expect(blocPlanningService.checkPlanningCompatibility).toHaveBeenCalledWith(
                    'user-1',
                    formattedDate,
                    [{ debut: '09:00', fin: '14:00' }]
                );
            });

            // Vérifier qu'un avertissement de conflit est affiché
            expect(screen.getByText(/Conflit avec le planning existant/i)).toBeInTheDocument();
        });
    });

    describe("Interaction avec les conflits et validations", () => {
        it("devrait afficher les conflits de supervision identifiés lors de la validation", async () => {
            // Simuler un résultat de validation avec des erreurs
            const validationResult = {
                isValid: false,
                errors: [
                    {
                        id: 'error-1',
                        type: 'REGLE_SUPERVISION',
                        description: 'Trop de salles pour un superviseur principal',
                        severite: 'ERREUR',
                        entitesAffectees: [{ type: 'SUPERVISEUR', id: 'user-1' }],
                        estResolu: false
                    }
                ],
                warnings: [
                    {
                        id: 'warning-1',
                        type: 'CHEVAUCHEMENT',
                        description: 'Chevauchement des périodes de supervision',
                        severite: 'AVERTISSEMENT',
                        entitesAffectees: [{ type: 'SUPERVISEUR', id: 'user-2' }],
                        estResolu: false
                    }
                ],
                infos: []
            };

            vi.mocked(blocPlanningService.validateDayPlanning).mockResolvedValue(validationResult);
            const onPlanningChangeMock = vi.fn();
            const user = userEvent.setup();

            // Planning avec deux salles et deux superviseurs
            const complexPlanning: BlocDayPlanning = {
                ...mockPlanning,
                salles: [
                    {
                        id: 'assignment-1',
                        salleId: 'salle-1',
                        superviseurs: [
                            {
                                id: 'supervisor-1',
                                userId: 'user-1',
                                role: 'PRINCIPAL',
                                periodes: [{ debut: '08:00', fin: '12:00' }]
                            }
                        ]
                    },
                    {
                        id: 'assignment-2',
                        salleId: 'salle-2',
                        superviseurs: [
                            {
                                id: 'supervisor-2',
                                userId: 'user-2',
                                role: 'SECONDAIRE',
                                periodes: [
                                    { debut: '08:00', fin: '10:00' },
                                    { debut: '09:30', fin: '11:30' } // Chevauchement
                                ]
                            }
                        ]
                    }
                ]
            };

            // Rendu du composant
            render(
                <BlocPlanningEditor
                    date={ testDate }
                    planning = { complexPlanning }
                    salles = { mockSalles }
                    secteurs = { mockSecteurs }
                    rules = { mockRules }
                    onPlanningChange = { onPlanningChangeMock }
                />
            );

            // Cliquer sur le bouton de validation
            const validateButton = screen.getByRole('button', { name: /Valider le planning/i });
            await user.click(validateButton);

            // Vérifier que la validation a été appelée avec le planning complet
            expect(blocPlanningService.validateDayPlanning).toHaveBeenCalledWith(complexPlanning);

            // Vérifier que les erreurs et avertissements sont affichés
            await waitFor(() => {
                expect(screen.getByText(/Trop de salles pour un superviseur principal/i)).toBeInTheDocument();
                expect(screen.getByText(/Chevauchement des périodes de supervision/i)).toBeInTheDocument();
            });

            // Vérifier que les erreurs sont classées par sévérité
            const errorElement = screen.getByText(/Trop de salles pour un superviseur principal/i);
            const warningElement = screen.getByText(/Chevauchement des périodes de supervision/i);

            expect(errorElement.closest('[data-severity="ERREUR"]')).toBeInTheDocument();
            expect(warningElement.closest('[data-severity="AVERTISSEMENT"]')).toBeInTheDocument();
        });
    });
}); 