import { Medecin } from './fatigue-system';

/**
 * Configuration du système d'équité
 */
export interface EquityConfig {
    weights: {
        // Poids des différents facteurs dans le calcul de l'équité
        heures: number;
        gardes: number;
        weekends: number;
        fetes: number;
        fatigue: number;
        [key: string]: number;
    };
    quotas: {
        // Quotas de repos et congés
        minOffPerWeek: number;
        maxOffPerWeek: number;
        minOffPerMonth: number;
        [key: string]: number;
    };
}

/**
 * Créneau disponible pour un jour de repos
 */
export interface OffSlot {
    id: string;
    date: Date;
    type: 'MATIN' | 'APRES_MIDI' | 'JOUR_COMPLET' | 'WEEKEND';
    isWeekend: boolean;
    isHoliday: boolean;
}

/**
 * Résultat de la distribution des jours de repos
 */
export type Distribution = Map<string, OffSlot[]>;

/**
 * Contexte pour le calcul d'équité
 */
export interface PlanningContext {
    startDate: Date;
    endDate: Date;
    departement: string;
    medecins: Medecin[];
    gardesParMedecin: Map<string, number>;
    heuresParMedecin: Map<string, number>;
    weekendsParMedecin: Map<string, number>;
    fetesParMedecin: Map<string, number>;
    [key: string]: any;
}

/**
 * Score combiné pour un médecin
 */
interface CombinedScore {
    medecin: Medecin;
    score: number;
    currentOff: OffSlot[];
}

/**
 * Système de gestion de l'équité
 */
export class EquitySystem {
    private config: EquityConfig;

    constructor(config: EquityConfig) {
        this.config = config;
    }

    /**
     * Calculer le score d'équité global pour un médecin
     */
    calculateEquityScore(medecin: Medecin, context: PlanningContext): number {
        const scores = {
            heures: this.calculateHoursEquity(medecin, context),
            gardes: this.calculateDutyEquity(medecin, context),
            weekends: this.calculateWeekendEquity(medecin, context),
            fetes: this.calculateHolidayEquity(medecin, context),
            fatigue: this.calculateFatigueEquity(medecin, context)
        };

        // Appliquer les pondérations
        return Object.entries(scores).reduce((total, [key, value]) => {
            return total + (value * (this.config.weights[key] || 0));
        }, 0);
    }

    /**
     * Calculer l'équité en termes d'heures travaillées
     */
    private calculateHoursEquity(medecin: Medecin, context: PlanningContext): number {
        const heures = context.heuresParMedecin.get(medecin.id) || 0;
        const moyenneHeures = this.calculateAverage(context.heuresParMedecin);

        // Score inversé : plus le nombre d'heures est élevé, plus le score est bas
        // Normalisé entre 0 et 1, où 1 est le meilleur score
        return this.normalizeInverse(heures, moyenneHeures * 0.7, moyenneHeures * 1.3);
    }

    /**
     * Calculer l'équité en termes de gardes
     */
    private calculateDutyEquity(medecin: Medecin, context: PlanningContext): number {
        const gardes = context.gardesParMedecin.get(medecin.id) || 0;
        const moyenneGardes = this.calculateAverage(context.gardesParMedecin);

        // Score inversé : plus le nombre de gardes est élevé, plus le score est bas
        return this.normalizeInverse(gardes, moyenneGardes * 0.7, moyenneGardes * 1.3);
    }

    /**
     * Calculer l'équité en termes de week-ends travaillés
     */
    private calculateWeekendEquity(medecin: Medecin, context: PlanningContext): number {
        const weekends = context.weekendsParMedecin.get(medecin.id) || 0;
        const moyenneWeekends = this.calculateAverage(context.weekendsParMedecin);

        // Score inversé : plus le nombre de week-ends est élevé, plus le score est bas
        return this.normalizeInverse(weekends, moyenneWeekends * 0.7, moyenneWeekends * 1.3);
    }

