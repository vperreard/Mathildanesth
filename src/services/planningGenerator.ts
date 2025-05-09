import {
    Assignment,
    AssignmentType,
    GenerationParameters,
    RuleViolation,
    ValidationResult,
    UserCounter,
    AssignmentStatus
} from '../types/assignment';
import { ShiftType } from '../types/common';
import { User, WeekType, Leave } from '../types/user';
import { RulesConfiguration, FatigueConfig, defaultRulesConfiguration, defaultFatigueConfig, RuleSeverity } from '../types/rules';
import { PlanningOptimizer } from './planningOptimizer';
import {
    parseDate,
    addDaysToDate,
    formatDate,
    ISO_DATE_FORMAT,
    areDatesSameDay,
    getDifferenceInDays,
    addHoursToDate
} from '@/utils/dateUtils';
import { differenceInDays } from 'date-fns';
// import { fetchFatigueConfig } from '@/app/parametres/configuration/fatigue/page'; // !! Temporairement commenté !!

// Simulation Logger
const logger = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    debug: console.debug
}

/**
 * Service principal de génération de planning
 */
export class PlanningGenerator {
    private parameters: GenerationParameters;
    private personnel: User[] = [];
    private rulesConfig: RulesConfiguration;
    private fatigueConfig: FatigueConfig;
    private existingAssignments: Assignment[] = [];
    private userCounters: Map<string, UserCounter> = new Map();
    private isInitialized: boolean = false;
    private results: {
        gardes: Assignment[];
        astreintes: Assignment[];
        consultations: Assignment[];
        blocs: Assignment[];
    };

    constructor(
        parameters: GenerationParameters,
        rulesConfig: RulesConfiguration = defaultRulesConfiguration,
        fatigueConfig: FatigueConfig = defaultFatigueConfig
    ) {
        this.parameters = parameters;
        this.rulesConfig = rulesConfig;
        this.fatigueConfig = fatigueConfig;
        this.results = {
            gardes: [],
            astreintes: [],
            consultations: [],
            blocs: []
        };
    }

    /**
     * Initialiser le générateur en chargeant les données nécessaires
     * y compris la configuration dynamique de la fatigue.
     */
    async initialize(personnel: User[], existingAssignments: Assignment[] = []): Promise<void> {
        this.personnel = personnel;
        this.existingAssignments = existingAssignments;
        this.initializeUserCounters();
        this.isInitialized = true;
        logger.log("PlanningGenerator initialized.");
    }

    private initializeUserCounters(): void {
        this.userCounters.clear();
        this.personnel.forEach(user => {
            this.userCounters.set(String(user.id), {
                userId: String(user.id),
                gardes: { total: 0, weekends: 0, feries: 0, noel: 0 },
                astreintes: { total: 0, semaine: 0, weekendFeries: 0 },
                consultations: { total: 0, matin: 0, apresmidi: 0 },
                fatigue: { score: 0, lastUpdate: new Date() }
            });
        });
        this.existingAssignments.forEach(assignment => {
            const counter = this.userCounters.get(String(assignment.userId));
            if (counter) {
                this.updateCounterForAssignment(counter, assignment, true);
            }
        });
    }

