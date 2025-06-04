/**
 * Système de permissions granulaires pour l'application
 */

export enum Permission {
  // Permissions Bloc Opératoire
  BLOC_VIEW = 'bloc.view',
  BLOC_CREATE = 'bloc.create',
  BLOC_UPDATE = 'bloc.update',
  BLOC_DELETE = 'bloc.delete',
  BLOC_MANAGE_ALL = 'bloc.manage.all',

  // Permissions Planning
  PLANNING_VIEW_OWN = 'planning.view.own',
  PLANNING_VIEW_ALL = 'planning.view.all',
  PLANNING_CREATE = 'planning.create',
  PLANNING_UPDATE_OWN = 'planning.update.own',
  PLANNING_UPDATE_ALL = 'planning.update.all',
  PLANNING_DELETE = 'planning.delete',

  // Permissions Congés
  LEAVE_VIEW_OWN = 'leave.view.own',
  LEAVE_VIEW_ALL = 'leave.view.all',
  LEAVE_CREATE_OWN = 'leave.create.own',
  LEAVE_CREATE_ALL = 'leave.create.all',
  LEAVE_APPROVE = 'leave.approve',
  LEAVE_DELETE = 'leave.delete',

  // Permissions Utilisateurs
  USER_VIEW = 'user.view',
  USER_CREATE = 'user.create',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',
  USER_MANAGE_ROLES = 'user.manage.roles',

  // Permissions Règles
  RULES_VIEW = 'rules.view',
  RULES_CREATE = 'rules.create',
  RULES_UPDATE = 'rules.update',
  RULES_DELETE = 'rules.delete',

  // Permissions Rapports
  REPORTS_VIEW_OWN = 'reports.view.own',
  REPORTS_VIEW_ALL = 'reports.view.all',
  REPORTS_EXPORT = 'reports.export',

  // Permissions Système
  SYSTEM_AUDIT = 'system.audit',
  SYSTEM_CONFIG = 'system.config',
  SYSTEM_BACKUP = 'system.backup',
}

/**
 * Mapping des rôles vers les permissions
 */
export const rolePermissions: Record<string, Permission[]> = {
  ADMIN_TOTAL: [
    // Un ADMIN_TOTAL a toutes les permissions
    ...Object.values(Permission),
  ],

  ADMIN_PARTIEL: [
    // Bloc Opératoire
    Permission.BLOC_VIEW,
    Permission.BLOC_CREATE,
    Permission.BLOC_UPDATE,

    // Planning
    Permission.PLANNING_VIEW_ALL,
    Permission.PLANNING_CREATE,
    Permission.PLANNING_UPDATE_ALL,

    // Congés
    Permission.LEAVE_VIEW_ALL,
    Permission.LEAVE_CREATE_ALL,
    Permission.LEAVE_APPROVE,

    // Utilisateurs (lecture seule)
    Permission.USER_VIEW,

    // Règles (lecture seule)
    Permission.RULES_VIEW,

    // Rapports
    Permission.REPORTS_VIEW_ALL,
    Permission.REPORTS_EXPORT,
  ],

  USER: [
    // Planning personnel
    Permission.PLANNING_VIEW_OWN,
    Permission.PLANNING_UPDATE_OWN,

    // Congés personnels
    Permission.LEAVE_VIEW_OWN,
    Permission.LEAVE_CREATE_OWN,

    // Rapports personnels
    Permission.REPORTS_VIEW_OWN,

    // Vue limitée du bloc
    Permission.BLOC_VIEW,
  ],

  MAR: [
    // Mêmes permissions que USER de base
    Permission.PLANNING_VIEW_OWN,
    Permission.PLANNING_UPDATE_OWN,
    Permission.LEAVE_VIEW_OWN,
    Permission.LEAVE_CREATE_OWN,
    Permission.REPORTS_VIEW_OWN,
    Permission.BLOC_VIEW,

    // Permissions supplémentaires MAR
    Permission.PLANNING_VIEW_ALL, // Peut voir le planning de son équipe
  ],

  IADE: [
    // Mêmes permissions que USER
    Permission.PLANNING_VIEW_OWN,
    Permission.PLANNING_UPDATE_OWN,
    Permission.LEAVE_VIEW_OWN,
    Permission.LEAVE_CREATE_OWN,
    Permission.REPORTS_VIEW_OWN,
    Permission.BLOC_VIEW,
  ],
};

/**
 * Vérifie si un utilisateur a une permission spécifique
 */
export function hasPermission(userRole: string, permission: Permission): boolean {
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(permission);
}

/**
 * Vérifie si un utilisateur a au moins une des permissions requises
 */
export function hasAnyPermission(userRole: string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Vérifie si un utilisateur a toutes les permissions requises
 */
export function hasAllPermissions(userRole: string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Récupère toutes les permissions d'un rôle
 */
export function getRolePermissions(userRole: string): Permission[] {
  return rolePermissions[userRole] || [];
}

/**
 * Convertit une string en Permission enum si valide
 */
export function parsePermission(permission: string): Permission | null {
  return Object.values(Permission).find(p => p === permission) || null;
}
