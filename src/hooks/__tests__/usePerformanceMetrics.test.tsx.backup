import { renderHook, act, waitFor } from '@testing-library/react';
import {
  usePerformanceMetrics,
  useAuthPerformanceMetrics,
  measureExecutionTime,
} from '../usePerformanceMetrics';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

// Mock performance APIs
const mockPerformanceAPI = {
  getEntriesByType: jest.fn(),
  now: jest.fn(),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB in bytes
  },
};

// Mock navigation timing
const mockNavigationTiming = {
  fetchStart: 100,
  loadEventEnd: 1000,
  domInteractive: 800,
};

// Mock paint timing
const mockPaintTiming = [
  { name: 'first-paint', startTime: 300 },
  { name: 'first-contentful-paint', startTime: 400 },
];

Object.defineProperty(window, 'performance', {
  value: mockPerformanceAPI,
  writable: true,
});

// Mock console methods
const consoleSpy = {
  group: jest.spyOn(console, 'group').mockImplementation(),
  log: jest.spyOn(console, 'log').mockImplementation(),
  groupEnd: jest.spyOn(console, 'groupEnd').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
};

// We'll use real timers and manual control of setTimeout

describe('usePerformanceMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock returns
    mockPerformanceAPI.getEntriesByType.mockImplementation((type: string) => {
      if (type === 'navigation') return [mockNavigationTiming];
      if (type === 'paint') return mockPaintTiming;
      return [];
    });

    mockPerformanceAPI.now.mockReturnValue(1500);

    // Mock document.readyState
    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic functionality', () => {
    it('should initialize with loading state', async () => {
      const { result } = renderHook(() => usePerformanceMetrics());

      expect(result.current.metrics).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(typeof result.current.recordMetric).toBe('function');
    });

    it('should measure performance metrics when document is complete', async () => {
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete',
      });

      const { result } = renderHook(() => usePerformanceMetrics('TestPage'));

      // Advance timers to trigger the setTimeout (100ms)
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Wait for state updates
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.metrics).toEqual({
        loadTime: 900, // 1000 - 100
        renderTime: 400, // first-contentful-paint
        timeToInteractive: 700, // 800 - 100
        memoryUsage: 50, // 50MB
      });
    });

    it('should wait for load event if document is not complete', async () => {
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        writable: true,
      });

      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      renderHook(() => usePerformanceMetrics());

      expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));
    });
  });

  describe('Error handling', () => {
    it('should handle performance API errors gracefully', async () => {
      mockPerformanceAPI.getEntriesByType.mockImplementation(() => {
        throw new Error('Performance API error');
      });

      const { result } = renderHook(() => usePerformanceMetrics());

      // Advance timers to trigger the setTimeout (100ms)
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Wait for state updates
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.metrics).toBeNull();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Erreur lors de la mesure des performances:',
        expect.any(Error)
      );
    });

    it('should handle missing paint entries', async () => {
      mockPerformanceAPI.getEntriesByType.mockImplementation((type: string) => {
        if (type === 'navigation') return [mockNavigationTiming];
        if (type === 'paint') return []; // No paint entries
        return [];
      });

      const { result } = renderHook(() => usePerformanceMetrics());

      // Advance timers to trigger the setTimeout (100ms)
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Wait for state updates
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.metrics?.renderTime).toBe(0);
    });

    it('should handle missing memory API', async () => {
      const performanceWithoutMemory = { ...mockPerformanceAPI };
      delete (performanceWithoutMemory as any).memory;

      Object.defineProperty(window, 'performance', {
        value: performanceWithoutMemory,
        writable: true,
      });

      const { result } = renderHook(() => usePerformanceMetrics());

      // Advance timers to trigger the setTimeout (100ms)
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Wait for state updates
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.metrics?.memoryUsage).toBeUndefined();
    });
  });

  describe('Custom metrics', () => {
    it('should record custom metrics', async () => {
      const { result } = renderHook(() => usePerformanceMetrics());

      act(() => {
        result.current.recordMetric('customMetric1', 123);
        result.current.recordMetric('customMetric2', 456);
      });

      // Advance timers to trigger the setTimeout (100ms)
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Wait for state updates
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Custom metrics should be available in development logs
      expect(result.current.recordMetric).toBeDefined();
    });

    it('should handle multiple custom metrics', () => {
      const { result } = renderHook(() => usePerformanceMetrics());

      act(() => {
        result.current.recordMetric('metric1', 100);
      });

      act(() => {
        result.current.recordMetric('metric2', 200);
      });

      act(() => {
        result.current.recordMetric('metric1', 150); // Update existing
      });

      // Metrics should be recorded without errors
      expect(result.current.recordMetric).toBeDefined();
    });
  });

  describe('Development logging', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should log metrics in development mode with page name', async () => {
      const { result } = renderHook(() => usePerformanceMetrics('TestPage'));

      // Advance timers to trigger the setTimeout (100ms)
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Wait for state updates
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(consoleSpy.group).toHaveBeenCalledWith('🚀 Performance Metrics - TestPage');
      expect(consoleSpy.log).toHaveBeenCalledWith('Load Time: 900.00ms');
      expect(consoleSpy.log).toHaveBeenCalledWith('Render Time: 400.00ms');
      expect(consoleSpy.log).toHaveBeenCalledWith('Time to Interactive: 700.00ms');
      expect(consoleSpy.log).toHaveBeenCalledWith('Memory Usage: 50.00MB');
      expect(consoleSpy.groupEnd).toHaveBeenCalled();
    });

    it('should log metrics without page name', async () => {
      const { result } = renderHook(() => usePerformanceMetrics());

      // Advance timers to trigger the setTimeout (100ms)
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Wait for state updates
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(consoleSpy.group).toHaveBeenCalledWith('🚀 Performance Metrics ');
    });
  });

  describe('Production behavior', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should not log metrics in production mode', async () => {
      renderHook(() => usePerformanceMetrics('TestPage'));

      // Advance timers to trigger the setTimeout
      act(() => {
        jest.advanceTimersByTime(150);
      });

      expect(consoleSpy.group).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => usePerformanceMetrics());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));
    });
  });
});

