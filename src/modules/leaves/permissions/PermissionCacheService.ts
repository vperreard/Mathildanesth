import { LeavePermission } from './LeavePermissionService';

/**
 * Configuration du cache distribué
 */
export interface DistributedCacheConfig {
    enabled: boolean;            // Activer le cache distribué
    keyPrefix: string;           // Préfixe pour les clés du cache
    ttlMs: number;               // Durée de vie des entrées
    storageKey: string;          // Clé utilisée pour stocker dans sessionStorage
    compressionEnabled: boolean; // Activer la compression des données
    compressionThreshold: number; // Taille à partir de laquelle compresser
    synchronizationInterval: number; // Intervalle de synchronisation en ms
}

/**
 * Configuration du cache à deux niveaux
 */
export interface TwoLevelCacheConfig {
    localCache: {
        enabled: boolean;        // Activer le cache local (mémoire)
        ttlMs: number;           // Durée de vie des entrées locales
        maxSize: number;         // Taille maximale du cache local
        preloadingEnabled: boolean; // Préchargement des permissions fréquentes
    };
    distributedCache: DistributedCacheConfig;
    prefetchedPermissions: LeavePermission[]; // Permissions à précharger
}

/**
 * Structure d'une entrée dans le cache local
 */
interface LocalCacheEntry<T> {
    value: T;
    timestamp: number;
    hits: number;
}

/**
 * Types de résultats de recherche dans le cache
 */
export enum CacheResult {
    LOCAL_HIT = 'local_hit',
    DISTRIBUTED_HIT = 'distributed_hit',
    MISS = 'miss'
}

/**
 * Niveau du cache
 */
export enum CacheLevel {
    LOCAL = 'local',
    DISTRIBUTED = 'distributed',
    BOTH = 'both'
}

/**
 * Service de cache à deux niveaux optimisé pour les permissions
 * Combine un cache local en mémoire et un cache distribué via sessionStorage
 */
export class PermissionCacheService {
    private static instance: PermissionCacheService;
    private readonly debug: boolean = process.env.NODE_ENV === 'development';

    // Cache en mémoire (niveau 1 - le plus rapide)
    private localCache: Map<string, LocalCacheEntry<any>> = new Map();

    // Configuration
    private config: TwoLevelCacheConfig = {
        localCache: {
            enabled: true,
            ttlMs: 5 * 60 * 1000, // 5 minutes
            maxSize: 1000,
            preloadingEnabled: true
        },
        distributedCache: {
            enabled: true,
            keyPrefix: 'perm_cache:',
            ttlMs: 30 * 60 * 1000, // 30 minutes
            storageKey: 'permissionCache',
            compressionEnabled: true,
            compressionThreshold: 10240, // 10 KB
            synchronizationInterval: 60 * 1000 // 1 minute
        },
        prefetchedPermissions: [
            // Permissions les plus fréquemment utilisées à précharger
            LeavePermission.VIEW_OWN_LEAVES,
            LeavePermission.REQUEST_LEAVE,
            LeavePermission.CANCEL_OWN_LEAVE,
            LeavePermission.VIEW_TEAM_LEAVES
        ]
    };

    // Statistiques
    private stats = {
        localHits: 0,
        distributedHits: 0,
        misses: 0,
        localEvictions: 0,
        distributedSaves: 0,
        distributedLoads: 0,
        totalLookups: 0,
        preloadedEntries: 0
    };

    // Timer pour la synchronisation
    private syncTimer: NodeJS.Timeout | null = null;

    /**
     * Obtenir l'instance unique du service de cache
     */
    public static getInstance(): PermissionCacheService {
        if (!PermissionCacheService.instance) {
            PermissionCacheService.instance = new PermissionCacheService();
        }
        return PermissionCacheService.instance;
    }

    /**
     * Constructeur privé (Singleton)
     */
    private constructor() {
        if (this.debug) {
            console.debug('[PermissionCacheService] Initialized');
        }

        // Charger le cache distribué au démarrage
        this.loadDistributedCache();

        // Démarrer la synchronisation périodique
        this.startCacheSynchronization();
    }

