/**
 * Utilitaires pour la manipulation des dates
 */

import {
    parseISO,
    isValid,
    format,
    isBefore,
    isAfter,
    isEqual,
    startOfDay,
    endOfDay,
    addDays,
    addWeeks,
    addMonths,
    differenceInDays,
    parse,
    addHours,
    isWeekend as isDateWeekendFns,
    getWeek,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval
} from 'date-fns';
import { logger } from "../lib/logger";
import { fr } from 'date-fns/locale'; // Utiliser la locale française pour les formats

// Ré-exporter les fonctions date-fns nécessaires
export { 
  addDays, 
  addWeeks,
  differenceInDays
};

// --- Constantes ---

// Format standard pour l'affichage des dates dans l'UI
export const DEFAULT_DATE_FORMAT = 'dd/MM/yyyy';
// Format standard pour l'affichage des dates et heures
export const DEFAULT_DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
// Format ISO utilisé souvent pour les échanges API
export const ISO_DATE_FORMAT = 'yyyy-MM-dd';

// --- Validation ---

/**
 * Vérifie si une valeur est une instance de Date valide.
 */
export const isValidDateObject = (date: unknown): date is Date => {
    return date instanceof Date && isValid(date);
};

/**
 * Tente de parser une chaîne ou un nombre en Date et vérifie sa validité.
 * Gère les formats ISO et le format par défaut.
 */
export const isValidDateString = (dateString: string | number | null | undefined): boolean => {
    if (dateString === null || dateString === undefined) return false;
    const date = parseDate(dateString);
    return isValidDateObject(date);
};

/**
 * Vérifie si une valeur est une date valide (accepte Date, string ou number).
 * Alias générique pour isValidDateString et isValidDateObject.
 */
export const isValidDate = (date: string | number | Date | null | undefined): boolean => {
    if (date === null || date === undefined) return false;
    if (date instanceof Date) return isValidDateObject(date);
    return isValidDateString(date);
};

// --- Parsing ---

/**
 * Parse une chaîne, un nombre ou une Date en objet Date.
 * Gère les formats ISO courants et le format par défaut (dd/MM/yyyy).
 * Retourne null si le parsing échoue.
 */
export const parseDate = (value: string | number | Date | null | undefined): Date | null => {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) {
        return isValid(value) ? value : null;
    }

    try {
        let parsedDate: Date;
        if (typeof value === 'number') { // Peut être un timestamp
            parsedDate = new Date(value);
        } else {
            // Essayer format ISO (ex: 2023-10-27T10:00:00.000Z)
            parsedDate = parseISO(value);
            if (!isValid(parsedDate)) {
                // Essayer format dd/MM/yyyy
                parsedDate = parse(value, DEFAULT_DATE_FORMAT, new Date());
            }
            if (!isValid(parsedDate)) {
                // Essayer format yyyy-MM-dd (ISO simple)
                parsedDate = parse(value, ISO_DATE_FORMAT, new Date());
            }
        }

        return isValid(parsedDate) ? parsedDate : null;
    } catch (e: unknown) {
        return null;
    }
};

/**
 * Calcule la date de Pâques pour une année donnée en utilisant l'algorithme de Butcher
 * @param year Année pour laquelle calculer la date de Pâques
 * @returns Date correspondant au jour de Pâques pour l'année spécifiée
 */
export function calculateEaster(year: number): Date {
    // Algorithme de Butcher pour calculer la date de Pâques
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0 = janvier
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month, day);
}

// --- Formatage ---

/**
 * Formate une Date, une chaîne ou un nombre en chaîne selon le format spécifié (ou par défaut).
 * Retourne une chaîne vide si la date est invalide.
 */
export const formatDate = (date: string | number | Date | null | undefined, formatString = DEFAULT_DATE_FORMAT): string => {
    const validDate = date instanceof Date ? date : parseDate(date);
    if (!validDate) return '';

    try {
        return format(validDate, formatString, { locale: fr });
    } catch (e: unknown) {
        logger.error("Erreur de formatage de date:", e);
        return '';
    }
};

/**
 * Formate une Date, une chaîne ou un nombre en chaîne date/heure selon le format spécifié (ou par défaut).
 */
export const formatDateTime = (date: string | number | Date | null | undefined, formatString = DEFAULT_DATETIME_FORMAT): string => {
    return formatDate(date, formatString);
};

/**
 * Formate une date pour l'affichage dans l'interface utilisateur
 * @param date La date à formater
 * @param includeTime Si true, inclut l'heure dans le format
 * @returns La date formatée au format localisé français (JJ/MM/AAAA)
 */
