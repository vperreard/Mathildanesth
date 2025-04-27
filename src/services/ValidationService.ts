import { Assignment } from '../types/assignment';
import { Doctor } from '../types/doctor';
import { RulesConfiguration } from '../types/rules';
import { ValidationResult, Violation, ViolationType } from '../types/validation';
import { formatDate, getDaysBetween, isSameDay } from '../utils/dateUtils';

/**
 * Service de validation des affectations
 */
export class ValidationService {
    private rulesConfig: RulesConfiguration;

    constructor(rulesConfig: RulesConfiguration) {
        this.rulesConfig = rulesConfig;
    }

    /**
     * Valide un ensemble d'affectations selon les règles configurées
     * @param assignments Liste des affectations à valider
     * @param doctors Liste des médecins
     * @returns Résultat de la validation
     */
    validateAssignments(assignments: Assignment[], doctors: Doctor[]): ValidationResult {
        const violations: Violation[] = [];

        // Vérification des conflits d'horaire
        this.checkSchedulingConflicts(assignments, violations);

        // Vérification du nombre minimum de jours entre les affectations
        this.checkMinDaysBetween(assignments, violations);

        // Vérification du nombre maximum d'affectations par mois
        this.checkMaxAssignmentsPerMonth(assignments, violations);

        // Vérification du nombre maximum d'affectations consécutives
        this.checkMaxConsecutiveAssignments(assignments, violations);

        // Vérification des exigences pour les jours spéciaux
        this.checkSpecialDays(assignments, doctors, violations);

        return {
            isValid: violations.length === 0,
            violations
        };
    }

    /**
     * Vérifie les conflits d'horaire (un médecin ne peut pas être affecté deux fois le même jour)
     */
    private checkSchedulingConflicts(assignments: Assignment[], violations: Violation[]): void {
        const assignmentsByDoctorAndDay = new Map<string, Set<string>>();

        assignments.forEach(assignment => {
            const doctorId = assignment.doctorId;
            const dateStr = formatDate(assignment.date);
            const key = `${doctorId}`;

            if (!assignmentsByDoctorAndDay.has(key)) {
                assignmentsByDoctorAndDay.set(key, new Set());
            }

            const doctorDays = assignmentsByDoctorAndDay.get(key)!;

            if (doctorDays.has(dateStr)) {
                violations.push({
                    type: ViolationType.SCHEDULING_CONFLICT,
                    message: `Le médecin ${doctorId} est affecté plusieurs fois le ${dateStr}`,
                    data: { doctorId, date: dateStr }
                });
            } else {
                doctorDays.add(dateStr);
            }
        });
    }

    /**
     * Vérifie qu'il y a un nombre minimum de jours entre les affectations d'un même médecin
     */
    private checkMinDaysBetween(assignments: Assignment[], violations: Violation[]): void {
        const minDays = this.rulesConfig.minDaysBetweenAssignments;

        // Regrouper les affectations par médecin
        const assignmentsByDoctor = new Map<string, Assignment[]>();

        assignments.forEach(assignment => {
            const doctorId = assignment.doctorId;

            if (!assignmentsByDoctor.has(doctorId)) {
                assignmentsByDoctor.set(doctorId, []);
            }

            assignmentsByDoctor.get(doctorId)!.push(assignment);
        });

        // Vérifier pour chaque médecin
        assignmentsByDoctor.forEach((doctorAssignments, doctorId) => {
            // Trier les affectations par date
            doctorAssignments.sort((a, b) => a.date.getTime() - b.date.getTime());

            // Vérifier les jours entre les affectations
            for (let i = 0; i < doctorAssignments.length - 1; i++) {
                const currentAssignment = doctorAssignments[i];
                const nextAssignment = doctorAssignments[i + 1];

                const daysBetween = getDaysBetween(currentAssignment.date, nextAssignment.date);

                if (daysBetween < minDays) {
                    violations.push({
                        type: ViolationType.MIN_DAYS_BETWEEN_ASSIGNMENTS,
                        message: `Le médecin ${doctorId} a des affectations trop rapprochées (${daysBetween} jours au lieu de ${minDays} minimum)`,
                        data: {
                            doctorId,
                            firstDate: formatDate(currentAssignment.date),
                            secondDate: formatDate(nextAssignment.date),
                            daysBetween,
                            minDaysRequired: minDays
                        }
                    });
                }
            }
        });
    }

