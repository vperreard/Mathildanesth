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

import { logger } from "../../../lib/logger";
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

const API_BASE_URL = '/api/trame-modeles'; // URL de base corrigée pour l'API

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

// DTO pour la création d'une AffectationModele (POST /api/trameModele-modeles/{id}/gardes/vacations)
interface AffectationModeleCreateDto {
    activityTypeId: string;
    jourSemaine: DayOfWeekValue; // Utilise notre type alias pour les valeurs de l'enum Prisma
    periode: PeriodValue;
    typeSemaine: TypeSemaineTrameValue;
    operatingRoomId?: number;
    priorite?: number;
    isActive?: boolean;
    detailsJson?: unknown;
    personnelRequis?: Array<{
        roleGenerique: string;
        nombreRequis: number;
        notes?: string;
        // TODO: Ajouter d'autres champs si nécessaire depuis Prisma.PersonnelRequisModeleCreateInput
        // professionalRoleId?: string; // Exemple: code du ProfessionalRoleConfig
        // specialtyId?: number;
        // personnelHabituelUserId?: number;
        // personnelHabituelSurgeonId?: number;
        // personnelHabituelNomExterne?: string;
        detailsJson?: unknown; // Pour stocker des métadonnées frontend comme frontendPosteId
    }>;
}

// Helper pour mapper AffectationModeleDTO (de l'API GET /trameModele-modeles?includeAffectations=true)
// vers TemplateAffectation (frontend)
const mapAffectationModeleDtoToTemplateAffectation = (affectationDto: unknown): TemplateAffectation => {
    const typeAffectation = affectationDto.activityType?.code || affectationDto.activityType?.name || 'INCONNU';
    let postesCalculated = affectationDto.personnelRequis?.reduce((sum: number, pr: unknown) => sum + (pr.nombreRequis || 0), 0) || 0;

    const estOuvert = affectationDto.isActive !== undefined ? affectationDto.isActive : true;

    if (estOuvert && postesCalculated === 0) {
        postesCalculated = 1;
    }

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
        postes: affectationDto.detailsJson?.frontendPostes || affectationDto.personnelRequis?.map((pr: unknown, index: number) => ({
            id: pr.detailsJson?.frontendPosteId || `poste_${affectationDto.id}_${index}`,
            nom: pr.roleGenerique || `Poste ${index + 1}`,
            quantite: pr.nombreRequis || 0,
            status: pr.detailsJson?.frontendStatut || ((pr.nombreRequis && pr.nombreRequis > 0) ? 'REQUIS' : 'INDISPONIBLE'),
            competencesRequises: pr.detailsJson?.competencesRequises,
            rolesAutorises: pr.detailsJson?.rolesAutorises,
            parametres: pr.detailsJson?.parametres,
            disponibiliteRequise: pr.detailsJson?.disponibiliteRequise,
            remplacable: pr.detailsJson?.remplacable,
            tempsTravailMinimum: pr.detailsJson?.tempsTravailMinimum,
            formationRequise: pr.detailsJson?.formationRequise,
            superviseur: pr.detailsJson?.superviseur,
            ordrePriorite: pr.detailsJson?.ordrePriorite
        })) || [],
        heureDebut: affectationDto.detailsJson?.heureDebut || undefined,
        heureFin: affectationDto.detailsJson?.heureFin || undefined,
        notes: affectationDto.detailsJson?.notes,
        emplacementPhysique: affectationDto.detailsJson?.emplacementPhysique,
        equipementsRequis: affectationDto.detailsJson?.equipementsRequis,
        dureePreparation: affectationDto.detailsJson?.dureePreparation,
        dureeNettoyage: affectationDto.detailsJson?.dureeNettoyage,
        parametres: affectationDto.detailsJson?.parametres,
        priorite: affectationDto.priorite || 0,
        couleur: affectationDto.detailsJson?.couleur,
        contraintes: affectationDto.detailsJson?.contraintes
    };

    return {
        id: String(affectationDto.id),
        jour: frontendJourSemaine,
        type: typeAffectation as AffectationType,
        ouvert: estOuvert,
        postesRequis: affectationDto.detailsJson?.frontendPostesRequis !== undefined ? affectationDto.detailsJson?.frontendPostesRequis : postesCalculated,
        ordre: affectationDto.priorite || 0,
        configuration: configuration,
    };
};

