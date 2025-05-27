'use client';

import React from 'react';
import { VacationCard, GuardCard, OnCallCard, RestCard } from '@/components/ui/MedicalCard';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PlanningCardProps {
  id: string;
  title: string;
  type: 'vacation' | 'guard' | 'oncall' | 'rest' | 'leave';
  startTime: Date;
  endTime: Date;
  location?: string;
  surgeon?: string;
  patient?: string;
  status?: 'confirmed' | 'pending' | 'urgent' | 'normal' | 'cancelled';
  description?: string;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function PlanningCard({
  id,
  title,
  type,
  startTime,
  endTime,
  location,
  surgeon,
  patient,
  status = 'normal',
  description,
  onClick,
  onEdit,
  onDelete,
  className = ''
}: PlanningCardProps) {
  // Formate les heures
  const timeRange = `${format(startTime, 'HH:mm', { locale: fr })} - ${format(endTime, 'HH:mm', { locale: fr })}`;
  
  // Calcule la durée
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const duration = durationHours > 0 ? 
    `${durationHours}h${durationMinutes > 0 ? durationMinutes.toString().padStart(2, '0') : ''}` :
    `${durationMinutes}min`;

  // Détermine l'icône selon le type
  const getIcon = () => {
    switch (type) {
      case 'vacation': return Calendar;
      case 'guard': return Clock;
      case 'oncall': return Clock;
      case 'rest': return User;
      case 'leave': return User;
      default: return Calendar;
    }
  };

  // Construit la description enrichie
  const enrichedDescription = [
    description,
    surgeon && `Chirurgien: ${surgeon}`,
    patient && `Patient: ${patient}`,
  ].filter(Boolean).join(' • ');

  // Props communes pour toutes les cards
  const commonProps = {
    title,
    subtitle: location || 'Non spécifié',
    description: enrichedDescription,
    time: timeRange,
    duration,
    location,
    status,
    icon: getIcon(),
    onClick,
    onSecondaryAction: onEdit,
    secondaryActionLabel: 'Modifier',
    className
  };

  // Sélectionne le bon composant selon le type
  switch (type) {
    case 'guard':
      return <GuardCard {...commonProps} />;
    
    case 'oncall':
      return <OnCallCard {...commonProps} />;
    
    case 'rest':
    case 'leave':
      return <RestCard {...commonProps} />;
    
    case 'vacation':
    default:
      return <VacationCard {...commonProps} />;
  }
}

// Composant pour une liste de cards planning
interface PlanningCardListProps {
  plannings: PlanningCardProps[];
  onPlanningClick?: (planning: PlanningCardProps) => void;
  onPlanningEdit?: (planning: PlanningCardProps) => void;
  onPlanningDelete?: (planning: PlanningCardProps) => void;
  emptyMessage?: string;
  className?: string;
}

export function PlanningCardList({
  plannings,
  onPlanningClick,
  onPlanningEdit,
  onPlanningDelete,
  emptyMessage = 'Aucun planning pour cette période',
  className = ''
}: PlanningCardListProps) {
  if (plannings.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {plannings.map((planning) => (
        <PlanningCard
          key={planning.id}
          {...planning}
          onClick={() => onPlanningClick?.(planning)}
          onEdit={() => onPlanningEdit?.(planning)}
          onDelete={() => onPlanningDelete?.(planning)}
        />
      ))}
    </div>
  );
}

export default PlanningCard;