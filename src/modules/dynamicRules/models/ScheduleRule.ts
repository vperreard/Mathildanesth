import { z } from 'zod';

// Types d'opérateurs de condition
export enum ConditionOperator {
    EQUALS = 'EQUALS',
    NOT_EQUALS = 'NOT_EQUALS',
    GREATER_THAN = 'GREATER_THAN',
    LESS_THAN = 'LESS_THAN',
    GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
    LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
    CONTAINS = 'CONTAINS',
    NOT_CONTAINS = 'NOT_CONTAINS',
    STARTS_WITH = 'STARTS_WITH',
    ENDS_WITH = 'ENDS_WITH',
    BETWEEN = 'BETWEEN',
    NOT_BETWEEN = 'NOT_BETWEEN',
    IS_NULL = 'IS_NULL',
    IS_NOT_NULL = 'IS_NOT_NULL',
    IN = 'IN',
    NOT_IN = 'NOT_IN',
}

// Types de champs sur lesquels les règles peuvent s'appliquer
export enum ScheduleRuleField {
    USER_ID = 'USER_ID',
    USER_ROLE = 'USER_ROLE',
    USER_PROFESSIONAL_ROLE = 'USER_PROFESSIONAL_ROLE',
    USER_WORK_PATTERN = 'USER_WORK_PATTERN',
    LOCATION_ID = 'LOCATION_ID',
    LOCATION_SECTOR = 'LOCATION_SECTOR',
    DATE = 'DATE',
    DAY_OF_WEEK = 'DAY_OF_WEEK',
    TIME_OF_DAY = 'TIME_OF_DAY',
    CONSECUTIVE_DAYS = 'CONSECUTIVE_DAYS',
    ASSIGNMENT_TYPE = 'ASSIGNMENT_TYPE',
    SPECIALTY_ID = 'SPECIALTY_ID',
    PREVIOUS_ASSIGNMENT = 'PREVIOUS_ASSIGNMENT',
    NEXT_ASSIGNMENT = 'NEXT_ASSIGNMENT',
}

// Types d'actions de règle
export enum ScheduleRuleAction {
    FORBID_ASSIGNMENT = 'FORBID_ASSIGNMENT',
    REQUIRE_ASSIGNMENT = 'REQUIRE_ASSIGNMENT',
    SUGGEST_ASSIGNMENT = 'SUGGEST_ASSIGNMENT',
    WARN_ASSIGNMENT = 'WARN_ASSIGNMENT',
    PRIORITIZE_USER = 'PRIORITIZE_USER',
    DEPRIORITIZE_USER = 'DEPRIORITIZE_USER',
    BALANCE_WORKLOAD = 'BALANCE_WORKLOAD',
}

// Priorité des règles
export enum ScheduleRulePriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

// Structure d'une condition de règle
export const ScheduleRuleConditionSchema = z.object({
    field: z.nativeEnum(ScheduleRuleField),
    operator: z.nativeEnum(ConditionOperator),
    value: z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.array(z.string()),
        z.array(z.number()),
        z.date(),
        z.null(),
    ]),
    valueEnd: z.union([
        z.string().optional(),
        z.number().optional(),
        z.date().optional(),
        z.null(),
    ]).optional(),
});

export type ScheduleRuleCondition = z.infer<typeof ScheduleRuleConditionSchema>;

// Définition préalable du type pour résoudre les références circulaires
export interface ScheduleRuleConditionGroupType {
    logicOperator: 'AND' | 'OR';
    conditions: ScheduleRuleCondition[];
    subGroups?: ScheduleRuleConditionGroupType[];
}

// Structure d'un groupe de conditions (avec opérateur logique)
export const ScheduleRuleConditionGroupSchema: z.ZodType<ScheduleRuleConditionGroupType> = z.object({
    logicOperator: z.enum(['AND', 'OR']),
    conditions: z.array(ScheduleRuleConditionSchema),
    subGroups: z.array(z.lazy(() => ScheduleRuleConditionGroupSchema)).optional(),
});

export type ScheduleRuleConditionGroup = z.infer<typeof ScheduleRuleConditionGroupSchema>;

// Structure d'une action de règle
export const ScheduleRuleActionSchema = z.object({
    type: z.nativeEnum(ScheduleRuleAction),
    parameters: z.record(z.string(), z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.array(z.string()),
        z.array(z.number()),
        z.null(),
    ])),
});

export type ScheduleRuleActionType = z.infer<typeof ScheduleRuleActionSchema>;

// Structure complète d'une règle de planification
export const ScheduleRuleSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(3).max(100),
    description: z.string().max(500).optional(),
    isActive: z.boolean().default(true),
    priority: z.nativeEnum(ScheduleRulePriority).default(ScheduleRulePriority.MEDIUM),
    validFrom: z.date(),
    validTo: z.date().optional(),
    conditionGroup: ScheduleRuleConditionGroupSchema,
    actions: z.array(ScheduleRuleActionSchema).min(1),
    createdBy: z.number().int().positive(),
    updatedBy: z.number().int().positive().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export type ScheduleRule = z.infer<typeof ScheduleRuleSchema>;

// Type pour les résultats d'évaluation de règle
export interface RuleEvaluationResult {
    ruleId: string;
    ruleName: string;
    priority: ScheduleRulePriority;
    actions: ScheduleRuleActionType[];
    satisfied: boolean;
} 