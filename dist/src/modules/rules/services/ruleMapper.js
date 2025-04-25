var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { RuleType, RulePriority, RuleSeverity } from '../types/rule';
/**
 * Convertit un enum RuleType de Prisma en RuleType de notre application
 */
export function mapRuleType(prismaType) {
    switch (prismaType) {
        case 'LEAVE': return RuleType.LEAVE;
        case 'DUTY': return RuleType.DUTY;
        case 'SUPERVISION': return RuleType.SUPERVISION;
        case 'ASSIGNMENT': return RuleType.ASSIGNMENT;
        case 'ON_CALL': return RuleType.ON_CALL;
        default:
            throw new Error("Type de r\u00E8gle non reconnu: ".concat(prismaType));
    }
}
/**
 * Convertit un enum RulePriority de Prisma en RulePriority de notre application
 */
export function mapRulePriority(prismaPriority) {
    switch (prismaPriority) {
        case 'LOW': return RulePriority.LOW;
        case 'MEDIUM': return RulePriority.MEDIUM;
        case 'HIGH': return RulePriority.HIGH;
        case 'CRITICAL': return RulePriority.CRITICAL;
        default:
            throw new Error("Priorit\u00E9 de r\u00E8gle non reconnue: ".concat(prismaPriority));
    }
}
/**
 * Convertit un enum RuleSeverity de Prisma en RuleSeverity de notre application
 */
export function mapRuleSeverity(prismaSeverity) {
    switch (prismaSeverity) {
        case 'LOW': return RuleSeverity.LOW;
        case 'MEDIUM': return RuleSeverity.MEDIUM;
        case 'HIGH': return RuleSeverity.HIGH;
        default:
            throw new Error("S\u00E9v\u00E9rit\u00E9 de conflit non reconnue: ".concat(prismaSeverity));
    }
}
/**
 * Convertit une règle Prisma en règle de notre application
 */
export function mapPrismaRuleToRule(prismaRule) {
    var type = mapRuleType(prismaRule.type);
    var baseFields = {
        id: prismaRule.id,
        name: prismaRule.name,
        description: prismaRule.description || '',
        type: type,
        priority: parseInt(prismaRule.priority), // Convertir en nombre
        isActive: prismaRule.isActive,
        createdAt: new Date(prismaRule.createdAt),
        updatedAt: new Date(prismaRule.updatedAt),
        createdBy: prismaRule.createdBy.toString()
    };
    // Configuration spécifique selon le type
    var configuration = prismaRule.configuration;
    // Créer l'objet de règle selon le type
    switch (type) {
        case RuleType.LEAVE:
            return __assign(__assign({}, baseFields), { type: RuleType.LEAVE, configuration: configuration });
        case RuleType.DUTY:
            return __assign(__assign({}, baseFields), { type: RuleType.DUTY, configuration: configuration });
        case RuleType.SUPERVISION:
            return __assign(__assign({}, baseFields), { type: RuleType.SUPERVISION, configuration: configuration });
        case RuleType.ASSIGNMENT:
            return __assign(__assign({}, baseFields), { type: RuleType.ASSIGNMENT, configuration: configuration });
        case RuleType.ON_CALL:
            return __assign(__assign({}, baseFields), { type: RuleType.ON_CALL, configuration: configuration });
        default:
            throw new Error("Type de r\u00E8gle non g\u00E9r\u00E9: ".concat(type));
    }
}
/**
 * Convertit un conflit Prisma en conflit de notre application
 */
export function mapPrismaConflictToConflict(prismaConflict) {
    var _a;
    return {
        id: prismaConflict.id,
        ruleIds: ((_a = prismaConflict.rules) === null || _a === void 0 ? void 0 : _a.map(function (rule) { return rule.id; })) || [],
        description: prismaConflict.description,
        severity: mapRuleSeverity(prismaConflict.severity),
        detectedAt: new Date(prismaConflict.detectedAt),
        resolvedAt: prismaConflict.resolvedAt ? new Date(prismaConflict.resolvedAt) : undefined
    };
}
/**
 * Convertit un type RuleType de notre application en RuleType de Prisma
 */
export function mapToPrismaRuleType(type) {
    switch (type) {
        case RuleType.LEAVE: return 'LEAVE';
        case RuleType.DUTY: return 'DUTY';
        case RuleType.SUPERVISION: return 'SUPERVISION';
        case RuleType.ASSIGNMENT: return 'ASSIGNMENT';
        case RuleType.ON_CALL: return 'ON_CALL';
        default:
            throw new Error("Type de r\u00E8gle non reconnu: ".concat(type));
    }
}
/**
 * Convertit un type RulePriority de notre application en RulePriority de Prisma
 */
export function mapToPrismaRulePriority(priority) {
    switch (priority) {
        case RulePriority.LOW: return 'LOW';
        case RulePriority.MEDIUM: return 'MEDIUM';
        case RulePriority.HIGH: return 'HIGH';
        case RulePriority.CRITICAL: return 'CRITICAL';
        default:
            throw new Error("Priorit\u00E9 de r\u00E8gle non reconnue: ".concat(priority));
    }
}
/**
 * Convertit un type RuleSeverity de notre application en RuleSeverity de Prisma
 */
export function mapToPrismaRuleSeverity(severity) {
    switch (severity) {
        case RuleSeverity.LOW: return 'LOW';
        case RuleSeverity.MEDIUM: return 'MEDIUM';
        case RuleSeverity.HIGH: return 'HIGH';
        default:
            throw new Error("S\u00E9v\u00E9rit\u00E9 de conflit non reconnue: ".concat(severity));
    }
}
/**
 * Convertit une règle de notre application en format adapté pour Prisma
 */
export function mapRuleToPrismaRule(rule) {
    if (!rule.type) {
        throw new Error('Le type de règle est requis');
    }
    return {
        name: rule.name,
        description: rule.description,
        type: mapToPrismaRuleType(rule.type),
        priority: rule.priority ? mapToPrismaRulePriority(rule.priority) : undefined,
        isActive: rule.isActive,
        validFrom: rule.validFrom,
        validTo: rule.validTo,
        configuration: buildRuleConfiguration(rule)
    };
}
/**
 * Construit l'objet de configuration selon le type de règle
 */
function buildRuleConfiguration(rule) {
    switch (rule.type) {
        case RuleType.LEAVE:
            return rule.configuration || {};
        case RuleType.DUTY:
            return rule.configuration || {};
        case RuleType.SUPERVISION:
            return rule.configuration || {};
        case RuleType.ASSIGNMENT:
            return rule.configuration || {};
        case RuleType.ON_CALL:
            return rule.configuration || {};
        default:
            return {};
    }
}
