'use client';

import React from 'react';
import { VacationCard, GuardCard, EmergencyCard } from '@/components/ui/MedicalCard';
import { Stethoscope, AlertTriangle, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BlocCardProps {
  id: string;
  roomNumber: string;
  roomName?: string;
  surgeonName: string;
  patientName?: string;
  procedure: string;
  startTime: Date;
  endTime?: Date;
  estimatedDuration?: number; // en minutes
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'emergency';
  priority: 'normal' | 'urgent' | 'emergency';
  specialty?: string;
  anesthesiologist?: string;
  notes?: string;
  onClick?: () => void;
  onEdit?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function BlocCard({
  id,
  roomNumber,
  roomName,
  surgeonName,
  patientName,
  procedure,
  startTime,
  endTime,
  estimatedDuration,
  status,
  priority,
  specialty,
  anesthesiologist,
  notes,
  onClick,
  onEdit,
  onStart,
  onComplete,
  onCancel,
  className = ''
}: BlocCardProps) {
  // Formate les heures
  const startTimeStr = format(startTime, 'HH:mm', { locale: fr });
  const endTimeStr = endTime ? format(endTime, 'HH:mm', { locale: fr }) : '';
  const timeRange = endTimeStr ? `${startTimeStr} - ${endTimeStr}` : `${startTimeStr}`;
  
  // Calcule la durée
  let duration = '';
  if (endTime) {
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    duration = hours > 0 ? `${hours}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}` : `${mins}min`;
  } else if (estimatedDuration) {
    const hours = Math.floor(estimatedDuration / 60);
    const mins = estimatedDuration % 60;
    duration = hours > 0 ? `${hours}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}` : `${mins}min`;
  }

  // Détermine le statut pour l'affichage
  const getCardStatus = () => {
    switch (status) {
      case 'planned': return priority === 'emergency' ? 'urgent' : 'normal';
      case 'in_progress': return 'pending';
      case 'completed': return 'confirmed';
      case 'cancelled': return 'cancelled';
      case 'emergency': return 'urgent';
      default: return 'normal';
    }
  };

  // Détermine le titre avec icônes
  const getTitle = () => {
    const statusIcons = {
      planned: '📅',
      in_progress: '🔄',
      completed: '✅',
      cancelled: '❌',
      emergency: '🚨'
    };
    
    const priorityIcons = {
      normal: '',
      urgent: '⚠️',
      emergency: '🚨'
    };
    
    const icon = status === 'emergency' ? statusIcons.emergency : priorityIcons[priority];
    return `${icon} ${procedure}`.trim();
  };

  // Construit la description
  const getDescription = () => {
    const parts = [];
    
    if (patientName) parts.push(`Patient: ${patientName}`);
    if (specialty) parts.push(`Spécialité: ${specialty}`);
    if (anesthesiologist) parts.push(`Anesthésiste: ${anesthesiologist}`);
    if (notes) parts.push(`Note: ${notes}`);
    
    return parts.join(' • ');
  };

  // Détermine l'action secondaire selon le statut
  const getSecondaryAction = () => {
    switch (status) {
      case 'planned':
        return onStart ? { action: onStart, label: 'Démarrer' } : null;
      case 'in_progress':
        return onComplete ? { action: onComplete, label: 'Terminer' } : null;
      case 'completed':
      case 'cancelled':
        return null;
      case 'emergency':
        return onStart ? { action: onStart, label: 'Prendre en charge' } : null;
      default:
        return onEdit ? { action: onEdit, label: 'Modifier' } : null;
    }
  };

  const secondaryAction = getSecondaryAction();

  // Détermine l'icône selon le contexte
  const getIcon = () => {
    if (status === 'emergency' || priority === 'emergency') return AlertTriangle;
    if (status === 'in_progress') return Clock;
    return Stethoscope;
  };

  // Props communes
  const commonProps = {
    title: getTitle(),
    subtitle: `${roomName || roomNumber} • Dr. ${surgeonName}`,
    description: getDescription(),
    time: timeRange,
    duration,
    location: `Bloc ${roomNumber}`,
    status: getCardStatus(),
    icon: getIcon(),
    onClick,
    onSecondaryAction: secondaryAction?.action,
    secondaryActionLabel: secondaryAction?.label,
    className
  };

  // Sélectionne le composant selon la priorité et le statut
  if (status === 'emergency' || priority === 'emergency') {
    return <EmergencyCard {...commonProps} />;
  }
  
  if (priority === 'urgent' || status === 'in_progress') {
    return <GuardCard {...commonProps} />;
  }
  
  return <VacationCard {...commonProps} />;
}

// Composant pour lister les interventions du bloc
interface BlocCardListProps {
  interventions: BlocCardProps[];
  onInterventionClick?: (intervention: BlocCardProps) => void;
  onInterventionEdit?: (intervention: BlocCardProps) => void;
  onInterventionStart?: (intervention: BlocCardProps) => void;
  onInterventionComplete?: (intervention: BlocCardProps) => void;
  onInterventionCancel?: (intervention: BlocCardProps) => void;
  groupByRoom?: boolean;
  groupByStatus?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function BlocCardList({
  interventions,
  onInterventionClick,
  onInterventionEdit,
  onInterventionStart,
  onInterventionComplete,
  onInterventionCancel,
  groupByRoom = false,
  groupByStatus = false,
  emptyMessage = 'Aucune intervention programmée',
  className = ''
}: BlocCardListProps) {
  if (interventions.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <Stethoscope className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  if (groupByRoom) {
    const groupedInterventions = interventions.reduce((acc, intervention) => {
      const room = intervention.roomNumber;
      if (!acc[room]) acc[room] = [];
      acc[room].push(intervention);
      return acc;
    }, {} as Record<string, BlocCardProps[]>);

    return (
      <div className={`space-y-6 ${className}`}>
        {Object.entries(groupedInterventions).map(([room, roomInterventions]) => (
          <div key={room}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🏥 Bloc {room} ({roomInterventions.length} intervention{roomInterventions.length > 1 ? 's' : ''})
            </h3>
            <div className="space-y-3">
              {roomInterventions.map((intervention) => (
                <BlocCard
                  key={intervention.id}
                  {...intervention}
                  onClick={() => onInterventionClick?.(intervention)}
                  onEdit={() => onInterventionEdit?.(intervention)}
                  onStart={() => onInterventionStart?.(intervention)}
                  onComplete={() => onInterventionComplete?.(intervention)}
                  onCancel={() => onInterventionCancel?.(intervention)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (groupByStatus) {
    const groupedInterventions = interventions.reduce((acc, intervention) => {
      const status = intervention.status;
      if (!acc[status]) acc[status] = [];
      acc[status].push(intervention);
      return acc;
    }, {} as Record<string, BlocCardProps[]>);

    const statusOrder = ['emergency', 'in_progress', 'planned', 'completed', 'cancelled'];
    const statusLabels = {
      emergency: '🚨 Urgences',
      in_progress: '🔄 En cours',
      planned: '📅 Programmées',
      completed: '✅ Terminées',
      cancelled: '❌ Annulées'
    };

    return (
      <div className={`space-y-6 ${className}`}>
        {statusOrder.map(status => {
          const statusInterventions = groupedInterventions[status];
          if (!statusInterventions || statusInterventions.length === 0) return null;

          return (
            <div key={status}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {statusLabels[status]} ({statusInterventions.length})
              </h3>
              <div className="space-y-3">
                {statusInterventions.map((intervention) => (
                  <BlocCard
                    key={intervention.id}
                    {...intervention}
                    onClick={() => onInterventionClick?.(intervention)}
                    onEdit={() => onInterventionEdit?.(intervention)}
                    onStart={() => onInterventionStart?.(intervention)}
                    onComplete={() => onInterventionComplete?.(intervention)}
                    onCancel={() => onInterventionCancel?.(intervention)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {interventions.map((intervention) => (
        <BlocCard
          key={intervention.id}
          {...intervention}
          onClick={() => onInterventionClick?.(intervention)}
          onEdit={() => onInterventionEdit?.(intervention)}
          onStart={() => onInterventionStart?.(intervention)}
          onComplete={() => onInterventionComplete?.(intervention)}
          onCancel={() => onInterventionCancel?.(intervention)}
        />
      ))}
    </div>
  );
}

export default BlocCard;