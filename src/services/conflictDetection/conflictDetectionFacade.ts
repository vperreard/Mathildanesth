import { ConflictCheckResult, ConflictType, ConflictSeverity, LeaveConflict } from '@/modules/leaves/types/conflict';
import { logger } from "../../lib/logger";
import { checkLeaveConflicts } from '@/modules/leaves/services/leaveService';
import { User } from '@/types/user';
import {
    conflictEventBus,
    ConflictEventType
} from './eventBus';

// Type pour les options de vérification de conflits
export interface ConflictCheckOptions {
    includeLeaveConflicts?: boolean;
    includeShiftConflicts?: boolean;
    includeMeetingConflicts?: boolean;
    includeDeadlineConflicts?: boolean;
    checkCriticalRoles?: boolean;
    userId?: string;
    teamId?: string;
    severityThreshold?: ConflictSeverity;
    context?: Record<string, unknown>;
}

// Résultat global de détection de conflits
export interface GlobalConflictCheckResult {
    hasConflicts: boolean;
    conflicts: LeaveConflict[];
    hasBlockers: boolean;
    canAutoApprove: boolean;
    requiresManagerReview: boolean;
    conflictsByType: Record<ConflictType, LeaveConflict[]>;
    metadata: {
        sources: string[];
        executionTime: number;
        conflictCounts: {
            total: number;
            byType: Record<ConflictType, number>;
            bySeverity: Record<ConflictSeverity, number>;
        };
    };
}

// Interface pour les services de détection de conflits
export interface ConflictDetectionService {
    checkConflicts(
        startDate: Date,
        endDate: Date,
        options: ConflictCheckOptions
    ): Promise<ConflictCheckResult>;

    getServiceName(): string;

    getSupportedConflictTypes(): ConflictType[];
}

/**
 * Façade pour la détection de conflits
 * Centralise la vérification des conflits à travers différents modules (congés, planning, etc.)
 */
export class ConflictDetectionFacade {
    private detectionServices: ConflictDetectionService[] = [];

    /**
     * Enregistre un service de détection de conflits
     * @param service Service à enregistrer
     */
    registerDetectionService(service: ConflictDetectionService): void {
        this.detectionServices.push(service);

        // Émettre un événement pour notifier de l'enregistrement d'un nouveau service
        conflictEventBus.emit({
            type: ConflictEventType.CONFLICT_RULES_UPDATED,
            timestamp: new Date(),
            source: 'ConflictDetectionFacade',
            updatedBy: 'system',
            changedRules: [`ServiceRegistered: ${service.getServiceName()}`]
        });
    }

