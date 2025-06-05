interface ErrorMessageMap {
    [key: string]: {
        message: string;
        suggestion?: string;
        priority?: number; // Utilisé pour trier les erreurs
        category?: string;
    };
}

/**
 * Map des messages d'erreur génériques
 */
export const GENERAL_ERROR_MESSAGES: ErrorMessageMap = {
    // Erreurs de réseau
    'network_error': {
        message: 'Impossible de se connecter au serveur',
        suggestion: 'Vérifiez votre connexion internet et réessayez',
        priority: 10,
        category: 'network',
    },
    'timeout': {
        message: 'La requête a pris trop de temps',
        suggestion: 'Le serveur met trop de temps à répondre, veuillez réessayer plus tard',
        priority: 20,
        category: 'network',
    },

    // Erreurs d'authentification
    'unauthorized': {
        message: 'Vous n\'êtes pas autorisé à accéder à cette ressource',
        suggestion: 'Veuillez vous reconnecter',
        priority: 30,
        category: 'auth',
    },
    'session_expired': {
        message: 'Votre session a expiré',
        suggestion: 'Veuillez vous reconnecter pour continuer',
        priority: 25,
        category: 'auth',
    },
    'invalid_credentials': {
        message: 'Identifiants incorrects',
        suggestion: 'Vérifiez votre email et mot de passe',
        priority: 35,
        category: 'auth',
    },

    // Erreurs de formulaire
    'validation_error': {
        message: 'Le formulaire contient des erreurs',
        suggestion: 'Vérifiez les champs en rouge et corrigez-les',
        priority: 40,
        category: 'form',
    },
    'missing_field': {
        message: 'Un champ obligatoire est manquant',
        suggestion: 'Veuillez remplir tous les champs obligatoires',
        priority: 45,
        category: 'form',
    },

    // Erreurs de serveur
    'server_error': {
        message: 'Une erreur est survenue sur le serveur',
        suggestion: 'Veuillez réessayer plus tard',
        priority: 5,
        category: 'server',
    },
    'maintenance': {
        message: 'Le service est temporairement indisponible pour maintenance',
        suggestion: 'Veuillez réessayer plus tard',
        priority: 1,
        category: 'server',
    },

    // Erreurs de permission
    'forbidden': {
        message: 'Vous n\'avez pas les droits pour effectuer cette action',
        suggestion: 'Contactez un administrateur si vous pensez que c\'est une erreur',
        priority: 15,
        category: 'permission',
    },

    // Erreurs de données
    'not_found': {
        message: 'La ressource demandée n\'existe pas',
        suggestion: 'Vérifiez l\'URL ou retournez à l\'accueil',
        priority: 50,
        category: 'data',
    },
    'conflict': {
        message: 'Cette action entre en conflit avec l\'état actuel',
        suggestion: 'Veuillez actualiser la page et réessayer',
        priority: 55,
        category: 'data',
    },

    // Par défaut
    'unknown': {
        message: 'Une erreur inattendue est survenue',
        suggestion: 'Veuillez rafraîchir la page et réessayer',
        priority: 100,
        category: 'other',
    },
};

/**
 * Map des messages d'erreur spécifiques à l'application
 */
export const APP_ERROR_MESSAGES: ErrorMessageMap = {
    // Erreurs liées aux dates
    'invalid_date_range': {
        message: 'La plage de dates sélectionnée n\'est pas valide',
        suggestion: 'Assurez-vous que la date de fin est postérieure à la date de début',
        priority: 60,
        category: 'date',
    },
    'date_overlap': {
        message: 'La plage de dates chevauche une période existante',
        suggestion: 'Veuillez sélectionner une autre période',
        priority: 65,
        category: 'date',
    },
    'blackout_period': {
        message: 'Cette période n\'est pas disponible',
        suggestion: 'Veuillez choisir une autre date',
        priority: 70,
        category: 'date',
    },

    // Erreurs liées aux quotas
    'quota_exceeded': {
        message: 'Vous avez dépassé votre quota disponible',
        suggestion: 'Veuillez réduire la durée ou contacter un responsable',
        priority: 30,
        category: 'quota',
    },

    // Erreurs liées aux fichiers
    'file_too_large': {
        message: 'Le fichier est trop volumineux',
        suggestion: 'La taille maximale autorisée est de 5 Mo',
        priority: 75,
        category: 'upload',
    },
    'invalid_file_type': {
        message: 'Type de fichier non pris en charge',
        suggestion: 'Les formats acceptés sont: JPG, PNG, PDF',
        priority: 80,
        category: 'upload',
    },

    // Erreurs liées aux paiements
    'payment_failed': {
        message: 'Le paiement a échoué',
        suggestion: 'Vérifiez vos informations de paiement et réessayez',
        priority: 20,
        category: 'payment',
    },
};

/**
 * Récupère un message d'erreur compréhensible à partir d'un code d'erreur
 */
export const getErrorMessage = (errorCode: string, defaultMessage: string = 'Une erreur est survenue'): string => {
    const appError = APP_ERROR_MESSAGES[errorCode];
    const generalError = GENERAL_ERROR_MESSAGES[errorCode];
    const errorInfo = appError || generalError || GENERAL_ERROR_MESSAGES['unknown'];

    return errorInfo.message || defaultMessage;
};

/**
 * Récupère une suggestion pour résoudre l'erreur
 */
export const getErrorSuggestion = (errorCode: string): string | undefined => {
    const appError = APP_ERROR_MESSAGES[errorCode];
    const generalError = GENERAL_ERROR_MESSAGES[errorCode];
    const errorInfo = appError || generalError;

    return errorInfo?.suggestion;
};

/**
 * Récupère à la fois le message et la suggestion pour une erreur
 */
export const getFullErrorInfo = (errorCode: string, defaultMessage: string = 'Une erreur est survenue') => {
    const appError = APP_ERROR_MESSAGES[errorCode];
    const generalError = GENERAL_ERROR_MESSAGES[errorCode];
    const errorInfo = appError || generalError || GENERAL_ERROR_MESSAGES['unknown'];

    return {
        message: errorInfo.message || defaultMessage,
        suggestion: errorInfo.suggestion,
        priority: errorInfo.priority || 100,
        category: errorInfo.category || 'other',
    };
};

/**
 * Traduit un message d'erreur technique en message compréhensible
 */
export const translateTechnicalError = (error: unknown): string => {
    // Analyser l'erreur pour identifier des patterns connus
    const errorMessage = error?.message || String(error);

    if (errorMessage.includes('Network Error') || errorMessage.includes('Failed to fetch')) {
        return getErrorMessage('network_error');
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        return getErrorMessage('timeout');
    }

    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        return getErrorMessage('unauthorized');
    }

    if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        return getErrorMessage('forbidden');
    }

    if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        return getErrorMessage('not_found');
    }

    if (errorMessage.includes('409') || errorMessage.includes('Conflict')) {
        return getErrorMessage('conflict');
    }

    if (errorMessage.includes('5')) {
        return getErrorMessage('server_error');
    }

    // Par défaut, retourner le message d'erreur original si on ne peut pas le traduire
    return errorMessage;
}; 