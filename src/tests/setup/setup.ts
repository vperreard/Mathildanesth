import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { server } from '../mocks/server';

// Configuration pour les mocks MSW
// let serverMock: any;

try {
    // Importer MSW server si disponible
    // const { server } = require('../mocks/server');
    // serverMock = server;
} catch (error) {
    console.warn('MSW serveur non configuré. Les appels API ne seront pas mockés par défaut.');
}

// Capture des logs d'erreur console pour les tests
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
    // Ignorer certaines erreurs propres à React dans l'environnement de test
    if (
        typeof args[0] === 'string' &&
        (args[0]?.includes('Warning: ReactDOM.render') ||
            args[0]?.includes('Warning: useLayoutEffect'))
    ) {
        return;
    }
    originalConsoleError(...args);
};

// Spyier le console.error pour les tests
jest.spyOn(console, 'error');

// Setup MSW pour mocker les requêtes réseau si disponible
beforeAll(() => {
    if (server) {
        server.listen();
    }
});

afterEach(() => {
    if (server) {
        server.resetHandlers();
    }
    jest.clearAllMocks();
});

afterAll(() => {
    if (server) {
        server.close();
    }
});

// Mock localStorage and sessionStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem(key: string) {
            return store[key] || null;
        },
        setItem(key: string, value: string) {
            store[key] = value.toString();
        },
        removeItem(key: string) {
            delete store[key];
        },
        clear() {
            store = {};
        }
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: localStorageMock });

// Polyfill for TextEncoder/TextDecoder which might be missing in JSDOM
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock IntersectionObserver
const IntersectionObserverMock = class {
    // ... existing code ...
}; 