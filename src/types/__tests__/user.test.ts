import { UserRole, User, CreateUserRequest, UpdateUserRequest } from '../user';

describe('User types', () => {
  describe('UserRole enum', () => {
    it('should define all user roles', () => {
      expect(UserRole.MAR).toBe('MAR');
      expect(UserRole.IADE).toBe('IADE');
      expect(UserRole.ADMIN_TOTAL).toBe('ADMIN_TOTAL');
      expect(UserRole.ADMIN_PARTIEL).toBe('ADMIN_PARTIEL');
      expect(UserRole.CHIRURGIEN).toBe('CHIRURGIEN');
    });

    it('should be string values', () => {
      Object.values(UserRole).forEach(role => {
        expect(typeof role).toBe('string');
      });
    });
  });

  describe('User interface', () => {
    it('should define valid user structure', () => {
      const user: User = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        role: UserRole.MAR,
        siteId: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(user.id).toBe(1);
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.email).toBe('john.doe@example.com');
      expect(user.role).toBe(UserRole.MAR);
      expect(user.siteId).toBe(1);
      expect(user.isActive).toBe(true);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should allow optional fields', () => {
      const minimalUser: Partial<User> = {
        firstName: 'Jane',
        email: 'jane@example.com',
        role: UserRole.IADE
      };

      expect(minimalUser.firstName).toBe('Jane');
      expect(minimalUser.email).toBe('jane@example.com');
      expect(minimalUser.role).toBe(UserRole.IADE);
    });
  });

  describe('CreateUserRequest interface', () => {
    it('should define creation request structure', () => {
      const createRequest: CreateUserRequest = {
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice.smith@example.com',
        role: UserRole.ADMIN_PARTIEL,
        siteId: 2,
        password: 'securePassword123'
      };

      expect(createRequest.firstName).toBe('Alice');
      expect(createRequest.lastName).toBe('Smith');
      expect(createRequest.email).toBe('alice.smith@example.com');
      expect(createRequest.role).toBe(UserRole.ADMIN_PARTIEL);
      expect(createRequest.siteId).toBe(2);
      expect(createRequest.password).toBe('securePassword123');
    });
  });

  describe('UpdateUserRequest interface', () => {
    it('should allow partial updates', () => {
      const updateRequest: UpdateUserRequest = {
        firstName: 'Updated Name',
        isActive: false
      };

      expect(updateRequest.firstName).toBe('Updated Name');
      expect(updateRequest.isActive).toBe(false);
      expect(updateRequest.email).toBeUndefined();
      expect(updateRequest.role).toBeUndefined();
    });

    it('should allow all fields to be updated', () => {
      const fullUpdate: UpdateUserRequest = {
        firstName: 'New First',
        lastName: 'New Last',
        email: 'new.email@example.com',
        role: UserRole.CHIRURGIEN,
        siteId: 3,
        isActive: true
      };

      expect(fullUpdate.firstName).toBe('New First');
      expect(fullUpdate.lastName).toBe('New Last');
      expect(fullUpdate.email).toBe('new.email@example.com');
      expect(fullUpdate.role).toBe(UserRole.CHIRURGIEN);
      expect(fullUpdate.siteId).toBe(3);
      expect(fullUpdate.isActive).toBe(true);
    });
  });

  describe('Role validation', () => {
    it('should validate admin roles', () => {
      const adminRoles = [UserRole.ADMIN_TOTAL, UserRole.ADMIN_PARTIEL];
      adminRoles.forEach(role => {
        expect(role).toContain('ADMIN');
      });
    });

    it('should validate medical roles', () => {
      const medicalRoles = [UserRole.MAR, UserRole.IADE, UserRole.CHIRURGIEN];
      medicalRoles.forEach(role => {
        expect(typeof role).toBe('string');
        expect(role.length).toBeGreaterThan(0);
      });
    });
  });
});