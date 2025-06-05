import { logger } from "./logger";

/**
 * Runtime Detector - Utilitaire centralisé pour détecter l'environnement d'exécution
 * Compatible avec les tests et la production
 */

// Détection des différents runtimes
export const isServer = typeof window === 'undefined';
export const isBrowser = typeof window !== 'undefined';
export const isEdgeRuntime = typeof globalThis !== 'undefined' &&
    globalThis && 'EdgeRuntime' in globalThis &&
    typeof (globalThis as any).EdgeRuntime === 'object';
export const isTest = process.env.NODE_ENV === 'test' ||
    process.env.JEST_WORKER_ID !== undefined;
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

// Détection runtime Next.js
export const isNodeRuntime = isServer && !isEdgeRuntime;
export const canUseNodeAPIs = isNodeRuntime && !isTest;

// Configuration des fonctionnalités par runtime
export const RUNTIME_FEATURES = {
    redis: canUseNodeAPIs && !isEdgeRuntime,
    prisma: isServer, // Prisma fonctionne en Node et Edge avec adapters
    sequelize: canUseNodeAPIs, // Sequelize ne fonctionne qu'en Node
    fileSystem: canUseNodeAPIs,
    webSocket: isServer,
    sessionStorage: isBrowser,
    localStorage: isBrowser,
} as const;

/**
 * Vérifie si une fonctionnalité est disponible dans le runtime actuel
 */
export function isFeatureAvailable(feature: keyof typeof RUNTIME_FEATURES): boolean {
    return RUNTIME_FEATURES[feature];
}

/**
 * Exécute une fonction seulement si le runtime le permet
 */
export function ifRuntimeSupports<T>(
    feature: keyof typeof RUNTIME_FEATURES,
    fn: () => T,
    fallback?: T
): T | undefined {
    if (isFeatureAvailable(feature)) {
        try {
            return fn();
        } catch (error: unknown) {
            logger.warn(`Runtime feature ${feature} failed:`, error instanceof Error ? error : new Error(String(error)));
        }
    }
    return fallback;
}

/**
 * Logger d'informations runtime pour debug
 */
export function logRuntimeInfo(): void {
    if (isDevelopment) {
        logger.info('🔧 Runtime Detection:', {
            isServer,
            isBrowser,
            isEdgeRuntime,
            isTest,
            isDevelopment,
            isProduction,
            isNodeRuntime,
            canUseNodeAPIs,
            features: RUNTIME_FEATURES
        });
    }
}

/**
 * Configuration conditionnelle pour les imports dynamiques
 */
export const DYNAMIC_IMPORTS = {
    redis: () => isFeatureAvailable('redis') ? import('ioredis') : null,
    sequelize: () => isFeatureAvailable('sequelize') ? import('sequelize') : null,
} as const; 