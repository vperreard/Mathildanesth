'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  TrendingUp,
  Clock,
  Users,
  Zap
} from 'lucide-react';

interface NotificationBannerProps {
  className?: string;
}

interface BannerNotification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'urgent';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoHide?: number; // ms
  persistent?: boolean;
}

// Notifications prédictives en temps réel
const generateBannerNotifications = (): BannerNotification[] => [
  {
    id: 'surge-warning',
    type: 'warning',
    title: 'Surcharge Prévue',
    message: 'Risque de surcharge équipe cardiologie la semaine prochaine (+40%). Réorganisation recommandée.',
    action: {
      label: 'Voir Planning',
      onClick: () => window.location.href = '/admin/command-center'
    },
    persistent: true
  },
  {
    id: 'leave-conflict',
    type: 'urgent',
    title: 'Conflit Congés Détecté',
    message: '3 demandes simultanées en pédiatrie - action requise sous 24h.',
    action: {
      label: 'Résoudre',
      onClick: () => window.location.href = '/admin/conges'
    },
    persistent: true
  },
  {
    id: 'optimization',
    type: 'info',
    title: 'Optimisation Suggérée',
    message: 'Redistribution de 2 gardes permettrait +15% d\'efficacité.',
    action: {
      label: 'Appliquer',
      onClick: () => console.log('Optimiser')
    },
    autoHide: 10000
  }
];

export function NotificationBanner({ className }: NotificationBannerProps) {
  const [notifications, setNotifications] = useState<BannerNotification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setNotifications(generateBannerNotifications());
  }, []);

  useEffect(() => {
    if (notifications.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % notifications.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [notifications.length]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (currentIndex >= notifications.length - 1) {
      setCurrentIndex(0);
    }
  };

  if (notifications.length === 0) return null;

  const currentNotification = notifications[currentIndex];
  if (!currentNotification) return null;

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'urgent':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: AlertTriangle,
          iconColor: 'text-red-600',
          button: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          icon: AlertTriangle,
          iconColor: 'text-yellow-600',
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: TrendingUp,
          iconColor: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: CheckCircle,
          iconColor: 'text-green-600',
          button: 'bg-green-600 hover:bg-green-700 text-white'
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          text: 'text-gray-800',
          icon: Info,
          iconColor: 'text-gray-600',
          button: 'bg-gray-600 hover:bg-gray-700 text-white'
        };
    }
  };

  const styles = getNotificationStyles(currentNotification.type);
  const Icon = styles.icon;

  return (
    <div className={cn(
      'border rounded-lg p-4 transition-all duration-500',
      styles.bg,
      className
    )}>
      <div className="flex items-start gap-3">
        <div className={cn('p-1 rounded-lg flex-shrink-0', styles.iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className={cn('text-sm font-medium', styles.text)}>
                {currentNotification.title}
              </h4>
              <p className={cn('text-sm mt-1', styles.text)}>
                {currentNotification.message}
              </p>
            </div>
            
            {!currentNotification.persistent && (
              <button
                onClick={() => dismissNotification(currentNotification.id)}
                className={cn('p-1 rounded hover:bg-black hover:bg-opacity-10', styles.text)}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              {currentNotification.action && (
                <button
                  onClick={currentNotification.action.onClick}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                    styles.button
                  )}
                >
                  {currentNotification.action.label}
                </button>
              )}
              
              {currentNotification.persistent && (
                <button
                  onClick={() => dismissNotification(currentNotification.id)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                    'bg-white bg-opacity-20 hover:bg-opacity-30',
                    styles.text
                  )}
                >
                  Ignorer
                </button>
              )}
            </div>
            
            {notifications.length > 1 && (
              <div className="flex items-center gap-1">
                {notifications.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      'h-2 w-2 rounded-full transition-all',
                      index === currentIndex 
                        ? 'bg-current opacity-100' 
                        : 'bg-current opacity-30 hover:opacity-50'
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant de notifications contextuelles par page
export function ContextualNotifications() {
  const [pageContext, setPageContext] = useState<string>('');
  
  useEffect(() => {
    setPageContext(window.location.pathname);
  }, []);

  const getContextualNotifications = () => {
    switch (true) {
      case pageContext.includes('/planning'):
        return [
          {
            type: 'info' as const,
            title: 'Suggestion d\'Optimisation',
            message: 'Glissez-déposez les affectations pour optimiser la répartition.',
            icon: Zap
          }
        ];
      
      case pageContext.includes('/conges'):
        return [
          {
            type: 'warning' as const,
            title: 'Période de Pointe',
            message: 'Période de forte demande - validation prioritaire recommandée.',
            icon: Clock
          }
        ];
      
      case pageContext.includes('/admin'):
        return [
          {
            type: 'info' as const,
            title: 'Actions Recommandées',
            message: 'Mode urgence disponible pour remplacements express.',
            icon: Users
          }
        ];
      
      default:
        return [];
    }
  };

  const contextualNotifs = getContextualNotifications();

  if (contextualNotifs.length === 0) return null;

  return (
    <div className="space-y-2">
      {contextualNotifs.map((notif, index) => {
        const Icon = notif.icon;
        return (
          <div
            key={index}
            className={cn(
              'flex items-center gap-2 p-2 rounded-md text-sm',
              notif.type === 'info' && 'bg-blue-50 text-blue-700',
              notif.type === 'warning' && 'bg-yellow-50 text-yellow-700'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <div>
              <span className="font-medium">{notif.title}:</span>{' '}
              <span>{notif.message}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}