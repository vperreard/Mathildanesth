import {
    Rule,
    ShiftRule,
    LeaveRule,
    AvailabilityRule,
    RuleType,
    RuleEvaluationContext,
    RuleEvaluationResult,
    RuleSeverity,
    Shift,
    Leave,
    Doctor
} from '../types/rule';
import { LogLevel, ILoggerService } from '../../../services/loggerService';
import { addDays, differenceInDays, differenceInHours, isWithinInterval, parseISO } from 'date-fns';

/**
 * Service d'évaluation des règles
 */
export class RuleEvaluationService {
    constructor(private loggerService: ILoggerService) { }

    /**
     * Évalue une règle selon le contexte fourni
     * @param rule Règle à évaluer
     * @param context Contexte d'évaluation
     * @returns Résultat de l'évaluation
     */
    public evaluateRule(rule: Rule, context: RuleEvaluationContext): RuleEvaluationResult {
        try {
            if (!rule.enabled) {
                return this.createResult(rule.id, true, rule.severity, 'Règle désactivée', null);
            }

            // Vérifier si la règle s'applique au contexte
            if (!this.isRuleApplicable(rule, context)) {
                return this.createResult(rule.id, true, rule.severity, 'Règle non applicable dans ce contexte', null);
            }

            let result: RuleEvaluationResult;

            switch (rule.type) {
                // Règles liées aux gardes
                case RuleType.MIN_REST_PERIOD:
                    result = this.evaluateMinRestPeriod(rule, context);
                    break;
                case RuleType.MAX_SHIFTS_PER_WEEK:
                    result = this.evaluateMaxShiftsPerWeek(rule, context);
                    break;
                case RuleType.SHIFT_QUALIFICATION:
                    result = this.evaluateShiftQualification(rule, context);
                    break;

                // Règles liées aux congés
                case RuleType.MIN_ADVANCE_NOTICE:
                    result = this.evaluateMinAdvanceNotice(rule, context);
                    break;
                case RuleType.SEASON_QUOTA:
                    result = this.evaluateSeasonQuota(rule, context);
                    break;

                default:
                    this.loggerService.log(LogLevel.WARNING, `Type de règle non pris en charge: ${rule.type}`);
                    result = this.createResult(
                        rule.id,
                        false,
                        rule.severity,
                        `Type de règle non pris en charge: ${rule.type}`,
                        null
                    );
            }

            return result;
        } catch (error) {
            this.loggerService.log(LogLevel.ERROR, `Erreur lors de l'évaluation de la règle ${rule.id}: ${error.message}`);
            return this.createResult(
                rule.id,
                false,
                RuleSeverity.ERROR,
                `Erreur lors de l'évaluation: ${error.message}`,
                { error }
            );
        }
    }

    /**
     * Évalue une liste de règles selon le contexte fourni
     */
    public evaluateRules(rules: Rule[], context: RuleEvaluationContext): RuleEvaluationResult[] {
        return rules
            .sort((a, b) => b.priority - a.priority) // Trier par priorité (décroissante)
            .map(rule => this.evaluateRule(rule, context));
    }

    /**
     * Vérifie si toutes les règles sont respectées
     */
    public allRulesPassed(results: RuleEvaluationResult[]): boolean {
        return results.every(result => result.passed);
    }

    /**
     * Filtre les résultats par niveau de sévérité
     */
    public filterResultsBySeverity(results: RuleEvaluationResult[], severities: RuleSeverity[]): RuleEvaluationResult[] {
        return results.filter(result => severities.includes(result.severity));
    }

    /**
     * Trouve les résultats qui n'ont pas passé l'évaluation
     */
    public getFailedResults(results: RuleEvaluationResult[]): RuleEvaluationResult[] {
        return results.filter(result => !result.passed);
    }

