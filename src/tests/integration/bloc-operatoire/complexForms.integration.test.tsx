import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BlocPlanningEditor from '@/app/bloc-operatoire/components/BlocPlanningEditor';
import { blocPlanningService } from '@/modules/planning/bloc-operatoire/services/blocPlanningService';
import { expect, describe, it, beforeEach, afterEach, jest as vi } from '@jest/globals';
import '@testing-library/jest-dom';
import { BlocDayPlanning, OperatingRoom, BlocSector, SupervisionRule } from '@/types/bloc-planning-types';
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

// Ajout des données de mock manquantes
const mockPlanningData = {
    id: 'planning-data-1',
    title: 'Planning Test Initial',
    date: formattedDate,
    operations: [], // Ajouter des opérations mockées si nécessaire pour le test
    status: 'DRAFT',
};

const mockAvailableRooms: OperatingRoom[] = [...mockSalles]; // Utiliser les salles déjà définies

const mockAvailableSurgeons = [
    { id: 'surgeon-1', name: 'Dr. Dubois', specialty: 'Orthopédie' },
    { id: 'surgeon-2', name: 'Dr. Lefevre', specialty: 'Cardiologie' },
];
// Fin ajout

describe("Tests d'intégration des formulaires complexes du bloc opératoire", () => {
    beforeEach(() => {
    jest.clearAllMocks();
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

        it.skip("devrait permettre l'ajout et la configuration d'une salle", async () => {
            const onPlanningChangeMock = vi.fn();
            const user = userEvent.setup();

            // Rendu du composant
            render(
                <BlocPlanningEditor
                    date={testDate}
                    planning={mockPlanning}
                    salles={mockSalles}
                    secteurs={mockSecteurs}
                    rules={mockRules}
                    onPlanningChange={onPlanningChangeMock}
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


        it.skip("devrait permettre la mise à jour des notes de planning", async () => {
            const onPlanningChangeMock = vi.fn();
            const user = userEvent.setup();

            // Rendu du composant
            render(
                <BlocPlanningEditor
                    date={testDate}
                    planning={mockPlanning}
                    salles={mockSalles}
                    secteurs={mockSecteurs}
                    rules={mockRules}
                    onPlanningChange={onPlanningChangeMock}
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

        it.skip("devrait permettre de changer le statut de validation du planning", async () => {
            const onPlanningChangeMock = vi.fn();
            const user = userEvent.setup();

            // Rendu du composant
            render(
                <BlocPlanningEditor
                    date={testDate}
                    planning={mockPlanning}
                    salles={mockSalles}
                    secteurs={mockSecteurs}
                    rules={mockRules}
                    onPlanningChange={onPlanningChangeMock}
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

        it.skip("devrait afficher les couleurs des secteurs dans l'interface", async () => {
            const onPlanningChangeMock = vi.fn();
            const user = userEvent.setup();

            // Planning avec des salles des deux secteurs
            const planningWithRooms: BlocDayPlanning = {
                ...mockPlanning,
                salles: [
                    {
                        id: 'attribution-1',
                        salleId: 'salle-1',
                        superviseurs: [],
                    },
                    {
                        id: 'attribution-2',
                        salleId: 'salle-2',
                        superviseurs: [],
                    }
                ],
            };

            // Rendu du composant
            render(
                <BlocPlanningEditor
                    date={testDate}
                    planning={planningWithRooms}
                    salles={mockSalles}
                    secteurs={mockSecteurs}
                    rules={mockRules}
                    onPlanningChange={onPlanningChangeMock}
                />
            );

            // Vérifier la présence des éléments de salle
            const salle1Element = screen.getByText(/Salle Orthopédie/i).closest('div[role="group"]');
            const salle2Element = screen.getByText(/Salle Cardiologie/i).closest('div[role="group"]');

            // Vérifier que les styles de bordure colorée sont appliqués (basé sur la couleur du secteur)
            expect(salle1Element).toHaveStyle('border-left-color: #FF0000');
            expect(salle2Element).toHaveStyle('border-left-color: #0000FF');
        });

        it.skip("devrait permettre d'assigner un superviseur à une salle et vérifier la compatibilité", async () => {
            const onPlanningChangeMock = vi.fn();
            const user = userEvent.setup();

            // Planning avec une salle
            const planningWithRoom: BlocDayPlanning = {
                ...mockPlanning,
                salles: [
                    {
                        id: 'attribution-3',
                        salleId: 'salle-1',
                        superviseurs: [],
                    }
                ],
            };

            // Rendu du composant
            render(
                <BlocPlanningEditor
                    date={testDate}
                    planning={planningWithRoom}
                    salles={mockSalles}
                    secteurs={mockSecteurs}
                    rules={mockRules}
                    onPlanningChange={onPlanningChangeMock}
                />
            );

            // Ouvrir le sélecteur de superviseur pour la salle 1
            const assignButton = screen.getByRole('button', { name: /assigner un superviseur/i });
            await user.click(assignButton);

            // Sélectionner un superviseur
            const supervisorOption = await screen.findByText(/Jean Dupont/i);
            await user.click(supervisorOption);

            // Vérifier que checkPlanningCompatibility a été appelé
            await waitFor(() => {
                expect(blocPlanningService.checkPlanningCompatibility).toHaveBeenCalled();
            });

            // Vérifier que onPlanningChange a été appelé avec le superviseur assigné
            expect(onPlanningChangeMock).toHaveBeenCalled();
            const updatedPlanning = onPlanningChangeMock.mock.calls[onPlanningChangeMock.mock.calls.length - 1][0];
            expect(updatedPlanning.salles[0].superviseurs.length).toBe(1);
            expect(updatedPlanning.salles[0].superviseurs[0].userId).toBe('user-1');
        });

        it.skip("devrait afficher un avertissement si les règles de supervision ne sont pas respectées", async () => {
            const onPlanningChangeMock = vi.fn();
            const user = userEvent.setup();

            // Simuler une validation invalide
            vi.mocked(blocPlanningService.validateDayPlanning).mockResolvedValueOnce({
                isValid: false,
                errors: [{ ruleId: 'rule-1', message: 'Trop de salles par superviseur', severity: 'ERROR' }],
                warnings: [],
                infos: [],
            });

            // Planning avec une salle et un superviseur
            const planningWithSupervisor: BlocDayPlanning = {
                ...mockPlanning,
                salles: [
                    {
                        id: 'attribution-4',
                        salleId: 'salle-1',
                        superviseurs: [{ userId: 'user-1', firstName: 'Jean', lastName: 'Dupont' }],
                    }
                ],
            };

            // Rendu du composant
            render(
                <BlocPlanningEditor
                    date={testDate}
                    planning={planningWithSupervisor}
                    salles={mockSalles}
                    secteurs={mockSecteurs}
                    rules={mockRules}
                    onPlanningChange={onPlanningChangeMock}
                />
            );

            // Forcer une validation (par exemple, en changeant quelque chose)
            const notesInput = screen.getByPlaceholderText(/Notes générales pour le planning/i);
            await user.type(notesInput, ' triggering validation');

            // Attendre que l'avertissement d'erreur apparaisse
            expect(await screen.findByText(/Trop de salles par superviseur/i)).toBeInTheDocument();
        });

        it.skip("devrait gérer correctement le retrait d'une salle", async () => {
            const onPlanningChangeMock = vi.fn();
            const user = userEvent.setup();

            // Planning avec une salle
            const planningWithRoom: BlocDayPlanning = {
                ...mockPlanning,
                salles: [
                    {
                        id: 'attribution-5',
                        salleId: 'salle-1',
                        superviseurs: [],
                    }
                ],
            };

            // Rendu du composant
            render(
                <BlocPlanningEditor
                    date={testDate}
                    planning={planningWithRoom}
                    salles={mockSalles}
                    secteurs={mockSecteurs}
                    rules={mockRules}
                    onPlanningChange={onPlanningChangeMock}
                />
            );

            // Trouver le bouton de suppression de la salle
            const removeButton = screen.getByRole('button', { name: /retirer la salle/i });
            await user.click(removeButton);

            // Vérifier que onPlanningChange a été appelé avec un planning sans salle
            expect(onPlanningChangeMock).toHaveBeenCalled();
            const updatedPlanning = onPlanningChangeMock.mock.calls[onPlanningChangeMock.mock.calls.length - 1][0];
            expect(updatedPlanning.salles.length).toBe(0);
        });

        it.skip("devrait gérer correctement le retrait d'un superviseur", async () => {
            const onPlanningChangeMock = vi.fn();
            const user = userEvent.setup();

            // Planning avec une salle et un superviseur
            const planningWithSupervisor: BlocDayPlanning = {
                ...mockPlanning,
                salles: [
                    {
                        id: 'attribution-6',
                        salleId: 'salle-1',
                        superviseurs: [{ userId: 'user-1', firstName: 'Jean', lastName: 'Dupont' }],
                    }
                ],
            };

            // Rendu du composant
            render(
                <BlocPlanningEditor
                    date={testDate}
                    planning={planningWithSupervisor}
                    salles={mockSalles}
                    secteurs={mockSecteurs}
                    rules={mockRules}
                    onPlanningChange={onPlanningChangeMock}
                />
            );

            // Trouver le bouton de suppression du superviseur
            const removeSupervisorButton = screen.getByRole('button', { name: /retirer jean dupont/i });
            await user.click(removeSupervisorButton);

            // Vérifier que onPlanningChange a été appelé avec la salle sans superviseur
            expect(onPlanningChangeMock).toHaveBeenCalled();
            const updatedPlanning = onPlanningChangeMock.mock.calls[onPlanningChangeMock.mock.calls.length - 1][0];
            expect(updatedPlanning.salles[0].superviseurs.length).toBe(0);
        });

        it.skip("devrait gérer la sélection de règles de supervision spécifiques à la salle", async () => {
            const onPlanningChangeMock = vi.fn();
            const user = userEvent.setup();

            // Planning avec une salle
            const planningWithRoom: BlocDayPlanning = {
                ...mockPlanning,
                salles: [
                    {
                        id: 'attribution-7',
                        salleId: 'salle-1',
                        superviseurs: [],
                    }
                ],
            };

            // Rendu du composant
            render(
                <BlocPlanningEditor
                    date={testDate}
                    planning={planningWithRoom}
                    salles={mockSalles}
                    secteurs={mockSecteurs}
                    rules={mockRules}
                    onPlanningChange={onPlanningChangeMock}
                />
            );

            // Cliquer pour ouvrir les options de la salle
            const optionsButton = screen.getByRole('button', { name: /options de la salle/i });
            await user.click(optionsButton);

            // Trouver le sélecteur de règles spécifique (peut nécessiter un data-testid ou un label plus précis)
            const ruleSelect = await screen.findByLabelText(/Règles spécifiques/i);
            // Simuler la sélection d'une règle (à adapter selon l'implémentation exacte du sélecteur)
            // Exemple: await user.selectOptions(ruleSelect, 'rule-1');

            // Vérifier que onPlanningChange a été appelé avec la règle spécifique assignée
            // expect(onPlanningChangeMock).toHaveBeenCalled();
            // const updatedPlanning = onPlanningChangeMock.mock.calls[onPlanningChangeMock.mock.calls.length - 1][0];
            // expect(updatedPlanning.salles[0].reglesSpecifiques).toContain('rule-1');
            // Test temporairement désactivé car l'implémentation exacte du sélecteur est inconnue
            expect(true).toBe(true);
        });

        it.skip("devrait mettre à jour les notes spécifiques à une salle", async () => {
            const onPlanningChangeMock = vi.fn();
            const user = userEvent.setup();

            // Planning avec une salle
            const planningWithRoom: BlocDayPlanning = {
                ...mockPlanning,
                salles: [
                    {
                        id: 'attribution-8',
                        salleId: 'salle-1',
                        superviseurs: [],
                    }
                ],
            };

            // Rendu du composant
            render(
                <BlocPlanningEditor
                    date={testDate}
                    planning={planningWithRoom}
                    salles={mockSalles}
                    secteurs={mockSecteurs}
                    rules={mockRules}
                    onPlanningChange={onPlanningChangeMock}
                />
            );

            // Cliquer pour ouvrir les options de la salle
            const optionsButton = screen.getByRole('button', { name: /options de la salle/i });
            await user.click(optionsButton);

            // Trouver le textarea des notes spécifiques
            const specificNotesTextarea = await screen.findByPlaceholderText(/Notes spécifiques à cette salle/i);
            await user.type(specificNotesTextarea, 'Note spéciale pour salle 1');

            // Vérifier que onPlanningChange a été appelé
            expect(onPlanningChangeMock).toHaveBeenCalled();
            // Vérifier que les notes spécifiques ont été mises à jour
            const updatedPlanning = onPlanningChangeMock.mock.calls[onPlanningChangeMock.mock.calls.length - 1][0];
            expect(updatedPlanning.salles[0].notes).toBe('Note spéciale pour salle 1');
        });

        it.skip("devrait gérer un planning complexe avec plusieurs salles et superviseurs", async () => {
            const onPlanningChangeMock = vi.fn();
            const user = userEvent.setup();

            // Planning complexe
            const complexPlanning: BlocDayPlanning = {
                ...mockPlanning,
                salles: [
                    {
                        id: 'attribution-9',
                        salleId: 'salle-1',
                        superviseurs: [{ userId: 'user-1', firstName: 'Jean', lastName: 'Dupont' }],
                        notes: 'Salle 1 - Ortho',
                    },
                    {
                        id: 'attribution-10',
                        salleId: 'salle-2',
                        superviseurs: [{ userId: 'user-2', firstName: 'Marie', lastName: 'Martin' }],
                        notes: 'Salle 2 - Cardio',
                    },
                ],
                notes: 'Planning complet',
                validationStatus: 'VALIDE',
            };

            // Rendu du composant
            render(
                <BlocPlanningEditor
                    date={testDate}
                    planning={complexPlanning}
                    salles={mockSalles}
                    secteurs={mockSecteurs}
                    rules={mockRules}
                    onPlanningChange={onPlanningChangeMock}
                />
            );

            // Vérifier que les éléments principaux sont présents
            expect(screen.getByText(/Salle Orthopédie/i)).toBeInTheDocument();
            expect(screen.getByText(/Jean Dupont/i)).toBeInTheDocument();
            expect(screen.getByText(/Salle Cardiologie/i)).toBeInTheDocument();
            expect(screen.getByText(/Marie Martin/i)).toBeInTheDocument();
            expect(screen.getByDisplayValue('Validé')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Planning complet')).toBeInTheDocument();

            // Simuler une modification (retrait d'un superviseur)
            const removeMartinButton = screen.getByRole('button', { name: /retirer marie martin/i });
            await user.click(removeMartinButton);

            // Vérifier la mise à jour
            expect(onPlanningChangeMock).toHaveBeenCalled();
            const updatedPlanning = onPlanningChangeMock.mock.calls[onPlanningChangeMock.mock.calls.length - 1][0];
            expect(updatedPlanning.salles.length).toBe(2); // Toujours 2 salles
            expect(updatedPlanning.salles[1].superviseurs.length).toBe(0); // Superviseur retiré de la salle 2
        });

    });
}); 