import { PrismaClient } from '@prisma/client';

// Définir les types Prisma manuellement pour éviter les erreurs d'importation
type PrismaRuleType = 'LEAVE' | 'DUTY' | 'SUPERVISION' | 'ASSIGNMENT' | 'ON_CALL';
type PrismaRulePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type PrismaRuleSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

// Type pour représenter une règle Prisma
interface PrismaRule {
    id: string;
    name: string;
    description: string | null;
    type: PrismaRuleType;
    priority: PrismaRulePriority;
    isActive: boolean;
    validFrom: Date;
    validTo: Date | null;
    configuration: any;
    createdAt: Date;
    updatedAt: Date;
    createdBy: number;
    updatedBy: number | null;
}

// Type pour représenter un conflit Prisma
interface PrismaRuleConflict {
    id: string;
    description: string;
    severity: PrismaRuleSeverity;
    detectedAt: Date;
    resolvedAt: Date | null;
    resolution: string | null;
    resolutionDetails: string | null;
    rules?: PrismaRule[];
}

import {
    AnyRule,
    DutyRule,
    LeaveRule,
    SupervisionRule,
    AssignmentRule,
    OnCallRule,
    RuleType,
    RulePriority,
    RuleConflict,
    RuleSeverity,
    BaseRule
} from '../types/rule';

/**
 * Convertit un enum RuleType de Prisma en RuleType de notre application
 */
export function mapRuleType(prismaType: PrismaRuleType): RuleType {
    switch (prismaType) {
        case 'LEAVE': return RuleType.LEAVE;
        case 'DUTY': return RuleType.DUTY;
        case 'SUPERVISION': return RuleType.SUPERVISION;
        case 'ASSIGNMENT': return RuleType.ASSIGNMENT;
        case 'ON_CALL': return RuleType.ON_CALL;
        default:
            throw new Error(`Type de règle non reconnu: ${prismaType}`);
    }
}

/**
 * Convertit un enum RulePriority de Prisma en RulePriority de notre application
 */
export function mapRulePriority(prismaPriority: PrismaRulePriority): RulePriority {
    switch (prismaPriority) {
        case 'LOW': return RulePriority.LOW;
        case 'MEDIUM': return RulePriority.MEDIUM;
        case 'HIGH': return RulePriority.HIGH;
        case 'CRITICAL': return RulePriority.CRITICAL;
        default:
            throw new Error(`Priorité de règle non reconnue: ${prismaPriority}`);
    }
}

/**
 * Convertit un enum RuleSeverity de Prisma en RuleSeverity de notre application
 */
export function mapRuleSeverity(prismaSeverity: PrismaRuleSeverity): RuleSeverity {
    switch (prismaSeverity) {
        case 'LOW': return RuleSeverity.LOW;
        case 'MEDIUM': return RuleSeverity.MEDIUM;
        case 'HIGH': return RuleSeverity.HIGH;
        default:
            throw new Error(`Sévérité de conflit non reconnue: ${prismaSeverity}`);
    }
}

/**
 * Convertit une règle Prisma en règle de notre application
 */
export function mapPrismaRuleToRule(prismaRule: PrismaRule & { createdByUser?: any, updatedByUser?: any }): AnyRule {
    const type = mapRuleType(prismaRule.type);
    const baseFields: BaseRule = {
        id: prismaRule.id,
        name: prismaRule.name,
        description: prismaRule.description || '',
        type,
        priority: parseInt(prismaRule.priority), // Convertir en nombre
        isActive: prismaRule.isActive,
        createdAt: new Date(prismaRule.createdAt),
        updatedAt: new Date(prismaRule.updatedAt),
        createdBy: prismaRule.createdBy.toString()
    };

    // Configuration spécifique selon le type
    const configuration = prismaRule.configuration as any;

    // Créer l'objet de règle selon le type
    switch (type) {
        case RuleType.LEAVE:
            return {
                ...baseFields,
                type: RuleType.LEAVE,
                configuration
            } as unknown as LeaveRule;

        case RuleType.DUTY:
            return {
                ...baseFields,
                type: RuleType.DUTY,
                configuration
            } as unknown as DutyRule;

        case RuleType.SUPERVISION:
            return {
                ...baseFields,
                type: RuleType.SUPERVISION,
                configuration
            } as unknown as SupervisionRule;

        case RuleType.ASSIGNMENT:
            return {
                ...baseFields,
                type: RuleType.ASSIGNMENT,
                configuration
            } as unknown as AssignmentRule;

        case RuleType.ON_CALL:
            return {
                ...baseFields,
                type: RuleType.ON_CALL,
                configuration
            } as unknown as OnCallRule;

        default:
            throw new Error(`Type de règle non géré: ${type}`);
    }
}

