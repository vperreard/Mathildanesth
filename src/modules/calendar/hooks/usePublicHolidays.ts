import { useState, useEffect, useCallback } from 'react';
import { logger } from "../../../lib/logger";
import { format } from 'date-fns';
import { publicHolidayService } from '@/modules/leaves/services/publicHolidayService';
import { holidayCalendarService } from '../services/holidayService';
import { HolidayEvent } from '../types/event';
import { PublicHoliday } from '@/modules/leaves/types/public-holiday';

/**
 * Hook pour charger et gérer les jours fériés
 */
export function usePublicHolidays() {
    const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
    const [holidayEvents, setHolidayEvents] = useState<HolidayEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    /**
     * Charge les jours fériés dans une plage de dates
     */
    const loadHolidays = useCallback(async (startDate: Date, endDate: Date) => {
        setLoading(true);
        setError(null);

        try {
            const startStr = format(startDate, 'yyyy-MM-dd');
            const endStr = format(endDate, 'yyyy-MM-dd');

            // Charger les jours fériés depuis le service
            const publicHolidays = await publicHolidayService.getPublicHolidaysInRange(startStr, endStr);
            setHolidays(publicHolidays);

            // Convertir en événements de calendrier
            const events = await holidayCalendarService.getHolidayEvents(startStr, endStr);
            setHolidayEvents(events);

            return {
                holidays: publicHolidays,
                events
            };
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error('Erreur inconnue');
            setError(error);
            logger.error('Erreur lors du chargement des jours fériés:', { error: error });
            return {
                holidays: [],
                events: []
            };
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Vérifie si une date est un jour férié
     */
    const isHoliday = useCallback(async (date: Date): Promise<boolean> => {
        try {
            return await holidayCalendarService.isHoliday(date);
        } catch (err: unknown) {
            logger.error('Erreur lors de la vérification du jour férié:', { error: err });
            return false;
        }
    }, []);

    /**
     * Récupère les informations d'un jour férié à partir d'une date
     */
    const getHolidayInfo = useCallback((date: Date): PublicHoliday | undefined => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return holidays.find(h => h.date === dateStr);
    }, [holidays]);

    /**
     * Récupère tous les jours fériés d'une année donnée
     */
    const getHolidaysForYear = useCallback(async (year: number) => {
        setLoading(true);

        try {
            const startDate = new Date(year, 0, 1); // 1er janvier
            const endDate = new Date(year, 11, 31); // 31 décembre

            const result = await loadHolidays(startDate, endDate);
            return result.holidays;
        } catch (err: unknown) {
            logger.error(`Erreur lors du chargement des jours fériés pour l'année ${year}:`, err);
            return [];
        } finally {
            setLoading(false);
        }
    }, [loadHolidays]);

    return {
        holidays,
        holidayEvents,
        loading,
        error,
        loadHolidays,
        isHoliday,
        getHolidayInfo,
        getHolidaysForYear
    };
} 