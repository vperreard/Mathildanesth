import { CalendarFilters } from '../types/event';

/**
 * Interface pour une plage de dates
 */
export interface DateRange {
    start: Date;
    end: Date;
}

/**
 * Crée une clé de cache unique basée sur les filtres
 * Utilisé pour indexer le cache des événements
 */
export function createCacheKey(filters: CalendarFilters): string {
    // Pour simplifité, on utilise une version simplifiée des filtres
    // sans les dates qui sont traitées séparément via isDateRangeOverlapping
    const {
        eventTypes = [],
        userIds = [],
        userRoles = [],
        teamIds = [],
        locationIds = [],
        specialtyIds = [],
        dateRange
    } = filters;

    // Créer des représentations de chaîne pour chaque filtre
    const parts = [
        eventTypes.sort().join(','),
        userIds.sort().join(','),
        userRoles.sort().join(','),
        teamIds.sort().join(','),
        locationIds.sort().join(','),
        specialtyIds.sort().join(','),
        dateRange ? `${dateRange.start.toISOString()}_${dateRange.end.toISOString()}` : ''
    ];

    // Créer une clé unique
    return parts.join('|');
}

/**
 * Vérifie si deux plages de dates se chevauchent
 */
export function isDateRangeOverlapping(range1: DateRange, range2: DateRange): boolean {
    // Si l'une des plages est vide, elles ne se chevauchent pas
    if (!range1 || !range2) return false;

    // Vérifier si les plages se chevauchent
    // (début de range1 <= fin de range2) ET (fin de range1 >= début de range2)
    return (
        range1.start.getTime() <= range2.end.getTime() &&
        range1.end.getTime() >= range2.start.getTime()
    );
}

/**
 * Vérifie si une date est dans une plage donnée (inclusivement)
 */
export function isDateInRange(date: Date, range: DateRange): boolean {
    const timestamp = date.getTime();
    return timestamp >= range.start.getTime() && timestamp <= range.end.getTime();
}

/**
 * Formate une plage de dates en texte selon le format de vue
 */
export function formatDateRange(range: DateRange, view: string): string {
    const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    };

    const startStr = range.start.toLocaleDateString('fr-FR', options);
    const endStr = range.end.toLocaleDateString('fr-FR', options);

    // Si même jour, n'afficher qu'une seule date
    if (
        range.start.getDate() === range.end.getDate() &&
        range.start.getMonth() === range.end.getMonth() &&
        range.start.getFullYear() === range.end.getFullYear()
    ) {
        return startStr;
    }

    // Si même mois et année, simplifier l'affichage
    if (
        range.start.getMonth() === range.end.getMonth() &&
        range.start.getFullYear() === range.end.getFullYear()
    ) {
        return `${range.start.getDate()} - ${range.end.getDate()} ${range.start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
    }

    // Sinon, afficher la plage complète
    return `${startStr} - ${endStr}`;
} 