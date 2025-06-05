import { useState, useEffect } from 'react';
import { logger } from "../lib/logger";
import apiClient from '@/utils/apiClient';

interface Department {
    id: string;
    name: string;
}

/**
 * Hook pour récupérer les départements disponibles dans l'application
 */
export function useDepartments() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchDepartments() {
            try {
                setLoading(true);
                const response = await apiClient.get('/api/departments');
                setDepartments(response.data);
                setError(null);
            } catch (err: any) {
                logger.error('Erreur lors du chargement des départements:', err);
                setError(err instanceof Error ? err : new Error('Erreur lors du chargement des départements'));
                // En cas d'erreur, utiliser des données de fallback pour pouvoir continuer à utiliser l'UI
                setDepartments([
                    { id: 'anesthesie', name: 'Anesthésie' },
                    { id: 'chirurgie', name: 'Chirurgie' },
                    { id: 'reanimation', name: 'Réanimation' },
                    { id: 'urgences', name: 'Urgences' },
                    { id: 'pediatrie', name: 'Pédiatrie' }
                ]);
            } finally {
                setLoading(false);
            }
        }

        fetchDepartments();
    }, []);

    return {
        departments,
        loading,
        error
    };
} 