    private updateCounterForAssignment(counter: UserCounter, assignment: Assignment, isExisting: boolean = false): void {
        const date = parseDate(assignment.startDate);
        if (!date) return;

        const isWeekendDay = date.getDay() === 0 || date.getDay() === 6;
        const isHolidayDay = false;
        const isWeekendOrHoliday = isWeekendDay || isHolidayDay;

        switch (assignment.shiftType) {
            case ShiftType.GARDE_24H:
                counter.gardes.total++;
                if (isWeekendDay) counter.gardes.weekends++;
                if (isHolidayDay) counter.gardes.feries++;
                break;
            case ShiftType.ASTREINTE:
                counter.astreintes.total++;
                if (isWeekendOrHoliday) counter.astreintes.weekendFeries++;
                else counter.astreintes.semaine++;
                break;
            case ShiftType.MATIN:
                counter.consultations.total++;
                counter.consultations.matin++;
                break;
            case ShiftType.APRES_MIDI:
                counter.consultations.total++;
                counter.consultations.apresmidi++;
                break;
        }

        if (!isExisting && this.fatigueConfig && this.fatigueConfig.enabled) {
            let fatiguePoints = 0;
            switch (assignment.shiftType) {
                case ShiftType.GARDE_24H:
                    fatiguePoints += this.fatigueConfig.points?.garde || 0;
                    break;
                case ShiftType.ASTREINTE:
                    if (isWeekendOrHoliday) {
                        fatiguePoints += this.fatigueConfig.points?.astreinteWeekendFerie || this.fatigueConfig.points?.astreinte || 0;
                    }
                    break;
            }
            counter.fatigue.score += fatiguePoints;
        }
    }

    private isUserAvailable(user: User, date: Date, shiftType: ShiftType): boolean {
        const userIdStr = String(user.id);
        const logPrefix = `[Availability Check] User: ${userIdStr}, Date: ${date.toISOString().slice(0, 10)}, Shift: ${shiftType}:`;

        if (this.fatigueConfig?.enabled) {
            const counter = this.userCounters.get(userIdStr);
            const currentFatigueScore = counter?.fatigue.score || 0;
            const criticalThreshold = this.fatigueConfig.seuils?.critique;

            let potentialFatigueIncrease = 0;
            switch (shiftType) {
                case ShiftType.GARDE_24H: potentialFatigueIncrease = this.fatigueConfig.points?.garde || 0; break;
                case ShiftType.ASTREINTE: potentialFatigueIncrease = this.fatigueConfig.points?.astreinte || 0; break;
            }
            const potentialFatigueScore = currentFatigueScore + potentialFatigueIncrease;

            if (criticalThreshold !== undefined && potentialFatigueScore >= criticalThreshold) {
                logger.log(`${logPrefix} REJECTED due to fatigue score (${potentialFatigueScore}/${criticalThreshold}) reaching critical threshold.`);
                return false;
            }
        }

        const userAssignments = this.findUserAssignments(userIdStr);
        for (const existingAssignment of userAssignments) {
            const existingStartDate = parseDate(existingAssignment.startDate);
            if (!existingStartDate) continue;

            if (areDatesSameDay(date, existingStartDate)) {
                logger.log(`${logPrefix} REJECTED due to existing assignment on the same day.`);
                return false;
            }

            if (shiftType === ShiftType.GARDE_24H && existingAssignment.shiftType === ShiftType.GARDE_24H) {
                const daysBetween = getDifferenceInDays(parseDate(date)!, parseDate(existingAssignment.startDate)!);
                const minGap = this.rulesConfig.intervalle?.minJoursEntreGardes || 3;
                if (daysBetween !== null && Math.abs(daysBetween) < minGap) {
                    logger.log(`${logPrefix} REJECTED due to GARDE spacing rule (${Math.abs(daysBetween)} < ${minGap} days).`);
                    return false;
                }
            }
        }

        const dayBefore = addDaysToDate(date, -1);
        if (dayBefore) {
            const hasGardeDayBefore = userAssignments.some(a =>
                a.shiftType === ShiftType.GARDE_24H &&
                parseDate(a.startDate) && areDatesSameDay(parseDate(a.startDate)!, dayBefore)
            );
            if (hasGardeDayBefore) {
                logger.log(`${logPrefix} REJECTED due to required rest after GARDE.`);
                return false;
            }
        }

        logger.log(`${logPrefix} ACCEPTED`);
        return true;
    }

    public async generate(): Promise<any> {
        if (!this.isInitialized) {
            throw new Error("Generator not initialized. Call initialize() first.");
        }
        logger.log("Starting planning generation...");
        return this.results;
    }

