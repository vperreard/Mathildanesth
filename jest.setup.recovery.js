// jest.setup.recovery.js - Setup simplifié pour récupération des tests

// Imports essentiels
import '@testing-library/jest-dom';

// Polyfills pour Node.js
Object.defineProperty(globalThis, 'TextEncoder', {
    value: TextEncoder,
});

Object.defineProperty(globalThis, 'TextDecoder', {
    value: TextDecoder,
});

// Mock localStorage simplifié
const localStorageMock = {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(() => null),
};

Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

// Mock sessionStorage
Object.defineProperty(globalThis, 'sessionStorage', {
    value: localStorageMock,
    writable: true,
});

// Mock window.location
Object.defineProperty(globalThis, 'location', {
    value: {
        href: 'http://localhost:3000',
        origin: 'http://localhost:3000',
        pathname: '/',
        search: '',
        hash: '',
        reload: jest.fn(),
        assign: jest.fn(),
        replace: jest.fn(),
    },
    writable: true,
});

// Mock console pour réduire le bruit
const originalError = console.error;
console.error = (...args) => {
    // Ignorer certains warnings connus pendant la récupération
    const message = args[0];
    if (typeof message === 'string') {
        if (
            message.includes('punycode') ||
            message.includes('DEP0040') ||
            message.includes('Warning: ReactDOM.render') ||
            message.includes('Warning: validateDOMNesting')
        ) {
            return;
        }
    }
    originalError.apply(console, args);
};

// Mock des modules problématiques de base
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findMany: jest.fn().mockResolvedValue([]),
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
            delete: jest.fn().mockResolvedValue({}),
        },
        leave: {
            findMany: jest.fn().mockResolvedValue([]),
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
            delete: jest.fn().mockResolvedValue({}),
        },
        $transaction: jest.fn().mockImplementation((callback) => callback),
        $disconnect: jest.fn().mockResolvedValue(undefined),
    },
}));

// Mock next-auth basique
jest.mock('next-auth/next', () => ({
    getServerSession: jest.fn().mockResolvedValue({
        user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'USER',
        },
    }),
}));

// Mock next/router
jest.mock('next/router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn().mockResolvedValue(undefined),
        back: jest.fn(),
        pathname: '/',
        route: '/',
        asPath: '/',
        query: {},
        isReady: true,
    }),
}));

// Mock react-query basique
jest.mock('@tanstack/react-query', () => ({
    useQuery: jest.fn(() => ({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
    })),
    useMutation: jest.fn(() => ({
        mutate: jest.fn(),
        isLoading: false,
        error: null,
    })),
    QueryClient: jest.fn(),
    QueryClientProvider: ({ children }) => children,
}));

// TestFactory basique pour les tests
globalThis.TestFactory = {
    User: {
        create: (overrides = {}) => ({
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'USER',
            ...overrides,
        }),
        createMany: (count = 3) =>
            Array.from({ length: count }, (_, i) =>
                globalThis.TestFactory.User.create({ id: `${i + 1}` })
            ),
    },

    Leave: {
        create: (overrides = {}) => ({
            id: '1',
            userId: '1',
            type: 'VACATION',
            status: 'PENDING',
            startDate: new Date('2025-01-15'),
            endDate: new Date('2025-01-16'),
            ...overrides,
        }),
        createMany: (count = 3) =>
            Array.from({ length: count }, (_, i) =>
                globalThis.TestFactory.Leave.create({ id: `${i + 1}` })
            ),
    },

    LeaveBalance: {
        create: (overrides = {}) => ({
            id: '1',
            userId: '1',
            year: 2025,
            totalDays: 25,
            usedDays: 10,
            remainingDays: 15,
            ...overrides,
        }),
        createForUser: (userId, overrides = {}) =>
            globalThis.TestFactory.LeaveBalance.create({ userId, ...overrides }),
    },
};

// Augmenter les timeouts pour les tests lents
jest.setTimeout(15000);

// Nettoyer après chaque test
afterEach(() => {
    jest.clearAllMocks();
}); 