    /**
     * Vérifie si une règle s'applique au contexte donné
     */
    private ruleAppliesToContext(rule: Rule, context: RuleEvaluationContext): boolean {
        // Si la règle est globale, elle s'applique à tous
        if (rule.scope === 'global') {
            return true;
        }

        // Vérifier selon la portée de la règle
        switch (rule.scope) {
            case 'user':
                // La règle s'applique-t-elle à l'utilisateur spécifié?
                return context.userId !== undefined &&
                    (Array.isArray(rule.scopeValue)
                        ? rule.scopeValue.includes(context.userId)
                        : rule.scopeValue === context.userId);

            case 'role':
                // La règle s'applique-t-elle au rôle de l'utilisateur?
                return context.userRole !== undefined &&
                    (Array.isArray(rule.scopeValue)
                        ? rule.scopeValue.includes(context.userRole)
                        : rule.scopeValue === context.userRole);

            case 'specialty':
                // La règle s'applique-t-elle à la spécialité?
                return context.specialty !== undefined &&
                    (Array.isArray(rule.scopeValue)
                        ? rule.scopeValue.includes(context.specialty)
                        : rule.scopeValue === context.specialty);

            case 'service':
                // La règle s'applique-t-elle au service?
                return context.service !== undefined &&
                    (Array.isArray(rule.scopeValue)
                        ? rule.scopeValue.includes(context.service)
                        : rule.scopeValue === context.service);

            default:
                return false;
        }
    }

    /**
     * Vérifie si une règle est applicable au contexte actuel
     */
    private isRuleApplicable(rule: Rule, context: RuleEvaluationContext): boolean {
        // Règles liées aux gardes nécessitent un proposedShift
        if ([RuleType.MIN_REST_PERIOD, RuleType.MAX_SHIFTS_PER_WEEK, RuleType.SHIFT_QUALIFICATION].includes(rule.type)
            && !context.proposedShift) {
            return false;
        }

        // Règles liées aux congés nécessitent un proposedLeave
        if ([RuleType.MIN_ADVANCE_NOTICE, RuleType.SEASON_QUOTA].includes(rule.type)
            && !context.proposedLeave) {
            return false;
        }

        // Vérification du médecin si nécessaire
        if (!context.doctor) {
            return false;
        }

        return true;
    }

    /**
     * Crée un résultat d'évaluation
     */
    private createResult(
        ruleId: string,
        passed: boolean,
        severity: RuleSeverity,
        message: string,
        details: any
    ): RuleEvaluationResult {
        return {
            ruleId,
            passed,
            severity,
            message,
            details
        };
    }

    /**
     * Évalue la règle de période de repos minimum entre gardes
     */
    private evaluateMinRestPeriod(rule: Rule, context: RuleEvaluationContext): RuleEvaluationResult {
        const { proposedShift, existingShifts } = context;
        const minHours = rule.parameters.minHours || 11; // Valeur par défaut

        if (!proposedShift || !existingShifts || existingShifts.length === 0) {
            return this.createResult(rule.id, true, rule.severity, 'Aucune garde existante à comparer', null);
        }

        const proposedStart = parseISO(proposedShift.startTime);

        // Vérifier pour chaque garde existante
        for (const shift of existingShifts) {
            const shiftEnd = parseISO(shift.endTime);
            const hoursDiff = differenceInHours(proposedStart, shiftEnd);

            if (hoursDiff >= 0 && hoursDiff < minHours) {
                return this.createResult(
                    rule.id,
                    false,
                    rule.severity,
                    `Période de repos insuffisante (${hoursDiff}h < ${minHours}h requis)`,
                    { hoursDiff, minHours, conflictingShift: shift }
                );
            }
        }

        return this.createResult(
            rule.id,
            true,
            rule.severity,
            `Période de repos respectée (>= ${minHours}h)`,
            null
        );
    }

