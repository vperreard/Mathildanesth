import { AnyCalendarEvent, CalendarFilters, CalendarSettings } from '../types/event';

// Interface pour une entrée de cache générique
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

// Options de configuration du cache
interface CacheOptions {
    ttl: number; // Durée de vie en millisecondes
    key?: string; // Clé de cache personnalisée (optionnelle)
}

// Valeurs par défaut pour les options de cache
const DEFAULT_CACHE_OPTIONS: CacheOptions = {
    ttl: 5 * 60 * 1000, // 5 minutes par défaut
};

// Classe singleton pour la gestion du cache des événements du calendrier
class CalendarCacheService {
    private static instance: CalendarCacheService;
    private eventCache: Map<string, CacheEntry<AnyCalendarEvent[]>> = new Map();
    private settingsCache: Map<string, CacheEntry<CalendarSettings>> = new Map();
    private defaultTtl: number = 5 * 60 * 1000; // 5 minutes par défaut

    private constructor() {
        // Initialisation du cache
        this.cleanupExpiredEntries();
    }

    // Obtenir l'instance singleton
    public static getInstance(): CalendarCacheService {
        if (!CalendarCacheService.instance) {
            CalendarCacheService.instance = new CalendarCacheService();
        }
        return CalendarCacheService.instance;
    }

    // Générer une clé de cache à partir des filtres
    private generateCacheKey(filters: CalendarFilters): string {
        // Convertir les filtres en chaîne pour créer une clé unique
        const key = JSON.stringify({
            eventTypes: filters.eventTypes.sort(),
            userIds: (filters.userIds || []).sort(),
            userRoles: (filters.userRoles || []).sort(),
            leaveTypes: (filters.leaveTypes || []).sort(),
            leaveStatuses: (filters.leaveStatuses || []).sort(),
            locationIds: (filters.locationIds || []).sort(),
            teamIds: (filters.teamIds || []).sort(),
            specialtyIds: (filters.specialtyIds || []).sort(),
            searchTerm: filters.searchTerm || '',
            startDate: filters.dateRange?.start.toISOString(),
            endDate: filters.dateRange?.end.toISOString()
        });

        return key;
    }

    // Stocker des événements dans le cache
    public cacheEvents(
        events: AnyCalendarEvent[],
        filters: CalendarFilters,
        options: Partial<CacheOptions> = {}
    ): void {
        const { ttl } = { ...DEFAULT_CACHE_OPTIONS, ...options };
        const key = options.key || this.generateCacheKey(filters);
        const now = Date.now();

        this.eventCache.set(key, {
            data: events,
            timestamp: now,
            expiresAt: now + ttl
        });

        // Enregistrer un timer pour supprimer automatiquement l'entrée expirée
        setTimeout(() => {
            const entry = this.eventCache.get(key);
            if (entry && !this.isEntryValid(entry)) {
                this.eventCache.delete(key);
            }
        }, ttl);
    }

    // Récupérer des événements du cache
    public getCachedEvents(
        filters: CalendarFilters,
        options: Partial<CacheOptions> = {}
    ): AnyCalendarEvent[] | null {
        const key = options.key || this.generateCacheKey(filters);
        const entry = this.eventCache.get(key);

        if (!entry) return null;

        // Vérifier si l'entrée est expirée
        if (Date.now() > entry.expiresAt) {
            this.eventCache.delete(key);
            return null;
        }

        return entry.data;
    }

    // Stocker des paramètres dans le cache
    public cacheSettings(
        userId: string,
        settings: CalendarSettings,
        options: Partial<CacheOptions> = {}
    ): void {
        const { ttl } = { ...DEFAULT_CACHE_OPTIONS, ...options };
        const key = options.key || `settings_${userId}`;
        const now = Date.now();

        this.settingsCache.set(key, {
            data: settings,
            timestamp: now,
            expiresAt: now + ttl
        });
    }

    // Récupérer des paramètres du cache
    public getCachedSettings(
        userId: string,
        options: Partial<CacheOptions> = {}
    ): CalendarSettings | null {
        const key = options.key || `settings_${userId}`;
        const entry = this.settingsCache.get(key);

        if (!entry) return null;

        // Vérifier si l'entrée est expirée
        if (Date.now() > entry.expiresAt) {
            this.settingsCache.delete(key);
            return null;
        }

        return entry.data;
    }

    // Invalider une entrée spécifique du cache d'événements
    public invalidateEvents(filters: CalendarFilters): void {
        const key = this.generateCacheKey(filters);
        this.eventCache.delete(key);
    }

    // Invalider une entrée spécifique du cache de paramètres
    public invalidateSettings(userId: string): void {
        const key = `settings_${userId}`;
        this.settingsCache.delete(key);
    }

    // Invalider tout le cache
    public clearCache(): void {
        this.eventCache.clear();
        this.settingsCache.clear();
    }

    // Nettoyer les entrées expirées
    private cleanupExpiredEntries(): void {
        const now = Date.now();

        // Nettoyer le cache d'événements en utilisant Array.from pour éviter les problèmes d'itération
        Array.from(this.eventCache.entries()).forEach(([key, entry]) => {
            if (now > entry.expiresAt) {
                this.eventCache.delete(key);
            }
        });

        // Nettoyer le cache de paramètres en utilisant Array.from pour éviter les problèmes d'itération
        Array.from(this.settingsCache.entries()).forEach(([key, entry]) => {
            if (now > entry.expiresAt) {
                this.settingsCache.delete(key);
            }
        });

        // Programmer le prochain nettoyage
        setTimeout(() => this.cleanupExpiredEntries(), 60 * 1000); // Toutes les minutes
    }

    // Vérifie si une entrée de cache est encore valide
    private isEntryValid(entry: CacheEntry<AnyCalendarEvent[]>): boolean {
        const now = Date.now();
        return now - entry.timestamp < entry.expiresAt - entry.timestamp;
    }
}

// Exporter l'instance du service de cache
export const calendarCache = CalendarCacheService.getInstance(); 