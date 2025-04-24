import { useState, useEffect, useCallback } from 'react';
import {
    AnyRule,
    RuleType,
    RulePriority
} from '../types/rule';
import {
    fetchRules,
    fetchRuleById,
    saveRule as apiSaveRule,
    deleteRule as apiDeleteRule,
    toggleRuleStatus,
    checkRuleConflicts as apiCheckRuleConflicts
} from '../services/ruleService';

interface UseRuleProps {
    initialRule?: Partial<AnyRule>;
    autoFetch?: boolean;
}

interface ConflictResult {
    hasConflicts: boolean;
    conflicts: {
        ruleId: string;
        ruleName: string;
        conflictDescription: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH';
    }[];
}

interface UseRuleReturn {
    rule: Partial<AnyRule> | null;
    rules: AnyRule[];
    loading: boolean;
    error: Error | null;
    conflicts: ConflictResult | null;
    setRule: (rule: Partial<AnyRule> | null) => void;
    updateRuleField: <K extends keyof AnyRule>(field: K, value: AnyRule[K]) => void;
    saveRule: () => Promise<AnyRule>;
    deleteRule: (ruleId: string) => Promise<void>;
    toggleStatus: (ruleId: string, isActive: boolean) => Promise<AnyRule>;
    checkConflicts: () => Promise<void>;
    fetchRules: (filters?: {
        type?: RuleType | RuleType[];
        priority?: RulePriority | RulePriority[];
        isActive?: boolean;
        search?: string;
    }) => Promise<void>;
    fetchRuleDetails: (ruleId: string) => Promise<void>;
    createNewRule: (type: RuleType) => void;
}

