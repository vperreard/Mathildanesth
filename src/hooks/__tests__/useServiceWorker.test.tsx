import { renderHook, act, waitFor } from '@testing-library/react';
import { useServiceWorker, useNetworkStatus } from '../useServiceWorker';

// Mock navigator
const mockNavigator = {
  serviceWorker: {
    register: jest.fn(),
    ready: Promise.resolve({
      waiting: {
        postMessage: jest.fn(),
      },
    }),
    controller: {
      postMessage: jest.fn(),
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  onLine: true,
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
};

// Mock window properties
const mockWindow = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  location: {
    reload: jest.fn(),
  },
};

// Setup global mocks
Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
});

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

describe('useServiceWorker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Reset navigator mock state
    mockNavigator.serviceWorker.register.mockResolvedValue({
      active: true,
      waiting: null,
      installing: null,
      addEventListener: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Service Worker Support Detection', () => {
    it('should detect service worker support', async () => {
      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isSupported).toBe(true);
      });
    });

    it('should handle lack of service worker support', async () => {
      // Temporarily remove serviceWorker from navigator
      const originalSW = mockNavigator.serviceWorker;
      delete (mockNavigator as any).serviceWorker;

      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isSupported).toBe(false);
      });

      // Restore serviceWorker
      mockNavigator.serviceWorker = originalSW;
    });
  });

  describe('Service Worker Registration', () => {
    it('should register service worker successfully', async () => {
      mockNavigator.serviceWorker.register.mockResolvedValue({
        active: true,
        waiting: null,
        installing: null,
        addEventListener: jest.fn(),
      });

      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isInstalled).toBe(true);
        expect(result.current.isWaiting).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(mockNavigator.serviceWorker.register).toHaveBeenCalledWith(
        '/sw-optimized.js',
        { scope: '/' }
      );
    });

    it('should handle service worker registration failure', async () => {
      const error = new Error('Registration failed');
      mockNavigator.serviceWorker.register.mockRejectedValue(error);

      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.error).toBe('Registration failed');
        expect(result.current.isInstalled).toBe(false);
      });
    });

    it('should detect waiting service worker', async () => {
      mockNavigator.serviceWorker.register.mockResolvedValue({
        active: true,
        waiting: { postMessage: jest.fn() },
        installing: null,
        addEventListener: jest.fn(),
      });

      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isWaiting).toBe(true);
      });
    });

    it('should handle updatefound event', async () => {
      const mockRegistration = {
        active: true,
        waiting: null,
        installing: {
          addEventListener: jest.fn(),
          state: 'installing',
        },
        addEventListener: jest.fn(),
      };

      mockNavigator.serviceWorker.register.mockResolvedValue(mockRegistration);

      renderHook(() => useServiceWorker());

      // Simulate updatefound event
      const updateFoundCallback = mockRegistration.addEventListener.mock.calls.find(
        call => call[0] === 'updatefound'
      )?.[1];

      expect(updateFoundCallback).toBeDefined();

      if (updateFoundCallback) {
        act(() => {
          updateFoundCallback();
        });

        // Simulate state change to installed
        const stateChangeCallback = mockRegistration.installing?.addEventListener.mock.calls.find(
          call => call[0] === 'statechange'
        )?.[1];

        if (stateChangeCallback) {
          mockRegistration.installing!.state = 'installed';
          act(() => {
            stateChangeCallback();
          });
        }
      }
    });
  });

  describe('Online/Offline Status', () => {
    it('should track online status', async () => {
      const { result } = renderHook(() => useServiceWorker());

      expect(result.current.isOnline).toBe(true);

      // Simulate going offline
      mockNavigator.onLine = false;
      const offlineCallback = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1];

      if (offlineCallback) {
        act(() => {
          offlineCallback();
        });
      }

      expect(result.current.isOnline).toBe(false);

      // Simulate going online
      mockNavigator.onLine = true;
      const onlineCallback = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1];

      if (onlineCallback) {
        act(() => {
          onlineCallback();
        });
      }

      expect(result.current.isOnline).toBe(true);
    });
  });

  describe('Network Speed Monitoring', () => {
    it('should track network speed', async () => {
      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.networkSpeed).toEqual({
          effectiveType: '4g',
          downlink: 10,
          rtt: 50,
        });
      });
    });

    it('should handle missing connection API', async () => {
      const originalConnection = mockNavigator.connection;
      delete (mockNavigator as any).connection;

      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.networkSpeed).toEqual({
          effectiveType: undefined,
          downlink: 0,
          rtt: 0,
        });
      });

      // Restore connection
      (mockNavigator as any).connection = originalConnection;
    });

    it('should handle connection change events', async () => {
      const { result } = renderHook(() => useServiceWorker());

      // Simulate connection change
      mockNavigator.connection.effectiveType = '3g';
      mockNavigator.connection.downlink = 5;
      mockNavigator.connection.rtt = 100;

      const changeCallback = mockNavigator.connection.addEventListener.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];

      if (changeCallback) {
        act(() => {
          changeCallback();
        });
      }

      expect(result.current.networkSpeed).toEqual({
        effectiveType: '3g',
        downlink: 5,
        rtt: 100,
      });
    });
  });

  describe('Service Worker Actions', () => {
    it('should skip waiting', async () => {
      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isSupported).toBe(true);
      });

      act(() => {
        result.current.skipWaiting();
      });

      // Wait for the promise to resolve
      await act(async () => {
        await mockNavigator.serviceWorker.ready;
      });

      const mockWaiting = await mockNavigator.serviceWorker.ready;
      expect(mockWaiting.waiting?.postMessage).toHaveBeenCalledWith({
        type: 'SKIP_WAITING',
      });
    });

    it('should get cache stats', async () => {
      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isSupported).toBe(true);
      });

      act(() => {
        result.current.getCacheStats();
      });

      expect(mockNavigator.serviceWorker.controller?.postMessage).toHaveBeenCalledWith({
        type: 'GET_CACHE_STATS',
      });
    });

    it('should clear cache and reload', async () => {
      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isSupported).toBe(true);
      });

      act(() => {
        result.current.clearCache();
      });

      expect(mockNavigator.serviceWorker.controller?.postMessage).toHaveBeenCalledWith({
        type: 'CLEAR_CACHE',
      });

      // Fast-forward timers to trigger reload
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockWindow.location.reload).toHaveBeenCalled();
    });

    it('should prefetch routes', async () => {
      const { result } = renderHook(() => useServiceWorker());
      const routes = ['/dashboard', '/profile', '/settings'];

      await waitFor(() => {
        expect(result.current.isSupported).toBe(true);
      });

      act(() => {
        result.current.prefetchRoutes(routes);
      });

      expect(mockNavigator.serviceWorker.controller?.postMessage).toHaveBeenCalledWith({
        type: 'PREFETCH_ROUTES',
        routes,
      });
    });
  });

  describe('Cache Stats Handling', () => {
    it('should handle cache stats message', async () => {
      const mockStats = {
        'cache-v1': { count: 10, size: 1024 },
        'cache-v2': { count: 5, size: 512 },
      };

      renderHook(() => useServiceWorker());

      // Simulate receiving cache stats message
      const messageCallback = mockNavigator.serviceWorker.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];

      if (messageCallback) {
        act(() => {
          messageCallback({
            data: {
              type: 'CACHE_STATS',
              stats: mockStats,
            },
          });
        });
      }

      // Note: We can't easily test the state update here without access to the result
      // This test mainly ensures the event listener is set up correctly
      expect(mockNavigator.serviceWorker.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
    });
  });

  describe('Cleanup', () => {
    it('should cleanup event listeners on unmount', () => {
      const { unmount } = renderHook(() => useServiceWorker());

      unmount();

      expect(mockWindow.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockWindow.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
      expect(mockNavigator.connection.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });
  });
});

