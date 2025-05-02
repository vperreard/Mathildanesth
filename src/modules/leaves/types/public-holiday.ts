/**
 * Types et interfaces pour la gestion des jours fériés
 */

/**
 * Interface représentant un jour férié
 */
export interface PublicHoliday {
    /** Identifiant unique du jour férié */
    id?: string;

    /** Date du jour férié au format YYYY-MM-DD */
    date: string;

    /** Nom du jour férié */
    name: string;

    /** Description optionnelle du jour férié */
    description?: string;

    /** Indique si c'est un jour férié national (true) ou régional (false) */
    isNational: boolean;

    /** Région(s) concernée(s) par ce jour férié (si régional) */
    regions?: string[];

    /** Pays concerné par ce jour férié */
    country?: string;

    /** Indique si ce jour est un jour non travaillé ou s'il compte comme un jour ouvré */
    isWorkingDay?: boolean;
}

/**
 * DTO pour la création d'un jour férié
 */
export interface CreatePublicHolidayDTO {
    date: string | Date;
    name: string;
    description?: string;
    isNational?: boolean;
    regions?: string[];
    country?: string;
    isWorkingDay?: boolean;
}

/**
 * DTO pour la mise à jour d'un jour férié
 */
export interface UpdatePublicHolidayDTO {
    id: string;
    date?: string | Date;
    name?: string;
    description?: string;
    isNational?: boolean;
    regions?: string[];
    country?: string;
    isWorkingDay?: boolean;
}

/**
 * Type pour les filtres de recherche des jours fériés
 */
export interface PublicHolidayFilter {
    startDate?: string | Date;
    endDate?: string | Date;
    year?: number;
    isNational?: boolean;
    region?: string;
    country?: string;
}

/**
 * Résultat de la récupération des jours fériés avec pagination
 */
export interface PublicHolidayResult {
    data: PublicHoliday[];
    total: number;
    page: number;
    pageSize: number;
}

/**
 * Type pour les entrées de cache des jours fériés
 */
export interface PublicHolidayCacheEntry {
    data: PublicHoliday[];
    expiry: number;
}

/**
 * Options pour le service de jours fériés
 */
export interface PublicHolidayServiceOptions {
    /**
     * Durée de vie du cache en millisecondes
     * @default 24 heures
     */
    cacheTTL?: number;

    /**
     * Liste des jours fériés prédéfinis à utiliser si aucun n'est trouvé
     */
    defaultHolidays?: PublicHoliday[];

    /**
     * Régions à prendre en compte par défaut
     * @default ["FR"]
     */
    defaultRegions?: string[];

    /**
     * Pays par défaut 
     * @default "FR"
     */
    defaultCountry?: string;

    /**
     * Active ou désactive le cache
     * @default true
     */
    enableCache?: boolean;

    /**
     * Précharge les données au démarrage du service
     * @default true
     */
    preloadData?: boolean;

    /**
     * Années à précharger (par rapport à l'année en cours)
     * @default [-1, 0, 1, 2]
     */
    preloadYears?: number[];
} 