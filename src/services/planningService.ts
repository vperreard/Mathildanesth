import { Assignment, RuleViolation } from '../types/assignment';
import { TrameAffectationService } from './trameAffectationService';
import { UserService } from './userService';
import { PeriodeType } from '@/models/TrameAffectation';
import { addDays, addWeeks, addMonths, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

interface PlanningSlot {
    userId: number;
    date: Date;
    periodeType: PeriodeType;
    motif: string;
}

export class PlanningService {
    /**
     * Enregistre les modifications d'affectations en base de données
     */
    static async saveAssignments(assignments: Assignment[]): Promise<boolean> {
        try {
            // Simuler une requête API
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Dans un cas réel, appel à l'API:
            // const response = await fetch('/api/assignments/batch', {
            //   method: 'PATCH',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ assignments })
            // });

            // return response.ok;

            console.log('Assignments sauvegardés:', assignments);
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des affectations:', error);
            return false;
        }
    }

    /**
     * Valide les affectations par rapport aux règles métier
     */
    static async validateAssignments(assignments: Assignment[]): Promise<RuleViolation[]> {
        try {
            // Simuler une requête API
            await new Promise(resolve => setTimeout(resolve, 500));

            // Dans un cas réel, appel à l'API:
            // const response = await fetch('/api/assignments/validate', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ assignments })
            // });

            // if (!response.ok) throw new Error('Erreur de validation');
            // const data = await response.json();
            // return data.violations;

            // Simuler un résultat de validation vide (aucune violation)
            return [];
        } catch (error) {
            console.error('Erreur lors de la validation des affectations:', error);
            throw error;
        }
    }

    /**
     * Récupère les affectations pour une période donnée
     */
    static async getAssignments(startDate: Date, endDate: Date): Promise<Assignment[]> {
        try {
            // Simuler une requête API
            await new Promise(resolve => setTimeout(resolve, 800));

            // Dans un cas réel, appel à l'API:
            // const response = await fetch(`/api/assignments?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
            // if (!response.ok) throw new Error('Erreur lors de la récupération des affectations');
            // const data = await response.json();
            // return data.assignments;

            // Pour la démo, on génère des affectations fictives
            return [];
        } catch (error) {
            console.error('Erreur lors de la récupération des affectations:', error);
            throw error;
        }
    }

    static async generatePlanning(startDate: Date, endDate: Date) {
        try {
            // Récupérer toutes les trames d'affectation
            const trames = await TrameAffectationService.findAll();
            const planning: PlanningSlot[] = [];

            // Pour chaque trame, générer les affectations selon la période
            for (const trame of trames) {
                const affectations = this.generateAffectationsFromTrame(trame, startDate, endDate);
                planning.push(...affectations);
            }

            // Trier le planning par date
            return planning.sort((a, b) => a.date.getTime() - b.date.getTime());
        } catch (error) {
            console.error('Erreur lors de la génération du planning:', error);
            throw new Error('Impossible de générer le planning');
        }
    }

    private static generateAffectationsFromTrame(
        trame: any,
        startDate: Date,
        endDate: Date
    ): PlanningSlot[] {
        const affectations: PlanningSlot[] = [];
        let currentDate = new Date(trame.dateDebut);

        while (currentDate <= endDate) {
            if (currentDate >= startDate) {
                affectations.push({
                    userId: trame.userId,
                    date: new Date(currentDate),
                    periodeType: trame.periodeType,
                    motif: trame.motif,
                });
            }

            // Calculer la prochaine date selon le type de période
            switch (trame.periodeType) {
                case 'HEBDOMADAIRE':
                    currentDate = addWeeks(currentDate, 1);
                    break;
                case 'BI_HEBDOMADAIRE':
                    currentDate = addWeeks(currentDate, 2);
                    break;
                case 'MENSUEL':
                    currentDate = addMonths(currentDate, 1);
                    break;
            }
        }

        return affectations;
    }

    static async getPlanningForUser(userId: number, startDate: Date, endDate: Date) {
        try {
            const planning = await this.generatePlanning(startDate, endDate);
            return planning.filter(slot => slot.userId === userId);
        } catch (error) {
            console.error('Erreur lors de la récupération du planning de l\'utilisateur:', error);
            throw new Error('Impossible de récupérer le planning de l\'utilisateur');
        }
    }

    static async getPlanningForDate(date: Date) {
        try {
            const startOfTheDay = startOfDay(date);
            const endOfTheDay = endOfDay(date);
            const planning = await this.generatePlanning(startOfTheDay, endOfTheDay);

            // Enrichir les données avec les informations des utilisateurs
            const enrichedPlanning = await Promise.all(
                planning.map(async (slot) => {
                    const user = await UserService.findById(slot.userId);
                    return {
                        ...slot,
                        user: {
                            id: user.id,
                            firstName: user.firstName,
                            lastName: user.lastName,
                        },
                    };
                })
            );

            return enrichedPlanning;
        } catch (error) {
            console.error('Erreur lors de la récupération du planning pour la date:', error);
            throw new Error('Impossible de récupérer le planning pour la date');
        }
    }

    static async validatePlanning(planning: PlanningSlot[]) {
        try {
            const conflicts: { date: Date; users: number[] }[] = [];

            // Vérifier les conflits d'affectation
            for (let i = 0; i < planning.length; i++) {
                for (let j = i + 1; j < planning.length; j++) {
                    if (
                        planning[i].date.getTime() === planning[j].date.getTime() &&
                        planning[i].userId === planning[j].userId
                    ) {
                        conflicts.push({
                            date: planning[i].date,
                            users: [planning[i].userId],
                        });
                    }
                }
            }

            return {
                isValid: conflicts.length === 0,
                conflicts,
            };
        } catch (error) {
            console.error('Erreur lors de la validation du planning:', error);
            throw new Error('Impossible de valider le planning');
        }
    }
} 