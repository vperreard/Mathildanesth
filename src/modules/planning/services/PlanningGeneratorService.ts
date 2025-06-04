import { Attribution, AssignmentStatus } from '@/types/assignment';
import { ShiftType } from '@/types/common';
import { User, LeaveStatus } from '@/types/user';
import { RulesConfiguration } from '@/types/rules';
import { addDays, format, isSameDay, isWeekend, isWithinInterval, areIntervalsOverlapping, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export class PlanningGeneratorService {
    protected users: User[];
    private rules: RulesConfiguration;
    protected startDate: Date;
    protected endDate: Date;
    private attributions: Attribution[] = [];

    constructor(
        users: User[],
        rules: RulesConfiguration,
        startDate: Date,
        endDate: Date
    ) {
        this.users = users;
        this.rules = rules;
        this.startDate = startDate;
        this.endDate = endDate;

        // S'assurer que maxGardesConsecutives a une valeur minimale mais raisonnable (généralement 1)
        if (this.rules.intervalle) {
            // Dans le contexte médical normal, on ne fait pas 2 gardes consécutives
            if (this.rules.intervalle.maxGardesConsecutives > 2) {
                this.rules.intervalle.maxGardesConsecutives = 1;
            }
        }
    }

    /**
     * Génère un planning automatique en respectant les contraintes
     */
    public async generatePlanning(): Promise<Attribution[]> {
        // Réinitialiser les affectations
        this.attributions = [];

        // Générer le planning jour par jour
        let currentDate = new Date(this.startDate);
        while (currentDate <= this.endDate) {
            this.generateDayPlanning(currentDate);
            currentDate = addDays(currentDate, 1);
        }

        return this.attributions;
    }

    /**
     * Génère le planning pour un jour spécifique
     */
    private generateDayPlanning(date: Date): void {
        const isWeekendDay = isWeekend(date);
        const shiftTypes = isWeekendDay ? this.rules.weekendShifts : this.rules.weekdayShifts;

        for (const shiftType of shiftTypes) {
            const availableUsers = this.getAvailableUsers(date, shiftType);
            if (availableUsers.length === 0) {
                // Log détaillé pour diagnostic
                console.warn(`Aucun utilisateur disponible pour le shift ${shiftType} le ${format(date, 'dd/MM/yyyy', { locale: fr })}`);
                console.warn(`Users total: ${this.users.length}`);
                console.warn(`Shifts déjà assignés ce jour: ${this.attributions.filter(a => isSameDay(new Date(a.startDate), date)).length}`);

                // Au lieu de lancer une erreur fatale, on essaie des stratégies de fallback
                const fallbackUser = this.findFallbackUser(date, shiftType);
                if (fallbackUser) {
                    console.warn(`Utilisation d'un utilisateur de fallback: ${fallbackUser.firstName || fallbackUser.prenom} ${fallbackUser.lastName || fallbackUser.nom}`);
                    this.createAssignment(fallbackUser, date, shiftType);
                } else {
                    // Si vraiment aucun fallback n'est possible, alors on lance l'erreur
                    throw new Error(`Aucun utilisateur disponible pour le shift ${shiftType} le ${format(date, 'dd/MM/yyyy', { locale: fr })} - Aucune solution de fallback trouvée`);
                }
            } else {
                const selectedUser = this.selectUserWithLeastAssignments(availableUsers);
                this.createAssignment(selectedUser, date, shiftType);
            }
        }
    }

    /**
     * Trouve un utilisateur de fallback en relaxant temporairement certaines contraintes
     */
    private findFallbackUser(date: Date, shiftType: ShiftType): User | null {
        // Première stratégie: ignorer les contraintes de période de repos si c'est le seul problème
        const usersWithSpecialty = this.users.filter(user => {
            const available = this.isUserAvailable(user, date, shiftType);
            const hasSpecialty = this.hasRequiredSpecialty(user, shiftType);
            return hasSpecialty && available; // On garde les contraintes de disponibilité et spécialité
        });

        if (usersWithSpecialty.length > 0) {
            console.warn(`Fallback Strategy 1: Trouvé ${usersWithSpecialty.length} utilisateurs avec spécialité appropriée`);
            return this.selectUserWithLeastAssignments(usersWithSpecialty);
        }

        // Deuxième stratégie: prendre n'importe quel utilisateur disponible (ignorer spécialité temporairement)
        const anyAvailableUsers = this.users.filter(user => this.isUserAvailable(user, date, shiftType));
        if (anyAvailableUsers.length > 0) {
            console.warn(`Fallback Strategy 2: Trouvé ${anyAvailableUsers.length} utilisateurs disponibles (spécialité ignorée)`);
            return this.selectUserWithLeastAssignments(anyAvailableUsers);
        }

        // Troisième stratégie: prendre n'importe quel utilisateur actif (dernier recours)
        const activeUsers = this.users.filter(user => !user.leaves?.some(leave =>
            leave.status === LeaveStatus.APPROVED &&
            new Date(leave.startDate) <= date &&
            new Date(leave.endDate) >= date
        ));

        if (activeUsers.length > 0) {
            console.warn(`Fallback Strategy 3: Trouvé ${activeUsers.length} utilisateurs non en congé (toutes contraintes ignorées)`);
            return this.selectUserWithLeastAssignments(activeUsers);
        }

        return null; // Vraiment aucune solution
    }

    /**
     * Récupère les utilisateurs disponibles pour un shift donné
     */
    protected getAvailableUsers(date: Date, shiftType: ShiftType): User[] {
        return this.users.filter(user => {
            const available = this.isUserAvailable(user, date, shiftType);
            if (!available) {
                return false;
            }
            const respectsRest = this.respectsRestPeriod(user, date, shiftType);
            if (!respectsRest) {
                return false;
            }
            const hasSpecialty = this.hasRequiredSpecialty(user, shiftType);
            if (!hasSpecialty) {
                return false;
            }
            return true;
        });
    }

    /**
     * Vérifie si un utilisateur est disponible pour un shift
     */
    private isUserAvailable(user: User, date: Date, shiftType: ShiftType): boolean {
        // Extraction du nom complet de l'utilisateur (gestion des variantes de nommage)
        const firstName = user.firstName || user.prenom || '';
        const lastName = user.lastName || user.nom || '';
        const userId = `${firstName} ${lastName}`;
        const logPrefix = `isUserAvailable (${format(date, 'yyyy-MM-dd')} ${shiftType} / ${userId}):`;

        // Calculer l'intervalle du shift demandé
        const startTimeString = this.rules.shiftStartTimes[shiftType];
        const shiftStartTime = new Date(date);
        shiftStartTime.setHours(parseInt(startTimeString.split(':')[0]), parseInt(startTimeString.split(':')[1]), 0, 0);

        const endTimeString = this.rules.shiftEndTimes[shiftType];
        const shiftEndTime = new Date(date);
        shiftEndTime.setHours(parseInt(endTimeString.split(':')[0]), parseInt(endTimeString.split(':')[1]), 0, 0);
        if (shiftEndTime <= shiftStartTime) {
            shiftEndTime.setDate(shiftEndTime.getDate() + 1);
        }
        const requestedInterval = { start: shiftStartTime, end: shiftEndTime };

        // Vérifier les congés
        const onLeave = user.leaves?.find(leave =>
            leave.status === LeaveStatus.APPROVED &&
            areIntervalsOverlapping(
                requestedInterval,
                { start: new Date(leave.startDate), end: new Date(leave.endDate) },
                { inclusive: true }
            )
        );
        if (onLeave) {
            console.log(`${logPrefix} REJECTED due to leave: ${onLeave.type} from ${format(new Date(onLeave.startDate), 'yyyy-MM-dd')} to ${format(new Date(onLeave.endDate), 'yyyy-MM-dd')}`);
            return false;
        }

        // Vérification des règles d'incompatibilité entre types d'affectations

        // 1. Vérifier si l'utilisateur a déjà une affectation le même jour
        const sameDayAssignments = this.attributions.filter(a =>
            a.userId === user.id &&
            isSameDay(new Date(a.startDate), date)
        );

        // Si l'utilisateur est déjà affecté ce jour, appliquer les règles spécifiques
        if (sameDayAssignments.length > 0) {
            const existingShiftTypes = sameDayAssignments.map(a => a.shiftType);

            // Règle: Garde est incompatible avec toute autre affectation
            if (shiftType.includes('GARDE') || existingShiftTypes.some(type => type.includes('GARDE'))) {
                console.log(`${logPrefix} REJECTED due to GARDE incompatibility`);
                return false;
            }

            // Règle: Astreinte est compatible avec tout sauf Garde et repos de garde
            if (shiftType.includes('ASTREINTE')) {
                // Si l'utilisateur est en repos après une garde, refuser l'astreinte
                const isPreviousDayGarde = this.attributions.some(a =>
                    a.userId === user.id &&
                    a.shiftType.includes('GARDE') &&
                    differenceInDays(date, new Date(a.endDate)) <= 1
                );

                if (isPreviousDayGarde) {
                    console.log(`${logPrefix} REJECTED due to ASTREINTE incompatible with repos after GARDE`);
                    return false;
                }

                // Astreinte est compatible avec d'autres affectations, donc on continue
            }
            else if (shiftType.includes('CONSULTATION')) {
                // Règle: On peut être en consultation le matin OU l'après-midi (pas les deux)
                const hasMorningConsultation = existingShiftTypes.includes(ShiftType.MATIN) &&
                    shiftType === ShiftType.APRES_MIDI;
                const hasAfternoonConsultation = existingShiftTypes.includes(ShiftType.APRES_MIDI) &&
                    shiftType === ShiftType.MATIN;

                // Consultation est incompatible avec bloc au même moment
                const hasBlockSameTime = (shiftType === ShiftType.MATIN &&
                    existingShiftTypes.some(t => t.includes('BLOC') && t.includes('MATIN'))) ||
                    (shiftType === ShiftType.APRES_MIDI &&
                        existingShiftTypes.some(t => t.includes('BLOC') && t.includes('APRES_MIDI')));

                if (hasMorningConsultation || hasAfternoonConsultation || hasBlockSameTime) {
                    console.log(`${logPrefix} REJECTED due to CONSULTATION incompatibility`);
                    return false;
                }
            }
            else if (shiftType.includes('BLOC')) {
                // Règle: Bloc est incompatible avec consultation au même moment
                const hasConsultationSameTime = (shiftType.includes('MATIN') &&
                    existingShiftTypes.includes(ShiftType.MATIN)) ||
                    (shiftType.includes('APRES_MIDI') &&
                        existingShiftTypes.includes(ShiftType.APRES_MIDI));

                if (hasConsultationSameTime) {
                    console.log(`${logPrefix} REJECTED due to BLOC incompatibility with CONSULTATION`);
                    return false;
                }

                // Règle: Limite du nombre de salles supervisées
                const blocAssignmentsCount = existingShiftTypes.filter(t => t.includes('BLOC')).length;
                const maxSalles = this.rules.supervision?.maxSallesParMAR?.standard || 2;

                if (blocAssignmentsCount >= maxSalles) {
                    console.log(`${logPrefix} REJECTED due to max supervised rooms (${blocAssignmentsCount}/${maxSalles})`);
                    return false;
                }
            }
        }

        // Vérifier si l'utilisateur a fait une garde récemment (ne pas proposer 2 gardes consécutives)
        if (shiftType.includes('GARDE')) {
            const recentGardes = this.attributions.filter(a =>
                a.userId === user.id &&
                a.shiftType.includes('GARDE') &&
                differenceInDays(date, new Date(a.endDate)) <= this.rules.intervalle.minJoursEntreGardes
            );

            if (recentGardes.length > 0) {
                console.log(`${logPrefix} REJECTED due to recent GARDE within minimum interval`);
                return false;
            }
        }

        // Si on arrive ici, l'utilisateur est disponible selon cette fonction
        return true;
    }

    /**
     * Vérifie si l'assignation respecte la période de repos
     */
    private respectsRestPeriod(user: User, date: Date, shiftType: ShiftType): boolean {
        // Calculer l'heure de début réelle du shift demandé AVANT le filtrage
        const startTimeString = this.rules.shiftStartTimes[shiftType];
        const shiftStartTime = new Date(date);
        shiftStartTime.setHours(
            parseInt(startTimeString.split(':')[0]),
            parseInt(startTimeString.split(':')[1]),
            0, 0 // Mettre les secondes et millisecondes à 0 pour être sûr
        );

        const previousAssignments = this.attributions.filter(attribution =>
            attribution.userId === user.id &&
            new Date(attribution.endDate) <= shiftStartTime // Utiliser <= shiftStartTime pour inclure les shifts finissant avant le début du nouveau
        ).sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

        if (previousAssignments.length === 0) return true;

        const lastAssignment = previousAssignments[0];
        const lastAssignmentEndDate = new Date(lastAssignment.endDate);

        // Exception pour les shifts consécutifs le même jour
        if (isSameDay(lastAssignmentEndDate, shiftStartTime)) {
            // Permettre des gardes consécutives le même jour sans exiger de période de repos
            const timeDiffMinutes = (shiftStartTime.getTime() - lastAssignmentEndDate.getTime()) / (1000 * 60);
            if (timeDiffMinutes >= 0 && timeDiffMinutes < 10) {
                return true;
            }
        }

        // Calculer la différence en heures entre la fin du dernier shift et le début du nouveau
        const hoursSinceLastAssignment = (shiftStartTime.getTime() - lastAssignmentEndDate.getTime()) / (1000 * 60 * 60);

        return hoursSinceLastAssignment >= this.rules.minimumRestPeriod;
    }

    /**
     * Vérifie si l'utilisateur a la spécialité requise pour le shift
     */
    private hasRequiredSpecialty(user: User, shiftType: ShiftType): boolean {
        const requiredSpecialties = this.rules.shiftSpecialties[shiftType];
        if (!requiredSpecialties) return true;

        // Gestion sécurisée du cas où user.specialties n'est pas défini
        const userSpecialties = user.specialties || [];
        return userSpecialties.some(specialty =>
            requiredSpecialties.includes(specialty)
        );
    }

    /**
     * Sélectionne l'utilisateur avec le moins d'assignations
     */
    private selectUserWithLeastAssignments(users: User[]): User {
        return users.reduce((selected, current) => {
            const selectedAssignments = this.attributions.filter(a => a.userId === selected.id).length;
            const currentAssignments = this.attributions.filter(a => a.userId === current.id).length;
            return currentAssignments < selectedAssignments ? current : selected;
        });
    }

    /**
     * Crée une nouvelle affectation
     */
    private createAssignment(user: User, date: Date, shiftType: ShiftType): void {
        const startTime = this.rules.shiftStartTimes[shiftType];
        const endTime = this.rules.shiftEndTimes[shiftType];

        const startDate = new Date(date);
        startDate.setHours(parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]));

        const endDate = new Date(date);
        endDate.setHours(parseInt(endTime.split(':')[0]), parseInt(endTime.split(':')[1]));

        const attribution: Attribution = {
            id: `attribution-${Date.now()}`,
            userId: user.id,
            shiftType,
            startDate,
            endDate,
            status: AssignmentStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.attributions.push(attribution);
    }

    /**
     * Valide le planning généré
     */
    public validatePlanning(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Vérifier la couverture des shifts
        this.validateShiftCoverage(errors);

        // Vérifier les périodes de repos
        this.validateRestPeriods(errors);

        // Vérifier les contraintes de spécialité
        this.validateSpecialtyConstraints(errors);

        // Vérifier l'équité des assignations
        this.validateAssignmentEquity(errors);

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Vérifie la couverture des shifts
     */
    private validateShiftCoverage(errors: string[]): void {
        let currentDate = new Date(this.startDate);
        while (currentDate <= this.endDate) {
            const isWeekendDay = isWeekend(currentDate);
            const requiredShifts = isWeekendDay ? this.rules.weekendShifts : this.rules.weekdayShifts;

            for (const shiftType of requiredShifts) {
                const shiftAssignments = this.attributions.filter(attribution =>
                    isSameDay(new Date(attribution.startDate), currentDate) &&
                    attribution.shiftType === shiftType
                );

                if (shiftAssignments.length === 0) {
                    errors.push(`Shift ${shiftType} non couvert le ${format(currentDate, 'dd/MM/yyyy', { locale: fr })}`);
                }
            }

            currentDate = addDays(currentDate, 1);
        }
    }

    /**
     * Vérifie les périodes de repos
     */
    private validateRestPeriods(errors: string[]): void {
        for (const user of this.users) {
            const userAssignments = this.attributions
                .filter(a => a.userId === user.id)
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

            for (let i = 1; i < userAssignments.length; i++) {
                const previousEnd = new Date(userAssignments[i - 1].endDate);
                const currentStart = new Date(userAssignments[i].startDate);
                const hoursBetween = (currentStart.getTime() - previousEnd.getTime()) / (1000 * 60 * 60);

                // Exception pour les shifts consécutifs le même jour
                if (isSameDay(previousEnd, currentStart)) {
                    const minutesBetween = hoursBetween * 60;
                    if (minutesBetween < 10) {
                        // Shifts consécutifs, on ne vérifie pas le repos
                        continue;
                    }
                }

                if (hoursBetween < this.rules.minimumRestPeriod) {
                    const firstName = user.firstName || user.prenom || '';
                    const lastName = user.lastName || user.nom || '';
                    errors.push(
                        `Période de repos insuffisante pour ${firstName} ${lastName} entre le ` +
                        `${format(previousEnd, 'dd/MM/yyyy HH:mm', { locale: fr })} et le ` +
                        `${format(currentStart, 'dd/MM/yyyy HH:mm', { locale: fr })}`
                    );
                }
            }
        }
    }

    /**
     * Vérifie les contraintes de spécialité
     */
    private validateSpecialtyConstraints(errors: string[]): void {
        for (const attribution of this.attributions) {
            const user = this.users.find(u => u.id === attribution.userId);
            if (!user) continue;

            const requiredSpecialties = this.rules.shiftSpecialties[attribution.shiftType];
            if (!requiredSpecialties) continue;

            // Gestion sécurisée du cas où user.specialties n'est pas défini
            const userSpecialties = user.specialties || [];
            const hasRequiredSpecialty = userSpecialties.some(specialty =>
                requiredSpecialties.includes(specialty)
            );

            if (!hasRequiredSpecialty) {
                const firstName = user.firstName || user.prenom || '';
                const lastName = user.lastName || user.nom || '';
                errors.push(
                    `${firstName} ${lastName} n'a pas la spécialité requise pour le shift ` +
                    `${attribution.shiftType} le ${format(new Date(attribution.startDate), 'dd/MM/yyyy', { locale: fr })}`
                );
            }
        }
    }

    /**
     * Vérifie l'équité des assignations
     */
    private validateAssignmentEquity(errors: string[]): void {
        const userAssignments = new Map<string, number>();

        // Compter les assignations par utilisateur
        for (const attribution of this.attributions) {
            const count = userAssignments.get(attribution.userId) || 0;
            userAssignments.set(attribution.userId, count + 1);
        }

        // Calculer la moyenne et l'écart type
        const counts = Array.from(userAssignments.values());
        const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
        const stdDev = Math.sqrt(
            counts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / counts.length
        );

        // Vérifier si l'écart est trop important
        const maxDeviation = this.rules.maxAssignmentDeviation || 2;
        for (const [userId, count] of userAssignments.entries()) {
            if (Math.abs(count - mean) > maxDeviation * stdDev) {
                const user = this.users.find(u => u.id === userId);
                if (user) {
                    const firstName = user.firstName || user.prenom || '';
                    const lastName = user.lastName || user.nom || '';
                    errors.push(
                        `Nombre d'assignations anormal pour ${firstName} ${lastName}: ${count} ` +
                        `(moyenne: ${mean.toFixed(1)}, écart: ${(count - mean).toFixed(1)})`
                    );
                }
            }
        }
    }
} 