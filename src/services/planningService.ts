import { Assignment, RuleViolation } from '../types/assignment';
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
     * Enregistre les modifications d'affectations en base de données (via API)
     */
    static async saveAssignments(assignments: Assignment[]): Promise<boolean> {
        try {
            // Appel à l'API pour sauvegarder
            const response = await fetch('/api/affectations', { // Supposons une route PATCH ou POST pour la sauvegarde
                method: 'PATCH', // ou 'POST'
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignments })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Erreur API lors de la sauvegarde:', errorData);
                throw new Error(errorData.error || 'Erreur lors de la sauvegarde des affectations via API');
            }

            console.log('Assignments sauvegardés via API:', assignments);
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des affectations via API:', error);
            return false;
        }
    }

    /**
     * Valide les affectations par rapport aux règles métier (via API)
     */
    static async validateAssignments(assignments: Assignment[]): Promise<RuleViolation[]> {
        try {
            // Appel à l'API pour valider
            const response = await fetch('/api/affectations/validate', { // Supposons une route POST pour la validation
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignments })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Erreur API lors de la validation:', errorData);
                throw new Error(errorData.error || 'Erreur lors de la validation des affectations via API');
            }
            const data = await response.json();
            return data.violations || []; // Assurer que violations est un tableau
        } catch (error) {
            console.error('Erreur lors de la validation des affectations via API:', error);
            // Renvoyer une structure d'erreur cohérente si nécessaire, ou lancer l'erreur
            throw error; // ou return [{ ruleId: 'API_ERROR', message: error.message, assignmentId: '' }];
        }
    }

    /**
     * Récupère les affectations pour une période donnée (via API)
     */
    static async getAssignments(startDate: Date, endDate: Date): Promise<Assignment[]> {
        try {
            // Appel à l'API GET créée précédemment
            const response = await fetch(`/api/affectations?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Erreur API lors de la récupération:', errorData);
                throw new Error(errorData.error || 'Erreur lors de la récupération des affectations via API');
            }
            const data = await response.json();
            // Assurer que les dates sont des objets Date
            return (data.assignments || []).map((a: any) => ({
                ...a,
                date: new Date(a.date)
            }));
        } catch (error) {
            console.error('Erreur lors de la récupération des affectations via API:', error);
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
        trame: any,
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