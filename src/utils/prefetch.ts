/**
 * Utilitaires pour précharger les données et améliorer la réactivité de l'application
 */

import { getClientAuthToken } from '@/lib/auth-client-utils';

// Fonction pour précharger les données depuis une API
export async function prefetchData<T>(url: string): Promise<T | null> {
    try {
        const token = getClientAuthToken();
        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        };

        // Ajouter le token d'authentification si disponible
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            headers,
            next: { revalidate: 60 } // Revalider après 60 secondes
        });

        if (!response.ok) {
            // Si c'est une erreur 404, on retourne null au lieu de throw
            if (response.status === 404) {
                console.log(`Ressource non trouvée pour ${url}, ignorée`);
                return null;
            }
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error(`Erreur de préchargement pour ${url}:`, error);
        // Ne pas propager l'erreur pour éviter de casser le préchargement
        return null;
    }
}

// Précharger les données couramment utilisées
export function prefetchCommonData() {
    const token = getClientAuthToken();

    // Ne faire le prefetch que si l'utilisateur est authentifié
    if (!token) {
        console.log('Aucun token disponible, préchargement ignoré');
        return;
    }

    // On utilise Promise.allSettled pour ne pas bloquer si une requête échoue
    Promise.allSettled([
        prefetchData('/api/utilisateurs'),
        prefetchData('/api/skills'),
        // TODO: Réactiver quand ces routes seront implémentées
        // prefetchData('/api/conges/types'),
        // prefetchData('/api/notifications/preferences')
    ]).then(results => {
        // Journaliser les succès et échecs pour le débogage
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.warn(`Préchargement #${index} échoué:`, result.reason);
            }
        });
    });
}

// Fonction pour précharger des routes (pages) spécifiques
export function prefetchRoutes(routes: string[]) {
    const token = getClientAuthToken();

    routes.forEach(route => {
        // Précharger la route en utilisant l'API fetch avec auth
        try {
            const headers: HeadersInit = {};
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            // Utilisation de fetchApi pour éviter les erreurs de préchargement
            fetch(route, {
                headers,
                priority: 'low'
            }).catch(() => { });
        } catch (error) {
            // Ignorer les erreurs de préchargement
        }
    });
}

// Précharger l'ensemble des routes principales
export function prefetchMainRoutes() {
    prefetchRoutes([
        '/utilisateurs',
        '/calendrier',
        '/planning/hebdomadaire',
        '/conges',
        '/parametres'
    ]);
}

// Précharger les données liées à un utilisateur spécifique
export function prefetchUserData(userId: string) {
    if (!userId) return;

    const token = getClientAuthToken();
    if (!token) {
        console.log('Aucun token disponible, préchargement utilisateur ignoré');
        return;
    }

    // Pour l'instant, on ignore le prefetch de l'utilisateur car il cause des erreurs
    // TODO: Fix the API route to handle prefetch requests properly
    console.log(`Préchargement utilisateur ${userId} temporairement désactivé`);
    return;

    // Promise.allSettled([
    //     prefetchData(`/api/utilisateurs/${userId}`),
    //     // TODO: Réactiver quand ces routes seront implémentées
    //     // prefetchData(`/api/utilisateurs/${userId}/skills`),
    //     // prefetchData(`/api/utilisateurs/${userId}/conges`),
    //     // prefetchData(`/api/utilisateurs/${userId}/calendrier-settings`)
    // ]).catch(() => { });
}

// Précharger les ressources statiques critiques
export function prefetchCriticalAssets() {
    const criticalAssets = [
        '/images/logo-full.png',
        '/images/placeholder-user.png'
    ];

    criticalAssets.forEach(asset => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = asset;
        link.as = asset.endsWith('.js') ? 'script' : asset.endsWith('.css') ? 'style' : 'image';
        document.head.appendChild(link);
    });
} 