    private findEligibleUsersForGarde(date: Date): User[] {
        return this.personnel.filter(user => {
            if (!this.isUserAvailable(user, date, ShiftType.GARDE_24H)) return false;
            if (this.hasConsecutiveAssignments(user, date)) return false;
            const userCounter = this.userCounters.get(String(user.id));
            if (userCounter && userCounter.gardes.total >= this.rulesConfig.intervalle.maxGardesMois) return false;
            return true;
        });
    }

    private findEligibleUsersForAstreinte(date: Date): User[] {
        return this.personnel.filter(user => {
            if (!this.isUserAvailable(user, date, ShiftType.ASTREINTE)) return false;
            if (this.hasConsecutiveAssignments(user, date)) return false;
            const userCounter = this.userCounters.get(String(user.id));
            if (userCounter && userCounter.astreintes.total >= this.rulesConfig.intervalle.maxAstreintesMois) {
                return false;
            }
            return true;
        });
    }

    private findEligibleUsersForConsultation(date: Date, shift: ShiftType): User[] {
        return this.personnel.filter(user => {
            if (!this.isUserAvailable(user, date, shift)) return false;
            const userCounter = this.userCounters.get(String(user.id));
            if (userCounter && userCounter.consultations.total >= this.rulesConfig.consultations.maxParSemaine) return false;
            return true;
        });
    }

    private findEligibleUsersForBloc(date: Date, isWeekend: boolean): User[] {
        return this.personnel.filter(user => {
            if (!this.isUserAvailable(user, date, ShiftType.GARDE_24H)) return false;
            if (this.hasConsecutiveAssignments(user, date)) return false;
            return true;
        });
    }

    private selectBestCandidateForGarde(eligibleUsers: User[], date: Date): User {
        return eligibleUsers.reduce((best, current) => {
            const bestCounter = this.userCounters.get(String(best.id))!;
            const currentCounter = this.userCounters.get(String(current.id))!;

            const bestScore = this.calculateAssignmentScore(best, bestCounter, date);
            const currentScore = this.calculateAssignmentScore(current, currentCounter, date);

            return currentScore > bestScore ? current : best;
        }, eligibleUsers[0]);
    }

    private selectBestCandidateForAstreinte(eligibleUsers: User[], date: Date): User {
        return eligibleUsers.reduce((best, current) => {
            const bestCounter = this.userCounters.get(String(best.id))!;
            const currentCounter = this.userCounters.get(String(current.id))!;

            const bestScore = this.calculateAssignmentScore(best, bestCounter, date);
            const currentScore = this.calculateAssignmentScore(current, currentCounter, date);

            return currentScore > bestScore ? current : best;
        }, eligibleUsers[0]);
    }

    private selectBestCandidateForConsultation(eligibleUsers: User[], date: Date, shift: ShiftType): User {
        return eligibleUsers.reduce((best, current) => {
            const bestCounter = this.userCounters.get(String(best.id))!;
            const currentCounter = this.userCounters.get(String(current.id))!;

            const bestScore = this.calculateAssignmentScore(best, bestCounter, date);
            const currentScore = this.calculateAssignmentScore(current, currentCounter, date);

            return currentScore > bestScore ? current : best;
        }, eligibleUsers[0]);
    }

    private selectBestCandidateForBloc(eligibleUsers: User[], date: Date, isWeekend: boolean): User {
        return eligibleUsers.reduce((best, current) => {
            const bestCounter = this.userCounters.get(String(best.id))!;
            const currentCounter = this.userCounters.get(String(current.id))!;

            const bestScore = this.calculateAssignmentScore(best, bestCounter, date);
            const currentScore = this.calculateAssignmentScore(current, currentCounter, date);

            return currentScore > bestScore ? current : best;
        }, eligibleUsers[0]);
    }

    private calculateAssignmentScore(user: User, counter: UserCounter, date: Date): number {
        let score = 0;

        score += 100 - counter.fatigue.score;

        const avgGardes = this.getAverageGardesPerUser();
        if (avgGardes > 0) {
            score += 50 * (1 - (counter.gardes.total / avgGardes));
        }

        return score;
    }

