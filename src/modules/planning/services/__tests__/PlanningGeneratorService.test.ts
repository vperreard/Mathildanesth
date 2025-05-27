import { PlanningGeneratorService } from '../PlanningGeneratorService';
import { User, UserRole, ExperienceLevel, LeaveType, LeaveStatus } from '@/types/user';
import { AssignmentStatus } from '@/types/assignment';
import { ShiftType } from '@/types/common';
import { RulesConfiguration } from '@/types/rules';
import { Specialty } from '@/types/specialty';
import { addDays, format, isSameDay, isWeekend, isWithinInterval, areIntervalsOverlapping } from 'date-fns';
import { fr } from 'date-fns/locale';

describe('PlanningGeneratorService', () => {
    // Définition globale des règles et dates
    const mockRulesBase: RulesConfiguration = { // Renommer pour clarté, car on ajuste dans beforeEach
        intervalle: { minJoursEntreGardes: 7, minJoursRecommandes: 21, maxGardesMois: 3, maxGardesConsecutives: 1 },
        supervision: { maxSallesParMAR: { 'standard': 2, 'ophtalmologie': 3, 'endoscopie': 2 }, maxSallesExceptionnel: 3, reglesSecteursCompatibles: { /* ... */ } },
        consultations: { maxParSemaine: 2, equilibreMatinApresMidi: true },
        equite: { poidsGardesWeekend: 1.5, poidsGardesFeries: 2, equilibrageSpecialites: true },
        qualiteVie: { poidsPreferences: 0.5, eviterConsecutifs: true, recuperationApresGardeNuit: true }, // Garder recup post-garde ici ?

        // ---- Mise à jour selon les règles réelles ----
        weekdayShifts: [ShiftType.MATIN, ShiftType.APRES_MIDI],
        weekendShifts: [ShiftType.GARDE_24H, ShiftType.ASTREINTE],
        minimumRestPeriod: 12, // Règle de base, sera ajustée dans beforeEach
        shiftStartTimes: {
            [ShiftType.MATIN]: '08:00',
            [ShiftType.APRES_MIDI]: '13:30',
            [ShiftType.GARDE_24H]: '08:00',
            [ShiftType.ASTREINTE]: '08:00'
        },
        shiftEndTimes: {
            [ShiftType.MATIN]: '13:00',
            [ShiftType.APRES_MIDI]: '18:30',
            [ShiftType.GARDE_24H]: '08:00', // Fin le lendemain
            [ShiftType.ASTREINTE]: '08:00'  // Fin le lendemain
        },
        shiftSpecialties: {
            [ShiftType.MATIN]: [Specialty.ANESTHESIE],
            [ShiftType.APRES_MIDI]: [Specialty.ANESTHESIE],
            [ShiftType.GARDE_24H]: [Specialty.ANESTHESIE, Specialty.REANIMATION],
            [ShiftType.ASTREINTE]: [Specialty.ANESTHESIE, Specialty.REANIMATION]
        },
        // -------------------------------------------
        maxAssignmentDeviation: 2
    };
    const startDate = new Date('2024-03-01');
    const endDate = new Date('2024-03-07');

    let service: PlanningGeneratorService;
    let adjustedRules: RulesConfiguration;
    let currentTestUsers: User[]; // Variable pour stocker les utilisateurs du test courant

    beforeEach(() => {
    jest.clearAllMocks();
        // --- Initialisation pour chaque test --- 

        // 1. Définition des utilisateurs DANS le beforeEach pour garantir fraîcheur
        currentTestUsers = [
            {
                id: '1',
                prenom: 'Jean',
                nom: 'Dupont',
                email: 'jean.dupont@example.com',
                role: UserRole.DOCTOR,
                specialties: [Specialty.ANESTHESIE],
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
                specialties: [Specialty.ANESTHESIE, Specialty.REANIMATION],
                experienceLevel: ExperienceLevel.EXPERT,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        // 2. Copie et ajustement des règles
        adjustedRules = JSON.parse(JSON.stringify(mockRulesBase));
        adjustedRules.minimumRestPeriod = 0;
        adjustedRules.intervalle.maxGardesConsecutives = 2;
        adjustedRules.intervalle.minJoursEntreGardes = 1;

        // 3. Création d'une nouvelle instance du service avec des données fraîches
        service = new PlanningGeneratorService(currentTestUsers, adjustedRules, startDate, endDate);
    });

    describe('generatePlanning', () => {
        it('devrait générer un planning valide', () => {
            const assignments = service.generatePlanning();
            expect(assignments).toBeDefined();
            expect(assignments.length).toBeGreaterThan(0);
        });

        it('devrait respecter les périodes de repos', () => {
            service.generatePlanning();
            const validation = service.validatePlanning();
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        it('devrait respecter les spécialités requises', () => {
            const assignments = service.generatePlanning();
            assignments.forEach(assignment => {
                const user = currentTestUsers.find(u => u.id === assignment.userId); // Utiliser les users du test courant
                const requiredSpecialties = adjustedRules.shiftSpecialties[assignment.shiftType];
                expect(user).toBeDefined();
                const userSpecialties = user?.specialties || [];
                const hasRequiredSpecialty = userSpecialties.some(specialty =>
                    requiredSpecialties.includes(specialty)
                );
                expect(hasRequiredSpecialty).toBe(true);
            });
        });

        it('devrait utiliser le système de fallback quand peu d\'utilisateurs disponibles', () => {
            // Créer des utilisateurs spécifiques pour ce test AVEC CONGES
            const usersForThisTest = [
                {
                    id: '1', prenom: 'Jean', nom: 'Dupont', email: 'a@a.com', role: UserRole.DOCTOR, specialties: [Specialty.ANESTHESIE], experienceLevel: ExperienceLevel.SENIOR, createdAt: new Date(), updatedAt: new Date(),
                    leaves: [{ id: 'l1', userId: '1', startDate: startDate, endDate: addDays(startDate, 3), type: LeaveType.VACATION, status: LeaveStatus.APPROVED, createdAt: new Date(), updatedAt: new Date() }]
                },
                {
                    id: '2', prenom: 'Marie', nom: 'Martin', email: 'b@b.com', role: UserRole.DOCTOR, specialties: [Specialty.ANESTHESIE, Specialty.REANIMATION], experienceLevel: ExperienceLevel.EXPERT, createdAt: new Date(), updatedAt: new Date(),
                    leaves: []
                }
            ];

            // Utiliser les adjustedRules
            const serviceWithPartiallyAvailableUsers = new PlanningGeneratorService(
                usersForThisTest,
                adjustedRules,
                startDate,
                endDate
            );

            // Le planning devrait être généré grâce au système de fallback
            const assignments = serviceWithPartiallyAvailableUsers.generatePlanning();
            expect(assignments).toBeDefined();
            expect(assignments.length).toBeGreaterThan(0);
            
            // Vérifier que le fallback a été utilisé (Marie devrait avoir plus d'affectations)
            const marieAssignments = assignments.filter(a => a.userId === '2');
            const jeanAssignments = assignments.filter(a => a.userId === '1');
            expect(marieAssignments.length).toBeGreaterThan(jeanAssignments.length);
        });
    });

    describe('validatePlanning', () => {
        it('devrait détecter les périodes de repos insuffisantes', () => {
            const assignments = service.generatePlanning();
            if (assignments.length >= 2) {
                assignments[1].startDate = addDays(assignments[0].endDate, 1);
            }
            const validation = service.validatePlanning();
            expect(validation.isValid).toBe(false);
            expect(validation.errors.some(e => e.includes('Période de repos insuffisante'))).toBe(true);
        });

        it('devrait détecter les shifts non couverts', () => {
            const assignments = service.generatePlanning();
            assignments.pop();
            const validation = service.validatePlanning();
            expect(validation.isValid).toBe(false);
            expect(validation.errors.some(e => e.includes('non couvert'))).toBe(true);
        });

        /* // TODO: Réactiver et ajuster la logique/règle d'équité
        it('devrait détecter les problèmes d\'équité', () => {
            const assignments = service.generatePlanning();
            assignments.forEach((assignment, index) => {
                if (index % 2 === 0) {
                    assignment.userId = currentTestUsers[0].id;
                }
            });
            const validation = service.validatePlanning();
            // Mettre une règle d'équité plus stricte dans adjustedRules pour ce test si nécessaire
            // adjustedRules.maxAssignmentDeviation = 0.1;
            // service = new PlanningGeneratorService(currentTestUsers, adjustedRules, startDate, endDate);
            // service.generatePlanning(); // Regenerate with stricter rules if needed for validation check
            expect(validation.isValid).toBe(false);
            expect(validation.errors.some(e => e.includes('Problème d\'équité') || e.includes('Nombre d\'assignations anormal'))).toBe(true);
        });
        */
    });
}); 