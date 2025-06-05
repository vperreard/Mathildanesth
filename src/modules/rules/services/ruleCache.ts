import { Rule, RuleEvaluationContext, RuleEvaluationResult, RuleSeverity } from '../types/rule';
import { RuleEvaluationSummary } from '../engine/rule-engine';

// Interface pour une entrée de cache générique
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

// Options de configuration du cache
export interface RuleCacheOptions {
    ttl: number; // Durée de vie en millisecondes
    key?: string; // Clé de cache personnalisée (optionnelle)
}

// Valeurs par défaut pour les options de cache
const DEFAULT_CACHE_OPTIONS: RuleCacheOptions = {
    ttl: 5 * 60 * 1000, // 5 minutes par défaut
};

/**
 * Classe singleton pour la gestion du cache des évaluations de règles
 */
class RuleCacheService {
    private static instance: RuleCacheService;
    private evaluationCache: Map<string, CacheEntry<RuleEvaluationSummary>> = new Map();
    private rulesCache: Map<string, CacheEntry<Rule[]>> = new Map();

    private constructor() {
        // Initialisation du cache et démarrage du nettoyage périodique
        this.cleanupExpiredEntries();
    }

    /**
     * Obtenir l'instance singleton
     */
    public static getInstance(): RuleCacheService {
        if (!RuleCacheService.instance) {
            RuleCacheService.instance = new RuleCacheService();
        }
        return RuleCacheService.instance;
    }

    /**
     * Générer une clé de cache à partir du contexte d'évaluation
     */
    private generateEvaluationCacheKey(context: RuleEvaluationContext): string {
        // Simplifier et normaliser le contexte pour créer une clé stable
        const keyObject: Record<string, unknown> = {};

        // Ajouter les informations de garde proposée
        if (context.proposedShift) {
            keyObject.proposedShift = {
                id: context.proposedShift.id,
                doctorId: context.proposedShift.doctorId,
                type: context.proposedShift.type,
                startTime: context.proposedShift.startTime,
                endTime: context.proposedShift.endTime
            };
        }

        // Ajouter les informations de congé proposé
        if (context.proposedLeave) {
            keyObject.proposedLeave = {
                id: context.proposedLeave.id,
                doctorId: context.proposedLeave.doctorId,
                type: context.proposedLeave.type,
                startDate: context.proposedLeave.startDate,
                endDate: context.proposedLeave.endDate,
                status: context.proposedLeave.status
            };
        }

        // Ajouter l'identifiant du médecin
        if (context.doctor) {
            keyObject.doctorId = context.doctor.id;
        }

        // Ajouter la date courante si disponible
        if (context.currentDate) {
            keyObject.currentDate = context.currentDate;
        }

        // Identifiants des gardes existantes
        if (context.existingShifts) {
            keyObject.existingShiftsIds = context.existingShifts.map(s => s.id).sort();
        }

        // Identifiants des congés existants
        if (context.existingLeaves) {
            keyObject.existingLeavesIds = context.existingLeaves.map(l => l.id).sort();
        }

        return JSON.stringify(keyObject);
    }

    /**
     * Générer une clé pour un ensemble de règles
     */
    private generateRulesCacheKey(rules: Rule[]): string {
        // Trier les règles par ID pour garantir une clé stable
        return JSON.stringify(rules.map(r => ({
            id: r.id,
            updatedAt: r.updatedAt,
            enabled: r.enabled
        })).sort((a, b) => a.id.localeCompare(b.id)));
    }

    /**
     * Stocker un résultat d'évaluation dans le cache
     */
    public cacheEvaluation(
        summary: RuleEvaluationSummary,
        context: RuleEvaluationContext,
        options: Partial<RuleCacheOptions> = {}
    ): void {
        const { ttl } = { ...DEFAULT_CACHE_OPTIONS, ...options };
        const key = options.key || this.generateEvaluationCacheKey(context);
        const now = Date.now();

        this.evaluationCache.set(key, {
            data: summary,
            timestamp: now,
            expiresAt: now + ttl
        });
    }

