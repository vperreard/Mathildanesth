import {
    Rule,
    RuleCondition,
    RuleAction,
    RuleConflict,
    ComparisonOperator,
    LogicalOperator,
    ActionType,
    RuleType
} from '../types/rule';
import { EventBusService } from '@/services/eventBusService';
import { AuditService } from '@/services/AuditService';

/**
 * Types de conflits entre règles
 */
export enum ConflictType {
    DIRECT = 'DIRECT',                   // Actions directement contradictoires
    CONDITION_OVERLAP = 'CONDITION_OVERLAP', // Chevauchement de conditions
    PRIORITY_CONFLICT = 'PRIORITY_CONFLICT', // Conflit de priorité
    ACTION_OVERLAP = 'ACTION_OVERLAP',    // Chevauchement d'actions
    REDUNDANT = 'REDUNDANT',             // Règle redondante
    SEMANTIC = 'SEMANTIC'                // Conflit sémantique
}

/**
 * Niveaux de sévérité des conflits
 */
export enum ConflictSeverity {
    LOW = 'LOW',           // Information, conflit mineur
    MEDIUM = 'MEDIUM',     // Avertissement, conflit potentiel
    HIGH = 'HIGH',         // Erreur, conflit important
    CRITICAL = 'CRITICAL'  // Critique, conflit bloquant
}

/**
 * Service de détection des conflits entre règles
 * Ce service analyse les règles pour détecter les conflits potentiels
 */
export class RuleConflictDetectionService {
    private static instance: RuleConflictDetectionService;
    private eventBus: EventBusService;
    private auditService: AuditService;
    private cache: Map<string, RuleConflict[]> = new Map();

    private constructor() {
        this.eventBus = EventBusService.getInstance();
        this.auditService = AuditService.getInstance();
    }

    /**
     * Obtient l'instance singleton du service
     */
    public static getInstance(): RuleConflictDetectionService {
        if (!RuleConflictDetectionService.instance) {
            RuleConflictDetectionService.instance = new RuleConflictDetectionService();
        }
        return RuleConflictDetectionService.instance;
    }

    /**
     * Détecte tous les conflits entre les règles fournies
     * @param rules Règles à analyser
     * @returns Liste des conflits détectés
     */
    public detectConflicts(rules: Rule[]): RuleConflict[] {
        const conflicts: RuleConflict[] = [];
        const cacheKey = this.generateCacheKey(rules);

        // Vérifier le cache
        const cachedConflicts = this.cache.get(cacheKey);
        if (cachedConflicts) {
            return cachedConflicts;
        }

        // Pour chaque paire de règles, détecter les conflits
        for (let i = 0; i < rules.length; i++) {
            for (let j = i + 1; j < rules.length; j++) {
                const rule1 = rules[i];
                const rule2 = rules[j];

                // Ne comparer que les règles activées
                if (!rule1.enabled || !rule2.enabled) {
                    continue;
                }

                const ruleConflicts = this.detectConflictsBetweenRules(rule1, rule2);
                conflicts.push(...ruleConflicts);
            }
        }

        // Mettre en cache les résultats
        this.cache.set(cacheKey, conflicts);

        // Émettre un événement pour les conflits détectés
        if (conflicts.length > 0) {
            this.eventBus.emit({
                type: 'rule.conflicts.detected',
                data: { conflicts }
            });

            // Journaliser les conflits critiques
            const criticalConflicts = conflicts.filter(
                c => c.severity === ConflictSeverity.CRITICAL || c.severity === ConflictSeverity.HIGH
            );

            if (criticalConflicts.length > 0) {
                this.auditService.createAuditEntry({
                    actionType: 'RULE_CONFLICT_DETECTED',
                    userId: 'system',
                    targetId: 'rules',
                    targetType: 'rule',
                    description: `${criticalConflicts.length} conflits critiques détectés entre les règles`,
                    severity: 'HIGH',
                    metadata: {
                        conflictCount: conflicts.length,
                        criticalCount: criticalConflicts.length,
                        ruleCount: rules.length
                    }
                });
            }
        }

        return conflicts;
    }

