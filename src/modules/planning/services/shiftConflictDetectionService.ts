import {
    ConflictDetectionService,
    ConflictCheckOptions
} from '@/services/conflictDetection/conflictDetectionFacade';
import { logger } from "../../../lib/logger";
import {
    ConflictCheckResult,
    ConflictType,
    ConflictSeverity,
    LeaveConflict
} from '@/modules/leaves/types/conflict';
import { v4 as uuidv4 } from 'uuid';
import { differenceInHours, addHours } from 'date-fns';

// Interface pour une garde
interface Shift {
    id: string;
    userId: string;
    startDate: Date;
    endDate: Date;
    shiftType: 'DUTY' | 'ON_CALL';
    isActive: boolean;
}

/**
 * Service de détection de conflits spécifique aux gardes et astreintes
 * Implémente l'interface ConflictDetectionService pour s'intégrer à la façade
 */
export class ShiftConflictDetectionService implements ConflictDetectionService {
    private readonly SERVICE_NAME = 'ShiftConflictDetectionService';

    /**
     * Types de conflits gérés par ce service
     */
    private readonly SUPPORTED_CONFLICT_TYPES: ConflictType[] = [
        ConflictType.DUTY_CONFLICT,
        ConflictType.ON_CALL_CONFLICT
    ];

    // Temps de repos minimum obligatoire en heures après une garde
    private readonly MIN_REST_HOURS_AFTER_DUTY = 11;

    /**
     * Vérifie les conflits de gardes sur une période donnée
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
        // Si les conflits de garde ne sont pas inclus dans les options, retourner un résultat vide
        if (options.includeShiftConflicts === false) {
            return this.createEmptyResult();
        }

        // Vérifier que l'ID utilisateur est défini
        if (!options.userId) {
            logger.warn('ShiftConflictDetectionService: userId est requis pour la détection de conflits de gardes');
            return this.createEmptyResult();
        }

        try {
            // Récupérer les gardes et astreintes de l'utilisateur
            const shifts = await this.getUserShifts(options.userId, startDate, endDate);

            // Vérifier la présence de conflits
            const conflicts: LeaveConflict[] = [];
            const hasBlockers = false;

            // Vérifier le chevauchement direct avec des gardes
            const dutyConflicts = this.checkDutyOverlap(startDate, endDate, shifts);
            conflicts.push(...dutyConflicts);

            // Vérifier le temps de repos obligatoire
            const restConflicts = this.checkMinimumRestTime(startDate, endDate, shifts);
            conflicts.push(...restConflicts);

            return {
                hasConflicts: conflicts.length > 0,
                conflicts,
                hasBlockers: conflicts.some(c => c.severity === ConflictSeverity.BLOQUANT),
                canAutoApprove: !conflicts.some(c => c.severity === ConflictSeverity.BLOQUANT),
                requiresManagerReview: conflicts.length > 0
            };
        } catch (error: unknown) {
            logger.error('Erreur dans ShiftConflictDetectionService:', { error: error });
            return this.createEmptyResult();
        }
    }

    /**
     * Récupère les gardes d'un utilisateur dans une période donnée
     * Note: Dans un environnement réel, cette fonction ferait un appel API
     * @param userId ID de l'utilisateur
     * @param startDate Date de début
     * @param endDate Date de fin
     * @returns Liste des gardes
     */
    private async getUserShifts(
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<Shift[]> {
        // Simulation - Dans un environnement réel, récupérer depuis l'API/BDD
        // Exemple de données simulées pour les tests
        const twoWeeksBeforeStart = new Date(startDate);
        twoWeeksBeforeStart.setDate(twoWeeksBeforeStart.getDate() - 14);

        // Gardes précédentes (pour détecter les violations de temps de repos)
        const mockShifts: Shift[] = [
            {
                id: '1',
                userId,
                startDate: new Date(twoWeeksBeforeStart.setDate(twoWeeksBeforeStart.getDate() + 2)),
                endDate: new Date(twoWeeksBeforeStart.setDate(twoWeeksBeforeStart.getDate() + 1)),
                shiftType: 'DUTY',
                isActive: true
            },
            {
                id: '2',
                userId,
                startDate: new Date(startDate.getTime() - 24 * 60 * 60 * 1000), // 1 jour avant
                endDate: new Date(startDate.getTime() - 12 * 60 * 60 * 1000),   // Termine 12h avant
                shiftType: 'DUTY',
                isActive: true
            },
            {
                id: '3',
                userId,
                startDate: new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 jours après le début
                endDate: new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000),   // 3 jours après le début
                shiftType: 'ON_CALL',
                isActive: true
            }
        ];

        // Filtrer les gardes actives
        return mockShifts.filter(shift => shift.isActive);
    }

