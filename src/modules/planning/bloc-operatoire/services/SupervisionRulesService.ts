import { v4 as uuidv4 } from 'uuid';
import { OperatingSupervisionRule, OperatingSector } from '../types';
import { logError, ErrorType } from '@/lib/errorHandling';
import { operatingRoomService } from './OperatingRoomService';

/**
 * Service de gestion des règles de supervision pour le bloc opératoire
 * Permet de créer, lire, mettre à jour et supprimer des règles de supervision
 */
export class SupervisionRulesService {
    private rules: Map<string, OperatingSupervisionRule> = new Map();

    // Erreurs possibles
    private static readonly ERRORS = {
        RULE_NOT_FOUND: 'Règle de supervision non trouvée',
        SECTOR_NOT_FOUND: 'Secteur non trouvé',
        RULE_CONFLICT: 'Conflit entre règles de supervision',
        CREATION_FAILED: 'Échec de la création de la règle de supervision',
        UPDATE_FAILED: 'Échec de la mise à jour de la règle de supervision',
        INVALID_DATA: 'Données de règle de supervision invalides'
    };

    constructor() {
        this.loadData();
    }

    /**
     * Charge les données initiales (à remplacer par un appel API)
     * @private
     */
    private loadData(): void {
        try {
            // Simulation de chargement des données

            // Si dans un environnement de développement, on ajoute des données de test
            if (process.env.NODE_ENV === 'development') {
                this.initializeTestData();
            }
        } catch (error) {
            logError({
                type: ErrorType.SERVER,
                message: 'Erreur lors du chargement des données des règles de supervision',
                originalError: error
            });
        }
    }

    /**
     * Initialise des données de test (uniquement en développement)
     * @private
     */
    private initializeTestData(): void {
        try {
            const sectors = operatingRoomService.getAllSectors();
            if (sectors.length === 0) return;

            // Règle basique (applicable à tous les secteurs)
            const regleBasique: OperatingSupervisionRule = {
                id: uuidv4(),
                nom: 'Règle de supervision standard',
                description: 'Règle de supervision applicable à tous les secteurs',
                type: 'BASIQUE',
                conditions: {
                    maxSallesParMAR: 2,
                    supervisionInterne: true,
                    supervisionContigues: true
                },
                priorite: 1,
                estActif: true
            };

            // Règle spécifique pour orthopédie (si ce secteur existe)
            const secteurOrthopedie = sectors.find(s => s.nom.toLowerCase().includes('ortho'));
            if (secteurOrthopedie) {
                const regleOrthopedie: OperatingSupervisionRule = {
                    id: uuidv4(),
                    nom: 'Supervision Orthopédie',
                    description: 'Règles spécifiques pour le secteur d\'orthopédie',
                    secteurId: secteurOrthopedie.id,
                    type: 'SPECIFIQUE',
                    conditions: {
                        maxSallesParMAR: 3,
                        supervisionInterne: true,
                        competencesRequises: ['Orthopédie générale']
                    },
                    priorite: 2,
                    estActif: true
                };
                this.rules.set(regleOrthopedie.id, regleOrthopedie);
            }

            // Règle spécifique pour cardiologie (si ce secteur existe)
            const secteurCardio = sectors.find(s => s.nom.toLowerCase().includes('cardio'));
            if (secteurCardio) {
                const regleCardio: OperatingSupervisionRule = {
                    id: uuidv4(),
                    nom: 'Supervision Cardiologie',
                    description: 'Règles spécifiques pour le secteur de cardiologie',
                    secteurId: secteurCardio.id,
                    type: 'SPECIFIQUE',
                    conditions: {
                        maxSallesParMAR: 1,
                        supervisionInterne: true,
                        competencesRequises: ['Cardiologie générale']
                    },
                    priorite: 2,
                    estActif: true
                };
                this.rules.set(regleCardio.id, regleCardio);
            }

            // Règle d'exception pour cas spéciaux
            const regleException: OperatingSupervisionRule = {
                id: uuidv4(),
                nom: 'Exception pour supervision étendue',
                description: 'Permet la supervision de salles supplémentaires en cas de nécessité',
                type: 'EXCEPTION',
                conditions: {
                    maxSallesParMAR: 4,
                    maxSallesExceptionnel: 4,
                    supervisionInterne: false,
                    supervisionContigues: false
                },
                priorite: 10, // Priorité élevée pour surcharger les autres règles
                estActif: true
            };

            // Ajouter les règles à la Map
            this.rules.set(regleBasique.id, regleBasique);
            this.rules.set(regleException.id, regleException);
        } catch (error) {
            logError({
                type: ErrorType.SERVER,
                message: 'Erreur lors de l\'initialisation des données de test des règles de supervision',
                originalError: error
            });
        }
    }

