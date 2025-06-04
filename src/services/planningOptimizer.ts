import { Attribution, AssignmentType, UserCounter } from '../types/attribution';
import { ShiftType } from '../types/common';
import { User } from '../types/user';
import { RulesConfiguration, FatigueConfig } from '../types/rules';
import { logger } from '../utils/logger';

/**
 * Service d'optimisation du planning
 * Améliore la qualité du planning généré en appliquant des règles de priorité
 * et en optimisant la répartition des gardes/vacations
 */
export class PlanningOptimizer {
    private rulesConfig: RulesConfiguration;
    private fatigueConfig: FatigueConfig;
    private userCounters: Map<number, UserCounter>;
    private cache: Map<string, any> = new Map();
    private readonly DECAY_RATE = 5; // Taux de décroissance par jour

    constructor(
        rulesConfig: RulesConfiguration,
        fatigueConfig: FatigueConfig,
        userCounters: Map<number, UserCounter>
    ) {
        this.rulesConfig = rulesConfig;
        this.fatigueConfig = fatigueConfig;
        this.userCounters = userCounters;
    }

    /**
     * Optimise un planning en appliquant les règles de priorité et d'équilibre
     */
    public optimizePlanning(attributions: Attribution[]): Attribution[] {
        logger.info('Début de l\'optimisation du planning');

        // 1. Appliquer les règles de priorité
        const prioritizedAssignments = this.applyPriorityRules(attributions);

        // 2. Optimiser la répartition des gardes/vacations
        const balancedAssignments = this.balanceAssignments(prioritizedAssignments);

        // 3. Calculer et appliquer les scores de fatigue
        const fatigueOptimizedAssignments = this.optimizeFatigueScores(balancedAssignments);

        logger.info('Optimisation du planning terminée');
        return fatigueOptimizedAssignments;
    }

    /**
     * Applique les règles de priorité aux gardes/vacations
     */
    private applyPriorityRules(attributions: Attribution[]): Attribution[] {
        logger.debug('Application des règles de priorité');

        return attributions.sort((a, b) => {
            // Priorité 1: Gardes et astreintes
            if (a.shiftType === ShiftType.NUIT && b.shiftType !== ShiftType.NUIT) return -1;
            if (a.shiftType === ShiftType.ASTREINTE && b.shiftType !== ShiftType.ASTREINTE) return -1;

            // Priorité 2: Consultations
            if (a.shiftType === ShiftType.MATIN && b.shiftType !== ShiftType.MATIN) return -1;
            if (a.shiftType === ShiftType.APRES_MIDI && b.shiftType !== ShiftType.APRES_MIDI) return -1;

            // Priorité 3: Bloc opératoire
            if (a.shiftType === ShiftType.GARDE_WEEKEND && b.shiftType !== ShiftType.GARDE_WEEKEND) return -1;

            return 0;
        });
    }

    /**
     * Équilibre les gardes/vacations entre les utilisateurs
     */
    private balanceAssignments(attributions: Attribution[]): Attribution[] {
        logger.debug('Équilibrage des gardes/vacations');

        const userAssignments = new Map<string, Attribution[]>();

        // Regrouper les gardes/vacations par utilisateur
        attributions.forEach(attribution => {
            if (!userAssignments.has(attribution.userId)) {
                userAssignments.set(attribution.userId, []);
            }
            userAssignments.get(attribution.userId)?.push(attribution);
        });

        // Calculer la moyenne des gardes/vacations par type
        const averages = this.calculateAssignmentAverages(userAssignments);

        // Rééquilibrer les gardes/vacations
        return this.redistributeAssignments(attributions, averages);
    }

    /**
     * Calcule les moyennes d'gardes/vacations par type
     */
    private calculateAssignmentAverages(userAssignments: Map<string, Attribution[]>): Map<ShiftType, number> {
        const averages = new Map<ShiftType, number>();
        const counts = new Map<ShiftType, number>();

        userAssignments.forEach(attributions => {
            attributions.forEach(attribution => {
                const currentCount = counts.get(attribution.shiftType) || 0;
                counts.set(attribution.shiftType, currentCount + 1);
            });
        });

        counts.forEach((count, type) => {
            averages.set(type, count / userAssignments.size);
        });

        return averages;
    }

