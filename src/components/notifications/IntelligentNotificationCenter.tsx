'use client';

import { useState, useEffect } from 'react';
import { logger } from "../../lib/logger";
import { cn } from '@/lib/utils';
import { 
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Users,
  Calendar,
  Heart,
  TrendingUp,
  X,
  Filter,
  Settings,
  Zap,
  Shield
} from 'lucide-react';

// Types pour les notifications intelligentes
export interface SmartNotification {
  id: string;
  type: 'predictive' | 'immediate' | 'preventive' | 'suggestion';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: 'planning' | 'leaves' | 'rules' | 'system' | 'performance';
  title: string;
  message: string;
  context: NotificationContext;
  actions: NotificationAction[];
  timestamp: Date;
  read: boolean;
  autoResolve?: boolean;
  estimatedImpact: 'critical' | 'moderate' | 'minor';
}

interface NotificationContext {
  source: string;
  affectedUsers?: string[];
  period?: string;
  relatedData?: unknown;
}

interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: () => void;
  icon?: React.ComponentType<any>;
}

interface IntelligentNotificationCenterProps {
  className?: string;
}

// Générateur de notifications intelligentes
const generateSmartNotifications = (): SmartNotification[] => [
  {
    id: 'pred-1',
    type: 'predictive',
    priority: 'high',
    category: 'planning',
    title: 'Risque Surcharge Équipe Cardio',
    message: 'Surcharge prévisible de l\'équipe cardiologie la semaine prochaine (+40% charge habituelle). 3 interventions lourdes programmées simultanément.',
    context: {
      source: 'AnalyticEngine',
      affectedUsers: ['Dr. Martin', 'Dr. Dubois', 'Équipe Cardio'],
      period: 'Semaine du 3-9 Juin',
      relatedData: { charge: '140%', interventions: 3 }
    },
    actions: [
      {
        id: 'reschedule',
        label: 'Réorganiser Planning',
        type: 'primary',
        action: () => logger.info('Réorganiser'),
        icon: Calendar
      },
      {
        id: 'add-staff',
        label: 'Renfort Équipe',
        type: 'secondary',
        action: () => logger.info('Renfort'),
        icon: Users
      }
    ],
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: false,
    estimatedImpact: 'critical'
  },
  {
    id: 'imm-1',
    type: 'immediate',
    priority: 'urgent',
    category: 'leaves',
    title: 'Congés Simultanés Détectés',
    message: '3 demandes de congé simultanées en pédiatrie pour la semaine du 10 juin. Risque de sous-effectif critique.',
    context: {
      source: 'LeaveSystem',
      affectedUsers: ['Dr. Lefèvre', 'Mme Rousseau', 'M. Girard'],
      period: '10-16 Juin'
    },
    actions: [
      {
        id: 'negotiate',
        label: 'Négocier Étalement',
        type: 'primary',
        action: () => logger.info('Négocier'),
        icon: Calendar
      },
      {
        id: 'find-replacement',
        label: 'Chercher Remplaçants',
        type: 'secondary',
        action: () => logger.info('Remplacements'),
        icon: Users
      },
      {
        id: 'approve-partial',
        label: 'Validation Partielle',
        type: 'danger',
        action: () => logger.info('Partiel'),
        icon: CheckCircle
      }
    ],
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    estimatedImpact: 'critical'
  },
  {
    id: 'prev-1',
    type: 'preventive',
    priority: 'medium',
    category: 'performance',
    title: 'Dr. Martin Fatigue Élevée',
    message: 'Dr. Martin approche des 50h hebdomadaires (actuellement 47h). Recommandation de limitation préventive.',
    context: {
      source: 'FatigueMonitor',
      affectedUsers: ['Dr. Martin'],
      period: 'Cette semaine',
      relatedData: { currentHours: 47, limit: 50, fatigueScore: 85 }
    },
    actions: [
      {
        id: 'limit-hours',
        label: 'Limiter Heures',
        type: 'primary',
        action: () => logger.info('Limiter'),
        icon: Clock
      },
      {
        id: 'schedule-rest',
        label: 'Programmer Repos',
        type: 'secondary',
        action: () => logger.info('Repos'),
        icon: Heart
      }
    ],
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    read: false,
    estimatedImpact: 'moderate'
  },
  {
    id: 'sugg-1',
    type: 'suggestion',
    priority: 'low',
    category: 'planning',
    title: 'Optimisation Possible',
    message: 'Proposition : Répartir 2 gardes de l\'équipe A vers l\'équipe B pour équilibrer la charge (+15% efficacité estimée).',
    context: {
      source: 'OptimizationEngine',
      affectedUsers: ['Équipe A', 'Équipe B'],
      period: 'Prochaines 2 semaines',
      relatedData: { efficiency: '+15%', balance: 'improved' }
    },
    actions: [
      {
        id: 'apply-suggestion',
        label: 'Appliquer',
        type: 'primary',
        action: () => logger.info('Appliquer'),
        icon: TrendingUp
      },
      {
        id: 'simulate',
        label: 'Simuler',
        type: 'secondary',
        action: () => logger.info('Simuler'),
        icon: Zap
      }
    ],
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
    estimatedImpact: 'minor'
  },
  {
    id: 'sys-1',
    type: 'immediate',
    priority: 'medium',
    category: 'system',
    title: 'Mise à Jour Règles Disponible',
    message: 'Nouvelles règles de planification disponibles (v2.1). Amélioration de la détection des conflits (+30%).',
    context: {
      source: 'SystemUpdate',
      relatedData: { version: '2.1', improvements: 'conflict detection +30%' }
    },
    actions: [
      {
        id: 'install',
        label: 'Installer',
        type: 'primary',
        action: () => logger.info('Installer'),
        icon: Shield
      },
      {
        id: 'schedule',
        label: 'Programmer',
        type: 'secondary',
        action: () => logger.info('Programmer'),
        icon: Clock
      }
    ],
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    read: false,
    estimatedImpact: 'minor'
  }
];

