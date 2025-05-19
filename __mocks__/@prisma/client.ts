// Mock du client Prisma pour les tests
import { mockDeep, mockReset } from 'jest-mock-extended';

// Mock type du client Prisma
type PrismaClientMock = {
    // Ajouter ici les méthodes et propriétés nécessaires aux tests
    leave: any;
    leaveBalance: any;
    leaveTypeSetting: any;
    user: any;
    quotaCarryOver: any;
    quotaTransfer: any;
    $disconnect: () => Promise<void>;
    $queryRawUnsafe: <T = any>(query: string, ...values: any[]) => Promise<T>;
};

// Créer un mock deep du client Prisma
export const prisma = mockDeep<PrismaClientMock>();

// Mock pour PrismaClient spécifique pour les tests
export const PrismaClient = jest.fn().mockImplementation(() => {
    return prisma;
});

beforeEach(() => {
    mockReset(prisma);
}); 