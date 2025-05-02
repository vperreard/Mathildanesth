/**
 * Types et interfaces pour le module de règles dynamiques
 */

/**
 * Types de règles disponibles
 */
export enum RuleType {
    // Règles de planification
    PLANNING = 'PLANNING',                 // Règles générales de planification
    ALLOCATION = 'ALLOCATION',             // Règles d'allocation des ressources
    CONSTRAINT = 'CONSTRAINT',             // Contraintes à respecter

    // Règles de congés
    LEAVE_APPROVAL = 'LEAVE_APPROVAL',     // Règles d'approbation des congés
    QUOTA_MANAGEMENT = 'QUOTA_MANAGEMENT', // Règles de gestion des quotas

    // Règles de supervision
    SUPERVISION = 'SUPERVISION',           // Règles de supervision
    TRAINING = 'TRAINING',                 // Règles de formation

    // Règles spécifiques au bloc opératoire
    OPERATING_ROOM = 'OPERATING_ROOM',     // Règles spécifiques aux salles d'opération
    SECTOR_MANAGEMENT = 'SECTOR_MANAGEMENT', // Règles de gestion des secteurs

    // Autres types
    CUSTOM = 'CUSTOM',                     // Règles personnalisées
}

/**
 * Niveaux de priorité des règles
 */
export enum RulePriority {
    CRITICAL = 100,    // Règles critiques (jamais ignorées)
    HIGH = 75,         // Haute priorité
    MEDIUM = 50,       // Priorité moyenne
    LOW = 25,          // Basse priorité
    SUGGESTION = 0,    // Suggestion (peut être ignorée)
}

/**
 * Opérateurs de comparaison pour les conditions
 */
export enum ConditionOperator {
    EQUALS = 'EQUALS',
    NOT_EQUALS = 'NOT_EQUALS',
    GREATER_THAN = 'GREATER_THAN',
    LESS_THAN = 'LESS_THAN',
    GREATER_THAN_OR_EQUALS = 'GREATER_THAN_OR_EQUALS',
    LESS_THAN_OR_EQUALS = 'LESS_THAN_OR_EQUALS',
    CONTAINS = 'CONTAINS',
    NOT_CONTAINS = 'NOT_CONTAINS',
    STARTS_WITH = 'STARTS_WITH',
    ENDS_WITH = 'ENDS_WITH',
    IN = 'IN',
    NOT_IN = 'NOT_IN',
    BETWEEN = 'BETWEEN',
    IS_NULL = 'IS_NULL',
    IS_NOT_NULL = 'IS_NOT_NULL',
}

/**
 * Types d'actions possibles
 */
export enum ActionType {
    PREVENT = 'PREVENT',                 // Empêcher une action
    ALLOW = 'ALLOW',                     // Autoriser explicitement une action
    NOTIFY = 'NOTIFY',                   // Envoyer une notification
    MODIFY = 'MODIFY',                   // Modifier une valeur
    SUGGEST = 'SUGGEST',                 // Faire une suggestion
    LOG = 'LOG',                         // Journaliser
    ESCALATE = 'ESCALATE',               // Escalader à un niveau supérieur
    EXECUTE_FUNCTION = 'EXECUTE_FUNCTION', // Exécuter une fonction
}

/**
 * Interface pour une condition de règle
 */
export interface RuleCondition {
    id: string;
    field: string;            // Champ sur lequel porte la condition
    operator: ConditionOperator; // Opérateur de comparaison
    value: any;               // Valeur de comparaison
    valueType?: string;       // Type de la valeur (pour validation)
    description?: string;     // Description de la condition
    isCustomLogic?: boolean;  // Si true, utilise une fonction personnalisée
    customLogicFn?: string;   // Nom de la fonction de logique personnalisée
}

/**
 * Interface pour une action de règle
 */
export interface RuleAction {
    id: string;
    type: ActionType;         // Type d'action
    target?: string;          // Cible de l'action (champ, utilisateur, etc.)
    value?: any;              // Valeur pour l'action
    message?: string;         // Message associé à l'action
    severity?: string;        // Sévérité (pour les notifications)
    functionName?: string;    // Nom de la fonction à exécuter
    parameters?: Record<string, any>; // Paramètres pour la fonction
    description?: string;     // Description de l'action
}

