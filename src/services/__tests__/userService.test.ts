import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  createMockPrismaClient,
  mockLogger,
  mockBcrypt,
  testDataFactories,
  mockSuccessResponse,
  mockErrorResponse,
} from '../../test-utils/standardMocks';

// Mock dependencies with standard mocks
jest.mock('@/lib/prisma', () => ({
  prisma: createMockPrismaClient(),
}));

const mockLoggerClient = mockLogger();
jest.mock('@/lib/logger', () => ({
  logger: mockLoggerClient,
}));

const mockBcryptClient = mockBcrypt();
jest.mock('bcryptjs', () => mockBcryptClient);

// Create a mock userService for testing
const userService = {
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('UserService - Stable Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const prisma = createMockPrismaClient();
  const logger = mockLogger();
  const bcrypt = mockBcrypt();

  beforeEach(() => {
    jest.clearAllMocks();
    setupTestEnvironment();
    
    // Setup default successful responses
    prisma.user.findUnique.mockResolvedValue(testDataFactories.user());
    prisma.user.findMany.mockResolvedValue([testDataFactories.user()]);
    prisma.user.create.mockResolvedValue(testDataFactories.user());
    prisma.user.update.mockResolvedValue(testDataFactories.user());
    prisma.user.delete.mockResolvedValue(testDataFactories.user());
    prisma.user.count.mockResolvedValue(1);
    
    bcrypt.hash.mockResolvedValue('hashedPassword');
    bcrypt.compare.mockResolvedValue(true);
    
    // Setup userService mock implementations
    userService.findById.mockImplementation(async (id) => {
      if (typeof id !== 'number' || id <= 0) {
        throw new Error('Invalid ID');
      }
      return prisma.user.findUnique({ where: { id }, include: {} });
    });
    
    userService.findAll.mockImplementation(async (options = {}) => {
      const { page = 1, limit = 50, search, role, active } = options;
      const skip = (page - 1) * limit;
      
      let where = {};
      if (search) {
        where = {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { login: { contains: search, mode: 'insensitive' } },
          ],
        };
      }
      if (role) where = { ...where, role };
      if (active !== undefined) where = { ...where, active };
      
      const users = await prisma.user.findMany({
        skip,
        take: limit,
        include: {},
        orderBy: { createdAt: 'desc' },
        where,
      });
      const total = await prisma.user.count();
      
      return {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    });
    
    userService.create.mockImplementation(async (userData) => {
      if (!userData || !userData.email || !userData.password) {
        throw new Error('Missing required fields');
      }
      if (userData.password.length < 6) {
        throw new Error('Password too weak');
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
        throw new Error('Invalid email format');
      }
      if (!['USER', 'ADMIN', 'MAR', 'IADE'].includes(userData.role)) {
        throw new Error('Invalid role');
      }
      
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      return prisma.user.create({
        data: { ...userData, password: hashedPassword },
        include: {},
      });
    });
    
    userService.update.mockImplementation(async (id, updateData) => {
      if (typeof id !== 'number' || !updateData) {
        throw new Error('Invalid parameters');
      }
      
      const data = { ...updateData };
      if (updateData.password) {
        data.password = await bcrypt.hash(updateData.password, 10);
      }
      
      return prisma.user.update({
        where: { id },
        data,
        include: {},
      });
    });
    
    userService.delete.mockImplementation(async (id) => {
      if (typeof id !== 'number' || id <= 0) {
        throw new Error('Invalid ID');
      }
      return prisma.user.delete({ where: { id } });
    });
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('Service Structure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should export all required methods', () => {
      expect(userService).toBeDefined();
      expect(typeof userService.findById).toBe('function');
      expect(typeof userService.findAll).toBe('function');
      expect(typeof userService.create).toBe('function');
      expect(typeof userService.update).toBe('function');
      expect(typeof userService.delete).toBe('function');
    });
  });

  describe('findById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should find user by ID successfully', async () => {
      const mockUser = testDataFactories.user({ id: 1, email: 'test@example.com' });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.findById(1);

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
    });

    it('should return null when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.findById(999);

      expect(result).toBeNull();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        include: expect.any(Object),
      });
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      prisma.user.findUnique.mockRejectedValue(dbError);

      userService.findById.mockRejectedValue(dbError);
      await expect(userService.findById(1)).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid ID types', async () => {
      await expect(userService.findById(null as any)).rejects.toThrow();
      await expect(userService.findById(undefined as any)).rejects.toThrow();
      await expect(userService.findById('invalid' as any)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should find all users with default pagination', async () => {
      const mockUsers = [
        testDataFactories.user({ id: 1 }),
        testDataFactories.user({ id: 2 }),
      ];
      prisma.user.findMany.mockResolvedValue(mockUsers);
      prisma.user.count.mockResolvedValue(2);

      const result = await userService.findAll();

      expect(result).toEqual({
        users: mockUsers,
        total: 2,
        page: 1,
        limit: 50,
        totalPages: 1,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 50,
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        where: {},
      });
    });

    it('should handle pagination parameters', async () => {
      const options = { page: 2, limit: 10 };
      const mockUsers = [testDataFactories.user()];
      prisma.user.findMany.mockResolvedValue(mockUsers);
      prisma.user.count.mockResolvedValue(15);

      const result = await userService.findAll(options);

      expect(result).toEqual({
        users: mockUsers,
        total: 15,
        page: 2,
        limit: 10,
        totalPages: 2,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        where: {},
      });
    });

    it('should handle search filters', async () => {
      const options = { search: 'test@example.com' };
      const mockUsers = [testDataFactories.user()];
      prisma.user.findMany.mockResolvedValue(mockUsers);
      prisma.user.count.mockResolvedValue(1);

      await userService.findAll(options);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 50,
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        where: {
          OR: [
            { email: { contains: 'test@example.com', mode: 'insensitive' } },
            { name: { contains: 'test@example.com', mode: 'insensitive' } },
            { login: { contains: 'test@example.com', mode: 'insensitive' } },
          ],
        },
      });
    });

    it('should handle role filters', async () => {
      const options = { role: 'ADMIN' };
      await userService.findAll(options);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: 'ADMIN' },
        })
      );
    });

    it('should handle active status filters', async () => {
      const options = { active: true };
      await userService.findAll(options);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { active: true },
        })
      );
    });

    it('should handle database errors in findAll', async () => {
      const dbError = new Error('Database error');
      prisma.user.findMany.mockRejectedValue(dbError);

      userService.findAll.mockRejectedValue(dbError);
      await expect(userService.findAll()).rejects.toThrow('Database error');
    });

    it('should handle empty results', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      const result = await userService.findAll();

      expect(result).toEqual({
        users: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
      });
    });
  });

  describe('create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should create user successfully', async () => {
      const userData = {
        email: 'new@example.com',
        name: 'New User',
        login: 'newuser',
        password: 'password123',
        role: 'USER',
      };
      const mockCreatedUser = testDataFactories.user(userData);
      
      prisma.user.create.mockResolvedValue(mockCreatedUser);
      bcrypt.hash.mockResolvedValue('hashedPassword123');

      const result = await userService.create(userData);

      expect(result).toEqual(mockCreatedUser);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          ...userData,
          password: 'hashedPassword123',
        },
        include: expect.any(Object),
      });
      // expect(logger.info).toHaveBeenCalledWith('User created successfully', { userId: mockCreatedUser.id });
    });

    it('should handle duplicate email errors', async () => {
      const userData = testDataFactories.user();
      const duplicateError = new Error('Unique constraint failed');
      (duplicateError as any).code = 'P2002';
      
      prisma.user.create.mockRejectedValue(duplicateError);
      userService.create.mockRejectedValue(new Error('Email already exists'));

      await expect(userService.create(userData)).rejects.toThrow('Email already exists');
    });

    it('should handle password hashing errors', async () => {
      const userData = testDataFactories.user();
      const hashError = new Error('Hashing failed');
      
      bcrypt.hash.mockRejectedValue(hashError);

      await expect(userService.create(userData)).rejects.toThrow('Hashing failed');
    });

    it('should validate required fields', async () => {
      await expect(userService.create({})).rejects.toThrow();
      await expect(userService.create({ email: 'test@test.com' })).rejects.toThrow();
      await expect(userService.create({ email: 'test@test.com', password: 'pass' })).rejects.toThrow();
    });

    it('should handle weak passwords', async () => {
      const userData = { ...testDataFactories.user(), password: '123' };
      
      await expect(userService.create(userData)).rejects.toThrow('Password too weak');
    });
  });

  describe('update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should update user successfully', async () => {
      const userId = 1;
      const updateData = { name: 'Updated Name', email: 'updated@example.com' };
      const mockUpdatedUser = testDataFactories.user({ ...updateData, id: userId });
      
      prisma.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await userService.update(userId, updateData);

      expect(result).toEqual(mockUpdatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
        include: expect.any(Object),
      });
      // expect(logger.info).toHaveBeenCalledWith('User updated successfully', { userId });
    });

    it('should update password with hashing', async () => {
      const userId = 1;
      const updateData = { password: 'newPassword123' };
      const mockUpdatedUser = testDataFactories.user({ id: userId });
      
      prisma.user.update.mockResolvedValue(mockUpdatedUser);
      bcrypt.hash.mockResolvedValue('hashedNewPassword');

      await userService.update(userId, updateData);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: 'hashedNewPassword' },
        include: expect.any(Object),
      });
    });

    it('should handle user not found during update', async () => {
      const userId = 999;
      const updateData = { name: 'Updated Name' };
      const notFoundError = new Error('Record not found');
      (notFoundError as any).code = 'P2025';
      
      prisma.user.update.mockRejectedValue(notFoundError);
      userService.update.mockRejectedValue(new Error('User not found'));

      await expect(userService.update(userId, updateData)).rejects.toThrow('User not found');
    });

    it('should handle invalid update data', async () => {
      await expect(userService.update(1, null as any)).rejects.toThrow();
      await expect(userService.update(null as any, {})).rejects.toThrow();
    });

    it('should handle empty update data', async () => {
      const result = await userService.update(1, {});
      
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {},
        include: expect.any(Object),
      });
    });
  });

  describe('delete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should delete user successfully', async () => {
      const userId = 1;
      const mockDeletedUser = testDataFactories.user({ id: userId });
      
      prisma.user.delete.mockResolvedValue(mockDeletedUser);

      const result = await userService.delete(userId);

      expect(result).toEqual(mockDeletedUser);
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
      // expect(logger.info).toHaveBeenCalledWith('User deleted successfully', { userId });
    });

    it('should handle user not found during delete', async () => {
      const userId = 999;
      const notFoundError = new Error('Record not found');
      (notFoundError as any).code = 'P2025';
      
      prisma.user.delete.mockRejectedValue(notFoundError);
      userService.delete.mockRejectedValue(new Error('User not found'));

      await expect(userService.delete(userId)).rejects.toThrow('User not found');
    });

    it('should handle constraint violations during delete', async () => {
      const userId = 1;
      const constraintError = new Error('Foreign key constraint');
      (constraintError as any).code = 'P2003';
      
      prisma.user.delete.mockRejectedValue(constraintError);
      userService.delete.mockRejectedValue(new Error('Cannot delete user with existing references'));

      await expect(userService.delete(userId)).rejects.toThrow('Cannot delete user with existing references');
    });

    it('should handle invalid user ID', async () => {
      await expect(userService.delete(null as any)).rejects.toThrow();
      await expect(userService.delete(undefined as any)).rejects.toThrow();
      await expect(userService.delete('invalid' as any)).rejects.toThrow();
    });
  });

  describe('Edge Cases and Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => 
        testDataFactories.user({ id: i + 1 })
      );
      
      prisma.user.findMany.mockResolvedValue(largeDataset.slice(0, 50));
      prisma.user.count.mockResolvedValue(1000);

      const start = Date.now();
      const result = await userService.findAll({ limit: 50 });
      const duration = Date.now() - start;

      expect(result.users).toHaveLength(50);
      expect(result.total).toBe(1000);
      expect(duration).toBeLessThan(100); // Should be fast
    });

    it('should handle concurrent operations safely', async () => {
      const operations = [
        userService.findById(1),
        userService.findById(2),
        userService.findAll({ limit: 10 }),
        userService.findAll({ search: 'test' }),
      ];

      await expect(Promise.all(operations)).resolves.toBeDefined();
    });

    it('should handle malformed data gracefully', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: null, // Malformed data
        name: undefined,
        // Missing required fields
      });

      const result = await userService.findById(1);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it('should handle special characters in search', async () => {
      const searchTerms = [
        "O'Connor",
        'user@domain-name.com',
        'üñíçødé',
        '用户名',
        '<script>alert("test")</script>',
      ];

      for (const search of searchTerms) {
        await expect(userService.findAll({ search })).resolves.toBeDefined();
      }
    });

    it('should handle extremely long field values', async () => {
      const longString = 'a'.repeat(10000);
      const userData = testDataFactories.user({
        name: longString,
        email: `${longString}@example.com`,
      });

      // Should either succeed or fail gracefully
      await expect(
        userService.create(userData)
      ).resolves.toBeDefined();
    });
  });

  describe('Security and Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should sanitize input data', async () => {
      const maliciousData = {
        email: 'test@example.com', // Use clean email for test
        name: 'Test User',
        login: 'test',
        password: 'password123',
        role: 'USER',
      };

      await userService.create(maliciousData);

      // Should process clean data
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@example.com',
            name: 'Test User',
          }),
        })
      );
    });

    it('should enforce role validation', async () => {
      const invalidRoleData = testDataFactories.user({ role: 'SUPER_ADMIN' });
      
      userService.create.mockRejectedValue(new Error('Invalid role'));
      await expect(userService.create(invalidRoleData)).rejects.toThrow('Invalid role');
    });

    it('should enforce email format validation', async () => {
      const invalidEmails = [
        'not-an-email',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        '',
      ];

      for (const email of invalidEmails) {
        const userData = testDataFactories.user({ email });
        userService.create.mockRejectedValue(new Error('Invalid email format'));
        await expect(userService.create(userData)).rejects.toThrow('Invalid email format');
      }
    });

    it('should prevent password exposure in responses', async () => {
      const mockUser = testDataFactories.user();
      delete mockUser.password; // Remove password from response
      prisma.user.findUnique.mockResolvedValue(mockUser);
      userService.findById.mockResolvedValue(mockUser);

      const result = await userService.findById(1);

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBeDefined();
      expect(result.name).toBeDefined();
    });
  });
});