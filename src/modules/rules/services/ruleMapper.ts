import { prisma } from '@/lib/prisma';

import { logger } from "../../../lib/logger";
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
    configuration: unknown;
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
    SupervisionRule,
    RuleType,
    RuleSeverity,
    RuleScope,
    Rule
} from '../types/rule';

/**
 * Convertit un enum RuleType de Prisma en RuleType de notre application
 */
export function mapRuleType(prismaType: PrismaRuleType): RuleType {
    switch (prismaType) {
        case 'LEAVE': return RuleType.LEAVE_RESTRICTION;
        case 'DUTY': return RuleType.DUTY;
        case 'SUPERVISION': return RuleType.SUPERVISION;
        case 'ASSIGNMENT': return RuleType.PLANNING;
        case 'ON_CALL': return RuleType.DUTY;
        default:
            if (Object.values(RuleType).includes(prismaType as RuleType)) {
                return prismaType as RuleType;
            }
            logger.warn(`Type de règle Prisma non mappé explicitement: ${prismaType}, tentative de cast direct`);
            return prismaType as RuleType;
    }
}

/**
 * Convertit un enum RulePriority de Prisma en priorité numérique
 */
export function mapRulePriority(prismaPriority: PrismaRulePriority): number {
    switch (prismaPriority) {
        case 'LOW': return 25;
        case 'MEDIUM': return 50;
        case 'HIGH': return 75;
        case 'CRITICAL': return 100;
        default:
            return 50; // Valeur par défaut
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
export function mapPrismaRuleToRule(prismaRule: PrismaRule & { createdByUser?: unknown, updatedByUser?: unknown }): AnyRule {
    const type = mapRuleType(prismaRule.type);
    const baseFields: Rule = {
        id: prismaRule.id,
        name: prismaRule.name,
        description: prismaRule.description || undefined,
        type,
        priority: mapRulePriority(prismaRule.priority),
        severity: RuleSeverity.MEDIUM, // Valeur par défaut
        scope: RuleScope.GLOBAL, // Valeur par défaut
        enabled: prismaRule.isActive,
        parameters: {},
        configuration: prismaRule.configuration as any,
        createdAt: new Date(prismaRule.createdAt),
        updatedAt: new Date(prismaRule.updatedAt),
    };

    switch (type) {
        case RuleType.DUTY:
            return { ...baseFields, type: RuleType.DUTY, dutyConfig: baseFields.configuration } as DutyRule;
        case RuleType.SUPERVISION:
            return { ...baseFields, type: RuleType.SUPERVISION, supervisionConfig: baseFields.configuration } as SupervisionRule;
        default:
            logger.warn(`Mappage spécifique non implémenté pour le type: ${type}. Retour de la règle de base.`);
            return baseFields as AnyRule;
    }
}

/**
 * Convertit un conflit Prisma en conflit de notre application
 */
// export function mapPrismaConflictToConflict(
//     prismaConflict: PrismaRuleConflict
// ): RuleConflict {
//     return {
//         id: prismaConflict.id,
//         ruleIds: prismaConflict.rules?.map(rule => rule.id) || [],
//         description: prismaConflict.description,
//         severity: mapRuleSeverity(prismaConflict.severity),
//         detectedAt: new Date(prismaConflict.detectedAt),
//         resolvedAt: prismaConflict.resolvedAt ? new Date(prismaConflict.resolvedAt) : undefined
//     };
// }

/**
 * Convertit un type RuleType de notre application en RuleType de Prisma
 */
export function mapToPrismaRuleType(type: RuleType): PrismaRuleType {
    switch (type) {
        case RuleType.LEAVE_RESTRICTION: return 'LEAVE';
        case RuleType.DUTY: return 'DUTY';
        case RuleType.SUPERVISION: return 'SUPERVISION';
        case RuleType.PLANNING: return 'ASSIGNMENT';
        default:
            if (['LEAVE', 'DUTY', 'SUPERVISION', 'ASSIGNMENT', 'ON_CALL'].includes(type)) {
                return type as PrismaRuleType;
            }
            throw new Error(`Type de règle d'application non reconnu pour mappage Prisma: ${type}`);
    }
}

/**
 * Convertit une priorité numérique en RulePriority de Prisma
 */
export function mapToPrismaRulePriority(priority: number): PrismaRulePriority {
    if (priority <= 25) return 'LOW';
    if (priority <= 50) return 'MEDIUM';
    if (priority <= 75) return 'HIGH';
    return 'CRITICAL';
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
    const type = rule.type;

    return {
        name: rule.name,
        description: rule.description,
        type: mapToPrismaRuleType(type),
        priority: rule.priority ? mapToPrismaRulePriority(rule.priority) : 'MEDIUM',
        isActive: (rule as Rule).enabled,
        // validFrom: (rule as Rule).validFrom,
        // validTo: (rule as Rule).validTo,
        configuration: buildRuleConfiguration(rule)
    };
}

/**
 * Construit l'objet de configuration selon le type de règle
 */
function buildRuleConfiguration(rule: Partial<AnyRule>): any {
    switch (rule.type) {
        case RuleType.DUTY:
            return (rule as Partial<DutyRule>).dutyConfig || {};
        case RuleType.SUPERVISION:
            return (rule as Partial<SupervisionRule>).supervisionConfig || {};
        default:
            return (rule as Rule).configuration || {};
    }
}