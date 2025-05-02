import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BlocPlanningEditor } from '@/app/bloc-operatoire/components/BlocPlanningEditor';
import { blocPlanningService } from '@/services/blocPlanningService';
import { vi, expect, describe, test, beforeEach } from 'vitest';

// Mock du service de planning
vi.mock('@/services/blocPlanningService', () => ({
    blocPlanningService: {
        getDayPlanning: vi.fn(),
        validateDayPlanning: vi.fn(),
        saveDayPlanning: vi.fn(),
        getAvailableSupervisors: vi.fn(),
        getAllOperatingRooms: vi.fn(),
        getAllSectors: vi.fn(),
        getAllSupervisionRules: vi.fn()
    }
}));

describe('Workflow de planification du bloc opératoire', () => {
    // Données pour les tests
    const mockDate = new Date('2023-06-15');

    const mockRooms = [
        { id: 'room1', numero: '101', secteurId: 'sector1', nom: 'Salle A', estActif: true },
        { id: 'room2', numero: '102', secteurId: 'sector1', nom: 'Salle B', estActif: true },
        { id: 'room3', numero: '103', secteurId: 'sector2', nom: 'Salle C', estActif: true }
    ];

    const mockSectors = [
        { id: 'sector1', nom: 'Orthopédie', couleur: '#FF0000', salles: ['room1', 'room2'], estActif: true },
        { id: 'sector2', nom: 'Cardiologie', couleur: '#0000FF', salles: ['room3'], estActif: true }
    ];

    const mockSupervisors = [
        { id: 'user1', firstName: 'Jean', lastName: 'Dupont', role: 'MAR' },
        { id: 'user2', firstName: 'Marie', lastName: 'Durand', role: 'MAR' }
    ];

    const mockRules = [
        {
            id: 'rule1',
            nom: 'Max 2 salles par MAR',
            type: 'BASIQUE',
            conditions: { maxSallesParMAR: 2 },
            estActif: true,
            priorite: 1
        }
    ];

    const mockPlanning = {
        id: 'planning1',
        date: '2023-06-15',
        salles: [],
        validationStatus: 'BROUILLON'
    };

    // Configuration des mocks avant chaque test
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock des réponses du service
        blocPlanningService.getDayPlanning.mockResolvedValue(mockPlanning);
        blocPlanningService.validateDayPlanning.mockResolvedValue({ isValid: true, errors: [], warnings: [], infos: [] });
        blocPlanningService.saveDayPlanning.mockImplementation(planning => Promise.resolve(planning));
        blocPlanningService.getAvailableSupervisors.mockResolvedValue(mockSupervisors);
        blocPlanningService.getAllOperatingRooms.mockResolvedValue(mockRooms);
        blocPlanningService.getAllSectors.mockResolvedValue(mockSectors);
        blocPlanningService.getAllSupervisionRules.mockResolvedValue(mockRules);
    });

    test('permet la création et la validation d\'un planning journalier', async () => {
        // Mock de la fonction onPlanningChange
        const onPlanningChange = vi.fn();

        // Rendu du composant
        render(
            <BlocPlanningEditor
                date={mockDate}
                planning={null}
                salles={mockRooms}
                secteurs={mockSectors}
                rules={mockRules}
                onPlanningChange={onPlanningChange}
            />
        );

        // Attendre que le composant soit chargé
        await waitFor(() => {
            expect(blocPlanningService.getAvailableSupervisors).toHaveBeenCalledWith('2023-06-15');
        });

        // Vérifier que le composant affiche le titre
        expect(screen.getByText(/Planning du bloc/i)).toBeInTheDocument();

        // Ajouter une salle au planning
        fireEvent.click(screen.getByText(/Ajouter une salle/i));

        // Sélectionner la salle à ajouter
        const selectSalle = screen.getByLabelText(/Sélectionner une salle/i);
        fireEvent.change(selectSalle, { target: { value: 'room1' } });

        // Vérifier que onPlanningChange a été appelé avec un planning mis à jour
        await waitFor(() => {
            expect(onPlanningChange).toHaveBeenCalled();

            // Vérifier que le planning a été mis à jour avec la nouvelle salle
            const updatedPlanning = onPlanningChange.mock.calls[onPlanningChange.mock.calls.length - 1][0];
            expect(updatedPlanning.salles).toHaveLength(1);
            expect(updatedPlanning.salles[0].salleId).toBe('room1');
        });

        // Ajouter un superviseur à la salle
        fireEvent.click(screen.getByText(/Ajouter un superviseur/i));

        // Sélectionner le superviseur
        const selectSuperviseur = screen.getAllByPlaceholderText(/Sélectionner un médecin/i)[0];
        fireEvent.change(selectSuperviseur, { target: { value: 'user1' } });

        // Vérifier que onPlanningChange a été appelé avec un planning mis à jour
        await waitFor(() => {
            const updatedPlanning = onPlanningChange.mock.calls[onPlanningChange.mock.calls.length - 1][0];
            expect(updatedPlanning.salles[0].superviseurs).toHaveLength(1);
            expect(updatedPlanning.salles[0].superviseurs[0].userId).toBe('user1');
        });

        // Valider le planning
        fireEvent.click(screen.getByText(/Valider le planning/i));

        // Vérifier que validateDayPlanning a été appelé
        await waitFor(() => {
            expect(blocPlanningService.validateDayPlanning).toHaveBeenCalled();
        });
    });

    test('affiche les erreurs de validation du planning', async () => {
        // Configurer le mock pour échouer à la validation
        blocPlanningService.validateDayPlanning.mockResolvedValue({
            isValid: false,
            errors: [
                { code: 'MAX_SALLES_MAR', message: 'Le MAR supervise trop de salles simultanément' }
            ],
            warnings: [],
            infos: []
        });

        // Rendu du composant avec un planning existant
        render(
            <BlocPlanningEditor
                date={mockDate}
                planning={{
                    id: 'planning1',
                    date: '2023-06-15',
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
                        },
                        {
                            id: 'assignment2',
                            salleId: 'room2',
                            superviseurs: [
                                {
                                    id: 'supervisor2',
                                    userId: 'user1', // Même MAR
                                    role: 'PRINCIPAL',
                                    periodes: [{ debut: '08:00', fin: '18:00' }]
                                }
                            ]
                        },
                        {
                            id: 'assignment3',
                            salleId: 'room3',
                            superviseurs: [
                                {
                                    id: 'supervisor3',
                                    userId: 'user1', // Même MAR encore
                                    role: 'PRINCIPAL',
                                    periodes: [{ debut: '08:00', fin: '18:00' }]
                                }
                            ]
                        }
                    ],
                    validationStatus: 'BROUILLON'
                }}
                salles={mockRooms}
                secteurs={mockSectors}
                rules={mockRules}
                onPlanningChange={vi.fn()}
            />
        );

        // Valider le planning
        fireEvent.click(screen.getByText(/Valider le planning/i));

        // Vérifier que validateDayPlanning a été appelé
        await waitFor(() => {
            expect(blocPlanningService.validateDayPlanning).toHaveBeenCalled();
        });

        // Vérifier que les erreurs sont affichées
        await waitFor(() => {
            expect(screen.getByText(/Le MAR supervise trop de salles simultanément/i)).toBeInTheDocument();
        });
    });
}); 