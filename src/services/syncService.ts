import { Attribution } from '../types/attribution';
import { logger } from "../lib/logger";
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
     * Synchronise les gardes/vacations en appelant l'API serveur
     * @param attributions Gardes/Vacations à synchroniser
     * @returns Résultat de la synchronisation
     */
    async syncAssignments(attributions: Attribution[]): Promise<SyncResult> {
        try {
            // Appel à l'API pour sauvegarder (validation incluse côté serveur idéalement)
            // Supposons une route unique /api/gardes/vacations pour PATCH/POST qui valide et sauve
            const response = await fetch('http://localhost:3000/api/gardes/vacations', {
                method: 'PATCH', // ou POST
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attributions }),
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
            // this.logSync(attributions);

            return {
                success: true,
                message: responseData.message || 'Synchronisation réussie',
            };
        } catch (error: unknown) {
            logger.error("Erreur lors de l'appel API de synchronisation:", error instanceof Error ? error : new Error(String(error)));
            return {
                success: false,
                message: error.message || 'Erreur réseau ou inconnue lors de la synchronisation',
            };
        }
    }

    /**
     * Valide les gardes/vacations sans les sauvegarder (via API)
     * @param attributions Gardes/Vacations à valider
     * @returns Résultat de la validation
     */
    async validateOnly(attributions: Attribution[]): Promise<ValidationResult> { // Utiliser ValidationResult
        try {
            const response = await fetch('http://localhost:3000/api/gardes/vacations/validate', { // Utiliser l'API de validation dédiée
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attributions }),
            });

            const responseData = await response.json();

            if (!response.ok) {
                logger.error('Erreur API de validation:', responseData);
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
        } catch (error: unknown) {
            logger.error("Erreur lors de l'appel API de validation:", error instanceof Error ? error : new Error(String(error)));
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
     * Identifie les modifications entre deux ensembles d'gardes/vacations
     * @param original Gardes/Vacations originales
     * @param updated Gardes/Vacations mises à jour
     * @returns Liste des modifications
     */
    getDiff(original: Attribution[], updated: Attribution[]): {
        added: Attribution[];
        removed: Attribution[];
        modified: { original: Attribution; updated: Attribution }[];
    } {
        const added: Attribution[] = [];
        const removed: Attribution[] = [];
        const modified: { original: Attribution; updated: Attribution }[] = [];
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
     * Détermine si une garde/vacation a changé
     */
    private hasChanged(a: Attribution, b: Attribution): boolean {
        // Correction : Utiliser les propriétés startDate/endDate de Attribution
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
    private logSync(attributions: Attribution[]): void {
        logger.info(`Synchronisation: ${attributions.length} gardes/vacations mises à jour à ${new Date().toISOString()}`);
    }
    */
} 