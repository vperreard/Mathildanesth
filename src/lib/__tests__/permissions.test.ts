import {
  Permission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  parsePermission,
} from '../permissions';

describe('Permissions System', () => {
  describe('hasPermission', () => {
    it('should return true for ADMIN_TOTAL with any permission', () => {
      expect(hasPermission('ADMIN_TOTAL', Permission.BLOC_DELETE)).toBe(true);
      expect(hasPermission('ADMIN_TOTAL', Permission.SYSTEM_BACKUP)).toBe(true);
      expect(hasPermission('ADMIN_TOTAL', Permission.USER_DELETE)).toBe(true);
    });

    it('should return true for ADMIN_PARTIEL with allowed permissions', () => {
      expect(hasPermission('ADMIN_PARTIEL', Permission.BLOC_VIEW)).toBe(true);
      expect(hasPermission('ADMIN_PARTIEL', Permission.PLANNING_CREATE)).toBe(true);
      expect(hasPermission('ADMIN_PARTIEL', Permission.LEAVE_APPROVE)).toBe(true);
    });

    it('should return false for ADMIN_PARTIEL with restricted permissions', () => {
      expect(hasPermission('ADMIN_PARTIEL', Permission.BLOC_DELETE)).toBe(false);
      expect(hasPermission('ADMIN_PARTIEL', Permission.SYSTEM_BACKUP)).toBe(false);
      expect(hasPermission('ADMIN_PARTIEL', Permission.USER_DELETE)).toBe(false);
    });

    it('should return true for USER with own permissions', () => {
      expect(hasPermission('USER', Permission.PLANNING_VIEW_OWN)).toBe(true);
      expect(hasPermission('USER', Permission.LEAVE_CREATE_OWN)).toBe(true);
      expect(hasPermission('USER', Permission.BLOC_VIEW)).toBe(true);
    });

    it('should return false for USER with admin permissions', () => {
      expect(hasPermission('USER', Permission.PLANNING_DELETE)).toBe(false);
      expect(hasPermission('USER', Permission.LEAVE_APPROVE)).toBe(false);
      expect(hasPermission('USER', Permission.USER_CREATE)).toBe(false);
    });

    it('should return false for unknown role', () => {
      expect(hasPermission('UNKNOWN_ROLE', Permission.BLOC_VIEW)).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has at least one permission', () => {
      const permissions = [Permission.BLOC_DELETE, Permission.BLOC_VIEW, Permission.SYSTEM_BACKUP];
      expect(hasAnyPermission('USER', permissions)).toBe(true); // USER has BLOC_VIEW
    });

    it('should return false if user has none of the permissions', () => {
      const permissions = [
        Permission.BLOC_DELETE,
        Permission.SYSTEM_BACKUP,
        Permission.USER_DELETE,
      ];
      expect(hasAnyPermission('USER', permissions)).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', () => {
      const permissions = [
        Permission.PLANNING_VIEW_OWN,
        Permission.LEAVE_VIEW_OWN,
        Permission.BLOC_VIEW,
      ];
      expect(hasAllPermissions('USER', permissions)).toBe(true);
    });

    it('should return false if user lacks any permission', () => {
      const permissions = [Permission.PLANNING_VIEW_OWN, Permission.PLANNING_DELETE];
      expect(hasAllPermissions('USER', permissions)).toBe(false);
    });
  });

  describe('getRolePermissions', () => {
    it('should return all permissions for ADMIN_TOTAL', () => {
      const permissions = getRolePermissions('ADMIN_TOTAL');
      expect(permissions.length).toBe(Object.values(Permission).length);
    });

    it('should return specific permissions for USER', () => {
      const permissions = getRolePermissions('USER');
      expect(permissions).toContain(Permission.PLANNING_VIEW_OWN);
      expect(permissions).toContain(Permission.LEAVE_CREATE_OWN);
      expect(permissions).not.toContain(Permission.PLANNING_DELETE);
    });

    it('should return empty array for unknown role', () => {
      const permissions = getRolePermissions('UNKNOWN_ROLE');
      expect(permissions).toEqual([]);
    });
  });

  describe('parsePermission', () => {
    it('should return Permission enum for valid permission string', () => {
      expect(parsePermission('bloc.view')).toBe(Permission.BLOC_VIEW);
      expect(parsePermission('planning.create')).toBe(Permission.PLANNING_CREATE);
    });

    it('should return null for invalid permission string', () => {
      expect(parsePermission('invalid.permission')).toBeNull();
      expect(parsePermission('')).toBeNull();
    });
  });

  describe('MAR specific permissions', () => {
    it('should have team planning view permission', () => {
      expect(hasPermission('MAR', Permission.PLANNING_VIEW_ALL)).toBe(true);
      expect(hasPermission('MAR', Permission.PLANNING_VIEW_OWN)).toBe(true);
    });

    it('should not have admin permissions', () => {
      expect(hasPermission('MAR', Permission.PLANNING_DELETE)).toBe(false);
      expect(hasPermission('MAR', Permission.USER_CREATE)).toBe(false);
    });
  });
});
