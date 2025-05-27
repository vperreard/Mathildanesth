import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Role, UserStatus } from '@prisma/client';

// Mock dependencies
jest.mock('@/lib/prisma');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

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

describe('POST /api/auth/login', () => {
    let handler: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        const route = await import('@/app/api/auth/login/route');
        handler = route.POST;
    });

    const createRequest = (body: any) => {
        return new NextRequest('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    };

    it('should successfully login with valid credentials', async () => {
        const mockUser = {
            id: 1,
            email: 'test@example.com',
            password: 'hashed_password',
            nom: 'Doe',
            prenom: 'John',
            role: Role.USER,
            userStatus: UserStatus.ACTIF,
        };

        mockedPrisma.user = {
            findUnique: jest.fn().mockResolvedValue(mockUser),
        } as any;

        mockedBcrypt.compare.mockResolvedValue(true as never);

        const request = createRequest({
            email: 'test@example.com',
            password: 'correct_password',
        });

        const response = await handler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.user).toEqual({
            id: mockUser.id,
            email: mockUser.email,
            nom: mockUser.nom,
            prenom: mockUser.prenom,
            role: mockUser.role,
        });
        expect(response.headers.get('set-cookie')).toBeTruthy();
    });

    it('should return 400 for missing email or password', async () => {
        const testCases = [
            { email: 'test@example.com' },
            { password: 'password' },
            {},
        ];

        for (const testCase of testCases) {
            const request = createRequest(testCase);
            const response = await handler(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Email et mot de passe requis');
        }
    });

    it('should return 401 for non-existent user', async () => {
        mockedPrisma.user = {
            findUnique: jest.fn().mockResolvedValue(null),
        } as any;

        const request = createRequest({
            email: 'nonexistent@example.com',
            password: 'password',
        });

        const response = await handler(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Email ou mot de passe incorrect');
    });

    it('should return 401 for incorrect password', async () => {
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

        const request = createRequest({
            email: 'test@example.com',
            password: 'wrong_password',
        });

        const response = await handler(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Email ou mot de passe incorrect');
    });

    it('should return 403 for inactive user', async () => {
        const mockUser = {
            id: 1,
            email: 'test@example.com',
            password: 'hashed_password',
            userStatus: UserStatus.INACTIF,
        };

        mockedPrisma.user = {
            findUnique: jest.fn().mockResolvedValue(mockUser),
        } as any;

        mockedBcrypt.compare.mockResolvedValue(true as never);

        const request = createRequest({
            email: 'test@example.com',
            password: 'correct_password',
        });

        const response = await handler(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toBe('Compte désactivé');
    });

    it('should handle malformed JSON body', async () => {
        const request = new NextRequest('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: 'invalid json',
        });

        const response = await handler(request);
        
        expect(response.status).toBe(400);
    });

    it('should handle database errors gracefully', async () => {
        mockedPrisma.user = {
            findUnique: jest.fn().mockRejectedValue(new Error('Database error')),
        } as any;

        const request = createRequest({
            email: 'test@example.com',
            password: 'password',
        });

        const response = await handler(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Erreur lors de la connexion');
    });
});