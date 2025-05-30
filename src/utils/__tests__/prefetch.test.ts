import {
    prefetchData,
    prefetchCommonData,
    prefetchRoutes,
    prefetchMainRoutes,
    prefetchUserData,
    prefetchCriticalAssets
} from '../prefetch';
import { getClientAuthToken } from '@/lib/auth-client-utils';

// Mock dependencies
jest.mock('@/lib/auth-client-utils');
const mockGetClientAuthToken = getClientAuthToken as jest.MockedFunction<typeof getClientAuthToken>;

// Mock fetch
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock console methods
const consoleSpy = {
    error: jest.spyOn(console, 'error').mockImplementation(),
    log: jest.spyOn(console, 'log').mockImplementation(),
    warn: jest.spyOn(console, 'warn').mockImplementation()
};

// Mock document methods for DOM manipulation
const mockDocument = {
    createElement: jest.fn(),
    head: {
        appendChild: jest.fn()
    }
};

Object.defineProperty(global, 'document', {
    value: mockDocument,
    writable: true
});

describe('Prefetch utilities', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockFetch.mockClear();
        mockGetClientAuthToken.mockClear();
        Object.values(consoleSpy).forEach(spy => spy.mockClear());
        mockDocument.createElement.mockClear();
        mockDocument.head.appendChild.mockClear();
    });

    describe('prefetchData', () => {
        it('should fetch data with authentication token', async () => {
            const mockData = { id: 1, name: 'Test' };
            const mockToken = 'test-token';
            
            mockGetClientAuthToken.mockReturnValue(mockToken);
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockData)
            } as Response);

            const result = await prefetchData<typeof mockData>('/api/test');

            expect(mockFetch).toHaveBeenCalledWith('/api/test', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${mockToken}`
                },
                next: { revalidate: 60 }
            });
            expect(result).toEqual(mockData);
        });

        it('should fetch data without token when not authenticated', async () => {
            const mockData = { data: 'test' };
            
            mockGetClientAuthToken.mockReturnValue(null);
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockData)
            } as Response);

            const result = await prefetchData<typeof mockData>('/api/public');

            expect(mockFetch).toHaveBeenCalledWith('/api/public', {
                headers: {
                    'Content-Type': 'application/json'
                },
                next: { revalidate: 60 }
            });
            expect(result).toEqual(mockData);
        });

        it('should throw error for non-ok response', async () => {
            mockGetClientAuthToken.mockReturnValue('token');
            mockFetch.mockResolvedValue({
                ok: false,
                status: 404
            } as Response);

            await expect(prefetchData('/api/not-found')).rejects.toThrow('Erreur HTTP: 404');
            expect(consoleSpy.error).toHaveBeenCalledWith(
                'Erreur de préchargement pour /api/not-found:',
                expect.any(Error)
            );
        });

        it('should handle network errors', async () => {
            mockGetClientAuthToken.mockReturnValue('token');
            mockFetch.mockRejectedValue(new Error('Network error'));

            await expect(prefetchData('/api/error')).rejects.toThrow('Network error');
            expect(consoleSpy.error).toHaveBeenCalledWith(
                'Erreur de préchargement pour /api/error:',
                expect.any(Error)
            );
        });
    });

    describe('prefetchCommonData', () => {
        it('should prefetch common data when authenticated', async () => {
            mockGetClientAuthToken.mockReturnValue('test-token');
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({})
            } as Response);

            // Execute the function
            prefetchCommonData();

            // Wait for Promise.allSettled to complete
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockFetch).toHaveBeenCalledWith('/api/utilisateurs', expect.any(Object));
            expect(mockFetch).toHaveBeenCalledWith('/api/skills', expect.any(Object));
        });

        it('should not prefetch when not authenticated', () => {
            mockGetClientAuthToken.mockReturnValue(null);

            prefetchCommonData();

            expect(mockFetch).not.toHaveBeenCalled();
            expect(consoleSpy.log).toHaveBeenCalledWith('Aucun token disponible, préchargement ignoré');
        });

        it('should handle prefetch failures gracefully', async () => {
            mockGetClientAuthToken.mockReturnValue('test-token');
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({})
                } as Response)
                .mockRejectedValueOnce(new Error('API Error'));

            prefetchCommonData();

            // Wait for Promise.allSettled to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(consoleSpy.warn).toHaveBeenCalledWith(
                'Préchargement #1 échoué:',
                expect.any(Error)
            );
        });
    });

    describe('prefetchRoutes', () => {
        it('should prefetch routes with authentication token', () => {
            const routes = ['/route1', '/route2', '/route3'];
            mockGetClientAuthToken.mockReturnValue('test-token');
            mockFetch.mockResolvedValue({} as Response);

            prefetchRoutes(routes);

            routes.forEach(route => {
                expect(mockFetch).toHaveBeenCalledWith(route, {
                    headers: {
                        Authorization: 'Bearer test-token'
                    },
                    priority: 'low'
                });
            });
        });

        it('should prefetch routes without token when not authenticated', () => {
            const routes = ['/public1', '/public2'];
            mockGetClientAuthToken.mockReturnValue(null);
            mockFetch.mockResolvedValue({} as Response);

            prefetchRoutes(routes);

            routes.forEach(route => {
                expect(mockFetch).toHaveBeenCalledWith(route, {
                    headers: {},
                    priority: 'low'
                });
            });
        });

        it('should handle fetch errors silently', () => {
            const routes = ['/error-route'];
            mockGetClientAuthToken.mockReturnValue('token');
            mockFetch.mockRejectedValue(new Error('Fetch error'));

            expect(() => prefetchRoutes(routes)).not.toThrow();
        });

        it('should handle empty routes array', () => {
            mockGetClientAuthToken.mockReturnValue('token');

            expect(() => prefetchRoutes([])).not.toThrow();
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe('prefetchMainRoutes', () => {
        it('should prefetch main application routes', () => {
            mockGetClientAuthToken.mockReturnValue('test-token');
            mockFetch.mockResolvedValue({} as Response);

            prefetchMainRoutes();

            const expectedRoutes = [
                '/utilisateurs',
                '/calendrier',
                '/planning/hebdomadaire',
                '/conges',
                '/parametres'
            ];

            expectedRoutes.forEach(route => {
                expect(mockFetch).toHaveBeenCalledWith(route, expect.any(Object));
            });
        });
    });

    describe('prefetchUserData', () => {
        it('should prefetch user-specific data when authenticated', async () => {
            const userId = 'user123';
            mockGetClientAuthToken.mockReturnValue('test-token');
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({})
            } as Response);

            prefetchUserData(userId);

            // Wait for Promise.allSettled to complete
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockFetch).toHaveBeenCalledWith(`/api/utilisateurs/${userId}`, expect.any(Object));
        });

        it('should not prefetch when userId is empty', () => {
            mockGetClientAuthToken.mockReturnValue('test-token');

            prefetchUserData('');

            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('should not prefetch when not authenticated', () => {
            mockGetClientAuthToken.mockReturnValue(null);

            prefetchUserData('user123');

            expect(mockFetch).not.toHaveBeenCalled();
            expect(consoleSpy.log).toHaveBeenCalledWith('Aucun token disponible, préchargement utilisateur ignoré');
        });

        it('should handle prefetch errors gracefully', async () => {
            const userId = 'user123';
            mockGetClientAuthToken.mockReturnValue('test-token');
            mockFetch.mockRejectedValue(new Error('User API Error'));

            expect(() => prefetchUserData(userId)).not.toThrow();
        });
    });

    describe('prefetchCriticalAssets', () => {
        beforeEach(() => {
            // Reset document mock for each test
            const mockElement = {
                rel: '',
                href: '',
                as: ''
            };
            mockDocument.createElement.mockReturnValue(mockElement);
        });

        it('should create prefetch links for critical assets', () => {
            prefetchCriticalAssets();

            expect(mockDocument.createElement).toHaveBeenCalledTimes(2);
            expect(mockDocument.createElement).toHaveBeenCalledWith('link');
            expect(mockDocument.head.appendChild).toHaveBeenCalledTimes(2);
        });

        it('should set correct attributes for image assets', () => {
            const mockElement = {
                rel: '',
                href: '',
                as: ''
            };
            mockDocument.createElement.mockReturnValue(mockElement);

            prefetchCriticalAssets();

            expect(mockElement.rel).toBe('prefetch');
            expect(mockElement.as).toBe('image');
        });

        it('should handle different asset types correctly', () => {
            const mockElements: any[] = [];
            mockDocument.createElement.mockImplementation(() => {
                const element = { rel: '', href: '', as: '' };
                mockElements.push(element);
                return element;
            });

            prefetchCriticalAssets();

            // All assets in the current implementation are images
            mockElements.forEach(element => {
                expect(element.rel).toBe('prefetch');
                expect(element.as).toBe('image');
            });
        });
    });

    describe('Integration scenarios', () => {
        it('should handle authentication state changes', () => {
            // First call without auth
            mockGetClientAuthToken.mockReturnValue(null);
            prefetchCommonData();
            expect(mockFetch).not.toHaveBeenCalled();

            // Clear mocks
            mockFetch.mockClear();

            // Second call with auth
            mockGetClientAuthToken.mockReturnValue('new-token');
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({})
            } as Response);

            prefetchCommonData();
            expect(mockFetch).toHaveBeenCalled();
        });

        it('should handle concurrent prefetch operations', async () => {
            mockGetClientAuthToken.mockReturnValue('test-token');
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({})
            } as Response);

            // Execute multiple prefetch operations concurrently
            prefetchCommonData();
            prefetchMainRoutes();
            prefetchUserData('user123');

            // Wait for all operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            // Should have made multiple fetch calls
            expect(mockFetch).toHaveBeenCalledTimes(7); // 2 from common + 5 from main routes
        });

        it('should work with various URL formats', () => {
            const urls = [
                '/api/test',
                'https://example.com/api/data',
                '/nested/path/to/resource',
                '/api/v1/users?include=profile'
            ];

            mockGetClientAuthToken.mockReturnValue('test-token');
            mockFetch.mockResolvedValue({} as Response);

            prefetchRoutes(urls);

            urls.forEach(url => {
                expect(mockFetch).toHaveBeenCalledWith(url, expect.any(Object));
            });
        });

        it('should maintain request headers consistency', () => {
            const token = 'consistent-token';
            mockGetClientAuthToken.mockReturnValue(token);
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({})
            } as Response);

            // Test data prefetch
            prefetchData('/api/test');

            expect(mockFetch).toHaveBeenCalledWith('/api/test', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                next: { revalidate: 60 }
            });

            // Clear for next test
            mockFetch.mockClear();

            // Test route prefetch
            prefetchRoutes(['/test-route']);

            expect(mockFetch).toHaveBeenCalledWith('/test-route', {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                priority: 'low'
            });
        });
    });
});