export const formatDateForDisplay = (date: string | number | Date | null | undefined, includeTime: boolean = false): string => {
    if (!date) return '';
    return formatDate(date, includeTime ? DEFAULT_DATETIME_FORMAT : DEFAULT_DATE_FORMAT);
};

// --- Comparaison ---

/**
 * Vérifie si la date1 est strictement antérieure à la date2.
 * Retourne false si l'une des dates est invalide.
 */
export const isDateBefore = (date1: string | number | Date | null | undefined, date2: string | number | Date | null | undefined): boolean => {
    const d1 = parseDate(date1);
    const d2 = parseDate(date2);
    return d1 && d2 ? isBefore(d1, d2) : false;
};

/**
 * Vérifie si la date1 est strictement postérieure à la date2.
 * Retourne false si l'une des dates est invalide.
 */
export const isDateAfter = (date1: string | number | Date | null | undefined, date2: string | number | Date | null | undefined): boolean => {
    const d1 = parseDate(date1);
    const d2 = parseDate(date2);
    return d1 && d2 ? isAfter(d1, d2) : false;
};

/**
 * Vérifie si les deux dates représentent le même jour (ignore l'heure).
 * Retourne false si l'une des dates est invalide.
 */
export const areDatesSameDay = (date1: string | number | Date | null | undefined, date2: string | number | Date | null | undefined): boolean => {
    const d1 = parseDate(date1);
    const d2 = parseDate(date2);
    return d1 && d2 ? isEqual(startOfDay(d1), startOfDay(d2)) : false;
};

/**
 * Vérifie si une date est un week-end (samedi ou dimanche).
 * Accepte différents types d'entrée.
 * Retourne false si la date est invalide.
 */
export const isDateWeekend = (date: string | number | Date | null | undefined): boolean => {
    const d = parseDate(date);
    // Utiliser la fonction renommée importée
    return d ? isDateWeekendFns(d) : false;
};

// Export direct pour ceux qui l'utilisent sous le nom isWeekend
export { isDateWeekendFns as isWeekend };

/**
 * Formate une plage de dates
 */
export const formatDateRange = (startDate: Date, endDate: Date, formatStr?: string): string => {
  // Pour les tests qui attendent le format avec le nom du mois
  const detailedFormat = 'd MMMM yyyy';
  const actualFormat = formatStr || detailedFormat;
  
  const start = format(startDate, actualFormat, { locale: fr });
  const end = format(endDate, actualFormat, { locale: fr });
  
  if (start === end) {
    return start;
  }
  
  // Si même année, on peut omettre l'année sur la première date
  if (startDate.getFullYear() === endDate.getFullYear()) {
    const startFormatNoYear = actualFormat === detailedFormat ? 'd MMMM' : actualFormat;
    const startNoYear = format(startDate, startFormatNoYear, { locale: fr });
    return `${startNoYear} - ${end}`;
  }
  
  return `${start} - ${end}`;
};

// --- Manipulation ---

/**
 * Retourne le début du jour (00:00:00) pour une date donnée.
 * Retourne null si la date est invalide.
 */
export const getStartOfDay = (date: string | number | Date | null | undefined): Date | null => {
    const d = parseDate(date);
    return d ? startOfDay(d) : null;
};

/**
 * Retourne la fin du jour (23:59:59.999) pour une date donnée.
 * Retourne null si la date est invalide.
 */
export const getEndOfDay = (date: string | number | Date | null | undefined): Date | null => {
    const d = parseDate(date);
    return d ? endOfDay(d) : null;
};

/**
 * Ajoute un nombre de jours à une date.
 * Retourne null si la date est invalide.
 */
export const addDaysToDate = (date: string | number | Date | null | undefined, amount: number): Date | null => {
    const d = parseDate(date);
    return d ? addDays(d, amount) : null;
};

/**
 * Ajoute un nombre d'heures à une date.
 * Retourne null si la date est invalide.
 */
export const addHoursToDate = (date: string | number | Date | null | undefined, amount: number): Date | null => {
    const d = parseDate(date);
    return d ? addHours(d, amount) : null;
};

/**
 * Calcule la différence en jours entiers entre deux dates.
 * Retourne null si une des dates est invalide.
 */
export const getDifferenceInDays = (dateLeft: string | number | Date | null | undefined, dateRight: string | number | Date | null | undefined): number | null => {
    const d1 = parseDate(dateLeft);
    const d2 = parseDate(dateRight);
    return d1 && d2 ? differenceInDays(d1, d2) : null;
};

/**
 * Calcule le nombre de jours entre deux dates (inclusif)
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
    // Normaliser les dates à minuit pour éviter les problèmes d'heures
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    // Calculer la différence en millisecondes
    const diffTime = Math.abs(end.getTime() - start.getTime());
    // Convertir en jours et ajouter 1 pour inclure les deux dates
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return diffDays;
}

/**
 * Vérifie si deux dates correspondent au même jour
 */
