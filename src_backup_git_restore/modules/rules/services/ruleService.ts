import {
    AnyRule,
    RuleType,
    LeaveRule,
    DutyRule,
    SupervisionRule,
    AssignmentRule,
    OnCallRule,
    RuleConflict,
    RuleValidationResult,
    RulePriority,
    RuleSeverity,
    RotationStrategy,
    Rule
} from '../types/rule';

/**
 * Service pour la gestion des règles de planning
 */
export class RuleService {
    private API_BASE_URL = '/api/rules';

    /**
     * Récupère toutes les règles avec filtres optionnels
     */
    public async getAllRules(filters?: {
        type?: RuleType | RuleType[];
        priority?: RulePriority | RulePriority[];
        isActive?: boolean;
        search?: string;
    }): Promise<AnyRule[]> {
        try {
            // Construire l'URL avec les filtres
            const url = new URL(this.API_BASE_URL, window.location.origin);

            // Ajouter les filtres à l'URL
            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined) {
                        if (Array.isArray(value)) {
                            value.forEach(v => url.searchParams.append(key, String(v)));
                        } else {
                            url.searchParams.append(key, String(value));
                        }
                    }
                });
            }

            const response = await fetch(url.toString());

            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération des règles: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur dans getAllRules:', error);
            throw error;
        }
    }

    /**
     * Récupère les règles par type
     */
    public async getRulesByType(type: RuleType): Promise<AnyRule[]> {
        return this.getAllRules({ type });
    }

    /**
     * Récupère une règle par son ID
     */
    public async getRuleById(ruleId: string): Promise<AnyRule> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/${ruleId}`);

            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération de la règle: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Erreur dans getRuleById pour l'ID ${ruleId}:`, error);
            throw error;
        }
    }

    /**
     * Crée une nouvelle règle
     */
    public async createRule(rule: Omit<AnyRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnyRule> {
        try {
            const response = await fetch(this.API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(rule),
            });

            if (!response.ok) {
                throw new Error(`Erreur lors de la création de la règle: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur dans createRule:', error);
            throw error;
        }
    }

    /**
     * Met à jour une règle existante
     */
    public async updateRule(ruleId: string, rule: Partial<AnyRule>): Promise<AnyRule> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/${ruleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(rule),
            });

            if (!response.ok) {
                throw new Error(`Erreur lors de la mise à jour de la règle: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Erreur dans updateRule pour l'ID ${ruleId}:`, error);
            throw error;
        }
    }

    /**
     * Active ou désactive une règle
     */
    public async toggleRuleStatus(ruleId: string, isActive: boolean): Promise<AnyRule> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/${ruleId}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isActive }),
            });

            if (!response.ok) {
                throw new Error(`Erreur lors du changement de statut de la règle: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Erreur dans toggleRuleStatus pour l'ID ${ruleId}:`, error);
            throw error;
        }
    }

    /**
     * Supprime une règle
     */
    public async deleteRule(ruleId: string): Promise<void> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/${ruleId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`Erreur lors de la suppression de la règle: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Erreur dans deleteRule pour l'ID ${ruleId}:`, error);
            throw error;
        }
    }

    /**
     * Valide un ensemble de règles pour détecter des conflits potentiels
     */
    public async validateRules(rules: AnyRule[]): Promise<RuleValidationResult> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(rules),
            });

            if (!response.ok) {
                throw new Error(`Erreur lors de la validation des règles: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur dans validateRules:', error);
            throw error;
        }
    }

    /**
     * Récupère tous les conflits de règles
     */
    public async getAllConflicts(): Promise<RuleConflict[]> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/conflicts`);

            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération des conflits: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur dans getAllConflicts:', error);
            throw error;
        }
    }

    /**
     * Résout un conflit de règles
     */
    public async resolveConflict(conflictId: string, resolution: {
        actionType: 'MODIFY_RULES' | 'IGNORE_CONFLICT' | 'DELETE_RULES';
        modifiedRules?: AnyRule[];
        rulesToDelete?: string[];
        ignoreReason?: string;
    }): Promise<void> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/conflicts/${conflictId}/resolve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(resolution),
            });

            if (!response.ok) {
                throw new Error(`Erreur lors de la résolution du conflit: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Erreur dans resolveConflict pour l'ID ${conflictId}:`, error);
            throw error;
        }
    }

    /**
     * Crée une nouvelle règle de congé
     */
    public async createLeaveRule(rule: Omit<LeaveRule, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Promise<LeaveRule> {
        const fullRule = {
            ...rule,
            type: RuleType.LEAVE,
            validFrom: rule.validFrom || new Date(),
            validTo: rule.validTo || null
        };

        return this.createRule(fullRule as unknown as Omit<AnyRule, 'id' | 'createdAt' | 'updatedAt'>) as unknown as LeaveRule;
    }

    /**
     * Crée une nouvelle règle de garde
     */
    public async createDutyRule(rule: Omit<DutyRule, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Promise<DutyRule> {
        const fullRule = {
            ...rule,
            type: RuleType.DUTY,
            validFrom: rule.validFrom || new Date(),
            validTo: rule.validTo || null
        };

        return this.createRule(fullRule as unknown as Omit<AnyRule, 'id' | 'createdAt' | 'updatedAt'>) as unknown as DutyRule;
    }

    /**
     * Crée une nouvelle règle de supervision
     */
    public async createSupervisionRule(rule: Omit<SupervisionRule, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Promise<SupervisionRule> {
        const fullRule = {
            ...rule,
            type: RuleType.SUPERVISION,
            validFrom: rule.validFrom || new Date(),
            validTo: rule.validTo || null
        };

        return this.createRule(fullRule as unknown as Omit<AnyRule, 'id' | 'createdAt' | 'updatedAt'>) as unknown as SupervisionRule;
    }

    /**
     * Crée une nouvelle règle d'assignation
     */
    public async createAssignmentRule(rule: Omit<AssignmentRule, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Promise<AssignmentRule> {
        const fullRule = {
            ...rule,
            type: RuleType.ASSIGNMENT,
            validFrom: rule.validFrom || new Date(),
            validTo: rule.validTo || null
        };

        return this.createRule(fullRule as unknown as Omit<AnyRule, 'id' | 'createdAt' | 'updatedAt'>) as unknown as AssignmentRule;
    }

    /**
     * Crée une nouvelle règle d'astreinte
     */
    public async createOnCallRule(rule: Omit<OnCallRule, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Promise<OnCallRule> {
        const fullRule = {
            ...rule,
            type: RuleType.ON_CALL,
            validFrom: rule.validFrom || new Date(),
            validTo: rule.validTo || null
        };

        return this.createRule(fullRule as unknown as Omit<AnyRule, 'id' | 'createdAt' | 'updatedAt'>) as unknown as OnCallRule;
    }

    /**
     * Obtient le libellé d'un type de règle
     */
    public getRuleTypeLabel(type: RuleType): string {
        switch (type) {
            case RuleType.LEAVE:
                return 'Règle de congé';
            case RuleType.DUTY:
                return 'Règle de garde';
            case RuleType.SUPERVISION:
                return 'Règle de supervision';
            case RuleType.ASSIGNMENT:
                return 'Règle d\'assignation';
            case RuleType.ON_CALL:
                return 'Règle d\'astreinte';
            default:
                return 'Type inconnu';
        }
    }

    /**
     * Obtient le libellé de sévérité
     */
    public getRuleSeverityLabel(severity: RuleSeverity): string {
        switch (severity) {
            case RuleSeverity.LOW:
                return 'Faible';
            case RuleSeverity.MEDIUM:
                return 'Moyenne';
            case RuleSeverity.HIGH:
                return 'Élevée';
            default:
                return 'Inconnue';
        }
    }

    /**
     * Obtient la couleur CSS associée à une sévérité
     */
    public getRuleSeverityColor(severity: RuleSeverity): string {
        switch (severity) {
            case RuleSeverity.LOW:
                return 'bg-blue-100 text-blue-800';
            case RuleSeverity.MEDIUM:
                return 'bg-yellow-100 text-yellow-800';
            case RuleSeverity.HIGH:
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    /**
     * Obtient le libellé d'une priorité
     */
    public getRulePriorityLabel(priority: RulePriority): string {
        switch (priority) {
            case RulePriority.LOW:
                return 'Basse';
            case RulePriority.MEDIUM:
                return 'Moyenne';
            case RulePriority.HIGH:
                return 'Haute';
            case RulePriority.CRITICAL:
                return 'Critique';
            default:
                return 'Inconnue';
        }
    }

    /**
     * Obtient la couleur CSS associée à une priorité
     */
    public getRulePriorityColor(priority: RulePriority): string {
        switch (priority) {
            case RulePriority.LOW:
                return 'bg-blue-100 text-blue-800';
            case RulePriority.MEDIUM:
                return 'bg-yellow-100 text-yellow-800';
            case RulePriority.HIGH:
                return 'bg-orange-100 text-orange-800';
            case RulePriority.CRITICAL:
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    /**
     * Obtient le libellé d'une stratégie de rotation
     */
    public getRotationStrategyLabel(strategy: RotationStrategy): string {
        switch (strategy) {
            case RotationStrategy.ROUND_ROBIN:
                return 'Tour de rôle';
            case RotationStrategy.LEAST_RECENTLY_ASSIGNED:
                return 'Moins récemment assigné';
            case RotationStrategy.BALANCED_LOAD:
                return 'Charge équilibrée';
            default:
                return 'Inconnue';
        }
    }
}

// Exporter une instance par défaut pour faciliter l'utilisation
export const ruleService = new RuleService(); 