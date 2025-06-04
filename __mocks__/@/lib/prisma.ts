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
  groupBy: jest.fn().mockResolvedValue([])
});

export const prisma = {
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
  $transaction: jest.fn((fn) => {
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
  $queryRawUnsafe: jest.fn().mockResolvedValue([])
};