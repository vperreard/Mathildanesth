import { RuleEvaluationContext, RuleEvaluationResult, Rule, RuleSeverity } from '../types/rule';
import { Attribution, OffPeriodType } from './fatigue-system';

/**
 * Configuration des règles temporelles
 */
export interface TemporalRulesConfig {
    // Règles d'espacement des gardes
    shiftSpacing: {
        // Minimum de jours entre deux gardes (standard)
        minDaysBetween: number;
        // Minimum de jours entre deux gardes (par type de garde)
        minDaysBetweenByType: {
            [key: string]: number;
        };
        // Espacement optimal des gardes (en jours)
        idealDaysBetween: number;
    };

    // Règles de repos obligatoire
    mandatoryRest: {
        // Repos obligatoire après garde
        restAfterDuty: boolean;
        // Durée du repos (en heures)
        restDuration: number;
        // Types de gardes nécessitant un repos spécifique
        specialRestByShiftType: {
            [key: string]: number;
        };
    };

    // Règles d'incompatibilité
    incompatibilities: {
        // Types d'gardes/vacations incompatibles
        shiftTypes: string[][];
        // Durée minimale entre deux types d'gardes/vacations incompatibles (en heures)
        minTimeBetween: {
            [key: string]: {
                [key: string]: number;
            };
        };
        // Services incompatibles (ne peut pas enchaîner ces services)
        services: string[][];
    };
}

/**
 * Service de gestion des règles temporelles
 */
export class TemporalRulesService {
    private config: TemporalRulesConfig;

    constructor(config: TemporalRulesConfig) {
        this.config = config;
    }

    /**
     * Vérifie si une garde/vacation respecte les règles d'espacement des gardes
     */
    validateShiftSpacing(rule: Rule, context: RuleEvaluationContext): RuleEvaluationResult {
        const { proposedShift, existingShifts, doctor } = context;

        if (!proposedShift || !existingShifts || !doctor) {
            return {
                ruleId: rule.id,
                passed: true,
                severity: rule.severity,
                message: "Contexte incomplet pour évaluer l'espacement des gardes",
                details: null
            };
        }

        // Filtrer les gardes précédentes du même médecin
        const previousShifts = existingShifts.filter(
            shift => shift.doctorId === doctor.id
        );

        if (previousShifts.length === 0) {
            return {
                ruleId: rule.id,
                passed: true,
                severity: rule.severity,
                message: "Pas de gardes précédentes pour ce médecin",
                details: null
            };
        }

        // Convertir les dates en objets Date
        const proposedStartDate = new Date(proposedShift.startTime);

        // Vérifier l'espacement avec chaque garde précédente
        for (const previousShift of previousShifts) {
            const previousEndDate = new Date(previousShift.endTime);

            // Calculer le nombre de jours entre la fin de la garde précédente et le début de la garde proposée
            const daysBetween = this.calculateDaysBetween(previousEndDate, proposedStartDate);

            // Déterminer le minimum requis (standard ou spécifique au type)
            let minRequired = this.config.shiftSpacing.minDaysBetween;
            const shiftType = previousShift.type;

            if (this.config.shiftSpacing.minDaysBetweenByType[shiftType]) {
                minRequired = this.config.shiftSpacing.minDaysBetweenByType[shiftType];
            }

            // Si l'espacement est insuffisant
            if (daysBetween < minRequired) {
                return {
                    ruleId: rule.id,
                    passed: false,
                    severity: rule.severity,
                    message: `Espacement insuffisant entre les gardes (${daysBetween} jours, minimum requis: ${minRequired})`,
                    details: {
                        daysBetween,
                        minRequired,
                        previousShift,
                        proposedShift
                    }
                };
            }
        }

        return {
            ruleId: rule.id,
            passed: true,
            severity: rule.severity,
            message: "Espacement des gardes respecté",
            details: null
        };
    }

    /**
     * Vérifie si une garde/vacation respecte les règles de repos obligatoire
     */
    validateMandatoryRest(rule: Rule, context: RuleEvaluationContext): RuleEvaluationResult {
        const { proposedShift, doctor, existingShifts } = context;

        if (!proposedShift || !doctor || !existingShifts) {
            return {
                ruleId: rule.id,
                passed: true,
                severity: rule.severity,
                message: "Contexte incomplet pour évaluer le repos obligatoire",
                details: null
            };
        }

        // Si le repos après garde n'est pas obligatoire selon la config
        if (!this.config.mandatoryRest.restAfterDuty) {
            return {
                ruleId: rule.id,
                passed: true,
                severity: rule.severity,
                message: "Pas de repos obligatoire configuré",
                details: null
            };
        }

        // Convertir les dates en objets Date
        const proposedStartDate = new Date(proposedShift.startTime);
        const proposedEndDate = new Date(proposedShift.endTime);

        // Filtrer les gardes précédentes du même médecin
        const previousShifts = existingShifts.filter(
            shift => shift.doctorId === doctor.id
        );

        // Vérifier que le médecin a eu suffisamment de repos après sa dernière garde
        for (const previousShift of previousShifts) {
            const previousEndDate = new Date(previousShift.endTime);

            // Si la garde proposée commence avant la fin de la précédente (incohérence)
            if (proposedStartDate < previousEndDate) {
                return {
                    ruleId: rule.id,
                    passed: false,
                    severity: RuleSeverity.ERROR,
                    message: "La garde proposée commence avant la fin d'une garde existante",
                    details: {
                        proposedShift,
                        previousShift
                    }
                };
            }

            // Calculer la durée de repos en heures
            const hoursBetween = this.calculateHoursBetween(previousEndDate, proposedStartDate);

            // Déterminer la durée requise (standard ou spécifique au type)
            let requiredRest = this.config.mandatoryRest.restDuration;
            const shiftType = previousShift.type;

            if (this.config.mandatoryRest.specialRestByShiftType[shiftType]) {
                requiredRest = this.config.mandatoryRest.specialRestByShiftType[shiftType];
            }

            // Si le repos est insuffisant
            if (hoursBetween < requiredRest) {
                return {
                    ruleId: rule.id,
                    passed: false,
                    severity: rule.severity,
                    message: `Repos insuffisant après garde (${hoursBetween.toFixed(1)} heures, minimum requis: ${requiredRest})`,
                    details: {
                        hoursBetween,
                        requiredRest,
                        previousShift,
                        proposedShift
                    }
                };
            }
        }

        return {
            ruleId: rule.id,
            passed: true,
            severity: rule.severity,
            message: "Repos obligatoire respecté",
            details: null
        };
    }

