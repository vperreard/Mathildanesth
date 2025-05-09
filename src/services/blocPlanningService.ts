// Service de gestion du bloc opératoire
import { v4 as uuidv4 } from 'uuid';
import {
    OperatingRoom,
    BlocSector,
    SupervisionRule,
    BlocDayPlanning,
    BlocRoomAssignment,
    BlocSupervisor,
    BlocPlanningConflict,
    ValidationResult,
    ValidationIssue
} from '../types/bloc-planning-types';
import { User } from '../types/user';
import { logger } from '../lib/logger';

// TODO: Remplacer par une vraie source de données (ex: Prisma)
const sallesOperatoires: OperatingRoom[] = [];
const secteurs: BlocSector[] = [];
const reglesSupervision: SupervisionRule[] = [];
const planningsBloc: BlocDayPlanning[] = [];

// Définition d'une interface pour les erreurs de validation spécifiques au bloc
interface BlocValidationResult {
    isValid: boolean;
    errors: BlocPlanningConflict[];
    warnings: BlocPlanningConflict[];
    infos: BlocPlanningConflict[];
}

/**
 * Service pour la gestion du planning du bloc opératoire
 */
export class BlocPlanningService {
    private rooms: Map<string, OperatingRoom> = new Map();
    private sectors: Map<string, BlocSector> = new Map();
    private rules: Map<string, SupervisionRule> = new Map();
    private plannings: Map<string, BlocDayPlanning> = new Map();

    constructor() {
        // Initialisation avec quelques données par défaut SEULEMENT si pas en mode test
        if (process.env.NODE_ENV !== 'test') {
            this.initializeDefaultData();
        }
    }

    /**
     * Réinitialise toutes les données du service (utilisé pour les tests)
     */
    resetForTesting() {
        this.rooms.clear();
        this.sectors.clear();
        this.rules.clear();
        this.plannings.clear();
        // Appeler initializeDefaultData APRÈS avoir vidé les maps
        this.initializeDefaultData();
    }

    private initializeDefaultData() {
        // Crée quelques secteurs par défaut
        const secteur1 = this.createSector({
            id: process.env.NODE_ENV === 'test' ? 'test-sector-1' : '', // ID fixe pour les tests
            nom: 'Orthopédie',
            couleur: '#FF0000',
            salles: [],
            estActif: true
        });

        const secteur2 = this.createSector({
            id: process.env.NODE_ENV === 'test' ? 'test-sector-2' : '', // ID fixe pour les tests
            nom: 'Cardiologie',
            couleur: '#0000FF',
            salles: [],
            estActif: true
        });

        // Crée quelques salles par défaut
        this.createOperatingRoom({
            id: process.env.NODE_ENV === 'test' ? 'test-room-101' : '', // ID fixe pour les tests
            numero: '101',
            nom: 'Salle Orthopédie',
            secteurId: secteur1.id,
            estActif: true
        });

        this.createOperatingRoom({
            id: process.env.NODE_ENV === 'test' ? 'test-room-102' : '', // ID fixe pour les tests
            numero: '102',
            nom: 'Salle Cardiologie',
            secteurId: secteur2.id,
            estActif: true
        });

        // Crée une règle de supervision par défaut
        this.createSupervisionRule({
            id: process.env.NODE_ENV === 'test' ? 'test-rule-standard' : '', // ID fixe pour les tests
            nom: 'Règle standard',
            type: 'BASIQUE',
            conditions: {
                maxSallesParMAR: 2
            },
            priorite: 1,
            estActif: true
        });
    }

    // GESTION DES SALLES D'OPÉRATION

    /**
     * Récupère toutes les salles d'opération
     */
    getAllOperatingRooms(): OperatingRoom[] {
        return Array.from(this.rooms.values());
    }

    /**
     * Récupère une salle d'opération par son ID
     */
    getOperatingRoomById(id: string): OperatingRoom | null {
        return this.rooms.get(id) || null;
    }