    /**
     * Vérifie le chevauchement direct avec des gardes
     * @param startDate Date de début du congé
     * @param endDate Date de fin du congé
     * @param shifts Liste des gardes à vérifier
     * @returns Liste des conflits détectés
     */
    private checkDutyOverlap(
        startDate: Date,
        endDate: Date,
        shifts: Shift[]
    ): LeaveConflict[] {
        const conflicts: LeaveConflict[] = [];

        for (const shift of shifts) {
            // Vérifier si la période de congé chevauche la garde
            const isOverlapping = (
                (startDate <= shift.endDate && endDate >= shift.startDate)
            );

            if (isOverlapping) {
                const conflictType = shift.shiftType === 'DUTY'
                    ? ConflictType.DUTY_CONFLICT
                    : ConflictType.ON_CALL_CONFLICT;

                // Définir la sévérité en fonction du type de garde
                const severity = shift.shiftType === 'DUTY'
                    ? ConflictSeverity.BLOQUANT     // Les gardes sont bloquantes
                    : ConflictSeverity.AVERTISSEMENT; // Les astreintes sont des avertissements

                conflicts.push({
                    id: uuidv4(),
                    leaveId: 'temp-' + uuidv4(),  // ID temporaire, sera remplacé
                    type: conflictType,
                    severity,
                    description: shift.shiftType === 'DUTY'
                        ? 'Le congé demandé chevauche une période de garde'
                        : 'Le congé demandé chevauche une période d\'astreinte',
                    startDate: shift.startDate.toISOString(),
                    endDate: shift.endDate.toISOString(),
                    canOverride: shift.shiftType !== 'DUTY', // Les gardes ne peuvent pas être ignorées
                    affectedResources: [`Shift-${shift.id}`]
                });
            }
        }

        return conflicts;
    }

    /**
     * Vérifie le respect du temps de repos minimum après une garde
     * @param startDate Date de début du congé
     * @param endDate Date de fin du congé
     * @param shifts Liste des gardes à vérifier
     * @returns Liste des conflits détectés
     */
    private checkMinimumRestTime(
        startDate: Date,
        endDate: Date,
        shifts: Shift[]
    ): LeaveConflict[] {
        const conflicts: LeaveConflict[] = [];

        for (const shift of shifts) {
            // On ne vérifie que les gardes (pas les astreintes) et qui se terminent avant la période demandée
            if (shift.shiftType !== 'DUTY' || shift.endDate >= startDate) {
                continue;
            }

            // Calculer le temps de repos entre la fin de la garde et le début du congé
            const restHours = differenceInHours(startDate, shift.endDate);

            // Vérifier si le temps de repos est suffisant
            if (restHours < this.MIN_REST_HOURS_AFTER_DUTY) {
                const minimumRestEndTime = addHours(shift.endDate, this.MIN_REST_HOURS_AFTER_DUTY);

                conflicts.push({
                    id: uuidv4(),
                    leaveId: 'temp-' + uuidv4(),  // ID temporaire, sera remplacé
                    type: ConflictType.DUTY_CONFLICT,
                    severity: ConflictSeverity.AVERTISSEMENT,
                    description: `Temps de repos insuffisant après une garde (${restHours}h au lieu de ${this.MIN_REST_HOURS_AFTER_DUTY}h minimum)`,
                    startDate: shift.endDate.toISOString(),
                    endDate: minimumRestEndTime.toISOString(),
                    canOverride: true, // Peut être ignoré par un manager
                    affectedResources: [`Shift-${shift.id}`, 'RestTime']
                });
            }
        }

        return conflicts;
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
export const shiftConflictDetectionService = new ShiftConflictDetectionService(); 