import { PrismaClient } from '@prisma/client';
import { cachedPrisma } from './prisma-cache';

// Déclare une variable globale pour stocker le client Prisma
declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

// En développement, utiliser l'instance Prisma traditionnelle
// En production, utiliser l'instance avec cache pour de meilleures performances
let prismaInstance;

if (process.env.NODE_ENV === 'development') {
    // Crée une instance unique du client Prisma et la met en cache globalement
    // pour éviter de créer de nouvelles connexions en développement avec le rechargement rapide.
    prismaInstance = global.prisma || new PrismaClient({
        log: ['query', 'error', 'warn'],
    });
    global.prisma = prismaInstance;
} else {
    // En production, utiliser le client avec cache
    prismaInstance = cachedPrisma;
}

export { prismaInstance as prisma }; 