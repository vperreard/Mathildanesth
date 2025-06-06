import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { logger } from "../../../lib/logger";
import {
    Rule,
    RuleEvaluationResult,
    RuleAction,
    RuleCondition,
    ConditionGroup,
    ActionType,
    ComparisonOperator,
    LogicalOperator
} from '../types/rule';
import { useDebounce } from '@/hooks/useDebounce';
import { AuditService } from '@/services/AuditService';

interface UseRuleEvaluationOptions {
    /**
     * Règles à évaluer
     */
    rules: Rule[];

    /**
     * Contexte d'évaluation
     */
    context: Record<string, unknown>;

    /**
     * Types de règles à évaluer (optionnel)
     */
    ruleTypes?: string[];

    /**
     * Délai de debounce pour l'évaluation (ms)
     */
    debounceMs?: number;

    /**
     * Active ou désactive la mise en cache
     */
    enableCaching?: boolean;

    /**
     * Active ou désactive le traçage des performances
     */
    enablePerformanceTracing?: boolean;

    /**
     * Callback appelé après l'évaluation des règles
     */
    onEvaluationComplete?: (results: RuleEvaluationResult[]) => void;
}

interface UseRuleEvaluationResult {
    /**
     * Résultats de l'évaluation des règles
     */
    results: RuleEvaluationResult[];

    /**
     * Indique si l'évaluation est en cours
     */
    evaluating: boolean;

    /**
     * Erreur d'évaluation, le cas échéant
     */
    error: Error | null;

    /**
     * Force une réévaluation des règles
     */
    evaluateNow: () => void;

    /**
     * Réinitialise tous les caches
     */
    clearCache: () => void;

    /**
     * Métriques de performance
     */
    performanceMetrics: {
        evaluationTimeMs: number;
        ruleCount: number;
        conditionCount: number;
        actionCount: number;
        cacheHitCount: number;
    };
}

/**
 * Cache pour les résultats d'évaluation des conditions
 */
const conditionEvaluationCache = new Map<string, { result: boolean; timestamp: number }>();

/**
 * Cache pour les résultats d'évaluation des règles complètes
 */
const ruleEvaluationCache = new Map<string, { results: RuleEvaluationResult[]; timestamp: number }>();

// Durée de validité du cache (5 secondes)
const CACHE_TTL_MS = 5000;

/**
 * Hook pour évaluer des règles dans un contexte donné
 */
