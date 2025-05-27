// jest.polyfills.js
// Ce fichier contient les polyfills nécessaires pour faire fonctionner Jest avec certaines API web

// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeFetch = require('node-fetch');

// Créer un wrapper pour Response qui ajoute la méthode json() si elle n'existe pas
class ResponseWrapper {
  constructor(response) {
    this._response = response;
    // Copier toutes les propriétés
    for (const prop in response) {
      if (!(prop in this)) {
        this[prop] = response[prop];
      }
    }
  }

  async json() {
    if (this._response.json) {
      return this._response.json();
    }
    const text = await this._response.text();
    return JSON.parse(text);
  }

  async text() {
    return this._response.text();
  }

  async blob() {
    return this._response.blob();
  }

  async arrayBuffer() {
    return this._response.arrayBuffer();
  }

  clone() {
    return new ResponseWrapper(this._response.clone());
  }
}

// Wrapper pour fetch qui retourne toujours notre ResponseWrapper
const fetchWrapper = async (...args) => {
  const response = await nodeFetch(...args);
  return new ResponseWrapper(response);
};

if (!global.fetch) {
  // Make fetch a jest function so it can be mocked in tests
  global.fetch = jest.fn(fetchWrapper);
  global.Response = nodeFetch.Response;
  global.Request = nodeFetch.Request;
  global.Headers = nodeFetch.Headers;
} else if (!jest.isMockFunction(global.fetch)) {
  // If fetch exists but isn't a jest mock, wrap it
  const originalFetch = global.fetch;
  global.fetch = jest.fn(async (...args) => {
    const response = await originalFetch(...args);
    return new ResponseWrapper(response);
  });
}

// Polyfill pour structuredClone (nécessaire pour jose JWT library)
if (typeof structuredClone === 'undefined') {
  global.structuredClone = function (obj) {
    return JSON.parse(JSON.stringify(obj));
  };
}

// Mock pour BroadcastChannel (non disponible dans Node.js/JSDOM)
class MockBroadcastChannel {
  constructor(channel) {
    this.channel = channel;
    this.onmessage = null;
  }

  postMessage(message) {
    // Mock sans réelle diffusion
  }

  close() {
    // Fermeture du canal
  }
}

// Définir les polyfills globaux
Object.defineProperties(global, {
  BroadcastChannel: {
    value: MockBroadcastChannel,
    writable: true,
  },
  MessageChannel: {
    value: class MessageChannel {
      constructor() {
        this.port1 = {
          onmessage: null,
          postMessage: jest.fn(),
          close: jest.fn(),
        };
        this.port2 = {
          onmessage: null,
          postMessage: jest.fn(),
          close: jest.fn(),
        };
      }
    },
    writable: true,
  },
  TextEncoder: {
    value: class TextEncoder {
      encode(input) {
        return new Uint8Array(Buffer.from(input, 'utf-8'));
      }
    },
    writable: true,
  },
  TextDecoder: {
    value: class TextDecoder {
      decode(input) {
        return Buffer.from(input).toString('utf-8');
      }
    },
    writable: true,
  },
  ResizeObserver: {
    value: class ResizeObserver {
      constructor(callback) {
        this.callback = callback;
      }
      observe() {
        /* noop */
      }
      unobserve() {
        /* noop */
      }
      disconnect() {
        /* noop */
      }
    },
    writable: true,
  },
  IntersectionObserver: {
    value: class IntersectionObserver {
      constructor(callback) {
        this.callback = callback;
      }
      observe() {
        /* noop */
      }
      unobserve() {
        /* noop */
      }
      disconnect() {
        /* noop */
      }
    },
    writable: true,
  },
});

// Polyfills pour window
if (typeof window !== 'undefined') {
  Object.defineProperties(window, {
    matchMedia: {
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
    },
    scrollTo: {
      writable: true,
      value: jest.fn(),
    },
    /* // Commenter cette redéfinition suspecte
        HTMLElement: {
            writable: true,
            value: class HTMLElement {
                // Mock simple pour éviter les erreurs avec certaines bibliothèques UI
            }
        }
        */
  });
}

// Polyfill for TextEncoder and TextDecoder (needed by some libraries in Node)
import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from 'util';

// Create custom TextEncoder that returns Uint8Array
global.TextEncoder = class TextEncoder {
  encode(input) {
    return new Uint8Array(Buffer.from(input, 'utf-8'));
  }
};

global.TextDecoder = class TextDecoder {
  decode(input) {
    return Buffer.from(input).toString('utf-8');
  }
};

// Polyfill for TransformStream (needed by MSW interceptors in Node >= 16 / JSDOM)
// Vérifier si les Streams API sont disponibles (Node >= 16) et ajouter si nécessaire
if (typeof TransformStream === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const streams = require('node:stream/web');
    if (streams && streams.TransformStream) {
      global.TransformStream = streams.TransformStream;
    }
    // Si d'autres streams sont nécessaires (ReadableStream, WritableStream), ajoutez-les ici
    // if (streams && streams.ReadableStream) {
    //     global.ReadableStream = streams.ReadableStream;
    // }
    // if (streams && streams.WritableStream) {
    //     global.WritableStream = streams.WritableStream;
    // }
  } catch (err) {
    console.warn(
      'Polyfill pour TransformStream non disponible (node:stream/web). MSW pourrait ne pas fonctionner correctement.'
    );
    // Fallback simple pour éviter l'erreur, mais les fonctionnalités pourraient être limitées
    global.TransformStream = class TransformStream { };
  }
}

// Polyfill pour BroadcastChannel
if (typeof BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class {
    constructor(name) { }
    postMessage(message) { }
    close() { }
    addEventListener(type, listener) { }
    removeEventListener(type, listener) { }
    dispatchEvent(event) { }
    onmessage = null;
    onmessageerror = null;
  };
}

// Polyfill pour MessageChannel (si nécessaire)
if (typeof MessageChannel === 'undefined') {
  global.MessageChannel = class {
    constructor() {
      this.port1 = { onmessage: null, postMessage: () => { } };
      this.port2 = { onmessage: null, postMessage: () => { } };
    }
  };
}

// Polyfill pour ResizeObserver
if (typeof ResizeObserver === 'undefined') {
  global.ResizeObserver = class {
    observe() { }
    unobserve() { }
    disconnect() { }
  };
}

// Polyfill pour IntersectionObserver
if (typeof IntersectionObserver === 'undefined') {
  global.IntersectionObserver = class {
    constructor(callback, options) { }
    observe() { }
    unobserve() { }
    disconnect() { }
    takeRecords() {
      return [];
    }
  };
  global.IntersectionObserverEntry = class { };
}

// Note : Le polyfill suspect HTMLElement a été commenté précédemment.
/*
if (typeof HTMLElement === 'undefined') {
    Object.defineProperty(global, 'HTMLElement', {
        writable: true,
        value: class HTMLElement {
            // Mock simple pour éviter les erreurs avec certaines bibliothèques UI
        }
    });
}
*/

// Vous pouvez ajouter d'autres polyfills nécessaires ici

console.log('jest.polyfills.js loaded and applied.');
