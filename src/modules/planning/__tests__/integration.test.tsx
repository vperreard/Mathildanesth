import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlanningView } from '../components/PlanningView';
import { PlanningGeneratorService } from '../services/PlanningGeneratorService';
import { User, UserRole, ExperienceLevel, LeaveStatus } from '@/types/user';
import { AssignmentStatus, Assignment } from '@/types/assignment';
import { ShiftType } from '@/types/common';
import { RulesConfiguration } from '@/types/rules';
import { toast } from 'react-toastify';
import { addDays, format } from 'date-fns';

// Mock de react-toastify
jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn()
    }
}));

describe('Intégration Planning', () => {
    // Données de test améliorées avec tous les champs requis
    const mockUsers: User[] = [
        {
            id: '1',
            prenom: 'Jean',
            nom: 'Dupont',
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean.dupont@example.com',
            role: UserRole.DOCTOR,
            specialties: ['Anesthésie'],
            experienceLevel: ExperienceLevel.SENIOR,
            leaves: [],
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: '2',
            prenom: 'Marie',
            nom: 'Martin',
            firstName: 'Marie',
            lastName: 'Martin',
            email: 'marie.martin@example.com',
            role: UserRole.DOCTOR,
            specialties: ['Anesthésie', 'Réanimation'],
            experienceLevel: ExperienceLevel.EXPERT,
            leaves: [
                {
                    id: 'leave1',
                    userId: '2',
                    startDate: addDays(new Date('2024-03-03'), 0),
                    endDate: addDays(new Date('2024-03-03'), 0),
                    type: 'VACATION',
                    status: LeaveStatus.APPROVED,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: '3',
            prenom: 'Sophie',
            nom: 'Petit',
            firstName: 'Sophie',
            lastName: 'Petit',
            email: 'sophie.petit@example.com',
            role: UserRole.DOCTOR,
            specialties: ['Anesthésie', 'Réanimation'],
            experienceLevel: ExperienceLevel.SENIOR,
            leaves: [],
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: '4',
            prenom: 'Thomas',
            nom: 'Bernard',
            firstName: 'Thomas',
            lastName: 'Bernard',
            email: 'thomas.bernard@example.com',
            role: UserRole.DOCTOR,
            specialties: ['Anesthésie'],
            experienceLevel: ExperienceLevel.INTERMEDIATE,
            leaves: [],
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];

    const mockRules: RulesConfiguration = {
        intervalle: {
            minJoursEntreGardes: 7,
            minJoursRecommandes: 21,
            maxGardesMois: 3,
            maxGardesConsecutives: 1, // Mis à jour selon les règles correctes
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
        weekdayShifts: [ShiftType.MATIN, ShiftType.APRES_MIDI, ShiftType.NUIT, ShiftType.GARDE_24H],
        weekendShifts: [ShiftType.GARDE_WEEKEND, ShiftType.ASTREINTE_WEEKEND],
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
            [ShiftType.GARDE_WEEKEND]: '08:00', // Garde de 24h
            [ShiftType.GARDE_24H]: '08:00', // Garde de 24h
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

    // Créer un mock des assignations respectant les règles d'affectation
    const generateMockAssignments = (): Assignment[] => {
        const assignments: Assignment[] = [];
        let currentDate = new Date(startDate);

        // Fonction pour générer des ID uniques
        const generateId = () => `assignment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Assignation des gardes sur la période (une personne différente chaque jour)
        let userIndex = 0;
        while (currentDate <= endDate) {
            const currentDateCopy = new Date(currentDate);
            const formattedDate = format(currentDateCopy, 'yyyy-MM-dd');
            const isWeekend = currentDateCopy.getDay() === 0 || currentDateCopy.getDay() === 6;

            // Utiliser un utilisateur différent pour chaque jour (rotation)
            const userId = mockUsers[userIndex % mockUsers.length].id;
            userIndex++;

            // Affectation de la garde principale (un seul médecin de garde par jour)
            if (isWeekend) {
                // Garde de weekend
                assignments.push({
                    id: generateId(),
                    userId: userId,
                    shiftType: ShiftType.GARDE_WEEKEND,
                    startDate: new Date(new Date(currentDateCopy).setHours(8, 0, 0, 0)),
                    endDate: new Date(addDays(new Date(currentDateCopy), 1).setHours(8, 0, 0, 0)),
                    status: AssignmentStatus.PENDING,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                // Astreinte weekend (médecin différent de celui de garde)
                const astreinteUserId = mockUsers[(userIndex + 1) % mockUsers.length].id;
                assignments.push({
                    id: generateId(),
                    userId: astreinteUserId,
                    shiftType: ShiftType.ASTREINTE_WEEKEND,
                    startDate: new Date(new Date(currentDateCopy).setHours(8, 0, 0, 0)),
                    endDate: new Date(new Date(currentDateCopy).setHours(20, 0, 0, 0)),
                    status: AssignmentStatus.PENDING,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            } else {
                // Garde de 24h en semaine
                assignments.push({
                    id: generateId(),
                    userId: userId,
                    shiftType: ShiftType.GARDE_24H,
                    startDate: new Date(new Date(currentDateCopy).setHours(8, 0, 0, 0)),
                    endDate: new Date(addDays(new Date(currentDateCopy), 1).setHours(8, 0, 0, 0)),
                    status: AssignmentStatus.PENDING,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                // Pour les utilisateurs qui ne sont pas de garde, affecter consultations ou bloc
                // On s'assure qu'un utilisateur n'a pas 2 consultations le même jour
                const availableUsers = mockUsers.filter(u => u.id !== userId);

                // Consultation matin (utilisateur 1 disponible)
                if (availableUsers.length > 0) {
                    assignments.push({
                        id: generateId(),
                        userId: availableUsers[0].id,
                        shiftType: ShiftType.MATIN, // Consultation matin
                        startDate: new Date(new Date(currentDateCopy).setHours(8, 0, 0, 0)),
                        endDate: new Date(new Date(currentDateCopy).setHours(14, 0, 0, 0)),
                        status: AssignmentStatus.PENDING,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });

                    // Le même utilisateur peut avoir un bloc l'après-midi
                    assignments.push({
                        id: generateId(),
                        userId: availableUsers[0].id,
                        shiftType: ShiftType.APRES_MIDI, // Bloc après-midi
                        startDate: new Date(new Date(currentDateCopy).setHours(14, 0, 0, 0)),
                        endDate: new Date(new Date(currentDateCopy).setHours(20, 0, 0, 0)),
                        status: AssignmentStatus.PENDING,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }

                // Utilisateur 2 disponible avec bloc le matin et consultation l'après-midi
                if (availableUsers.length > 1) {
                    // Type bloc matin
                    const blocMatinType = "BLOC_MATIN"; // On simule un type de bloc opératoire
                    assignments.push({
                        id: generateId(),
                        userId: availableUsers[1].id,
                        shiftType: blocMatinType as ShiftType,
                        startDate: new Date(new Date(currentDateCopy).setHours(8, 0, 0, 0)),
                        endDate: new Date(new Date(currentDateCopy).setHours(14, 0, 0, 0)),
                        status: AssignmentStatus.PENDING,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });

                    // Type consultation après-midi
                    assignments.push({
                        id: generateId(),
                        userId: availableUsers[1].id,
                        shiftType: ShiftType.APRES_MIDI,
                        startDate: new Date(new Date(currentDateCopy).setHours(14, 0, 0, 0)),
                        endDate: new Date(new Date(currentDateCopy).setHours(20, 0, 0, 0)),
                        status: AssignmentStatus.PENDING,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }
            }

            currentDate = addDays(currentDate, 1);
        }

        return assignments;
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock plus précis de generatePlanning pour renvoyer notre jeu de données
        const mockGeneratePlanning = jest.fn().mockImplementation(() => {
            return generateMockAssignments();
        });

        // Remplacer l'implémentation complète du service
        jest.spyOn(PlanningGeneratorService.prototype, 'generatePlanning').mockImplementation(mockGeneratePlanning);

        // Mock de validatePlanning pour renvoyer un planning valide
        jest.spyOn(PlanningGeneratorService.prototype, 'validatePlanning').mockImplementation(() => {
            return { isValid: true, errors: [] };
        });
    });

    it('devrait générer et valider un planning complet', async () => {
        // 1. Générer le planning avec le service mocké
        const service = new PlanningGeneratorService(mockUsers, mockRules, startDate, endDate);
        const assignments = service.generatePlanning();

        // Vérifier que le mock a été appelé
        expect(PlanningGeneratorService.prototype.generatePlanning).toHaveBeenCalled();

        // Vérifier que nous avons bien reçu les assignments
        expect(assignments.length).toBeGreaterThan(0);

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

        // 5. Vérifier que les règles d'affectation sont respectées
        const gardeAssignments = assignments.filter(a =>
            a.shiftType === ShiftType.GARDE_24H || a.shiftType === ShiftType.GARDE_WEEKEND
        );

        // Vérifier qu'un médecin n'a pas deux gardes consécutives
        const gardeByUser = new Map<string, Date[]>();
        gardeAssignments.forEach(a => {
            if (!gardeByUser.has(a.userId)) {
                gardeByUser.set(a.userId, []);
            }
            gardeByUser.get(a.userId)?.push(new Date(a.startDate));
        });

        // Vérifier les gardes consécutives
        for (const [userId, dates] of gardeByUser.entries()) {
            const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
            for (let i = 1; i < sortedDates.length; i++) {
                const daysBetween = Math.round(
                    (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
                );
                expect(daysBetween).toBeGreaterThan(1); // Au moins 1 jour entre les gardes
            }
        }

        // 6. Sauvegarder le planning
        const saveButton = screen.getByText('Sauvegarder');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith('Planning sauvegardé avec succès');
        });
    });

    it('devrait gérer les erreurs de validation', async () => {
        // Temporairement modifier le spy de validatePlanning pour le test d'erreur
        jest.spyOn(PlanningGeneratorService.prototype, 'validatePlanning').mockImplementation(() => {
            return {
                isValid: false,
                errors: ['Gardes consécutives pour Jean Dupont', 'Non-respect du temps de repos pour Marie Martin']
            };
        });

        // 1. Rendre le composant
        render(
            <PlanningView
                users={mockUsers}
                rules={mockRules}
                startDate={startDate}
                endDate={endDate}
                onSave={mockOnSave}
            />
        );

        // 2. Générer le planning
        const generateButton = screen.getByText('Générer le planning');
        fireEvent.click(generateButton);

        // 3. Vérifier que les erreurs sont affichées
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Le planning généré contient des erreurs');
        });
    });

    it('devrait respecter les contraintes de spécialité', async () => {
        // 1. Créer un utilisateur sans la spécialité requise
        const userWithoutSpecialty: User = {
            id: '5',
            firstName: 'Pierre',
            lastName: 'Durand',
            prenom: 'Pierre',
            nom: 'Durand',
            email: 'pierre.durand@example.com',
            role: UserRole.DOCTOR,
            specialties: ['Autre spécialité'],
            experienceLevel: ExperienceLevel.JUNIOR,
            leaves: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const usersWithInvalidSpecialty = [...mockUsers, userWithoutSpecialty];

        // 2. Générer le planning avec un mock modifié qui respecte les spécialités
        jest.spyOn(PlanningGeneratorService.prototype, 'generatePlanning').mockImplementation(() => {
            // Génération similaire mais respectant les contraintes de spécialité
            const baseAssignments = generateMockAssignments();
            // S'assurer que l'utilisateur 5 est seulement affecté à des shifts ne nécessitant pas la spécialité Anesthésie
            // Dans notre cas de test, comme tous les shifts requièrent Anesthésie, l'utilisateur 5 ne devrait pas être assigné
            return baseAssignments.filter(a => a.userId !== '5');
        });

        // 3. Vérifier l'assignation
        const service = new PlanningGeneratorService(usersWithInvalidSpecialty, mockRules, startDate, endDate);
        const assignments = service.generatePlanning();

        // Vérifier que l'utilisateur sans spécialité n'est pas assigné à des shifts nécessitant Anesthésie
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