export function useRuleEvaluation(options: UseRuleEvaluationOptions): UseRuleEvaluationResult {
    const {
        rules,
        context,
        ruleTypes,
        debounceMs = 200,
        enableCaching = true,
        enablePerformanceTracing = false,
        onEvaluationComplete
    } = options;

    const [results, setResults] = useState<RuleEvaluationResult[]>([]);
    const [evaluating, setEvaluating] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [performanceMetrics, setPerformanceMetrics] = useState({
        evaluationTimeMs: 0,
        ruleCount: 0,
        conditionCount: 0,
        actionCount: 0,
        cacheHitCount: 0
    });

    // Référence pour suivre l'exécution en cours
    const evaluationInProgressRef = useRef(false);
    const auditService = useMemo(() => AuditService.getInstance(), []);

    // Entrée debouncée pour l'évaluation
    const debouncedContext = useDebounce(context, debounceMs);

    /**
     * Génère une clé de cache pour un contexte et des règles
     */
    const generateCacheKey = useCallback((ruleId: string, contextValue: Record<string, unknown>): string => {
        const contextHash = JSON.stringify(contextValue);
        return `${ruleId}-${contextHash}`;
    }, []);

    /**
     * Génère une clé de cache pour l'ensemble de l'évaluation
     */
    const generateEvaluationCacheKey = useCallback((rules: Rule[], contextValue: Record<string, unknown>): string => {
        const rulesHash = rules.map(r => r.id).sort().join('-');
        const contextHash = JSON.stringify(contextValue);
        return `evaluation-${rulesHash}-${contextHash}`;
    }, []);

    /**
     * Évalue les règles avec le contexte actuel
     */
    const evaluateRules = useCallback(async () => {
        if (evaluationInProgressRef.current) {
            return;
        }

        evaluationInProgressRef.current = true;
        setEvaluating(true);
        setError(null);

        const startTime = performance.now();
        const metrics = {
            conditionCount: 0,
            actionCount: 0,
            cacheHitCount: 0
        };

        try {
            // Vérifier le cache pour l'évaluation complète
            const evaluationCacheKey = generateEvaluationCacheKey(rules, debouncedContext);

            if (enableCaching) {
                const cachedEvaluation = ruleEvaluationCache.get(evaluationCacheKey);
                if (cachedEvaluation && (Date.now() - cachedEvaluation.timestamp < CACHE_TTL_MS)) {
                    setResults(cachedEvaluation.results);
                    metrics.cacheHitCount++;

                    if (enablePerformanceTracing) {
                        logger.info('Rule evaluation cache hit:', evaluationCacheKey);
                    }

                    if (onEvaluationComplete) {
                        onEvaluationComplete(cachedEvaluation.results);
                    }

                    setEvaluating(false);
                    evaluationInProgressRef.current = false;
                    return;
                }
            }

            // Filtrer les règles par type
            const rulesToEvaluate = ruleTypes && ruleTypes.length > 0
                ? rules.filter(rule => ruleTypes.includes(rule.type))
                : rules;

            // Filtrer les règles activées
            const activeRules = rulesToEvaluate.filter(rule => rule.enabled !== false);

            // Préparer les résultats
            const evaluationResults: RuleEvaluationResult[] = [];

            // Évaluer chaque règle
            for (const rule of activeRules) {
                const ruleStart = performance.now();
                const result: RuleEvaluationResult = {
                    ruleId: rule.id,
                    ruleName: rule.name,
                    ruleType: rule.type,
                    applicable: false,
                    actionsApplied: [],
                    conditionsMatched: [],
                    context: debouncedContext,
                    timestamp: new Date()
                };

                try {
                    metrics.conditionCount += rule.conditions.length;
                    metrics.actionCount += rule.actions.length;

                    // Évaluer la condition principale
                    if (rule.conditionGroups && rule.conditionGroups.length > 0) {
                        // Logique avec groupes de conditions
                        result.applicable = await evaluateConditionGroups(
                            rule.conditionGroups,
                            rule.conditions,
                            debouncedContext,
                            generateCacheKey,
                            enableCaching,
                            result
                        );
                    } else {
                        // Toutes les conditions doivent être vraies (AND logique)
                        result.applicable = await evaluateConditions(
                            rule.conditions,
                            debouncedContext,
                            LogicalOperator.AND,
                            generateCacheKey,
                            enableCaching,
                            result
                        );
                    }

                    // Si la règle est applicable, exécuter les actions
                    if (result.applicable) {
                        for (const action of rule.actions) {
                            const actionResult = await executeAction(action, debouncedContext);
                            if (actionResult.success) {
                                result.actionsApplied.push({
                                    id: action.id,
                                    type: action.type,
                                    target: action.target,
                                    result: actionResult.result
                                });
                            }
                        }
                    }

                    result.evaluationTimeMs = performance.now() - ruleStart;
                    evaluationResults.push(result);

                } catch (err: unknown) {
                    logger.error(`Erreur lors de l'évaluation de la règle ${rule.id}:`, err);
                    result.error = err.message;
                    result.applicable = false;
                    evaluationResults.push(result);
                }
            }

            // Journaliser l'évaluation
            if (activeRules.length > 0) {
                auditService.createAuditEntry({
                    actionType: 'RULES_EVALUATED',
                    userId: 'current-user',
                    targetId: 'rules',
                    targetType: 'rule',
                    description: `Évaluation de ${activeRules.length} règles avec ${evaluationResults.filter(r => r.applicable).length} applicables`,
                    severity: 'LOW',
                    metadata: {
                        ruleCount: activeRules.length,
                        applicableCount: evaluationResults.filter(r => r.applicable).length,
                        context: JSON.stringify(debouncedContext).substring(0, 200) // Limité à 200 caractères
                    }
                });
            }

            // Mettre à jour les résultats
            setResults(evaluationResults);

            // Mettre en cache l'évaluation complète
            if (enableCaching) {
                ruleEvaluationCache.set(evaluationCacheKey, {
                    results: evaluationResults,
                    timestamp: Date.now()
                });
            }

            // Appeler le callback si fourni
            if (onEvaluationComplete) {
                onEvaluationComplete(evaluationResults);
            }

        } catch (err: unknown) {
            logger.error('Erreur lors de l\'évaluation des règles:', err);
            setError(err instanceof Error ? err : new Error(err.toString()));
        } finally {
            const endTime = performance.now();

            setPerformanceMetrics({
                evaluationTimeMs: endTime - startTime,
                ruleCount: rules.length,
                conditionCount: metrics.conditionCount,
                actionCount: metrics.actionCount,
                cacheHitCount: metrics.cacheHitCount
            });

            setEvaluating(false);
            evaluationInProgressRef.current = false;
        }
    }, [rules, debouncedContext, ruleTypes, generateCacheKey, generateEvaluationCacheKey, enableCaching, enablePerformanceTracing, onEvaluationComplete, auditService]);

    /**
     * Évaluer à chaque changement de contexte
     */
    useEffect(() => {
        evaluateRules();
    }, [debouncedContext, evaluateRules]);

    /**
     * Force une réévaluation immédiate des règles
     */
    const evaluateNow = useCallback(() => {
        evaluateRules();
    }, [evaluateRules]);

    /**
     * Réinitialise tous les caches
     */
    const clearCache = useCallback(() => {
        conditionEvaluationCache.clear();
        ruleEvaluationCache.clear();
    }, []);

    return {
        results,
        evaluating,
        error,
        evaluateNow,
        clearCache,
        performanceMetrics
    };
}

