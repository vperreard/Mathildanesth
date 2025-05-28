import { cn, generateId, sleep, debounce, throttle } from '../utils';

describe('lib/utils', () => {
  describe('cn (className utility)', () => {
    it('should concatenate class names', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'conditional', false && 'hidden');
      expect(result).toContain('base');
      expect(result).toContain('conditional');
      expect(result).not.toContain('hidden');
    });

    it('should handle undefined/null values', () => {
      const result = cn('class1', null, undefined, 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).not.toContain('null');
      expect(result).not.toContain('undefined');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });

    it('should generate IDs with custom prefix', () => {
      const id = generateId('user');
      expect(id).toContain('user');
    });

    it('should generate IDs with custom length', () => {
      const id = generateId('', 10);
      expect(id.length).toBe(10);
    });
  });

  describe('sleep', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await sleep(100);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(90); // Allow some margin
    });

    it('should handle zero delay', async () => {
      const start = Date.now();
      await sleep(0);
      const end = Date.now();
      
      expect(end - start).toBeLessThan(50);
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', (done) => {
      let callCount = 0;
      const fn = () => { callCount++; };
      const debouncedFn = debounce(fn, 100);

      // Call multiple times quickly
      debouncedFn();
      debouncedFn();
      debouncedFn();

      // Should not have called yet
      expect(callCount).toBe(0);

      // Wait for debounce delay
      setTimeout(() => {
        expect(callCount).toBe(1); // Should only call once
        done();
      }, 150);
    });

    it('should reset timer on subsequent calls', (done) => {
      let callCount = 0;
      const fn = () => { callCount++; };
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      
      setTimeout(() => {
        debouncedFn(); // Reset timer
      }, 50);

      setTimeout(() => {
        expect(callCount).toBe(0); // Still shouldn't have called
      }, 120);

      setTimeout(() => {
        expect(callCount).toBe(1); // Now it should have called
        done();
      }, 180);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', (done) => {
      let callCount = 0;
      const fn = () => { callCount++; };
      const throttledFn = throttle(fn, 100);

      // Call multiple times quickly
      throttledFn(); // Should execute immediately
      throttledFn(); // Should be throttled
      throttledFn(); // Should be throttled

      expect(callCount).toBe(1);

      setTimeout(() => {
        throttledFn(); // Should execute after throttle period
        expect(callCount).toBe(2);
        done();
      }, 150);
    });

    it('should execute immediately on first call', () => {
      let callCount = 0;
      const fn = () => { callCount++; };
      const throttledFn = throttle(fn, 100);

      throttledFn();
      expect(callCount).toBe(1);
    });
  });
});