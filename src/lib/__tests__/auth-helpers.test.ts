import { getAuthToken, createAuthHeaders, fetchWithAuth } from '../auth-helpers';
import Cookies from 'js-cookie';

// Mock de js-cookie
jest.mock('js-cookie');

// Mock du localStorage
const mockLocalStorage = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        clear: jest.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true
});

// Définir la fonction fetch globale avant de la mocker
if (!global.fetch) {
    global.fetch = (() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
    })) as any;
}

// Mock de fetch avec jest.spyOn pour pouvoir utiliser mockClear
const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: 'success' })
    }) as any
);

describe('Utilitaires d\'authentification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockLocalStorage.clear();
        fetchSpy.mockClear();
    });

    describe('getAuthToken', () => {
        it('récupère le token depuis next-auth.session-token cookie', () => {
            (Cookies.get as jest.Mock).mockImplementation((name) => {
                if (name === 'next-auth.session-token') return 'token-from-nextauth-cookie';
                return null;
            });

            const token = getAuthToken({});

            expect(token).toBe('token-from-nextauth-cookie');
            expect(Cookies.get).toHaveBeenCalledWith('next-auth.session-token');
        });

        it('récupère le token depuis __Secure-next-auth.session-token cookie', () => {
            (Cookies.get as jest.Mock).mockImplementation((name) => {
                if (name === '__Secure-next-auth.session-token') return 'token-from-secure-cookie';
                return null;
            });

            const token = getAuthToken({});

            expect(token).toBe('token-from-secure-cookie');
            expect(Cookies.get).toHaveBeenCalledWith('next-auth.session-token');
            expect(Cookies.get).toHaveBeenCalledWith('__Secure-next-auth.session-token');
        });

        it('récupère le token depuis jwt_token cookie', () => {
            (Cookies.get as jest.Mock).mockImplementation((name) => {
                if (name === 'jwt_token') return 'token-from-jwt-cookie';
                return null;
            });

            const token = getAuthToken({});

            expect(token).toBe('token-from-jwt-cookie');
            expect(Cookies.get).toHaveBeenCalledWith('jwt_token');
        });

        it('récupère le token depuis session.token', () => {
            (Cookies.get as jest.Mock).mockReturnValue(null);

            const session = {
                token: 'token-from-session-token'
            };

            const token = getAuthToken(session);
            expect(token).toBe('token-from-session-token');
        });

        it('récupère le token depuis session.user.token', () => {
            (Cookies.get as jest.Mock).mockReturnValue(null);

            const session = {
                user: {
                    token: 'token-from-user-token'
                }
            };

            const token = getAuthToken(session);
            expect(token).toBe('token-from-user-token');
        });

        it('récupère le token depuis session.user.accessToken', () => {
            (Cookies.get as jest.Mock).mockReturnValue(null);

            const session = {
                user: {
                    accessToken: 'token-from-access-token'
                }
            };

            const token = getAuthToken(session);
            expect(token).toBe('token-from-access-token');
        });

        it('récupère le token depuis session.accessToken', () => {
            (Cookies.get as jest.Mock).mockReturnValue(null);

            const session = {
                accessToken: 'token-from-session-access-token'
            };

            const token = getAuthToken(session);
            expect(token).toBe('token-from-session-access-token');
        });

        it('récupère le token depuis localStorage', () => {
            (Cookies.get as jest.Mock).mockReturnValue(null);
            mockLocalStorage.setItem('auth_token', 'token-from-localstorage');

            const token = getAuthToken({});

            expect(token).toBe('token-from-localstorage');
            expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token');
        });

        it('retourne null si aucun token n\'est trouvé', () => {
            (Cookies.get as jest.Mock).mockReturnValue(null);

            const token = getAuthToken({});

            expect(token).toBeNull();
        });

        it('gère les erreurs lors de l\'accès au localStorage', () => {
            (Cookies.get as jest.Mock).mockReturnValue(null);

            // Simuler une erreur lors de l'accès au localStorage
            mockLocalStorage.getItem.mockImplementationOnce(() => {
                throw new Error('LocalStorage non disponible');
            });

            const token = getAuthToken({});

            expect(token).toBeNull();
        });
    });

    describe('createAuthHeaders', () => {
        it('crée des en-têtes HTTP avec le token d\'authentification', () => {
            (Cookies.get as jest.Mock).mockReturnValue('test-auth-token');

            const headers = createAuthHeaders({ user: { id: 1 } });

            expect(headers).toEqual({
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-auth-token'
            });
        });

        it('crée des en-têtes HTTP sans token quand aucun n\'est disponible', () => {
            (Cookies.get as jest.Mock).mockReturnValue(null);

            const headers = createAuthHeaders({});

            expect(headers).toEqual({
                'Content-Type': 'application/json'
            });
            // Utiliser une approche de vérification qui ne déclenche pas d'erreur de typage
            expect(Object.prototype.hasOwnProperty.call(headers, 'Authorization')).toBe(false);
        });
    });

    describe('fetchWithAuth', () => {
        beforeEach(() => {
    jest.clearAllMocks();
            // Réinitialiser le mock de fetch pour chaque test
            fetchSpy.mockImplementation(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ data: 'success' })
                }) as any
            );
        });

        it('appelle fetch avec les en-têtes d\'authentification', async () => {
            (Cookies.get as jest.Mock).mockReturnValue('test-token');

            const session = { user: { id: 1 } };
            await fetchWithAuth('/api/test', {}, session);

            expect(fetchSpy).toHaveBeenCalledWith('/api/test', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token'
                },
                credentials: 'include'
            });
        });

        it('fusionne les en-têtes personnalisés avec ceux d\'authentification', async () => {
            (Cookies.get as jest.Mock).mockReturnValue('test-token');

            const session = { user: { id: 1 } };
            const customOptions = {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-Custom-Header': 'custom-value'
                },
                body: JSON.stringify({ test: true })
            };

            await fetchWithAuth('/api/test', customOptions, session);

            expect(fetchSpy).toHaveBeenCalledWith('/api/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token',
                    'Accept': 'application/json',
                    'X-Custom-Header': 'custom-value'
                },
                body: JSON.stringify({ test: true }),
                credentials: 'include'
            });
        });

        it('maintient credentials: include même sans token', async () => {
            (Cookies.get as jest.Mock).mockReturnValue(null);

            const session = {};
            await fetchWithAuth('/api/test', {}, session);

            expect(fetchSpy).toHaveBeenCalledWith('/api/test', {
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
        });
    });
}); 