// jest.setup.js
import '@testing-library/jest-dom'; // Pour les matchers DOM
import 'whatwg-fetch'; // Polyfill fetch
import { TextEncoder, TextDecoder } from 'util';
import { fetch, Headers, Request, Response } from 'cross-fetch';

// Polyfills globaux
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.fetch = fetch;
global.Headers = Headers;
global.Request = Request;
global.Response = Response;

// Mocks de Next.js
jest.mock('next/font/google', () => ({
    Inter: () => ({ className: 'mock-inter-font', style: { fontFamily: 'mock-inter' } }),
    Roboto_Mono: () => ({ className: 'mock-roboto-mono-font', style: { fontFamily: 'mock-roboto-mono' } }),
    Montserrat: () => ({ className: 'mock-montserrat-font', style: { fontFamily: 'mock-montserrat' } }),
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() })),
    useSearchParams: jest.fn(() => new URLSearchParams()),
    usePathname: jest.fn(() => ''),
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
            args[0].includes('Warning: Cannot update a component (`%s`) while rendering a different component') ||
            args[0].includes('[MSW]') ||
            args[0].includes('Could not load canvas') ||
            args[0].includes('Warning: React does not recognize the') ||
            args[0].includes('forwardRef render functions accept exactly two parameters') ||
            args[0].includes('Warning: React.createFactory() is deprecated')
        )
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

// Configuration pour les tests de composants
jest.setTimeout(10000);

console.log('jest.setup.js loaded and mocks applied.'); 