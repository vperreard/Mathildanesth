import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { LeaveFilters } from '../types/leave';

interface DebounceOptions {
    delay?: number;
    immediate?: boolean;
}

/**
 * Hook pour gérer le debounce des filtres de recherche
 * Optimise les performances en évitant de déclencher trop de requêtes lors des modifications rapides de filtres
 * 
 * @param initialFilters Filtres initiaux
 * @param options Options de debounce
 * @returns Les objets et fonctions pour gérer les filtres avec debounce
 */
export function useDebounceFilters(
    initialFilters: LeaveFilters = {},
    options: DebounceOptions = {}
) {
    // Valeurs par défaut
    const { delay = 300, immediate = false } = options;

    // État pour les filtres en cours de saisie (non debounced)
    const [inputFilters, setInputFilters] = useState<LeaveFilters>(initialFilters);

    // État pour les filtres après debounce (qui seront utilisés pour les requêtes)
    const [debouncedFilters, setDebouncedFilters] = useState<LeaveFilters>(initialFilters);

    // Indicateur de chargement pendant le debounce
    const [isDebouncing, setIsDebouncing] = useState<boolean>(false);

    // Fonction debounce pour mettre à jour les filtres
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const applyDebouncedFilters = useCallback(
        debounce((filters: LeaveFilters) => {
            setDebouncedFilters(filters);
            setIsDebouncing(false);
        }, delay),
        [delay]
    );

    // Mise à jour d'un champ de filtre avec debounce
    const updateFilter = useCallback(<K extends keyof LeaveFilters>(
        field: K,
        value: LeaveFilters[K]
    ) => {
        const newFilters = { ...inputFilters, [field]: value };
        setInputFilters(newFilters);
        setIsDebouncing(true);

        if (immediate) {
            // Application immédiate sans debounce
            setDebouncedFilters(newFilters);
            setIsDebouncing(false);
        } else {
            // Application avec debounce
            applyDebouncedFilters(newFilters);
        }
    }, [inputFilters, applyDebouncedFilters, immediate]);

    // Mise à jour de plusieurs filtres à la fois
    const updateFilters = useCallback((newFilters: Partial<LeaveFilters>) => {
        const updatedFilters = { ...inputFilters, ...newFilters };
        setInputFilters(updatedFilters);
        setIsDebouncing(true);

        if (immediate) {
            setDebouncedFilters(updatedFilters);
            setIsDebouncing(false);
        } else {
            applyDebouncedFilters(updatedFilters);
        }
    }, [inputFilters, applyDebouncedFilters, immediate]);

    // Réinitialisation des filtres
    const resetFilters = useCallback(() => {
        setInputFilters(initialFilters);
        setDebouncedFilters(initialFilters);
        setIsDebouncing(false);
        applyDebouncedFilters.cancel();
    }, [initialFilters, applyDebouncedFilters]);

    // Effet pour nettoyer le debounce à la destruction du composant
    useEffect(() => {
        return () => {
            applyDebouncedFilters.cancel();
        };
    }, [applyDebouncedFilters]);

    return {
        // Les filtres en cours de saisie (pour les composants d'interface)
        inputFilters,
        // Les filtres après debounce (pour les requêtes)
        debouncedFilters,
        // Indique si un debounce est en cours
        isDebouncing,
        // Fonctions pour mettre à jour les filtres
        updateFilter,
        updateFilters,
        resetFilters
    };
} 