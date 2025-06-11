import { User } from '../types/user';
import { logger } from '../lib/logger';
import { Attribution, ValidationResult } from '../types/attribution';
import { apiConfig } from '../config/api';
import Cookies from 'js-cookie';

// Définir un type pour la réponse de l'API de génération
interface GeneratePlanningResponse {
  attributions: Attribution[];
  validationResult: ValidationResult;
}

/**
 * Service API pour les opérations liées aux utilisateurs et aux gardes/vacations
 */
export class ApiService {
  private static instance: ApiService;

  private constructor() {}

  /**
   * Construit l'URL complète pour un endpoint
   */
  private getUrl(endpoint: string): string {
    return endpoint.startsWith('/api/') ? endpoint : `${apiConfig.baseUrl}${endpoint}`;
  }

  /**
   * Obtient les headers avec authentification
   */
  private getAuthHeaders(): HeadersInit {
    const token = Cookies.get('auth_token');
    return {
      ...apiConfig.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

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
      const response = await fetch(this.getUrl(apiConfig.endpoints.users.active), {
        headers: this.getAuthHeaders(),
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des utilisateurs');
      }
      return await response.json();
    } catch (error: unknown) {
      logger.error('Erreur API:', { error: error });
      throw error;
    }
  }

  /**
   * Récupère les gardes/vacations existantes pour une période donnée
   */
  async getExistingAssignments(startDate: Date, endDate: Date): Promise<Attribution[]> {
    try {
      const response = await fetch(
        `${apiConfig.baseUrl}${apiConfig.endpoints.attributions.byDateRange(
          startDate.toISOString(),
          endDate.toISOString()
        )}`,
        {
          headers: this.getAuthHeaders(),
          credentials: 'include',
        }
      );
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des gardes/vacations');
      }
      return await response.json();
    } catch (error: unknown) {
      logger.error('Erreur API:', { error: error });
      throw error;
    }
  }

  /**
   * Sauvegarde les gardes/vacations générées
   */
  async saveAssignments(attributions: Attribution[]): Promise<void> {
    try {
      const response = await fetch(
        `${apiConfig.baseUrl}${apiConfig.endpoints.attributions.create}`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(attributions),
          credentials: 'include',
        }
      );
      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde des gardes/vacations');
      }
    } catch (error: unknown) {
      logger.error('Erreur API:', { error: error });
      throw error;
    }
  }

  /**
   * Génère un nouveau planning
   */
  async generatePlanning(parameters: unknown): Promise<GeneratePlanningResponse> {
    try {
      const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.planning.generate}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(parameters),
        credentials: 'include',
      });
      if (!response.ok) {
        // Essayer de lire le message d'erreur du corps de la réponse
        let errorBody = 'Erreur inconnue lors de la génération.';
        try {
          const errorData = await response.json();
          errorBody = errorData.error || JSON.stringify(errorData);
        } catch (parseError: unknown) {
          // Si le corps n'est pas JSON ou vide
          errorBody = (await response.text()) || response.statusText;
        }
        throw new Error(
          `Erreur lors de la génération du planning: ${errorBody} (Status: ${response.status})`
        );
      }
      return await response.json();
    } catch (error: unknown) {
      logger.error('Erreur API (generatePlanning):', { error: error });
      throw error;
    }
  }

  /**
   * Valide un planning
   */
  async validatePlanning(attributions: Attribution[]): Promise<unknown> {
    try {
      const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.planning.validate}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(attributions),
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Erreur lors de la validation du planning');
      }
      return await response.json();
    } catch (error: unknown) {
      logger.error('Erreur API (validatePlanning):', { error: error });
      throw error;
    }
  }

  /**
   * Approuve un planning
   */
  async approvePlanning(attributions: Attribution[]): Promise<void> {
    try {
      const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.planning.approve}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(attributions),
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error("Erreur lors de l'approbation du planning");
      }
    } catch (error: unknown) {
      logger.error('Erreur API (approvePlanning):', { error: error });
      throw error;
    }
  }

  /**
   * Récupère les préférences d'affichage utilisateur
   */
  async getUserPreferences(): Promise<unknown> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secondes de timeout

      const response = await fetch(this.getUrl(apiConfig.endpoints.user.preferences), {
        headers: this.getAuthHeaders(),
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Erreur lors de la récupération des préférences (${response.status}): ${errorText}`
        );
      }
      return await response.json();
    } catch (error: unknown) {
      logger.error('Erreur API (getUserPreferences):', { error: error });
      throw error;
    }
  }

  /**
   * Sauvegarde les préférences utilisateur
   * @param preferences Objet des préférences utilisateur
   * @returns Confirmation de la sauvegarde
   */
  async saveUserPreferences(preferences: unknown): Promise<{ success: boolean }> {
    try {
      const response = await fetch(this.getUrl(apiConfig.endpoints.user.preferences), {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(preferences),
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde des préférences');
      }
      return await response.json();
    } catch (error: unknown) {
      logger.error('Erreur lors de la sauvegarde des préférences utilisateur:', { error: error });
      throw error;
    }
  }

  /**
   * Sauvegarde un lot d'assignations (création/mise à jour)
   * @param attributions Tableau des assignations à sauvegarder
   * @returns Résultat du traitement par lot
   */
  async saveAssignmentsBatch(
    attributions: Attribution[]
  ): Promise<{ message: string; count?: number; errors?: unknown[]; successCount?: number }> {
    try {
      const response = await fetch(
        `${apiConfig.baseUrl}${apiConfig.endpoints.attributions.batch}`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ attributions }),
          credentials: 'include',
        }
      );
      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde des gardes/vacations par lots');
      }
      return await response.json();
    } catch (error: unknown) {
      logger.error('Erreur lors de la sauvegarde des assignations par lots:', { error: error });
      throw error;
    }
  }
}
