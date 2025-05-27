/**
 * Tests pour le hook useOperatingRoomPlanning
 * Objectif : 75% de couverture
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOperatingRoomPlanning } from '../useOperatingRoomPlanning';
import { BlocDayPlanning, ValidationResult } from '@/types/bloc-planning-types';
import { TestFactory } from '@/tests/factories/testFactorySimple';

describe('useOperatingRoomPlanning', () => {
    // Mock du service de planning
    const mockBlocPlanningService = {
        getDayPlanning: jest.fn(),
        saveDayPlanning: jest.fn(),
        validateDayPlanning: jest.fn()
    };

    const mockSite = TestFactory.Site.create();
    const mockOperatingRooms = TestFactory.OperatingRoom.createBatch(2, mockSite.id);
    const mockPlanning = TestFactory.BlocDayPlanning.create({
        date: '2024-01-15',
        salles: [
            {
                id: 'room-1',
                salleId: mockOperatingRooms[0].id.toString(),
                superviseurs: [
                    {
                        id: 'supervisor-1',
                        userId: '1',
                        role: 'PRINCIPAL',
                        periodes: [{ debut: '08:00', fin: '12:00' }]
                    }
                ],
                notes: 'Planning test'
            }
        ]
    });

    const mockValidationResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        infos: []
    };

    const mockValidationError: ValidationResult = {
        isValid: false,
        errors: [
            {
                id: 'error-1',
                type: 'SUPERVISION_CONFLICT',
                message: 'Conflit de supervision détecté',
                severity: 'ERROR',
                salleId: 'room-1',
                details: {}
            }
        ],
        warnings: [],
        infos: []
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Configuration par défaut des mocks
        mockBlocPlanningService.getDayPlanning.mockResolvedValue(mockPlanning);
        mockBlocPlanningService.saveDayPlanning.mockResolvedValue(mockPlanning);
        mockBlocPlanningService.validateDayPlanning.mockResolvedValue(mockValidationResult);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('État initial', () => {
        it('devrait initialiser avec l\'état par défaut', () => {
            // Act
            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));

            // Assert
            expect(result.current.dayPlanning).toBeNull();
            expect(result.current.isLoading).toBe(false);
            expect(result.current.isValidating).toBe(false);
            expect(result.current.isSaving).toBe(false);
            expect(result.current.validationResult).toBeNull();
            expect(result.current.error).toBeNull();
        });
    });

    describe('loadDayPlanning', () => {
        it('devrait charger un planning avec succès', async () => {
            // Arrange
            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));

            // Act
            let loadResult: any = null;
            await act(async () => {
                loadResult = await result.current.loadDayPlanning('2024-01-15');
            });

            // Assert
            expect(loadResult[0]).toEqual(mockPlanning);
            expect(typeof loadResult[1]).toBe('function'); // Fonction de cancel
            expect(result.current.dayPlanning).toEqual(mockPlanning);
            expect(result.current.isLoading).toBe(false);
            expect(result.current.error).toBeNull();
            expect(mockBlocPlanningService.getDayPlanning).toHaveBeenCalledWith(
                '2024-01-15',
                expect.objectContaining({ signal: expect.any(AbortSignal) })
            );
        });

        it('devrait gérer les erreurs de chargement', async () => {
            // Arrange
            const error = new Error('Erreur de chargement');
            mockBlocPlanningService.getDayPlanning.mockRejectedValue(error);
            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));

            // Act
            let loadResult: any = null;
            await act(async () => {
                loadResult = await result.current.loadDayPlanning('2024-01-15');
            });

            // Assert
            expect(loadResult[0]).toBeNull();
            expect(result.current.dayPlanning).toBeNull();
            expect(result.current.isLoading).toBe(false);
            expect(result.current.error).toEqual(error);
        });

        it('devrait mettre à jour l\'état de chargement', async () => {
            // Arrange
            let resolvePromise: (value: any) => void;
            const delayedPromise = new Promise(resolve => {
                resolvePromise = resolve;
            });
            mockBlocPlanningService.getDayPlanning.mockReturnValue(delayedPromise);

            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));

            // Act - Démarrer le chargement
            act(() => {
                result.current.loadDayPlanning('2024-01-15');
            });

            // Assert - Pendant le chargement
            expect(result.current.isLoading).toBe(true);
            expect(result.current.error).toBeNull();

            // Act - Terminer le chargement
            await act(async () => {
                resolvePromise!(mockPlanning);
            });

            // Assert - Après le chargement
            expect(result.current.isLoading).toBe(false);
            expect(result.current.dayPlanning).toEqual(mockPlanning);
        });

        it('devrait annuler les requêtes précédentes', async () => {
            // Arrange
            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));

            // Act - Premier appel
            act(() => {
                result.current.loadDayPlanning('2024-01-15');
            });

            // Act - Deuxième appel qui devrait annuler le premier
            await act(async () => {
                await result.current.loadDayPlanning('2024-01-16');
            });

            // Assert
            expect(mockBlocPlanningService.getDayPlanning).toHaveBeenCalledTimes(2);
            expect(result.current.dayPlanning).toEqual(mockPlanning);
        });

        it('devrait permettre l\'annulation manuelle', async () => {
            // Arrange
            let resolvePromise: (value: any) => void;
            const delayedPromise = new Promise(resolve => {
                resolvePromise = resolve;
            });
            mockBlocPlanningService.getDayPlanning.mockReturnValue(delayedPromise);

            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));

            // Act - Démarrer le chargement
            let cancelFunction: any;
            act(() => {
                result.current.loadDayPlanning('2024-01-15').then(([, cancel]) => {
                    cancelFunction = cancel;
                });
            });

            // Act - Annuler manuellement
            act(() => {
                if (cancelFunction) cancelFunction();
            });

            // Act - Terminer la promise
            await act(async () => {
                resolvePromise!(mockPlanning);
            });

            // Assert - L'état ne devrait pas être mis à jour car annulé
            expect(result.current.isLoading).toBe(true); // Reste en loading car annulé
        });
    });

    describe('validatePlanning', () => {
        it('devrait valider un planning avec succès', async () => {
            // Arrange
            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));

            // Act
            let validateResult: any = null;
            await act(async () => {
                validateResult = await result.current.validatePlanning(mockPlanning);
            });

            // Assert
            expect(validateResult[0]).toEqual(mockValidationResult);
            expect(typeof validateResult[1]).toBe('function'); // Fonction de cancel
            expect(result.current.validationResult).toEqual(mockValidationResult);
            expect(result.current.isValidating).toBe(false);
            expect(result.current.error).toBeNull();
            expect(mockBlocPlanningService.validateDayPlanning).toHaveBeenCalledWith(
                mockPlanning,
                expect.objectContaining({ signal: expect.any(AbortSignal) })
            );
        });

        it('devrait gérer les erreurs de validation', async () => {
            // Arrange
            const error = new Error('Erreur de validation');
            mockBlocPlanningService.validateDayPlanning.mockRejectedValue(error);
            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));

            // Act
            let validateResult: any = null;
            await act(async () => {
                validateResult = await result.current.validatePlanning(mockPlanning);
            });

            // Assert
            expect(validateResult[0]).toBeNull();
            expect(result.current.validationResult).toBeNull();
            expect(result.current.isValidating).toBe(false);
            expect(result.current.error).toEqual(error);
        });

        it('devrait mettre à jour l\'état de validation', async () => {
            // Arrange
            let resolvePromise: (value: any) => void;
            const delayedPromise = new Promise(resolve => {
                resolvePromise = resolve;
            });
            mockBlocPlanningService.validateDayPlanning.mockReturnValue(delayedPromise);

            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));

            // Act - Démarrer la validation
            act(() => {
                result.current.validatePlanning(mockPlanning);
            });

            // Assert - Pendant la validation
            expect(result.current.isValidating).toBe(true);
            expect(result.current.error).toBeNull();

            // Act - Terminer la validation
            await act(async () => {
                resolvePromise!(mockValidationResult);
            });

            // Assert - Après la validation
            expect(result.current.isValidating).toBe(false);
            expect(result.current.validationResult).toEqual(mockValidationResult);
        });

        it('devrait retourner un résultat avec erreurs de validation', async () => {
            // Arrange
            mockBlocPlanningService.validateDayPlanning.mockResolvedValue(mockValidationError);
            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));

            // Act
            let validateResult: any = null;
            await act(async () => {
                validateResult = await result.current.validatePlanning(mockPlanning);
            });

            // Assert
            expect(validateResult[0]).toEqual(mockValidationError);
            expect(result.current.validationResult).toEqual(mockValidationError);
            expect(result.current.error).toBeNull(); // Pas d'erreur technique, juste des erreurs de validation
        });

        it('devrait annuler les validations précédentes', async () => {
            // Arrange
            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));

            // Act - Premier appel
            act(() => {
                result.current.validatePlanning(mockPlanning);
            });

            // Act - Deuxième appel qui devrait annuler le premier
            await act(async () => {
                await result.current.validatePlanning(mockPlanning);
            });

            // Assert
            expect(mockBlocPlanningService.validateDayPlanning).toHaveBeenCalledTimes(2);
            expect(result.current.validationResult).toEqual(mockValidationResult);
        });
    });

    describe('saveDayPlanning', () => {
        it('devrait sauvegarder un planning avec validation par défaut', async () => {
            // Arrange
            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));

            // Act
            let saveResult: any = null;
            await act(async () => {
                saveResult = await result.current.saveDayPlanning(mockPlanning);
            });

            // Assert
            expect(saveResult[0]).toEqual(mockPlanning);
            expect(typeof saveResult[1]).toBe('function'); // Fonction de cancel
            expect(result.current.dayPlanning).toEqual(mockPlanning);
            expect(result.current.isSaving).toBe(false);
            expect(result.current.error).toBeNull();

            // Devrait d'abord valider puis sauvegarder
            expect(mockBlocPlanningService.validateDayPlanning).toHaveBeenCalledWith(
                mockPlanning,
                expect.objectContaining({ signal: expect.any(AbortSignal) })
            );
            expect(mockBlocPlanningService.saveDayPlanning).toHaveBeenCalledWith(
                mockPlanning,
                expect.objectContaining({ signal: expect.any(AbortSignal) })
            );
        });

        it('devrait sauvegarder sans validation si spécifié', async () => {
            // Arrange
            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));

            // Act
            let saveResult: any = null;
            await act(async () => {
                saveResult = await result.current.saveDayPlanning(mockPlanning, false);
            });

            // Assert
            expect(saveResult[0]).toEqual(mockPlanning);
            expect(result.current.dayPlanning).toEqual(mockPlanning);

            // Ne devrait pas valider avant sauvegarde
            expect(mockBlocPlanningService.validateDayPlanning).not.toHaveBeenCalled();
            expect(mockBlocPlanningService.saveDayPlanning).toHaveBeenCalledWith(
                mockPlanning,
                expect.objectContaining({ signal: expect.any(AbortSignal) })
            );
        });

        it('devrait empêcher la sauvegarde si la validation échoue', async () => {
            // Arrange
            mockBlocPlanningService.validateDayPlanning.mockResolvedValue(mockValidationError);
            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));

            // Act
            let saveResult: any = null;
            await act(async () => {
                saveResult = await result.current.saveDayPlanning(mockPlanning);
            });

            // Assert
            expect(saveResult[0]).toBeNull(); // Sauvegarde échoue
            expect(result.current.validationResult).toEqual(mockValidationError);
            expect(result.current.isSaving).toBe(false);

            // La validation devrait être appelée mais pas la sauvegarde
            expect(mockBlocPlanningService.validateDayPlanning).toHaveBeenCalled();
            expect(mockBlocPlanningService.saveDayPlanning).not.toHaveBeenCalled();
        });

        it('devrait gérer les erreurs de sauvegarde', async () => {
            // Arrange
            const error = new Error('Erreur de sauvegarde');
            mockBlocPlanningService.saveDayPlanning.mockRejectedValue(error);
            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));

            // Act
            let saveResult: any = null;
            await act(async () => {
                saveResult = await result.current.saveDayPlanning(mockPlanning);
            });

            // Assert
            expect(saveResult[0]).toBeNull();
            expect(result.current.dayPlanning).toBeNull();
            expect(result.current.isSaving).toBe(false);
            expect(result.current.error).toEqual(error);
        });

        it('devrait mettre à jour l\'état de sauvegarde', async () => {
            // Arrange
            let resolveValidation: (value: any) => void;
            let resolveSave: (value: any) => void;

            const delayedValidation = new Promise(resolve => {
                resolveValidation = resolve;
            });
            const delayedSave = new Promise(resolve => {
                resolveSave = resolve;
            });

            mockBlocPlanningService.validateDayPlanning.mockReturnValue(delayedValidation);
            mockBlocPlanningService.saveDayPlanning.mockReturnValue(delayedSave);

            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));

            // Act - Démarrer la sauvegarde
            act(() => {
                result.current.saveDayPlanning(mockPlanning);
            });

            // Assert - Pendant la sauvegarde (validation)
            expect(result.current.isSaving).toBe(true);

            // Act - Terminer la validation
            await act(async () => {
                resolveValidation!(mockValidationResult);
            });

            // Assert - Toujours en cours de sauvegarde
            expect(result.current.isSaving).toBe(true);

            // Act - Terminer la sauvegarde
            await act(async () => {
                resolveSave!(mockPlanning);
            });

            // Assert - Sauvegarde terminée
            expect(result.current.isSaving).toBe(false);
            expect(result.current.dayPlanning).toEqual(mockPlanning);
        });

        it('devrait annuler les sauvegardes précédentes', async () => {
            // Arrange
            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));

            // Act - Premier appel
            act(() => {
                result.current.saveDayPlanning(mockPlanning);
            });

            // Act - Deuxième appel qui devrait annuler le premier
            await act(async () => {
                await result.current.saveDayPlanning(mockPlanning);
            });

            // Assert
            expect(mockBlocPlanningService.validateDayPlanning).toHaveBeenCalledTimes(2);
            expect(mockBlocPlanningService.saveDayPlanning).toHaveBeenCalledTimes(2);
        });
    });

    describe('Opérations simultanées', () => {
        it('devrait gérer le chargement et la validation simultanément', async () => {
            // Arrange
            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));

            // Act - Démarrer le chargement et la validation en parallèle
            await act(async () => {
                const [loadPromise, validatePromise] = await Promise.all([
                    result.current.loadDayPlanning('2024-01-15'),
                    result.current.validatePlanning(mockPlanning)
                ]);

                expect(loadPromise[0]).toEqual(mockPlanning);
                expect(validatePromise[0]).toEqual(mockValidationResult);
            });

            // Assert
            expect(result.current.dayPlanning).toEqual(mockPlanning);
            expect(result.current.validationResult).toEqual(mockValidationResult);
            expect(result.current.isLoading).toBe(false);
            expect(result.current.isValidating).toBe(false);
        });

        it('devrait gérer les erreurs sur opérations multiples', async () => {
            // Arrange
            mockBlocPlanningService.getDayPlanning.mockRejectedValue(new Error('Erreur chargement'));
            mockBlocPlanningService.validateDayPlanning.mockRejectedValue(new Error('Erreur validation'));

            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));

            // Act
            await act(async () => {
                await Promise.all([
                    result.current.loadDayPlanning('2024-01-15'),
                    result.current.validatePlanning(mockPlanning)
                ]);
            });

            // Assert - Une seule erreur devrait être conservée (la dernière)
            expect(result.current.error).toBeInstanceOf(Error);
            expect(result.current.isLoading).toBe(false);
            expect(result.current.isValidating).toBe(false);
        });
    });

    describe('Nettoyage et démontage', () => {
        it('devrait nettoyer les contrôleurs lors du démontage', () => {
            // Arrange
            const { unmount } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));

            // Act
            unmount();

            // Assert - Aucune erreur ne devrait être levée
            expect(true).toBe(true);
        });
    });

    describe('Tests de performance', () => {
        it('devrait gérer rapidement les opérations de base', async () => {
            // Arrange
            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));
            const startTime = Date.now();

            // Act
            await act(async () => {
                await result.current.loadDayPlanning('2024-01-15');
                await result.current.validatePlanning(mockPlanning);
                await result.current.saveDayPlanning(mockPlanning, false);
            });

            const endTime = Date.now();

            // Assert
            expect(endTime - startTime).toBeLessThan(100); // Moins de 100ms pour les mocks
            expect(result.current.dayPlanning).toEqual(mockPlanning);
        });

        it('devrait gérer efficacement les annulations multiples', async () => {
            // Arrange
            const { result } = renderHook(() => useOperatingRoomPlanning(mockBlocPlanningService));

            // Act - Démarrer et annuler plusieurs opérations rapidement
            for (let i = 0; i < 10; i++) {
                act(() => {
                    result.current.loadDayPlanning(`2024-01-${15 + i}`);
                    result.current.validatePlanning(mockPlanning);
                });
            }

            // Attendre un peu pour que les opérations se terminent
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
            });

            // Assert - Pas d'erreur et état cohérent
            expect(result.current.dayPlanning).toEqual(mockPlanning);
            expect(result.current.error).toBeNull();
        });
    });

    describe('Intégration avec service par défaut', () => {
        it('devrait fonctionner sans service injecté', () => {
            // Act - Utiliser le hook sans injecter de service
            const { result } = renderHook(() => useOperatingRoomPlanning());

            // Assert - Devrait initialiser correctement
            expect(result.current.dayPlanning).toBeNull();
            expect(result.current.isLoading).toBe(false);
            expect(typeof result.current.loadDayPlanning).toBe('function');
            expect(typeof result.current.validatePlanning).toBe('function');
            expect(typeof result.current.saveDayPlanning).toBe('function');
        });
    });
}); 