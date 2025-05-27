import { format, getYear, isBefore, isAfter, isSameDay, parse, parseISO } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import apiClient from '@/utils/apiClient';
import {
    PublicHoliday,
    PublicHolidayFilter,
    CreatePublicHolidayDTO,
    UpdatePublicHolidayDTO,
    PublicHolidayServiceOptions
} from '../types/public-holiday';
import { calculateEaster } from '@/utils/dateUtils';
import { isWithinInterval } from 'date-fns';
import { prisma } from '@/lib/prisma';


/**
 * Service pour la gestion des jours fériés
 * Implémente le pattern Singleton
 */
class PublicHolidayService {
    private static instance: PublicHolidayService;

    // Durée de vie du cache par défaut: 24 heures
    private readonly DEFAULT_CACHE_TTL = 24 * 60 * 60 * 1000;

    // Cache des jours fériés par année
    private holidayCache: Map<string, {
        data: PublicHoliday[];
        timestamp: number;
    }> = new Map();

    // Options du service
    private options: Required<PublicHolidayServiceOptions>;

    // Liste des jours fériés français par défaut
    private readonly DEFAULT_FRENCH_HOLIDAYS: Omit<PublicHoliday, 'date'>[] = [
        { name: "Jour de l'An", isNational: true, country: "FR" },
        { name: "Lundi de Pâques", isNational: true, country: "FR" },
        { name: "Fête du Travail", isNational: true, country: "FR" },
        { name: "Victoire 1945", isNational: true, country: "FR" },
        { name: "Ascension", isNational: true, country: "FR" },
        { name: "Lundi de Pentecôte", isNational: true, country: "FR" },
        { name: "Fête Nationale", isNational: true, country: "FR" },
        { name: "Assomption", isNational: true, country: "FR" },
        { name: "Toussaint", isNational: true, country: "FR" },
        { name: "Armistice 1918", isNational: true, country: "FR" },
        { name: "Noël", isNational: true, country: "FR" }
    ];

    /**
     * Constructeur privé pour le pattern Singleton
     */
    private constructor(options?: PublicHolidayServiceOptions) {
        this.options = {
            cacheTTL: options?.cacheTTL ?? this.DEFAULT_CACHE_TTL,
            defaultHolidays: options?.defaultHolidays ?? [],
            defaultRegions: options?.defaultRegions ?? ["FR"],
            defaultCountry: options?.defaultCountry ?? "FR",
            enableCache: options?.enableCache ?? true,
            preloadData: options?.preloadData ?? true,
            preloadYears: options?.preloadYears ?? [-1, 0, 1, 2]
        };

        // Préchargement des données
        if (this.options.preloadData) {
            this.preloadData();
        }
    }

    /**
     * Obtenir l'instance du service (Singleton)
     */
    public static getInstance(options?: PublicHolidayServiceOptions): PublicHolidayService {
        if (!PublicHolidayService.instance) {
            PublicHolidayService.instance = new PublicHolidayService(options);
        }
        return PublicHolidayService.instance;
    }

    /**
     * Précharger les données des jours fériés
     */
    private async preloadData(): Promise<void> {
        try {
            const currentYear = new Date().getFullYear();
            const yearsToLoad = this.options.preloadYears.map(offset => currentYear + offset);

            await Promise.all(
                yearsToLoad.map(year => this.getPublicHolidaysForYear(year))
            );
        } catch (error) {
            console.error('[PublicHolidayService] Erreur lors du préchargement des données:', error);
        }
    }

    /**
     * Génère une clé de cache basée sur les critères de filtre
     */
    private generateCacheKey(filter: PublicHolidayFilter | number): string {
        if (typeof filter === 'number') {
            return `year:${filter}`;
        }

        // Créer une clé basée sur les paramètres de filtre
        const parts: string[] = [];

        if (filter.year) {
            parts.push(`year:${filter.year}`);
        }

        if (filter.startDate) {
            const date = typeof filter.startDate === 'string'
                ? filter.startDate
                : format(filter.startDate, 'yyyy-MM-dd');
            parts.push(`start:${date}`);
        }

        if (filter.endDate) {
            const date = typeof filter.endDate === 'string'
                ? filter.endDate
                : format(filter.endDate, 'yyyy-MM-dd');
            parts.push(`end:${date}`);
        }

        if (filter.isNational !== undefined) {
            parts.push(`national:${filter.isNational}`);
        }

        if (filter.region) {
            parts.push(`region:${filter.region}`);
        }

        if (filter.country) {
            parts.push(`country:${filter.country}`);
        }

        // Si aucun critère spécifique n'est fourni, utiliser une clé par défaut
        if (parts.length === 0) {
            return 'all';
        }

        return parts.join('_');
    }