/**
 * Interface pour un contexte d'évaluation de règle
 */
export interface RuleContext {
    [key: string]: any;       // Données contextuelles pour évaluer les règles
}

/**
 * Interface pour le résultat d'une évaluation de règle
 */
export interface RuleEvaluationResult {
    ruleId: string;
    ruleName: string;
    applied: boolean;         // La règle a-t-elle été appliquée
    actions: RuleAction[];    // Actions exécutées
    message?: string;         // Message explicatif
    timestamp: number;        // Timestamp de l'évaluation
    contextSnapshot?: any;    // Snapshot du contexte au moment de l'évaluation
}

/**
 * Interface principale pour une règle
 */
export interface Rule {
    id: string;
    name: string;
    description?: string;
    type: RuleType;                   // Type de règle
    priority: RulePriority;           // Priorité de la règle
    isActive: boolean;                // Si la règle est active
    conditions: RuleCondition[];      // Conditions d'application
    conditionLogic?: 'AND' | 'OR';    // Logique entre les conditions (défaut: AND)
    actions: RuleAction[];            // Actions à exécuter
    createdAt: Date;                  // Date de création
    updatedAt: Date;                  // Date de dernière mise à jour
    createdBy?: string;               // Créateur de la règle
    tags?: string[];                  // Tags pour catégorisation
    version?: number;                 // Version de la règle
    metadata?: Record<string, any>;   // Métadonnées additionnelles
    scope?: string[];                 // Portée d'application (départements, services...)
    expireAt?: Date;                  // Date d'expiration (optionnelle)
}

/**
 * Interface pour un conflit entre règles
 */
export interface RuleConflict {
    id: string;
    ruleIds: string[];                // IDs des règles en conflit
    conflictType: string;             // Type de conflit
    description: string;              // Description du conflit
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; // Sévérité du conflit
    detectedAt: Date;                 // Date de détection
    resolvedAt?: Date;                // Date de résolution (si résolu)
    resolutionStrategy?: string;      // Stratégie de résolution
    resolutionNotes?: string;         // Notes sur la résolution
}

/**
 * Opérateurs logiques pour combiner les conditions
 */
export enum LogicalOperator {
    AND = 'AND',
    OR = 'OR',
    XOR = 'XOR',
    NAND = 'NAND',
    NOR = 'NOR'
}

/**
 * Interface pour un groupe de conditions
 */
export interface ConditionGroup {
    id: string;
    name?: string;
    conditions: RuleCondition[];
    operator: LogicalOperator;
    parent?: string;                     // ID du groupe parent
}

/**
 * Interface pour les métadonnées d'une règle
 */
export interface RuleMetadata {
    createdBy: string;
    createdAt: Date;
    updatedBy?: string;
    updatedAt?: Date;
    version: number;
    category?: string[];
    tags?: string[];
    comments?: string;
    impact?: string;
    validFrom?: Date;
    validTo?: Date;
    isTestRule?: boolean;
    testResults?: any[];
}

/**
 * Interface pour une règle
 */
export interface Rule {
    id: string;
    name: string;
    description?: string;
    type: RuleType;
    priority: number;                    // Priorité de la règle (pour résoudre les conflits)
    enabled: boolean;
    conditions: RuleCondition[];
    conditionGroups?: ConditionGroup[];
    actions: RuleAction[];
    metadata?: RuleMetadata;
    isSystem?: boolean;                  // Règle système (non modifiable)
    contexts?: string[];                 // Contextes dans lesquels la règle s'applique
    exceptions?: Rule[];                 // Règles d'exception à celle-ci
    conflictResolution?: string;         // Stratégie de résolution de conflit
}

/**
 * Options de configuration du moteur de règles
 */
export interface RuleEngineOptions {
    enableCaching?: boolean;
    cacheSize?: number;
    evaluationTimeoutMs?: number;
    maxIterations?: number;
    traceExecution?: boolean;
    strictMode?: boolean;
    fallbackPolicy?: 'ALLOW' | 'DENY' | 'ASK';
} 