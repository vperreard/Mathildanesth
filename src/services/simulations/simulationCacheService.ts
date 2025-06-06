// Service de cache pour optimiser les performances des simulations
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';


interface CacheEntry {
    key: string;
    data: unknown;
    expiresAt: Date;
}

class SimulationCacheService {
    private cache: Map<string, CacheEntry> = new Map();
    private defaultTTL: number = 3600000; // 1 heure en millisecondes

    // Génère une clé de cache basée sur les paramètres de simulation
    generateCacheKey(scenarioId: string, params: unknown): string {
        const paramsString = JSON.stringify(params);
        return createHash('md5').update(`${scenarioId}:${paramsString}`).digest('hex');
    }

    // Récupère une entrée du cache si elle existe et n'a pas expiré
    get(key: string): any | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Vérifier si l'entrée a expiré
        if (new Date() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    // Stocke une entrée dans le cache avec une durée de vie optionnelle
    set(key: string, data: unknown, ttl: number = this.defaultTTL): void {
        const expiresAt = new Date(Date.now() + ttl);
        this.cache.set(key, { key, data, expiresAt });
    }

    // Supprime une entrée du cache
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    // Invalide toutes les entrées du cache liées à un scénario spécifique
    invalidateScenario(scenarioId: string): void {
        for (const [key, entry] of this.cache.entries()) {
            if (key.startsWith(scenarioId)) {
                this.cache.delete(key);
            }
        }
    }

    // Nettoie les entrées expirées du cache
    purgeExpired(): void {
        const now = new Date();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }

    // Récupère ou calcule des résultats intermédiaires
    async getOrCompute(
        scenarioId: string,
        params: unknown,
        computeFn: () => Promise<unknown>,
        ttl?: number
    ): Promise<unknown> {
        const cacheKey = this.generateCacheKey(scenarioId, params);
        const cachedResult = this.get(cacheKey);

        if (cachedResult) {
            return cachedResult;
        }

        // Calculer le résultat
        const result = await computeFn();

        // Stocker dans le cache
        this.set(cacheKey, result, ttl);

        return result;
    }

    // Stocke les résultats intermédiaires dans la base de données pour une persistance à long terme
    async persistIntermediateResults(scenarioId: string, stepName: string, data: unknown): Promise<void> {
        const hash = createHash('md5').update(JSON.stringify(data)).digest('hex');

        await prisma.simulationIntermediateResult.upsert({
            where: {
                scenarioId_stepName: {
                    scenarioId,
                    stepName
                }
            },
            update: {
                data: data,
                hash,
                updatedAt: new Date()
            },
            create: {
                scenarioId,
                stepName,
                data,
                hash,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
    }

    // Récupère les résultats intermédiaires persistants
    async getPersistedResults(scenarioId: string, stepName: string): Promise<any | null> {
        const result = await prisma.simulationIntermediateResult.findUnique({
            where: {
                scenarioId_stepName: {
                    scenarioId,
                    stepName
                }
            }
        });

        return result ? result.data : null;
    }
}

// Exporter une instance singleton
export const simulationCache = new SimulationCacheService(); 