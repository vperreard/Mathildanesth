import { PlanningGeneratorService } from '@/modules/planning/services/PlanningGeneratorService';
import { User } from '@/types/user';
import { Assignment } from '@/types/assignment';
import { Rule, RuleType } from '@/modules/dynamicRules/types/rule';
import { RuleEngineService } from '@/modules/dynamicRules/services/ruleEngineService';
import { RuleConflictDetectionService } from '@/modules/dynamicRules/services/RuleConflictDetectionService';
import { EventBusService } from '@/services/eventBusService';
import { addDays, formatDate } from '@/utils/dateUtils';

/**
 * Interface pour les résultats d'optimisation
 */
export interface OptimizationResult {
    score: number;
    validAssignments: Assignment[];
    violatedRules: {
        ruleId: string;
        ruleName: string;
        severity: number;
        message: string;
    }[];
    metrics: {
        equityScore: number;
        satisfactionScore: number;
        ruleComplianceScore: number;
    };
}

/**
 * Service de génération de planning basé sur les règles
 * Étend le service de génération standard en intégrant le moteur de règles dynamiques
 */
export class RuleBasedPlanningGeneratorService extends PlanningGeneratorService {
    private ruleEngine: RuleEngineService;
    private conflictService: RuleConflictDetectionService;
    private eventBus: EventBusService;
    private rules: Rule[] = [];
    private optimizationAttempts: number = 0;
    private maxOptimizationAttempts: number = 10;
    private optimizationScores: number[] = [];

    constructor(
        users: User[],
        startDate: Date,
        endDate: Date,
        planningRules: Rule[] = []
    ) {
        super(users, startDate, endDate);
        this.ruleEngine = RuleEngineService.getInstance();
        this.conflictService = RuleConflictDetectionService.getInstance();
        this.eventBus = EventBusService.getInstance();
        this.rules = planningRules;
    }

    /**
     * Charge les règles de planning depuis la base de données ou une source externe
     */
    public async loadRules(): Promise<void> {
        try {
            // En production, charger les règles depuis l'API ou une autre source
            // Pour l'instant, utiliser les règles passées au constructeur

            // Filtrer pour ne prendre que les règles pertinentes pour la génération de planning
            this.rules = this.rules.filter(rule =>
                rule.type === RuleType.PLANNING ||
                rule.type === RuleType.ALLOCATION ||
                rule.type === RuleType.CONSTRAINT ||
                rule.type === RuleType.SUPERVISION
            );

            // Journaliser le chargement des règles
            console.log(`${this.rules.length} règles de planning chargées`);

            // Émettre un événement pour notifier du chargement des règles
            this.eventBus.emit('rules:loaded', { count: this.rules.length });
        } catch (error) {
            console.error('Erreur lors du chargement des règles:', error);
            throw error;
        }
    }

    /**
     * Génère un planning en respectant les règles dynamiques
     * @override
     */
    public async generatePlanning(): Promise<Assignment[]> {
        // Charger les règles si ce n'est pas déjà fait
        if (this.rules.length === 0) {
            await this.loadRules();
        }

        // Réinitialiser les compteurs d'optimisation
        this.optimizationAttempts = 0;
        this.optimizationScores = [];

        // Générer un planning initial avec l'algorithme standard
        const initialAssignments = super.generatePlanning();

        // Optimiser le planning en fonction des règles
        const optimizedResult = await this.optimizePlanning(initialAssignments);

        // Journaliser le résultat de l'optimisation
        console.log(`Planning optimisé avec un score de ${optimizedResult.score}`);
        console.log(`Règles violées: ${optimizedResult.violatedRules.length}`);

        // Émettre un événement pour notifier de la génération du planning
        this.eventBus.emit('planning:generated', {
            assignmentsCount: optimizedResult.validAssignments.length,
            violatedRulesCount: optimizedResult.violatedRules.length,
            score: optimizedResult.score
        });

        return optimizedResult.validAssignments;
    }

    /**
     * Optimise un planning existant en appliquant les règles dynamiques
     */
    private async optimizePlanning(assignments: Assignment[]): Promise<OptimizationResult> {
        let currentAssignments = [...assignments];
        let bestResult: OptimizationResult = {
            score: 0,
            validAssignments: [],
            violatedRules: [],
            metrics: {
                equityScore: 0,
                satisfactionScore: 0,
                ruleComplianceScore: 0
            }
        };

        // Évaluer le planning initial
        bestResult = this.evaluatePlanningQuality(currentAssignments);

        // Processus d'optimisation itératif
        while (this.optimizationAttempts < this.maxOptimizationAttempts) {
            // Incrémenter le compteur de tentatives
            this.optimizationAttempts++;

            // Identifier les affectations problématiques
            const problematicAssignments = this.identifyProblematicAssignments(currentAssignments);

            if (problematicAssignments.length === 0) {
                // Si aucune affectation problématique, le planning est optimal
                break;
            }

            // Générer des alternatives pour les affectations problématiques
            const improvedAssignments = await this.generateAlternativeAssignments(
                currentAssignments,
                problematicAssignments
            );

            // Évaluer la qualité du nouveau planning
            const newResult = this.evaluatePlanningQuality(improvedAssignments);

            // Enregistrer le score d'optimisation
            this.optimizationScores.push(newResult.score);

            // Mettre à jour le meilleur résultat si le nouveau est meilleur
            if (newResult.score > bestResult.score) {
                bestResult = newResult;
                currentAssignments = improvedAssignments;
            }

            // Si nous avons atteint un score parfait, arrêter l'optimisation
            if (newResult.violatedRules.length === 0) {
                break;
            }
        }

        // Journaliser les métriques d'optimisation
        console.log(`Optimisation terminée après ${this.optimizationAttempts} tentatives`);
        console.log(`Scores d'optimisation: ${this.optimizationScores.join(', ')}`);

        return bestResult;
    }

