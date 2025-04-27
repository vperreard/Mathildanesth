import {
    Assignment,
    AssignmentType,
    GenerationParameters,
    RuleViolation,
    ValidationResult,
    UserCounter
} from '../types/assignment';
import { User, DayOfWeek, WeekType } from '../types/user';
import { RulesConfiguration, FatigueConfig, defaultRulesConfiguration, defaultFatigueConfig } from '../types/rules';

/**
 * Service principal de génération de planning
 */
export class PlanningGenerator {
    private parameters: GenerationParameters;
    private personnel: User[] = [];
    private rulesConfig: RulesConfiguration;
    private fatigueConfig: FatigueConfig;
    private existingAssignments: Assignment[] = [];
    private userCounters: Map<number, UserCounter> = new Map();
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
                gardes: {
                    total: 0,
                    weekends: 0,
                    feries: 0,
                    noel: 0
                },
                consultations: {
                    total: 0,
                    matin: 0,
                    apresmidi: 0
                },
                astreintes: 0,
                fatigue: {
                    score: 0,
                    lastUpdate: new Date()
                }
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

            // Met à jour les compteurs en fonction du type d'affectation
            this.updateCounterForAssignment(counter, assignment);
        });
    }

    /**
     * Met à jour les compteurs pour une affectation
     */
    private updateCounterForAssignment(counter: UserCounter, assignment: Assignment): void {
        const date = new Date(assignment.date);
        const isWeekend = this.isWeekend(date);
        const isFerie = this.isHoliday(date);

        switch (assignment.type) {
            case AssignmentType.GARDE:
                counter.gardes.total++;
                if (isWeekend) counter.gardes.weekends++;
                if (isFerie) counter.gardes.feries++;
                // Mise à jour du score de fatigue
                counter.fatigue.score += this.fatigueConfig.points.garde;
                break;

            case AssignmentType.ASTREINTE:
                counter.astreintes++;
                // Mise à jour du score de fatigue
                counter.fatigue.score += this.fatigueConfig.points.astreinte;
                break;

            case AssignmentType.CONSULTATION:
                counter.consultations.total++;
                if (assignment.shift === 'matin') {
                    counter.consultations.matin++;
                } else if (assignment.shift === 'apresmidi') {
                    counter.consultations.apresmidi++;
                }
                break;

            case AssignmentType.BLOC:
                // Supervision multiple
                if (assignment.secteur && this.isMultipleSupervisedSector(assignment.secteur)) {
                    counter.fatigue.score += this.fatigueConfig.points.supervisionMultiple;
                }
                // Pédiatrie
                if (assignment.secteur === 'pediatrie') {
                    counter.fatigue.score += this.fatigueConfig.points.pediatrie;
                }
                break;
        }

        // Met à jour la date de dernière mise à jour
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
        const currentDate = new Date(this.parameters.dateDebut);
        const endDate = new Date(this.parameters.dateFin);

        while (currentDate <= endDate) {
            days.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
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
     * Détermine si un utilisateur est disponible à une date donnée
     */
    private isUserAvailable(user: User, date: Date): boolean {
        // Vérifie si l'utilisateur est actif à la date donnée
        const dateStr = date.toISOString().split('T')[0];
        if (user.dateEntree && new Date(user.dateEntree).toISOString().split('T')[0] > dateStr) return false;
        if (user.dateSortie && new Date(user.dateSortie).toISOString().split('T')[0] < dateStr) return false;
        if (user.actif === false) return false;

        // Vérifie le pattern de travail
        if (!this.isWorkingDay(user, date)) return false;

        // Vérifie s'il y a déjà une affectation à cette date
        const hasConflict = this.existingAssignments.some(a =>
            a.userId === user.id &&
            new Date(a.date).toISOString().split('T')[0] === dateStr
        );

        return !hasConflict;
    }

    /**
     * Détermine si une date est un jour de travail pour l'utilisateur
     */
    private isWorkingDay(user: User, date: Date): boolean {
        if (!user.workPattern) return true; // Par défaut, temps plein

        const dayOfWeek = date.getDay() || 7; // 0 = Dimanche, 1-6 = Lundi-Samedi, on transforme 0 en 7
        const dayIndex = dayOfWeek - 1; // 0-6 pour Lundi-Dimanche
        const dayNames = [
            DayOfWeek.LUNDI, DayOfWeek.MARDI, DayOfWeek.MERCREDI,
            DayOfWeek.JEUDI, DayOfWeek.VENDREDI, DayOfWeek.SAMEDI, DayOfWeek.DIMANCHE
        ];
        const day = dayNames[dayIndex];

        // Vérifier selon le pattern de travail
        switch (user.workPattern) {
            case 'FULL_TIME':
                return true;

            case 'ALTERNATING_WEEKS': {
                const weekNumber = this.getWeekNumber(date);
                const isEvenWeek = weekNumber % 2 === 0;

                if (isEvenWeek && user.workOnMonthType === WeekType.EVEN) {
                    return user.joursTravaillesSemainePaire?.includes(day) || false;
                } else if (!isEvenWeek && user.workOnMonthType === WeekType.ODD) {
                    return user.joursTravaillesSemaineImpaire?.includes(day) || false;
                }
                return false;
            }

            case 'ALTERNATING_MONTHS': {
                const month = date.getMonth() + 1; // 1-12
                const isEvenMonth = month % 2 === 0;

                if (isEvenMonth && user.workOnMonthType === WeekType.EVEN) {
                    return true;
                } else if (!isEvenMonth && user.workOnMonthType === WeekType.ODD) {
                    return true;
                }
                return false;
            }

            case 'SPECIFIC_DAYS': {
                // Vérifier si le jour est dans la liste des jours travaillés
                return (
                    user.joursTravaillesSemainePaire?.includes(day) ||
                    user.joursTravaillesSemaineImpaire?.includes(day) ||
                    false
                );
            }

            default:
                return true;
        }
    }

    /**
     * Obtient le numéro de semaine d'une date
     */
    private getWeekNumber(date: Date): number {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    /**
     * Détermine si un utilisateur a des affectations consécutives
     */
    private hasConsecutiveAssignments(userId: number, date: Date): boolean {
        const previousDay = new Date(date);
        previousDay.setDate(previousDay.getDate() - 1);

        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const previousDayStr = previousDay.toISOString().split('T')[0];
        const nextDayStr = nextDay.toISOString().split('T')[0];

        const hasAssignmentPreviousDay = this.existingAssignments.some(a =>
            a.userId === userId &&
            (a.type === AssignmentType.GARDE || a.type === AssignmentType.ASTREINTE) &&
            new Date(a.date).toISOString().split('T')[0] === previousDayStr
        );

        const hasAssignmentNextDay = this.existingAssignments.some(a =>
            a.userId === userId &&
            (a.type === AssignmentType.GARDE || a.type === AssignmentType.ASTREINTE) &&
            new Date(a.date).toISOString().split('T')[0] === nextDayStr
        );

        return hasAssignmentPreviousDay || hasAssignmentNextDay;
    }

    /**
     * Génère les gardes pour la période spécifiée
     */
    generateGardes(): Assignment[] {
        const gardes: Assignment[] = [];
        const periodDays = this.getPeriodDays();

        for (const day of periodDays) {
            // Trouver les utilisateurs éligibles pour la garde
            const eligibleUsers = this.findEligibleUsersForGarde(day);

            if (eligibleUsers.length === 0) {
                console.warn(`Aucun utilisateur disponible pour la garde du ${day.toISOString().split('T')[0]}`);
                continue;
            }

            // Sélectionner le meilleur candidat pour la garde
            const selectedUser = this.selectBestCandidateForGarde(eligibleUsers, day);

            // Créer la garde et l'ajouter au résultat
            const garde: Assignment = {
                id: `garde-${day.toISOString().split('T')[0]}`,
                userId: selectedUser.id,
                date: day,
                type: AssignmentType.GARDE,
                shift: 'nuit',
                confirmed: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            gardes.push(garde);
            this.existingAssignments.push(garde);

            // Mettre à jour les compteurs de l'utilisateur
            const counter = this.userCounters.get(selectedUser.id);
            if (counter) {
                this.updateCounterForAssignment(counter, garde);
            }
        }

        this.results.gardes = gardes;
        return gardes;
    }

    /**
     * Trouve les utilisateurs éligibles pour une garde à une date donnée
     */
    private findEligibleUsersForGarde(date: Date): User[] {
        return this.personnel.filter(user => {
            // Vérifier si l'utilisateur est disponible ce jour-là
            if (!this.isUserAvailable(user, date)) return false;

            // Vérifier le rôle professionnel (seuls les MAR font des gardes)
            if (user.professionalRole !== 'MAR') return false;

            const counter = this.userCounters.get(user.id);
            if (!counter) return false;

            // Vérifier le nombre de gardes par mois
            const month = date.getMonth();
            const year = date.getFullYear();
            const gardesThisMonth = this.existingAssignments.filter(a =>
                a.userId === user.id &&
                a.type === AssignmentType.GARDE &&
                new Date(a.date).getMonth() === month &&
                new Date(a.date).getFullYear() === year
            ).length;

            if (gardesThisMonth >= this.rulesConfig.intervalle.maxGardesMois) return false;

            // Vérifier l'intervalle minimum entre les gardes
            const lastGarde = this.findLastAssignment(user.id, AssignmentType.GARDE);
            if (lastGarde) {
                const lastGardeDate = new Date(lastGarde.date);
                const daysBetween = this.getDaysBetween(lastGardeDate, date);
                if (daysBetween < this.rulesConfig.intervalle.minJoursEntreGardes) return false;
            }

            // Vérifier les gardes consécutives
            if (this.rulesConfig.qualiteVie.eviterConsecutifs && this.hasConsecutiveAssignments(user.id, date)) {
                return false;
            }

            // Vérifier le score de fatigue
            if (counter.fatigue.score > this.fatigueConfig.seuils.critique) {
                return false;
            }

            return true;
        });
    }

    /**
     * Trouve la dernière affectation d'un type donné pour un utilisateur
     */
    private findLastAssignment(userId: number, type: AssignmentType): Assignment | undefined {
        const assignments = this.existingAssignments
            .filter(a => a.userId === userId && a.type === type)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return assignments[0];
    }

    /**
     * Calcule le nombre de jours entre deux dates
     */
    private getDaysBetween(date1: Date, date2: Date): number {
        const diffTime = Math.abs(date2.getTime() - date1.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Sélectionne le meilleur candidat pour une garde
     */
    private selectBestCandidateForGarde(eligibleUsers: User[], date: Date): User {
        const isWeekend = this.isWeekend(date);
        const isFerie = this.isHoliday(date);

        // Calcul du score pour chaque candidat
        const scoredCandidates = eligibleUsers.map(user => {
            const counter = this.userCounters.get(user.id) as UserCounter;
            let score = 0;

            // Temps écoulé depuis la dernière garde
            const lastGarde = this.findLastAssignment(user.id, AssignmentType.GARDE);
            if (lastGarde) {
                const daysSinceLastGarde = this.getDaysBetween(new Date(lastGarde.date), date);
                score += Math.min(daysSinceLastGarde, 30) / 3; // max 10 points
            } else {
                score += 10; // Max points for new users
            }

            // Équité des gardes
            const averageGardes = this.getAverageGardesPerUser();
            const gardeRatio = counter.gardes.total / Math.max(averageGardes, 1);
            score += (1 - Math.min(gardeRatio, 1)) * 10; // max 10 points

            // Équité pour les weekends et jours fériés
            if (isWeekend) {
                const avgWeekendsGardes = this.getAverageWeekendGardesPerUser();
                const weekendRatio = counter.gardes.weekends / Math.max(avgWeekendsGardes, 1);
                score += (1 - Math.min(weekendRatio, 1)) * 8 * this.rulesConfig.equite.poidsGardesWeekend;
            }

            if (isFerie) {
                const avgFeriesGardes = this.getAverageFeriesGardesPerUser();
                const ferieRatio = counter.gardes.feries / Math.max(avgFeriesGardes, 1);
                score += (1 - Math.min(ferieRatio, 1)) * 8 * this.rulesConfig.equite.poidsGardesFeries;
            }

            // Score de fatigue inverse (moins fatigué = meilleur score)
            const fatigueRatio = counter.fatigue.score / this.fatigueConfig.seuils.critique;
            score += (1 - Math.min(fatigueRatio, 1)) * 8;

            return { user, score };
        });

        // Tri par score décroissant
        scoredCandidates.sort((a, b) => b.score - a.score);

        return scoredCandidates[0].user;
    }

    /**
     * Calcule la moyenne des gardes par utilisateur
     */
    private getAverageGardesPerUser(): number {
        let totalGardes = 0;
        let userCount = 0;

        for (const [_, counter] of this.userCounters) {
            totalGardes += counter.gardes.total;
            userCount++;
        }

        return userCount ? totalGardes / userCount : 0;
    }

    /**
     * Calcule la moyenne des gardes de weekend par utilisateur
     */
    private getAverageWeekendGardesPerUser(): number {
        let totalWeekendGardes = 0;
        let userCount = 0;

        for (const [_, counter] of this.userCounters) {
            totalWeekendGardes += counter.gardes.weekends;
            userCount++;
        }

        return userCount ? totalWeekendGardes / userCount : 0;
    }

    /**
     * Calcule la moyenne des gardes les jours fériés par utilisateur
     */
    private getAverageFeriesGardesPerUser(): number {
        let totalFeriesGardes = 0;
        let userCount = 0;

        for (const [_, counter] of this.userCounters) {
            totalFeriesGardes += counter.gardes.feries;
            userCount++;
        }

        return userCount ? totalFeriesGardes / userCount : 0;
    }

    /**
     * Génère les consultations pour la période spécifiée
     */
    generateConsultations(): Assignment[] {
        // Similaire à generateGardes mais avec des règles différentes
        // Implémentation à compléter...
        return [];
    }

    /**
     * Valide le planning généré
     */
    validatePlanning(): ValidationResult {
        const violations: RuleViolation[] = [];

        // Vérification des contraintes du planning
        this.checkForViolations(violations);

        // Calcul des métriques
        const metrics = {
            equiteScore: this.calculateEquityScore(),
            fatigueScore: this.calculateFatigueScore(),
            satisfactionScore: 0 // À implémenter
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
        // À implémenter: vérification des règles métier
        // Exemple: détection des intervalles trop courts entre gardes

        // Vérification des intervalles minimum entre gardes
        this.checkMinimumGardeIntervals(violations);

        // Vérification du nombre maximum de gardes par mois
        this.checkMaxGardesPerMonth(violations);

        // Vérification des incompatibilités (gardes consécutives, etc.)
        this.checkConsecutiveAssignments(violations);

        // Vérification des scores de fatigue critiques
        this.checkFatigueScores(violations);
    }

    /**
     * Vérifie les intervalles minimum entre gardes
     */
    private checkMinimumGardeIntervals(violations: RuleViolation[]): void {
        // Pour chaque utilisateur, vérifier les gardes trop rapprochées
        this.personnel.forEach(user => {
            const userGardes = this.results.gardes
                .filter(g => g.userId === user.id)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            for (let i = 1; i < userGardes.length; i++) {
                const previous = new Date(userGardes[i - 1].date);
                const current = new Date(userGardes[i].date);
                const daysBetween = this.getDaysBetween(previous, current);

                if (daysBetween < this.rulesConfig.intervalle.minJoursEntreGardes) {
                    violations.push({
                        id: `violation-${Math.random().toString(36).substring(2, 9)}`,
                        type: 'INTERVALLE_GARDE',
                        severity: daysBetween < 3 ? 'CRITICAL' : 'MAJOR',
                        message: `Intervalle trop court entre gardes pour ${user.prenom} ${user.nom}: ${daysBetween} jours`,
                        affectedAssignments: [userGardes[i - 1].id, userGardes[i].id]
                    });
                }
            }
        });
    }

    /**
     * Vérifie le nombre maximum de gardes par mois
     */
    private checkMaxGardesPerMonth(violations: RuleViolation[]): void {
        // Pour chaque utilisateur, vérifier le nombre de gardes par mois
        this.personnel.forEach(user => {
            // Regrouper les gardes par mois
            const gardesByMonth: Record<string, Assignment[]> = {};

            this.results.gardes
                .filter(g => g.userId === user.id)
                .forEach(garde => {
                    const date = new Date(garde.date);
                    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

                    if (!gardesByMonth[monthKey]) {
                        gardesByMonth[monthKey] = [];
                    }

                    gardesByMonth[monthKey].push(garde);
                });

            // Vérifier les mois avec trop de gardes
            Object.entries(gardesByMonth).forEach(([monthKey, gardes]) => {
                if (gardes.length > this.rulesConfig.intervalle.maxGardesMois) {
                    violations.push({
                        id: `violation-${Math.random().toString(36).substring(2, 9)}`,
                        type: 'MAX_GARDES_MOIS',
                        severity: 'MAJOR',
                        message: `Trop de gardes pour ${user.prenom} ${user.nom} en ${monthKey}: ${gardes.length}/${this.rulesConfig.intervalle.maxGardesMois}`,
                        affectedAssignments: gardes.map(g => g.id)
                    });
                }
            });
        });
    }

    /**
     * Vérifie les affectations consécutives
     */
    private checkConsecutiveAssignments(violations: RuleViolation[]): void {
        if (!this.rulesConfig.qualiteVie.eviterConsecutifs) return;

        // Pour chaque utilisateur, vérifier les affectations consécutives
        this.personnel.forEach(user => {
            const userAssignments = [...this.results.gardes, ...this.results.astreintes]
                .filter(a => a.userId === user.id)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            for (let i = 1; i < userAssignments.length; i++) {
                const previous = new Date(userAssignments[i - 1].date);
                const current = new Date(userAssignments[i].date);
                previous.setHours(0, 0, 0, 0);
                current.setHours(0, 0, 0, 0);

                const nextDay = new Date(previous);
                nextDay.setDate(nextDay.getDate() + 1);

                if (nextDay.getTime() === current.getTime()) {
                    violations.push({
                        id: `violation-${Math.random().toString(36).substring(2, 9)}`,
                        type: 'AFFECTATIONS_CONSECUTIVES',
                        severity: 'MINOR',
                        message: `Affectations consécutives pour ${user.prenom} ${user.nom}: ${previous.toISOString().split('T')[0]} et ${current.toISOString().split('T')[0]}`,
                        affectedAssignments: [userAssignments[i - 1].id, userAssignments[i].id]
                    });
                }
            }
        });
    }

    /**
     * Vérifie les scores de fatigue critiques
     */
    private checkFatigueScores(violations: RuleViolation[]): void {
        // Pour chaque utilisateur, vérifier le score de fatigue
        this.userCounters.forEach((counter, userId) => {
            if (counter.fatigue.score > this.fatigueConfig.seuils.critique) {
                const user = this.personnel.find(u => u.id === userId);
                if (!user) return;

                violations.push({
                    id: `violation-${Math.random().toString(36).substring(2, 9)}`,
                    type: 'FATIGUE_CRITIQUE',
                    severity: 'CRITICAL',
                    message: `Score de fatigue critique pour ${user.prenom} ${user.nom}: ${counter.fatigue.score}/${this.fatigueConfig.seuils.critique}`,
                    affectedAssignments: []
                });
            }
        });
    }

    /**
     * Calcule le score d'équité global
     */
    private calculateEquityScore(): number {
        // Calcul de l'écart-type des gardes entre utilisateurs
        const gardesCounts = Array.from(this.userCounters.values())
            .map(counter => {
                // Pondération des gardes
                return counter.gardes.total +
                    (counter.gardes.weekends * this.rulesConfig.equite.poidsGardesWeekend) +
                    (counter.gardes.feries * this.rulesConfig.equite.poidsGardesFeries);
            });

        const mean = gardesCounts.reduce((sum, count) => sum + count, 0) / gardesCounts.length;
        const variance = gardesCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / gardesCounts.length;
        const stdDev = Math.sqrt(variance);

        // Normaliser sur 100 (0 = parfaitement équitable, 100 = très inéquitable)
        const maxPossibleStdDev = mean; // Cas le plus inéquitable: certains ont tout, d'autres rien
        const equityScore = 100 - (stdDev / maxPossibleStdDev * 100);

        return Math.max(0, Math.min(100, equityScore));
    }

    /**
     * Calcule le score de fatigue global
     */
    private calculateFatigueScore(): number {
        const fatigueScores = Array.from(this.userCounters.values())
            .map(counter => counter.fatigue.score);

        const maxFatigue = this.fatigueConfig.seuils.critique;
        const avgFatigue = fatigueScores.reduce((sum, score) => sum + score, 0) / fatigueScores.length;

        // Normaliser sur 100 (0 = très fatigué, 100 = pas fatigué)
        return Math.max(0, Math.min(100, 100 - (avgFatigue / maxFatigue * 100)));
    }

    /**
     * Exécute la génération complète du planning
     */
    async generateFullPlanning(): Promise<ValidationResult> {
        if (this.parameters.etapesActives.includes(AssignmentType.GARDE)) {
            this.generateGardes();
        }

        if (this.parameters.etapesActives.includes(AssignmentType.ASTREINTE)) {
            // Génération des astreintes (à implémenter)
        }

        if (this.parameters.etapesActives.includes(AssignmentType.CONSULTATION)) {
            this.generateConsultations();
        }

        if (this.parameters.etapesActives.includes(AssignmentType.BLOC)) {
            // Génération des affectations de bloc (à implémenter)
        }

        return this.validatePlanning();
    }

    /**
     * Récupère le planning généré
     */
    getResults(): {
        gardes: Assignment[];
        astreintes: Assignment[];
        consultations: Assignment[];
        blocs: Assignment[];
    } {
        return this.results;
    }
} 