import { ScheduleRuleService, ScheduleContext } from '../services/scheduleRuleService';
import {
    ScheduleRule,
    ScheduleRulePriority,
    ScheduleRuleAction,
    ScheduleRuleField,
    ConditionOperator
} from '../models/ScheduleRule';
import { PrismaClient } from '@prisma/client';

// Mock du client Prisma
jest.mock('@prisma/client', () => {
    const mockPrismaClient = {
        rule: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        }
    };

    return {
        PrismaClient: jest.fn(() => mockPrismaClient)
    };
});

describe('ScheduleRuleService', () => {
    let service: ScheduleRuleService;
    let prisma: any;

    // Données de test
    const mockRule: any = {
        id: 'rule-1',
        name: 'Test Rule',
        description: 'A test rule',
        type: 'ASSIGNMENT',
        priority: 'HIGH',
        isActive: true,
        validFrom: new Date('2023-01-01'),
        validTo: new Date('2023-12-31'),
        configuration: {
            conditionGroup: {
                logicOperator: 'AND',
                conditions: [
                    {
                        field: ScheduleRuleField.USER_ID,
                        operator: ConditionOperator.EQUALS,
                        value: 1
                    }
                ]
            },
            actions: [
                {
                    type: ScheduleRuleAction.WARN_ASSIGNMENT,
                    parameters: {
                        message: 'Test warning'
                    }
                }
            ]
        },
        createdBy: 1,
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockScheduleContext: ScheduleContext = {
        userId: 1,
        date: new Date('2023-06-15'),
        assignmentType: 'DUTY'
    };

    beforeEach(() => {
        // Réinitialiser les mocks entre les tests
        jest.clearAllMocks();

        // Initialiser le service
        service = new ScheduleRuleService();
        prisma = new PrismaClient();
    });

    describe('getAllRules', () => {
        it('devrait récupérer toutes les règles actives', async () => {
            // Configurer le mock
            prisma.rule.findMany.mockResolvedValue([mockRule]);

            // Appeler la méthode
            const result = await service.getAllRules();

            // Vérifier que la méthode Prisma a été appelée correctement
            expect(prisma.rule.findMany).toHaveBeenCalledWith({
                where: { type: 'ASSIGNMENT', isActive: true },
                orderBy: { priority: 'desc' }
            });

            // Vérifier le résultat
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Test Rule');
            expect(result[0].priority).toBe(ScheduleRulePriority.HIGH);
        });

        it('devrait retourner un tableau vide si aucune règle n\'est trouvée', async () => {
            // Configurer le mock
            prisma.rule.findMany.mockResolvedValue([]);

            // Appeler la méthode
            const result = await service.getAllRules();

            // Vérifier le résultat
            expect(result).toHaveLength(0);
        });
    });

    describe('getRuleById', () => {
        it('devrait récupérer une règle par ID', async () => {
            // Configurer le mock
            prisma.rule.findUnique.mockResolvedValue(mockRule);

            // Appeler la méthode
            const result = await service.getRuleById('rule-1');

            // Vérifier que la méthode Prisma a été appelée correctement
            expect(prisma.rule.findUnique).toHaveBeenCalledWith({
                where: { id: 'rule-1' }
            });

            // Vérifier le résultat
            expect(result).not.toBeNull();
            expect(result?.name).toBe('Test Rule');
        });

        it('devrait retourner null si la règle n\'est pas trouvée', async () => {
            // Configurer le mock
            prisma.rule.findUnique.mockResolvedValue(null);

            // Appeler la méthode
            const result = await service.getRuleById('non-existent');

            // Vérifier le résultat
            expect(result).toBeNull();
        });
    });

    describe('createRule', () => {
        it('devrait créer une nouvelle règle', async () => {
            // Configurer les mocks
            prisma.rule.create.mockResolvedValue(mockRule);

            // Données pour créer une règle
            const ruleData: Omit<ScheduleRule, 'id' | 'createdAt' | 'updatedAt'> = {
                name: 'New Rule',
                description: 'A new rule',
                priority: ScheduleRulePriority.MEDIUM,
                isActive: true,
                validFrom: new Date('2023-01-01'),
                conditionGroup: {
                    logicOperator: 'AND',
                    conditions: [
                        {
                            field: ScheduleRuleField.USER_ID,
                            operator: ConditionOperator.EQUALS,
                            value: 1
                        }
                    ]
                },
                actions: [
                    {
                        type: ScheduleRuleAction.WARN_ASSIGNMENT,
                        parameters: {
                            message: 'Warning message'
                        }
                    }
                ],
                createdBy: 1
            };

            // Appeler la méthode
            await service.createRule(ruleData);

            // Vérifier que create a été appelé avec les bons paramètres
            expect(prisma.rule.create).toHaveBeenCalled();
            const createParams = prisma.rule.create.mock.calls[0][0];
            expect(createParams.data.name).toBe('New Rule');
            expect(createParams.data.type).toBe('ASSIGNMENT');
            expect(createParams.data.createdBy).toBe(1);
        });
    });

    describe('updateRule', () => {
        it('devrait mettre à jour une règle existante', async () => {
            // Configurer les mocks
            prisma.rule.findUniqueOrThrow.mockResolvedValue(mockRule);
            prisma.rule.update.mockResolvedValue({
                ...mockRule,
                name: 'Updated Rule'
            });

            // Données pour mettre à jour une règle
            const updateData = {
                name: 'Updated Rule',
                isActive: false
            };

            // Appeler la méthode
            const result = await service.updateRule('rule-1', updateData);

            // Vérifier que update a été appelé avec les bons paramètres
            expect(prisma.rule.update).toHaveBeenCalled();
            const updateParams = prisma.rule.update.mock.calls[0][0];
            expect(updateParams.where.id).toBe('rule-1');
            expect(updateParams.data.name).toBe('Updated Rule');
            expect(updateParams.data.isActive).toBe(false);

            // Vérifier le résultat
            expect(result.name).toBe('Updated Rule');
        });
    });

    describe('deleteRule', () => {
        it('devrait supprimer une règle', async () => {
            // Configurer le mock
            prisma.rule.delete.mockResolvedValue(mockRule);

            // Appeler la méthode
            const result = await service.deleteRule('rule-1');

            // Vérifier que delete a été appelé avec les bons paramètres
            expect(prisma.rule.delete).toHaveBeenCalledWith({
                where: { id: 'rule-1' }
            });

            // Vérifier le résultat
            expect(result).toBe(true);
        });
    });

    describe('evaluateRules', () => {
        it('devrait évaluer les règles applicables dans un contexte donné', async () => {
            // Spy sur les méthodes internes
            jest.spyOn(service as any, 'getAllRules').mockResolvedValue([
                {
                    id: 'rule-1',
                    name: 'Test Rule 1',
                    priority: ScheduleRulePriority.HIGH,
                    isActive: true,
                    validFrom: new Date('2022-01-01'),
                    validTo: null,
                    conditionGroup: {
                        logicOperator: 'AND',
                        conditions: [
                            {
                                field: ScheduleRuleField.USER_ID,
                                operator: ConditionOperator.EQUALS,
                                value: 1
                            }
                        ]
                    },
                    actions: [
                        {
                            type: ScheduleRuleAction.WARN_ASSIGNMENT,
                            parameters: { message: 'Warning 1' }
                        }
                    ]
                },
                {
                    id: 'rule-2',
                    name: 'Test Rule 2',
                    priority: ScheduleRulePriority.MEDIUM,
                    isActive: true,
                    validFrom: new Date('2022-01-01'),
                    validTo: null,
                    conditionGroup: {
                        logicOperator: 'AND',
                        conditions: [
                            {
                                field: ScheduleRuleField.USER_ID,
                                operator: ConditionOperator.EQUALS,
                                value: 2
                            }
                        ]
                    },
                    actions: [
                        {
                            type: ScheduleRuleAction.WARN_ASSIGNMENT,
                            parameters: { message: 'Warning 2' }
                        }
                    ]
                }
            ]);

            // Mock pour evaluateConditionGroup (une méthode privée)
            jest.spyOn(service as any, 'evaluateConditionGroup')
                .mockReturnValueOnce(true)  // rule-1 est satisfaite
                .mockReturnValueOnce(false); // rule-2 n'est pas satisfaite

            // Appeler la méthode
            const results = await service.evaluateRules(mockScheduleContext);

            // Vérifier les résultats
            expect(results).toHaveLength(2);
            expect(results[0].satisfied).toBe(true);
            expect(results[0].actions).toHaveLength(1);
            expect(results[1].satisfied).toBe(false);
            expect(results[1].actions).toHaveLength(0);
        });
    });

    describe('evaluateConditionGroup', () => {
        it('devrait évaluer un groupe de conditions avec opérateur AND', () => {
            // Groupe de conditions pour le test
            const conditionGroup = {
                logicOperator: 'AND',
                conditions: [
                    {
                        field: ScheduleRuleField.USER_ID,
                        operator: ConditionOperator.EQUALS,
                        value: 1
                    },
                    {
                        field: ScheduleRuleField.ASSIGNMENT_TYPE,
                        operator: ConditionOperator.EQUALS,
                        value: 'DUTY'
                    }
                ]
            };

            // Mock de la méthode evaluateCondition
            jest.spyOn(service as any, 'evaluateCondition')
                .mockReturnValueOnce(true)  // première condition satisfaite
                .mockReturnValueOnce(true); // deuxième condition satisfaite

            // Appeler la méthode privée evaluateConditionGroup
            const result = (service as any).evaluateConditionGroup(conditionGroup, mockScheduleContext);

            // Vérifier le résultat
            expect(result).toBe(true);
        });

        it('devrait évaluer un groupe de conditions avec opérateur OR', () => {
            // Groupe de conditions pour le test
            const conditionGroup = {
                logicOperator: 'OR',
                conditions: [
                    {
                        field: ScheduleRuleField.USER_ID,
                        operator: ConditionOperator.EQUALS,
                        value: 2 // Ne correspond pas
                    },
                    {
                        field: ScheduleRuleField.ASSIGNMENT_TYPE,
                        operator: ConditionOperator.EQUALS,
                        value: 'DUTY' // Correspond
                    }
                ]
            };

            // Mock de la méthode evaluateCondition
            jest.spyOn(service as any, 'evaluateCondition')
                .mockReturnValueOnce(false) // première condition non satisfaite
                .mockReturnValueOnce(true); // deuxième condition satisfaite

            // Appeler la méthode privée evaluateConditionGroup
            const result = (service as any).evaluateConditionGroup(conditionGroup, mockScheduleContext);

            // Vérifier le résultat
            expect(result).toBe(true);
        });
    });

    describe('evaluateCondition', () => {
        it('devrait évaluer une condition EQUALS correctement', () => {
            const condition = {
                field: ScheduleRuleField.USER_ID,
                operator: ConditionOperator.EQUALS,
                value: 1
            };

            const result = (service as any).evaluateCondition(condition, mockScheduleContext);
            expect(result).toBe(true);
        });

        it('devrait évaluer une condition NOT_EQUALS correctement', () => {
            const condition = {
                field: ScheduleRuleField.USER_ID,
                operator: ConditionOperator.NOT_EQUALS,
                value: 2
            };

            const result = (service as any).evaluateCondition(condition, mockScheduleContext);
            expect(result).toBe(true);
        });
    });

    describe('applyRuleActions', () => {
        it('devrait appliquer les actions des règles satisfaites', () => {
            // Résultats d'évaluation pour le test
            const evaluationResults = [
                {
                    ruleId: 'rule-1',
                    ruleName: 'Test Rule 1',
                    priority: ScheduleRulePriority.HIGH,
                    satisfied: true,
                    actions: [
                        {
                            type: ScheduleRuleAction.WARN_ASSIGNMENT,
                            parameters: { message: 'Warning 1' }
                        }
                    ]
                },
                {
                    ruleId: 'rule-2',
                    ruleName: 'Test Rule 2',
                    priority: ScheduleRulePriority.MEDIUM,
                    satisfied: false, // Cette règle n'est pas satisfaite
                    actions: []
                },
                {
                    ruleId: 'rule-3',
                    ruleName: 'Test Rule 3',
                    priority: ScheduleRulePriority.LOW,
                    satisfied: true,
                    actions: [
                        {
                            type: ScheduleRuleAction.FORBID_ASSIGNMENT,
                            parameters: { assignmentType: 'ON_CALL' }
                        }
                    ]
                }
            ];

            // Appeler la méthode
            const result = service.applyRuleActions(evaluationResults, mockScheduleContext);

            // Vérifier le résultat
            expect(result.warnings).toContain('Warning 1');
            expect(result.forbiddenAssignments).toContain('ON_CALL');
            expect(result.modifiedContext).toEqual(mockScheduleContext);
        });
    });
}); 