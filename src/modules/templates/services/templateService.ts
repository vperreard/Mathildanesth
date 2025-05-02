import {
    PlanningTemplate,
    TemplateAffectation,
    AffectationType,
    DayOfWeek,
    TemplateSearchOptions,
    PaginatedTemplateResult,
    AffectationConfiguration,
    PosteConfiguration,
    ConfigurationVariation,
    PosteStatus,
    SkillLevel,
    TemplateAdvancedFilter,
    ContrainteAffectation,
    ContrainteType,
    PeriodeVariation
} from "../types/template";

// --- Mock Data Store ---
let mockTemplates: PlanningTemplate[] = [
    {
        id: "tmpl_1",
        nom: "Trame Standard Semaine",
        description: "Trame classique pour les jours ouvrés.",
        affectations: [
            {
                id: "a1",
                jour: "LUNDI",
                type: "CONSULTATION",
                ouvert: true,
                postesRequis: 2,
                configuration: {
                    id: "conf_a1",
                    nom: "Consultation Lundi Matin",
                    heureDebut: "08:30",
                    heureFin: "12:30",
                    postes: [
                        {
                            id: "poste_a1_1",
                            nom: "Médecin Sénior",
                            quantite: 1,
                            status: "REQUIS",
                            competencesRequises: "SENIOR"
                        },
                        {
                            id: "poste_a1_2",
                            nom: "Infirmier(e)",
                            quantite: 1,
                            status: "REQUIS",
                            competencesRequises: "INTERMEDIAIRE"
                        }
                    ],
                    priorite: 3,
                    couleur: "#4CAF50",
                    emplacementPhysique: "Salle 101"
                }
            },
            { id: "a2", jour: "LUNDI", type: "BLOC_OPERATOIRE", ouvert: true, postesRequis: 1 },
            { id: "a3", jour: "MARDI", type: "CONSULTATION", ouvert: true, postesRequis: 2 },
            { id: "a4", jour: "MARDI", type: "BLOC_OPERATOIRE", ouvert: true, postesRequis: 1 },
            { id: "a5", jour: "MERCREDI", type: "CONSULTATION", ouvert: true, postesRequis: 2 },
            { id: "a6", jour: "JEUDI", type: "CONSULTATION", ouvert: true, postesRequis: 2 },
            { id: "a7", jour: "JEUDI", type: "BLOC_OPERATOIRE", ouvert: true, postesRequis: 1 },
            { id: "a8", jour: "VENDREDI", type: "CONSULTATION", ouvert: true, postesRequis: 2 },
            { id: "a9", jour: "VENDREDI", type: "BLOC_OPERATOIRE", ouvert: false, postesRequis: 0 },
            { id: "a10", jour: "SAMEDI", type: "GARDE_JOUR", ouvert: true, postesRequis: 1 },
            { id: "a11", jour: "DIMANCHE", type: "GARDE_JOUR", ouvert: true, postesRequis: 1 },
        ],
        variations: [
            {
                id: "var_tmpl1_1",
                affectationId: "a10",
                nom: "Variation Samedi (période d'été)",
                dateDebut: "2025-06-01",
                dateFin: "2025-09-30",
                typeVariation: "ETE",
                configuration: {
                    id: "conf_var_tmpl1_1",
                    nom: "Garde Samedi Été",
                    heureDebut: "08:00",
                    heureFin: "20:00",
                    postes: [
                        {
                            id: "poste_var_tmpl1_1_1",
                            nom: "Médecin Sénior",
                            quantite: 2,
                            status: "REQUIS",
                            competencesRequises: "SENIOR"
                        },
                        {
                            id: "poste_var_tmpl1_1_2",
                            nom: "Infirmier(e)",
                            quantite: 2,
                            status: "REQUIS",
                            competencesRequises: "INTERMEDIAIRE"
                        }
                    ],
                    priorite: 5,
                    couleur: "#FF9800",
                    notes: "Effectif renforcé pour la période estivale"
                },
                priorite: 10,
                estRecurrent: true,
                actif: true,
                raisonVariation: "Augmentation de l'activité en période estivale"
            }
        ],
        createdAt: new Date(2023, 10, 1),
        updatedAt: new Date(2023, 10, 5),
        departementId: "dept_1",
        estActif: true,
        estModele: true,
        tags: ["Standard", "Hebdomadaire"]
    },
    {
        id: "tmpl_2",
        nom: "Trame Gardes Weekend",
        description: "Trame spécifique pour les gardes du weekend.",
        affectations: [
            {
                id: "b1",
                jour: "SAMEDI",
                type: "GARDE_JOUR",
                ouvert: true,
                postesRequis: 2,
                configuration: {
                    id: "conf_b1",
                    nom: "Garde Jour du Samedi",
                    heureDebut: "08:00",
                    heureFin: "20:00",
                    postes: [
                        {
                            id: "poste_b1_1",
                            nom: "Médecin Senior",
                            quantite: 1,
                            status: "REQUIS",
                            competencesRequises: "SENIOR"
                        },
                        {
                            id: "poste_b1_2",
                            nom: "Médecin Junior",
                            quantite: 1,
                            status: "REQUIS",
                            competencesRequises: "JUNIOR"
                        }
                    ],
                    priorite: 4,
                    couleur: "#2196F3",
                    contraintes: [
                        {
                            id: "contr_b1_1",
                            type: "PERSONNEL",
                            description: "Au moins un médecin senior doit être présent",
                            obligatoire: true,
                            priorite: 2
                        }
                    ]
                }
            },
            {
                id: "b2",
                jour: "SAMEDI",
                type: "GARDE_NUIT",
                ouvert: true,
                postesRequis: 1,
                configuration: {
                    id: "conf_b2",
                    nom: "Garde Nuit du Samedi",
                    heureDebut: "20:00",
                    heureFin: "08:00",
                    postes: [
                        {
                            id: "poste_b2_1",
                            nom: "Médecin Senior",
                            quantite: 1,
                            status: "REQUIS",
                            competencesRequises: "SENIOR"
                        }
                    ],
                    priorite: 5,
                    couleur: "#9C27B0"
                }
            },
            { id: "b3", jour: "DIMANCHE", type: "GARDE_JOUR", ouvert: true, postesRequis: 2 },
            { id: "b4", jour: "DIMANCHE", type: "GARDE_NUIT", ouvert: true, postesRequis: 1 },
            { id: "b5", jour: "LUNDI", type: "ASTREINTE", ouvert: true, postesRequis: 1 }, // Exemple d'astreinte
        ],
        variations: [
            {
                id: "var_1",
                affectationId: "b3",
                nom: "Configuration spéciale jours fériés",
                typeVariation: "JOURS_FERIES",
                configuration: {
                    id: "conf_var_1",
                    nom: "Garde Jour Fériée",
                    postes: [
                        {
                            id: "poste_var_1_1",
                            nom: "Médecin Senior",
                            quantite: 2,
                            status: "REQUIS",
                            competencesRequises: "SENIOR"
                        }
                    ],
                    priorite: 8,
                    couleur: "#F44336"
                },
                priorite: 10,
                estRecurrent: true,
                actif: true
            }
        ],
        createdAt: new Date(2023, 11, 1),
        updatedAt: new Date(2023, 11, 2),
        departementId: "dept_1",
        estActif: true,
        estModele: false,
        tags: ["Gardes", "Weekend"]
    },
    {
        id: "tmpl_3",
        nom: "Trame Période de Vacances",
        description: "Trame adaptée pour les périodes de vacances scolaires avec effectif réduit.",
        affectations: [
            {
                id: "c1",
                jour: "LUNDI",
                type: "CONSULTATION",
                ouvert: true,
                postesRequis: 1,
                configuration: {
                    id: "conf_c1",
                    nom: "Consultation Lundi (Effectif réduit)",
                    heureDebut: "09:00",
                    heureFin: "17:00",
                    postes: [
                        {
                            id: "poste_c1_1",
                            nom: "Médecin",
                            quantite: 1,
                            status: "REQUIS",
                            competencesRequises: "SENIOR"
                        }
                    ],
                    priorite: 2,
                    couleur: "#795548",
                    notes: "Consultations regroupées sur la journée"
                }
            },
            { id: "c2", jour: "MERCREDI", type: "CONSULTATION", ouvert: true, postesRequis: 1 },
            { id: "c3", jour: "VENDREDI", type: "CONSULTATION", ouvert: true, postesRequis: 1 },
            {
                id: "c4",
                jour: "SAMEDI",
                type: "GARDE_JOUR",
                ouvert: true,
                postesRequis: 2,
                configuration: {
                    id: "conf_c4",
                    nom: "Garde du Samedi (Vacances)",
                    heureDebut: "09:00",
                    heureFin: "21:00",
                    postes: [
                        {
                            id: "poste_c4_1",
                            nom: "Médecin",
                            quantite: 2,
                            status: "REQUIS"
                        }
                    ],
                    priorite: 3,
                    couleur: "#607D8B"
                }
            },
            { id: "c5", jour: "DIMANCHE", type: "GARDE_JOUR", ouvert: true, postesRequis: 2 },
        ],
        createdAt: new Date(2024, 0, 15),
        updatedAt: new Date(2024, 0, 15),
        departementId: "dept_2",
        estActif: true,
        estModele: true,
        tags: ["Vacances", "Effectif Réduit"]
    },
];