/**
 * Convertit un conflit Prisma en conflit de notre application
 */
export function mapPrismaConflictToConflict(
    prismaConflict: PrismaRuleConflict
): RuleConflict {
    return {
        id: prismaConflict.id,
        ruleIds: prismaConflict.rules?.map(rule => rule.id) || [],
        description: prismaConflict.description,
        severity: mapRuleSeverity(prismaConflict.severity),
        detectedAt: new Date(prismaConflict.detectedAt),
        resolvedAt: prismaConflict.resolvedAt ? new Date(prismaConflict.resolvedAt) : undefined
    };
}

/**
 * Convertit un type RuleType de notre application en RuleType de Prisma
 */
export function mapToPrismaRuleType(type: RuleType): PrismaRuleType {
    switch (type) {
        case RuleType.LEAVE: return 'LEAVE';
        case RuleType.DUTY: return 'DUTY';
        case RuleType.SUPERVISION: return 'SUPERVISION';
        case RuleType.ASSIGNMENT: return 'ASSIGNMENT';
        case RuleType.ON_CALL: return 'ON_CALL';
        default:
            throw new Error(`Type de règle non reconnu: ${type}`);
    }
}

/**
 * Convertit un type RulePriority de notre application en RulePriority de Prisma
 */
export function mapToPrismaRulePriority(priority: RulePriority): PrismaRulePriority {
    switch (priority) {
        case RulePriority.LOW: return 'LOW';
        case RulePriority.MEDIUM: return 'MEDIUM';
        case RulePriority.HIGH: return 'HIGH';
        case RulePriority.CRITICAL: return 'CRITICAL';
        default:
            throw new Error(`Priorité de règle non reconnue: ${priority}`);
    }
}

/**
 * Convertit un type RuleSeverity de notre application en RuleSeverity de Prisma
 */
export function mapToPrismaRuleSeverity(severity: RuleSeverity): PrismaRuleSeverity {
    switch (severity) {
        case RuleSeverity.LOW: return 'LOW';
        case RuleSeverity.MEDIUM: return 'MEDIUM';
        case RuleSeverity.HIGH: return 'HIGH';
        default:
            throw new Error(`Sévérité de conflit non reconnue: ${severity}`);
    }
}

/**
 * Convertit une règle de notre application en format adapté pour Prisma
 */
export function mapRuleToPrismaRule(rule: Partial<AnyRule>): any {
    if (!rule.type) {
        throw new Error('Le type de règle est requis');
    }

    return {
        name: rule.name,
        description: rule.description,
        type: mapToPrismaRuleType(rule.type),
        priority: rule.priority ? mapToPrismaRulePriority(rule.priority as unknown as RulePriority) : undefined,
        isActive: rule.isActive,
        validFrom: rule.validFrom,
        validTo: rule.validTo,
        configuration: buildRuleConfiguration(rule)
    };
}

/**
 * Construit l'objet de configuration selon le type de règle
 */
function buildRuleConfiguration(rule: Partial<AnyRule>): any {
    switch (rule.type) {
        case RuleType.LEAVE:
            return (rule as Partial<LeaveRule>).configuration || {};

        case RuleType.DUTY:
            return (rule as Partial<DutyRule>).configuration || {};

        case RuleType.SUPERVISION:
            return (rule as Partial<SupervisionRule>).configuration || {};

        case RuleType.ASSIGNMENT:
            return (rule as Partial<AssignmentRule>).configuration || {};

        case RuleType.ON_CALL:
            return (rule as Partial<OnCallRule>).configuration || {};

        default:
            return {};
    }
} 