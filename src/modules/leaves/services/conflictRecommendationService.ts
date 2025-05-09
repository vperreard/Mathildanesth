import {
    LeaveConflict,
    ConflictType,
    ConflictSeverity,
    ConflictResolution
} from '../types/conflict';
import {
    ConflictRecommendation,
    ConflictAnalysisResult,
    ConflictResolutionRules,
    RecommendationOptions,
    ConflictPriority,
    ResolutionStrategy
} from '../types/recommendation';
import { formatDate, parseDate } from '../../../utils/dateUtils';
import { addDays, subDays, differenceInBusinessDays, format, isWeekend } from 'date-fns';
import { fr } from 'date-fns/locale';
import { EventBusService } from '@/services/eventBusService';
import { LeaveRequest } from '../types/leave';
import { User } from '../../../types/user';
import { logError } from '@/services/errorLoggingService';
import { ErrorDetails } from '@/hooks/useErrorHandler';

/**
 * Service d'analyse et de recommandation pour la résolution des conflits
 */
export class ConflictRecommendationService {
    private static instance: ConflictRecommendationService;
    private options: RecommendationOptions;
    private eventBus: EventBusService;
    private resolutionHistory: Map<string, ConflictRecommendation> = new Map();

    private constructor() {
        this.eventBus = EventBusService.getInstance();
        this.options = {
            rules: this.getDefaultRules(),
            maxRecommendationsPerConflict: 3,
            enableAutoResolution: true,
            learnFromPastResolutions: true,
            considerWorkload: true,
            considerUserHistory: true,
            considerTeamBalance: true,
            explanationLevel: 'DETAILED'
        };

        // Abonnement aux événements de résolution pour l'apprentissage
        if (this.options.learnFromPastResolutions) {
            this.eventBus.subscribe('conflict.resolved', this.learnFromResolution.bind(this));
        }
    }

    /**
     * Obtenir l'instance singleton du service
     */
    public static getInstance(): ConflictRecommendationService {
        if (!ConflictRecommendationService.instance) {
            ConflictRecommendationService.instance = new ConflictRecommendationService();
        }
        return ConflictRecommendationService.instance;
    }

    /**
     * Analyser une liste de conflits et générer des recommandations
     * @param conflicts Liste des conflits à analyser
     * @param leaveRequest Demande de congé associée aux conflits
     * @param user Utilisateur qui a fait la demande
     * @returns Résultat de l'analyse avec recommandations
     */
    public analyzeConflicts(
        conflicts: LeaveConflict[],
        leaveRequest: Partial<LeaveRequest>,
        user?: User
    ): ConflictAnalysisResult {
        console.log('[Service Debug] analyzeConflicts - conflicts.length:', conflicts.length);
        if (!conflicts || conflicts.length === 0) {
            console.log('[Service Debug] Aucun conflit, appel de createEmptyAnalysisResult');
            const emptyResult = this.createEmptyAnalysisResult();
            console.log('[Service Debug] emptyResult:', JSON.stringify(emptyResult));
            return emptyResult;
        }

        try {
            console.log('[Service Debug] analyzeConflicts - generating recommendations...');
            const recommendations: ConflictRecommendation[] = conflicts.map(
                conflict => this.analyzeConflict(conflict, leaveRequest, user)
            );
            console.log('[Service Debug] analyzeConflicts - generated recommendations:', JSON.stringify(recommendations));

            // Compter les résolutions automatiques et manuelles
            const automatedResolutionsCount = recommendations.filter(r => r.automaticResolution).length;
            const manualResolutionsCount = recommendations.length - automatedResolutionsCount;

            // Calculer la distribution des priorités
            const priorityDistribution = this.calculatePriorityDistribution(recommendations);

            // Identifier les conflits les plus prioritaires
            const highestPriorityConflicts = this.getHighestPriorityConflicts(recommendations);

            // Si des résolutions automatiques sont possibles, les appliquer
            if (automatedResolutionsCount > 0 && this.options.enableAutoResolution) {
                this.applyAutomaticResolutions(recommendations);
            }

            return {
                recommendations,
                automatedResolutionsCount,
                manualResolutionsCount,
                priorityDistribution,
                highestPriorityConflicts
            };
        } catch (error) {
            // Construire un objet ErrorDetails avant d'appeler logError
            const errorDetails: ErrorDetails = {
                message: error instanceof Error ? error.message : 'Erreur inconnue lors de l\'analyse des conflits',
                severity: 'error', // Utiliser la minuscule
                code: 'CONFLICT_ANALYSIS_FAILED',
                context: { rawError: error, leaveRequest, user },
                timestamp: new Date()
            };
            logError('Erreur lors de l\'analyse des conflits', errorDetails);
            // Retourner un résultat vide en cas d'erreur
            console.log('[Service Debug] Erreur, appel de createEmptyAnalysisResult dans catch');
            const errorEmptyResult = this.createEmptyAnalysisResult();
            console.log('[Service Debug] errorEmptyResult:', JSON.stringify(errorEmptyResult));
            return errorEmptyResult;
        }
    }

