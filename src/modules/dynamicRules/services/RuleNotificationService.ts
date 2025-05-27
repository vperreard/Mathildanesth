import { EventEmitter } from 'events';
import { io, Socket } from 'socket.io-client';
import { RuleEvaluationResult } from '../v2/types/ruleV2.types';
import { RuleSeverity } from '@/types/rules';

export interface RuleViolationNotification {
    id: string;
    ruleId: string;
    ruleName: string;
    severity: RuleSeverity;
    message: string;
    context: {
        userId?: string;
        userName?: string;
        assignmentType?: string;
        location?: string;
        date?: Date;
    };
    timestamp: Date;
    acknowledged: boolean;
}

export interface RuleChangeNotification {
    id: string;
    type: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated';
    ruleId: string;
    ruleName: string;
    changedBy: string;
    timestamp: Date;
    changes?: Record<string, any>;
}

interface RuleNotificationEvents {
    'violation': (notification: RuleViolationNotification) => void;
    'rule-change': (notification: RuleChangeNotification) => void;
    'batch-violations': (notifications: RuleViolationNotification[]) => void;
    'connection-status': (status: 'connected' | 'disconnected' | 'error') => void;
}

/**
 * Service de gestion des notifications temps réel pour les règles
 */
export class RuleNotificationService extends EventEmitter {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private userId: string | null = null;
    private isConnected = false;
    
    // Queue pour stocker les notifications hors ligne
    private offlineQueue: Array<{
        type: 'violation' | 'rule-change';
        data: any;
    }> = [];

    constructor() {
        super();
        this.setMaxListeners(50); // Augmenter la limite pour plusieurs composants
    }

    /**
     * Initialise la connexion WebSocket
     */
    async connect(userId: string, authToken: string): Promise<void> {
        if (this.socket?.connected) {
            console.log('Already connected to notification service');
            return;
        }

        this.userId = userId;

        try {
            // Connexion au serveur WebSocket
            this.socket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
                auth: {
                    token: authToken
                },
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectDelay
            });

            this.setupEventHandlers();
            
