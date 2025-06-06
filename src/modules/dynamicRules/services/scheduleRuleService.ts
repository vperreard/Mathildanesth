import { prisma } from '@/lib/prisma';
import {
    ScheduleRule,
    ScheduleRuleSchema,
    ScheduleRuleConditionGroup,
    ScheduleRulePriority,
    RuleEvaluationResult,
    ScheduleRuleAction
} from '../models/ScheduleRule';


export interface ScheduleContext {
    userId?: number;
    date?: Date;
    locationId?: number;
    assignmentType?: string;
    specialtyId?: number;
    previousAssignments?: {
        date: Date;
        type: string;
        locationId?: number;
    }[];
    nextAssignments?: {
        date: Date;
        type: string;
        locationId?: number;
    }[];
    [key: string]: unknown;
}

export class ScheduleRuleService {
    /**
     * Récupère toutes les règles actives
     */
    async getAllRules(): Promise<ScheduleRule[]> {
        const rules = await prisma.rule.findMany({
            where: {
                type: 'ASSIGNMENT',
                isActive: true
            },
            orderBy: { priority: 'desc' }
        });

        return rules.map(this.mapDatabaseRuleToScheduleRule);
    }

    /**
     * Récupère une règle par son ID
     */
    async getRuleById(id: string): Promise<ScheduleRule | null> {
        const rule = await prisma.rule.findUnique({
            where: { id }
        });

        if (!rule) return null;
        return this.mapDatabaseRuleToScheduleRule(rule);
    }

