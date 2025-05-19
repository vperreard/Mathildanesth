import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { LeaveStatus, LeaveType as PrismaLeaveType, SchoolHolidayPeriod, Leave, ProfessionalRole } from '@prisma/client';
import { LeaveQueryCacheService } from '@/modules/leaves/services/LeaveQueryCacheService';
import { LeaveEvent } from '@/modules/leaves/types/cache';
import { differenceInCalendarDays, isWeekend, parseISO, max, min } from 'date-fns';
import { calculateCountedDays } from '@/modules/leaves/utils/dateCalculations';
import { leaveAlertThresholds } from '@/config/leaveAlertThresholds';

/**
 * @typedef {Object} BatchLeaveInput
 * @property {number} userId - ID de l'utilisateur pour qui créer le congé.
 * @property {string} startDate - Date de début du congé (format ISO YYYY-MM-DD).
 * @property {string} endDate - Date de fin du congé (format ISO YYYY-MM-DD).
 * @property {string} typeCode - Code du type de congé (doit correspondre à un `LeaveTypeSetting.code` actif et sélectionnable, et être une valeur de l'enum Prisma `LeaveType`).
 * @property {string} [reason] - Motif de la demande de congé.
 * @property {string} [comment] - Commentaire additionnel.
 * @property {boolean} [isHalfDay] - Indique si le congé est une demi-journée.
 * @property {'AM' | 'PM'} [halfDayPeriod] - Période de la demi-journée (AM ou PM).
 */
interface BatchLeaveInput {
    userId: number;
    startDate: string;
    endDate: string;
    typeCode: string;
    reason?: string;
    comment?: string;
    isHalfDay?: boolean;
    halfDayPeriod?: 'AM' | 'PM';
}

/**
 * @typedef {Object} AlertInfo
 * @property {string} ruleCode - Code de la règle d'alerte déclenchée.
 * @property {string} message - Message descriptif de l'alerte.
 */
interface AlertInfo {
    ruleCode: string;
    message: string;
}

/**
 * @typedef {Object} BatchResult
 * @property {BatchLeaveInput} input - Les données d'entrée qui ont été traitées.
 * @property {boolean} success - True si la création du congé a réussi, false sinon.
 * @property {string} [leaveId] - ID du congé créé en cas de succès.
 * @property {string} message - Message décrivant le résultat de l'opération (succès ou erreur).
 * @property {Object} [createdLeave] - L'objet congé créé en cas de succès.
 * @property {AlertInfo[]} [alerts] - Tableau des alertes générées pour ce congé.
 */
interface BatchResult {
    input: BatchLeaveInput;
    success: boolean;
    leaveId?: string;
    message: string;
    createdLeave?: Partial<Leave>; // Utiliser Partial<Leave> ou un type plus spécifique
    alerts?: AlertInfo[];
}

// Helper function to check if a date range overlaps with any school holiday period
const isDuringSchoolHolidays = (startDate: Date, endDate: Date, holidayPeriods: SchoolHolidayPeriod[]): boolean => {
    for (const period of holidayPeriods) {
        // Les dates de SchoolHolidayPeriod sont stockées comme DateTime mais représentent des jours entiers.
        // Pour une comparaison correcte, il faut s'assurer de comparer les dates sans tenir compte de l'heure.
        // Ici, on suppose que startDate et endDate de la demande sont déjà des objets Date au début du jour.
        // period.startDate et period.endDate sont directement des objets Date de Prisma.
        const holidayStart = period.startDate; // Already a Date object
        const holidayEnd = period.endDate;   // Already a Date object

        // Check for overlap: max(start_leave, start_holiday) <= min(end_leave, end_holiday)
        if (max([startDate, holidayStart]) <= min([endDate, holidayEnd])) {
            return true;
        }
    }
    return false;
};