export function isSameDay(date1: Date, date2: Date): boolean {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

/**
 * Obtient le premier jour du mois pour une date donnée
 */
export function getFirstDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Obtient le dernier jour du mois pour une date donnée
 */
export function getLastDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Obtient le numéro de la semaine pour une date donnée (selon la locale fr).
 * Retourne null si la date est invalide.
 */
export const getWeekNumber = (date: string | number | Date | null | undefined): number | null => {
    const d = parseDate(date);
    return d ? getWeek(d, { locale: fr }) : null;
};

/**
 * Obtient le début de la semaine pour une date donnée (selon la locale fr).
 * Retourne null si la date est invalide.
 */
export const getStartOfWeek = (date: string | number | Date | null | undefined): Date | null => {
    const d = parseDate(date);
    return d ? startOfWeek(d, { locale: fr }) : null;
};

/**
 * Obtient la fin de la semaine pour une date donnée (selon la locale fr).
 * Retourne null si la date est invalide.
 */
export const getEndOfWeek = (date: string | number | Date | null | undefined): Date | null => {
    const d = parseDate(date);
    return d ? endOfWeek(d, { locale: fr }) : null;
};

/**
 * Obtient le début du mois pour une date donnée.
 * Retourne null si la date est invalide.
 */
export const getStartOfMonth = (date: string | number | Date | null | undefined): Date | null => {
    const d = parseDate(date);
    return d ? startOfMonth(d) : null;
};

/**
 * Obtient la fin du mois pour une date donnée.
 * Retourne null si la date est invalide.
 */
export const getEndOfMonth = (date: string | number | Date | null | undefined): Date | null => {
    const d = parseDate(date);
    return d ? endOfMonth(d) : null;
};

/**
 * Génère un tableau de toutes les dates dans un intervalle donné.
 * Retourne un tableau vide si les dates sont invalides ou si start > end.
 */
export const getDaysInInterval = (interval: { start: string | number | Date | null | undefined, end: string | number | Date | null | undefined }): Date[] => {
    const start = parseDate(interval.start);
    const end = parseDate(interval.end);
    if (!start || !end || isAfter(start, end)) {
        return [];
    }
    return eachDayOfInterval({ start, end });
};

/**
 * Ajoute un nombre de mois à une date donnée
 * @param date Date à modifier
 * @param months Nombre de mois à ajouter (peut être négatif)
 * @returns Nouvelle date
 */
export const addMonths = (date: Date, months: number): Date => {
    const result = new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
    // Si le jour a changé (par ex: 31 jan -> 3 mars au lieu de 28/29 fév), ajuster
    if (date.getDate() !== result.getDate()) {
        result.setDate(0); // Dernier jour du mois précédent
    }
    return result;
};

/**
 * Vérifie si une date est dans le futur
 * @param date Date à vérifier
 * @returns true si la date est dans le futur
 */
export const isDateInFuture = (date: Date | string | number | null | undefined): boolean => {
    if (!date) return false;
    const parsedDate = parseDate(date);
    if (!parsedDate) return false;

    return isAfter(parsedDate, new Date());
};

/**
 * Calcule le nombre de jours jusqu'à une date donnée
 * @param targetDate Date cible
 * @returns Nombre de jours, ou -1 si la date est dans le passé
 */
export const getDaysUntil = (targetDate: Date | string | number | null | undefined): number => {
    if (!targetDate) return -1;
    const parsedDate = parseDate(targetDate);
    if (!parsedDate) return -1;

    if (isDateInFuture(parsedDate)) {
        const diffInDays = getDifferenceInDays(parsedDate, new Date());
        return diffInDays !== null ? Math.abs(diffInDays) : -1;
    }

    return -1;
};

/**
 * Formate une heure au format HH:mm
 * @param date - La date à formater
 * @returns L'heure formatée en texte
 */
export function formatTime(date: Date | string | number): string {
    if (!date) return '';

    const dateObj = date instanceof Date ? date : new Date(date);
    return format(dateObj, 'HH:mm', { locale: fr });
}

/**
 * Retourne une période de la journée (matin, après-midi) en fonction de l'heure
 * @param date - La date à analyser
 * @returns 'MATIN' ou 'APRES_MIDI'
 */
export function getDayPeriod(date: Date | string | number): 'MATIN' | 'APRES_MIDI' {
    if (!date) return 'MATIN';

    const dateObj = date instanceof Date ? date : new Date(date);
    const hour = dateObj.getHours();

    return hour < 12 ? 'MATIN' : 'APRES_MIDI';
} 