    /**
     * Détecte les conflits entre une règle et une liste de règles existantes
     * @param rule Règle à analyser
     * @param existingRules Règles existantes
     * @returns Liste des conflits détectés
     */
    public detectConflictsWithRule(rule: Rule, existingRules: Rule[]): RuleConflict[] {
        const conflicts: RuleConflict[] = [];

        // Pour chaque règle existante, détecter les conflits avec la nouvelle règle
        for (const existingRule of existingRules) {
            // Ne comparer que les règles activées
            if (!rule.enabled || !existingRule.enabled) {
                continue;
            }

            const ruleConflicts = this.detectConflictsBetweenRules(rule, existingRule);
            conflicts.push(...ruleConflicts);
        }

        return conflicts;
    }

    /**
     * Détecte les conflits entre deux règles spécifiques
     * @param rule1 Première règle
     * @param rule2 Deuxième règle
     * @returns Liste des conflits détectés
     */
    public detectConflictsBetweenRules(rule1: Rule, rule2: Rule): RuleConflict[] {
        const conflicts: RuleConflict[] = [];

        // Ne pas comparer une règle avec elle-même
        if (rule1.id === rule2.id) {
            return conflicts;
        }

        // Vérifier les conflits directs (actions contradictoires)
        const directConflicts = this.detectDirectConflicts(rule1, rule2);
        conflicts.push(...directConflicts);

        // Vérifier les chevauchements de conditions
        const conditionOverlaps = this.detectConditionOverlaps(rule1, rule2);
        if (conditionOverlaps) {
            // Vérifier les conflits de priorité
            const priorityConflicts = this.detectPriorityConflicts(rule1, rule2);
            conflicts.push(...priorityConflicts);

            // Vérifier les chevauchements d'actions
            const actionOverlaps = this.detectActionOverlaps(rule1, rule2);
            conflicts.push(...actionOverlaps);
        }

        // Vérifier les règles redondantes
        const redundancies = this.detectRedundancies(rule1, rule2);
        conflicts.push(...redundancies);

        // Vérifier les conflits sémantiques spécifiques au domaine
        const semanticConflicts = this.detectSemanticConflicts(rule1, rule2);
        conflicts.push(...semanticConflicts);

        return conflicts;
    }

    /**
     * Détecte les conflits directs entre deux règles (actions contradictoires)
     */
    private detectDirectConflicts(rule1: Rule, rule2: Rule): RuleConflict[] {
        const conflicts: RuleConflict[] = [];

        // Vérifier seulement les règles du même type ou qui s'appliquent au même contexte
        if (rule1.type !== rule2.type && !this.haveOverlappingContexts(rule1, rule2)) {
            return conflicts;
        }

        // Vérifier si les conditions des règles se chevauchent
        if (!this.haveOverlappingConditions(rule1, rule2)) {
            return conflicts;
        }

        // Chercher des actions contradictoires
        const contradictions = this.findContradictoryActions(rule1, rule2);

        if (contradictions.length > 0) {
            // Créer un conflit pour chaque contradiction trouvée
            for (const contradiction of contradictions) {
                conflicts.push({
                    id: this.generateConflictId(),
                    ruleIds: [rule1.id, rule2.id],
                    conflictType: ConflictType.DIRECT,
                    description: `Actions contradictoires: ${contradiction.description}`,
                    severity: ConflictSeverity.HIGH,
                    detectedAt: new Date()
                });
            }
        }

        return conflicts;
    }

