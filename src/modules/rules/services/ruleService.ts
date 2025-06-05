import { Rule, RuleType, RuleScope, RuleSeverity } from '../types/rule';
import { logger } from "../../../lib/logger";
import { defaultRules } from '../seeds/defaultRules';

/**
 * Service de gestion des règles (CRUD)
 */
export class RuleService {
    private rules: Rule[] = [];
    private nextId = 1;

    /**
     * Initialise les règles par défaut si aucune règle n'existe
     */
    static async initializeDefaultRules(): Promise<void> {
        try {
            // Vérifier si des règles existent déjà
            const existingRules = await this.getAllRules();

            if (existingRules.length === 0) {
                // Aucune règle existante, initialiser avec les règles par défaut
                for (const rule of defaultRules) {
                    await this.createRule(rule);
                }
                logger.info('Règles par défaut initialisées avec succès');
            }
        } catch (error: unknown) {
            logger.error('Erreur lors de l\'initialisation des règles par défaut:', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Récupère toutes les règles
     */
    static async getAllRules(): Promise<Rule[]> {
        try {
            const response = await fetch('http://localhost:3000/api/rules');
            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération des règles: ${response.statusText}`);
            }
            return await response.json();
        } catch (error: unknown) {
            logger.error('Erreur dans getAllRules:', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Récupère les règles par type
     */
    static async getRulesByType(type: RuleType): Promise<Rule[]> {
        try {
            const response = await fetch(`http://localhost:3000/api/rules?type=${type}`);
            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération des règles: ${response.statusText}`);
            }
            return await response.json();
        } catch (error: unknown) {
            logger.error(`Erreur dans getRulesByType pour ${type}:`, error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Crée une nouvelle règle
     */
    static async createRule(rule: Rule): Promise<Rule> {
        try {
            const response = await fetch('http://localhost:3000/api/rules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(rule)
            });

            if (!response.ok) {
                throw new Error(`Erreur lors de la création de la règle: ${response.statusText}`);
            }

            return await response.json();
        } catch (error: unknown) {
            logger.error('Erreur dans createRule:', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Met à jour une règle existante
     */
    static async updateRule(rule: Rule): Promise<Rule> {
        try {
            const response = await fetch(`http://localhost:3000/api/rules/${rule.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(rule)
            });

            if (!response.ok) {
                throw new Error(`Erreur lors de la mise à jour de la règle: ${response.statusText}`);
            }

            return await response.json();
        } catch (error: unknown) {
            logger.error('Erreur dans updateRule:', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Supprime une règle
     */
    static async deleteRule(ruleId: string): Promise<void> {
        try {
            const response = await fetch(`http://localhost:3000/api/rules/${ruleId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Erreur lors de la suppression de la règle: ${response.statusText}`);
            }
        } catch (error: unknown) {
            logger.error('Erreur dans deleteRule:', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Exporte toutes les règles
     */
    static async exportRules(): Promise<string> {
        try {
            const rules = await this.getAllRules();
            return JSON.stringify(rules, null, 2);
        } catch (error: unknown) {
            logger.error('Erreur dans exportRules:', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Importe des règles depuis un fichier JSON
     */
    static async importRules(rulesJson: string, replaceAll: boolean = false): Promise<void> {
        try {
            const rules = JSON.parse(rulesJson) as Rule[];

            if (replaceAll) {
                // Supprimer toutes les règles existantes (sauf les règles par défaut)
                const existingRules = await this.getAllRules();
                for (const rule of existingRules) {
                    if (!rule.isDefault) {
                        await this.deleteRule(rule.id);
                    }
                }
            }

            // Importer les nouvelles règles
            for (const rule of rules) {
                const existingRule = await this.getRuleById(rule.id);
                if (existingRule) {
                    await this.updateRule(rule);
                } else {
                    await this.createRule(rule);
                }
            }
        } catch (error: unknown) {
            logger.error('Erreur dans importRules:', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Récupère une règle par son ID
     */
    static async getRuleById(ruleId: string): Promise<Rule | null> {
        try {
            const response = await fetch(`http://localhost:3000/api/rules/${ruleId}`);

            if (response.status === 404) {
                return null;
            }

            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération de la règle: ${response.statusText}`);
            }

            return await response.json();
        } catch (error: unknown) {
            logger.error('Erreur dans getRuleById:', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Réinitialise une règle à sa configuration par défaut
     */
    static async resetRuleToDefault(ruleId: string): Promise<Rule | null> {
        try {
            // Trouver la règle par défaut correspondante
            const existingRule = await this.getRuleById(ruleId);
            if (!existingRule || !existingRule.isDefault) {
                return null;
            }

            // Trouver la règle par défaut correspondante
            const defaultRule = defaultRules.find(r =>
                r.type === existingRule.type && r.name === existingRule.name
            );

            if (!defaultRule) {
                return null;
            }

            // Réinitialiser la configuration
            const updatedRule = {
                ...existingRule,
                configuration: JSON.parse(JSON.stringify(defaultRule.configuration)),
                updatedAt: new Date()
            };

            return await this.updateRule(updatedRule);
        } catch (error: unknown) {
            logger.error('Erreur dans resetRuleToDefault:', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Filtrer les règles selon différents critères
     */
    filterRules(filters: {
        type?: RuleType | RuleType[];
        scope?: RuleScope;
        scopeValue?: string;
        enabled?: boolean;
    }): Rule[] {
        return this.rules.filter(rule => {
            // Filtrer par type
            if (filters.type) {
                if (Array.isArray(filters.type)) {
                    if (!filters.type.includes(rule.type)) {
                        return false;
                    }
                } else if (rule.type !== filters.type) {
                    return false;
                }
            }

            // Filtrer par portée
            if (filters.scope && rule.scope !== filters.scope) {
                return false;
            }

            // Filtrer par valeur de portée
            if (filters.scopeValue) {
                if (Array.isArray(rule.scopeValue)) {
                    if (!rule.scopeValue.includes(filters.scopeValue)) {
                        return false;
                    }
                } else if (rule.scopeValue !== filters.scopeValue) {
                    return false;
                }
            }

            // Filtrer par état d'activation
            if (filters.enabled !== undefined && rule.enabled !== filters.enabled) {
                return false;
            }

            return true;
        });
    }

    /**
     * Crée une nouvelle règle
     */
    createRule(ruleData: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>): Rule {
        const now = new Date().toISOString();

        const rule: Rule = {
            ...ruleData,
            id: `rule_${this.nextId++}`,
            createdAt: now,
            updatedAt: now
        };

        this.rules.push(rule);
        return rule;
    }

    /**
     * Met à jour une règle existante
     */
    updateRule(id: string, ruleData: Partial<Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>>): Rule | null {
        const index = this.rules.findIndex(rule => rule.id === id);

        if (index === -1) {
            return null;
        }

        const updatedRule: Rule = {
            ...this.rules[index],
            ...ruleData,
            updatedAt: new Date().toISOString()
        };

        this.rules[index] = updatedRule;
        return updatedRule;
    }

    /**
     * Supprime une règle
     */
    deleteRule(id: string): boolean {
        const initialLength = this.rules.length;
        this.rules = this.rules.filter(rule => rule.id !== id);
        return this.rules.length < initialLength;
    }

    /**
     * Active ou désactive une règle
     */
    toggleRuleStatus(id: string, enabled: boolean): Rule | null {
        return this.updateRule(id, { enabled });
    }

    /**
     * Crée des règles de démonstration
     */
    createDemoRules(): Rule[] {
        // Vider les règles existantes
        this.rules = [];
        this.nextId = 1;

        // Créer quelques règles de démonstration

        // 1. Règle de repos minimum après une garde
        this.createRule({
            name: 'Repos minimum après garde',
            description: 'Période de repos minimum obligatoire après une garde de nuit',
            type: RuleType.MIN_REST_PERIOD,
            severity: RuleSeverity.ERROR,
            scope: RuleScope.GLOBAL,
            enabled: true,
            parameters: {
                minHours: 24,
                shiftTypes: ['night'],
            },
            priority: 100
        });

        // 2. Règle de nombre maximum de gardes par semaine
        this.createRule({
            name: 'Maximum de gardes par semaine',
            description: 'Limite le nombre de gardes attribuées par semaine',
            type: RuleType.MAX_SHIFTS_PER_WEEK,
            severity: RuleSeverity.ERROR,
            scope: RuleScope.GLOBAL,
            enabled: true,
            parameters: {
                maxShifts: 2,
                period: 'week',
                shiftTypes: ['day', 'night'],
            },
            priority: 90
        });

        // 3. Règle de préavis minimum pour les congés
        this.createRule({
            name: 'Préavis pour congés',
            description: 'Délai minimal de demande pour les congés',
            type: RuleType.MIN_ADVANCE_NOTICE,
            severity: RuleSeverity.WARNING,
            scope: RuleScope.GLOBAL,
            enabled: true,
            parameters: {
                minAdvanceNoticeDays: 14,
                leaveTypes: ['annual', 'unpaid'],
            },
            priority: 80
        });

        // 4. Règle de quota de congés pendant l'été
        this.createRule({
            name: 'Quota été',
            description: 'Limite le nombre de jours de congés en période estivale',
            type: RuleType.SEASON_QUOTA,
            severity: RuleSeverity.ERROR,
            scope: RuleScope.GLOBAL,
            enabled: true,
            parameters: {
                seasonStart: '07-01', // 1er juillet
                seasonEnd: '08-31',   // 31 août
                seasonQuota: 15,
                leaveTypes: ['annual'],
            },
            priority: 85
        });

        // 5. Règle de qualification pour les gardes en réanimation
        this.createRule({
            name: 'Qualification réanimation',
            description: 'Compétences requises pour les gardes en réanimation',
            type: RuleType.SHIFT_QUALIFICATION,
            severity: RuleSeverity.ERROR,
            scope: RuleScope.SERVICE,
            scopeValue: 'icu',
            enabled: true,
            parameters: {
                qualifications: ['icu_certified', 'ventilation_trained'],
                shiftTypes: ['day', 'night'],
            },
            priority: 95
        });

        return this.rules;
    }
}

// Exporter une instance unique du service
export const ruleService = new RuleService();
