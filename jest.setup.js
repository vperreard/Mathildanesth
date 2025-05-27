// jest.setup.js
// import '@testing-library/jest-dom'; // Ancienne méthode
import '@testing-library/jest-dom/jest-globals'; // Nouvelle tentative
import { TextEncoder, TextDecoder } from 'util';

// Polyfills globaux - NE PAS redéfinir fetch ici car c'est fait dans jest.polyfills.js
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;

// Mock performance API for tests
if (!global.performance) {
  global.performance = {
    now: () => Date.now(),
    mark: jest.fn(),
    measure: jest.fn(),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
  };
} else if (!global.performance.mark) {
  // If performance exists but mark doesn't, add it
  global.performance.mark = jest.fn();
  global.performance.measure = jest.fn();
  global.performance.clearMarks = jest.fn();
  global.performance.clearMeasures = jest.fn();
  global.performance.getEntriesByName = jest.fn(() => []);
  global.performance.getEntriesByType = jest.fn(() => []);
}

// Mock PerformanceObserver for Web Vitals
global.PerformanceObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(() => []),
}));

// Mock PerformanceObserverEntryList
global.PerformanceObserverEntryList = jest.fn().mockImplementation(() => ({
  getEntries: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
}));

// Mock NextResponse to ensure json() method exists
jest.mock('next/server', () => {
  const NextResponse = {
    json: jest.fn((data, init) => ({
      ok: true,
      status: init?.status || 200,
      statusText: 'OK',
      headers: new Map(Object.entries(init?.headers || {})),
      json: async () => data,
      text: async () => JSON.stringify(data),
      clone: function() { return this; },
      body: data,
      bodyUsed: false,
      url: '',
      type: 'basic',
      redirected: false,
    })),
    redirect: jest.fn((url, status = 302) => ({
      ok: false,
      status,
      statusText: 'Found',
      headers: new Map([['Location', url.toString()]]),
      json: async () => ({}),
      text: async () => '',
      clone: function() { return this; },
    })),
    next: jest.fn(() => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map(),
      json: async () => ({}),
      text: async () => '',
      clone: function() { return this; },
    })),
    error: jest.fn((message, init) => {
      throw new Error(message);
    }),
  };
  
  return {
    NextRequest: jest.fn().mockImplementation((url, init) => ({
      url,
      method: init?.method || 'GET',
      headers: new Map(Object.entries(init?.headers || {})),
      nextUrl: new URL(url),
    })),
    NextResponse,
  };
});

// Mocks de Next.js
jest.mock('next/font/google', () => ({
  Inter: () => ({ className: 'mock-inter-font', style: { fontFamily: 'mock-inter' } }),
  Roboto_Mono: () => ({
    className: 'mock-roboto-mono-font',
    style: { fontFamily: 'mock-roboto-mono' },
  }),
  Montserrat: () => ({
    className: 'mock-montserrat-font',
    style: { fontFamily: 'mock-montserrat' },
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  usePathname: jest.fn(() => ''),
}));

// Mock next/headers to prevent "headers was called outside a request scope" error
jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: jest.fn((key) => {
      if (key === 'x-user-id') return '1';
      if (key === 'authorization') return 'Bearer mock-token';
      return null;
    }),
  })),
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
    },
  }),
}));

// Mock de window.matchMedia pour JSDOM (une seule définition)
if (typeof window !== 'undefined') {
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
  
  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
  }));
}

// Configuration pour MSW (Mock Service Worker)
import { server } from './src/tests/mocks/server';

// Hooks de cycle de vie pour MSW
beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// Gestion console.error pour supprimer les warnings non pertinents
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is no longer supported in React 18') ||
      args[0].includes('Warning: An update to %s inside a test was not wrapped in act(...)') ||
      args[0].includes('Warning: validateDOMNesting(...)') ||
      args[0].includes('Warning: Received `%s` for a non-boolean attribute `%s`') ||
      args[0].includes(
        'Warning: Cannot update a component (`%s`) while rendering a different component'
      ) ||
      args[0].includes('[MSW]') ||
      args[0].includes('Could not load canvas') ||
      args[0].includes('Warning: React does not recognize the') ||
      args[0].includes('forwardRef render functions accept exactly two parameters') ||
      args[0].includes('Warning: React.createFactory() is deprecated'))
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Mocks globaux supplémentaires
class MockBroadcastChannel {
  constructor(channel) {
    this.channel = channel;
    this.onmessage = null;
  }
  postMessage(message) { }
  close() { }
}

global.BroadcastChannel = global.BroadcastChannel || MockBroadcastChannel;

// Mock pour ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock Canvas for chart components
if (typeof window !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({
      data: new Array(4),
    })),
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

// Configuration pour les tests de composants
jest.setTimeout(10000);

console.log('jest.setup.js loaded and mocks applied.');

// Mock global pour PublicHolidayService pour éviter les appels API et calculs lourds par défaut
jest.mock('@/modules/leaves/services/publicHolidayService', () => {
  const actualPublicHolidayService = jest.requireActual('@/modules/leaves/services/publicHolidayService');
  return {
    publicHolidayService: {
      // Conserver les autres méthodes non mockées si nécessaire, ou les mocker explicitement
      // ...actualPublicHolidayService.publicHolidayService, // Ne pas faire ça si on veut surcharger des méthodes clés

      getPublicHolidaysInRange: jest.fn().mockResolvedValue([]),
      isPublicHoliday: jest.fn().mockResolvedValue(false),
      getPublicHolidaysForYear: jest.fn().mockResolvedValue([]),
      // Si preloadData est exporté et utilisé, sinon ce mock est inoffensif
      // S'il n'est pas exporté, il ne peut pas être mocké directement ici de toute façon.
      // On espère que mocker getPublicHolidaysForYear suffit à contrôler son comportement si preloadData l'appelle.
      preloadData: jest.fn().mockResolvedValue(undefined), // Tentative, même si privé, le module pourrait l'exporter

      // Conserver les constantes/enums exportés par le module s'il y en a
      ...(actualPublicHolidayService.publicHolidayService ? {} : actualPublicHolidayService) // Pour conserver les exports non-objets
    },
  };
});

// Mock framer-motion pour éviter les erreurs __rest
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef((props, ref) => {
        const { children, ...rest } = props;
        return React.createElement('div', { ...rest, ref }, children);
      }),
      button: React.forwardRef((props, ref) => {
        const { children, ...rest } = props;
        return React.createElement('button', { ...rest, ref }, children);
      }),
      nav: React.forwardRef((props, ref) => {
        const { children, ...rest } = props;
        return React.createElement('nav', { ...rest, ref }, children);
      }),
      span: React.forwardRef((props, ref) => {
        const { children, ...rest } = props;
        return React.createElement('span', { ...rest, ref }, children);
      }),
    },
    AnimatePresence: ({ children }) => children,
  };
});
