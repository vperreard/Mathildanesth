// jest.polyfills.js - Polyfills optimisés et stabilisés
const { TextEncoder: NodeTextEncoder, TextDecoder: NodeTextDecoder } = require('util');

// Polyfill pour fetch avec node-fetch
if (!global.fetch) {
  const nodeFetch = require('node-fetch');
  
  // Wrapper pour Response qui garantit la présence de json()
  class ResponseWrapper {
    constructor(response) {
      this._response = response;
      // Copier toutes les propriétés
      Object.setPrototypeOf(this, response);
      for (const prop in response) {
        if (!(prop in this)) {
          this[prop] = response[prop];
        }
      }
    }

    async json() {
      if (this._response.json && typeof this._response.json === 'function') {
        return this._response.json();
      }
      const text = await this._response.text();
      return JSON.parse(text);
    }

    async text() {
      return this._response.text();
    }

    clone() {
      return new ResponseWrapper(this._response.clone());
    }
  }

  // Fetch wrapper qui retourne ResponseWrapper
  const fetchWrapper = async (...args) => {
    const response = await nodeFetch(...args);
    return new ResponseWrapper(response);
  };

  global.fetch = jest.fn(fetchWrapper);
  global.Response = nodeFetch.Response;
  global.Request = nodeFetch.Request;
  global.Headers = nodeFetch.Headers;
}

// Polyfill pour structuredClone (nécessaire pour jose JWT library)
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = function (obj) {
    return JSON.parse(JSON.stringify(obj));
  };
}

// TextEncoder/TextDecoder - Utiliser les versions Node.js optimisées
if (!global.TextEncoder) {
  global.TextEncoder = class TextEncoder {
    encode(input) {
      return new Uint8Array(Buffer.from(input, 'utf-8'));
    }
  };
}

if (!global.TextDecoder) {
  global.TextDecoder = class TextDecoder {
    decode(input) {
      return Buffer.from(input).toString('utf-8');
    }
  };
}

// TransformStream polyfill pour MSW
if (typeof global.TransformStream === 'undefined') {
  try {
    const streams = require('node:stream/web');
    if (streams && streams.TransformStream) {
      global.TransformStream = streams.TransformStream;
      global.ReadableStream = streams.ReadableStream || global.ReadableStream;
      global.WritableStream = streams.WritableStream || global.WritableStream;
    }
  } catch (err) {
    console.warn('node:stream/web non disponible, utilisation de fallback pour TransformStream');
    global.TransformStream = class TransformStream {
      constructor() {
        this.readable = {};
        this.writable = {};
      }
    };
  }
}

// Web APIs manquantes dans JSDOM
const webApiPolyfills = {
  BroadcastChannel: class BroadcastChannel {
    constructor(name) {
      this.name = name;
      this.onmessage = null;
      this.onmessageerror = null;
    }
    postMessage(message) {}
    close() {}
    addEventListener(type, listener) {}
    removeEventListener(type, listener) {}
    dispatchEvent(event) { return true; }
  },

  MessageChannel: class MessageChannel {
    constructor() {
      this.port1 = { 
        onmessage: null, 
        postMessage: jest.fn(), 
        close: jest.fn(),
        start: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      this.port2 = { 
        onmessage: null, 
        postMessage: jest.fn(), 
        close: jest.fn(),
        start: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
    }
  },

  ResizeObserver: class ResizeObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  },

  IntersectionObserver: class IntersectionObserver {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  },

  PerformanceObserver: class PerformanceObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    disconnect() {}
    takeRecords() { return []; }
  }
};

// Appliquer les polyfills seulement s'ils n'existent pas
Object.keys(webApiPolyfills).forEach(api => {
  if (typeof global[api] === 'undefined') {
    global[api] = webApiPolyfills[api];
  }
});

// Performance API mock pour les tests
if (!global.performance || !global.performance.mark) {
  global.performance = {
    now: () => Date.now(),
    mark: jest.fn(),
    measure: jest.fn(),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    timeOrigin: Date.now(),
    timing: {
      navigationStart: Date.now(),
      domContentLoadedEventEnd: Date.now() + 100,
      loadEventEnd: Date.now() + 200,
    }
  };
}