    /**
     * Crée une nouvelle salle d'opération
     */
    createOperatingRoom(salleData: Omit<OperatingRoom, 'id'> & { id?: string }): OperatingRoom {
        const id = salleData.id || uuidv4();
        const salle: OperatingRoom = {
            ...salleData,
            id
        };

        // Valider les données
        if (!salle.numero || !salle.secteurId) {
            console.warn("Données de salle incomplètes", { salleData });
        }

        // Vérifier que le secteur existe
        if (!this.sectors.has(salle.secteurId)) {
            console.warn(`Secteur ${salle.secteurId} non trouvé`, { salleData });
        }

        this.rooms.set(id, salle);

        // Ajouter la salle au secteur
        const secteur = this.sectors.get(salle.secteurId);
        if (secteur) {
            secteur.salles.push(id);
            this.sectors.set(salle.secteurId, secteur);
        }

        return salle;
    }

    /**
     * Met à jour une salle d'opération
     */
    updateOperatingRoom(id: string, salleData: Partial<OperatingRoom>): OperatingRoom | null {
        try {
            const currentRoom = this.rooms.get(id);
            if (!currentRoom) {
                return null;
            }

            // Si on change le secteur, mettre à jour les références
            if (salleData.secteurId && salleData.secteurId !== currentRoom.secteurId) {
                // Vérifier que le nouveau secteur existe
                if (!this.sectors.has(salleData.secteurId)) {
                    throw new Error(`Secteur ${salleData.secteurId} non trouvé`);
                }

                // Supprimer la salle de l'ancien secteur
                const oldSector = this.sectors.get(currentRoom.secteurId);
                if (oldSector) {
                    oldSector.salles = oldSector.salles.filter(s => s !== id);
                    this.sectors.set(oldSector.id, oldSector);
                }

                // Ajouter la salle au nouveau secteur
                const newSector = this.sectors.get(salleData.secteurId);
                if (newSector) {
                    newSector.salles.push(id);
                    this.sectors.set(newSector.id, newSector);
                }
            }

            // Mettre à jour la salle
            const updatedRoom: OperatingRoom = {
                ...currentRoom,
                ...salleData
            };
            this.rooms.set(id, updatedRoom);
            return updatedRoom;
        } catch (error) {
            logger.error(`Erreur lors de la mise à jour de la salle d'opération ${id}`, { id, salleData, error });
            throw new Error(`Erreur lors de la mise à jour de la salle d'opération ${id}`);
        }
    }

    /**
     * Supprime une salle d'opération
     */
    deleteOperatingRoom(id: string): boolean {
        const room = this.rooms.get(id);
        if (!room) {
            return false;
        }

        // Vérifier si la salle est utilisée dans un planning existant
        for (const [_, planning] of this.plannings) {
            if (planning.salles.some(salle => salle.salleId === id)) {
                const errorMessage = `Impossible de supprimer la salle ${id} car elle est utilisée dans des plannings`;
                logger.error(errorMessage, { roomId: id });
                throw new Error(errorMessage);
            }
        }

        // Retirer la salle du secteur correspondant
        const secteur = this.sectors.get(room.secteurId);
        if (secteur) {
            secteur.salles = secteur.salles.filter(salleId => salleId !== id);
            this.sectors.set(secteur.id, secteur);
        }

        // Supprimer la salle
        return this.rooms.delete(id);
    }

    // GESTION DES SECTEURS

    /**
     * Crée un nouveau secteur
     */
    createSector(secteurData: Omit<BlocSector, 'id'> & { id?: string }): BlocSector {
        const id = secteurData.id || uuidv4();
        const secteur: BlocSector = {
            ...secteurData,
            id,
            salles: [...(secteurData.salles || [])]
        };
        this.sectors.set(id, secteur);
        return secteur;
    }

    /**
     * Récupère tous les secteurs
     */
    getAllSectors(): BlocSector[] {
        return Array.from(this.sectors.values());
    }

    /**
     * Récupère un secteur par son ID
     */
    getSectorById(id: string): BlocSector | null {
        return this.sectors.get(id) || null;
    }

    /**
     * Met à jour un secteur
     */
    updateSector(id: string, secteurData: Partial<BlocSector>): BlocSector | null {
        const currentSector = this.sectors.get(id);
        if (!currentSector) {
            return null;
        }
        const updatedSector: BlocSector = {
            ...currentSector,
            ...secteurData,
            // Assurer que l'array `salles` n'est pas écrasé par un undefined
            salles: secteurData.salles !== undefined ? [...secteurData.salles] : [...currentSector.salles]
        };
        this.sectors.set(id, updatedSector);
        return updatedSector;
    }

