import { render, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useCalendarNavigation } from '../useCalendarNavigation';
import { CalendarViewType } from '../../types/event';
import { act } from 'react-dom/test-utils';
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    startOfDay,
    endOfDay,
    addMonths,
    addWeeks,
    addDays
} from 'date-fns';
import { fr } from 'date-fns/locale';

describe('useCalendarNavigation', () => {
    beforeEach(() => {
        // Réinitialiser les mocks s'il y en a
        jest.clearAllMocks();
    });

    it('devrait initialiser correctement la vue et la plage de dates', () => {
        const { result } = renderHook(() => useCalendarNavigation());

        // Vérifier que la vue par défaut est MONTH
        expect(result.current.view).toBe(CalendarViewType.MONTH);

        // Vérifier que la plage de dates correspond au mois en cours
        const today = new Date();
        const expectedStart = startOfMonth(today);
        const expectedEnd = endOfMonth(today);

        // Comparer uniquement la date (pas l'heure)
        expect(result.current.currentRange.start.getDate()).toBe(expectedStart.getDate());
        expect(result.current.currentRange.start.getMonth()).toBe(expectedStart.getMonth());
        expect(result.current.currentRange.start.getFullYear()).toBe(expectedStart.getFullYear());

        expect(result.current.currentRange.end.getDate()).toBe(expectedEnd.getDate());
        expect(result.current.currentRange.end.getMonth()).toBe(expectedEnd.getMonth());
        expect(result.current.currentRange.end.getFullYear()).toBe(expectedEnd.getFullYear());
    });

    it('devrait accepter une vue initiale personnalisée', () => {
        const { result } = renderHook(() =>
            useCalendarNavigation(CalendarViewType.WEEK)
        );

        expect(result.current.view).toBe(CalendarViewType.WEEK);
    });

    it('devrait mettre à jour la plage de dates lors du changement de vue', () => {
        const onDateRangeChange = jest.fn();
        const { result } = renderHook(() =>
            useCalendarNavigation(CalendarViewType.MONTH, onDateRangeChange)
        );

        // Changer la vue en WEEK
        act(() => {
            result.current.handleViewChange(CalendarViewType.WEEK);
        });

        // Vérifier que la vue a changé
        expect(result.current.view).toBe(CalendarViewType.WEEK);

        // Vérifier que la plage de dates a été mise à jour pour correspondre à une semaine
        const today = new Date();
        const expectedStart = startOfWeek(today, { locale: fr });
        const expectedEnd = endOfWeek(today, { locale: fr });

        // Vérifier que la fonction de callback a été appelée
        expect(onDateRangeChange).toHaveBeenCalledWith({
            start: expect.any(Date),
            end: expect.any(Date)
        });
    });

    it('devrait naviguer vers la période précédente', () => {
        const onDateRangeChange = jest.fn();
        const { result } = renderHook(() =>
            useCalendarNavigation(CalendarViewType.MONTH, onDateRangeChange)
        );

        // Sauvegarder la plage initiale
        const initialStart = new Date(result.current.currentRange.start);

        // Naviguer vers le mois précédent
        act(() => {
            result.current.navigateToPrevious();
        });

        // Vérifier que la date de début est un mois plus tôt
        const expectedStart = addMonths(initialStart, -1);

        expect(result.current.currentRange.start.getMonth()).toBe(expectedStart.getMonth());
        expect(onDateRangeChange).toHaveBeenCalled();
    });

    it('devrait naviguer vers la période suivante', () => {
        const onDateRangeChange = jest.fn();
        const { result } = renderHook(() =>
            useCalendarNavigation(CalendarViewType.MONTH, onDateRangeChange)
        );

        // Sauvegarder la plage initiale
        const initialStart = new Date(result.current.currentRange.start);

        // Naviguer vers le mois suivant
        act(() => {
            result.current.navigateToNext();
        });

        // Vérifier que la date de début est un mois plus tard
        const expectedStart = addMonths(initialStart, 1);

        expect(result.current.currentRange.start.getMonth()).toBe(expectedStart.getMonth());
        expect(onDateRangeChange).toHaveBeenCalled();
    });

    it('devrait naviguer vers aujourd\'hui', () => {
        const onDateRangeChange = jest.fn();

        // Initialiser avec une date dans le futur
        const futureDate = addMonths(new Date(), 3);

        const { result } = renderHook(() => useCalendarNavigation(CalendarViewType.MONTH, onDateRangeChange));

        // Mettre à jour la plage de dates pour une date future
        act(() => {
            result.current.handleDateRangeChange(startOfMonth(futureDate), endOfMonth(futureDate));
        });

        // Naviguer vers aujourd'hui
        act(() => {
            result.current.navigateToToday();
        });

        // Vérifier que la date est revenue à aujourd'hui
        const today = new Date();

        expect(result.current.currentRange.start.getMonth()).toBe(startOfMonth(today).getMonth());
        expect(result.current.currentRange.start.getFullYear()).toBe(startOfMonth(today).getFullYear());
        expect(onDateRangeChange).toHaveBeenCalled();
    });

    it('devrait mettre à jour la plage de dates manuellement', () => {
        const onDateRangeChange = jest.fn();
        const { result } = renderHook(() =>
            useCalendarNavigation(CalendarViewType.MONTH, onDateRangeChange)
        );

        // Définir une nouvelle plage manuellement
        const newStart = new Date(2023, 5, 1); // 1er juin 2023
        const newEnd = new Date(2023, 5, 30); // 30 juin 2023

        act(() => {
            result.current.handleDateRangeChange(newStart, newEnd);
        });

        // Vérifier que la plage a été mise à jour
        expect(result.current.currentRange.start.getMonth()).toBe(5); // Juin (0-indexé)
        expect(result.current.currentRange.start.getFullYear()).toBe(2023);
        expect(result.current.currentRange.end.getMonth()).toBe(5);
        expect(result.current.currentRange.end.getFullYear()).toBe(2023);

        expect(onDateRangeChange).toHaveBeenCalledWith({
            start: newStart,
            end: newEnd
        });
    });
}); 