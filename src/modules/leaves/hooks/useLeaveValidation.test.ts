/**
 * Tests pour le hook useLeaveValidation
 * 
 * Ce fichier contient les tests unitaires pour le hook personnalisé useLeaveValidation
 * qui est utilisé pour la validation des demandes de congés.
 * 
 * Les tests couvrent :
 * - Validation de base des congés (dates valides, dans le futur, cohérentes)
 * - Gestion des quotas disponibles
 * - Validation des champs obligatoires
 * - Gestion des messages d'erreur
 * - Périodes d'exclusion (blackout)
 * - Mise à jour du contexte
 * - Gestion des propriétés d'utilisateur null
 * - Réinitialisation des erreurs
 */

import { renderHook, act } from '@testing-library/react';
import { useLeaveValidation } from './useLeaveValidation';
import { addDays, subDays } from 'date-fns';
import { DateValidationErrorType, DateRange } from '../../../hooks/useDateValidation';

describe('useLeaveValidation', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userId = 'user123';
    const startFieldName = `leave_start_${userId}`;
    const endFieldName = `leave_end_${userId}`;

    it('devrait valider une demande de congé correcte', () => {
        const { result } = renderHook(() => useLeaveValidation());

        const startDate = addDays(today, 5); // 5 jours dans le futur
        const endDate = addDays(today, 10); // 10 jours dans le futur

        let isValid;
        act(() => {
            isValid = result.current.validateLeaveRequest(
                startDate,
                endDate,
                userId,
                {
                    minAdvanceNotice: 1
                }
            );
        });

        expect(isValid).toBe(true);
        expect(result.current.hasError(startFieldName)).toBe(false);
        expect(result.current.hasError(endFieldName)).toBe(false);
    });

    it('devrait rejeter une demande avec une date dans le passé', () => {
        const { result } = renderHook(() => useLeaveValidation());

        const startDate = subDays(today, 1); // 1 jour dans le passé
        const endDate = addDays(today, 5); // 5 jours dans le futur

        let isValid;
        act(() => {
            isValid = result.current.validateLeaveRequest(
                startDate,
                endDate,
                userId
            );
        });

        expect(isValid).toBe(false);
        expect(result.current.hasError(startFieldName)).toBe(true);
        expect(result.current.getErrorType(startFieldName)).toBe(DateValidationErrorType.PAST_DATE);
    });

    it('devrait rejeter une demande où la date de fin est avant la date de début', () => {
        const { result } = renderHook(() => useLeaveValidation());

        const startDate = addDays(today, 10); // 10 jours dans le futur
        const endDate = addDays(today, 5); // 5 jours dans le futur

        let isValid;
        act(() => {
            isValid = result.current.validateLeaveRequest(
                startDate,
                endDate,
                userId
            );
        });

        expect(isValid).toBe(false);
        expect(result.current.hasError(startFieldName)).toBe(true);
        expect(result.current.hasError(endFieldName)).toBe(true);
        expect(result.current.getErrorType(startFieldName)).toBe(DateValidationErrorType.START_AFTER_END);
        expect(result.current.getErrorType(endFieldName)).toBe(DateValidationErrorType.START_AFTER_END);
    });

    it('devrait rejeter une demande qui dépasse le quota disponible', () => {
        const { result } = renderHook(() => useLeaveValidation());

        const startDate = addDays(today, 5);
        const endDate = addDays(today, 15); // Demande de 11 jours

        // Définir le contexte avec des jours déjà utilisés
        act(() => {
            result.current.setContext({
                usedDays: 25 // Déjà 25 jours utilisés
            });
        });

        let isValid;
        act(() => {
            isValid = result.current.validateLeaveRequest(
                startDate,
                endDate,
                userId,
                {
                    availableDaysPerYear: 30 // Quota de 30 jours par an
                }
            );
        });

        expect(isValid).toBe(false);
        // Vérifier que le contexte a été mis à jour avec les jours calculés
        expect(result.current.context.totalDaysCount).toBe(11); // 11 jours de congés demandés
        expect(result.current.context.usedDays).toBe(25); // 25 jours déjà utilisés
        expect(result.current.context.remainingDays).toBe(-6); // Dépassement de 6 jours
    });

    it('devrait valider une demande qui respecte le quota disponible', () => {
        const { result } = renderHook(() => useLeaveValidation());

        const startDate = addDays(today, 5);
        const endDate = addDays(today, 6); // Demande de 2 jours

        // Définir le contexte avec des jours déjà utilisés
        act(() => {
            result.current.setContext({
                usedDays: 25 // Déjà 25 jours utilisés
            });
        });

        let isValid;
        act(() => {
            isValid = result.current.validateLeaveRequest(
                startDate,
                endDate,
                userId,
                {
                    availableDaysPerYear: 30 // Quota de 30 jours par an
                }
            );
        });

        expect(isValid).toBe(true);
    });

    it('devrait réinitialiser toutes les erreurs', () => {
        const { result } = renderHook(() => useLeaveValidation());

        // Créer une erreur
        act(() => {
            result.current.validateLeaveRequest(
                subDays(today, 1), // Date passée (invalide)
                addDays(today, 5),
                userId
            );
        });

        // Vérifier que l'erreur existe
        expect(result.current.hasError(startFieldName)).toBe(true);

        // Réinitialiser les erreurs
        act(() => {
            result.current.resetErrors();
        });

        // Vérifier que l'erreur a été effacée
        expect(result.current.hasError(startFieldName)).toBe(false);
    });

    // Tests supplémentaires

    it('devrait rejeter une demande avec dates null ou undefined', () => {
        const { result } = renderHook(() => useLeaveValidation());

        // Test avec date de début null
        let isValid;
        act(() => {
            isValid = result.current.validateLeaveRequest(
                null,
                addDays(today, 5),
                userId
            );
        });

        expect(isValid).toBe(false);
        expect(result.current.hasError(startFieldName)).toBe(true);
        expect(result.current.getErrorType(startFieldName)).toBe(DateValidationErrorType.REQUIRED);

        // Réinitialiser les erreurs
        act(() => {
            result.current.resetErrors();
        });

        // Test avec date de fin undefined
        act(() => {
            isValid = result.current.validateLeaveRequest(
                addDays(today, 1),
                undefined,
                userId
            );
        });

        expect(isValid).toBe(false);
        expect(result.current.hasError(endFieldName)).toBe(true);
        expect(result.current.getErrorType(endFieldName)).toBe(DateValidationErrorType.REQUIRED);
    });

    it('devrait fournir des messages d\'erreur corrects', () => {
        const { result } = renderHook(() => useLeaveValidation());

        // Créer une erreur de date passée
        act(() => {
            result.current.validateLeaveRequest(
                subDays(today, 1),
                addDays(today, 5),
                userId
            );
        });

        // Vérifier le message d'erreur
        expect(result.current.getErrorMessage(startFieldName)).toBe('Les dates passées ne sont pas autorisées');

        // Réinitialiser les erreurs
        act(() => {
            result.current.resetErrors();
        });

        // Créer une erreur de dates inversées
        act(() => {
            result.current.validateLeaveRequest(
                addDays(today, 10),
                addDays(today, 5),
                userId
            );
        });

        // Vérifier les messages d'erreur
        expect(result.current.getErrorMessage(startFieldName)).toBe('La date de début doit être antérieure à la date de fin');
        expect(result.current.getErrorMessage(endFieldName)).toBe('La date de fin doit être postérieure à la date de début');
    });

    it('devrait correctement gérer les périodes d\'exclusion (blackout)', () => {
        const { result } = renderHook(() => useLeaveValidation());

        // Créer une période blackout
        const blackoutStart = addDays(today, 10);
        const blackoutEnd = addDays(today, 15);
        const blackoutPeriod: DateRange = {
            start: blackoutStart,
            end: blackoutEnd
        };

        // Test avec une demande qui ne chevauche pas la période blackout
        let isValid;
        act(() => {
            isValid = result.current.validateLeaveRequest(
                addDays(today, 3),
                addDays(today, 8),
                userId,
                {
                    blackoutPeriods: [blackoutPeriod]
                }
            );
        });

        expect(isValid).toBe(true);
    });

    it('devrait mettre à jour correctement le contexte via setContext', () => {
        const { result } = renderHook(() => useLeaveValidation());

        // État initial
        expect(result.current.context.usedDays).toBeUndefined();

        // Mise à jour du contexte
        act(() => {
            result.current.setContext({
                usedDays: 15,
                remainingDays: 15
            });
        });

        // Vérification du nouveau contexte
        expect(result.current.context.usedDays).toBe(15);
        expect(result.current.context.remainingDays).toBe(15);

        // Mise à jour partielle du contexte
        act(() => {
            result.current.setContext({
                usedDays: 20
            });
        });

        // Vérification que seule la propriété spécifiée a été mise à jour
        expect(result.current.context.usedDays).toBe(20);
        expect(result.current.context.remainingDays).toBe(15);
    });

    it('devrait gérer correctement les propriétés d\'utilisateur null', () => {
        const { result } = renderHook(() => useLeaveValidation());

        const userIdWithNull = 'user_with_null';
        const startFieldNameWithNull = `leave_start_${userIdWithNull}`;
        const endFieldNameWithNull = `leave_end_${userIdWithNull}`;

        // Test avec un userId contenant null
        let isValid;
        act(() => {
            isValid = result.current.validateLeaveRequest(
                addDays(today, 5),
                addDays(today, 10),
                userIdWithNull,
                {
                    minAdvanceNotice: 1
                }
            );
        });

        expect(isValid).toBe(true);
        expect(result.current.hasError(startFieldNameWithNull)).toBe(false);
        expect(result.current.hasError(endFieldNameWithNull)).toBe(false);
    });
}); 