import React from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth, AuthProvider } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';

jest.mock('next/navigation');
jest.mock('axios');
jest.mock('@/lib/auth-client-utils', () => ({
  getClientAuthToken: jest.fn(),
  setClientAuthToken: jest.fn(),
  removeClientAuthToken: jest.fn(),
}));

const mockRouter = {
  push: jest.fn(),
  refresh: jest.fn(),
};

const mockedAxios = axios as jest.Mocked<typeof axios>;

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
    
    // Mock axios methods
    mockedAxios.get = jest.fn().mockResolvedValue({ data: { user: null } });
    mockedAxios.post = jest.fn();
    mockedAxios.interceptors = {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    } as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );

  describe('Initialisation', () => {
    it('devrait initialiser avec user null', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('devrait avoir une fonction login', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.login).toBe('function');
    });
  });

  describe('logout', () => {
    it('devrait avoir une fonction logout', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.logout).toBe('function');
    });
  });
});