    /**
     * Évalue la qualité d'un planning en fonction des règles
     */
    private evaluatePlanningQuality(assignments: Assignment[]): OptimizationResult {
        // Préparer le contexte pour l'évaluation des règles
        const context = {
            assignments,
            users: this.users,
            startDate: this.startDate,
            endDate: this.endDate
        };

        // Évaluer toutes les règles pertinentes
        const ruleResults = this.rules.map(rule => {
            // En production, utiliser le moteur de règles pour évaluer
            // Pour simplifier, simuler l'évaluation ici
            const ruleContext = { ...context, rule };
            const passed = this.simulateRuleEvaluation(rule, assignments);

            return {
                ruleId: rule.id,
                ruleName: rule.name,
                severity: rule.priority, // Utiliser la priorité comme sévérité
                passed,
                message: passed ? `Règle respectée` : `Règle violée: ${rule.name}`,
            };
        });

        // Filtrer les règles violées
        const violatedRules = ruleResults
            .filter(result => !result.passed)
            .map(result => ({
                ruleId: result.ruleId,
                ruleName: result.ruleName,
                severity: result.severity,
                message: result.message
            }));

        // Calculer les métriques de qualité
        const equityScore = this.calculateEquityScore(assignments);
        const satisfactionScore = this.calculateSatisfactionScore(assignments);
        const ruleComplianceScore = this.calculateRuleComplianceScore(ruleResults);

        // Calculer le score global (pondéré)
        const totalScore = (
            equityScore * 0.3 +
            satisfactionScore * 0.3 +
            ruleComplianceScore * 0.4
        );

        return {
            score: totalScore,
            validAssignments: assignments,
            violatedRules,
            metrics: {
                equityScore,
                satisfactionScore,
                ruleComplianceScore
            }
        };
    }

    /**
     * Identifie les affectations qui posent problème dans le planning
     */
    private identifyProblematicAssignments(assignments: Assignment[]): Assignment[] {
        // TODO: Implémenter une logique plus sophistiquée en production
        // Pour l'instant, sélectionner aléatoirement quelques affectations à améliorer

        const problematicAssignments: Assignment[] = [];

        // Simuler l'identification des affectations problématiques
        assignments.forEach(assignment => {
            // Vérifier si l'affectation viole des règles
            const violatesRules = this.rules.some(rule => {
                const context = {
                    assignment,
                    user: this.users.find(u => u.id === assignment.userId),
                    assignments
                };
                return !this.simulateRuleEvaluation(rule, [assignment]);
            });

            if (violatesRules) {
                problematicAssignments.push(assignment);
            }
        });

        return problematicAssignments;
    }

    /**
     * Génère des alternatives pour les affectations problématiques
     */
    private async generateAlternativeAssignments(
        currentAssignments: Assignment[],
        problematicAssignments: Assignment[]
    ): Promise<Assignment[]> {
        // Copier les affectations actuelles
        const newAssignments = [...currentAssignments];

        // Pour chaque affectation problématique
        for (const problemAssignment of problematicAssignments) {
            // Trouver l'index de l'affectation dans la liste
            const assignmentIndex = newAssignments.findIndex(
                a => a.id === problemAssignment.id
            );

            if (assignmentIndex === -1) continue;

            // Trouver une meilleure affectation
            const betterAssignment = await this.findBetterAssignment(
                problemAssignment,
                newAssignments
            );

            if (betterAssignment) {
                // Remplacer l'affectation problématique par la meilleure alternative
                newAssignments[assignmentIndex] = betterAssignment;
            }
        }

        return newAssignments;
    }

