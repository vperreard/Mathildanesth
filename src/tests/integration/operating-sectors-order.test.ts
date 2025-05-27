import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { prisma } from '@/lib/prisma';

// Mock de Prisma
const prisma = mockDeep<PrismaClient>();

// Importer la fonction à tester (ajuster le chemin selon la structure réelle)
import { GET } from '../../app/api/operating-sectors/route';

// Mocking de Request pour Next.js
const createMockRequest = (url: string) => {
    return {
        url,
        nextUrl: { searchParams: new URLSearchParams(url.split('?')[1] || '') }
    } as unknown as Request;
};

// Mocking de la réponse pour Next.js
global.Response = jest.fn().mockImplementation((body, init) => ({
    body,
    status: init?.status || 200,
    headers: init?.headers || {},
    json: async () => JSON.parse(body as string)
})) as any;

jest.mock('@/lib/prisma');

describe('Test du tri des secteurs opératoires', () => {
    beforeEach(() => {
    jest.clearAllMocks();
        mockReset(prisma);
    });

    it('Trie correctement les secteurs par displayOrder puis par nom', async () => {
        // Données de test avec displayOrder dans un ordre différent de l'ordre alphabétique
        const mockSectors = [
            {
                id: '1',
                name: 'Z Secteur',
                displayOrder: 3,
                siteId: 'site1',
                site: { id: 'site1', name: 'Site 1' },
                rooms: []
            },
            {
                id: '2',
                name: 'A Secteur',
                displayOrder: 1,
                siteId: 'site1',
                site: { id: 'site1', name: 'Site 1' },
                rooms: []
            },
            {
                id: '3',
                name: 'B Secteur',
                displayOrder: 1, // Même displayOrder que "A Secteur", devrait être trié par nom ensuite
                siteId: 'site1',
                site: { id: 'site1', name: 'Site 1' },
                rooms: []
            },
            {
                id: '4',
                name: 'C Secteur',
                displayOrder: 2,
                siteId: 'site1',
                site: { id: 'site1', name: 'Site 1' },
                rooms: []
            },
            {
                id: '5',
                name: 'D Secteur',
                displayOrder: null, // displayOrder null, devrait apparaître après tous les autres
                siteId: 'site1',
                site: { id: 'site1', name: 'Site 1' },
                rooms: []
            }
        ];

        // Mock la réponse de Prisma
        prisma.operatingSector.findMany.mockResolvedValue(mockSectors);

        // Exécuter la fonction GET
        const response = await GET(createMockRequest('http://localhost:3000/api/operating-sectors'));
        const data = await response.json();

        // Vérifier que l'ordre est correct : d'abord par displayOrder, puis par nom alphabétique
        expect(data).toHaveLength(5);
        expect(data[0].name).toBe('A Secteur'); // displayOrder=1, nom=A
        expect(data[1].name).toBe('B Secteur'); // displayOrder=1, nom=B
        expect(data[2].name).toBe('C Secteur'); // displayOrder=2
        expect(data[3].name).toBe('Z Secteur'); // displayOrder=3
        expect(data[4].name).toBe('D Secteur'); // displayOrder=null, devrait être dernier
    });

    it('Trie correctement les secteurs en tenant compte des displayOrder null', async () => {
        // Données de test avec certains displayOrder à null
        const mockSectors = [
            {
                id: '1',
                name: 'Z Secteur',
                displayOrder: null,
                siteId: 'site1',
                site: { id: 'site1', name: 'Site 1' },
                rooms: []
            },
            {
                id: '2',
                name: 'A Secteur',
                displayOrder: 1,
                siteId: 'site1',
                site: { id: 'site1', name: 'Site 1' },
                rooms: []
            },
            {
                id: '3',
                name: 'Y Secteur',
                displayOrder: null,
                siteId: 'site1',
                site: { id: 'site1', name: 'Site 1' },
                rooms: []
            }
        ];

        // Mock la réponse de Prisma
        prisma.operatingSector.findMany.mockResolvedValue(mockSectors);

        // Exécuter la fonction GET
        const response = await GET(createMockRequest('http://localhost:3000/api/operating-sectors'));
        const data = await response.json();

        // Vérifier que l'ordre est correct : d'abord les displayOrder définis, puis les null triés par nom
        expect(data).toHaveLength(3);
        expect(data[0].name).toBe('A Secteur'); // displayOrder=1
        // Les null devraient être triés par nom alphabétique
        expect(data[1].name).toBe('Y Secteur'); // null mais Y avant Z
        expect(data[2].name).toBe('Z Secteur'); // null mais Z après Y
    });
}); 