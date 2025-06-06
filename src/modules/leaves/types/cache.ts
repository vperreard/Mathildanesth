import { LeaveStatus } from './leave';

/**
 * Types d'événements qui peuvent déclencher une invalidation du cache
 */
export enum LeaveEvent {
    CREATED = 'leave_created',
    UPDATED = 'leave_updated',
    DELETED = 'leave_deleted',
    STATUS_CHANGED = 'leave_status_changed',
    BALANCE_UPDATED = 'balance_updated',
    USER_UPDATED = 'user_updated',
    DEPARTMENT_UPDATED = 'department_updated',
    RULES_UPDATED = 'rules_updated',
    QUOTA_UPDATED = 'quota_updated',
    SYSTEM_UPDATE = 'system_update'
}

/**
 * Stratégies d'invalidation du cache
 */
export enum CacheInvalidationStrategy {
    NONE = 'none',           // Pas d'invalidation
    PRECISE = 'precise',     // Invalidation précise (uniquement les entrées concernées)
    SELECTIVE = 'selective', // Invalidation sélective (catégories concernées)
    GROUP = 'group',         // Invalidation par groupe (ex: tous les congés d'un utilisateur)
    COMPLETE = 'complete'    // Invalidation complète
}

/**
 * Configuration de la mise en cache pour différents types de requêtes
 */
export interface CacheConfig {
    enabled: boolean;        // Activer/désactiver le cache
    ttl: number;             // Durée de vie en secondes
    strategy: CacheInvalidationStrategy; // Stratégie d'invalidation
    preload?: boolean;       // Précharger au démarrage
}

/**
 * Options pour configurer le service de cache
 */
export interface LeaveQueryCacheOptions {
    enabled?: boolean;                     // Activer/désactiver globalement le cache
    defaultTTL?: number;                   // TTL par défaut
    redisOptions?: {                       // Options Redis
        host?: string;
        port?: number;
        db?: number;
        prefix?: string;
    };
    limits?: {                             // Limites pour éviter la surcharge
        maxKeyLength?: number;               // Longueur maximale des clés
        maxCachedItems?: number;             // Nombre max d'éléments en cache
        maxPayloadSize?: number;             // Taille max des données en octets
    };
    strategies?: {                         // Configuration par type de données
        lists?: CacheConfig;                 // Listes de congés
        details?: CacheConfig;               // Détails d'un congé
        balances?: CacheConfig;              // Soldes de congés
        stats?: CacheConfig;                 // Statistiques
        userLeaves?: CacheConfig;            // Congés d'un utilisateur
        conflicts?: CacheConfig;             // Conflits de congés
    };
    monitoring?: {                         // Options de monitoring
        logHits?: boolean;                   // Journaliser les accès au cache
        logMisses?: boolean;                 // Journaliser les manqués de cache
        trackStats?: boolean;                // Suivre les statistiques
    };
}

/**
 * Statistiques du cache
 */
export interface CacheStats {
    hits: number;            // Nombre d'accès réussis
    misses: number;          // Nombre d'accès manqués
    hitRatio: number;        // Ratio de réussite (hits / (hits + misses))
    size: number;            // Nombre d'entrées en cache
    keysByPrefix: Record<string, number>; // Nombre de clés par préfixe
    averagePayloadSize: number; // Taille moyenne des données en octets
    invalidations: number;   // Nombre d'invalidations
    cacheTime: Record<string, number>; // Temps moyen de réponse par type (en ms)
}

/**
 * Événement d'invalidation du cache pour le broker d'événements
 */
export interface CacheInvalidationEvent {
    event: LeaveEvent;       // Type d'événement
    timestamp: number;       // Timestamp de l'événement
    data: unknown;               // Données associées
    source: string;          // Source de l'événement
    strategy: CacheInvalidationStrategy; // Stratégie d'invalidation
    affectedKeys?: string[]; // Clés affectées (si connues)
}

/**
 * Résultat d'opération sur le cache
 */
export interface CacheOperationResult {
    success: boolean;        // Succès de l'opération
    operation: 'get' | 'set' | 'delete' | 'invalidate' | 'preload'; // Type d'opération
    key?: string;            // Clé concernée
    pattern?: string;        // Pattern concerné
    duration?: number;       // Durée de l'opération en ms
    count?: number;          // Nombre d'éléments affectés
    error?: Error;           // Erreur éventuelle
} 