    /**
     * Vérifie que le nombre maximum d'affectations par mois n'est pas dépassé
     */
    private checkMaxAssignmentsPerMonth(assignments: Assignment[], violations: Violation[]): void {
        const maxPerMonth = this.rulesConfig.maxAssignmentsPerMonth;

        // Regrouper les affectations par médecin et par mois
        const assignmentsByDoctorAndMonth = new Map<string, Map<string, number>>();

        assignments.forEach(assignment => {
            const doctorId = assignment.doctorId;
            const date = assignment.date;
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

            if (!assignmentsByDoctorAndMonth.has(doctorId)) {
                assignmentsByDoctorAndMonth.set(doctorId, new Map());
            }

            const doctorMonths = assignmentsByDoctorAndMonth.get(doctorId)!;

            if (!doctorMonths.has(monthKey)) {
                doctorMonths.set(monthKey, 0);
            }

            doctorMonths.set(monthKey, doctorMonths.get(monthKey)! + 1);
        });

        // Vérifier pour chaque médecin et chaque mois
        assignmentsByDoctorAndMonth.forEach((doctorMonths, doctorId) => {
            doctorMonths.forEach((count, monthKey) => {
                if (count > maxPerMonth) {
                    const [year, month] = monthKey.split('-').map(Number);

                    violations.push({
                        type: ViolationType.MAX_ASSIGNMENTS_PER_MONTH,
                        message: `Le médecin ${doctorId} a ${count} affectations en ${month}/${year} (maximum: ${maxPerMonth})`,
                        data: {
                            doctorId,
                            year,
                            month,
                            count,
                            maxAllowed: maxPerMonth
                        }
                    });
                }
            });
        });
    }

    /**
     * Vérifie que le nombre maximum d'affectations consécutives n'est pas dépassé
     */
    private checkMaxConsecutiveAssignments(assignments: Assignment[], violations: Violation[]): void {
        const maxConsecutive = this.rulesConfig.maxConsecutiveAssignments;

        // Regrouper les affectations par médecin
        const assignmentsByDoctor = new Map<string, Assignment[]>();

        assignments.forEach(assignment => {
            const doctorId = assignment.doctorId;

            if (!assignmentsByDoctor.has(doctorId)) {
                assignmentsByDoctor.set(doctorId, []);
            }

            assignmentsByDoctor.get(doctorId)!.push(assignment);
        });

        // Vérifier pour chaque médecin
        assignmentsByDoctor.forEach((doctorAssignments, doctorId) => {
            // Trier les affectations par date
            doctorAssignments.sort((a, b) => a.date.getTime() - b.date.getTime());

            let consecutiveCount = 1;
            let consecutiveStart = doctorAssignments[0]?.date;

            for (let i = 0; i < doctorAssignments.length - 1; i++) {
                const currentDate = doctorAssignments[i].date;
                const nextDate = doctorAssignments[i + 1].date;

                // Vérifier si les dates sont consécutives (différence d'un jour)
                const daysDiff = getDaysBetween(currentDate, nextDate);

                if (daysDiff === 1) {
                    consecutiveCount++;

                    if (consecutiveCount > maxConsecutive) {
                        violations.push({
                            type: ViolationType.MAX_CONSECUTIVE_ASSIGNMENTS,
                            message: `Le médecin ${doctorId} a ${consecutiveCount} affectations consécutives (maximum: ${maxConsecutive})`,
                            data: {
                                doctorId,
                                startDate: formatDate(consecutiveStart),
                                endDate: formatDate(nextDate),
                                count: consecutiveCount,
                                maxAllowed: maxConsecutive
                            }
                        });
                        // Ne compter la violation qu'une fois par série
                        break;
                    }
                } else {
                    // Réinitialiser le compteur
                    consecutiveCount = 1;
                    consecutiveStart = nextDate;
                }
            }
        });
    }

    /**
     * Vérifie les exigences pour les jours spéciaux
     */
    private checkSpecialDays(assignments: Assignment[], doctors: Doctor[], violations: Violation[]): void {
        const specialDays = this.rulesConfig.specialDays || [];

        specialDays.forEach(specialDay => {
            const specialDate = new Date(specialDay.date);
            const requiredDoctors = specialDay.requiredDoctors;

            // Compter les médecins affectés ce jour
            const assignedDoctors = assignments.filter(a => isSameDay(a.date, specialDate)).map(a => a.doctorId);

            if (assignedDoctors.length < requiredDoctors) {
                violations.push({
                    type: ViolationType.SPECIAL_DAY_REQUIREMENT,
                    message: `Le jour spécial du ${formatDate(specialDate)} nécessite ${requiredDoctors} médecins, mais seulement ${assignedDoctors.length} sont affectés`,
                    data: {
                        date: formatDate(specialDate),
                        description: specialDay.description,
                        requiredDoctors,
                        assignedCount: assignedDoctors.length,
                        assignedDoctors
                    }
                });
            }
        });
    }
} 