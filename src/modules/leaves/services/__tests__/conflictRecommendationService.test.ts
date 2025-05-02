import { ConflictRecommendationService } from '../conflictRecommendationService';
import {
    ConflictType,
    ConflictSeverity,
    LeaveConflict
} from '../../types/conflict';
import { ConflictPriority, ResolutionStrategy } from '../../types/recommendation';
import { EventBusService } from '@/services/eventBusService';

// Mock des dépendances
jest.mock('@/services/eventBusService');
jest.mock('@/services/errorLoggingService', () => ({
    logError: jest.fn()
}));

describe('ConflictRecommendationService', () => {
    let service: ConflictRecommendationService;
    let mockEventBus: jest.Mocked<EventBusService>;

    beforeEach(() => {
        // Réinitialiser les mocks
        jest.clearAllMocks();

        // Mock de l'EventBusService
        mockEventBus = {
            getInstance: jest.fn().mockReturnThis(),
            emit: jest.fn(),
            subscribe: jest.fn(),
            unsubscribe: jest.fn()
        } as unknown as jest.Mocked<EventBusService>;

        // Injection du mock
        (EventBusService.getInstance as jest.Mock).mockReturnValue(mockEventBus);

        // Obtenir l'instance du service
        service = ConflictRecommendationService.getInstance();
    });

    describe('getInstance', () => {
        it('devrait retourner une instance singleton', () => {
            const instance1 = ConflictRecommendationService.getInstance();
            const instance2 = ConflictRecommendationService.getInstance();

            expect(instance1).toBe(instance2);
        });
    });

    describe('analyzeConflicts', () => {
        const sampleConflicts: LeaveConflict[] = [
            {
                id: 'conflict1',
                leaveId: 'leave1',
                type: ConflictType.USER_LEAVE_OVERLAP,
                severity: ConflictSeverity.AVERTISSEMENT,
                description: 'Chevauchement avec un autre congé',
                startDate: '2025-06-01',
                endDate: '2025-06-07',
                canOverride: true
            },
            {
                id: 'conflict2',
                leaveId: 'leave1',
                type: ConflictType.TEAM_ABSENCE,
                severity: ConflictSeverity.BLOQUANT,
                description: 'Trop de membres de l\'équipe absents',
                startDate: '2025-06-05',
                endDate: '2025-06-10',
                canOverride: false
            }
        ];

        const sampleLeaveRequest = {
            id: 'leave1',
            userId: 'user1',
            startDate: '2025-06-01',
            endDate: '2025-06-07',
            leaveType: 'CONGE_PAYE'
        };

        const sampleUser = {
            id: 'user1',
            name: 'Test User',
            role: 'MEDECIN'
        };

        it('devrait retourner un résultat vide si aucun conflit n\'est fourni', () => {
            const result = service.analyzeConflicts([], sampleLeaveRequest);

            expect(result.recommendations).toHaveLength(0);
            expect(result.automatedResolutionsCount).toBe(0);
            expect(result.manualResolutionsCount).toBe(0);
        });

        it('devrait analyser tous les conflits et générer des recommandations', () => {
            const result = service.analyzeConflicts(sampleConflicts, sampleLeaveRequest, sampleUser);

            // Vérifier que des recommandations ont été générées pour chaque conflit
            expect(result.recommendations).toHaveLength(sampleConflicts.length);

            // Vérifier la structure des recommandations
            result.recommendations.forEach(rec => {
                expect(rec).toHaveProperty('conflictId');
                expect(rec).toHaveProperty('priority');
                expect(rec).toHaveProperty('strategies');
                expect(rec).toHaveProperty('explanation');
                expect(rec.strategies.length).toBeGreaterThan(0);
            });
        });

        it('devrait identifier correctement les résolutions automatiques possibles', () => {
            // Mettre à jour les options pour activer la résolution automatique
            service.updateOptions({
                enableAutoResolution: true,
                rules: {
                    ...service['options'].rules,
                    autoResolutionThresholds: {
                        minConfidence: 60,
                        maxSeverity: ConflictSeverity.AVERTISSEMENT,
                        enabledStrategies: [
                            ResolutionStrategy.APPROVE,
                            ResolutionStrategy.RESCHEDULE_BEFORE,
                            ResolutionStrategy.RESCHEDULE_AFTER
                        ]
                    }
                }
            });

            const result = service.analyzeConflicts(sampleConflicts, sampleLeaveRequest, sampleUser);

            // Le premier conflit est un AVERTISSEMENT, il peut être résolu automatiquement
            // Le second est BLOQUANT, il ne devrait pas être résolu automatiquement
            expect(result.automatedResolutionsCount).toBeGreaterThan(0);
            expect(result.automatedResolutionsCount).toBeLessThan(sampleConflicts.length);

            // Vérifier que l'événement a été émis pour les résolutions automatiques
            expect(mockEventBus.emit).toHaveBeenCalled();
        });

        it('devrait calculer correctement la distribution des priorités', () => {
            const result = service.analyzeConflicts(sampleConflicts, sampleLeaveRequest, sampleUser);

            // Vérifier la distribution des priorités
            expect(result.priorityDistribution).toHaveProperty(ConflictPriority.MEDIUM.toString());
            expect(result.priorityDistribution).toHaveProperty(ConflictPriority.HIGH.toString());
            expect(result.priorityDistribution).toHaveProperty(ConflictPriority.VERY_HIGH.toString());

            // La somme des priorités doit être égale au nombre de conflits
            const sum = Object.values(result.priorityDistribution).reduce((a, b) => a + b, 0);
            expect(sum).toBe(sampleConflicts.length);
        });

        it('devrait identifier correctement les conflits les plus prioritaires', () => {
            const result = service.analyzeConflicts(sampleConflicts, sampleLeaveRequest, sampleUser);

            // Vérifier que les conflits à priorité maximale sont bien identifiés
            expect(result.highestPriorityConflicts.length).toBeGreaterThan(0);

            // Tous les conflits dans highestPriorityConflicts doivent avoir la même priorité (la plus haute)
            const priority = result.highestPriorityConflicts[0].priority;
            result.highestPriorityConflicts.forEach(rec => {
                expect(rec.priority).toBe(priority);
            });

            // Aucun conflit de priorité plus élevée ne doit exister dans les recommandations
            result.recommendations.forEach(rec => {
                expect(rec.priority).not.toBeGreaterThan(priority);
            });
        });
    });

    describe('updateRules', () => {
        it('devrait mettre à jour les règles et émettre un événement', () => {
            const newRules = {
                priorityRules: {
                    [ConflictType.USER_LEAVE_OVERLAP]: {
                        [ConflictSeverity.BLOQUANT]: ConflictPriority.VERY_HIGH
                    }
                }
            };

            service.updateRules(newRules);

            // Vérifier que les règles ont été mises à jour
            expect(service['options'].rules.priorityRules[ConflictType.USER_LEAVE_OVERLAP][ConflictSeverity.BLOQUANT])
                .toBe(ConflictPriority.VERY_HIGH);

            // Vérifier que l'événement a été émis
            expect(mockEventBus.emit).toHaveBeenCalledWith({
                type: 'conflict.rules.updated',
                data: {
                    updatedRules: Object.keys(newRules),
                    updatedBy: 'user'
                }
            });
        });
    });

    describe('resetRulesToDefault', () => {
        it('devrait réinitialiser les règles aux valeurs par défaut', () => {
            // D'abord modifier les règles
            service.updateRules({
                priorityRules: {
                    [ConflictType.USER_LEAVE_OVERLAP]: {
                        [ConflictSeverity.BLOQUANT]: ConflictPriority.LOW // Valeur non standard
                    }
                }
            });

            // Puis réinitialiser
            service.resetRulesToDefault();

            // Vérifier que les règles ont été réinitialisées
            expect(service['options'].rules.priorityRules[ConflictType.USER_LEAVE_OVERLAP][ConflictSeverity.BLOQUANT])
                .not.toBe(ConflictPriority.LOW);

            // Vérifier que l'événement a été émis
            expect(mockEventBus.emit).toHaveBeenCalledWith({
                type: 'conflict.rules.updated',
                data: {
                    updatedRules: ['all'],
                    updatedBy: 'user',
                    resetToDefault: true
                }
            });
        });
    });

    // Tests pour les méthodes privées importantes (via type assertion)
    describe('Méthodes privées - via type assertion', () => {
        describe('determineConflictPriority', () => {
            it('devrait utiliser les règles de priorité spécifiques si disponibles', () => {
                const conflict = {
                    id: 'conflict1',
                    leaveId: 'leave1',
                    type: ConflictType.USER_LEAVE_OVERLAP,
                    severity: ConflictSeverity.BLOQUANT,
                    description: 'Test conflict',
                    startDate: '2025-06-01',
                    endDate: '2025-06-07',
                    canOverride: true
                };

                // Utiliser type assertion pour accéder à la méthode privée
                const priority = (service as any).determineConflictPriority(conflict);

                // La priorité devrait correspondre à celle définie dans les règles par défaut
                expect(priority).toBe(ConflictPriority.HIGH);
            });

            it('devrait ajuster la priorité pour les utilisateurs avec rôles prioritaires', () => {
                const conflict = {
                    id: 'conflict1',
                    leaveId: 'leave1',
                    type: ConflictType.USER_LEAVE_OVERLAP,
                    severity: ConflictSeverity.BLOQUANT,
                    description: 'Test conflict',
                    startDate: '2025-06-01',
                    endDate: '2025-06-07',
                    canOverride: true
                };

                const user = {
                    id: 'user1',
                    name: 'Test User',
                    role: 'CHEF_SERVICE' // Rôle prioritaire
                };

                // Utiliser type assertion pour accéder à la méthode privée
                const priority = (service as any).determineConflictPriority(conflict, user);

                // La priorité devrait être réduite pour les utilisateurs prioritaires
                expect(priority).toBeLessThan(ConflictPriority.HIGH);
            });
        });

        describe('generateResolutionStrategies', () => {
            it('devrait générer des stratégies différentes selon le type de conflit', () => {
                const conflictTypes = [
                    ConflictType.USER_LEAVE_OVERLAP,
                    ConflictType.TEAM_ABSENCE,
                    ConflictType.CRITICAL_ROLE
                ];

                const results = conflictTypes.map(type => {
                    const conflict = {
                        id: `conflict-${type}`,
                        leaveId: 'leave1',
                        type: type,
                        severity: ConflictSeverity.AVERTISSEMENT,
                        description: `Conflit de type ${type}`,
                        startDate: '2025-06-01',
                        endDate: '2025-06-07',
                        canOverride: true
                    };

                    const leaveRequest = {
                        startDate: '2025-06-01',
                        endDate: '2025-06-07'
                    };

                    // Utiliser type assertion pour accéder à la méthode privée
                    return {
                        type,
                        strategies: (service as any).generateResolutionStrategies(conflict, leaveRequest)
                    };
                });

                // Vérifier que les stratégies diffèrent selon le type
                results.forEach((result, index) => {
                    if (index > 0) {
                        // Comparer les stratégies principales entre les différents types
                        expect(result.strategies[0].strategy)
                            .not.toBe(results[0].strategies[0].strategy);
                    }
                });
            });
        });
    });
}); 