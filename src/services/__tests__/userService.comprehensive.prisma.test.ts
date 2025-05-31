/**
 * Tests complets pour UserService - Version Prisma (Phase 3)
 * Tests toutes les fonctionnalités CRUD et de gestion des utilisateurs avec Prisma
 */

import { UserService } from '../userService';
import { Role } from '@prisma/client';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
    genSalt: jest.fn().mockResolvedValue('mock-salt'),
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn().mockResolvedValue(true),
}));

// Mock Error Logging Service
jest.mock('../errorLoggingService', () => ({
    logError: jest.fn(),
}));

// Mock Prisma Client
const mockPrismaUser = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
};

const mockPrisma = {
    user: mockPrismaUser,
    $disconnect: jest.fn(),
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
    Role: {
        ADMIN: 'ADMIN',
        USER: 'USER',
        MANAGER: 'MANAGER',
    },
}));

describe('UserService - Prisma Implementation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    beforeEach(() => {
    jest.clearAllMocks();
        jest.clearAllMocks();
    });

    describe('createUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        const userData = {
            nom: 'Dupont',
            prenom: 'Jean',
            login: 'jdupont',
            email: 'jean.dupont@example.com',
            password: 'password123',
            role: 'USER' as Role
        };

        const mockCreatedUser = {
            id: 1,
            ...userData,
            password: 'hashed-password',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            departmentId: null,
            department: null,
            sites: []
        };

        test('should create user successfully', async () => {
            mockPrismaUser.create.mockResolvedValue(mockCreatedUser);

            const result = await UserService.createUser(userData);

            expect(mockPrismaUser.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    nom: 'Dupont',
                    prenom: 'Jean',
                    login: 'jdupont',
                    email: 'jean.dupont@example.com',
                    password: 'hashed-password',
                    role: 'USER'
                }),
                include: expect.any(Object)
            });

            expect(result).toEqual(mockCreatedUser);
        });

        test('should handle Prisma constraint errors', async () => {
            const prismaError = {
                code: 'P2002',
                message: 'Unique constraint failed'
            };

            mockPrismaUser.create.mockRejectedValue(prismaError);

            await expect(UserService.createUser(userData))
                .rejects.toThrow(prismaError);
        });

        test('should create user with sites and department', async () => {
            const userWithRelations = {
                ...userData,
                departmentId: 'dept-1',
                siteIds: ['site-1', 'site-2']
            };

            mockPrismaUser.create.mockResolvedValue(mockCreatedUser);

            await UserService.createUser(userWithRelations);

            expect(mockPrismaUser.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    departmentId: 'dept-1',
                    sites: {
                        connect: [{ id: 'site-1' }, { id: 'site-2' }]
                    }
                }),
                include: expect.any(Object)
            });
        });
    });

    describe('findUserById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should find user by id with relations', async () => {
            const mockUser = {
                id: 1,
                nom: 'Dupont',
                prenom: 'Jean',
                department: { id: 'dept-1', name: 'Cardiologie' },
                sites: [{ id: 'site-1', name: 'Site A' }]
            };

            mockPrismaUser.findUnique.mockResolvedValue(mockUser);

            const result = await UserService.findUserById(1);

            expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                include: {
                    department: { select: { id: true, name: true } },
                    sites: { select: { id: true, name: true } }
                }
            });

            expect(result).toEqual(mockUser);
        });

        test('should return null for non-existent user', async () => {
            mockPrismaUser.findUnique.mockResolvedValue(null);

            const result = await UserService.findUserById(999);

            expect(result).toBeNull();
        });
    });

    describe('findUserByLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should find user by login', async () => {
            const mockUser = { id: 1, login: 'jdupont' };
            mockPrismaUser.findUnique.mockResolvedValue(mockUser);

            const result = await UserService.findUserByLogin('jdupont');

            expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
                where: { login: 'jdupont' }
            });

            expect(result).toEqual(mockUser);
        });
    });

    describe('findUserByEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should find user by email', async () => {
            const mockUser = { id: 1, email: 'jean@example.com' };
            mockPrismaUser.findUnique.mockResolvedValue(mockUser);

            const result = await UserService.findUserByEmail('jean@example.com');

            expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
                where: { email: 'jean@example.com' }
            });

            expect(result).toEqual(mockUser);
        });
    });

    describe('updateUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        const updateData = {
            nom: 'Martin',
            password: 'newpassword',
            siteIds: ['site-3']
        };

        test('should update user with password hashing', async () => {
            const mockUpdatedUser = { id: 1, nom: 'Martin' };
            mockPrismaUser.update.mockResolvedValue(mockUpdatedUser);

            const result = await UserService.updateUser(1, updateData);

            expect(mockPrismaUser.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: expect.objectContaining({
                    nom: 'Martin',
                    password: 'hashed-password',
                    sites: {
                        set: [{ id: 'site-3' }]
                    }
                }),
                include: expect.any(Object)
            });

            expect(result).toEqual(mockUpdatedUser);
        });

        test('should update user without password change', async () => {
            const updateWithoutPassword = { nom: 'Martin' };
            mockPrismaUser.update.mockResolvedValue({ id: 1, nom: 'Martin' });

            await UserService.updateUser(1, updateWithoutPassword);

            expect(mockPrismaUser.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.not.objectContaining({
                        password: expect.anything()
                    })
                })
            );
        });
    });

    describe('deleteUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should perform soft delete', async () => {
            mockPrismaUser.update.mockResolvedValue({ id: 1, isActive: false });

            const result = await UserService.deleteUser(1);

            expect(mockPrismaUser.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { isActive: false }
            });

            expect(result).toBe(true);
        });
    });

    describe('hardDeleteUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should permanently delete user', async () => {
            mockPrismaUser.delete.mockResolvedValue({ id: 1 });

            const result = await UserService.hardDeleteUser(1);

            expect(mockPrismaUser.delete).toHaveBeenCalledWith({
                where: { id: 1 }
            });

            expect(result).toBe(true);
        });
    });

    describe('searchUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        const mockUsers = [
            { id: 1, nom: 'Dupont', prenom: 'Jean' },
            { id: 2, nom: 'Martin', prenom: 'Marie' }
        ];

        test('should search users with text filters', async () => {
            mockPrismaUser.findMany.mockResolvedValue(mockUsers);
            mockPrismaUser.count.mockResolvedValue(2);

            const filters = {
                search: 'dupont',
                role: 'USER' as Role,
                page: 1,
                limit: 10
            };

            const result = await UserService.searchUsers(filters);

            expect(mockPrismaUser.findMany).toHaveBeenCalledWith({
                where: {
                    isActive: true,
                    role: 'USER',
                    OR: [
                        { nom: { contains: 'dupont', mode: 'insensitive' } },
                        { prenom: { contains: 'dupont', mode: 'insensitive' } },
                        { login: { contains: 'dupont', mode: 'insensitive' } },
                        { email: { contains: 'dupont', mode: 'insensitive' } }
                    ]
                },
                include: expect.any(Object),
                orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
                skip: 0,
                take: 10
            });

            expect(result).toEqual({
                users: mockUsers,
                total: 2,
                page: 1,
                limit: 10,
                totalPages: 1
            });
        });

        test('should search users by department', async () => {
            mockPrismaUser.findMany.mockResolvedValue(mockUsers);
            mockPrismaUser.count.mockResolvedValue(2);

            const filters = {
                department: 'dept-1'
            };

            await UserService.searchUsers(filters);

            expect(mockPrismaUser.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        departmentId: 'dept-1'
                    })
                })
            );
        });

        test('should search users by site', async () => {
            mockPrismaUser.findMany.mockResolvedValue(mockUsers);
            mockPrismaUser.count.mockResolvedValue(2);

            const filters = {
                site: 'site-1'
            };

            await UserService.searchUsers(filters);

            expect(mockPrismaUser.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        sites: {
                            some: { id: 'site-1' }
                        }
                    })
                })
            );
        });

        test('should handle pagination correctly', async () => {
            mockPrismaUser.findMany.mockResolvedValue(mockUsers);
            mockPrismaUser.count.mockResolvedValue(25);

            const filters = {
                page: 3,
                limit: 10
            };

            const result = await UserService.searchUsers(filters);

            expect(mockPrismaUser.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 20, // (page - 1) * limit = (3 - 1) * 10
                    take: 10
                })
            );

            expect(result.totalPages).toBe(3); // Math.ceil(25 / 10)
        });
    });

    describe('getAllActiveUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should get all active users ordered by name', async () => {
            const mockActiveUsers = [
                { id: 1, nom: 'Dupont', isActive: true },
                { id: 2, nom: 'Martin', isActive: true }
            ];

            mockPrismaUser.findMany.mockResolvedValue(mockActiveUsers);

            const result = await UserService.getAllActiveUsers();

            expect(mockPrismaUser.findMany).toHaveBeenCalledWith({
                where: { isActive: true },
                include: {
                    department: { select: { id: true, name: true } },
                    sites: { select: { id: true, name: true } }
                },
                orderBy: [{ nom: 'asc' }, { prenom: 'asc' }]
            });

            expect(result).toEqual(mockActiveUsers);
        });
    });

    describe('verifyPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should verify password using bcrypt', async () => {
            const bcrypt = require('bcryptjs');
            const mockUser = { id: 1, password: 'hashed-password' };

            const result = await UserService.verifyPassword(mockUser, 'password123');

            expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
            expect(result).toBe(true);
        });
    });

    describe('changePassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should change password with hashing', async () => {
            mockPrismaUser.update.mockResolvedValue({ id: 1 });

            const result = await UserService.changePassword(1, 'newpassword');

            expect(mockPrismaUser.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { password: 'hashed-password' }
            });

            expect(result).toBe(true);
        });
    });

    describe('getUserStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should get comprehensive user statistics', async () => {
            mockPrismaUser.count
                .mockResolvedValueOnce(100) // total
                .mockResolvedValueOnce(85); // active

            mockPrismaUser.groupBy.mockResolvedValue([
                { role: 'USER', _count: 70 },
                { role: 'ADMIN', _count: 10 },
                { role: 'MANAGER', _count: 20 }
            ]);

            const result = await UserService.getUserStats();

            expect(result).toEqual({
                total: 100,
                active: 85,
                inactive: 15,
                byRole: {
                    USER: 70,
                    ADMIN: 10,
                    MANAGER: 20
                }
            });
        });
    });

    describe('Legacy Sequelize Compatibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('findOne should work with login criteria', async () => {
            const mockUser = { id: 1, login: 'test' };
            mockPrismaUser.findUnique.mockResolvedValue(mockUser);

            const result = await UserService.findOne({ login: 'test' });

            expect(result).toEqual(mockUser);
        });

        test('findOne should work with email criteria', async () => {
            const mockUser = { id: 1, email: 'test@example.com' };
            mockPrismaUser.findUnique.mockResolvedValue(mockUser);

            const result = await UserService.findOne({ email: 'test@example.com' });

            expect(result).toEqual(mockUser);
        });

        test('findAll should handle legacy options', async () => {
            const mockUsers = [{ id: 1, nom: 'Test' }];
            mockPrismaUser.findMany.mockResolvedValue(mockUsers);
            mockPrismaUser.count.mockResolvedValue(1);

            const result = await UserService.findAll({
                where: { isActive: true, role: 'USER' },
                limit: 10
            });

            expect(result).toEqual(mockUsers);
        });

        test('create should handle legacy field mapping', async () => {
            const legacyData = {
                firstName: 'Jean',
                lastName: 'Dupont',
                login: 'jdupont',
                email: 'jean@example.com',
                password: 'password',
                role: 'USER'
            };

            const mockCreatedUser = { id: 1, nom: 'Dupont', prenom: 'Jean' };
            mockPrismaUser.create.mockResolvedValue(mockCreatedUser);

            const result = await UserService.create(legacyData);

            expect(mockPrismaUser.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    nom: 'Dupont',
                    prenom: 'Jean'
                }),
                include: expect.any(Object)
            });
        });
    });

    describe('Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should handle and log Prisma errors consistently', async () => {
            const { logError } = require('../errorLoggingService');
            const prismaError = {
                code: 'P2002',
                message: 'Unique constraint failed'
            };

            mockPrismaUser.create.mockRejectedValue(prismaError);

            await expect(UserService.createUser({
                nom: 'Test',
                prenom: 'User',
                login: 'test',
                email: 'test@example.com',
                password: 'password',
                role: 'USER' as Role
            })).rejects.toThrow(prismaError);

            expect(logError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Un utilisateur avec ce login ou email existe déjà.',
                    code: 'P2002'
                })
            );
        });

        test('should handle network errors gracefully', async () => {
            const networkError = new Error('Network timeout');
            mockPrismaUser.findUnique.mockRejectedValue(networkError);

            await expect(UserService.findUserById(1))
                .rejects.toThrow('Network timeout');
        });
    });
});