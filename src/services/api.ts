import { User } from '../types/user';
import { Assignment, ValidationResult } from '../types/assignment';
import { apiConfig } from '../config/api';

// Définir un type pour la réponse de l'API de génération
interface GeneratePlanningResponse {
    assignments: Assignment[];
    validationResult: ValidationResult;
}

/**
 * Service API pour les opérations liées aux utilisateurs et aux affectations
 */
export class ApiService {
    private static instance: ApiService;

    private constructor() { }

    public static getInstance(): ApiService {
        if (!ApiService.instance) {
            ApiService.instance = new ApiService();
        }
        return ApiService.instance;
    }

    /**
     * Récupère la liste des utilisateurs actifs
     */
    async getActiveUsers(): Promise<User[]> {
        try {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.users.active}`, {
                headers: apiConfig.headers,
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des utilisateurs');
            }
            return await response.json();
        } catch (error) {
            console.error('Erreur API:', error);
            throw error;
        }
    }

    /**
     * Récupère les affectations existantes pour une période donnée
     */
    async getExistingAssignments(startDate: Date, endDate: Date): Promise<Assignment[]> {
        try {
            const response = await fetch(
                `${apiConfig.baseUrl}${apiConfig.endpoints.assignments.byDateRange(
                    startDate.toISOString(),
                    endDate.toISOString()
                )}`,
                {
                    headers: apiConfig.headers,
                    credentials: 'include'
                }
            );
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des affectations');
            }
            return await response.json();
        } catch (error) {
            console.error('Erreur API:', error);
            throw error;
        }
    }

    /**
     * Sauvegarde les affectations générées
     */
    async saveAssignments(assignments: Assignment[]): Promise<void> {
        try {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.assignments.create}`, {
                method: 'POST',
                headers: apiConfig.headers,
                body: JSON.stringify(assignments),
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Erreur lors de la sauvegarde des affectations');
            }
        } catch (error) {
            console.error('Erreur API:', error);
            throw error;
        }
    }

    /**
     * Génère un nouveau planning
     */
    async generatePlanning(parameters: any): Promise<GeneratePlanningResponse> {
        try {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.planning.generate}`, {
                method: 'POST',
                headers: apiConfig.headers,
                body: JSON.stringify(parameters),
                credentials: 'include'
            });
            if (!response.ok) {
                // Essayer de lire le message d'erreur du corps de la réponse
                let errorBody = 'Erreur inconnue lors de la génération.';
                try {
                    const errorData = await response.json();
                    errorBody = errorData.error || JSON.stringify(errorData);
                } catch (parseError) {
                    // Si le corps n'est pas JSON ou vide
                    errorBody = await response.text() || response.statusText;
                }
                throw new Error(`Erreur lors de la génération du planning: ${errorBody} (Status: ${response.status})`);
            }
            return await response.json();
        } catch (error) {
            console.error('Erreur API (generatePlanning):', error);
            throw error;
        }
    }

    /**
     * Valide un planning
     */
    async validatePlanning(assignments: Assignment[]): Promise<any> {
        try {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.planning.validate}`, {
                method: 'POST',
                headers: apiConfig.headers,
                body: JSON.stringify(assignments),
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Erreur lors de la validation du planning');
            }
            return await response.json();
        } catch (error) {
            console.error('Erreur API (validatePlanning):', error);
            throw error;
        }
    }

    /**
     * Approuve un planning
     */
    async approvePlanning(assignments: Assignment[]): Promise<void> {
        try {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.planning.approve}`, {
                method: 'POST',
                headers: apiConfig.headers,
                body: JSON.stringify(assignments),
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Erreur lors de l\'approbation du planning');
            }
        } catch (error) {
            console.error('Erreur API (approvePlanning):', error);
            throw error;
        }
    }

    /**
     * Récupère les préférences d'affichage utilisateur
     */
    async getUserPreferences(): Promise<any> {
        try {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.user.preferences}`, {
                headers: apiConfig.headers,
                credentials: 'include'
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur lors de la récupération des préférences (${response.status}): ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Erreur API (getUserPreferences):', error);
            throw error;
        }
    }

    /**
     * Sauvegarde les préférences utilisateur
     * @param preferences Objet des préférences utilisateur
     * @returns Confirmation de la sauvegarde
     */
    async saveUserPreferences(preferences: any): Promise<{ success: boolean }> {
        try {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.user.preferences}`, {
                method: 'PUT',
                headers: apiConfig.headers,
                body: JSON.stringify(preferences),
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Erreur lors de la sauvegarde des préférences');
            }
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des préférences utilisateur:', error);
            throw error;
        }
    }

    /**
     * Sauvegarde un lot d'assignations (création/mise à jour)
     * @param assignments Tableau des assignations à sauvegarder
     * @returns Résultat du traitement par lot
     */
    async saveAssignmentsBatch(assignments: Assignment[]): Promise<{ message: string; count?: number; errors?: any[]; successCount?: number }> {
        try {
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.assignments.batch}`, {
                method: 'POST',
                headers: apiConfig.headers,
                body: JSON.stringify({ assignments }),
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Erreur lors de la sauvegarde des affectations par lots');
            }
            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des assignations par lots:', error);
            throw error;
        }
    }
} 