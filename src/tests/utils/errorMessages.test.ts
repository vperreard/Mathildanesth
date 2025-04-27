import {
    getErrorMessage,
    getErrorSuggestion,
    getFullErrorInfo,
    translateTechnicalError,
    GENERAL_ERROR_MESSAGES,
    APP_ERROR_MESSAGES
} from '../../utils/errorMessages';

describe('errorMessages Utilities', () => {
    test('devrait récupérer un message d\'erreur à partir d\'un code', () => {
        // Tester avec un code d'erreur général
        expect(getErrorMessage('network_error')).toBe('Impossible de se connecter au serveur');

        // Tester avec un code d'erreur spécifique à l'application
        expect(getErrorMessage('invalid_date_range')).toBe('La plage de dates sélectionnée n\'est pas valide');

        // Tester avec un code d'erreur inconnu (devrait retourner le message par défaut)
        expect(getErrorMessage('non_existent_code')).toBe('Une erreur inattendue est survenue');

        // Tester avec un code d'erreur inconnu et un message par défaut personnalisé
        expect(getErrorMessage('non_existent_code', 'Message personnalisé')).toBe('Une erreur inattendue est survenue');
    });

    test('devrait récupérer une suggestion pour résoudre l\'erreur', () => {
        // Tester avec un code d'erreur général
        expect(getErrorSuggestion('timeout')).toBe('Le serveur met trop de temps à répondre, veuillez réessayer plus tard');

        // Tester avec un code d'erreur spécifique à l'application
        expect(getErrorSuggestion('blackout_period')).toBe('Veuillez choisir une autre date');

        // Tester avec un code d'erreur inconnu (devrait retourner undefined)
        expect(getErrorSuggestion('non_existent_code')).toBeUndefined();
    });

    test('devrait récupérer à la fois le message et la suggestion', () => {
        // Tester avec un code d'erreur général
        const unauthorizedInfo = getFullErrorInfo('unauthorized');
        expect(unauthorizedInfo.message).toBe('Vous n\'êtes pas autorisé à accéder à cette ressource');
        expect(unauthorizedInfo.suggestion).toBe('Veuillez vous reconnecter');
        expect(unauthorizedInfo.priority).toBe(30);
        expect(unauthorizedInfo.category).toBe('auth');

        // Tester avec un code d'erreur spécifique à l'application
        const quotaInfo = getFullErrorInfo('quota_exceeded');
        expect(quotaInfo.message).toBe('Vous avez dépassé votre quota disponible');
        expect(quotaInfo.suggestion).toBe('Veuillez réduire la durée ou contacter un responsable');
        expect(quotaInfo.priority).toBe(30);
        expect(quotaInfo.category).toBe('quota');

        // Tester avec un code d'erreur inconnu (devrait retourner le message d'erreur inconnu)
        const unknownInfo = getFullErrorInfo('non_existent_code');
        expect(unknownInfo.message).toBe('Une erreur inattendue est survenue');
        expect(unknownInfo.suggestion).toBe('Veuillez rafraîchir la page et réessayer');
        expect(unknownInfo.priority).toBe(100);
        expect(unknownInfo.category).toBe('other');

        // Tester avec un message par défaut personnalisé
        const customInfo = getFullErrorInfo('non_existent_code', 'Message personnalisé');
        expect(customInfo.message).toBe('Une erreur inattendue est survenue');
    });

    test('devrait traduire des messages d\'erreur techniques en messages compréhensibles', () => {
        // Tester avec une erreur réseau
        expect(translateTechnicalError('Network Error')).toBe('Impossible de se connecter au serveur');
        expect(translateTechnicalError('Failed to fetch data')).toBe('Impossible de se connecter au serveur');

        // Tester avec une erreur de timeout
        expect(translateTechnicalError('Request timeout')).toBe('La requête a pris trop de temps');

        // Tester avec une erreur d'authentification
        expect(translateTechnicalError('401 Unauthorized')).toBe('Vous n\'êtes pas autorisé à accéder à cette ressource');

        // Tester avec une erreur de permission
        expect(translateTechnicalError('403 Forbidden')).toBe('Vous n\'avez pas les droits pour effectuer cette action');

        // Tester avec une erreur 404
        expect(translateTechnicalError('404 Not Found')).toBe('La ressource demandée n\'existe pas');

        // Tester avec une erreur de conflit
        expect(translateTechnicalError('409 Conflict')).toBe('Cette action entre en conflit avec l\'état actuel');

        // Tester avec une erreur de serveur
        expect(translateTechnicalError('500 Internal Server Error')).toBe('Une erreur est survenue sur le serveur');

        // Tester avec une erreur inconnue
        const customError = 'Erreur personnalisée';
        expect(translateTechnicalError(customError)).toBe(customError);

        // Tester avec un objet d'erreur
        const errorObject = { message: 'Object error message' };
        expect(translateTechnicalError(errorObject)).toBe('Object error message');
    });

    test('devrait contenir tous les messages d\'erreur généraux attendus', () => {
        // Vérifier quelques codes d'erreur généraux importants
        expect(GENERAL_ERROR_MESSAGES['network_error']).toBeDefined();
        expect(GENERAL_ERROR_MESSAGES['unauthorized']).toBeDefined();
        expect(GENERAL_ERROR_MESSAGES['server_error']).toBeDefined();
        expect(GENERAL_ERROR_MESSAGES['validation_error']).toBeDefined();
        expect(GENERAL_ERROR_MESSAGES['unknown']).toBeDefined();
    });

    test('devrait contenir tous les messages d\'erreur spécifiques à l\'application attendus', () => {
        // Vérifier quelques codes d'erreur spécifiques à l'application
        expect(APP_ERROR_MESSAGES['invalid_date_range']).toBeDefined();
        expect(APP_ERROR_MESSAGES['date_overlap']).toBeDefined();
        expect(APP_ERROR_MESSAGES['quota_exceeded']).toBeDefined();
        expect(APP_ERROR_MESSAGES['file_too_large']).toBeDefined();
    });
}); 