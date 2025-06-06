import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from "../../../lib/logger";
import { useAuth } from '@/hooks/useAuth';
import { 
    getRuleNotificationService, 
    RuleViolationNotification, 
    RuleChangeNotification 
} from '../services/RuleNotificationService';
import { toast } from 'sonner';
import { RuleSeverity } from '@/types/rules';

interface UseRuleNotificationsOptions {
    autoConnect?: boolean;
    showToasts?: boolean;
    playSound?: boolean;
    maxNotifications?: number;
}

interface UseRuleNotificationsReturn {
    violations: RuleViolationNotification[];
    ruleChanges: RuleChangeNotification[];
    unreadCount: number;
    connectionStatus: 'connected' | 'disconnected' | 'error' | 'connecting';
    
    // Actions
    acknowledgeViolation: (notificationId: string) => void;
    clearViolations: () => void;
    clearRuleChanges: () => void;
    subscribeToRule: (ruleId: string) => void;
    unsubscribeFromRule: (ruleId: string) => void;
    
    // État
    isConnected: boolean;
    hasUnreadViolations: boolean;
}

export function useRuleNotifications(
    options: UseRuleNotificationsOptions = {}
): UseRuleNotificationsReturn {
    const {
        autoConnect = true,
        showToasts = true,
        playSound = true,
        maxNotifications = 100
    } = options;

    const { user, token } = useAuth();
    const [violations, setViolations] = useState<RuleViolationNotification[]>([]);
    const [ruleChanges, setRuleChanges] = useState<RuleChangeNotification[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<UseRuleNotificationsReturn['connectionStatus']>('disconnected');
    const [unreadCount, setUnreadCount] = useState(0);
    
    const notificationService = useRef(getRuleNotificationService());
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialiser l'audio pour les notifications
    useEffect(() => {
        if (playSound && typeof window !== 'undefined') {
            audioRef.current = new Audio('/sounds/notification.mp3');
            audioRef.current.volume = 0.5;
        }
    }, [playSound]);

    // Jouer le son de notification
    const playNotificationSound = useCallback(() => {
        if (playSound && audioRef.current) {
            audioRef.current.play().catch(err => {
                logger.warn('Failed to play notification sound:', { error: err });
            });
        }
    }, [playSound]);

    // Afficher un toast pour une violation
    const showViolationToast = useCallback((violation: RuleViolationNotification) => {
        if (!showToasts) return;

        const toastOptions = {
            duration: violation.severity === RuleSeverity.ERROR ? 10000 : 5000,
            action: {
                label: 'Voir',
                onClick: () => {
                    // Navigation vers les détails si nécessaire
                    logger.info('View violation:', violation);
                }
            }
        };

        switch (violation.severity) {
            case RuleSeverity.ERROR:
                toast.error(violation.message, {
                    ...toastOptions,
                    description: `Règle: ${violation.ruleName}`
                });
                break;
            case RuleSeverity.WARNING:
                toast.warning(violation.message, {
                    ...toastOptions,
                    description: `Règle: ${violation.ruleName}`
                });
                break;
            case RuleSeverity.INFO:
                toast.info(violation.message, {
                    ...toastOptions,
                    description: `Règle: ${violation.ruleName}`
                });
                break;
        }
    }, [showToasts]);

    // Gérer une nouvelle violation
    const handleViolation = useCallback((violation: RuleViolationNotification) => {
        setViolations(prev => {
            const updated = [violation, ...prev];
            // Limiter le nombre de notifications
            return updated.slice(0, maxNotifications);
        });
        
        if (!violation.acknowledged) {
            setUnreadCount(prev => prev + 1);
            playNotificationSound();
            showViolationToast(violation);
        }
    }, [maxNotifications, playNotificationSound, showViolationToast]);

    // Gérer un batch de violations
    const handleBatchViolations = useCallback((violations: RuleViolationNotification[]) => {
        setViolations(prev => {
            const updated = [...violations, ...prev];
            return updated.slice(0, maxNotifications);
        });
        
        const unreadViolations = violations.filter(v => !v.acknowledged);
        if (unreadViolations.length > 0) {
            setUnreadCount(prev => prev + unreadViolations.length);
            playNotificationSound();
            
            if (showToasts) {
                toast.warning(`${unreadViolations.length} nouvelles violations de règles détectées`, {
                    duration: 5000,
                    action: {
                        label: 'Voir tout',
                        onClick: () => {
                            // Navigation vers la liste complète
                            logger.info('View all violations');
                        }
                    }
                });
            }
        }
    }, [maxNotifications, playNotificationSound, showToasts]);

    // Gérer un changement de règle
    const handleRuleChange = useCallback((change: RuleChangeNotification) => {
        setRuleChanges(prev => {
            const updated = [change, ...prev];
            return updated.slice(0, maxNotifications);
        });
        
        if (showToasts) {
            const messages: Record<RuleChangeNotification['type'], string> = {
                created: 'Nouvelle règle créée',
                updated: 'Règle mise à jour',
                deleted: 'Règle supprimée',
                activated: 'Règle activée',
                deactivated: 'Règle désactivée'
            };
            
            toast.info(messages[change.type], {
                description: change.ruleName,
                duration: 4000
            });
        }
    }, [maxNotifications, showToasts]);

    // Gérer le changement de statut de connexion
    const handleConnectionStatus = useCallback((status: UseRuleNotificationsReturn['connectionStatus']) => {
        setConnectionStatus(status);
        
        if (showToasts) {
            if (status === 'connected') {
                toast.success('Connecté aux notifications temps réel');
            } else if (status === 'error') {
                toast.error('Erreur de connexion aux notifications');
            }
        }
    }, [showToasts]);

    // Connecter au service de notifications
    useEffect(() => {
        if (!autoConnect || !user?.id || !token) return;

        const service = notificationService.current;
        
        // Configurer les listeners
        service.on('violation', handleViolation);
        service.on('batch-violations', handleBatchViolations);
        service.on('rule-change', handleRuleChange);
        service.on('connection-status', handleConnectionStatus);

        // Se connecter
        setConnectionStatus('connecting');
        service.connect(String(user.id), token).catch(err => {
            logger.error('Failed to connect to notifications:', { error: err });
            setConnectionStatus('error');
        });

        // Nettoyage
        return () => {
            service.off('violation', handleViolation);
            service.off('batch-violations', handleBatchViolations);
            service.off('rule-change', handleRuleChange);
            service.off('connection-status', handleConnectionStatus);
            service.disconnect();
        };
    }, [
        autoConnect, 
        user?.id, 
        token, 
        handleViolation, 
        handleBatchViolations, 
        handleRuleChange,
        handleConnectionStatus
    ]);

    // Marquer une violation comme lue
    const acknowledgeViolation = useCallback((notificationId: string) => {
        setViolations(prev => prev.map(v => 
            v.id === notificationId 
                ? { ...v, acknowledged: true }
                : v
        ));
        
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Envoyer au serveur
        notificationService.current.acknowledgeViolation(notificationId);
    }, []);

    // Effacer toutes les violations
    const clearViolations = useCallback(() => {
        setViolations([]);
        setUnreadCount(0);
    }, []);

    // Effacer tous les changements de règles
    const clearRuleChanges = useCallback(() => {
        setRuleChanges([]);
    }, []);

    // S'abonner aux notifications d'une règle
    const subscribeToRule = useCallback((ruleId: string) => {
        notificationService.current.subscribeToRule(ruleId);
    }, []);

    // Se désabonner des notifications d'une règle
    const unsubscribeFromRule = useCallback((ruleId: string) => {
        notificationService.current.unsubscribeFromRule(ruleId);
    }, []);

    return {
        violations,
        ruleChanges,
        unreadCount,
        connectionStatus,
        
        // Actions
        acknowledgeViolation,
        clearViolations,
        clearRuleChanges,
        subscribeToRule,
        unsubscribeFromRule,
        
        // État
        isConnected: connectionStatus === 'connected',
        hasUnreadViolations: unreadCount > 0
    };
}