import { redis } from '@/lib/redis';
import { LeaveFilters, LeaveType, LeaveStatus } from '../types/leave';
import { LeaveEvent, CacheInvalidationStrategy } from '../types/cache';
import { format } from 'date-fns';

/**
 * Service de cache intelligent pour les requêtes de congés
 * Implémente différentes stratégies de mise en cache et d'invalidation
 * pour optimiser les performances des requêtes fréquentes
 */
export class LeaveQueryCacheService {
    private static instance: LeaveQueryCacheService;
    private isRedisAvailable: boolean = true;

    // Durées de vie du cache selon la nature des données
    private readonly TTL = {
        LIST: 3600, // 1 heure pour les listes de congés
        DETAIL: 86400, // 24 heures pour les détails d'un congé
        BALANCE: 7200, // 2 heures pour les soldes de congés
        STATS: 43200, // 12 heures pour les statistiques
        USER_LEAVES: 1800, // 30 minutes pour les congés d'un utilisateur
        CONFLICTS: 600, // 10 minutes pour les conflits (données critiques)
    };

    // Préfixes des clés de cache pour les différents types de données
    private readonly KEY_PREFIX = {
        LIST: 'leaves:list',
        DETAIL: 'leave:detail',
        BALANCE: 'leave:balance',
        STATS: 'leave:stats',
        USER_LEAVES: 'user:leaves',
        CONFLICTS: 'leave:conflicts',
    };

    // Constructeur privé (pattern Singleton)
    private constructor() {
        // Vérifier la disponibilité de Redis au démarrage
        this.checkRedisAvailability();
    }

    /**
     * Obtenir l'instance unique du service
     */
    public static getInstance(): LeaveQueryCacheService {
        if (!LeaveQueryCacheService.instance) {
            LeaveQueryCacheService.instance = new LeaveQueryCacheService();
        }
        return LeaveQueryCacheService.instance;
    }

    /**
     * Vérifie si Redis est disponible
     */
    private async checkRedisAvailability(): Promise<void> {
        try {
            this.isRedisAvailable = await redis.ping();
            console.log(`Redis disponibilité: ${this.isRedisAvailable ? 'OK' : 'NON DISPONIBLE'}`);
        } catch (error) {
            console.error('Redis n\'est pas disponible:', error);
            this.isRedisAvailable = false;
        }
    }

    /**
     * Génère une clé de cache pour une liste de congés filtrée
     */
    public generateListKey(filters: LeaveFilters): string {
        const { userId, departmentId, startDate, endDate, status, type, page, limit, sortBy, sortOrder, search } = filters;

        // Créer un tableau des parties de la clé non-nulles
        const keyParts = [
            userId && `uid:${userId}`,
            departmentId && `dept:${departmentId}`,
            startDate && `start:${typeof startDate === 'string' ? startDate : format(startDate, 'yyyy-MM-dd')}`,
            endDate && `end:${typeof endDate === 'string' ? endDate : format(endDate, 'yyyy-MM-dd')}`,
            status && `status:${Array.isArray(status) ? status.join(',') : status}`,
            type && `type:${Array.isArray(type) ? type.join(',') : type}`,
            page && `page:${page}`,
            limit && `limit:${limit}`,
            sortBy && `sort:${sortBy}:${sortOrder || 'desc'}`,
            search && `q:${search}`
        ].filter(Boolean);

        // Si aucun filtre n'est spécifié, utiliser une clé générique
        if (keyParts.length === 0) {
            return `${this.KEY_PREFIX.LIST}:all`;
        }

        return `${this.KEY_PREFIX.LIST}:${keyParts.join(':')}`;
    }

    /**
     * Génère une clé pour le cache des détails d'un congé
     */
    public generateDetailKey(leaveId: string): string {
        return `${this.KEY_PREFIX.DETAIL}:${leaveId}`;
    }

    /**
     * Génère une clé pour le cache du solde de congés d'un utilisateur
     */
    public generateBalanceKey(userId: string, year: number): string {
        return `${this.KEY_PREFIX.BALANCE}:${userId}:${year}`;
    }

    /**
     * Génère une clé pour le cache des congés d'un utilisateur
     */
    public generateUserLeavesKey(userId: string, year?: number): string {
        return `${this.KEY_PREFIX.USER_LEAVES}:${userId}${year ? `:${year}` : ''}`;
    }

    /**
     * Génère une clé pour le cache des statistiques
     */
    public generateStatsKey(filters: Record<string, any> = {}): string {
        // Créer une clé basée sur les filtres des statistiques
        const filterParts = Object.entries(filters)
            .map(([key, value]) => `${key}:${value}`)
            .join(':');

        return filterParts
            ? `${this.KEY_PREFIX.STATS}:${filterParts}`
            : `${this.KEY_PREFIX.STATS}:global`;
    }

