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
import { User, DayOfWeek, WeekType, Leave } from '../types/user';
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

// Logger simple compatible avec Next.js
const logger = {
    info: (message: string, ...args: any[]) => {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[INFO] ${message}`, ...args);
        }
    },
    error: (message: string, ...args: any[]) => {
        console.error(`[ERROR] ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
        console.warn(`[WARN] ${message}`, ...args);
    },
    debug: (message: string, ...args: any[]) => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }
};

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
     * Initialisation et chargement des données
     */
    async initialize(personnel: User[], existingAssignments: Assignment[] = []): Promise<void> {
        this.personnel = personnel;
        this.existingAssignments = existingAssignments;

        // Initialise les compteurs pour chaque utilisateur
        this.initializeUserCounters();

        // Charge les affectations existantes dans les compteurs
        if (this.parameters.conserverAffectationsExistantes) {
            this.loadExistingAssignmentsIntoCounters();
        }
    }

    /**
     * Initialise les compteurs pour chaque utilisateur
     */
    private initializeUserCounters(): void {
        this.personnel.forEach(user => {
            this.userCounters.set(user.id, {
                userId: user.id,
                gardes: { total: 0, weekends: 0, feries: 0, noel: 0 },
                consultations: { total: 0, matin: 0, apresmidi: 0 },
                // Initialiser les nouveaux compteurs d'astreinte
                astreintes: { total: 0, semaine: 0, weekendFeries: 0 },
                fatigue: { score: 0, lastUpdate: new Date() }
            });
        });
    }

    /**
     * Charge les affectations existantes dans les compteurs
     */
    private loadExistingAssignmentsIntoCounters(): void {
        this.existingAssignments.forEach(assignment => {
            const counter = this.userCounters.get(assignment.userId);
            if (!counter) return;
            this.updateCounterForAssignment(counter, assignment);
        });
    }

    /**
     * Met à jour les compteurs pour une affectation donnée
     * Adapte la logique aux nouveaux ShiftType et règles d'astreinte/fatigue.
     */
    private updateCounterForAssignment(counter: UserCounter, assignment: Assignment): void {
        const date = parseDate(assignment.startDate);
        if (!date) {
            logger.error(`Date invalide pour l'affectation ${assignment.id}`, assignment);
            return;
        }

        const isWeekendDay = this.isWeekend(date);
        const isHolidayDay = this.isHoliday(date);
        const isWeekendOrHoliday = isWeekendDay || isHolidayDay;

        // Logique de fatigue spécifique (supervision multiple, pédiatrie)
        let specificFatiguePoints = 0;
        if (assignment.notes) {
            if (this.isMultipleSupervisedSector(assignment.notes)) {
                specificFatiguePoints += this.fatigueConfig.points.supervisionMultiple || 0;
            }
            if (assignment.notes.includes('pediatrie')) {
                specificFatiguePoints += this.fatigueConfig.points.pediatrie || 0;
            }
        }

        switch (assignment.shiftType) {
            case ShiftType.GARDE_24H:
                counter.gardes.total++;
                if (isWeekendDay) counter.gardes.weekends++;
                if (isHolidayDay) counter.gardes.feries++;
                // TODO: Gérer le cas spécifique Noël ?
                counter.fatigue.score += (this.fatigueConfig.points.garde || 0) + specificFatiguePoints;
                break;

            case ShiftType.ASTREINTE:
                counter.astreintes.total++;
                if (isWeekendOrHoliday) {
                    counter.astreintes.weekendFeries++;
                    // Ajoute un peu de fatigue seulement le weekend/férié
                    counter.fatigue.score += (this.fatigueConfig.points.astreinteWeekendFerie || this.fatigueConfig.points.astreinte || 0) + specificFatiguePoints;
                } else {
                    counter.astreintes.semaine++;
                    // Pas de fatigue ajoutée en semaine (ou très peu?)
                    // counter.fatigue.score += specificFatiguePoints; // Si supervision/pédiatrie possible en astreinte semaine?
                }
                break;

            case ShiftType.MATIN:
                counter.consultations.total++;
                counter.consultations.matin++;
                // Ajouter fatigue spécifique si applicable aux vacations ?
                // counter.fatigue.score += specificFatiguePoints;
                break;

            case ShiftType.APRES_MIDI:
                counter.consultations.total++;
                counter.consultations.apresmidi++;
                // Ajouter fatigue spécifique si applicable aux vacations ?
                // counter.fatigue.score += specificFatiguePoints;
                break;

            // Les anciens types sont supprimés, pas besoin de les gérer ici
            // default: 
            //     logger.warn(`Type de shift inconnu ou non géré dans les compteurs: ${assignment.shiftType}`);
        }

        counter.fatigue.lastUpdate = new Date();
    }

    /**
     * Détermine si un secteur nécessite une supervision multiple
     */
    private isMultipleSupervisedSector(secteur: string): boolean {
        const maxSalles = this.rulesConfig.supervision.maxSallesParMAR[secteur] ||
            this.rulesConfig.supervision.maxSallesParMAR['standard'] || 2;
        return maxSalles > 2;
    }

    /**
     * Récupère tous les jours dans la période
     */
    private getPeriodDays(): Date[] {
        const days: Date[] = [];
        let currentDate = parseDate(this.parameters.dateDebut);
        const endDate = parseDate(this.parameters.dateFin);

        if (!currentDate || !endDate || currentDate > endDate) {
            logger.error('Dates de début ou de fin invalides pour la génération', this.parameters);
            return [];
        }

        while (currentDate <= endDate) {
            days.push(currentDate);
            const nextDate = addDaysToDate(currentDate, 1);
            if (!nextDate) {
                logger.error('Erreur lors de l\'incrémentation de la date', currentDate);
                break;
            }
            currentDate = nextDate;
        }

        return days;
    }

    /**
     * Détermine si une date est un weekend
     */
    private isWeekend(date: Date): boolean {
        const day = date.getDay();
        return day === 0 || day === 6; // 0 = Dimanche, 6 = Samedi
    }

    /**
     * Détermine si une date est un jour férié
     * À implémenter avec une liste de jours fériés
     */
    private isHoliday(date: Date): boolean {
        // TODO: Implémenter la vérification des jours fériés
        return false;
    }

    /**
     * Calcule le nombre de jours entre deux dates
     */
    private getDaysBetween(date1: Date, date2: Date): number {
        const diff = getDifferenceInDays(date1, date2);
        return diff !== null ? Math.abs(diff) : 0;
    }

    /**
     * Vérifie si un utilisateur a des affectations consécutives
     */
    private hasConsecutiveAssignments(user: User, targetDate: Date): boolean {
        const assignments = this.findUserAssignments(user.id);
        return assignments.some(assignment => {
            return areDatesSameDay(assignment.startDate, targetDate);
        });
    }

    /**
     * Trouve la dernière affectation d'un type donné pour un utilisateur
     */
    private findLastAssignment(user: User, shiftType: ShiftType): Assignment | null {
        const assignments = this.findUserAssignments(user.id);
        return assignments.find(a => a.shiftType === shiftType) || null;
    }

    /**
     * Vérifie si un utilisateur est disponible à une date donnée
     */
    private isUserAvailable(user: User, date: Date): boolean {
        // Vérifier les congés
        const hasLeave = user.leaves?.some(leave =>
            this.isWithinInterval(date, { start: leave.startDate, end: leave.endDate })
        );
        if (hasLeave) return false;

        // Vérifier les dates d'indisponibilité
        const isBlackedOut = user.preferences?.blackoutDates?.some(blackoutDate =>
            areDatesSameDay(date, blackoutDate)
        );
        if (isBlackedOut) return false;

        // Vérifier le score de fatigue
        const fatigueScore = this.calculateFatigueScore(user, date);
        if (fatigueScore >= this.fatigueConfig.seuils.critique) return false;

        return true;
    }

    /**
     * Compare si deux dates sont le même jour
     */
    private isSameDay(date1: Date, date2: Date): boolean {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    }

    /**
     * Génère les affectations de garde
     */
    private generateGardes(): void {
        logger.info('Génération des gardes');
        const days = this.getPeriodDays();

        days.forEach(date => {
            const eligibleUsers = this.findEligibleUsersForGarde(date);
            if (eligibleUsers.length === 0) {
                logger.warn(`Aucun utilisateur disponible pour la garde du ${formatDate(date, ISO_DATE_FORMAT)}`);
                return;
            }

            const selectedUser = this.selectBestCandidateForGarde(eligibleUsers, date);
            const endDate = addHoursToDate(date, 24);
            if (!endDate) {
                logger.error('Impossible de calculer la date de fin pour la garde', { date });
                return;
            }

            const assignment: Assignment = {
                id: `garde-${Math.random().toString(36).substring(2, 9)}`,
                userId: selectedUser.id,
                shiftType: ShiftType.GARDE_24H,
                startDate: date,
                endDate: endDate,
                status: AssignmentStatus.PENDING,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            this.results.gardes.push(assignment);
            this.updateCounterForAssignment(this.userCounters.get(selectedUser.id)!, assignment);
        });
    }

    /**
     * Génère les affectations d'astreinte
     */
    private generateAstreintes(): void {
        logger.info('Génération des astreintes');
        const days = this.getPeriodDays();

        days.forEach(date => {
            const eligibleUsers = this.findEligibleUsersForAstreinte(date);
            if (eligibleUsers.length === 0) {
                logger.warn(`Aucun utilisateur disponible pour l'astreinte du ${formatDate(date, ISO_DATE_FORMAT)}`);
                return;
            }

            const selectedUser = this.selectBestCandidateForAstreinte(eligibleUsers, date);
            const endDate = addHoursToDate(date, 24);
            if (!endDate) {
                logger.error('Impossible de calculer la date de fin pour l\'astreinte', { date });
                return;
            }

            const assignment: Assignment = {
                id: `astreinte-${Math.random().toString(36).substring(2, 9)}`,
                userId: selectedUser.id,
                shiftType: ShiftType.ASTREINTE,
                startDate: date,
                endDate: endDate,
                status: AssignmentStatus.PENDING,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            this.results.astreintes.push(assignment);
            this.updateCounterForAssignment(this.userCounters.get(selectedUser.id)!, assignment);
        });
    }

    /**
     * Génère les affectations de consultation
     */
    private generateConsultations(): void {
        logger.info('Génération des consultations');
        const days = this.getPeriodDays();

        days.forEach(date => {
            if (this.isWeekend(date) || this.isHoliday(date)) return;

            // Consultation du matin
            const morningUsers = this.findEligibleUsersForConsultation(date, ShiftType.MATIN);
            if (morningUsers.length > 0) {
                const selectedMorningUser = this.selectBestCandidateForConsultation(morningUsers, date, ShiftType.MATIN);
                const morningEndDate = addHoursToDate(date, 4);
                if (!morningEndDate) {
                    logger.error('Impossible de calculer la date de fin pour la consultation matin', { date });
                    // Continuer avec la consultation de l'après-midi ?
                } else {
                    const morningAssignment: Assignment = {
                        id: `consultation-matin-${Math.random().toString(36).substring(2, 9)}`,
                        userId: selectedMorningUser.id,
                        shiftType: ShiftType.MATIN,
                        startDate: date,
                        endDate: morningEndDate,
                        status: AssignmentStatus.PENDING,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };

                    this.results.consultations.push(morningAssignment);
                    this.updateCounterForAssignment(this.userCounters.get(selectedMorningUser.id)!, morningAssignment);
                }
            }

            // Consultation de l'après-midi
            const afternoonUsers = this.findEligibleUsersForConsultation(date, ShiftType.APRES_MIDI);
            if (afternoonUsers.length > 0) {
                const selectedAfternoonUser = this.selectBestCandidateForConsultation(afternoonUsers, date, ShiftType.APRES_MIDI);
                const afternoonStartDate = addHoursToDate(date, 6); // Début décalé
                if (!afternoonStartDate) {
                    logger.error('Impossible de calculer la date de début pour la consultation aprem', { date });
                    return; // Sortir pour ce jour
                }
                const afternoonEndDate = addHoursToDate(afternoonStartDate, 4);
                if (!afternoonEndDate) {
                    logger.error('Impossible de calculer la date de fin pour la consultation aprem', { date: afternoonStartDate });
                } else {
                    const afternoonAssignment: Assignment = {
                        id: `consultation-apresmidi-${Math.random().toString(36).substring(2, 9)}`,
                        userId: selectedAfternoonUser.id,
                        shiftType: ShiftType.APRES_MIDI,
                        startDate: afternoonStartDate,
                        endDate: afternoonEndDate,
                        status: AssignmentStatus.PENDING,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };

                    this.results.consultations.push(afternoonAssignment);
                    this.updateCounterForAssignment(this.userCounters.get(selectedAfternoonUser.id)!, afternoonAssignment);
                }
            }
        });
    }

    /**
     * Génère les affectations de bloc opératoire
     */
    private generateBlocs(): void {
        logger.info('Génération des affectations de bloc');
        const days = this.getPeriodDays();

        days.forEach(date => {
            if (this.isWeekend(date) || this.isHoliday(date)) {
                // Gestion spéciale pour les weekends et jours fériés
                const weekendUsers = this.findEligibleUsersForBloc(date, true);
                if (weekendUsers.length > 0) {
                    const selectedUser = this.selectBestCandidateForBloc(weekendUsers, date, true);
                    const endDate = addHoursToDate(date, 12);
                    if (!endDate) {
                        logger.error('Impossible de calculer la date de fin pour le bloc weekend', { date });
                        return;
                    }

                    const assignment: Assignment = {
                        id: `bloc-weekend-${Math.random().toString(36).substring(2, 9)}`,
                        userId: selectedUser.id,
                        shiftType: ShiftType.GARDE_24H,
                        startDate: date,
                        endDate: endDate,
                        status: AssignmentStatus.PENDING,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };

                    this.results.blocs.push(assignment);
                    this.updateCounterForAssignment(this.userCounters.get(selectedUser.id)!, assignment);
                }
            } else {
                // Journée normale
                const users = this.findEligibleUsersForBloc(date, false);
                if (users.length > 0) {
                    const selectedUser = this.selectBestCandidateForBloc(users, date, false);
                    const endDate = addHoursToDate(date, 8);
                    if (!endDate) {
                        logger.error('Impossible de calculer la date de fin pour le bloc jour', { date });
                        return;
                    }

                    const assignment: Assignment = {
                        id: `bloc-${Math.random().toString(36).substring(2, 9)}`,
                        userId: selectedUser.id,
                        shiftType: ShiftType.MATIN,
                        startDate: date,
                        endDate: endDate,
                        status: AssignmentStatus.PENDING,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };

                    this.results.blocs.push(assignment);
                    this.updateCounterForAssignment(this.userCounters.get(selectedUser.id)!, assignment);
                }
            }
        });
    }

    /**
     * Trouve les utilisateurs éligibles pour une garde
     */
    private findEligibleUsersForGarde(date: Date): User[] {
        return this.personnel.filter(user => {
            // Vérifier la disponibilité de base
            if (!this.isUserAvailable(user, date)) return false;

            // Vérifier les affectations consécutives
            if (this.hasConsecutiveAssignments(user, date)) return false;

            // Vérifier le nombre de gardes dans le mois
            const userCounter = this.userCounters.get(user.id);
            if (userCounter && userCounter.gardes.total >= this.rulesConfig.intervalle.maxGardesMois) return false;

            return true;
        });
    }

    /**
     * Trouve les utilisateurs éligibles pour une astreinte
     */
    private findEligibleUsersForAstreinte(date: Date): User[] {
        return this.personnel.filter(user => {
            // Vérifier la disponibilité de base
            if (!this.isUserAvailable(user, date)) return false;

            // Vérifier les affectations consécutives
            if (this.hasConsecutiveAssignments(user, date)) return false;

            // Vérifier le nombre d'astreintes
            const userCounter = this.userCounters.get(user.id);
            if (userCounter && userCounter.astreintes.total >= this.rulesConfig.intervalle.maxAstreintesMois) {
                return false;
            }

            return true;
        });
    }

    /**
     * Trouve les utilisateurs éligibles pour une consultation
     */
    private findEligibleUsersForConsultation(date: Date, shift: ShiftType): User[] {
        return this.personnel.filter(user => {
            // Vérifier la disponibilité de base
            if (!this.isUserAvailable(user, date)) return false;

            // Vérifier le nombre de consultations par semaine
            const userCounter = this.userCounters.get(user.id);
            if (userCounter && userCounter.consultations.total >= this.rulesConfig.consultations.maxParSemaine) return false;

            return true;
        });
    }

    /**
     * Trouve les utilisateurs éligibles pour le bloc opératoire
     */
    private findEligibleUsersForBloc(date: Date, isWeekend: boolean): User[] {
        return this.personnel.filter(user => {
            // Vérifier la disponibilité de base
            if (!this.isUserAvailable(user, date)) return false;

            // Vérifier les affectations consécutives
            if (this.hasConsecutiveAssignments(user, date)) return false;

            return true;
        });
    }

    /**
     * Sélectionne le meilleur candidat pour une garde
     */
    private selectBestCandidateForGarde(eligibleUsers: User[], date: Date): User {
        return eligibleUsers.reduce((best, current) => {
            const bestCounter = this.userCounters.get(best.id)!;
            const currentCounter = this.userCounters.get(current.id)!;

            // Critères de sélection
            const bestScore = this.calculateAssignmentScore(best, bestCounter, date);
            const currentScore = this.calculateAssignmentScore(current, currentCounter, date);

            return currentScore > bestScore ? current : best;
        }, eligibleUsers[0]);
    }

    /**
     * Sélectionne le meilleur candidat pour une astreinte
     */
    private selectBestCandidateForAstreinte(eligibleUsers: User[], date: Date): User {
        return eligibleUsers.reduce((best, current) => {
            const bestCounter = this.userCounters.get(best.id)!;
            const currentCounter = this.userCounters.get(current.id)!;

            // Critères de sélection
            const bestScore = this.calculateAssignmentScore(best, bestCounter, date);
            const currentScore = this.calculateAssignmentScore(current, currentCounter, date);

            return currentScore > bestScore ? current : best;
        }, eligibleUsers[0]);
    }

    /**
     * Sélectionne le meilleur candidat pour une consultation
     */
    private selectBestCandidateForConsultation(eligibleUsers: User[], date: Date, shift: ShiftType): User {
        return eligibleUsers.reduce((best, current) => {
            const bestCounter = this.userCounters.get(best.id)!;
            const currentCounter = this.userCounters.get(current.id)!;

            // Critères de sélection
            const bestScore = this.calculateAssignmentScore(best, bestCounter, date);
            const currentScore = this.calculateAssignmentScore(current, currentCounter, date);

            return currentScore > bestScore ? current : best;
        }, eligibleUsers[0]);
    }

    /**
     * Sélectionne le meilleur candidat pour le bloc opératoire
     */
    private selectBestCandidateForBloc(eligibleUsers: User[], date: Date, isWeekend: boolean): User {
        return eligibleUsers.reduce((best, current) => {
            const bestCounter = this.userCounters.get(best.id)!;
            const currentCounter = this.userCounters.get(current.id)!;

            // Critères de sélection
            const bestScore = this.calculateAssignmentScore(best, bestCounter, date);
            const currentScore = this.calculateAssignmentScore(current, currentCounter, date);

            return currentScore > bestScore ? current : best;
        }, eligibleUsers[0]);
    }

    /**
     * Calcule un score pour une affectation potentielle
     */
    private calculateAssignmentScore(user: User, counter: UserCounter, date: Date): number {
        let score = 0;

        // Facteur de fatigue (inversé car moins de fatigue = meilleur score)
        score += 100 - counter.fatigue.score;

        // Facteur d'équité (moins d'affectations = meilleur score)
        const avgGardes = this.getAverageGardesPerUser();
        if (avgGardes > 0) {
            score += 50 * (1 - (counter.gardes.total / avgGardes));
        }

        // Bonus pour les préférences personnelles
        if (user.preferences) {
            const formattedDate = formatDate(date, ISO_DATE_FORMAT);
            if (formattedDate && user.preferences.preferredDays?.includes(formattedDate)) {
                score += 20;
            }
        }

        return score;
    }

    /**
     * Calcule la moyenne des gardes par utilisateur
     */
    private getAverageGardesPerUser(): number {
        const totalGardes = Array.from(this.userCounters.values())
            .reduce((sum, counter) => sum + counter.gardes.total, 0);
        return totalGardes / this.userCounters.size;
    }

    /**
     * Valide le planning généré
     */
    validatePlanning(): ValidationResult {
        const violations: RuleViolation[] = [];

        // Vérifier les violations de règles
        this.checkForViolations(violations);

        // Calculer les métriques
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

    /**
     * Vérifie les violations de règles
     */
    private checkForViolations(violations: RuleViolation[]): void {
        // Vérifier les intervalles minimum entre les gardes
        this.checkMinimumGardeIntervals(violations);

        // Vérifier le nombre maximum de gardes par mois
        this.checkMaxGardesPerMonth(violations);

        // Vérifier les affectations consécutives
        this.checkConsecutiveAssignments(violations);

        // Vérifier les scores de fatigue
        this.checkFatigueScores(violations);
    }

    /**
     * Vérifie les intervalles minimum entre les gardes
     */
    private checkMinimumGardeIntervals(violations: RuleViolation[]): void {
        this.personnel.forEach(user => {
            const userAssignments = this.findUserAssignments(user.id);
            userAssignments.forEach(assignment => {
                const nextAssignment = userAssignments.find(a =>
                    a.startDate > assignment.startDate
                );
                if (nextAssignment) {
                    const daysBetween = this.getDaysBetween(assignment.startDate, nextAssignment.startDate);
                    if (daysBetween < this.rulesConfig.intervalle.minJoursEntreGardes) {
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

    /**
     * Vérifie le nombre maximum de gardes par mois
     */
    private checkMaxGardesPerMonth(violations: RuleViolation[]): void {
        this.personnel.forEach(user => {
            const counter = this.userCounters.get(user.id);
            if (!counter) return;

            if (counter.gardes.total > this.rulesConfig.intervalle.maxGardesMois) {
                violations.push({
                    id: `max-gardes-${user.id}`,
                    type: 'MAX_GARDES',
                    severity: RuleSeverity.ERROR,
                    message: `Nombre maximum de gardes par mois dépassé (${counter.gardes.total} > ${this.rulesConfig.intervalle.maxGardesMois})`,
                    affectedAssignments: this.findUserAssignments(user.id).map(a => a.id)
                });
            }
        });
    }

    /**
     * Vérifie les affectations consécutives
     */
    private checkConsecutiveAssignments(violations: RuleViolation[]): void {
        this.personnel.forEach(user => {
            const userAssignments = this.findUserAssignments(user.id);
            let consecutiveCount = 0;

            // Trier les affectations par date de début pour s'assurer de la logique consécutive
            const sortedAssignments = [...userAssignments].sort((a, b) => {
                const dateA = parseDate(a.startDate);
                const dateB = parseDate(b.startDate);
                if (!dateA || !dateB) return 0; // Gérer les dates invalides
                return dateA.getTime() - dateB.getTime();
            });

            sortedAssignments.forEach((assignment, index) => {
                // Comparer avec l'affectation précédente dans la liste triée
                if (index > 0) {
                    const previousAssignment = sortedAssignments[index - 1];
                    if (areDatesSameDay(previousAssignment.endDate, assignment.startDate)) {
                        consecutiveCount++;
                        if (consecutiveCount + 1 > this.rulesConfig.intervalle.maxGardesConsecutives) {
                            // On a dépassé le max (consecutiveCount = 1 signifie 2 jours consécutifs)
                            violations.push({
                                id: `consecutive-${previousAssignment.id}-${assignment.id}`,
                                type: 'CONSECUTIVE_ASSIGNMENTS',
                                severity: RuleSeverity.WARNING,
                                message: `Nombre maximum d'affectations consécutives (${this.rulesConfig.intervalle.maxGardesConsecutives}) dépassé`,
                                affectedAssignments: [previousAssignment.id, assignment.id]
                            });
                        }
                    } else {
                        consecutiveCount = 0; // Réinitialiser si pas consécutif
                    }
                } else {
                    consecutiveCount = 0; // Premier élément
                }
            });
        });
    }

    /**
     * Vérifie les scores de fatigue
     */
    private checkFatigueScores(violations: RuleViolation[]): void {
        this.personnel.forEach(user => {
            const counter = this.userCounters.get(user.id);
            if (!counter) return;

            if (counter.fatigue.score >= this.fatigueConfig.seuils.critique) {
                violations.push({
                    id: `fatigue-${user.id}`,
                    type: 'FATIGUE',
                    severity: RuleSeverity.ERROR,
                    message: `Score de fatigue critique atteint (${counter.fatigue.score})`,
                    affectedAssignments: this.findUserAssignments(user.id).map(a => a.id)
                });
            } else if (counter.fatigue.score >= this.fatigueConfig.seuils.alerte) {
                violations.push({
                    id: `fatigue-warning-${user.id}`,
                    type: 'FATIGUE_WARNING',
                    severity: RuleSeverity.WARNING,
                    message: `Score de fatigue élevé (${counter.fatigue.score})`,
                    affectedAssignments: this.findUserAssignments(user.id).map(a => a.id)
                });
            }
        });
    }

    /**
     * Calcule le score d'équité global
     */
    private calculateEquityScore(): number {
        const totalGardes = this.results.gardes.length;
        const totalUsers = this.personnel.length;
        const averageGardes = totalGardes / totalUsers;

        let deviationSum = 0;
        this.userCounters.forEach(counter => {
            const deviation = Math.abs(counter.gardes.total - averageGardes);
            deviationSum += deviation;
        });

        const maxDeviation = totalGardes; // Pire cas : toutes les gardes sur une seule personne
        return 1 - (deviationSum / maxDeviation);
    }

    /**
     * Calcule le score de fatigue moyen
     */
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

    /**
     * Calcule le score de satisfaction
     */
    private calculateSatisfactionScore(): number {
        // TODO: Implémenter le calcul de satisfaction
        return 0;
    }

    /**
     * Calcule le score de fatigue global
     */
    private calculateFatigueScore(user: User, date: Date): number {
        const counter = this.userCounters.get(user.id);
        if (!counter) return 0;

        // Calculer le temps écoulé depuis la dernière mise à jour
        const daysSinceLastUpdate = this.getDaysBetween(counter.fatigue.lastUpdate, date);

        // Appliquer la récupération
        let score = counter.fatigue.score;
        if (daysSinceLastUpdate > 0) {
            score -= this.fatigueConfig.recovery.jourOff * daysSinceLastUpdate;
        }

        return Math.max(0, score);
    }

    /**
     * Génère le planning complet
     */
    async generateFullPlanning(): Promise<ValidationResult> {
        try {
            // Générer les différents types d'affectations
            this.generateGardes();
            this.generateAstreintes();
            this.generateConsultations();
            this.generateBlocs();

            // Valider le planning généré
            const validationResult = this.validatePlanning();

            // Si le planning n'est pas valide, essayer de le corriger
            if (!validationResult.valid) {
                logger.warn('Planning initial non valide, tentative de correction...');
                // TODO: Implémenter la correction automatique
            }

            return validationResult;
        } catch (error) {
            logger.error('Erreur lors de la génération du planning:', error);
            throw error;
        }
    }

    /**
     * Récupère les résultats de la génération
     */
    getResults(): {
        gardes: Assignment[];
        astreintes: Assignment[];
        consultations: Assignment[];
        blocs: Assignment[];
    } {
        return this.results;
    }

    /**
     * Trouve toutes les affectations d'un utilisateur
     */
    private findUserAssignments(userId: string): Assignment[] {
        return this.existingAssignments.filter(assignment => assignment.userId === userId);
    }

    /**
     * Vérifie si une date est dans un intervalle
     */
    private isWithinInterval(date: Date, interval: { start: Date; end: Date }): boolean {
        return date >= interval.start && date <= interval.end;
    }
} 