// Données pour les postes disponibles
const availablePostes = [
    "Médecin Senior",
    "Médecin Junior",
    "Médecin",
    "Anesthésiste",
    "Infirmier(e)",
    "Infirmier(e) Bloc",
    "Infirmier(e) Anesthésiste",
    "Aide-soignant(e)",
    "Chirurgien",
    "Instrumentiste",
    "Résident",
    "Interne",
    "Chef de Clinique",
    "Cadre de Santé"
];

// Simulation d'une latence réseau
const simulateNetworkDelay = (delayMs: number = 500) =>
    new Promise((resolve) => setTimeout(resolve, delayMs));

/**
 * Génère un identifiant unique
 */
const generateId = (prefix: string): string => {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

// --- Service API Mock ---

export const templateService = {
    /**
     * Récupère la liste de toutes les trames de planning.
     */
    async getTemplates(): Promise<PlanningTemplate[]> {
        await simulateNetworkDelay();
        console.log("[Mock Service] Fetching templates...");
        return [...mockTemplates]; // Retourner une copie pour éviter les mutations directes
    },

    /**
     * Recherche de trames avec pagination et filtres
     */
    async searchTemplates(options: TemplateSearchOptions): Promise<PaginatedTemplateResult> {
        await simulateNetworkDelay();
        console.log(`[Mock Service] Searching templates with options:`, options);

        let filtered = [...mockTemplates];

        // Filtrer par département
        if (options.departementId) {
            filtered = filtered.filter(t => t.departementId === options.departementId);
        }

        // Filtrer par statut (archivé ou actif)
        if (options.includeArchived === false) {
            filtered = filtered.filter(t => t.estActif !== false);
        }

        // Filtrer par terme de recherche
        if (options.searchTerm) {
            const searchLower = options.searchTerm.toLowerCase();
            filtered = filtered.filter(t =>
                t.nom.toLowerCase().includes(searchLower) ||
                (t.description?.toLowerCase().includes(searchLower)) ||
                (t.tags?.some(tag => tag.toLowerCase().includes(searchLower)))
            );
        }

        // Tri
        const sortBy = options.sortBy || 'nom';
        const sortDirection = options.sortDirection || 'asc';

        filtered.sort((a, b) => {
            let valueA, valueB;

            if (sortBy === 'nom') {
                valueA = a.nom.toLowerCase();
                valueB = b.nom.toLowerCase();
            } else if (sortBy === 'createdAt') {
                valueA = a.createdAt?.getTime() || 0;
                valueB = b.createdAt?.getTime() || 0;
            } else if (sortBy === 'updatedAt') {
                valueA = a.updatedAt?.getTime() || 0;
                valueB = b.updatedAt?.getTime() || 0;
            } else {
                valueA = a[sortBy as keyof PlanningTemplate];
                valueB = b[sortBy as keyof PlanningTemplate];
            }

            if (sortDirection === 'asc') {
                return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
            } else {
                return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
            }
        });

        // Pagination
        const page = options.page || 1;
        const pageSize = options.pageSize || 10;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedResults = filtered.slice(startIndex, endIndex);

        return {
            templates: paginatedResults,
            total: filtered.length,
            page,
            pageSize,
            totalPages: Math.ceil(filtered.length / pageSize)
        };
    },

    /**
     * Recherche avancée de trames avec filtres complexes
     */
    async advancedSearch(filter: TemplateAdvancedFilter): Promise<PlanningTemplate[]> {
        await simulateNetworkDelay();
        console.log(`[Mock Service] Advanced search with filters:`, filter);

        let filtered = [...mockTemplates];

        // Filtrer par départements
        if (filter.departementIds && filter.departementIds.length > 0) {
            filtered = filtered.filter(t => t.departementId && filter.departementIds?.includes(t.departementId));
        }

        // Filtrer par types d'affectation (templates contenant au moins une affectation du type spécifié)
        if (filter.types && filter.types.length > 0) {
            filtered = filtered.filter(t =>
                t.affectations.some(a => filter.types?.includes(a.type))
            );
        }

        // Filtrer par jours de la semaine (templates contenant au moins une affectation pour le jour spécifié)
        if (filter.jours && filter.jours.length > 0) {
            filtered = filtered.filter(t =>
                t.affectations.some(a => filter.jours?.includes(a.jour))
            );
        }

        // Filtrer par plage de date de création
        if (filter.dateCreationDebut) {
            filtered = filtered.filter(t => t.createdAt && t.createdAt >= filter.dateCreationDebut!);
        }
        if (filter.dateCreationFin) {
            filtered = filtered.filter(t => t.createdAt && t.createdAt <= filter.dateCreationFin!);
        }

        // Filtrer par créateurs
        if (filter.createdBy && filter.createdBy.length > 0) {
            filtered = filtered.filter(t => t.createdBy && filter.createdBy?.includes(t.createdBy));
        }

        // Filtrer par statut de modèle
        if (filter.estModele !== undefined) {
            filtered = filtered.filter(t => t.estModele === filter.estModele);
        }

        // Filtrer par tags
        if (filter.tags && filter.tags.length > 0) {
            filtered = filtered.filter(t =>
                t.tags && filter.tags?.some(tag => t.tags?.includes(tag))
            );
        }

        return filtered;
    },

    /**
     * Recherche les trames par affectation
     */
    async findTemplatesByAffectationType(type: AffectationType): Promise<PlanningTemplate[]> {
        await simulateNetworkDelay();
        console.log(`[Mock Service] Finding templates with affectation type: ${type}`);

        const templates = mockTemplates.filter(t =>
            t.affectations.some(a => a.type === type)
        );

        return [...templates];
    },

    /**
     * Récupère une trame spécifique par son ID.
     */
    async getTemplateById(id: string): Promise<PlanningTemplate | null> {
        await simulateNetworkDelay();
        console.log(`[Mock Service] Fetching template by ID: ${id}`);
        const template = mockTemplates.find((t) => t.id === id);
        return template ? { ...template } : null; // Retourner une copie
    },

    /**
     * Sauvegarde une trame (création ou mise à jour).
     */
    async saveTemplate(template: PlanningTemplate): Promise<PlanningTemplate> {
        await simulateNetworkDelay(800);
        console.log(`[Mock Service] Saving template: ${template.nom}`);
        const existingIndex = mockTemplates.findIndex((t) => t.id === template.id);

        let savedTemplate: PlanningTemplate;

        if (existingIndex > -1) {
            // Mise à jour
            savedTemplate = {
                ...mockTemplates[existingIndex],
                ...template,
                updatedAt: new Date(),
            };
            mockTemplates[existingIndex] = savedTemplate;
            console.log(`[Mock Service] Template updated: ${savedTemplate.id}`);
        } else {
            // Création
            savedTemplate = {
                ...template,
                id: template.id.startsWith("temp_") ? generateId("tmpl") : template.id, // Générer un ID si temporaire
                createdAt: new Date(),
                updatedAt: new Date(),
                estActif: template.estActif ?? true
            };
            mockTemplates.push(savedTemplate);
            console.log(`[Mock Service] Template created: ${savedTemplate.id}`);
        }
        return { ...savedTemplate }; // Retourner une copie
    },

    /**
     * Supprime une trame.
     */
    async deleteTemplate(id: string): Promise<void> {
        await simulateNetworkDelay();
        console.log(`[Mock Service] Deleting template: ${id}`);
        const index = mockTemplates.findIndex((t) => t.id === id);
        if (index === -1) {
            console.error(`[Mock Service] Template not found for deletion: ${id}`);
            throw new Error("Template not found");
        }
        mockTemplates.splice(index, 1);
        console.log(`[Mock Service] Template deleted: ${id}`);
    },

    /**
     * Active ou désactive une trame.
     */
    async toggleTemplateStatus(id: string, isActive: boolean): Promise<PlanningTemplate> {
        await simulateNetworkDelay();
        console.log(`[Mock Service] Toggling template status: ${id} to ${isActive}`);
        const index = mockTemplates.findIndex((t) => t.id === id);
        if (index === -1) {
            console.error(`[Mock Service] Template not found for status toggle: ${id}`);
            throw new Error("Template not found");
        }
        mockTemplates[index] = {
            ...mockTemplates[index],
            estActif: isActive,
            updatedAt: new Date()
        };
        console.log(`[Mock Service] Template status toggled: ${id}`);
        return { ...mockTemplates[index] };
    },

    /**
     * Duplique une trame existante.
     */
    async duplicateTemplate(id: string): Promise<PlanningTemplate> {
        await simulateNetworkDelay();
        console.log(`[Mock Service] Duplicating template: ${id}`);
        const originalTemplate = mockTemplates.find((t) => t.id === id);
        if (!originalTemplate) {
            console.error(`[Mock Service] Template not found for duplication: ${id}`);
            throw new Error("Template not found");
        }

        // Dupliquer toutes les sous-entités avec de nouveaux IDs
        const newAffectations = originalTemplate.affectations.map(aff => {
            const newAffId = generateId("affect");
            const newAffectation: TemplateAffectation = {
                ...aff,
                id: newAffId
            };

            // Si l'affectation a une configuration, la dupliquer aussi
            if (aff.configuration) {
                const newConfig: AffectationConfiguration = {
                    ...aff.configuration,
                    id: generateId("conf"),
                    // Dupliquer les postes avec de nouveaux IDs
                    postes: aff.configuration.postes.map(poste => ({
                        ...poste,
                        id: generateId("poste")
                    })),
                    // Dupliquer les contraintes si elles existent
                    contraintes: aff.configuration.contraintes?.map(contrainte => ({
                        ...contrainte,
                        id: generateId("contr")
                    }))
                };
                newAffectation.configuration = newConfig;
            }

            return newAffectation;
        });

        // Dupliquer les variations si elles existent
        const newVariations = originalTemplate.variations?.map(variation => {
            // Trouver la nouvelle ID de l'affectation correspondante
            const originalAffectation = originalTemplate.affectations.find(a => a.id === variation.affectationId);
            const newAffectationIndex = originalAffectation ? originalTemplate.affectations.indexOf(originalAffectation) : -1;
            const newAffectationId = newAffectationIndex >= 0 ? newAffectations[newAffectationIndex].id : variation.affectationId;

            return {
                ...variation,
                id: generateId("var"),
                affectationId: newAffectationId,
                configuration: {
                    ...variation.configuration,
                    id: generateId("conf_var"),
                    postes: variation.configuration.postes.map(poste => ({
                        ...poste,
                        id: generateId("poste_var")
                    })),
                    contraintes: variation.configuration.contraintes?.map(contrainte => ({
                        ...contrainte,
                        id: generateId("contr_var")
                    }))
                }
            };
        });

        const newTemplate: PlanningTemplate = {
            ...originalTemplate,
            id: generateId("tmpl"),
            nom: `${originalTemplate.nom} (Copie)`,
            createdAt: new Date(),
            updatedAt: new Date(),
            affectations: newAffectations,
            variations: newVariations
        };

        mockTemplates.push(newTemplate);
        console.log(`[Mock Service] Template duplicated: ${newTemplate.id} from ${id}`);
        return { ...newTemplate }; // Retourner une copie
    },

    /**
     * Récupère les types d'affectation disponibles.
     */
    async getAvailableAffectationTypes(): Promise<AffectationType[]> {
        await simulateNetworkDelay();
        console.log("[Mock Service] Fetching available affectation types...");
        return ["CONSULTATION", "BLOC_OPERATOIRE", "GARDE_JOUR", "GARDE_NUIT", "ASTREINTE"];
    },

    /**
     * Récupère les postes disponibles pour les configurations.
     */
    async getAvailablePostes(): Promise<string[]> {
        await simulateNetworkDelay();
        console.log("[Mock Service] Fetching available postes...");
        return [...availablePostes];
    },

    /**
     * Ajoute ou met à jour une configuration pour une affectation.
     */
    async saveAffectationConfiguration(
        templateId: string,
        affectationId: string,
        configuration: AffectationConfiguration
    ): Promise<AffectationConfiguration> {
        await simulateNetworkDelay();
        console.log(`[Mock Service] Saving configuration for affectation: ${affectationId} in template: ${templateId}`);

        const templateIndex = mockTemplates.findIndex(t => t.id === templateId);
        if (templateIndex < 0) {
            console.error(`[Mock Service] Template not found: ${templateId}`);
            throw new Error("Template not found");
        }

        const affectationIndex = mockTemplates[templateIndex].affectations.findIndex(a => a.id === affectationId);
        if (affectationIndex < 0) {
            console.error(`[Mock Service] Affectation not found: ${affectationId}`);
            throw new Error("Affectation not found");
        }

        // Assurer que la configuration a un ID
        const configToSave: AffectationConfiguration = {
            ...configuration,
            id: configuration.id || generateId("conf")
        };

        // Mise à jour de la configuration
        mockTemplates[templateIndex].affectations[affectationIndex].configuration = configToSave;
        mockTemplates[templateIndex].updatedAt = new Date();

        console.log(`[Mock Service] Configuration saved for affectation: ${affectationId}`);
        return { ...configToSave };
    },

    /**
     * Ajoute ou met à jour une variation pour une affectation.
     */
    async saveConfigurationVariation(
        templateId: string,
        variation: ConfigurationVariation
    ): Promise<ConfigurationVariation> {
        await simulateNetworkDelay();
        console.log(`[Mock Service] Saving variation for template: ${templateId}`);

        const templateIndex = mockTemplates.findIndex(t => t.id === templateId);
        if (templateIndex < 0) {
            console.error(`[Mock Service] Template not found: ${templateId}`);
            throw new Error("Template not found");
        }

        // Vérifier que l'affectation existe
        const affectationExists = mockTemplates[templateIndex].affectations.some(a => a.id === variation.affectationId);
        if (!affectationExists) {
            console.error(`[Mock Service] Affectation not found: ${variation.affectationId}`);
            throw new Error("Affectation not found");
        }

        // Initialiser le tableau des variations s'il n'existe pas
        if (!mockTemplates[templateIndex].variations) {
            mockTemplates[templateIndex].variations = [];
        }

        // Assurer que la variation a un ID
        const variationToSave: ConfigurationVariation = {
            ...variation,
            id: variation.id || generateId("var")
        };

        // Vérifier si c'est une mise à jour ou une création
        const variationIndex = mockTemplates[templateIndex].variations!.findIndex(v => v.id === variation.id);

        if (variationIndex >= 0) {
            // Mise à jour
            mockTemplates[templateIndex].variations![variationIndex] = variationToSave;
        } else {
            // Création
            mockTemplates[templateIndex].variations!.push(variationToSave);
        }

        mockTemplates[templateIndex].updatedAt = new Date();

        console.log(`[Mock Service] Variation saved for template: ${templateId}`);
        return { ...variationToSave };
    },

    /**
     * Supprime une variation d'une trame.
     */
    async deleteVariation(templateId: string, variationId: string): Promise<void> {
        await simulateNetworkDelay();
        console.log(`[Mock Service] Deleting variation: ${variationId} from template: ${templateId}`);

        const templateIndex = mockTemplates.findIndex(t => t.id === templateId);
        if (templateIndex < 0) {
            console.error(`[Mock Service] Template not found: ${templateId}`);
            throw new Error("Template not found");
        }

        if (!mockTemplates[templateIndex].variations) {
            console.error(`[Mock Service] Template has no variations: ${templateId}`);
            throw new Error("Template has no variations");
        }

        const variationIndex = mockTemplates[templateIndex].variations!.findIndex(v => v.id === variationId);
        if (variationIndex < 0) {
            console.error(`[Mock Service] Variation not found: ${variationId}`);
            throw new Error("Variation not found");
        }

        mockTemplates[templateIndex].variations!.splice(variationIndex, 1);
        mockTemplates[templateIndex].updatedAt = new Date();

        console.log(`[Mock Service] Variation deleted: ${variationId}`);
    },

    /**
     * Récupère les niveaux de compétence disponibles.
     */
    async getAvailableSkillLevels(): Promise<SkillLevel[]> {
        await simulateNetworkDelay();
        console.log("[Mock Service] Fetching available skill levels...");
        return ["JUNIOR", "INTERMEDIAIRE", "SENIOR", "EXPERT"];
    },

    /**
     * Récupère les types de période de variation disponibles.
     */
    async getAvailablePeriodeVariations(): Promise<PeriodeVariation[]> {
        await simulateNetworkDelay();
        console.log("[Mock Service] Fetching available periode variations...");
        return ["STANDARD", "VACANCES", "HIVER", "ETE", "JOURS_FERIES", "PERSONNALISEE"];
    },

    /**
     * Ajoute une affectation à une trame existante
     */
    async addAffectation(
        templateId: string,
        affectation: Omit<TemplateAffectation, "id">
    ): Promise<TemplateAffectation> {
        await simulateNetworkDelay();
        console.log(`[Mock Service] Adding affectation to template: ${templateId}`);

        const templateIndex = mockTemplates.findIndex(t => t.id === templateId);
        if (templateIndex < 0) {
            console.error(`[Mock Service] Template not found: ${templateId}`);
            throw new Error("Template not found");
        }

        const newAffectation: TemplateAffectation = {
            ...affectation,
            id: generateId("affect")
        };

        mockTemplates[templateIndex].affectations.push(newAffectation);
        mockTemplates[templateIndex].updatedAt = new Date();

        console.log(`[Mock Service] Affectation added to template: ${templateId}, new id: ${newAffectation.id}`);
        return { ...newAffectation };
    },

    /**
     * Supprime une affectation d'une trame
     */
    async deleteAffectation(templateId: string, affectationId: string): Promise<void> {
        await simulateNetworkDelay();
        console.log(`[Mock Service] Deleting affectation: ${affectationId} from template: ${templateId}`);

        const templateIndex = mockTemplates.findIndex(t => t.id === templateId);
        if (templateIndex < 0) {
            console.error(`[Mock Service] Template not found: ${templateId}`);
            throw new Error("Template not found");
        }

        const affectationIndex = mockTemplates[templateIndex].affectations.findIndex(a => a.id === affectationId);
        if (affectationIndex < 0) {
            console.error(`[Mock Service] Affectation not found: ${affectationId}`);
            throw new Error("Affectation not found");
        }

        // Supprimer toutes les variations liées à cette affectation
        if (mockTemplates[templateIndex].variations?.length) {
            mockTemplates[templateIndex].variations = mockTemplates[templateIndex].variations!.filter(
                v => v.affectationId !== affectationId
            );
        }

        // Supprimer l'affectation
        mockTemplates[templateIndex].affectations.splice(affectationIndex, 1);
        mockTemplates[templateIndex].updatedAt = new Date();

        console.log(`[Mock Service] Affectation deleted: ${affectationId}`);
    },

    /**
     * Met à jour une affectation existante
     */
    async updateAffectation(
        templateId: string,
        affectationId: string,
        updates: Partial<TemplateAffectation>
    ): Promise<TemplateAffectation> {
        await simulateNetworkDelay();
        console.log(`[Mock Service] Updating affectation: ${affectationId} in template: ${templateId}`);

        const templateIndex = mockTemplates.findIndex(t => t.id === templateId);
        if (templateIndex < 0) {
            console.error(`[Mock Service] Template not found: ${templateId}`);
            throw new Error("Template not found");
        }

        const affectationIndex = mockTemplates[templateIndex].affectations.findIndex(a => a.id === affectationId);
        if (affectationIndex < 0) {
            console.error(`[Mock Service] Affectation not found: ${affectationId}`);
            throw new Error("Affectation not found");
        }

        // Mise à jour de l'affectation
        const updatedAffectation: TemplateAffectation = {
            ...mockTemplates[templateIndex].affectations[affectationIndex],
            ...updates
        };

        mockTemplates[templateIndex].affectations[affectationIndex] = updatedAffectation;
        mockTemplates[templateIndex].updatedAt = new Date();

        console.log(`[Mock Service] Affectation updated: ${affectationId}`);
        return { ...updatedAffectation };
    },

    /**
     * Récupère les tags utilisés dans toutes les trames
     */
    async getAllTemplateTags(): Promise<string[]> {
        await simulateNetworkDelay();
        return ["Standard", "Hebdomadaire", "Gardes", "Weekend", "Été", "Hiver", "Urgences"];
    },

    /**
     * Exporte une trame sous forme de fichier JSON téléchargeable
     * @param templateId ID de la trame à exporter
     * @returns Un blob contenant les données de la trame formatées en JSON
     */
    async exportTemplateAsJSON(templateId: string): Promise<Blob> {
        await simulateNetworkDelay();

        // Récupérer la trame complète
        const template = await this.getTemplateById(templateId);
        if (!template) {
            throw new Error(`Trame avec l'ID ${templateId} non trouvée`);
        }

        // Préparer les données d'export avec métadonnées
        const exportData = {
            template,
            exportDate: new Date().toISOString(),
            version: "1.0.0",
            formatType: "trame-planning"
        };

        // Convertir en JSON avec formatage pour lisibilité
        const jsonString = JSON.stringify(exportData, null, 2);

        // Créer un Blob avec les données JSON
        return new Blob([jsonString], { type: 'application/json' });
    },

    /**
     * Importe une trame depuis un fichier JSON
     * @param jsonFile Fichier JSON contenant les données de la trame
     * @returns La trame importée avec un nouvel ID
     */
    async importTemplateFromJSON(jsonFile: File): Promise<PlanningTemplate> {
        await simulateNetworkDelay();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const content = e.target?.result as string;
                    const parsedData = JSON.parse(content);

                    // Vérifier le format du fichier
                    if (!parsedData.template || parsedData.formatType !== "trame-planning") {
                        throw new Error("Format de fichier non valide");
                    }

                    // Extraire la trame
                    const importedTemplate = parsedData.template as PlanningTemplate;

                    // Attribuer de nouveaux IDs pour éviter les conflits
                    const newTemplate = {
                        ...importedTemplate,
                        id: `tmpl_imported_${Date.now()}`,
                        nom: `${importedTemplate.nom} (Importée)`,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };

                    // Attribuer de nouveaux IDs aux affectations et configurations
                    newTemplate.affectations = importedTemplate.affectations.map(aff => ({
                        ...aff,
                        id: `aff_imported_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                        configuration: aff.configuration ? {
                            ...aff.configuration,
                            id: `conf_imported_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                            postes: aff.configuration.postes.map(poste => ({
                                ...poste,
                                id: `poste_imported_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
                            }))
                        } : undefined
                    }));

                    // Attribuer de nouveaux IDs aux variations si elles existent
                    if (newTemplate.variations && importedTemplate.variations) {
                        const affectationIdMap = new Map<string, string>();
                        importedTemplate.affectations.forEach((aff, index) => {
                            affectationIdMap.set(aff.id, newTemplate.affectations[index].id);
                        });

                        newTemplate.variations = importedTemplate.variations.map(variation => ({
                            ...variation,
                            id: `var_imported_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                            affectationId: affectationIdMap.get(variation.affectationId) || variation.affectationId,
                            configuration: {
                                ...variation.configuration,
                                id: `conf_var_imported_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                                postes: variation.configuration.postes.map(poste => ({
                                    ...poste,
                                    id: `poste_var_imported_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
                                }))
                            }
                        }));
                    }

                    // Simuler la sauvegarde de la trame importée
                    await simulateNetworkDelay(1000);

                    // Ajouter la trame aux trames existantes (simulation)
                    mockTemplates.push(newTemplate);

                    resolve(newTemplate);
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
                    reject(new Error(`Erreur lors de l'importation de la trame: ${errorMessage}`));
                }
            };

            reader.onerror = () => {
                reject(new Error("Erreur lors de la lecture du fichier"));
            };

            reader.readAsText(jsonFile);
        });
    }
}; 