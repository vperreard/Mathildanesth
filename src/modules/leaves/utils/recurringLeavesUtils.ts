import {
    addDays,
    addMonths,
    addWeeks,
    addYears,
    differenceInDays,
    format,
    getDate,
    getDay,
    getWeekOfMonth,
    isAfter,
    isBefore,
    isEqual,
    isWeekend,
    setDate
} from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

import {
    Leave,
    LeaveStatus,
    LeaveType,
    RecurrenceEndType,
    RecurrenceFrequency,
    RecurrencePattern,
    RecurringLeaveRequest
} from '../types/leave';

/**
 * Interface pour les options de génération des dates récurrentes
 */
export interface GenerateRecurringDatesOptions {
    holidays?: Date[];              // Jours fériés à exclure
    maxOccurrences?: number;        // Nombre maximum d'occurrences
    maxGenerationYears?: number;    // Nombre maximum d'années à générer
}

/**
 * Résultat de la génération des occurrences
 */
export interface GenerateRecurringResult {
    occurrences: Leave[];           // Occurrences générées
    totalDays: number;              // Nombre total de jours demandés
    businessDays: number;           // Nombre de jours ouvrables demandés
}

/**
 * Vérifie si une date est un jour férié
 * @param date Date à vérifier
 * @param holidays Liste des jours fériés
 * @returns True si la date est un jour férié
 */
export function isHoliday(date: Date, holidays: Date[] = []): boolean {
    return holidays.some(holiday =>
        isEqual(new Date(holiday.setHours(0, 0, 0, 0)), new Date(date.setHours(0, 0, 0, 0)))
    );
}

/**
 * Génère toutes les occurrences de dates pour une demande de congés récurrente
 * @param baseRequest Demande de congés récurrente
 * @param options Options de génération
 * @returns Les occurrences générées et des statistiques
 * TODO: Intégrer le calcul réel des jours décomptés (`countedDays`) pour chaque occurrence en utilisant `leaveCalculator` et le planning de l'utilisateur.
 * TODO: Améliorer la gestion des conflits pendant la génération des occurrences.
 */
export function generateRecurringDates(
    baseRequest: RecurringLeaveRequest,
    options: GenerateRecurringDatesOptions = {}
): GenerateRecurringResult {
    const {
        holidays = [],
        maxOccurrences = 50,
        maxGenerationYears = 2
    } = options;

    const { patternStartDate, patternEndDate, recurrencePattern } = baseRequest;
    const occurrences: Leave[] = [];

    // Calculer la durée de chaque occurrence (en jours)
    const durationDays = differenceInDays(patternEndDate, patternStartDate) + 1;

    // Date limite pour la génération (éviter les boucles infinies)
    const maxGenerationDate = addYears(new Date(), maxGenerationYears);

    let currentDate = new Date(patternStartDate);
    let occurrenceCount = 0;
    let totalDays = 0;
    let businessDays = 0;

    // Déterminer la fonction d'incrémentation selon la fréquence
    const incrementDate = (date: Date, pattern: RecurrencePattern): Date => {
        switch (pattern.frequency) {
            case RecurrenceFrequency.DAILY:
                return addDays(date, pattern.interval);
            case RecurrenceFrequency.WEEKLY:
                return addWeeks(date, pattern.interval);
            case RecurrenceFrequency.MONTHLY:
                return addMonths(date, pattern.interval);
            case RecurrenceFrequency.YEARLY:
                return addYears(date, pattern.interval);
            default:
                return addDays(date, pattern.interval);
        }
    };

    // Vérifier si une date est valide selon les critères (weekends, jours fériés)
    const isValidDate = (date: Date, pattern: RecurrencePattern): boolean => {
        if (pattern.skipWeekends && isWeekend(date)) {
            return false;
        }

        if (pattern.skipHolidays && isHoliday(date, holidays)) {
            return false;
        }

        return true;
    };

    // Générer les occurrences
    while (
        occurrenceCount < maxOccurrences &&
        (recurrencePattern.endType === RecurrenceEndType.NEVER ||
            (recurrencePattern.endType === RecurrenceEndType.COUNT && occurrenceCount < ((recurrencePattern.endCount ?? recurrencePattern.occurrences) || 0)) ||
            (recurrencePattern.endType === RecurrenceEndType.UNTIL_DATE &&
                (recurrencePattern.endDate && isBefore(currentDate, recurrencePattern.endDate))))
    ) {
        // Vérifier qu'on ne dépasse pas la date maximale de génération
        if (isAfter(currentDate, maxGenerationDate)) {
            break;
        }

        // Pour la récurrence hebdomadaire, vérifier les jours de la semaine spécifiés
        if (
            recurrencePattern.frequency === RecurrenceFrequency.WEEKLY &&
            recurrencePattern.weekdays &&
            recurrencePattern.weekdays.length > 0 &&
            !recurrencePattern.weekdays.includes(currentDate.getDay())
        ) {
            currentDate = addDays(currentDate, 1);
            continue;
        }

        // Pour la récurrence mensuelle, vérifier le jour du mois ou la semaine du mois
        if (recurrencePattern.frequency === RecurrenceFrequency.MONTHLY) {
            if (recurrencePattern.dayOfMonth && getDate(currentDate) !== recurrencePattern.dayOfMonth) {
                currentDate = addDays(currentDate, 1);
                continue;
            }

            if (recurrencePattern.weekOfMonth && getWeekOfMonth(currentDate) !== recurrencePattern.weekOfMonth) {
                currentDate = addDays(currentDate, 1);
                continue;
            }
        }

        // Vérifier si la date est valide (jours fériés, weekends)
        if (!isValidDate(currentDate, recurrencePattern)) {
            currentDate = addDays(currentDate, 1);
            continue;
        }

        // Calculer la date de fin de cette occurrence
        const occurrenceEndDate = addDays(currentDate, durationDays - 1);

        // Créer une occurrence
        const occurrence: Leave = {
            id: uuidv4(),
            userId: baseRequest.userId,
            type: baseRequest.type,
            startDate: new Date(currentDate),
            endDate: new Date(occurrenceEndDate),
            status: LeaveStatus.DRAFT,
            requestDate: new Date(),
            parentRequestId: baseRequest.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            reason: baseRequest.reason,
            comment: baseRequest.comment,
            countedDays: 0 // TODO: Remplacer par le calcul réel des jours décomptés
        };

        occurrences.push(occurrence);
        occurrenceCount++;
        totalDays += durationDays;

        // Calculer les jours ouvrables pour cette occurrence
        let businessDaysForOccurrence = 0;
        let currentCheckDate = new Date(currentDate);

        while (!isAfter(currentCheckDate, occurrenceEndDate)) {
            if (!isWeekend(currentCheckDate) && !isHoliday(currentCheckDate, holidays)) {
                businessDaysForOccurrence++;
            }
            currentCheckDate = addDays(currentCheckDate, 1);
        }

        businessDays += businessDaysForOccurrence;

        // Passer à la prochaine occurrence
        currentDate = incrementDate(currentDate, recurrencePattern);
    }

    return {
        occurrences,
        totalDays,
        businessDays
    };
}