    /**
     * Calculer l'équité en termes de jours fériés travaillés
     */
    private calculateHolidayEquity(medecin: Medecin, context: PlanningContext): number {
        const fetes = context.fetesParMedecin.get(medecin.id) || 0;
        const moyenneFetes = this.calculateAverage(context.fetesParMedecin);

        // Score inversé : plus le nombre de jours fériés est élevé, plus le score est bas
        return this.normalizeInverse(fetes, moyenneFetes * 0.7, moyenneFetes * 1.3);
    }

    /**
     * Calculer l'équité en termes de fatigue
     */
    private calculateFatigueEquity(medecin: Medecin, context: PlanningContext): number {
        // Score inversé : plus la fatigue est élevée, plus le score est bas
        return this.normalizeInverse(medecin.fatigue.score, 30, 100);
    }

    /**
     * Distribuer les jours de repos de manière équitable
     */
    distributeOffDays(medecins: Medecin[], availableSlots: OffSlot[]): Distribution {
        // 1. Garantir le minimum pour tous
        const distribution = this.ensureMinimumOff(medecins, availableSlots);

        // 2. Distribuer le reste selon le score combiné
        const remainingSlots = this.getRemainingSlots(availableSlots, distribution);

        // 3. Calculer les scores combinés
        const scores = medecins.map(m => ({
            medecin: m,
            score: this.calculateCombinedScore(m),
            currentOff: distribution.get(m.id) || []
        }));

        // 4. Distribuer en respectant les quotas
        return this.distributeByScore(scores, remainingSlots, distribution);
    }

    /**
     * S'assurer que chaque médecin a le minimum de jours de repos
     */
    private ensureMinimumOff(medecins: Medecin[], availableSlots: OffSlot[]): Distribution {
        const distribution = new Map<string, OffSlot[]>();
        const minPerWeek = this.config.quotas.minOffPerWeek;

        // Initialiser la distribution pour chaque médecin
        medecins.forEach(m => {
            distribution.set(m.id, []);
        });

        // Grouper les créneaux par semaine
        const slotsByWeek = this.groupSlotsByWeek(availableSlots);

        // Pour chaque semaine, attribuer le minimum de créneaux à chaque médecin
        // Convertir le Map en Array avant de le parcourir pour éviter les erreurs de linter
        Array.from(slotsByWeek.entries()).forEach(([weekNumber, slotsInWeek]) => {
            // Trier les médecins par score de fatigue (du plus fatigué au moins fatigué)
            const sortedMedecins = [...medecins].sort((a, b) => b.fatigue.score - a.fatigue.score);

            // Pour chaque médecin, attribuer le minimum de créneaux
            for (const medecin of sortedMedecins) {
                const currentOffInWeek = this.countOffInWeek(
                    distribution.get(medecin.id) || [],
                    weekNumber
                );

                // Si le médecin n'a pas encore son minimum pour cette semaine
                if (currentOffInWeek < minPerWeek && slotsInWeek.length > 0) {
                    // Nombre de créneaux à attribuer
                    const neededSlots = Math.min(
                        minPerWeek - currentOffInWeek,
                        slotsInWeek.length
                    );

                    // Attribuer les créneaux
                    const allocatedSlots = slotsInWeek.splice(0, neededSlots);
                    const existingSlots = distribution.get(medecin.id) || [];

                    distribution.set(medecin.id, [...existingSlots, ...allocatedSlots]);
                }
            }
        });

        return distribution;
    }

    /**
     * Récupérer les créneaux restants après distribution initiale
     */
    private getRemainingSlots(allSlots: OffSlot[], distribution: Distribution): OffSlot[] {
        // Créer un ensemble de tous les IDs de créneaux déjà distribués
        const distributedSlotIds = new Set<string>();

        // Convertir la Map en Array avant de parcourir les valeurs
        Array.from(distribution.values()).forEach(créneaux => {
            créneaux.forEach(créneau => distributedSlotIds.add(créneau.id));
        });

        // Retourner les créneaux non distribués
        return allSlots.filter(créneau => !distributedSlotIds.has(créneau.id));
    }

