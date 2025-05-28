import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '../useAuth';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation');

const mockRouter = {
  push: jest.fn(),
  refresh: jest.fn(),
};

(useRouter as jest.Mock).mockReturnValue(mockRouter);

describe('useAuth Hook', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  describe('login', () => {
    it('devrait authentifier avec succès', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'USER', name: 'Test User' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, token: 'test-token' }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
        credentials: 'include',
      });
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });

    it('devrait gérer les erreurs de login', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'wrongpassword');
        } catch (e) {
          expect(e.message).toBe('Invalid credentials');
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('devrait rediriger vers returnTo après login', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'USER', name: 'Test User' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, token: 'test-token' }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@example.com', 'password123', '/admin');
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/admin');
    });
  });

  describe('logout', () => {
    it('devrait déconnecter avec succès', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 1, email: 'test@example.com', role: 'USER' }, authenticated: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });
      
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initialize with a user
      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.user).not.toBeNull();

      await act(async () => {
        await result.current.logout();
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });

    it('devrait gérer les erreurs de logout', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.logout();
      });

      // Should still redirect even on error
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });

  describe('checkAuth', () => {
    it('devrait vérifier l\'authentification avec succès', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'ADMIN', name: 'Admin User' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, authenticated: true }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.checkAuth();
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/me', {
        credentials: 'include',
      });
    });

    it('devrait gérer l\'échec de vérification', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('devrait vérifier le rôle correctement', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'ADMIN', name: 'Admin' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, authenticated: true }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.hasRole('ADMIN')).toBe(true);
      expect(result.current.hasRole('USER')).toBe(false);
    });

    it('devrait vérifier plusieurs rôles (OR)', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'MANAGER', name: 'Manager' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, authenticated: true }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.hasRole(['ADMIN', 'MANAGER'])).toBe(true);
      expect(result.current.hasRole(['ADMIN', 'USER'])).toBe(false);
    });

    it('devrait retourner false si pas d\'utilisateur', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.hasRole('ADMIN')).toBe(false);
    });
  });

  describe('canAccess', () => {
    it('devrait vérifier l\'accès basé sur le rôle', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'ADMIN', name: 'Admin' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, authenticated: true }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.canAccess('admin')).toBe(true);
      expect(result.current.canAccess('manager')).toBe(true);
      expect(result.current.canAccess('user')).toBe(true);
    });

    it('devrait respecter la hiérarchie des rôles', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'MANAGER', name: 'Manager' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, authenticated: true }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.canAccess('admin')).toBe(false);
      expect(result.current.canAccess('manager')).toBe(true);
      expect(result.current.canAccess('user')).toBe(true);
    });
  });

  describe('Loading States', () => {
    it('devrait gérer l\'état de chargement initial', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('devrait mettre à jour l\'état de chargement après vérification', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: null, authenticated: false }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('devrait gérer les erreurs réseau', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'password');
        } catch (error) {
          expect(error.message).toBe('Network error');
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('devrait gérer les réponses invalides', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'password');
        } catch (error) {
          expect(error.message).toContain('Invalid JSON');
        }
      });
    });
  });
});