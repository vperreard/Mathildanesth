import { useState, useCallback, useEffect } from 'react';
import {
    ScheduleRule,
    RuleEvaluationResult,
    ScheduleRulePriority
} from '../models/ScheduleRule';
import { ScheduleRuleService, ScheduleContext } from '../services/scheduleRuleService';

const ruleService = new ScheduleRuleService();

interface UseScheduleRulesProps {
    autoFetch?: boolean;
}

export function useScheduleRules(props: UseScheduleRulesProps = {}) {
    const { autoFetch = true } = props;

    const [rules, setRules] = useState<ScheduleRule[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    // Charger toutes les règles
    const fetchRules = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const fetchedRules = await ruleService.getAllRules();
            setRules(fetchedRules);
            return fetchedRules;
        } catch (err: unknown) {
            setError(err instanceof Error ? err : new Error('Erreur lors du chargement des règles'));
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Créer une nouvelle règle
    const createRule = useCallback(async (ruleData: Omit<ScheduleRule, 'id' | 'createdAt' | 'updatedAt'>) => {
        setLoading(true);
        setError(null);

        try {
            const newRule = await ruleService.createRule(ruleData);
            setRules(prevRules => [...prevRules, newRule]);
            return newRule;
        } catch (err: unknown) {
            setError(err instanceof Error ? err : new Error('Erreur lors de la création de la règle'));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Mettre à jour une règle existante
    const updateRule = useCallback(async (id: string, ruleData: Partial<Omit<ScheduleRule, 'id' | 'createdAt' | 'updatedAt'>>) => {
        setLoading(true);
        setError(null);

        try {
            const updatedRule = await ruleService.updateRule(id, ruleData);
            setRules(prevRules => prevRules.map(rule =>
                rule.id === id ? updatedRule : rule
            ));
            return updatedRule;
        } catch (err: unknown) {
            setError(err instanceof Error ? err : new Error('Erreur lors de la mise à jour de la règle'));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Supprimer une règle
    const deleteRule = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);

        try {
            await ruleService.deleteRule(id);
            setRules(prevRules => prevRules.filter(rule => rule.id !== id));
            return true;
        } catch (err: unknown) {
            setError(err instanceof Error ? err : new Error('Erreur lors de la suppression de la règle'));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Évaluer les règles dans un contexte donné
    const evaluateRules = useCallback(async (context: ScheduleContext) => {
        setLoading(true);
        setError(null);

        try {
            const results = await ruleService.evaluateRules(context);
            return results;
        } catch (err: unknown) {
            setError(err instanceof Error ? err : new Error('Erreur lors de l\'évaluation des règles'));
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Appliquer les actions des règles à un contexte
    const applyRuleActions = useCallback((evaluationResults: RuleEvaluationResult[], context: ScheduleContext) => {
        return ruleService.applyRuleActions(evaluationResults, context);
    }, []);

    // Vérifier si un planning respecte toutes les règles critiques
    const validateSchedule = useCallback(async (scheduleContexts: ScheduleContext[]) => {
        try {
            const allResults: { context: ScheduleContext; results: RuleEvaluationResult[] }[] = [];

            for (const context of scheduleContexts) {
                const results = await ruleService.evaluateRules(context);
                allResults.push({ context, results });
            }

            // Vérifier s'il y a des violations de règles critiques
            const criticalViolations = allResults.flatMap(item =>
                item.results.filter(result =>
                    result.satisfied &&
                    result.priority === ScheduleRulePriority.CRITICAL
                )
            );

            return {
                isValid: criticalViolations.length === 0,
                criticalViolations,
                allResults
            };
        } catch (err: unknown) {
            setError(err instanceof Error ? err : new Error('Erreur lors de la validation du planning'));
            throw err;
        }
    }, []);

    // Charger automatiquement les règles au montage du composant
    useEffect(() => {
        if (autoFetch) {
            fetchRules();
        }
    }, [autoFetch, fetchRules]);

    return {
        rules,
        loading,
        error,
        fetchRules,
        createRule,
        updateRule,
        deleteRule,
        evaluateRules,
        applyRuleActions,
        validateSchedule
    };
} 