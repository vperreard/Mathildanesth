import { jest, expect, describe, test, beforeEach, afterEach } from '@jest/globals';
import {
    ConflictRecommendationService,
} from '@/modules/leaves/services/conflictRecommendationService';
import {
    ConflictType,
    ConflictSeverity,
    LeaveConflict
} from '@/modules/leaves/types/conflict';
import {
    ConflictPriority,
    ResolutionStrategy,
    ConflictResolutionRules
} from '@/modules/leaves/types/recommendation';
import { LeaveRequest, LeaveStatus } from '@/modules/leaves/types/leave';
import { User } from '@/types/user';
import { EventBusService } from '@/services/eventBusService';
import { differenceInDays } from 'date-fns';

// Mock EventBusService
jest.mock('@/services/eventBusService');

// Mock data avec des ConflictType valides
const mockUser: User = { id: 'user1', prenom: 'John', nom: 'Doe', email: 'john.doe@example.com', role: 'UTILISATEUR' };
const mockLeaveRequest: Partial<LeaveRequest> = {
    id: 'leave1',
    userId: 'user1',
    startDate: '2024-08-01',
    endDate: '2024-08-05'
};

const mockConflicts: LeaveConflict[] = [
    {
        id: 'conflict1',
        leaveId: 'leave1',
        type: ConflictType.USER_LEAVE_OVERLAP,
        severity: ConflictSeverity.BLOQUANT,
        description: 'Chevauchement avec un autre congé',
        startDate: '2024-08-01',
        endDate: '2024-08-05',
        canOverride: false
    },
    {
        id: 'conflict2',
        leaveId: 'leave1',
        type: ConflictType.TEAM_ABSENCE,
        severity: ConflictSeverity.AVERTISSEMENT,
        description: 'Trop de membres absents',
        startDate: '2024-08-01',
        endDate: '2024-08-05',
        canOverride: true
    }
];