    /**
     * Trouve une meilleure affectation pour remplacer une affectation problématique
     */
    private async findBetterAssignment(
        problematicAssignment: Assignment,
        currentAssignments: Assignment[]
    ): Promise<Assignment | null> {
        // Obtenir les utilisateurs éligibles pour cette date et ce type d'affectation
        const date = new Date(problematicAssignment.date);
        const eligibleUsers = this.getEligibleUsersForDate(date);

        // Filtrer les utilisateurs déjà affectés ce jour-là
        const availableUsers = eligibleUsers.filter(user => {
            return !currentAssignments.some(a =>
                a.userId === user.id &&
                a.date === problematicAssignment.date &&
                a.id !== problematicAssignment.id
            );
        });

        if (availableUsers.length === 0) {
            return null;
        }

        // Évaluer chaque utilisateur disponible
        let bestUser = null;
        let bestScore = -1;

        for (const user of availableUsers) {
            // Créer une affectation de test
            const testAssignment: Assignment = {
                ...problematicAssignment,
                userId: user.id
            };

            // Simuler le planning avec cette affectation
            const testAssignments = currentAssignments.map(a =>
                a.id === problematicAssignment.id ? testAssignment : a
            );

            // Évaluer ce planning
            const result = this.evaluatePlanningQuality(testAssignments);

            // Mettre à jour le meilleur utilisateur si le score est meilleur
            if (result.score > bestScore) {
                bestScore = result.score;
                bestUser = user;
            }
        }

        if (bestUser) {
            // Créer une nouvelle affectation avec le meilleur utilisateur
            return {
                ...problematicAssignment,
                userId: bestUser.id
            };
        }

        return null;
    }

    /**
     * Calcule le score d'équité pour un planning
     */
    private calculateEquityScore(assignments: Assignment[]): number {
        // Compter les affectations par utilisateur
        const userAssignmentCounts: Record<string, number> = {};

        assignments.forEach(assignment => {
            const userId = assignment.userId;
            userAssignmentCounts[userId] = (userAssignmentCounts[userId] || 0) + 1;
        });

        // Calculer l'écart-type des comptages
        const counts = Object.values(userAssignmentCounts);
        const mean = counts.reduce((sum, count) => sum + count, 0) / counts.length;
        const variance = counts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / counts.length;
        const stdDev = Math.sqrt(variance);

        // Plus l'écart-type est faible, plus la répartition est équitable
        // Normaliser le score entre 0 et 100
        const maxPossibleStdDev = mean; // Dans le pire cas
        const equityScore = 100 * (1 - (stdDev / maxPossibleStdDev));

        return Math.max(0, Math.min(100, equityScore));
    }

    /**
     * Calcule le score de satisfaction pour un planning
     */
    private calculateSatisfactionScore(assignments: Assignment[]): number {
        // Compter les affectations correspondant aux préférences des utilisateurs
        let preferenceMatches = 0;
        let totalPreferences = 0;

        assignments.forEach(assignment => {
            const user = this.users.find(u => u.id === assignment.userId);
            if (user && user.preferences) {
                // Vérifier si l'utilisateur a des préférences pour cette date
                const dateString = formatDate(new Date(assignment.date), 'yyyy-MM-dd');

                if (user.preferences.preferredDays?.includes(dateString)) {
                    preferenceMatches++;
                }

                if (user.preferences.preferredDays) {
                    totalPreferences += user.preferences.preferredDays.length;
                }
            }
        });

        // Calcul du score (normalisé entre 0 et 100)
        if (totalPreferences === 0) {
            return 100; // Pas de préférences, tout le monde est satisfait par défaut
        }

        return (preferenceMatches / totalPreferences) * 100;
    }

    /**
     * Calcule le score de conformité aux règles
     */
    private calculateRuleComplianceScore(ruleResults: { passed: boolean; severity: number }[]): number {
        if (ruleResults.length === 0) {
            return 100; // Pas de règles, conformité parfaite
        }

        // Calculer le score en fonction des règles respectées et de leur sévérité
        const totalSeverity = ruleResults.reduce((sum, result) => sum + result.severity, 0);
        const passedSeverity = ruleResults
            .filter(result => result.passed)
            .reduce((sum, result) => sum + result.severity, 0);

        return (passedSeverity / totalSeverity) * 100;
    }

    /**
     * Simule l'évaluation d'une règle (à remplacer par l'appel au moteur de règles en production)
     */
    private simulateRuleEvaluation(rule: Rule, assignments: Assignment[]): boolean {
        // Cette méthode est une simulation simplifiée
        // En production, utiliser le moteur de règles complet

        // Simuler différents types de règles
        switch (rule.type) {
            case RuleType.PLANNING:
                // Règle de planning (ex: pas plus de X gardes consécutives)
                return Math.random() > 0.2; // 80% de chances de succès

            case RuleType.ALLOCATION:
                // Règle d'allocation (ex: équité dans la distribution)
                return Math.random() > 0.3; // 70% de chances de succès

            case RuleType.CONSTRAINT:
                // Contrainte (ex: respect des indisponibilités)
                return Math.random() > 0.1; // 90% de chances de succès

            case RuleType.SUPERVISION:
                // Règle de supervision (ex: présence d'un senior)
                return Math.random() > 0.2; // 80% de chances de succès

            default:
                return true; // Par défaut, la règle est respectée
        }
    }

    /**
     * Retourne les utilisateurs éligibles pour une date donnée
     */
    private getEligibleUsersForDate(date: Date): User[] {
        // Filtrer les utilisateurs en fonction de leurs disponibilités
        return this.users.filter(user => {
            // Vérifier si l'utilisateur a des indisponibilités pour cette date
            if (user.unavailabilities) {
                return !user.unavailabilities.some(unavailability => {
                    const unavailabilityDate = new Date(unavailability.date);
                    return unavailabilityDate.getTime() === date.getTime();
                });
            }
            return true;
        });
    }
} 