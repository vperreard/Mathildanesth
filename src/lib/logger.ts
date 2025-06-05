// Removed circular import

/**
 * Service de logging pour l'application
 * Centralise la gestion des logs et permet de configurer leur niveau
 */

// Types de logs disponibles
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Configuration du logger
interface LoggerConfig {
    level: LogLevel;
    enableConsole: boolean;
    enableFile: boolean;
    filePath?: string;
    format?: 'json' | 'text';
    includeTimestamp: boolean;
    includeLevel: boolean;
    includeSource: boolean;
    colorize: boolean;
}

// Niveaux de log par ordre de priorité
const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

// Configuration par défaut
const DEFAULT_CONFIG: LoggerConfig = {
    level: process.env.LOG_LEVEL as LogLevel || 'info',
    enableConsole: true,
    enableFile: process.env.NODE_ENV === 'production',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
    format: process.env.LOG_FORMAT as 'json' | 'text' || 'json',
    includeTimestamp: true,
    includeLevel: true,
    includeSource: true,
    colorize: process.env.NODE_ENV !== 'production',
};

// Couleurs pour les différents niveaux de log
const COLORS = {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m',  // Vert
    warn: '\x1b[33m',  // Jaune
    error: '\x1b[31m', // Rouge
    reset: '\x1b[0m',  // Reset
};

/**
 * Classe Logger pour gérer les logs de l'application
 */
class Logger {
    private config: LoggerConfig;

    constructor(config: Partial<LoggerConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Met à jour la configuration du logger
     */
    configure(config: Partial<LoggerConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Vérifie si un niveau de log est actif
     */
    isLevelEnabled(level: LogLevel): boolean {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
    }

    /**
     * Formate un message de log
     */
    private formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
        const parts: string[] = [];

        // Ajouter le timestamp si configuré
        if (this.config.includeTimestamp) {
            parts.push(new Date().toISOString());
        }

        // Ajouter le niveau de log si configuré
        if (this.config.includeLevel) {
            const levelStr = level.toUpperCase();
            parts.push(this.config.colorize ? `${COLORS[level]}${levelStr}${COLORS.reset}` : levelStr);
        }

        // Ajouter le message
        parts.push(message);

        // Ajouter les métadonnées si présentes
        if (meta && Object.keys(meta).length > 0) {
            if (this.config.format === 'json') {
                // En mode JSON, ajouter les métadonnées au format JSON
                parts.push(JSON.stringify(meta));
            } else {
                // En mode texte, ajouter les métadonnées sous forme de paires clé-valeur
                for (const [key, value] of Object.entries(meta)) {
                    const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
                    parts.push(`${key}=${valueStr}`);
                }
            }
        }

        // Joindre les parties avec un séparateur
        return parts.join(' | ');
    }

    /**
     * Écrit un message de log
     */
    private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
        if (!this.isLevelEnabled(level)) {
            return;
        }

        const formattedMessage = this.formatMessage(level, message, meta);

        // Écrire dans la console si activé
        if (this.config.enableConsole) {
            switch (level) {
                case 'debug':
                    console.debug(formattedMessage);
                    break;
                case 'info':
                    console.info(formattedMessage);
                    break;
                case 'warn':
                    console.warn(formattedMessage);
                    break;
                case 'error':
                    console.error(formattedMessage);
                    break;
            }
        }

        // TODO: Implémenter l'écriture dans un fichier si enableFile est true
        // Cela nécessiterait un module comme 'fs' ou une bibliothèque de logging
    }

    /**
     * Log de niveau debug
     */
    debug(message: string, meta?: Record<string, unknown>): void {
        this.log('debug', message, meta);
    }

    /**
     * Log de niveau info
     */
    info(message: string, meta?: Record<string, unknown>): void {
        this.log('info', message, meta);
    }

    /**
     * Log de niveau warn
     */
    warn(message: string, meta?: Record<string, unknown>): void {
        this.log('warn', message, meta);
    }

    /**
     * Log de niveau error
     */
    error(message: string, meta?: Record<string, unknown>): void {
        this.log('error', message, meta);
    }
}

// Créer et exporter l'instance du logger
export const logger = new Logger();

// Exporter la classe pour permettre la création d'instances personnalisées
export default Logger; 