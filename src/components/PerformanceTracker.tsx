'use client';

import { useNavigationPerformance } from '@/hooks/useNavigationPerformance';
import { logger } from "../lib/logger";
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
        // Vérifier si on est côté client
        if (typeof window === 'undefined') return;

        const handleError = (event: ErrorEvent) => {
            // Filtrer les erreurs de toast connues pour éviter de polluer la console
            if (event.error &&
                event.error.message &&
                event.error.message.includes("Cannot set properties of undefined (setting 'removalReason')")) {
                // Erreur connue de react-toastify, on l'ignore
                event.preventDefault();
                return;
            }

            logger.error('[Performance] Erreur détectée:', event.error);
            // On pourrait ajouter ici un enregistrement des erreurs dans le contexte de performance
        };

        const handleKeydown = (event: KeyboardEvent) => {
            // Raccourci Ctrl+Shift+X (ou Cmd+Shift+X sur Mac) pour fermer tous les toasts
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'X') {
                try {
                    // Importer dynamiquement toast pour éviter les erreurs SSR
                    import('react-toastify').then(({ toast }) => {
                        toast.dismiss();
                        logger.info('[Performance] Tous les toasts fermés via raccourci clavier');
                    });

                    // Nettoyer le DOM des toasts orphelins
                    if (typeof document !== 'undefined') {
                        const toastElements = document.querySelectorAll('[class*="Toastify"], [class*="toast"]');
                        toastElements.forEach(el => {
                            try {
                                el.remove();
                            } catch (e: unknown) {
                                // Ignorer les erreurs de suppression
                            }
                        });
                    }

                    event.preventDefault();
                } catch (error: unknown) {
                    logger.error('[Performance] Erreur lors de la fermeture des toasts:', error instanceof Error ? error : new Error(String(error)));
                }
            }
        };

        window.addEventListener('error', handleError);
        window.addEventListener('keydown', handleKeydown);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('keydown', handleKeydown);
        };
    }, []);

    // Monitoring des ressources lentes
    useEffect(() => {
        if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        // Filtrer les ressources qui prennent plus de 3 secondes à charger
                        // Exclure les appels API connus pour être lents (skills, reports, etc.)
                        if (entry.duration > 3000 && !entry.name.includes('/api/skills') && !entry.name.includes('/api/reports')) {
                            // Log désactivé temporairement pour éviter le spam en développement
                            // logger.warn(`[Performance] Ressource lente: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
                        }
                    });
                });

                observer.observe({ entryTypes: ['resource'] });
                return () => observer.disconnect();
            } catch (error: unknown) {
                logger.error('[Performance] Erreur lors de l\'observation des performances:', error instanceof Error ? error : new Error(String(error)));
            }
        }
    }, []);

    // Ce composant n'a pas besoin de rendu
    return null;
} 