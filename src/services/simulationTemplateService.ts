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
        ignoreLeaves: boolean;
        prioritizeExistingAssignments: boolean;
        balanceWorkload: boolean;
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
 * Duplique un template existant
 */
export async function duplicateTemplate(sourceTemplateId: string, newName: string) {
    try {
        const response = await fetch('/api/simulations/templates/duplicate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sourceTemplateId,
                name: newName,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la duplication du template');
        }

        return await response.json() as SimulationTemplate;
    } catch (error) {
        console.error(`Erreur lors de la duplication du template ${sourceTemplateId}:`, error);
        throw error;
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
export async function createScenarioFromTemplate(templateId: string, customization: TemplateCustomization) {
    try {
        const template = await fetchTemplate(templateId);

        // Construire les paramètres pour le scénario
        const parametersJson = {
            ...template.parametersJson,
            startDate: customization.dates.startDate,
            endDate: customization.dates.endDate,
            absentUserIds: customization.absences?.userIds || [],
            absentSurgeonIds: customization.absences?.surgeonIds || [],
            options: {
                ...template.parametersJson.options,
                ...customization.options
            }
        };

        // Créer le scénario
        const response = await fetch('/api/simulations', {
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