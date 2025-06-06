import { useState, useEffect, useCallback } from 'react';
import { logger } from "../../../lib/logger";
import { Rule, RuleType, RuleScope, RuleSeverity, RuleEvaluationContext, RuleEvaluationResult } from '../types/rule';
import { ruleService } from '../services/ruleService';
import { ruleEvaluationService } from '../services/ruleEvaluationService';

/**
 * Hook pour la gestion des règles
 */
export const useRules = () => {
    const [rules, setRules] = useState<Rule[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    // Charger les règles au montage du composant
    useEffect(() => {
        loadRules();
    }, []);

    /**
     * Charger toutes les règles
     */
    const loadRules = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // En mode MVP, on utilise les règles de démo
            const loadedRules = ruleService.createDemoRules();
            setRules(loadedRules);
        } catch (err: unknown) {
            setError(err instanceof Error ? err : new Error('Erreur lors du chargement des règles'));
            logger.error('Erreur lors du chargement des règles:', { error: err });
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Filtrer les règles selon des critères
     */
    const filterRules = useCallback((filters: {
        type?: RuleType | RuleType[];
        scope?: RuleScope;
        scopeValue?: string;
        enabled?: boolean;
    }) => {
        return ruleService.filterRules(filters);
    }, []);

    /**
     * Créer une nouvelle règle
     */
    const createRule = useCallback(async (ruleData: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            const newRule = ruleService.createRule(ruleData);
            setRules(prevRules => [...prevRules, newRule]);
            return newRule;
        } catch (err: unknown) {
            setError(err instanceof Error ? err : new Error('Erreur lors de la création de la règle'));
            logger.error('Erreur lors de la création de la règle:', { error: err });
            throw err;
        }
    }, []);

    /**
     * Mettre à jour une règle existante
     */
    const updateRule = useCallback(async (
        id: string,
        ruleData: Partial<Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>>
    ) => {
        try {
            const updatedRule = ruleService.updateRule(id, ruleData);

            if (!updatedRule) {
                throw new Error(`Règle non trouvée avec l'ID: ${id}`);
            }

            setRules(prevRules =>
                prevRules.map(rule => rule.id === id ? updatedRule : rule)
            );

            return updatedRule;
        } catch (err: unknown) {
            setError(err instanceof Error ? err : new Error('Erreur lors de la mise à jour de la règle'));
            logger.error('Erreur lors de la mise à jour de la règle:', { error: err });
            throw err;
        }
    }, []);

    /**
     * Supprimer une règle
     */
    const deleteRule = useCallback(async (id: string) => {
        try {
            const success = ruleService.deleteRule(id);

            if (success) {
                setRules(prevRules => prevRules.filter(rule => rule.id !== id));
            }

            return success;
        } catch (err: unknown) {
            setError(err instanceof Error ? err : new Error('Erreur lors de la suppression de la règle'));
            logger.error('Erreur lors de la suppression de la règle:', { error: err });
            throw err;
        }
    }, []);

    /**
     * Activer ou désactiver une règle
     */
    const toggleRuleStatus = useCallback(async (id: string, enabled: boolean) => {
        try {
            const updatedRule = ruleService.toggleRuleStatus(id, enabled);

            if (!updatedRule) {
                throw new Error(`Règle non trouvée avec l'ID: ${id}`);
            }

            setRules(prevRules =>
                prevRules.map(rule => rule.id === id ? updatedRule : rule)
            );

            return updatedRule;
        } catch (err: unknown) {
            setError(err instanceof Error ? err : new Error('Erreur lors du changement de statut de la règle'));
            logger.error('Erreur lors du changement de statut de la règle:', { error: err });
            throw err;
        }
    }, []);

    /**
     * Évaluer une règle dans un contexte donné
     */
    const evaluateRule = useCallback((rule: Rule, context: RuleEvaluationContext): RuleEvaluationResult => {
        return ruleEvaluationService.evaluateRule(rule, context);
    }, []);

    /**
     * Évaluer plusieurs règles dans un contexte donné
     */
    const evaluateRules = useCallback((rules: Rule[], context: RuleEvaluationContext): RuleEvaluationResult[] => {
        return rules.map(rule => evaluateRule(rule, context));
    }, [evaluateRule]);

    /**
     * Vérifier si toutes les règles sont respectées
     */
    const areAllRulesPassed = useCallback((evaluationResults: RuleEvaluationResult[]): boolean => {
        return evaluationResults.every(result => result.passed);
    }, []);

    return {
        rules,
        loading,
        error,
        loadRules,
        filterRules,
        createRule,
        updateRule,
        deleteRule,
        toggleRuleStatus,
        evaluateRule,
        evaluateRules,
        areAllRulesPassed
    };
}; 