'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  Stethoscope,
  Heart,
  Activity
} from 'lucide-react';

type MedicalCardType = 'guard' | 'oncall' | 'vacation' | 'rest' | 'emergency';
type MedicalCardSize = 'sm' | 'md' | 'lg';
type StatusType = 'confirmed' | 'pending' | 'urgent' | 'normal' | 'cancelled';

interface MedicalCardProps {
  type?: MedicalCardType;
  size?: MedicalCardSize;
  status?: StatusType;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: LucideIcon;
  time?: string;
  duration?: string;
  location?: string;
  onClick?: () => void;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  badge?: string | number;
  className?: string;
  children?: React.ReactNode;
}

const typeConfig = {
  guard: {
    bgClass: 'card-medical-guard',
    iconColor: 'text-medical-guard-600',
    borderColor: 'border-l-medical-guard-500',
    defaultIcon: AlertTriangle
  },
  oncall: {
    bgClass: 'card-medical-oncall',
    iconColor: 'text-medical-oncall-600',
    borderColor: 'border-l-medical-oncall-500',
    defaultIcon: Clock
  },
  vacation: {
    bgClass: 'card-medical-vacation',
    iconColor: 'text-medical-vacation-600',
    borderColor: 'border-l-medical-vacation-500',
    defaultIcon: Calendar
  },
  rest: {
    bgClass: 'card-medical-rest',
    iconColor: 'text-medical-rest-600',
    borderColor: 'border-l-medical-rest-500',
    defaultIcon: CheckCircle
  },
  emergency: {
    bgClass: 'bg-medical-emergency-50 border-l-4 border-l-medical-emergency-500',
    iconColor: 'text-medical-emergency-600',
    borderColor: 'border-l-medical-emergency-500',
    defaultIcon: Heart
  }
};

const sizeConfig = {
  sm: {
    padding: 'p-3',
    titleSize: 'text-sm font-medium',
    subtitleSize: 'text-xs',
    iconSize: 'w-4 h-4',
    spacing: 'space-y-1'
  },
  md: {
    padding: 'p-4',
    titleSize: 'text-base font-semibold',
    subtitleSize: 'text-sm',
    iconSize: 'w-5 h-5',
    spacing: 'space-y-2'
  },
  lg: {
    padding: 'p-6',
    titleSize: 'text-lg font-bold',
    subtitleSize: 'text-base',
    iconSize: 'w-6 h-6',
    spacing: 'space-y-3'
  }
};

const statusConfig = {
  confirmed: 'status-confirmed',
  pending: 'status-pending',
  urgent: 'status-urgent',
  normal: 'status-normal',
  cancelled: 'bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-medium'
};

export function MedicalCard({
  type = 'vacation',
  size = 'md',
  status,
  title,
  subtitle,
  description,
  icon,
  time,
  duration,
  location,
  onClick,
  onSecondaryAction,
  secondaryActionLabel = 'Action',
  badge,
  className = '',
  children
}: MedicalCardProps) {
  const config = typeConfig[type];
  const sizeConf = sizeConfig[size];
  const IconComponent = icon || config.defaultIcon;
  
  const isClickable = onClick || onSecondaryAction;

  return (
    <div 
      className={`
        ${config.bgClass} 
        ${sizeConf.padding} 
        ${sizeConf.spacing}
        ${isClickable ? 'cursor-pointer hover:shadow-medical-lg active:scale-[0.98]' : ''}
        touch-target transition-all duration-200
        ${className}
      `}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
    >
      {/* Header avec icône et badge */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`${config.iconColor} flex-shrink-0`}>
            <IconComponent className={sizeConf.iconSize} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`${sizeConf.titleSize} text-gray-900 truncate`}>
              {title}
            </h3>
            {subtitle && (
              <p className={`${sizeConf.subtitleSize} text-gray-600 truncate`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {/* Badge de statut */}
        {(badge || status) && (
          <div className="flex-shrink-0 ml-2">
            {status && (
              <span className={statusConfig[status]}>
                {status === 'confirmed' && 'Confirmé'}
                {status === 'pending' && 'En attente'}
                {status === 'urgent' && 'Urgent'}
                {status === 'normal' && 'Normal'}
                {status === 'cancelled' && 'Annulé'}
              </span>
            )}
            {badge && !status && (
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                {badge}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className={`${sizeConf.subtitleSize} text-gray-700 line-clamp-2`}>
          {description}
        </p>
      )}

      {/* Informations médicales */}
      {(time || duration || location) && (
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          {time && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{time}</span>
            </div>
          )}
          {duration && (
            <div className="flex items-center space-x-1">
              <Activity className="w-3 h-3" />
              <span>{duration}</span>
            </div>
          )}
          {location && (
            <div className="flex items-center space-x-1">
              <Stethoscope className="w-3 h-3" />
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>
      )}

      {/* Contenu personnalisé */}
      {children && (
        <div className="mt-3">
          {children}
        </div>
      )}

      {/* Action secondaire */}
      {onSecondaryAction && (
        <div className="pt-3 border-t border-gray-200 mt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSecondaryAction();
            }}
            className="btn-medical-sm w-full btn-vacation"
          >
            {secondaryActionLabel}
          </button>
        </div>
      )}
    </div>
  );
}

// Variantes spécialisées pour différents contextes médicaux
export function GuardCard(props: Omit<MedicalCardProps, 'type'>) {
  return <MedicalCard {...props} type="guard" />;
}

export function OnCallCard(props: Omit<MedicalCardProps, 'type'>) {
  return <MedicalCard {...props} type="oncall" />;
}

export function VacationCard(props: Omit<MedicalCardProps, 'type'>) {
  return <MedicalCard {...props} type="vacation" />;
}

export function RestCard(props: Omit<MedicalCardProps, 'type'>) {
  return <MedicalCard {...props} type="rest" />;
}

export function EmergencyCard(props: Omit<MedicalCardProps, 'type'>) {
  return <MedicalCard {...props} type="emergency" />;
}

export default MedicalCard;