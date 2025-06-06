import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

/**
 * Niveaux de log supportés par le système
 */
export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug',
    TRACE = 'trace'
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
    log(level: LogLevel, message: string, context?: unknown): void;

    /**
     * Enregistre un message de debug
     * @param message Message à journaliser
     * @param context Données additionnelles (optionnel)
     */
    debug(message: string, context?: unknown): void;

    /**
     * Enregistre un message d'information
     * @param message Message à journaliser
     * @param context Données additionnelles (optionnel)
     */
    info(message: string, context?: unknown): void;

    /**
     * Enregistre un avertissement
     * @param message Message à journaliser
     * @param context Données additionnelles (optionnel)
     */
    warn(message: string, context?: unknown): void;

    /**
     * Enregistre une erreur
     * @param message Message à journaliser
     * @param context Données additionnelles (optionnel)
     */
    error(message: string, context?: unknown): void;

    /**
     * Enregistre une erreur critique
     * @param message Message à journaliser
     * @param context Données additionnelles (optionnel)
     */
    critical(message: string, context?: unknown): void;
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
    private logger: winston.Logger;

    constructor() {
        const logDir = path.join(process.cwd(), 'logs');

        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new DailyRotateFile({
                    filename: path.join(logDir, 'error-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    level: 'error',
                    maxSize: '20m',
                    maxFiles: '14d'
                }),
                new DailyRotateFile({
                    filename: path.join(logDir, 'combined-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '20m',
                    maxFiles: '14d'
                })
            ]
        });

        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            }));
        }
    }

    /**
     * Méthodes de journalisation par niveau
     */
    public error(message: string, meta?: unknown): void {
        this.logger.error(message, { ...meta, timestamp: new Date().toISOString() });
    }

    public warn(message: string, meta?: unknown): void {
        this.logger.warn(message, { ...meta, timestamp: new Date().toISOString() });
    }

    public info(message: string, meta?: unknown): void {
        this.logger.info(message, { ...meta, timestamp: new Date().toISOString() });
    }

    public debug(message: string, meta?: unknown): void {
        this.logger.debug(message, { ...meta, timestamp: new Date().toISOString() });
    }

    public trace(message: string, meta?: unknown): void {
        this.logger.verbose(message, { ...meta, timestamp: new Date().toISOString() });
    }

    public log(level: LogLevel, message: string, context?: unknown): void {
        switch (level) {
            case LogLevel.ERROR:
                this.error(message, context);
                break;
            case LogLevel.WARN:
                this.warn(message, context);
                break;
            case LogLevel.INFO:
                this.info(message, context);
                break;
            case LogLevel.DEBUG:
                this.debug(message, context);
                break;
            case LogLevel.TRACE:
                this.trace(message, context);
                break;
        }
    }

    public critical(message: string, context?: unknown): void {
        this.error(`CRITICAL: ${message}`, context);
    }
}

// Create a default logger instance
const defaultLogger = new LoggerService();

// Export standalone functions for backwards compatibility
export const log = (level: LogLevel, message: string, context?: unknown): void => {
    defaultLogger.log(level, message, context);
};

export const logError = (message: string, context?: unknown): void => {
    defaultLogger.error(message, context);
};

export const logWarning = (message: string, context?: unknown): void => {
    defaultLogger.warn(message, context);
};

export const logInfo = (message: string, context?: unknown): void => {
    defaultLogger.info(message, context);
};

export const logDebug = (message: string, context?: unknown): void => {
    defaultLogger.debug(message, context);
};

// Logger class for custom contexts
export class Logger {
    private service: LoggerService;
    private context: string;

    constructor(context: string) {
        this.service = new LoggerService();
        this.context = context;
    }

    private formatMessage(message: string): string {
        return `[${this.context}] ${message}`;
    }

    public error(message: string, ...args: unknown[]): void {
        this.service.error(this.formatMessage(message), ...args);
    }

    public warn(message: string, ...args: unknown[]): void {
        this.service.warn(this.formatMessage(message), ...args);
    }

    public info(message: string, ...args: unknown[]): void {
        this.service.info(this.formatMessage(message), ...args);
    }

    public debug(message: string, ...args: unknown[]): void {
        this.service.debug(this.formatMessage(message), ...args);
    }
}

// Factory function
export const createLogger = (context: string = 'Logger', minLevel?: LogLevel): Logger => {
    return new Logger(context);
}; 