/**
 * Système de gestion de la fatigue pour le moteur de règles
 */

/**
 * Types d'gardes/vacations qui peuvent générer de la fatigue
 */
export enum AssignmentType {
    GARDE = 'GARDE',
    ASTREINTE = 'ASTREINTE',
    SUPERVISION = 'SUPERVISION',
    PEDIATRIE = 'PEDIATRIE',
    CONSULTATION = 'CONSULTATION',
    BLOC = 'BLOC'
}

/**
 * Types de périodes de repos
 */
export enum OffPeriodType {
    JOUR_COMPLET = 'JOUR_COMPLET',
    DEMI_JOURNEE = 'DEMI_JOURNEE',
    WEEKEND = 'WEEKEND',
    CONGES = 'CONGES'
}

/**
 * Configuration du système de fatigue
 */
export interface FatigueConfig {
    points: {
        // Points de fatigue par type d'affectation
        garde: number;
        astreinte: number;
        supervisionMultiple: number;
        pediatrie: number;
        specialiteLourde: number;
        [key: string]: number;
    };
    recovery: {
        // Points de récupération par type de repos
        jourOff: number;
        demiJourneeOff: number;
        weekend: number;
        [key: string]: number;
    };
    seuils: {
        // Seuils de fatigue
        alerte: number;
        critique: number;
        [key: string]: number;
    };
}

/**
 * Représentation d'une affectation
 */
export interface Attribution {
    id: string;
    type: AssignmentType;
    medecinId: string;
    startDate: Date;
    endDate: Date;
    service?: string;
    supervisionCount?: number;
    specialite?: string;
    [key: string]: any;
}

/**
 * Représentation d'une période de repos
 */
export interface OffPeriod {
    id: string;
    type: OffPeriodType;
    medecinId: string;
    startDate: Date;
    endDate: Date;
    [key: string]: any;
}

/**
 * Représentation de l'état de fatigue d'un médecin
 */
export interface FatigueState {
    score: number;
    history: Array<{
        date: Date;
        score: number;
        reason: string;
    }>;
    lastUpdate: Date;
}

/**
 * Représentation d'un médecin avec son état de fatigue
 */
export interface Medecin {
    id: string;
    nom: string;
    prenom: string;
    fatigue: FatigueState;
    [key: string]: any;
}

/**
 * Système de gestion de la fatigue
 */
export class FatigueSystem {
    private config: FatigueConfig;

    constructor(config: FatigueConfig) {
        this.config = config;
    }

    /**
     * Calculer les points de fatigue pour une affectation
     */
    calculateFatiguePoints(attribution: Attribution): number {
        let points = 0;

        switch (attribution.type) {
            case AssignmentType.GARDE:
                points += this.config.points.garde;
                break;
            case AssignmentType.ASTREINTE:
                points += this.config.points.astreinte;
                break;
            case AssignmentType.SUPERVISION:
                if (attribution.supervisionCount && attribution.supervisionCount > 2) {
                    points += this.config.points.supervisionMultiple;
                }
                break;
            case AssignmentType.PEDIATRIE:
                points += this.config.points.pediatrie;
                break;
            default:
                // Si l'affectation a une propriété "specialite" qui correspond à une spécialité lourde
                if (attribution.specialite && this.isSpecialiteLourde(attribution.specialite)) {
                    points += this.config.points.specialiteLourde;
                }
                break;
        }

        // Ajout de points supplémentaires pour les gardes de nuit
        if (this.isNightShift(attribution)) {
            points += 5; // Points additionnels pour les gardes de nuit
        }

        return points;
    }

    /**
     * Calculer la récupération de fatigue pour une période de repos
     */
    calculateRecovery(offPeriod: OffPeriod): number {
        let recovery = 0;

        switch (offPeriod.type) {
            case OffPeriodType.JOUR_COMPLET:
                recovery = this.config.recovery.jourOff;
                break;
            case OffPeriodType.DEMI_JOURNEE:
                recovery = this.config.recovery.demiJourneeOff;
                break;
            case OffPeriodType.WEEKEND:
                recovery = this.config.recovery.weekend;
                break;
            case OffPeriodType.CONGES:
                // Pour les congés, calculer la récupération en fonction du nombre de jours
                const joursDiff = this.calculateDaysBetween(offPeriod.startDate, offPeriod.endDate);
                recovery = this.config.recovery.jourOff * joursDiff;
                break;
        }

        return recovery;
    }

