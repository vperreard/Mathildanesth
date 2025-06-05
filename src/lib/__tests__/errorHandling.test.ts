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

describe('errorHandling', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    describe('AppErrorException', () => {
        it('should create an error with all properties', () => {
            const errorData: AppError = {
                type: ErrorType.VALIDATION,
                message: 'Validation failed',
                originalError: new Error('Original error'),
                details: { field: 'email', reason: 'invalid format' },
                userMessage: 'Please check your email',
                code: 'VAL_001'
            };

            const error = new AppErrorException(errorData);

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(AppErrorException);
            expect(error.name).toBe('AppErrorException');
            expect(error.type).toBe(ErrorType.VALIDATION);
            expect(error.message).toBe('Validation failed');
            expect(error.originalError).toEqual(errorData.originalError);
            expect(error.details).toEqual(errorData.details);
            expect(error.userMessage).toBe('Please check your email');
            expect(error.code).toBe('VAL_001');
        });

        it('should create error with minimal properties', () => {
            const error = new AppErrorException({
                type: ErrorType.NETWORK,
                message: 'Network error'
            });

            expect(error.type).toBe(ErrorType.NETWORK);
            expect(error.message).toBe('Network error');
            expect(error.originalError).toBeUndefined();
            expect(error.details).toBeUndefined();
            expect(error.userMessage).toBeUndefined();
            expect(error.code).toBeUndefined();
        });
    });

    describe('createError', () => {
        it('should create error with type and message', () => {
            const error = createError(ErrorType.AUTHENTICATION, 'Invalid credentials');

            expect(error).toBeInstanceOf(AppErrorException);
            expect(error.type).toBe(ErrorType.AUTHENTICATION);
            expect(error.message).toBe('Invalid credentials');
        });

        it('should create error with optional properties', () => {
            const originalError = new Error('Original');
            const error = createError(ErrorType.SERVER, 'Server error', {
                originalError,
                details: { statusCode: 500 },
                userMessage: 'Something went wrong',
                code: 'SRV_500'
            });

            expect(error.type).toBe(ErrorType.SERVER);
            expect(error.message).toBe('Server error');
            expect(error.originalError).toBe(originalError);
            expect(error.details).toEqual({ statusCode: 500 });
            expect(error.userMessage).toBe('Something went wrong');
            expect(error.code).toBe('SRV_500');
        });
    });

    describe('formatUserMessage', () => {
        it('should return custom user message if provided', () => {
            const error: AppError = {
                type: ErrorType.VALIDATION,
                message: 'Technical error',
                userMessage: 'Custom user message'
            };

            expect(formatUserMessage(error)).toBe('Custom user message');
        });

        it('should return appropriate message for NETWORK error', () => {
            const error: AppError = {
                type: ErrorType.NETWORK,
                message: 'Network failure'
            };

            expect(formatUserMessage(error)).toBe(
                'Un problème de connexion est survenu. Veuillez vérifier votre connexion internet et réessayer.'
            );
        });

        it('should return appropriate message for AUTHENTICATION error', () => {
            const error: AppError = {
                type: ErrorType.AUTHENTICATION,
                message: 'Auth failed'
            };

            expect(formatUserMessage(error)).toBe(
                'Échec d\'authentification. Veuillez vous reconnecter.'
            );
        });

        it('should return appropriate message for AUTHORIZATION error', () => {
            const error: AppError = {
                type: ErrorType.AUTHORIZATION,
                message: 'Access denied'
            };

            expect(formatUserMessage(error)).toBe(
                'Vous n\'avez pas les droits nécessaires pour effectuer cette action.'
            );
        });

        it('should return appropriate message for VALIDATION error', () => {
            const error: AppError = {
                type: ErrorType.VALIDATION,
                message: 'Invalid data'
            };

            expect(formatUserMessage(error)).toBe(
                'Certaines données sont invalides. Veuillez vérifier vos informations.'
            );
        });

        it('should return appropriate message for NOT_FOUND error', () => {
            const error: AppError = {
                type: ErrorType.NOT_FOUND,
                message: 'Resource not found'
            };

            expect(formatUserMessage(error)).toBe(
                'La ressource demandée n\'a pas été trouvée.'
            );
        });

        it('should return appropriate message for SERVER error', () => {
            const error: AppError = {
                type: ErrorType.SERVER,
                message: 'Internal server error'
            };

            expect(formatUserMessage(error)).toBe(
                'Une erreur est survenue sur le serveur. L\'équipe technique a été notifiée.'
            );
        });

        it('should return default message for UNKNOWN error', () => {
            const error: AppError = {
                type: ErrorType.UNKNOWN,
                message: 'Unknown error'
            };

            expect(formatUserMessage(error)).toBe(
                'Une erreur inattendue est survenue. Veuillez réessayer plus tard.'
            );
        });
    });

    describe('logError', () => {
        it('should log error with type and message', () => {
            const error: AppError = {
                type: ErrorType.VALIDATION,
                message: 'Validation error occurred'
            };

            logError(error);

            expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR][VALIDATION] Validation error occurred');
        });

        it('should log original error if provided', () => {
            const originalError = new Error('Original');
            const error: AppError = {
                type: ErrorType.SERVER,
                message: 'Server error',
                originalError
            };

            logError(error);

            expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR][SERVER] Server error');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Erreur originale:', originalError);
        });

        it('should log details if provided', () => {
            const error: AppError = {
                type: ErrorType.NETWORK,
                message: 'Network error',
                details: { url: '/api/test', statusCode: 500 }
            };

            logError(error);

            expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR][NETWORK] Network error');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Détails:', { url: '/api/test', statusCode: 500 });
        });
    });

    describe('handleError', () => {
        it('should handle AppErrorException', () => {
            const appError = new AppErrorException({
                type: ErrorType.AUTHENTICATION,
                message: 'Auth error'
            });

            const result = handleError(appError);

            expect(result).toBe(appError);
            expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR][AUTHENTICATION] Auth error');
        });

        it('should handle regular Error', () => {
            const error = new Error('Regular error');
            const result = handleError(error);

            expect(result.type).toBe(ErrorType.UNKNOWN);
            expect(result.message).toBe('Regular error');
            expect(result.originalError).toBe(error);
            expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR][UNKNOWN] Regular error');
        });

        it('should handle unknown error', () => {
            const unknownError = { some: 'object' };
            const result = handleError(unknownError);

            expect(result.type).toBe(ErrorType.UNKNOWN);
            expect(result.message).toBe('Une erreur inconnue est survenue');
            expect(result.originalError).toBe(unknownError);
        });

        it('should call onError callback if provided', () => {
            const onError = jest.fn();
            const error = createError(ErrorType.VALIDATION, 'Validation error');

            handleError(error, { onError });

            expect(onError).toHaveBeenCalledWith(error);
        });
    });

    describe('isErrorType', () => {
        it('should return true for matching error type', () => {
            const error: AppError = {
                type: ErrorType.VALIDATION,
                message: 'Validation error'
            };

            expect(isErrorType(error, ErrorType.VALIDATION)).toBe(true);
        });

        it('should return false for non-matching error type', () => {
            const error: AppError = {
                type: ErrorType.NETWORK,
                message: 'Network error'
            };

            expect(isErrorType(error, ErrorType.VALIDATION)).toBe(false);
        });

        it('should work with AppErrorException', () => {
            const error = new AppErrorException({
                type: ErrorType.AUTHORIZATION,
                message: 'Access denied'
            });

            expect(isErrorType(error, ErrorType.AUTHORIZATION)).toBe(true);
            expect(isErrorType(error, ErrorType.AUTHENTICATION)).toBe(false);
        });
    });

    describe('extractValidationErrors', () => {
        it('should return null for non-validation errors', () => {
            const error: AppError = {
                type: ErrorType.NETWORK,
                message: 'Network error',
                details: { some: 'detail' }
            };

            expect(extractValidationErrors(error)).toBeNull();
        });

        it('should return null if no details provided', () => {
            const error: AppError = {
                type: ErrorType.VALIDATION,
                message: 'Validation error'
            };

            expect(extractValidationErrors(error)).toBeNull();
        });

        it('should extract validation errors from details', () => {
            const error: AppError = {
                type: ErrorType.VALIDATION,
                message: 'Validation failed',
                details: {
                    email: 'Invalid email format',
                    password: 'Password too short',
                    age: 18
                }
            };

            const result = extractValidationErrors(error);

            expect(result).toEqual({
                email: 'Invalid email format',
                password: 'Password too short',
                age: '18'
            });
        });

        it('should work with AppErrorException', () => {
            const error = new AppErrorException({
                type: ErrorType.VALIDATION,
                message: 'Validation failed',
                details: {
                    username: 'Already exists'
                }
            });

            const result = extractValidationErrors(error);

            expect(result).toEqual({
                username: 'Already exists'
            });
        });
    });
});