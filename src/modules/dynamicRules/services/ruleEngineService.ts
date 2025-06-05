import {
    Rule,
    RuleCondition,
    RuleAction,
    RuleEvaluationResult,
    RuleConflict,
    ConditionOperator,
    LogicalOperator,
    ActionType,
    RuleEngineOptions
} from '../types/rule';
import { logger } from "../../../lib/logger";
import { EventBusService } from '@/services/eventBusService';

/**
 * Service de moteur de règles
 * Ce service est responsable de l'évaluation des règles et de l'exécution des actions
 */
export class RuleEngineService {
    private static instance: RuleEngineService;
    private rules: Rule[] = [];
    private cachedEvaluations: Map<string, { result: boolean; timestamp: Date }> = new Map();
    private eventBus: EventBusService;
    private options: RuleEngineOptions = {
        enableCaching: true,
        cacheSize: 100,
        evaluationTimeoutMs: 2000,
        maxIterations: 1000,
        traceExecution: false,
        strictMode: false,
        fallbackPolicy: 'DENY'
    };

    private constructor() {
        this.eventBus = EventBusService.getInstance();
    }

    /**
     * Obtient l'instance singleton du service
     */
    public static getInstance(): RuleEngineService {
        if (!RuleEngineService.instance) {
            RuleEngineService.instance = new RuleEngineService();
        }
        return RuleEngineService.instance;
    }

    /**
     * Initialise le moteur de règles avec les règles et options spécifiées
     */
    public initialize(rules: Rule[], options?: Partial<RuleEngineOptions>): void {
        this.rules = [...rules];
        this.options = { ...this.options, ...options };
        this.cachedEvaluations.clear();

        this.eventBus.emit({
            type: 'rule.engine.initialized',
            data: {
                ruleCount: this.rules.length,
                options: this.options
            }
        });
    }

    /**
     * Met à jour les options du moteur
     */
    public updateOptions(options: Partial<RuleEngineOptions>): void {
        this.options = { ...this.options, ...options };
    }

    /**
     * Ajoute une règle au moteur
     */
    public addRule(rule: Rule): void {
        const existingIndex = this.rules.findIndex(r => r.id === rule.id);
        if (existingIndex >= 0) {
            this.rules[existingIndex] = rule;
        } else {
            this.rules.push(rule);
        }

        // Vérifier les conflits potentiels
        const conflicts = this.detectRuleConflicts(rule);
        if (conflicts.length > 0) {
            this.eventBus.emit({
                type: 'rule.conflicts.detected',
                data: { rule, conflicts }
            });
        }
    }

    /**
     * Supprime une règle du moteur
     */
    public removeRule(ruleId: string): boolean {
        const initialLength = this.rules.length;
        this.rules = this.rules.filter(r => r.id !== ruleId);
        return initialLength !== this.rules.length;
    }

    /**
     * Active ou désactive une règle
     */
    public setRuleStatus(ruleId: string, enabled: boolean): boolean {
        const rule = this.rules.find(r => r.id === ruleId);
        if (rule) {
            rule.enabled = enabled;
            return true;
        }
        return false;
    }

    /**
     * Évalue si les règles s'appliquent dans un contexte donné
     * @param context Le contexte dans lequel évaluer les règles
     * @param ruleTypes Types de règles spécifiques à évaluer
     * @returns Résultats de l'évaluation des règles
     */
    public evaluateRules(context: Record<string, any>, ruleTypes?: string[]): RuleEvaluationResult[] {
        const applicableRules = this.getApplicableRules(context, ruleTypes);
        const results: RuleEvaluationResult[] = [];

        for (const rule of applicableRules) {
            const result = this.evaluateRule(rule, context);
            results.push(result);

            // Émettre un événement pour chaque évaluation de règle
            this.eventBus.emit({
                type: 'rule.evaluated',
                data: { result }
            });
        }

        return results;
    }

