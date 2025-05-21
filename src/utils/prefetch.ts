/**
 * Utilitaires pour précharger les données et améliorer la réactivité de l'application
 */

// Fonction pour précharger les données depuis une API
export async function prefetchData<T>(url: string): Promise<T> {
    try {
        const response = await fetch(url, {
            next: { revalidate: 60 } // Revalider après 60 secondes
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error(`Erreur de préchargement pour ${url}:`, error);
        throw error;
    }
}

// Précharger les données couramment utilisées
export function prefetchCommonData() {
    // On utilise Promise.allSettled pour ne pas bloquer si une requête échoue
    Promise.allSettled([
        prefetchData('/api/users'),
        prefetchData('/api/skills'),
        prefetchData('/api/leaves/types'),
        prefetchData('/api/notifications/preferences')
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
    routes.forEach(route => {
        // Précharger la route en utilisant l'API next/router
        try {
            // Utilisation de fetchApi pour éviter les erreurs de préchargement
            fetch(route, { priority: 'low' }).catch(() => { });
        } catch (error) {
            // Ignorer les erreurs de préchargement
        }
    });
}

// Précharger l'ensemble des routes principales
export function prefetchMainRoutes() {
    prefetchRoutes([
        '/utilisateurs',
        '/calendar',
        '/planning/hebdomadaire',
        '/leaves',
        '/parametres'
    ]);
}

// Précharger les données liées à un utilisateur spécifique
export function prefetchUserData(userId: string) {
    if (!userId) return;

    Promise.allSettled([
        prefetchData(`/api/users/${userId}`),
        prefetchData(`/api/users/${userId}/skills`),
        prefetchData(`/api/users/${userId}/leaves`),
        prefetchData(`/api/users/${userId}/calendar-settings`)
    ]).catch(() => { });
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