    /**
     * Récupère toutes les règles de supervision
     * @returns Liste des règles de supervision
     */
    public getAll(): OperatingSupervisionRule[] {
        return Array.from(this.rules.values());
    }

    /**
     * Récupère une règle de supervision par son ID
     * @param id ID de la règle
     * @returns La règle ou null si non trouvée
     */
    public getById(id: string): OperatingSupervisionRule | null {
        return this.rules.get(id) || null;
    }

    /**
     * Récupère les règles d'un type spécifique
     * @param type Type de règle (BASIQUE, SPECIFIQUE, EXCEPTION)
     * @returns Liste des règles du type spécifié
     */
    public getByType(type: 'BASIQUE' | 'SPECIFIQUE' | 'EXCEPTION'): OperatingSupervisionRule[] {
        return Array.from(this.rules.values()).filter(rule => rule.type === type);
    }

    /**
     * Récupère les règles pour un secteur spécifique
     * @param sectorId ID du secteur
     * @returns Liste des règles applicables au secteur
     */
    public getRulesForSector(sectorId: string): OperatingSupervisionRule[] {
        return Array.from(this.rules.values()).filter(rule =>
            rule.estActif && (
                rule.type === 'BASIQUE' || // Règles basiques (applicables partout)
                (rule.type === 'SPECIFIQUE' && rule.secteurId === sectorId) || // Règles spécifiques au secteur
                (rule.type === 'EXCEPTION' && (!rule.secteurId || rule.secteurId === sectorId)) // Exceptions applicables
            )
        ).sort((a, b) => b.priorite - a.priorite); // Trier par priorité décroissante
    }

    /**
     * Crée une nouvelle règle de supervision
     * @param data Données de la règle (sans ID)
     * @returns La règle créée
     * @throws Erreur si la création échoue
     */
    public create(data: Omit<OperatingSupervisionRule, 'id'>): OperatingSupervisionRule {
        try {
            // Vérifier que les données sont valides
            this.validateRuleData(data);

            // Vérifier si un secteur est spécifié et s'il existe
            if (data.secteurId) {
                const sector = operatingRoomService.getSectorById(data.secteurId);
                if (!sector) {
                    throw new Error(SupervisionRulesService.ERRORS.SECTOR_NOT_FOUND);
                }
            }

            // Générer un ID unique
            const id = uuidv4();

            // Créer la règle
            const rule: OperatingSupervisionRule = {
                ...data,
                id
            };

            // Ajouter à la Map
            this.rules.set(id, rule);

            return rule;
        } catch (error) {
            logError({
                type: ErrorType.VALIDATION,
                message: 'Erreur lors de la création d\'une règle de supervision',
                originalError: error,
                details: { data }
            });
            throw error;
        }
    }

    /**
     * Met à jour une règle de supervision existante
     * @param id ID de la règle à mettre à jour
     * @param data Données partielles de mise à jour
     * @returns La règle mise à jour
     * @throws Erreur si la mise à jour échoue
     */
    public update(id: string, data: Partial<Omit<OperatingSupervisionRule, 'id'>>): OperatingSupervisionRule {
        try {
            // Vérifier que la règle existe
            const existingRule = this.rules.get(id);
            if (!existingRule) {
                throw new Error(SupervisionRulesService.ERRORS.RULE_NOT_FOUND);
            }

            // Si on change de secteur, vérifier qu'il existe
            if (data.secteurId && data.secteurId !== existingRule.secteurId) {
                const sector = operatingRoomService.getSectorById(data.secteurId);
                if (!sector) {
                    throw new Error(SupervisionRulesService.ERRORS.SECTOR_NOT_FOUND);
                }
            }

            // Fusionner les conditions si elles sont partiellement mises à jour
            const updatedConditions = data.conditions
                ? { ...existingRule.conditions, ...data.conditions }
                : existingRule.conditions;

            // Mettre à jour la règle
            const updatedRule: OperatingSupervisionRule = {
                ...existingRule,
                ...data,
                conditions: updatedConditions
            };

            // Valider les données mises à jour
            this.validateRuleData(updatedRule);

            // Enregistrer la mise à jour
            this.rules.set(id, updatedRule);

            return updatedRule;
        } catch (error) {
            logError({
                type: ErrorType.VALIDATION,
                message: `Erreur lors de la mise à jour de la règle de supervision ${id}`,
                originalError: error,
                details: { id, data }
            });
            throw error;
        }
    }

