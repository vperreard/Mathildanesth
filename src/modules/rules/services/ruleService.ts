import { Rule, RuleType, RuleScope, RuleSeverity } from '../types/rule';

/**
 * Service de gestion des règles (CRUD)
 */
export class RuleService {
    private rules: Rule[] = [];
    private nextId = 1;

    /**
     * Récupère toutes les règles
     */
    getAllRules(): Rule[] {
        return [...this.rules];
    }

    /**
     * Récupère une règle par son ID
     */
    getRuleById(id: string): Rule | undefined {
        return this.rules.find(rule => rule.id === id);
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