// Global Navigator pour éviter les erreurs 'navigator is undefined'
if (typeof global !== 'undefined' && !global.navigator) {
  global.navigator = {
    userAgent: 'Mozilla/5.0 (Node.js Test Environment)',
    language: 'en-US',
    languages: ['en-US', 'en'],
    platform: 'Node.js',
    onLine: true,
    cookieEnabled: true,
    doNotTrack: null,
    maxTouchPoints: 0,
    hardwareConcurrency: 4,
    vendor: '',
    vendorSub: '',
    product: 'Gecko',
    productSub: '20030107',
    appCodeName: 'Mozilla',
    appName: 'Netscape',
    appVersion: '5.0 (Node.js)',
    buildID: '20030107',
    oscpu: 'Node.js',
    geolocation: {
      getCurrentPosition: jest.fn ? jest.fn() : function() {},
      watchPosition: jest.fn ? jest.fn() : function() {},
      clearWatch: jest.fn ? jest.fn() : function() {},
    },
    permissions: {
      query: jest.fn ? jest.fn().mockResolvedValue({ state: 'granted' }) : function() { return Promise.resolve({ state: 'granted' }); },
    },
    serviceWorker: {
      register: jest.fn ? jest.fn().mockResolvedValue({}) : function() { return Promise.resolve({}); },
      getRegistration: jest.fn ? jest.fn().mockResolvedValue(null) : function() { return Promise.resolve(null); },
      getRegistrations: jest.fn ? jest.fn().mockResolvedValue([]) : function() { return Promise.resolve([]); },
    },
    clipboard: {
      writeText: jest.fn ? jest.fn().mockResolvedValue(undefined) : function() { return Promise.resolve(); },
      readText: jest.fn ? jest.fn().mockResolvedValue('') : function() { return Promise.resolve(''); },
    },
    connection: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
    },
    mediaDevices: {
      getUserMedia: jest.fn ? jest.fn().mockResolvedValue({}) : function() { return Promise.resolve({}); },
      enumerateDevices: jest.fn ? jest.fn().mockResolvedValue([]) : function() { return Promise.resolve([]); },
    },
    share: jest.fn ? jest.fn().mockResolvedValue(undefined) : function() { return Promise.resolve(); },
    sendBeacon: jest.fn ? jest.fn().mockReturnValue(true) : function() { return true; },
    vibrate: jest.fn ? jest.fn().mockReturnValue(true) : function() { return true; },
    javaEnabled: jest.fn ? jest.fn().mockReturnValue(false) : function() { return false; },
    taintEnabled: jest.fn ? jest.fn().mockReturnValue(false) : function() { return false; },
  };
}

// Window APIs pour JSDOM
if (typeof window !== 'undefined') {
  // matchMedia
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  }

  // scrollTo
  if (!window.scrollTo) {
    window.scrollTo = jest.fn();
  }

  // Navigator API mock complet pour éviter "Cannot read properties of undefined (reading 'navigator')"
  if (!window.navigator) {
    Object.defineProperty(window, 'navigator', {
      writable: true,
      configurable: true,
      value: {
        userAgent: 'Mozilla/5.0 (Node.js Test Environment)',
        language: 'en-US',
        languages: ['en-US', 'en'],
        platform: 'Node.js',
        onLine: true,
        cookieEnabled: true,
        doNotTrack: null,
        maxTouchPoints: 0,
        hardwareConcurrency: 4,
        vendor: '',
        vendorSub: '',
        product: 'Gecko',
        productSub: '20030107',
        appCodeName: 'Mozilla',
        appName: 'Netscape',
        appVersion: '5.0 (Node.js)',
        buildID: '20030107',
        oscpu: 'Node.js',
        geolocation: {
          getCurrentPosition: jest.fn(),
          watchPosition: jest.fn(),
          clearWatch: jest.fn(),
        },
        permissions: {
          query: jest.fn().mockResolvedValue({ state: 'granted' }),
        },
        serviceWorker: {
          register: jest.fn().mockResolvedValue({}),
          getRegistration: jest.fn().mockResolvedValue(null),
          getRegistrations: jest.fn().mockResolvedValue([]),
        },
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined),
          readText: jest.fn().mockResolvedValue(''),
        },
        connection: {
          effectiveType: '4g',
          downlink: 10,
          rtt: 100,
        },
        mediaDevices: {
          getUserMedia: jest.fn().mockResolvedValue({}),
          enumerateDevices: jest.fn().mockResolvedValue([]),
        },
        share: jest.fn().mockResolvedValue(undefined),
        sendBeacon: jest.fn().mockReturnValue(true),
        vibrate: jest.fn().mockReturnValue(true),
        javaEnabled: jest.fn().mockReturnValue(false),
        taintEnabled: jest.fn().mockReturnValue(false),
      },
    });
  }

  // Assurer que navigator est aussi disponible globalement
  if (!global.navigator) {
    global.navigator = window.navigator;
  }

  // Canvas mock pour les tests de graphiques
  if (window.HTMLCanvasElement && !window.HTMLCanvasElement.prototype.getContext.mock) {
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({ data: new Array(4) })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => []),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      transform: jest.fn(),
      rect: jest.fn(),
      clip: jest.fn(),
    }));
  }
}

// Vérification finale que navigator est disponible partout
if (typeof global !== 'undefined' && typeof window !== 'undefined') {
  if (global.navigator && !window.navigator) {
    window.navigator = global.navigator;
  } else if (window.navigator && !global.navigator) {
    global.navigator = window.navigator;
  }
}

console.log('jest.polyfills.js loaded and applied with full navigator support.');