/**
 * Évalue un ensemble de conditions avec un opérateur logique
 */
async function evaluateConditions(
    conditions: RuleCondition[],
    context: Record<string, unknown>,
    operator: LogicalOperator,
    generateCacheKey: (ruleId: string, context: Record<string, unknown>) => string,
    enableCaching: boolean,
    result: RuleEvaluationResult
): Promise<boolean> {
    // Si pas de conditions, considérer comme vrai
    if (!conditions || conditions.length === 0) {
        return true;
    }

    // Évaluer chaque condition
    const evaluationPromises = conditions.map(condition =>
        evaluateCondition(condition, context, generateCacheKey, enableCaching)
    );

    const evaluationResults = await Promise.all(evaluationPromises);

    // Collecter les conditions qui correspondent
    conditions.forEach((condition, index) => {
        if (evaluationResults[index]) {
            result.conditionsMatched.push({
                field: condition.field,
                operator: condition.operator,
                value: condition.value
            });
        }
    });

    // Appliquer l'opérateur logique
    if (operator === LogicalOperator.AND) {
        return evaluationResults.every(Boolean);
    } else if (operator === LogicalOperator.OR) {
        return evaluationResults.some(Boolean);
    } else if (operator === LogicalOperator.NOT) {
        return !evaluationResults.some(Boolean);
    }

    return false;
}

/**
 * Évalue des groupes de conditions
 */
