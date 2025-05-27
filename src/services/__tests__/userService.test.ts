import { prisma } from '@/lib/prisma';
import { userService } from '../userService';
import { Role, UserStatus, ProfessionalRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('@/lib/prisma');
jest.mock('bcryptjs');

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('findById', () => {
        it('should find user by id', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                nom: 'Doe',
                prenom: 'John',
                role: Role.USER,
                userStatus: UserStatus.ACTIF,
            };

            mockedPrisma.user = {
                findUnique: jest.fn().mockResolvedValue(mockUser),
            } as any;

            const result = await userService.findById(1);

            expect(result).toEqual(mockUser);
            expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                include: {
                    sites: true,
                    skills: {
                        include: {
                            skill: true,
                        },
                    },
                },
            });
        });

        it('should return null for non-existent user', async () => {
            mockedPrisma.user = {
                findUnique: jest.fn().mockResolvedValue(null),
            } as any;

            const result = await userService.findById(999);

            expect(result).toBeNull();
        });
    });

    describe('findByEmail', () => {
        it('should find user by email', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                nom: 'Doe',
                prenom: 'John',
            };

            mockedPrisma.user = {
                findUnique: jest.fn().mockResolvedValue(mockUser),
            } as any;

            const result = await userService.findByEmail('test@example.com');

            expect(result).toEqual(mockUser);
            expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
            });
        });
    });

    describe('createUser', () => {
        it('should create a new user with hashed password', async () => {
            const userData = {
                email: 'new@example.com',
                password: 'SecurePass123!',
                nom: 'New',
                prenom: 'User',
                role: Role.USER,
                professionalRole: ProfessionalRole.MAR,
            };

            const mockCreatedUser = {
                id: 1,
                ...userData,
                password: 'hashed_password',
                userStatus: UserStatus.ACTIF,
            };

            mockedBcrypt.hash.mockResolvedValue('hashed_password' as never);
            mockedPrisma.user = {
                create: jest.fn().mockResolvedValue(mockCreatedUser),
            } as any;

            const result = await userService.createUser(userData);

            expect(result).toEqual(mockCreatedUser);
            expect(mockedBcrypt.hash).toHaveBeenCalledWith('SecurePass123!', 10);
            expect(mockedPrisma.user.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    email: 'new@example.com',
                    password: 'hashed_password',
                    nom: 'New',
                    prenom: 'User',
                    role: Role.USER,
                    professionalRole: ProfessionalRole.MAR,
                    userStatus: UserStatus.ACTIF,
                }),
            });
        });

        it('should throw error for duplicate email', async () => {
            mockedPrisma.user = {
                create: jest.fn().mockRejectedValue({
                    code: 'P2002',
                    meta: { target: ['email'] },
                }),
            } as any;

            await expect(
                userService.createUser({
                    email: 'existing@example.com',
                    password: 'password',
                    nom: 'User',
                    prenom: 'Test',
                })
            ).rejects.toThrow('Email déjà utilisé');
        });
    });

    describe('updateUser', () => {
        it('should update user data', async () => {
            const updateData = {
                nom: 'Updated',
                prenom: 'Name',
            };

            const mockUpdatedUser = {
                id: 1,
                email: 'test@example.com',
                ...updateData,
            };

            mockedPrisma.user = {
                update: jest.fn().mockResolvedValue(mockUpdatedUser),
            } as any;

            const result = await userService.updateUser(1, updateData);

            expect(result).toEqual(mockUpdatedUser);
            expect(mockedPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: updateData,
            });
        });

        it('should hash password when updating', async () => {
            const updateData = {
                password: 'NewPass123!',
            };

            mockedBcrypt.hash.mockResolvedValue('new_hashed_password' as never);
            mockedPrisma.user = {
                update: jest.fn().mockResolvedValue({ id: 1 }),
            } as any;

            await userService.updateUser(1, updateData);

            expect(mockedBcrypt.hash).toHaveBeenCalledWith('NewPass123!', 10);
            expect(mockedPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { password: 'new_hashed_password' },
            });
        });
    });

    describe('deleteUser', () => {
        it('should soft delete user by setting status to INACTIF', async () => {
            const mockUser = {
                id: 1,
                userStatus: UserStatus.INACTIF,
            };

            mockedPrisma.user = {
                update: jest.fn().mockResolvedValue(mockUser),
            } as any;

            const result = await userService.deleteUser(1);

            expect(result).toEqual(mockUser);
            expect(mockedPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { userStatus: UserStatus.INACTIF },
            });
        });
    });

    describe('validateCredentials', () => {
        it('should validate correct credentials', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                password: 'hashed_password',
                userStatus: UserStatus.ACTIF,
            };

            mockedPrisma.user = {
                findUnique: jest.fn().mockResolvedValue(mockUser),
            } as any;
            mockedBcrypt.compare.mockResolvedValue(true as never);

            const result = await userService.validateCredentials('test@example.com', 'password');

            expect(result).toEqual(mockUser);
            expect(mockedBcrypt.compare).toHaveBeenCalledWith('password', 'hashed_password');
        });

        it('should return null for incorrect password', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                password: 'hashed_password',
                userStatus: UserStatus.ACTIF,
            };

            mockedPrisma.user = {
                findUnique: jest.fn().mockResolvedValue(mockUser),
            } as any;
            mockedBcrypt.compare.mockResolvedValue(false as never);

            const result = await userService.validateCredentials('test@example.com', 'wrong');

            expect(result).toBeNull();
        });

        it('should return null for inactive user', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                password: 'hashed_password',
                userStatus: UserStatus.INACTIF,
            };

            mockedPrisma.user = {
                findUnique: jest.fn().mockResolvedValue(mockUser),
            } as any;

            const result = await userService.validateCredentials('test@example.com', 'password');

            expect(result).toBeNull();
            expect(mockedBcrypt.compare).not.toHaveBeenCalled();
        });
    });

    describe('assignSites', () => {
        it('should assign sites to user', async () => {
            const siteIds = [1, 2, 3];
            
            mockedPrisma.user = {
                update: jest.fn().mockResolvedValue({
                    id: 1,
                    sites: siteIds.map(id => ({ id, name: `Site ${id}` })),
                }),
            } as any;

            const result = await userService.assignSites(1, siteIds);

            expect(result.sites).toHaveLength(3);
            expect(mockedPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    sites: {
                        set: siteIds.map(id => ({ id })),
                    },
                },
                include: { sites: true },
            });
        });
    });

    describe('getUsersWithRole', () => {
        it('should get users by role', async () => {
            const mockUsers = [
                { id: 1, role: Role.ADMIN_TOTAL },
                { id: 2, role: Role.ADMIN_TOTAL },
            ];

            mockedPrisma.user = {
                findMany: jest.fn().mockResolvedValue(mockUsers),
            } as any;

            const result = await userService.getUsersWithRole(Role.ADMIN_TOTAL);

            expect(result).toEqual(mockUsers);
            expect(mockedPrisma.user.findMany).toHaveBeenCalledWith({
                where: {
                    role: Role.ADMIN_TOTAL,
                    userStatus: UserStatus.ACTIF,
                },
                include: {
                    sites: true,
                },
            });
        });
    });
});