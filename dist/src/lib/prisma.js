import { PrismaClient } from '@prisma/client';
// Crée une instance unique du client Prisma et la met en cache globalement
// pour éviter de créer de nouvelles connexions en développement avec le rechargement rapide.
var prismaInstance = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === 'development') {
    global.prisma = prismaInstance;
}
export { prismaInstance as prisma };
