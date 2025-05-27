/**
 * Tests pour le hook useAuth et le contexte d'authentification
 * Objectif : 75% de couverture
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';

// Mock des dépendances AVANT les imports
jest.mock('axios');
jest.mock('next/navigation');
jest.mock('@/lib/auth-client-utils');

// Imports après les mocks
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth, AuthProvider } from '@/context/AuthContext';
import {
    getClientAuthToken,
    setClientAuthToken,
    removeClientAuthToken
} from '@/lib/auth-client-utils';

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockedGetClientAuthToken = getClientAuthToken as jest.MockedFunction<typeof getClientAuthToken>;
const mockedSetClientAuthToken = setClientAuthToken as jest.MockedFunction<typeof setClientAuthToken>;
const mockedRemoveClientAuthToken = removeClientAuthToken as jest.MockedFunction<typeof removeClientAuthToken>;

// Helper pour wrapper le hook avec AuthProvider
const createWrapper = () => {
    return ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
    );
};

describe('useAuth Hook', () => {
    const mockPush = jest.fn();
    const mockUser = {
        id: 1,
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@test.com',
        role: 'USER',
        actif: true,
        login: 'jean.dupont',
        password: 'hashed-password',
        professionalRole: 'MAR' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        // Réinitialiser tous les mocks
        jest.clearAllMocks();

        // Mock router
        mockedUseRouter.mockReturnValue({
            push: mockPush,
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
            replace: jest.fn(),
            prefetch: jest.fn(),
        } as any);

        // Mock axios interceptors
        mockedAxios.interceptors = {
            request: { use: jest.fn(), eject: jest.fn() },
            response: { use: jest.fn(), eject: jest.fn() },
        } as any;

        // Mock token par défaut
        mockedGetClientAuthToken.mockReturnValue(null);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('État initial', () => {
        it('devrait initialiser avec un état de chargement', () => {
            // Arrange
            mockedGetClientAuthToken.mockReturnValue(null);

            // Act
            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            // Assert
            expect(result.current.user).toBeNull();
            expect(result.current.isLoading).toBe(true);
            expect(result.current.isAuthenticated).toBe(false);
        });

        it('devrait lever une erreur si utilisé hors du AuthProvider', () => {
            // Arrange
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            // Act & Assert
            expect(() => {
                renderHook(() => useAuth());
            }).toThrow("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
            
            // Cleanup
            consoleSpy.mockRestore();
        });
    });

    describe('Authentification automatique', () => {
        it('devrait récupérer l\'utilisateur si un token existe', async () => {
            // Arrange
            const token = 'valid-token';
            mockedGetClientAuthToken.mockReturnValue(token);
            mockedAxios.get.mockResolvedValue({
                data: { user: mockUser }
            });

            // Act
            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            // Assert
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.user).toEqual(mockUser);
            expect(result.current.isAuthenticated).toBe(true);
            expect(mockedAxios.get).toHaveBeenCalledWith('/api/auth/me');
        });

        it('devrait gérer les erreurs de récupération d\'utilisateur', async () => {
            // Arrange
            const token = 'invalid-token';
            mockedGetClientAuthToken.mockReturnValue(token);
            mockedAxios.get.mockRejectedValue(new Error('Unauthorized'));

            // Act
            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            // Assert
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.user).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
        });

        it('devrait utiliser le cache pour éviter les requêtes redondantes', async () => {
            // Arrange
            const token = 'cached-token';
            mockedGetClientAuthToken.mockReturnValue(token);
            mockedAxios.get.mockResolvedValue({
                data: { user: mockUser }
            });

            // Act - Premier appel
            const { result: result1 } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result1.current.isLoading).toBe(false);
            });

            // Réinitialiser les mocks
            mockedAxios.get.mockClear();

            // Act - Deuxième appel immédiat
            const { result: result2 } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            // Assert - Le cache devrait être utilisé
            await waitFor(() => {
                expect(result2.current.isLoading).toBe(false);
            });

            expect(result2.current.user).toEqual(mockUser);
            // La deuxième requête ne devrait pas être faite grâce au cache
            expect(mockedAxios.get).not.toHaveBeenCalled();
        });
    });

    describe('Connexion', () => {
        it('devrait connecter un utilisateur avec des identifiants valides', async () => {
            // Arrange
            const credentials = { login: 'jean.dupont', password: 'password123' };
            const loginResponse = {
                data: {
                    token: 'new-token',
                    user: mockUser
                }
            };

            mockedAxios.post.mockResolvedValue(loginResponse);

            // Act
            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            await act(async () => {
                await result.current.login(credentials);
            });

            // Assert
            expect(mockedAxios.post).toHaveBeenCalledWith(
                '/api/auth/connexion',
                credentials,
                expect.objectContaining({
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000,
                })
            );
            expect(mockedSetClientAuthToken).toHaveBeenCalledWith('new-token');
            expect(result.current.user).toEqual(mockUser);
            expect(result.current.isAuthenticated).toBe(true);
            expect(mockPush).toHaveBeenCalledWith('/');
        });

        it('devrait gérer les erreurs de connexion', async () => {
            // Arrange
            const credentials = { login: 'invalid', password: 'wrong' };
            mockedAxios.post.mockRejectedValue(new Error('Unauthorized'));

            // Act
            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            // Assert
            await expect(async () => {
                await act(async () => {
                    await result.current.login(credentials);
                });
            }).rejects.toThrow('Identifiants incorrects');

            expect(result.current.user).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
        });

        it('devrait gérer les réponses sans token', async () => {
            // Arrange
            const credentials = { login: 'test', password: 'test' };
            const loginResponse = {
                data: { user: mockUser } // Pas de token
            };

            mockedAxios.post.mockResolvedValue(loginResponse);

            // Act
            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            await act(async () => {
                await result.current.login(credentials);
            });

            // Assert
            expect(mockedSetClientAuthToken).not.toHaveBeenCalled();
            expect(result.current.user).toEqual(mockUser);
        });
    });

    describe('Déconnexion', () => {
        it('devrait déconnecter l\'utilisateur et nettoyer l\'état', async () => {
            // Arrange
            mockedAxios.post.mockResolvedValue({ data: {} });

            // Act
            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            // Simuler un utilisateur connecté et la déconnexion
            await act(async () => {
                await result.current.login({
                    login: 'test',
                    password: 'test'
                });
                // Attendre un peu pour s'assurer que l'état est mis à jour
                await new Promise(resolve => setTimeout(resolve, 0));
                await result.current.logout();
            });

            // Assert
            expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/deconnexion');
            expect(mockedRemoveClientAuthToken).toHaveBeenCalled();
            expect(result.current.user).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
            expect(mockPush).toHaveBeenCalledWith('/auth/connexion');
        });

        it('devrait gérer les erreurs de déconnexion côté serveur', async () => {
            // Arrange
            mockedAxios.post.mockRejectedValue(new Error('Server error'));

            // Act
            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            await act(async () => {
                await result.current.logout();
            });

            // Assert - Même en cas d'erreur, le nettoyage local doit se faire
            expect(mockedRemoveClientAuthToken).toHaveBeenCalled();
            expect(result.current.user).toBeNull();
            expect(mockPush).toHaveBeenCalledWith('/auth/connexion');
        });
    });

    describe('refetchUser', () => {
        it('devrait recharger les données utilisateur', async () => {
            // Arrange
            const token = 'test-token';
            mockedGetClientAuthToken.mockReturnValue(token);
            mockedAxios.get.mockResolvedValue({
                data: { user: mockUser }
            });

            // Act
            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            await act(async () => {
                const user = await result.current.refetchUser();
                expect(user).toEqual(mockUser);
            });

            // Assert
            expect(result.current.user).toEqual(mockUser);
            expect(mockedAxios.get).toHaveBeenCalledWith('/api/auth/me');
        });

        it('devrait retourner null si aucun token', async () => {
            // Arrange
            mockedGetClientAuthToken.mockReturnValue(null);

            // Act
            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            await act(async () => {
                const user = await result.current.refetchUser();
                expect(user).toBeNull();
            });

            // Assert
            expect(result.current.user).toBeNull();
            expect(mockedAxios.get).not.toHaveBeenCalled();
        });
    });

    describe('Intercepteurs Axios', () => {
        it('devrait configurer les intercepteurs une seule fois', () => {
            // Act - Créer plusieurs instances du provider
            renderHook(() => useAuth(), { wrapper: createWrapper() });
            renderHook(() => useAuth(), { wrapper: createWrapper() });

            // Assert - Les intercepteurs ne doivent être configurés qu'une fois
            expect(mockedAxios.interceptors.request.use).toHaveBeenCalledTimes(1);
            expect(mockedAxios.interceptors.response.use).toHaveBeenCalledTimes(1);
        });

        it('devrait ajouter le token aux en-têtes des requêtes', () => {
            // Arrange
            const token = 'test-token';
            mockedGetClientAuthToken.mockReturnValue(token);

            // Act
            renderHook(() => useAuth(), { wrapper: createWrapper() });

            // Récupérer la fonction de l'intercepteur de requête
            const requestInterceptor = (mockedAxios.interceptors.request.use as jest.Mock)
                .mock.calls[0][0] as (config: any) => any;

            const config = { headers: {}, url: '/api/test' };
            const modifiedConfig = requestInterceptor(config);

            // Assert
            expect(modifiedConfig.headers.Authorization).toBe(`Bearer ${token}`);
        });

        it('devrait ajouter un timestamp pour les APIs critiques', () => {
            // Arrange
            renderHook(() => useAuth(), { wrapper: createWrapper() });

            const requestInterceptor = (mockedAxios.interceptors.request.use as jest.Mock)
                .mock.calls[0][0] as (config: any) => any;

            // Act
            const config = { url: '/api/auth/me', headers: {} };
            const modifiedConfig = requestInterceptor(config);

            // Assert
            expect(modifiedConfig.url).toMatch(/\/api\/auth\/me\?_t=\d+/);
        });

        it('devrait nettoyer le cache sur erreur 401', () => {
            // Arrange
            renderHook(() => useAuth(), { wrapper: createWrapper() });

            const responseInterceptor = (mockedAxios.interceptors.response.use as jest.Mock)
                .mock.calls[0][1] as (error: any) => Promise<any>;

            // Act
            const error = {
                response: { status: 401 }
            };

            expect(() => responseInterceptor(error)).rejects.toEqual(error);

            // Assert
            expect(mockedRemoveClientAuthToken).toHaveBeenCalled();
        });
    });

    describe('Tests de performance', () => {
        it('devrait gérer la connexion en moins de 100ms', async () => {
            // Arrange
            const startTime = Date.now();
            const credentials = { login: 'test', password: 'test' };
            mockedAxios.post.mockResolvedValue({
                data: { token: 'token', user: mockUser }
            });

            // Act
            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            await act(async () => {
                await result.current.login(credentials);
            });

            const endTime = Date.now();

            // Assert
            expect(endTime - startTime).toBeLessThan(100);
        });

        it('devrait gérer efficacement plusieurs appels refetchUser', async () => {
            // Arrange
            const token = 'test-token';
            mockedGetClientAuthToken.mockReturnValue(token);
            mockedAxios.get.mockResolvedValue({
                data: { user: mockUser }
            });

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            // Act - Multiples appels simultanés dans un seul act
            await act(async () => {
                const promises = Array.from({ length: 10 }, () =>
                    result.current.refetchUser()
                );
                await Promise.all(promises);
            });

            // Assert - Grâce au cache, une seule requête devrait être faite
            expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        });
    });

    describe('Gestion des erreurs', () => {
        it('devrait gérer les erreurs réseau gracieusement', async () => {
            // Arrange
            const token = 'test-token';
            mockedGetClientAuthToken.mockReturnValue(token);
            mockedAxios.get.mockRejectedValue(new Error('Network Error'));

            // Act
            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            // Assert
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.user).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
        });

        it('devrait gérer les timeouts de connexion', async () => {
            // Arrange
            const credentials = { login: 'test', password: 'test' };
            mockedAxios.post.mockRejectedValue(new Error('Timeout'));

            // Act
            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            // Assert
            await expect(async () => {
                await act(async () => {
                    await result.current.login(credentials);
                });
            }).rejects.toThrow('Identifiants incorrects');
        });

        it('devrait gérer les réponses malformées', async () => {
            // Arrange
            const credentials = { login: 'test', password: 'test' };
            mockedAxios.post.mockResolvedValue({
                data: null // Réponse malformée
            });

            // Act
            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            await act(async () => {
                await result.current.login(credentials);
            });

            // Assert - Devrait gérer gracieusement
            expect(result.current.user).toBeNull();
        });
    });
}); 