    /**
     * Supprime un secteur (seulement s'il est vide)
     */
    deleteSector(id: string): boolean {
        const sector = this.sectors.get(id);
        if (!sector) {
            return false;
        }
        if (sector.salles.length > 0) {
            throw new Error(`Le secteur ${id} contient des salles et ne peut pas être supprimé`);
        }
        return this.sectors.delete(id);
    }

    // GESTION DES RÈGLES DE SUPERVISION

    /**
     * Crée une nouvelle règle de supervision
     */
    createSupervisionRule(ruleData: Omit<SupervisionRule, 'id'> & { id?: string }): SupervisionRule {
        const id = ruleData.id || uuidv4();
        const rule: SupervisionRule = {
            ...ruleData,
            id
        };
        this.rules.set(id, rule);
        return rule;
    }

    /**
     * Récupère toutes les règles de supervision
     */
    getAllSupervisionRules(): SupervisionRule[] {
        return Array.from(this.rules.values());
    }

    /**
     * Récupère une règle de supervision par son ID
     */
    getSupervisionRuleById(id: string): SupervisionRule | null {
        return this.rules.get(id) || null;
    }

    /**
     * Met à jour une règle de supervision
     */
    updateSupervisionRule(id: string, ruleData: Partial<SupervisionRule>): SupervisionRule | null {
        const currentRule = this.rules.get(id);
        if (!currentRule) {
            return null;
        }
        const updatedRule: SupervisionRule = {
            ...currentRule,
            ...ruleData
        };
        this.rules.set(id, updatedRule);
        return updatedRule;
    }

    /**
     * Supprime une règle de supervision
     */
    deleteSupervisionRule(id: string): boolean {
        return this.rules.delete(id);
    }

    // GESTION DES PLANNINGS JOURNALIERS

    /**
     * Récupère le planning pour une date donnée
     */
    getDayPlanning(date: string): BlocDayPlanning | null {
        return this.plannings.get(date) || null;
    }

    /**
     * Sauvegarde ou met à jour le planning pour une date donnée
     */
    saveDayPlanning(planning: BlocDayPlanning): BlocDayPlanning {
        if (!planning.date) {
            throw new Error('La date est requise pour enregistrer le planning');
        }
        // Générer un ID si non fourni
        const planningToSave: BlocDayPlanning = {
            ...planning,
            id: planning.id || uuidv4()
        };
        this.plannings.set(planningToSave.date, planningToSave);
        return planningToSave;
    }

    /**
     * Supprime le planning pour une date donnée
     */
    deleteDayPlanning(date: string): boolean {
        return this.plannings.delete(date);
    }

    // VALIDATION DU PLANNING

