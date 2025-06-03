import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth, AuthProvider } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import axios, { AxiosResponse } from 'axios';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

// Mock all dependencies
jest.mock('next/navigation');
jest.mock('axios');

// Mock auth client utils
jest.mock('@/lib/auth-client-utils', () => ({
  getClientAuthToken: jest.fn(() => null),
  setClientAuthToken: jest.fn(),
  removeClientAuthToken: jest.fn(),
}));

const mockRouter = {
  push: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockUseRouter = useRouter as jest.Mock;

// Import mocked functions
const {
  getClientAuthToken,
  setClientAuthToken,
  removeClientAuthToken,
} = require('@/lib/auth-client-utils');

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  let queryClient: QueryClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Create fresh query client for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false,
          staleTime: 0,
          gcTime: 0,
        },
        mutations: { retry: false },
      },
    });

    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup router mock
    mockUseRouter.mockReturnValue(mockRouter);
    
    // Setup axios mocks with proper typing
    mockedAxios.get = jest.fn();
    mockedAxios.post = jest.fn();
    mockedAxios.interceptors = {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    } as any;

    // Setup auth utils mocks with defaults
    getClientAuthToken.mockReturnValue(null);
    setClientAuthToken.mockImplementation(() => {});
    removeClientAuthToken.mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Skip queryClient cleanup for React Query v5 compatibility
  });

  const createWrapper = () => ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );

  describe('Hook Structure and Basic Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should provide all required properties', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('refetchUser');
      expect(result.current).toHaveProperty('isAuthenticated');
    });

    it('should have correct function types', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.refetchUser).toBe('function');
      expect(typeof result.current.isAuthenticated).toBe('boolean');
    });

    it('should throw error when used outside AuthProvider', () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
    });
  });

  describe('Initial State - No Token', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should start with user null when no token', async () => {
      getClientAuthToken.mockReturnValue(null);
      
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      // Wait for initial load to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Initial State - With Token', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should fetch user when valid token is present', async () => {
      const mockUser = { id: 1, login: 'testuser', email: 'test@example.com' };
      
      getClientAuthToken.mockReturnValue('valid-token');
      
      const mockResponse: AxiosResponse = {
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      
      mockedAxios.get.mockResolvedValue(mockResponse);
      
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      // Should start in loading state
      expect(result.current.isLoading).toBe(true);

      // Wait for user to be loaded
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle user fetch errors gracefully', async () => {
      getClientAuthToken.mockReturnValue('invalid-token');
      mockedAxios.get.mockRejectedValue(new Error('Unauthorized'));
      
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.user).toBe(null);
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Login Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should login user with valid credentials', async () => {
      const mockUser = { id: 1, login: 'testuser', email: 'test@example.com' };
      const mockResponse: AxiosResponse = {
        data: {
          user: mockUser,
          token: 'new-token'
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login({ login: 'testuser', password: 'password' });
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/auth/login', 
        { login: 'testuser', password: 'password' },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );
      expect(setClientAuthToken).toHaveBeenCalledWith('new-token');
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });

    it('should handle login errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(act(async () => {
        await result.current.login({ login: 'testuser', password: 'wrong' });
      })).rejects.toThrow('Identifiants incorrects');

      expect(result.current.user).toBeNull();
    });
  });

  describe('Logout Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should logout user successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      
      mockedAxios.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3000/api/auth/deconnexion');
      expect(removeClientAuthToken).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/auth/connexion');
    });

    it('should handle logout errors gracefully', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Server error'));

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should not throw even if logout API fails
      await act(async () => {
        await result.current.logout();
      });

      expect(removeClientAuthToken).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/auth/connexion');
    });
  });

  describe('RefetchUser Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should refetch user data successfully', async () => {
      const mockUser = { id: 1, login: 'testuser', email: 'test@example.com' };
      getClientAuthToken.mockReturnValue('valid-token');
      
      const mockResponse: AxiosResponse = {
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      
      mockedAxios.get.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 3000 });

      let refetchedUser;
      await act(async () => {
        refetchedUser = await result.current.refetchUser();
      });

      expect(refetchedUser).toEqual(mockUser);
    });

    it('should return null when no token during refetch', async () => {
      getClientAuthToken.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let refetchedUser;
      await act(async () => {
        refetchedUser = await result.current.refetchUser();
      });

      expect(refetchedUser).toBeNull();
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });
  });

  describe('Authentication State', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should calculate isAuthenticated based on user presence', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initially not authenticated
      expect(result.current.isAuthenticated).toBe(false);

      // Mock successful login
      const mockUser = { id: 1, login: 'testuser', email: 'test@example.com' };
      const mockResponse: AxiosResponse = {
        data: { user: mockUser, token: 'token' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      
      mockedAxios.post.mockResolvedValue(mockResponse);

      await act(async () => {
        await result.current.login({ login: 'testuser', password: 'password' });
      });

      // Should be authenticated after login
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Axios Interceptors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should setup axios interceptors', () => {
      renderHook(() => useAuth(), { wrapper: createWrapper() });

      expect(mockedAxios.interceptors.request.use).toHaveBeenCalled();
      expect(mockedAxios.interceptors.response.use).toHaveBeenCalled();
    });

    it('should handle 401 errors by clearing auth state', async () => {
      const mockUser = { id: 1, login: 'testuser', email: 'test@example.com' };
      getClientAuthToken.mockReturnValue('expired-token');
      
      // First call succeeds (login)
      mockedAxios.get.mockResolvedValueOnce({
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate 401 error on next request
      const error401 = {
        response: { status: 401 },
        message: 'Unauthorized'
      };
      
      mockedAxios.get.mockRejectedValue(error401);

      // Try to refetch user - should trigger 401 handling
      await act(async () => {
        try {
          await result.current.refetchUser();
        } catch (error) {
          // Expected to fail
        }
      });

      expect(removeClientAuthToken).toHaveBeenCalled();
    });
  });

  describe('JWT Token Caching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    beforeEach(() => {
    jest.clearAllMocks();
      // Clear any cached data between tests
      jest.clearAllMocks();
    });

    it('should cache user data with valid JWT token', async () => {
      const mockUser = { id: 1, login: 'testuser', email: 'test@example.com' };
      const mockToken = 'valid-jwt-token';
      
      getClientAuthToken.mockReturnValue(mockToken);
      
      const mockResponse = {
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      
      mockedAxios.get.mockResolvedValue(mockResponse);

      // First render should fetch user
      const { result: result1 } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result1.current.user).toEqual(mockUser);
        expect(result1.current.isLoading).toBe(false);
      });

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);

      // Second render with same token should use cache
      const { result: result2 } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result2.current.user).toEqual(mockUser);
        expect(result2.current.isLoading).toBe(false);
      });

      // Should still only be called once due to caching
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache when token changes', async () => {
      const mockUser1 = { id: 1, login: 'user1', email: 'user1@example.com' };
      const mockUser2 = { id: 2, login: 'user2', email: 'user2@example.com' };
      
      // First token and user
      getClientAuthToken.mockReturnValue('token1');
      mockedAxios.get.mockResolvedValueOnce({
        data: { user: mockUser1 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser1);
      });

      // Change token and user
      getClientAuthToken.mockReturnValue('token2');
      mockedAxios.get.mockResolvedValueOnce({
        data: { user: mockUser2 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      // Refetch with new token
      await act(async () => {
        await result.current.refetchUser();
      });

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(result.current.user).toEqual(mockUser2);
    });

    it('should handle cache expiration correctly', async () => {
      const mockUser = { id: 1, login: 'testuser', email: 'test@example.com' };
      const mockToken = 'valid-token';
      
      getClientAuthToken.mockReturnValue(mockToken);
      
      // Mock Date.now to control cache timing
      const originalDateNow = Date.now;
      let mockTime = 1000000;
      Date.now = jest.fn(() => mockTime);

      mockedAxios.get.mockResolvedValue({
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);

      // Advance time beyond cache duration (5 minutes + 1ms)
      mockTime += 5 * 60 * 1000 + 1;

      // Refetch should make new API call
      await act(async () => {
        await result.current.refetchUser();
      });

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);

      // Restore original Date.now
      Date.now = originalDateNow;
    });
  });

  describe('Complex Authentication Flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should handle token refresh scenario', async () => {
      const mockUser = { id: 1, login: 'testuser', email: 'test@example.com' };
      
      // Start with no token
      getClientAuthToken.mockReturnValue(null);
      
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });

      // Simulate external token setting (e.g., from another tab)
      getClientAuthToken.mockReturnValue('new-token');
      mockedAxios.get.mockResolvedValue({
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      // Manually trigger refetch
      await act(async () => {
        await result.current.refetchUser();
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle concurrent login attempts gracefully', async () => {
      const mockUser = { id: 1, login: 'testuser', email: 'test@example.com' };
      const credentials = { login: 'testuser', password: 'password' };
      
      mockedAxios.post.mockResolvedValue({
        data: { user: mockUser, token: 'token' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate concurrent login calls
      const loginPromises = [
        act(() => result.current.login(credentials)),
        act(() => result.current.login(credentials)),
      ];

      await Promise.all(loginPromises);

      // Should only navigate once
      expect(mockRouter.push).toHaveBeenCalledWith('/');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should maintain authentication state across component re-renders', async () => {
      const mockUser = { id: 1, login: 'testuser', email: 'test@example.com' };
      
      getClientAuthToken.mockReturnValue('valid-token');
      mockedAxios.get.mockResolvedValue({
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const { result, rerender } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Trigger re-render
      rerender();

      // State should be maintained
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      
      // Should not make additional API calls due to caching
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should recover from network errors', async () => {
      const mockUser = { id: 1, login: 'testuser', email: 'test@example.com' };
      
      getClientAuthToken.mockReturnValue('valid-token');
      
      // First call fails
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
      
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.isLoading).toBe(false);
      });

      // Second call succeeds
      mockedAxios.get.mockResolvedValue({
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      await act(async () => {
        await result.current.refetchUser();
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle malformed API responses', async () => {
      getClientAuthToken.mockReturnValue('valid-token');
      
      // Return malformed response
      mockedAxios.get.mockResolvedValue({
        data: {}, // Missing user field
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});