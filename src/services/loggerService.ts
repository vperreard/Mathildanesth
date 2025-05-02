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
    public error(message: string, meta?: any): void {
        this.logger.error(message, { ...meta, timestamp: new Date().toISOString() });
    }

    public warn(message: string, meta?: any): void {
        this.logger.warn(message, { ...meta, timestamp: new Date().toISOString() });
    }

    public info(message: string, meta?: any): void {
        this.logger.info(message, { ...meta, timestamp: new Date().toISOString() });
    }

    public debug(message: string, meta?: any): void {
        this.logger.debug(message, { ...meta, timestamp: new Date().toISOString() });
    }

    public trace(message: string, meta?: any): void {
        this.logger.verbose(message, { ...meta, timestamp: new Date().toISOString() });
    }

    public log(level: LogLevel, message: string, context?: any): void {
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

    public critical(message: string, context?: any): void {
        this.error(`CRITICAL: ${message}`, context);
    }
} 