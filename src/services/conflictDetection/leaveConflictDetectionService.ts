import {
    ConflictDetectionService,
    ConflictCheckOptions
} from './conflictDetectionFacade';
import { logger } from "../../lib/logger";
import {
    ConflictCheckResult,
    ConflictType,
    ConflictSeverity,
    LeaveConflict
} from '@/modules/leaves/types/conflict';
import { checkLeaveConflicts } from '@/modules/leaves/services/leaveService';

/**
 * Service de détection de conflits spécifique aux congés
 * Implémente l'interface ConflictDetectionService pour s'intégrer à la façade
 */
export class LeaveConflictDetectionService implements ConflictDetectionService {
    private readonly SERVICE_NAME = 'LeaveConflictDetectionService';

    /**
     * Types de conflits gérés par ce service
     */
    private readonly SUPPORTED_CONFLICT_TYPES: ConflictType[] = [
        ConflictType.USER_LEAVE_OVERLAP,
        ConflictType.TEAM_ABSENCE,
        ConflictType.TEAM_CAPACITY,
        ConflictType.SPECIALTY_CAPACITY,
        ConflictType.CRITICAL_ROLE,
        ConflictType.SPECIAL_PERIOD,
        ConflictType.HOLIDAY_PROXIMITY,
        ConflictType.HIGH_WORKLOAD
    ];

    /**
     * Vérifie les conflits de congés sur une période donnée
     * @param startDate Date de début
     * @param endDate Date de fin
     * @param options Options de vérification
     * @returns Résultat de la vérification des conflits
     */
    async checkConflicts(
        startDate: Date,
        endDate: Date,
        options: ConflictCheckOptions
    ): Promise<ConflictCheckResult> {
        // Si les congés ne sont pas inclus dans les options, retourner un résultat vide
        if (options.includeLeaveConflicts === false) {
            return this.createEmptyResult();
        }

        // Vérifier que l'ID utilisateur est défini
        if (!options.userId) {
            logger.warn('LeaveConflictDetectionService: userId est requis pour la détection de conflits de congés');
            return this.createEmptyResult();
        }

        try {
            // Utiliser le service existant pour vérifier les conflits
            const result = await checkLeaveConflicts(
                startDate,
                endDate,
                options.userId,
                options.context?.leaveId
            );

            // Filtrer par seuil de sévérité si défini
            if (options.severityThreshold) {
                const severityMap: Record<ConflictSeverity, number> = {
                    [ConflictSeverity.INFORMATION]: 1,
                    [ConflictSeverity.AVERTISSEMENT]: 2,
                    [ConflictSeverity.BLOQUANT]: 3
                };

                const thresholdValue = severityMap[options.severityThreshold];

                return {
                    ...result,
                    conflicts: result.conflicts.filter(
                        conflict => severityMap[conflict.severity] >= thresholdValue
                    ),
                    // Mettre à jour hasBlockers en fonction des conflits filtrés
                    hasBlockers: options.severityThreshold === ConflictSeverity.BLOQUANT
                        ? result.hasBlockers
                        : result.conflicts.some(c => c.severity === ConflictSeverity.BLOQUANT)
                };
            }

            return result;
        } catch (error: unknown) {
            logger.error('Erreur dans LeaveConflictDetectionService:', { error: error });
            return this.createEmptyResult();
        }
    }

    /**
     * Retourne le nom du service
     * @returns Nom du service
     */
    getServiceName(): string {
        return this.SERVICE_NAME;
    }

    /**
     * Retourne les types de conflits supportés par ce service
     * @returns Types de conflits supportés
     */
    getSupportedConflictTypes(): ConflictType[] {
        return [...this.SUPPORTED_CONFLICT_TYPES];
    }

    /**
     * Crée un résultat vide pour les cas où aucun conflit n'est détecté
     * @returns Résultat vide
     */
    private createEmptyResult(): ConflictCheckResult {
        return {
            hasConflicts: false,
            conflicts: [],
            hasBlockers: false,
            canAutoApprove: true,
            requiresManagerReview: false
        };
    }
}

// Export d'une instance prête à l'emploi
export const leaveConflictDetectionService = new LeaveConflictDetectionService(); 