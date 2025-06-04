'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info, Clock } from 'lucide-react';

type NotificationType = 'success' | 'warning' | 'error' | 'info' | 'guard' | 'oncall';
type NotificationPosition = 'top-right' | 'top-center' | 'bottom-center' | 'bottom-right';

interface MedicalNotificationProps {
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // en ms, 0 = permanente
  position?: NotificationPosition;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const typeConfig = {
  success: {
    bgClass: 'notification-success',
    icon: CheckCircle,
    iconColor: 'text-medical-rest-600'
  },
  warning: {
    bgClass: 'notification-warning', 
    icon: AlertTriangle,
    iconColor: 'text-medical-oncall-600'
  },
  error: {
    bgClass: 'notification-error',
    icon: AlertCircle,
    iconColor: 'text-medical-guard-600'
  },
  info: {
    bgClass: 'notification-info',
    icon: Info,
    iconColor: 'text-medical-vacation-600'
  },
  guard: {
    bgClass: 'notification-medical border-l-medical-guard-500 bg-medical-guard-50',
    icon: AlertTriangle,
    iconColor: 'text-medical-guard-600'
  },
  oncall: {
    bgClass: 'notification-medical border-l-medical-oncall-500 bg-medical-oncall-50',
    icon: Clock,
    iconColor: 'text-medical-oncall-600'
  }
};

const positionConfig = {
  'top-right': 'top-4 right-4',
  'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
  'bottom-center': 'bottom-20 left-1/2 transform -translate-x-1/2', // Au-dessus des bottom tabs
  'bottom-right': 'bottom-20 right-4'
};

export function MedicalNotification({
  type,
  title,
  message,
  duration = 5000,
  position = 'top-right',
  onClose,
  action,
  className = ''
}: MedicalNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  
  const config = typeConfig[type];
  const positionClasses = positionConfig[position];
  const Icon = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 200);
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`
        ${config.bgClass}
        ${positionClasses}
        ${isExiting ? 'animate-fade-out' : 'animate-slide-down'}
        max-w-sm w-full mx-4 sm:mx-0
        ${className}
      `}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start space-x-3">
        {/* Icône */}
        <div className={`${config.iconColor} flex-shrink-0 mt-0.5`}>
          <Icon className="w-5 h-5" />
        </div>
        
        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            {title}
          </h4>
          {message && (
            <p className="text-sm text-gray-700 leading-relaxed">
              {message}
            </p>
          )}
          
          {/* Action */}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
            >
              {action.label}
            </button>
          )}
        </div>
        
        {/* Bouton fermer */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors touch-target"
          aria-label="Fermer la notification"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

// Hook pour gérer les notifications
interface Notification extends Omit<MedicalNotificationProps, 'onClose'> {
  id: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { ...notification, id }]);
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Fonctions spécialisées pour différents types médicaux
  const notifySuccess = (title: string, message?: string) => 
    addNotification({ type: 'success', title, message });
    
  const notifyWarning = (title: string, message?: string) => 
    addNotification({ type: 'warning', title, message });
    
  const notifyError = (title: string, message?: string) => 
    addNotification({ type: 'error', title, message });
    
  const notifyInfo = (title: string, message?: string) => 
    addNotification({ type: 'info', title, message });
    
  const notifyGuard = (title: string, message?: string) => 
    addNotification({ type: 'guard', title, message, duration: 0 }); // Permanente
    
  const notifyOnCall = (title: string, message?: string) => 
    addNotification({ type: 'oncall', title, message });

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    notifySuccess,
    notifyWarning,
    notifyError,
    notifyInfo,
    notifyGuard,
    notifyOnCall
  };
}

// Conteneur de notifications
interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
  position?: NotificationPosition;
}

export function NotificationContainer({ 
  notifications, 
  onRemove, 
  position = 'top-right' 
}: NotificationContainerProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex flex-col">
      {notifications.map((notification) => (
        <MedicalNotification
          key={notification.id}
          {...notification}
          position={position}
          onClose={() => onRemove(notification.id)}
          className="pointer-events-auto mb-2"
        />
      ))}
    </div>
  );
}

// Composants spécialisés pour différents contextes médicaux
interface MedicalAlertProps {
  title: string;
  message?: string;
  patient?: string;
  room?: string;
  urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
  onAcknowledge?: () => void;
  onClose?: () => void;
}

export function MedicalAlert({
  title,
  message,
  patient,
  room,
  urgencyLevel = 'medium',
  onAcknowledge,
  onClose
}: MedicalAlertProps) {
  const getTypeByUrgency = () => {
    switch (urgencyLevel) {
      case 'critical': return 'error';
      case 'high': return 'guard';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'info';
    }
  };

  const fullMessage = [
    message,
    patient && `Patient: ${patient}`,
    room && `Salle: ${room}`
  ].filter(Boolean).join(' • ');

  return (
    <MedicalNotification
      type={getTypeByUrgency()}
      title={title}
      message={fullMessage}
      duration={urgencyLevel === 'critical' ? 0 : 8000}
      position="top-center"
      action={onAcknowledge ? {
        label: 'Prendre en charge',
        onClick: onAcknowledge
      } : undefined}
      onClose={onClose}
    />
  );
}

export default MedicalNotification;