    /**
     * Obtient les règles applicables dans un contexte donné
     */
    private getApplicableRules(context: Record<string, any>, ruleTypes?: string[]): Rule[] {
        return this.rules.filter(rule => {
            // Ne considérer que les règles activées
            if (!rule.enabled) return false;

            // Filtrer par type si spécifié
            if (ruleTypes && ruleTypes.length > 0 && !ruleTypes.includes(rule.type)) {
                return false;
            }

            // Filtrer par contexte si la règle a des contextes spécifiés
            if (rule.contexts && rule.contexts.length > 0) {
                if (!context.context || !rule.contexts.includes(context.context)) {
                    return false;
                }
            }

            return true;
        }).sort((a, b) => b.priority - a.priority); // Trier par priorité décroissante
    }

    /**
     * Évalue une règle dans un contexte donné
     */
    private evaluateRule(rule: Rule, context: Record<string, any>): RuleEvaluationResult {
        const result: RuleEvaluationResult = {
            ruleId: rule.id,
            ruleName: rule.name,
            isApplicable: false,
            actionsApplied: [],
            conditionsMatched: [],
            context,
            timestamp: new Date()
        };

        try {
            // Vérifier le cache si activé
            if (this.options.enableCaching) {
                const cacheKey = this.generateCacheKey(rule.id, context);
                const cachedResult = this.cachedEvaluations.get(cacheKey);
                if (cachedResult) {
                    // Si le résultat est suffisamment récent (moins de 10 secondes)
                    const now = new Date();
                    const cacheAge = now.getTime() - cachedResult.timestamp.getTime();
                    if (cacheAge < 10000) {
                        result.isApplicable = cachedResult.result;
                        return result;
                    }
                }
            }

            // Évaluer les conditions de la règle
            if (rule.conditionGroups && rule.conditionGroups.length > 0) {
                // Logique complexe avec groupes de conditions
                result.isApplicable = this.evaluateConditionGroups(rule, context, result);
            } else {
                // Logique simple (toutes les conditions doivent être vraies)
                result.isApplicable = this.evaluateConditions(rule.conditions, context, LogicalOperator.AND, result);
            }

            // Si la règle est applicable, exécuter les actions
            if (result.isApplicable) {
                for (const action of rule.actions) {
                    const actionSuccess = this.executeAction(action, context);
                    if (actionSuccess) {
                        result.actionsApplied.push(action);
                    }
                }
            }

            // Mettre à jour le cache
            if (this.options.enableCaching) {
                const cacheKey = this.generateCacheKey(rule.id, context);
                this.cachedEvaluations.set(cacheKey, {
                    result: result.isApplicable,
                    timestamp: new Date()
                });

                // Limiter la taille du cache
                if (this.cachedEvaluations.size > this.options.cacheSize!) {
                    // Supprimer la plus ancienne entrée
                    const oldestKey = Array.from(this.cachedEvaluations.entries())
                        .sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime())[0][0];
                    this.cachedEvaluations.delete(oldestKey);
                }
            }
        } catch (error) {
            result.error = error as Error;
            logger.error(`Erreur lors de l'évaluation de la règle ${rule.id}:`, error);
        }

