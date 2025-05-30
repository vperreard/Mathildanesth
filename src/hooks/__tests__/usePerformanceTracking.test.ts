import { renderHook, act } from '@testing-library/react';
import { usePerformanceTracking, useFormPerformanceTracking, useListPerformanceTracking } from '../usePerformanceTracking';
import * as performanceMonitor from '@/lib/performance/performanceMonitor';
import * as logger from '@/lib/logger';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

jest.mock('@/lib/performance/performanceMonitor');
jest.mock('@/lib/logger');

const mockPerformanceMonitor = performanceMonitor as jest.Mocked<typeof performanceMonitor>;
const mockLogger = logger as jest.Mocked<typeof logger>;

// Mock performance.now()
const mockPerformanceNow = jest.fn();
Object.defineProperty(window, 'performance', {
  value: {
    now: mockPerformanceNow,
    mark: jest.fn(),
    measure: jest.fn(),
  },
  writable: true,
});

// Mock MutationObserver
const mockMutationObserver = jest.fn();
Object.defineProperty(window, 'MutationObserver', {
  value: mockMutationObserver,
  writable: true,
});

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('usePerformanceTracking', () => {
  const mockObserverInstance = {
    observe: jest.fn(),
    disconnect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformanceNow.mockReturnValue(1000);
    mockMutationObserver.mockReturnValue(mockObserverInstance);
    mockPerformanceMonitor.performanceMonitor = {
      mark: jest.fn(),
      measure: jest.fn(),
      sendCustomMetric: jest.fn(),
      measureOperation: jest.fn(),
    } as any;
    
    // Mock document.querySelector
    Object.defineProperty(document, 'querySelector', {
      value: jest.fn().mockReturnValue(document.body),
      writable: true,
    });
    
    // Mock document.readyState
    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      writable: true,
    });
    
    jest.spyOn(window, 'addEventListener').mockImplementation(() => {});
    jest.spyOn(window, 'removeEventListener').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('basic functionality', () => {
    it('should initialize with default options', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => usePerformanceTracking('TestComponent'),
        { wrapper }
      );

      expect(result.current.trackInteraction).toBeDefined();
      expect(result.current.trackApiCall).toBeDefined();
      expect(result.current.measureDataLoading).toBeDefined();
      expect(result.current.markStart).toBeDefined();
      expect(result.current.markEnd).toBeDefined();
      expect(result.current.measure).toBeDefined();
      expect(result.current.sendMetric).toBeDefined();
    });

    it('should accept custom options', () => {
      const wrapper = createWrapper();
      const options = {
        trackNavigation: false,
        trackApiCalls: false,
        trackRenders: false,
        trackInteractions: false,
      };

      const { result } = renderHook(
        () => usePerformanceTracking('TestComponent', options),
        { wrapper }
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('render tracking', () => {
    it('should track component renders', () => {
      const wrapper = createWrapper();
      mockPerformanceNow.mockReturnValueOnce(1000).mockReturnValueOnce(1050);

      const { rerender } = renderHook(
        () => usePerformanceTracking('TestComponent', { trackRenders: true }),
        { wrapper }
      );

      // Force a re-render
      rerender();

      expect(mockPerformanceMonitor.performanceMonitor.sendCustomMetric).toHaveBeenCalledWith(
        'TestComponent_render_time',
        expect.any(Number)
      );
    });

    it('should warn about excessive re-renders', () => {
      const wrapper = createWrapper();
      const { rerender } = renderHook(
        () => usePerformanceTracking('TestComponent', { trackRenders: true }),
        { wrapper }
      );

      // Force 12 re-renders
      for (let i = 0; i < 12; i++) {
        rerender();
      }

      expect(mockLogger.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Component TestComponent has rendered')
      );
    });

    it('should not track renders when disabled', () => {
      const wrapper = createWrapper();
      const { rerender } = renderHook(
        () => usePerformanceTracking('TestComponent', { trackRenders: false }),
        { wrapper }
      );

      rerender();

      expect(mockPerformanceMonitor.performanceMonitor.sendCustomMetric).not.toHaveBeenCalled();
    });
  });

  describe('interaction tracking', () => {
    it('should track successful interactions', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => usePerformanceTracking('TestComponent', { trackInteractions: true }),
        { wrapper }
      );

      const mockFn = jest.fn().mockResolvedValue('success');
      
      await act(async () => {
        const tracker = result.current.trackInteraction('click');
        if (tracker) {
          await tracker(mockFn);
        }
      });

      expect(mockPerformanceMonitor.performanceMonitor.mark).toHaveBeenCalledWith('TestComponent_click_start');
      expect(mockPerformanceMonitor.performanceMonitor.mark).toHaveBeenCalledWith('TestComponent_click_end');
      expect(mockPerformanceMonitor.performanceMonitor.measure).toHaveBeenCalledWith(
        'TestComponent_click',
        'TestComponent_click_start',
        'TestComponent_click_end'
      );
    });

    it('should warn about slow interactions', async () => {
      const wrapper = createWrapper();
      mockPerformanceNow.mockReturnValueOnce(1000).mockReturnValueOnce(2500); // 1500ms

      const { result } = renderHook(
        () => usePerformanceTracking('TestComponent', { trackInteractions: true }),
        { wrapper }
      );

      const mockFn = jest.fn().mockResolvedValue('success');
      
      await act(async () => {
        const tracker = result.current.trackInteraction('slowClick');
        if (tracker) {
          await tracker(mockFn);
        }
      });

      expect(mockLogger.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow interaction detected')
      );
    });

    it('should track failed interactions', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => usePerformanceTracking('TestComponent', { trackInteractions: true }),
        { wrapper }
      );

      const error = new Error('Test error');
      const mockFn = jest.fn().mockRejectedValue(error);
      
      await act(async () => {
        const tracker = result.current.trackInteraction('failClick');
        if (tracker) {
          try {
            await tracker(mockFn);
          } catch (e) {
            // Expected
          }
        }
      });

      expect(mockLogger.logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Interaction failed'),
        error
      );
    });

    it('should not track when disabled', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => usePerformanceTracking('TestComponent', { trackInteractions: false }),
        { wrapper }
      );

      const tracker = result.current.trackInteraction('click');
      expect(tracker).toBeUndefined();
    });
  });

  describe('API call tracking', () => {
    it('should track API calls', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => usePerformanceTracking('TestComponent', { trackApiCalls: true }),
        { wrapper }
      );

      const mockFn = jest.fn().mockResolvedValue('data');
      mockPerformanceMonitor.performanceMonitor.measureOperation.mockResolvedValue('data');

      await act(async () => {
        await result.current.trackApiCall(['users', 'list'], mockFn);
      });

      expect(mockPerformanceMonitor.performanceMonitor.measureOperation).toHaveBeenCalledWith(
        'api_users_list',
        mockFn
      );
    });

    it('should not track API calls when disabled', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => usePerformanceTracking('TestComponent', { trackApiCalls: false }),
        { wrapper }
      );

      const mockFn = jest.fn().mockResolvedValue('data');

      await act(async () => {
        await result.current.trackApiCall(['users', 'list'], mockFn);
      });

      expect(mockPerformanceMonitor.performanceMonitor.measureOperation).not.toHaveBeenCalled();
    });
  });

  describe('data loading measurement', () => {
    it('should measure data loading successfully', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => usePerformanceTracking('TestComponent'), { wrapper });

      const mockLoadFn = jest.fn().mockResolvedValue('loaded data');

      await act(async () => {
        const data = await result.current.measureDataLoading('fetchUsers', mockLoadFn);
        expect(data).toBe('loaded data');
      });

      expect(mockPerformanceMonitor.performanceMonitor.mark).toHaveBeenCalledWith('TestComponent_fetchUsers_start');
      expect(mockPerformanceMonitor.performanceMonitor.mark).toHaveBeenCalledWith('TestComponent_fetchUsers_end');
      expect(mockPerformanceMonitor.performanceMonitor.measure).toHaveBeenCalledWith(
        'TestComponent_fetchUsers',
        'TestComponent_fetchUsers_start',
        'TestComponent_fetchUsers_end'
      );
    });

    it('should handle data loading errors', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => usePerformanceTracking('TestComponent'), { wrapper });

      const error = new Error('Loading failed');
      const mockLoadFn = jest.fn().mockRejectedValue(error);

      await act(async () => {
        try {
          await result.current.measureDataLoading('fetchUsers', mockLoadFn);
        } catch (e) {
          expect(e).toBe(error);
        }
      });

      expect(mockLogger.logger.error).toHaveBeenCalledWith(
        'Data loading failed: fetchUsers',
        error
      );
    });
  });

  describe('navigation tracking', () => {
    it('should set up navigation tracking when enabled', () => {
      const wrapper = createWrapper();
      renderHook(
        () => usePerformanceTracking('TestComponent', { trackNavigation: true }),
        { wrapper }
      );

      expect(window.addEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
      expect(mockMutationObserver).toHaveBeenCalled();
      expect(mockObserverInstance.observe).toHaveBeenCalledWith(document.body, {
        childList: true,
        subtree: true,
      });
    });

    it('should not set up navigation tracking when disabled', () => {
      const wrapper = createWrapper();
      renderHook(
        () => usePerformanceTracking('TestComponent', { trackNavigation: false }),
        { wrapper }
      );

      expect(window.addEventListener).not.toHaveBeenCalledWith('popstate', expect.any(Function));
      expect(mockMutationObserver).not.toHaveBeenCalled();
    });

    it('should cleanup navigation tracking on unmount', () => {
      const wrapper = createWrapper();
      const { unmount } = renderHook(
        () => usePerformanceTracking('TestComponent', { trackNavigation: true }),
        { wrapper }
      );

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
      expect(mockObserverInstance.disconnect).toHaveBeenCalled();
    });
  });

  describe('utility methods', () => {
    it('should provide mark utilities', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => usePerformanceTracking('TestComponent'), { wrapper });

      act(() => {
        result.current.markStart('operation');
        result.current.markEnd('operation');
      });

      expect(mockPerformanceMonitor.performanceMonitor.mark).toHaveBeenCalledWith('TestComponent_operation_start');
      expect(mockPerformanceMonitor.performanceMonitor.mark).toHaveBeenCalledWith('TestComponent_operation_end');
    });

    it('should provide measure utility', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => usePerformanceTracking('TestComponent'), { wrapper });

      act(() => {
        result.current.measure('operation');
      });

      expect(mockPerformanceMonitor.performanceMonitor.measure).toHaveBeenCalledWith(
        'TestComponent_operation',
        'TestComponent_operation_start',
        'TestComponent_operation_end'
      );
    });

    it('should provide custom metric utility', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => usePerformanceTracking('TestComponent'), { wrapper });

      act(() => {
        result.current.sendMetric('customMetric', 42, 'ms');
      });

      expect(mockPerformanceMonitor.performanceMonitor.sendCustomMetric).toHaveBeenCalledWith(
        'TestComponent_customMetric',
        42,
        'ms'
      );
    });
  });
});

