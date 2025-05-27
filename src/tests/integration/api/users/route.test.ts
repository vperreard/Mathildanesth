import { NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, UserStatus, ProfessionalRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/prisma');
jest.mock('bcryptjs');

const mockedGetUserFromCookie = getUserFromCookie as jest.MockedFunction<typeof getUserFromCookie>;
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock NextResponse
jest.mock('next/server', () => ({
    NextRequest: jest.requireActual('next/server').NextRequest,
    NextResponse: {
        json: (data: any, init?: ResponseInit) => {
            const response = new Response(JSON.stringify(data), {
                ...init,
                headers: {
                    'content-type': 'application/json',
                    ...(init?.headers || {})
                }
            });
            return response;
        }
    }
}));

describe('/api/utilisateurs', () => {
    let handlers: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        const route = await import('@/app/api/utilisateurs/route');
        handlers = route;
    });

    const createRequest = (method: string, body?: any, params?: URLSearchParams) => {
        const url = new URL('http://localhost:3000/api/utilisateurs');
        if (params) {
            url.search = params.toString();
        }
        
        return new NextRequest(url.toString(), {
            method,
            headers: {
                'Content-Type': 'application/json',
                'cookie': 'auth-token=valid_token',
            },
            ...(body ? { body: JSON.stringify(body) } : {}),
        });
    };

    describe('GET /api/utilisateurs', () => {
        it('should return users list for admin', async () => {
            const mockAdmin = { id: 1, role: Role.ADMIN_TOTAL };
            const mockUsers = [
                {
                    id: 1,
                    email: 'user1@test.com',
                    nom: 'User',
                    prenom: 'One',
                    role: Role.USER,
                    userStatus: UserStatus.ACTIF,
                    professionalRole: ProfessionalRole.MAR,
                    sites: [{ id: 1, name: 'Site A' }],
                },
                {
                    id: 2,
                    email: 'user2@test.com',
                    nom: 'User',
                    prenom: 'Two',
                    role: Role.USER,
                    userStatus: UserStatus.ACTIF,
                    professionalRole: ProfessionalRole.IADE,
                    sites: [{ id: 2, name: 'Site B' }],
                },
            ];

            mockedGetUserFromCookie.mockResolvedValue(mockAdmin as any);
            mockedPrisma.user = {
                findMany: jest.fn().mockResolvedValue(mockUsers),
                count: jest.fn().mockResolvedValue(2),
            } as any;

            const request = createRequest('GET');
            const response = await handlers.GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.users).toEqual(mockUsers);
            expect(data.total).toBe(2);
            expect(mockedPrisma.user.findMany).toHaveBeenCalledWith({
                include: {
                    sites: true,
                    skills: {
                        include: {
                            skill: true,
                        },
                    },
                },
                orderBy: { nom: 'asc' },
            });
        });

        it('should filter users by status', async () => {
            const mockAdmin = { id: 1, role: Role.ADMIN_TOTAL };
            mockedGetUserFromCookie.mockResolvedValue(mockAdmin as any);
            mockedPrisma.user = {
                findMany: jest.fn().mockResolvedValue([]),
                count: jest.fn().mockResolvedValue(0),
            } as any;

            const params = new URLSearchParams({ status: 'ACTIF' });
            const request = createRequest('GET', undefined, params);
            await handlers.GET(request);

            expect(mockedPrisma.user.findMany).toHaveBeenCalledWith({
                where: { userStatus: UserStatus.ACTIF },
                include: expect.any(Object),
                orderBy: expect.any(Object),
            });
        });

        it('should filter users by role', async () => {
            const mockAdmin = { id: 1, role: Role.ADMIN_TOTAL };
            mockedGetUserFromCookie.mockResolvedValue(mockAdmin as any);
            mockedPrisma.user = {
                findMany: jest.fn().mockResolvedValue([]),
                count: jest.fn().mockResolvedValue(0),
            } as any;

            const params = new URLSearchParams({ role: 'USER' });
            const request = createRequest('GET', undefined, params);
            await handlers.GET(request);

            expect(mockedPrisma.user.findMany).toHaveBeenCalledWith({
                where: { role: Role.USER },
                include: expect.any(Object),
                orderBy: expect.any(Object),
            });
        });

        it('should filter users by site for ADMIN_PARTIEL', async () => {
            const mockAdmin = { 
                id: 1, 
                role: Role.ADMIN_PARTIEL,
                sites: [{ id: 1 }, { id: 2 }]
            };
            mockedGetUserFromCookie.mockResolvedValue(mockAdmin as any);
            mockedPrisma.user = {
                findMany: jest.fn().mockResolvedValue([]),
                count: jest.fn().mockResolvedValue(0),
            } as any;

            const request = createRequest('GET');
            await handlers.GET(request);

            expect(mockedPrisma.user.findMany).toHaveBeenCalledWith({
                where: {
                    sites: {
                        some: {
                            id: { in: [1, 2] }
                        }
                    }
                },
                include: expect.any(Object),
                orderBy: expect.any(Object),
            });
        });

        it('should paginate results', async () => {
            const mockAdmin = { id: 1, role: Role.ADMIN_TOTAL };
            mockedGetUserFromCookie.mockResolvedValue(mockAdmin as any);
            mockedPrisma.user = {
                findMany: jest.fn().mockResolvedValue([]),
                count: jest.fn().mockResolvedValue(100),
            } as any;

            const params = new URLSearchParams({ page: '2', limit: '20' });
            const request = createRequest('GET', undefined, params);
            await handlers.GET(request);

            expect(mockedPrisma.user.findMany).toHaveBeenCalledWith({
                skip: 20,
                take: 20,
                include: expect.any(Object),
                orderBy: expect.any(Object),
            });
        });

        it('should return 403 for non-admin user', async () => {
            const mockUser = { id: 1, role: Role.USER };
            mockedGetUserFromCookie.mockResolvedValue(mockUser as any);

            const request = createRequest('GET');
            const response = await handlers.GET(request);
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.error).toBe('Accès refusé');
        });
    });

    describe('POST /api/utilisateurs', () => {
        it('should create a new user for admin', async () => {
            const mockAdmin = { id: 1, role: Role.ADMIN_TOTAL };
            const userData = {
                email: 'newuser@test.com',
                nom: 'New',
                prenom: 'User',
                password: 'SecurePass123!',
                role: Role.USER,
                professionalRole: ProfessionalRole.MAR,
                siteIds: [1, 2],
            };

            const mockCreatedUser = {
                id: 3,
                ...userData,
                password: 'hashed_password',
                userStatus: UserStatus.ACTIF,
                sites: userData.siteIds.map(id => ({ id, name: `Site ${id}` })),
            };

            mockedGetUserFromCookie.mockResolvedValue(mockAdmin as any);
            mockedBcrypt.hash.mockResolvedValue('hashed_password' as never);
            
            mockedPrisma.user = {
                create: jest.fn().mockResolvedValue(mockCreatedUser),
            } as any;

            const request = createRequest('POST', userData);
            const response = await handlers.POST(request);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data).toMatchObject({
                id: 3,
                email: userData.email,
                nom: userData.nom,
                prenom: userData.prenom,
            });
            expect(data).not.toHaveProperty('password');
            expect(mockedBcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
        });

        it('should validate required fields', async () => {
            const mockAdmin = { id: 1, role: Role.ADMIN_TOTAL };
            mockedGetUserFromCookie.mockResolvedValue(mockAdmin as any);

            const invalidData = {
                email: 'test@test.com',
                // Missing required fields
            };

            const request = createRequest('POST', invalidData);
            const response = await handlers.POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain('requis');
        });

        it('should validate email format', async () => {
            const mockAdmin = { id: 1, role: Role.ADMIN_TOTAL };
            mockedGetUserFromCookie.mockResolvedValue(mockAdmin as any);

            const invalidData = {
                email: 'invalid-email',
                nom: 'Test',
                prenom: 'User',
                password: 'Pass123!',
            };

            const request = createRequest('POST', invalidData);
            const response = await handlers.POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain('Email invalide');
        });

        it('should handle duplicate email', async () => {
            const mockAdmin = { id: 1, role: Role.ADMIN_TOTAL };
            mockedGetUserFromCookie.mockResolvedValue(mockAdmin as any);
            mockedBcrypt.hash.mockResolvedValue('hashed' as never);

            mockedPrisma.user = {
                create: jest.fn().mockRejectedValue({
                    code: 'P2002',
                    meta: { target: ['email'] }
                }),
            } as any;

            const request = createRequest('POST', {
                email: 'existing@test.com',
                nom: 'Test',
                prenom: 'User',
                password: 'Pass123!',
            });

            const response = await handlers.POST(request);
            const data = await response.json();

            expect(response.status).toBe(409);
            expect(data.error).toContain('Email déjà utilisé');
        });

        it('should restrict ADMIN_PARTIEL to create users only in their sites', async () => {
            const mockAdmin = { 
                id: 1, 
                role: Role.ADMIN_PARTIEL,
                sites: [{ id: 1 }, { id: 2 }]
            };
            mockedGetUserFromCookie.mockResolvedValue(mockAdmin as any);

            const request = createRequest('POST', {
                email: 'test@test.com',
                nom: 'Test',
                prenom: 'User',
                password: 'Pass123!',
                siteIds: [1, 3], // Site 3 not allowed
            });

            const response = await handlers.POST(request);
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.error).toContain('sites non autorisés');
        });
    });

    describe('PUT /api/utilisateurs/[id]', () => {
        it('should update user data', async () => {
            const mockAdmin = { id: 1, role: Role.ADMIN_TOTAL };
            const updateData = {
                nom: 'Updated',
                prenom: 'Name',
                role: Role.ADMIN_PARTIEL,
            };

            mockedGetUserFromCookie.mockResolvedValue(mockAdmin as any);
            mockedPrisma.user = {
                update: jest.fn().mockResolvedValue({
                    id: 2,
                    ...updateData,
                    email: 'user@test.com',
                }),
            } as any;

            const request = createRequest('PUT', { id: 2, ...updateData });
            const response = await handlers.PUT(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toMatchObject(updateData);
        });

        it('should hash password when updating', async () => {
            const mockAdmin = { id: 1, role: Role.ADMIN_TOTAL };
            mockedGetUserFromCookie.mockResolvedValue(mockAdmin as any);
            mockedBcrypt.hash.mockResolvedValue('new_hashed' as never);

            mockedPrisma.user = {
                update: jest.fn().mockResolvedValue({ id: 2 }),
            } as any;

            const request = createRequest('PUT', {
                id: 2,
                password: 'NewPass123!',
            });

            await handlers.PUT(request);

            expect(mockedBcrypt.hash).toHaveBeenCalledWith('NewPass123!', 10);
            expect(mockedPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 2 },
                data: { password: 'new_hashed' },
                include: expect.any(Object),
            });
        });
    });

    describe('DELETE /api/utilisateurs/[id]', () => {
        it('should soft delete user (set status to INACTIF)', async () => {
            const mockAdmin = { id: 1, role: Role.ADMIN_TOTAL };
            mockedGetUserFromCookie.mockResolvedValue(mockAdmin as any);

            mockedPrisma.user = {
                update: jest.fn().mockResolvedValue({
                    id: 2,
                    userStatus: UserStatus.INACTIF,
                }),
            } as any;

            const request = createRequest('DELETE', { id: 2 });
            const response = await handlers.DELETE(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(mockedPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 2 },
                data: { userStatus: UserStatus.INACTIF },
            });
        });

        it('should prevent deleting the last admin', async () => {
            const mockAdmin = { id: 1, role: Role.ADMIN_TOTAL };
            mockedGetUserFromCookie.mockResolvedValue(mockAdmin as any);

            mockedPrisma.user = {
                count: jest.fn().mockResolvedValue(1),
            } as any;

            const request = createRequest('DELETE', { id: 1 });
            const response = await handlers.DELETE(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain('dernier administrateur');
        });
    });
});