    private getAverageGardesPerUser(): number {
        const totalGardes = Array.from(this.userCounters.values())
            .reduce((sum, counter) => sum + counter.gardes.total, 0);
        return totalGardes / this.userCounters.size;
    }

    private validatePlanning(): ValidationResult {
        const violations: RuleViolation[] = [];

        this.checkForViolations(violations);

        const metrics = {
            equiteScore: this.calculateEquityScore(),
            fatigueScore: this.calculateAverageFatigueScore(),
            satisfactionScore: this.calculateSatisfactionScore()
        };

        return {
            valid: violations.length === 0,
            violations,
            metrics
        };
    }

    private checkForViolations(violations: RuleViolation[]): void {
        this.checkMinimumGardeIntervals(violations);
        this.checkMaxGardesPerMonth(violations);
        this.checkConsecutiveAssignments(violations);
        this.checkFatigueScores(violations);
    }

    private checkMinimumGardeIntervals(violations: RuleViolation[]): void {
        this.personnel.forEach(user => {
            const userAssignments = this.findUserAssignments(String(user.id));
            userAssignments.forEach(assignment => {
                const nextAssignment = userAssignments.find(a =>
                    a.startDate > assignment.startDate
                );
                if (nextAssignment) {
                    const daysBetween = getDifferenceInDays(parseDate(nextAssignment.startDate)!, parseDate(assignment.startDate)!);
                    if (daysBetween !== null && daysBetween < this.rulesConfig.intervalle.minJoursEntreGardes) {
                        violations.push({
                            id: `min-interval-${assignment.id}-${nextAssignment.id}`,
                            type: 'MIN_INTERVAL',
                            severity: RuleSeverity.ERROR,
                            message: `Intervalle minimum de ${this.rulesConfig.intervalle.minJoursEntreGardes} jours non respecté entre les gardes`,
                            affectedAssignments: [assignment.id, nextAssignment.id]
                        });
                    }
                }
            });
        });
    }

    private checkMaxGardesPerMonth(violations: RuleViolation[]): void {
        this.personnel.forEach(user => {
            const counter = this.userCounters.get(String(user.id));
            if (!counter) return;

            if (counter.gardes.total > this.rulesConfig.intervalle.maxGardesMois) {
                violations.push({
                    id: `max-gardes-${user.id}`,
                    type: 'MAX_GARDES',
                    severity: RuleSeverity.ERROR,
                    message: `Nombre maximum de gardes par mois dépassé (${counter.gardes.total} > ${this.rulesConfig.intervalle.maxGardesMois})`,
                    affectedAssignments: this.findUserAssignments(String(user.id)).map(a => a.id)
                });
            }
        });
    }

    private checkConsecutiveAssignments(violations: RuleViolation[]): void {
        this.personnel.forEach(user => {
            const userAssignments = this.findUserAssignments(String(user.id));
            let consecutiveCount = 0;

            const sortedAssignments = [...userAssignments].sort((a, b) => {
                const dateA = parseDate(a.startDate);
                const dateB = parseDate(b.startDate);
                if (!dateA || !dateB) return 0;
                return dateA.getTime() - dateB.getTime();
            });

            sortedAssignments.forEach((assignment, index) => {
                if (index > 0) {
                    const previousAssignment = sortedAssignments[index - 1];
                    if (areDatesSameDay(previousAssignment.endDate, assignment.startDate)) {
                        consecutiveCount++;
                        if (consecutiveCount + 1 > this.rulesConfig.intervalle.maxGardesConsecutives) {
                            violations.push({
                                id: `consecutive-${previousAssignment.id}-${assignment.id}`,
                                type: 'CONSECUTIVE_ASSIGNMENTS',
                                severity: RuleSeverity.WARNING,
                                message: `Nombre maximum d'affectations consécutives (${this.rulesConfig.intervalle.maxGardesConsecutives}) dépassé`,
                                affectedAssignments: [previousAssignment.id, assignment.id]
                            });
                        }
                    } else {
                        consecutiveCount = 0;
                    }
                } else {
                    consecutiveCount = 0;
                }
            });
        });
    }

