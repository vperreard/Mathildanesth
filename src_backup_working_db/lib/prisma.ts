import { PrismaClient } from '@prisma/client';

// Déclare une variable globale pour stocker le client Prisma
declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

// Crée une instance unique du client Prisma et la met en cache globalement
// pour éviter de créer de nouvelles connexions en développement avec le rechargement rapide.
const prismaInstance = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === 'development') {
    global.prisma = prismaInstance;
}

export { prismaInstance as prisma }; 