import { useState, useCallback, useRef, useEffect } from 'react';
import { BlocDayPlanning, ValidationResult } from '@/types/bloc-planning-types';
import { blocPlanningService as defaultService } from '@/modules/planning/bloc-operatoire/services/blocPlanningService';

interface PlanningState {
    dayPlanning: BlocDayPlanning | null;
    isLoading: boolean;
    isValidating: boolean;
    isSaving: boolean;
    validationResult: ValidationResult | null;
    error: Error | null;
}

type CancelFunction = () => void;

/**
 * Options pour les appels au service (ex: signal d'annulation)
 */
interface ServiceCallOptions {
    signal?: AbortSignal;
}

/**
 * Type pour l'instance du service, incluant les options
 */
type BlocPlanningServiceInstance = {
    getDayPlanning: (date: string, options?: ServiceCallOptions) => Promise<BlocDayPlanning | null>;
    saveDayPlanning: (planning: BlocDayPlanning, options?: ServiceCallOptions) => Promise<BlocDayPlanning>;
    validateDayPlanning: (planning: BlocDayPlanning, options?: ServiceCallOptions) => Promise<ValidationResult>;
    // Ajouter d'autres méthodes si nécessaire
};

/**
 * Hook personnalisé pour gérer les opérations de planification du bloc opératoire
 * avec gestion des opérations asynchrones (chargement, validation, sauvegarde)
 * et support pour l'annulation des requêtes
 *
 * @param injectedService Instance optionnelle du service pour les tests.
 */
export function useOperatingRoomPlanning(
    injectedService?: BlocPlanningServiceInstance
) {
    // Utiliser le service injecté ou le service par défaut
    const blocPlanningService: BlocPlanningServiceInstance = (injectedService || defaultService) as BlocPlanningServiceInstance;

    // État de la planification
    const [state, setState] = useState<PlanningState>({
        dayPlanning: null,
        isLoading: false,
        isValidating: false,
        isSaving: false,
        validationResult: null,
        error: null
    });

    // Références pour les contrôleurs d'annulation
    const loadController = useRef<AbortController | null>(null);
    const validateController = useRef<AbortController | null>(null);
    const saveController = useRef<AbortController | null>(null);

    // Nettoyer les contrôleurs lors du démontage
    useEffect(() => {
        return () => {
            // Annuler toutes les requêtes en cours lors du démontage
            if (loadController.current) loadController.current.abort();
            if (validateController.current) validateController.current.abort();
            if (saveController.current) saveController.current.abort();
        };
    }, []);

    /**
     * Charger le planning pour une date donnée
     */
    const loadDayPlanning = useCallback(async (date: string): Promise<[BlocDayPlanning | null, CancelFunction]> => {
        // Annuler toute requête de chargement précédente
        if (loadController.current) {
            loadController.current.abort();
        }

        // Créer un nouveau contrôleur
        loadController.current = new AbortController();
        const signal = loadController.current.signal;

        // Préparer la fonction d'annulation
        const cancel = () => {
            if (loadController.current) {
                loadController.current.abort();
            }
        };

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Ajouter un signal d'annulation à la requête
            const dayPlanning = await blocPlanningService.getDayPlanning(date, { signal });

            if (!signal.aborted) {
                setState(prev => ({
                    ...prev,
                    dayPlanning,
                    isLoading: false,
                    validationResult: null // Réinitialiser les résultats de validation
                }));
            }

            return [dayPlanning, cancel];
        } catch (error) {
            if (!signal.aborted) {
                const errorObj = error instanceof Error ? error : new Error('Erreur lors du chargement du planning');
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: errorObj
                }));
            }

            return [null, cancel];
        }
    }, []);

    /**
     * Valider le planning sans le sauvegarder
     */
    const validatePlanning = useCallback(async (planning: BlocDayPlanning): Promise<[ValidationResult | null, CancelFunction]> => {
        // Annuler toute requête de validation précédente
        if (validateController.current) {
            validateController.current.abort();
        }

        // Créer un nouveau contrôleur
        validateController.current = new AbortController();
        const signal = validateController.current.signal;

        // Préparer la fonction d'annulation
        const cancel = () => {
            if (validateController.current) {
                validateController.current.abort();
            }
        };

        setState(prev => ({ ...prev, isValidating: true, error: null }));

        try {
            // Ajouter un signal d'annulation à la requête
            const validationResult = await blocPlanningService.validateDayPlanning(planning, { signal });

            if (!signal.aborted) {
                setState(prev => ({
                    ...prev,
                    validationResult,
                    isValidating: false
                }));
            }

            return [validationResult, cancel];
        } catch (error) {
            if (!signal.aborted) {
                const errorObj = error instanceof Error ? error : new Error('Erreur lors de la validation du planning');
                setState(prev => ({
                    ...prev,
                    isValidating: false,
                    error: errorObj
                }));
            }

            return [null, cancel];
        }
    }, []);

    /**
     * Sauvegarder le planning du jour
     */
    const saveDayPlanning = useCallback(async (planning: BlocDayPlanning, validateBeforeSave: boolean = true): Promise<[BlocDayPlanning | null, CancelFunction]> => {
        // Annuler toute requête de sauvegarde précédente
        if (saveController.current) {
            saveController.current.abort();
        }

        // Créer un nouveau contrôleur
        saveController.current = new AbortController();
        const signal = saveController.current.signal;

        // Préparer la fonction d'annulation
        const cancel = () => {
            if (saveController.current) {
                saveController.current.abort();
            }
        };

        setState(prev => ({ ...prev, isSaving: true, error: null }));

        try {
            let canSave = true;

            // Validation optionnelle avant sauvegarde
            if (validateBeforeSave) {
                const validationResult = await blocPlanningService.validateDayPlanning(planning, { signal });

                if (!signal.aborted) {
                    setState(prev => ({ ...prev, validationResult }));
                    canSave = validationResult.isValid;

                    if (!canSave) {
                        setState(prev => ({
                            ...prev,
                            isSaving: false,
                            error: new Error('Le planning contient des erreurs et ne peut pas être sauvegardé')
                        }));
                        return [null, cancel];
                    }
                }
            }

            if (canSave && !signal.aborted) {
                // Ajouter un signal d'annulation à la requête
                const savedPlanning = await blocPlanningService.saveDayPlanning(planning, { signal });

                if (!signal.aborted) {
                    setState(prev => ({
                        ...prev,
                        dayPlanning: savedPlanning,
                        isSaving: false
                    }));
                }

                return [savedPlanning, cancel];
            }

            return [null, cancel];
        } catch (error) {
            if (!signal.aborted) {
                const errorObj = error instanceof Error ? error : new Error('Erreur lors de la sauvegarde du planning');
                setState(prev => ({
                    ...prev,
                    isSaving: false,
                    error: errorObj
                }));
            }

            return [null, cancel];
        }
    }, []);

    /**
     * Effacer les erreurs
     */
    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    /**
     * Effacer les résultats de validation
     */
    const clearValidationResult = useCallback(() => {
        setState(prev => ({ ...prev, validationResult: null }));
    }, []);

    return {
        ...state,
        loadDayPlanning,
        validatePlanning,
        saveDayPlanning,
        clearError,
        clearValidationResult
    };
} 