    /**
     * Analyser un conflit spécifique
     */
    private analyzeConflict(
        conflict: LeaveConflict,
        leaveRequest: Partial<LeaveRequest>,
        user?: User,
        rules?: ConflictResolutionRules
    ): ConflictRecommendation {
        // Utiliser les règles spécifiées ou par défaut
        const effectiveRules = rules || this.options.rules;

        // Déterminer la priorité du conflit selon les règles
        const priority = this.determineConflictPriority(conflict, user, effectiveRules);

        // Générer des stratégies de résolution pour ce type de conflit
        const strategies = this.generateResolutionStrategies(
            conflict,
            leaveRequest,
            user,
            effectiveRules
        );

        // Vérifier si ce conflit peut être résolu automatiquement
        const automaticResolution = this.canResolveAutomatically(
            conflict,
            strategies,
            effectiveRules
        );

        // Générer une explication pour cette recommandation
        const explanation = this.generateExplanation(
            conflict,
            strategies,
            automaticResolution,
            priority,
            effectiveRules
        );

        return {
            conflictId: conflict.id,
            priority,
            strategies,
            automaticResolution,
            explanation,
            resolutionStatus: 'PENDING' // Par défaut, la recommandation est en attente
        };
    }

    /**
     * Déterminer la priorité d'un conflit
     */
    private determineConflictPriority(
        conflict: LeaveConflict,
        user?: User,
        rules?: ConflictResolutionRules
    ): ConflictPriority {
        const effectiveRules = rules || this.options.rules;
        let basePriority: ConflictPriority;

        // Obtenir la priorité de base selon le type et la sévérité
        if (effectiveRules.priorityRules[conflict.type]?.[conflict.severity]) {
            basePriority = effectiveRules.priorityRules[conflict.type][conflict.severity];
        } else {
            // Priorité par défaut basée sur la sévérité
            switch (conflict.severity) {
                case ConflictSeverity.BLOQUANT:
                    basePriority = ConflictPriority.VERY_HIGH;
                    break;
                case ConflictSeverity.AVERTISSEMENT:
                    basePriority = ConflictPriority.HIGH;
                    break;
                default:
                    basePriority = ConflictPriority.MEDIUM;
            }
        }

        // Ajuster la priorité en fonction du rôle de l'utilisateur si spécifié
        if (user?.role && effectiveRules.userRolePriorities?.[user.role]) {
            const rolePriority = effectiveRules.userRolePriorities[user.role];

            // Réduire la priorité si le rôle de l'utilisateur est prioritaire
            if (rolePriority > ConflictPriority.MEDIUM) {
                return Math.max(basePriority - 1, ConflictPriority.VERY_LOW) as ConflictPriority;
            }
        }

        // Vérifier si le conflit tombe dans une période spéciale
        if (effectiveRules.specialPeriods) {
            for (const period of effectiveRules.specialPeriods) {
                const periodStart = new Date(period.startDate);
                const periodEnd = new Date(period.endDate);
                const conflictStart = new Date(conflict.startDate);
                const conflictEnd = new Date(conflict.endDate);

                // Si le conflit chevauche la période spéciale
                if (conflictStart <= periodEnd && conflictEnd >= periodStart) {
                    // Appliquer le modificateur de priorité
                    const newPriority = basePriority + period.priorityModifier;
                    // S'assurer que la priorité reste dans les limites
                    return Math.min(
                        Math.max(newPriority, ConflictPriority.VERY_LOW),
                        ConflictPriority.VERY_HIGH
                    ) as ConflictPriority;
                }
            }
        }

        return basePriority;
    }

