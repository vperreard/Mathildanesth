/**
 * Mocks standardisés pour tous les tests
 * Utilise une approche cohérente pour réduire la duplication
 * Configuration centralisée pour tous les mocks du projet
 */

// Mock Prisma Client standardisé - Modèles complets
const createMockModel = () => ({
  findMany: jest.fn().mockResolvedValue([]),
  findUnique: jest.fn().mockResolvedValue(null),
  findFirst: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({ id: 'mock-id' }),
  createMany: jest.fn().mockResolvedValue({ count: 1 }),
  update: jest.fn().mockResolvedValue({ id: 'mock-id' }),
  updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  upsert: jest.fn().mockResolvedValue({ id: 'mock-id' }),
  delete: jest.fn().mockResolvedValue({ id: 'mock-id' }),
  deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
  count: jest.fn().mockResolvedValue(0),
  aggregate: jest.fn().mockResolvedValue({}),
  groupBy: jest.fn().mockResolvedValue([]),
});

export const createMockPrismaClient = () => ({
  // Principaux modèles
  user: createMockModel(),
  leave: createMockModel(),
  assignment: createMockModel(),
  site: createMockModel(),
  operatingRoom: createMockModel(),
  specialty: createMockModel(),
  userSkill: createMockModel(),
  trameAffectation: createMockModel(),
  trameModele: createMockModel(),
  activityType: createMockModel(),
  department: createMockModel(),
  leaveType: createMockModel(),
  leaveQuota: createMockModel(),
  recurringLeave: createMockModel(),
  conflictDetectionRule: createMockModel(),
  auditLog: createMockModel(),
  notification: createMockModel(),
  notificationPreference: createMockModel(),
  operatingSector: createMockModel(),
  operatingRoomType: createMockModel(),
  sectorCategory: createMockModel(),
  
  // Méthodes Prisma client
  $transaction: jest.fn((fn) => {
    if (typeof fn === 'function') {
      return fn(createMockPrismaClient());
    }
    return Promise.resolve(fn);
  }),
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
  $executeRaw: jest.fn().mockResolvedValue(1),
  $executeRawUnsafe: jest.fn().mockResolvedValue(1),
  $queryRaw: jest.fn().mockResolvedValue([]),
  $queryRawUnsafe: jest.fn().mockResolvedValue([]),
});

// Mock Axios standardisé
export const createMockAxios = () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  defaults: {
    headers: {},
    timeout: 10000,
  },
});

// Mock Next.js Router standardisé - Complet
export const createMockRouter = () => ({
  push: jest.fn().mockResolvedValue(true),
  replace: jest.fn().mockResolvedValue(true),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn().mockResolvedValue(undefined),
  reload: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  basePath: '',
  locale: 'fr',
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  isReady: true,
  isPreview: false,
  isFallback: false,
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  beforePopState: jest.fn(),
});

// Mock useRouter hook
export const mockUseRouter = () => {
  const router = createMockRouter();
  (require('next/router') as any).useRouter = jest.fn(() => router);
  return router;
};

// Mock useSearchParams hook  
export const mockUseSearchParams = (params = {}) => {
  const searchParams = new URLSearchParams(params);
  (require('next/navigation') as any).useSearchParams = jest.fn(() => searchParams);
  return searchParams;
};

// Mock usePathname hook
export const mockUsePathname = (pathname = '/') => {
  (require('next/navigation') as any).usePathname = jest.fn(() => pathname);
  return pathname;
};

// Mock Auth Utils standardisé  
export const createMockAuthUtils = () => ({
  getClientAuthToken: jest.fn(),
  setClientAuthToken: jest.fn(),
  removeClientAuthToken: jest.fn(),
  verifyToken: jest.fn(),
  refreshToken: jest.fn(),
});

// Mock Logger standardisé
export const createMockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
});

// Mock bcrypt standardisé
export const createMockBcrypt = () => ({
  hash: jest.fn(),
  compare: jest.fn(),
  hashSync: jest.fn(),
  compareSync: jest.fn(),
  genSalt: jest.fn(),
  genSaltSync: jest.fn(),
});

// Mock jsonwebtoken standardisé
export const createMockJWT = () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
});

