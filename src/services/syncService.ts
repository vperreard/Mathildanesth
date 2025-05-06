import { Assignment } from '../types/assignment';
import { ValidationResult, Violation, ViolationType } from '../types/validation';

interface SyncResult {
    success: boolean;
    message: string;
    violations?: Violation[];
}

/**
 * Service de synchronisation (côté client) - Appelle les API serveur
 */
export class SyncService {
    // Plus besoin de stocker rulesConfig ou doctors ici, le serveur s'en chargera

    /**
     * Synchronise les affectations en appelant l'API serveur
     * @param assignments Affectations à synchroniser
     * @returns Résultat de la synchronisation
     */
    async syncAssignments(assignments: Assignment[]): Promise<SyncResult> {
        try {
            // Appel à l'API pour sauvegarder (validation incluse côté serveur idéalement)
            // Supposons une route unique /api/assignments pour PATCH/POST qui valide et sauve
            const response = await fetch('/api/assignments', {
                method: 'PATCH', // ou POST
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignments }),
            });

            const responseData = await response.json();

            if (!response.ok) {
                // Si l'API retourne des erreurs de validation ou autres
                return {
                    success: false,
                    message: responseData.error || `Erreur HTTP ${response.status}`,
                    violations: responseData.violations || [],
                };
            }

            // Enregistrement de l'historique de modification (peut se faire côté serveur)
            // this.logSync(assignments);

            return {
                success: true,
                message: responseData.message || 'Synchronisation réussie',
            };
        } catch (error: any) {
            console.error("Erreur lors de l'appel API de synchronisation:", error);
            return {
                success: false,
                message: error.message || 'Erreur réseau ou inconnue lors de la synchronisation',
            };
        }
    }

    /**
     * Valide les affectations sans les sauvegarder (via API)
     * @param assignments Affectations à valider
     * @returns Résultat de la validation
     */
    async validateOnly(assignments: Assignment[]): Promise<ValidationResult> { // Utiliser ValidationResult
        try {
            const response = await fetch('/api/assignments/validate', { // Utiliser l'API de validation dédiée
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignments }),
            });

            const responseData = await response.json();

            if (!response.ok) {
                console.error('Erreur API de validation:', responseData);
                const violations: Violation[] = responseData.violations || [
                    {
                        type: ViolationType.SCHEDULING_CONFLICT,
                        message: `Erreur API ${response.status}: ${responseData.error || 'Erreur inconnue'}`,
                    }
                ];
                return {
                    isValid: false,
                    violations: violations,
                };
            }

            return {
                isValid: responseData.isValid ?? (responseData.violations?.length === 0), // Déduire isValid si non fourni
                violations: responseData.violations || [],
            };
        } catch (error: any) {
            console.error("Erreur lors de l'appel API de validation:", error);
            const violations: Violation[] = [
                {
                    type: ViolationType.SCHEDULING_CONFLICT,
                    message: error.message || 'Erreur réseau ou inconnue lors de la validation',
                }
            ];
            return {
                isValid: false,
                violations: violations,
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
        const originalMap = new Map(original.map(a => [a.id, a]));
        const updatedMap = new Map(updated.map(a => [a.id, a]));

        // Trouver les ajouts et modifications
        updatedMap.forEach((updatedAssignment, id) => {
            const originalAssignment = originalMap.get(id);
            if (!originalAssignment) {
                added.push(updatedAssignment);
            } else if (this.hasChanged(originalAssignment, updatedAssignment)) {
                modified.push({ original: originalAssignment, updated: updatedAssignment });
            }
        });

        // Trouver les suppressions
        originalMap.forEach((originalAssignment, id) => {
            if (!updatedMap.has(id)) {
                removed.push(originalAssignment);
            }
        });

        return { added, removed, modified };
    }

    /**
     * Détermine si une affectation a changé
     */
    private hasChanged(a: Assignment, b: Assignment): boolean {
        // Correction : Utiliser les propriétés startDate/endDate de Assignment
        const dateA = a.startDate instanceof Date ? a.startDate.toISOString().split('T')[0] : undefined;
        const dateB = b.startDate instanceof Date ? b.startDate.toISOString().split('T')[0] : undefined;
        const endDateA = a.endDate instanceof Date ? a.endDate.toISOString().split('T')[0] : undefined;
        const endDateB = b.endDate instanceof Date ? b.endDate.toISOString().split('T')[0] : undefined;

        return (
            dateA !== dateB ||
            endDateA !== endDateB ||
            a.userId !== b.userId ||
            a.shiftType !== b.shiftType ||
            a.status !== b.status ||
            a.notes !== b.notes
        );
    }

    // La méthode logSync n'est plus pertinente côté client
    /*
    private logSync(assignments: Assignment[]): void {
        console.log(`Synchronisation: ${assignments.length} affectations mises à jour à ${new Date().toISOString()}`);
    }
    */
} 