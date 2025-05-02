import { apiConfig } from './api';

/**
 * Configuration globale de l'application
 */
export const CONFIG = {
    // URL de base de l'API
    API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',

    // Configuration détaillée de l'API
    API: apiConfig,

    // Mode de l'application (development, production, test)
    APP_MODE: process.env.NODE_ENV || 'development',

    // Délai d'expiration des requêtes en ms
    REQUEST_TIMEOUT: 30000,

    // Tentatives de reconnexion après erreur API
    MAX_API_RETRIES: 3,

    // Délai entre les tentatives de reconnexion en ms
    RETRY_DELAY: 1000,
};

export * from './api';
export * from './themes'; 