    /**
     * Calculer un score combiné pour un médecin (prenant en compte fatigue et historique)
     */
    private calculateCombinedScore(medecin: Medecin): number {
        // Formule simple : plus la fatigue est élevée, plus le score est élevé (priorité pour les repos)
        return medecin.fatigue.score;
    }

    /**
     * Distribuer les créneaux restants selon les scores
     */
    private distributeByScore(
        scores: CombinedScore[],
        remainingSlots: OffSlot[],
        existingDistribution: Distribution
    ): Distribution {
        // Créer une copie de la distribution existante
        const finalDistribution = new Map<string, OffSlot[]>();

        existingDistribution.forEach((créneaux, medecinId) => {
            finalDistribution.set(medecinId, [...créneaux]);
        });

        // Tant qu'il reste des créneaux à distribuer
        while (remainingSlots.length > 0) {
            // Trier les médecins par score (du plus élevé au plus bas)
            scores.sort((a, b) => b.score - a.score);

            // Prendre le médecin avec le score le plus élevé
            const topMedecin = scores[0];

            // Vérifier si le médecin peut encore recevoir des créneaux (quota max)
            const currentOffCount = finalDistribution.get(topMedecin.medecin.id)?.length || 0;

            // Calculer le nombre de semaines dans la période
            const weekCount = 4; // Simplification - idéalement calculé à partir des dates

            if (currentOffCount < this.config.quotas.maxOffPerWeek * weekCount) {
                // Attribuer le premier créneau disponible
                const créneau = remainingSlots.shift();
                if (créneau) {
                    const existingSlots = finalDistribution.get(topMedecin.medecin.id) || [];
                    finalDistribution.set(topMedecin.medecin.id, [...existingSlots, créneau]);

                    // Mettre à jour le score du médecin (baisse un peu la priorité)
                    topMedecin.score *= 0.95;
                    topMedecin.currentOff = finalDistribution.get(topMedecin.medecin.id) || [];
                }
            } else {
                // Le médecin a atteint son quota, le retirer de la liste
                scores.shift();

                // Si plus aucun médecin ne peut recevoir de créneaux, sortir de la boucle
                if (scores.length === 0) break;
            }
        }

        return finalDistribution;
    }

    /**
     * Grouper les créneaux par semaine
     */
    private groupSlotsByWeek(créneaux: OffSlot[]): Map<number, OffSlot[]> {
        const slotsByWeek = new Map<number, OffSlot[]>();

        créneaux.forEach(créneau => {
            const weekNumber = this.getWeekNumber(créneau.date);

            if (!slotsByWeek.has(weekNumber)) {
                slotsByWeek.set(weekNumber, []);
            }

            slotsByWeek.get(weekNumber)?.push(créneau);
        });

        return slotsByWeek;
    }

    /**
     * Compter le nombre de créneaux de repos pour un médecin dans une semaine donnée
     */
    private countOffInWeek(créneaux: OffSlot[], weekNumber: number): number {
        return créneaux.filter(créneau => this.getWeekNumber(créneau.date) === weekNumber).length;
    }

    /**
     * Obtenir le numéro de semaine d'une date
     */
    private getWeekNumber(date: Date): number {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    /**
     * Calculer la moyenne d'une Map de valeurs numériques
     */
    private calculateAverage(map: Map<string, number>): number {
        if (map.size === 0) return 0;

        let sum = 0;
        map.forEach(value => {
            sum += value;
        });

        return sum / map.size;
    }

    /**
     * Normaliser une valeur inversée (plus la valeur est basse, meilleur est le score)
     */
    private normalizeInverse(value: number, min: number, max: number): number {
        // Assurer que la valeur est dans les limites
        const clampedValue = Math.max(min, Math.min(max, value));

        // Normaliser et inverser (1 est le meilleur score, 0 le pire)
        return 1 - ((clampedValue - min) / (max - min));
    }
} 