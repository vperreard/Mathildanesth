import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../AuthContext';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('axios');
jest.mock('next/navigation');
jest.mock('@/lib/auth-client-utils', () => ({
  getClientAuthToken: jest.fn(() => null),
  setClientAuthToken: jest.fn(),
  removeClientAuthToken: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockRouter = {
  push: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};

const {
  getClientAuthToken,
  setClientAuthToken,
  removeClientAuthToken,
} = require('@/lib/auth-client-utils');

// Test components
const AuthStatusComponent = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  return (
    <div>
      <div data-testid="loading-status">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user-info">{user ? `User: ${user.login}` : 'No User'}</div>
    </div>
  );
};

const LoginComponent = () => {
  const { login, logout, isLoading } = useAuth();
  
  const handleLogin = async () => {
    try {
      const result = await login({ login: 'testuser', password: 'password' });
      console.log('Login successful:', result);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div>
      <button 
        data-testid="login-button" 
        onClick={handleLogin}
        disabled={isLoading}
      >
        Login
      </button>
      <button 
        data-testid="logout-button" 
        onClick={handleLogout}
        disabled={isLoading}
      >
        Logout
      </button>
    </div>
  );
};

const TestApp = () => {
  return (
    <div>
      <AuthStatusComponent />
      <LoginComponent />
    </div>
  );
};

describe('AuthContext Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false,
          staleTime: 0,
          cacheTime: 0,
        },
        mutations: { retry: false },
      },
    });

    jest.clearAllMocks();
    
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Setup axios mocks
    mockedAxios.get = jest.fn();
    mockedAxios.post = jest.fn();
    mockedAxios.interceptors = {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    } as any;

    // Setup auth utils mocks
    getClientAuthToken.mockReturnValue(null);
    setClientAuthToken.mockImplementation(() => {});
    removeClientAuthToken.mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {component}
        </AuthProvider>
      </QueryClientProvider>
    );
  };

  describe('Initial Authentication State', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should start with unauthenticated state when no token', async () => {
      getClientAuthToken.mockReturnValue(null);
      
      await act(async () => {
        renderWithProviders(<TestApp />);
      });

      expect(screen.getByTestId('loading-status')).toHaveTextContent('Loading');
      
      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
      });

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('No User');
    });

    it('should auto-authenticate when valid token exists', async () => {
      const mockUser = { id: 1, login: 'testuser', email: 'test@example.com' };
      
      getClientAuthToken.mockReturnValue('valid-token');
      mockedAxios.get.mockImplementation((url) => {
        if (url === '/api/auth/me') {
          return Promise.resolve({
            data: { user: mockUser },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      await act(async () => {
        renderWithProviders(<TestApp />);
      });

      expect(screen.getByTestId('loading-status')).toHaveTextContent('Loading');

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
      }, { timeout: 3000 });

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('User: testuser');
    });

    it('should handle invalid token gracefully', async () => {
      getClientAuthToken.mockReturnValue('invalid-token');
      mockedAxios.get.mockImplementation((url) => {
        if (url === '/api/auth/me') {
          return Promise.reject(new Error('Unauthorized'));
        }
        return Promise.reject(new Error('Not found'));
      });
      
      await act(async () => {
        renderWithProviders(<TestApp />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
      });

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('No User');
    });
  });

  describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should complete full login flow successfully', async () => {
      const mockUser = { id: 1, login: 'testuser', email: 'test@example.com' };
      
      // Mock successful login response - be very explicit about what we're mocking
      mockedAxios.post.mockImplementation((url, data) => {
        if (url === '/api/auth/login') {
          return Promise.resolve({
            data: { user: mockUser, token: 'new-token' },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      renderWithProviders(<TestApp />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
      });

      // Initial state should be unauthenticated
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');

      // Trigger login
      fireEvent.click(screen.getByTestId('login-button'));

      // Wait for any async operations to complete
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/api/auth/login', 
          { login: 'testuser', password: 'password' },
          expect.any(Object)
        );
      });

      // Wait for login to complete and user info to update
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
        expect(screen.getByTestId('user-info')).toHaveTextContent('User: testuser');
      });
      expect(setClientAuthToken).toHaveBeenCalledWith('new-token');
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });

    it('should handle login failure gracefully', async () => {
      // Mock failed login response
      mockedAxios.post.mockRejectedValue(new Error('Invalid credentials'));

      renderWithProviders(<TestApp />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
      });

      // Trigger login
      fireEvent.click(screen.getByTestId('login-button'));

      // Should remain unauthenticated
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      });

      expect(screen.getByTestId('user-info')).toHaveTextContent('No User');
      expect(setClientAuthToken).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should complete full logout flow successfully', async () => {
      const mockUser = { id: 1, login: 'testuser', email: 'test@example.com' };
      
      // Start with authenticated state
      getClientAuthToken.mockReturnValue('valid-token');
      mockedAxios.get.mockResolvedValue({
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      // Mock successful logout response
      mockedAxios.post.mockResolvedValue({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      renderWithProviders(<TestApp />);

      // Wait for authentication
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });

      // Trigger logout
      fireEvent.click(screen.getByTestId('logout-button'));

      // Wait for logout to complete
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
        expect(screen.getByTestId('user-info')).toHaveTextContent('No User');
      });
      expect(removeClientAuthToken).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/auth/connexion');
    });

    it('should handle logout failure gracefully', async () => {
      const mockUser = { id: 1, login: 'testuser', email: 'test@example.com' };
      
      // Start with authenticated state
      getClientAuthToken.mockReturnValue('valid-token');
      mockedAxios.get.mockResolvedValue({
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      // Mock failed logout response
      mockedAxios.post.mockRejectedValue(new Error('Server error'));

      renderWithProviders(<TestApp />);

      // Wait for authentication
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });

      // Trigger logout
      fireEvent.click(screen.getByTestId('logout-button'));

      // Should still logout locally even if API fails
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
        expect(screen.getByTestId('user-info')).toHaveTextContent('No User');
      });

      expect(removeClientAuthToken).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/auth/connexion');
    });
  });

  describe('Multiple Component Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    const MultiComponentApp = () => {
      return (
        <div>
          <div data-testid="component-1">
            <AuthStatusComponent />
          </div>
          <div data-testid="component-2">
            <AuthStatusComponent />
          </div>
          <LoginComponent />
        </div>
      );
    };

    it('should sync authentication state across multiple components', async () => {
      const mockUser = { id: 1, login: 'testuser', email: 'test@example.com' };
      
      mockedAxios.post.mockResolvedValue({
        data: { user: mockUser, token: 'new-token' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      renderWithProviders(<MultiComponentApp />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getAllByTestId('loading-status')[0]).toHaveTextContent('Not Loading');
      });

      // Both components should start unauthenticated
      const authStatuses = screen.getAllByTestId('auth-status');
      expect(authStatuses[0]).toHaveTextContent('Not Authenticated');
      expect(authStatuses[1]).toHaveTextContent('Not Authenticated');

      // Trigger login
      fireEvent.click(screen.getByTestId('login-button'));

      // Both components should become authenticated
      await waitFor(() => {
        const updatedAuthStatuses = screen.getAllByTestId('auth-status');
        expect(updatedAuthStatuses[0]).toHaveTextContent('Authenticated');
        expect(updatedAuthStatuses[1]).toHaveTextContent('Authenticated');
        
        const userInfos = screen.getAllByTestId('user-info');
        expect(userInfos[0]).toHaveTextContent('User: testuser');
        expect(userInfos[1]).toHaveTextContent('User: testuser');
      });
    });
  });

  describe('Error Boundary Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    const ErrorBoundaryComponent = () => {
      const { user } = useAuth();
      
      // Force an error for testing
      if (user && user.login === 'error-user') {
        throw new Error('Test error');
      }
      
      return <div data-testid="error-boundary-content">Content loaded</div>;
    };

    it('should handle component errors gracefully', async () => {
      const mockUser = { id: 1, login: 'error-user', email: 'error@example.com' };
      
      getClientAuthToken.mockReturnValue('valid-token');
      mockedAxios.get.mockResolvedValue({
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Create a test app that includes the error component
      const TestAppWithError = () => {
        return (
          <div>
            <AuthStatusComponent />
            <ErrorBoundaryComponent />
          </div>
        );
      };

      renderWithProviders(<TestAppWithError />);
      
      // Wait for authentication and component to load and trigger error
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('User: error-user');
      });
      
      // The error should be logged to console during rendering
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance and Caching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should cache user data and avoid unnecessary API calls', async () => {
      const mockUser = { id: 1, login: 'testuser', email: 'test@example.com' };
      
      getClientAuthToken.mockReturnValue('cached-token');
      mockedAxios.get.mockResolvedValue({
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      // First render
      const { unmount } = renderWithProviders(<TestApp />);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);

      unmount();

      // Second render with same token should use cache
      renderWithProviders(<TestApp />);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });

      // Should still only be called once due to caching
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Token Management Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should handle token expiration and cleanup', async () => {
      const mockUser = { id: 1, login: 'testuser', email: 'test@example.com' };
      
      // Start with valid token
      getClientAuthToken.mockReturnValue('valid-token');
      mockedAxios.get.mockResolvedValueOnce({
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      renderWithProviders(<TestApp />);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });

      // Simulate token expiration on next API call
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 401 },
        message: 'Unauthorized'
      });

      // Trigger a refetch to cause the 401 error
      const RefetchComponent = () => {
        const { refetchUser } = useAuth();
        
        // Use a button to trigger the refetch for better test control
        return <button data-testid="refetch-button" onClick={() => refetchUser()}>Refetch</button>;
      };

      const TestAppWithRefetch = () => {
        return (
          <div>
            <AuthStatusComponent />
            <RefetchComponent />
          </div>
        );
      };

      renderWithProviders(<TestAppWithRefetch />);

      // Trigger the refetch that will cause 401
      fireEvent.click(screen.getByTestId('refetch-button'));

      // Should clear auth state on 401 (interceptor should be triggered)
      await waitFor(() => {
        expect(removeClientAuthToken).toHaveBeenCalled();
      });
    });
  });
});