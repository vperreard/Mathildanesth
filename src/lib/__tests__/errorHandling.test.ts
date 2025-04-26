import {
    ErrorType,
    AppError,
    AppErrorException,
    createError,
    formatUserMessage,
    logError,
    handleError,
    isErrorType,
    extractValidationErrors
} from '../errorHandling';

describe('Système de gestion d\'erreurs', () => {
    describe('createError', () => {
        it('crée une erreur standardisée avec le type et le message', () => {
            const error = createError(ErrorType.NETWORK, 'Erreur de connexion');

            expect(error).toBeInstanceOf(AppErrorException);
            expect(error.type).toBe(ErrorType.NETWORK);
            expect(error.message).toBe('Erreur de connexion');
        });

        it('crée une erreur avec des options additionnelles', () => {
            const originalError = new Error('Erreur originale');
            const error = createError(ErrorType.VALIDATION, 'Données invalides', {
                originalError,
                details: { field: 'Le champ est requis' },
                userMessage: 'Veuillez corriger les erreurs',
                code: 'INVALID_FIELD'
            });

            expect(error.type).toBe(ErrorType.VALIDATION);
            expect(error.message).toBe('Données invalides');
            expect(error.originalError).toBe(originalError);
            expect(error.details).toEqual({ field: 'Le champ est requis' });
            expect(error.userMessage).toBe('Veuillez corriger les erreurs');
            expect(error.code).toBe('INVALID_FIELD');
        });
    });

    describe('formatUserMessage', () => {
        it('renvoie le userMessage si fourni', () => {
            const error: AppError = {
                type: ErrorType.NETWORK,
                message: 'Échec de la requête',
                userMessage: 'Message personnalisé'
            };

            expect(formatUserMessage(error)).toBe('Message personnalisé');
        });

        it('génère un message en fonction du type d\'erreur - NETWORK', () => {
            const error: AppError = {
                type: ErrorType.NETWORK,
                message: 'Échec de la requête'
            };

            expect(formatUserMessage(error)).toContain('problème de connexion');
        });

        it('génère un message en fonction du type d\'erreur - AUTHENTICATION', () => {
            const error: AppError = {
                type: ErrorType.AUTHENTICATION,
                message: 'Token invalide'
            };

            expect(formatUserMessage(error)).toContain('authentification');
        });

        it('génère un message en fonction du type d\'erreur - UNKNOWN', () => {
            const error: AppError = {
                type: ErrorType.UNKNOWN,
                message: 'Erreur inconnue'
            };

            expect(formatUserMessage(error)).toContain('inattendue');
        });
    });

    describe('logError', () => {
        let consoleErrorSpy: jest.SpyInstance;

        beforeEach(() => {
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        });

        afterEach(() => {
            consoleErrorSpy.mockRestore();
        });

        it('journalise l\'erreur avec son type et message', () => {
            const error: AppError = {
                type: ErrorType.SERVER,
                message: 'Erreur serveur'
            };

            logError(error);

            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR][SERVER]'));
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Erreur serveur'));
        });

        it('journalise l\'erreur originale si présente', () => {
            const originalError = new Error('Erreur originale');
            const error: AppError = {
                type: ErrorType.SERVER,
                message: 'Erreur serveur',
                originalError
            };

            logError(error);

            expect(consoleErrorSpy).toHaveBeenCalledWith('Erreur originale:', originalError);
        });

        it('journalise les détails si présents', () => {
            const details = { id: 123, code: 'CUSTOM_ERROR' };
            const error: AppError = {
                type: ErrorType.SERVER,
                message: 'Erreur serveur',
                details
            };

            logError(error);

            expect(consoleErrorSpy).toHaveBeenCalledWith('Détails:', details);
        });
    });

    describe('handleError', () => {
        let logErrorSpy: jest.SpyInstance;
        let onErrorMock: jest.Mock;

        beforeEach(() => {
            logErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            onErrorMock = jest.fn();
        });

        afterEach(() => {
            logErrorSpy.mockRestore();
        });

        it('gère une AppErrorException', () => {
            const appError = createError(ErrorType.VALIDATION, 'Données invalides');

            const result = handleError(appError);

            expect(result).toBe(appError);
            expect(logErrorSpy).toHaveBeenCalled();
        });

        it('convertit une Error standard en AppError', () => {
            const stdError = new Error('Erreur standard');

            const result = handleError(stdError);

            expect(result.type).toBe(ErrorType.UNKNOWN);
            expect(result.message).toBe('Erreur standard');
            expect(result.originalError).toBe(stdError);
        });

        it('convertit une erreur inconnue en AppError', () => {
            const unknownError = 'Juste une chaîne';

            const result = handleError(unknownError);

            expect(result.type).toBe(ErrorType.UNKNOWN);
            expect(result.message).toBe('Une erreur inconnue est survenue');
            expect(result.originalError).toBe(unknownError);
        });

        it('appelle le callback onError si fourni', () => {
            const appError = createError(ErrorType.SERVER, 'Erreur serveur');

            handleError(appError, { onError: onErrorMock });

            expect(onErrorMock).toHaveBeenCalledWith(appError);
        });
    });

    describe('isErrorType', () => {
        it('retourne true si l\'erreur est du type spécifié', () => {
            const error: AppError = {
                type: ErrorType.VALIDATION,
                message: 'Données invalides'
            };

            expect(isErrorType(error, ErrorType.VALIDATION)).toBe(true);
        });

        it('retourne false si l\'erreur n\'est pas du type spécifié', () => {
            const error: AppError = {
                type: ErrorType.VALIDATION,
                message: 'Données invalides'
            };

            expect(isErrorType(error, ErrorType.NETWORK)).toBe(false);
        });

        it('fonctionne avec une instance de AppErrorException', () => {
            const error = createError(ErrorType.AUTHORIZATION, 'Accès refusé');

            expect(isErrorType(error, ErrorType.AUTHORIZATION)).toBe(true);
            expect(isErrorType(error, ErrorType.AUTHENTICATION)).toBe(false);
        });
    });

    describe('extractValidationErrors', () => {
        it('extrait les détails d\'erreur de validation', () => {
            const error: AppError = {
                type: ErrorType.VALIDATION,
                message: 'Données invalides',
                details: {
                    name: 'Le nom est requis',
                    email: 'Email invalide'
                }
            };

            const validationErrors = extractValidationErrors(error);

            expect(validationErrors).toEqual({
                name: 'Le nom est requis',
                email: 'Email invalide'
            });
        });

        it('convertit les valeurs non-string en string', () => {
            const error: AppError = {
                type: ErrorType.VALIDATION,
                message: 'Données invalides',
                details: {
                    age: 18,
                    active: false
                }
            };

            const validationErrors = extractValidationErrors(error);

            expect(validationErrors).toEqual({
                age: '18',
                active: 'false'
            });
        });

        it('retourne null si ce n\'est pas une erreur de validation', () => {
            const error: AppError = {
                type: ErrorType.NETWORK,
                message: 'Erreur réseau',
                details: { field: 'value' }
            };

            const validationErrors = extractValidationErrors(error);

            expect(validationErrors).toBeNull();
        });

        it('retourne null si aucun détail n\'est fourni', () => {
            const error: AppError = {
                type: ErrorType.VALIDATION,
                message: 'Données invalides'
            };

            const validationErrors = extractValidationErrors(error);

            expect(validationErrors).toBeNull();
        });
    });
}); 