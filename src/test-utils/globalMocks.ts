// Mocks globaux pour résoudre les problèmes récurrents

// Mock des enums Prisma
export const MockedPrismaEnums = {
  UserRole: {
    USER: 'USER',
    MAR: 'MAR',
    IADE: 'IADE',
    CHIRURGIEN: 'CHIRURGIEN',
    ADMIN_TOTAL: 'ADMIN_TOTAL',
    ADMIN_PARTIEL: 'ADMIN_PARTIEL'
  },
  UserStatus: {
    ACTIF: 'ACTIF',
    INACTIF: 'INACTIF'
  },
  LeaveStatus: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    CANCELLED: 'CANCELLED'
  },
  LeaveType: {
    ANNUAL: 'ANNUAL',
    SICK: 'SICK',
    MATERNITY: 'MATERNITY',
    TRAINING: 'TRAINING',
    RECOVERY: 'RECOVERY',
    SPECIAL: 'SPECIAL',
    UNPAID: 'UNPAID',
    OTHER: 'OTHER'
  },
  Role: {
    USER: 'USER',
    ADMIN: 'ADMIN',
    ADMIN_TOTAL: 'ADMIN_TOTAL',
    ADMIN_PARTIEL: 'ADMIN_PARTIEL'
  },
  ProfessionalRole: {
    MAR: 'MAR',
    IADE: 'IADE',
    SECRETAIRE: 'SECRETAIRE'
  },
  SpecialtyType: {
    SURGERY: 'SURGERY',
    ANESTHESIA: 'ANESTHESIA',
    CARDIOLOGY: 'CARDIOLOGY',
    ORTHOPEDICS: 'ORTHOPEDICS'
  }
};

// Mock de Prisma client
export const mockPrismaClient = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  leave: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  leaveBalance: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  leaveTypeSetting: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  activityType: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  $disconnect: jest.fn(),
  $connect: jest.fn(),
  $transaction: jest.fn((callback) => callback(mockPrismaClient)),
  $queryRaw: jest.fn(),
  $queryRawUnsafe: jest.fn(),
  $executeRaw: jest.fn(),
  $executeRawUnsafe: jest.fn(),
};

// Mock de fetch global
export const mockFetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Headers(),
  })
);

// Mock de next/router
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn(),
  query: {},
  pathname: '/',
  route: '/',
  asPath: '/',
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
};

// Mock de next-auth
export const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Fonction pour réinitialiser tous les mocks
export const resetAllMocks = () => {
  jest.clearAllMocks();
  mockFetch.mockClear();
  Object.values(mockPrismaClient).forEach((model) => {
    if (typeof model === 'object') {
      Object.values(model).forEach((method) => {
        if (typeof method === 'function' && method.mockClear) {
          method.mockClear();
        }
      });
    }
  });
};