    /**
     * Supprime une règle de supervision
     * @param id ID de la règle à supprimer
     * @returns true si la suppression a réussi, false sinon
     * @throws Erreur si la suppression échoue
     */
    public delete(id: string): boolean {
        try {
            // Vérifier que la règle existe
            if (!this.rules.has(id)) {
                return false;
            }

            // Supprimer la règle
            return this.rules.delete(id);
        } catch (error) {
            logError({
                type: ErrorType.SERVER,
                message: `Erreur lors de la suppression de la règle de supervision ${id}`,
                originalError: error,
                details: { id }
            });
            throw error;
        }
    }

    /**
     * Vérifie si deux secteurs sont compatibles pour la supervision
     * @param sector1Id ID du premier secteur
     * @param sector2Id ID du deuxième secteur
     * @returns true si les secteurs sont compatibles, false sinon
     */
    public areSectorsCompatible(sector1Id: string, sector2Id: string): boolean {
        // Si c'est le même secteur, ils sont compatibles
        if (sector1Id === sector2Id) return true;

        // Récupérer les secteurs
        const sector1 = operatingRoomService.getSectorById(sector1Id);
        const sector2 = operatingRoomService.getSectorById(sector2Id);

        if (!sector1 || !sector2) return false;

        // Vérifier s'il existe une règle spécifique pour le secteur 1
        const sector1Rules = this.getRulesForSector(sector1Id);
        const sector1SpecificRule = sector1Rules.find(r => r.type === 'SPECIFIQUE');

        // Si une règle spécifique interdit explicitement la supervision depuis d'autres secteurs
        if (sector1SpecificRule && sector1SpecificRule.conditions.supervisionInterne === true) {
            return false;
        }

        // Vérifier s'il y a des incompatibilités explicites
        const hasIncompatibility = sector1Rules.some(rule =>
            rule.conditions.incompatibilites?.includes(sector2Id)
        );
        if (hasIncompatibility) return false;

        // Vérifier si le secteur 1 permet la supervision depuis le secteur 2
        const allowsFromSector2 = sector1Rules.some(rule =>
            rule.conditions.supervisionDepuisAutreSecteur?.includes(sector2Id)
        );
        if (allowsFromSector2) return true;

        // Par défaut, vérifier les règles de base
        const baseRules = this.getByType('BASIQUE');
        if (baseRules.length === 0) return true; // Pas de règles, tout est permis

        // Utiliser la règle de base de plus haute priorité
        const highestPriorityBaseRule = baseRules.reduce((prev, current) =>
            (current.priorite > prev.priorite) ? current : prev
        );

        // Si la règle de base exige une supervision interne uniquement
        return !highestPriorityBaseRule.conditions.supervisionInterne;
    }

    /**
     * Détermine le nombre maximum de salles qu'un médecin peut superviser
     * Prend en compte les règles basiques, spécifiques et d'exception
     * @param sectorIds IDs des secteurs concernés
     * @returns Nombre maximum de salles
     */
    public getMaxRoomsForDoctor(sectorIds: string[]): number {
        // Valeur par défaut
        let maxRooms = 2;
        let maxRoomsExceptionnel = 0;
        let hasException = false;

        // Obtenir les règles basiques
        const baseRules = this.getByType('BASIQUE')
            .filter(r => r.estActif)
            .sort((a, b) => b.priorite - a.priorite);

        // Appliquer la règle basique de plus haute priorité
        if (baseRules.length > 0) {
            maxRooms = baseRules[0].conditions.maxSallesParMAR;
            maxRoomsExceptionnel = baseRules[0].conditions.maxSallesExceptionnel || 0;
        }

        // Pour chaque secteur, vérifier les règles spécifiques
        for (const sectorId of sectorIds) {
            const sectorRules = this.getRulesForSector(sectorId)
                .filter(r => r.type === 'SPECIFIQUE' && r.estActif)
                .sort((a, b) => b.priorite - a.priorite);

            // Si on a une règle spécifique pour ce secteur, appliquer sa valeur
            if (sectorRules.length > 0) {
                // Prendre le min pour être conservatif
                maxRooms = Math.min(maxRooms, sectorRules[0].conditions.maxSallesParMAR);
            }
        }

        // Vérifier les règles d'exception
        const exceptionRules = this.getByType('EXCEPTION')
            .filter(r => r.estActif)
            .sort((a, b) => b.priorite - a.priorite);

        if (exceptionRules.length > 0) {
            // Règle d'exception avec la plus haute priorité
            const topExceptionRule = exceptionRules[0];

            // Si une règle d'exception est spécifiée pour un des secteurs
            const sectorSpecificException = exceptionRules.find(r =>
                r.secteurId && sectorIds.includes(r.secteurId)
            );

            if (sectorSpecificException) {
                maxRoomsExceptionnel = sectorSpecificException.conditions.maxSallesExceptionnel ||
                    sectorSpecificException.conditions.maxSallesParMAR;
                hasException = true;
            } else if (!topExceptionRule.secteurId) {
                // Règle d'exception générale
                maxRoomsExceptionnel = topExceptionRule.conditions.maxSallesExceptionnel ||
                    topExceptionRule.conditions.maxSallesParMAR;
                hasException = true;
            }
        }

        // Retourner le maximum standard ou exceptionnel
        return hasException ? Math.max(maxRooms, maxRoomsExceptionnel) : maxRooms;
    }