/**
 * Formate une période de récurrence pour affichage
 * @param pattern Modèle de récurrence
 * @returns Description textuelle du template
 */
export function formatRecurrencePattern(pattern: RecurrencePattern): string {
    let description = '';

    // Fréquence et intervalle
    switch (pattern.frequency) {
        case RecurrenceFrequency.DAILY:
            description = pattern.interval === 1
                ? 'Tous les jours'
                : `Tous les ${pattern.interval} jours`;
            break;
        case RecurrenceFrequency.WEEKLY:
            description = pattern.interval === 1
                ? 'Toutes les semaines'
                : `Toutes les ${pattern.interval} semaines`;

            // Ajouter les jours de la semaine
            if (pattern.weekdays && pattern.weekdays.length > 0) {
                const weekdayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
                const days = pattern.weekdays.map(day => weekdayNames[day]).join(', ');
                description += ` (${days})`;
            }
            break;
        case RecurrenceFrequency.MONTHLY:
            description = pattern.interval === 1
                ? 'Tous les mois'
                : `Tous les ${pattern.interval} mois`;

            // Préciser le jour du mois
            if (pattern.dayOfMonth) {
                description += ` le ${pattern.dayOfMonth}`;
            }
            break;
        case RecurrenceFrequency.YEARLY:
            description = pattern.interval === 1
                ? 'Tous les ans'
                : `Tous les ${pattern.interval} ans`;
            break;
    }

    // Condition de fin
    switch (pattern.endType) {
        case RecurrenceEndType.NEVER:
            description += ' (sans fin)';
            break;
        case RecurrenceEndType.COUNT:
            description += ` (${pattern.endCount} occurrence${pattern.endCount !== 1 ? 's' : ''})`;
            break;
        case RecurrenceEndType.UNTIL_DATE:
            if (pattern.endDate) {
                description += ` (jusqu'au ${format(pattern.endDate, 'dd/MM/yyyy')})`;
            }
            break;
    }

    // Options supplémentaires
    const options = [];
    if (pattern.skipWeekends) options.push('weekends exclus');
    if (pattern.skipHolidays) options.push('jours fériés exclus');

    if (options.length > 0) {
        description += ` [${options.join(', ')}]`;
    }

    return description;
} 