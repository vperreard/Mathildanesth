import { PrismaClient } from '../generated/prisma';

// PrismaClient est attaché au global en développement pour éviter de créer 
// trop de connexions lors du hot reloading
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 