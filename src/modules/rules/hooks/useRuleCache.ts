import { useState, useCallback, useEffect } from 'react';
import { ruleCache, RuleCacheOptions } from '../engine';
import { Rule, RuleEvaluationContext } from '../types/rule';
import { RuleEvaluationSummary } from '../engine/rule-engine';

/**
 * Interface pour les statistiques du cache
 */
interface CacheStats {
    evaluationCount: number;
    rulesCount: number;
    hitRate: number; // Taux de succès (0-1)
    missRate: number; // Taux d'échec (0-1)
}

/**
 * Hook pour utiliser le système de cache des règles
 */
export function useRuleCache() {
    const [stats, setStats] = useState<CacheStats>({
        evaluationCount: 0,
        rulesCount: 0,
        hitRate: 0,
        missRate: 1
    });

    // Variables pour le calcul du taux de succès/échec
    const [hits, setHits] = useState(0);
    const [misses, setMisses] = useState(0);

    // Récupérer une évaluation depuis le cache
    const getCachedEvaluation = useCallback(
        (context: RuleEvaluationContext, options?: Partial<RuleCacheOptions>) => {
            const result = ruleCache.getCachedEvaluation(context, options || {});

            if (result) {
                setHits(prev => prev + 1);
            } else {
                setMisses(prev => prev + 1);
            }

            return result;
        },
        []
    );

    // Mettre en cache une évaluation
    const cacheEvaluation = useCallback(
        (
            summary: RuleEvaluationSummary,
            context: RuleEvaluationContext,
            options?: Partial<RuleCacheOptions>
        ) => {
            ruleCache.cacheEvaluation(summary, context, options || {});
            updateStats();
        },
        []
    );

    // Récupérer des règles depuis le cache
    const getCachedRules = useCallback(
        (rules: Rule[], options?: Partial<RuleCacheOptions>) => {
            const result = ruleCache.getCachedRules(rules, options || {});

            if (result) {
                setHits(prev => prev + 1);
            } else {
                setMisses(prev => prev + 1);
            }

            return result;
        },
        []
    );

    // Mettre en cache des règles
    const cacheRules = useCallback(
        (rules: Rule[], options?: Partial<RuleCacheOptions>) => {
            ruleCache.cacheRules(rules, options || {});
            updateStats();
        },
        []
    );

    // Invalider une entrée d'évaluation
    const invalidateEvaluation = useCallback((context: RuleEvaluationContext) => {
        ruleCache.invalidateEvaluation(context);
        updateStats();
    }, []);

    // Invalider une entrée de règles
    const invalidateRules = useCallback((rules: Rule[]) => {
        ruleCache.invalidateRules(rules);
        updateStats();
    }, []);

    // Invalider les entrées pour un médecin
    const invalidateForDoctor = useCallback((doctorId: string) => {
        ruleCache.invalidateForDoctor(doctorId);
        updateStats();
    }, []);

    // Vider tout le cache
    const clearCache = useCallback(() => {
        ruleCache.clearCache();
        setHits(0);
        setMisses(0);
        updateStats();
    }, []);

    // Mettre à jour les statistiques
    const updateStats = useCallback(() => {
        const currentStats = ruleCache.getStats();
        const total = hits + misses;

        setStats({
            evaluationCount: currentStats.evaluations,
            rulesCount: currentStats.rules,
            hitRate: total > 0 ? hits / total : 0,
            missRate: total > 0 ? misses / total : 1
        });
    }, [hits, misses]);

    // Mettre à jour les statistiques périodiquement
    useEffect(() => {
        const interval = setInterval(updateStats, 5000);

        return () => {
            clearInterval(interval);
        };
    }, [updateStats]);

    // Mettre à jour les statistiques initiales
    useEffect(() => {
        updateStats();
    }, [updateStats]);

    return {
        // Méthodes du cache
        getCachedEvaluation,
        cacheEvaluation,
        getCachedRules,
        cacheRules,
        invalidateEvaluation,
        invalidateRules,
        invalidateForDoctor,
        clearCache,

        // Statistiques
        stats
    };
} 