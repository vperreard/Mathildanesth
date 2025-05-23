import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../../middleware';
import { checkUserRole, getAuthTokenServer, verifyAuthToken } from '@/lib/auth-server-utils';

// Mocks
jest.mock('@/lib/auth-server-utils');
jest.mock('next/server', () => {
    const originalModule = jest.requireActual('next/server');
    return {
        ...originalModule,
        NextResponse: {
            next: jest.fn().mockReturnValue({ headers: new Headers() }),
            redirect: jest.fn().mockImplementation((url) => ({
                url,
                headers: new Headers()
            }))
        }
    };
});

describe('Middleware d\'authentification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Fonctions utiles pour les tests
    const createMockRequest = (path: string, headers: Record<string, string> = {}, cookies: Record<string, string> = {}) => {
        const headersObj = new Headers();
        Object.entries(headers).forEach(([key, value]) => {
            headersObj.append(key, value);
        });

        // Mock des cookies
        const cookiesMap = new Map<string, string>();
        Object.entries(cookies).forEach(([key, value]) => {
            cookiesMap.set(key, value);
        });

        return {
            nextUrl: {
                pathname: path,
                searchParams: new URLSearchParams(),
                origin: 'http://localhost:3000',
                toString: () => `http://localhost:3000${path}`
            },
            headers: headersObj,
            cookies: {
                get: (name: string) => cookiesMap.get(name) ? { name, value: cookiesMap.get(name) } : undefined
            }
        } as unknown as NextRequest;
    };

    it('autorise les requêtes à l\'API WebSocket sans authentification', async () => {
        // Configurer le mock
        (getAuthTokenServer as jest.Mock).mockResolvedValue(null);

        // Créer une requête WebSocket
        const req = createMockRequest('/api/ws');

        // Exécuter le middleware
        await middleware(req);

        // Vérifier qu'on n'a pas redirigé
        expect(NextResponse.redirect).not.toHaveBeenCalled();
        // Vérifier qu'on a laissé passer
        expect(NextResponse.next).toHaveBeenCalled();
    });

    it('ajoute le token aux en-têtes pour les demandes WebSocket authentifiées', async () => {
        // Configurer le mock - simuler un token valide
        const mockToken = 'valid-middleware-token';
        (getAuthTokenServer as jest.Mock).mockResolvedValue(mockToken);
        (verifyAuthToken as jest.Mock).mockResolvedValue({
            authenticated: true,
            userId: 123,
            role: 'USER'
        });

        // Créer une requête WebSocket authentifiée avec cookie
        const req = createMockRequest('/api/ws', {}, {
            'auth_token': mockToken
        });

        // Exécuter le middleware
        await middleware(req);

        // Vérifier qu'on a laissé passer
        expect(NextResponse.next).toHaveBeenCalled();

        // Vérifier que le token est ajouté à l'en-tête pour les WebSockets
        const nextResponse = (NextResponse.next as jest.Mock).mock.results[0].value;
        expect(nextResponse.headers.get('X-Auth-Token')).toBe(mockToken);
    });

    it('gère correctement un utilisateur non authentifié sur une route protégée', async () => {
        // Configurer les mocks - pas de token
        (getAuthTokenServer as jest.Mock).mockResolvedValue(null);
        (checkUserRole as jest.Mock).mockResolvedValue({
            hasRequiredRole: false,
            user: null,
            error: 'Token non fourni ou non récupérable'
        });

        // Créer une requête à une route protégée
        const req = createMockRequest('/planning/hebdomadaire');

        // Exécuter le middleware
        await middleware(req);

        // Vérifier qu'on redirige vers la connexion
        expect(NextResponse.redirect).toHaveBeenCalledWith(
            expect.stringContaining('/login')
        );
    });

    it('autorise l\'accès WebSocket pour les utilisateurs authentifiés', async () => {
        // Configurer les mocks - token valide
        const mockToken = 'valid-admin-token';
        (getAuthTokenServer as jest.Mock).mockResolvedValue(mockToken);
        (verifyAuthToken as jest.Mock).mockResolvedValue({
            authenticated: true,
            userId: 456,
            role: 'ADMIN'
        });
        (checkUserRole as jest.Mock).mockResolvedValue({
            hasRequiredRole: true,
            user: { id: 456, role: 'ADMIN' },
            error: null
        });

        // Créer une requête WebSocket avec cookie et header d'upgrade
        const req = createMockRequest('/api/ws', {
            'Upgrade': 'websocket'
        }, {
            'auth_token': mockToken
        });

        // Exécuter le middleware
        await middleware(req);

        // Vérifier qu'on a laissé passer
        expect(NextResponse.next).toHaveBeenCalled();

        // Vérifier que le token est préservé
        const nextResponse = (NextResponse.next as jest.Mock).mock.results[0].value;
        expect(nextResponse.headers.get('X-Auth-Token')).toBe(mockToken);
    });

    it('permet l\'accès à la route du webhook contextuel-messages même sans authentification', async () => {
        // Configurer les mocks - pas de token
        (getAuthTokenServer as jest.Mock).mockResolvedValue(null);

        // Créer une requête au webhook
        const req = createMockRequest('/api/contextual-messages/webhook');

        // Exécuter le middleware
        await middleware(req);

        // Vérifier qu'on a laissé passer sans redirection
        expect(NextResponse.redirect).not.toHaveBeenCalled();
        expect(NextResponse.next).toHaveBeenCalled();
    });

    it('effectue un enrichissement des en-têtes pour le socket.io polling', async () => {
        // Configurer les mocks - token valide
        const mockToken = 'valid-polling-token';
        (getAuthTokenServer as jest.Mock).mockResolvedValue(mockToken);
        (verifyAuthToken as jest.Mock).mockResolvedValue({
            authenticated: true,
            userId: 789,
            role: 'USER'
        });

        // Créer une requête pour le socket.io polling avec cookie et header de connection
        const req = createMockRequest('/api/socket.io/', {
            'Connection': 'keep-alive'
        }, {
            'auth_token': mockToken
        });

        // Exécuter le middleware
        await middleware(req);

        // Vérifier qu'on a laissé passer
        expect(NextResponse.next).toHaveBeenCalled();

        // Vérifier que les en-têtes sont enrichis pour le polling
        const nextResponse = (NextResponse.next as jest.Mock).mock.results[0].value;
        expect(nextResponse.headers.get('X-Auth-Token')).toBe(mockToken);
        expect(nextResponse.headers.get('X-User-ID')).toBe('789');
    });
}); 