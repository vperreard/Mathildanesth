// Type pour les opérations de modèle
interface MockModelOperations {
  findMany: jest.Mock;
  findUnique: jest.Mock;
  findFirst: jest.Mock;
  create: jest.Mock;
  createMany: jest.Mock;
  update: jest.Mock;
  updateMany: jest.Mock;
  upsert: jest.Mock;
  delete: jest.Mock;
  deleteMany: jest.Mock;
  count: jest.Mock;
  aggregate: jest.Mock;
  groupBy: jest.Mock;
}

const createMockModel = (): MockModelOperations => ({
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

// Type pour le client Prisma mocké
interface MockPrismaClient {
  // Main models
  leave: MockModelOperations;
  user: MockModelOperations;
  assignment: MockModelOperations;
  site: MockModelOperations;
  operatingRoom: MockModelOperations;
  specialty: MockModelOperations;
  userSkill: MockModelOperations;
  trameAffectation: MockModelOperations;
  trameModele: MockModelOperations;
  activityType: MockModelOperations;
  department: MockModelOperations;
  leaveType: MockModelOperations;
  leaveQuota: MockModelOperations;
  recurringLeave: MockModelOperations;
  conflictDetectionRule: MockModelOperations;
  auditLog: MockModelOperations;
  notification: MockModelOperations;
  notificationPreference: MockModelOperations;
  operatingSector: MockModelOperations;
  operatingRoomType: MockModelOperations;
  sectorCategory: MockModelOperations;

  // Prisma client methods
  $transaction: jest.Mock;
  $connect: jest.Mock;
  $disconnect: jest.Mock;
  $executeRaw: jest.Mock;
  $executeRawUnsafe: jest.Mock;
  $queryRaw: jest.Mock;
  $queryRawUnsafe: jest.Mock;
}

export const prisma: MockPrismaClient = {
  // Main models
  leave: createMockModel(),
  user: createMockModel(),
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

  // Prisma client methods
  $transaction: jest.fn((fn: unknown) => {
    if (typeof fn === 'function') {
      return fn(prisma);
    }
    return Promise.resolve(fn);
  }),
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
  $executeRaw: jest.fn().mockResolvedValue(1),
  $executeRawUnsafe: jest.fn().mockResolvedValue(1),
  $queryRaw: jest.fn().mockResolvedValue([]),
  $queryRawUnsafe: jest.fn().mockResolvedValue([]),
};
