import { PrismaClient } from '@prisma/client';
import { cachedPrisma } from './prisma-cache';

// Détermine si le code s'exécute côté serveur
const isServer = typeof window === 'undefined';

// Déclare une variable globale pour stocker le client Prisma
declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

// Crée une instance factice pour le client
const dummyPrisma = {} as PrismaClient;

// En développement, utiliser l'instance Prisma traditionnelle
// En production, utiliser l'instance avec cache pour de meilleures performances
let prismaInstance: PrismaClient;

// Ne créer l'instance que côté serveur
if (isServer) {
    if (process.env.NODE_ENV === 'development') {
        // Crée une instance unique du client Prisma et la met en cache globalement
        // pour éviter de créer de nouvelles connexions en développement avec le rechargement rapide.
        prismaInstance = global.prisma || new PrismaClient({
            log: ['query', 'error', 'warn'],
        });
        global.prisma = prismaInstance;
    } else {
        // En production, utiliser le client avec cache
        prismaInstance = cachedPrisma as PrismaClient || new PrismaClient();
    }
} else {
    // Côté client (navigateur), fournir une instance factice
    // pour éviter les erreurs, mais cette instance ne doit pas être utilisée
    prismaInstance = dummyPrisma;
    console.warn('Accès à prisma depuis le navigateur. Ceci est uniquement pour la référence TypeScript et ne fonctionnera pas.');
}

export { prismaInstance as prisma }; 