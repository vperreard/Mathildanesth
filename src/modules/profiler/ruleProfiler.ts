import { profilerService } from './profilerService';
import { MetricType } from './types';

/**
 * Fonction pour profiler le moteur de règles
 * À utiliser pour remplacer ou étendre les méthodes du moteur de règles
 */

/**
 * Fonction d'enveloppement pour profiler l'évaluation de règles avec et sans cache
 */
export function profileRuleEvaluation(
    originalEvaluate: (...args: unknown[]) => any,
    context: unknown,
    enableCache: boolean
) {
    if (enableCache) {
        // Vérifier si la méthode getCachedEvaluation existe dans le contexte ou ses propriétés
        const getCachedResult = profilerService.wrapFunction(
            (ctx: unknown) => {
                // Logique pour obtenir le résultat en cache (à adapter selon l'implémentation)
                const ruleCache = context.ruleCache || (context.services && context.services.ruleCache);
                if (ruleCache && typeof ruleCache.getCachedEvaluation === 'function') {
                    return ruleCache.getCachedEvaluation(ctx);
                }
                return null;
            },
            MetricType.RULE_EVALUATION_CACHED,
            'ruleEngine.getCachedEvaluation'
        );

        const cachedResult = getCachedResult(context);

        if (cachedResult) {
            return {
                ...cachedResult,
                fromCache: true
            };
        }
    }

    // Profiler l'évaluation complète des règles
    const profiledEvaluate = profilerService.wrapFunction(
        originalEvaluate,
        MetricType.RULE_EVALUATION,
        'ruleEngine.evaluate',
        { enableCache }
    );

    return profiledEvaluate(context);
}

/**
 * Fonction pour profiler la mise en cache des résultats d'évaluation
 */
export function profileRuleCaching(
    originalCacheMethod: (...args: unknown[]) => any,
    summary: unknown,
    context: unknown,
    options: any = {}
) {
    const profiledCacheMethod = profilerService.wrapFunction(
        originalCacheMethod,
        MetricType.RULE_EVALUATION_CACHED,
        'ruleCache.cacheEvaluation'
    );

    return profiledCacheMethod(summary, context, options);
}

/**
 * Fonction pour patcher le moteur de règles avec du profilage
 */
export function patchRuleEngine(ruleEngine: unknown) {
    // Sauvegarde de la méthode originale d'évaluation
    const originalEvaluate = ruleEngine.evaluate;

    // Remplacer la méthode d'évaluation par une version profilée
    ruleEngine.evaluate = function (context: unknown) {
        return profileRuleEvaluation(
            originalEvaluate.bind(this),
            context,
            this.enableCache || false
        );
    };

    return ruleEngine;
}

/**
 * Fonction pour patcher le service de cache des règles avec du profilage
 */
export function patchRuleCache(ruleCache: unknown) {
    // Sauvegarde de la méthode originale de mise en cache
    const originalCacheEvaluation = ruleCache.cacheEvaluation;

    // Remplacer la méthode de mise en cache par une version profilée
    ruleCache.cacheEvaluation = function (summary: unknown, context: unknown, options: any = {}) {
        return profileRuleCaching(
            originalCacheEvaluation.bind(this),
            summary,
            context,
            options
        );
    };

    return ruleCache;
} 