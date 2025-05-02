/**
 * Utilitaires pour la gestion des dates
 */

/**
 * Formate une date au format standard français (JJ/MM/AAAA)
 * @param date Date à formater
 * @returns Date formatée en chaîne de caractères (JJ/MM/AAAA)
 */
export function formatDate(date: Date): string {
    if (!date || isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

/**
 * Formate une date avec l'heure (JJ/MM/AAAA HH:MM)
 * @param date Date à formater
 * @returns Date et heure formatées (JJ/MM/AAAA HH:MM)
 */
export function formatDateTime(date: Date): string {
    if (!date || isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Formate une durée en jours (avec décimales pour les demi-journées)
 * @param days Nombre de jours (peut contenir des décimales)
 * @returns Chaîne formatée avec le nombre de jours
 */
export function formatDays(days: number): string {
    if (days === null || days === undefined || isNaN(days)) {
        return '-';
    }

    // Si c'est un nombre entier, ne pas afficher de décimale
    if (Number.isInteger(days)) {
        return `${days} jour${days !== 1 ? 's' : ''}`;
    }

    // Sinon, afficher une décimale (pour les demi-journées)
    return `${days.toFixed(1)} jour${days !== 1 ? 's' : ''}`;
}

/**
 * Vérifie si deux dates sont le même jour
 * @param date1 Première date
 * @param date2 Seconde date
 * @returns true si les dates correspondent au même jour
 */
export function isSameDay(date1: Date, date2: Date): boolean {
    if (!date1 || !date2) {
        return false;
    }
    return (
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
    );
}

/**
 * Calcule la différence en jours entre deux dates
 * @param startDate Date de début
 * @param endDate Date de fin
 * @returns Nombre de jours entre les deux dates (inclus)
 */
export function daysBetween(startDate: Date, endDate: Date): number {
    if (!startDate || !endDate) {
        return 0;
    }

    // Créer des copies des dates sans l'heure pour éviter les problèmes de fuseaux horaires
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    // Ajouter 1 jour pour inclure la date de fin
    const differenceMs = end.getTime() - start.getTime() + 1000 * 60 * 60 * 24;
    return Math.ceil(differenceMs / (1000 * 60 * 60 * 24));
} 