/**
 * @api {post} /api/leaves/batch Créer plusieurs demandes de congés en une seule requête.
 * @apiName CreateBatchLeaves
 * @apiGroup Leaves
 * @apiVersion 1.0.0
 *
 * @apiParam {BatchLeaveInput[]} शरीر Tableau d'objets représentant les congés à créer.
 *
 * @apiSuccess (200 OK) {Object[]} results Tableau des résultats pour chaque congé soumis (si tout réussit).
 * @apiSuccess (207 Multi-Status) {Object[]} results Tableau des résultats pour chaque congé soumis (en cas de succès partiels).
 * @apiSuccess {BatchResult} results.result Détail du traitement pour une entrée.
 *
 * @apiSuccessExample {json} Succès total (200 OK):
 * HTTP/1.1 200 OK
 * {
 *   "results": [
 *     { "input": { "userId": 1, "startDate": "2024-09-02", "endDate": "2024-09-02", "typeCode": "ANNUAL" }, "success": true, "leaveId": "clxyz123", "message": "Leave created successfully." },
 *     { "input": { "userId": 2, "startDate": "2024-10-10", "endDate": "2024-10-11", "typeCode": "RTT" }, "success": true, "leaveId": "clxyz456", "message": "Leave created successfully." }
 *   ]
 * }
 *
 * @apiSuccessExample {json} Succès partiel (207 Multi-Status):
 * HTTP/1.1 207 Multi-Status
 * {
 *   "results": [
 *     { "input": { "userId": 1, "startDate": "2024-09-02", "endDate": "2024-09-02", "typeCode": "ANNUAL" }, "success": true, "leaveId": "clxyz123", "message": "Leave created successfully." },
 *     { "input": { "userId": 1, "startDate": "2024-09-02", "endDate": "2024-09-02", "typeCode": "ANNUAL" }, "success": false, "message": "Leave request conflicts with an existing leave for this user." },
 *     { "input": { "userId": 2, "startDate": "2024-08-01", "endDate": "2024-07-30", "typeCode": "RTT" }, "success": false, "message": "endDate cannot be before startDate." }
 *   ]
 * }
 * 
 * @apiError (400 Bad Request) {String} error Message si le corps de la requête est invalide, vide, ou si toutes les soumissions échouent à cause de données invalides.
 * @apiError (500 Internal Server Error) {String} error Message en cas d'erreur serveur non gérée.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const leaveInputs = req.body as BatchLeaveInput[];

    if (!Array.isArray(leaveInputs) || leaveInputs.length === 0) {
        return res.status(400).json({ error: 'Request body must be a non-empty array of leave inputs.' });
    }

    const results: BatchResult[] = [];
    const cacheService = LeaveQueryCacheService.getInstance();
    const usersAndYearsToInvalidate = new Map<number, Set<number>>();

    let minDateOverall = new Date(8640000000000000); // Max possible date
    let maxDateOverall = new Date(-8640000000000000); // Min possible date

    if (leaveInputs.length > 0) {
        leaveInputs.forEach(input => {
            try {
                const startDt = parseISO(input.startDate);
                const endDt = parseISO(input.endDate);
                if (!isNaN(startDt.getTime())) minDateOverall = min([minDateOverall, startDt]);
                if (!isNaN(endDt.getTime())) maxDateOverall = max([maxDateOverall, endDt]);
            } catch (e) { /* ignore invalid dates here, they will be handled later */ }
        });
    }

    let publicHolidaysDates: Date[] = [];
    let schoolHolidayPeriods: SchoolHolidayPeriod[] = [];

    // Check if minDateOverall and maxDateOverall were updated (i.e., at least one valid date was found)
    if (minDateOverall.getFullYear() < new Date(8640000000000000).getFullYear() && maxDateOverall.getFullYear() > new Date(-8640000000000000).getFullYear()) {
        try {
            publicHolidaysDates = (await prisma.publicHoliday.findMany({
                where: { date: { gte: minDateOverall, lte: maxDateOverall } }, // Prisma handles date comparisons correctly
                select: { date: true }
            })).map(ph => ph.date);

            schoolHolidayPeriods = await prisma.schoolHolidayPeriod.findMany({
                where: {
                    // Ensure the period itself overlaps with the overall range of leave requests
                    OR: [
                        { startDate: { lte: maxDateOverall }, endDate: { gte: minDateOverall } }
                    ]
                }
            });
        } catch (error) {
            logger.error("Erreur lors de la récupération des jours fériés ou vacances scolaires", { error });
        }
    }

    const allTypeCodes = Array.from(new Set(leaveInputs.map(input => input.typeCode)));
    let validLeaveTypes: Array<{ code: string, label: string }> = [];
    try {
        validLeaveTypes = await prisma.leaveTypeSetting.findMany({
            where: {
                code: { in: allTypeCodes },
                isActive: true,
                isUserSelectable: true
            },
            select: { code: true, label: true }
        });
    } catch (error) {
        logger.error("Erreur lors de la validation des typeCodes via LeaveTypeSetting", { error });
        return res.status(500).json({ error: "Database error validating leave types." });
    }
    const validTypeCodeSet = new Set(validLeaveTypes.map(lt => lt.code));

    for (const input of leaveInputs) {
        const generatedAlerts: AlertInfo[] = [];
        const { userId, startDate: startDateStr, endDate: endDateStr, typeCode, reason, comment, isHalfDay, halfDayPeriod } = input;

        if (isHalfDay && !halfDayPeriod) {
            results.push({ input, success: false, message: 'halfDayPeriod (AM/PM) is required when isHalfDay is true.' });
            continue;
        }

        if (!userId || !startDateStr || !endDateStr || !typeCode) {
            results.push({ input, success: false, message: 'Missing required fields: userId, startDate, endDate, or typeCode.' });
            continue;
        }

        let startDate: Date, endDate: Date;
        try {
            startDate = parseISO(startDateStr);
            endDate = parseISO(endDateStr); // parseISO creates dates at UTC midnight. Good for day comparisons.
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) throw new Error('Invalid date');
        } catch (e) {
            results.push({ input, success: false, message: 'Invalid date format for startDate or endDate.' });
            continue;
        }

        if (endDate < startDate) {
            results.push({ input, success: false, message: 'endDate cannot be before startDate.' });
            continue;
        }

        if (!validTypeCodeSet.has(typeCode)) {
            results.push({ input, success: false, message: `Invalid or non-selectable leave typeCode: ${typeCode}.` });
            continue;
        }

        if (isHalfDay && startDate.getTime() !== endDate.getTime()) {
            results.push({ input, success: false, message: 'For a half-day leave, startDate and endDate must be the same.' });
            continue;
        }

        try {
            const overlappingLeaves = await prisma.leave.count({
                where: {
                    userId: userId,
                    status: { notIn: [LeaveStatus.CANCELLED, LeaveStatus.REJECTED] },
                    // Simplified overlap condition:
                    // A leave overlaps if its start is before or same as new leave's end,
                    // AND its end is after or same as new leave's start.
                    startDate: { lte: endDate },
                    endDate: { gte: startDate }
                }
            });

            if (overlappingLeaves > 0) {
                results.push({ input, success: false, message: 'Leave request conflicts with an existing leave for this user.' });
                continue;
            }
        } catch (error) {
            logger.error('Error checking for overlapping leaves', { error, userId, startDate, endDate });
            results.push({ input, success: false, message: 'Database error checking for conflicts.' });
            continue;
        }

        const countedDays = calculateCountedDays(startDate, endDate, true, publicHolidaysDates, isHalfDay, halfDayPeriod);

        if (countedDays <= 0) {
            if (isHalfDay) {
                results.push({ input, success: false, message: 'Half-day leave falls on a non-working day (weekend or public holiday).' });
                continue;
            }
            if (differenceInCalendarDays(endDate, startDate) === 0) { // Single day leave
                const holidaySetForSingleDate = new Set(publicHolidaysDates.map(ph => ph.toISOString().split('T')[0]));
                if (isWeekend(startDate) || holidaySetForSingleDate.has(startDate.toISOString().split('T')[0])) {
                    results.push({ input, success: false, message: 'Single day leave falls on a weekend or public holiday.' });
                    continue;
                }
            }
            // For multi-day leaves resulting in 0 counted days
            if (startDate < endDate && countedDays <= 0) {
                results.push({ input, success: false, message: 'Leave period results in 0 counted days (e.g., only weekends and/or public holidays).' });
                continue;
            }
            // If still 0 for a single day not caught above, it's an issue calculateCountedDays should ideally prevent if dates are valid.
        }

        let newLeave: Leave;
        try {
            newLeave = await prisma.leave.create({
                data: {
                    userId,
                    startDate,
                    endDate,
                    type: typeCode as PrismaLeaveType,
                    typeCode,
                    status: LeaveStatus.PENDING,
                    reason,
                    comment,
                    countedDays,
                    isHalfDay: isHalfDay || false,
                    halfDayPeriod: isHalfDay ? halfDayPeriod : null,
                    requestDate: new Date(),
                },
            });

            // --- Alert Generation Logic ---
            try {
                const userWithRole = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { professionalRole: true } // Select the enum field
                });

                // Check if the user is MAR or IADE (using ProfessionalRole enum values)
                if (userWithRole && (userWithRole.professionalRole === ProfessionalRole.MAR || userWithRole.professionalRole === ProfessionalRole.IADE)) {
                    const currentUserRole = userWithRole.professionalRole;
                    const duringHolidays = isDuringSchoolHolidays(startDate, endDate, schoolHolidayPeriods);
                    const thresholds = duringHolidays ? leaveAlertThresholds.DURING_SCHOOL_HOLIDAYS : leaveAlertThresholds.OFF_SCHOOL_HOLIDAYS;

                    // Count other MARs/IADEs on leave during the same period
                    const otherLeavesInPeriod = await prisma.leave.findMany({
                        where: {
                            // NOT: { id: newLeave.id }, // No need to exclude, newLeave isn't APPROVED/PENDING yet in this transaction context for others
                            userId: { not: userId }, // Exclude the current user from this specific count
                            status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
                            startDate: { lte: endDate }, // Overlap condition
                            endDate: { gte: startDate },  // Overlap condition
                            user: {
                                professionalRole: { in: [ProfessionalRole.MAR, ProfessionalRole.IADE] }
                            }
                        },
                        select: { user: { select: { professionalRole: true } } }
                    });

                    let marOnLeaveCount = (currentUserRole === ProfessionalRole.MAR) ? 1 : 0;
                    let iadeOnLeaveCount = (currentUserRole === ProfessionalRole.IADE) ? 1 : 0;

                    otherLeavesInPeriod.forEach(leaf => {
                        if (leaf.user?.professionalRole === ProfessionalRole.MAR) marOnLeaveCount++;
                        if (leaf.user?.professionalRole === ProfessionalRole.IADE) iadeOnLeaveCount++;
                    });

                    const totalMarIadeOnLeaveCount = marOnLeaveCount + iadeOnLeaveCount;

                    const createAlert = async (ruleCode: string, message: string) => {
                        generatedAlerts.push({ ruleCode, message });
                        await prisma.leaveRequestAlert.create({
                            data: { leaveId: newLeave.id, ruleCode, messageDetails: message }
                        });
                    };

                    if (marOnLeaveCount > thresholds.MAX_MAR) {
                        await createAlert(
                            `MAR_THRESHOLD_${duringHolidays ? 'HOLIDAYS' : 'OFF_HOLIDAYS'}_EXCEEDED`,
                            `Seuil MAR dépassé (${marOnLeaveCount} / ${thresholds.MAX_MAR}) ${duringHolidays ? 'pendant' : 'hors'} vacances scolaires.`
                        );
                    }
                    if (iadeOnLeaveCount > thresholds.MAX_IADE) {
                        await createAlert(
                            `IADE_THRESHOLD_${duringHolidays ? 'HOLIDAYS' : 'OFF_HOLIDAYS'}_EXCEEDED`,
                            `Seuil IADE dépassé (${iadeOnLeaveCount} / ${thresholds.MAX_IADE}) ${duringHolidays ? 'pendant' : 'hors'} vacances scolaires.`
                        );
                    }
                    if (totalMarIadeOnLeaveCount > thresholds.MAX_TOTAL_MAR_IADE) {
                        // Check if this specific alert hasn't been created by individual MAR/IADE threshold checks, to avoid redundant total alerts if one role already triggered it
                        const alreadyAlertedForTotalImplicitly =
                            (marOnLeaveCount > thresholds.MAX_MAR && thresholds.MAX_MAR + iadeOnLeaveCount > thresholds.MAX_TOTAL_MAR_IADE && currentUserRole === ProfessionalRole.MAR) ||
                            (iadeOnLeaveCount > thresholds.MAX_IADE && thresholds.MAX_IADE + marOnLeaveCount > thresholds.MAX_TOTAL_MAR_IADE && currentUserRole === ProfessionalRole.IADE);

                        // This logic for alreadyAlertedForTotalImplicitly might be too complex or not fully cover all edge cases.
                        // Simpler: always raise total if total is breached, even if individual was breached. Admins can see multiple alerts.
                        // For now, let's raise it if the total is breached.
                        await createAlert(
                            `TOTAL_MAR_IADE_THRESHOLD_${duringHolidays ? 'HOLIDAYS' : 'OFF_HOLIDAYS'}_EXCEEDED`,
                            `Seuil total MAR+IADE dépassé (${totalMarIadeOnLeaveCount} / ${thresholds.MAX_TOTAL_MAR_IADE}) ${duringHolidays ? 'pendant' : 'hors'} vacances scolaires.`
                        );
                    }
                }
            } catch (alertError) {
                logger.error('Error generating or saving leave request alerts', { error: alertError, leaveId: newLeave.id });
                // Do not fail leave creation due to alert error
            }
            // --- End of Alert Generation Logic ---

            results.push({
                input,
                success: true,
                leaveId: newLeave.id,
                message: 'Leave created successfully.',
                createdLeave: { id: newLeave.id, userId: newLeave.userId, startDate: newLeave.startDate, endDate: newLeave.endDate, typeCode: newLeave.typeCode, status: newLeave.status, countedDays: newLeave.countedDays },
                alerts: generatedAlerts.length > 0 ? generatedAlerts : undefined
            });

            const yearStart = startDate.getFullYear();
            const yearEnd = endDate.getFullYear();
            if (!usersAndYearsToInvalidate.has(userId)) {
                usersAndYearsToInvalidate.set(userId, new Set());
            }
            usersAndYearsToInvalidate.get(userId)?.add(yearStart);
            if (yearStart !== yearEnd) {
                usersAndYearsToInvalidate.get(userId)?.add(yearEnd);
            }

        } catch (error: any) {
            logger.error('Error creating leave in database', { error, input });
            results.push({ input, success: false, message: error.message || 'Database error creating leave.' });
            continue;
        }
    }

    usersAndYearsToInvalidate.forEach((years, userId) => {
        years.forEach(year => {
            cacheService.invalidateCache(LeaveEvent.BALANCE_UPDATED, { userId: userId.toString(), year: year });
        });
    });

    const allSuccessful = results.every(r => r.success);
    const someSuccessful = results.some(r => r.success);

    if (allSuccessful) {
        return res.status(200).json({ results });
    } else if (someSuccessful) {
        return res.status(207).json({ results });
    } else {
        return res.status(400).json({
            error: 'All leave requests failed. See results for details.',
            results
        });
    }
} 