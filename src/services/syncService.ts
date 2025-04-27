import { Assignment } from '../types/assignment';
import { RulesConfiguration } from '../types/rules';
import { ValidationService } from './ValidationService';
import { PlanningService } from './planningService';
import { Doctor } from '../types/doctor';

interface SyncResult {
    success: boolean;
    message: string;
    violations?: any[];
}

/**
 * Service de synchronisation entre le calendrier drag-and-drop et le calendrier principal
 */
export class SyncService {
    private validationService: ValidationService;
    private doctors: Doctor[] = [];

    constructor(rulesConfig: RulesConfiguration, doctors: Doctor[] = []) {
        this.validationService = new ValidationService(rulesConfig);
        this.doctors = doctors;
    }

    /**
     * Met à jour les docteurs disponibles pour la validation
     */
    setDoctors(doctors: Doctor[]): void {
        this.doctors = doctors;
    }

    /**
     * Synchronise les affectations entre les deux interfaces
     * @param assignments Affectations à synchroniser
     * @returns Résultat de la synchronisation
     */
    async syncAssignments(assignments: Assignment[]): Promise<SyncResult> {
        try {
            // Validation des affectations
            const validationResult = this.validationService.validateAssignments(assignments, this.doctors);

            // Si la validation échoue, retourner les violations
            if (!validationResult.isValid) {
                return {
                    success: false,
                    message: 'Les affectations contiennent des violations de règles',
                    violations: validationResult.violations
                };
            }

            // Sauvegarde des affectations
            const saved = await PlanningService.saveAssignments(assignments);

            if (!saved) {
                return {
                    success: false,
                    message: 'Erreur lors de la sauvegarde des affectations'
                };
            }

            // Enregistrement de l'historique de modification
            this.logSync(assignments);

            return {
                success: true,
                message: 'Synchronisation réussie'
            };
        } catch (error) {
            console.error('Erreur de synchronisation:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Erreur inconnue lors de la synchronisation'
            };
        }
    }

    /**
     * Valide les affectations sans les sauvegarder
     * @param assignments Affectations à valider
     * @returns Résultat de la validation
     */
    validateOnly(assignments: Assignment[]): SyncResult {
        try {
            const validationResult = this.validationService.validateAssignments(assignments, this.doctors);

            return {
                success: validationResult.isValid,
                message: validationResult.isValid
                    ? 'Validation réussie'
                    : 'Les affectations contiennent des violations de règles',
                violations: validationResult.violations
            };
        } catch (error) {
            console.error('Erreur de validation:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Erreur inconnue lors de la validation'
            };
        }
    }

    /**
     * Identifie les modifications entre deux ensembles d'affectations
     * @param original Affectations originales
     * @param updated Affectations mises à jour
     * @returns Liste des modifications
     */
    getDiff(original: Assignment[], updated: Assignment[]): {
        added: Assignment[];
        removed: Assignment[];
        modified: { original: Assignment; updated: Assignment }[];
    } {
        const added: Assignment[] = [];
        const removed: Assignment[] = [];
        const modified: { original: Assignment; updated: Assignment }[] = [];

        // Trouver les ajouts et modifications
        updated.forEach(updatedAssignment => {
            const originalAssignment = original.find(a => a.id === updatedAssignment.id);

            if (!originalAssignment) {
                added.push(updatedAssignment);
            } else if (this.hasChanged(originalAssignment, updatedAssignment)) {
                modified.push({ original: originalAssignment, updated: updatedAssignment });
            }
        });

        // Trouver les suppressions
        original.forEach(originalAssignment => {
            if (!updated.some(a => a.id === originalAssignment.id)) {
                removed.push(originalAssignment);
            }
        });

        return { added, removed, modified };
    }

    /**
     * Détermine si une affectation a changé
     */
    private hasChanged(a: Assignment, b: Assignment): boolean {
        // Convertir les dates en chaînes pour la comparaison
        const dateA = a.date instanceof Date ? a.date.toISOString().split('T')[0] : a.date;
        const dateB = b.date instanceof Date ? b.date.toISOString().split('T')[0] : b.date;

        return (
            dateA !== dateB ||
            a.doctorId !== b.doctorId ||
            a.shiftType !== b.shiftType ||
            a.status !== b.status
        );
    }

    /**
     * Enregistre l'historique des modifications
     */
    private logSync(assignments: Assignment[]): void {
        console.log(`Synchronisation: ${assignments.length} affectations mises à jour à ${new Date().toISOString()}`);
        // Dans une application réelle, on pourrait stocker l'historique en base de données
    }
} 