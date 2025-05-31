/**
 * Tests pour UserServicePrisma - Phase 2 Validation
 */

import { UserServicePrisma, CreateUserInput, UpdateUserInput, UserSearchFilters } from '../userService-prisma';
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

describe('UserServicePrisma', () => {
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

        const mockUserData: CreateUserInput = {
            nom: 'Dupont',
            prenom: 'Jean',
            login: 'jdupont',
            email: 'jean.dupont@example.com',
            password: 'password123',
            role: 'USER' as Role,
            departmentId: 'dept-1',
            siteIds: ['site-1', 'site-2']
        };

        const mockCreatedUser = {
            id: 1,
            nom: 'Dupont',
            prenom: 'Jean',
            login: 'jdupont',
            email: 'jean.dupont@example.com',
            password: 'hashed-password',
            role: 'USER',
            departmentId: 'dept-1',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            department: { id: 'dept-1', name: 'Cardiologie' },
            sites: [
                { id: 'site-1', name: 'Site A' },
                { id: 'site-2', name: 'Site B' }
            ]
        };

        test('should create user successfully', async () => {
            mockPrismaUser.create.mockResolvedValue(mockCreatedUser);

            const result = await UserServicePrisma.createUser(mockUserData);

            expect(mockPrismaUser.create).toHaveBeenCalledWith({
                data: {
                    nom: 'Dupont',
                    prenom: 'Jean',
                    login: 'jdupont',
                    email: 'jean.dupont@example.com',
                    password: 'hashed-password',
                    role: 'USER',
                    departmentId: 'dept-1',
                    sites: {
                        connect: [{ id: 'site-1' }, { id: 'site-2' }]
                    }
                },
                include: {
                    department: { select: { id: true, name: true } },
                    sites: { select: { id: true, name: true } }
                }
            });

            expect(result).toEqual(mockCreatedUser);
        });

        test('should create user without sites', async () => {
            const userWithoutSites = { ...mockUserData };
            delete userWithoutSites.siteIds;

            mockPrismaUser.create.mockResolvedValue(mockCreatedUser);

            await UserServicePrisma.createUser(userWithoutSites);

            expect(mockPrismaUser.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.not.objectContaining({
                        sites: expect.anything()
                    })
                })
            );
        });

        test('should handle Prisma errors', async () => {
            const prismaError = {
                code: 'P2002',
                message: 'Unique constraint failed'
            };

            mockPrismaUser.create.mockRejectedValue(prismaError);

            await expect(UserServicePrisma.createUser(mockUserData))
                .rejects.toThrow(prismaError);
        });
    });

    describe('findUserById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        const mockUser = {
            id: 1,
            nom: 'Dupont',
            prenom: 'Jean',
            department: { id: 'dept-1', name: 'Cardiologie' },
            sites: [{ id: 'site-1', name: 'Site A' }]
        };

        test('should find user by id', async () => {
            mockPrismaUser.findUnique.mockResolvedValue(mockUser);

            const result = await UserServicePrisma.findUserById(1);

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

            const result = await UserServicePrisma.findUserById(999);

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

            const result = await UserServicePrisma.findUserByLogin('jdupont');

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

            const result = await UserServicePrisma.findUserByEmail('jean@example.com');

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

        const updateData: UpdateUserInput = {
            nom: 'Martin',
            password: 'newpassword',
            siteIds: ['site-3']
        };

        test('should update user successfully', async () => {
            const mockUpdatedUser = { id: 1, nom: 'Martin' };
            mockPrismaUser.update.mockResolvedValue(mockUpdatedUser);

            const result = await UserServicePrisma.updateUser(1, updateData);

            expect(mockPrismaUser.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    nom: 'Martin',
                    password: 'hashed-password',
                    sites: {
                        set: [{ id: 'site-3' }]
                    }
                },
                include: {
                    department: { select: { id: true, name: true } },
                    sites: { select: { id: true, name: true } }
                }
            });

            expect(result).toEqual(mockUpdatedUser);
        });

        test('should update user without password change', async () => {
            const updateWithoutPassword = { nom: 'Martin' };
            mockPrismaUser.update.mockResolvedValue({ id: 1, nom: 'Martin' });

            await UserServicePrisma.updateUser(1, updateWithoutPassword);

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

        test('should soft delete user', async () => {
            mockPrismaUser.update.mockResolvedValue({ id: 1, isActive: false });

            const result = await UserServicePrisma.deleteUser(1);

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

            const result = await UserServicePrisma.hardDeleteUser(1);

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

        test('should search users with filters', async () => {
            mockPrismaUser.findMany.mockResolvedValue(mockUsers);
            mockPrismaUser.count.mockResolvedValue(2);

            const filters: UserSearchFilters = {
                search: 'dupont',
                role: 'USER' as Role,
                page: 1,
                limit: 10
            };

            const result = await UserServicePrisma.searchUsers(filters);

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

        test('should search with site filter', async () => {
            mockPrismaUser.findMany.mockResolvedValue(mockUsers);
            mockPrismaUser.count.mockResolvedValue(2);

            const filters: UserSearchFilters = {
                site: 'site-1'
            };

            await UserServicePrisma.searchUsers(filters);

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
    });

    describe('getAllActiveUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should get all active users', async () => {
            const mockActiveUsers = [
                { id: 1, nom: 'Dupont', isActive: true },
                { id: 2, nom: 'Martin', isActive: true }
            ];

            mockPrismaUser.findMany.mockResolvedValue(mockActiveUsers);

            const result = await UserServicePrisma.getAllActiveUsers();

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

        test('should verify password correctly', async () => {
            const bcrypt = require('bcryptjs');
            const mockUser = { id: 1, password: 'hashed-password' };

            const result = await UserServicePrisma.verifyPassword(mockUser as any, 'password123');

            expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
            expect(result).toBe(true);
        });
    });

    describe('changePassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should change password successfully', async () => {
            mockPrismaUser.update.mockResolvedValue({ id: 1 });

            const result = await UserServicePrisma.changePassword(1, 'newpassword');

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

        test('should get user statistics', async () => {
            mockPrismaUser.count
                .mockResolvedValueOnce(100) // total
                .mockResolvedValueOnce(85); // active

            mockPrismaUser.groupBy.mockResolvedValue([
                { role: 'USER', _count: 70 },
                { role: 'ADMIN', _count: 10 },
                { role: 'MANAGER', _count: 20 }
            ]);

            const result = await UserServicePrisma.getUserStats();

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

    describe('Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

        test('should handle and log errors consistently', async () => {
            const { logError } = require('../errorLoggingService');
            const prismaError = new Error('Database connection failed');

            mockPrismaUser.findUnique.mockRejectedValue(prismaError);

            await expect(UserServicePrisma.findUserById(1))
                .rejects.toThrow(prismaError);

            expect(logError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Database connection failed',
                    code: 'USER_SERVICE_ERROR',
                    severity: 'error'
                })
            );
        });

        test('should handle Prisma-specific errors', async () => {
            const { logError } = require('../errorLoggingService');
            const prismaError = {
                code: 'P2002',
                message: 'Unique constraint failed'
            };

            mockPrismaUser.create.mockRejectedValue(prismaError);

            await expect(UserServicePrisma.createUser({
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
                    code: 'P2002',
                    context: expect.objectContaining({
                        prismaCode: 'P2002'
                    })
                })
            );
        });
    });
});