    /**
     * Vérifie si une garde/vacation respecte les règles d'incompatibilité
     */
    validateIncompatibilities(rule: Rule, context: RuleEvaluationContext): RuleEvaluationResult {
        const { proposedShift, doctor, existingShifts } = context;

        if (!proposedShift || !doctor || !existingShifts) {
            return {
                ruleId: rule.id,
                passed: true,
                severity: rule.severity,
                message: "Contexte incomplet pour évaluer les incompatibilités",
                details: null
            };
        }

        // Convertir les dates en objets Date
        const proposedStartDate = new Date(proposedShift.startTime);
        const proposedEndDate = new Date(proposedShift.endTime);

        // Filtrer les gardes/vacations du même médecin
        const doctorShifts = existingShifts.filter(
            shift => shift.doctorId === doctor.id
        );

        // Vérifier les incompatibilités de types d'garde/vacation
        for (const incompatibleTypes of this.config.incompatibilities.shiftTypes) {
            if (incompatibleTypes.includes(proposedShift.type)) {
                // Trouver toutes les gardes/vacations incompatibles
                const incompatibleShifts = doctorShifts.filter(
                    shift => incompatibleTypes.includes(shift.type)
                );

                for (const incompatibleShift of incompatibleShifts) {
                    const incompatibleEndDate = new Date(incompatibleShift.endTime);

                    // Vérifier si le temps minimum entre gardes/vacations incompatibles est respecté
                    const minHoursBetween = this.getMinHoursBetweenTypes(
                        incompatibleShift.type,
                        proposedShift.type
                    );

                    const hoursBetween = this.calculateHoursBetween(
                        incompatibleEndDate,
                        proposedStartDate
                    );

                    if (hoursBetween < minHoursBetween) {
                        return {
                            ruleId: rule.id,
                            passed: false,
                            severity: rule.severity,
                            message: `Incompatibilité entre ${incompatibleShift.type} et ${proposedShift.type} (temps minimum: ${minHoursBetween} heures)`,
                            details: {
                                incompatibleShift,
                                proposedShift,
                                hoursBetween,
                                minHoursBetween
                            }
                        };
                    }
                }
            }
        }

        // Vérifier les incompatibilités de services
        if (proposedShift.service) {
            for (const incompatibleServices of this.config.incompatibilities.services) {
                if (incompatibleServices.includes(proposedShift.service)) {
                    // Trouver toutes les gardes/vacations dans des services incompatibles
                    const incompatibleShifts = doctorShifts.filter(
                        shift => shift.service && incompatibleServices.includes(shift.service)
                    );

                    if (incompatibleShifts.length > 0) {
                        return {
                            ruleId: rule.id,
                            passed: false,
                            severity: rule.severity,
                            message: `Services incompatibles: ${proposedShift.service} est incompatible avec ${incompatibleShifts[0].service}`,
                            details: {
                                incompatibleServices,
                                proposedService: proposedShift.service,
                                existingServices: incompatibleShifts.map(s => s.service)
                            }
                        };
                    }
                }
            }
        }

        return {
            ruleId: rule.id,
            passed: true,
            severity: rule.severity,
            message: "Aucune incompatibilité détectée",
            details: null
        };
    }

    /**
     * Calcule le nombre de jours entre deux dates
     */
    private calculateDaysBetween(startDate: Date, endDate: Date): number {
        const oneDay = 24 * 60 * 60 * 1000; // millisecondes dans une journée
        const diffMs = Math.abs(endDate.getTime() - startDate.getTime());
        return Math.round(diffMs / oneDay);
    }

    /**
     * Calcule le nombre d'heures entre deux dates
     */
    private calculateHoursBetween(startDate: Date, endDate: Date): number {
        const oneHour = 60 * 60 * 1000; // millisecondes dans une heure
        const diffMs = Math.abs(endDate.getTime() - startDate.getTime());
        return diffMs / oneHour;
    }

    /**
     * Récupère le temps minimum requis entre deux types d'gardes/vacations
     */
    private getMinHoursBetweenTypes(type1: string, type2: string): number {
        const minHoursByType = this.config.incompatibilities.minTimeBetween;

        // Vérifier si une règle spécifique existe pour ces types
        if (minHoursByType[type1] && minHoursByType[type1][type2]) {
            return minHoursByType[type1][type2];
        }

        // Vérifier dans l'autre sens
        if (minHoursByType[type2] && minHoursByType[type2][type1]) {
            return minHoursByType[type2][type1];
        }

        // Valeur par défaut si aucune règle spécifique n'est définie
        return 24; // 24 heures par défaut
    }
} 