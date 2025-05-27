import { format } from 'date-fns';
import { publicHolidayService } from '@/modules/leaves/services/publicHolidayService';
import { HolidayEvent, CalendarEventType } from '../types/event';
import { PublicHoliday } from '@/modules/leaves/types/public-holiday';

/**
 * Service pour convertir les jours fériés en événements de calendrier
 */
export class HolidayCalendarService {
    /**
     * Convertit un jour férié en événement de calendrier
     * @param holiday Le jour férié à convertir
     * @returns L'événement de calendrier correspondant
     */
    public static convertToCalendarEvent(holiday: PublicHoliday): HolidayEvent {
        return {
            id: holiday.id || `holiday-${holiday.date}`,
            title: holiday.name,
            start: holiday.date,
            end: holiday.date,
            description: holiday.description,
            type: CalendarEventType.HOLIDAY,
            allDay: true,
            isNational: holiday.isNational,
            regions: holiday.regions,
            country: holiday.country,
            isWorkingDay: holiday.isWorkingDay
        };
    }

    /**
     * Récupère tous les jours fériés dans une plage de dates et les convertit en événements de calendrier
     * @param startDate Date de début (format YYYY-MM-DD)
     * @param endDate Date de fin (format YYYY-MM-DD)
     * @returns Liste des événements de jours fériés
     */
    public static async getHolidayEvents(startDate: string, endDate: string): Promise<HolidayEvent[]> {
        try {
            const holidays = await publicHolidayService.getPublicHolidaysInRange(startDate, endDate);
            return holidays.map(this.convertToCalendarEvent);
        } catch (error) {
            console.error('[HolidayCalendarService] Erreur lors de la récupération des jours fériés:', error);
            return [];
        }
    }

    /**
     * Vérifie si une date est un jour férié
     * @param date La date à vérifier (objet Date ou string YYYY-MM-DD)
     * @returns Promise avec true si c'est un jour férié, false sinon
     */
    public static async isHoliday(date: Date | string): Promise<boolean> {
        try {
            const dateStr = date instanceof Date
                ? format(date, 'yyyy-MM-dd')
                : date;

            return await publicHolidayService.isPublicHoliday(dateStr);
        } catch (error) {
            console.error('[HolidayCalendarService] Erreur lors de la vérification du jour férié:', error);
            return false;
        }
    }
}

export const holidayCalendarService = HolidayCalendarService; 