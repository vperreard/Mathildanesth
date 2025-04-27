import { ErrorDetails } from '../hooks/useErrorHandler';

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
        console.error(`[${error.severity.toUpperCase()}] ${key}:`, {
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
            console.error('Échec de l\'envoi des logs d\'erreur au serveur:', await response.text());
        }
    } catch (e) {
        // En cas d'erreur de réseau, remettre les erreurs dans la file d'attente
        errorQueue.push(...errors);
        console.error('Erreur lors de l\'envoi des logs d\'erreur au serveur:', e);
    }
};

// Flush la file d'attente avant que l'utilisateur ne quitte la page
window.addEventListener('beforeunload', () => {
    if (errorQueue.length > 0) {
        // Utiliser sendBeacon pour l'envoi asynchrone lors de la fermeture de la page
        navigator.sendBeacon(
            config.serverEndpoint,
            JSON.stringify({
                environment: config.environment,
                errors: errorQueue.map(({ key, error }) => ({
                    key,
                    message: error.message,
                    code: error.code,
                    severity: error.severity,
                    timestamp: error.timestamp,
                    context: error.context,
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                })),
            })
        );
    }
}); 