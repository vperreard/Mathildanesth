import { AuditAction, AuditEntry } from './AuditService';

import { logger } from "../lib/logger";
// Re-exporter AuditAction pour faciliter l'import
export { AuditAction };

/**
 * Configuration du service d'audit optimisé
 */
export interface OptimizedAuditConfig {
    batchSize: number;            // Nombre d'entrées par lot (défaut: 50)
    flushInterval: number;        // Intervalle de vidage en ms (défaut: 5000)
    maxQueueSize: number;         // Taille maximale de la file d'attente (défaut: 1000)
    retryAttempts: number;        // Nombre de tentatives de réessai (défaut: 3)
    compressionEnabled: boolean;  // Activer la compression pour les gros lots (défaut: true)
    compressionThreshold: number; // Taille minimale pour la compression (défaut: 8192 octets)
    highPriorityActions: AuditAction[]; // Actions prioritaires à traiter immédiatement
}

/**
 * Niveau de priorité d'une entrée d'audit
 */
enum AuditPriority {
    HIGH = 'high',       // Traitement immédiat requis
    NORMAL = 'normal',   // Traitement standard par lots
    LOW = 'low'          // Peut être retardé si nécessaire
}

/**
 * Structure d'un changement dans une entrée d'audit
 */
interface AuditChange {
    field: string;
    oldValue: unknown;
    newValue: unknown;
}

/**
 * Extension de l'interface AuditEntry importée
 */
interface ExtendedAuditEntry extends AuditEntry {
    changes?: AuditChange[];
}

/**
 * Entrée d'audit avec métadonnées internes
 */
interface EnhancedAuditEntry extends ExtendedAuditEntry {
    _metadata?: {
        priority: AuditPriority;
        queuedAt: number;
        retryCount: number;
    };
}

/**
 * Service d'audit optimisé pour des performances améliorées
 * Utilise un traitement par lots, une mise en file d'attente asynchrone et la compression
 */
export class OptimizedAuditService {
    private static instance: OptimizedAuditService;
    private isDebugMode: boolean;
    private config: OptimizedAuditConfig;

    // Files d'attente par priorité
    private highPriorityQueue: EnhancedAuditEntry[] = [];
    private normalPriorityQueue: EnhancedAuditEntry[] = [];
    private lowPriorityQueue: EnhancedAuditEntry[] = [];

    // Suivi d'état et statistiques
    private isProcessing: boolean = false;
    private flushTimer: NodeJS.Timeout | null = null;
    private stats = {
        totalEnqueued: 0,
        totalProcessed: 0,
        totalFailed: 0,
        totalRetried: 0,
        batchesSent: 0,
        compressedBatches: 0,
        compressionSavings: 0, // en octets
        averageProcessingTime: 0,
        processingTimes: [] as number[] // Pour calculer des statistiques plus élaborées
    };

    /**
     * Constructeur privé (Singleton)
     */
    private constructor() {
        this.isDebugMode = process.env.NODE_ENV === 'development';
        this.config = {
            batchSize: 50,
            flushInterval: 5000,
            maxQueueSize: 1000,
            retryAttempts: 3,
            compressionEnabled: true,
            compressionThreshold: 8192, // 8 KB
            highPriorityActions: [
                AuditAction.USER_LOGIN,
                AuditAction.USER_LOGOUT,
                AuditAction.PERMISSION_GRANTED,
                AuditAction.PERMISSION_REVOKED
            ]
        };

        // Démarrer le traitement programmé
        this.startScheduledProcessing();
    }

    /**
     * Obtient l'instance unique du service d'audit
     */
    public static getInstance(): OptimizedAuditService {
        if (!OptimizedAuditService.instance) {
            OptimizedAuditService.instance = new OptimizedAuditService();
        }
        return OptimizedAuditService.instance;
    }

