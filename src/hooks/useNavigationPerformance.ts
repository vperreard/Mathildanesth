'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { usePerformance } from '@/context/PerformanceContext';

/**
 * Hook qui surveille les changements de navigation, y compris les paramètres de recherche,
 * et enregistre les performances de navigation dans le contexte de performance.
 * 
 * Cela permet de capturer plus précisément les navigations, même lorsque seuls 
 * les paramètres d'URL changent mais pas le pathname.
 */
export function useNavigationPerformance() {
    const { recordPageNavigation, recordPageLoad } = usePerformance();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Convertir searchParams en chaîne pour la comparaison
    const searchParamsString = searchParams?.toString() || '';
    const fullPath = `${pathname}${searchParamsString ? `?${searchParamsString}` : ''}`;

    // États pour suivre les navigations
    const [prevFullPath, setPrevFullPath] = useState<string | null>(null);
    const navigationStartTimeRef = useRef<number>(performance.now());
    const isFirstRenderRef = useRef<boolean>(true);

    useEffect(() => {
        // Au premier rendu, enregistrer le temps de chargement initial
        if (isFirstRenderRef.current) {
            recordPageLoad(fullPath, performance.now());
            isFirstRenderRef.current = false;
            setPrevFullPath(fullPath);
            return;
        }

        // Si le chemin complet a changé (pathname ou searchParams)
        if (prevFullPath && fullPath !== prevFullPath) {
            const navigationDuration = performance.now() - navigationStartTimeRef.current;

            // Enregistrer la navigation
            recordPageNavigation(prevFullPath, fullPath, navigationDuration);

            // Enregistrer aussi comme un chargement de page
            recordPageLoad(fullPath, navigationDuration);

            // Mettre à jour pour la prochaine navigation
            setPrevFullPath(fullPath);
        }

        // Réinitialiser le temps de début de navigation pour les futurs changements
        navigationStartTimeRef.current = performance.now();
    }, [pathname, searchParamsString, fullPath, prevFullPath, recordPageNavigation, recordPageLoad]);

    // Pas de valeur de retour nécessaire, le hook s'occupe de tout en interne
    return null;
} 