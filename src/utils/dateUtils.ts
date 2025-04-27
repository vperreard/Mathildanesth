/**
 * Utilitaires pour la manipulation des dates
 */

/**
 * Formate une date en chaîne de caractères selon le format spécifié
 * Format par défaut: DD/MM/YYYY
 */
export function formatDate(date: Date, format: string = 'DD/MM/YYYY'): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    let formattedDate = format;
    formattedDate = formattedDate.replace('DD', day);
    formattedDate = formattedDate.replace('MM', month);
    formattedDate = formattedDate.replace('YYYY', year.toString());

    return formattedDate;
}

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
 * Ajoute un nombre spécifié de jours à une date
 */
export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Vérifie si une date est un week-end (samedi ou dimanche)
 */
export function isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = dimanche, 6 = samedi
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