import { Rule } from '../types'; // Assurez-vous que le chemin est correct

const API_BASE_URL = '/api/rules'; // Endpoint API hypothétique

// Type pour la création (sans id, createdAt, updatedAt)
export type RuleCreateData = Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>;
// Type pour la mise à jour (potentiellement partiel)
export type RuleUpdateData = Partial<Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Récupère toutes les règles
 */
export const fetchRules = async (): Promise<Rule[]> => {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
        throw new Error('Failed to fetch rules');
    }
    return response.json();
};

/**
 * Crée une nouvelle règle
 */
export const createRule = async (ruleData: RuleCreateData): Promise<Rule> => {
    const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(ruleData),
    });
    if (!response.ok) {
        throw new Error('Failed to create rule');
    }
    return response.json();
};

/**
 * Met à jour une règle existante
 */
export const updateRule = async (ruleId: string, ruleData: RuleUpdateData): Promise<Rule> => {
    const response = await fetch(`${API_BASE_URL}/${ruleId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(ruleData),
    });
    if (!response.ok) {
        throw new Error('Failed to update rule');
    }
    return response.json();
};

/**
 * Supprime une règle
 */
export const deleteRule = async (ruleId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/${ruleId}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete rule');
    }
    // La réponse DELETE peut ne pas avoir de corps ou renvoyer un 204
}; 