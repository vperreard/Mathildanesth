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
    PeriodeVariation,
    RoleType
} from "../types/template";

// Ajout d'un type pour les informations complètes d'ActivityType
export interface FullActivityType {
    id: string;
    name: string;
    code: string;
    category: string;
}

// Type pour les valeurs de l'enum TypeSemaineTrame (pour référence dans le mapping)
// Doit correspondre à l'enum Prisma TypeSemaineTrame
type TypeSemaineTrameValue = 'TOUTES' | 'PAIRES' | 'IMPAIRES';

// Type pour les valeurs de l'enum Period (pour référence dans le mapping)
// Doit correspondre à l'enum Prisma Period
type PeriodValue = 'MATIN' | 'APRES_MIDI' | 'JOURNEE_ENTIERE';

// Objet de mappage pour les jours de la semaine
const dayOfWeekMapping: { [key: string]: DayOfWeekValue } = {
    'LUNDI': 'MONDAY',
    'MARDI': 'TUESDAY',
    'MERCREDI': 'WEDNESDAY',
    'JEUDI': 'THURSDAY',
    'VENDREDI': 'FRIDAY',
    'SAMEDI': 'SATURDAY',
    'DIMANCHE': 'SUNDAY',
};

// Type pour les valeurs de l'enum DayOfWeek (pour référence dans le mapping)
type DayOfWeekValue = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

// Suppression de l'ancien service, on va appeler l'API directement
// import { TrameHebdomadaireService, TrameHebdomadaireDTO, AffectationTrameDTO } from './TrameHebdomadaireService';

import { getClientAuthToken } from "@/lib/auth-client-utils"; // Pour l'authentification

const API_BASE_URL = '/api/trame-modeles'; // Nouvelle URL de base pour l'API

// --- Mock Data Store ---
// const mockTemplates: PlanningTemplate[] = [ ... ]; // S'assurer que c'est bien commenté ou vide

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
// const simulateNetworkDelay = (delayMs: number = 500) =>
//     new Promise((resolve) => setTimeout(resolve, delayMs));

/**
 * Génère un identifiant unique (si encore nécessaire localement, sinon l'API s'en charge)
 */
// const generateId = (prefix: string): string => {
//     return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
// };

// Suppression des anciens helpers de mapping liés à TrameHebdomadaireDTO
// const mapJourSemaineToDayOfWeek = (jour: string): DayOfWeek => {
//     return jour as DayOfWeek; 
// };

// const mapAffectationDtoToTemplate = (dto: AffectationTrameDTO, index: number): TemplateAffectation => {
//     // ... ancienne logique ... 
// };

// DTO pour la création d'une AffectationModele (POST /api/trame-modeles/{id}/affectations)
interface AffectationModeleCreateDto {
    activityTypeId: string;
    jourSemaine: DayOfWeekValue; // Utilise notre type alias pour les valeurs de l'enum Prisma
    periode: PeriodValue;
    typeSemaine: TypeSemaineTrameValue;
    operatingRoomId?: number;
    priorite?: number;
    isActive?: boolean;
    detailsJson?: any;
    personnelRequis?: {
        create: Array<{
            roleGenerique: string;
            nombreRequis: number;
            notes?: string;
            // TODO: Ajouter d'autres champs si nécessaire depuis Prisma.PersonnelRequisModeleCreateInput
            // professionalRoleId?: string; // Exemple: code du ProfessionalRoleConfig
            // specialtyId?: number;
            // personnelHabituelUserId?: number;
            // personnelHabituelSurgeonId?: number;
            // personnelHabituelNomExterne?: string;
            detailsJson?: any; // Pour stocker des métadonnées frontend comme frontendPosteId
        }>;
    };
}