    /**
     * Met en cache des données avec TTL approprié
     */
    public async cacheData<T>(key: string, data: T, type: keyof typeof this.TTL): Promise<void> {
        // Vérifier d'abord si Redis est disponible
        if (!this.isRedisAvailable) {
            await this.checkRedisAvailability();
            if (!this.isRedisAvailable) {
                console.warn(`Cache désactivé: Redis n'est pas disponible`);
                return;
            }
        }

        try {
            const ttl = this.TTL[type];
            await redis.set(key, JSON.stringify(data), 'EX', ttl);
            console.log(`Cache mis à jour: ${key} (TTL: ${ttl}s)`);
        } catch (error) {
            console.error(`Erreur lors de la mise en cache (${key}):`, error);
            this.isRedisAvailable = false;
            // Ne pas faire échouer l'opération en cas d'erreur de cache
        }
    }

    /**
     * Récupère des données depuis le cache
     * @returns Les données ou null si non trouvées
     */
    public async getCachedData<T>(key: string): Promise<T | null> {
        // Vérifier d'abord si Redis est disponible
        if (!this.isRedisAvailable) {
            await this.checkRedisAvailability();
            if (!this.isRedisAvailable) {
                console.warn(`Cache désactivé: Redis n'est pas disponible`);
                return null;
            }
        }

        try {
            const cachedData = await redis.get(key);
            if (!cachedData) return null;

            return JSON.parse(cachedData) as T;
        } catch (error) {
            console.error(`Erreur lors de la récupération du cache (${key}):`, error);
            this.isRedisAvailable = false;
            return null;
        }
    }

    /**
     * Invalide le cache suite à un événement
     * @param event Événement déclenchant l'invalidation
     * @param data Données associées à l'événement
     */
    public async invalidateCache(event: LeaveEvent, data: any): Promise<void> {
        // Vérifier d'abord si Redis est disponible
        if (!this.isRedisAvailable) {
            await this.checkRedisAvailability();
            if (!this.isRedisAvailable) {
                console.warn(`Invalidation du cache ignorée: Redis n'est pas disponible`);
                return;
            }
        }

        try {
            // Stratégie d'invalidation selon le type d'événement
            switch (event) {
                case LeaveEvent.CREATED:
                    await this.invalidateOnCreate(data);
                    break;

                case LeaveEvent.UPDATED:
                    await this.invalidateOnUpdate(data);
                    break;

                case LeaveEvent.DELETED:
                    await this.invalidateOnDelete(data);
                    break;

                case LeaveEvent.STATUS_CHANGED:
                    await this.invalidateOnStatusChange(data);
                    break;

                case LeaveEvent.BALANCE_UPDATED:
                    await this.invalidateOnBalanceUpdate(data);
                    break;

                default:
                    // Invalidation complète en cas d'événement inconnu
                    await this.invalidateAll();
            }
        } catch (error) {
            console.error(`Erreur lors de l'invalidation du cache:`, error);
            this.isRedisAvailable = false;
        }
    }

    /**
     * Stratégie d'invalidation lors de la création d'un congé
     */
    private async invalidateOnCreate(data: { leave: any }): Promise<void> {
        const { leave } = data;

        // Invalider les listes qui pourraient contenir ce congé
        const listPattern = `${this.KEY_PREFIX.LIST}*`;
        const userLeavesKey = this.generateUserLeavesKey(leave.userId);

        // Invalider les soldes de l'utilisateur
        const balanceKey = this.generateBalanceKey(leave.userId, new Date(leave.startDate).getFullYear());

        // Invalider les statistiques globales
        const statsKey = `${this.KEY_PREFIX.STATS}*`;

        await Promise.all([
            redis.del(userLeavesKey),
            redis.del(balanceKey),
            this.deleteByPattern(listPattern),
            this.deleteByPattern(statsKey)
        ]);
    }

    /**
     * Stratégie d'invalidation lors de la mise à jour d'un congé
     */
    private async invalidateOnUpdate(data: { before: any, after: any }): Promise<void> {
        const { before, after } = data;

        // Invalider le détail du congé
        const detailKey = this.generateDetailKey(after.id);

        // Si l'utilisateur a changé, invalider les caches des deux utilisateurs
        const userIds = new Set<string>([before.userId, after.userId]);

        // Invalider les listes qui pourraient contenir ce congé
        const listPattern = `${this.KEY_PREFIX.LIST}*`;

        // Invalider les statistiques
        const statsPattern = `${this.KEY_PREFIX.STATS}*`;

        // Collecter toutes les clés à invalider
        const keysToInvalidate = [detailKey];

        // Ajouter les clés de cache utilisateur
        for (const userId of userIds) {
            keysToInvalidate.push(this.generateUserLeavesKey(userId));

            // Si les dates ont changé, invalider potentiellement plusieurs années
            const years = new Set<number>();
            if (before.startDate) years.add(new Date(before.startDate).getFullYear());
            if (before.endDate) years.add(new Date(before.endDate).getFullYear());
            if (after.startDate) years.add(new Date(after.startDate).getFullYear());
            if (after.endDate) years.add(new Date(after.endDate).getFullYear());

            for (const year of years) {
                keysToInvalidate.push(this.generateBalanceKey(userId, year));
            }
        }

        await Promise.all([
            redis.del(...keysToInvalidate),
            this.deleteByPattern(listPattern),
            this.deleteByPattern(statsPattern)
        ]);
    }