// Factories pour données de test standardisées
export const testDataFactories = {
  user: (overrides = {}) => ({
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    login: 'testuser',
    password: 'hashedPassword',
    role: 'USER',
    active: true,
    loginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }),

  leave: (overrides = {}) => ({
    id: 'leave-1',
    userId: 1,
    startDate: new Date('2025-05-28'),
    endDate: new Date('2025-05-30'),
    countedDays: 3,
    type: 'ANNUAL',
    reason: 'Vacances',
    status: 'PENDING',
    requestDate: new Date('2025-05-27'),
    createdAt: new Date('2025-05-27'),
    updatedAt: new Date('2025-05-27'),
    ...overrides,
  }),

  operatingRoom: (overrides = {}) => ({
    id: 'room-1',
    name: 'Salle 1',
    type: 'SURGERY',
    capacity: 10,
    active: true,
    departmentId: 'dept-1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }),

  assignment: (overrides = {}) => ({
    id: 'assignment-1',
    userId: 1,
    operatingRoomId: 'room-1',
    date: new Date('2025-05-28'),
    startTime: '08:00',
    endTime: '17:00',
    type: 'GARDE',
    status: 'CONFIRMED',
    createdAt: new Date('2025-05-27'),
    updatedAt: new Date('2025-05-27'),
    ...overrides,
  }),

  trameAffectation: (overrides = {}) => ({
    id: 1,
    nom: 'Trame Test',
    description: 'Description test',
    userId: 1,
    active: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    toJSON: function() { return this; },
    ...overrides,
  }),

  apiResponse: (data = {}, status = 200) => ({
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config: {},
  }),

  errorResponse: (message = 'Error', status = 500) => {
    const error = new Error(message) as any;
    error.response = {
      status,
      statusText: status === 500 ? 'Internal Server Error' : 'Error',
      data: { error: message },
    };
    return error;
  },
};

// Mock WebSocket et Socket.IO complet
export const createMockSocket = () => ({
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  connected: false,
  disconnected: true,
  id: 'mock-socket-id',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1, // WebSocket.OPEN
});

// Mock WebSocket global
export const mockWebSocket = () => {
  const mockWS = jest.fn().mockImplementation(() => createMockSocket());
  global.WebSocket = mockWS;
  return mockWS;
};

// Mock Socket.IO
export const mockSocketIO = () => {
  const mockSocket = createMockSocket();
  const mockIO = jest.fn(() => mockSocket);
  jest.doMock('socket.io-client', () => ({
    __esModule: true,
    default: mockIO,
    io: mockIO,
  }));
  return { mockIO, mockSocket };
};

// Mock pour Auth0/OIDC
export const createMockAuth0 = () => ({
  user: testDataFactories.user(),
  isAuthenticated: true,
  isLoading: false,
  loginWithRedirect: jest.fn(),
  logout: jest.fn(),
  getAccessTokenSilently: jest.fn().mockResolvedValue('mock-token'),
  getIdTokenClaims: jest.fn().mockResolvedValue({}),
});

// Mock MSW Server
export const setupMSWServer = () => {
  const { rest } = require('msw');
  const { setupServer } = require('msw/node');
  
  const server = setupServer(
    rest.get('/api/*', (req, res, ctx) => {
      return res(ctx.json({ data: 'mocked' }));
    }),
    rest.post('/api/*', (req, res, ctx) => {
      return res(ctx.json({ success: true }));
    })
  );
  
  return server;
};

// Utilitaires pour setup de tests standardisés
export const setupTestEnvironment = () => {
  // Setup global mocks
  if (!global.fetch || typeof global.fetch.mockResolvedValue !== 'function') {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({}),
      text: jest.fn().mockResolvedValue(''),
      blob: jest.fn().mockResolvedValue(new Blob()),
      clone: jest.fn(),
    });
  }
  
  // Setup console mocks pour tests silencieux
  const originalConsole = global.console;
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    warn: jest.fn(), 
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };

  // Setup environment variables
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  process.env.NEXTAUTH_SECRET = 'test-nextauth-secret';
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
  
  // Setup global mocks
  mockWebSocket();
  mockSocketIO();
  
  return {
    restoreConsole: () => {
      global.console = originalConsole;
    },
  };
};

// Cleanup function pour tests
export const cleanupTestEnvironment = () => {
  jest.clearAllMocks();
  jest.resetAllMocks();
  
  // Reset environment
  delete process.env.JWT_SECRET;
  delete process.env.NEXTAUTH_SECRET;
  delete process.env.NEXTAUTH_URL;
  process.env.NODE_ENV = 'test';
  
  // Clear timers
  jest.useRealTimers();
};

// Mock pour les hooks React Query
export const mockReactQuery = () => {
  const mockUseQuery = jest.fn().mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    isSuccess: true,
  });
  
  const mockUseMutation = jest.fn().mockReturnValue({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: false,
    data: undefined,
    reset: jest.fn(),
  });
  
  jest.doMock('@tanstack/react-query', () => ({
    useQuery: mockUseQuery,
    useMutation: mockUseMutation,
    useQueryClient: jest.fn(() => ({
      invalidateQueries: jest.fn(),
      setQueryData: jest.fn(),
      getQueryData: jest.fn(),
      refetchQueries: jest.fn(),
    })),
    QueryClient: jest.fn(),
    QueryClientProvider: ({ children }: any) => children,
  }));
  
  return { mockUseQuery, mockUseMutation };
};