    /**
     * Vérifie si une entrée de cache est valide (non expirée)
     */
    private isCacheValid(cacheEntry: { timestamp: number; data: PublicHoliday[] }): boolean {
        return Date.now() - cacheEntry.timestamp < this.options.cacheTTL;
    }

    /**
     * Met à jour le cache avec de nouvelles données
     */
    private updateCache(key: string, data: PublicHoliday[]): void {
        if (!this.options.enableCache) return;

        this.holidayCache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Récupérer les données depuis le cache si disponibles
     */
    private getCachedData(key: string): PublicHoliday[] | null {
        if (!this.options.enableCache) return null;

        const cacheEntry = this.holidayCache.get(key);

        if (cacheEntry && this.isCacheValid(cacheEntry)) {
            return cacheEntry.data;
        }

        return null;
    }

    /**
     * Invalider une entrée spécifique du cache
     */
    public invalidateCache(key?: string): void {
        if (key) {
            this.holidayCache.delete(key);
        } else {
            this.holidayCache.clear();
        }
    }

    /**
     * Calculer les jours fériés français pour une année spécifique
     */
    private calculateFrenchPublicHolidays(year: number): PublicHoliday[] {
        const holidays: PublicHoliday[] = [];

        // Jours fériés fixes
        const fixedHolidays = [
            { date: `${year}-01-01`, name: "Jour de l'An", isNational: true },
            { date: `${year}-05-01`, name: "Fête du Travail", isNational: true },
            { date: `${year}-05-08`, name: "Victoire 1945", isNational: true },
            { date: `${year}-07-14`, name: "Fête Nationale", isNational: true },
            { date: `${year}-08-15`, name: "Assomption", isNational: true },
            { date: `${year}-11-01`, name: "Toussaint", isNational: true },
            { date: `${year}-11-11`, name: "Armistice 1918", isNational: true },
            { date: `${year}-12-25`, name: "Noël", isNational: true }
        ];

        // Ajouter les jours fériés fixes
        fixedHolidays.forEach(holiday => {
            holidays.push({
                id: uuidv4(),
                ...holiday,
                country: "FR",
                isWorkingDay: false
            });
        });

        // Calcul de Pâques (algorithme de Butcher)
        const easter = calculateEaster(year);

        // Jours fériés basés sur Pâques
        const easterBasedHolidays = [
            {
                date: format(easter, 'yyyy-MM-dd'),
                name: "Pâques",
                isNational: true
            },
            {
                date: format(new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 1), 'yyyy-MM-dd'),
                name: "Lundi de Pâques",
                isNational: true
            },
            {
                date: format(new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 39), 'yyyy-MM-dd'),
                name: "Ascension",
                isNational: true
            },
            {
                date: format(new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 49), 'yyyy-MM-dd'),
                name: "Pentecôte",
                isNational: true
            },
            {
                date: format(new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 50), 'yyyy-MM-dd'),
                name: "Lundi de Pentecôte",
                isNational: true
            }
        ];

        // Ajouter les jours fériés basés sur Pâques
        easterBasedHolidays.forEach(holiday => {
            holidays.push({
                id: uuidv4(),
                ...holiday,
                country: "FR",
                isWorkingDay: false
            });
        });

        return holidays;
    }

    /**
     * Obtenir les jours fériés pour une année spécifique
     */
    public async getPublicHolidaysForYear(year: number): Promise<PublicHoliday[]> {
        const cacheKey = this.generateCacheKey(year);
        const cachedData = this.getCachedData(cacheKey);

        if (cachedData) {
            return cachedData;
        }

        try {
            // Essayer de récupérer depuis l'API
            const response = await apiClient.get(`/api/jours-feries?year=${year}`);
            const holidays = response.data as PublicHoliday[];

            // Mettre à jour le cache
            this.updateCache(cacheKey, holidays);

            return holidays;
        } catch (error) {
            console.warn(`[PublicHolidayService] Impossible de récupérer les jours fériés depuis l'API pour l'année ${year}. Utilisation du calcul local.`);

            // Générer les jours fériés français en local
            const holidays = this.calculateFrenchPublicHolidays(year);

            // Mettre à jour le cache
            this.updateCache(cacheKey, holidays);

            return holidays;
        }
    }

    /**
     * Récupérer les jours fériés en fonction des critères de filtre
     */
    public async getPublicHolidays(filter: PublicHolidayFilter = {}): Promise<PublicHoliday[]> {
        let startYear = new Date().getFullYear();
        let endYear = startYear;

        // Extraire les années des dates si présentes
        if (filter.startDate) {
            const startDate = typeof filter.startDate === 'string'
                ? parseISO(filter.startDate)
                : filter.startDate;
            startYear = getYear(startDate);
        }

        if (filter.endDate) {
            const endDate = typeof filter.endDate === 'string'
                ? parseISO(filter.endDate)
                : filter.endDate;
            endYear = getYear(endDate);
        }

        if (filter.year) {
            startYear = endYear = filter.year;
        }

        const cacheKey = this.generateCacheKey(filter);
        const cachedData = this.getCachedData(cacheKey);

        if (cachedData) {
            return cachedData;
        }

        // Récupérer les jours fériés pour toutes les années concernées
        const holidaysPromises = [];
        for (let year = startYear; year <= endYear; year++) {
            holidaysPromises.push(this.getPublicHolidaysForYear(year));
        }

        // Fusionner et filtrer les résultats
        let holidays = (await Promise.all(holidaysPromises)).flat();

        // Appliquer les filtres supplémentaires
        if (filter.startDate || filter.endDate) {
            holidays = holidays.filter(holiday => {
                const holidayDate = parseISO(holiday.date);

                if (filter.startDate) {
                    const startDate = typeof filter.startDate === 'string'
                        ? parseISO(filter.startDate)
                        : filter.startDate;

                    if (isBefore(holidayDate, startDate)) {
                        return false;
                    }
                }

                if (filter.endDate) {
                    const endDate = typeof filter.endDate === 'string'
                        ? parseISO(filter.endDate)
                        : filter.endDate;

                    if (isAfter(holidayDate, endDate)) {
                        return false;
                    }
                }

                return true;
            });
        }

        if (filter.isNational !== undefined) {
            holidays = holidays.filter(holiday => holiday.isNational === filter.isNational);
        }

        if (filter.region) {
            holidays = holidays.filter(holiday =>
                holiday.regions?.includes(filter.region as string));
        }

        if (filter.country) {
            holidays = holidays.filter(holiday =>
                holiday.country === filter.country);
        }

        // Mettre à jour le cache
        this.updateCache(cacheKey, holidays);

        return holidays;
    }

    /**
     * Récupère les jours fériés dans une plage de dates donnée
     * @optimization Utilisation d'index composites et de requêtes optimisées
     */
    public async getPublicHolidaysInRange(
        startDate: string | Date,
        endDate: string | Date,
        region?: string
    ): Promise<PublicHoliday[]> {
        const cacheKey = `holidays_range_${startDate}_${endDate}_${region || 'all'}`;

        // Vérifier si les données sont déjà en cache
        const cachedEntry = this.holidayCache.get(cacheKey);
        if (cachedEntry && cachedEntry.timestamp > Date.now()) {
            return cachedEntry.data;
        }

        try {
            const startObj = this.parseDate(startDate);
            const endObj = this.parseDate(endDate);

            // Construction de la requête optimisée
            const where: any = {
                date: {
                    gte: startObj,
                    lte: endObj
                }
            };

            // Ajouter la condition sur la région seulement si nécessaire
            if (region) {
                where.region = region;
            } else {
                // Si pas de région spécifiée, prendre les jours fériés nationaux et ceux des régions par défaut
                where.OR = [
                    { isNational: true },
                    { region: { in: this.options.defaultRegions } }
                ];
            }

            // Optimisation: Sélectionner uniquement les champs nécessaires
            // et trier directement dans la requête (plus efficace que tri côté application)
            const holidays = await prisma.publicHoliday.findMany({
                where,
                select: {
                    id: true,
                    date: true,
                    name: true,
                    description: true,
                    isNational: true,
                    region: true
                },
                orderBy: {
                    date: 'asc'
                }
            });

            // Mapper les résultats au format PublicHoliday
            const result = holidays.map(this.mapPrismaToPublicHoliday);

            // Mettre en cache les résultats
            this.updateCache(cacheKey, result);

            return result;
        } catch (error) {
            console.error('[PublicHolidayService] Erreur lors de la récupération des jours fériés dans une plage:', error);

            // En cas d'erreur, retourner les données en cache même si expirées
            if (cachedEntry) {
                return cachedEntry.data;
            }

            // Si pas de cache, utiliser les jours fériés par défaut
            return this.filterDefaultHolidaysByRange(startDate, endDate, region);
        }
    }

    /**
     * Filtre les jours fériés par défaut en fonction d'une plage de dates
     * @private
     */
    private filterDefaultHolidaysByRange(
        startDate: string | Date,
        endDate: string | Date,
        region?: string
    ): PublicHoliday[] {
        const startObj = this.parseDate(startDate);
        const endObj = this.parseDate(endDate);

        // Récupérer les années concernées
        const startYear = startObj.getFullYear();
        const endYear = endObj.getFullYear();

        // Collecter les jours fériés par défaut pour chaque année
        let allHolidays: PublicHoliday[] = [];
        for (let year = startYear; year <= endYear; year++) {
            allHolidays = [...allHolidays, ...this.calculateFrenchPublicHolidays(year)];
        }

        // Filtrer les jours fériés par rapport à la plage de dates
        return allHolidays.filter(holiday => {
            const holidayDate = this.parseDate(holiday.date);
            return (
                isWithinInterval(holidayDate, { start: startObj, end: endObj }) &&
                (!region || holiday.region === region || holiday.isNational)
            );
        });
    }

    /**
     * Vérifier si une date est un jour férié
     */
    public async isPublicHoliday(date: Date | string): Promise<boolean> {
        const dateToCheck = typeof date === 'string' ? parseISO(date) : date;
        const year = getYear(dateToCheck);

        const holidays = await this.getPublicHolidaysForYear(year);

        return holidays.some(holiday => {
            const holidayDate = parseISO(holiday.date);
            return isSameDay(holidayDate, dateToCheck);
        });
    }

    /**
     * Créer un nouveau jour férié
     */
    public async createPublicHoliday(data: CreatePublicHolidayDTO): Promise<PublicHoliday> {
        try {
            const formattedDate = typeof data.date === 'string'
                ? data.date
                : format(data.date, 'yyyy-MM-dd');

            const newHoliday: PublicHoliday = {
                id: uuidv4(),
                date: formattedDate,
                name: data.name,
                description: data.description,
                isNational: data.isNational ?? true,
                regions: data.regions,
                country: data.country ?? this.options.defaultCountry,
                isWorkingDay: data.isWorkingDay ?? false
            };

            // Envoyer à l'API si disponible
            try {
                const response = await apiClient.post('/api/jours-feries', newHoliday);
                const createdHoliday = response.data;

                // Invalider le cache pour l'année concernée
                const year = getYear(parseISO(formattedDate));
                this.invalidateCache(this.generateCacheKey(year));

                return createdHoliday;
            } catch (apiError) {
                console.warn('[PublicHolidayService] Impossible de créer le jour férié via l\'API. Utilisation du stockage local.', apiError);

                // Ajouter au cache local
                const year = getYear(parseISO(formattedDate));
                const cacheKey = this.generateCacheKey(year);
                const existingHolidays = await this.getPublicHolidaysForYear(year);

                this.updateCache(cacheKey, [...existingHolidays, newHoliday]);

                return newHoliday;
            }
        } catch (error) {
            console.error('[PublicHolidayService] Erreur lors de la création du jour férié:', error);
            throw error;
        }
    }

    /**
     * Mettre à jour un jour férié existant
     */
    public async updatePublicHoliday(data: UpdatePublicHolidayDTO): Promise<PublicHoliday | null> {
        try {
            if (!data.id) {
                throw new Error('ID du jour férié obligatoire pour la mise à jour');
            }

            // Formater la date si fournie
            let formattedDate: string | undefined;
            if (data.date) {
                formattedDate = typeof data.date === 'string'
                    ? data.date
                    : format(data.date, 'yyyy-MM-dd');
            }

            // Envoyer à l'API si disponible
            try {
                const updateData = {
                    ...data,
                    date: formattedDate
                };

                const response = await apiClient.put(`/api/jours-feries/${data.id}`, updateData);
                const updatedHoliday = response.data;

                // Invalider le cache
                this.invalidateCache();

                return updatedHoliday;
            } catch (apiError) {
                console.warn('[PublicHolidayService] Impossible de mettre à jour le jour férié via l\'API. Utilisation du stockage local.', apiError);

                // Mise à jour dans le cache local
                let foundAndUpdated = false;

                // Parcourir toutes les entrées du cache
                for (const [key, entry] of this.holidayCache.entries()) {
                    const updatedHolidays = entry.data.map(holiday => {
                        if (holiday.id === data.id) {
                            foundAndUpdated = true;

                            return {
                                ...holiday,
                                ...(formattedDate && { date: formattedDate }),
                                ...(data.name !== undefined && { name: data.name }),
                                ...(data.description !== undefined && { description: data.description }),
                                ...(data.isNational !== undefined && { isNational: data.isNational }),
                                ...(data.regions !== undefined && { regions: data.regions }),
                                ...(data.country !== undefined && { country: data.country }),
                                ...(data.isWorkingDay !== undefined && { isWorkingDay: data.isWorkingDay })
                            };
                        }
                        return holiday;
                    });

                    this.updateCache(key, updatedHolidays);
                }

                if (!foundAndUpdated) {
                    return null;
                }

                // Récupérer le jour férié mis à jour
                const allHolidays = Array.from(this.holidayCache.values())
                    .flatMap(entry => entry.data);

                return allHolidays.find(holiday => holiday.id === data.id) || null;
            }
        } catch (error) {
            console.error('[PublicHolidayService] Erreur lors de la mise à jour du jour férié:', error);
            throw error;
        }
    }

    /**
     * Supprimer un jour férié
     */
    public async deletePublicHoliday(id: string): Promise<boolean> {
        try {
            // Envoyer à l'API si disponible
            try {
                await apiClient.delete(`/api/jours-feries/${id}`);

                // Invalider le cache
                this.invalidateCache();

                return true;
            } catch (apiError) {
                console.warn('[PublicHolidayService] Impossible de supprimer le jour férié via l\'API. Utilisation du stockage local.', apiError);

                // Suppression du cache local
                let foundAndDeleted = false;

                // Parcourir toutes les entrées du cache
                for (const [key, entry] of this.holidayCache.entries()) {
                    const filteredHolidays = entry.data.filter(holiday => {
                        const shouldKeep = holiday.id !== id;
                        if (!shouldKeep) {
                            foundAndDeleted = true;
                        }
                        return shouldKeep;
                    });

                    // Mettre à jour le cache uniquement si une entrée a été supprimée
                    if (filteredHolidays.length !== entry.data.length) {
                        this.updateCache(key, filteredHolidays);
                    }
                }

                return foundAndDeleted;
            }
        } catch (error) {
            console.error('[PublicHolidayService] Erreur lors de la suppression du jour férié:', error);
            throw error;
        }
    }

    /**
     * Importer des jours fériés depuis une source externe
     */
    public async importPublicHolidays(holidays: CreatePublicHolidayDTO[]): Promise<PublicHoliday[]> {
        const importedHolidays: PublicHoliday[] = [];

        for (const holidayData of holidays) {
            try {
                const holiday = await this.createPublicHoliday(holidayData);
                importedHolidays.push(holiday);
            } catch (error) {
                console.error(`[PublicHolidayService] Erreur lors de l'importation du jour férié:`, holidayData, error);
                // Continuer avec les autres jours fériés
            }
        }

        return importedHolidays;
    }
}

// Export de l'instance unique
export const publicHolidayService = PublicHolidayService.getInstance();

// Export pour les tests
export default PublicHolidayService; 