    /**
     * Trouve les actions contradictoires entre deux règles
     */
    private findContradictoryActions(rule1: Rule, rule2: Rule): Array<{ description: string }> {
        const contradictions: Array<{ description: string }> = [];

        // Vérifier les paires d'actions qui pourraient être contradictoires
        for (const action1 of rule1.actions) {
            for (const action2 of rule2.actions) {
                // Actions ALLOW et PREVENT sur la même cible
                if (
                    (action1.type === ActionType.ALLOW && action2.type === ActionType.PREVENT ||
                        action1.type === ActionType.PREVENT && action2.type === ActionType.ALLOW) &&
                    action1.target === action2.target
                ) {
                    contradictions.push({
                        description: `La règle "${rule1.name}" ${action1.type === ActionType.ALLOW ? 'autorise' : 'interdit'} alors que la règle "${rule2.name}" ${action2.type === ActionType.ALLOW ? 'autorise' : 'interdit'} pour la cible "${action1.target}"`
                    });
                }

                // Actions MODIFY qui modifient la même cible avec des valeurs différentes
                if (
                    action1.type === ActionType.MODIFY &&
                    action2.type === ActionType.MODIFY &&
                    action1.target === action2.target &&
                    action1.parameters?.value !== action2.parameters?.value
                ) {
                    contradictions.push({
                        description: `Les règles "${rule1.name}" et "${rule2.name}" modifient la cible "${action1.target}" avec des valeurs différentes`
                    });
                }
            }
        }

        return contradictions;
    }

    /**
     * Détecte les chevauchements de conditions entre deux règles
     */
    private detectConditionOverlaps(rule1: Rule, rule2: Rule): boolean {
        // Si une des règles a des groupes de conditions, l'analyse est plus complexe
        if (
            (rule1.conditionGroups && rule1.conditionGroups.length > 0) ||
            (rule2.conditionGroups && rule2.conditionGroups.length > 0)
        ) {
            // Pour simplifier, on considère qu'il y a un chevauchement possible
            // Une analyse plus précise nécessiterait une logique plus complexe
            return true;
        }

        // Analyse simple: vérifier si les conditions peuvent se chevaucher
        return this.haveOverlappingConditions(rule1, rule2);
    }