    /**
     * Vérifie les conflits sur une période donnée à travers tous les services enregistrés
     * @param startDate Date de début
     * @param endDate Date de fin
     * @param options Options de vérification
     * @returns Résultat global avec tous les conflits détectés
     */
    async checkConflicts(
        startDate: Date,
        endDate: Date,
        options: ConflictCheckOptions = {}
    ): Promise<GlobalConflictCheckResult> {
        const startTime = Date.now();
        const sources: string[] = [];
        const allConflicts: LeaveConflict[] = [];
        const conflictsByType: Record<ConflictType, LeaveConflict[]> = {} as Record<ConflictType, LeaveConflict[]>;
        const conflictCountsByType: Record<ConflictType, number> = {} as Record<ConflictType, number>;
        const conflictCountsBySeverity: Record<ConflictSeverity, number> = {
            [ConflictSeverity.INFORMATION]: 0,
            [ConflictSeverity.AVERTISSEMENT]: 0,
            [ConflictSeverity.BLOQUANT]: 0
        };

        // Émettre un événement de début de vérification
        conflictEventBus.emit({
            type: ConflictEventType.CONFLICT_CHECK_REQUESTED,
            timestamp: new Date(),
            source: 'ConflictDetectionFacade',
            userId: options.userId || 'unknown',
            startDate,
            endDate,
            requestedBy: options.context?.requestedBy || 'system',
            context: options.context
        });

        // Exécuter tous les services de détection applicables
        const results = await Promise.all(
            this.detectionServices.map(async (service) => {
                try {
                    const result = await service.checkConflicts(startDate, endDate, options);
                    sources.push(service.getServiceName());
                    return result;
                } catch (error: unknown) {
                    logger.error(`Erreur dans le service ${service.getServiceName()}:`, { error: error });
                    return null;
                }
            })
        );

        // Agréger tous les résultats
        let hasBlockers = false;
        for (const result of results.filter(Boolean)) {
            if (!result) continue;

            // Ajouter les conflits au tableau global
            if (result.conflicts && result.conflicts.length > 0) {
                allConflicts.push(...result.conflicts);

                // Classifier par type
                for (const conflict of result.conflicts) {
                    if (!conflictsByType[conflict.type]) {
                        conflictsByType[conflict.type] = [];
                        conflictCountsByType[conflict.type] = 0;
                    }

                    conflictsByType[conflict.type].push(conflict);
                    conflictCountsByType[conflict.type]++;

                    // Compter par sévérité
                    conflictCountsBySeverity[conflict.severity]++;

                    // Vérifier s'il y a des bloqueurs
                    if (conflict.severity === ConflictSeverity.BLOQUANT) {
                        hasBlockers = true;
                    }

                    // Émettre un événement pour chaque conflit détecté
                    conflictEventBus.emit({
                        type: ConflictEventType.CONFLICT_DETECTED,
                        timestamp: new Date(),
                        source: 'ConflictDetectionFacade',
                        conflict,
                        userId: options.userId || 'unknown',
                        conflictType: conflict.type,
                        severity: conflict.severity
                    });
                }
            }

            // Mettre à jour le statut des bloqueurs
            if (result.hasBlockers) {
                hasBlockers = true;
            }
        }

        // Déterminer si la validation automatique est possible
        const canAutoApprove = !hasBlockers;

        // Déterminer si la revue par un manager est nécessaire
        const requiresManagerReview = hasBlockers ||
            allConflicts.some(c => c.severity === ConflictSeverity.AVERTISSEMENT);

        // Calculer les métadonnées
        const endTime = Date.now();
        const executionTime = endTime - startTime;

        // Construire le résultat final
        const finalResult: GlobalConflictCheckResult = {
            hasConflicts: allConflicts.length > 0,
            conflicts: allConflicts,
            hasBlockers,
            canAutoApprove,
            requiresManagerReview,
            conflictsByType,
            metadata: {
                sources,
                executionTime,
                conflictCounts: {
                    total: allConflicts.length,
                    byType: conflictCountsByType,
                    bySeverity: conflictCountsBySeverity
                }
            }
        };

        // Émettre un événement de fin de vérification
        conflictEventBus.emit({
            type: ConflictEventType.CONFLICT_CHECK_COMPLETED,
            timestamp: new Date(),
            source: 'ConflictDetectionFacade',
            userId: options.userId || 'unknown',
            startDate,
            endDate,
            hasConflicts: finalResult.hasConflicts,
            conflictCount: allConflicts.length,
            hasBlockers,
            executionTimeMs: executionTime,
            sources
        });

        return finalResult;
    }

    /**
     * Récupère la liste des types de conflits supportés par les services enregistrés
     * @returns Liste des types de conflits supportés
     */
    getSupportedConflictTypes(): ConflictType[] {
        const types = new Set<ConflictType>();

        for (const service of this.detectionServices) {
            for (const type of service.getSupportedConflictTypes()) {
                types.add(type);
            }
        }

        return Array.from(types);
    }

    /**
     * Vérifie si un service spécifique est disponible pour un type de conflit donné
     * @param conflictType Type de conflit à vérifier
     * @returns Vrai si un service est disponible pour ce type
     */
    hasServiceForConflictType(conflictType: ConflictType): boolean {
        return this.detectionServices.some(
            service => service.getSupportedConflictTypes().includes(conflictType)
        );
    }

    /**
     * Récupère tous les services enregistrés
     * @returns Liste des services de détection
     */
    getRegisteredServices(): ConflictDetectionService[] {
        return [...this.detectionServices];
    }

    /**
     * Réinitialise tous les services de détection
     * @returns Promise résolue lorsque tous les services sont réinitialisés
     */
    async resetAllServices(): Promise<void> {
        // Dans un contexte réel, on pourrait avoir une méthode reset() sur chaque service
        // Pour l'instant, nous ne faisons qu'émettre un événement

        conflictEventBus.emit({
            type: ConflictEventType.CONFLICT_RULES_UPDATED,
            timestamp: new Date(),
            source: 'ConflictDetectionFacade',
            updatedBy: 'system',
            changedRules: ['AllServicesReset']
        });
    }
}

// Instance singleton exportée pour être utilisée dans toute l'application
export const conflictDetectionFacade = new ConflictDetectionFacade(); 