import {
    Rule,
    RuleType,
    RulePriority,
    RuleCondition,
    ConditionGroup,
    RuleAction,
    ActionType,
    ComparisonOperator,
    LogicalOperator
} from '../types/rule';
import { AuditService } from '@/services/AuditService';
import { RuleConflictDetectionService } from './RuleConflictDetectionService';

/**
 * Interface pour les résultats de validation
 */
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

/**
 * Interface pour les erreurs de validation
 */
export interface ValidationError {
    code: string;
    message: string;
    path?: string;
    severity: 'ERROR';
}

/**
 * Interface pour les avertissements de validation
 */
export interface ValidationWarning {
    code: string;
    message: string;
    path?: string;
    severity: 'WARNING';
}

/**
 * Types de valeurs acceptées pour les conditions
 */
type AcceptedValueType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';

/**
 * Service de validation des règles
 * Ce service permet de valider la syntaxe et la sémantique des règles
 */
export class RuleValidationService {
    private static instance: RuleValidationService;
    private conflictService: RuleConflictDetectionService;
    private auditService: AuditService;

    // Mapping des opérateurs et des types de valeurs supportés
    private operatorValueTypes: Record<ComparisonOperator, AcceptedValueType[]> = {
        [ComparisonOperator.EQUALS]: ['string', 'number', 'boolean', 'date'],
        [ComparisonOperator.NOT_EQUALS]: ['string', 'number', 'boolean', 'date'],
        [ComparisonOperator.GREATER_THAN]: ['number', 'date'],
        [ComparisonOperator.LESS_THAN]: ['number', 'date'],
        [ComparisonOperator.GREATER_THAN_OR_EQUALS]: ['number', 'date'],
        [ComparisonOperator.LESS_THAN_OR_EQUALS]: ['number', 'date'],
        [ComparisonOperator.CONTAINS]: ['string', 'array'],
        [ComparisonOperator.NOT_CONTAINS]: ['string', 'array'],
        [ComparisonOperator.STARTS_WITH]: ['string'],
        [ComparisonOperator.ENDS_WITH]: ['string'],
        [ComparisonOperator.IN]: ['array'],
        [ComparisonOperator.NOT_IN]: ['array'],
        [ComparisonOperator.EXISTS]: [],
        [ComparisonOperator.NOT_EXISTS]: [],
        [ComparisonOperator.MATCHES]: ['string'],
        [ComparisonOperator.BETWEEN]: ['number', 'date'],
    };

    private constructor() {
        this.conflictService = RuleConflictDetectionService.getInstance();
        this.auditService = AuditService.getInstance();
    }

    /**
     * Obtient l'instance singleton du service
     */
    public static getInstance(): RuleValidationService {
        if (!RuleValidationService.instance) {
            RuleValidationService.instance = new RuleValidationService();
        }
        return RuleValidationService.instance;
    }

    /**
     * Valide une règle complète
     * @param rule Règle à valider
     * @param existingRules Règles existantes (pour la validation des conflits)
     * @returns Résultats de validation
     */
    public validateRule(rule: Rule, existingRules: Rule[] = []): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // Valider les champs obligatoires de base
        this.validateBasicFields(rule, result);

        // Valider les conditions
        this.validateConditions(rule.conditions, rule.conditionGroups, result);

        // Valider les actions
        this.validateActions(rule.actions, result);

        // Vérifier la cohérence sémantique
        this.validateSemantics(rule, result);

        // Vérifier les conflits potentiels
        if (existingRules.length > 0) {
            this.validateConflicts(rule, existingRules, result);
        }

        // Journaliser la validation
        this.auditValidation(rule, result);

        // Mise à jour du statut global
        result.isValid = result.errors.length === 0;