    /**
     * Répartit les gardes/vacations de manière équilibrée
     */
    private redistributeAssignments(
        attributions: Attribution[],
        averages: Map<ShiftType, number>
    ): Attribution[] {
        const userAssignmentCounts = new Map<string, Map<ShiftType, number>>();

        // Initialiser les compteurs
        attributions.forEach(attribution => {
            if (!userAssignmentCounts.has(attribution.userId)) {
                userAssignmentCounts.set(attribution.userId, new Map());
            }
            const userCounts = userAssignmentCounts.get(attribution.userId)!;
            const currentCount = userCounts.get(attribution.shiftType) || 0;
            userCounts.set(attribution.shiftType, currentCount + 1);
        });

        // Rééquilibrer les gardes/vacations
        return attributions.sort((a, b) => {
            const aCounts = userAssignmentCounts.get(a.userId)!;
            const bCounts = userAssignmentCounts.get(b.userId)!;

            const aAverage = averages.get(a.shiftType) || 0;
            const bAverage = averages.get(b.shiftType) || 0;

            const aDeviation = (aCounts.get(a.shiftType) || 0) - aAverage;
            const bDeviation = (bCounts.get(b.shiftType) || 0) - bAverage;

            return aDeviation - bDeviation;
        });
    }

    /**
     * Optimise les scores de fatigue
     */
    private optimizeFatigueScores(attributions: Attribution[]): Attribution[] {
        logger.debug('Optimisation des scores de fatigue');

        return attributions.map(attribution => {
            const userCounter = this.userCounters.get(parseInt(attribution.userId));
            if (!userCounter) return attribution;

            // Calculer le nouveau score de fatigue
            const fatigueScore = this.calculateFatigueScore(attribution, userCounter);

            // Mettre à jour le compteur
            userCounter.fatigue.score = fatigueScore;
            userCounter.fatigue.lastUpdate = new Date();

            return attribution;
        });
    }

    /**
     * Calcule le score de fatigue pour une garde/vacation
     */
    private calculateFatigueScore(attribution: Attribution, userCounter: UserCounter): number {
        const baseScore = userCounter.fatigue.score;
        let additionalScore = 0;

        switch (attribution.shiftType) {
            case ShiftType.NUIT:
                additionalScore = this.fatigueConfig.points.garde;
                break;
            case ShiftType.ASTREINTE:
            case ShiftType.ASTREINTE_SEMAINE:
            case ShiftType.ASTREINTE_WEEKEND:
                additionalScore = this.fatigueConfig.points.astreinte;
                break;
            case ShiftType.GARDE_WEEKEND:
                if (attribution.notes?.includes('pediatrie')) {
                    additionalScore = this.fatigueConfig.points.pediatrie;
                }
                if (this.isMultipleSupervisedSector(attribution.notes || '')) {
                    additionalScore += this.fatigueConfig.points.supervisionMultiple;
                }
                break;
        }

        // Appliquer la décroissance temporelle
        const daysSinceLastUpdate = this.getDaysBetween(
            userCounter.fatigue.lastUpdate,
            new Date()
        );
        const decay = Math.max(0, baseScore - (daysSinceLastUpdate * this.DECAY_RATE));

        return decay + additionalScore;
    }

    /**
     * Vérifie si un secteur nécessite une supervision multiple
     */
    private isMultipleSupervisedSector(secteur: string): boolean {
        const maxSalles = this.rulesConfig.supervision.maxSallesParMAR[secteur] ||
            this.rulesConfig.supervision.maxSallesParMAR['standard'] || 2;
        return maxSalles > 2;
    }

    /**
     * Calcule le nombre de jours entre deux dates
     */
    private getDaysBetween(date1: Date, date2: Date): number {
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
    }
} 