    /**
     * Générer des stratégies de résolution pour un conflit
     */
    private generateResolutionStrategies(
        conflict: LeaveConflict,
        leaveRequest: Partial<LeaveRequest>,
        user?: User,
        rules?: ConflictResolutionRules
    ) {
        const effectiveRules = rules || this.options.rules;
        const strategies = [];
        const maxStrategies = this.options.maxRecommendationsPerConflict || 3;

        // Récupérer les stratégies préférées pour ce type de conflit
        const preferredStrategies = effectiveRules.preferredStrategies?.[conflict.type] || this.getDefaultStrategiesForType(conflict.type);

        // Dates de début et fin du congé
        const startDate = parseDate(conflict.startDate);
        const endDate = parseDate(conflict.endDate);

        // Parcourir les stratégies préférées
        for (const strategy of preferredStrategies) {
            let confidence = 0;
            let description = '';
            let alternativeDates = [];
            let affectedUsers = [];
            let additionalActions = [];

            switch (strategy) {
                case ResolutionStrategy.APPROVE:
                    // Ne recommander l'approbation que pour les conflits non bloquants
                    if (conflict.severity !== ConflictSeverity.BLOQUANT) {
                        confidence = conflict.severity === ConflictSeverity.INFORMATION ? 90 : 60;
                        description = `Approuver malgré le conflit - l'impact est gérable`;
                    } else {
                        continue; // Ne pas proposer cette stratégie pour les conflits bloquants
                    }
                    break;

                case ResolutionStrategy.REJECT:
                    confidence = conflict.severity === ConflictSeverity.BLOQUANT ? 85 : 40;
                    description = `Rejeter la demande de congé en raison du conflit`;
                    break;

                case ResolutionStrategy.RESCHEDULE_BEFORE:
                    // Calculer des dates alternatives avant la période demandée
                    const beforeStart = subDays(startDate, 7);
                    const beforeEnd = subDays(endDate, 7);
                    confidence = 75;
                    description = `Reprogrammer une semaine avant (${format(beforeStart, 'dd/MM/yyyy', { locale: fr })} - ${format(beforeEnd, 'dd/MM/yyyy', { locale: fr })})`;
                    alternativeDates = [{
                        startDate: formatDate(beforeStart),
                        endDate: formatDate(beforeEnd)
                    }];
                    break;

                case ResolutionStrategy.RESCHEDULE_AFTER:
                    // Calculer des dates alternatives après la période demandée
                    const afterStart = addDays(startDate, 7);
                    const afterEnd = addDays(endDate, 7);
                    confidence = 75;
                    description = `Reprogrammer une semaine après (${format(afterStart, 'dd/MM/yyyy', { locale: fr })} - ${format(afterEnd, 'dd/MM/yyyy', { locale: fr })})`;
                    alternativeDates = [{
                        startDate: formatDate(afterStart),
                        endDate: formatDate(afterEnd)
                    }];
                    break;

                case ResolutionStrategy.SHORTEN:
                    // Proposer de raccourcir le congé
                    const shortenedEnd = subDays(endDate, Math.ceil(differenceInBusinessDays(endDate, startDate) / 3));
                    confidence = 70;
                    description = `Raccourcir la période de congé jusqu'au ${format(shortenedEnd, 'dd/MM/yyyy', { locale: fr })}`;
                    alternativeDates = [{
                        startDate: formatDate(startDate),
                        endDate: formatDate(shortenedEnd)
                    }];
                    break;

                case ResolutionStrategy.SPLIT:
                    // Proposer de diviser le congé en deux périodes
                    const durationDays = differenceInBusinessDays(endDate, startDate);
                    if (durationDays >= 5) {
                        const midPoint = addDays(startDate, Math.floor(durationDays / 2));
                        const secondStart = addDays(midPoint, 7); // Une semaine après le milieu
                        confidence = 65;
                        description = `Diviser en 2 périodes: ${format(startDate, 'dd/MM/yyyy', { locale: fr })} - ${format(midPoint, 'dd/MM/yyyy', { locale: fr })} et ${format(secondStart, 'dd/MM/yyyy', { locale: fr })} - ${format(endDate, 'dd/MM/yyyy', { locale: fr })}`;
                        alternativeDates = [
                            {
                                startDate: formatDate(startDate),
                                endDate: formatDate(midPoint)
                            },
                            {
                                startDate: formatDate(secondStart),
                                endDate: formatDate(endDate)
                            }
                        ];
                    } else {
                        continue; // Ne pas proposer cette stratégie pour les congés courts
                    }
                    break;

                case ResolutionStrategy.REASSIGN:
                    if (conflict.type === ConflictType.CRITICAL_ROLE && conflict.affectedUsers?.length) {
                        confidence = 60;
                        description = `Réassigner les responsabilités à un autre collaborateur`;
                        affectedUsers = conflict.affectedUsers.map(u => u.id);
                        additionalActions = ['Contacter le responsable de service', 'Établir un plan de suppléance'];
                    } else {
                        continue; // Ne pas proposer cette stratégie pour les autres types de conflits
                    }
                    break;

                case ResolutionStrategy.SWAP:
                    confidence = 50;
                    description = `Proposer un échange de congés avec un autre membre de l'équipe`;
                    additionalActions = ['Identifier un collègue disponible pour l\'échange'];
                    break;

                case ResolutionStrategy.MANUAL:
                    confidence = 100;
                    description = `Résolution manuelle requise - traiter au cas par cas`;
                    break;

                default:
                    continue; // Ignorer les stratégies non implémentées
            }

            // Ajouter la stratégie à la liste si une description a été générée
            if (description) {
                strategies.push({
                    strategy,
                    description,
                    confidence,
                    ...(alternativeDates.length > 0 && { alternativeDates }),
                    ...(affectedUsers.length > 0 && { affectedUsers }),
                    ...(additionalActions.length > 0 && { additionalActions })
                });
            }

            // Limiter le nombre de stratégies
            if (strategies.length >= maxStrategies) {
                break;
            }
        }

        // Trier les stratégies par confiance décroissante
        return strategies.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Vérifier si un conflit peut être résolu automatiquement
     */
    private canResolveAutomatically(
        conflict: LeaveConflict,
        strategies: any[],
        rules?: ConflictResolutionRules
    ): boolean {
        const effectiveRules = rules || this.options.rules;

        // Si la résolution automatique est désactivée
        if (!this.options.enableAutoResolution) {
            return false;
        }

        // Si le conflit est bloquant et les seuils n'autorisent pas les conflits bloquants
        if (conflict.severity === ConflictSeverity.BLOQUANT &&
            effectiveRules.autoResolutionThresholds?.maxSeverity !== ConflictSeverity.BLOQUANT) {
            return false;
        }

        // Si la sévérité du conflit est supérieure au seuil maximum
        if (this.getSeverityValue(conflict.severity) > this.getSeverityValue(effectiveRules.autoResolutionThresholds?.maxSeverity || ConflictSeverity.INFORMATION)) {
            return false;
        }

        // Vérifier si au moins une stratégie répond aux critères
        return strategies.some(s => {
            // La stratégie doit avoir une confiance suffisante
            const hasConfidence = s.confidence >= (effectiveRules.autoResolutionThresholds?.minConfidence || 80);

            // La stratégie doit être dans la liste des stratégies autorisées
            const isEnabled = effectiveRules.autoResolutionThresholds?.enabledStrategies?.includes(s.strategy) || false;

            return hasConfidence && isEnabled;
        });
    }

    /**
     * Générer une explication pour une recommandation
     */
    private generateExplanation(
        conflict: LeaveConflict,
        strategies: any[],
        automaticResolution: boolean,
        priority: ConflictPriority,
        rules?: ConflictResolutionRules
    ): string {
        if (this.options.explanationLevel === 'NONE') {
            return '';
        }

        const priorityTexts = {
            [ConflictPriority.VERY_LOW]: 'très basse',
            [ConflictPriority.LOW]: 'basse',
            [ConflictPriority.MEDIUM]: 'moyenne',
            [ConflictPriority.HIGH]: 'élevée',
            [ConflictPriority.VERY_HIGH]: 'très élevée'
        };

        let explanation = `Ce conflit est de priorité ${priorityTexts[priority]}. `;

        if (automaticResolution) {
            explanation += 'La résolution automatique est possible. ';
        } else {
            explanation += 'Une intervention manuelle est recommandée. ';
        }

        // Si explication détaillée demandée
        if (this.options.explanationLevel === 'DETAILED' && strategies.length > 0) {
            explanation += `Stratégie principale recommandée : ${strategies[0].description}`;

            if (strategies.length > 1) {
                explanation += `. Alternative(s) possible(s) : ${strategies
                    .slice(1)
                    .map(s => s.description)
                    .join(', ')}.`;
            }
        }

        return explanation;
    }

    /**
     * Appliquer les résolutions automatiques
     */
    private applyAutomaticResolutions(recommendations: ConflictRecommendation[]): void {
        for (const rec of recommendations) {
            if (rec.automaticResolution && rec.strategies.length > 0) {
                const bestStrategy = rec.strategies[0];

                // Mettre à jour le statut de la recommandation
                rec.resolutionStatus = 'APPLIED';
                rec.appliedStrategy = bestStrategy.strategy;

                // Créer les données de résolution
                rec.resolutionData = {
                    conflictId: rec.conflictId,
                    resolvedBy: 'system', // Résolution par le système
                    resolvedAt: formatDate(new Date()),
                    resolution: this.mapStrategyToResolutionType(bestStrategy.strategy),
                    comment: `Résolution automatique: ${bestStrategy.description}`,
                    ...(bestStrategy.alternativeDates && bestStrategy.alternativeDates.length > 0 && {
                        alternativeDates: bestStrategy.alternativeDates[0]
                    })
                };

                // Émettre un événement pour notifier de la résolution
                this.eventBus.emit({
                    type: 'conflict.resolved',
                    data: {
                        conflictId: rec.conflictId,
                        recommendation: rec,
                        automatic: true
                    }
                });
            }
        }
    }

    /**
     * Convertir une stratégie en type de résolution
     */
    private mapStrategyToResolutionType(strategy: ResolutionStrategy): 'APPROVED' | 'REJECTED' | 'MODIFIED' {
        switch (strategy) {
            case ResolutionStrategy.APPROVE:
                return 'APPROVED';
            case ResolutionStrategy.REJECT:
                return 'REJECTED';
            default:
                return 'MODIFIED';
        }
    }

    /**
     * Calculer la distribution des priorités
     */
    private calculatePriorityDistribution(recommendations: ConflictRecommendation[]): Record<ConflictPriority, number> {
        const distribution: Record<ConflictPriority, number> = {
            [ConflictPriority.VERY_LOW]: 0,
            [ConflictPriority.LOW]: 0,
            [ConflictPriority.MEDIUM]: 0,
            [ConflictPriority.HIGH]: 0,
            [ConflictPriority.VERY_HIGH]: 0
        };

        for (const rec of recommendations) {
            distribution[rec.priority]++;
        }

        return distribution;
    }

    /**
     * Récupérer les conflits les plus prioritaires
     */
    private getHighestPriorityConflicts(recommendations: ConflictRecommendation[]): ConflictRecommendation[] {
        if (recommendations.length === 0) {
            return [];
        }

        // Trouver la priorité la plus élevée
        const maxPriority = Math.max(...recommendations.map(r => r.priority));

        // Retourner tous les conflits ayant cette priorité
        return recommendations.filter(r => r.priority === maxPriority);
    }

    /**
     * Créer un résultat d'analyse vide
     */
    private createEmptyAnalysisResult(): ConflictAnalysisResult {
        const result = {
            recommendations: [],
            automatedResolutionsCount: 0,
            manualResolutionsCount: 0,
            priorityDistribution: {} as Record<ConflictPriority, number>,
            highestPriorityConflicts: []
        };
        // console.log('[Service Debug] createEmptyAnalysisResult retourne:', JSON.stringify(result)); // Log déjà ajouté plus haut
        return result;
    }

    /**
     * Apprendre des résolutions passées
     */
    private learnFromResolution(event: any): void {
        try {
            const { conflictId, recommendation, automatic } = event.data;

            // Ne pas apprendre des résolutions automatiques pour éviter les boucles
            if (automatic) {
                return;
            }

            // Stocker la recommandation résolue dans l'historique
            this.resolutionHistory.set(conflictId, recommendation);

            // Limiter la taille de l'historique (garder les 100 dernières résolutions)
            if (this.resolutionHistory.size > 100) {
                const oldestKey = Array.from(this.resolutionHistory.keys())[0];
                this.resolutionHistory.delete(oldestKey);
            }
        } catch (error) {
            logError('Erreur lors de l\'apprentissage des résolutions passées', error);
        }
    }

    /**
     * Obtenir la valeur numérique d'une sévérité pour comparaison
     */
    private getSeverityValue(severity: ConflictSeverity): number {
        switch (severity) {
            case ConflictSeverity.INFORMATION:
                return 1;
            case ConflictSeverity.AVERTISSEMENT:
                return 2;
            case ConflictSeverity.BLOQUANT:
                return 3;
            default:
                return 0;
        }
    }

    /**
     * Obtenir les stratégies par défaut pour un type de conflit
     */
    private getDefaultStrategiesForType(type: ConflictType): ResolutionStrategy[] {
        switch (type) {
            case ConflictType.USER_LEAVE_OVERLAP:
                return [
                    ResolutionStrategy.RESCHEDULE_BEFORE,
                    ResolutionStrategy.RESCHEDULE_AFTER,
                    ResolutionStrategy.REJECT
                ];
            case ConflictType.TEAM_ABSENCE:
            case ConflictType.TEAM_CAPACITY:
            case ConflictType.SPECIALTY_CAPACITY:
                return [
                    ResolutionStrategy.SPLIT,
                    ResolutionStrategy.RESCHEDULE_AFTER,
                    ResolutionStrategy.REJECT
                ];
            case ConflictType.CRITICAL_ROLE:
                return [
                    ResolutionStrategy.REASSIGN,
                    ResolutionStrategy.SHORTEN,
                    ResolutionStrategy.REJECT
                ];
            case ConflictType.DUTY_CONFLICT:
            case ConflictType.ON_CALL_CONFLICT:
            case ConflictType.ASSIGNMENT_CONFLICT:
                return [
                    ResolutionStrategy.SWAP,
                    ResolutionStrategy.REJECT,
                    ResolutionStrategy.MANUAL
                ];
            default:
                return [
                    ResolutionStrategy.APPROVE,
                    ResolutionStrategy.RESCHEDULE_AFTER,
                    ResolutionStrategy.MANUAL
                ];
        }
    }

    /**
     * Définir les règles par défaut
     */
    public getDefaultRules(): ConflictResolutionRules {
        return {
            priorityRules: {
                [ConflictType.USER_LEAVE_OVERLAP]: {
                    [ConflictSeverity.INFORMATION]: ConflictPriority.LOW,
                    [ConflictSeverity.AVERTISSEMENT]: ConflictPriority.MEDIUM,
                    [ConflictSeverity.BLOQUANT]: ConflictPriority.VERY_HIGH
                },
                [ConflictType.TEAM_ABSENCE]: {
                    [ConflictSeverity.INFORMATION]: ConflictPriority.MEDIUM,
                    [ConflictSeverity.AVERTISSEMENT]: ConflictPriority.HIGH,
                    [ConflictSeverity.BLOQUANT]: ConflictPriority.VERY_HIGH
                },
                [ConflictType.CRITICAL_ROLE]: {
                    [ConflictSeverity.INFORMATION]: ConflictPriority.HIGH,
                    [ConflictSeverity.AVERTISSEMENT]: ConflictPriority.VERY_HIGH,
                    [ConflictSeverity.BLOQUANT]: ConflictPriority.VERY_HIGH
                }
            },
            userRolePriorities: {
                'ADMIN': ConflictPriority.HIGH,
                'MANAGER': ConflictPriority.HIGH,
                'CHEF_SERVICE': ConflictPriority.VERY_HIGH,
                'RESPONSABLE_PLANNING': ConflictPriority.HIGH
            },
            preferredStrategies: {
                [ConflictType.USER_LEAVE_OVERLAP]: [
                    ResolutionStrategy.RESCHEDULE_BEFORE,
                    ResolutionStrategy.RESCHEDULE_AFTER,
                    ResolutionStrategy.REJECT
                ],
                [ConflictType.TEAM_ABSENCE]: [
                    ResolutionStrategy.SPLIT,
                    ResolutionStrategy.RESCHEDULE_AFTER,
                    ResolutionStrategy.REJECT
                ],
                [ConflictType.CRITICAL_ROLE]: [
                    ResolutionStrategy.REASSIGN,
                    ResolutionStrategy.SHORTEN,
                    ResolutionStrategy.REJECT
                ],
                [ConflictType.DEADLINE_PROXIMITY]: [
                    ResolutionStrategy.RESCHEDULE_AFTER,
                    ResolutionStrategy.SHORTEN
                ],
                [ConflictType.HOLIDAY_PROXIMITY]: [
                    ResolutionStrategy.APPROVE,
                    ResolutionStrategy.RESCHEDULE_BEFORE
                ],
                [ConflictType.HIGH_WORKLOAD]: [
                    ResolutionStrategy.RESCHEDULE_AFTER,
                    ResolutionStrategy.SPLIT
                ]
            },
            autoResolutionThresholds: {
                minConfidence: 80,
                maxSeverity: ConflictSeverity.AVERTISSEMENT,
                enabledStrategies: [
                    ResolutionStrategy.APPROVE,
                    ResolutionStrategy.RESCHEDULE_BEFORE,
                    ResolutionStrategy.RESCHEDULE_AFTER
                ]
            },
            specialPeriods: [
                {
                    name: "Vacances d'été",
                    startDate: `${new Date().getFullYear()}-07-01`,
                    endDate: `${new Date().getFullYear()}-08-31`,
                    priorityModifier: 1 // Augmenter la priorité pendant l'été
                },
                {
                    name: "Fêtes de fin d'année",
                    startDate: `${new Date().getFullYear()}-12-20`,
                    endDate: `${new Date().getFullYear()}-01-05`,
                    priorityModifier: 1 // Augmenter la priorité pendant les fêtes
                }
            ]
        };
    }

    /**
     * Mettre à jour les options du service
     */
    public updateOptions(newOptions: Partial<RecommendationOptions>): void {
        this.options = {
            ...this.options,
            ...newOptions
        };
    }

    /**
     * Modifier les règles de résolution
     */
    public updateRules(newRules: Partial<ConflictResolutionRules>): void {
        this.options.rules = {
            ...this.options.rules,
            ...newRules
        };

        // Émettre un événement pour notifier du changement
        this.eventBus.emit({
            type: 'conflict.rules.updated',
            data: {
                updatedRules: Object.keys(newRules),
                updatedBy: 'user'
            }
        });
    }

    /**
     * Réinitialiser les règles aux valeurs par défaut
     */
    public resetRulesToDefault(): void {
        this.options.rules = this.getDefaultRules();

        // Émettre un événement pour notifier du changement
        this.eventBus.emit({
            type: 'conflict.rules.updated',
            data: {
                updatedRules: ['all'],
                updatedBy: 'user',
                resetToDefault: true
            }
        });
    }
} 