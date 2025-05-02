/**
 * Service de cache cohérent pour données fréquemment utilisées
 * Gère le stockage en mémoire des données avec invalidation automatique
 */

type CacheItem<T> = {
    data: T;
    timestamp: number;
    expiresAt: number;
};

type CacheOptions = {
    ttl?: number; // Time to live en millisecondes
    namespace?: string; // Namespace pour regrouper les clés liées
};

type CacheStats = {
    hits: number;
    misses: number;
    size: number;
    keys: string[];
    namespaces: string[];
};

type PersistOptions = {
    storage?: 'localStorage' | 'sessionStorage';
    key?: string;
};

class CacheService {
    private static instance: CacheService;
    private cache: Map<string, CacheItem<any>>;
    private namespaces: Map<string, Set<string>>;
    private stats: {
        hits: number;
        misses: number;
    };
    private persistKey: string;
    private maxSize: number;
    private defaultTTL: number;

    private constructor() {
        this.cache = new Map();
        this.namespaces = new Map();
        this.stats = { hits: 0, misses: 0 };
        this.persistKey = 'app_cache_data';
        this.maxSize = 100; // Nombre maximum d'éléments en cache
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes par défaut

        // Mettre en place le nettoyage périodique du cache
        setInterval(() => this.cleanup(), 60 * 1000); // Nettoyage toutes les minutes

        // Restaurer le cache si possible
        this.tryRestore();
    }

    /**
     * Obtenir l'instance unique du service de cache
     */
    public static getInstance(): CacheService {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }

    /**
     * Définir la configuration globale du cache
     */
    public configure(options: { maxSize?: number; defaultTTL?: number; persistKey?: string }): void {
        if (options.maxSize !== undefined) this.maxSize = options.maxSize;
        if (options.defaultTTL !== undefined) this.defaultTTL = options.defaultTTL;
        if (options.persistKey !== undefined) this.persistKey = options.persistKey;
    }

    /**
     * Stocker une valeur dans le cache
     */
    public set<T>(key: string, data: T, options: CacheOptions = {}): void {
        const { ttl = this.defaultTTL, namespace } = options;
        const now = Date.now();

        // Gérer les namespaces
        if (namespace) {
            if (!this.namespaces.has(namespace)) {
                this.namespaces.set(namespace, new Set());
            }
            this.namespaces.get(namespace)?.add(key);
        }

        // Vérifier si le cache a atteint sa taille maximale
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            // Supprimer l'élément le plus ancien
            this.removeOldest();
        }

