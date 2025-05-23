'use client';

import { useNavigationPerformance } from '@/hooks/useNavigationPerformance';
import { useEffect } from 'react';

/**
 * Composant qui suit les performances de l'application
 * Il utilise le hook useNavigationPerformance pour suivre les navigations
 * et également surveille les métriques du cache et des requêtes.
 * 
 * Ce composant doit être utilisé une seule fois dans l'application,
 * idéalement au plus haut niveau du composant racine client.
 */
export function PerformanceTracker() {
    // Utiliser le hook de suivi de navigation
    useNavigationPerformance();

    // Monitoring des erreurs
    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            console.error('[Performance] Erreur détectée:', event.error);
            // On pourrait ajouter ici un enregistrement des erreurs dans le contexte de performance
        };

        window.addEventListener('error', handleError);
        return () => window.removeEventListener('error', handleError);
    }, []);

    // Monitoring des ressources lentes
    useEffect(() => {
        if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        // Filtrer les ressources qui prennent plus de 2 secondes à charger
                        if (entry.duration > 2000) {
                            console.warn(`[Performance] Ressource lente: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
                        }
                    });
                });

                observer.observe({ entryTypes: ['resource'] });
                return () => observer.disconnect();
            } catch (error) {
                console.error('[Performance] Erreur lors de l\'observation des performances:', error);
            }
        }
    }, []);

    // Ce composant n'a pas besoin de rendu
    return null;
} 