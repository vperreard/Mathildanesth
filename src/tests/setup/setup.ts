import '@testing-library/jest-dom';

// Configuration pour les mocks MSW
let serverMock: any;

try {
    // Importer MSW server si disponible
    const { server } = require('../mocks/server');
    serverMock = server;
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
    if (serverMock) {
        serverMock.listen();
    }
});

afterEach(() => {
    if (serverMock) {
        serverMock.resetHandlers();
    }
    jest.clearAllMocks();
});

afterAll(() => {
    if (serverMock) {
        serverMock.close();
    }
}); 