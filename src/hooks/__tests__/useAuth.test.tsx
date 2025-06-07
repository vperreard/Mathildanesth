import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { AuthProvider } from '@/context/AuthContext';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock auth-client-utils
jest.mock('@/lib/auth-client-utils', () => ({
  getClientAuthToken: jest.fn(),
  setClientAuthToken: jest.fn(),
  removeClientAuthToken: jest.fn(),
}));

// Mock console methods to reduce noise
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

describe('useAuth', () => {
  const mockPush = jest.fn();
  const mockUser = {
    id: 1,
    login: 'testuser',
    email: 'test@example.com',
    nom: 'User',
    prenom: 'Test',
    role: 'USER',
    actif: true,
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    
    // Reset auth client utils mocks
    const { getClientAuthToken, setClientAuthToken, removeClientAuthToken } = require('@/lib/auth-client-utils');
    (getClientAuthToken as jest.Mock).mockReset();
    (setClientAuthToken as jest.Mock).mockReset();
    (removeClientAuthToken as jest.Mock).mockReset();
    
    // Setup axios interceptors mock
    mockedAxios.interceptors = {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    } as any;
    
    // Reset axios mocks
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset();
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      const { getClientAuthToken } = require('@/lib/auth-client-utils');
      (getClientAuthToken as jest.Mock).mockReturnValue(null);
      mockedAxios.get.mockRejectedValue({ response: { status: 401 } });
    });

    it('should return unauthenticated state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for the initial load to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle login successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { token: 'mock-token', user: mockUser },
      });
      mockedAxios.get.mockResolvedValueOnce({
        data: mockUser,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login({ login: 'testuser', password: 'password' });
      });

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/login', {
        login: 'testuser',
        password: 'password',
      }, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle login failure', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: { data: { error: 'Invalid credentials' } },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.login({ login: 'testuser', password: 'wrong-password' });
        })
      ).rejects.toThrow();

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      const { getClientAuthToken } = require('@/lib/auth-client-utils');
      (getClientAuthToken as jest.Mock).mockReturnValue('mock-token');
      mockedAxios.get.mockResolvedValue({ data: { user: mockUser } });
    });

    it('should return authenticated state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle logout', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { message: 'Logged out' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3000/api/auth/deconnexion');
      expect(mockPush).toHaveBeenCalledWith('/auth/connexion');
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('refetchUser', () => {
    it('should refetch user data', async () => {
      const { getClientAuthToken } = require('@/lib/auth-client-utils');
      (getClientAuthToken as jest.Mock).mockReturnValue('mock-token');
      
      const updatedUser = { ...mockUser, nom: 'Updated' };
      mockedAxios.get
        .mockResolvedValueOnce({ data: { user: mockUser } })
        .mockResolvedValueOnce({ data: { user: updatedUser } });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.user).toEqual(mockUser);

      await act(async () => {
        const user = await result.current.refetchUser();
        expect(user).toEqual(updatedUser);
      });

      expect(result.current.user).toEqual(updatedUser);
    });

    it('should handle refetch when no token exists', async () => {
      const { getClientAuthToken } = require('@/lib/auth-client-utils');
      (getClientAuthToken as jest.Mock).mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        const user = await result.current.refetchUser();
        expect(user).toBeNull();
      });

      expect(result.current.user).toBeNull();
    });

    it('should handle cached user data', async () => {
      const { getClientAuthToken } = require('@/lib/auth-client-utils');
      (getClientAuthToken as jest.Mock).mockReturnValue('cached-token');
      
      // First call to setup cache
      mockedAxios.get.mockResolvedValueOnce({ data: { user: mockUser } });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Second call should use cache (same token)
      await act(async () => {
        const user = await result.current.refetchUser();
        expect(user).toEqual(mockUser);
      });

      // Should only call once due to caching
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should handle network errors during login', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.login({ login: 'testuser', password: 'password' });
        })
      ).rejects.toThrow('Identifiants incorrects');
    });

    it('should handle logout API errors gracefully', async () => {
      const { getClientAuthToken } = require('@/lib/auth-client-utils');
      (getClientAuthToken as jest.Mock).mockReturnValue('mock-token');
      mockedAxios.get.mockResolvedValue({ data: { user: mockUser } });
      mockedAxios.post.mockRejectedValueOnce(new Error('Server error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should complete logout despite API error
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(mockPush).toHaveBeenCalledWith('/auth/connexion');
    });

    it('should handle 401 errors during user fetch', async () => {
      const { getClientAuthToken } = require('@/lib/auth-client-utils');
      (getClientAuthToken as jest.Mock).mockReturnValue('invalid-token');
      mockedAxios.get.mockRejectedValue({ response: { status: 401 } });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('login with redirect', () => {
    it('should redirect to custom URL when provided', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { 
          token: 'mock-token', 
          user: mockUser, 
          redirectUrl: '/custom-dashboard' 
        },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login({ login: 'testuser', password: 'password' });
      });

      expect(mockPush).toHaveBeenCalledWith('/custom-dashboard');
    });

    it('should use default redirect when no custom URL provided', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { 
          token: 'mock-token', 
          user: mockUser 
        },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login({ login: 'testuser', password: 'password' });
      });

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});