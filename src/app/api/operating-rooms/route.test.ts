import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GET, POST } from './route';
import { PrismaClient } from '@prisma/client';

// Mock pour getServerSession
jest.mock('next-auth/next', () => ({
    getServerSession: jest.fn().mockResolvedValue({
        user: { id: 1, name: 'Test User', role: 'ADMIN_TOTAL' }
    })
}));

// Mock pour Prisma
jest.mock('@prisma/client', () => {
    const mockFindMany = jest.fn().mockResolvedValue([
        { id: 1, name: 'Salle 1', number: '1', siteId: 'site1', operatingSectorId: 1 }
    ]);
    const mockFindUnique = jest.fn().mockImplementation((params) => {
        if (params.where.id === 'nonexistent') {
            return Promise.resolve(null);
        }
        return Promise.resolve({ id: params.where.id, name: 'Test Entity' });
    });
    const mockCreate = jest.fn().mockResolvedValue({
        id: 1,
        name: 'Nouvelle Salle',
        number: 'NS1',
        siteId: 'site1',
        operatingSectorId: 1
    });

    return {
        PrismaClient: jest.fn().mockImplementation(() => ({
            operatingRoom: {
                findMany: mockFindMany,
                create: mockCreate
            },
            operatingSector: {
                findUnique: mockFindUnique
            },
            site: {
                findUnique: mockFindUnique
            }
        }))
    };
});

describe('GET /api/operating-rooms', () => {
    let request: Request;

    beforeEach(() => {
        // Réinitialiser la requête avant chaque test
        request = new Request('http://localhost:3000/api/operating-rooms?siteId=site1');
    });

    it('devrait retourner une liste de salles d\'opération', async () => {
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveLength(1);
        expect(data[0].name).toBe('Salle 1');
    });
});

describe('POST /api/operating-rooms', () => {
    let request: Request;

    beforeEach(() => {
        const body = JSON.stringify({
            name: 'Nouvelle Salle',
            number: 'NS1',
            siteId: 'site1',
            operatingSectorId: 1
        });

        request = new Request('http://localhost:3000/api/operating-rooms', {
            method: 'POST',
            body,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    });

    it('devrait créer une nouvelle salle d\'opération', async () => {
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.name).toBe('Nouvelle Salle');
    });

    it('devrait renvoyer une erreur si les données requises sont manquantes', async () => {
        const invalidRequest = new Request('http://localhost:3000/api/operating-rooms', {
            method: 'POST',
            body: JSON.stringify({ name: 'Salle Sans Site' }),
            headers: { 'Content-Type': 'application/json' }
        });

        const response = await POST(invalidRequest);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBeDefined();
    });

    it('devrait renvoyer une erreur si le site n\'existe pas', async () => {
        const invalidRequest = new Request('http://localhost:3000/api/operating-rooms', {
            method: 'POST',
            body: JSON.stringify({ name: 'Salle', siteId: 'nonexistent' }),
            headers: { 'Content-Type': 'application/json' }
        });

        const response = await POST(invalidRequest);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBeDefined();
    });
}); 