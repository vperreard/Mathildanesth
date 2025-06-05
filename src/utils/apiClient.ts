/**
 * Client API centralisé avec axios
 */
import axios from 'axios';
import { logger } from "../lib/logger";
import { getToken, clearTokenAndRedirect } from './auth';

// Création d'une instance axios avec configuration de base
const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '',
    timeout: 30000, // 30 secondes de timeout
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    // Important: Envoyer les cookies avec chaque requête
    withCredentials: true
});

// Intercepteur pour ajouter le token d'authentification à chaque requête
apiClient.interceptors.request.use(
    (config) => {
        // Le token est géré par cookie HTTPOnly, pas besoin de l'ajouter manuellement
        // Mais on peut toujours vérifier s'il y a un token en localStorage (pour compatibilité)
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les erreurs de réponse
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Gestion des erreurs d'authentification (401)
        if (error.response && error.response.status === 401) {
            // Redirection vers la page de connexion en cas de token expiré
            clearTokenAndRedirect();
            return Promise.reject(new Error('Session expirée. Veuillez vous reconnecter.'));
        }

        // Gestion des erreurs serveur (500)
        if (error.response && error.response.status >= 500) {
            logger.error('Erreur serveur:', error);
            return Promise.reject(new Error('Une erreur serveur est survenue. Veuillez réessayer ultérieurement.'));
        }

        // Gestion des timeouts
        if (error.code === 'ECONNABORTED') {
            return Promise.reject(new Error('La requête a pris trop de temps. Veuillez vérifier votre connexion et réessayer.'));
        }

        // Gestion des erreurs réseau
        if (!error.response) {
            return Promise.reject(new Error('Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet.'));
        }

        // Autres erreurs (400, 403, etc.)
        return Promise.reject(error);
    }
);

export { apiClient };
export default apiClient; 