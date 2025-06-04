import { PrismaClient } from '@prisma/client';
import { prisma as cachedPrisma } from './prisma-client';

// Détermine si le code s'exécute côté serveur
const isServer = typeof window === 'undefined';

// Déclare une variable globale pour stocker le client Prisma
declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

// Crée une instance factice pour le client
const dummyPrisma = {} as PrismaClient;

// En développement, utiliser l'instance Prisma traditionnelle ou globale
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

        // Ajout de la méthode $cache même en développement pour les métriques
        if (!('$cache' in prismaInstance)) {
            (prismaInstance as any).$cache = {
                getStats: () => ({
                    keys: 0,
                    hits: 0,
                    misses: 0,
                    ksize: 0,
                    vsize: 0
                }),
                invalidateAll: () => console.log('[DEV] Cache invalidation (no-op in dev)'),
                invalidateModel: () => console.log('[DEV] Model cache invalidation (no-op in dev)'),
                invalidateKey: () => console.log('[DEV] Key cache invalidation (no-op in dev)')
            };
        }

        global.prisma = prismaInstance;
    } else {
        // En production, utiliser le client avec cache
        prismaInstance = cachedPrisma;

        // S'assurer que la méthode $cache existe
        if (!prismaInstance || !('$cache' in prismaInstance)) {
            console.warn('Cache Prisma non initialisé correctement ou méthode $cache manquante');
        }
    }
} else {
    // Côté client (navigateur), fournir une instance factice
    // pour éviter les erreurs, mais cette instance ne doit pas être utilisée
    prismaInstance = dummyPrisma;

    // Ajouter une méthode $cache factice pour éviter les erreurs
    if (!('$cache' in prismaInstance)) {
        (prismaInstance as any).$cache = {
            getStats: () => ({
                keys: 0,
                hits: 0,
                misses: 0,
                ksize: 0,
                vsize: 0
            }),
            invalidateAll: () => console.warn('[BROWSER] Cache invalidation not available'),
            invalidateModel: () => console.warn('[BROWSER] Model cache invalidation not available'),
            invalidateKey: () => console.warn('[BROWSER] Key cache invalidation not available')
        };
    }

    if (process.env.NODE_ENV === 'development') {
        console.warn('Accès à prisma depuis le navigateur. Ceci est uniquement pour la référence TypeScript et ne fonctionnera pas.');
    }
}

export { prismaInstance as prisma }; 