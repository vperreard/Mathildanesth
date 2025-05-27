// Service pour la gestion des templates de simulation
import axios from 'axios';

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
    parametersJson: any;
}

// Type pour la personnalisation du template
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
 * Récupère tous les templates de simulation
 */
export async function fetchTemplates(): Promise<SimulationTemplate[]> {
    try {
        const response = await axios.get('http://localhost:3000/api/simulations/templates');
        return response.data.data || [];
    } catch (error) {
        console.error('Erreur lors de la récupération des templates:', error);
        throw new Error('Impossible de récupérer les templates');
    }
}

/**
 * Récupère un template spécifique par son ID
 */
export async function fetchTemplate(id: string): Promise<SimulationTemplate> {
    try {
        const response = await axios.get(`http://localhost:3000/api/simulations/templates/${id}`);
        return response.data.data;
    } catch (error) {
        console.error(`Erreur lors de la récupération du template ${id}:`, error);
        throw new Error('Template non trouvé');
    }
}

/**
 * Crée un nouveau template
 */
export async function createTemplate(templateData: Partial<SimulationTemplate>): Promise<SimulationTemplate> {
    try {
        const response = await axios.post('http://localhost:3000/api/simulations/templates', templateData);
        return response.data.data;
    } catch (error) {
        console.error('Erreur lors de la création du template:', error);
        throw new Error('Impossible de créer le template');
    }
}

/**
 * Met à jour un template existant
 */
export async function updateTemplate(id: string, updates: Partial<SimulationTemplate>): Promise<SimulationTemplate> {
    try {
        const response = await axios.put(`http://localhost:3000/api/simulations/templates/${id}`, updates);
        return response.data.data;
    } catch (error) {
        console.error(`Erreur lors de la mise à jour du template ${id}:`, error);
        throw new Error('Impossible de mettre à jour le template');
    }
}

/**
 * Supprime un template
 */
export async function deleteTemplate(id: string): Promise<void> {
    try {
        await axios.delete(`http://localhost:3000/api/simulations/templates/${id}`);
    } catch (error) {
        console.error(`Erreur lors de la suppression du template ${id}:`, error);
        throw new Error('Impossible de supprimer le template');
    }
}

/**
 * Duplique un template existant
 */
export async function duplicateTemplate(id: string, newName: string): Promise<SimulationTemplate> {
    try {
        const response = await axios.post('http://localhost:3000/api/simulations/templates/duplicate', {
            sourceTemplateId: id,
            name: newName
        });
        return response.data.data;
    } catch (error) {
        console.error(`Erreur lors de la duplication du template ${id}:`, error);
        throw new Error('Impossible de dupliquer le template');
    }
}

/**
 * Prépare les données pour créer un scénario à partir d'un template
 * Récupère le template et initialise les données de base pour le scénario
 */
export async function prepareTemplateForScenario(templateId: string) {
    try {
        const template = await fetchTemplate(templateId);

        // Préparer les données de base pour le scénario
        const baseScenarioData = {
            name: `${template.name} - ${new Date().toLocaleDateString()}`,
            description: template.description,
            parametersJson: {
                ...template.parametersJson,
                // Assurez-vous que les dates sont au bon format ou utilisez des dates par défaut
                startDate: template.parametersJson.startDate || new Date().toISOString().split('T')[0],
                endDate: template.parametersJson.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                // Initialiser les listes d'absences si elles n'existent pas
                absentUserIds: template.parametersJson.absentUserIds || [],
                absentSurgeonIds: template.parametersJson.absentSurgeonIds || [],
                // Initialiser les options avec des valeurs par défaut si nécessaire
                options: {
                    ignoreLeaves: template.parametersJson.options?.ignoreLeaves || false,
                    prioritizeExistingAssignments: template.parametersJson.options?.prioritizeExistingAssignments !== false,
                    balanceWorkload: template.parametersJson.options?.balanceWorkload !== false
                }
            }
        };

        return {
            template,
            baseScenarioData
        };
    } catch (error) {
        console.error(`Erreur lors de la préparation du scénario à partir du template ${templateId}:`, error);
        throw error;
    }
}

/**
 * Crée un scénario personnalisé à partir d'un template
 */
export async function createScenarioFromTemplate(templateId: string, customization?: TemplateCustomization | any): Promise<any> {
    try {
        const template = await fetchTemplate(templateId);

        // Si pas de customization fournie, utiliser les valeurs par défaut
        if (!customization) {
            customization = {
                name: `${template.name} - ${new Date().toLocaleDateString()}`,
                description: template.description,
                dates: {
                    startDate: template.parametersJson.startDate || new Date().toISOString().split('T')[0],
                    endDate: template.parametersJson.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                },
                absences: {
                    userIds: template.parametersJson.absentUserIds || [],
                    surgeonIds: template.parametersJson.absentSurgeonIds || []
                },
                options: template.parametersJson.options || {}
            };
        }

        // Construire les paramètres pour le scénario
        const parametersJson = {
            ...template.parametersJson,
            startDate: customization.dates?.startDate || customization.startDate,
            endDate: customization.dates?.endDate || customization.endDate,
            absentUserIds: customization.absences?.userIds || customization.absentUserIds || [],
            absentSurgeonIds: customization.absences?.surgeonIds || customization.absentSurgeonIds || [],
            options: {
                ...template.parametersJson.options,
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
                description: customization.description || template.description,
                parametersJson,
                templateId: template.id
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la création du scénario à partir du template');
        }

        return await response.json();
    } catch (error) {
        console.error(`Erreur lors de la création du scénario à partir du template ${templateId}:`, error);
        throw error;
    }
} 