'use client';

import React, { useState, useEffect } from 'react';
import { QuickActionButton } from '@/components/ui/MedicalButton';
import { MedicalCard } from '@/components/ui/MedicalCard';
import { useNotifications } from '@/components/ui/MedicalNotification';
import { 
  Calendar, 
  Stethoscope, 
  Clock, 
  Bell, 
  Users, 
  Activity,
  MapPin,
  AlertTriangle,
  CheckCircle,
  User,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardStats {
  todayPlannings: number;
  pendingLeaves: number;
  activeInterventions: number;
  urgentNotifications: number;
  onCallToday: boolean;
  guardTonight: boolean;
}

interface TodayEvent {
  id: string;
  type: 'vacation' | 'guard' | 'oncall' | 'intervention' | 'leave';
  title: string;
  time: string;
  location?: string;
  status: 'confirmed' | 'pending' | 'urgent' | 'normal';
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

interface MobileDashboardProps {
  user?: {
    name: string;
    role: string;
    specialties?: string[];
  };
  stats?: DashboardStats;
  todayEvents?: TodayEvent[];
  onQuickAction?: (action: string) => void;
  className?: string;
}

export function MobileDashboard({
  user,
  stats,
  todayEvents = [],
  onQuickAction,
  className = ''
}: MobileDashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { notifySuccess, notifyWarning, notifyGuard } = useNotifications();

  // Met à jour l'heure toutes les minutes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Stats par défaut si non fournies
  const defaultStats: DashboardStats = {
    todayPlannings: 3,
    pendingLeaves: 2,
    activeInterventions: 1,
    urgentNotifications: 1,
    onCallToday: true,
    guardTonight: false
  };

  const currentStats = stats || defaultStats;

  // Gestionnaire d'actions rapides
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'planning':
        notifySuccess('Planning', 'Ouverture du planning du jour');
        break;
      case 'bloc':
        notifyWarning('Bloc Opératoire', 'Vérification des interventions en cours');
        break;
      case 'urgence':
        notifyGuard('URGENCE', 'Activation du protocole d\'urgence');
        break;
      case 'conges':
        notifySuccess('Congés', 'Accès aux demandes de congés');
        break;
      default:
        break;
    }
    onQuickAction?.(action);
  };

  // Détermine le message de statut de garde/astreinte
  const getStatusMessage = () => {
    if (currentStats.guardTonight && currentStats.onCallToday) {
      return { message: 'Garde cette nuit + Astreinte', type: 'guard' as const, icon: AlertTriangle };
    }
    if (currentStats.guardTonight) {
      return { message: 'Garde cette nuit', type: 'guard' as const, icon: Clock };
    }
    if (currentStats.onCallToday) {
      return { message: 'Astreinte aujourd\'hui', type: 'oncall' as const, icon: Bell };
    }
    return { message: 'Journée normale', type: 'rest' as const, icon: CheckCircle };
  };

  const statusInfo = getStatusMessage();

  return (
    <div className={`space-y-6 pb-safe ${className}`}>
      {/* Header avec l'heure et le statut */}
      <div className="text-center space-y-2">
        <div className="text-3xl font-bold text-gray-900">
          {format(currentTime, 'HH:mm', { locale: fr })}
        </div>
        <div className="text-sm text-gray-600">
          {format(currentTime, 'EEEE dd MMMM yyyy', { locale: fr })}
        </div>
        
        {/* Statut de garde/astreinte */}
        <MedicalCard
          type={statusInfo.type}
          size="sm"
          title={statusInfo.message}
          icon={statusInfo.icon}
          className="max-w-xs mx-auto"
        />
      </div>

      {/* Salutation utilisateur */}
      {user && (
        <div className="bg-white rounded-medical-lg p-4 shadow-medical">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-medical-vacation-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-medical-vacation-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Bonjour, Dr. {user.name}
              </h2>
              <p className="text-sm text-gray-600">
                {user.role} {user.specialties?.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⚡ Actions Rapides
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <QuickActionButton
            icon={Calendar}
            label="Planning du jour"
            count={currentStats.todayPlannings}
            variant="vacation"
            onClick={() => handleQuickAction('planning')}
          />
          <QuickActionButton
            icon={Stethoscope}
            label="Bloc Opératoire"
            count={currentStats.activeInterventions}
            variant={currentStats.activeInterventions > 0 ? 'guard' : 'vacation'}
            onClick={() => handleQuickAction('bloc')}
          />
          <QuickActionButton
            icon={FileText}
            label="Demandes Congés"
            count={currentStats.pendingLeaves}
            variant="rest"
            onClick={() => handleQuickAction('conges')}
          />
          <QuickActionButton
            icon={AlertTriangle}
            label="Urgences"
            count={currentStats.urgentNotifications}
            variant="guard"
            onClick={() => handleQuickAction('urgence')}
          />
        </div>
      </div>

      {/* Événements du jour */}
      {todayEvents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📅 Aujourd'hui ({todayEvents.length})
          </h3>
          <div className="space-y-3">
            {todayEvents.slice(0, 3).map((event) => {
              const getEventType = () => {
                switch (event.type) {
                  case 'guard': return 'guard';
                  case 'oncall': return 'oncall';
                  case 'intervention': return event.priority === 'critical' ? 'emergency' : 'vacation';
                  case 'leave': return 'rest';
                  default: return 'vacation';
                }
              };

              return (
                <MedicalCard
                  key={event.id}
                  type={getEventType()}
                  size="sm"
                  title={event.title}
                  subtitle={event.time}
                  location={event.location}
                  status={event.status}
                  onClick={() => handleQuickAction(event.type)}
                />
              );
            })}
            
            {todayEvents.length > 3 && (
              <div className="text-center">
                <button
                  onClick={() => handleQuickAction('planning')}
                  className="text-sm text-medical-vacation-600 hover:text-medical-vacation-700 font-medium"
                >
                  Voir {todayEvents.length - 3} autres événements
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistiques rapides */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📊 Vue d'ensemble
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-medical-vacation-50 rounded-medical p-3 border-l-4 border-l-medical-vacation-500">
            <div className="text-2xl font-bold text-medical-vacation-700">
              {currentStats.todayPlannings}
            </div>
            <div className="text-sm text-medical-vacation-600">
              Plannings aujourd'hui
            </div>
          </div>
          
          <div className="bg-medical-rest-50 rounded-medical p-3 border-l-4 border-l-medical-rest-500">
            <div className="text-2xl font-bold text-medical-rest-700">
              {currentStats.pendingLeaves}
            </div>
            <div className="text-sm text-medical-rest-600">
              Congés en attente
            </div>
          </div>
          
          <div className="bg-medical-guard-50 rounded-medical p-3 border-l-4 border-l-medical-guard-500">
            <div className="text-2xl font-bold text-medical-guard-700">
              {currentStats.activeInterventions}
            </div>
            <div className="text-sm text-medical-guard-600">
              Interventions actives
            </div>
          </div>
          
          <div className="bg-medical-oncall-50 rounded-medical p-3 border-l-4 border-l-medical-oncall-500">
            <div className="text-2xl font-bold text-medical-oncall-700">
              {currentStats.urgentNotifications}
            </div>
            <div className="text-sm text-medical-oncall-600">
              Notifications urgentes
            </div>
          </div>
        </div>
      </div>

      {/* Accès rapide équipe */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          👥 Équipe de garde
        </h3>
        <div className="space-y-2">
          <QuickActionButton
            icon={Users}
            label="Équipe présente (5)"
            variant="vacation"
            onClick={() => handleQuickAction('equipe')}
            className="w-full"
          />
          <QuickActionButton
            icon={MapPin}
            label="Localisation équipes"
            variant="oncall"
            onClick={() => handleQuickAction('localisation')}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

export default MobileDashboard;