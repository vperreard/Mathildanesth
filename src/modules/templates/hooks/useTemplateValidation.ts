import { useState, useCallback } from 'react';
import { PlanningTemplate, ValidationResult, ValidationError } from '../types/template';
import { templateValidationService } from '../services/templateValidationService';

/**
 * Hook pour valider une trameModele de planning
 * Permet de valider une trameModele et de récupérer les erreurs/avertissements
 */
export function useTemplateValidation() {
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [isValidating, setIsValidating] = useState<boolean>(false);

    /**
     * Valide une trameModele complète
     */
    const validateTemplate = useCallback((modèle: PlanningTemplate): ValidationResult => {
        setIsValidating(true);
        try {
            const result = templateValidationService.validateTemplate(modèle);
            setValidationResult(result);
            return result;
        } finally {
            setIsValidating(false);
        }
    }, []);

    /**
     * Vérifie si un champ spécifique a des erreurs
     */
    const getFieldErrors = useCallback((fieldPath: string): ValidationError[] => {
        if (!validationResult) return [];

        return validationResult.errors.filter(error =>
            error.field === fieldPath || error.field.startsWith(`${fieldPath}.`) || error.field.startsWith(`${fieldPath}[`)
        );
    }, [validationResult]);

    /**
     * Vérifie si un champ spécifique a des avertissements
     */
    const getFieldWarnings = useCallback((fieldPath: string): ValidationError[] => {
        if (!validationResult) return [];

        return validationResult.warnings.filter(warning =>
            warning.field === fieldPath || warning.field.startsWith(`${fieldPath}.`) || warning.field.startsWith(`${fieldPath}[`)
        );
    }, [validationResult]);

    /**
     * Vérifie si la trameModele est valide (sans erreurs bloquantes)
     */
    const isValid = useCallback((): boolean => {
        return validationResult ? validationResult.isValid : true;
    }, [validationResult]);

    /**
     * Récupère le nombre total d'erreurs et d'avertissements
     */
    const getSummary = useCallback(() => {
        if (!validationResult) return { errorCount: 0, warningCount: 0 };

        return {
            errorCount: validationResult.errors.length,
            warningCount: validationResult.warnings.length
        };
    }, [validationResult]);

    /**
     * Réinitialise l'état de validation
     */
    const resetValidation = useCallback(() => {
        setValidationResult(null);
    }, []);

    return {
        validateTemplate,
        getFieldErrors,
        getFieldWarnings,
        isValid,
        getSummary,
        resetValidation,
        validationResult,
        isValidating
    };
}

export default useTemplateValidation; 