import { renderHook, act, waitFor } from '@testing-library/react';
import { useOperatingRoomPlanning } from '../useOperatingRoomPlanning';
import { blocPlanningService } from '@/services/blocPlanningService';
import { BlocDayPlanning, BlocRoomAssignment, BlocSupervisor } from '@/types/bloc-planning-types';

// Mock du service blocPlanningService
jest.mock('@/services/blocPlanningService', () => ({
    blocPlanningService: {
        getDayPlanning: jest.fn(),
        validateDayPlanning: jest.fn(),
        saveDayPlanning: jest.fn()
    }
}));

describe('useOperatingRoomPlanning Hook', () => {
    // Données pour les tests
    const mockDate = '2023-06-01';
    const mockPlanning: BlocDayPlanning = {
        id: 'planning1',
        date: '2023-06-01',
        salles: [
            {
                id: 'assignment1',
                salleId: 'room1',
                superviseurs: [
                    {
                        id: 'supervisor1',
                        userId: 'user1',
                        role: 'PRINCIPAL',
                        periodes: [{ debut: '08:00', fin: '18:00' }]
                    }
                ]
            },
            {
                id: 'assignment2',
                salleId: 'room2',
                superviseurs: [
                    {
                        id: 'supervisor2',
                        userId: 'user2',
                        role: 'PRINCIPAL',
                        periodes: [{ debut: '08:00', fin: '18:00' }]
                    }
                ]
            }
        ],
        validationStatus: 'BROUILLON'
    };

    const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        infos: []
    };

    // Réinitialiser les mocks avant chaque test
    beforeEach(() => {
        jest.clearAllMocks();

        // Configuration par défaut des mocks
        (blocPlanningService.getDayPlanning as jest.Mock).mockImplementation(
            (date, options = {}) => Promise.resolve(mockPlanning)
        );

        (blocPlanningService.validateDayPlanning as jest.Mock).mockImplementation(
            (planning, options = {}) => Promise.resolve(mockValidationResult)
        );

        (blocPlanningService.saveDayPlanning as jest.Mock).mockImplementation(
            (planning, options = {}) => Promise.resolve(planning)
        );
    });

    test('loadDayPlanning charge le planning pour une date donnée', async () => {
        // Rendre le hook
        const { result } = renderHook(() => useOperatingRoomPlanning());

        // Vérifier l'état initial
        expect(result.current.isLoading).toBe(false);
        expect(result.current.dayPlanning).toBeNull();

        // Appeler loadDayPlanning
        let planningResult;
        let cancelFunction;
        await act(async () => {
            [planningResult, cancelFunction] = await result.current.loadDayPlanning(mockDate);
        });

        // Vérifier que le service a été appelé avec les bons paramètres
        expect(blocPlanningService.getDayPlanning).toHaveBeenCalledWith(
            mockDate,
            expect.objectContaining({ signal: expect.any(AbortSignal) })
        );

        // Vérifier que l'état a été mis à jour
        expect(result.current.isLoading).toBe(false);
        expect(result.current.dayPlanning).toEqual(mockPlanning);

        // Vérifier le retour de la fonction
        expect(planningResult).toEqual(mockPlanning);
        expect(typeof cancelFunction).toBe('function');
    });

    test('validatePlanning valide le planning sans le sauvegarder', async () => {
        // Rendre le hook
        const { result } = renderHook(() => useOperatingRoomPlanning());

        // Appeler validatePlanning
        let validationResult;
        let cancelFunction;
        await act(async () => {
            [validationResult, cancelFunction] = await result.current.validatePlanning(mockPlanning);
        });

        // Vérifier que le service a été appelé avec les bons paramètres
        expect(blocPlanningService.validateDayPlanning).toHaveBeenCalledWith(
            mockPlanning,
            expect.objectContaining({ signal: expect.any(AbortSignal) })
        );

        // Vérifier que l'état a été mis à jour
        expect(result.current.isValidating).toBe(false);
        expect(result.current.validationResult).toEqual(mockValidationResult);

        // Vérifier le retour de la fonction
        expect(validationResult).toEqual(mockValidationResult);
        expect(typeof cancelFunction).toBe('function');
    });

    test('saveDayPlanning sauvegarde le planning avec validation préalable', async () => {
        // Rendre le hook
        const { result } = renderHook(() => useOperatingRoomPlanning());

        // Appeler saveDayPlanning
        let savedPlanning;
        let cancelFunction;
        await act(async () => {
            [savedPlanning, cancelFunction] = await result.current.saveDayPlanning(mockPlanning);
        });

        // Vérifier que les services ont été appelés dans le bon ordre
        expect(blocPlanningService.validateDayPlanning).toHaveBeenCalledWith(
            mockPlanning,
            expect.objectContaining({ signal: expect.any(AbortSignal) })
        );

        expect(blocPlanningService.saveDayPlanning).toHaveBeenCalledWith(
            mockPlanning,
            expect.objectContaining({ signal: expect.any(AbortSignal) })
        );

        // Vérifier que l'état a été mis à jour
        expect(result.current.isSaving).toBe(false);
        expect(result.current.dayPlanning).toEqual(mockPlanning);

        // Vérifier le retour de la fonction
        expect(savedPlanning).toEqual(mockPlanning);
        expect(typeof cancelFunction).toBe('function');
    });

    test('saveDayPlanning ne sauvegarde pas si la validation échoue', async () => {
        // Configurer le mock pour échouer à la validation
        (blocPlanningService.validateDayPlanning as jest.Mock).mockImplementation(
            (planning, options = {}) => Promise.resolve({
                isValid: false,
                errors: [{ message: 'Erreur de validation' }],
                warnings: [],
                infos: []
            })
        );

        // Rendre le hook
        const { result } = renderHook(() => useOperatingRoomPlanning());

        // Appeler saveDayPlanning
        let savedPlanning;
        await act(async () => {
            [savedPlanning] = await result.current.saveDayPlanning(mockPlanning);
        });

        // Vérifier que validate a été appelé mais pas save
        expect(blocPlanningService.validateDayPlanning).toHaveBeenCalled();
        expect(blocPlanningService.saveDayPlanning).not.toHaveBeenCalled();

        // Vérifier que l'état reflète l'erreur
        expect(result.current.isSaving).toBe(false);
        expect(result.current.error).not.toBeNull();
        expect(savedPlanning).toBeNull();
    });

    test('gestion des erreurs lors du chargement du planning', async () => {
        // Configurer le mock pour simuler une erreur
        const errorMessage = 'Erreur lors du chargement du planning';
        (blocPlanningService.getDayPlanning as jest.Mock).mockImplementation(
            (date, options = {}) => Promise.reject(new Error(errorMessage))
        );

        // Rendre le hook
        const { result } = renderHook(() => useOperatingRoomPlanning());

        // Appeler loadDayPlanning
        await act(async () => {
            await result.current.loadDayPlanning(mockDate);
        });

        // Vérifier que l'état reflète l'erreur
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).not.toBeNull();
        expect(result.current.error?.message).toBe(errorMessage);
        expect(result.current.dayPlanning).toBeNull();
    });

    test('gestion des erreurs lors de la validation du planning', async () => {
        // Configurer le mock pour simuler une erreur
        const errorMessage = 'Erreur lors de la validation du planning';
        (blocPlanningService.validateDayPlanning as jest.Mock).mockImplementation(
            (planning, options = {}) => Promise.reject(new Error(errorMessage))
        );

        // Rendre le hook
        const { result } = renderHook(() => useOperatingRoomPlanning());

        // Appeler validatePlanning
        await act(async () => {
            await result.current.validatePlanning(mockPlanning);
        });

        // Vérifier que l'état reflète l'erreur
        expect(result.current.isValidating).toBe(false);
        expect(result.current.error).not.toBeNull();
        expect(result.current.error?.message).toBe(errorMessage);
    });

    test('gestion des erreurs lors de la sauvegarde du planning', async () => {
        // Configurer les mocks pour réussir la validation mais échouer à la sauvegarde
        (blocPlanningService.validateDayPlanning as jest.Mock).mockImplementation(
            (planning, options = {}) => Promise.resolve({
                isValid: true,
                errors: [],
                warnings: [],
                infos: []
            })
        );

        const errorMessage = 'Erreur lors de la sauvegarde du planning';
        (blocPlanningService.saveDayPlanning as jest.Mock).mockImplementation(
            (planning, options = {}) => Promise.reject(new Error(errorMessage))
        );

        // Rendre le hook
        const { result } = renderHook(() => useOperatingRoomPlanning());

        // Appeler saveDayPlanning
        await act(async () => {
            await result.current.saveDayPlanning(mockPlanning);
        });

        // Vérifier que l'état reflète l'erreur
        expect(result.current.isSaving).toBe(false);
        expect(result.current.error).not.toBeNull();
        expect(result.current.error?.message).toBe(errorMessage);
    });

    test('annulation d\'une requête de chargement en cours', async () => {
        // Configurer le mock pour simuler une opération longue
        const mockLoadingFn = jest.fn();
        (blocPlanningService.getDayPlanning as jest.Mock).mockImplementation(
            (date, options = {}) => {
                return new Promise((resolve) => {
                    // Ajouter une fonction pour vérifier si la requête a été annulée
                    if (options.signal) {
                        options.signal.addEventListener('abort', () => {
                            mockLoadingFn('aborted');
                        });
                    }

                    // Simuler une opération longue
                    const timeoutId = setTimeout(() => {
                        mockLoadingFn('completed');
                        resolve(mockPlanning);
                    }, 1000);

                    // Nettoyer le timeout si la requête est annulée
                    if (options.signal) {
                        options.signal.addEventListener('abort', () => {
                            clearTimeout(timeoutId);
                        });
                    }
                });
            }
        );

        // Rendre le hook
        const { result } = renderHook(() => useOperatingRoomPlanning());

        // Appeler loadDayPlanning et récupérer la fonction d'annulation
        let cancelFn: () => void;
        await act(async () => {
            const [, cancel] = await result.current.loadDayPlanning(mockDate);
            cancelFn = cancel;
        });

        // Annuler la requête
        await act(async () => {
            cancelFn();
        });

        // Vérifier que la fonction d'annulation a été appelée
        expect(mockLoadingFn).toHaveBeenCalledWith('aborted');

        // Vérifier que l'état du hook est correct après annulation
        expect(result.current.isLoading).toBe(false);
    });

    test('annulation d\'une requête de validation en cours', async () => {
        // Configurer le mock pour simuler une opération longue
        const mockValidateFn = jest.fn();
        (blocPlanningService.validateDayPlanning as jest.Mock).mockImplementation(
            (planning, options = {}) => {
                return new Promise((resolve) => {
                    // Ajouter une fonction pour vérifier si la requête a été annulée
                    if (options.signal) {
                        options.signal.addEventListener('abort', () => {
                            mockValidateFn('aborted');
                        });
                    }

                    // Simuler une opération longue
                    const timeoutId = setTimeout(() => {
                        mockValidateFn('completed');
                        resolve(mockValidationResult);
                    }, 1000);

                    // Nettoyer le timeout si la requête est annulée
                    if (options.signal) {
                        options.signal.addEventListener('abort', () => {
                            clearTimeout(timeoutId);
                        });
                    }
                });
            }
        );

        // Rendre le hook
        const { result } = renderHook(() => useOperatingRoomPlanning());

        // Appeler validatePlanning et récupérer la fonction d'annulation
        let cancelFn: () => void;
        await act(async () => {
            const [, cancel] = await result.current.validatePlanning(mockPlanning);
            cancelFn = cancel;
        });

        // Annuler la requête
        await act(async () => {
            cancelFn();
        });

        // Vérifier que la fonction d'annulation a été appelée
        expect(mockValidateFn).toHaveBeenCalledWith('aborted');

        // Vérifier que l'état du hook est correct après annulation
        expect(result.current.isValidating).toBe(false);
    });

    test('saveDayPlanning sans validation préalable', async () => {
        // Rendre le hook
        const { result } = renderHook(() => useOperatingRoomPlanning());

        // Appeler saveDayPlanning avec validateBeforeSave = false
        let savedPlanning;
        await act(async () => {
            [savedPlanning] = await result.current.saveDayPlanning(mockPlanning, false);
        });

        // Vérifier que validate n'a pas été appelé mais save oui
        expect(blocPlanningService.validateDayPlanning).not.toHaveBeenCalled();
        expect(blocPlanningService.saveDayPlanning).toHaveBeenCalledWith(
            mockPlanning,
            expect.objectContaining({ signal: expect.any(AbortSignal) })
        );

        // Vérifier l'état et le retour
        expect(result.current.isSaving).toBe(false);
        expect(result.current.dayPlanning).toEqual(mockPlanning);
        expect(savedPlanning).toEqual(mockPlanning);
    });

    test('clearError efface l\'erreur', async () => {
        // Configurer le mock pour simuler une erreur
        (blocPlanningService.getDayPlanning as jest.Mock).mockImplementation(
            (date, options = {}) => Promise.reject(new Error('Erreur test'))
        );

        // Rendre le hook
        const { result } = renderHook(() => useOperatingRoomPlanning());

        // Générer une erreur
        await act(async () => {
            await result.current.loadDayPlanning(mockDate);
        });

        // Vérifier qu'une erreur est présente
        expect(result.current.error).not.toBeNull();

        // Effacer l'erreur
        act(() => {
            result.current.clearError();
        });

        // Vérifier que l'erreur a été effacée
        expect(result.current.error).toBeNull();
    });

    test('clearValidationResult efface le résultat de validation', async () => {
        // Rendre le hook
        const { result } = renderHook(() => useOperatingRoomPlanning());

        // Générer un résultat de validation
        await act(async () => {
            await result.current.validatePlanning(mockPlanning);
        });

        // Vérifier qu'un résultat de validation est présent
        expect(result.current.validationResult).not.toBeNull();

        // Effacer le résultat de validation
        act(() => {
            result.current.clearValidationResult();
        });

        // Vérifier que le résultat de validation a été effacé
        expect(result.current.validationResult).toBeNull();
    });

    test('nettoyage des contrôleurs lors du démontage', async () => {
        // Configurer des mocks pour simuler des opérations longues
        const abortSpy = jest.fn();
        const mockAbortController = {
            signal: { addEventListener: jest.fn(), aborted: false },
            abort: abortSpy
        };

        // Remplacer le constructeur global AbortController
        const originalAbortController = global.AbortController;
        global.AbortController = jest.fn(() => mockAbortController) as any;

        // Rendre le hook et le démonter immédiatement
        const { unmount } = renderHook(() => useOperatingRoomPlanning());
        unmount();

        // Vérifier que le contrôleur n'a pas été appelé (car aucune action n'a été initiée)
        expect(abortSpy).not.toHaveBeenCalled();

        // Restaurer le constructeur original
        global.AbortController = originalAbortController;
    });

    test('plusieurs appels consécutifs à loadDayPlanning annulent les requêtes précédentes', async () => {
        // Configurer un spy pour surveiller les appels à abort
        const abortSpy = jest.fn();

        // Mock d'un controller et signal
        const fakeController = { abort: abortSpy, signal: { addEventListener: jest.fn() } };

        // Remplacer temporairement AbortController global
        const originalAbortController = global.AbortController;
        let controllerInstance = 0;

        // Créer une liste de controllers pour simuler plusieurs appels
        const controllers: any[] = [
            { abort: abortSpy, signal: { addEventListener: jest.fn() } },
            { abort: jest.fn(), signal: { addEventListener: jest.fn() } }
        ];

        global.AbortController = jest.fn().mockImplementation(() => {
            return controllers[controllerInstance++];
        }) as any;

        // Configurer le service pour retourner différentes valeurs selon l'appel
        (blocPlanningService.getDayPlanning as jest.Mock).mockImplementation(
            (date, options = {}) => {
                // Simuler le comportement normal sans accéder à controller.abort
                return Promise.resolve({
                    ...mockPlanning,
                    id: `planning-${date}`
                });
            }
        );

        // Rendre le hook
        const { result } = renderHook(() => useOperatingRoomPlanning());

        // Appeler loadDayPlanning pour deux dates différentes
        await act(async () => {
            await result.current.loadDayPlanning('2023-06-01');
            await result.current.loadDayPlanning('2023-06-02');
        });

        // Vérifier que la requête précédente a été annulée
        expect(abortSpy).toHaveBeenCalledTimes(1);

        // Vérifier que l'état reflète la dernière requête
        expect(result.current.dayPlanning?.id).toBe('planning-2023-06-02');

        // Restaurer le constructeur original
        global.AbortController = originalAbortController;
    });

    test('validatePlanning détecte les erreurs spécifiques aux règles de supervision', async () => {
        // Configurer le mock pour retourner des erreurs de supervision
        const supervisionErrors = {
            isValid: false,
            errors: [
                { code: 'MAX_SALLES_MAR', message: 'Le MAR user1 supervise trop de salles simultanément', details: { userId: 'user1', maxSalles: 2, currentSalles: 3 } },
                { code: 'SUPERVISION_REQUIRED', message: 'La salle room2 n\'a pas de superviseur principal', details: { salleId: 'room2' } }
            ],
            warnings: [
                { code: 'HORS_HORAIRES_NORMAUX', message: 'Supervision en dehors des horaires normaux', details: { debut: '06:00', fin: '08:00' } }
            ],
            infos: []
        };

        (blocPlanningService.validateDayPlanning as jest.Mock).mockImplementation(
            (planning, options = {}) => Promise.resolve(supervisionErrors)
        );

        // Rendre le hook
        const { result } = renderHook(() => useOperatingRoomPlanning());

        // Appeler validatePlanning
        let validationResult;
        await act(async () => {
            [validationResult] = await result.current.validatePlanning(mockPlanning);
        });

        // Vérifier que les erreurs de supervision sont bien détectées
        expect(validationResult).toEqual(supervisionErrors);
        expect(validationResult!.isValid).toBe(false);
        expect(validationResult!.errors).toHaveLength(2);
        expect(validationResult!.errors[0].code).toBe('MAX_SALLES_MAR');
        expect(validationResult!.warnings).toHaveLength(1);
        expect(validationResult!.warnings[0].code).toBe('HORS_HORAIRES_NORMAUX');
    });

    test('saveDayPlanning avec validation échoue pour des erreurs spécifiques', async () => {
        // Configurer le mock pour échouer avec des erreurs spécifiques
        const validationWithSpecificErrors = {
            isValid: false,
            errors: [
                { code: 'CHEVAUCHEMENT_PERIODES', message: 'Périodes de supervision qui se chevauchent pour user1', details: { userId: 'user1', periodes: [{ debut: '08:00', fin: '12:00' }, { debut: '11:00', fin: '14:00' }] } }
            ],
            warnings: [],
            infos: []
        };

        (blocPlanningService.validateDayPlanning as jest.Mock).mockImplementation(
            (planning, options = {}) => Promise.resolve(validationWithSpecificErrors)
        );

        // Rendre le hook
        const { result } = renderHook(() => useOperatingRoomPlanning());

        // Appeler saveDayPlanning
        let savedPlanning;
        await act(async () => {
            [savedPlanning] = await result.current.saveDayPlanning(mockPlanning);
        });

        // Vérifier que la sauvegarde a échoué à cause de l'erreur de chevauchement
        expect(blocPlanningService.validateDayPlanning).toHaveBeenCalled();
        expect(blocPlanningService.saveDayPlanning).not.toHaveBeenCalled();
        expect(savedPlanning).toBeNull();
        expect(result.current.error).not.toBeNull();
        expect(result.current.error?.message).toContain('Le planning contient des erreurs');
    });
}); 