    private checkFatigueScores(violations: RuleViolation[]): void {
        this.personnel.forEach(user => {
            const counter = this.userCounters.get(String(user.id));
            if (!counter) return;

            if (counter.fatigue.score >= this.fatigueConfig.seuils.critique) {
                violations.push({
                    id: `fatigue-${user.id}`,
                    type: 'FATIGUE',
                    severity: RuleSeverity.ERROR,
                    message: `Score de fatigue critique atteint (${counter.fatigue.score})`,
                    affectedAssignments: this.findUserAssignments(String(user.id)).map(a => a.id)
                });
            } else if (counter.fatigue.score >= this.fatigueConfig.seuils.alerte) {
                violations.push({
                    id: `fatigue-warning-${user.id}`,
                    type: 'FATIGUE_WARNING',
                    severity: RuleSeverity.WARNING,
                    message: `Score de fatigue élevé (${counter.fatigue.score})`,
                    affectedAssignments: this.findUserAssignments(String(user.id)).map(a => a.id)
                });
            }
        });
    }

    private calculateEquityScore(): number {
        const totalGardes = this.results.gardes.length;
        const totalUsers = this.personnel.length;
        const averageGardes = totalGardes / totalUsers;

        let deviationSum = 0;
        this.userCounters.forEach(counter => {
            const deviation = Math.abs(counter.gardes.total - averageGardes);
            deviationSum += deviation;
        });

        const maxDeviation = totalGardes;
        return 1 - (deviationSum / maxDeviation);
    }

    private calculateAverageFatigueScore(): number {
        let totalScore = 0;
        let count = 0;

        this.personnel.forEach(user => {
            const score = this.calculateFatigueScore(user, new Date());
            if (score > 0) {
                totalScore += score;
                count++;
            }
        });

        return count > 0 ? totalScore / count : 0;
    }

    private calculateSatisfactionScore(): number {
        return 0;
    }

    private calculateFatigueScore(user: User, date: Date): number {
        const counter = this.userCounters.get(String(user.id));
        if (!counter) return 0;

        const daysSinceLastUpdate = getDifferenceInDays(date, counter.fatigue.lastUpdate);

        if (daysSinceLastUpdate === null) {
            return counter.fatigue.score;
        }

        let score = counter.fatigue.score;
        const recoveryPoints = (this.fatigueConfig?.recovery?.jourOff || 15) / 30;
        score = Math.max(0, score - (daysSinceLastUpdate * recoveryPoints));

        return score;
    }

    private getResults(): {
        gardes: Assignment[];
        astreintes: Assignment[];
        consultations: Assignment[];
        blocs: Assignment[];
    } {
        return this.results;
    }

    private findUserAssignments(userId: string): Assignment[] {
        const generatedAssignments = [
            ...this.results.gardes,
            ...this.results.astreintes,
            ...this.results.consultations,
            ...this.results.blocs
        ];
        return [
            ...this.existingAssignments.filter(a => String(a.userId) === userId),
            ...generatedAssignments.filter(a => String(a.userId) === userId)
        ];
    }

    private isWithinInterval(date: Date, interval: { start: Date; end: Date }): boolean {
        return date >= interval.start && date <= interval.end;
    }

    private hasConsecutiveAssignments(user: User, targetDate: Date): boolean {
        const userAssignments = this.findUserAssignments(String(user.id));
        return userAssignments.some(assignment => {
            const assignmentStartDate = parseDate(assignment.startDate);
            if (assignmentStartDate) {
                const dayBeforeTarget = addDaysToDate(targetDate, -1);
                if (dayBeforeTarget && areDatesSameDay(assignmentStartDate, dayBeforeTarget)) {
                    return true;
                }
            }
            return false;
        });
    }
} 