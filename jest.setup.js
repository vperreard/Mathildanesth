// jest.setup.js - Minimal setup for Jest tests
import '@testing-library/jest-dom';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Add TextEncoder/TextDecoder polyfills for Node.js environment
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock window.matchMedia if window is defined
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock window.scrollTo if window is defined
  window.scrollTo = jest.fn();
}

// Mock global Request and Response if not defined (for Next.js server components/utils in Jest)
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, options) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = options?.method || 'GET';
      this.headers = new Headers(options?.headers);
      // Add other properties or methods if needed by your tests or the code under test
      this.clone = jest.fn().mockReturnValue(this); // Basic clone mock
    }
  };
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, options) {
      this.body = body;
      this.status = options?.status || 200;
      this.ok = this.status >= 200 && this.status < 300;
      this.headers = new Headers(options?.headers);
      // Add other properties or methods if needed
      this.json = jest.fn().mockResolvedValue(body);
      this.text = jest.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body));
      this.clone = jest.fn().mockReturnValue(this); // Basic clone mock
    }

    static redirect(url, status) {
      const headers = new Headers();
      headers.set('Location', url);
      return new Response(null, { status: status || 302, headers });
    }
    // Add other static methods if needed e.g. Response.json()
    static json(data, init) {
      const body = JSON.stringify(data);
      const headers = new Headers(init?.headers);
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json');
      }
      return new Response(body, { ...init, headers });
    }
  };
}

// Mock Headers if not fully available or to add specific test functionalities
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init) {
      this._headers = {};
      if (init) {
        if (init instanceof Headers) {
          init.forEach((value, name) => {
            this.append(name, value);
          });
        } else if (Array.isArray(init)) {
          init.forEach(([name, value]) => {
            this.append(name, value);
          });
        } else {
          for (const name in init) {
            this.append(name, init[name]);
          }
        }
      }
    }
    append(name, value) {
      const lowerName = name.toLowerCase();
      if (!this._headers[lowerName]) this._headers[lowerName] = [];
      this._headers[lowerName].push(value);
    }
    delete(name) { delete this._headers[name.toLowerCase()]; }
    get(name) { const values = this._headers[name.toLowerCase()]; return values ? values[0] : null; }
    has(name) { return name.toLowerCase() in this._headers; }
    set(name, value) { this._headers[name.toLowerCase()] = [value]; }
    forEach(callback) {
      for (const name in this._headers) {
        this._headers[name].forEach(value => callback(value, name));
      }
    }
  };
}