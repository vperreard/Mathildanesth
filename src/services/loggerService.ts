/**
 * Niveaux de log supportés par le système
 */
export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
    CRITICAL = 'CRITICAL'
}

/**
 * Interface du service de journalisation
 */
export interface ILoggerService {
    /**
     * Enregistre un message avec le niveau spécifié
     * @param level Niveau de log
     * @param message Message à journaliser
     * @param context Données additionnelles (optionnel)
     */
    log(level: LogLevel, message: string, context?: any): void;

    /**
     * Enregistre un message de debug
     * @param message Message à journaliser
     * @param context Données additionnelles (optionnel)
     */
    debug(message: string, context?: any): void;

    /**
     * Enregistre un message d'information
     * @param message Message à journaliser
     * @param context Données additionnelles (optionnel)
     */
    info(message: string, context?: any): void;

    /**
     * Enregistre un avertissement
     * @param message Message à journaliser
     * @param context Données additionnelles (optionnel)
     */
    warn(message: string, context?: any): void;

    /**
     * Enregistre une erreur
     * @param message Message à journaliser
     * @param context Données additionnelles (optionnel)
     */
    error(message: string, context?: any): void;

    /**
     * Enregistre une erreur critique
     * @param message Message à journaliser
     * @param context Données additionnelles (optionnel)
     */
    critical(message: string, context?: any): void;
}

/**
 * Configuration du service de journalisation
 */
export interface LoggerConfig {
    minLevel: LogLevel;
    enableConsole: boolean;
    enableServer: boolean;
    serverEndpoint?: string;
    batchSize?: number;
}

/**
 * Implémentation du service de journalisation
 */
export class LoggerService implements ILoggerService {
    private config: LoggerConfig;
    private logQueue: Array<{ level: LogLevel, message: string, timestamp: Date, context?: any }> = [];

    constructor(config: Partial<LoggerConfig> = {}) {
        // Configuration par défaut
        this.config = {
            minLevel: LogLevel.INFO,
            enableConsole: true,
            enableServer: process.env.NODE_ENV === 'production',
            serverEndpoint: '/api/logs',
            batchSize: 10,
            ...config
        };
    }

    /**
     * Met à jour la configuration du logger
     */
    public updateConfig(config: Partial<LoggerConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Méthode principale de journalisation
     */
    public log(level: LogLevel, message: string, context?: any): void {
        // Vérifier si le niveau est suffisant pour être journalisé
        if (!this.shouldLog(level)) {
            return;
        }

        const logEntry = {
            level,
            message,
            timestamp: new Date(),
            context
        };

        // Journalisation console si activée
        if (this.config.enableConsole) {
            this.logToConsole(logEntry);
        }

        // Ajouter à la file d'attente pour envoi au serveur
        if (this.config.enableServer) {
            this.logQueue.push(logEntry);

            // Envoyer si la taille du batch est atteinte
            if (this.logQueue.length >= (this.config.batchSize || 10)) {
                this.flushLogs();
            }
        }
    }

    /**
     * Méthodes de journalisation par niveau
     */
    public debug(message: string, context?: any): void {
        this.log(LogLevel.DEBUG, message, context);
    }

    public info(message: string, context?: any): void {
        this.log(LogLevel.INFO, message, context);
    }

    public warn(message: string, context?: any): void {
        this.log(LogLevel.WARNING, message, context);
    }

    public error(message: string, context?: any): void {
        this.log(LogLevel.ERROR, message, context);
    }

    public critical(message: string, context?: any): void {
        this.log(LogLevel.CRITICAL, message, context);
    }

    /**
     * Envoie immédiatement tous les logs en attente au serveur
     */
    public async flushLogs(): Promise<void> {
        if (!this.config.enableServer || this.logQueue.length === 0) {
            return;
        }

        const logsToSend = [...this.logQueue];
        this.logQueue = [];

        try {
            const endpoint = this.config.serverEndpoint || '/api/logs';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    logs: logsToSend,
                    appVersion: process.env.APP_VERSION || 'unknown',
                    environment: process.env.NODE_ENV || 'development'
                })
            });

            if (!response.ok) {
                // Remettre les logs dans la file d'attente en cas d'échec
                this.logQueue.unshift(...logsToSend);
                console.error(`Échec de l'envoi des logs au serveur: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            // Remettre les logs dans la file d'attente en cas d'erreur
            this.logQueue.unshift(...logsToSend);
            console.error(`Erreur lors de l'envoi des logs au serveur:`, error);
        }
    }

    /**
     * Détermine si un niveau de log doit être journalisé
     */
    private shouldLog(level: LogLevel): boolean {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARNING, LogLevel.ERROR, LogLevel.CRITICAL];
        const minLevelIndex = levels.indexOf(this.config.minLevel);
        const currentLevelIndex = levels.indexOf(level);

        return currentLevelIndex >= minLevelIndex;
    }

    /**
     * Journalise dans la console avec la méthode appropriée
     */
    private logToConsole(logEntry: { level: LogLevel, message: string, timestamp: Date, context?: any }): void {
        const { level, message, timestamp, context } = logEntry;
        const formattedMessage = `[${timestamp.toISOString()}] [${level}] ${message}`;

        switch (level) {
            case LogLevel.DEBUG:
                console.debug(formattedMessage, context || '');
                break;
            case LogLevel.INFO:
                console.info(formattedMessage, context || '');
                break;
            case LogLevel.WARNING:
                console.warn(formattedMessage, context || '');
                break;
            case LogLevel.ERROR:
                console.error(formattedMessage, context || '');
                break;
            case LogLevel.CRITICAL:
                console.error(`CRITICAL: ${formattedMessage}`, context || '');
                break;
            default:
                console.log(formattedMessage, context || '');
        }
    }
} 