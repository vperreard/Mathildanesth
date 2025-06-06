// Service pour la gestion des modèles de simulation
import axios from 'axios';

import { logger } from "../lib/logger";
export interface SimulationTemplate {
    id: string;
    name: string;
    description?: string;
    category?: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy?: {
        id: number;
        name: string;
    };
    parametersJson: unknown;
}

// Type pour la personnalisation du modèle
export interface TemplateCustomization {
    name: string;
    description?: string;
    dates: {
        startDate: string;
        endDate: string;
    };
    absences?: {
        userIds: number[];
        surgeonIds: number[];
    };
    options?: {
        ignoreLeaves?: boolean;
        prioritizeExistingAssignments?: boolean;
        balanceWorkload?: boolean;
    };
}

/**
 * Récupère tous les modèles de simulation
 */
export async function fetchTemplates(): Promise<SimulationTemplate[]> {
    try {
        const response = await axios.get('http://localhost:3000/api/simulations/modèles');
        return response.data.data || [];
    } catch (error: unknown) {
        logger.error('Erreur lors de la récupération des modèles:', { error: error });
        throw new Error('Impossible de récupérer les modèles');
    }
}

/**
 * Récupère un modèle spécifique par son ID
 */
export async function fetchTemplate(id: string): Promise<SimulationTemplate> {
    try {
        const response = await axios.get(`http://localhost:3000/api/simulations/modèles/${id}`);
        return response.data.data;
    } catch (error: unknown) {
        logger.error(`Erreur lors de la récupération du modèle ${id}:`, { error: error });
        throw new Error('Modèle non trouvé');
    }
}

/**
 * Crée un nouveau modèle
 */
export async function createTemplate(templateData: Partial<SimulationTemplate>): Promise<SimulationTemplate> {
    try {
        const response = await axios.post('http://localhost:3000/api/simulations/modèles', templateData);
        return response.data.data;
    } catch (error: unknown) {
        logger.error('Erreur lors de la création du modèle:', { error: error });
        throw new Error('Impossible de créer le modèle');
    }
}

/**
 * Met à jour un modèle existant
 */
export async function updateTemplate(id: string, updates: Partial<SimulationTemplate>): Promise<SimulationTemplate> {
    try {
        const response = await axios.put(`http://localhost:3000/api/simulations/modèles/${id}`, updates);
        return response.data.data;
    } catch (error: unknown) {
        logger.error(`Erreur lors de la mise à jour du modèle ${id}:`, { error: error });
        throw new Error('Impossible de mettre à jour le modèle');
    }
}

/**
 * Supprime un modèle
 */
export async function deleteTemplate(id: string): Promise<void> {
    try {
        await axios.delete(`http://localhost:3000/api/simulations/modèles/${id}`);
    } catch (error: unknown) {
        logger.error(`Erreur lors de la suppression du modèle ${id}:`, { error: error });
        throw new Error('Impossible de supprimer le modèle');
    }
}

/**
 * Duplique un modèle existant
 */
export async function duplicateTemplate(id: string, newName: string): Promise<SimulationTemplate> {
    try {
        const response = await axios.post('http://localhost:3000/api/simulations/modèles/duplicate', {
            sourceTemplateId: id,
            name: newName
        });
        return response.data.data;
    } catch (error: unknown) {
        logger.error(`Erreur lors de la duplication du modèle ${id}:`, { error: error });
        throw new Error('Impossible de dupliquer le modèle');
    }
}

/**
 * Prépare les données pour créer un scénario à partir d'un modèle
 * Récupère le modèle et initialise les données de base pour le scénario
 */
export async function prepareTemplateForScenario(templateId: string) {
    try {
        const modèle = await fetchTemplate(templateId);

        // Préparer les données de base pour le scénario
        const baseScenarioData = {
            name: `${modèle.name} - ${new Date().toLocaleDateString()}`,
            description: modèle.description,
            parametersJson: {
                ...modèle.parametersJson,
                // Assurez-vous que les dates sont au bon format ou utilisez des dates par défaut
                startDate: modèle.parametersJson.startDate || new Date().toISOString().split('T')[0],
                endDate: modèle.parametersJson.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                // Initialiser les listes d'absences si elles n'existent pas
                absentUserIds: modèle.parametersJson.absentUserIds || [],
                absentSurgeonIds: modèle.parametersJson.absentSurgeonIds || [],
                // Initialiser les options avec des valeurs par défaut si nécessaire
                options: {
                    ignoreLeaves: modèle.parametersJson.options?.ignoreLeaves || false,
                    prioritizeExistingAssignments: modèle.parametersJson.options?.prioritizeExistingAssignments !== false,
                    balanceWorkload: modèle.parametersJson.options?.balanceWorkload !== false
                }
            }
        };

        return {
            modèle,
            baseScenarioData
        };
    } catch (error: unknown) {
        logger.error(`Erreur lors de la préparation du scénario à partir du modèle ${templateId}:`, { error: error });
        throw error;
    }
}

/**
 * Crée un scénario personnalisé à partir d'un modèle
 */
export async function createScenarioFromTemplate(templateId: string, customization?: TemplateCustomization | any): Promise<unknown> {
    try {
        const modèle = await fetchTemplate(templateId);

        // Si pas de customization fournie, utiliser les valeurs par défaut
        if (!customization) {
            customization = {
                name: `${modèle.name} - ${new Date().toLocaleDateString()}`,
                description: modèle.description,
                dates: {
                    startDate: modèle.parametersJson.startDate || new Date().toISOString().split('T')[0],
                    endDate: modèle.parametersJson.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                },
                absences: {
                    userIds: modèle.parametersJson.absentUserIds || [],
                    surgeonIds: modèle.parametersJson.absentSurgeonIds || []
                },
                options: modèle.parametersJson.options || {}
            };
        }

        // Construire les paramètres pour le scénario
        const parametersJson = {
            ...modèle.parametersJson,
            startDate: customization.dates?.startDate || customization.startDate,
            endDate: customization.dates?.endDate || customization.endDate,
            absentUserIds: customization.absences?.userIds || customization.absentUserIds || [],
            absentSurgeonIds: customization.absences?.surgeonIds || customization.absentSurgeonIds || [],
            options: {
                ...modèle.parametersJson.options,
                ...customization.options
            }
        };

        // Créer le scénario
        const response = await fetch('http://localhost:3000/api/simulations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: customization.name,
                description: customization.description || modèle.description,
                parametersJson,
                templateId: modèle.id
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la création du scénario à partir du modèle');
        }

        return await response.json();
    } catch (error: unknown) {
        logger.error(`Erreur lors de la création du scénario à partir du modèle ${templateId}:`, { error: error });
        throw error;
    }
} 