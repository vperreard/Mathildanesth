import { v4 as uuidv4 } from 'uuid';
import { OperatingSupervisionRule } from '../types';

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
        this.initializeDefaultRules();
    }

    /**
     * Initialise des règles par défaut
     */
    private initializeDefaultRules(): void {
        // Règle basique par défaut
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

        this.rules.set(regleBasique.id, regleBasique);
    }

    /**
     * Récupère toutes les règles de supervision
     */
    public getAll(): OperatingSupervisionRule[] {
        return Array.from(this.rules.values());
    }

    /**
     * Récupère une règle de supervision par son ID
     */
    public getById(id: string): OperatingSupervisionRule | null {
        return this.rules.get(id) || null;
    }

    /**
     * Récupère les règles d'un type spécifique
     */
    public getByType(type: 'BASIQUE' | 'SPECIFIQUE' | 'EXCEPTION'): OperatingSupervisionRule[] {
        return Array.from(this.rules.values()).filter(rule => rule.type === type);
    }

    /**
     * Récupère les règles pour un secteur spécifique
     */
    public getRulesForSector(sectorId: string): OperatingSupervisionRule[] {
        return Array.from(this.rules.values()).filter(rule =>
            rule.estActif && (
                rule.type === 'BASIQUE' ||
                (rule.type === 'SPECIFIQUE' && rule.secteurId === sectorId) ||
                (rule.type === 'EXCEPTION' && (!rule.secteurId || rule.secteurId === sectorId))
            )
        ).sort((a, b) => b.priorite - a.priorite);
    }

    /**
     * Crée une nouvelle règle de supervision
     */
    public create(data: Omit<OperatingSupervisionRule, 'id'>): OperatingSupervisionRule {
        const id = uuidv4();
        const rule: OperatingSupervisionRule = {
            ...data,
            id
        };

        this.rules.set(id, rule);
        return rule;
    }

    /**
     * Met à jour une règle de supervision existante
     */
    public update(id: string, data: Partial<Omit<OperatingSupervisionRule, 'id'>>): OperatingSupervisionRule {
        const existingRule = this.rules.get(id);
        if (!existingRule) {
            throw new Error(SupervisionRulesService.ERRORS.RULE_NOT_FOUND);
        }

        const updatedRule: OperatingSupervisionRule = {
            ...existingRule,
            ...data
        };

        this.rules.set(id, updatedRule);
        return updatedRule;
    }

    /**
     * Supprime une règle de supervision
     */
    public delete(id: string): boolean {
        return this.rules.delete(id);
    }

    /**
     * Vérifie si des secteurs sont compatibles
     */
    public areSectorsCompatible(sector1Id: string, sector2Id: string): boolean {
        // Logique simplifiée - tous les secteurs sont compatibles par défaut
        return true;
    }

    /**
     * Calcule le nombre maximum de salles qu'un médecin peut superviser
     */
    public getMaxRoomsForDoctor(sectorIds: string[]): number {
        if (sectorIds.length === 0) return 0;

        // Récupérer toutes les règles applicables
        const applicableRules = sectorIds.flatMap(sectorId =>
            this.getRulesForSector(sectorId)
        );

        if (applicableRules.length === 0) return 2; // Valeur par défaut

        // Prendre la règle avec la priorité la plus élevée
        const highestPriorityRule = applicableRules.reduce((max, rule) =>
            rule.priorite > max.priorite ? rule : max
        );

        return highestPriorityRule.conditions.maxSallesParMAR || 2;
    }
}

// Instance exportée du service
export const supervisionRulesService = new SupervisionRulesService(); 