    /**
     * Valide un planning journalier
     * Retourne un objet contenant les erreurs et avertissements
     */
    validateDayPlanning(planning: BlocDayPlanning): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
            infos: []
        };

        const activeRules = this.getAllSupervisionRules().filter(rule => rule.estActif);

        // 1. Vérifier les contraintes de base des affectations
        // - Chaque salle doit avoir au moins un superviseur affecté pour chaque période où elle est utilisée
        // - Un superviseur ne peut pas être affecté à deux salles en même temps sur des périodes qui se chevauchent
        const supervisorAssignments: { [key: string]: { salleId: string, debut: string, fin: string }[] } = {};
        const supervisorDetailedRooms: Map<string, OperatingRoom[]> = new Map(); // Pour vérifier les règles de secteur
        const supervisorRooms: Map<string, string[]> = new Map(); // Pour les règles basiques

        planning.salles.forEach(salle => {
            const salleObj = this.getOperatingRoomById(salle.salleId);
            if (!salleObj) {
                result.errors.push({
                    id: uuidv4(),
                    type: 'SALLE_INCONNUE',
                    code: 'SALLE_ID_INVALIDE',
                    description: `La salle avec l\'ID ${salle.salleId} n\'existe pas.`,
                    severite: 'ERREUR',
                    entitesAffectees: [{ type: 'SALLE', id: salle.salleId }],
                    estResolu: false
                });
                result.isValid = false;
                // return; // On pourrait sortir ici si la salle est inconnue
            }

            if (!salle.superviseurs || salle.superviseurs.length === 0) {
                result.errors.push({
                    id: uuidv4(),
                    type: 'MANQUE_SUPERVISEUR',
                    code: 'SALLE_NON_SUPERVISEE',
                    description: `La salle ${salle.salleId} n\'a aucun superviseur affecté`,
                    severite: 'ERREUR',
                    entitesAffectees: [{ type: 'SALLE', id: salle.salleId }],
                    estResolu: false
                });
                result.isValid = false;
            }

            salle.superviseurs.forEach(superviseur => {
                if (!supervisorAssignments[superviseur.userId]) {
                    supervisorAssignments[superviseur.userId] = [];
                    supervisorDetailedRooms.set(superviseur.userId, []);
                    supervisorRooms.set(superviseur.userId, []);
                }

                // Ajouter la salle aux maps du superviseur
                supervisorRooms.get(superviseur.userId)!.push(salle.salleId);
                if (salleObj) {
                    supervisorDetailedRooms.get(superviseur.userId)!.push(salleObj);
                }

                // Itérer sur chaque période d'affectation du superviseur dans cette salle
                superviseur.periodes.forEach(periode => {
                    const currentAssignment = { salleId: salle.salleId, debut: periode.debut, fin: periode.fin };

                    // Vérifier les chevauchements de périodes pour le superviseur
                    supervisorAssignments[superviseur.userId].forEach(existingAssignment => {
                        if (this.periodsOverlap(currentAssignment, existingAssignment)) {
                            // Vérifier si c'est la même salle (un superviseur peut être sur la même salle sur des périodes qui se touchent)
                            // Ou si les périodes sont distinctes pour la même salle (ex: 8-10 et 10-12, pas un conflit)
                            // Le conflit n'arrive que si c'est une AUTRE salle ET que les périodes se chevauchent.
                            if (currentAssignment.salleId !== existingAssignment.salleId) {
                                result.errors.push({
                                    id: uuidv4(),
                                    type: 'CHEVAUCHEMENT_PERIODES',
                                    code: 'SUPERVISEUR_DOUBLE_AFFECTATION',
                                    description: `Chevauchement de périodes pour le superviseur ${superviseur.userId} entre les salles ${currentAssignment.salleId} (${currentAssignment.debut}-${currentAssignment.fin}) et ${existingAssignment.salleId} (${existingAssignment.debut}-${existingAssignment.fin})`,
                                    severite: 'ERREUR',
                                    entitesAffectees: [
                                        { type: 'SUPERVISEUR', id: superviseur.userId },
                                        { type: 'SALLE', id: currentAssignment.salleId },
                                        { type: 'SALLE', id: existingAssignment.salleId }
                                    ],
                                    estResolu: false
                                });
                                result.isValid = false;
                            }
                        }
                    });
                    supervisorAssignments[superviseur.userId].push(currentAssignment);
                });
            });
        });

        // 2. Appliquer les règles de supervision (triées par priorité)
        activeRules.sort((a, b) => b.priorite - a.priorite).forEach(rule => {
            // Appliquer les règles de base à toutes les salles
            if (rule.type === 'BASIQUE') {
                supervisorRooms.forEach((salles, userId) => {
                    if (salles.length > rule.conditions.maxSallesParMAR) {
                        result.errors.push({
                            id: uuidv4(),
                            type: 'REGLE_SUPERVISION',
                            code: 'MAX_SALLES_DEPASSEES',
                            description: `Le superviseur ${userId} est assigné à trop de salles (${salles.length} > ${rule.conditions.maxSallesParMAR})`,
                            severite: 'ERREUR',
                            entitesAffectees: [{ type: 'SUPERVISEUR', id: userId }],
                            estResolu: false
                        });
                        result.isValid = false;
                    }
                });
            }

            // Appliquer les règles spécifiques à un secteur
            else if (rule.type === 'SPECIFIQUE' && rule.secteurId) {
                const secteurId = rule.secteurId;
                const secteur = this.getSectorById(secteurId);

                if (!secteur) {
                    // Si le secteur n'existe pas, on ignore la règle
                    result.warnings.push({
                        id: uuidv4(),
                        type: 'REGLE_SECTEUR_INEXISTANT',
                        code: 'SECTEUR_INEXISTANT',
                        description: `La règle ${rule.nom} fait référence à un secteur inexistant (${secteurId})`,
                        severite: 'AVERTISSEMENT',
                        entitesAffectees: [{ type: 'SECTEUR', id: secteurId }],
                        estResolu: false
                    });
                    return;
                }

                // Vérifier les conditions de supervision interne
                if (rule.conditions.supervisionInterne) {
                    // Identifier les superviseurs externes qui supervisent des salles de ce secteur
                    planning.salles.forEach(salle => {
                        const salleObj = this.getOperatingRoomById(salle.salleId);
                        if (salleObj && salleObj.secteurId === secteurId) {
                            salle.superviseurs.forEach(superviseur => {
                                // Vérifier si le superviseur est affecté au secteur
                                // Dans une implémentation réelle, il faudrait vérifier si l'utilisateur appartient au secteur
                                const userBelongsToSector = true; // À remplacer par une vérification réelle

                                if (!userBelongsToSector) {
                                    result.errors.push({
                                        id: uuidv4(),
                                        type: 'REGLE_SUPERVISION',
                                        code: 'SUPERVISION_EXTERNE_INTERDITE',
                                        description: `Le superviseur ${superviseur.userId} n'appartient pas au secteur ${secteur.nom} et ne peut pas superviser la salle ${salleObj.nom}`,
                                        severite: 'ERREUR',
                                        entitesAffectees: [
                                            { type: 'SUPERVISEUR', id: superviseur.userId },
                                            { type: 'SALLE', id: salle.salleId }
                                        ],
                                        estResolu: false
                                    });
                                    result.isValid = false;
                                }
                            });
                        }
                    });
                }

                // Vérifier les salles contiguës
                if (rule.conditions.supervisionContigues) {
                    supervisorDetailedRooms.forEach((salles, userId) => {
                        // Filtrer les salles de ce secteur
                        const sallesDuSecteur = salles.filter(s => s.secteurId === secteurId);

                        if (sallesDuSecteur.length > 1) {
                            // Dans une implémentation réelle, il faudrait vérifier si les salles sont contiguës
                            // Ici, on suppose que les salles sont contiguës si leurs numéros se suivent
                            const numeros = sallesDuSecteur.map(s => parseInt(s.numero)).sort((a, b) => a - b);
                            let contigues = true;

                            for (let i = 1; i < numeros.length; i++) {
                                if (numeros[i] !== numeros[i - 1] + 1) {
                                    contigues = false;
                                    break;
                                }
                            }

                            if (!contigues) {
                                result.errors.push({
                                    id: uuidv4(),
                                    type: 'REGLE_SUPERVISION',
                                    code: 'SALLES_NON_CONTIGUES',
                                    description: `Le superviseur ${userId} est assigné à des salles non contiguës dans le secteur ${secteur.nom}`, severite: 'ERREUR',
                                    entitesAffectees: [
                                        { type: 'SUPERVISEUR', id: userId },
                                        { type: 'SECTEUR', id: secteurId }
                                    ],
                                    estResolu: false
                                });
                                result.isValid = false;
                            }
                        }
                    });
                }

                // Vérifier la supervision depuis d'autres secteurs
                if (rule.conditions.supervisionDepuisAutreSecteur && rule.conditions.supervisionDepuisAutreSecteur.length > 0) {
                    const secteursAutorises = new Set(rule.conditions.supervisionDepuisAutreSecteur);

                    // Dans une implémentation réelle, il faudrait vérifier si les superviseurs appartiennent aux secteurs autorisés
                    // Ici, on simule cette vérification
                    planning.salles.forEach(salle => {
                        const salleObj = this.getOperatingRoomById(salle.salleId);
                        if (salleObj && salleObj.secteurId === secteurId) {
                            salle.superviseurs.forEach(superviseur => {
                                // Simuler la vérification du secteur du superviseur
                                const supervisorSector = 'secteur-test'; // À remplacer par une valeur réelle

                                if (!secteursAutorises.has(supervisorSector) && supervisorSector !== secteurId) {
                                    result.errors.push({
                                        id: uuidv4(),
                                        type: 'REGLE_SUPERVISION',
                                        code: 'SECTEUR_NON_AUTORISE',
                                        description: `Le superviseur ${superviseur.userId} appartient à un secteur non autorisé (${supervisorSector}) pour superviser des salles du secteur ${secteur.nom}`,
                                        severite: 'ERREUR',
                                        entitesAffectees: [
                                            { type: 'SUPERVISEUR', id: superviseur.userId },
                                            { type: 'SECTEUR', id: secteurId }
                                        ],
                                        estResolu: false
                                    });
                                    result.isValid = false;
                                }
                            });
                        }
                    });
                }
            }

            // Appliquer les règles d'exception
            else if (rule.type === 'EXCEPTION') {
                // Les règles d'exception peuvent surpasser certaines règles de base
                if (rule.conditions.maxSallesExceptionnel) {
                    supervisorRooms.forEach((salles, userId) => {
                        // On vérifie si le nombre de salles dépasse le maximum exceptionnel
                        if (salles.length > rule.conditions.maxSallesExceptionnel!) {
                            result.errors.push({
                                id: uuidv4(),
                                type: 'REGLE_SUPERVISION',
                                code: 'MAX_SALLES_EXCEPTION_DEPASSEES',
                                description: `Le superviseur ${userId} est assigné à trop de salles, même en situation exceptionnelle (${salles.length} > ${rule.conditions.maxSallesExceptionnel})`,
                                severite: 'ERREUR',
                                entitesAffectees: [{ type: 'SUPERVISEUR', id: userId }],
                                estResolu: false
                            });
                            result.isValid = false;
                        }
                        // Si le nombre de salles dépasse le maximum normal mais pas le maximum exceptionnel,
                        // on ajoute un avertissement plutôt qu'une erreur
                        else if (salles.length > rule.conditions.maxSallesParMAR) {
                            result.warnings.push({
                                id: uuidv4(),
                                type: 'REGLE_SUPERVISION',
                                code: 'MAX_SALLES_EXCEPTION',
                                description: `Le superviseur ${userId} est assigné à plus de salles que la normale (${salles.length} > ${rule.conditions.maxSallesParMAR}) mais reste dans les limites exceptionnelles (≤ ${rule.conditions.maxSallesExceptionnel})`,
                                severite: 'AVERTISSEMENT',
                                entitesAffectees: [{ type: 'SUPERVISEUR', id: userId }],
                                estResolu: false
                            });
                        }
                    });
                }
            }
        });

        return result;
    }

    /**
     * Vérifie si deux périodes se chevauchent
     */
    private periodsOverlap(a: { debut: string, fin: string }, b: { debut: string, fin: string }): boolean {
        // Convertir les chaînes en Date pour une comparaison fiable
        const startA = new Date(a.debut);
        const endA = new Date(a.fin);
        const startB = new Date(b.debut);
        const endB = new Date(b.fin);
        return startA < endB && endA > startB;
    }

    // SERVICES SUPPLÉMENTAIRES

    /**
     * Récupère les superviseurs disponibles
     */
    getAvailableSupervisors() {
        // Dans une implémentation réelle, cette méthode ferait appel à un service utilisateur
        return [
            { id: 'user-1', firstName: 'Jean', lastName: 'Dupont' },
            { id: 'user-2', firstName: 'Marie', lastName: 'Martin' }
        ];
    }

    /**
     * Vérifie la compatibilité d'un planning de superviseur
     */
    checkPlanningCompatibility(userId: string, date: string, periodes: { debut: string, fin: string }[]): boolean {
        // Dans une implémentation réelle, vérifierait les conflits dans l'agenda
        return true; // Par défaut, renvoie compatible
    }
}

// Exporter une instance du service pour l'utiliser dans l'application
export const blocPlanningService = new BlocPlanningService();
