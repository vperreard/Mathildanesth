import { LeaveType, LeaveStatus } from '../../../conges/types/leave';
import { performance } from 'perf_hooks';

// Interface pour le département
export interface Department {
    id: string;
    name: string;
    code?: string;
    managerId?: string;
}

/**
 * Type d'agrégation pour les analyses
 */
export enum AggregationType {
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
    QUARTER = 'quarter',
    YEAR = 'year'
}

/**
 * Filtres pour les analyses
 */
export interface LeaveAnalyticsFilter {
    startDate?: Date;
    endDate?: Date;
    departments?: string[];
    users?: string[];
    types?: LeaveType[];
    statuses?: LeaveStatus[];
    page?: number;
    pageSize?: number;
}

/**
 * Interfaces pour les statistiques de congés
 */
export interface LeaveTypeStats {
    date: string;
    total: number;
    byType: Record<LeaveType, number>;
}

export interface DepartmentLeaveStats {
    departmentId: string;
    departmentName: string;
    totalRequests: number;
    totalDays: number;
    byType: Record<LeaveType, number>;
}

export interface PeakPeriod {
    startDate: string;
    endDate: string;
    totalLeaves: number;
    impactScore: number; // Score de 1 à 10 indiquant l'impact sur l'organisation
    departmentsAffected: string[];
}

export interface LeaveAnalyticsFilters {
    startDate?: Date;
    endDate?: Date;
    departments?: string[];
    leaveTypes?: LeaveType[];
    userId?: string;
}

/**
 * Statistiques de congés par période
 */
export interface PeriodLeaveStats {
    period: string;
    count: number;
    days: number;
    byType: Record<LeaveType, {
        count: number;
        days: number;
    }>;
    byStatus: Record<LeaveStatus, {
        count: number;
        days: number;
    }>;
}

/**
 * Statistiques d'absences pour une équipe
 */
export interface TeamAbsenceRate {
    teamId: string;
    teamName: string;
    overallRate: number;
    peakDate?: Date;
    peakRate?: number;
    byPeriod: {
        period: string;
        rate: number;
    }[];
}

/**
 * Statistiques de congés par utilisateur
 */
export interface UserLeaveStats {
    userId: string;
    userName: string;
    totalLeavesTaken: number;
    totalDaysTaken: number;
    remainingDays: number;
    byType: Record<LeaveType, {
        count: number;
        days: number;
    }>;
}

/**
 * Données de tendance pour un type de congé
 */
export interface LeaveTypeTrend {
    type: LeaveType;
    data: {
        period: string;
        count: number;
        days: number;
    }[];
}

/**
 * Résultat de pagination
 */
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

/**
 * Interface pour une entrée de cache
 */
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

/**
 * Options du cache
 */
interface CacheOptions {
    ttl: number; // Durée de vie en millisecondes
    maxSize: number; // Taille maximale du cache
}

/**
 * Classe de gestion du cache
 */
class AnalyticsCache<T> {
    private cache = new Map<string, CacheEntry<T>>();
    private options: CacheOptions;
    private hits = 0;
    private misses = 0;

    constructor(options?: Partial<CacheOptions>) {
        this.options = {
            ttl: 5 * 60 * 1000, // 5 minutes par défaut
            maxSize: 100, // 100 entrées par défaut
            ...options
        };

        // Nettoyer le cache périodiquement
        setInterval(() => this.cleanup(), this.options.ttl);
    }

    /**
     * Génère une clé de cache à partir d'un objet
     */
    generateKey(obj: any): string {
        return JSON.stringify(obj);
    }

    /**
     * Récupère une entrée du cache
     */
    get(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.misses++;
            return null;
        }

        if (entry.expiresAt < Date.now()) {
            this.cache.delete(key);
            this.misses++;
            return null;
        }

        this.hits++;
        return entry.data;
    }

    /**
     * Ajoute une entrée au cache
     */
    set(key: string, data: T): void {
        // Si le cache atteint sa taille maximale, supprimer l'entrée la plus ancienne
        if (this.cache.size >= this.options.maxSize) {
            const oldestKey = [...this.cache.entries()]
                .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + this.options.ttl
        });
    }

    /**
     * Nettoie les entrées expirées du cache
     */
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiresAt < now) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Vide le cache
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Retourne des statistiques sur le cache
     */
    getStats(): { size: number; hitRate: number; hits: number; misses: number } {
        const total = this.hits + this.misses;
        return {
            size: this.cache.size,
            hitRate: total > 0 ? this.hits / total : 0,
            hits: this.hits,
            misses: this.misses
        };
    }
}