        // Stocker les données avec timestamp et date d'expiration
        this.cache.set(key, {
            data,
            timestamp: now,
            expiresAt: ttl > 0 ? now + ttl : Number.MAX_SAFE_INTEGER
        });
    }

    /**
     * Récupérer une valeur du cache
     */
    public get<T>(key: string): T | null {
        const item = this.cache.get(key);

        // Si l'élément n'existe pas ou est expiré
        if (!item || Date.now() > item.expiresAt) {
            if (item && Date.now() > item.expiresAt) {
                // Supprimer l'élément expiré
                this.remove(key);
            }
            this.stats.misses++;
            return null;
        }

        this.stats.hits++;
        return item.data as T;
    }

    /**
     * Vérifier si une clé existe dans le cache et n'est pas expirée
     */
    public has(key: string): boolean {
        const item = this.cache.get(key);
        return !!item && Date.now() <= item.expiresAt;
    }

    /**
     * Supprimer une valeur du cache
     */
    public remove(key: string): boolean {
        // Mettre à jour les namespaces
        for (const [namespace, keys] of this.namespaces.entries()) {
            if (keys.has(key)) {
                keys.delete(key);
                if (keys.size === 0) {
                    this.namespaces.delete(namespace);
                }
            }
        }

        return this.cache.delete(key);
    }

    /**
     * Invalider toutes les entrées d'un namespace
     */
    public invalidateNamespace(namespace: string): void {
        const keys = this.namespaces.get(namespace);
        if (!keys) return;

        // Supprimer chaque clé associée au namespace
        for (const key of keys) {
            this.cache.delete(key);
        }

        // Supprimer le namespace
        this.namespaces.delete(namespace);
    }

    /**
     * Invalider les entrées correspondant à un motif
     */
    public invalidatePattern(pattern: RegExp): number {
        let count = 0;

        // Parcourir toutes les clés et supprimer celles qui correspondent au motif
        for (const key of this.cache.keys()) {
            if (pattern.test(key)) {
                this.remove(key);
                count++;
            }
        }

        return count;
    }

    /**
     * Vider complètement le cache
     */
    public clear(): void {
        this.cache.clear();
        this.namespaces.clear();
    }

    /**
     * Obtenir les statistiques d'utilisation du cache
     */
    public getStats(): CacheStats {
        const namespaces: string[] = [];
        for (const namespace of this.namespaces.keys()) {
            namespaces.push(namespace);
        }

        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            namespaces
        };
    }

    /**
     * Persister l'état du cache dans le stockage du navigateur
     */
    public persist(options: PersistOptions = {}): boolean {
        try {
            const { storage = 'localStorage', key = this.persistKey } = options;

            // Préparer les données à persister
            const dataToSave: Record<string, any> = {};

            for (const [cacheKey, item] of this.cache.entries()) {
                // Ne pas persister les éléments expirés
                if (Date.now() <= item.expiresAt) {
                    dataToSave[cacheKey] = {
                        data: item.data,
                        expiresAt: item.expiresAt
                    };
                }
            }

            // Sauvegarder les namespaces
            const namespacesData: Record<string, string[]> = {};
            for (const [namespace, keys] of this.namespaces.entries()) {
                namespacesData[namespace] = Array.from(keys);
            }

            const persistData = {
                data: dataToSave,
                namespaces: namespacesData,
                timestamp: Date.now()
            };

            // Sauvegarder dans le stockage approprié
            const storageApi = storage === 'localStorage' ? localStorage : sessionStorage;
            storageApi.setItem(key, JSON.stringify(persistData));

            return true;
        } catch (error) {
            console.error('Erreur lors de la persistance du cache:', error);
            return false;
        }
    }

    /**
     * Restaurer l'état du cache depuis le stockage
     */
    public restore(options: PersistOptions = {}): boolean {
        try {
            const { storage = 'localStorage', key = this.persistKey } = options;

            // Récupérer les données du stockage
            const storageApi = storage === 'localStorage' ? localStorage : sessionStorage;
            const serializedData = storageApi.getItem(key);

            if (!serializedData) return false;

            const persistData = JSON.parse(serializedData);
            const now = Date.now();

            // Vérifier si les données sont trop anciennes (plus de 24h)
            if (!persistData.timestamp || now - persistData.timestamp > 24 * 60 * 60 * 1000) {
                return false;
            }

            // Restaurer les données
            for (const [cacheKey, item] of Object.entries(persistData.data)) {
                const typedItem = item as { data: any; expiresAt: number };

                // Ne pas restaurer les éléments expirés
                if (typedItem.expiresAt > now) {
                    this.cache.set(cacheKey, {
                        data: typedItem.data,
                        timestamp: now, // Utiliser l'heure actuelle comme timestamp
                        expiresAt: typedItem.expiresAt
                    });
                }
            }

            // Restaurer les namespaces
            for (const [namespace, keys] of Object.entries(persistData.namespaces)) {
                const keySet = new Set<string>();
                for (const key of keys as string[]) {
                    // Ne pas ajouter de clés qui n'existent plus dans le cache
                    if (this.cache.has(key)) {
                        keySet.add(key);
                    }
                }

                if (keySet.size > 0) {
                    this.namespaces.set(namespace, keySet);
                }
            }

            return true;
        } catch (error) {
            console.error('Erreur lors de la restauration du cache:', error);
            return false;
        }
    }

    /**
     * Essaye de restaurer le cache au démarrage
     */
    private tryRestore(): void {
        // Essayer d'abord localStorage, puis sessionStorage
        if (!this.restore({ storage: 'localStorage' })) {
            this.restore({ storage: 'sessionStorage' });
        }
    }

    /**
     * Nettoyer les éléments expirés du cache
     */
    private cleanup(): void {
        const now = Date.now();
        const expiredKeys: string[] = [];

        // Trouver toutes les clés expirées
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiresAt) {
                expiredKeys.push(key);
            }
        }

        // Supprimer les clés expirées
        for (const key of expiredKeys) {
            this.remove(key);
        }
    }

    /**
     * Supprimer l'élément le plus ancien du cache pour faire de la place
     */
    private removeOldest(): void {
        let oldestKey: string | null = null;
        let oldestTimestamp = Date.now();

        // Trouver la clé la plus ancienne
        for (const [key, item] of this.cache.entries()) {
            if (item.timestamp < oldestTimestamp) {
                oldestTimestamp = item.timestamp;
                oldestKey = key;
            }
        }

        // Supprimer la clé la plus ancienne
        if (oldestKey) {
            this.remove(oldestKey);
        }
    }
}

// Exporter une instance unique du service
export const cacheService = CacheService.getInstance();

// Exporter des méthodes d'utilité pour une utilisation simplifiée
export const setCache = <T>(key: string, data: T, options?: CacheOptions): void => {
    cacheService.set(key, data, options);
};

export const getCache = <T>(key: string): T | null => {
    return cacheService.get<T>(key);
};

export const removeCache = (key: string): boolean => {
    return cacheService.remove(key);
};

export const clearCache = (): void => {
    cacheService.clear();
};

export const invalidateNamespace = (namespace: string): void => {
    cacheService.invalidateNamespace(namespace);
};

export default cacheService; 