    /**
     * Récupérer un résultat d'évaluation du cache
     */
    public getCachedEvaluation(
        context: RuleEvaluationContext,
        options: Partial<RuleCacheOptions> = {}
    ): RuleEvaluationSummary | null {
        const key = options.key || this.generateEvaluationCacheKey(context);
        const entry = this.evaluationCache.get(key);

        if (!entry) return null;

        // Vérifier si l'entrée est expirée
        if (Date.now() > entry.expiresAt) {
            this.evaluationCache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Stocker des règles dans le cache
     */
    public cacheRules(
        rules: Rule[],
        options: Partial<RuleCacheOptions> = {}
    ): void {
        const { ttl } = { ...DEFAULT_CACHE_OPTIONS, ...options };
        const key = options.key || this.generateRulesCacheKey(rules);
        const now = Date.now();

        this.rulesCache.set(key, {
            data: [...rules], // Copie pour éviter les modifications par référence
            timestamp: now,
            expiresAt: now + ttl
        });
    }

    /**
     * Récupérer des règles du cache
     */
    public getCachedRules(
        rules: Rule[],
        options: Partial<RuleCacheOptions> = {}
    ): Rule[] | null {
        const key = options.key || this.generateRulesCacheKey(rules);
        const entry = this.rulesCache.get(key);

        if (!entry) return null;

        // Vérifier si l'entrée est expirée
        if (Date.now() > entry.expiresAt) {
            this.rulesCache.delete(key);
            return null;
        }

        return [...entry.data]; // Copie pour éviter les modifications par référence
    }

    /**
     * Invalider une entrée spécifique du cache d'évaluations
     */
    public invalidateEvaluation(context: RuleEvaluationContext): void {
        const key = this.generateEvaluationCacheKey(context);
        this.evaluationCache.delete(key);
    }

    /**
     * Invalider une entrée spécifique du cache de règles
     */
    public invalidateRules(rules: Rule[]): void {
        const key = this.generateRulesCacheKey(rules);
        this.rulesCache.delete(key);
    }

    /**
     * Invalider toutes les entrées du cache associées à un médecin
     */
    public invalidateForDoctor(doctorId: string): void {
        // Parcourir les clés du cache d'évaluations et supprimer celles qui concernent ce médecin
        Array.from(this.evaluationCache.entries()).forEach(([key, _]) => {
            // Chercher si la clé contient l'ID du médecin
            if (key.includes(`"doctorId":"${doctorId}"`) || key.includes(`"doctorId":${doctorId}`)) {
                this.evaluationCache.delete(key);
            }
        });
    }

    /**
     * Invalider tout le cache
     */
    public clearCache(): void {
        this.evaluationCache.clear();
        this.rulesCache.clear();
    }

    /**
     * Nettoyer les entrées expirées
     */
    private cleanupExpiredEntries(): void {
        const now = Date.now();

        // Nettoyer le cache d'évaluations
        Array.from(this.evaluationCache.entries()).forEach(([key, entry]) => {
            if (now > entry.expiresAt) {
                this.evaluationCache.delete(key);
            }
        });

        // Nettoyer le cache de règles
        Array.from(this.rulesCache.entries()).forEach(([key, entry]) => {
            if (now > entry.expiresAt) {
                this.rulesCache.delete(key);
            }
        });

        // Programmer le prochain nettoyage
        setTimeout(() => this.cleanupExpiredEntries(), 60 * 1000); // Toutes les minutes
    }

    /**
     * Obtenir les statistiques du cache
     */
    public getStats(): { evaluations: number, rules: number } {
        return {
            evaluations: this.evaluationCache.size,
            rules: this.rulesCache.size
        };
    }
}

// Exporter l'instance du service de cache
export const ruleCache = RuleCacheService.getInstance(); 