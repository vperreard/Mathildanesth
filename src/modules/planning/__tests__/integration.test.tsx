import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlanningView } from '../components/PlanningView';
import { PlanningGeneratorService } from '../services/PlanningGeneratorService';
import { User, UserRole, ExperienceLevel } from '@/types/user';
import { AssignmentStatus } from '@/types/assignment';
import { ShiftType } from '@/types/common';
import { RulesConfiguration } from '@/types/rules';
import { toast } from 'react-toastify';

// Mock de react-toastify
jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn()
    }
}));

describe('Intégration Planning', () => {
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
            maxAstreintesMois: 5
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
            [ShiftType.GARDE_24H]: '08:00',
            [ShiftType.ASTREINTE]: '08:00',
            [ShiftType.JOUR]: '08:00',
            [ShiftType.ASTREINTE_SEMAINE]: '08:00',
            [ShiftType.ASTREINTE_WEEKEND]: '08:00',
            [ShiftType.URGENCE]: '08:00',
            [ShiftType.CONSULTATION]: '09:00'
        },
        shiftEndTimes: {
            [ShiftType.MATIN]: '14:00',
            [ShiftType.APRES_MIDI]: '20:00',
            [ShiftType.NUIT]: '08:00',
            [ShiftType.GARDE_WEEKEND]: '20:00',
            [ShiftType.GARDE_24H]: '20:00',
            [ShiftType.ASTREINTE]: '20:00',
            [ShiftType.JOUR]: '20:00',
            [ShiftType.ASTREINTE_SEMAINE]: '20:00',
            [ShiftType.ASTREINTE_WEEKEND]: '20:00',
            [ShiftType.URGENCE]: '20:00',
            [ShiftType.CONSULTATION]: '13:00'
        },
        shiftSpecialties: {
            [ShiftType.MATIN]: ['Anesthésie'],
            [ShiftType.APRES_MIDI]: ['Anesthésie'],
            [ShiftType.NUIT]: ['Anesthésie', 'Réanimation'],
            [ShiftType.GARDE_WEEKEND]: ['Anesthésie', 'Réanimation'],
            [ShiftType.GARDE_24H]: ['Anesthésie', 'Réanimation'],
            [ShiftType.ASTREINTE]: ['Anesthésie', 'Réanimation'],
            [ShiftType.JOUR]: ['Anesthésie'],
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
    });

    it('devrait générer et valider un planning complet', async () => {
        // 1. Générer le planning avec le service
        const service = new PlanningGeneratorService(mockUsers, mockRules, startDate, endDate);
        const assignments = service.generatePlanning();
        const validation = service.validatePlanning();

        // 2. Vérifier que le planning est valide
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);

        // 3. Rendre le composant avec le planning généré
        render(
            <PlanningView
                users={mockUsers}
                rules={mockRules}
                startDate={startDate}
                endDate={endDate}
                onSave={mockOnSave}
            />
        );

        // 4. Vérifier que le planning est affiché correctement
        const generateButton = screen.getByText('Générer le planning');
        fireEvent.click(generateButton);

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Planning généré avec succès');
        });

        // 5. Vérifier que les affectations sont affichées pour chaque utilisateur
        mockUsers.forEach(user => {
            const userAssignments = assignments.filter(a => a.userId === user.id);
            expect(userAssignments.length).toBeGreaterThan(0);
        });

        // 6. Sauvegarder le planning
        const saveButton = screen.getByText('Sauvegarder');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith('Planning sauvegardé avec succès');
        });
    });

    it('devrait gérer les erreurs de validation', async () => {
        // 1. Créer un planning invalide
        const service = new PlanningGeneratorService(mockUsers, mockRules, startDate, endDate);
        const assignments = service.generatePlanning();

        // Modifier le planning pour le rendre invalide
        if (assignments.length >= 2) {
            assignments[1].startDate = new Date(assignments[0].endDate);
        }

        // 2. Vérifier que le planning est invalide
        const validation = service.validatePlanning();
        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);

        // 3. Rendre le composant
        render(
            <PlanningView
                users={mockUsers}
                rules={mockRules}
                startDate={startDate}
                endDate={endDate}
                onSave={mockOnSave}
            />
        );

        // 4. Générer le planning
        const generateButton = screen.getByText('Générer le planning');
        fireEvent.click(generateButton);

        // 5. Vérifier que les erreurs sont affichées
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Le planning généré contient des erreurs');
        });
    });

    it('devrait respecter les contraintes de spécialité', async () => {
        // 1. Créer un utilisateur sans la spécialité requise
        const userWithoutSpecialty: User = {
            id: '3',
            prenom: 'Pierre',
            nom: 'Durand',
            email: 'pierre.durand@example.com',
            role: UserRole.DOCTOR,
            specialties: ['Autre spécialité'],
            experienceLevel: ExperienceLevel.JUNIOR,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const usersWithInvalidSpecialty = [...mockUsers, userWithoutSpecialty];

        // 2. Générer le planning
        const service = new PlanningGeneratorService(usersWithInvalidSpecialty, mockRules, startDate, endDate);
        const assignments = service.generatePlanning();

        // 3. Vérifier que l'utilisateur sans spécialité n'est pas assigné
        const invalidUserAssignments = assignments.filter(a => a.userId === userWithoutSpecialty.id);
        expect(invalidUserAssignments.length).toBe(0);

        // 4. Rendre le composant
        render(
            <PlanningView
                users={usersWithInvalidSpecialty}
                rules={mockRules}
                startDate={startDate}
                endDate={endDate}
                onSave={mockOnSave}
            />
        );

        // 5. Vérifier que le planning est généré correctement
        const generateButton = screen.getByText('Générer le planning');
        fireEvent.click(generateButton);

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Planning généré avec succès');
        });
    });
}); 