describe('useNetworkStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide initial network status', () => {
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.networkSpeed).toEqual({
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
    });
  });

  it('should track online/offline changes', () => {
    const { result } = renderHook(() => useNetworkStatus());

    // Simulate going offline
    mockNavigator.onLine = false;
    const offlineCallback = mockWindow.addEventListener.mock.calls.find(
      call => call[0] === 'offline'
    )?.[1];

    if (offlineCallback) {
      act(() => {
        offlineCallback();
      });
    }

    expect(result.current.isOnline).toBe(false);
  });

  it('should track network speed changes', () => {
    const { result } = renderHook(() => useNetworkStatus());

    // Simulate connection change
    mockNavigator.connection.effectiveType = 'slow-2g';
    mockNavigator.connection.downlink = 0.5;
    mockNavigator.connection.rtt = 2000;

    const changeCallback = mockNavigator.connection.addEventListener.mock.calls.find(
      call => call[0] === 'change'
    )?.[1];

    if (changeCallback) {
      act(() => {
        changeCallback();
      });
    }

    expect(result.current.networkSpeed).toEqual({
      effectiveType: 'slow-2g',
      downlink: 0.5,
      rtt: 2000,
    });
  });

  it('should handle missing connection API gracefully', () => {
    const originalConnection = mockNavigator.connection;
    delete (mockNavigator as any).connection;

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.networkSpeed).toEqual({
      effectiveType: undefined,
      downlink: 0,
      rtt: 0,
    });

    // Restore connection
    (mockNavigator as any).connection = originalConnection;
  });

  it('should cleanup event listeners on unmount', () => {
    const { unmount } = renderHook(() => useNetworkStatus());

    unmount();

    expect(mockWindow.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockWindow.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    expect(mockNavigator.connection.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
  });
});