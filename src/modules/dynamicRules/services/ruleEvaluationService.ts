import { ScheduleRule, ScheduleRuleConditionGroup, RuleEvaluationResult } from '../models/ScheduleRule';
import { ScheduleRuleService, ScheduleContext } from './scheduleRuleService';
import { logger } from '@/lib/logger';

/**
 * Service d'évaluation des règles pour l'algorithme de génération de planning
 */
export class RuleEvaluationService {
    private ruleService: ScheduleRuleService;

    constructor() {
        this.ruleService = new ScheduleRuleService();
    }

    /**
     * Évalue toutes les règles applicables dans un contexte donné
     * @param context Contexte d'évaluation
     * @returns Résultats d'évaluation des règles
     */
    async evaluateRules(context: ScheduleContext): Promise<RuleEvaluationResult[]> {
        try {
            return await this.ruleService.evaluateRules(context);
        } catch (error) {
            logger.error('Erreur lors de l\'évaluation des règles', { error, context });
            return [];
        }
    }

    /**
     * Vérifie si une affectation est valide selon les règles configurées
     * @param userId ID de l'utilisateur
     * @param date Date de l'affectation
     * @param assignmentType Type d'affectation
     * @param locationId ID de l'emplacement
     * @param additionalContext Contexte supplémentaire
     * @returns Si l'affectation est valide et les raisons
     */
    async validateAssignment(
        userId: number,
        date: Date,
        assignmentType: string,
        locationId?: number,
        additionalContext: Partial<ScheduleContext> = {}
    ): Promise<{
        isValid: boolean;
        forbiddenRules: RuleEvaluationResult[];
        warnings: RuleEvaluationResult[];
        suggestions: RuleEvaluationResult[];
    }> {
        const context: ScheduleContext = {
            userId,
            date,
            assignmentType,
            locationId,
            ...additionalContext
        };

        const results = await this.evaluateRules(context);

        // Classifier les résultats
        const forbiddenRules = results.filter(r =>
            r.satisfied && r.actions.some(a => a.type === 'FORBID_ASSIGNMENT')
        );

        const warnings = results.filter(r =>
            r.satisfied && r.actions.some(a => a.type === 'WARN_ASSIGNMENT')
        );

        const suggestions = results.filter(r =>
            r.satisfied && r.actions.some(a => a.type === 'SUGGEST_ASSIGNMENT')
        );

        return {
            isValid: forbiddenRules.length === 0,
            forbiddenRules,
            warnings,
            suggestions
        };
    }

    /**
     * Applique les actions des règles dans l'algorithme de génération de planning
     * @param generationContext Contexte de génération
     * @returns Contexte de génération modifié
     */
    async applyRulesToGeneration(generationContext: any): Promise<any> {
        const assignments = generationContext.assignments || [];
        const modifiedAssignments = [...assignments];

        // Évaluer chaque affectation proposée
        for (let i = 0; i < modifiedAssignments.length; i++) {
            const assignment = modifiedAssignments[i];

            const validationResult = await this.validateAssignment(
                assignment.userId,
                new Date(assignment.date),
                assignment.type,
                assignment.locationId,
                {
                    previousAssignments: assignments
                        .filter(a => a.userId === assignment.userId && new Date(a.date) < new Date(assignment.date))
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 5)
                        .map(a => ({
                            date: new Date(a.date),
                            type: a.type,
                            locationId: a.locationId
                        })),
                    nextAssignments: assignments
                        .filter(a => a.userId === assignment.userId && new Date(a.date) > new Date(assignment.date))
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .slice(0, 5)
                        .map(a => ({
                            date: new Date(a.date),
                            type: a.type,
                            locationId: a.locationId
                        }))
                }
            );

            // Marquer l'affectation comme invalide si elle viole des règles critiques
            if (!validationResult.isValid) {
                modifiedAssignments[i] = {
                    ...assignment,
                    status: 'REJECTED',
                    rejectionReason: validationResult.forbiddenRules
                        .map(r => r.ruleName)
                        .join(', '),
                    violatedRules: validationResult.forbiddenRules.map(r => r.ruleId)
                };
            }

            // Ajouter des avertissements si nécessaire
            if (validationResult.warnings.length > 0) {
                modifiedAssignments[i] = {
                    ...assignment,
                    warnings: validationResult.warnings.map(r => ({
                        ruleId: r.ruleId,
                        ruleName: r.ruleName
                    }))
                };
            }
        }