async function evaluateConditionGroups(
    groups: ConditionGroup[],
    conditions: RuleCondition[],
    context: Record<string, unknown>,
    generateCacheKey: (ruleId: string, context: Record<string, unknown>) => string,
    enableCaching: boolean,
    result: RuleEvaluationResult
): Promise<boolean> {
    // Évaluer chaque groupe
    const groupResults: Record<string, boolean> = {};

    // Préparer un mapping des conditions par groupe
    const conditionsByGroup: Record<string, RuleCondition[]> = {};
    conditions.forEach(condition => {
        if (condition.group) {
            if (!conditionsByGroup[condition.group]) {
                conditionsByGroup[condition.group] = [];
            }
            conditionsByGroup[condition.group].push(condition);
        }
    });

    // Évaluer chaque groupe
    for (const group of groups) {
        const groupConditions = conditionsByGroup[group.id] || [];
        groupResults[group.id] = await evaluateConditions(
            groupConditions,
            context,
            group.operator,
            generateCacheKey,
            enableCaching,
            result
        );
    }

    // Évaluer les conditions sans groupe (racine)
    const rootConditions = conditions.filter(c => !c.group);
    const rootResult = await evaluateConditions(
        rootConditions,
        context,
        LogicalOperator.AND,
        generateCacheKey,
        enableCaching,
        result
    );

    // Vérifier que la racine et au moins un groupe est vrai
    return rootResult && Object.values(groupResults).some(Boolean);
}

/**
 * Évalue une condition individuelle
 */
async function evaluateCondition(
    condition: RuleCondition,
    context: Record<string, unknown>,
    generateCacheKey: (ruleId: string, context: Record<string, unknown>) => string,
    enableCaching: boolean
): Promise<boolean> {
    // Vérifier le cache
    const cacheKey = `condition-${condition.field}-${condition.operator}-${JSON.stringify(condition.value)}-${generateCacheKey('', context)}`;

    if (enableCaching) {
        const cachedResult = conditionEvaluationCache.get(cacheKey);
        if (cachedResult && (Date.now() - cachedResult.timestamp < CACHE_TTL_MS)) {
            return cachedResult.result;
        }
    }

    // Obtenir la valeur du champ dans le contexte
    const fieldPath = condition.field.split('.');
    let fieldValue = context;

    for (const part of fieldPath) {
        if (fieldValue === undefined || fieldValue === null) {
            break;
        }
        fieldValue = fieldValue[part];
    }

    // Évaluer selon l'opérateur
    let result = false;

    switch (condition.operator) {
        case ComparisonOperator.EQUALS:
            result = fieldValue === condition.value;
            break;
        case ComparisonOperator.NOT_EQUALS:
            result = fieldValue !== condition.value;
            break;
        case ComparisonOperator.GREATER_THAN:
            result = fieldValue > condition.value;
            break;
        case ComparisonOperator.LESS_THAN:
            result = fieldValue < condition.value;
            break;
        case ComparisonOperator.GREATER_THAN_OR_EQUALS:
            result = fieldValue >= condition.value;
            break;
        case ComparisonOperator.LESS_THAN_OR_EQUALS:
            result = fieldValue <= condition.value;
            break;
        case ComparisonOperator.CONTAINS:
            if (typeof fieldValue === 'string') {
                result = fieldValue.includes(String(condition.value));
            } else if (Array.isArray(fieldValue)) {
                result = fieldValue.includes(condition.value);
            }
            break;
        case ComparisonOperator.NOT_CONTAINS:
            if (typeof fieldValue === 'string') {
                result = !fieldValue.includes(String(condition.value));
            } else if (Array.isArray(fieldValue)) {
                result = !fieldValue.includes(condition.value);
            }
            break;
        case ComparisonOperator.STARTS_WITH:
            if (typeof fieldValue === 'string') {
                result = fieldValue.startsWith(String(condition.value));
            }
            break;
        case ComparisonOperator.ENDS_WITH:
            if (typeof fieldValue === 'string') {
                result = fieldValue.endsWith(String(condition.value));
            }
            break;
        case ComparisonOperator.IN:
            if (Array.isArray(condition.value)) {
                result = condition.value.includes(fieldValue);
            }
            break;
        case ComparisonOperator.NOT_IN:
            if (Array.isArray(condition.value)) {
                result = !condition.value.includes(fieldValue);
            }
            break;
        case ComparisonOperator.EXISTS:
            result = fieldValue !== undefined && fieldValue !== null;
            break;
        case ComparisonOperator.NOT_EXISTS:
            result = fieldValue === undefined || fieldValue === null;
            break;
        case ComparisonOperator.MATCHES:
            if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
                try {
                    const regex = new RegExp(condition.value);
                    result = regex.test(fieldValue);
                } catch (e: unknown) {
                    logger.error('Erreur lors de la création de l\'expression régulière:', e);
                    result = false;
                }
            }
            break;
        case ComparisonOperator.BETWEEN:
            if (Array.isArray(condition.value) && condition.value.length === 2) {
                result = fieldValue >= condition.value[0] && fieldValue <= condition.value[1];
            }
            break;
    }

    // Mettre en cache le résultat
    if (enableCaching) {
        conditionEvaluationCache.set(cacheKey, {
            result,
            timestamp: Date.now()
        });
    }

    return result;
}

