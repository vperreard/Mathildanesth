import { Role } from '@prisma/client';
import { AuthContext } from '@/middleware/authorization';

/**
 * Permissions pour le module de règles dynamiques
 */
export const RULES_PERMISSIONS = {
    // Permissions de lecture
    VIEW_RULES: 'rules.view',
    VIEW_TEMPLATES: 'rules.templates.view',
    VIEW_METRICS: 'rules.metrics.view',
    
    // Permissions de création/modification
    CREATE_RULES: 'rules.create',
    EDIT_RULES: 'rules.edit',
    DELETE_RULES: 'rules.delete',
    ACTIVATE_RULES: 'rules.activate',
    
    // Permissions avancées
    CREATE_TEMPLATES: 'rules.templates.create',
    EDIT_TEMPLATES: 'rules.templates.edit',
    DELETE_TEMPLATES: 'rules.templates.delete',
    
    // Permissions de simulation et test
    SIMULATE_RULES: 'rules.simulate',
    TEST_RULES: 'rules.test',
    
    // Permissions d'administration
    MANAGE_SYSTEM_RULES: 'rules.system.manage',
    VIEW_ALL_METRICS: 'rules.metrics.all',
    EXPORT_RULES: 'rules.export',
    IMPORT_RULES: 'rules.import'
} as const;

/**
 * Rôles autorisés par permission
 */
export const RULES_ROLE_PERMISSIONS: Record<Role, string[]> = {
    ADMIN_TOTAL: [
        // Accès total à toutes les permissions
        ...Object.values(RULES_PERMISSIONS)
    ],
    
    ADMIN_PARTIEL: [
        // Accès en lecture et gestion des règles non-système
        RULES_PERMISSIONS.VIEW_RULES,
        RULES_PERMISSIONS.VIEW_TEMPLATES,
        RULES_PERMISSIONS.VIEW_METRICS,
        RULES_PERMISSIONS.CREATE_RULES,
        RULES_PERMISSIONS.EDIT_RULES,
        RULES_PERMISSIONS.DELETE_RULES,
        RULES_PERMISSIONS.ACTIVATE_RULES,
        RULES_PERMISSIONS.SIMULATE_RULES,
        RULES_PERMISSIONS.TEST_RULES
    ],
    
    MEDECIN: [
        // Accès en lecture seule
        RULES_PERMISSIONS.VIEW_RULES,
        RULES_PERMISSIONS.VIEW_TEMPLATES
    ],
    
    USER: [
        // Pas d'accès au module de règles
    ],
    
    GUEST: [
        // Pas d'accès au module de règles
    ]
};

/**
 * Vérifie si un utilisateur a une permission spécifique pour les règles
 */
export function hasRulePermission(
    context: AuthContext,
    permission: string
): boolean {
    const rolePermissions = RULES_ROLE_PERMISSIONS[context.role] || [];
    return rolePermissions.includes(permission);
}

/**
 * Vérifie si un utilisateur peut voir les règles
 */
export function canViewRules(context: AuthContext): boolean {
    return hasRulePermission(context, RULES_PERMISSIONS.VIEW_RULES);
}

/**
 * Vérifie si un utilisateur peut créer des règles
 */
export function canCreateRules(context: AuthContext): boolean {
    return hasRulePermission(context, RULES_PERMISSIONS.CREATE_RULES);
}

/**
 * Vérifie si un utilisateur peut éditer des règles
 */
export function canEditRules(context: AuthContext): boolean {
    return hasRulePermission(context, RULES_PERMISSIONS.EDIT_RULES);
}

/**
 * Vérifie si un utilisateur peut supprimer des règles
 */
export function canDeleteRules(context: AuthContext): boolean {
    return hasRulePermission(context, RULES_PERMISSIONS.DELETE_RULES);
}

/**
 * Vérifie si un utilisateur peut gérer les règles système
 */
export function canManageSystemRules(context: AuthContext): boolean {
    return hasRulePermission(context, RULES_PERMISSIONS.MANAGE_SYSTEM_RULES);
}

/**
 * Vérifie si un utilisateur peut voir toutes les métriques
 */
export function canViewAllMetrics(context: AuthContext): boolean {
    return hasRulePermission(context, RULES_PERMISSIONS.VIEW_ALL_METRICS);
}

/**
 * Vérifie si un utilisateur peut simuler des règles
 */
export function canSimulateRules(context: AuthContext): boolean {
    return hasRulePermission(context, RULES_PERMISSIONS.SIMULATE_RULES);
}

/**
 * Middleware de vérification des permissions pour les règles
 */
export function requireRulePermission(permission: string) {
    return async (context: AuthContext): Promise<boolean> => {
        return hasRulePermission(context, permission);
    };
}

/**
 * Filtre les règles en fonction des permissions de l'utilisateur
 */
export function filterRulesForUser(
    rules: unknown[],
    context: AuthContext
): unknown[] {
    // Admin total voit tout
    if (context.role === 'ADMIN_TOTAL') {
        return rules;
    }
    
    // Admin partiel ne voit pas les règles système
    if (context.role === 'ADMIN_PARTIEL') {
        return rules.filter(rule => 
            !rule.metadata?.isDefault && 
            rule.createdBy !== 'system'
        );
    }
    
    // Médecin ne voit que les règles actives non-sensibles
    if (context.role === 'MEDECIN') {
        return rules.filter(rule => 
            rule.status === 'active' &&
            !rule.metadata?.isSensitive
        );
    }
    
    // Autres rôles n'ont pas accès
    return [];
}

/**
 * Filtre les actions disponibles en fonction des permissions
 */
export function getAvailableActionsForUser(
    context: AuthContext
): string[] {
    const actions: string[] = [];
    
    if (canViewRules(context)) actions.push('view');
    if (canCreateRules(context)) actions.push('create');
    if (canEditRules(context)) actions.push('edit');
    if (canDeleteRules(context)) actions.push('delete');
    if (canSimulateRules(context)) actions.push('simulate');
    
    return actions;
}