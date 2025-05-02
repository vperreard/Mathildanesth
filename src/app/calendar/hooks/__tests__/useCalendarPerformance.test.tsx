import { renderHook, act } from '@testing-library/react';
import { useCalendarPerformance } from '../useCalendarPerformance';

// Mock de la fonction performance.now()
const originalPerformanceNow = performance.now;
let mockNow = 0;

// Mock de la fonction window.innerWidth
const originalInnerWidth = window.innerWidth;

// Mock de navigator.userAgent
const originalUserAgent = navigator.userAgent;
Object.defineProperty(navigator, 'userAgent', {
    configurable: true,
    value: 'Desktop Browser'
});

describe('useCalendarPerformance', () => {
    beforeAll(() => {
        // Mock de performance.now pour les tests
        performance.now = jest.fn(() => mockNow);

        // Réinitialiser mockNow avant chaque test
        mockNow = 0;
    });

    afterAll(() => {
        // Restaurer les fonctions originales
        performance.now = originalPerformanceNow;

        // Restaurer window.innerWidth
        Object.defineProperty(window, 'innerWidth', {
            configurable: true,
            value: originalInnerWidth
        });

        // Restaurer navigator.userAgent
        Object.defineProperty(navigator, 'userAgent', {
            configurable: true,
            value: originalUserAgent
        });
    });

    beforeEach(() => {
        // Réinitialiser les mocks
        jest.clearAllMocks();
        document.documentElement.classList.remove('calendar-reduced-animations');
        document.documentElement.classList.remove('calendar-simplified-rendering');
    });

    test('initialise les métriques avec des valeurs par défaut', () => {
        const { result } = renderHook(() => useCalendarPerformance());

        expect(result.current.metrics).toEqual({
            renderTime: 0,
            interactionDelay: 0,
            scrollPerformance: 0
        });

        expect(result.current.optimizations).toEqual({
            reducedAnimations: false,
            simplifiedRendering: false,
            lazyLoading: false,
            reduceEventDetails: false
        });
    });

    test('mesure correctement le temps de rendu', () => {
        const { result } = renderHook(() => useCalendarPerformance({ debug: false }));

        // Simuler le début du rendu
        const cleanup = result.current.measureRender();
        mockNow = 50; // 50ms écoulées

        // Simuler la fin du rendu
        if (cleanup) {
            act(() => {
                cleanup();
            });
        }

        // Vérifier que le temps de rendu a été mesuré
        expect(result.current.metrics.renderTime).toBe(50);
    });

    test('mesure correctement le délai d\'interaction', () => {
        const { result } = renderHook(() => useCalendarPerformance());

        // Simuler le début d'une interaction
        act(() => {
            result.current.startInteractionMeasure();
        });

        mockNow = 75; // 75ms écoulées

        // Simuler la fin de l'interaction
        act(() => {
            result.current.endInteractionMeasure();
        });

        // Vérifier que le délai d'interaction a été mesuré
        expect(result.current.metrics.interactionDelay).toBe(75);
    });

    test('applique les optimisations sur mobile', () => {
        // Simuler un appareil mobile
        Object.defineProperty(window, 'innerWidth', {
            configurable: true,
            value: 375 // Taille d'un iPhone
        });

        Object.defineProperty(navigator, 'userAgent', {
            configurable: true,
            value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
        });

        const { result, rerender } = renderHook(() =>
            useCalendarPerformance({ optimizeForMobile: true })
        );

        // Simuler un temps de rendu lent
        act(() => {
            const cleanup = result.current.measureRender();
            mockNow = 120; // 120ms (lent)
            if (cleanup) cleanup();
        });

        // Forcer le re-rendu pour que les optimisations s'appliquent
        rerender();

        // Vérifier que les optimisations ont été appliquées
        expect(result.current.isMobile).toBe(true);
        expect(result.current.optimizations.reducedAnimations).toBe(true);
        expect(result.current.optimizations.simplifiedRendering).toBe(true);
        expect(result.current.optimizations.reduceEventDetails).toBe(true);

        // Vérifier que les classes CSS ont été ajoutées
        expect(document.documentElement.classList.contains('calendar-reduced-animations')).toBe(true);
        expect(document.documentElement.classList.contains('calendar-simplified-rendering')).toBe(true);
    });

    test('n\'applique pas d\'optimisations si optimizeForMobile est false', () => {
        // Simuler un appareil mobile
        Object.defineProperty(window, 'innerWidth', {
            configurable: true,
            value: 375
        });

        const { result, rerender } = renderHook(() =>
            useCalendarPerformance({ optimizeForMobile: false })
        );

        // Simuler un temps de rendu lent
        act(() => {
            const cleanup = result.current.measureRender();
            mockNow = 120;
            if (cleanup) cleanup();
        });

        // Forcer le re-rendu
        rerender();

        // Vérifier que les optimisations n'ont pas été appliquées
        expect(result.current.optimizations.reducedAnimations).toBe(false);
        expect(result.current.optimizations.simplifiedRendering).toBe(false);

        // Vérifier que les classes CSS n'ont pas été ajoutées
        expect(document.documentElement.classList.contains('calendar-reduced-animations')).toBe(false);
        expect(document.documentElement.classList.contains('calendar-simplified-rendering')).toBe(false);
    });
}); 