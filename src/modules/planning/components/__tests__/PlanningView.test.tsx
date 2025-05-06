// @ts-nocheck
/* 
 * Ce fichier utilise @ts-nocheck pour contourner temporairement les problèmes de typage
 * liés aux assertions Jest comme toBeInTheDocument, toHaveBeenCalled, etc.
 * Une meilleure solution serait d'étendre correctement les types de Jest.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlanningView } from '../PlanningView';
import { User, UserRole, ExperienceLevel } from '@/types/user';
import { ShiftType } from '@/types/common';
import { AssignmentStatus, Assignment } from '@/types/assignment';
import { RulesConfiguration } from '@/types/rules';
import { toast } from 'react-toastify';

// Mock de react-toastify
jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn()
    }
}));

// Variables pour contrôler le comportement des mocks
let mockValidationResult = { isValid: true, errors: [] };

// Mock PlanningGeneratorService
jest.mock('../../services/PlanningGeneratorService', () => {
    return {
        PlanningGeneratorService: jest.fn().mockImplementation(() => {
            return {
                generatePlanning: jest.fn().mockImplementation(() => {
                    return [
                        {
                            id: '1',
                            userId: '1',
                            startDate: '2024-03-01T08:00:00Z',
                            endDate: '2024-03-01T20:00:00Z',
                            shiftType: ShiftType.GARDE_WEEKEND,
                            status: AssignmentStatus.APPROVED
                        },
                        {
                            id: '2',
                            userId: '2',
                            startDate: '2024-03-02T08:00:00Z',
                            endDate: '2024-03-02T20:00:00Z',
                            shiftType: ShiftType.GARDE_WEEKEND,
                            status: AssignmentStatus.APPROVED
                        }
                    ];
                }),
                validatePlanning: jest.fn().mockImplementation(() => {
                    return mockValidationResult;
                })
            };
        })
    };
});

describe('PlanningView', () => {
    // Données de test
    const mockUsers: User[] = [
        {
            id: '1',
            prenom: 'Jean',
            nom: 'Dupont',
            email: 'jean.dupont@example.com',
            role: UserRole.DOCTOR,
            specialties: ['Anesthésie'],
            experienceLevel: ExperienceLevel.SENIOR,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: '2',
            prenom: 'Marie',
            nom: 'Martin',
            email: 'marie.martin@example.com',
            role: UserRole.DOCTOR,
            specialties: ['Anesthésie', 'Réanimation'],
            experienceLevel: ExperienceLevel.EXPERT,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];

    const mockRules: RulesConfiguration = {
        intervalle: {
            minJoursEntreGardes: 7,
            minJoursRecommandes: 21,
            maxGardesMois: 3,
            maxGardesConsecutives: 1,
            maxAstreintesMois: 4
        },
        supervision: {
            maxSallesParMAR: {
                'standard': 2,
                'ophtalmologie': 3,
                'endoscopie': 2
            },
            maxSallesExceptionnel: 3,
            reglesSecteursCompatibles: {
                'standard': ['standard'],
                'ophtalmologie': ['ophtalmologie', 'standard'],
                'endoscopie': ['endoscopie']
            }
        },
        consultations: {
            maxParSemaine: 2,
            equilibreMatinApresMidi: true
        },
        equite: {
            poidsGardesWeekend: 1.5,
            poidsGardesFeries: 2,
            equilibrageSpecialites: true
        },
        qualiteVie: {
            poidsPreferences: 0.5,
            eviterConsecutifs: true,
            recuperationApresGardeNuit: true
        },
        weekdayShifts: [ShiftType.MATIN, ShiftType.APRES_MIDI, ShiftType.NUIT],
        weekendShifts: [ShiftType.GARDE_WEEKEND],
        minimumRestPeriod: 12,
        shiftStartTimes: {
            [ShiftType.MATIN]: '08:00',
            [ShiftType.APRES_MIDI]: '14:00',
            [ShiftType.NUIT]: '20:00',
            [ShiftType.GARDE_WEEKEND]: '08:00',
            [ShiftType.JOUR]: '08:00',
            [ShiftType.ASTREINTE]: '08:00',
            [ShiftType.GARDE_24H]: '08:00',
            [ShiftType.ASTREINTE_SEMAINE]: '08:00',
            [ShiftType.ASTREINTE_WEEKEND]: '08:00',
            [ShiftType.URGENCE]: '08:00',
            [ShiftType.CONSULTATION]: '08:00'
        },
        shiftEndTimes: {
            [ShiftType.MATIN]: '14:00',
            [ShiftType.APRES_MIDI]: '20:00',
            [ShiftType.NUIT]: '08:00',
            [ShiftType.GARDE_WEEKEND]: '20:00',
            [ShiftType.JOUR]: '20:00',
            [ShiftType.ASTREINTE]: '20:00',
            [ShiftType.GARDE_24H]: '08:00',
            [ShiftType.ASTREINTE_SEMAINE]: '20:00',
            [ShiftType.ASTREINTE_WEEKEND]: '20:00',
            [ShiftType.URGENCE]: '20:00',
            [ShiftType.CONSULTATION]: '14:00'
        },
        shiftSpecialties: {
            [ShiftType.MATIN]: ['Anesthésie'],
            [ShiftType.APRES_MIDI]: ['Anesthésie'],
            [ShiftType.NUIT]: ['Anesthésie', 'Réanimation'],
            [ShiftType.GARDE_WEEKEND]: ['Anesthésie', 'Réanimation'],
            [ShiftType.JOUR]: ['Anesthésie', 'Réanimation'],
            [ShiftType.ASTREINTE]: ['Anesthésie', 'Réanimation'],
            [ShiftType.GARDE_24H]: ['Anesthésie', 'Réanimation'],
            [ShiftType.ASTREINTE_SEMAINE]: ['Anesthésie', 'Réanimation'],
            [ShiftType.ASTREINTE_WEEKEND]: ['Anesthésie', 'Réanimation'],
            [ShiftType.URGENCE]: ['Urgences'],
            [ShiftType.CONSULTATION]: ['Anesthésie']
        },
        maxAssignmentDeviation: 2
    };

    const startDate = new Date('2024-03-01');
    const endDate = new Date('2024-03-07');
    const mockOnSave = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        // Réinitialiser les valeurs par défaut pour les mocks
        mockValidationResult = { isValid: true, errors: [] };
    });

    it('devrait rendre le composant correctement', () => {
        render(
            <PlanningView
                users={mockUsers}
                rules={mockRules}
                startDate={startDate}
                endDate={endDate}
                onSave={mockOnSave}
            />
        );

        expect(screen.getByText('Planning')).toBeInTheDocument();
        expect(screen.getByText('Générer le planning')).toBeInTheDocument();
        expect(screen.getByText('Sauvegarder')).toBeInTheDocument();
    });

    it('devrait afficher les utilisateurs', () => {
        render(
            <PlanningView
                users={mockUsers}
                rules={mockRules}
                startDate={startDate}
                endDate={endDate}
                onSave={mockOnSave}
            />
        );

        expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
        expect(screen.getByText('Marie Martin')).toBeInTheDocument();
    });

    it('devrait gérer la génération du planning', async () => {
        render(
            <PlanningView
                users={mockUsers}
                rules={mockRules}
                startDate={startDate}
                endDate={endDate}
                onSave={mockOnSave}
            />
        );

        const generateButton = screen.getByText('Générer le planning');
        fireEvent.click(generateButton);

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Planning généré avec succès');
        });
    });

    it('devrait gérer la sauvegarde du planning', async () => {
        render(
            <PlanningView
                users={mockUsers}
                rules={mockRules}
                startDate={startDate}
                endDate={endDate}
                onSave={mockOnSave}
            />
        );

        // Générer d'abord le planning
        const generateButton = screen.getByText('Générer le planning');
        fireEvent.click(generateButton);

        // Attendre que le planning soit généré
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Planning généré avec succès');
        });

        // Puis sauvegarder
        const saveButton = screen.getByText('Sauvegarder');
        expect(saveButton).not.toBeDisabled();
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith('Planning sauvegardé avec succès');
        });
    });

    it('devrait afficher les erreurs de validation', async () => {
        // Configurer le mock pour retourner une erreur
        mockValidationResult = {
            isValid: false,
            errors: ['Conflit détecté pour Jean Dupont']
        };

        render(
            <PlanningView
                users={mockUsers}
                rules={mockRules}
                startDate={startDate}
                endDate={endDate}
                onSave={mockOnSave}
            />
        );

        const generateButton = screen.getByText('Générer le planning');
        fireEvent.click(generateButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Le planning généré contient des erreurs');
        });
    });

    it('devrait désactiver le bouton de sauvegarde quand il n\'y a pas de planning', () => {
        render(
            <PlanningView
                users={mockUsers}
                rules={mockRules}
                startDate={startDate}
                endDate={endDate}
                onSave={mockOnSave}
            />
        );

        const saveButton = screen.getByText('Sauvegarder');
        expect(saveButton).toBeDisabled();
    });
}); 