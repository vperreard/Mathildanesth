/**
 * Mocks pour les services et Prisma
 */

export const mockPrismaClient = {
    site: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    },
    operatingRoom: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    },
    operatingSector: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    },
    blocPlanning: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    },
    blocDayPlanning: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    },
    blocRoomAssignment: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    },
    blocStaffAssignment: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    },
    blocPlanningConflict: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    },
    user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    },
    surgeon: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    },
    absence: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    },
    leave: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
    },
    leaveBalance: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
    },
    $transaction: jest.fn((fn) => fn(mockPrismaClient)),
    $disconnect: jest.fn(),
    $connect: jest.fn()
};

export const resetAllMocks = () => {
    Object.values(mockPrismaClient).forEach(model => {
        if (typeof model === 'object' && model !== null) {
            Object.values(model).forEach(method => {
                if (typeof method === 'function' && 'mockClear' in method) {
                    (method as jest.Mock).mockClear();
                }
            });
        } else if (typeof model === 'function' && 'mockClear' in model) {
            (model as jest.Mock).mockClear();
        }
    });
};

// Mock pour sectorTypeRules
export const mockSectorTypeRulesService = {
    validateRoomAssignment: jest.fn().mockResolvedValue(true),
    getRulesForSectorType: jest.fn().mockReturnValue({
        maxRooms: 2,
        requiresContiguity: true,
        compatibleSectors: ['GENERAL']
    })
};

// Mock pour sectorRulesParser
export const mockSectorRulesParser = {
    getSectorRules: jest.fn().mockReturnValue({
        maxRooms: 2,
        requiresContiguity: true,
        compatibleSectors: ['GENERAL']
    }),
    areRoomsContiguous: jest.fn().mockReturnValue(true)
};