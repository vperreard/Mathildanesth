import { useRouter, usePathname } from 'next/navigation';
import { useMemo, useCallback } from 'react';
import { getFrenchRoute, getRouteLabel, translateLabel } from '@/config/route-translations';

/**
 * Hook pour gérer la navigation avec les routes traduites
 */
export function useLocalizedRoutes() {
  const router = useRouter();
  const pathname = usePathname();

  // Mémorise la route française actuelle
  const currentFrenchRoute = useMemo(() => {
    return getFrenchRoute(pathname);
  }, [pathname]);

  // Navigation vers une route traduite
  const navigateTo = useCallback((englishOrFrenchRoute: string) => {
    const frenchRoute = getFrenchRoute(englishOrFrenchRoute);
    router.push(frenchRoute);
  }, [router]);

  // Vérifier si on est sur une ancienne route anglaise
  const isOnEnglishRoute = useMemo(() => {
    return pathname !== currentFrenchRoute;
  }, [pathname, currentFrenchRoute]);

  // Obtenir le label traduit pour la route actuelle
  const currentRouteLabel = useMemo(() => {
    return getRouteLabel(pathname, 'fr');
  }, [pathname]);

  // Helper pour créer des liens
  const createLocalizedHref = useCallback((englishOrFrenchRoute: string) => {
    return getFrenchRoute(englishOrFrenchRoute);
  }, []);

  // Helper pour traduire les labels
  const t = useCallback((label: string) => {
    return translateLabel(label);
  }, []);

  return {
    // Route actuelle
    currentRoute: pathname,
    currentFrenchRoute,
    currentRouteLabel,
    isOnEnglishRoute,

    // Navigation
    navigateTo,
    createLocalizedHref,

    // Traduction
    translateLabel: t,
    
    // Utilities
    getFrenchRoute,
    getRouteLabel,
  };
}

// Hook pour vérifier et rediriger automatiquement
export function useAutoRedirectToFrench() {
  const router = useRouter();
  const pathname = usePathname();

  useMemo(() => {
    const frenchRoute = getFrenchRoute(pathname);
    if (pathname !== frenchRoute) {
      // Redirection automatique vers la route française
      router.replace(frenchRoute);
    }
  }, [pathname, router]);
}