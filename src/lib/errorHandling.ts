import { logger } from "./logger";

/**
 * Système de gestion d'erreurs centralisé pour l'application
 */

/**
 * Types d'erreurs standardisés pour l'application
 */
export enum ErrorType {
    NETWORK = 'network',
    AUTHENTICATION = 'authentication',
    AUTHORIZATION = 'authorization',
    VALIDATION = 'validation',
    NOT_FOUND = 'not_found',
    SERVER = 'server',
    UNKNOWN = 'unknown'
}

/**
 * Interface définissant la structure d'une erreur d'application
 */
export interface AppError {
    type: ErrorType;
    message: string;
    originalError?: Error | unknown;
    details?: Record<string, unknown>;
    userMessage?: string;
    code?: string;
}

/**
 * Classe pour créer des erreurs personnalisées avec la structure AppError
 */
export class AppErrorException extends Error implements AppError {
    type: ErrorType;
    originalError?: Error | unknown;
    details?: Record<string, unknown>;
    userMessage?: string;
    code?: string;

    constructor(error: AppError) {
        super(error.message);
        this.name = 'AppErrorException';
        this.type = error.type;
        this.originalError = error.originalError;
        this.details = error.details;
        this.userMessage = error.userMessage;
        this.code = error.code;
    }
}

/**
 * Crée une erreur standardisée
 */
export function createError(
    type: ErrorType,
    message: string,
    options?: Partial<Omit<AppError, 'type' | 'message'>>
): AppErrorException {
    return new AppErrorException({
        type,
        message,
        ...options
    });
}

/**
 * Formate les messages d'erreur pour l'utilisateur
 */
export function formatUserMessage(error: AppError): string {
    // Si un message utilisateur est déjà défini, on l'utilise
    if (error.userMessage) {
        return error.userMessage;
    }

    // Sinon, on renvoie un message adapté au type d'erreur
    switch (error.type) {
        case ErrorType.NETWORK:
            return 'Un problème de connexion est survenu. Veuillez vérifier votre connexion internet et réessayer.';
        case ErrorType.AUTHENTICATION:
            return 'Échec d\'authentification. Veuillez vous reconnecter.';
        case ErrorType.AUTHORIZATION:
            return 'Vous n\'avez pas les droits nécessaires pour effectuer cette action.';
        case ErrorType.VALIDATION:
            return 'Certaines données sont invalides. Veuillez vérifier vos informations.';
        case ErrorType.NOT_FOUND:
            return 'La ressource demandée n\'a pas été trouvée.';
        case ErrorType.SERVER:
            return 'Une erreur est survenue sur le serveur. L\'équipe technique a été notifiée.';
        default:
            return 'Une erreur inattendue est survenue. Veuillez réessayer plus tard.';
    }
}

/**
 * Journalise les erreurs
 */
export function logError(error: AppError): void {
    // En production, on pourrait envoyer les erreurs à un service comme Sentry
    const logPrefix = `[ERROR][${error.type.toUpperCase()}]`;

    logger.error(`${logPrefix} ${error.message}`);

    if (error.originalError) {
        logger.error('Erreur originale:', error.originalError);
    }

    if (error.details) {
        logger.error('Détails:', error.details);
    }
}

/**
 * Gère les erreurs de manière centralisée
 * Journalise l'erreur, formate le message utilisateur et peut rediriger ou exécuter des actions
 */
export function handleError(
    error: Error | AppErrorException | unknown,
    options?: {
        showToUser?: boolean;
        redirect?: boolean;
        onError?: (formattedError: AppError) => void;
    }
): AppError {
    const formattedError = formatError(error);

    // Journaliser l'erreur
    logError(formattedError);

    // Exécuter le callback si fourni
    if (options?.onError) {
        options.onError(formattedError);
    }

    return formattedError;
}

/**
 * Formate une erreur en AppError
 */
function formatError(error: unknown): AppError {
    if (error instanceof AppErrorException) {
        return error;
    }

    if (error instanceof Error) {
        return {
            type: ErrorType.UNKNOWN,
            message: error.message,
            originalError: error
        };
    }

    return {
        type: ErrorType.UNKNOWN,
        message: 'Une erreur inconnue est survenue',
        originalError: error
    };
}

/**
 * Vérifie si une erreur est d'un type spécifique
 */
export function isErrorType(error: AppError | AppErrorException, type: ErrorType): boolean {
    return error.type === type;
}

/**
 * Extrait les détails des erreurs de validation
 */
export function extractValidationErrors(
    error: AppError | AppErrorException
): Record<string, string> | null {
    if (error.type !== ErrorType.VALIDATION || !error.details) {
        return null;
    }

    // Si les détails contiennent déjà la structure attendue (champ -> message d'erreur)
    if (typeof error.details === 'object') {
        const validationErrors: Record<string, string> = {};

        Object.entries(error.details).forEach(([key, value]) => {
            validationErrors[key] = typeof value === 'string' ? value : String(value);
        });

        return validationErrors;
    }

    return null;
} 