        return result;
    }

    /**
     * Évalue un ensemble de conditions avec un opérateur logique
     */
    private evaluateConditions(
        conditions: RuleCondition[],
        context: Record<string, any>,
        operator: LogicalOperator,
        result: RuleEvaluationResult
    ): boolean {
        if (conditions.length === 0) return true;

        let evaluationResult = operator === LogicalOperator.AND;

        for (const condition of conditions) {
            const conditionResult = this.evaluateCondition(condition, context);

            if (conditionResult) {
                result.conditionsMatched.push(condition);
            }

            switch (operator) {
                case LogicalOperator.AND:
                    evaluationResult = evaluationResult && conditionResult;
                    if (!evaluationResult) return false; // Court-circuit pour AND
                    break;
                case LogicalOperator.OR:
                    evaluationResult = evaluationResult || conditionResult;
                    if (evaluationResult) return true; // Court-circuit pour OR
                    break;
                case LogicalOperator.XOR:
                    evaluationResult = evaluationResult !== conditionResult;
                    break;
                case LogicalOperator.NAND:
                    evaluationResult = !(evaluationResult && conditionResult);
                    break;
                case LogicalOperator.NOR:
                    evaluationResult = !(evaluationResult || conditionResult);
                    break;
            }
        }

        return evaluationResult;
    }

    /**
     * Évalue les groupes de conditions d'une règle
     */
    private evaluateConditionGroups(rule: Rule, context: Record<string, any>, result: RuleEvaluationResult): boolean {
        if (!rule.conditionGroups || rule.conditionGroups.length === 0) {
            return this.evaluateConditions(rule.conditions, context, LogicalOperator.AND, result);
        }

        // Évaluer d'abord les groupes sans parent (groupes racines)
        const rootGroups = rule.conditionGroups.filter(group => !group.parent);
        if (rootGroups.length === 0) {
            return this.evaluateConditions(rule.conditions, context, LogicalOperator.AND, result);
        }

        // Évaluer chaque groupe racine avec l'opérateur AND entre eux
        let finalResult = true;
        for (const group of rootGroups) {
            const groupResult = this.evaluateConditionGroup(group, rule.conditionGroups, context, result);
            finalResult = finalResult && groupResult;
            if (!finalResult) break; // Court-circuit pour AND
        }

        return finalResult;
    }

    /**
     * Évalue un groupe de conditions spécifique
     */
    private evaluateConditionGroup(
        group: { id: string; conditions: RuleCondition[]; operator: LogicalOperator },
        allGroups: { id: string; conditions: RuleCondition[]; operator: LogicalOperator; parent?: string }[],
        context: Record<string, any>,
        result: RuleEvaluationResult
    ): boolean {
        // Évaluer d'abord ce groupe
        const ownResult = this.evaluateConditions(group.conditions, context, group.operator, result);

        // Trouver tous les groupes enfants
        const childGroups = allGroups.filter(g => g.parent === group.id);
        if (childGroups.length === 0) {
            return ownResult;
        }

        // Combiner le résultat de ce groupe avec les résultats des groupes enfants
        let combinedResult = ownResult;
        for (const childGroup of childGroups) {
            const childResult = this.evaluateConditionGroup(childGroup, allGroups, context, result);
            // Par défaut, on utilise AND entre les groupes parent et enfants
            combinedResult = combinedResult && childResult;
            if (!combinedResult) break; // Court-circuit pour AND
        }

        return combinedResult;
    }

    /**
     * Évalue une condition individuelle
     */
    private evaluateCondition(condition: RuleCondition, context: Record<string, any>): boolean {
        let result = false;
        let fieldValue: any;

        // Récupérer la valeur du champ dans le contexte
        try {
            // Support pour la notation pointée (ex: user.profile.age)
            fieldValue = condition.field.split('.').reduce((obj, key) =>
                (obj && obj[key] !== undefined) ? obj[key] : undefined,
                context
            );
        } catch (error) {
            logger.error(`Erreur lors de l'accès au champ ${condition.field}:`, error);
            fieldValue = undefined;
        }

        // Si le champ n'existe pas et que le mode strict est activé, lever une erreur
        if (fieldValue === undefined && this.options.strictMode) {
            throw new Error(`Le champ '${condition.field}' n'existe pas dans le contexte`);
        }

        // Évaluer la condition en fonction de l'opérateur
        switch (condition.operator) {
            case ConditionOperator.EQUALS:
                result = fieldValue === condition.value;
                break;
            case ConditionOperator.NOT_EQUALS:
                result = fieldValue !== condition.value;
                break;
            case ConditionOperator.GREATER_THAN:
                result = fieldValue > condition.value;
                break;
            case ConditionOperator.LESS_THAN:
                result = fieldValue < condition.value;
                break;
            case ConditionOperator.GREATER_THAN_OR_EQUAL:
                result = fieldValue >= condition.value;
                break;
            case ConditionOperator.LESS_THAN_OR_EQUAL:
                result = fieldValue <= condition.value;
                break;
            case ConditionOperator.CONTAINS:
                if (Array.isArray(fieldValue)) {
                    result = fieldValue.includes(condition.value);
                } else if (typeof fieldValue === 'string') {
                    result = fieldValue.includes(String(condition.value));
                }
                break;
            case ConditionOperator.NOT_CONTAINS:
                if (Array.isArray(fieldValue)) {
                    result = !fieldValue.includes(condition.value);
                } else if (typeof fieldValue === 'string') {
                    result = !fieldValue.includes(String(condition.value));
                }
                break;
            case ConditionOperator.STARTS_WITH:
                if (typeof fieldValue === 'string') {
                    result = fieldValue.startsWith(String(condition.value));
                }
                break;
            case ConditionOperator.ENDS_WITH:
                if (typeof fieldValue === 'string') {
                    result = fieldValue.endsWith(String(condition.value));
                }
                break;
            case ConditionOperator.IN:
                if (Array.isArray(condition.value)) {
                    result = condition.value.includes(fieldValue);
                }
                break;
            case ConditionOperator.NOT_IN:
                if (Array.isArray(condition.value)) {
                    result = !condition.value.includes(fieldValue);
                }
                break;
            case ConditionOperator.BETWEEN:
                if (Array.isArray(condition.value) && condition.value.length === 2) {
                    result = fieldValue >= condition.value[0] && fieldValue <= condition.value[1];
                }
                break;
            default:
                logger.warn(`Opérateur non supporté: ${condition.operator}`);
                return false;
        }

        // Inverser le résultat si la condition est négative
        if (condition.isNegated) {
            result = !result;
        }

        return result;
    }

    /**
     * Exécute une action de règle
     */
    private executeAction(action: RuleAction, context: Record<string, any>): boolean {
        try {
            // Tracer l'exécution si activé
            if (this.options.traceExecution) {
                logger.info(`Exécution de l'action ${action.id} de type ${action.type}`, action);
            }

            switch (action.type) {
                case ActionType.ALLOW:
                case ActionType.DENY:
                    // Ces actions ne font rien directement, elles servent juste à indiquer le résultat
                    break;

                case ActionType.MODIFY:
                    // Modifier une valeur dans le contexte
                    if (action.target && action.parameters && action.parameters.value !== undefined) {
                        this.setValueInContext(context, action.target, action.parameters.value);
                    } else {
                        throw new Error(`Action MODIFY nécessite target et parameters.value`);
                    }
                    break;

                case ActionType.NOTIFY:
                    // Émettre une notification
                    if (action.parameters) {
                        this.eventBus.emit({
                            type: 'rule.notification',
                            data: {
                                actionId: action.id,
                                message: action.parameters.message || 'Notification de règle',
                                level: action.parameters.level || 'info',
                                target: action.target,
                                context: { ...context }
                            }
                        });
                    }
                    break;

                case ActionType.CALCULATE:
                    // Effectuer un calcul et stocker le résultat
                    if (action.parameters && action.parameters.formula && action.target) {
                        const result = this.evaluateFormula(action.parameters.formula, context);
                        this.setValueInContext(context, action.target, result);
                    } else {
                        throw new Error(`Action CALCULATE nécessite formula et target`);
                    }
                    break;

                case ActionType.TRIGGER:
                    // Déclencher un événement
                    if (action.parameters && action.parameters.eventType) {
                        this.eventBus.emit({
                            type: action.parameters.eventType,
                            data: {
                                source: 'rule-engine',
                                actionId: action.id,
                                context: action.parameters.includeContext ? { ...context } : undefined,
                                payload: action.parameters.payload
                            }
                        });
                    } else {
                        throw new Error(`Action TRIGGER nécessite eventType`);
                    }
                    break;

                case ActionType.LOG:
                    // Journaliser l'exécution
                    if (action.parameters) {
                        const logLevel = action.parameters.level || 'info';
                        const message = action.parameters.message || `Action ${action.id} exécutée`;

                        if (logLevel === 'error') {
                            logger.error(message, action.parameters.details);
                        } else if (logLevel === 'warn') {
                            logger.warn(message, action.parameters.details);
                        } else {
                            logger.info(message, action.parameters.details);
                        }
                    }
                    break;

                default:
                    logger.warn(`Type d'action non implémenté: ${action.type}`);
                    return false;
            }

            return true;
        } catch (error) {
            logger.error(`Erreur lors de l'exécution de l'action ${action.id}:`, error);

            // Exécuter l'action de fallback si spécifiée
            if (action.fallbackAction) {
                const fallbackAction = this.findActionById(action.fallbackAction);
                if (fallbackAction) {
                    logger.info(`Exécution de l'action de fallback ${fallbackAction.id}`);
                    return this.executeAction(fallbackAction, context);
                }
            }

            return false;
        }
    }

    /**
     * Trouve une action par son ID
     */
    private findActionById(actionId: string): RuleAction | undefined {
        for (const rule of this.rules) {
            const action = rule.actions.find(a => a.id === actionId);
            if (action) return action;
        }
        return undefined;
    }

    /**
     * Définit une valeur dans le contexte (supporte la notation pointée)
     */
    private setValueInContext(context: Record<string, any>, path: string, value: any): void {
        const parts = path.split('.');
        let current = context;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (current[part] === undefined) {
                current[part] = {};
            }
            current = current[part];
        }

        current[parts[parts.length - 1]] = value;
    }

    /**
     * Évalue une formule simple
     * Note: Dans un environnement de production, il faudrait utiliser une bibliothèque
     * d'évaluation sécurisée pour éviter les injections de code
     */
    private evaluateFormula(formula: string, context: Record<string, any>): any {
        // Cette implémentation est simplifiée et non sécurisée
        // Remplacer les références aux champs par leurs valeurs
        const evaluableFormula = formula.replace(/\$\{([^}]+)\}/g, (match, path) => {
            try {
                const value = path.split('.').reduce((obj, key) =>
                    (obj && obj[key] !== undefined) ? obj[key] : undefined,
                    context
                );
                return JSON.stringify(value);
            } catch (e) {
                return 'undefined';
            }
        });

        try {
            // eslint-disable-next-line no-eval
            return eval(evaluableFormula);
        } catch (error) {
            logger.error(`Erreur lors de l'évaluation de la formule ${formula}:`, error);
            return null;
        }
    }

    /**
     * Génère une clé de cache unique pour une règle et un contexte
     */
    private generateCacheKey(ruleId: string, context: Record<string, any>): string {
        // Simplification: utilisation d'un hachage simple du contexte
        const contextHash = JSON.stringify(context);
        return `${ruleId}:${contextHash}`;
    }

    /**
     * Détecte les conflits potentiels entre une règle et les règles existantes
     */
    public detectRuleConflicts(rule: Rule): RuleConflict[] {
        const conflicts: RuleConflict[] = [];

        for (const existingRule of this.rules) {
            // Ne pas comparer avec elle-même
            if (existingRule.id === rule.id) continue;

            // Ne comparer que les règles activées et du même type
            if (!existingRule.enabled || existingRule.type !== rule.type) continue;

            // Vérifier les conditions qui pourraient se chevaucher
            const hasOverlappingConditions = this.checkConditionsOverlap(rule.conditions, existingRule.conditions);

            // Vérifier les actions contradictoires
            const hasConflictingActions = this.checkActionsConflict(rule.actions, existingRule.actions);

            if (hasOverlappingConditions && hasConflictingActions) {
                conflicts.push({
                    id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    ruleIds: [rule.id, existingRule.id],
                    conflictType: 'DIRECT',
                    severity: 'HIGH',
                    description: `Conflit direct entre les règles "${rule.name}" et "${existingRule.name}"`,
                    detectedAt: new Date(),
                    isResolved: false
                });
            } else if (hasOverlappingConditions) {
                conflicts.push({
                    id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    ruleIds: [rule.id, existingRule.id],
                    conflictType: 'PARTIAL',
                    severity: 'MEDIUM',
                    description: `Chevauchement de conditions entre "${rule.name}" et "${existingRule.name}"`,
                    detectedAt: new Date(),
                    isResolved: false
                });
            }
        }

        return conflicts;
    }

    /**
     * Vérifie si deux ensembles de conditions peuvent se chevaucher
     * Cette implémentation est simplifiée - une analyse plus complexe serait nécessaire 
     * pour des cas réels
     */
    private checkConditionsOverlap(conditions1: RuleCondition[], conditions2: RuleCondition[]): boolean {
        // Trouver des conditions portant sur les mêmes champs
        for (const condition1 of conditions1) {
            for (const condition2 of conditions2) {
                if (condition1.field === condition2.field) {
                    // Vérifier si les conditions peuvent se chevaucher
                    if (this.canConditionsOverlap(condition1, condition2)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Vérifie si deux conditions individuelles peuvent se chevaucher
     */
    private canConditionsOverlap(condition1: RuleCondition, condition2: RuleCondition): boolean {
        // Analyse simplifiée - une logique plus sophistiquée serait nécessaire
        // pour une détection précise

        // Si ce sont des égalités strictes identiques
        if (condition1.operator === ConditionOperator.EQUALS &&
            condition2.operator === ConditionOperator.EQUALS) {
            return condition1.value === condition2.value;
        }

        // Si ce sont des inégalités qui peuvent se chevaucher
        if ((condition1.operator === ConditionOperator.GREATER_THAN ||
            condition1.operator === ConditionOperator.GREATER_THAN_OR_EQUAL) &&
            (condition2.operator === ConditionOperator.LESS_THAN ||
                condition2.operator === ConditionOperator.LESS_THAN_OR_EQUAL)) {
            return true;
        }

        if ((condition2.operator === ConditionOperator.GREATER_THAN ||
            condition2.operator === ConditionOperator.GREATER_THAN_OR_EQUAL) &&
            (condition1.operator === ConditionOperator.LESS_THAN ||
                condition1.operator === ConditionOperator.LESS_THAN_OR_EQUAL)) {
            return true;
        }

        // Si l'un des opérateurs est IN et que l'autre est une égalité
        if (condition1.operator === ConditionOperator.IN &&
            condition2.operator === ConditionOperator.EQUALS) {
            return Array.isArray(condition1.value) && condition1.value.includes(condition2.value);
        }

        if (condition2.operator === ConditionOperator.IN &&
            condition1.operator === ConditionOperator.EQUALS) {
            return Array.isArray(condition2.value) && condition2.value.includes(condition1.value);
        }

        // Par défaut, supposer qu'il peut y avoir chevauchement
        return true;
    }

    /**
     * Vérifie si deux ensembles d'actions peuvent entrer en conflit
     */
    private checkActionsConflict(actions1: RuleAction[], actions2: RuleAction[]): boolean {
        for (const action1 of actions1) {
            for (const action2 of actions2) {
                // Cas évident: une action autorise et l'autre refuse
                if ((action1.type === ActionType.ALLOW && action2.type === ActionType.DENY) ||
                    (action1.type === ActionType.DENY && action2.type === ActionType.ALLOW)) {
                    return true;
                }

                // Deux modifications sur le même champ
                if (action1.type === ActionType.MODIFY && action2.type === ActionType.MODIFY &&
                    action1.target === action2.target) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Valide l'intégrité des règles dans le moteur
     */
    public validateRules(): { isValid: boolean; errors: { ruleId: string; error: string }[] } {
        const errors: { ruleId: string; error: string }[] = [];

        for (const rule of this.rules) {
            // Vérifier que le type de règle est valide
            if (!Object.values(ActionType).includes(rule.type as any)) {
                errors.push({
                    ruleId: rule.id,
                    error: `Type de règle invalide: ${rule.type}`
                });
            }

            // Vérifier que chaque règle a au moins une condition
            if (rule.conditions.length === 0 &&
                (!rule.conditionGroups || rule.conditionGroups.length === 0)) {
                errors.push({
                    ruleId: rule.id,
                    error: 'La règle ne contient aucune condition'
                });
            }

            // Vérifier que chaque règle a au moins une action
            if (rule.actions.length === 0) {
                errors.push({
                    ruleId: rule.id,
                    error: 'La règle ne contient aucune action'
                });
            }

            // Vérifier les références aux groupes de conditions
            if (rule.conditions.some(c =>
                c.group && (!rule.conditionGroups || !rule.conditionGroups.some(g => g.id === c.group))
            )) {
                errors.push({
                    ruleId: rule.id,
                    error: 'Une condition référence un groupe inexistant'
                });
            }

            // Vérifier les références aux actions de fallback
            if (rule.actions.some(a =>
                a.fallbackAction && !rule.actions.some(fa => fa.id === a.fallbackAction)
            )) {
                errors.push({
                    ruleId: rule.id,
                    error: 'Une action référence une action de fallback inexistante'
                });
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

export default RuleEngineService; 