            // Attendre la connexion
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout'));
                }, 10000);

                this.socket!.once('connect', () => {
                    clearTimeout(timeout);
                    resolve();
                });

                this.socket!.once('connect_error', (error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
            });

        } catch (error) {
            console.error('Failed to connect to notification service:', error);
            throw error;
        }
    }

    /**
     * Configure les gestionnaires d'événements WebSocket
     */
    private setupEventHandlers(): void {
        if (!this.socket) return;

        // Connexion établie
        this.socket.on('connect', () => {
            console.log('Connected to rule notification service');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.emit('connection-status', 'connected');
            
            // Rejoindre les canaux appropriés
            this.socket!.emit('join-rule-notifications', {
                userId: this.userId
            });

            // Traiter la queue hors ligne
            this.processOfflineQueue();
        });

        // Déconnexion
        this.socket.on('disconnect', () => {
            console.log('Disconnected from rule notification service');
            this.isConnected = false;
            this.emit('connection-status', 'disconnected');
        });

        // Erreur de connexion
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.reconnectAttempts++;
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                this.emit('connection-status', 'error');
            }
        });

        // Notifications de violations de règles
        this.socket.on('rule-violation', (data: RuleViolationNotification) => {
            this.handleViolationNotification(data);
        });

        // Notifications de violations en batch
        this.socket.on('batch-rule-violations', (data: RuleViolationNotification[]) => {
            this.handleBatchViolations(data);
        });

        // Notifications de changements de règles
        this.socket.on('rule-changed', (data: RuleChangeNotification) => {
            this.handleRuleChangeNotification(data);
        });

        // Ping/Pong pour maintenir la connexion
        this.socket.on('ping', () => {
            this.socket!.emit('pong');
        });
    }

    /**
     * Traite une notification de violation
     */
    private handleViolationNotification(notification: RuleViolationNotification): void {
        // Enrichir avec l'heure locale si nécessaire
        notification.timestamp = new Date(notification.timestamp);
        
        // Émettre l'événement
        this.emit('violation', notification);
        
        // Logger pour debug
        console.log('Rule violation notification:', {
            rule: notification.ruleName,
            severity: notification.severity,
            message: notification.message
        });
    }

    /**
     * Traite un batch de violations
     */
    private handleBatchViolations(notifications: RuleViolationNotification[]): void {
        // Enrichir les timestamps
        const enrichedNotifications = notifications.map(n => ({
            ...n,
            timestamp: new Date(n.timestamp)
        }));
        
        // Émettre l'événement
        this.emit('batch-violations', enrichedNotifications);
        
        console.log(`Received ${notifications.length} rule violations`);
    }

    /**
     * Traite une notification de changement de règle
     */
    private handleRuleChangeNotification(notification: RuleChangeNotification): void {
        notification.timestamp = new Date(notification.timestamp);
        
        this.emit('rule-change', notification);
        
        console.log('Rule change notification:', {
            type: notification.type,
            rule: notification.ruleName,
            changedBy: notification.changedBy
        });
    }

    /**
     * Envoie une notification de violation au serveur
     */
    async sendViolation(result: RuleEvaluationResult, context: any): Promise<void> {
        const notification: Omit<RuleViolationNotification, 'id' | 'timestamp' | 'acknowledged'> = {
            ruleId: result.ruleId,
            ruleName: result.ruleName,
            severity: this.extractSeverity(result),
            message: this.extractMessage(result),
            context: {
                userId: context.user?.id,
                userName: context.user?.name,
                assignmentType: context.attribution?.type,
                location: context.attribution?.location,
                date: context.date
            }
        };

        if (this.isConnected && this.socket) {
            this.socket.emit('report-violation', notification);
        } else {
            // Stocker dans la queue hors ligne
            this.offlineQueue.push({
                type: 'violation',
                data: notification
            });
        }
    }

    /**
     * Envoie une notification de changement de règle
     */
    async sendRuleChange(
        type: RuleChangeNotification['type'],
        ruleId: string,
        ruleName: string,
        changedBy: string,
        changes?: Record<string, any>
    ): Promise<void> {
        const notification: Omit<RuleChangeNotification, 'id' | 'timestamp'> = {
            type,
            ruleId,
            ruleName,
            changedBy,
            changes
        };

        if (this.isConnected && this.socket) {
            this.socket.emit('rule-changed', notification);
        } else {
            this.offlineQueue.push({
                type: 'rule-change',
                data: notification
            });
        }
    }

    /**
     * Marque une notification comme lue
     */
    async acknowledgeViolation(notificationId: string): Promise<void> {
        if (this.socket?.connected) {
            this.socket.emit('acknowledge-violation', { notificationId });
        }
    }

    /**
     * S'abonne aux notifications d'une règle spécifique
     */
    subscribeToRule(ruleId: string): void {
        if (this.socket?.connected) {
            this.socket.emit('subscribe-rule', { ruleId });
        }
    }

    /**
     * Se désabonne des notifications d'une règle
     */
    unsubscribeFromRule(ruleId: string): void {
        if (this.socket?.connected) {
            this.socket.emit('unsubscribe-rule', { ruleId });
        }
    }

    /**
     * Traite la queue des notifications hors ligne
     */
    private processOfflineQueue(): void {
        if (!this.socket?.connected || this.offlineQueue.length === 0) return;

        console.log(`Processing ${this.offlineQueue.length} offline notifications`);

        while (this.offlineQueue.length > 0) {
            const item = this.offlineQueue.shift();
            if (item) {
                if (item.type === 'violation') {
                    this.socket.emit('report-violation', item.data);
                } else if (item.type === 'rule-change') {
                    this.socket.emit('rule-changed', item.data);
                }
            }
        }
    }

    /**
     * Extrait la sévérité d'un résultat d'évaluation
     */
    private extractSeverity(result: RuleEvaluationResult): RuleSeverity {
        if (result.actions) {
            for (const action of result.actions) {
                if (action.type === 'validate' && action.parameters.severity) {
                    return action.parameters.severity as RuleSeverity;
                }
            }
        }
        return RuleSeverity.INFO;
    }

    /**
     * Extrait le message d'un résultat d'évaluation
     */
    private extractMessage(result: RuleEvaluationResult): string {
        if (result.actions) {
            for (const action of result.actions) {
                if (action.type === 'validate' && action.parameters.message) {
                    return action.parameters.message;
                }
            }
        }
        return `Violation de la règle: ${result.ruleName}`;
    }

    /**
     * Déconnecte du service
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.userId = null;
        }
    }

    /**
     * Nettoie les ressources
     */
    destroy(): void {
        this.disconnect();
        this.removeAllListeners();
        this.offlineQueue = [];
    }
}

// Instance singleton
let instance: RuleNotificationService | null = null;

/**
 * Obtient l'instance singleton du service
 */
export function getRuleNotificationService(): RuleNotificationService {
    if (!instance) {
        instance = new RuleNotificationService();
    }
    return instance;
}