export function IntelligentNotificationCenter({ className }: IntelligentNotificationCenterProps) {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent' | 'predictive'>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setNotifications(generateSmartNotifications());
    
    // Simulation de nouvelles notifications en temps réel
    const interval = setInterval(() => {
      setNotifications(prev => {
        // Ajouter une nouvelle notification occasionnellement
        if (Math.random() < 0.1) {
          const newNotification: SmartNotification = {
            id: `new-${Date.now()}`,
            type: 'immediate',
            priority: 'medium',
            category: 'planning',
            title: 'Nouvelle Demande d\'Échange',
            message: 'Dr. Durand demande un échange de garde pour samedi.',
            context: {
              source: 'ExchangeSystem',
              affectedUsers: ['Dr. Durand']
            },
            actions: [
              {
                id: 'view',
                label: 'Voir Demande',
                type: 'primary',
                action: () => logger.info('Voir'),
                icon: Info
              }
            ],
            timestamp: new Date(),
            read: false,
            estimatedImpact: 'minor'
          };
          return [newNotification, ...prev];
        }
        return prev;
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread': return !notification.read;
      case 'urgent': return notification.priority === 'urgent' || notification.priority === 'high';
      case 'predictive': return notification.type === 'predictive';
      default: return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (notification: SmartNotification) => {
    switch (notification.type) {
      case 'predictive': return TrendingUp;
      case 'immediate': return AlertTriangle;
      case 'preventive': return Shield;
      case 'suggestion': return Zap;
      default: return Info;
    }
  };

  const getNotificationColor = (notification: SmartNotification) => {
    switch (notification.priority) {
      case 'urgent': return 'border-red-200 bg-red-50';
      case 'high': return 'border-orange-200 bg-orange-50';
      case 'medium': return 'border-blue-200 bg-blue-50';
      case 'low': return 'border-gray-200 bg-gray-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg shadow-sm', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Centre de Notifications</h3>
            <p className="text-xs text-gray-600">Alertes intelligentes et suggestions</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200">
        {[
          { id: 'all', label: 'Toutes', count: notifications.length },
          { id: 'unread', label: 'Non lues', count: unreadCount },
          { id: 'urgent', label: 'Urgentes', count: notifications.filter(n => n.priority === 'urgent' || n.priority === 'high').length },
          { id: 'predictive', label: 'Prédictives', count: notifications.filter(n => n.type === 'predictive').length }
        ].map((filterOption) => (
          <button
            key={filterOption.id}
            onClick={() => setFilter(filterOption.id as any)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
              filter === filterOption.id
                ? 'bg-medical-guard-100 text-medical-guard-700'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            {filterOption.label} ({filterOption.count})
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune notification</p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {filteredNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification);
              
              return (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 border rounded-lg transition-all hover:shadow-sm',
                    getNotificationColor(notification),
                    !notification.read && 'border-l-4 border-l-medical-guard-500'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'p-2 rounded-lg flex-shrink-0',
                      notification.priority === 'urgent' && 'bg-red-100 text-red-600',
                      notification.priority === 'high' && 'bg-orange-100 text-orange-600',
                      notification.priority === 'medium' && 'bg-blue-100 text-blue-600',
                      notification.priority === 'low' && 'bg-gray-100 text-gray-600'
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Marquer comme lu"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Supprimer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Context Info */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{notification.context.source}</span>
                        {notification.context.period && (
                          <span>• {notification.context.period}</span>
                        )}
                        <span>• {new Date(notification.timestamp).toLocaleString()}</span>
                        <span className={cn(
                          'px-2 py-1 rounded-full',
                          notification.estimatedImpact === 'critical' && 'bg-red-100 text-red-600',
                          notification.estimatedImpact === 'moderate' && 'bg-yellow-100 text-yellow-600',
                          notification.estimatedImpact === 'minor' && 'bg-green-100 text-green-600'
                        )}>
                          Impact {notification.estimatedImpact}
                        </span>
                      </div>
                      
                      {/* Actions */}
                      {notification.actions.length > 0 && (
                        <div className="flex items-center gap-2 mt-3">
                          {notification.actions.map((action) => {
                            const ActionIcon = action.icon;
                            return (
                              <button
                                key={action.id}
                                onClick={action.action}
                                className={cn(
                                  'flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                                  action.type === 'primary' && 'bg-medical-guard-600 text-white hover:bg-medical-guard-700',
                                  action.type === 'secondary' && 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                                  action.type === 'danger' && 'bg-red-100 text-red-700 hover:bg-red-200'
                                )}
                              >
                                {ActionIcon && <ActionIcon className="h-3 w-3" />}
                                {action.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Hook pour les notifications en temps réel
export function useSmartNotifications() {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  
  useEffect(() => {
    setNotifications(generateSmartNotifications());
  }, []);
  
  const addNotification = (notification: Omit<SmartNotification, 'id' | 'timestamp'>) => {
    const newNotification: SmartNotification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date()
    };
    setNotifications(prev => [newNotification, ...prev]);
  };
  
  return {
    notifications,
    addNotification,
    unreadCount: notifications.filter(n => !n.read).length
  };
}