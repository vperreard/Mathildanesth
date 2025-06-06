import { isWeekend } from 'date-fns';

import { logger } from "../../../lib/logger";
/**
 * Calcule le nombre de jours de congé décomptés entre deux dates.
 * Exclut par défaut les week-ends et peut exclure une liste de jours fériés fournis.
 * Gère également les demi-journées.
 *
 * @param {Date} startDate - Date de début de la période.
 * @param {Date} endDate - Date de fin de la période.
 * @param {boolean} [excludeWeekends=true] - Si true, les samedis et dimanches sont exclus du comptage pour les jours pleins.
 * @param {Date[]} [publicHolidays=[]] - Tableau de dates représentant les jours fériés à exclure.
 * @param {boolean} [isHalfDay=false] - Si true, indique une demande de demi-journée. `startDate` et `endDate` doivent être identiques.
 * @param {'AM' | 'PM'} [halfDayPeriod] - Période de la demi-journée (AM ou PM). Requis si `isHalfDay` est true.
 * @returns {number} Le nombre de jours décomptés (par exemple, 0.5 pour une demi-journée valide).
 * 
 * @example
 * // Compte les jours entre le 2024-07-29 (Lundi) et le 2024-08-02 (Vendredi), excluant weekends (aucun dans cet exemple)
 * calculateCountedDays(new Date('2024-07-29'), new Date('2024-08-02'), true, [new Date('2024-08-01')]) // Résultat: 4 (1er août férié)
 * calculateCountedDays(new Date('2024-07-29'), new Date('2024-07-29'), true, [], true, 'AM') // Résultat: 0.5
 */
export function calculateCountedDays(
    startDate: Date,
    endDate: Date,
    excludeWeekends: boolean = true,
    publicHolidays: Date[] = [],
    isHalfDay: boolean = false,
    halfDayPeriod?: 'AM' | 'PM' // Optionnel ici, mais la logique appelante doit s'assurer qu'il est fourni si isHalfDay est true
): number {
    // Normaliser les dates pour éviter les problèmes de fuseau horaire/heure exacte
    // On ne s'intéresse qu'à la date (jour/mois/année)
    const sDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const eDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    if (eDate < sDate) return 0;

    // Créer un Set de strings YYYY-MM-DD pour les jours fériés pour une recherche rapide
    const holidaySet = new Set(publicHolidays.map(ph => {
        const d = new Date(ph.getFullYear(), ph.getMonth(), ph.getDate());
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }));

    // Cas spécial : demi-journée
    if (isHalfDay) {
        // Pour une demi-journée, startDate et endDate doivent être le même jour.
        // La logique appelante (API batch.ts) vérifie déjà cette contrainte.
        const sameDate = sDate.getTime() === eDate.getTime();

        if (!sameDate) {
            logger.warn("Option demi-journée spécifiée mais dates différentes. Option ignorée.");
            // Utiliser la logique des jours complets
        } else {
            const dayStr = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}-${String(sDate.getDate()).padStart(2, '0')}`;

            let isCounted = true;
            if (excludeWeekends && isWeekend(sDate)) {
                isCounted = false;
            }
            if (isCounted && holidaySet.has(dayStr)) {
                isCounted = false;
            }

            // Si la date est un jour ouvré et non férié, compter 0.5
            return isCounted ? 0.5 : 0;
        }
    }

    // Logique pour les jours pleins (ou si demi-journée ignorée)
    let count = 0;
    const currentDate = new Date(sDate);

    while (currentDate <= eDate) {
        const currentDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        let isDayCounted = true;

        if (excludeWeekends && isWeekend(currentDate)) {
            isDayCounted = false;
        }

        if (isDayCounted && holidaySet.has(currentDateStr)) {
            isDayCounted = false;
        }

        if (isDayCounted) {
            count++;
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }
    return count;
} 