    /**
     * Configure le service de cache
     */
    public configure(config: Partial<TwoLevelCacheConfig>): void {
        this.config = {
            ...this.config,
            localCache: {
                ...this.config.localCache,
                ...(config.localCache || {})
            },
            distributedCache: {
                ...this.config.distributedCache,
                ...(config.distributedCache || {})
            },
            prefetchedPermissions: config.prefetchedPermissions || this.config.prefetchedPermissions
        };

        if (this.debug) {
            console.debug('[PermissionCacheService] Configuration updated', this.config);
        }

        // Redémarrer la synchronisation si nécessaire
        this.restartSynchronization();
    }

    /**
     * Obtenir une valeur du cache
     * Cherche d'abord dans le cache local, puis dans le cache distribué
     */
    public get<T>(key: string): { value: T | null, source: CacheResult } {
        this.stats.totalLookups++;

        // Si le cache est désactivé, retourner null
        if (!this.config.localCache.enabled && !this.config.distributedCache.enabled) {
            return { value: null, source: CacheResult.MISS };
        }

        // Vérifier d'abord le cache local (le plus rapide)
        if (this.config.localCache.enabled) {
            const localEntry = this.localCache.get(key);

            if (localEntry) {
                const now = Date.now();

                // Vérifier si l'entrée est encore valide
                if (now - localEntry.timestamp < this.config.localCache.ttlMs) {
                    // Entrée valide, incrémenter le compteur de hits
                    localEntry.hits++;
                    this.stats.localHits++;

                    return { value: localEntry.value, source: CacheResult.LOCAL_HIT };
                } else {
                    // Entrée expirée, la supprimer
                    this.localCache.delete(key);
                }
            }
        }

        // Si pas trouvé dans le cache local, essayer le cache distribué
        if (this.config.distributedCache.enabled) {
            try {
                const distributedKey = this.getDistributedKey(key);
                const cachedValue = sessionStorage.getItem(distributedKey);

                if (cachedValue) {
                    try {
                        const entry = JSON.parse(cachedValue);
                        const now = Date.now();

                        // Vérifier si l'entrée est encore valide
                        if (now - entry.timestamp < this.config.distributedCache.ttlMs) {
                            // Entrée valide, l'ajouter au cache local pour accès futur plus rapide
                            if (this.config.localCache.enabled) {
                                this.setLocalCache(key, entry.value);
                            }

                            this.stats.distributedHits++;
                            return { value: entry.value, source: CacheResult.DISTRIBUTED_HIT };
                        } else {
                            // Entrée expirée, la supprimer
                            sessionStorage.removeItem(distributedKey);
                        }
                    } catch (error) {
                        console.error(`[PermissionCacheService] Error parsing cache entry for key ${key}:`, error);
                        // Supprimer l'entrée corrompue
                        sessionStorage.removeItem(distributedKey);
                    }
                }
            } catch (error) {
                // Ignorer les erreurs de sessionStorage (ex: en navigation privée)
                console.warn('[PermissionCacheService] SessionStorage access error:', error);
            }
        }

        // Valeur non trouvée dans aucun des caches
        this.stats.misses++;
        return { value: null, source: CacheResult.MISS };
    }

    /**
     * Mettre une valeur dans le cache (aux deux niveaux)
     */
    public set<T>(key: string, value: T, level: CacheLevel = CacheLevel.BOTH): void {
        // Si le cache est désactivé, ne rien faire
        if (!this.config.localCache.enabled && !this.config.distributedCache.enabled) {
            return;
        }

        // Enregistrer dans le cache local
        if ((level === CacheLevel.LOCAL || level === CacheLevel.BOTH) && this.config.localCache.enabled) {
            this.setLocalCache(key, value);
        }

        // Enregistrer dans le cache distribué
        if ((level === CacheLevel.DISTRIBUTED || level === CacheLevel.BOTH) && this.config.distributedCache.enabled) {
            this.setDistributedCache(key, value);
        }
    }

    /**
     * Mettre une valeur dans le cache local
     */
    private setLocalCache<T>(key: string, value: T): void {
        // Nettoyer le cache si nécessaire
        this.cleanLocalCacheIfNeeded();

        // Ajouter l'entrée
        this.localCache.set(key, {
            value,
            timestamp: Date.now(),
            hits: 0
        });
    }