        return result;
    }

    /**
     * Valide les champs de base d'une règle
     */
    private validateBasicFields(rule: Rule, result: ValidationResult): void {
        // Vérifier les champs obligatoires
        if (!rule.id) {
            result.errors.push({
                code: 'MISSING_ID',
                message: 'L\'identifiant de la règle est obligatoire',
                path: 'id',
                severity: 'ERROR'
            });
        }

        if (!rule.name || rule.name.trim().length === 0) {
            result.errors.push({
                code: 'MISSING_NAME',
                message: 'Le nom de la règle est obligatoire',
                path: 'name',
                severity: 'ERROR'
            });
        } else if (rule.name.length < 3) {
            result.warnings.push({
                code: 'SHORT_NAME',
                message: 'Le nom de la règle est très court, ce qui peut nuire à sa compréhension',
                path: 'name',
                severity: 'WARNING'
            });
        }

        // Vérifier que le type de règle est valide
        if (!Object.values(RuleType).includes(rule.type as RuleType)) {
            result.errors.push({
                code: 'INVALID_RULE_TYPE',
                message: `Le type de règle "${rule.type}" est invalide`,
                path: 'type',
                severity: 'ERROR'
            });
        }

        // Vérifier la validité de la priorité
        if (typeof rule.priority !== 'number' || rule.priority < 0 || rule.priority > 100) {
            result.errors.push({
                code: 'INVALID_PRIORITY',
                message: 'La priorité doit être un nombre entre 0 et 100',
                path: 'priority',
                severity: 'ERROR'
            });
        }
    }

    /**
     * Valide les conditions d'une règle
     */
    private validateConditions(
        conditions: RuleCondition[],
        conditionGroups: ConditionGroup[] | undefined,
        result: ValidationResult
    ): void {
        // Vérifier qu'il y a au moins une condition ou un groupe de conditions
        if ((!conditions || conditions.length === 0) && (!conditionGroups || conditionGroups.length === 0)) {
            result.errors.push({
                code: 'NO_CONDITIONS',
                message: 'La règle doit avoir au moins une condition ou un groupe de conditions',
                path: 'conditions',
                severity: 'ERROR'
            });
            return;
        }

        // Valider chaque condition
        conditions.forEach((condition, index) => {
            this.validateCondition(condition, `conditions[${index}]`, result);
        });

        // Valider les groupes de conditions s'ils existent
        if (conditionGroups && conditionGroups.length > 0) {
            this.validateConditionGroups(conditionGroups, conditions, result);
        }
    }

    /**
     * Valide une condition individuelle
     */
    private validateCondition(condition: RuleCondition, path: string, result: ValidationResult): void {
        // Vérifier les champs obligatoires
        if (!condition.field) {
            result.errors.push({
                code: 'MISSING_FIELD',
                message: 'Le champ de la condition est obligatoire',
                path: `${path}.field`,
                severity: 'ERROR'
            });
        }

        if (!Object.values(ComparisonOperator).includes(condition.operator as ComparisonOperator)) {
            result.errors.push({
                code: 'INVALID_OPERATOR',
                message: `L'opérateur "${condition.operator}" est invalide`,
                path: `${path}.operator`,
                severity: 'ERROR'
            });
        } else {
            // Vérifier la compatibilité entre l'opérateur et la valeur
            this.validateOperatorValueCompatibility(condition, path, result);
        }

        // Vérifier les références de groupe si spécifiées
        if (condition.group) {
            if (typeof condition.group !== 'string') {
                result.errors.push({
                    code: 'INVALID_GROUP_REFERENCE',
                    message: 'La référence de groupe doit être une chaîne de caractères',
                    path: `${path}.group`,
                    severity: 'ERROR'
                });
            }
        }
    }

    /**
     * Valide la compatibilité entre l'opérateur et la valeur
     */
    private validateOperatorValueCompatibility(
        condition: RuleCondition,
        path: string,
        result: ValidationResult
    ): void {
        const operator = condition.operator as ComparisonOperator;
        const value = condition.value;

        // Les opérateurs EXISTS et NOT_EXISTS n'ont pas besoin de valeur
        if (operator === ComparisonOperator.EXISTS || operator === ComparisonOperator.NOT_EXISTS) {
            return;
        }

        // Les autres opérateurs nécessitent une valeur (sauf si c'est intentionnellement 0, false, ou '')
        if (value === undefined || value === null) {
            result.errors.push({
                code: 'MISSING_VALUE',
                message: `L'opérateur "${operator}" nécessite une valeur`,
                path: `${path}.value`,
                severity: 'ERROR'
            });
            return;
        }

        // Vérifier la compatibilité du type de valeur avec l'opérateur
        const valueType = this.getValueType(value);
        const compatibleTypes = this.operatorValueTypes[operator] || [];

        if (compatibleTypes.length > 0 && !compatibleTypes.includes(valueType)) {
            result.errors.push({
                code: 'INCOMPATIBLE_VALUE_TYPE',
                message: `Le type de valeur "${valueType}" n'est pas compatible avec l'opérateur "${operator}"`,
                path: `${path}.value`,
                severity: 'ERROR'
            });
        }

        // Validations spécifiques pour certains opérateurs
        if (operator === ComparisonOperator.BETWEEN) {
            if (!Array.isArray(value) || value.length !== 2) {
                result.errors.push({
                    code: 'INVALID_BETWEEN_VALUE',
                    message: 'L\'opérateur BETWEEN nécessite un tableau de deux valeurs [min, max]',
                    path: `${path}.value`,
                    severity: 'ERROR'
                });
            }
        }

        if ((operator === ComparisonOperator.IN || operator === ComparisonOperator.NOT_IN) && !Array.isArray(value)) {
            result.errors.push({
                code: 'INVALID_IN_VALUE',
                message: 'Les opérateurs IN et NOT_IN nécessitent un tableau de valeurs',
                path: `${path}.value`,
                severity: 'ERROR'
            });
        }
    }

    /**
     * Valide les groupes de conditions
     */
    private validateConditionGroups(
        groups: ConditionGroup[],
        conditions: RuleCondition[],
        result: ValidationResult
    ): void {
        const groupIds = new Set<string>();

        // Vérifier chaque groupe
        groups.forEach((group, index) => {
            const path = `conditionGroups[${index}]`;

            // Vérifier les champs obligatoires
            if (!group.id) {
                result.errors.push({
                    code: 'MISSING_GROUP_ID',
                    message: 'L\'identifiant du groupe est obligatoire',
                    path: `${path}.id`,
                    severity: 'ERROR'
                });
            } else if (groupIds.has(group.id)) {
                result.errors.push({
                    code: 'DUPLICATE_GROUP_ID',
                    message: `L'identifiant de groupe "${group.id}" est en double`,
                    path: `${path}.id`,
                    severity: 'ERROR'
                });
            } else {
                groupIds.add(group.id);
            }

            // Vérifier l'opérateur logique
            if (!Object.values(LogicalOperator).includes(group.operator as LogicalOperator)) {
                result.errors.push({
                    code: 'INVALID_LOGICAL_OPERATOR',
                    message: `L'opérateur logique "${group.operator}" est invalide`,
                    path: `${path}.operator`,
                    severity: 'ERROR'
                });
            }
        });

        // Vérifier que toutes les références de groupe dans les conditions sont valides
        conditions.forEach((condition, index) => {
            if (condition.group && !groupIds.has(condition.group)) {
                result.errors.push({
                    code: 'INVALID_GROUP_REFERENCE',
                    message: `La condition fait référence à un groupe inexistant "${condition.group}"`,
                    path: `conditions[${index}].group`,
                    severity: 'ERROR'
                });
            }
        });
    }

    /**
     * Valide les actions d'une règle
     */
    private validateActions(actions: RuleAction[], result: ValidationResult): void {
        // Vérifier qu'il y a au moins une action
        if (!actions || actions.length === 0) {
            result.errors.push({
                code: 'NO_ACTIONS',
                message: 'La règle doit avoir au moins une action',
                path: 'actions',
                severity: 'ERROR'
            });
            return;
        }

        // Valider chaque action
        actions.forEach((action, index) => {
            this.validateAction(action, `actions[${index}]`, result);
        });

        // Vérifier les références de fallback
        const actionIds = new Set(actions.map(a => a.id));
        actions.forEach((action, index) => {
            if (action.fallbackAction && !actionIds.has(action.fallbackAction)) {
                result.errors.push({
                    code: 'INVALID_FALLBACK_REFERENCE',
                    message: `L'action fait référence à une action de fallback inexistante "${action.fallbackAction}"`,
                    path: `actions[${index}].fallbackAction`,
                    severity: 'ERROR'
                });
            }
        });
    }

    /**
     * Valide une action individuelle
     */
    private validateAction(action: RuleAction, path: string, result: ValidationResult): void {
        // Vérifier les champs obligatoires
        if (!action.id) {
            result.errors.push({
                code: 'MISSING_ACTION_ID',
                message: 'L\'identifiant de l\'action est obligatoire',
                path: `${path}.id`,
                severity: 'ERROR'
            });
        }

        if (!Object.values(ActionType).includes(action.type as ActionType)) {
            result.errors.push({
                code: 'INVALID_ACTION_TYPE',
                message: `Le type d'action "${action.type}" est invalide`,
                path: `${path}.type`,
                severity: 'ERROR'
            });
        }

        // Validations spécifiques selon le type d'action
        switch (action.type) {
            case ActionType.MODIFY:
                if (!action.target) {
                    result.errors.push({
                        code: 'MISSING_TARGET',
                        message: 'L\'action MODIFY doit spécifier une cible',
                        path: `${path}.target`,
                        severity: 'ERROR'
                    });
                }
                if (!action.parameters || action.parameters.value === undefined) {
                    result.errors.push({
                        code: 'MISSING_MODIFY_VALUE',
                        message: 'L\'action MODIFY doit spécifier une valeur dans ses paramètres',
                        path: `${path}.parameters.value`,
                        severity: 'ERROR'
                    });
                }
                break;

            case ActionType.NOTIFY:
                if (!action.parameters || !action.parameters.message) {
                    result.errors.push({
                        code: 'MISSING_NOTIFICATION_MESSAGE',
                        message: 'L\'action NOTIFY doit spécifier un message dans ses paramètres',
                        path: `${path}.parameters.message`,
                        severity: 'ERROR'
                    });
                }
                break;

            case ActionType.EXECUTE_FUNCTION:
                if (!action.parameters || !action.parameters.function) {
                    result.errors.push({
                        code: 'MISSING_FUNCTION_NAME',
                        message: 'L\'action EXECUTE_FUNCTION doit spécifier le nom de la fonction à exécuter',
                        path: `${path}.parameters.function`,
                        severity: 'ERROR'
                    });
                }
                break;
        }
    }

    /**
     * Valide la cohérence sémantique globale de la règle
     */
    private validateSemantics(rule: Rule, result: ValidationResult): void {
        // Vérifier que les règles de type PREVENT ont une action PREVENT
        if (rule.type === RuleType.CONSTRAINT && !rule.actions.some(a => a.type === ActionType.PREVENT)) {
            result.warnings.push({
                code: 'CONSTRAINT_WITHOUT_PREVENT',
                message: 'Une règle de type CONSTRAINT devrait généralement avoir au moins une action PREVENT',
                severity: 'WARNING'
            });
        }

        // Vérifier que les règles d'autorisation ont une action ALLOW
        if (rule.type === RuleType.ALLOCATION && !rule.actions.some(a => a.type === ActionType.ALLOW)) {
            result.warnings.push({
                code: 'ALLOCATION_WITHOUT_ALLOW',
                message: 'Une règle de type ALLOCATION devrait généralement avoir au moins une action ALLOW',
                severity: 'WARNING'
            });
        }

        // Vérifier la cohérence des dates de validité
        if (rule.metadata?.validFrom && rule.metadata?.validTo) {
            const validFrom = new Date(rule.metadata.validFrom);
            const validTo = new Date(rule.metadata.validTo);

            if (validFrom > validTo) {
                result.errors.push({
                    code: 'INVALID_DATE_RANGE',
                    message: 'La date de début de validité doit être antérieure à la date de fin',
                    path: 'metadata.validFrom',
                    severity: 'ERROR'
                });
            }
        }
    }

    /**
     * Valide les conflits potentiels avec d'autres règles
     */
    private validateConflicts(rule: Rule, existingRules: Rule[], result: ValidationResult): void {
        const conflicts = this.conflictService.detectConflictsWithRule(rule, existingRules);

        conflicts.forEach(conflict => {
            result.warnings.push({
                code: 'POTENTIAL_CONFLICT',
                message: `Conflit potentiel: ${conflict.description}`,
                severity: 'WARNING'
            });
        });

        // Détecter les règles qui seraient rendues redondantes
        const redundantRules = this.detectRedundantRules(rule, existingRules);
        redundantRules.forEach(redundantRule => {
            result.warnings.push({
                code: 'REDUNDANT_RULE',
                message: `Cette règle pourrait rendre la règle "${redundantRule.name}" (${redundantRule.id}) redondante`,
                severity: 'WARNING'
            });
        });
    }

    /**
     * Journalise les résultats de validation
     */
    private auditValidation(rule: Rule, result: ValidationResult): void {
        this.auditService.createAuditEntry({
            actionType: 'RULE_VALIDATION',
            userId: 'system',
            targetId: rule.id,
            targetType: 'rule',
            description: `Validation de la règle "${rule.name}"`,
            severity: result.errors.length > 0 ? 'MEDIUM' : 'LOW',
            metadata: {
                ruleType: rule.type,
                isValid: result.isValid,
                errorCount: result.errors.length,
                warningCount: result.warnings.length
            }
        });
    }

    /**
     * Détecte les règles qui seraient rendues redondantes par une nouvelle règle
     */
    private detectRedundantRules(newRule: Rule, existingRules: Rule[]): Rule[] {
        return existingRules.filter(existingRule => {
            // Ignorer les règles de types différents
            if (existingRule.type !== newRule.type) {
                return false;
            }

            // Vérifier si la nouvelle règle a une priorité supérieure
            // et des conditions qui englobent celles de la règle existante
            if (newRule.priority >= existingRule.priority) {
                // Logique simplifiée : on considère que si les champs surveillés sont les mêmes
                // et que les actions sont similaires, il y a un risque de redondance
                const newRuleFields = new Set(newRule.conditions.map(c => c.field));
                const existingRuleFields = new Set(existingRule.conditions.map(c => c.field));

                if (this.isSetSubset(existingRuleFields, newRuleFields)) {
                    // Vérifier si les actions sont similaires
                    const newActionTypes = new Set(newRule.actions.map(a => a.type));
                    const existingActionTypes = new Set(existingRule.actions.map(a => a.type));

                    return this.setsHaveOverlap(newActionTypes, existingActionTypes);
                }
            }

            return false;
        });
    }

    /**
     * Vérifie si un ensemble est un sous-ensemble d'un autre
     */
    private isSetSubset<T>(subset: Set<T>, superset: Set<T>): boolean {
        for (const item of subset) {
            if (!superset.has(item)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Vérifie si deux ensembles ont des éléments en commun
     */
    private setsHaveOverlap<T>(set1: Set<T>, set2: Set<T>): boolean {
        for (const item of set1) {
            if (set2.has(item)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Détermine le type d'une valeur
     */
    private getValueType(value: any): AcceptedValueType {
        if (value === null || value === undefined) {
            return 'string'; // Valeur par défaut
        }

        if (Array.isArray(value)) {
            return 'array';
        }

        if (value instanceof Date) {
            return 'date';
        }

        if (typeof value === 'object') {
            return 'object';
        }

        return typeof value as AcceptedValueType;
    }
}

// Exporter l'instance singleton
export const ruleValidationService = RuleValidationService.getInstance(); 