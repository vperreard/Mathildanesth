import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNotifications } from '../useNotifications';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: { id: '1', name: 'Test User' },
      accessToken: 'mock-token'
    },
    status: 'authenticated'
  }))
}));

// Mock auth helpers
jest.mock('@/lib/auth-helpers', () => ({
  createAuthHeaders: jest.fn(() => ({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mock-token'
  }))
}));

// Mock the entire notification service
jest.mock('@/services/notificationService', () => ({
  notificationService: {
    getNotifications: jest.fn().mockResolvedValue([]),
    markAsRead: jest.fn().mockResolvedValue(true),
    markAllAsRead: jest.fn().mockResolvedValue(true),
    deleteNotification: jest.fn().mockResolvedValue(true),
    sendNotification: jest.fn().mockResolvedValue(true),
    subscribe: jest.fn().mockReturnValue(jest.fn()), // Returns unsubscribe function
    unsubscribe: jest.fn(),
    getUnreadCount: jest.fn().mockResolvedValue(0),
  }
}));

// Mock socket.io-client completely
jest.mock('socket.io-client', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
    id: 'test-socket-id',
  })),
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
    id: 'test-socket-id',
  })),
}));

describe('useNotifications - Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  let queryClient: QueryClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0, gcTime: 0 },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    
    // Mock global fetch for all tests
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, notifications: [], unreadCount: 0 }),
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  describe('Hook Interface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should provide expected interface', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      expect(result.current).toHaveProperty('sendNotification');
      expect(result.current).toHaveProperty('markNotificationAsRead');
      expect(result.current).toHaveProperty('fetchNotifications');
    });

    it('should have correct function types', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      expect(typeof result.current.sendNotification).toBe('function');
      expect(typeof result.current.markNotificationAsRead).toBe('function');
      expect(typeof result.current.fetchNotifications).toBe('function');
    });

    it('should provide notification functions', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      // All three main functions should be available
      expect(result.current.sendNotification).toBeDefined();
      expect(result.current.markNotificationAsRead).toBeDefined();
      expect(result.current.fetchNotifications).toBeDefined();
    });
  });

  describe('Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should handle markNotificationAsRead action', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      expect(() => {
        act(() => {
          result.current.markNotificationAsRead({ notificationIds: ['notification-1'] });
        });
      }).not.toThrow();
    });

    it('should handle sendNotification action', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      expect(() => {
        act(() => {
          result.current.sendNotification({
            type: 'assignment_swap',
            title: 'Test notification',
            message: 'Test message',
            recipientId: 'user-1',
          });
        });
      }).not.toThrow();
    });

    it('should handle fetchNotifications action', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      expect(() => {
        act(() => {
          result.current.fetchNotifications();
        });
      }).not.toThrow();
    });
  });

  describe('Hook Behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should initialize without errors', () => {
      expect(() => {
        renderHook(() => useNotifications(), { wrapper });
      }).not.toThrow();
    });

    it('should work with notification type parameter', () => {
      expect(() => {
        renderHook(() => useNotifications('LEAVE_REQUEST'), { wrapper });
      }).not.toThrow();
    });

    it('should work without notification type parameter', () => {
      expect(() => {
        renderHook(() => useNotifications(), { wrapper });
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should handle hook initialization gracefully', () => {
      expect(() => {
        renderHook(() => useNotifications(), { wrapper });
      }).not.toThrow();
    });

    it('should handle function calls gracefully', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      // Mock global fetch for API calls
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      expect(() => {
        act(() => {
          result.current.markNotificationAsRead({ notificationIds: ['test-id'] });
        });
      }).not.toThrow();

      expect(() => {
        act(() => {
          result.current.fetchNotifications();
        });
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should unmount without errors', () => {
      expect(() => {
        const { unmount } = renderHook(() => useNotifications(), { wrapper });
        unmount();
      }).not.toThrow();
    });
  });

  describe('Real-time Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

    it('should provide notification management functions', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      // Should provide all expected functions
      expect(typeof result.current.sendNotification).toBe('function');
      expect(typeof result.current.markNotificationAsRead).toBe('function');
      expect(typeof result.current.fetchNotifications).toBe('function');
    });

    it('should handle hook usage with type parameter', () => {
      expect(() => {
        renderHook(() => useNotifications('LEAVE_REQUEST'), { wrapper });
      }).not.toThrow();
    });
  });
});