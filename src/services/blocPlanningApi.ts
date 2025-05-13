import { BlocDayPlanning, ValidationResult } from '@/types/bloc-planning-types';
import { logError } from '@/services/errorLoggingService';
import { ErrorDetails, ErrorSeverity } from '@/hooks/useErrorHandler';

/**
 * Récupère le planning du bloc pour une date spécifique
 */
export async function fetchDayPlanning(date: string, options?: { signal?: AbortSignal }): Promise<BlocDayPlanning> {
    try {
        const response = await fetch(`/api/bloc-planning/${date}`, {
            signal: options?.signal
        });

        if (!response.ok) {
            // Lire le texte de l'erreur s'il est disponible
            const errorText = await response.text().catch(() => null);
            const errorMessage = `Erreur HTTP ${response.status}: ${errorText || response.statusText || 'Erreur inconnue'}`;
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            logError('fetchDayPlanning', {
                message: 'Requête annulée (AbortError)',
                severity: 'info',
                context: { date, error },
                timestamp: new Date()
            });
            throw new Error('Requête annulée');
        }
        const errorDetails: ErrorDetails = {
            message: `Erreur lors de la récupération du planning pour la date ${date}`,
            severity: 'error',
            code: 'FETCH_DAY_PLANNING_FAILED',
            context: { date, rawError: error },
            timestamp: new Date()
        };
        logError('fetchDayPlanning', errorDetails);
        throw new Error(`Impossible de récupérer le planning: ${(error as Error).message}`);
    }
}

/**
 * Valide un planning du bloc
 */
export async function validateDayPlanning(planning: BlocDayPlanning, options?: { signal?: AbortSignal }): Promise<ValidationResult> {
    try {
        const response = await fetch('/api/bloc-planning/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(planning),
            signal: options?.signal
        });

        const result = await response.json();

        if (!response.ok) {
            const errorMessage = result?.errors ? JSON.stringify(result.errors) : (response.statusText || 'Erreur inconnue');
            throw new Error(`Validation échouée: ${errorMessage}`);
        }

        return result;
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            logError('validateDayPlanning', {
                message: 'Requête de validation annulée (AbortError)',
                severity: 'info',
                context: { planning, error },
                timestamp: new Date()
            });
            throw new Error('Requête annulée');
        }
        const errorDetails: ErrorDetails = {
            message: `Erreur lors de la validation du planning pour la date ${planning.date}`,
            severity: 'warning',
            code: 'VALIDATE_DAY_PLANNING_FAILED',
            context: { planning, rawError: error },
            timestamp: new Date()
        };
        logError('validateDayPlanning', errorDetails);
        throw new Error(`Impossible de valider le planning: ${(error as Error).message}`);
    }
}

/**
 * Sauvegarde un planning du bloc
 */
export async function saveDayPlanning(planning: BlocDayPlanning, validate: boolean = false, options?: { signal?: AbortSignal }): Promise<BlocDayPlanning> {
    try {
        if (validate) {
            const validationResult = await validateDayPlanning(planning, options);
            if (!validationResult.isValid) {
                throw new Error(validationResult.errors ? `Validation échouée: ${JSON.stringify(validationResult.errors)}` : 'Validation échouée avec erreurs non spécifiées');
            }
        }

        const response = await fetch('/api/bloc-planning', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(planning),
            signal: options?.signal
        });

        if (!response.ok) {
            // Lire le texte de l'erreur s'il est disponible
            const errorText = await response.text().catch(() => null);
            const errorMessage = `Erreur HTTP ${response.status}: ${errorText || response.statusText || 'Erreur inconnue'}`;
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            logError('saveDayPlanning', {
                message: 'Requête de sauvegarde annulée (AbortError)',
                severity: 'info',
                context: { planning, error },
                timestamp: new Date()
            });
            throw new Error('Requête annulée');
        }
        if ((error as Error).message.startsWith('Validation échouée:')) {
            throw error;
        }
        const errorDetails: ErrorDetails = {
            message: `Erreur lors de la sauvegarde du planning pour la date ${planning.date}`,
            severity: 'error',
            code: 'SAVE_DAY_PLANNING_FAILED',
            context: { planning, rawError: error },
            timestamp: new Date()
        };
        logError('saveDayPlanning', errorDetails);
        throw new Error(`Impossible de sauvegarder le planning: ${(error as Error).message}`);
    }
}

/**
 * Récupère la liste des superviseurs disponibles pour une date donnée
 */
export async function fetchAvailableSupervisors(date?: string, options?: { signal?: AbortSignal }): Promise<Array<{ id: string, firstName: string, lastName: string, role?: string }>> {
    try {
        const url = date ? `/api/bloc-planning/supervisors/available?date=${date}` : '/api/bloc-planning/supervisors/available';
        const response = await fetch(url, {
            signal: options?.signal
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status || 'inconnu'}: ${response.statusText || 'Erreur inconnue'}`);
        }
        return await response.json();
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            logError('fetchAvailableSupervisors', {
                message: 'Requête superviseurs annulée (AbortError)',
                severity: 'info',
                context: { date, error },
                timestamp: new Date()
            });
            throw new Error('Requête annulée');
        }
        const errorDetails: ErrorDetails = {
            message: `Erreur lors de la récupération des superviseurs disponibles${date ? ' pour la date ' + date : ''}`,
            severity: 'error',
            code: 'FETCH_SUPERVISORS_FAILED',
            context: { date, rawError: error },
            timestamp: new Date()
        };
        logError('fetchAvailableSupervisors', errorDetails);
        throw new Error(`Impossible de récupérer les superviseurs: ${(error as Error).message}`);
    }
} 