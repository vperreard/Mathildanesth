import React, { useState, useEffect, useCallback } from 'react';
import { logger } from "../../../lib/logger";
import { BaseCalendar } from './BaseCalendar';
import { LeaveEvent, CalendarEventType, CalendarSettings } from '../types/event';
import { useLeaveData } from '../../conges/hooks/useLeaveData';
import { Leave, LeaveStatus } from '../../conges/types/leave';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { User } from '@/types/user';
import { LeaveDetailModal } from '../../conges/components/LeaveDetailModal';
import { useUserSettings } from '../../parametres/hooks/useUserSettings';
import { performanceTracker } from '../../conges/utils/performanceMonitoring';

interface LeaveCalendarViewProps {
    userId?: string;
    departmentId?: string;
    startDate?: Date;
    endDate?: Date;
    settings?: Partial<CalendarSettings>;
    onViewChange?: (view: string) => void;
    onDateRangeChange?: (startDate: Date, endDate: Date) => void;
    mode?: 'personal' | 'department' | 'all';
    loading?: boolean;
    onLeaveClick?: (leaveId: string) => void;
}

/**
 * Composant de calendrier spécialisé pour les congés
 * Affiche les congés dans une vue calendrier
 */
export const LeaveCalendarView: React.FC<LeaveCalendarViewProps> = ({
    userId,
    departmentId,
    startDate = new Date(),
    endDate,
    settings,
    onViewChange,
    onDateRangeChange,
    mode = 'personal',
    loading = false,
    onLeaveClick
}) => {
    // État pour stocker les événements de congés
    const [leaveEvents, setLeaveEvents] = useState<LeaveEvent[]>([]);

    // État pour la gestion du modal de détail
    const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Récupération des préférences utilisateur
    const { settings: userSettings } = useUserSettings(userId);

    // Récupération des données de congés
    const {
        leaves,
        loading: leavesLoading,
        error: leavesError,
        fetchLeaves
    } = useLeaveData();

    // Calcul de la date de fin si non fournie
    const calculatedEndDate = endDate || new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    // Charger les congés lors du montage ou du changement de dates
    useEffect(() => {
        const fetchData = async () => {
            try {
                const leaveParams: any = {
                    startDate: format(startDate, 'yyyy-MM-dd'),
                    endDate: format(calculatedEndDate, 'yyyy-MM-dd')
                };

                if (mode === 'personal' && userId) {
                    leaveParams.userId = userId;
                } else if (mode === 'department' && departmentId) {
                    leaveParams.departmentId = departmentId;
                }

                // Récupérer les congés selon les paramètres
                await fetchLeaves(leaveParams);
            } catch (error) {
                logger.error('Erreur lors du chargement des congés pour le calendrier:', error);
            }
        };

        fetchData();
    }, [startDate, calculatedEndDate, mode, userId, departmentId, fetchLeaves]);

    // Convertir les congés en événements de calendrier
    useEffect(() => {
        const startTime = performance.now();

        const convertLeavesToEvents = (): LeaveEvent[] => {
            if (!leaves || leaves.length === 0) return [];

            // Filtrer les congés rejetés si l'utilisateur a désactivé leur affichage
            const filteredLeaves = userSettings?.showRejectedLeaves === false
                ? leaves.filter(leave => leave.status !== LeaveStatus.REJECTED)
                : leaves;

            return filteredLeaves.map(leave => {
                const userName = leave.user
                    ? `${leave.user.prenom} ${leave.user.nom}`
                    : '';

                return {
                    id: `leave-${leave.id}`,
                    title: `${userName ? `${userName} - ` : ''}${getLeaveTypeLabel(leave.type)}`,
                    start: new Date(leave.startDate).toISOString(),
                    end: new Date(leave.endDate).toISOString(),
                    type: CalendarEventType.LEAVE,
                    leaveType: leave.type,
                    status: leave.status as 'PENDING' | 'APPROVED' | 'REJECTED',
                    countedDays: leave.countedDays,
                    allDay: true,
                    className: getEventClassName(leave),
                    editable: false,
                    description: leave.comment || '',
                    extendedProps: {
                        userId: leave.userId,
                        userName,
                        isRecurring: leave.isRecurring || false
                    }
                };
            });
        };

        const events = convertLeavesToEvents();
        setLeaveEvents(events);

        // Mesurer les performances
        const duration = performance.now() - startTime;
        performanceTracker.recordMetric('LeaveCalendarView.convertLeavesToEvents', {
            duration,
            eventsCount: events.length,
            leavesCount: leaves?.length || 0
        });
    }, [leaves, userSettings?.showRejectedLeaves]);

    // Gestionnaire de clic sur un événement
    const handleEventClick = useCallback((eventId: string) => {
        // Extraire l'ID du congé de l'ID de l'événement
        const leaveId = eventId.replace('leave-', '');

        if (onLeaveClick) {
            onLeaveClick(leaveId);
        } else {
            setSelectedLeaveId(leaveId);
            setShowDetailModal(true);
        }
    }, [onLeaveClick]);

    // Obtenir l'étiquette pour un type de congé
    const getLeaveTypeLabel = (type: string): string => {
        switch (type) {
            case 'ANNUAL': return 'Congé annuel';
            case 'RECOVERY': return 'Récupération';
            case 'TRAINING': return 'Formation';
            case 'SICK': return 'Congé maladie';
            case 'MATERNITY': return 'Congé maternité';
            case 'SPECIAL': return 'Congé spécial';
            case 'UNPAID': return 'Congé sans solde';
            default: return type;
        }
    };

    // Obtenir la classe CSS pour un événement
    const getEventClassName = (leave: Leave): string => {
        const baseClass = 'leave-event';
        const statusClass = `leave-status-${leave.status.toLowerCase()}`;
        const typeClass = `leave-type-${leave.type.toLowerCase()}`;
        const recurringClass = leave.isRecurring ? 'leave-recurring' : '';
        return `${baseClass} ${statusClass} ${typeClass} ${recurringClass}`.trim();
    };

    // Définition des paramètres du calendrier
    const mergedSettings: CalendarSettings = {
        locale: 'fr',
        firstDay: userSettings?.startWeekOn === 'monday' ? 1 : 0,
        businessHours: {
            startTime: '09:00',
            endTime: '18:00',
            daysOfWeek: [1, 2, 3, 4, 5]
        },
        nowIndicator: true,
        snapDuration: '00:15:00',
        slotDuration: '00:30:00',
        slotLabelInterval: '01:00:00',
        slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: userSettings?.timeFormat === '12h'
        },
        slotMinTime: '08:00:00',
        slotMaxTime: '20:00:00',
        ...(settings || {})
    };

    // Configurer la barre d'outils du calendrier
    const headerToolbar = {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,listWeek'
    };

    return (
        <div className="leave-calendar-container">
            {(loading || leavesLoading) && (
                <div className="leave-calendar-loading">
                    <div className="spinner"></div>
                    <span>Chargement des congés...</span>
                </div>
            )}

            {leavesError && (
                <div className="leave-calendar-error">
                    <p>Erreur lors du chargement des données: {leavesError.message}</p>
                </div>
            )}

            <BaseCalendar
                events={leaveEvents}
                view="dayGridMonth"
                settings={mergedSettings}
                loading={loading || leavesLoading}
                editable={false}
                selectable={false}
                onEventClick={handleEventClick}
                onViewChange={onViewChange}
                onDateRangeChange={onDateRangeChange}
                headerToolbar={headerToolbar}
            />

            {showDetailModal && selectedLeaveId && (
                <LeaveDetailModal
                    leaveId={selectedLeaveId}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedLeaveId(null);
                    }}
                />
            )}
        </div>
    );
}; 