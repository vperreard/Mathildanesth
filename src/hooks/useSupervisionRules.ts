import { useState, useEffect, useCallback } from 'react';
import { SupervisionRule, BlocDayPlanning, ValidationResult } from '@/types/bloc-planning-types';
import { blocPlanningService } from '@/services/blocPlanningService';

interface UseSupervisionRulesProps {
    autoFetch?: boolean;
}

interface UseSupervisionRulesReturn {
    rules: SupervisionRule[];
    isLoading: boolean;
    error: string | null;
    fetchRules: () => Promise<void>;
    createRule: (rule: Omit<SupervisionRule, 'id'>) => Promise<SupervisionRule>;
    updateRule: (id: string, rule: Partial<SupervisionRule>) => Promise<SupervisionRule | null>;
    deleteRule: (id: string) => Promise<boolean>;
    validatePlanning: (planning: BlocDayPlanning) => Promise<ValidationResult>;
    activeRules: SupervisionRule[];
    ruleById: (id: string) => SupervisionRule | null;
}

/**
 * Hook pour utiliser les règles de supervision dans les composants React
 * 
 * @param options Options du hook
 * @returns Un objet contenant les règles et les fonctions pour les manipuler
 */
export const useSupervisionRules = (options: UseSupervisionRulesProps = {}): UseSupervisionRulesReturn => {
    const { autoFetch = true } = options;

    const [rules, setRules] = useState<SupervisionRule[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Fonction pour charger les règles
    const fetchRules = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const fetchedRules = blocPlanningService.getAllSupervisionRules();
            setRules(fetchedRules);
        } catch (err) {
            console.error('Erreur lors du chargement des règles de supervision:', err);
            setError('Impossible de charger les règles de supervision.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Charger les règles au montage du composant si autoFetch est true
    useEffect(() => {
        if (autoFetch) {
            fetchRules();
        }
    }, [autoFetch, fetchRules]);

    // Fonction pour créer une règle
    const createRule = useCallback(async (rule: Omit<SupervisionRule, 'id'>): Promise<SupervisionRule> => {
        try {
            const newRule = blocPlanningService.createSupervisionRule(rule);
            setRules(prevRules => [...prevRules, newRule]);
            return newRule;
        } catch (err) {
            console.error('Erreur lors de la création de la règle:', err);
            throw new Error('Impossible de créer la règle.');
        }
    }, []);

    // Fonction pour mettre à jour une règle
    const updateRule = useCallback(async (id: string, rule: Partial<SupervisionRule>): Promise<SupervisionRule | null> => {
        try {
            const updatedRule = blocPlanningService.updateSupervisionRule(id, rule);
            if (updatedRule) {
                setRules(prevRules => prevRules.map(r => r.id === id ? updatedRule : r));
            }
            return updatedRule;
        } catch (err) {
            console.error('Erreur lors de la mise à jour de la règle:', err);
            throw new Error('Impossible de mettre à jour la règle.');
        }
    }, []);

    // Fonction pour supprimer une règle
    const deleteRule = useCallback(async (id: string): Promise<boolean> => {
        try {
            const result = blocPlanningService.deleteSupervisionRule(id);
            if (result) {
                setRules(prevRules => prevRules.filter(r => r.id !== id));
            }
            return result;
        } catch (err) {
            console.error('Erreur lors de la suppression de la règle:', err);
            throw new Error('Impossible de supprimer la règle.');
        }
    }, []);

    // Fonction pour valider un planning selon les règles
    const validatePlanning = useCallback(async (planning: BlocDayPlanning): Promise<ValidationResult> => {
        try {
            return blocPlanningService.validateDayPlanning(planning);
        } catch (err) {
            console.error('Erreur lors de la validation du planning:', err);
            throw new Error('Impossible de valider le planning.');
        }
    }, []);

    // Fonction pour récupérer une règle par son ID
    const ruleById = useCallback((id: string): SupervisionRule | null => {
        return rules.find(r => r.id === id) || null;
    }, [rules]);

    // Calculer les règles actives
    const activeRules = rules.filter(rule => rule.estActif);

    return {
        rules,
        isLoading,
        error,
        fetchRules,
        createRule,
        updateRule,
        deleteRule,
        validatePlanning,
        activeRules,
        ruleById,
    };
}; 