    /**
     * Mettre une valeur dans le cache distribué
     */
    private setDistributedCache<T>(key: string, value: T): void {
        try {
            const distributedKey = this.getDistributedKey(key);
            const entry = {
                value,
                timestamp: Date.now()
            };

            let serializedEntry = JSON.stringify(entry);

            // Compresser si nécessaire
            if (this.config.distributedCache.compressionEnabled &&
                serializedEntry.length > this.config.distributedCache.compressionThreshold) {
                // Dans un environnement réel, on utiliserait une vraie compression
                // Ici, on se contente de signaler qu'on compresserait
                if (this.debug) {
                    console.debug(`[PermissionCacheService] Would compress entry for ${key} (${serializedEntry.length} bytes)`);
                }
            }

            sessionStorage.setItem(distributedKey, serializedEntry);
            this.stats.distributedSaves++;
        } catch (error) {
            // Ignorer les erreurs de sessionStorage (ex: quota dépassé, navigation privée)
            console.warn('[PermissionCacheService] Error storing in distributed cache:', error);
        }
    }

    /**
     * Obtenir la clé pour le cache distribué
     */
    private getDistributedKey(key: string): string {
        return `${this.config.distributedCache.keyPrefix}${key}`;
    }

    /**
     * Nettoyer le cache local si nécessaire
     */
    private cleanLocalCacheIfNeeded(): void {
        if (this.localCache.size >= this.config.localCache.maxSize) {
            // Stratégie d'éviction : supprimer les entrées les moins utilisées ou les plus anciennes
            const entries = [...this.localCache.entries()];

            // Trier par nombre de hits (croissant) puis par timestamp (croissant)
            entries.sort((a, b) => {
                if (a[1].hits === b[1].hits) {
                    return a[1].timestamp - b[1].timestamp;
                }
                return a[1].hits - b[1].hits;
            });

            // Supprimer 10% des entrées
            const entriesToRemove = Math.max(Math.floor(this.config.localCache.maxSize * 0.1), 10);

            for (let i = 0; i < entriesToRemove && i < entries.length; i++) {
                this.localCache.delete(entries[i][0]);
                this.stats.localEvictions++;
            }

            if (this.debug) {
                console.debug(`[PermissionCacheService] Cleaned ${entriesToRemove} entries from local cache`);
            }
        }
    }

    /**
     * Invalider une entrée du cache (aux deux niveaux)
     */
    public invalidate(key: string): void {
        // Supprimer du cache local
        this.localCache.delete(key);

        // Supprimer du cache distribué
        try {
            const distributedKey = this.getDistributedKey(key);
            sessionStorage.removeItem(distributedKey);
        } catch (error) {
            // Ignorer les erreurs de sessionStorage
        }
    }