// Helper pour mapper AffectationModeleDTO (de l'API GET /trame-modeles?includeAffectations=true)
// vers TemplateAffectation (frontend)
const mapAffectationModeleDtoToTemplateAffectation = (affectationDto: any): TemplateAffectation => {
    const typeAffectation = affectationDto.activityType?.code || affectationDto.activityType?.name || 'INCONNU';
    const postesRequis = affectationDto.personnelRequis?.reduce((sum: number, pr: any) => sum + (pr.nombreRequis || 0), 0) || 0;

    // Mapping inversé pour jourSemaine (pour affichage)
    const invertedDayOfWeekMapping: { [key: string]: DayOfWeek } = {
        'MONDAY': 'LUNDI',
        'TUESDAY': 'MARDI',
        'WEDNESDAY': 'MERCREDI',
        'THURSDAY': 'JEUDI',
        'FRIDAY': 'VENDREDI',
        'SATURDAY': 'SAMEDI',
        'SUNDAY': 'DIMANCHE',
    };
    const frontendJourSemaine = invertedDayOfWeekMapping[affectationDto.jourSemaine.toUpperCase() as keyof typeof invertedDayOfWeekMapping] || affectationDto.jourSemaine as DayOfWeek;

    const configuration: AffectationConfiguration = {
        id: affectationDto.detailsJson?.frontendConfigId || `conf_affect_${affectationDto.id}`,
        nom: affectationDto.detailsJson?.frontendConfigNom || affectationDto.activityType?.name || 'Configuration par défaut',
        postes: affectationDto.personnelRequis?.map((pr: any, index: number) => ({
            id: pr.detailsJson?.frontendPosteId || `poste_${affectationDto.id}_${index}`,
            nom: pr.roleGenerique || `Poste ${index + 1}`,
            quantite: pr.nombreRequis || 0,
            status: (pr.nombreRequis && pr.nombreRequis > 0) ? 'REQUIS' : 'INDISPONIBLE', // Utiliser les chaînes directes
            competencesRequises: pr.detailsJson?.competencesRequisesFrontend || undefined,
        })) || [],
        heureDebut: affectationDto.detailsJson?.heureDebut || undefined,
        heureFin: affectationDto.detailsJson?.heureFin || undefined,
    };

    return {
        id: String(affectationDto.id),
        jour: frontendJourSemaine,
        type: typeAffectation as AffectationType,
        ouvert: affectationDto.isActive !== undefined ? affectationDto.isActive : true,
        postesRequis: postesRequis,
        ordre: affectationDto.priorite || 0,
        configuration: configuration,
        // periode et typeSemaineLiee ne sont pas dans TemplateAffectation, donc on les omet ici
    };
};

// Helper pour mapper TrameModeleDTO (de l'API) vers PlanningTemplate (frontend)
const mapTrameModeleDtoToPlanningTemplate = (dto: any): PlanningTemplate => {
    return {
        id: String(dto.id), // Assurer que l'ID est un string pour le frontend
        nom: dto.name,
        description: dto.description || '',
        siteId: dto.siteId || null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        dateDebutEffet: dto.dateDebutEffet ? new Date(dto.dateDebutEffet) : new Date(),
        dateFinEffet: dto.dateFinEffet ? new Date(dto.dateFinEffet) : null,
        recurrenceType: dto.recurrenceType,
        joursSemaineActifs: dto.joursSemaineActifs || [],
        typeSemaine: dto.typeSemaine,
        roles: dto.roles || [RoleType.TOUS], // Mapper les rôles
        affectations: Array.isArray(dto.affectations)
            ? dto.affectations.map(mapAffectationModeleDtoToTemplateAffectation)
            : [],
        // Pour l'instant, on laisse vide pour que l'éditeur actuel fonctionne
        // Il faudra une migration/adaptation de BlocPlanningTemplateEditor
        // Ou un service qui mappe les AffectationModele vers TemplateAffectation
        variations: [],   // Les variations ne sont pas encore gérées par ce mapping
        createdAt: dto.createdAt ? new Date(dto.createdAt) : new Date(),
        updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : new Date(),
        // Les autres champs de PlanningTemplate (estModele, createdBy, etc.) peuvent être initialisés au besoin
        estModele: true, // Supposition, car ce sont des "modèles"
    };
};