// Helper pour mapper TrameModeleDTO (de l'API) vers PlanningTemplate (frontend)
const mapTrameModeleDtoToPlanningTemplate = (dto: unknown): PlanningTemplate => {
    const variations = dto.detailsJson?.frontendVariations || [];
    if (variations.length) {
        logger.info(`[Modèle Service] ${variations.length} variations trouvées dans detailsJson pour la trameModele ${dto.id}`);
    }

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
        // Récupérer les variations depuis detailsJson si elles existent
        variations: variations,
        createdAt: dto.createdAt ? new Date(dto.createdAt) : new Date(),
        updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : new Date(),
        // Les autres champs de PlanningTemplate (estModele, createdBy, etc.) peuvent être initialisés au besoin
        estModele: true, // Supposition, car ce sont des "modèles"
    };
};

// --- Service API --- 
export const templateService = {
    async getTemplates(): Promise<PlanningTemplate[]> {
        logger.info("[Modèle Service] Appel de getTemplates via API /api/trame-modeles?includeAffectations=true...");
        try {
            const token = await getClientAuthToken();
            // Ajouter un timestamp pour éviter le cache
            const timestamp = Date.now();
            const response = await fetch(`${API_BASE_URL}?includeAffectations=true&_t=${timestamp}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                logger.error("[Modèle Service] Erreur API lors de getTemplates:", response.status, errorData);
                throw new Error(`Erreur API (${response.status}): ${errorData.error || 'Impossible de récupérer les trameModeles'}`);
            }
            const dtos: unknown[] = await response.json(); // Supposer que l'API retourne un tableau de TrameModele
            logger.info("--- Modèle Service --- GET --- DTOs bruts reçus de l'API ---");
            logger.info(JSON.stringify(dtos, null, 2));
            logger.info("-----------------------------------------------------------");
            if (!Array.isArray(dtos)) {
                logger.error("[Modèle Service] ERREUR : la réponse de l'API n'est pas un array! Reçu:", dtos);
                return [];
            }
            const modèles = dtos.map(mapTrameModeleDtoToPlanningTemplate);
            logger.info(`[Modèle Service] ${modèles.length} modèles mappés avec succès depuis l'API.`);
            return modèles;
        } catch (error: unknown) {
            logger.error("[Modèle Service] Erreur DANS getTemplates (API):");
            // Ne pas logguer l'objet error directement ici en production côté client pour éviter fuite d'infos
            if (error instanceof Error) {
                logger.error(error.message);
                throw error; // Rethrow pour que le composant puisse gérer
            } else {
                logger.error("Une erreur inconnue est survenue dans getTemplates.");
                throw new Error("Une erreur inconnue est survenue lors de la récupération des trameModeles.");
            }
        }
    },

    async getTemplateById(id: string): Promise<PlanningTemplate | null> {
        logger.info(`[Modèle Service] Fetching modèle by ID: ${id} via API /api/trameModele-modeles/${id}?includeAffectations=true...`);
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
                logger.error("[Modèle Service] Erreur API lors de getTemplateById:", response.status, errorData);
                throw new Error(`Erreur API (${response.status}): ${errorData.error || 'Impossible de récupérer la trameModele'}`);
            }
            const dto: any = await response.json(); // Supposer que l'API retourne un TrameModele
            return mapTrameModeleDtoToPlanningTemplate(dto);
        } catch (error: unknown) {
            logger.error(`[Modèle Service] Erreur DANS getTemplateById (API, id: ${id}):`);
            if (error instanceof Error) {
                logger.error(error.message);
                throw error;
            } else {
                logger.error("Une erreur inconnue est survenue dans getTemplateById.");
                throw new Error("Une erreur inconnue est survenue lors de la récupération de la trameModele.");
            }
        }
    },

    async saveTemplate(
        templateData: PlanningTemplate,
        availableFullActivityTypes: FullActivityType[] // Nécessaire pour trouver activityTypeId
    ): Promise<PlanningTemplate> {
        logger.info(`[Modèle Service] Appel de saveTemplate pour: ${templateData.nom} via API /api/trameModele-modeles...`);
        const isCreating = !templateData.id || templateData.id === 'new';
        let trameModeleId = isCreating ? null : templateData.id;
        let savedOrUpdatedTrameModeleDto: unknown;

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
            // Inclure les variations dans detailsJson dès la création/mise à jour initiale
            detailsJson: templateData.variations && templateData.variations.length > 0 ? {
                frontendVariations: templateData.variations.map(v => {
                    // S'assurer que tous les champs de la variation sont compatibles avec JSON
                    const sanitizedVariation = {
                        id: v.id || `var_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                        affectationId: v.affectationId,
                        nom: v.nom || "Variation sans nom",
                        priorite: typeof v.priorite === 'number' ? v.priorite : 5,
                        typeVariation: v.typeVariation || 'PERSONNALISEE',
                        dateDebut: v.dateDebut ? new Date(v.dateDebut).toISOString() : null,
                        dateFin: v.dateFin ? new Date(v.dateFin).toISOString() : null,
                        joursSpecifiques: Array.isArray(v.joursSpecifiques) ? v.joursSpecifiques : [],
                        actif: v.actif !== undefined ? v.actif : true
                    };

                    // Nettoyer la configuration pour qu'elle soit JSON-compatible
                    if (v.configuration) {
                        const sanitizedConfig = {
                            id: v.configuration.id || `conf_var_${Date.now()}`,
                            postes: Array.isArray(v.configuration.postes) ? v.configuration.postes.map(p => ({
                                id: p.id || `poste_var_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                                nom: p.nom || "Poste sans nom",
                                quantite: typeof p.quantite === 'number' ? p.quantite : 0,
                                status: p.status || 'REQUIS'
                            })) : [],
                            heureDebut: v.configuration.heureDebut || undefined,
                            heureFin: v.configuration.heureFin || undefined,
                            notes: v.configuration.notes || undefined,
                        };
                        return {
                            ...sanitizedVariation,
                            configuration: sanitizedConfig
                        };
                    }

                    return sanitizedVariation;
                })
            } : undefined
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
                throw new Error(errorData.error || `Erreur API (${response.status}): Impossible de sauvegarder les métadonnées de la trameModele.`);
            }
            savedOrUpdatedTrameModeleDto = await response.json();
            trameModeleId = String(savedOrUpdatedTrameModeleDto.id); // Obtenir l'ID réel
            logger.info(`[Modèle Service] Métadonnées de la trameModele ${isCreating ? 'créées' : 'mises à jour'} avec succès. ID: ${trameModeleId}`);

        } catch (error: unknown) {
            logger.error(`[Modèle Service] Erreur lors de la sauvegarde des métadonnées de la tableau de service:`, { error: error });
            throw error; // Rethrow pour que le composant parent puisse gérer
        }

        // --- Étape 2 & 3: Supprimer les anciennes gardes/vacations et créer les nouvelles ---
        if (!trameModeleId) {
            // Ne devrait pas arriver si l'étape 1 a réussi
            throw new Error("ID de TrameModele non disponible après sauvegarde des métadonnées.");
        }

        try {
            const token = await getClientAuthToken();
            // 2a. Récupérer les gardes/vacations existantes
            const existingAffectationsResponse = await fetch(`${API_BASE_URL}/${trameModeleId}/gardes/vacations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!existingAffectationsResponse.ok) throw new Error("Impossible de récupérer les gardes/vacations existantes.");
            const existingAffectations: unknown[] = await existingAffectationsResponse.json();

            // 2b. Supprimer chaque affectation existante
            // Les appels DELETE doivent être séquentiels ou gérés avec Promise.all
            const deletePromises = existingAffectations.map(aff =>
                fetch(`${API_BASE_URL}/../affectation-modeles/${aff.id}`, { // Note: L'URL de suppression est différente
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => {
                    if (!res.ok && res.status !== 404) { // Ignorer 404 si déjà supprimé
                        logger.warn(`Échec de la suppression de l'affectation ${aff.id}: ${res.status}`);
                        // Gérer l'erreur ou la logguer, mais ne pas forcément bloquer tout le processus
                    }
                    return res;
                })
            );
            await Promise.all(deletePromises);
            logger.info(`[Modèle Service] ${existingAffectations.length} gardes/vacations existantes supprimées pour la trameModele ${trameModeleId}.`);

            // 3. Créer les nouvelles gardes/vacations
            logger.info(`[Modèle Service] Tentative de création de ${templateData.affectations.length} nouvelles gardes/vacations pour la trameModele ${trameModeleId}...`);
            const createdAffectations: unknown[] = [];
            for (const affectation of templateData.affectations) {
                // Utiliser la nouvelle fonction de mapping
                const affectationDto = mapTemplateAffectationToApiDto(
                    affectation,
                    templateData.typeSemaine as TypeSemaineTrameValue, // typeSemaine de la trameModele parente
                    availableFullActivityTypes // Passer les types d'activité disponibles
                );

                if (!affectationDto) {
                    logger.warn(`[Modèle Service] Impossible de mapper l'affectation (jour: ${affectation.jour}, type: ${affectation.type}), elle sera ignorée.`);
                    continue;
                }

                const createResponse = await fetch(`${API_BASE_URL}/${trameModeleId}/gardes/vacations`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(affectationDto)
                });

                if (!createResponse.ok) {
                    const errBody = await createResponse.json().catch(() => ({}));
                    logger.error(`Échec de la création de l'affectation pour type '${affectation.type}': ${createResponse.status}`, errBody);
                    // Lancer une erreur ici pourrait être trop strict si une seule affectation échoue
                    // Pourrait collecter les erreurs et les retourner
                    continue;
                }

                const createdAffectation = await createResponse.json();
                createdAffectations.push(createdAffectation);
            }

            logger.info(`[Modèle Service] ${createdAffectations.length} nouvelles gardes/vacations créées pour la trameModele ${trameModeleId}.`);

            // Log pour débugage des gardes/vacations et postes
            logger.info(`[Modèle Service DEBUG] Gardes/Vacations sauvegardées:`, createdAffectations.length);
            logger.info(`[Modèle Service DEBUG] Exemple première affectation si existe:`,
                createdAffectations.length > 0 ? JSON.stringify(createdAffectations[0], null, 2) : 'aucune affectation');

            // Créer un mappage entre les anciens IDs d'affectation (frontendAffectationId) et les nouveaux IDs
            const affectationIdMapping: Record<string, string> = {};
            createdAffectations.forEach(aff => {
                const frontendId = aff.detailsJson?.frontendAffectationId;
                if (frontendId && String(aff.id)) {
                    affectationIdMapping[frontendId] = String(aff.id);
                }
            });

            logger.info(`[Modèle Service] Mappage des IDs d'affectation créé:`, affectationIdMapping);

            // Si des variations existent, mettre à jour leurs références d'affectationId
            if (templateData.variations && templateData.variations.length > 0 && Object.keys(affectationIdMapping).length > 0) {
                logger.info(`[Modèle Service] Mise à jour des références d'affectationId dans ${templateData.variations.length} variations...`);

                // Créer un nouvel objet detailsJson avec les variations mises à jour
                const updatedVariations = templateData.variations.map(v => {
                    // Si l'ancien ID d'affectation a été mappé à un nouvel ID, utiliser ce dernier
                    const newAffectationId = affectationIdMapping[v.affectationId] || v.affectationId;
                    return {
                        ...v,
                        affectationId: newAffectationId
                    };
                });

                // Récupérer d'abord la trameModele complète pour obtenir le detailsJson actuel
                const trameResponse = await fetch(`${API_BASE_URL}/${trameModeleId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!trameResponse.ok) {
                    logger.error(`[Modèle Service] Erreur lors de la récupération de la trameModele pour mise à jour des variations:`, await trameResponse.text());
                } else {
                    const trameData = await trameResponse.json();
                    // Préserver les autres données dans detailsJson tout en mettant à jour frontendVariations
                    const updatedDetailsJson = {
                        ...(trameData.detailsJson || {}),
                        frontendVariations: updatedVariations
                    };

                    // Mettre à jour detailsJson avec les variations mises à jour
                    const updateResponse = await fetch(`${API_BASE_URL}/${trameModeleId}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            detailsJson: updatedDetailsJson
                        })
                    });

                    if (!updateResponse.ok) {
                        logger.error(`[Modèle Service] Erreur lors de la mise à jour des références d'affectationId dans les variations:`, await updateResponse.text());
                    } else {
                        logger.info(`[Modèle Service] Références d'affectationId mises à jour avec succès dans les variations.`);
                    }
                }
            }

        } catch (error: unknown) {
            logger.error(`[Modèle Service] Erreur lors de la gestion des gardes/vacations pour la trameModele ${trameModeleId}:`, { error: error });
            // Que faire ici? La trameModele a été sauvegardée, mais les gardes/vacations ont échoué.
            // Peut-être retourner la trameModele avec un avertissement ou relancer une erreur spécifique.
            throw new Error(`Erreur lors de la sauvegarde des affectations: ${error instanceof Error ? error.message : String(error)}`);
        }

        // --- Étape 3: Sauvegarder les variations (extensions des gardes/vacations) ---
        logger.info(`[Modèle Service] ${templateData.variations?.length || 0} variations incluses dans le payload initial de la trameModele ${trameModeleId}.`);

        // Note: Les variations sont maintenant sauvegardées dans le detailsJson dès la création/mise à jour initiale
        // Nous n'avons donc pas besoin de faire une mise à jour séparée ici.

        // Si pour une raison quelconque les variations n'ont pas été correctement sauvegardées,
        // nous pourrions ajouter un mécanisme de vérification et correction ici.

        // Pour une meilleure UX, on recharge la trameModele complète après toutes les opérations.
        logger.info(`[Modèle Service DEBUG] Chargement de la trameModele complète après sauvegarde...`);
        const finalTrame = await this.getTemplateById(trameModeleId as string);

        if (!finalTrame) {
            // Cela ne devrait pas arriver si tout s'est bien passé.
            logger.error(`[Modèle Service] CRITICAL: La trameModele ${trameModeleId} sauvegardée n'a pas pu être récupérée après la gestion des gardes/vacations.`);
            // Retourner au moins ce qui a été sauvegardé au niveau des métadonnées, avec les gardes/vacations locales pour éviter un crash total
            const fallbackTrame = mapTrameModeleDtoToPlanningTemplate(savedOrUpdatedTrameModeleDto);
            fallbackTrame.affectations = templateData.affectations; // Garder les gardes/vacations du frontend en dernier recours
            return fallbackTrame;
        }

        logger.info(`[Modèle Service DEBUG] Tableau de service chargée avec ${finalTrame.affectations.length || 0} gardes/vacations.`);
        logger.info(`[Modèle Service DEBUG] Exemple première affectation si existe:`, finalTrame.affectations.length ? JSON.stringify(finalTrame.affectations[0], null, 2) : 'aucune affectation');
        return finalTrame;
    },

    async deleteTemplate(id: string): Promise<void> {
        logger.info(`[Modèle Service] Appel de deleteTemplate pour ID: ${id} via API /api/trameModele-modeles...`);
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
                logger.error("[Modèle Service] Erreur API lors de deleteTemplate:", response.status, errorData);
                throw new Error(`Erreur API (${response.status}): ${errorData.error || 'Impossible de supprimer la trameModele'}`);
            }
            // Pas de contenu à retourner pour un DELETE réussi (200 ou 204)
        } catch (error: unknown) {
            logger.error(`[Modèle Service] Erreur DANS deleteTemplate (API, id: ${id}):`);
            if (error instanceof Error) {
                logger.error(error.message);
                throw error;
            } else {
                logger.error("Une erreur inconnue est survenue dans deleteTemplate.");
                throw new Error("Une erreur inconnue est survenue lors de la suppression de la trameModele.");
            }
        }
    },

    // ... (autres fonctions comme duplicateTemplate, getAvailableAffectationTypes, etc. à adapter si besoin)
    // Pour l'instant, je me concentre sur CRUD de base pour TrameModele.

    // Exemple: duplicateTemplate pourrait appeler GET puis POST avec un nom modifié.
    async duplicateTemplate(id: string, availableFullActivityTypes: FullActivityType[]): Promise<PlanningTemplate> {
        logger.info(`[Modèle Service] Tentative de duplication pour ID: ${id}`);
        const originalTemplate = await this.getTemplateById(id);
        if (!originalTemplate) {
            throw new Error("Tableau de service originale non trouvée pour la duplication.");
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
        logger.info("[Modèle Service] Appel de getAvailableAffectationTypes via API /api/activity-types...");
        try {
            const token = await getClientAuthToken();
            const response = await fetch('/api/admin/activity-types', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                logger.error("[Modèle Service] Erreur API lors de getAvailableAffectationTypes:", response.status, errorData);
                throw new Error(`Erreur API (${response.status}): ${errorData.error || "Impossible de récupérer les types d'activité"}`);
            }

            const activityTypesFromApi: FullActivityType[] = await response.json(); // MODIFIÉ: Utiliser FullActivityType

            if (!Array.isArray(activityTypesFromApi)) {
                logger.error("[Modèle Service] ERREUR : la réponse de /api/activity-types n'est pas un array! Reçu:", activityTypesFromApi);
                return []; // Retourner vide en cas d'erreur de format
            }

            logger.info("[Modèle Service] Types d'activité (complets) récupérés:", activityTypesFromApi);
            return activityTypesFromApi;

        } catch (error: unknown) {
            logger.error("[Modèle Service] Erreur DANS getAvailableAffectationTypes (API):", { error: error });
            if (error instanceof Error) {
                logger.warn("[Modèle Service] Retourne un tableau vide pour availableFullActivityTypes suite à une erreur API.", error.message);
                return [];
            } else {
                logger.error("Une erreur inconnue est survenue dans getAvailableAffectationTypes.");
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

/**
 * Mapper une affectation modèle côté client (TemplateAffectation) vers le format API
 * @param affectation - L'affectation à mapper
 * @param trameTypeSemaine - Le type de semaine de la trameModele parente (TOUTES, PAIRES, IMPAIRES)
 * @returns L'objet DTO prêt à être envoyé à l'API
 */
const mapTemplateAffectationToApiDto = (
    affectation: TemplateAffectation,
    trameTypeSemaine: TypeSemaineTrameValue,
    availableActivityTypes: FullActivityType[]
): AffectationModeleCreateDto | null => {
    const activityType = availableActivityTypes.find((at: FullActivityType) => at.code === affectation.type);
    if (!activityType) {
        logger.error(`[Modèle Service] mapTemplateAffectationToApiDto: ActivityType avec le code '${affectation.type}' non trouvé.`);
        return null;
    }

    const mappedJourSemaine = dayOfWeekMapping[affectation.jour.toUpperCase() as keyof typeof dayOfWeekMapping];
    if (!mappedJourSemaine) {
        logger.error(`[Modèle Service] mapTemplateAffectationToApiDto: Jour de la semaine invalide ou non mappé: '${affectation.jour}'`);
        return null;
    }

    // Calculer le nombre total de postes requis
    const totalPostesRequis = affectation.configuration?.postes
        ?.filter(p => p.quantite > 0 && p.status !== 'INDISPONIBLE')
        .reduce((total, poste) => total + poste.quantite, 0) || 0;

    const nombrePostesRequis = (totalPostesRequis > 0) ? totalPostesRequis : (affectation.ouvert ? affectation.postesRequis : 0);

    // Simple array of personnelRequis objects (not nested with 'create')
    let personnelRequis: Array<{
        roleGenerique: string;
        nombreRequis: number;
        notes?: string;
    }> = [];

    if (nombrePostesRequis > 0) {
        personnelRequis = [{
            roleGenerique: affectation.type || "Poste par défaut",
            nombreRequis: nombrePostesRequis,
            notes: `Postes créés automatiquement pour l'affectation de type ${affectation.type}`
        }];
    }

    logger.info(`[Modèle Service DEBUG] personnelRequisConfig simplifié avant création du DTO:`, JSON.stringify(personnelRequis, null, 2));
    logger.info(`[Modèle Service DEBUG] Nombre total de postes requis calculé: ${nombrePostesRequis}`);

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
            // Sauvegarder les postes complets dans detailsJson pour restauration
            frontendPostes: affectation.configuration?.postes,
            frontendPostesRequis: affectation.postesRequis,
            // Sauvegarder les autres détails de la configuration
            notes: affectation.configuration?.notes,
            emplacementPhysique: affectation.configuration?.emplacementPhysique,
            equipementsRequis: affectation.configuration?.equipementsRequis,
            dureePreparation: affectation.configuration?.dureePreparation,
            dureeNettoyage: affectation.configuration?.dureeNettoyage,
            parametres: affectation.configuration?.parametres,
            priorite: affectation.configuration?.priorite,
            couleur: affectation.configuration?.couleur,
            contraintes: affectation.configuration?.contraintes
        },
        // L'API attend directement un tableau de personnel requis
        personnelRequis: personnelRequis.length > 0 ? personnelRequis : undefined,
    };

    return dto;
};

/**
 * Mappe une variation de configuration côté client vers le format API
 * Stockera les données dans detailsJson car il n'y a pas encore de table dédiée
 */
const mapVariationToApiDto = (
    variation: ConfigurationVariation,
    trameId: string
): any => {
    // Pour l'instant, nous allons stocker la variation comme une extension de l'affectation
    // via son champ detailsJson
    return {
        affectationId: variation.affectationId,
        trameModeleId: trameId,
        variationData: {
            id: variation.id,
            nom: variation.nom,
            priorite: variation.priorite,
            typeVariation: variation.typeVariation,
            dateDebut: variation.dateDebut,
            dateFin: variation.dateFin,
            joursSpecifiques: variation.joursSpecifiques,
            actif: variation.actif !== undefined ? variation.actif : true,
            configuration: variation.configuration,
        }
    };
}; 