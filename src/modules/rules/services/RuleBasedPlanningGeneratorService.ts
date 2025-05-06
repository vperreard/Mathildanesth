import { PlanningGeneratorService } from '@/modules/planning/services/PlanningGeneratorService';
import { User } from '@/types/user';
import { Assignment } from '@/types/assignment';
import { Rule, RuleType } from '@/modules/dynamicRules/types/rule';
import { RuleEngineService } from '@/modules/dynamicRules/services/ruleEngineService';
import { RuleConflictDetectionService } from '@/modules/dynamicRules/services/RuleConflictDetectionService';
import { EventBusService } from '@/services/eventBusService';
import { addDays, formatDate } from '@/utils/dateUtils';
import { RulesConfiguration } from '@/types/rules';

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
    private dynamicRules: Rule[] = [];
    private optimizationAttempts: number = 0;
    private maxOptimizationAttempts: number = 10;
    private optimizationScores: number[] = [];

    constructor(
        users: User[],
        startDate: Date,
        endDate: Date,
        planningRules: Rule[] = []
    ) {
        super(users, {} as RulesConfiguration, startDate, endDate);
        this.ruleEngine = RuleEngineService.getInstance();
        this.conflictService = RuleConflictDetectionService.getInstance();
        this.eventBus = EventBusService.getInstance();
        this.dynamicRules = planningRules;
    }

    /**
     * Charge les règles de planning depuis la base de données ou une source externe
     */
    public async loadRules(): Promise<void> {
        try {
            // En production, charger les règles depuis l'API ou une autre source
            // Pour l'instant, utiliser les règles passées au constructeur

            // Filtrer pour ne prendre que les règles pertinentes pour la génération de planning
            this.dynamicRules = this.dynamicRules.filter(rule =>
                rule.type === RuleType.PLANNING ||
                rule.type === RuleType.ALLOCATION ||
                rule.type === RuleType.CONSTRAINT ||
                rule.type === RuleType.SUPERVISION
            );

            // Journaliser le chargement des règles
            console.log(`${this.dynamicRules.length} règles de planning chargées`);

            // Émettre un événement pour notifier du chargement des règles
            this.eventBus.emit({
                type: 'rules:loaded',
                data: { count: this.dynamicRules.length }
            });
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
        console.log('Début de la génération de planning basée sur les règles...');

        if (this.dynamicRules.length === 0) {
            await this.loadRules();
        }

        this.optimizationAttempts = 0;
        this.optimizationScores = [];

        const initialAssignments = await super.generatePlanning();
        console.log(`Planning initial généré avec ${initialAssignments.length} affectations.`);

        const optimizedResult = await this.optimizePlanning(initialAssignments);

        console.log(
            `Génération terminée. Score final: ${optimizedResult.score.toFixed(2)}. ` +
            `${optimizedResult.validAssignments.length} affectations valides. ` +
            `${optimizedResult.violatedRules.length} règles violées.`
        );
        this.eventBus.emit({
            type: 'planning:generated',
            data: {
                assignmentsCount: optimizedResult.validAssignments.length,
                violatedRulesCount: optimizedResult.violatedRules.length,
                score: optimizedResult.score
            }
        });

        return optimizedResult.validAssignments;
    }

    /**
     * Optimise un planning existant en appliquant les règles dynamiques
     */
    private async optimizePlanning(assignments: Assignment[]): Promise<OptimizationResult> {
        console.log("Début de l'optimisation du planning...");
        let currentAssignments = [...assignments];
        let bestResult: OptimizationResult = this.evaluatePlanningQuality(currentAssignments);
        console.log(`Score initial: ${bestResult.score.toFixed(2)}, Règles violées: ${bestResult.violatedRules.length}`);

        this.optimizationAttempts = 0;
        this.optimizationScores = [bestResult.score];

        while (this.optimizationAttempts < this.maxOptimizationAttempts) {
            this.optimizationAttempts++;
            console.log(`--- Tentative d'optimisation #${this.optimizationAttempts} ---`);
            const violatedRuleIds = new Set(bestResult.violatedRules.map(v => v.ruleId));
            if (violatedRuleIds.size === 0) {
                console.log(`Aucune règle violée, arrêt de l'optimisation.`); break;
            }

            const problematicAssignments = this.identifyProblematicAssignments(currentAssignments, violatedRuleIds);
            if (problematicAssignments.length === 0) {
                console.log('Aucune affectation problématique identifiée pour les règles violées, arrêt.');
                break;
            }
            console.log(`${problematicAssignments.length} affectations problématiques identifiées.`);

            const improvedAssignments = await this.generateAlternativeAssignments(
                currentAssignments,
                problematicAssignments
            );

            const newResult = this.evaluatePlanningQuality(improvedAssignments);
            this.optimizationScores.push(newResult.score);
            console.log(`Tentative #${this.optimizationAttempts}: Score = ${newResult.score.toFixed(2)}, Violations = ${newResult.violatedRules.length}`);

            if (newResult.score > bestResult.score || (newResult.score === bestResult.score && newResult.violatedRules.length < bestResult.violatedRules.length)) {
                console.log(`Amélioration trouvée. Nouveau meilleur score: ${newResult.score.toFixed(2)}`);
                bestResult = newResult;
                currentAssignments = improvedAssignments;
            }

            if (bestResult.violatedRules.length === 0) {
                console.log('Score optimal atteint (aucune violation).');
                break;
            }
        }

        console.log(`Optimisation terminée après ${this.optimizationAttempts} tentatives.`);
        console.log(`Scores: ${this.optimizationScores.map(s => s.toFixed(2)).join(', ')}`);

        return bestResult;
    }

    /**
     * Évalue la qualité d'un planning en fonction des règles
     * Remplace l'ancienne méthode qui simulait l'évaluation.
     */
    private evaluatePlanningQuality(assignments: Assignment[]): OptimizationResult {
        console.log(`Évaluation de la qualité du planning avec ${assignments.length} affectations.`);
        const context = {
            assignments,
            users: this.users,
            startDate: this.startDate,
            endDate: this.endDate,
            // Ajouter d'autres éléments de contexte si nécessaire pour les règles
        };

        // Évaluer toutes les règles pertinentes dans le contexte du planning actuel
        const evaluationResults = this.ruleEngine.evaluateRules(context, [
            RuleType.PLANNING,
            RuleType.ALLOCATION,
            RuleType.CONSTRAINT,
            RuleType.SUPERVISION
        ]);

        const violatedRules = evaluationResults
            .filter(result => !result.applied) // `applied` indique si la règle est passée
            .map(result => {
                // Retrouver la priorité de la règle originale
                const originalRule = this.dynamicRules.find(r => r.id === result.ruleId);
                return {
                    ruleId: result.ruleId,
                    ruleName: result.ruleName,
                    severity: originalRule?.priority || 0, // Utiliser la priorité comme sévérité
                    message: result.message || `La règle "${result.ruleName}" n'est pas respectée.`
                };
            });

        console.log(`${violatedRules.length} règles violées sur ${evaluationResults.length} évaluées.`);

        // Calculer les scores
        const ruleComplianceScore = this.calculateRuleComplianceScore(violatedRules.length, evaluationResults.length);
        const equityScore = this.calculateEquityScore(assignments);
        const satisfactionScore = this.calculateSatisfactionScore(assignments);

        // Score global pondéré (exemple)
        const totalScore = (ruleComplianceScore * 0.6) + (equityScore * 0.2) + (satisfactionScore * 0.2);

        return {
            score: totalScore,
            validAssignments: assignments,
            violatedRules: violatedRules,
            metrics: {
                equityScore,
                satisfactionScore,
                ruleComplianceScore
            }
        };
    }

    /**
     * Identifie les affectations problématiques liées aux règles violées.
     */
    private identifyProblematicAssignments(assignments: Assignment[], violatedRuleIds: Set<string>): Assignment[] {
        // Implémentation simplifiée : retourne toutes les affectations pour l'instant.
        // Une meilleure implémentation analyserait le contexte de chaque règle violée
        // pour identifier les affectations spécifiques qui causent la violation.
        console.log(`Identification des affectations problématiques pour ${violatedRuleIds.size} règles violées... (Simplifié)`);
        // TODO: Implémenter une logique plus fine pour lier violations et affectations.
        return assignments.filter((assignment, index) => index < 5); // Limiter pour tester
    }

    /**
     * Génère des alternatives pour les affectations problématiques.
     * Essaye de trouver de meilleures affectations qui respectent davantage les règles.
     */
    private async generateAlternativeAssignments(
        currentAssignments: Assignment[],
        problematicAssignments: Assignment[]
    ): Promise<Assignment[]> {
        console.log(`Génération d'alternatives pour ${problematicAssignments.length} affectations...`);
        let newAssignments = [...currentAssignments];
        let changesMade = 0;

        for (const problematicAssignment of problematicAssignments) {
            const alternative = await this.findBetterAssignment(problematicAssignment, newAssignments);
            if (alternative) {
                // Remplacer l'affectation problématique par l'alternative
                newAssignments = newAssignments.map(assign =>
                    assign.id === problematicAssignment.id ? alternative : assign
                );
                changesMade++;
                console.log(`Alternative trouvée pour l'affectation ${problematicAssignment.id}`);
            }
        }
        console.log(`${changesMade} alternatives appliquées.`);
        return newAssignments;
    }

    /**
     * Cherche une meilleure affectation (utilisateur différent ou shift différent)
     * pour remplacer une affectation problématique.
     */
    private async findBetterAssignment(
        problematicAssignment: Assignment,
        currentAssignments: Assignment[]
    ): Promise<Assignment | null> {
        const date = problematicAssignment.startDate; // Utiliser la date de début
        const shiftType = problematicAssignment.shiftType;
        const currentUser = this.users.find(u => u.id === problematicAssignment.userId);

        if (!currentUser) return null;

        // 1. Essayer avec d'autres utilisateurs disponibles pour ce créneau
        const availableUsers = super.getAvailableUsers(date, shiftType)
            .filter(user => user.id !== problematicAssignment.userId); // Exclure l'utilisateur actuel

        console.log(`Recherche d'alternative pour ${currentUser.email} le ${formatDate(date, 'yyyy-MM-dd')} (${shiftType}). ${availableUsers.length} autres utilisateurs disponibles.`);

        for (const potentialUser of availableUsers) {
            const potentialAssignment: Assignment = {
                ...problematicAssignment,
                id: `alt-${problematicAssignment.id}-${potentialUser.id}`,
                userId: potentialUser.id,
                // Recalculer potentiellement les dates si nécessaire
            };

            // Évaluer si cette alternative améliore le score (réduit les violations)
            // Crée une copie temporaire du planning avec l'alternative
            const tempAssignments = currentAssignments.map(assign =>
                assign.id === problematicAssignment.id ? potentialAssignment : assign
            );
            const tempEvaluation = this.evaluatePlanningQuality(tempAssignments);

            // Comparer avec une évaluation où l'affectation problématique est simplement retirée
            const assignmentsWithoutProblem = currentAssignments.filter(a => a.id !== problematicAssignment.id);
            const evalWithoutProblem = this.evaluatePlanningQuality(assignmentsWithoutProblem);

            // Si l'alternative est meilleure que de simplement supprimer l'affectation problématique
            if (tempEvaluation.score > evalWithoutProblem.score) {
                console.log(`  -> Utilisateur alternatif ${potentialUser.email} améliore le score.`);
                // Retourner une copie propre de l'alternative
                return { ...potentialAssignment, id: problematicAssignment.id }; // Rétablir l'ID original
            }
        }

        // 2. Si aucun utilisateur alternatif n'améliore, envisager d'autres stratégies
        //    (changer le type de shift, laisser vacant, etc.) - Non implémenté ici

        console.log(`  -> Aucune alternative trouvée pour l'affectation ${problematicAssignment.id}.`);
        return null;
    }

    // --- Fonctions de calcul de score (Exemples simplifiés) ---

    private calculateRuleComplianceScore(violatedCount: number, totalEvaluated: number): number {
        if (totalEvaluated === 0) return 100;
        const complianceRatio = 1 - (violatedCount / totalEvaluated);
        return Math.max(0, complianceRatio * 100);
    }

    private calculateEquityScore(assignments: Assignment[]): number {
        // Logique d'équité simplifiée
        const counts = this.users.map(user => assignments.filter(a => a.userId === user.id).length);
        if (counts.length < 2) return 100;
        const min = Math.min(...counts);
        const max = Math.max(...counts);
        return max === 0 ? 100 : Math.max(0, (1 - (max - min) / max) * 100);
    }

    private calculateSatisfactionScore(assignments: Assignment[]): number {
        // Logique de satisfaction simplifiée (pourrait utiliser les préférences utilisateur)
        return 80; // Placeholder
    }

    // Supprimer ou remplacer l'ancienne méthode de simulation
    /*
    private simulateRuleEvaluation(rule: Rule, assignments: Assignment[]): boolean {
        // ... ancienne logique ...
        console.warn("Utilisation de simulateRuleEvaluation - à remplacer par le vrai moteur de règles.");
        // Simulation simple : échoue aléatoirement avec une probabilité basée sur la priorité
        const failProbability = (100 - rule.priority) / 200; // Plus haute priorité = moins de chance d'échouer
        const passed = Math.random() > failProbability;
        if (!passed) {
             console.log(`Simulation: Règle "${rule.name}" (priorité ${rule.priority}) échouée.`);
        }
        return passed;
    }
    */

    // Garder getAvailableUsers de la classe parente, ou le surcharger si nécessaire
    // pour intégrer des règles spécifiques à la disponibilité.
    /*
    protected getAvailableUsers(date: Date, shiftType: ShiftType): User[] {
        const baseAvailableUsers = super.getAvailableUsers(date, shiftType);
        // Appliquer des règles dynamiques pour filtrer davantage les utilisateurs
        const context = { date, shiftType, users: baseAvailableUsers };
        const evaluationResults = this.ruleEngine.evaluateRules(context, [RuleType.ALLOCATION]);

        // Filtrer les utilisateurs basés sur les règles PREVENT ou ALLOW
        // ... logique complexe ...

        return filteredUsers;
    }
    */
} 