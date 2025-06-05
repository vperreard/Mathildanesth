/**
 * Module de profilage de performance
 * Ce module permet de mesurer et d'analyser les performances de l'application
 */

// Exporter les types
export * from './types';

// Exporter le service principal
export { profilerService, profileFunction } from './profilerService';

// Exporter les hooks
export { useProfiler } from './useProfiler';

// Exporter les fonctions de profilage du moteur de règles
export {
    patchRuleEngine,
    patchRuleCache,
    profileRuleEvaluation,
    profileRuleCaching
} from './ruleProfiler';

// Exporter les composants
export { ProfilerReport } from './components/ProfilerReport';

// Exporter une fonction d'initialisation pour faciliter l'intégration
import { profilerService } from './profilerService';
import { patchRuleEngine, patchRuleCache } from './ruleProfiler';

/**
 * Initialiser le profileur avec les services de règles
 * @param ruleEngine Le moteur de règles à profiler
 * @param ruleCache Le service de cache de règles à profiler
 */
export function initializeProfiler(
    ruleEngine?: unknown,
    ruleCache?: unknown
) {
    // Activer le profileur en mode développement
    profilerService.configure({
        enabled: process.env.NODE_ENV !== 'production'
    });

    // Si le moteur de règles est fourni, le patcher avec le profileur
    if (ruleEngine) {
        patchRuleEngine(ruleEngine);
    }

    // Si le service de cache est fourni, le patcher avec le profileur
    if (ruleCache) {
        patchRuleCache(ruleCache);
    }

    return profilerService;
} 