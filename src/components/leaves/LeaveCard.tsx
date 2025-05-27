'use client';

import React from 'react';
import { RestCard, OnCallCard } from '@/components/ui/MedicalCard';
import { Calendar, Clock, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LeaveCardProps {
  id: string;
  type: string;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason?: string;
  comment?: string;
  approver?: string;
  requestedBy: string;
  totalDays: number;
  onClick?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  isUrgent?: boolean;
  className?: string;
}

export function LeaveCard({
  id,
  type,
  startDate,
  endDate,
  status,
  reason,
  comment,
  approver,
  requestedBy,
  totalDays,
  onClick,
  onApprove,
  onReject,
  onCancel,
  isUrgent = false,
  className = ''
}: LeaveCardProps) {
  // Formate les dates
  const dateRange = `${format(startDate, 'dd/MM/yyyy', { locale: fr })} - ${format(endDate, 'dd/MM/yyyy', { locale: fr })}`;
  
  // Détermine le statut pour l'affichage
  const getCardStatus = () => {
    switch (status) {
      case 'approved': return 'confirmed';
      case 'pending': return isUrgent ? 'urgent' : 'pending';
      case 'rejected': return 'cancelled';
      case 'cancelled': return 'cancelled';
      default: return 'normal';
    }
  };

  // Détermine le titre selon le statut
  const getTitle = () => {
    const baseTitle = `${type} - ${totalDays} jour${totalDays > 1 ? 's' : ''}`;
    
    switch (status) {
      case 'approved': return `✅ ${baseTitle}`;
      case 'pending': return `⏳ ${baseTitle}`;
      case 'rejected': return `❌ ${baseTitle}`;
      case 'cancelled': return `🚫 ${baseTitle}`;
      default: return baseTitle;
    }
  };

  // Construit la description
  const getDescription = () => {
    const parts = [];
    
    if (reason) parts.push(`Motif: ${reason}`);
    if (comment) parts.push(`Note: ${comment}`);
    if (approver && status !== 'pending') parts.push(`Validé par: ${approver}`);
    
    return parts.join(' • ');
  };

  // Détermine l'action secondaire selon le statut
  const getSecondaryAction = () => {
    if (status === 'pending' && onApprove) {
      return {
        action: onApprove,
        label: 'Approuver'
      };
    }
    
    if (status === 'approved' && onCancel) {
      return {
        action: onCancel,
        label: 'Annuler'
      };
    }
    
    return null;
  };

  const secondaryAction = getSecondaryAction();

  // Utilise RestCard pour les congés normaux et OnCallCard pour les urgents
  const CardComponent = isUrgent ? OnCallCard : RestCard;

  return (
    <CardComponent
      title={getTitle()}
      subtitle={`Demandé par ${requestedBy}`}
      description={getDescription()}
      time={dateRange}
      duration={`${totalDays} jour${totalDays > 1 ? 's' : ''}`}
      location={status === 'pending' ? 'En attente de validation' : 'Validé'}
      status={getCardStatus()}
      icon={Calendar}
      onClick={onClick}
      onSecondaryAction={secondaryAction?.action}
      secondaryActionLabel={secondaryAction?.label}
      badge={status === 'pending' ? 'À valider' : undefined}
      className={className}
    />
  );
}

// Composant pour lister les demandes de congés
interface LeaveCardListProps {
  leaves: LeaveCardProps[];
  onLeaveClick?: (leave: LeaveCardProps) => void;
  onLeaveApprove?: (leave: LeaveCardProps) => void;
  onLeaveReject?: (leave: LeaveCardProps) => void;
  onLeaveCancel?: (leave: LeaveCardProps) => void;
  groupByStatus?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function LeaveCardList({
  leaves,
  onLeaveClick,
  onLeaveApprove,
  onLeaveReject,
  onLeaveCancel,
  groupByStatus = false,
  emptyMessage = 'Aucune demande de congé',
  className = ''
}: LeaveCardListProps) {
  if (leaves.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  if (groupByStatus) {
    const groupedLeaves = leaves.reduce((acc, leave) => {
      const status = leave.status;
      if (!acc[status]) acc[status] = [];
      acc[status].push(leave);
      return acc;
    }, {} as Record<string, LeaveCardProps[]>);

    const statusOrder = ['pending', 'approved', 'rejected', 'cancelled'];
    const statusLabels = {
      pending: '⏳ En attente',
      approved: '✅ Approuvées',
      rejected: '❌ Refusées',
      cancelled: '🚫 Annulées'
    };

    return (
      <div className={`space-y-6 ${className}`}>
        {statusOrder.map(status => {
          const statusLeaves = groupedLeaves[status];
          if (!statusLeaves || statusLeaves.length === 0) return null;

          return (
            <div key={status}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {statusLabels[status]} ({statusLeaves.length})
              </h3>
              <div className="space-y-3">
                {statusLeaves.map((leave) => (
                  <LeaveCard
                    key={leave.id}
                    {...leave}
                    onClick={() => onLeaveClick?.(leave)}
                    onApprove={() => onLeaveApprove?.(leave)}
                    onReject={() => onLeaveReject?.(leave)}
                    onCancel={() => onLeaveCancel?.(leave)}
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
      {leaves.map((leave) => (
        <LeaveCard
          key={leave.id}
          {...leave}
          onClick={() => onLeaveClick?.(leave)}
          onApprove={() => onLeaveApprove?.(leave)}
          onReject={() => onLeaveReject?.(leave)}
          onCancel={() => onLeaveCancel?.(leave)}
        />
      ))}
    </div>
  );
}

export default LeaveCard;