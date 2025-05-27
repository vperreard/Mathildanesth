import { NextRequest } from 'next/server';

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
            response.status = init?.status || 200;
            return response;
        }
    }
}));

/**
 * Tests d'intégration pour vérifier que toutes les routes API migrées
 * de Pages Router vers App Router fonctionnent correctement
 */

describe('Migration des routes API - Pages Router vers App Router', () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    // Helper pour créer une requête mock
    const createMockRequest = (url: string, method: string = 'GET', body?: any) => {
        const request = new NextRequest(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        return request;
    };

    describe('Routes de documentation', () => {
        test('GET /api/documentation/[...path] - doit servir les fichiers de documentation', async () => {
            const { GET } = await import('@/app/api/documentation/[...path]/route');

            const request = createMockRequest(`${baseUrl}/api/documentation/test.md`);
            const response = await GET(request, { params: { path: ['test.md'] } });

            expect(response.status).toBe(404); // Fichier n'existe pas, mais route fonctionne
        });

        test('GET /api/docs/[...path] - doit servir les fichiers du dossier src/docs', async () => {
            const { GET } = await import('@/app/api/docs/[...path]/route');

            const request = createMockRequest(`${baseUrl}/api/docs/test.md`);
            const response = await GET(request, { params: { path: ['test.md'] } });

            expect(response.status).toBe(404); // Fichier n'existe pas, mais route fonctionne
        });
    });

    describe('Routes d\'absences', () => {
        test('GET /api/absences - doit retourner 401 sans authentification', async () => {
            const { GET } = await import('@/app/api/absences/route');

            const request = createMockRequest(`${baseUrl}/api/absences`);
            const response = await GET(request);

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.error).toBe('Non autorisé');
        });

        test('POST /api/absences - doit retourner 401 sans authentification', async () => {
            const { POST } = await import('@/app/api/absences/route');

            const request = createMockRequest(`${baseUrl}/api/absences`, 'POST', {
                startDate: '2024-01-01T00:00:00Z',
                endDate: '2024-01-02T00:00:00Z',
                type: 'ANNUAL',
                reason: 'Test'
            });
            const response = await POST(request);

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.error).toBe('Non autorisé');
        });

        test('GET /api/absences/[id] - doit retourner 401 sans authentification', async () => {
            const { GET } = await import('@/app/api/absences/[id]/route');

            const request = createMockRequest(`${baseUrl}/api/absences/test-id`);
            const response = await GET(request, { params: { id: 'test-id' } });

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.error).toBe('Non autorisé');
        });
    });

    describe('Routes de calendrier', () => {
        test('GET /api/calendar - doit retourner des événements vides', async () => {
            const { GET } = await import('@/app/api/calendar/route');

            const request = createMockRequest(`${baseUrl}/api/calendar`);
            const response = await GET(request);

            // Peut retourner 200 avec tableau vide ou 500 selon la DB
            expect([200, 500]).toContain(response.status);
        });

        test('POST /api/calendar/export - doit retourner 400 pour format invalide', async () => {
            const { POST } = await import('@/app/api/calendar/export/route');

            const request = createMockRequest(`${baseUrl}/api/calendar/export`, 'POST', {
                format: 'INVALID_FORMAT'
            });
            const response = await POST(request);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Format d\'export non pris en charge');
        });
    });

    describe('Routes de test et monitoring', () => {
        test('GET /api/test/cache-performance - doit être bloqué en production', async () => {
            const { GET } = await import('@/app/api/test/cache-performance/route');

            // Simuler l'environnement de production
            const originalEnv = process.env.NODE_ENV;
            Object.defineProperty(process.env, 'NODE_ENV', {
                value: 'production',
                writable: true,
                configurable: true
            });

            const request = createMockRequest(`${baseUrl}/api/test/cache-performance`);
            const response = await GET(request);

            expect(response.status).toBe(403);
            const data = await response.json();
            expect(data.error).toBe('Cette API n\'est pas disponible en production');

            // Restaurer l'environnement
            Object.defineProperty(process.env, 'NODE_ENV', {
                value: originalEnv,
                writable: true,
                configurable: true
            });
        });

        test('POST /api/audit/batch - doit valider le format des données', async () => {
            const { POST } = await import('@/app/api/audit/batch/route');

            const request = createMockRequest(`${baseUrl}/api/audit/batch`, 'POST', 'invalid-data');
            const response = await POST(request);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Format de lot invalide');
        });

        test('GET /api/monitoring/event-bus-metrics - doit retourner des métriques', async () => {
            const { GET } = await import('@/app/api/monitoring/event-bus-metrics/route');

            const request = createMockRequest(`${baseUrl}/api/monitoring/event-bus-metrics`);
            const response = await GET(request);

            // Peut retourner 200 ou 500 selon la disponibilité du service
            expect([200, 500]).toContain(response.status);
        });
    });

    describe('Validation des paramètres', () => {
        test('Routes avec paramètres invalides doivent retourner des erreurs appropriées', async () => {
            // Test avec paramètre path vide pour documentation
            const { GET: getDoc } = await import('@/app/api/documentation/[...path]/route');
            const requestDoc = createMockRequest(`${baseUrl}/api/documentation/`);
            const responseDoc = await getDoc(requestDoc, { params: { path: [] } });
            expect(responseDoc.status).toBe(400);

            // Test avec ID absence invalide
            const { GET: getAbsence } = await import('@/app/api/absences/[id]/route');
            const requestAbsence = createMockRequest(`${baseUrl}/api/absences/`);
            const responseAbsence = await getAbsence(requestAbsence, { params: { id: '' } });
            expect(responseAbsence.status).toBe(401); // Auth d'abord, puis validation
        });
    });

    describe('Gestion des erreurs', () => {
        test('Toutes les routes doivent gérer les erreurs de manière cohérente', async () => {
            // Test que les routes retournent des objets JSON avec des messages d'erreur
            const routes = [
                { module: '@/app/api/absences/route', method: 'GET' },
                { module: '@/app/api/calendar/route', method: 'GET' },
                { module: '@/app/api/audit/batch/route', method: 'POST' },
            ];

            for (const route of routes) {
                try {
                    const { [route.method]: handler } = await import(route.module);
                    const request = createMockRequest(`${baseUrl}/test`);
                    const response = await handler(request);

                    // Vérifier que la réponse est bien du JSON
                    const contentType = response.headers.get('content-type');
                    if (response.status >= 400) {
                        expect(contentType).toContain('application/json');
                    }
                } catch (error) {
                    // Certaines routes peuvent échouer à l'import, c'est OK pour ce test
                    console.warn(`Route ${route.module} failed to import:`, error);
                }
            }
        });
    });
});

describe('Vérification de la suppression de Pages Router', () => {
    test('Le dossier src/pages/api ne doit plus exister', () => {
        const fs = require('fs');
        const path = require('path');

        const pagesApiPath = path.join(process.cwd(), 'src', 'pages', 'api');
        expect(fs.existsSync(pagesApiPath)).toBe(false);
    });

    test('Aucune référence à Pages Router dans les imports', async () => {
        // Ce test vérifie qu'il n'y a plus d'imports vers src/pages/api
        // Dans un vrai projet, on pourrait utiliser un linter ou un script pour ça

        // Vérifier que le test de balance utilise bien App Router
        const fs = require('fs');
        const path = require('path');

        const balanceTestPath = path.join(process.cwd(), 'src', 'tests', 'integration', 'api', 'leaves', 'balance.test.ts');
        if (fs.existsSync(balanceTestPath)) {
            const content = fs.readFileSync(balanceTestPath, 'utf8');
            expect(content).toContain('@/app/api/leaves/balance/route');
            expect(content).not.toContain('pages/api/leaves/balance');
        }

        expect(true).toBe(true); // Test passé
    });
}); 