describe('ConflictRecommendationService', () => {
    let eventBusMock: jest.Mocked<EventBusService>;
    let publishSpy: jest.Mock;
    let emitSpy: jest.Mock;
    let service: ConflictRecommendationService;

    beforeEach(() => {
        jest.clearAllMocks();

        const mockServiceInstance = {
            subscribe: jest.fn(),
            unsubscribe: jest.fn(),
            publish: jest.fn(),
            emit: jest.fn(),
        };

        (EventBusService.getInstance as any) = jest.fn(() => mockServiceInstance);
        eventBusMock = EventBusService.getInstance() as jest.Mocked<EventBusService>;
        publishSpy = eventBusMock.publish;
        emitSpy = eventBusMock.emit;

        service = ConflictRecommendationService.getInstance();
        service.resetRulesToDefault();
        service.updateOptions({ // Rétablir les valeurs par défaut explicites
            rules: service.getDefaultRules(),
            maxRecommendationsPerConflict: 3,
            enableAutoResolution: true,
            learnFromPastResolutions: true,
            considerWorkload: true,
            considerUserHistory: true,
            considerTeamBalance: true,
            explanationLevel: 'DETAILED'
        });
        // Réinitialiser l'historique interne (méthode privée mais nécessaire pour l'isolation)
        if ((service as any).resolutionHistory) {
            (service as any).resolutionHistory.clear();
        }
    });

    afterEach(() => {
        jest.restoreAllMocks(); // Nettoyer les spies (comme jest.spyOn)
    });

    test('devrait analyser les conflits et retourner des recommandations', () => {
        const result = service.analyzeConflicts(mockConflicts, mockLeaveRequest, mockUser);

        expect(result).toBeDefined();
        expect(result.recommendations).toHaveLength(mockConflicts.length);
        expect(result.recommendations[0].conflictId).toBe('conflict1');
        expect(result.recommendations[0].priority).toBeDefined();
        expect(result.recommendations[0].strategies).toBeInstanceOf(Array);
        expect(result.recommendations[0].explanation).toBeDefined();
        expect(result.automatedResolutionsCount).toBeDefined();
        expect(result.manualResolutionsCount).toBeDefined();
        expect(result.priorityDistribution).toBeDefined();
        expect(result.highestPriorityConflicts).toBeInstanceOf(Array);
    });

    test('devrait déterminer la priorité du conflit', () => {
        const priority = service.determineConflictPriority(mockConflicts[0], mockUser);
        expect(priority).toBe(ConflictPriority.VERY_HIGH); // Attend la valeur de l'enum

        const priority2 = service.determineConflictPriority(mockConflicts[1], mockUser);
        expect(priority2).toBe(ConflictPriority.HIGH); // Attend la valeur de l'enum
    });

    test('devrait générer des stratégies de résolution', () => {
        const strategies = service.generateResolutionStrategies(mockConflicts[0], mockLeaveRequest, mockUser);
        expect(strategies).toBeInstanceOf(Array);
        expect(strategies.length).toBeGreaterThan(0);
        expect(strategies[0]).toHaveProperty('strategy');
        expect(strategies[0]).toHaveProperty('description');
        expect(strategies[0]).toHaveProperty('confidence');
    });

    test('devrait générer une explication', () => {
        const strategies = service.generateResolutionStrategies(mockConflicts[0], mockLeaveRequest, mockUser);
        const explanation = service.generateExplanation(mockConflicts[0], strategies, false, ConflictPriority.VERY_HIGH);
        expect(explanation).toBeDefined();
        expect(typeof explanation).toBe('string');
        expect(explanation.length).toBeGreaterThan(0);
    });

    test('devrait publier un événement lors de la résolution automatique', () => {
        service.updateOptions({ enableAutoResolution: true });
        const autoResolvableConflict: LeaveConflict = {
            id: 'conflictAuto',
            leaveId: 'leave1',
            type: ConflictType.TEAM_ABSENCE,
            severity: ConflictSeverity.INFORMATION,
            description: 'Absence équipe info',
            startDate: '2024-08-01',
            endDate: '2024-08-05',
            canOverride: true
        };

        service.analyzeConflicts([autoResolvableConflict], mockLeaveRequest, mockUser);

        expect(publishSpy).toHaveBeenCalledWith(
            'conflict.resolved',
            expect.objectContaining({
                conflictId: autoResolvableConflict.id,
                resolution: expect.any(String),
                resolvedBy: 'ConflictRecommendationService'
            })
        );
    });

    test('devrait retourner un résultat vide si aucun conflit n\'est fourni', () => {
        const result = service.analyzeConflicts([], mockLeaveRequest, mockUser);

        expect(result).toBeDefined();
        expect(result.recommendations).toHaveLength(0);
        expect(result.automatedResolutionsCount).toBe(0);
        expect(result.manualResolutionsCount).toBe(0);
        expect(Object.keys(result.priorityDistribution)).toHaveLength(0);
        expect(result.highestPriorityConflicts).toHaveLength(0);
    });

    test('devrait gérer les erreurs internes gracieusement', () => {
        service.determineConflictPriority = jest.fn(() => { throw new Error('Test Error'); });

        const result = service.analyzeConflicts(mockConflicts, mockLeaveRequest, mockUser);

        expect(result).toBeDefined();
        expect(result.recommendations).toHaveLength(0);
    });

    test('devrait utiliser les règles personnalisées si fournies', () => {
        // Obtenir les règles par défaut
        const customRules = service.getDefaultRules();

        // Modifier uniquement la règle de priorité nécessaire
        if (customRules.priorityRules[ConflictType.USER_LEAVE_OVERLAP]) {
            customRules.priorityRules[ConflictType.USER_LEAVE_OVERLAP][ConflictSeverity.BLOQUANT] = ConflictPriority.LOW;
        } else {
            // Gérer le cas où la règle n'existe pas (peu probable avec getDefaultRules)
            customRules.priorityRules[ConflictType.USER_LEAVE_OVERLAP] = {
                [ConflictSeverity.BLOQUANT]: ConflictPriority.LOW
            };
        }

        service.updateRules(customRules);

        const result = service.analyzeConflicts(mockConflicts, mockLeaveRequest, mockUser);

        // Vérifier que des recommandations sont retournées
        expect(result.recommendations.length).toBeGreaterThan(0);
        if (result.recommendations.length === 0) return; // Garde pour type checking

        // Vérifier la première recommandation correspond au premier conflit
        expect(result.recommendations[0].conflictId).toBe(mockConflicts[0].id);
        expect(result.recommendations[0].priority).toBe(ConflictPriority.LOW);
    });

    test('devrait limiter le nombre de stratégies retournées', () => {
        service.updateOptions({ maxRecommendationsPerConflict: 1 });

        const result = service.analyzeConflicts(mockConflicts, mockLeaveRequest, mockUser);
        expect(result.recommendations[0].strategies.length).toBeLessThanOrEqual(1);
        if (mockConflicts.length > 1 && result.recommendations[1]) {
            expect(result.recommendations[1].strategies.length).toBeLessThanOrEqual(1);
        }
    });

    test('devrait gérer des données de conflit incomplètes', () => {
        const incompleteConflict: LeaveConflict = {
            id: 'conflict3',
            leaveId: 'leave1',
            type: undefined,
            severity: ConflictSeverity.INFO,
            description: 'Conflit incomplet',
            startDate: '2024-08-01',
            endDate: '2024-08-05',
            canOverride: true
        };
        const incompleteResult = service.analyzeConflicts([incompleteConflict], mockLeaveRequest, mockUser);
        expect(incompleteResult).toBeDefined();
        expect(incompleteResult.recommendations).toHaveLength(1);
        expect(incompleteResult.recommendations[0].priority).toBeDefined();
    });
}); 