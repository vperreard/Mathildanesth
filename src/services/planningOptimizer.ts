import { Assignment, AssignmentType, UserCounter } from '../types/assignment';
import { ShiftType } from '../types/common';
import { User } from '../types/user';
import { RulesConfiguration, FatigueConfig } from '../types/rules';
import { logger } from '../utils/logger';

/**
 * Service d'optimisation du planning
 * Améliore la qualité du planning généré en appliquant des règles de priorité
 * et en optimisant la répartition des affectations
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
    public optimizePlanning(assignments: Assignment[]): Assignment[] {
        logger.info('Début de l\'optimisation du planning');

        // 1. Appliquer les règles de priorité
        const prioritizedAssignments = this.applyPriorityRules(assignments);

        // 2. Optimiser la répartition des affectations
        const balancedAssignments = this.balanceAssignments(prioritizedAssignments);

        // 3. Calculer et appliquer les scores de fatigue
        const fatigueOptimizedAssignments = this.optimizeFatigueScores(balancedAssignments);

        logger.info('Optimisation du planning terminée');
        return fatigueOptimizedAssignments;
    }

    /**
     * Applique les règles de priorité aux affectations
     */
    private applyPriorityRules(assignments: Assignment[]): Assignment[] {
        logger.debug('Application des règles de priorité');

        return assignments.sort((a, b) => {
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
     * Équilibre les affectations entre les utilisateurs
     */
    private balanceAssignments(assignments: Assignment[]): Assignment[] {
        logger.debug('Équilibrage des affectations');

        const userAssignments = new Map<string, Assignment[]>();

        // Regrouper les affectations par utilisateur
        assignments.forEach(assignment => {
            if (!userAssignments.has(assignment.userId)) {
                userAssignments.set(assignment.userId, []);
            }
            userAssignments.get(assignment.userId)?.push(assignment);
        });

        // Calculer la moyenne des affectations par type
        const averages = this.calculateAssignmentAverages(userAssignments);

        // Rééquilibrer les affectations
        return this.redistributeAssignments(assignments, averages);
    }

    /**
     * Calcule les moyennes d'affectations par type
     */
    private calculateAssignmentAverages(userAssignments: Map<string, Assignment[]>): Map<ShiftType, number> {
        const averages = new Map<ShiftType, number>();
        const counts = new Map<ShiftType, number>();

        userAssignments.forEach(assignments => {
            assignments.forEach(assignment => {
                const currentCount = counts.get(assignment.shiftType) || 0;
                counts.set(assignment.shiftType, currentCount + 1);
            });
        });

        counts.forEach((count, type) => {
            averages.set(type, count / userAssignments.size);
        });

        return averages;
    }

    /**
     * Répartit les affectations de manière équilibrée
     */
    private redistributeAssignments(
        assignments: Assignment[],
        averages: Map<ShiftType, number>
    ): Assignment[] {
        const userAssignmentCounts = new Map<string, Map<ShiftType, number>>();

        // Initialiser les compteurs
        assignments.forEach(assignment => {
            if (!userAssignmentCounts.has(assignment.userId)) {
                userAssignmentCounts.set(assignment.userId, new Map());
            }
            const userCounts = userAssignmentCounts.get(assignment.userId)!;
            const currentCount = userCounts.get(assignment.shiftType) || 0;
            userCounts.set(assignment.shiftType, currentCount + 1);
        });

        // Rééquilibrer les affectations
        return assignments.sort((a, b) => {
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
    private optimizeFatigueScores(assignments: Assignment[]): Assignment[] {
        logger.debug('Optimisation des scores de fatigue');

        return assignments.map(assignment => {
            const userCounter = this.userCounters.get(parseInt(assignment.userId));
            if (!userCounter) return assignment;

            // Calculer le nouveau score de fatigue
            const fatigueScore = this.calculateFatigueScore(assignment, userCounter);

            // Mettre à jour le compteur
            userCounter.fatigue.score = fatigueScore;
            userCounter.fatigue.lastUpdate = new Date();

            return assignment;
        });
    }

    /**
     * Calcule le score de fatigue pour une affectation
     */
    private calculateFatigueScore(assignment: Assignment, userCounter: UserCounter): number {
        const baseScore = userCounter.fatigue.score;
        let additionalScore = 0;

        switch (assignment.shiftType) {
            case ShiftType.NUIT:
                additionalScore = this.fatigueConfig.points.garde;
                break;
            case ShiftType.ASTREINTE:
            case ShiftType.ASTREINTE_SEMAINE:
            case ShiftType.ASTREINTE_WEEKEND:
                additionalScore = this.fatigueConfig.points.astreinte;
                break;
            case ShiftType.GARDE_WEEKEND:
                if (assignment.notes?.includes('pediatrie')) {
                    additionalScore = this.fatigueConfig.points.pediatrie;
                }
                if (this.isMultipleSupervisedSector(assignment.notes || '')) {
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