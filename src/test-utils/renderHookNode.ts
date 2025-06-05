// renderHookNode.ts - Version simplifiée de renderHook pour Node.js
import React from 'react';
import { act } from '@testing-library/react';

// Mock DOM minimal pour React
const mockDocument = {
  createElement: jest.fn((tag) => ({
    tagName: tag,
    innerHTML: '',
    style: {},
    className: '',
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(() => false),
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    querySelector: jest.fn(() => null),
    querySelectorAll: jest.fn(() => []),
  })),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
    },
  },
  head: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
};

// Setup DOM global
if (typeof global.document === 'undefined') {
  global.document = mockDocument as any;
}

// Setup window minimal
if (typeof global.window === 'undefined') {
  global.window = {
    document: mockDocument,
    localStorage: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  } as any;
}

interface RenderHookResult<T> {
  result: {
    current: T;
  };
  rerender: (newProps?: unknown) => void;
  unmount: () => void;
}

export function renderHookNode<T>(hookFn: () => T): RenderHookResult<T> {
  let hookResult: T;
  let isMounted = true;
  
  const TestComponent = () => {
    if (!isMounted) return null;
    hookResult = hookFn();
    return React.createElement('div');
  };

  // Simulation simple du rendu React
  const render = () => {
    if (isMounted) {
      React.createElement(TestComponent);
    }
  };

  // Render initial
  act(() => {
    render();
  });

  return {
    result: {
      get current() {
        return hookResult;
      }
    },
    rerender: (newProps?: unknown) => {
      act(() => {
        render();
      });
    },
    unmount: () => {
      isMounted = false;
    }
  };
}

export function waitForNode(callback: () => void, timeout = 1000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      try {
        callback();
        resolve();
      } catch (error: unknown) {
        if (Date.now() - startTime < timeout) {
          setTimeout(check, 10);
        } else {
          reject(error);
        }
      }
    };
    
    check();
  });
}