    /**
     * Stratégie d'invalidation lors de la suppression d'un congé
     */
    private async invalidateOnDelete(data: { leave: any }): Promise<void> {
        const { leave } = data;

        // Invalider le détail du congé
        const detailKey = this.generateDetailKey(leave.id);

        // Invalider les listes
        const listPattern = `${this.KEY_PREFIX.LIST}*`;

        // Invalider les données utilisateur
        const userLeavesKey = this.generateUserLeavesKey(leave.userId);
        const balanceKey = this.generateBalanceKey(
            leave.userId,
            new Date(leave.startDate).getFullYear()
        );

        // Invalider les statistiques
        const statsPattern = `${this.KEY_PREFIX.STATS}*`;

        await Promise.all([
            redis.del(detailKey, userLeavesKey, balanceKey),
            this.deleteByPattern(listPattern),
            this.deleteByPattern(statsPattern)
        ]);
    }

    /**
     * Stratégie d'invalidation lors du changement de statut d'un congé
     */
    private async invalidateOnStatusChange(data: { leave: any, oldStatus: LeaveStatus, newStatus: LeaveStatus }): Promise<void> {
        const { leave, oldStatus, newStatus } = data;

        // Invalider le détail du congé
        const detailKey = this.generateDetailKey(leave.id);

        // Invalider les listes filtrées par statut
        const statusListPattern = `${this.KEY_PREFIX.LIST}*status:*`;

        // Invalider les données utilisateur
        const userLeavesKey = this.generateUserLeavesKey(leave.userId);
        const balanceKey = this.generateBalanceKey(
            leave.userId,
            new Date(leave.startDate).getFullYear()
        );

        // Invalider les statistiques
        const statsPattern = `${this.KEY_PREFIX.STATS}*`;

        await Promise.all([
            redis.del(detailKey, userLeavesKey, balanceKey),
            this.deleteByPattern(statusListPattern),
            this.deleteByPattern(statsPattern)
        ]);
    }

    /**
     * Stratégie d'invalidation lors de la mise à jour d'un solde de congés
     */
    private async invalidateOnBalanceUpdate(data: { userId: string, year: number }): Promise<void> {
        const { userId, year } = data;

        // Invalider le solde de l'utilisateur
        const balanceKey = this.generateBalanceKey(userId, year);

        // Invalider les statistiques liées aux soldes
        const statsBalancePattern = `${this.KEY_PREFIX.STATS}*balance*`;

        await Promise.all([
            redis.del(balanceKey),
            this.deleteByPattern(statsBalancePattern)
        ]);
    }

    /**
     * Supprime les clés de cache correspondant à un pattern
     * Utilise SCAN pour une opération plus sûre que KEYS
     */
    private async deleteByPattern(pattern: string): Promise<number> {
        let cursor = '0';
        let deletedCount = 0;

        do {
            // Utiliser SCAN au lieu de KEYS pour ne pas bloquer Redis
            const [nextCursor, keys] = await redis.scan(
                cursor,
                'MATCH', pattern,
                'COUNT', '100'
            );

            cursor = nextCursor;

            if (keys.length > 0) {
                const deleted = await redis.del(...keys);
                deletedCount += deleted;
            }
        } while (cursor !== '0');

        return deletedCount;
    }

    /**
     * Invalide tout le cache
     */
    public async invalidateAll(): Promise<number> {
        let deletedCount = 0;

        // Invalider tous les types de cache
        for (const prefix of Object.values(this.KEY_PREFIX)) {
            const deleted = await this.deleteByPattern(`${prefix}*`);
            deletedCount += deleted;
        }

        console.log(`Cache entièrement invalidé: ${deletedCount} clés supprimées`);
        return deletedCount;
    }

    /**
     * Préchauffe le cache pour les requêtes fréquentes
     * Peut être appelé au démarrage de l'application
     */
    public async preloadCache(): Promise<void> {
        // Cette méthode peut être utilisée pour précharger les données
        // fréquemment accédées dans le cache au démarrage de l'application
        console.log('Préchauffage du cache des congés...');

        // Exemples de données à préchauffer:
        // - Listes de congés actuels
        // - Statistiques globales
        // - Soldes des utilisateurs actifs
    }
} 