    /**
     * Crée une nouvelle règle
     */
    async createRule(ruleData: Omit<ScheduleRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduleRule> {
        const validatedData = ScheduleRuleSchema.omit({
            id: true,
            createdAt: true,
            updatedAt: true
        }).parse(ruleData);

        const result = await prisma.rule.create({
            data: {
                name: validatedData.name,
                description: validatedData.description || '',
                type: 'ASSIGNMENT',
                priority: this.mapPriorityToDatabase(validatedData.priority),
                isActive: validatedData.isActive,
                validFrom: validatedData.validFrom,
                validTo: validatedData.validTo,
                configuration: {
                    conditionGroup: validatedData.conditionGroup,
                    actions: validatedData.actions
                },
                createdBy: validatedData.createdBy,
                updatedBy: validatedData.updatedBy
            }
        });

        return this.mapDatabaseRuleToScheduleRule(result);
    }

    /**
     * Met à jour une règle existante
     */
    async updateRule(id: string, ruleData: Partial<Omit<ScheduleRule, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ScheduleRule> {
        const currentRule = await prisma.rule.findUniqueOrThrow({
            where: { id }
        });

        const currentConfig = currentRule.configuration as any;

        const updateData: any = {
            updatedAt: new Date()
        };

        if (ruleData.name) updateData.name = ruleData.name;
        if (ruleData.description !== undefined) updateData.description = ruleData.description;
        if (ruleData.isActive !== undefined) updateData.isActive = ruleData.isActive;
        if (ruleData.priority) updateData.priority = this.mapPriorityToDatabase(ruleData.priority);
        if (ruleData.validFrom) updateData.validFrom = ruleData.validFrom;
        if (ruleData.validTo !== undefined) updateData.validTo = ruleData.validTo;
        if (ruleData.updatedBy) updateData.updatedBy = ruleData.updatedBy;

        // Mettre à jour la configuration si des composants sont fournis
        if (ruleData.conditionGroup || ruleData.actions) {
            updateData.configuration = {
                conditionGroup: ruleData.conditionGroup || currentConfig.conditionGroup,
                actions: ruleData.actions || currentConfig.actions
            };
        }

        const result = await prisma.rule.update({
            where: { id },
            data: updateData
        });

        return this.mapDatabaseRuleToScheduleRule(result);
    }

    /**
     * Supprime une règle
     */
    async deleteRule(id: string): Promise<boolean> {
        await prisma.rule.delete({
            where: { id }
        });
        return true;
    }

    /**
     * Évalue toutes les règles applicables à un contexte donné
     */
    async evaluateRules(context: ScheduleContext): Promise<RuleEvaluationResult[]> {
        const rules = await this.getAllRules();
        const currentDate = context.date || new Date();

        // Filtrer les règles valides pour la date actuelle
        const applicableRules = rules.filter(rule => {
            const isAfterValidFrom = rule.validFrom <= currentDate;
            const isBeforeValidTo = !rule.validTo || rule.validTo >= currentDate;
            return isAfterValidFrom && isBeforeValidTo;
        });

        // Évaluer chaque règle
        return applicableRules.map(rule => {
            const satisfied = this.evaluateConditionGroup(rule.conditionGroup, context);

            return {
                ruleId: rule.id as string,
                ruleName: rule.name,
                priority: rule.priority,
                actions: satisfied ? rule.actions : [],
                satisfied
            };
        });
    }

    /**
     * Évalue une règle spécifique dans un contexte donné
     */
    async evaluateRule(ruleId: string, context: ScheduleContext): Promise<RuleEvaluationResult | null> {
        const rule = await this.getRuleById(ruleId);
        if (!rule) return null;

        const currentDate = context.date || new Date();

        // Vérifier si la règle est applicable à la date actuelle
        const isAfterValidFrom = rule.validFrom <= currentDate;
        const isBeforeValidTo = !rule.validTo || rule.validTo >= currentDate;

        if (!isAfterValidFrom || !isBeforeValidTo) {
            return {
                ruleId: rule.id as string,
                ruleName: rule.name,
                priority: rule.priority,
                actions: [],
                satisfied: false
            };
        }

        // Évaluer la règle
        const satisfied = this.evaluateConditionGroup(rule.conditionGroup, context);

        return {
            ruleId: rule.id as string,
            ruleName: rule.name,
            priority: rule.priority,
            actions: satisfied ? rule.actions : [],
            satisfied
        };
    }

    /**
     * Applique les actions des règles satisfaites à un contexte
     */
    applyRuleActions(evaluationResults: RuleEvaluationResult[], context: ScheduleContext): any {
        const result = {
            forbiddenAssignments: [] as string[],
            requiredAssignments: [] as string[],
            suggestedAssignments: [] as string[],
            warnings: [] as string[],
            userPriorities: {} as Record<number, number>,
            balanceWorkload: false,
            modifiedContext: { ...context }
        };

        // Trier les résultats par priorité (du plus haut au plus bas)
        const sortedResults = [...evaluationResults].sort((a, b) => {
            const priorityOrder = {
                [ScheduleRulePriority.CRITICAL]: 3,
                [ScheduleRulePriority.HIGH]: 2,
                [ScheduleRulePriority.MEDIUM]: 1,
                [ScheduleRulePriority.LOW]: 0
            };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

        // Appliquer les actions de chaque règle satisfaite
        for (const evalResult of sortedResults) {
            if (!evalResult.satisfied) continue;

            for (const action of evalResult.actions) {
                switch (action.type) {
                    case ScheduleRuleAction.FORBID_ASSIGNMENT:
                        if (action.parameters.assignmentType) {
                            result.forbiddenAssignments.push(action.parameters.assignmentType as string);
                        }
                        break;

                    case ScheduleRuleAction.REQUIRE_ASSIGNMENT:
                        if (action.parameters.assignmentType) {
                            result.requiredAssignments.push(action.parameters.assignmentType as string);
                        }
                        break;

                    case ScheduleRuleAction.SUGGEST_ASSIGNMENT:
                        if (action.parameters.assignmentType) {
                            result.suggestedAssignments.push(action.parameters.assignmentType as string);
                        }
                        break;

                    case ScheduleRuleAction.WARN_ASSIGNMENT:
                        if (action.parameters.message) {
                            result.warnings.push(action.parameters.message as string);
                        }
                        break;

                    case ScheduleRuleAction.PRIORITIZE_USER:
                        if (action.parameters.userId && action.parameters.priorityValue) {
                            const userId = Number(action.parameters.userId);
                            const priorityValue = Number(action.parameters.priorityValue);
                            result.userPriorities[userId] = (result.userPriorities[userId] || 0) + priorityValue;
                        }
                        break;

                    case ScheduleRuleAction.DEPRIORITIZE_USER:
                        if (action.parameters.userId && action.parameters.priorityValue) {
                            const userId = Number(action.parameters.userId);
                            const priorityValue = Number(action.parameters.priorityValue);
                            result.userPriorities[userId] = (result.userPriorities[userId] || 0) - priorityValue;
                        }
                        break;

                    case ScheduleRuleAction.BALANCE_WORKLOAD:
                        result.balanceWorkload = true;
                        break;
                }
            }
        }

        return result;
    }

    /**
     * Évalue récursivement un groupe de conditions
     */
    private evaluateConditionGroup(group: ScheduleRuleConditionGroup, context: ScheduleContext): boolean {
        const { logicOperator, conditions, subGroups } = group;

        // Évaluer toutes les conditions dans ce groupe
        const conditionResults = conditions.map(condition =>
            this.evaluateCondition(condition, context)
        );

        // Évaluer tous les sous-groupes dans ce groupe
        const subGroupResults = subGroups?.map(subGroup =>
            this.evaluateConditionGroup(subGroup, context)
        ) || [];

        // Combiner les résultats selon l'opérateur logique
        const allResults = [...conditionResults, ...subGroupResults];

        if (logicOperator === 'AND') {
            return allResults.every(result => result);
        } else {
            return allResults.some(result => result);
        }
    }

    /**
     * Évalue une condition individuelle
     */
    private evaluateCondition(condition: unknown, context: ScheduleContext): boolean {
        const { field, operator, value, valueEnd } = condition;

        // Obtenir la valeur du contexte pour le champ spécifié
        let contextValue: unknown;

        switch (field) {
            case 'USER_ID':
                contextValue = context.userId;
                break;
            case 'USER_ROLE':
                contextValue = context.userRole;
                break;
            case 'USER_PROFESSIONAL_ROLE':
                contextValue = context.userProfessionalRole;
                break;
            case 'USER_WORK_PATTERN':
                contextValue = context.userWorkPattern;
                break;
            case 'LOCATION_ID':
                contextValue = context.locationId;
                break;
            case 'LOCATION_SECTOR':
                contextValue = context.locationSector;
                break;
            case 'DATE':
                contextValue = context.date;
                break;
            case 'DAY_OF_WEEK':
                contextValue = context.date ? context.date.getDay() : null;
                break;
            case 'TIME_OF_DAY':
                contextValue = context.timeOfDay;
                break;
            case 'CONSECUTIVE_DAYS':
                contextValue = context.consecutiveDays;
                break;
            case 'ASSIGNMENT_TYPE':
                contextValue = context.assignmentType;
                break;
            case 'SPECIALTY_ID':
                contextValue = context.specialtyId;
                break;
            case 'PREVIOUS_ASSIGNMENT':
                contextValue = context.previousAssignments;
                break;
            case 'NEXT_ASSIGNMENT':
                contextValue = context.nextAssignments;
                break;
            default:
                contextValue = context[field];
        }

        // Si la valeur du contexte est undefined, retourner false
        if (contextValue === undefined) {
            return false;
        }

        // Évaluer en fonction de l'opérateur
        switch (operator) {
            case 'EQUALS':
                return contextValue === value;
            case 'NOT_EQUALS':
                return contextValue !== value;
            case 'GREATER_THAN':
                return contextValue > value;
            case 'LESS_THAN':
                return contextValue < value;
            case 'GREATER_THAN_OR_EQUAL':
                return contextValue >= value;
            case 'LESS_THAN_OR_EQUAL':
                return contextValue <= value;
            case 'CONTAINS':
                if (typeof contextValue === 'string') {
                    return contextValue.includes(value);
                } else if (Array.isArray(contextValue)) {
                    return contextValue.includes(value);
                }
                return false;
            case 'NOT_CONTAINS':
                if (typeof contextValue === 'string') {
                    return !contextValue.includes(value);
                } else if (Array.isArray(contextValue)) {
                    return !contextValue.includes(value);
                }
                return true;
            case 'STARTS_WITH':
                return typeof contextValue === 'string' && contextValue.startsWith(value);
            case 'ENDS_WITH':
                return typeof contextValue === 'string' && contextValue.endsWith(value);
            case 'BETWEEN':
                return contextValue >= value && contextValue <= valueEnd;
            case 'NOT_BETWEEN':
                return contextValue < value || contextValue > valueEnd;
            case 'IS_NULL':
                return contextValue === null;
            case 'IS_NOT_NULL':
                return contextValue !== null;
            case 'IN':
                return Array.isArray(value) && value.includes(contextValue);
            case 'NOT_IN':
                return Array.isArray(value) && !value.includes(contextValue);
            default:
                return false;
        }
    }

    /**
     * Mappage d'une règle de la base de données vers le template ScheduleRule
     */
    private mapDatabaseRuleToScheduleRule(dbRule: unknown): ScheduleRule {
        const config = dbRule.configuration as any;

        return {
            id: dbRule.id,
            name: dbRule.name,
            description: dbRule.description,
            isActive: dbRule.isActive,
            priority: this.mapDatabasePriorityToModel(dbRule.priority),
            validFrom: dbRule.validFrom,
            validTo: dbRule.validTo,
            conditionGroup: config.conditionGroup,
            actions: config.actions,
            createdBy: dbRule.createdBy,
            updatedBy: dbRule.updatedBy,
            createdAt: dbRule.createdAt,
            updatedAt: dbRule.updatedAt
        };
    }

    /**
     * Mappage de la priorité du template vers la base de données
     */
    private mapPriorityToDatabase(priority: ScheduleRulePriority): string {
        const mapping: Record<ScheduleRulePriority, string> = {
            [ScheduleRulePriority.LOW]: 'LOW',
            [ScheduleRulePriority.MEDIUM]: 'WARNING',
            [ScheduleRulePriority.HIGH]: 'HIGH',
            [ScheduleRulePriority.CRITICAL]: 'CRITICAL'
        };
        return mapping[priority];
    }

    /**
     * Mappage de la priorité de la base de données vers le template
     */
    private mapDatabasePriorityToModel(dbPriority: string): ScheduleRulePriority {
        const mapping: Record<string, ScheduleRulePriority> = {
            'LOW': ScheduleRulePriority.LOW,
            'WARNING': ScheduleRulePriority.MEDIUM,
            'HIGH': ScheduleRulePriority.HIGH,
            'CRITICAL': ScheduleRulePriority.CRITICAL
        };
        return mapping[dbPriority] || ScheduleRulePriority.MEDIUM;
    }
} 