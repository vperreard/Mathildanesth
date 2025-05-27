import { Attribution, RuleViolation } from '../types/attribution';
// Suppression des imports serveur inutiles côté client
// import { TrameAffectationService } from './trameAffectationService';
// import { UserService } from './userService';
// import { PeriodeType } from '@/models/TrameAffectation';
// import { addDays, addWeeks, addMonths, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

interface PlanningSlot {
    userId: number;
    date: Date;
    // periodeType: PeriodeType;
    motif: string;
}

export class PlanningService {
    /**
     * Enregistre les modifications d'gardes/vacations en base de données (via API)
     */
    static async saveAssignments(attributions: Attribution[]): Promise<boolean> {
        try {
            // Appel à l'API pour sauvegarder
            const response = await fetch('http://localhost:3000/api/gardes/vacations', { // Supposons une route PATCH ou POST pour la sauvegarde
                method: 'PATCH', // ou 'POST'
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attributions })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Erreur API lors de la sauvegarde:', errorData);
                throw new Error(errorData.error || 'Erreur lors de la sauvegarde des gardes/vacations via API');
            }

            console.log('Attributions sauvegardés via API:', attributions);
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des gardes/vacations via API:', error);
            return false;
        }
    }

    /**
     * Valide les gardes/vacations par rapport aux règles métier (via API)
     */
    static async validateAssignments(attributions: Attribution[]): Promise<RuleViolation[]> {
        try {
            // Appel à l'API pour valider
            const response = await fetch('http://localhost:3000/api/gardes/vacations/validate', { // Supposons une route POST pour la validation
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attributions })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Erreur API lors de la validation:', errorData);
                throw new Error(errorData.error || 'Erreur lors de la validation des gardes/vacations via API');
            }
            const data = await response.json();
            return data.violations || []; // Assurer que violations est un tableau
        } catch (error) {
            console.error('Erreur lors de la validation des gardes/vacations via API:', error);
            // Renvoyer une structure d'erreur cohérente si nécessaire, ou lancer l'erreur
            throw error; // ou return [{ ruleId: 'API_ERROR', message: error.message, assignmentId: '' }];
        }
    }

    /**
     * Récupère les gardes/vacations pour une période donnée (via API)
     */
    static async getAssignments(startDate: Date, endDate: Date): Promise<Attribution[]> {
        try {
            // Appel à l'API GET créée précédemment
            const response = await fetch(`http://localhost:3000/api/gardes/vacations?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Erreur API lors de la récupération:', errorData);
                throw new Error(errorData.error || 'Erreur lors de la récupération des gardes/vacations via API');
            }
            const data = await response.json();
            // Assurer que les dates sont des objets Date
            return (data.attributions || []).map((a: any) => ({
                ...a,
                date: new Date(a.date)
            }));
        } catch (error) {
            console.error('Erreur lors de la récupération des gardes/vacations via API:', error);
            throw error;
        }
    }

    // --- Les méthodes suivantes dépendent directement des services serveur ---
    // --- Elles ne doivent PAS être appelées côté client --- 
    // --- Il faudra créer des API routes pour ces fonctionnalités si nécessaire côté client ---
    /*
    static async generatePlanning(startDate: Date, endDate: Date) {
        // ... Logique serveur ...
    }

    private static generateAffectationsFromTrame(
        tableau de service: any,
        startDate: Date,
        endDate: Date
    ): PlanningSlot[] {
        // ... Logique serveur ...
    }

    static async getPlanningForUser(userId: number, startDate: Date, endDate: Date) {
        // ... Logique serveur ...
    }

    static async getPlanningForDate(date: Date) {
       // ... Logique serveur ...
    }

    static async validatePlanning(planning: PlanningSlot[]) {
        // ... Logique serveur ...
    }
    */

    // --- Fin des méthodes serveur --- 
} 