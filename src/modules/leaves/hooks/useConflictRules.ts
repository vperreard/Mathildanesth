import { useState, useCallback, useEffect } from 'react';
import { ConflictRules, ConflictType, ConflictSeverity } from '../types/conflict';

export interface UseConflictRulesReturn {
    // État des règles
    rules: ConflictRules | null;
    loading: boolean;
    error: Error | null;

    // Méthodes CRUD
    fetchRules: () => Promise<ConflictRules>;
    updateRules: (rules: ConflictRules) => Promise<ConflictRules>;
    updateRule: <K extends keyof ConflictRules>(key: K, value: ConflictRules[K]) => Promise<ConflictRules>;
    toggleRuleActive: (key: keyof ConflictRules, active: boolean) => Promise<ConflictRules>;

    // Méthodes additionnelles
    resetToDefaults: () => Promise<ConflictRules>;
    validateRules: (rules: ConflictRules) => { isValid: boolean; errors: string[] };
}

/**
 * Hook pour gérer les règles de détection de conflits de congés
 * Fournit les méthodes CRUD pour interagir avec les règles via l'API
 */
export const useConflictRules = (): UseConflictRulesReturn => {
    const [rules, setRules] = useState<ConflictRules | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    // Récupérer les règles depuis l'API
    const fetchRules = useCallback(async (): Promise<ConflictRules> => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:3000/api/admin/conflict-rules');

            if (!response.ok) {
                const errorData = await response.json().catch(() => response.statusText);
                throw new Error(`Erreur HTTP ${response.status}: ${errorData}`);
            }

            const data: ConflictRules = await response.json();
            setRules(data);
            return data;
        } catch (err) {
            const errorObject = err instanceof Error ? err : new Error('Erreur lors de la récupération des règles');
            setError(errorObject);
            throw errorObject;
        } finally {
            setLoading(false);
        }
    }, []);

    // Mettre à jour toutes les règles
    const updateRules = useCallback(async (updatedRules: ConflictRules): Promise<ConflictRules> => {
        setLoading(true);
        setError(null);

        try {
            // Validation avant envoi
            const validation = validateRules(updatedRules);
            if (!validation.isValid) {
                throw new Error(`Validation des règles échouée: ${validation.errors.join(', ')}`);
            }

            const response = await fetch('http://localhost:3000/api/admin/conflict-rules', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedRules),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => response.statusText);
                throw new Error(`Erreur HTTP ${response.status}: ${errorData}`);
            }

            const data: ConflictRules = await response.json();
            setRules(data);
            return data;
        } catch (err) {
            const errorObject = err instanceof Error ? err : new Error('Erreur lors de la mise à jour des règles');
            setError(errorObject);
            throw errorObject;
        } finally {
            setLoading(false);
        }
    }, []);

    // Mettre à jour une seule règle
    const updateRule = useCallback(async <K extends keyof ConflictRules>(
        key: K,
        value: ConflictRules[K]
    ): Promise<ConflictRules> => {
        if (!rules) {
            throw new Error('Aucune règle chargée. Veuillez charger les règles avant de les modifier.');
        }

        const updatedRules = {
            ...rules,
            [key]: value,
        };

        return updateRules(updatedRules);
    }, [rules, updateRules]);

    // Activer/désactiver une règle
    const toggleRuleActive = useCallback(async (
        key: keyof ConflictRules,
        active: boolean
    ): Promise<ConflictRules> => {
        if (!rules || !rules[key]) {
            throw new Error(`Règle '${String(key)}' non trouvée ou règles non chargées.`);
        }

        // Pour les règles booléennes, on peut directement les basculer
        if (typeof rules[key] === 'boolean') {
            return updateRule(key, active as any);
        }

        // Pour les règles plus complexes (objets), on peut gérer une propriété isActive
        const ruleValue = rules[key];
        if (typeof ruleValue === 'object' && ruleValue !== null) {
            const updatedValue = {
                ...ruleValue,
                isActive: active,
            };

            return updateRule(key, updatedValue as ConflictRules[typeof key]);
        }

        throw new Error(`La règle '${String(key)}' ne peut pas être activée/désactivée.`);
    }, [rules, updateRule]);

    // Réinitialiser aux valeurs par défaut
    const resetToDefaults = useCallback(async (): Promise<ConflictRules> => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:3000/api/admin/conflict-rules/reset', {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => response.statusText);
                throw new Error(`Erreur HTTP ${response.status}: ${errorData}`);
            }

            const data: ConflictRules = await response.json();
            setRules(data);
            return data;
        } catch (err) {
            const errorObject = err instanceof Error ? err : new Error('Erreur lors de la réinitialisation des règles');
            setError(errorObject);
            throw errorObject;
        } finally {
            setLoading(false);
        }
    }, []);

    // Valider les règles pour la cohérence
    const validateRules = useCallback((rulesToValidate: ConflictRules): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];

        // Vérification des règles relatives à l'équipe
        if (rulesToValidate.maxTeamAbsencePercentage !== undefined) {
            if (rulesToValidate.maxTeamAbsencePercentage < 0 || rulesToValidate.maxTeamAbsencePercentage > 100) {
                errors.push('Le pourcentage maximum d\'absences doit être entre 0 et 100');
            }
        }

        // Vérification des capacités minimales
        if (rulesToValidate.teamMinCapacity) {
            for (const [team, capacity] of Object.entries(rulesToValidate.teamMinCapacity)) {
                if (capacity < 0 || capacity > 100) {
                    errors.push(`La capacité minimale de l'équipe ${team} doit être entre 0 et 100%`);
                }
            }
        }

        if (rulesToValidate.specialtyMinCapacity) {
            for (const [specialty, capacity] of Object.entries(rulesToValidate.specialtyMinCapacity)) {
                if (capacity < 0 || capacity > 100) {
                    errors.push(`La capacité minimale de la spécialité ${specialty} doit être entre 0 et 100%`);
                }
            }
        }

        // Vérification des périodes spéciales
        if (rulesToValidate.highWorkloadPeriods) {
            for (const period of rulesToValidate.highWorkloadPeriods) {
                if (!period.startDate || !period.endDate) {
                    errors.push('Les périodes de haute charge doivent avoir une date de début et de fin');
                } else if (new Date(period.startDate) > new Date(period.endDate)) {
                    errors.push('La date de début doit être antérieure à la date de fin pour les périodes de haute charge');
                }
            }
        }

        if (rulesToValidate.specialPeriods) {
            for (const period of rulesToValidate.specialPeriods) {
                if (!period.startDate || !period.endDate) {
                    errors.push('Les périodes spéciales doivent avoir une date de début et de fin');
                } else if (new Date(period.startDate) > new Date(period.endDate)) {
                    errors.push('La date de début doit être antérieure à la date de fin pour les périodes spéciales');
                }
            }
        }

        // Vérification des jours minimums
        if (rulesToValidate.minDaysBeforeDeadline !== undefined && rulesToValidate.minDaysBeforeDeadline < 0) {
            errors.push('Le nombre minimum de jours avant une deadline doit être positif');
        }

        if (rulesToValidate.minDaysBetweenLeaves !== undefined && rulesToValidate.minDaysBetweenLeaves < 0) {
            errors.push('Le nombre minimum de jours entre deux congés doit être positif');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }, []);

    // Charger les règles au montage du composant
    useEffect(() => {
        fetchRules().catch(error => {
            console.error('Erreur lors du chargement initial des règles:', error);
        });
    }, [fetchRules]);

    return {
        rules,
        loading,
        error,
        fetchRules,
        updateRules,
        updateRule,
        toggleRuleActive,
        resetToDefaults,
        validateRules,
    };
}; 