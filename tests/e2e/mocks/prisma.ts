// Mock Prisma client for E2E tests
export const prisma = {
  $use: jest.fn(),
  $disconnect: jest.fn(),
  $connect: jest.fn(),
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),
  
  // Add mock models as needed
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
  },
  site: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  operatingRoom: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

// Export as default too for compatibility
export default prisma;