    /**
     * Invalider toutes les entrées qui correspondent à un préfixe
     */
    public invalidateByPrefix(prefix: string): number {
        let count = 0;

        // Invalider dans le cache local
        for (const key of this.localCache.keys()) {
            if (key.startsWith(prefix)) {
                this.localCache.delete(key);
                count++;
            }
        }

        // Invalider dans le cache distribué
        try {
            const distributedPrefix = this.getDistributedKey(prefix);

            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);

                if (key && key.startsWith(distributedPrefix)) {
                    sessionStorage.removeItem(key);
                    count++;
                }
            }
        } catch (error) {
            // Ignorer les erreurs de sessionStorage
        }

        if (this.debug) {
            console.debug(`[PermissionCacheService] Invalidated ${count} entries with prefix '${prefix}'`);
        }

        return count;
    }

    /**
     * Vider complètement le cache
     */
    public clear(): void {
        // Vider le cache local
        this.localCache.clear();

        // Vider le cache distribué
        try {
            const prefix = this.config.distributedCache.keyPrefix;

            for (let i = sessionStorage.length - 1; i >= 0; i--) {
                const key = sessionStorage.key(i);

                if (key && key.startsWith(prefix)) {
                    sessionStorage.removeItem(key);
                }
            }
        } catch (error) {
            // Ignorer les erreurs de sessionStorage
        }

        if (this.debug) {
            console.debug('[PermissionCacheService] Cache cleared');
        }
    }

    /**
     * Précharger les permissions fréquemment utilisées
     * Cette méthode est appelée lors de l'initialisation
     */
    public preloadFrequentPermissions(userId: string): void {
        if (!this.config.localCache.preloadingEnabled || !userId) {
            return;
        }

        let preloadedCount = 0;

        // Précharger les permissions configurées
        for (const permission of this.config.prefetchedPermissions) {
            const keys = [
                // Permission générale
                `permission=${permission}|userId=${userId}`,

                // Autres variantes selon les cas d'utilisation
                `permission=${permission}|userId=${userId}|targetUser=${userId}`,
            ];

            for (const key of keys) {
                this.localCache.set(key, {
                    value: true, // Valeur par défaut, sera mise à jour lors d'une vérification réelle
                    timestamp: Date.now(),
                    hits: 0
                });

                preloadedCount++;
            }
        }

        this.stats.preloadedEntries += preloadedCount;

        if (this.debug) {
            console.debug(`[PermissionCacheService] Preloaded ${preloadedCount} permission entries for user ${userId}`);
        }
    }

    /**
     * Charge le cache distribué dans le cache local
     */
    private loadDistributedCache(): void {
        if (!this.config.distributedCache.enabled || !this.config.localCache.enabled) {
            return;
        }

        try {
            let loadedCount = 0;
            const prefix = this.config.distributedCache.keyPrefix;
            const now = Date.now();

            for (let i = 0; i < sessionStorage.length; i++) {
                const fullKey = sessionStorage.key(i);

                if (fullKey && fullKey.startsWith(prefix)) {
                    const cachedValue = sessionStorage.getItem(fullKey);

                    if (cachedValue) {
                        try {
                            const entry = JSON.parse(cachedValue);

                            // Vérifier si l'entrée est encore valide
                            if (now - entry.timestamp < this.config.distributedCache.ttlMs) {
                                // Extraire la clé réelle (sans le préfixe)
                                const key = fullKey.substring(prefix.length);

                                // Ajouter au cache local
                                this.localCache.set(key, {
                                    value: entry.value,
                                    timestamp: entry.timestamp,
                                    hits: 0
                                });

                                loadedCount++;
                            } else {
                                // Entrée expirée, la supprimer
                                sessionStorage.removeItem(fullKey);
                            }
                        } catch (error) {
                            // Entrée corrompue, la supprimer
                            sessionStorage.removeItem(fullKey);
                        }
                    }
                }
            }

            this.stats.distributedLoads++;

            if (this.debug) {
                console.debug(`[PermissionCacheService] Loaded ${loadedCount} entries from distributed cache`);
            }
        } catch (error) {
            console.warn('[PermissionCacheService] Error loading distributed cache:', error);
        }
    }

    /**
     * Démarrer la synchronisation périodique du cache
     */
    private startCacheSynchronization(): void {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }

        if (!this.config.distributedCache.enabled) {
            return;
        }

        this.syncTimer = setInterval(() => {
            this.loadDistributedCache();
        }, this.config.distributedCache.synchronizationInterval);

        if (this.debug) {
            console.debug(`[PermissionCacheService] Cache synchronization started (interval: ${this.config.distributedCache.synchronizationInterval}ms)`);
        }
    }

    /**
     * Redémarrer la synchronisation du cache
     */
    private restartSynchronization(): void {
        this.startCacheSynchronization();
    }

    /**
     * Arrêter la synchronisation du cache
     */
    public stopSynchronization(): void {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;

            if (this.debug) {
                console.debug('[PermissionCacheService] Cache synchronization stopped');
            }
        }
    }

    /**
     * Obtenir les statistiques du cache
     */
    public getStats(): typeof this.stats & {
        localCacheSize: number,
        hitRate: number,
        localHitRate: number,
        distributedHitRate: number
    } {
        const totalHits = this.stats.localHits + this.stats.distributedHits;
        const hitRate = this.stats.totalLookups > 0 ? totalHits / this.stats.totalLookups : 0;
        const localHitRate = this.stats.totalLookups > 0 ? this.stats.localHits / this.stats.totalLookups : 0;
        const distributedHitRate = this.stats.totalLookups > 0 ? this.stats.distributedHits / this.stats.totalLookups : 0;

        return {
            ...this.stats,
            localCacheSize: this.localCache.size,
            hitRate,
            localHitRate,
            distributedHitRate
        };
    }
} 