/**
 * Service d'analyse des données de congés
 */
export class LeaveAnalyticsService {
    private static instance: LeaveAnalyticsService;
    private departmentCache = new AnalyticsCache<DepartmentLeaveStats[]>({ ttl: 10 * 60 * 1000 });
    private periodCache = new AnalyticsCache<PeriodLeaveStats[]>({ ttl: 10 * 60 * 1000 });
    private teamCache = new AnalyticsCache<TeamAbsenceRate[]>({ ttl: 15 * 60 * 1000 });
    private userCache = new AnalyticsCache<PaginatedResult<UserLeaveStats>>({ ttl: 5 * 60 * 1000 });
    private trendCache = new AnalyticsCache<LeaveTypeTrend[]>({ ttl: 30 * 60 * 1000 });
    private predictionCache = new AnalyticsCache<{ period: string, predictedRate: number }[]>({ ttl: 60 * 60 * 1000 });

    private constructor() { }

    /**
     * Obtenir l'instance unique du service
     */
    public static getInstance(): LeaveAnalyticsService {
        if (!LeaveAnalyticsService.instance) {
            LeaveAnalyticsService.instance = new LeaveAnalyticsService();
        }
        return LeaveAnalyticsService.instance;
    }

    /**
     * Récupère les statistiques de congés par département
     */
    public async getDepartmentStats(
        filters: LeaveAnalyticsFilters = {}
    ): Promise<DepartmentLeaveStats[]> {
        const startTime = performance.now();
        const cacheKey = this.departmentCache.generateKey(filters);
        const cachedData = this.departmentCache.get(cacheKey);

        if (cachedData) {
            console.log(`[Performance] getDepartmentStats from cache: ${performance.now() - startTime}ms`);
            return cachedData;
        }

        try {
            const response = await fetch('/api/analytics/conges/departments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(filters),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des statistiques par département');
            }

            const data = await response.json();
            this.departmentCache.set(cacheKey, data);

            console.log(`[Performance] getDepartmentStats from API: ${performance.now() - startTime}ms`);
            return data;
        } catch (error) {
            console.error('Erreur dans getDepartmentStats:', error);
            return [];
        }
    }

    /**
     * Prédit la disponibilité de l'équipe pour les congés futurs
     */
    public async predictTeamAvailability(
        departmentId: string,
        startDate: Date,
        endDate: Date
    ): Promise<Record<string, number>> {
        try {
            const response = await fetch('/api/analytics/conges/predict-availability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    departmentId,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                }),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la prédiction de disponibilité');
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur dans predictTeamAvailability:', error);
            return {};
        }
    }

    /**
     * Récupère les statistiques de congés par période
     */
    public async getPeriodStats(
        aggregation: AggregationType,
        filter: LeaveAnalyticsFilter
    ): Promise<PeriodLeaveStats[]> {
        const startTime = performance.now();
        const cacheKey = this.periodCache.generateKey({ aggregation, ...filter });
        const cachedData = this.periodCache.get(cacheKey);

        if (cachedData) {
            console.log(`[Performance] getPeriodStats from cache: ${performance.now() - startTime}ms`);
            return cachedData;
        }

        try {
            const response = await fetch(`/api/analytics/conges/periods?aggregation=${aggregation}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(filter),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des statistiques par période');
            }

            const data = await response.json();
            this.periodCache.set(cacheKey, data);

            console.log(`[Performance] getPeriodStats from API: ${performance.now() - startTime}ms`);
            return data;
        } catch (error) {
            console.error('Erreur dans getPeriodStats:', error);
            return [];
        }
    }

    /**
     * Récupère les taux d'absence par équipe
     */
    public async getTeamAbsenceRates(filter: LeaveAnalyticsFilter): Promise<TeamAbsenceRate[]> {
        const startTime = performance.now();
        const cacheKey = this.teamCache.generateKey(filter);
        const cachedData = this.teamCache.get(cacheKey);

        if (cachedData) {
            console.log(`[Performance] getTeamAbsenceRates from cache: ${performance.now() - startTime}ms`);
            return cachedData;
        }

        try {
            const response = await fetch('/api/analytics/conges/teams/absence-rates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(filter),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des taux d\'absence par équipe');
            }

            const data = await response.json();
            this.teamCache.set(cacheKey, data);

            console.log(`[Performance] getTeamAbsenceRates from API: ${performance.now() - startTime}ms`);
            return data;
        } catch (error) {
            console.error('Erreur dans getTeamAbsenceRates:', error);
            return [];
        }
    }

    /**
     * Récupère les statistiques de congés par utilisateur avec pagination
     */
    public async getUserStats(filter: LeaveAnalyticsFilter): Promise<PaginatedResult<UserLeaveStats>> {
        const startTime = performance.now();
        const page = filter.page || 1;
        const pageSize = filter.pageSize || 10;

        const cacheKey = this.userCache.generateKey({ ...filter, page, pageSize });
        const cachedData = this.userCache.get(cacheKey);

        if (cachedData) {
            console.log(`[Performance] getUserStats from cache: ${performance.now() - startTime}ms`);
            return cachedData;
        }

        try {
            const response = await fetch('/api/analytics/conges/utilisateurs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...filter,
                    page,
                    pageSize
                }),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des statistiques par utilisateur');
            }

            const data = await response.json();
            this.userCache.set(cacheKey, data);

            console.log(`[Performance] getUserStats from API: ${performance.now() - startTime}ms`);
            return data;
        } catch (error) {
            console.error('Erreur dans getUserStats:', error);
            return {
                data: [],
                total: 0,
                page,
                pageSize,
                hasMore: false
            };
        }
    }

    /**
     * Récupère les tendances par type de congé
     */
    public async getLeaveTypeTrends(
        aggregation: AggregationType,
        filter: LeaveAnalyticsFilter
    ): Promise<LeaveTypeTrend[]> {
        const startTime = performance.now();
        const cacheKey = this.trendCache.generateKey({ aggregation, ...filter });
        const cachedData = this.trendCache.get(cacheKey);

        if (cachedData) {
            console.log(`[Performance] getLeaveTypeTrends from cache: ${performance.now() - startTime}ms`);
            return cachedData;
        }

        try {
            const response = await fetch(`/api/analytics/conges/trends?aggregation=${aggregation}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(filter),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des tendances par type de congé');
            }

            const data = await response.json();
            this.trendCache.set(cacheKey, data);

            console.log(`[Performance] getLeaveTypeTrends from API: ${performance.now() - startTime}ms`);
            return data;
        } catch (error) {
            console.error('Erreur dans getLeaveTypeTrends:', error);
            return [];
        }
    }

    /**
     * Prédit les périodes de pic pour les absences futures
     */
    public async predictPeakPeriods(departmentId?: string): Promise<{ period: string, predictedRate: number }[]> {
        const startTime = performance.now();
        const cacheKey = this.predictionCache.generateKey({ departmentId });
        const cachedData = this.predictionCache.get(cacheKey);

        if (cachedData) {
            console.log(`[Performance] predictPeakPeriods from cache: ${performance.now() - startTime}ms`);
            return cachedData;
        }

        try {
            const response = await fetch('/api/analytics/conges/predictions/peak-periods', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ departmentId }),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la prédiction des périodes de pic');
            }

            const data = await response.json();
            this.predictionCache.set(cacheKey, data);

            console.log(`[Performance] predictPeakPeriods from API: ${performance.now() - startTime}ms`);
            return data;
        } catch (error) {
            console.error('Erreur dans predictPeakPeriods:', error);
            return [];
        }
    }

    /**
     * Exporte les données analytiques au format CSV
     */
    public async exportAnalyticsToCSV(
        dataType: 'department' | 'period' | 'user' | 'team',
        filter: LeaveAnalyticsFilter
    ): Promise<string> {
        try {
            const response = await fetch(`/api/analytics/conges/export?type=${dataType}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(filter),
            });

            if (!response.ok) {
                throw new Error(`Erreur lors de l'export des données de type ${dataType}`);
            }

            const blob = await response.blob();
            return URL.createObjectURL(blob);
        } catch (error) {
            console.error('Erreur dans exportAnalyticsToCSV:', error);
            throw error;
        }
    }

    /**
     * Invalide tout le cache du service
     */
    public invalidateCache(): void {
        this.departmentCache.clear();
        this.periodCache.clear();
        this.teamCache.clear();
        this.userCache.clear();
        this.trendCache.clear();
        this.predictionCache.clear();
    }

    /**
     * Obtient des statistiques sur l'utilisation du cache
     */
    public getCacheStats(): Record<string, any> {
        return {
            department: this.departmentCache.getStats(),
            period: this.periodCache.getStats(),
            team: this.teamCache.getStats(),
            user: this.userCache.getStats(),
            trend: this.trendCache.getStats(),
            prediction: this.predictionCache.getStats()
        };
    }
}

export const leaveAnalyticsService = LeaveAnalyticsService.getInstance();
export default leaveAnalyticsService; 