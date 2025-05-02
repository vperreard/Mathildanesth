import { useState, useEffect, useCallback } from 'react';
import { Rule, RuleType, RuleEvaluationResult } from '@/modules/dynamicRules/types/rule';
import { Assignment } from '@/types/assignment';
import { User } from '@/types/user';
import { RuleBasedPlanningGeneratorService, OptimizationResult } from '@/modules/rules/services/RuleBasedPlanningGeneratorService';

// Interface pour les options du hook
interface UsePlanningRulesOptions {
    /**
     * Liste des règles à appliquer
     */
    rules?: Rule[];

    /**
     * Liste des utilisateurs disponibles
     */
    users: User[];

    /**
     * Date de début du planning
     */
    startDate: Date;

    /**
     * Date de fin du planning
     */
    endDate: Date;

    /**
     * Affectations existantes (optionnel)
     */
    existingAssignments?: Assignment[];

    /**
     * Nombre maximum de tentatives d'optimisation
     */
    maxOptimizationAttempts?: number;
}

// Interface pour le résultat du hook
interface UsePlanningRulesResult {
    /**
     * Affectations générées
     */
    assignments: Assignment[];

    /**
     * Résultats de l'évaluation des règles
     */
    ruleResults: RuleEvaluationResult[];

    /**
     * Statut de génération
     */
    status: 'idle' | 'loading' | 'success' | 'error';

    /**
     * Message d'erreur éventuel
     */
    error: Error | null;

    /**
     * Métriques d'optimisation
     */
    metrics: {
        equityScore: number;
        satisfactionScore: number;
        ruleComplianceScore: number;
    } | null;

    /**
     * Règles violées
     */
    violatedRules: {
        ruleId: string;
        ruleName: string;
        severity: number;
        message: string;
    }[];

    /**
     * Générer le planning
     */
    generatePlanning: () => Promise<void>;

    /**
     * Réinitialiser les données
     */
    reset: () => void;

    /**
     * Score global de qualité
     */
    qualityScore: number;
}

/**
 * Hook pour intégrer les règles dans la génération de planning
 */
export function usePlanningRules({
    rules = [],
    users,
    startDate,
    endDate,
    existingAssignments = [],
    maxOptimizationAttempts = 10
}: UsePlanningRulesOptions): UsePlanningRulesResult {
    // État pour les affectations générées
    const [assignments, setAssignments] = useState<Assignment[]>(existingAssignments);

    // État pour les résultats d'évaluation des règles
    const [ruleResults, setRuleResults] = useState<RuleEvaluationResult[]>([]);

    // État pour le statut de génération
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    // État pour l'erreur éventuelle
    const [error, setError] = useState<Error | null>(null);

    // État pour les métriques d'optimisation
    const [metrics, setMetrics] = useState<{
        equityScore: number;
        satisfactionScore: number;
        ruleComplianceScore: number;
    } | null>(null);

    // État pour les règles violées
    const [violatedRules, setViolatedRules] = useState<{
        ruleId: string;
        ruleName: string;
        severity: number;
        message: string;
    }[]>([]);

    // État pour le score de qualité
    const [qualityScore, setQualityScore] = useState<number>(0);

    // Fonction pour générer le planning
    const generatePlanning = useCallback(async () => {
        try {
            setStatus('loading');
            setError(null);

            // Filtrer les règles pertinentes pour la génération de planning
            const planningRules = rules.filter(rule =>
                rule.type === RuleType.PLANNING ||
                rule.type === RuleType.ALLOCATION ||
                rule.type === RuleType.CONSTRAINT ||
                rule.type === RuleType.SUPERVISION
            );

            // Créer le service de génération
            const planningGenerator = new RuleBasedPlanningGeneratorService(
                users,
                startDate,
                endDate,
                planningRules
            );

            // Générer le planning
            const generatedAssignments = await planningGenerator.generatePlanning();

            // Simuler l'obtention des résultats d'optimisation
            // En production, ces données viendraient directement du service
            const optimizationResult: OptimizationResult = {
                score: Math.random() * 100,
                validAssignments: generatedAssignments,
                violatedRules: planningRules
                    .filter(() => Math.random() > 0.7) // Simulation: 30% des règles sont violées
                    .map(rule => ({
                        ruleId: rule.id,
                        ruleName: rule.name,
                        severity: rule.priority,
                        message: `Simulation de violation de la règle ${rule.name}`
                    })),
                metrics: {
                    equityScore: Math.random() * 100,
                    satisfactionScore: Math.random() * 100,
                    ruleComplianceScore: Math.random() * 100
                }
            };

            // Simuler les résultats d'évaluation des règles
            const simulatedRuleResults: RuleEvaluationResult[] = planningRules.map(rule => ({
                ruleId: rule.id,
                ruleName: rule.name,
                passed: Math.random() > 0.3, // 70% de chance que la règle soit respectée
                severity: rule.priority,
                message: Math.random() > 0.3
                    ? `Règle "${rule.name}" respectée`
                    : `Règle "${rule.name}" violée`,
                details: null
            }));

            // Mettre à jour les états
            setAssignments(optimizationResult.validAssignments);
            setRuleResults(simulatedRuleResults);
            setViolatedRules(optimizationResult.violatedRules);
            setMetrics(optimizationResult.metrics);
            setQualityScore(optimizationResult.score);
            setStatus('success');

        } catch (err) {
            console.error('Erreur lors de la génération du planning:', err);
            setError(err instanceof Error ? err : new Error('Erreur inconnue'));
            setStatus('error');
        }
    }, [rules, users, startDate, endDate]);

    // Fonction pour réinitialiser les données
    const reset = useCallback(() => {
        setAssignments(existingAssignments);
        setRuleResults([]);
        setStatus('idle');
        setError(null);
        setMetrics(null);
        setViolatedRules([]);
        setQualityScore(0);
    }, [existingAssignments]);

    // Effet pour réinitialiser les données quand les entrées changent
    useEffect(() => {
        reset();
    }, [reset, rules, users, startDate, endDate]);

    return {
        assignments,
        ruleResults,
        status,
        error,
        metrics,
        violatedRules,
        generatePlanning,
        reset,
        qualityScore
    };
} 