    /**
     * Valide les données d'une règle de supervision
     * @param data Données à valider
     * @throws Erreur si les données sont invalides
     * @private
     */
    private validateRuleData(data: Omit<OperatingSupervisionRule, 'id'> | OperatingSupervisionRule): void {
        // Vérifier que les champs obligatoires sont présents
        if (!data.nom || !data.type || !data.conditions || !data.priorite) {
            throw new Error(SupervisionRulesService.ERRORS.INVALID_DATA);
        }

        // Vérifier que le type est valide
        if (!['BASIQUE', 'SPECIFIQUE', 'EXCEPTION'].includes(data.type)) {
            throw new Error(`Type de règle invalide: ${data.type}`);
        }

        // Si c'est une règle spécifique, un secteur doit être spécifié
        if (data.type === 'SPECIFIQUE' && !data.secteurId) {
            throw new Error('Une règle spécifique doit être associée à un secteur');
        }

        // Vérifier que les conditions minimales sont présentes
        if (typeof data.conditions.maxSallesParMAR !== 'number' || data.conditions.maxSallesParMAR < 1) {
            throw new Error('Le nombre maximum de salles par MAR doit être spécifié et supérieur à 0');
        }

        // Vérifier que la priorité est valide
        if (typeof data.priorite !== 'number' || data.priorite < 0) {
            throw new Error('La priorité doit être un nombre positif');
        }
    }

    /**
     * Détecte et retourne les conflits entre règles
     * @returns Liste des conflits détectés
     */
    public detectRuleConflicts(): Array<{
        rule1: OperatingSupervisionRule,
        rule2: OperatingSupervisionRule,
        conflictType: string,
        description: string
    }> {
        const conflicts = [];
        const activeRules = this.getAll().filter(r => r.estActif);

        // Vérifier les conflits entre règles de même type et même secteur
        for (let i = 0; i < activeRules.length; i++) {
            for (let j = i + 1; j < activeRules.length; j++) {
                const rule1 = activeRules[i];
                const rule2 = activeRules[j];

                // Conflit potentiel: même type et même secteur avec des conditions différentes
                if (rule1.type === rule2.type &&
                    rule1.secteurId === rule2.secteurId &&
                    rule1.conditions.maxSallesParMAR !== rule2.conditions.maxSallesParMAR) {

                    conflicts.push({
                        rule1,
                        rule2,
                        conflictType: 'CONFLIT_NOMBRE_SALLES',
                        description: `Conflit sur le nombre maximum de salles entre "${rule1.nom}" et "${rule2.nom}"`
                    });
                }

                // Conflit potentiel: règles incompatibles pour un même secteur
                if (rule1.secteurId && rule2.secteurId && rule1.secteurId === rule2.secteurId) {
                    // Vérifier les incompatibilités explicites
                    if (rule1.conditions.incompatibilites?.includes(rule2.secteurId) ||
                        rule2.conditions.incompatibilites?.includes(rule1.secteurId)) {

                        conflicts.push({
                            rule1,
                            rule2,
                            conflictType: 'CONFLIT_INCOMPATIBILITE',
                            description: `Incompatibilité explicite entre "${rule1.nom}" et "${rule2.nom}"`
                        });
                    }

                    // Conflit sur la supervision interne
                    if (rule1.conditions.supervisionInterne !== rule2.conditions.supervisionInterne) {
                        conflicts.push({
                            rule1,
                            rule2,
                            conflictType: 'CONFLIT_SUPERVISION_INTERNE',
                            description: `Conflit sur la supervision interne entre "${rule1.nom}" et "${rule2.nom}"`
                        });
                    }
                }
            }
        }

        return conflicts;
    }
}

// Exporter une instance singleton du service
export const supervisionRulesService = new SupervisionRulesService(); 