export const useRule = ({
    initialRule,
    autoFetch = true
}: UseRuleProps = {}): UseRuleReturn => {
    // État pour la règle en cours d'édition
    const [rule, setRule] = useState<Partial<AnyRule> | null>(initialRule || null);

    // État pour la liste des règles
    const [rules, setRules] = useState<AnyRule[]>([]);

    // États pour le chargement et les erreurs
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    // État pour les conflits détectés
    const [conflicts, setConflicts] = useState<ConflictResult | null>(null);

    // Charger toutes les règles avec des filtres optionnels
    const loadRules = useCallback(async (filters?: {
        type?: RuleType | RuleType[];
        priority?: RulePriority | RulePriority[];
        isActive?: boolean;
        search?: string;
    }): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            const fetchedRules = await fetchRules(filters);
            setRules(fetchedRules);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur inconnue lors du chargement des règles'));
            console.error('Erreur dans loadRules:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Charger les détails d'une règle par son ID
    const fetchRuleDetails = useCallback(async (ruleId: string): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            const fetchedRule = await fetchRuleById(ruleId);
            setRule(fetchedRule);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(`Erreur inconnue lors du chargement de la règle ${ruleId}`));
            console.error(`Erreur dans fetchRuleDetails pour l'ID ${ruleId}:`, err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Mettre à jour un champ spécifique de la règle en cours d'édition
    const updateRuleField = useCallback(<K extends keyof AnyRule>(
        field: K,
        value: AnyRule[K]
    ): void => {
        setRule(prev => {
            if (!prev) return prev;
            return { ...prev, [field]: value };
        });
    }, []);

    // Créer une nouvelle règle d'un type spécifique
    const createNewRule = useCallback((type: RuleType): void => {
        // Créer une règle avec des valeurs par défaut selon le type
        const newRule: Partial<AnyRule> = {
            name: '',
            description: '',
            type,
            priority: RulePriority.MEDIUM,
            isActive: false,
            validFrom: new Date(),
            createdBy: '', // À remplacer par l'ID de l'utilisateur connecté
        };

        // Ajouter la configuration spécifique au type
        switch (type) {
            case RuleType.DUTY:
                (newRule as any).dutyConfig = {
                    minPersonnel: 1,
                    maxConsecutiveDays: 2,
                    minRestPeriodAfterDuty: 24,
                    dutyPeriods: []
                };
                break;

            case RuleType.CONSULTATION:
                (newRule as any).consultationConfig = {
                    locations: [],
                    specialties: [],
                    durationMinutes: 30,
                    maxPatientsPerDay: 20,
                    availablePeriods: []
                };
                break;

            case RuleType.PLANNING:
                (newRule as any).planningConfig = {
                    planningCycle: 'WEEKLY',
                    advanceNoticeDays: 14,
                    freezePeriodDays: 7,
                    minPersonnelPerShift: 2,
                    personnelDistributionRules: [],
                    autoRebalance: false
                };
                break;

            case RuleType.SUPERVISION:
                (newRule as any).supervisionConfig = {
                    supervisorRoles: [],
                    superviseeRoles: [],
                    maxSuperviseesPerSupervisor: 3,
                    minExperienceYearsToSupervise: 5
                };
                break;

            case RuleType.LOCATION:
                (newRule as any).locationConfig = {
                    location: {
                        id: '',
                        name: '',
                        type: 'OPERATING_ROOM',
                        capacity: 1
                    },
                    constraints: {
                        minStaffing: {
                            doctors: 1,
                            nurses: 1
                        },
                        operatingHours: []
                    }
                };
                break;
        }

        setRule(newRule);
    }, []);

    // Enregistrer la règle en cours d'édition
    const saveCurrentRule = useCallback(async (): Promise<AnyRule> => {
        if (!rule) {
            throw new Error('Aucune règle à enregistrer');
        }

        setLoading(true);
        setError(null);

        try {
            const savedRule = await apiSaveRule(rule);

            // Mettre à jour la liste des règles
            setRules(prev => {
                const existingIndex = prev.findIndex(r => r.id === savedRule.id);
                if (existingIndex >= 0) {
                    return [
                        ...prev.slice(0, existingIndex),
                        savedRule,
                        ...prev.slice(existingIndex + 1)
                    ];
                } else {
                    return [...prev, savedRule];
                }
            });

            // Mettre à jour la règle en cours d'édition
            setRule(savedRule);

            return savedRule;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors de l\'enregistrement de la règle'));
            console.error('Erreur dans saveCurrentRule:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [rule]);

    // Supprimer une règle
    const removeRule = useCallback(async (ruleId: string): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            await apiDeleteRule(ruleId);

            // Mettre à jour la liste des règles
            setRules(prev => prev.filter(r => r.id !== ruleId));

            // Si la règle supprimée est la règle en cours d'édition, la réinitialiser
            if (rule && rule.id === ruleId) {
                setRule(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error(`Erreur lors de la suppression de la règle ${ruleId}`));
            console.error(`Erreur dans removeRule pour l'ID ${ruleId}:`, err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [rule]);

    // Activer/désactiver une règle
    const toggleRuleActiveStatus = useCallback(async (
        ruleId: string,
        isActive: boolean
    ): Promise<AnyRule> => {
        setLoading(true);
        setError(null);

        try {
            const updatedRule = await toggleRuleStatus(ruleId, isActive);

            // Mettre à jour la liste des règles
            setRules(prev => {
                const existingIndex = prev.findIndex(r => r.id === updatedRule.id);
                if (existingIndex >= 0) {
                    return [
                        ...prev.slice(0, existingIndex),
                        updatedRule,
                        ...prev.slice(existingIndex + 1)
                    ];
                }
                return prev;
            });

            // Si la règle modifiée est la règle en cours d'édition, la mettre à jour
            if (rule && rule.id === ruleId) {
                setRule(updatedRule);
            }

            return updatedRule;
        } catch (err) {
            setError(err instanceof Error ? err : new Error(`Erreur lors du changement de statut de la règle ${ruleId}`));
            console.error(`Erreur dans toggleRuleActiveStatus pour l'ID ${ruleId}:`, err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [rule]);

    // Vérifier les conflits pour la règle en cours d'édition
    const checkRuleConflicts = useCallback(async (): Promise<void> => {
        if (!rule) {
            setConflicts(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const conflictResult = await apiCheckRuleConflicts(rule);
            setConflicts(conflictResult);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erreur lors de la vérification des conflits'));
            console.error('Erreur dans checkRuleConflicts:', err);
        } finally {
            setLoading(false);
        }
    }, [rule]);

    // Charger toutes les règles au chargement du composant si autoFetch est true
    useEffect(() => {
        if (autoFetch) {
            loadRules();
        }
    }, [autoFetch, loadRules]);

    return {
        rule,
        rules,
        loading,
        error,
        conflicts,
        setRule,
        updateRuleField,
        saveRule: saveCurrentRule,
        deleteRule: removeRule,
        toggleStatus: toggleRuleActiveStatus,
        checkConflicts: checkRuleConflicts,
        fetchRules: loadRules,
        fetchRuleDetails,
        createNewRule
    };
}; 