// --- Service API --- 
export const templateService = {
    async getTemplates(): Promise<PlanningTemplate[]> {
        console.log("[Template Service] Appel de getTemplates via API /api/trame-modeles?includeAffectations=true...");
        try {
            const token = await getClientAuthToken();
            const response = await fetch(`${API_BASE_URL}?includeAffectations=true`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                console.error("[Template Service] Erreur API lors de getTemplates:", response.status, errorData);
                throw new Error(`Erreur API (${response.status}): ${errorData.error || 'Impossible de récupérer les trames'}`);
            }
            const dtos: any[] = await response.json(); // Supposer que l'API retourne un tableau de TrameModele
            console.log("--- Template Service --- GET --- DTOs bruts reçus de l'API ---");
            console.log(JSON.stringify(dtos, null, 2));
            console.log("-----------------------------------------------------------");
            if (!Array.isArray(dtos)) {
                console.error("[Template Service] ERREUR : la réponse de l'API n'est pas un array! Reçu:", dtos);
                return [];
            }
            const templates = dtos.map(mapTrameModeleDtoToPlanningTemplate);
            console.log(`[Template Service] ${templates.length} templates mappés avec succès depuis l'API.`);
            return templates;
        } catch (error) {
            console.error("[Template Service] Erreur DANS getTemplates (API):");
            // Ne pas logguer l'objet error directement ici en production côté client pour éviter fuite d'infos
            if (error instanceof Error) {
                console.error(error.message);
                throw error; // Rethrow pour que le composant puisse gérer
            } else {
                console.error("Une erreur inconnue est survenue dans getTemplates.");
                throw new Error("Une erreur inconnue est survenue lors de la récupération des trames.");
            }
        }
    },

    async getTemplateById(id: string): Promise<PlanningTemplate | null> {
        console.log(`[Template Service] Fetching template by ID: ${id} via API /api/trame-modeles/${id}?includeAffectations=true...`);
        try {
            const token = await getClientAuthToken();
            const response = await fetch(`${API_BASE_URL}/${id}?includeAffectations=true`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                if (response.status === 404) return null;
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                console.error("[Template Service] Erreur API lors de getTemplateById:", response.status, errorData);
                throw new Error(`Erreur API (${response.status}): ${errorData.error || 'Impossible de récupérer la trame'}`);
            }
            const dto: any = await response.json(); // Supposer que l'API retourne un TrameModele
            return mapTrameModeleDtoToPlanningTemplate(dto);
        } catch (error) {
            console.error(`[Template Service] Erreur DANS getTemplateById (API, id: ${id}):`);
            if (error instanceof Error) {
                console.error(error.message);
                throw error;
            } else {
                console.error("Une erreur inconnue est survenue dans getTemplateById.");
                throw new Error("Une erreur inconnue est survenue lors de la récupération de la trame.");
            }
        }
    },

    async saveTemplate(
        templateData: PlanningTemplate,
        availableFullActivityTypes: FullActivityType[] // Nécessaire pour trouver activityTypeId
    ): Promise<PlanningTemplate> {
        console.log(`[Template Service] Appel de saveTemplate pour: ${templateData.nom} via API /api/trame-modeles...`);
        const isCreating = !templateData.id || templateData.id === 'new';
        let trameModeleId = isCreating ? null : templateData.id;
        let savedOrUpdatedTrameModeleDto: any;

        // --- Étape 1: Sauvegarder/Mettre à jour les métadonnées de TrameModele ---
        const tramePayload = {
            name: templateData.nom,
            description: templateData.description,
            siteId: templateData.siteId,
            isActive: templateData.isActive !== undefined ? templateData.isActive : true,
            dateDebutEffet: templateData.dateDebutEffet ? new Date(templateData.dateDebutEffet).toISOString() : new Date().toISOString(),
            dateFinEffet: templateData.dateFinEffet ? new Date(templateData.dateFinEffet).toISOString() : null,
            recurrenceType: templateData.recurrenceType || 'HEBDOMADAIRE',
            joursSemaineActifs: templateData.joursSemaineActifs && templateData.joursSemaineActifs.length > 0 ? templateData.joursSemaineActifs : [1, 2, 3, 4, 5],
            typeSemaine: templateData.typeSemaine || 'TOUTES', // Assurer une valeur par défaut
            roles: templateData.roles && templateData.roles.length > 0 ? templateData.roles : [RoleType.TOUS],
        };

        try {
            const token = await getClientAuthToken();
            const url = isCreating ? API_BASE_URL : `${API_BASE_URL}/${trameModeleId}`;
            const method = isCreating ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tramePayload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                throw new Error(errorData.error || `Erreur API (${response.status}): Impossible de sauvegarder les métadonnées de la trame.`);
            }
            savedOrUpdatedTrameModeleDto = await response.json();
            trameModeleId = String(savedOrUpdatedTrameModeleDto.id); // Obtenir l'ID réel
            console.log(`[Template Service] Métadonnées de la trame ${isCreating ? 'créées' : 'mises à jour'} avec succès. ID: ${trameModeleId}`);

        } catch (error) {
            console.error(`[Template Service] Erreur lors de la sauvegarde des métadonnées de la trame:`, error);
            throw error; // Rethrow pour que le composant parent puisse gérer
        }

        // --- Étape 2 & 3: Supprimer les anciennes affectations et créer les nouvelles ---
        if (!trameModeleId) {
            // Ne devrait pas arriver si l'étape 1 a réussi
            throw new Error("ID de TrameModele non disponible après sauvegarde des métadonnées.");
        }

        try {
            const token = await getClientAuthToken();
            // 2a. Récupérer les affectations existantes
            const existingAffectationsResponse = await fetch(`${API_BASE_URL}/${trameModeleId}/affectations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!existingAffectationsResponse.ok) throw new Error("Impossible de récupérer les affectations existantes.");
            const existingAffectations: any[] = await existingAffectationsResponse.json();

            // 2b. Supprimer chaque affectation existante
            // Les appels DELETE doivent être séquentiels ou gérés avec Promise.all
            const deletePromises = existingAffectations.map(aff =>
                fetch(`${API_BASE_URL}/../affectation-modeles/${aff.id}`, { // Note: L'URL de suppression est différente
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => {
                    if (!res.ok && res.status !== 404) { // Ignorer 404 si déjà supprimé
                        console.warn(`Échec de la suppression de l'affectation ${aff.id}: ${res.status}`);
                        // Gérer l'erreur ou la logguer, mais ne pas forcément bloquer tout le processus
                    }
                    return res;
                })
            );
            await Promise.all(deletePromises);
            console.log(`[Template Service] ${existingAffectations.length} affectations existantes supprimées pour la trame ${trameModeleId}.`);

            // 3. Créer les nouvelles affectations
            console.log(`[Template Service] Tentative de création de ${templateData.affectations.length} nouvelles affectations pour la trame ${trameModeleId}...`);
            const createdAffectations: any[] = [];
            for (const affectation of templateData.affectations) {
                // Utiliser la nouvelle fonction de mapping
                const affectationDto = mapTemplateAffectationToApiDto(
                    affectation,
                    templateData.typeSemaine as TypeSemaineTrameValue, // typeSemaine de la trame parente
                    availableFullActivityTypes // Passer les types d'activité disponibles
                );

                if (!affectationDto) {
                    console.warn(`[Template Service] Impossible de mapper l'affectation (jour: ${affectation.jour}, type: ${affectation.type}), elle sera ignorée.`);
                    continue;
                }

                const createResponse = await fetch(`${API_BASE_URL}/${trameModeleId}/affectations`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(affectationDto)
                });

                if (!createResponse.ok) {
                    const errBody = await createResponse.json().catch(() => ({}));
                    console.error(`Échec de la création de l'affectation pour type '${affectation.type}': ${createResponse.status}`, errBody);
                    // Lancer une erreur ici pourrait être trop strict si une seule affectation échoue
                    // Pourrait collecter les erreurs et les retourner
                    continue;
                }

                const createdAffectation = await createResponse.json();
                createdAffectations.push(createdAffectation);
            }

            console.log(`[Template Service] ${createdAffectations.length} nouvelles affectations créées pour la trame ${trameModeleId}.`);

        } catch (error) {
            console.error(`[Template Service] Erreur lors de la gestion des affectations pour la trame ${trameModeleId}:`, error);
            // Que faire ici? La trame a été sauvegardée, mais les affectations ont échoué.
            // Peut-être retourner la trame avec un avertissement ou relancer une erreur spécifique.
            throw new Error(`Erreur lors de la sauvegarde des affectations : ${error instanceof Error ? error.message : String(error)}`);
        }

        // Retourner la PlanningTemplate avec les données de la trame sauvegardée et les affectations (potentiellement mises à jour avec des ID réels)
        // Pour cela, il faudrait re-récupérer la trame avec ses affectations.
        // Ou, si les DTO retournés par la création d'affectation sont complets, les utiliser pour reconstruire.
        // Pour l'instant, on retourne la trame mappée à partir de savedOrUpdatedTrameModeleDto, et les affectations telles qu'elles sont dans templateData (sans ID backend pour les nouvelles)
        // L'idéal serait de re-fetch ou de mapper les résultats de createdAffectationResults.

        // Pour une meilleure UX, on recharge la trame complète après toutes les opérations.
        const finalTrame = await this.getTemplateById(trameModeleId as string);
        if (!finalTrame) {
            // Cela ne devrait pas arriver si tout s'est bien passé.
            console.error(`[Template Service] CRITICAL: La trame ${trameModeleId} sauvegardée n'a pas pu être récupérée après la gestion des affectations.`);
            // Retourner au moins ce qui a été sauvegardé au niveau des métadonnées, avec les affectations locales pour éviter un crash total
            // mais signaler une forte incohérence.
            const fallbackTrame = mapTrameModeleDtoToPlanningTemplate(savedOrUpdatedTrameModeleDto);
            fallbackTrame.affectations = templateData.affectations; // Garder les affectations du frontend en dernier recours
            return fallbackTrame;
            // throw new Error("La trame sauvegardée n'a pas pu être récupérée après la gestion des affectations.");
        }
        return finalTrame;
    },

    async deleteTemplate(id: string): Promise<void> {
        console.log(`[Template Service] Appel de deleteTemplate pour ID: ${id} via API /api/trame-modeles...`);
        try {
            const token = await getClientAuthToken();
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                console.error("[Template Service] Erreur API lors de deleteTemplate:", response.status, errorData);
                throw new Error(`Erreur API (${response.status}): ${errorData.error || 'Impossible de supprimer la trame'}`);
            }
            // Pas de contenu à retourner pour un DELETE réussi (200 ou 204)
        } catch (error) {
            console.error(`[Template Service] Erreur DANS deleteTemplate (API, id: ${id}):`);
            if (error instanceof Error) {
                console.error(error.message);
                throw error;
            } else {
                console.error("Une erreur inconnue est survenue dans deleteTemplate.");
                throw new Error("Une erreur inconnue est survenue lors de la suppression de la trame.");
            }
        }
    },

    // ... (autres fonctions comme duplicateTemplate, getAvailableAffectationTypes, etc. à adapter si besoin)
    // Pour l'instant, je me concentre sur CRUD de base pour TrameModele.

    // Exemple: duplicateTemplate pourrait appeler GET puis POST avec un nom modifié.
    async duplicateTemplate(id: string, availableFullActivityTypes: FullActivityType[]): Promise<PlanningTemplate> {
        console.log(`[Template Service] Tentative de duplication pour ID: ${id}`);
        const originalTemplate = await this.getTemplateById(id);
        if (!originalTemplate) {
            throw new Error("Trame originale non trouvée pour la duplication.");
        }

        const duplicatedMetaData: PlanningTemplate = {
            ...originalTemplate,
            id: 'new',
            nom: `${originalTemplate.nom} (copie)`,
            affectations: [],
            variations: [],
        };
        delete duplicatedMetaData.createdAt;
        delete duplicatedMetaData.updatedAt;

        const trameAvecAffectationsDupliquees: PlanningTemplate = {
            ...duplicatedMetaData,
            affectations: (originalTemplate.affectations || []).map(aff => ({ ...aff, id: `temp_dup_${Date.now()}_${Math.random()}` })),
            variations: (originalTemplate.variations || []).map(v => ({ ...v, id: `temp_var_dup_${Date.now()}_${Math.random()}` })),
        };

        return this.saveTemplate(trameAvecAffectationsDupliquees, availableFullActivityTypes);
    },

    // Fonctions utilitaires qui étaient dans le mock, à conserver si utiles globalement
    async getAvailableAffectationTypes(): Promise<FullActivityType[]> { // MODIFIÉ: Type de retour
        console.log("[Template Service] Appel de getAvailableAffectationTypes via API /api/activity-types...");
        try {
            const token = await getClientAuthToken();
            const response = await fetch('/api/activity-types', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                console.error("[Template Service] Erreur API lors de getAvailableAffectationTypes:", response.status, errorData);
                throw new Error(`Erreur API (${response.status}): ${errorData.error || "Impossible de récupérer les types d'activité"}`);
            }

            const activityTypesFromApi: FullActivityType[] = await response.json(); // MODIFIÉ: Utiliser FullActivityType

            if (!Array.isArray(activityTypesFromApi)) {
                console.error("[Template Service] ERREUR : la réponse de /api/activity-types n'est pas un array! Reçu:", activityTypesFromApi);
                return []; // Retourner vide en cas d'erreur de format
            }

            console.log("[Template Service] Types d'activité (complets) récupérés:", activityTypesFromApi);
            return activityTypesFromApi;

        } catch (error) {
            console.error("[Template Service] Erreur DANS getAvailableAffectationTypes (API):", error);
            if (error instanceof Error) {
                console.warn("[Template Service] Retourne un tableau vide pour availableFullActivityTypes suite à une erreur API.", error.message);
                return [];
            } else {
                console.error("Une erreur inconnue est survenue dans getAvailableAffectationTypes.");
                throw new Error("Une erreur inconnue est survenue lors de la récupération des types d'affectation disponibles.");
            }
        }
    },

    async getAvailablePostes(): Promise<string[]> {
        // Idem
        return [
            "Médecin Senior", "Médecin Junior", "Médecin", "Anesthésiste",
            "Infirmier(e)", "Infirmier(e) Bloc", "Infirmier(e) Anesthésiste",
            "Aide-soignant(e)", "Chirurgien", "Instrumentiste",
            "Résident", "Interne", "Chef de Clinique", "Cadre de Santé"
        ];
    }

    // ... (reste des fonctions comme searchTemplates, advancedSearch, etc. à adapter si besoin)
};

