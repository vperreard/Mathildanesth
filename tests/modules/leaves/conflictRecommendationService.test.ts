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

    beforeEach(() => {
        jest.clearAllMocks();

        // Créer un objet mock simulant l'instance EventBusService
        const mockServiceInstance = {
            subscribe: jest.fn(),
            unsubscribe: jest.fn(),
            publish: jest.fn(),
            // Ajouter d'autres méthodes si nécessaire par le test
        };

        // Mocker getInstance pour retourner notre instance simulée
        // Cast en 'any' pour contourner les problèmes de type strict sur le mock de méthode statique
        (EventBusService.getInstance as any) = jest.fn(() => mockServiceInstance);

        // Récupérer l'instance mockée pour les assertions
        eventBusMock = EventBusService.getInstance() as jest.Mocked<EventBusService>;
        publishSpy = eventBusMock.publish; // Assigner directement la fonction mockée
    });

    afterEach(() => {
        // Restaurer l'implémentation originale si nécessaire
        // EventBusService.getInstance.mockRestore(); // Optionnel
    });

    test('devrait analyser les conflits et retourner des recommandations', () => {
        const service = ConflictRecommendationService.getInstance();
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
        const service = ConflictRecommendationService.getInstance();
        const priority = service.determineConflictPriority(mockConflicts[0], mockUser);
        expect(priority).toBe(ConflictPriority.VERY_HIGH);

        const priority2 = service.determineConflictPriority(mockConflicts[1], mockUser);
        expect(priority2).toBe(ConflictPriority.HIGH);
    });

    test('devrait générer des stratégies de résolution', () => {
        const service = ConflictRecommendationService.getInstance();
        const strategies = service.generateResolutionStrategies(mockConflicts[0], mockLeaveRequest, mockUser);
        expect(strategies).toBeInstanceOf(Array);
        expect(strategies.length).toBeGreaterThan(0);
        expect(strategies[0]).toHaveProperty('strategy');
        expect(strategies[0]).toHaveProperty('description');
        expect(strategies[0]).toHaveProperty('confidence');
    });

    test('devrait générer une explication', () => {
        const service = ConflictRecommendationService.getInstance();
        const strategies = service.generateResolutionStrategies(mockConflicts[0], mockLeaveRequest, mockUser);
        const explanation = service.generateExplanation(mockConflicts[0], strategies, false, ConflictPriority.VERY_HIGH);
        expect(explanation).toBeDefined();
        expect(typeof explanation).toBe('string');
        expect(explanation.length).toBeGreaterThan(0);
    });

    test('devrait publier un événement lors de la résolution automatique', () => {
        const service = ConflictRecommendationService.getInstance();
        service.options.enableAutoResolution = true;
        const autoResolvableConflict: LeaveConflict = { ...mockConflicts[1], type: ConflictType.DEADLINE_PROXIMITY, severity: ConflictSeverity.INFORMATION };
        const mockRecommendationAuto = service.analyzeConflict(autoResolvableConflict, mockLeaveRequest, mockUser);
        mockRecommendationAuto.automaticResolution = true;
        mockRecommendationAuto.strategies = [{ strategy: ResolutionStrategy.AUTO_APPROVE, description: 'Approbation auto', confidence: 1.0 }];

        const result = service.analyzeConflicts([autoResolvableConflict], mockLeaveRequest, mockUser);

        expect(publishSpy).toHaveBeenCalledWith(
            'conflict.resolved',
            expect.objectContaining({
                conflictId: autoResolvableConflict.id,
                resolution: 'AUTO',
                resolvedBy: 'ConflictRecommendationService'
            })
        );
    });

    test('devrait retourner un résultat vide si aucun conflit n\'est fourni', () => {
        const service = ConflictRecommendationService.getInstance();
        const result = service.analyzeConflicts([], mockLeaveRequest, mockUser);

        expect(result).toBeDefined();
        expect(result.recommendations).toHaveLength(0);
        expect(result.automatedResolutionsCount).toBe(0);
        expect(result.manualResolutionsCount).toBe(0);
        expect(Object.keys(result.priorityDistribution)).toHaveLength(0);
        expect(result.highestPriorityConflicts).toHaveLength(0);
    });

    test('devrait gérer les erreurs internes gracieusement', () => {
        const service = ConflictRecommendationService.getInstance();
        service.determineConflictPriority = jest.fn(() => { throw new Error('Test Error'); });

        const result = service.analyzeConflicts(mockConflicts, mockLeaveRequest, mockUser);

        expect(result).toBeDefined();
        expect(result.recommendations).toHaveLength(0);
    });

    test('devrait utiliser les règles personnalisées si fournies', () => {
        const service = ConflictRecommendationService.getInstance();
        const customRules = { /* ... définir des règles personnalisées ... */ };
        service.options.rules = customRules;

        const result = service.analyzeConflicts(mockConflicts, mockLeaveRequest, mockUser);
        expect(result.recommendations[0].priority).not.toBe(ConflictPriority.VERY_HIGH);
    });

    test('devrait limiter le nombre de stratégies retournées', () => {
        const service = ConflictRecommendationService.getInstance();
        service.options.maxRecommendationsPerConflict = 1;

        const result = service.analyzeConflicts(mockConflicts, mockLeaveRequest, mockUser);
        expect(result.recommendations[0].strategies.length).toBeLessThanOrEqual(1);
        expect(result.recommendations[1].strategies.length).toBeLessThanOrEqual(1);
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
        const service = ConflictRecommendationService.getInstance();
        const incompleteResult = service.analyzeConflicts([incompleteConflict], mockLeaveRequest, mockUser);
        expect(incompleteResult).toBeDefined();
        expect(incompleteResult.recommendations).toHaveLength(1);
        expect(incompleteResult.recommendations[0].priority).toBeDefined();
    });
}); 