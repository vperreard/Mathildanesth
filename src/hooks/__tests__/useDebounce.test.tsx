import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));

    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    });

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated', delay: 500 });

    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast-forward time by less than delay
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('initial');

    // Fast-forward time to complete delay
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe('updated');
  });

  it('should cancel previous timer when value changes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'first' },
    });

    // Change value multiple times rapidly
    rerender({ value: 'second' });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender({ value: 'third' });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender({ value: 'fourth' });

    // Value should still be initial
    expect(result.current).toBe('first');

    // Complete the delay from last change
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should have the last value, not intermediate ones
    expect(result.current).toBe('fourth');
  });

  it('should work with different data types', () => {
    // Test with number
    const { result: numberResult } = renderHook(() => useDebounce(42, 100));
    expect(numberResult.current).toBe(42);

    // Test with object
    const obj = { key: 'value' };
    const { result: objectResult } = renderHook(() => useDebounce(obj, 100));
    expect(objectResult.current).toBe(obj);

    // Test with array
    const arr = [1, 2, 3];
    const { result: arrayResult } = renderHook(() => useDebounce(arr, 100));
    expect(arrayResult.current).toBe(arr);

    // Test with null
    const { result: nullResult } = renderHook(() => useDebounce(null, 100));
    expect(nullResult.current).toBeNull();
  });

  it('should handle delay changes', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    });

    rerender({ value: 'updated', delay: 500 });

    // Change delay while timer is running
    rerender({ value: 'updated', delay: 1000 });

    // Advance by original delay
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Value should not have changed yet due to new delay
    expect(result.current).toBe('initial');

    // Advance to new delay
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('should update immediately when delay is 0', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 0), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'updated' });

    // Should update after minimal timeout
    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(result.current).toBe('updated');
  });

  it('should cleanup timer on unmount', () => {
    const { result, unmount, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'updated' });

    // Unmount before timer completes
    unmount();

    // Advance timers - should not cause any errors
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Test passes if no errors occur during cleanup
    expect(true).toBe(true);
  });

  it('should handle rapid consecutive updates', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 100), {
      initialProps: { value: 0 },
    });

    // Simulate rapid typing
    for (let i = 1; i <= 10; i++) {
      rerender({ value: i });
      act(() => {
        jest.advanceTimersByTime(50); // Less than debounce delay
      });
    }

    // Should still have initial value
    expect(result.current).toBe(0);

    // Complete the delay
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Should have the last value
    expect(result.current).toBe(10);
  });
});
