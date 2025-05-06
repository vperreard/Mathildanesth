// jest.setup.js
import '@testing-library/jest-dom';
import 'whatwg-fetch'; // Ajouter le polyfill fetch

// L'import et expect.extend pour jest-dom sont supprimés car gérés dans src/tests/setup/setup.ts
// require('@testing-library/jest-dom');
// expect.extend({ ... });

// Mock de next/font/google
jest.mock('next/font/google', () => ({
    Inter: () => ({ className: 'mock-inter-font', style: { fontFamily: 'mock-inter' } }),
    // Ajouter d'autres polices si utilisées
    Roboto_Mono: () => ({ className: 'mock-roboto-mono-font', style: { fontFamily: 'mock-roboto-mono' } }),
    Montserrat: () => ({ className: 'mock-montserrat-font', style: { fontFamily: 'mock-montserrat' } }),
}));

// Mock de next/navigation
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() })),
    useSearchParams: jest.fn(() => new URLSearchParams()),
    usePathname: jest.fn(() => ''),
}));

// Vous pouvez ajouter d'autres mocks globaux ici si nécessaire
// Exemple: Mock de fetch si utilisé globalement dans les tests
// global.fetch = jest.fn();

// Configuration pour les tests de date-fns si nécessaire
// const { setGlobalDate } = require('some-date-mocking-library');
// beforeAll(() => setGlobalDate(new Date('2023-01-01T00:00:00.000Z')));
// afterAll(() => resetGlobalDate());

// Mock de window.matchMedia pour JSDOM
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

// Configurer MSW pour les tests
// import { server } from './src/mocks/server'; // Mauvais chemin
import { server } from './src/tests/mocks/server'; // Chemin corrigé

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' })); // Décommenter et ajouter option
afterEach(() => server.resetHandlers()); // Décommenter
afterAll(() => server.close()); // Décommenter

// Supprimer les erreurs console spécifiques liées à JSDOM / React Testing Library
const originalConsoleError = console.error;
console.error = (...args) => {
    if (
        typeof args[0] === 'string' &&
        (args[0].includes('Warning: ReactDOM.render is no longer supported in React 18') ||
            args[0].includes('Warning: An update to %s inside a test was not wrapped in act(...)') ||
            args[0].includes('Warning: validateDOMNesting(...)') ||
            // Ignorer les erreurs de type pour les props comme `as`, souvent lié à styled-components ou Chakra
            args[0].includes('Warning: Received `%s` for a non-boolean attribute `%s`') ||
            // Ignorer les erreurs d'appel non-existant (parfois causées par des mocks)
            args[0].includes('Warning: Cannot update a component (`%s`) while rendering a different component') ||
            // Ignorer certaines erreurs MSW
            args[0].includes('[MSW]') ||
            // Ignorer erreur jsdom sur canvas
            args[0].includes('Could not load canvas')
        )
    ) {
        return;
    }
    originalConsoleError(...args);
};

// Spyier le console.error pour les tests
jest.spyOn(console, 'error').mockImplementation(() => { }); 