        // Appliquer les optimisations avancées (balancement de charge, etc.)
        const optimizedAssignments = this.applyAdvancedOptimizations(modifiedAssignments);

        return {
            ...generationContext,
            assignments: optimizedAssignments,
            ruleViolations: modifiedAssignments
                .filter(a => a.status === 'REJECTED')
                .map(a => ({
                    assignmentId: a.id,
                    userId: a.userId,
                    date: a.date,
                    violatedRules: a.violatedRules
                }))
        };
    }

    /**
     * Applique des optimisations avancées basées sur les règles actives
     * @param assignments Affectations à optimiser
     * @returns Affectations optimisées
     */
    private applyAdvancedOptimizations(assignments: any[]): any[] {
        // Copie pour éviter la mutation directe
        const optimizedAssignments = [...assignments];

        // Balancer la charge de travail
        this.balanceWorkload(optimizedAssignments);

        // Autres optimisations...

        return optimizedAssignments;
    }

    /**
     * Optimise la répartition de la charge de travail
     * @param assignments Affectations à optimiser
     */
    private balanceWorkload(assignments: any[]): void {
        // Compter les affectations par utilisateur
        const userAssignmentCounts = new Map<number, number>();

        assignments.forEach(a => {
            if (a.status !== 'REJECTED') {
                const count = userAssignmentCounts.get(a.userId) || 0;
                userAssignmentCounts.set(a.userId, count + 1);
            }
        });

        // Identifier les utilisateurs suraffectés et sous-affectés
        const assignmentCounts = Array.from(userAssignmentCounts.entries());
        const averageAssignments = assignmentCounts.reduce((sum, [_, count]) => sum + count, 0) / assignmentCounts.length;

        const overAssigned = assignmentCounts
            .filter(([_, count]) => count > averageAssignments * 1.2)
            .map(([userId]) => userId);

        const underAssigned = assignmentCounts
            .filter(([_, count]) => count < averageAssignments * 0.8)
            .map(([userId]) => userId);

        // Marquer les affectations qui pourraient être réaffectées
        if (overAssigned.length > 0 && underAssigned.length > 0) {
            for (let i = 0; i < assignments.length; i++) {
                const assignment = assignments[i];

                if (
                    assignment.status !== 'REJECTED' &&
                    overAssigned.includes(assignment.userId) &&
                    !assignment.isFixed
                ) {
                    assignments[i] = {
                        ...assignment,
                        balanceCandidate: true,
                        targetUsers: underAssigned
                    };
                }
            }
        }
    }

    /**
     * Détecte les conflits entre les règles
     * @returns Liste des conflits détectés
     */
    async detectRuleConflicts(): Promise<{
        conflictingRules: {
            rule1: ScheduleRule;
            rule2: ScheduleRule;
            conflictType: string;
            description: string;
        }[]
    }> {
        const rules = await this.ruleService.getAllRules();
        const conflicts: {
            rule1: ScheduleRule;
            rule2: ScheduleRule;
            conflictType: string;
            description: string;
        }[] = [];

        // Algorithme simple de détection de conflits directs
        for (let i = 0; i < rules.length; i++) {
            for (let j = i + 1; j < rules.length; j++) {
                const rule1 = rules[i];
                const rule2 = rules[j];

                // Vérifier les actions contradictoires
                const rule1Actions = rule1.actions.map(a => a.type);
                const rule2Actions = rule2.actions.map(a => a.type);

                if (
                    (rule1Actions.includes('FORBID_ASSIGNMENT') && rule2Actions.includes('REQUIRE_ASSIGNMENT')) ||
                    (rule1Actions.includes('REQUIRE_ASSIGNMENT') && rule2Actions.includes('FORBID_ASSIGNMENT'))
                ) {
                    conflicts.push({
                        rule1,
                        rule2,
                        conflictType: 'CONTRADICTORY_ACTIONS',
                        description: 'Ces règles ont des actions contradictoires (interdiction vs obligation)'
                    });
                }

                // Autres types de conflits...
            }
        }

        return { conflictingRules: conflicts };
    }
} 