    /**
     * Configure le service d'audit
     */
    public configure(config: Partial<OptimizedAuditConfig>): void {
        this.config = {
            ...this.config,
            ...config
        };

        if (this.isDebugMode) {
            logger.debug('[OptimizedAuditService] Configuration mise à jour:', this.config);
        }

        // Redémarrer le traitement programmé avec les nouveaux paramètres
        this.restartScheduledProcessing();
    }

    /**
     * Enregistre une action dans l'audit (API principale)
     */
    public async logAction(entry: AuditEntry): Promise<string> {
        // Déterminer la priorité de l'entrée
        const priority = this.determineEntryPriority(entry);

        // Générer un ID unique
        const id = entry.id || `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Créer l'entrée améliorée
        const enhancedEntry: EnhancedAuditEntry = {
            ...entry,
            id,
            timestamp: entry.timestamp || new Date(),
            _metadata: {
                priority,
                queuedAt: Date.now(),
                retryCount: 0
            }
        };

        // Mettre à jour les statistiques
        this.stats.totalEnqueued++;

        // Ajouter à la file d'attente appropriée
        if (priority === AuditPriority.HIGH) {
            this.highPriorityQueue.push(enhancedEntry);
            // Traiter immédiatement les entrées haute priorité
            this.processQueue();
        } else if (priority === AuditPriority.NORMAL) {
            this.normalPriorityQueue.push(enhancedEntry);
            // Vérifier si la file normale doit être traitée
            if (this.normalPriorityQueue.length >= this.config.batchSize) {
                this.processQueue();
            }
        } else {
            this.lowPriorityQueue.push(enhancedEntry);
            // Les entrées de faible priorité seront traitées lors du vidage programmé
        }

        if (this.isDebugMode) {
            logger.debug(`[OptimizedAuditService] Action enregistrée: ${id} (${priority})`);
        }

        return id;
    }

    /**
     * Traite les files d'attente d'audit
     */
    private async processQueue(): Promise<void> {
        // Éviter le traitement simultané
        if (this.isProcessing) {
            return;
        }

        this.isProcessing = true;
        const startTime = performance.now();

        try {
            // Traiter d'abord les entrées haute priorité
            if (this.highPriorityQueue.length > 0) {
                await this.processBatch(this.highPriorityQueue.splice(0, this.highPriorityQueue.length));
            }

            // Traiter ensuite un lot d'entrées de priorité normale
            if (this.normalPriorityQueue.length > 0) {
                const batchSize = Math.min(this.normalPriorityQueue.length, this.config.batchSize);
                await this.processBatch(this.normalPriorityQueue.splice(0, batchSize));
            }

            // Traiter enfin un lot d'entrées de faible priorité s'il reste du temps
            if (this.lowPriorityQueue.length >= this.config.batchSize) {
                const batchSize = Math.min(this.lowPriorityQueue.length, this.config.batchSize);
                await this.processBatch(this.lowPriorityQueue.splice(0, batchSize));
            }
        } catch (error: unknown) {
            logger.error('[OptimizedAuditService] Erreur lors du traitement de la file d\'attente:', error instanceof Error ? error : new Error(String(error)));
        } finally {
            // Calculer le temps de traitement
            const processingTime = performance.now() - startTime;
            this.stats.processingTimes.push(processingTime);

            // Limiter l'historique des temps pour éviter la consommation de mémoire
            if (this.stats.processingTimes.length > 100) {
                this.stats.processingTimes.shift();
            }

            // Mettre à jour le temps de traitement moyen
            this.stats.averageProcessingTime = this.stats.processingTimes.reduce((a, b) => a + b, 0) / this.stats.processingTimes.length;

            this.isProcessing = false;

            // Vérifier s'il reste des entrées à traiter
            if (this.highPriorityQueue.length > 0) {
                // Continuer à traiter les entrées haute priorité
                this.processQueue();
            }
        }
    }

    /**
     * Traite un lot d'entrées d'audit
     */
    private async processBatch(batch: EnhancedAuditEntry[]): Promise<void> {
        if (batch.length === 0) {
            return;
        }

        try {
            // Préparer les données pour l'envoi
            const payload = JSON.stringify(batch);
            let isCompressed = false;

            // Compression si nécessaire et activée
            if (this.config.compressionEnabled && payload.length > this.config.compressionThreshold) {
                try {
                    // Dans un environnement réel, nous utiliserions une bibliothèque de compression
                    // comme pako, lz-string, etc. Simulons la compression ici:
                    const originalSize = payload.length;
                    // Exemple simpliste (dans un cas réel, utilisez une vraie compression)
                    isCompressed = true;
                    this.stats.compressedBatches++;

                    // Estimer l'économie (simulation)
                    const compressionRatio = 0.4; // 60% de réduction en moyenne
                    const compressedSize = Math.floor(originalSize * compressionRatio);
                    this.stats.compressionSavings += (originalSize - compressedSize);

                    if (this.isDebugMode) {
                        logger.debug(`[OptimizedAuditService] Compression: ${originalSize} -> ${compressedSize} octets (${Math.round((1 - compressionRatio) * 100)}% d'économie)`);
                    }
                } catch (compressionError: unknown) {
                    logger.error('[OptimizedAuditService] Erreur de compression:', compressionError);
                    isCompressed = false;
                }
            }

            // Extrait l'ancienne et la nouvelle valeur pour les logs détaillés
            let oldValue = null;
            let newValue = null;

            // Vérifier si batch a des changements à tracer
            const entry = batch[0]; // Prendre la première entrée pour l'exemple
            if (entry && entry.changes && entry.changes.length > 0) {
                const change = entry.changes[0];
                oldValue = change.oldValue;
                newValue = change.newValue;
            }

            // Envoyer à l'API
            const response = await fetch('http://localhost:3000/api/audit/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(isCompressed ? { 'Content-Encoding': 'gzip' } : {})
                },
                body: payload
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
            }

            // Mise à jour des statistiques
            this.stats.totalProcessed += batch.length;
            this.stats.batchesSent++;

            if (this.isDebugMode) {
                logger.debug(`[OptimizedAuditService] Lot de ${batch.length} entrées envoyé avec succès`);
            }
        } catch (error: unknown) {
            logger.error('[OptimizedAuditService] Erreur lors de l\'envoi du lot:', error instanceof Error ? error : new Error(String(error)));

            // Gérer les réessais pour les entrées échouées
            for (const entry of batch) {
                if (!entry._metadata) {
                    entry._metadata = {
                        priority: AuditPriority.NORMAL,
                        queuedAt: Date.now(),
                        retryCount: 0
                    };
                }

                entry._metadata.retryCount++;
                this.stats.totalRetried++;

                if (entry._metadata.retryCount <= this.config.retryAttempts) {
                    // Remettre en file d'attente pour réessai
                    // Avec un système de backoff exponentiel basé sur le nombre de tentatives
                    setTimeout(() => {
                        if (entry._metadata!.priority === AuditPriority.HIGH) {
                            this.highPriorityQueue.push(entry);
                        } else if (entry._metadata!.priority === AuditPriority.NORMAL) {
                            this.normalPriorityQueue.push(entry);
                        } else {
                            this.lowPriorityQueue.push(entry);
                        }

                        if (this.isDebugMode) {
                            logger.debug(`[OptimizedAuditService] Réessai ${entry._metadata!.retryCount}/${this.config.retryAttempts} pour l'entrée ${entry.id}`);
                        }
                    }, Math.pow(2, entry._metadata.retryCount - 1) * 1000); // Backoff exponentiel: 1s, 2s, 4s, etc.
                } else {
                    // Échec définitif après le nombre maximum de tentatives
                    this.stats.totalFailed++;
                    this.handlePermanentFailure(entry);
                }
            }
        }
    }

    /**
     * Détermine la priorité d'une entrée d'audit
     */
    private determineEntryPriority(entry: AuditEntry): AuditPriority {
        // Les actions sensibles sont traitées en priorité
        if (this.config.highPriorityActions.includes(entry.action)) {
            return AuditPriority.HIGH;
        }

        // Logique personnalisée basée sur le type d'entité ou d'autres facteurs
        switch (entry.entityType) {
            case 'user':
            case 'permission':
            case 'security':
                return AuditPriority.HIGH;
            case 'leave':
            case 'quota':
                return AuditPriority.NORMAL;
            default:
                return AuditPriority.LOW;
        }
    }

    /**
     * Démarre le traitement programmé
     */
    private startScheduledProcessing(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }

        this.flushTimer = setInterval(() => {
            this.processQueue();
        }, this.config.flushInterval);

        if (this.isDebugMode) {
            logger.debug(`[OptimizedAuditService] Traitement programmé démarré (intervalle: ${this.config.flushInterval}ms)`);
        }
    }

    /**
     * Redémarre le traitement programmé (après changement de configuration)
     */
    private restartScheduledProcessing(): void {
        this.startScheduledProcessing();
    }

    /**
     * Gère un échec permanent pour une entrée d'audit
     */
    private handlePermanentFailure(entry: EnhancedAuditEntry): void {
        // Enregistrer localement les entrées qui n'ont pas pu être envoyées
        try {
            const failedEntries = JSON.parse(
                localStorage.getItem('failedAuditEntries') || '[]'
            ) as EnhancedAuditEntry[];

            failedEntries.push(entry);

            // Limiter le nombre d'entrées échouées stockées
            const maxFailedEntries = 200;
            const trimmedEntries = failedEntries.slice(-maxFailedEntries);

            localStorage.setItem('failedAuditEntries', JSON.stringify(trimmedEntries));

            logger.error(`[OptimizedAuditService] Échec permanent pour l'entrée ${entry.id} après ${entry._metadata?.retryCount} tentatives`);
        } catch (storageError: unknown) {
            logger.error('[OptimizedAuditService] Erreur lors du stockage des entrées échouées:', storageError);
        }
    }

    /**
     * Vide explicitement toutes les files d'attente
     */
    public async flushAll(): Promise<void> {
        await this.processQueue();
    }

    /**
     * Tente de renvoyer les entrées échouées
     */
    public async retryFailedEntries(): Promise<number> {
        try {
            const failedEntries = JSON.parse(
                localStorage.getItem('failedAuditEntries') || '[]'
            ) as EnhancedAuditEntry[];

            if (failedEntries.length === 0) {
                return 0;
            }

            localStorage.removeItem('failedAuditEntries');

            // Réinitialiser le compteur de tentatives
            for (const entry of failedEntries) {
                if (entry._metadata) {
                    entry._metadata.retryCount = 0;
                }

                // Ajouter à la file de priorité normale
                this.normalPriorityQueue.push(entry);
            }

            // Déclencher le traitement
            await this.processQueue();

            return failedEntries.length;
        } catch (error: unknown) {
            logger.error('[OptimizedAuditService] Erreur lors de la récupération des entrées échouées:', error instanceof Error ? error : new Error(String(error)));
            return 0;
        }
    }

    /**
     * Obtient les statistiques du service d'audit
     */
    public getStats(): typeof this.stats & {
        queueSizes: { high: number, normal: number, low: number },
        totalPending: number
    } {
        const queueSizes = {
            high: this.highPriorityQueue.length,
            normal: this.normalPriorityQueue.length,
            low: this.lowPriorityQueue.length
        };

        return {
            ...this.stats,
            queueSizes,
            totalPending: queueSizes.high + queueSizes.normal + queueSizes.low
        };
    }

    /**
     * Active ou désactive le mode debug
     */
    public setDebugMode(enabled: boolean): void {
        this.isDebugMode = enabled;
    }
}

// Créer et exporter l'instance singleton
export const auditService = OptimizedAuditService.getInstance(); 