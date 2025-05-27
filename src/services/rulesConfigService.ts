import { prisma } from '@/lib/prisma';
import { RulesConfiguration, FatigueConfig, defaultRulesConfiguration, defaultFatigueConfig } from '@/types/rules';

jest.mock('@/lib/prisma');


const CONFIG_KEY = 'PLANNING_RULES_CONFIG';
const FATIGUE_CONFIG_KEY = 'FATIGUE_CONFIG';

// Cache en mémoire avec TTL
interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

class RulesConfigService {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    /**
     * Récupère la configuration des règles depuis le cache ou la base de données
     */
    async getRulesConfiguration(): Promise<RulesConfiguration> {
        const cached = this.getFromCache<RulesConfiguration>(CONFIG_KEY);
        if (cached) return cached;

        try {
            const config = await prisma.systemConfig.findUnique({
                where: { key: CONFIG_KEY }
            });

            if (config?.value) {
                const rules = config.value as RulesConfiguration;
                this.setCache(CONFIG_KEY, rules);
                return rules;
            }
        } catch (error) {
            console.error('Erreur lors du chargement des règles:', error);
        }

        // Retourner la configuration par défaut si rien n'est trouvé
        return defaultRulesConfiguration;
    }

    /**
     * Récupère la configuration de fatigue
     */
    async getFatigueConfiguration(): Promise<FatigueConfig> {
        const cached = this.getFromCache<FatigueConfig>(FATIGUE_CONFIG_KEY);
        if (cached) return cached;

        try {
            const config = await prisma.systemConfig.findUnique({
                where: { key: FATIGUE_CONFIG_KEY }
            });

            if (config?.value) {
                const fatigueConfig = config.value as FatigueConfig;
                this.setCache(FATIGUE_CONFIG_KEY, fatigueConfig);
                return fatigueConfig;
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la config fatigue:', error);
        }

        return defaultFatigueConfig;
    }

    /**
     * Met à jour la configuration des règles
     */
    async updateRulesConfiguration(rules: RulesConfiguration, userId: string): Promise<void> {
        await prisma.systemConfig.upsert({
            where: { key: CONFIG_KEY },
            update: {
                value: rules as any,
                updatedAt: new Date(),
                updatedBy: userId
            },
            create: {
                key: CONFIG_KEY,
                value: rules as any,
                description: 'Configuration des règles de génération de planning',
                updatedBy: userId
            }
        });

        // Invalider le cache
        this.invalidateCache(CONFIG_KEY);
    }

    /**
     * Met à jour la configuration de fatigue
     */
    async updateFatigueConfiguration(fatigueConfig: FatigueConfig, userId: string): Promise<void> {
        await prisma.systemConfig.upsert({
            where: { key: FATIGUE_CONFIG_KEY },
            update: {
                value: fatigueConfig as any,
                updatedAt: new Date(),
                updatedBy: userId
            },
            create: {
                key: FATIGUE_CONFIG_KEY,
                value: fatigueConfig as any,
                description: 'Configuration du système de fatigue',
                updatedBy: userId
            }
        });

        // Invalider le cache
        this.invalidateCache(FATIGUE_CONFIG_KEY);
    }

    /**
     * Récupère une configuration spécifique par clé
     */
    async getConfigByKey<T>(key: string, defaultValue: T): Promise<T> {
        const cached = this.getFromCache<T>(key);
        if (cached) return cached;

        try {
            const config = await prisma.systemConfig.findUnique({
                where: { key }
            });

            if (config?.value) {
                const value = config.value as T;
                this.setCache(key, value);
                return value;
            }
        } catch (error) {
            console.error(`Erreur lors du chargement de la config ${key}:`, error);
        }

        return defaultValue;
    }

    /**
     * Invalide tout le cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Gestion du cache interne
     */
    private getFromCache<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > this.CACHE_TTL) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    private setCache<T>(key: string, data: T): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    private invalidateCache(key: string): void {
        this.cache.delete(key);
    }
}

// Export d'une instance singleton
export const rulesConfigService = new RulesConfigService();