    /**
     * Vérifie si deux règles ont des conditions qui peuvent se chevaucher
     */
    private haveOverlappingConditions(rule1: Rule, rule2: Rule): boolean {
        // Obtenir tous les champs de condition de chaque règle
        const fields1 = new Set(rule1.conditions.map(c => c.field));
        const fields2 = new Set(rule2.conditions.map(c => c.field));

        // S'il y a des champs communs, vérifier s'ils peuvent se chevaucher
        for (const field of fields1) {
            if (fields2.has(field)) {
                // Trouver toutes les conditions pour ce champ dans chaque règle
                const conditions1 = rule1.conditions.filter(c => c.field === field);
                const conditions2 = rule2.conditions.filter(c => c.field === field);

                // Vérifier si des conditions sur ce champ peuvent se chevaucher
                if (this.conditionsCanOverlap(conditions1, conditions2)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Vérifie si des ensembles de conditions sur un même champ peuvent se chevaucher
     */
    private conditionsCanOverlap(
        conditions1: RuleCondition[],
        conditions2: RuleCondition[]
    ): boolean {
        // Analyse simplifiée: on considère que les conditions peuvent se chevaucher
        // à moins qu'on puisse prouver le contraire

        // Cas simple: si un des ensembles est vide, pas de chevauchement
        if (conditions1.length === 0 || conditions2.length === 0) {
            return false;
        }

        // Vérifier s'il y a des conditions contradictoires qui prouvent qu'il n'y a pas de chevauchement
        for (const cond1 of conditions1) {
            for (const cond2 of conditions2) {
                if (this.areConditionsContradictory(cond1, cond2)) {
                    return false;
                }
            }
        }

        // Par défaut, on considère qu'il peut y avoir un chevauchement
        return true;
    }

    /**
     * Vérifie si deux conditions sont contradictoires (ne peuvent pas être vraies en même temps)
     */
    private areConditionsContradictory(cond1: RuleCondition, cond2: RuleCondition): boolean {
        // Vérifier seulement les conditions sur le même champ
        if (cond1.field !== cond2.field) {
            return false;
        }

        // Cas simples de contradiction
        if (
            (cond1.operator === ComparisonOperator.EQUALS && cond2.operator === ComparisonOperator.NOT_EQUALS && cond1.value === cond2.value) ||
            (cond1.operator === ComparisonOperator.NOT_EQUALS && cond2.operator === ComparisonOperator.EQUALS && cond1.value === cond2.value)
        ) {
            return true;
        }

        // Contradictions numériques
        if (
            (cond1.operator === ComparisonOperator.GREATER_THAN && cond2.operator === ComparisonOperator.LESS_THAN_OR_EQUALS && cond1.value >= cond2.value) ||
            (cond1.operator === ComparisonOperator.LESS_THAN_OR_EQUALS && cond2.operator === ComparisonOperator.GREATER_THAN && cond2.value >= cond1.value) ||
            (cond1.operator === ComparisonOperator.LESS_THAN && cond2.operator === ComparisonOperator.GREATER_THAN_OR_EQUALS && cond1.value <= cond2.value) ||
            (cond1.operator === ComparisonOperator.GREATER_THAN_OR_EQUALS && cond2.operator === ComparisonOperator.LESS_THAN && cond2.value <= cond1.value)
        ) {
            return true;
        }

        // Par défaut, on ne peut pas prouver que les conditions sont contradictoires
        return false;
    }

    /**
     * Détecte les conflits de priorité entre deux règles
     */
    private detectPriorityConflicts(rule1: Rule, rule2: Rule): RuleConflict[] {
        const conflicts: RuleConflict[] = [];

        // Vérifier seulement pour les règles du même type avec des conditions qui se chevauchent
        if (rule1.type !== rule2.type || !this.haveOverlappingConditions(rule1, rule2)) {
            return conflicts;
        }

        // Vérifier si les règles ont des actions similaires mais des priorités différentes
        if (this.haveOverlappingActions(rule1, rule2) && rule1.priority !== rule2.priority) {
            conflicts.push({
                id: this.generateConflictId(),
                ruleIds: [rule1.id, rule2.id],
                conflictType: ConflictType.PRIORITY_CONFLICT,
                description: `Les règles "${rule1.name}" (priorité ${rule1.priority}) et "${rule2.name}" (priorité ${rule2.priority}) ont des actions similaires mais des priorités différentes`,
                severity: ConflictSeverity.MEDIUM,
                detectedAt: new Date()
            });
        }

        return conflicts;
    }

    /**
     * Détecte les chevauchements d'actions entre deux règles
     */
    private detectActionOverlaps(rule1: Rule, rule2: Rule): RuleConflict[] {
        const conflicts: RuleConflict[] = [];

        // Vérifier seulement pour les règles avec des conditions qui se chevauchent
        if (!this.haveOverlappingConditions(rule1, rule2)) {
            return conflicts;
        }

        // Vérifier les chevauchements d'actions sur les mêmes cibles
        const overlappingActions = this.findOverlappingActions(rule1, rule2);

        if (overlappingActions.length > 0) {
            conflicts.push({
                id: this.generateConflictId(),
                ruleIds: [rule1.id, rule2.id],
                conflictType: ConflictType.ACTION_OVERLAP,
                description: `Les règles "${rule1.name}" et "${rule2.name}" ont des actions qui se chevauchent: ${overlappingActions.map(o => o.description).join(', ')}`,
                severity: ConflictSeverity.LOW,
                detectedAt: new Date()
            });
        }

        return conflicts;
    }

    /**
     * Trouve les actions qui se chevauchent entre deux règles
     */
    private findOverlappingActions(rule1: Rule, rule2: Rule): Array<{ description: string }> {
        const overlaps: Array<{ description: string }> = [];

        // Vérifier les paires d'actions qui pourraient se chevaucher
        for (const action1 of rule1.actions) {
            for (const action2 of rule2.actions) {
                // Actions du même type sur la même cible
                if (action1.type === action2.type && action1.target === action2.target) {
                    overlaps.push({
                        description: `Action ${action1.type} sur la cible "${action1.target}"`
                    });
                }
            }
        }

        return overlaps;
    }

    /**
     * Vérifie si deux règles ont des actions qui peuvent se chevaucher
     */
    private haveOverlappingActions(rule1: Rule, rule2: Rule): boolean {
        // Obtenir tous les types d'actions de chaque règle
        const actionTypes1 = new Set(rule1.actions.map(a => a.type));
        const actionTypes2 = new Set(rule2.actions.map(a => a.type));

        // Vérifier s'il y a des types d'actions communs
        for (const type of actionTypes1) {
            if (actionTypes2.has(type)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Détecte les règles redondantes
     */
    private detectRedundancies(rule1: Rule, rule2: Rule): RuleConflict[] {
        const conflicts: RuleConflict[] = [];

        // Vérifier seulement pour les règles du même type
        if (rule1.type !== rule2.type) {
            return conflicts;
        }

        // Une règle peut être redondante si ses conditions sont un sous-ensemble
        // d'une autre règle et que les actions sont les mêmes
        let redundantRule: Rule | null = null;
        let supersetRule: Rule | null = null;

        if (this.areConditionsSubset(rule1, rule2)) {
            redundantRule = rule1;
            supersetRule = rule2;
        } else if (this.areConditionsSubset(rule2, rule1)) {
            redundantRule = rule2;
            supersetRule = rule1;
        }

        if (redundantRule && supersetRule && this.areActionsEquivalent(redundantRule, supersetRule)) {
            conflicts.push({
                id: this.generateConflictId(),
                ruleIds: [rule1.id, rule2.id],
                conflictType: ConflictType.REDUNDANT,
                description: `La règle "${redundantRule.name}" est potentiellement redondante avec "${supersetRule.name}"`,
                severity: ConflictSeverity.LOW,
                detectedAt: new Date()
            });
        }

        return conflicts;
    }

    /**
     * Vérifie si les conditions d'une règle sont un sous-ensemble des conditions d'une autre
     */
    private areConditionsSubset(potential: Rule, superset: Rule): boolean {
        // Analyse simplifiée: vérifier si tous les champs de condition dans potential
        // sont présents dans superset et avec des valeurs qui forment un sous-ensemble

        // Si potential a plus de conditions que superset, ce n'est pas un sous-ensemble
        if (potential.conditions.length > superset.conditions.length) {
            return false;
        }

        // Pour chaque condition dans potential, chercher une condition correspondante dans superset
        for (const potCond of potential.conditions) {
            const matchingConds = superset.conditions.filter(c => c.field === potCond.field);

            // Si aucune condition correspondante n'est trouvée, ce n'est pas un sous-ensemble
            if (matchingConds.length === 0) {
                return false;
            }

            // Vérifier si au moins une des conditions correspondantes forme un sur-ensemble
            if (!matchingConds.some(superCond => this.isConditionSubset(potCond, superCond))) {
                return false;
            }
        }

        return true;
    }

    /**
     * Vérifie si une condition est un sous-ensemble d'une autre
     */
    private isConditionSubset(potential: RuleCondition, superset: RuleCondition): boolean {
        // Simplification: on considère comme sous-ensemble seulement les conditions identiques
        // Une analyse plus précise nécessiterait une logique spécifique à chaque opérateur
        return (
            potential.field === superset.field &&
            potential.operator === superset.operator &&
            JSON.stringify(potential.value) === JSON.stringify(superset.value)
        );
    }

    /**
     * Vérifie si les actions de deux règles sont équivalentes
     */
    private areActionsEquivalent(rule1: Rule, rule2: Rule): boolean {
        // Si le nombre d'actions est différent, elles ne sont pas équivalentes
        if (rule1.actions.length !== rule2.actions.length) {
            return false;
        }

        // Pour chaque action dans rule1, chercher une action équivalente dans rule2
        for (const action1 of rule1.actions) {
            if (!rule2.actions.some(action2 => this.isActionEquivalent(action1, action2))) {
                return false;
            }
        }

        return true;
    }

    /**
     * Vérifie si deux actions sont équivalentes
     */
    private isActionEquivalent(action1: RuleAction, action2: RuleAction): boolean {
        // Vérifier le type et la cible
        if (action1.type !== action2.type || action1.target !== action2.target) {
            return false;
        }

        // Pour les actions qui modifient des valeurs, vérifier aussi les paramètres
        if (action1.type === ActionType.MODIFY) {
            return JSON.stringify(action1.parameters) === JSON.stringify(action2.parameters);
        }

        return true;
    }

    /**
     * Détecte les conflits sémantiques spécifiques au domaine
     */
    private detectSemanticConflicts(rule1: Rule, rule2: Rule): RuleConflict[] {
        const conflicts: RuleConflict[] = [];

        // Conflits spécifiques au type de règle
        switch (rule1.type) {
            case RuleType.LEAVE_APPROVAL:
                if (rule2.type === RuleType.LEAVE_APPROVAL) {
                    conflicts.push(...this.detectLeaveApprovalConflicts(rule1, rule2));
                }
                break;
            case RuleType.SUPERVISION:
                if (rule2.type === RuleType.SUPERVISION) {
                    conflicts.push(...this.detectSupervisionConflicts(rule1, rule2));
                }
                break;
            case RuleType.OPERATING_ROOM:
                if (rule2.type === RuleType.OPERATING_ROOM) {
                    conflicts.push(...this.detectOperatingRoomConflicts(rule1, rule2));
                }
                break;
        }

        return conflicts;
    }

    /**
     * Détecte les conflits spécifiques aux règles d'approbation de congés
     */
    private detectLeaveApprovalConflicts(rule1: Rule, rule2: Rule): RuleConflict[] {
        const conflicts: RuleConflict[] = [];

        // Vérifier si les règles s'appliquent à des périodes qui se chevauchent
        if (this.haveDateOverlap(rule1, rule2)) {
            conflicts.push({
                id: this.generateConflictId(),
                ruleIds: [rule1.id, rule2.id],
                conflictType: ConflictType.SEMANTIC,
                description: `Les règles d'approbation de congés "${rule1.name}" et "${rule2.name}" s'appliquent à des périodes qui se chevauchent`,
                severity: ConflictSeverity.MEDIUM,
                detectedAt: new Date()
            });
        }

        return conflicts;
    }

    /**
     * Détecte les conflits spécifiques aux règles de supervision
     */
    private detectSupervisionConflicts(rule1: Rule, rule2: Rule): RuleConflict[] {
        const conflicts: RuleConflict[] = [];

        // Vérifier si les règles s'appliquent aux mêmes rôles professionnels
        if (this.haveRoleOverlap(rule1, rule2)) {
            conflicts.push({
                id: this.generateConflictId(),
                ruleIds: [rule1.id, rule2.id],
                conflictType: ConflictType.SEMANTIC,
                description: `Les règles de supervision "${rule1.name}" et "${rule2.name}" s'appliquent aux mêmes rôles professionnels`,
                severity: ConflictSeverity.MEDIUM,
                detectedAt: new Date()
            });
        }

        return conflicts;
    }

    /**
     * Détecte les conflits spécifiques aux règles de salle d'opération
     */
    private detectOperatingRoomConflicts(rule1: Rule, rule2: Rule): RuleConflict[] {
        const conflicts: RuleConflict[] = [];

        // Vérifier si les règles s'appliquent aux mêmes salles d'opération
        if (this.haveRoomOverlap(rule1, rule2)) {
            conflicts.push({
                id: this.generateConflictId(),
                ruleIds: [rule1.id, rule2.id],
                conflictType: ConflictType.SEMANTIC,
                description: `Les règles de salle d'opération "${rule1.name}" et "${rule2.name}" s'appliquent aux mêmes salles`,
                severity: ConflictSeverity.MEDIUM,
                detectedAt: new Date()
            });
        }

        return conflicts;
    }

    /**
     * Vérifie si deux règles ont un chevauchement de dates
     */
    private haveDateOverlap(rule1: Rule, rule2: Rule): boolean {
        // Vérifier les conditions de date dans les règles
        const dateConditions1 = rule1.conditions.filter(c =>
            c.field === 'date' || c.field === 'startDate' || c.field === 'endDate'
        );
        const dateConditions2 = rule2.conditions.filter(c =>
            c.field === 'date' || c.field === 'startDate' || c.field === 'endDate'
        );

        // Si une des règles n'a pas de condition de date, on considère qu'il peut y avoir chevauchement
        if (dateConditions1.length === 0 || dateConditions2.length === 0) {
            return true;
        }

        // Simplification: on considère qu'il peut y avoir chevauchement
        // Une analyse plus précise nécessiterait de calculer les plages de dates effectives
        return true;
    }

    /**
     * Vérifie si deux règles ont un chevauchement de rôles professionnels
     */
    private haveRoleOverlap(rule1: Rule, rule2: Rule): boolean {
        // Vérifier les conditions de rôle dans les règles
        const roleConditions1 = rule1.conditions.filter(c =>
            c.field === 'role' || c.field === 'professionalRole'
        );
        const roleConditions2 = rule2.conditions.filter(c =>
            c.field === 'role' || c.field === 'professionalRole'
        );

        // Si une des règles n'a pas de condition de rôle, on considère qu'il peut y avoir chevauchement
        if (roleConditions1.length === 0 || roleConditions2.length === 0) {
            return true;
        }

        // Vérifier si les rôles se chevauchent
        for (const cond1 of roleConditions1) {
            for (const cond2 of roleConditions2) {
                // Si les deux conditions utilisent l'opérateur EQUALS ou IN, vérifier les valeurs
                if (
                    (cond1.operator === ComparisonOperator.EQUALS && cond2.operator === ComparisonOperator.EQUALS) &&
                    cond1.value === cond2.value
                ) {
                    return true;
                }

                // Si l'opérateur est IN, vérifier l'intersection des tableaux
                if (
                    (cond1.operator === ComparisonOperator.IN && cond2.operator === ComparisonOperator.IN) &&
                    this.arraysIntersect(cond1.value as any[], cond2.value as any[])
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Vérifie si deux règles ont un chevauchement de salles d'opération
     */
    private haveRoomOverlap(rule1: Rule, rule2: Rule): boolean {
        // Vérifier les conditions de salle dans les règles
        const roomConditions1 = rule1.conditions.filter(c =>
            c.field === 'room' || c.field === 'roomId' || c.field === 'operatingRoom'
        );
        const roomConditions2 = rule2.conditions.filter(c =>
            c.field === 'room' || c.field === 'roomId' || c.field === 'operatingRoom'
        );

        // Si une des règles n'a pas de condition de salle, on considère qu'il peut y avoir chevauchement
        if (roomConditions1.length === 0 || roomConditions2.length === 0) {
            return true;
        }

        // Vérifier si les salles se chevauchent (même logique que pour les rôles)
        for (const cond1 of roomConditions1) {
            for (const cond2 of roomConditions2) {
                if (
                    (cond1.operator === ComparisonOperator.EQUALS && cond2.operator === ComparisonOperator.EQUALS) &&
                    cond1.value === cond2.value
                ) {
                    return true;
                }

                if (
                    (cond1.operator === ComparisonOperator.IN && cond2.operator === ComparisonOperator.IN) &&
                    this.arraysIntersect(cond1.value as any[], cond2.value as any[])
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Vérifie si deux règles ont des contextes qui se chevauchent
     */
    private haveOverlappingContexts(rule1: Rule, rule2: Rule): boolean {
        // Si une des règles n'a pas de contextes spécifiés, on considère qu'il peut y avoir chevauchement
        if (!rule1.contexts || !rule2.contexts || rule1.contexts.length === 0 || rule2.contexts.length === 0) {
            return true;
        }

        // Vérifier l'intersection des contextes
        return this.arraysIntersect(rule1.contexts, rule2.contexts);
    }

    /**
     * Vérifie si deux tableaux ont une intersection non vide
     */
    private arraysIntersect<T>(arr1: T[], arr2: T[]): boolean {
        return arr1.some(item => arr2.includes(item));
    }

    /**
     * Génère une clé de cache pour un ensemble de règles
     */
    private generateCacheKey(rules: Rule[]): string {
        // Trier les règles par ID pour garantir la cohérence de la clé
        const ruleIds = rules.map(rule => rule.id).sort();
        return `conflicts-${ruleIds.join('-')}`;
    }

    /**
     * Génère un identifiant unique pour un conflit
     */
    private generateConflictId(): string {
        return `conflict-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Vide le cache
     */
    public clearCache(): void {
        this.cache.clear();
    }

    /**
     * Supprime une entrée spécifique du cache
     */
    public removeCacheEntry(cacheKey: string): void {
        this.cache.delete(cacheKey);
    }
}

// Exporter l'instance singleton
export const ruleConflictDetectionService = RuleConflictDetectionService.getInstance(); 