/**
 * Exécute une action de règle
 */
async function executeAction(
    action: RuleAction,
    context: Record<string, unknown>
): Promise<{ success: boolean; result: unknown }> {
    try {
        let result: any = null;

        switch (action.type) {
            case ActionType.ALLOW:
            case ActionType.PREVENT:
                // Ces actions sont juste des marqueurs, elles ne font rien activement
                result = { allowed: action.type === ActionType.ALLOW };
                break;

            case ActionType.MODIFY:
                if (action.target && action.parameters?.value !== undefined) {
                    // Mettre à jour la valeur dans le contexte
                    const path = action.target.split('.');
                    let current = context;

                    // Naviguer jusqu'au parent de la propriété cible
                    for (let i = 0; i < path.length - 1; i++) {
                        const part = path[i];
                        if (!current[part]) {
                            current[part] = {};
                        }
                        current = current[part];
                    }

                    // Mettre à jour la propriété cible
                    const lastPart = path[path.length - 1];
                    current[lastPart] = action.parameters.value;

                    result = { modified: true, path: action.target, value: action.parameters.value };
                } else {
                    throw new Error('Action MODIFY nécessite target et parameters.value');
                }
                break;

            case ActionType.NOTIFY:
                // Dans un contexte React, on pourrait utiliser un système de notification
                // ou un gestionnaire d'événements global
                if (action.parameters?.message) {
                    result = {
                        notified: true,
                        message: action.parameters.message,
                        level: action.parameters.level || 'info'
                    };

                    // Émettre un événement personnalisé pour la notification
                    const event = new CustomEvent('rule-notification', {
                        detail: {
                            action: action.id,
                            message: action.parameters.message,
                            level: action.parameters.level || 'info',
                            target: action.target
                        }
                    });
                    window.dispatchEvent(event);
                }
                break;

            case ActionType.LOG:
                // Journalisation simple
                logger.info(`[Rule Action] ${action.parameters?.message || 'Action de règle exécutée'}`, {
                    actionId: action.id,
                    target: action.target,
                    parameters: action.parameters
                });
                result = { logged: true };
                break;

            case ActionType.EXECUTE_FUNCTION:
                if (action.parameters?.function) {
                    // Dans un contexte réel, vous pourriez avoir un registre de fonctions
                    // ou utiliser une évaluation indirecte
                    logger.warn(`Fonction demandée: ${action.parameters.function}, mais l'exécution directe n'est pas supportée pour des raisons de sécurité`);
                    result = { executed: false, reason: 'Exécution directe non supportée' };
                }
                break;

            default:
                result = { unsupported: true, actionType: action.type };
                break;
        }

        return { success: true, result };
    } catch (error: unknown) {
        logger.error(`Erreur lors de l'exécution de l'action ${action.id}:`, { error: error });
        return {
            success: false,
            result: {
                error: error.message,
                actionId: action.id
            }
        };
    }
} 