import {
    Rule,
    RuleType,
    RuleEvaluationContext,
    RuleEvaluationResult,
    RuleSeverity
} from '../types/rule';
import { ruleCache } from '../services/ruleCache';

/**
 * Configuration du moteur de règles
 */
export interface RuleEngineConfig {
    defaultRules?: Rule[];
    enableCache?: boolean; // Nouvel option pour activer/désactiver le cache
}

/**
 * Interface pour les validateurs de règles
 */
export interface RuleValidator {
    validate(rule: Rule, context: RuleEvaluationContext): Promise<RuleEvaluationResult>;
}

/**
 * Interface pour les résolveurs de conflits
 */
export interface RuleSolver {
    resolve(violations: RuleEvaluationResult[]): Promise<Resolution>;
}

/**
 * Résolution proposée pour des violations de règles
 */
export interface Resolution {
    type: 'SUGGEST_CHANGE' | 'OVERRIDE' | 'REJECT';
    message: string;
    suggestedChanges?: any;
}

/**
 * Résultat complet de l'évaluation de toutes les règles
 */
export interface RuleEvaluationSummary {
    isValid: boolean;
    violations: RuleEvaluationResult[];
    warnings: RuleEvaluationResult[];
    score: number;
    fromCache?: boolean; // Indique si le résultat vient du cache
}

/**
 * Moteur principal de gestion des règles
 */
export class RuleEngine {
    private rules: Map<string, Rule>;
    private validators: Map<RuleType, RuleValidator>;
    private solvers: Map<RuleType, RuleSolver>;
    private enableCache: boolean;

    constructor(config: RuleEngineConfig = {}) {
        this.rules = new Map<string, Rule>();
        this.validators = new Map<RuleType, RuleValidator>();
        this.solvers = new Map<RuleType, RuleSolver>();
        this.enableCache = config.enableCache !== undefined ? config.enableCache : true;

        if (config.defaultRules) {
            this.initializeRules(config.defaultRules);
        }
    }

    /**
     * Initialise les règles du moteur
     */
    private initializeRules(rules: Rule[]): void {
        rules.forEach(rule => {
            this.rules.set(rule.id, rule);
        });
    }

    /**
     * Enregistre un validateur pour un type de règle
     */
    registerValidator(type: RuleType, validator: RuleValidator): void {
        this.validators.set(type, validator);
    }

    /**
     * Enregistre un résolveur pour un type de règle
     */
    registerSolver(type: RuleType, solver: RuleSolver): void {
        this.solvers.set(type, solver);
    }

    /**
     * Ajoute ou met à jour une règle
     */
    addRule(rule: Rule): void {
        this.rules.set(rule.id, rule);
        // Invalider le cache lors de l'ajout d'une règle
        if (this.enableCache) {
            ruleCache.clearCache(); // On pourrait être plus précis, mais pour la sécurité on vide tout
        }
    }

    /**
     * Supprime une règle
     */
    removeRule(ruleId: string): boolean {
        const result = this.rules.delete(ruleId);
        // Invalider le cache lors de la suppression d'une règle
        if (result && this.enableCache) {
            ruleCache.clearCache(); // On pourrait être plus précis, mais pour la sécurité on vide tout
        }
        return result;
    }

    /**
     * Récupère toutes les règles
     */
    getAllRules(): Rule[] {
        return Array.from(this.rules.values());
    }

    /**
     * Récupère une règle par son ID
     */
    getRule(ruleId: string): Rule | undefined {
        return this.rules.get(ruleId);
    }

    /**
     * Évalue toutes les règles actives pour un contexte donné
     */
    async evaluate(context: RuleEvaluationContext): Promise<RuleEvaluationSummary> {
        // Vérifier si le résultat est dans le cache
        if (this.enableCache) {
            const cachedResult = ruleCache.getCachedEvaluation(context);
            if (cachedResult) {
                return {
                    ...cachedResult,
                    fromCache: true
                };
            }
        }

        const violations: RuleEvaluationResult[] = [];
        const warnings: RuleEvaluationResult[] = [];

        const rulesArray = Array.from(this.rules.values());

        for (const rule of rulesArray) {
            if (!rule.enabled) continue;

            const validator = this.validators.get(rule.type);
            if (!validator) continue;

            const result = await validator.validate(rule, context);

            if (!result.passed) {
                if (result.severity === RuleSeverity.ERROR) {
                    violations.push(result);
                } else if (result.severity === RuleSeverity.WARNING) {
                    warnings.push(result);
                }
            }
        }

        const summary: RuleEvaluationSummary = {
            isValid: violations.length === 0,
            violations,
            warnings,
            score: this.calculateScore(context, violations, warnings),
            fromCache: false
        };

        // Stocker le résultat dans le cache
        if (this.enableCache) {
            ruleCache.cacheEvaluation(summary, context);
        }

        return summary;
    }

    /**
     * Calcule un score pour l'évaluation (plus le score est bas, meilleur c'est)
     */
    private calculateScore(
        context: RuleEvaluationContext,
        violations: RuleEvaluationResult[],
        warnings: RuleEvaluationResult[]
    ): number {
        // Calcul simple du score : nombre d'erreurs * 100 + nombre d'avertissements * 10
        return violations.length * 100 + warnings.length * 10;
    }

    /**
     * Résout les conflits entre règles
     */
    async resolveConflicts(violations: RuleEvaluationResult[]): Promise<Resolution[]> {
        const resolutions: Resolution[] = [];
        const groupedViolations = this.groupViolationsByType(violations);

        const groupedEntriesArray = Array.from(groupedViolations.entries());

        for (const [type, typeViolations] of groupedEntriesArray) {
            const solver = this.solvers.get(type);
            if (solver) {
                const resolution = await solver.resolve(typeViolations);
                resolutions.push(resolution);
            } else {
                // Résolution par défaut si pas de solver spécifique
                resolutions.push({
                    type: 'REJECT',
                    message: `Violations de règles non résolues de type ${type}`
                });
            }
        }

        return resolutions;
    }

    /**
     * Groupe les violations par type de règle
     */
    private groupViolationsByType(
        violations: RuleEvaluationResult[]
    ): Map<RuleType, RuleEvaluationResult[]> {
        const grouped = new Map<RuleType, RuleEvaluationResult[]>();

        violations.forEach(violation => {
            const rule = this.rules.get(violation.ruleId);
            if (!rule) return;

            const type = rule.type;
            if (!grouped.has(type)) {
                grouped.set(type, []);
            }

            grouped.get(type)?.push(violation);
        });

        return grouped;
    }

    /**
     * Active ou désactive le cache
     */
    setEnableCache(enable: boolean): void {
        this.enableCache = enable;
        if (!enable) {
            // Effacer le cache si on le désactive
            ruleCache.clearCache();
        }
    }

    /**
     * Vide le cache (utile après des modifications importantes)
     */
    clearCache(): void {
        if (this.enableCache) {
            ruleCache.clearCache();
        }
    }

    /**
     * Invalide le cache pour un médecin spécifique
     */
    invalidateCacheForDoctor(doctorId: string): void {
        if (this.enableCache) {
            ruleCache.invalidateForDoctor(doctorId);
        }
    }
} 