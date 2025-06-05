import { useState, useEffect, useCallback } from 'react';
import { logger } from "../../../lib/logger";
import { Rule } from '../types/rule';
import { RuleService } from '../services/ruleService';
import { useToast } from '@/components/ui/use-toast';
// Supprimer imports problématiques
// import { RulePriority } from '../../dynamicRules/types/rule';
// import {
//     fetchRules,
//     fetchRuleById,
//     saveRule as apiSaveRule,
//     deleteRule as apiDeleteRule,
//     toggleRuleStatus,
//     checkRuleConflicts as apiCheckRuleConflicts
// } from '../services/ruleService';

/**
 * Hook personnalisé pour la gestion des règles
 */
export const useRule = ({
    initialRule,
}: { initialRule?: string } = {}): {
    rules: Rule[];
    selectedRule: Rule | null;
    loading: boolean;
    error: string | null;
    loadRules: (filters?: Record<string, unknown>) => Promise<void>;
    fetchRuleDetails: (ruleId: string) => Promise<void>;
    saveRule: () => Promise<Rule | undefined>;
    deleteRule: (ruleId: string) => Promise<void>;
    toggleStatus: (ruleId: string, isActive: boolean) => Promise<Rule | undefined>;
    checkConflicts: () => Promise<void>;
} => {
    const [rules, setRules] = useState<Rule[]>([]);
    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    // Charger toutes les règles
    const loadRules = useCallback(async (filters?: Record<string, unknown>): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            // Simuler un filtre si nécessaire ou appeler getAllRules et filtrer côté client
            const fetchedRules = await RuleService.getAllRules();
            // Appliquer les filtres ici si besoin
            setRules(fetchedRules);
        } catch (err: unknown) {
            setError('Erreur lors du chargement des règles');
            toast({ title: 'Erreur', description: 'Impossible de charger les règles.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Charger détails règle
    const fetchRuleDetails = useCallback(async (ruleId: string): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const fetchedRule = await RuleService.getRuleById(ruleId);
            setSelectedRule(fetchedRule);
        } catch (err: unknown) {
            setError('Erreur lors du chargement de la règle');
            toast({ title: 'Erreur', description: 'Impossible de charger la règle spécifiée.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Enregistrer règle
    const saveCurrentRule = useCallback(async (): Promise<Rule | undefined> => {
        if (!selectedRule) throw new Error('Aucune règle à enregistrer');
        setLoading(true);
        setError(null);
        try {
            let savedRule: Rule | undefined;
            if (selectedRule.id) {
                savedRule = await RuleService.updateRule(selectedRule as Rule);
            } else {
                // Créer une structure de règle valide pour la création
                const newRuleData: Rule = {
                    ...selectedRule,
                    id: selectedRule?.id || '',
                    priority: selectedRule?.priority || 50,
                    scope: selectedRule?.scope || 'GLOBAL',
                    configuration: selectedRule?.configuration || {},
                    parameters: selectedRule?.parameters || {},
                    severity: selectedRule?.severity || 'WARNING',
                    enabled: selectedRule?.enabled ?? true,
                    createdAt: selectedRule?.createdAt || new Date(),
                    updatedAt: new Date(),
                };
                savedRule = await RuleService.createRule(newRuleData);
            }
            await loadRules();
            setSelectedRule(savedRule || null);
            return savedRule;
        } catch (err: unknown) {
            setError("Erreur lors de l\'enregistrement de la règle");
            toast({
                title: 'Erreur', description: err.message || "Impossible d'enregistrer la règle.", variant: 'destructive'
            });
            throw err;
        } finally {
            setLoading(false);
        }
    }, [selectedRule, loadRules, toast]);

    // Supprimer règle
    const removeRule = useCallback(async (ruleId: string): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            await RuleService.deleteRule(ruleId);
            await loadRules();
            if (selectedRule?.id === ruleId) setSelectedRule(null);
        } catch (err: unknown) {
            setError('Erreur lors de la suppression de la règle');
            toast({ title: 'Erreur', description: 'Impossible de supprimer la règle.', variant: 'destructive' });
            throw err;
        } finally {
            setLoading(false);
        }
    }, [selectedRule, loadRules, toast]);

    // Toggle statut
    const toggleRuleActiveStatus = useCallback(async (ruleId: string, isActive: boolean): Promise<Rule | undefined> => {
        setLoading(true);
        setError(null);
        try {
            const currentRule = await RuleService.getRuleById(ruleId);
            if (!currentRule) throw new Error('Règle non trouvée');
            const updatedRule = await RuleService.updateRule({ ...currentRule, enabled: isActive });
            await loadRules();
            if (selectedRule?.id === ruleId) setSelectedRule(updatedRule || null);
            return updatedRule;
        } catch (err: unknown) {
            setError("Erreur lors du changement de statut de la règle");
            toast({ title: 'Erreur', description: "Impossible de modifier le statut de la règle.", variant: 'destructive' });
            throw err;
        } finally {
            setLoading(false);
        }
    }, [selectedRule, loadRules, toast]);

    // Vérifier conflits (non implémenté)
    const checkRuleConflicts = useCallback(async (): Promise<void> => {
        logger.warn('checkRuleConflicts non implémenté dans RuleService');
    }, []);

    // Charger les règles initialement si aucun ID n'est fourni
    useEffect(() => {
        if (!initialRule) {
            loadRules();
        }
    }, [initialRule, loadRules]);

    // Charger la règle spécifique si un ID est fourni
    useEffect(() => {
        if (initialRule) {
            fetchRuleDetails(initialRule);
        }
    }, [initialRule, fetchRuleDetails]);

    return {
        rules,
        selectedRule,
        loading,
        error,
        loadRules,
        fetchRuleDetails,
        saveRule: saveCurrentRule,
        deleteRule: removeRule,
        toggleStatus: toggleRuleActiveStatus,
        checkConflicts: checkRuleConflicts,
    };
}; 