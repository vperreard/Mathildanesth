import { ErrorDetails } from '../hooks/useErrorHandler';

import { logger } from "../lib/logger";
// Configuration pour le logging des erreurs
interface LoggingConfig {
    enableConsoleLogging: boolean;
    enableServerLogging: boolean;
    serverEndpoint: string;
    environment: 'development' | 'production' | 'test';
    batchSize: number;
}

let config: LoggingConfig = {
    enableConsoleLogging: true,
    enableServerLogging: process.env.NODE_ENV === 'production',
    serverEndpoint: process.env.REACT_APP_ERROR_LOGGING_ENDPOINT || '/api/logs/error',
    environment: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    batchSize: 10,
};

// File d'attente pour le batching des erreurs
const errorQueue: Array<{ key: string, error: ErrorDetails }> = [];

/**
 * Configure le service de logging des erreurs
 */
export const configureErrorLogging = (customConfig: Partial<LoggingConfig>) => {
    config = { ...config, ...customConfig };
};

/**
 * Enregistre une erreur dans la console et/ou sur le serveur
 */
export const logError = (key: string, error: ErrorDetails): void => {
    // Logging dans la console en développement
    if (config.enableConsoleLogging) {
        logger.error(`[${error.severity.toUpperCase()}] ${key}:`, {
            message: error.message,
            code: error.code,
            context: error.context,
            timestamp: error.timestamp,
        });
    }

    // Ajouter à la file d'attente pour le logging serveur
    if (config.enableServerLogging) {
        errorQueue.push({ key, error });

        // Si la file d'attente atteint la taille du batch, l'envoyer au serveur
        if (errorQueue.length >= config.batchSize) {
            flushErrorQueue();
        }
    }
};

/**
 * Envoie immédiatement la file d'attente des erreurs au serveur
 */
export const flushErrorQueue = async (): Promise<void> => {
    if (!config.enableServerLogging || errorQueue.length === 0) {
        return;
    }

    const errors = [...errorQueue];
    errorQueue.length = 0; // Vider la file d'attente

    try {
        const response = await fetch(config.serverEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                environment: config.environment,
                errors: errors.map(({ key, error }) => ({
                    key,
                    message: error.message,
                    code: error.code,
                    severity: error.severity,
                    timestamp: error.timestamp,
                    context: error.context,
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                })),
            }),
        });

        if (!response.ok) {
            // Si le serveur ne répond pas correctement, remettre les erreurs dans la file d'attente
            errorQueue.push(...errors);
            logger.error('Échec de l\'envoi des logs d\'erreur au serveur:', await response.text());
        }
    } catch (e: unknown) {
        // En cas d'erreur de réseau, remettre les erreurs dans la file d'attente
        errorQueue.push(...errors);
        logger.error('Erreur lors de l\'envoi des logs d\'erreur au serveur:', e);
    }
};

/**
 * Ajoute un écouteur d'événement pour envoyer les logs restants 
 * avant que l'utilisateur ne quitte la page.
 * DOIT être appelé uniquement côté client.
 */
function setupUnloadListener() {
    // Vérifie si on est bien dans un environnement navigateur
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        logger.info("Setting up beforeunload listener for error logging.");
        window.addEventListener('beforeunload', () => {
            const queueToSend = [...errorQueue]; // Create a copy of the queue
            if (queueToSend.length > 0) {
                try {
                    // Send the copy
                    const success = navigator.sendBeacon('/api/log-client-errors', JSON.stringify(queueToSend));
                    if (success) {
                        logger.info(`Successfully queued ${queueToSend.length} errors via sendBeacon on unload.`);
                        // Don't attempt to modify the original errorQueue here
                    } else {
                        logger.warn('sendBeacon failed to queue errors on unload.');
                    }
                } catch (error: unknown) {
                    logger.error('Error using sendBeacon on unload:', {
                        error: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined
                    });
                }
            }
        });
    } else {
        logger.info("Skipping beforeunload listener setup (not in a browser environment or sendBeacon not supported).");
    }
}

// Appeler la fonction de setup uniquement côté client
if (typeof window !== 'undefined') {
    setupUnloadListener();
}

export const errorLoggingService = {
    logError
}; 