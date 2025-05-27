import { NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, LeaveStatus } from '@prisma/client';

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

describe('/api/conges', () => {
    let handlers: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        const route = await import('@/app/api/conges/route');
        handlers = route;
    });

    const createRequest = (method: string, body?: any, params?: URLSearchParams) => {
        const url = new URL('http://localhost:3000/api/conges');
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

    describe('GET /api/conges', () => {
        it('should return leaves for authenticated user', async () => {
            const mockUser = { id: 1, role: Role.USER };
            const mockLeaves = [
                {
                    id: 1,
                    userId: 1,
                    leaveTypeCode: 'CP',
                    startDate: new Date('2024-01-01'),
                    endDate: new Date('2024-01-05'),
                    status: LeaveStatus.APPROVED,
                    countedDays: 5,
                    leaveType: {
                        code: 'CP',
                        label: 'Congés Payés',
                    },
                    user: {
                        nom: 'Doe',
                        prenom: 'John',
                    },
                },
            ];

            mockedGetUserFromCookie.mockResolvedValue(mockUser as any);
            mockedPrisma.leave = {
                findMany: jest.fn().mockResolvedValue(mockLeaves),
            } as any;

            const request = createRequest('GET');
            const response = await handlers.GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual(mockLeaves);
            expect(mockedPrisma.leave.findMany).toHaveBeenCalledWith({
                where: { userId: 1 },
                include: {
                    leaveType: true,
                    user: {
                        select: {
                            nom: true,
                            prenom: true,
                        },
                    },
                },
                orderBy: { startDate: 'desc' },
            });
        });

        it('should return all leaves for admin', async () => {
            const mockUser = { id: 1, role: Role.ADMIN_TOTAL };
            const mockLeaves = [
                { id: 1, userId: 1 },
                { id: 2, userId: 2 },
            ];

            mockedGetUserFromCookie.mockResolvedValue(mockUser as any);
            mockedPrisma.leave = {
                findMany: jest.fn().mockResolvedValue(mockLeaves),
            } as any;

            const request = createRequest('GET');
            const response = await handlers.GET(request);

            expect(response.status).toBe(200);
            expect(mockedPrisma.leave.findMany).toHaveBeenCalledWith({
                include: expect.any(Object),
                orderBy: { startDate: 'desc' },
            });
        });

        it('should filter by status when provided', async () => {
            const mockUser = { id: 1, role: Role.USER };
            mockedGetUserFromCookie.mockResolvedValue(mockUser as any);
            mockedPrisma.leave = {
                findMany: jest.fn().mockResolvedValue([]),
            } as any;

            const params = new URLSearchParams({ status: 'PENDING' });
            const request = createRequest('GET', undefined, params);
            await handlers.GET(request);

            expect(mockedPrisma.leave.findMany).toHaveBeenCalledWith({
                where: {
                    userId: 1,
                    status: LeaveStatus.PENDING,
                },
                include: expect.any(Object),
                orderBy: { startDate: 'desc' },
            });
        });

        it('should return 401 for unauthenticated user', async () => {
            mockedGetUserFromCookie.mockResolvedValue(null);

            const request = createRequest('GET');
            const response = await handlers.GET(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe('Non autorisé');
        });
    });

    describe('POST /api/conges', () => {
        it('should create a new leave request', async () => {
            const mockUser = { id: 1, role: Role.USER };
            const leaveData = {
                leaveTypeCode: 'CP',
                startDate: '2024-06-01',
                endDate: '2024-06-05',
                reason: 'Vacances',
            };

            const mockCreatedLeave = {
                id: 1,
                ...leaveData,
                userId: 1,
                status: LeaveStatus.PENDING,
                countedDays: 5,
                createdAt: new Date(),
            };

            mockedGetUserFromCookie.mockResolvedValue(mockUser as any);
            
            // Mock leaveTypeSetting check
            mockedPrisma.leaveTypeSetting = {
                findUnique: jest.fn().mockResolvedValue({
                    code: 'CP',
                    label: 'Congés Payés',
                    isActive: true,
                }),
            } as any;

            // Mock conflict check
            mockedPrisma.leave = {
                findFirst: jest.fn().mockResolvedValue(null),
                create: jest.fn().mockResolvedValue(mockCreatedLeave),
            } as any;

            // Mock balance check
            mockedPrisma.leaveBalance = {
                findFirst: jest.fn().mockResolvedValue({
                    initialAllowance: 25,
                    used: 5,
                    carriedOver: 0,
                }),
            } as any;

            const request = createRequest('POST', leaveData);
            const response = await handlers.POST(request);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data).toMatchObject(mockCreatedLeave);
            expect(mockedPrisma.leave.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: 1,
                    leaveTypeCode: 'CP',
                    status: LeaveStatus.PENDING,
                }),
            });
        });

        it('should return 400 for missing required fields', async () => {
            const mockUser = { id: 1 };
            mockedGetUserFromCookie.mockResolvedValue(mockUser as any);

            const invalidData = {
                leaveTypeCode: 'CP',
                // Missing startDate and endDate
            };

            const request = createRequest('POST', invalidData);
            const response = await handlers.POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain('requis');
        });

        it('should return 400 for invalid date range', async () => {
            const mockUser = { id: 1 };
            mockedGetUserFromCookie.mockResolvedValue(mockUser as any);

            const invalidData = {
                leaveTypeCode: 'CP',
                startDate: '2024-06-05',
                endDate: '2024-06-01', // End before start
            };

            const request = createRequest('POST', invalidData);
            const response = await handlers.POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain('date');
        });

        it('should return 409 for conflicting leave', async () => {
            const mockUser = { id: 1 };
            mockedGetUserFromCookie.mockResolvedValue(mockUser as any);

            const leaveData = {
                leaveTypeCode: 'CP',
                startDate: '2024-06-01',
                endDate: '2024-06-05',
            };

            mockedPrisma.leaveTypeSetting = {
                findUnique: jest.fn().mockResolvedValue({ code: 'CP', isActive: true }),
            } as any;

            mockedPrisma.leave = {
                findFirst: jest.fn().mockResolvedValue({
                    id: 999,
                    startDate: new Date('2024-06-03'),
                    endDate: new Date('2024-06-07'),
                }),
            } as any;

            const request = createRequest('POST', leaveData);
            const response = await handlers.POST(request);
            const data = await response.json();

            expect(response.status).toBe(409);
            expect(data.error).toContain('conflit');
        });

        it('should handle database errors gracefully', async () => {
            const mockUser = { id: 1 };
            mockedGetUserFromCookie.mockResolvedValue(mockUser as any);

            mockedPrisma.leaveTypeSetting = {
                findUnique: jest.fn().mockRejectedValue(new Error('Database error')),
            } as any;

            const request = createRequest('POST', {
                leaveTypeCode: 'CP',
                startDate: '2024-06-01',
                endDate: '2024-06-05',
            });

            const response = await handlers.POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('Erreur lors de la création de la demande de congé');
        });
    });
});