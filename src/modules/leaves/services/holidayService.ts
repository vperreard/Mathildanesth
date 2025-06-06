import apiClient from '@/utils/apiClient';
import { logger } from "../../../lib/logger";
import { parse, format, isBefore, isAfter, addMonths } from 'date-fns';

/**
 * Interface pour un jour férié
 */
export interface Holiday {
    date: string; // Format YYYY-MM-DD
    name: string;
    description?: string;
    isNational: boolean;
}

/**
 * Interface pour les entrées de cache
 */
interface CacheEntry<T> {
    data: T;
    expiry: number;
}

/**
 * Service de gestion des jours fériés avec mise en cache
 */
class HolidayService {
    private static instance: HolidayService;
    private cache: Map<string, CacheEntry<Holiday[]>> = new Map();
    private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 heures en millisecondes

    private constructor() {
        // Initialiser le nettoyage périodique du cache
        setInterval(() => this.cleanCache(), this.CACHE_TTL);
    }

    /**
     * Retourne l'instance unique du service
     */
    public static getInstance(): HolidayService {
        if (!HolidayService.instance) {
            HolidayService.instance = new HolidayService();
        }
        return HolidayService.instance;
    }

    /**
     * Génère une clé de cache à partir des dates de début et de fin
     */
    private generateCacheKey(startDate: string, endDate: string): string {
        return `holidays_${startDate}_${endDate}`;
    }

    /**
     * Nettoie les entrées expirées du cache
     */
    private cleanCache(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiry < now) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Récupère les jours fériés pour une période donnée
     * Utilise le cache si disponible, sinon fait un appel API
     */
    public async getHolidays(startDate: string, endDate: string): Promise<Holiday[]> {
        const cacheKey = this.generateCacheKey(startDate, endDate);

        // Vérifier si les données sont dans le cache
        const cachedEntry = this.cache.get(cacheKey);
        if (cachedEntry && cachedEntry.expiry > Date.now()) {
            return cachedEntry.data;
        }

        try {
            // Récupérer les données depuis l'API
            const response = await apiClient.get('/api/jours-feries', {
                params: { startDate, endDate }
            });

            const holidays = response.data;

            // Mettre en cache les données
            this.cache.set(cacheKey, {
                data: holidays,
                expiry: Date.now() + this.CACHE_TTL
            });

            return holidays;
        } catch (error: unknown) {
            logger.error('Erreur lors de la récupération des jours fériés:', { error: error });

            // En cas d'erreur, retourner les données du cache même si expirées
            if (cachedEntry) {
                return cachedEntry.data;
            }

            // Sinon, retourner une liste vide
            return [];
        }
    }

    /**
     * Vérifie si une date est un jour férié
     */
    public async isHoliday(date: string | Date): Promise<boolean> {
        const formattedDate = typeof date === 'string'
            ? date
            : format(date, 'yyyy-MM-dd');

        const holidays = await this.getHolidays(formattedDate, formattedDate);
        return holidays.length > 0;
    }

    /**
     * Récupère tous les jours fériés d'une année
     */
    public async getYearlyHolidays(year: number): Promise<Holiday[]> {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;
        return this.getHolidays(startDate, endDate);
    }

    /**
     * Précharge les jours fériés pour une période étendue (performance)
     */
    public async preloadHolidays(startDate: Date, months: number = 12): Promise<void> {
        const start = format(startDate, 'yyyy-MM-dd');
        const end = format(addMonths(startDate, months), 'yyyy-MM-dd');

        await this.getHolidays(start, end);
    }

    /**
     * Invalide manuellement le cache
     */
    public invalidateCache(): void {
        this.cache.clear();
    }

    /**
     * Obtient des statistiques sur le cache
     */
    public getCacheStats(): { size: number, hitRate: number } {
        return {
            size: this.cache.size,
            hitRate: 0 // À implémenter si nécessaire
        };
    }
}

export const holidayService = HolidayService.getInstance(); 