import axios from 'axios';

import { logger } from "./logger";
interface FetchOptions extends RequestInit {
    responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
}

/**
 * Effectue une requête fetch authentifiée avec gestion d'erreur
 * @param url URL à appeler
 * @param options Options de la requête
 * @returns Données de la réponse
 */
export async function fetchWithAuth<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
    try {
        // Utilisation d'axios qui gère déjà l'ajout du token (voir intercepteur dans AuthContext)
        const { responseType = 'json', ...fetchOptions } = options;

        const config: any = {
            url,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            responseType
        };

        // Ajouter le corps de la requête si nécessaire
        if (options.body) {
            config.data = typeof options.body === 'string'
                ? options.body
                : JSON.stringify(options.body);
        }

        const response = await axios(config);
        return response.data;
    } catch (error: any) {
        // Gestion des erreurs
        if (error.response) {
            // Erreur de réponse (non-2xx)
            logger.error(`Erreur API (${error.response.status}):`, error.response.data);

            // Redirection si 401 (non autorisé) - sera également géré par l'intercepteur Axios
            if (error.response.status === 401) {
                window.location.href = '/auth/connexion';
            }

            throw new Error(
                error.response.data?.message ||
                `Erreur ${error.response.status}: ${error.response.statusText}`
            );
        } else if (error.request) {
            // Pas de réponse reçue
            logger.error('Pas de réponse reçue:', error.request);
            throw new Error('Aucune réponse reçue du serveur');
        } else {
            // Erreur pendant la configuration de la requête
            logger.error('Erreur de requête:', error.message);
            throw error;
        }
    }
} 