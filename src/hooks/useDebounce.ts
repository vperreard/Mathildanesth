import { useState, useEffect } from 'react';

/**
 * Hook pour créer une version debounced d'une valeur.
 * Utile pour limiter le nombre d'appels API lors de l'écriture dans un champ de recherche
 * ou lors de la modification de filtres.
 * 
 * @param value Valeur à debouncer
 * @param delay Délai en millisecondes avant mise à jour
 * @returns Valeur mise à jour après le délai
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Configurer le timer pour mettre à jour la valeur après le délai
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Nettoyer le timer si la valeur change à nouveau avant la fin du délai
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
} 