    /**
     * Évalue la règle du nombre maximum de gardes par semaine
     */
    private evaluateMaxShiftsPerWeek(rule: Rule, context: RuleEvaluationContext): RuleEvaluationResult {
        const { proposedShift, existingShifts, doctor } = context;
        const maxShifts = rule.parameters.maxShifts || 2; // Valeur par défaut

        if (!proposedShift || !existingShifts || !doctor) {
            return this.createResult(rule.id, true, rule.severity, 'Données insuffisantes pour évaluer', null);
        }

        const proposedDate = parseISO(proposedShift.startTime);
        const weekStart = this.getStartOfWeek(proposedDate);
        const weekEnd = addDays(weekStart, 6);

        // Compter les gardes dans la semaine concernée
        const shiftsInWeek = existingShifts.filter(shift => {
            const shiftDate = parseISO(shift.startTime);
            return isWithinInterval(shiftDate, { start: weekStart, end: weekEnd });
        });

        // Si l'ajout de la nouvelle garde dépasse le maximum
        if (shiftsInWeek.length >= maxShifts) {
            return this.createResult(
                rule.id,
                false,
                rule.severity,
                `Maximum de ${maxShifts} gardes par semaine dépassé`,
                {
                    currentCount: shiftsInWeek.length,
                    maxAllowed: maxShifts,
                    weekRange: { start: weekStart.toISOString(), end: weekEnd.toISOString() }
                }
            );
        }

        return this.createResult(
            rule.id,
            true,
            rule.severity,
            `Nombre de gardes par semaine respecté (${shiftsInWeek.length + 1}/${maxShifts})`,
            null
        );
    }

    /**
     * Évalue la règle des qualifications requises pour une garde
     */
    private evaluateShiftQualification(rule: Rule, context: RuleEvaluationContext): RuleEvaluationResult {
        const { proposedShift, doctor } = context;
        const requiredQualifications = rule.parameters.qualifications || [];

        if (!proposedShift || !doctor) {
            return this.createResult(rule.id, true, rule.severity, 'Données insuffisantes pour évaluer', null);
        }

        // Si aucune qualification n'est requise
        if (requiredQualifications.length === 0) {
            return this.createResult(rule.id, true, rule.severity, 'Aucune qualification spécifique requise', null);
        }

        // Vérifier si le médecin possède toutes les qualifications requises
        const missingQualifications = requiredQualifications.filter(
            qual => !doctor.qualifications.includes(qual)
        );

        if (missingQualifications.length > 0) {
            return this.createResult(
                rule.id,
                false,
                rule.severity,
                `Qualifications manquantes pour cette garde: ${missingQualifications.join(', ')}`,
                { missingQualifications, doctorQualifications: doctor.qualifications }
            );
        }

        return this.createResult(
            rule.id,
            true,
            rule.severity,
            'Toutes les qualifications requises sont présentes',
            null
        );
    }

    /**
     * Évalue la règle de préavis minimum pour les congés
     */
    private evaluateMinAdvanceNotice(rule: Rule, context: RuleEvaluationContext): RuleEvaluationResult {
        const { proposedLeave, currentDate } = context;
        const minDays = rule.parameters.minDays || 30; // Valeur par défaut

        if (!proposedLeave || !currentDate) {
            return this.createResult(rule.id, true, rule.severity, 'Données insuffisantes pour évaluer', null);
        }

        const today = parseISO(currentDate);
        const leaveStart = parseISO(proposedLeave.startDate);
        const daysNotice = differenceInDays(leaveStart, today);

        if (daysNotice < minDays) {
            return this.createResult(
                rule.id,
                false,
                rule.severity,
                `Préavis insuffisant (${daysNotice} jours < ${minDays} jours requis)`,
                { daysNotice, minDays }
            );
        }

        return this.createResult(
            rule.id,
            true,
            rule.severity,
            `Préavis respecté (${daysNotice} jours >= ${minDays} jours requis)`,
            null
        );
    }