describe('useAuthPerformanceMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformanceAPI.now.mockReturnValue(1000);
  });

  it('should provide auth-specific functionality', () => {
    const { result } = renderHook(() => useAuthPerformanceMetrics());

    expect(result.current.recordAuthStep).toBeDefined();
    expect(result.current.recordMetric).toBeDefined();
    expect(result.current.metrics).toBeDefined();
    expect(result.current.isLoading).toBeDefined();
  });

  it('should record auth steps with timestamps', () => {
    const { result } = renderHook(() => useAuthPerformanceMetrics());

    act(() => {
      result.current.recordAuthStep('login_start');
    });

    expect(mockPerformanceAPI.now).toHaveBeenCalled();
  });

  it('should handle all auth step types', () => {
    const { result } = renderHook(() => useAuthPerformanceMetrics());

    act(() => {
      result.current.recordAuthStep('login_start');
      result.current.recordAuthStep('api_call');
      result.current.recordAuthStep('redirect');
    });

    expect(mockPerformanceAPI.now).toHaveBeenCalledTimes(3);
  });
});

describe('measureExecutionTime', () => {
  beforeEach(() => {
    mockPerformanceAPI.now
      .mockReturnValueOnce(1000) // Start time
      .mockReturnValueOnce(1500); // End time
  });

  it('should measure successful function execution', async () => {
    const testFunction = jest.fn().mockResolvedValue('success');

    const result = await measureExecutionTime(testFunction, 'testFunction');

    expect(result.result).toBe('success');
    expect(result.executionTime).toBe(500);
    expect(testFunction).toHaveBeenCalled();
  });

  it('should measure failed function execution', async () => {
    const testFunction = jest.fn().mockRejectedValue(new Error('Test error'));

    await expect(measureExecutionTime(testFunction, 'failingFunction')).rejects.toThrow(
      'Test error'
    );

    expect(consoleSpy.error).toHaveBeenCalledWith(
      '❌ failingFunction failed after 500.00ms:',
      expect.any(Error)
    );
  });

  it('should log execution time in development', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const testFunction = jest.fn().mockResolvedValue('success');

    await measureExecutionTime(testFunction, 'testFunction');

    expect(consoleSpy.log).toHaveBeenCalledWith('⏱️ testFunction: 500.00ms');

    process.env.NODE_ENV = originalEnv;
  });

  it('should handle complex async operations', async () => {
    const complexFunction = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { data: 'complex result', status: 'ok' };
    };

    const result = await measureExecutionTime(complexFunction, 'complexOp');

    expect(result.result).toEqual({ data: 'complex result', status: 'ok' });
    expect(result.executionTime).toBe(500);
  });
});
