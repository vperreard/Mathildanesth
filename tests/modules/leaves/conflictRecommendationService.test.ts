import { describe, it, expect, beforeEach, vi, SpyInstance } from 'vitest';
import {
    ConflictRecommendationService
} from '../../src/modules/leaves/services/conflictRecommendationService';
import {
    ConflictType,
    ConflictSeverity,
    LeaveConflict
} from '../../src/modules/leaves/types/conflict';
import {
    ConflictPriority,
    ResolutionStrategy
} from '../../src/modules/leaves/types/recommendation';
import { LeaveRequest } from '../../src/modules/leaves/types/leave';
import { User } from '../../src/types/user';
import { EventBusService } from '../../src/services/eventBusService';

// Mock du service EventBusService
vi.mock('../../src/services/eventBusService', () => {
    return {
        EventBusService: {
            getInstance: vi.fn(() => ({
                subscribe: vi.fn(),
                unsubscribe: vi.fn(),
                publish: vi.fn()
            }))
        }
    };
});

describe('ConflictRecommendationService', () => {
    let service: ConflictRecommendationService;
    let mockEventBus: {
        subscribe: SpyInstance;
        unsubscribe: SpyInstance;
        publish: SpyInstance;
    };

    // Données de test
    const mockLeaveRequest: Partial<LeaveRequest> = {
        id: '123',
        startDate: '2025-06-01',
        endDate: '2025-06-10',
        userId: 'user1'
    };

    const mockUser: User = {
        id: 'user1',
        email: 'test@example.com',
        role: 'MANAGER',
        firstName: 'Test',
        lastName: 'User',
        isActive: true
    };

    const mockConflicts: LeaveConflict[] = [
        {
            id: 'conflict1',
            leaveId: '123',
            type: ConflictType.USER_LEAVE_OVERLAP,
            severity: ConflictSeverity.BLOQUANT,
            description: 'Chevauchement avec un autre congé',
            startDate: '2025-06-02',
            endDate: '2025-06-05',
            canOverride: false
        },
        {
            id: 'conflict2',
            leaveId: '123',
            type: ConflictType.TEAM_ABSENCE,
            severity: ConflictSeverity.AVERTISSEMENT,
            description: 'Trop de membres absents dans l\'équipe',
            startDate: '2025-06-05',
            endDate: '2025-06-08',
            canOverride: true
        },
        {
            id: 'conflict3',
            leaveId: '123',
            type: ConflictType.DEADLINE_PROXIMITY,
            severity: ConflictSeverity.INFORMATION,
            description: 'Proche d\'une deadline importante',
            startDate: '2025-06-01',
            endDate: '2025-06-10',
            canOverride: true
        }
    ];

    beforeEach(() => {
        // Réinitialiser les mocks
        vi.clearAllMocks();

        // Configurer les mocks
        mockEventBus = {
            subscribe: vi.fn(),
            unsubscribe: vi.fn(),
            publish: vi.fn()
        };

        (EventBusService.getInstance as any).mockReturnValue(mockEventBus);

        // Obtenir l'instance du service
        service = ConflictRecommendationService.getInstance();
    });

    it('devrait être une instance de ConflictRecommendationService', () => {
        expect(service).toBeInstanceOf(ConflictRecommendationService);
    });

    it('devrait s\'abonner aux événements de résolution lors de l\'initialisation', () => {
        expect(mockEventBus.subscribe).toHaveBeenCalledWith(
            'conflict.resolved',
            expect.any(Function)
        );
    });

    it('devrait analyser les conflits et fournir des recommandations', () => {
        // Analyser les conflits
        const result = service.analyzeConflicts(mockConflicts, mockLeaveRequest, mockUser);

        // Vérifier le format et la structure du résultat
        expect(result).toHaveProperty('recommendations');
        expect(result).toHaveProperty('automatedResolutionsCount');
        expect(result).toHaveProperty('manualResolutionsCount');
        expect(result).toHaveProperty('priorityDistribution');
        expect(result).toHaveProperty('highestPriorityConflicts');

        // Vérifier qu'il y a une recommandation pour chaque conflit
        expect(result.recommendations.length).toBe(mockConflicts.length);

        // Vérifier que chaque recommandation a les propriétés attendues
        result.recommendations.forEach(recommendation => {
            expect(recommendation).toHaveProperty('conflictId');
            expect(recommendation).toHaveProperty('priority');
            expect(recommendation).toHaveProperty('strategies');
            expect(recommendation).toHaveProperty('automaticResolution');
            expect(recommendation).toHaveProperty('explanation');
            expect(recommendation).toHaveProperty('resolutionStatus', 'PENDING');

            // Vérifier que chaque stratégie a les propriétés attendues
            recommendation.strategies.forEach(strategy => {
                expect(strategy).toHaveProperty('strategy');
                expect(strategy).toHaveProperty('description');
                expect(strategy).toHaveProperty('confidence');
            });
        });
    });

    it('devrait trier les recommandations par priorité', () => {
        const result = service.analyzeConflicts(mockConflicts, mockLeaveRequest, mockUser);

        // Vérifier que les recommandations sont triées par priorité (décroissante)
        for (let i = 1; i < result.recommendations.length; i++) {
            expect(result.recommendations[i - 1].priority >= result.recommendations[i].priority).toBeTruthy();
        }
    });

    it('devrait identifier correctement les conflits pouvant être résolus automatiquement', () => {
        // Configurer le service pour activer la résolution automatique
        service.configure({
            enableAutoResolution: true,
            rules: {
                priorityRules: {},
                autoResolutionThresholds: {
                    minConfidence: 70,
                    maxSeverity: ConflictSeverity.AVERTISSEMENT,
                    enabledStrategies: [
                        ResolutionStrategy.APPROVE,
                        ResolutionStrategy.RESCHEDULE_AFTER
                    ]
                }
            }
        });

        const result = service.analyzeConflicts(mockConflicts, mockLeaveRequest, mockUser);

        // Vérifier que certaines recommandations sont identifiées comme automatiques
        const automaticCount = result.recommendations.filter(r => r.automaticResolution).length;
        expect(automaticCount).toBeGreaterThan(0);
        expect(automaticCount).toBe(result.automatedResolutionsCount);

        // Les conflits bloquants ne devraient pas être résolus automatiquement
        const blockingConflict = result.recommendations.find(r =>
            mockConflicts.find(c => c.id === r.conflictId)?.severity === ConflictSeverity.BLOQUANT
        );
        expect(blockingConflict?.automaticResolution).toBeFalsy();
    });

    it('devrait fournir des stratégies de résolution adaptées au type de conflit', () => {
        const result = service.analyzeConflicts(mockConflicts, mockLeaveRequest, mockUser);

        // Vérifier que chaque type de conflit a des stratégies spécifiques
        const overlapRecommendation = result.recommendations.find(r =>
            mockConflicts.find(c => c.id === r.conflictId)?.type === ConflictType.USER_LEAVE_OVERLAP
        );

        const teamAbsenceRecommendation = result.recommendations.find(r =>
            mockConflicts.find(c => c.id === r.conflictId)?.type === ConflictType.TEAM_ABSENCE
        );

        // Vérifier les stratégies spécifiques au chevauchement de congés
        expect(overlapRecommendation?.strategies.some(s =>
            s.strategy === ResolutionStrategy.REJECT ||
            s.strategy === ResolutionStrategy.RESCHEDULE_BEFORE ||
            s.strategy === ResolutionStrategy.RESCHEDULE_AFTER
        )).toBeTruthy();

        // Vérifier les stratégies spécifiques à l'absence d'équipe
        expect(teamAbsenceRecommendation?.strategies.some(s =>
            s.strategy === ResolutionStrategy.APPROVE ||
            s.strategy === ResolutionStrategy.REJECT ||
            s.strategy === ResolutionStrategy.SPLIT
        )).toBeTruthy();
    });

    it('devrait retourner une distribution correcte des priorités', () => {
        const result = service.analyzeConflicts(mockConflicts, mockLeaveRequest, mockUser);

        // Vérifier que la somme des valeurs dans la distribution égale le nombre de conflits
        const totalPriorities = Object.values(result.priorityDistribution)
            .reduce((sum, count) => sum + count, 0);

        expect(totalPriorities).toBe(mockConflicts.length);
    });

    it('devrait gérer correctement les erreurs et les cas limites', () => {
        // Cas 1: Liste de conflits vide
        const emptyResult = service.analyzeConflicts([], mockLeaveRequest, mockUser);
        expect(emptyResult.recommendations).toHaveLength(0);

        // Cas 2: Demande de congé incomplète
        const incompleteLeaveRequest: Partial<LeaveRequest> = { id: '123' };
        const incompleteResult = service.analyzeConflicts(mockConflicts, incompleteLeaveRequest, mockUser);
        // Devrait quand même fonctionner, mais avec des stratégies limitées
        expect(incompleteResult.recommendations).toHaveLength(mockConflicts.length);
    });
}); 