// Mock pour les composants UI courants
export const mockUIComponents = () => {
  // Mock react-day-picker
  jest.doMock('react-day-picker', () => {
    const React = require('react');
    return {
      DayPicker: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'day-picker', ...props }, children),
    };
  });
  
  // Mock date-fns
  jest.doMock('date-fns', () => ({
    format: jest.fn((date) => date.toISOString().split('T')[0]),
    parseISO: jest.fn((str) => new Date(str)),
    isValid: jest.fn(() => true),
    startOfDay: jest.fn((date) => date),
    endOfDay: jest.fn((date) => date),
    addDays: jest.fn((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)),
    subDays: jest.fn((date, days) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000)),
    differenceInDays: jest.fn(() => 1),
    isSameDay: jest.fn(() => false),
    isAfter: jest.fn(() => false),
    isBefore: jest.fn(() => false),
  }));
  
  // Mock recharts
  jest.doMock('recharts', () => {
    const React = require('react');
    return {
      ResponsiveContainer: ({ children }: any) => React.createElement('div', { 'data-testid': 'responsive-container' }, children),
      BarChart: ({ children }: any) => React.createElement('div', { 'data-testid': 'bar-chart' }, children),
      Bar: () => React.createElement('div', { 'data-testid': 'bar' }),
      XAxis: () => React.createElement('div', { 'data-testid': 'x-axis' }),
      YAxis: () => React.createElement('div', { 'data-testid': 'y-axis' }),
      Tooltip: () => React.createElement('div', { 'data-testid': 'tooltip' }),
      Legend: () => React.createElement('div', { 'data-testid': 'legend' }),
    };
  });
};

// Helper pour mock responses standardisées
export const mockSuccessResponse = (data: any) => 
  Promise.resolve(testDataFactories.apiResponse(data));

export const mockErrorResponse = (message: string, status = 500) => 
  Promise.reject(testDataFactories.errorResponse(message, status));

// Types pour TypeScript
export interface MockPrismaClient {
  user: ReturnType<typeof createMockModel>;
  leave: ReturnType<typeof createMockModel>;
  assignment: ReturnType<typeof createMockModel>;
  site: ReturnType<typeof createMockModel>;
  operatingRoom: ReturnType<typeof createMockModel>;
  specialty: ReturnType<typeof createMockModel>;
  userSkill: ReturnType<typeof createMockModel>;
  trameAffectation: ReturnType<typeof createMockModel>;
  trameModele: ReturnType<typeof createMockModel>;
  activityType: ReturnType<typeof createMockModel>;
  department: ReturnType<typeof createMockModel>;
  leaveType: ReturnType<typeof createMockModel>;
  leaveQuota: ReturnType<typeof createMockModel>;
  recurringLeave: ReturnType<typeof createMockModel>;
  conflictDetectionRule: ReturnType<typeof createMockModel>;
  auditLog: ReturnType<typeof createMockModel>;
  notification: ReturnType<typeof createMockModel>;
  notificationPreference: ReturnType<typeof createMockModel>;
  operatingSector: ReturnType<typeof createMockModel>;
  operatingRoomType: ReturnType<typeof createMockModel>;
  sectorCategory: ReturnType<typeof createMockModel>;
  $transaction: jest.MockedFunction<any>;
  $connect: jest.MockedFunction<any>;
  $disconnect: jest.MockedFunction<any>;
  $executeRaw: jest.MockedFunction<any>;
  $executeRawUnsafe: jest.MockedFunction<any>;
  $queryRaw: jest.MockedFunction<any>;
  $queryRawUnsafe: jest.MockedFunction<any>;
}

export interface MockAxios {
  get: jest.MockedFunction<any>;
  post: jest.MockedFunction<any>;
  put: jest.MockedFunction<any>;
  delete: jest.MockedFunction<any>;
  patch: jest.MockedFunction<any>;
  interceptors: {
    request: { use: jest.MockedFunction<any> };
    response: { use: jest.MockedFunction<any> };
  };
  defaults: any;
}

export interface MockSocket {
  on: jest.MockedFunction<any>;
  off: jest.MockedFunction<any>;
  emit: jest.MockedFunction<any>;
  connect: jest.MockedFunction<any>;
  disconnect: jest.MockedFunction<any>;
  connected: boolean;
  id: string;
}

// Helper pour mock toutes les dépendances communes
export const mockAllCommonDependencies = () => {
  mockUseRouter();
  mockReactQuery();
  mockUIComponents();
  mockSocketIO();
  return {
    prisma: createMockPrismaClient(),
    router: createMockRouter(),
    auth: createMockAuthUtils(),
  };
};

// Export tout pour utilisation facile
export {
  createMockPrismaClient as mockPrisma,
  createMockAxios as mockAxios,
  createMockRouter as mockRouter,
  createMockAuthUtils as mockAuthUtils,
  createMockLogger as mockLogger,
  createMockBcrypt as mockBcrypt,
  createMockJWT as mockJWT,
  createMockSocket as mockSocket,
  createMockAuth0 as mockAuth0,
};

// Export des types pour TypeScript
export type { MockPrismaClient, MockAxios };

// Configuration par défaut pour Jest
export const defaultJestSetup = () => {
  const testEnv = setupTestEnvironment();
  const mocks = mockAllCommonDependencies();
  
  return {
    ...testEnv,
    ...mocks,
    cleanup: () => {
      cleanupTestEnvironment();
      testEnv.restoreConsole?.();
    },
  };
};