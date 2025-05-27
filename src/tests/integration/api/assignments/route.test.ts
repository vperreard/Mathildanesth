import { NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/prisma');

const mockedGetUserFromCookie = getUserFromCookie as jest.MockedFunction<typeof getUserFromCookie>;
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

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

describe('/api/gardes/vacations', () => {
    let handlers: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        const route = await import('@/app/api/gardes/vacations/route');
        handlers = route;
    });

    const createRequest = (method: string, body?: any, params?: URLSearchParams) => {
        const url = new URL('http://localhost:3000/api/gardes/vacations');
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

    describe('GET /api/gardes/vacations', () => {
        it('should return user attributions', async () => {
            const mockUser = { id: 1, role: Role.USER };
            const mockAssignments = [
                {
                    id: 1,
                    userId: 1,
                    date: new Date('2024-01-15'),
                    period: 'AM',
                    operatingRoom: {
                        id: 1,
                        name: 'Salle 1',
                        sector: { name: 'Bloc A' },
                    },
                },
                {
                    id: 2,
                    userId: 1,
                    date: new Date('2024-01-20'),
                    period: 'PM',
                    operatingRoom: {
                        id: 2,
                        name: 'Salle 2',
                        sector: { name: 'Bloc B' },
                    },
                },
            ];

            mockedGetUserFromCookie.mockResolvedValue(mockUser as any);
            mockedPrisma.attribution = {
                findMany: jest.fn().mockResolvedValue(mockAssignments),
            } as any;

            const params = new URLSearchParams({
                startDate: '2024-01-01',
                endDate: '2024-01-31',
            });
            const request = createRequest('GET', undefined, params);
            const response = await handlers.GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual(mockAssignments);
            expect(mockedPrisma.attribution.findMany).toHaveBeenCalledWith({
                where: {
                    userId: 1,
                    date: {
                        gte: expect.any(Date),
                        lte: expect.any(Date),
                    },
                },
                include: {
                    operatingRoom: {
                        include: { sector: true },
                    },
                    user: {
                        select: {
                            nom: true,
                            prenom: true,
                        },
                    },
                },
                orderBy: { date: 'asc' },
            });
        });

        it('should return all attributions for admin', async () => {
            const mockAdmin = { id: 1, role: Role.ADMIN_TOTAL };
            mockedGetUserFromCookie.mockResolvedValue(mockAdmin as any);
            mockedPrisma.attribution = {
                findMany: jest.fn().mockResolvedValue([]),
            } as any;

            const request = createRequest('GET');
            await handlers.GET(request);

            expect(mockedPrisma.attribution.findMany).toHaveBeenCalledWith({
                include: expect.any(Object),
                orderBy: { date: 'asc' },
            });
        });

        it('should filter by userId when provided', async () => {
            const mockAdmin = { id: 1, role: Role.ADMIN_TOTAL };
            mockedGetUserFromCookie.mockResolvedValue(mockAdmin as any);
            mockedPrisma.attribution = {
                findMany: jest.fn().mockResolvedValue([]),
            } as any;

            const params = new URLSearchParams({ userId: '5' });
            const request = createRequest('GET', undefined, params);
            await handlers.GET(request);

            expect(mockedPrisma.attribution.findMany).toHaveBeenCalledWith({
                where: { userId: 5 },
                include: expect.any(Object),
                orderBy: { date: 'asc' },
            });
        });

        it('should filter by roomId when provided', async () => {
            const mockUser = { id: 1, role: Role.USER };
            mockedGetUserFromCookie.mockResolvedValue(mockUser as any);
            mockedPrisma.attribution = {
                findMany: jest.fn().mockResolvedValue([]),
            } as any;

            const params = new URLSearchParams({ roomId: '3' });
            const request = createRequest('GET', undefined, params);
            await handlers.GET(request);

            expect(mockedPrisma.attribution.findMany).toHaveBeenCalledWith({
                where: {
                    userId: 1,
                    operatingRoomId: 3,
                },
                include: expect.any(Object),
                orderBy: { date: 'asc' },
            });
        });
    });

    describe('POST /api/gardes/vacations', () => {
        it('should create attribution for admin', async () => {
            const mockAdmin = { id: 1, role: Role.ADMIN_TOTAL };
            const assignmentData = {
                userId: 2,
                operatingRoomId: 1,
                date: '2024-01-15',
                period: 'AM',
            };

            const mockCreatedAssignment = {
                id: 1,
                ...assignmentData,
                date: new Date(assignmentData.date),
                createdAt: new Date(),
            };

            mockedGetUserFromCookie.mockResolvedValue(mockAdmin as any);
            
            // Mock conflict check
            mockedPrisma.attribution = {
                findFirst: jest.fn().mockResolvedValue(null),
                create: jest.fn().mockResolvedValue(mockCreatedAssignment),
            } as any;

            const request = createRequest('POST', assignmentData);
            const response = await handlers.POST(request);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data).toMatchObject(mockCreatedAssignment);
            expect(mockedPrisma.attribution.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: 2,
                    operatingRoomId: 1,
                    period: 'AM',
                }),
                include: expect.any(Object),
            });
        });

        it('should return 403 for non-admin', async () => {
            const mockUser = { id: 1, role: Role.USER };
            mockedGetUserFromCookie.mockResolvedValue(mockUser as any);

            const request = createRequest('POST', {
                userId: 2,
                operatingRoomId: 1,
                date: '2024-01-15',
                period: 'AM',
            });

            const response = await handlers.POST(request);
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.error).toBe('Accès refusé');
        });

        it('should detect conflicts', async () => {
            const mockAdmin = { id: 1, role: Role.ADMIN_TOTAL };
            mockedGetUserFromCookie.mockResolvedValue(mockAdmin as any);

            // Mock existing attribution
            mockedPrisma.attribution = {
                findFirst: jest.fn().mockResolvedValue({
                    id: 999,
                    userId: 3,
                }),
            } as any;

            const request = createRequest('POST', {
                userId: 2,
                operatingRoomId: 1,
                date: '2024-01-15',
                period: 'AM',
            });

            const response = await handlers.POST(request);
            const data = await response.json();

            expect(response.status).toBe(409);
            expect(data.error).toContain('conflit');
        });

        it('should validate required fields', async () => {
            const mockAdmin = { id: 1, role: Role.ADMIN_TOTAL };
            mockedGetUserFromCookie.mockResolvedValue(mockAdmin as any);

            const invalidData = [
                { operatingRoomId: 1, date: '2024-01-15', period: 'AM' }, // Missing userId
                { userId: 1, date: '2024-01-15', period: 'AM' }, // Missing roomId
                { userId: 1, operatingRoomId: 1, period: 'AM' }, // Missing date
                { userId: 1, operatingRoomId: 1, date: '2024-01-15' }, // Missing period
            ];

            for (const data of invalidData) {
                const request = createRequest('POST', data);
                const response = await handlers.POST(request);
                const responseData = await response.json();

                expect(response.status).toBe(400);
                expect(responseData.error).toContain('requis');
            }
        });
    });

    describe('PUT /api/gardes/vacations/[id]', () => {
        it('should update attribution', async () => {
            const mockAdmin = { id: 1, role: Role.ADMIN_TOTAL };
            const updateData = {
                id: 1,
                period: 'PM',
                operatingRoomId: 2,
            };

            mockedGetUserFromCookie.mockResolvedValue(mockAdmin as any);
            mockedPrisma.attribution = {
                update: jest.fn().mockResolvedValue({
                    id: 1,
                    userId: 2,
                    date: new Date('2024-01-15'),
                    ...updateData,
                }),
            } as any;

            const request = createRequest('PUT', updateData);
            const response = await handlers.PUT(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toMatchObject(updateData);
        });

        it('should check for conflicts when updating', async () => {
            const mockAdmin = { id: 1, role: Role.ADMIN_TOTAL };
            mockedGetUserFromCookie.mockResolvedValue(mockAdmin as any);

            // Mock conflict
            mockedPrisma.attribution = {
                findFirst: jest.fn().mockResolvedValue({
                    id: 999,
                    userId: 3,
                }),
            } as any;

            const request = createRequest('PUT', {
                id: 1,
                operatingRoomId: 2,
                date: '2024-01-15',
                period: 'AM',
            });

            const response = await handlers.PUT(request);
            const data = await response.json();

            expect(response.status).toBe(409);
            expect(data.error).toContain('conflit');
        });
    });

    describe('DELETE /api/gardes/vacations/[id]', () => {
        it('should delete attribution', async () => {
            const mockAdmin = { id: 1, role: Role.ADMIN_TOTAL };
            mockedGetUserFromCookie.mockResolvedValue(mockAdmin as any);

            mockedPrisma.attribution = {
                delete: jest.fn().mockResolvedValue({ id: 1 }),
            } as any;

            const request = createRequest('DELETE', { id: 1 });
            const response = await handlers.DELETE(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(mockedPrisma.attribution.delete).toHaveBeenCalledWith({
                where: { id: 1 },
            });
        });

        it('should handle not found error', async () => {
            const mockAdmin = { id: 1, role: Role.ADMIN_TOTAL };
            mockedGetUserFromCookie.mockResolvedValue(mockAdmin as any);

            mockedPrisma.attribution = {
                delete: jest.fn().mockRejectedValue({
                    code: 'P2025',
                }),
            } as any;

            const request = createRequest('DELETE', { id: 999 });
            const response = await handlers.DELETE(request);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toContain('introuvable');
        });
    });
});