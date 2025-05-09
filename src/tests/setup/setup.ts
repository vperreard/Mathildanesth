// import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
// Désactivation temporaire de MSW jusqu'à résolution du problème de TextEncoder
// import { server } from '../mocks/server';

// Configuration pour les mocks MSW
// let serverMock = server;

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
    // Désactivation temporaire
    /*if (serverMock) {
        serverMock.listen();
    }*/
});

afterEach(() => {
    // Désactivation temporaire
    /*if (serverMock) {
        serverMock.resetHandlers();
    }*/
    jest.clearAllMocks();
});

afterAll(() => {
    // Désactivation temporaire
    /*if (serverMock) {
        serverMock.close();
    }*/
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