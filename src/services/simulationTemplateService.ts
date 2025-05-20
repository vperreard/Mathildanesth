// Service pour la gestion des templates de simulation
interface SimulationTemplateBase {
    name: string;
    description?: string;
    isPublic?: boolean;
    parametersJson: any;
    category?: string;
}

export interface SimulationTemplate extends SimulationTemplateBase {
    id: string;
    createdAt: string;
    updatedAt: string;
    createdById: number;
    createdBy?: {
        id: number;
        firstName: string;
        lastName: string;
    };
}

/**
 * Récupère la liste des templates de simulation
 */
export async function fetchTemplates(params: { category?: string; publicOnly?: boolean } = {}) {
    try {
        const queryParams = new URLSearchParams();

        if (params.category) {
            queryParams.append('category', params.category);
        }

        if (params.publicOnly) {
            queryParams.append('publicOnly', 'true');
        }

        const url = `/api/simulations/templates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la récupération des templates');
        }

        return await response.json() as SimulationTemplate[];
    } catch (error) {
        console.error('Erreur lors de la récupération des templates:', error);
        throw error;
    }
}

/**
 * Récupère un template spécifique
 */
export async function fetchTemplate(templateId: string) {
    try {
        const response = await fetch(`/api/simulations/templates/${templateId}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la récupération du template');
        }

        return await response.json() as SimulationTemplate;
    } catch (error) {
        console.error(`Erreur lors de la récupération du template ${templateId}:`, error);
        throw error;
    }
}

/**
 * Crée un nouveau template
 */
export async function createTemplate(template: SimulationTemplateBase) {
    try {
        const response = await fetch('/api/simulations/templates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(template),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la création du template');
        }

        return await response.json() as SimulationTemplate;
    } catch (error) {
        console.error('Erreur lors de la création du template:', error);
        throw error;
    }
}

/**
 * Met à jour un template existant
 */
export async function updateTemplate(templateId: string, updates: Partial<SimulationTemplateBase>) {
    try {
        const response = await fetch(`/api/simulations/templates/${templateId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la mise à jour du template');
        }

        return await response.json() as SimulationTemplate;
    } catch (error) {
        console.error(`Erreur lors de la mise à jour du template ${templateId}:`, error);
        throw error;
    }
}

/**
 * Supprime un template
 */
export async function deleteTemplate(templateId: string) {
    try {
        const response = await fetch(`/api/simulations/templates/${templateId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la suppression du template');
        }

        return await response.json();
    } catch (error) {
        console.error(`Erreur lors de la suppression du template ${templateId}:`, error);
        throw error;
    }
}

/**
 * Utilise un template pour créer un nouveau scénario
 */
export async function useTemplateForScenario(templateId: string, customizations: any = {}) {
    try {
        // Récupérer d'abord les détails du template
        const template = await fetchTemplate(templateId);

        // Créer un nouveau scénario basé sur le template
        const response = await fetch('/api/simulations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: `${template.name} - ${new Date().toLocaleDateString()}`,
                description: template.description,
                parametersJson: {
                    ...template.parametersJson,
                    ...customizations
                },
                templateId: template.id // Référencer le template utilisé
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la création du scénario à partir du template');
        }

        return await response.json();
    } catch (error) {
        console.error(`Erreur lors de l'utilisation du template ${templateId}:`, error);
        throw error;
    }
} 