const mapTemplateAffectationToApiDto = (
    affectation: TemplateAffectation,
    trameTypeSemaine: TypeSemaineTrameValue,
    availableActivityTypes: FullActivityType[]
): AffectationModeleCreateDto | null => {
    const activityType = availableActivityTypes.find((at: FullActivityType) => at.code === affectation.type);
    if (!activityType) {
        console.error(`[Template Service] mapTemplateAffectationToApiDto: ActivityType avec le code '${affectation.type}' non trouvé.`);
        return null;
    }

    const mappedJourSemaine = dayOfWeekMapping[affectation.jour.toUpperCase() as keyof typeof dayOfWeekMapping];
    if (!mappedJourSemaine) {
        console.error(`[Template Service] mapTemplateAffectationToApiDto: Jour de la semaine invalide ou non mappé: '${affectation.jour}'`);
        return null;
    }

    const personnelRequisConfig = affectation.configuration?.postes
        ?.filter(p => p.quantite > 0 && p.status !== 'INDISPONIBLE') // Utiliser la chaîne directe pour PosteStatus
        .map(p => ({
            roleGenerique: p.nom,
            nombreRequis: p.quantite,
            detailsJson: {
                frontendPosteId: p.id,
                frontendStatut: p.status
            }
        })) || [];

    // Déterminer la période. Si TemplateAffectation n'a pas de champ `periode`,
    // il faut décider d'où cette information provient. Pour l'instant, on met JOURNEE_ENTIERE par défaut.
    // Si affectation.configuration.heureDebut et heureFin sont définis, on pourrait essayer de déduire MATIN/APRES_MIDI.
    let periode: PeriodValue = 'JOURNEE_ENTIERE'; // Valeur par défaut
    if (affectation.configuration?.heureDebut && affectation.configuration?.heureFin) {
        // Logique simple pour déduire MATIN/APRES_MIDI (à affiner)
        const debut = parseInt(affectation.configuration.heureDebut.split(':')[0]);
        // const fin = parseInt(affectation.configuration.heureFin.split(':')[0]);
        if (debut < 12) {
            periode = 'MATIN'; // Simple supposition, pourrait être JOURNEE_ENTIERE si ça finit tard
        } else {
            periode = 'APRES_MIDI';
        }
        // Pour une logique plus robuste, il faudrait des heures de coupure claires (ex: avant 12h = MATIN, après 14h = APM)
        // Et gérer le cas où ça couvre toute la journée.
    }
    // Si une affectation est de type 'GARDE_JOUR' ou 'GARDE_NUIT', la période est implicitement 'JOURNEE_ENTIERE' (ou NUIT)
    if (affectation.type === 'GARDE_JOUR' || affectation.type === 'GARDE_NUIT') {
        periode = 'JOURNEE_ENTIERE';
    }

    const dto: AffectationModeleCreateDto = {
        activityTypeId: activityType.id,
        jourSemaine: mappedJourSemaine,
        periode: periode, // Utiliser la période déterminée
        typeSemaine: trameTypeSemaine,
        operatingRoomId: affectation.configuration?.emplacementPhysique ? parseInt(affectation.configuration.emplacementPhysique, 10) : undefined, // Supposant que salleId est dans emplacementPhysique
        priorite: affectation.ordre !== undefined ? affectation.ordre : 5,
        isActive: affectation.ouvert !== undefined ? affectation.ouvert : true,
        detailsJson: {
            frontendAffectationId: affectation.id,
            frontendConfigId: affectation.configuration?.id,
            frontendConfigNom: affectation.configuration?.nom,
            heureDebut: affectation.configuration?.heureDebut,
            heureFin: affectation.configuration?.heureFin,
        },
        ...(personnelRequisConfig.length > 0 && { personnelRequis: { create: personnelRequisConfig } }),
    };

    return dto;
}; 