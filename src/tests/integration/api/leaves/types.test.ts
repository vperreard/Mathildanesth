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

describe('GET /api/leaves/types', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    let handler: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        const route = await import('@/app/api/leaves/types/route');
        handler = route.GET;
    });

    const createRequest = () => {
        return new NextRequest('http://localhost:3000/api/leaves/types', {
            method: 'GET',
            headers: {
                'cookie': 'auth-token=valid_token',
            },
        });
    };

    it('should return active leave types', async () => {
        const mockUser = { id: 1, role: Role.USER };
        const mockLeaveTypes = [
            {
                code: 'CP',
                label: 'Congés Payés',
                isActive: true,
                defaultDays: 25,
                requiresApproval: true,
                color: '#4CAF50',
            },
            {
                code: 'RTT',
                label: 'RTT',
                isActive: true,
                defaultDays: 10,
                requiresApproval: true,
                color: '#2196F3',
            },
        ];

        mockedGetUserFromCookie.mockResolvedValue(mockUser as any);
        mockedPrisma.leaveTypeSetting = {
            findMany: jest.fn().mockResolvedValue(mockLeaveTypes),
        } as any;

        const request = createRequest();
        const response = await handler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(mockLeaveTypes);
        expect(mockedPrisma.leaveTypeSetting.findMany).toHaveBeenCalledWith({
            where: { 
                isActive: true,
                isUserSelectable: true 
            },
            select: {
                id: true,
                code: true,
                label: true,
                description: true,
            },
            orderBy: { label: 'asc' },
        });
    });

    // This API route is public and doesn't require authentication

    it('should handle empty leave types', async () => {
        const mockUser = { id: 1 };
        mockedGetUserFromCookie.mockResolvedValue(mockUser as any);
        mockedPrisma.leaveTypeSetting = {
            findMany: jest.fn().mockResolvedValue([]),
        } as any;

        const request = createRequest();
        const response = await handler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
        const mockUser = { id: 1 };
        mockedGetUserFromCookie.mockResolvedValue(mockUser as any);
        mockedPrisma.leaveTypeSetting = {
            findMany: jest.fn().mockRejectedValue(new Error('Database error')),
        } as any;

        const request = createRequest();
        const response = await handler(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Erreur serveur lors de la récupération des types de congés.');
    });
});