    /**
     * Évalue la règle de quota de congés par saison
     */
    private evaluateSeasonQuota(rule: Rule, context: RuleEvaluationContext): RuleEvaluationResult {
        const { proposedLeave, existingLeaves, doctor } = context;
        const seasonQuota = rule.parameters.quota || 10; // Valeur par défaut
        const seasonStart = rule.parameters.seasonStart || '06-01'; // Format MM-DD
        const seasonEnd = rule.parameters.seasonEnd || '09-30'; // Format MM-DD

        if (!proposedLeave || !existingLeaves || !doctor) {
            return this.createResult(rule.id, true, rule.severity, 'Données insuffisantes pour évaluer', null);
        }

        const leaveStart = parseISO(proposedLeave.startDate);
        const leaveEnd = parseISO(proposedLeave.endDate);
        const year = leaveStart.getFullYear();

        // Créer les dates de début et fin de saison
        const seasonStartDate = parseISO(`${year}-${seasonStart}`);
        const seasonEndDate = parseISO(`${year}-${seasonEnd}`);

        // Vérifier si le congé proposé est dans la saison
        if (!this.isDateRangeOverlapping(
            leaveStart, leaveEnd,
            seasonStartDate, seasonEndDate
        )) {
            return this.createResult(
                rule.id,
                true,
                rule.severity,
                'Le congé proposé est en dehors de la période de restriction saisonnière',
                null
            );
        }

        // Calculer les jours de congés déjà pris dans la saison
        let daysTakenInSeason = 0;
        for (const leave of existingLeaves) {
            if (leave.status === 'approved') {
                const existingStart = parseISO(leave.startDate);
                const existingEnd = parseISO(leave.endDate);

                if (this.isDateRangeOverlapping(
                    existingStart, existingEnd,
                    seasonStartDate, seasonEndDate
                )) {
                    // Calculer jours de chevauchement
                    daysTakenInSeason += this.calculateOverlappingDays(
                        existingStart, existingEnd,
                        seasonStartDate, seasonEndDate
                    );
                }
            }
        }

        // Calculer jours du congé proposé pendant la saison
        const proposedDaysInSeason = this.calculateOverlappingDays(
            leaveStart, leaveEnd,
            seasonStartDate, seasonEndDate
        );

        // Vérifier si le quota est dépassé
        if (daysTakenInSeason + proposedDaysInSeason > seasonQuota) {
            return this.createResult(
                rule.id,
                false,
                rule.severity,
                `Quota de congés saisonniers dépassé (${daysTakenInSeason} jours déjà pris + ${proposedDaysInSeason} jours demandés > ${seasonQuota} jours autorisés)`,
                {
                    daysTakenInSeason,
                    proposedDaysInSeason,
                    seasonQuota,
                    season: { start: seasonStartDate.toISOString(), end: seasonEndDate.toISOString() }
                }
            );
        }

        return this.createResult(
            rule.id,
            true,
            rule.severity,
            `Quota de congés saisonniers respecté (${daysTakenInSeason + proposedDaysInSeason}/${seasonQuota} jours)`,
            null
        );
    }

    // ---------- MÉTHODES UTILITAIRES ----------

    /**
     * Obtient la date de début de semaine (lundi)
     */
    private getStartOfWeek(date: Date): Date {
        const day = date.getDay();
        const diff = (day === 0 ? 6 : day - 1); // Ajustement pour commencer le lundi (1)
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() - diff);
    }

    /**
     * Vérifie si deux plages de dates se chevauchent
     */
    private isDateRangeOverlapping(
        start1: Date, end1: Date,
        start2: Date, end2: Date
    ): boolean {
        return start1 <= end2 && start2 <= end1;
    }

    /**
     * Calcule le nombre de jours qui se chevauchent entre deux plages de dates
     */
    private calculateOverlappingDays(
        start1: Date, end1: Date,
        start2: Date, end2: Date
    ): number {
        const overlapStart = start1 < start2 ? start2 : start1;
        const overlapEnd = end1 < end2 ? end1 : end2;
        return Math.max(0, differenceInDays(overlapEnd, overlapStart) + 1);
    }
}

// Exporter une instance unique du service
export const ruleEvaluationService = new RuleEvaluationService(); 