describe('useFormPerformanceTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformanceMonitor.performanceMonitor = {
      mark: jest.fn(),
      measure: jest.fn(),
      sendCustomMetric: jest.fn(),
      measureOperation: jest.fn(),
    } as any;
  });

  it('should track field validation', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFormPerformanceTracking('loginForm'), { wrapper });

    act(() => {
      result.current.trackFieldValidation('email', 50);
    });

    expect(mockPerformanceMonitor.performanceMonitor.sendCustomMetric).toHaveBeenCalledWith(
      'form_loginForm_field_email_validation',
      50
    );
  });

  it('should warn about slow field validation', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFormPerformanceTracking('loginForm'), { wrapper });

    act(() => {
      result.current.trackFieldValidation('email', 150);
    });

    expect(mockLogger.logger.warn).toHaveBeenCalledWith(
      'Slow field validation: email took 150ms'
    );
  });

  it('should track form submission', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFormPerformanceTracking('loginForm'), { wrapper });

    const mockSubmitFn = jest.fn().mockResolvedValue('submitted');

    await act(async () => {
      const data = await result.current.trackSubmit(mockSubmitFn);
      expect(data).toBe('submitted');
    });

    expect(mockSubmitFn).toHaveBeenCalled();
  });
});

describe('useListPerformanceTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformanceMonitor.performanceMonitor = {
      mark: jest.fn(),
      measure: jest.fn(),
      sendCustomMetric: jest.fn(),
      measureOperation: jest.fn(),
    } as any;
  });

  it('should track scroll position', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useListPerformanceTracking('usersList'), { wrapper });

    act(() => {
      result.current.trackScroll(500, 1000);
    });

    expect(mockPerformanceMonitor.performanceMonitor.sendCustomMetric).toHaveBeenCalledWith(
      'list_usersList_scroll_percentage',
      50,
      '%'
    );
  });

  it('should track item rendering', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useListPerformanceTracking('usersList'), { wrapper });

    act(() => {
      result.current.trackItemRender(100, 200);
    });

    expect(mockPerformanceMonitor.performanceMonitor.sendCustomMetric).toHaveBeenCalledWith(
      'list_usersList_items_rendered',
      100,
      'items'
    );
    expect(mockPerformanceMonitor.performanceMonitor.sendCustomMetric).toHaveBeenCalledWith(
      'list_usersList_render_time',
      200
    );
  });

  it('should warn about slow list rendering', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useListPerformanceTracking('usersList'), { wrapper });

    act(() => {
      result.current.trackItemRender(10, 150); // 15ms per item
    });

    expect(mockLogger.logger.warn).toHaveBeenCalledWith(
      'Slow list rendering: 15.00ms per item'
    );
  });
});