    /**
     * Vérifier si un médecin peut prendre une affectation sans dépasser les seuils de fatigue
     */
    canTakeAssignment(medecin: Medecin, attribution: Attribution): boolean {
        const currentFatigue = medecin.fatigue.score;
        const additionalFatigue = this.calculateFatiguePoints(attribution);
        const projectedFatigue = currentFatigue + additionalFatigue;

        if (projectedFatigue > this.config.seuils.critique) {
            return false;
        }

        if (projectedFatigue > this.config.seuils.alerte) {
            // Vérifier si des mesures compensatoires sont prévues
            return this.hasCompensatoryMeasures(medecin, attribution);
        }

        return true;
    }

    /**
     * Mettre à jour le score de fatigue d'un médecin après une affectation
     */
    updateFatigueAfterAssignment(medecin: Medecin, attribution: Attribution): Medecin {
        const additionalFatigue = this.calculateFatiguePoints(attribution);

        const updatedFatigue: FatigueState = {
            score: medecin.fatigue.score + additionalFatigue,
            history: [
                ...medecin.fatigue.history,
                {
                    date: new Date(),
                    score: medecin.fatigue.score + additionalFatigue,
                    reason: `Garde/Vacation ${attribution.type} (${attribution.id})`
                }
            ],
            lastUpdate: new Date()
        };

        return {
            ...medecin,
            fatigue: updatedFatigue
        };
    }

    /**
     * Mettre à jour le score de fatigue d'un médecin après une période de repos
     */
    updateFatigueAfterRest(medecin: Medecin, offPeriod: OffPeriod): Medecin {
        const recoveryPoints = this.calculateRecovery(offPeriod);
        const newScore = Math.max(0, medecin.fatigue.score - recoveryPoints); // Le score ne peut pas être négatif

        const updatedFatigue: FatigueState = {
            score: newScore,
            history: [
                ...medecin.fatigue.history,
                {
                    date: new Date(),
                    score: newScore,
                    reason: `Repos ${offPeriod.type} (${offPeriod.id})`
                }
            ],
            lastUpdate: new Date()
        };

        return {
            ...medecin,
            fatigue: updatedFatigue
        };
    }

    /**
     * Vérifier si une spécialité est considérée comme "lourde" (générant plus de fatigue)
     */
    private isSpecialiteLourde(specialite: string): boolean {
        const specialitesLourdes = ['TRAUMATOLOGIE', 'NEUROCHIRURGIE', 'REANIMATION', 'URGENCES'];
        return specialitesLourdes.includes(specialite.toUpperCase());
    }

    /**
     * Vérifier si une affectation est une garde de nuit
     */
    private isNightShift(attribution: Attribution): boolean {
        // Considérer comme garde de nuit si l'affectation commence après 18h et finit avant 8h
        const startHour = attribution.startDate.getHours();
        const endHour = attribution.endDate.getHours();

        return (startHour >= 18 || startHour <= 8) && (endHour >= 18 || endHour <= 8);
    }

    /**
     * Vérifier si des mesures compensatoires sont prévues pour un médecin ayant un niveau de fatigue élevé
     */
    private hasCompensatoryMeasures(medecin: Medecin, attribution: Attribution): boolean {
        // Cette méthode est une implémentation simplifiée
        // Dans un système réel, elle vérifierait si des jours de repos sont planifiés après l'affectation
        return false;
    }

    /**
     * Calculer le nombre de jours entre deux dates
     */
    private calculateDaysBetween(startDate: Date, endDate: Date): number {
        const oneDay = 24 * 60 * 60 * 1000; // Nombre de millisecondes dans une journée
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        return Math.round(diffTime / oneDay) + 1; // +1 pour inclure le jour de début
    }
} 