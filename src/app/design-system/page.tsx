'use client';

import React, { useState } from 'react';
import { MedicalCard, GuardCard, OnCallCard, VacationCard, RestCard, EmergencyCard } from '@/components/ui/MedicalCard';
import { MedicalButton, GuardButton, OnCallButton, VacationButton, RestButton, QuickActionButton } from '@/components/ui/MedicalButton';
import { MedicalNotification, useNotifications, NotificationContainer } from '@/components/ui/MedicalNotification';
import { EmergencyPanel } from '@/components/emergency/EmergencyPanel';
import { MobileDashboard } from '@/components/dashboard/MobileDashboard';
import { QuickStatsGrid } from '@/components/mobile/QuickStatsGrid';
import { 
  Stethoscope, 
  Calendar, 
  Clock, 
  Bell, 
  Heart, 
  Activity,
  Users,
  MapPin,
  AlertTriangle,
  FileText,
  Shield,
  Phone
} from 'lucide-react';

export default function DesignSystemPage() {
  const {
    notifications,
    removeNotification,
    notifySuccess,
    notifyWarning,
    notifyError,
    notifyGuard,
    notifyOnCall
  } = useNotifications();

  const [isLoading, setIsLoading] = useState(false);
  const [emergencyActive, setEmergencyActive] = useState(false);

  const handleDemoAction = async (type: string) => {
    setIsLoading(true);
    
    // Simule une action
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    switch (type) {
      case 'guard':
        notifyGuard('Garde urgente', 'Intervention nécessaire en bloc 3');
        break;
      case 'oncall':
        notifyOnCall('Astreinte activée', 'Vous êtes maintenant en astreinte');
        break;
      case 'success':
        notifySuccess('Action réussie', 'Planning mis à jour avec succès');
        break;
      case 'warning':
        notifyWarning('Attention', 'Conflit de planning détecté');
        break;
      case 'error':
        notifyError('Erreur', 'Impossible de sauvegarder les modifications');
        break;
    }
    
    setIsLoading(false);
  };

  // Données de démonstration
  const mockUser = {
    name: 'Martin',
    role: 'Anesthésiste Senior',
    specialties: ['Anesthésie générale', 'Pédiatrie']
  };

  const mockStats = {
    todayPlannings: 4,
    pendingLeaves: 3,
    activeInterventions: 2,
    urgentNotifications: 1,
    onCallToday: true,
    guardTonight: false
  };

  const mockTodayEvents = [
    {
      id: '1',
      type: 'vacation' as const,
      title: 'Bloc Orthopédie - Salle 3',
      time: '08:00 - 12:00',
      location: 'Bloc C',
      status: 'confirmed' as const
    },
    {
      id: '2',
      type: 'oncall' as const,
      title: 'Astreinte obstétrique',
      time: '18:00 - 08:00',
      location: 'Maternité',
      status: 'pending' as const
    },
    {
      id: '3',
      type: 'guard' as const,
      title: 'Garde de nuit',
      time: '20:00 - 08:00',
      location: 'Urgences',
      status: 'urgent' as const
    }
  ];

  const statsData = [
    {
      id: 'planning',
      title: 'Plannings aujourd\'hui',
      value: 4,
      icon: Calendar,
      color: 'vacation' as const,
      trend: 'up' as const,
      change: 12,
      onClick: () => handleDemoAction('success')
    },
    {
      id: 'interventions',
      title: 'Interventions actives',
      value: 2,
      icon: Stethoscope,
      color: 'guard' as const,
      trend: 'stable' as const,
      onClick: () => handleDemoAction('warning')
    },
    {
      id: 'conges',
      title: 'Congés en attente',
      value: 3,
      icon: FileText,
      color: 'rest' as const,
      trend: 'down' as const,
      change: -8,
      onClick: () => handleDemoAction('success')
    },
    {
      id: 'urgences',
      title: 'Alertes urgentes',
      value: 1,
      icon: AlertTriangle,
      color: 'emergency' as const,
      trend: 'up' as const,
      change: 50,
      onClick: () => handleDemoAction('guard')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-safe">
      <div className="max-w-4xl mx-auto p-4 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏥 Design System Médical
          </h1>
          <p className="text-gray-600">
            Composants UI optimisés pour les équipes médicales
          </p>
        </div>

        {/* Dashboard mobile */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📱 Dashboard Mobile
          </h2>
          <div className="bg-white rounded-medical-lg p-4 max-w-md mx-auto">
            <MobileDashboard
              user={mockUser}
              stats={mockStats}
              todayEvents={mockTodayEvents}
              onQuickAction={handleDemoAction}
            />
          </div>
        </section>

        {/* Statistiques rapides */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📊 Statistiques Rapides
          </h2>
          <QuickStatsGrid stats={statsData} className="max-w-md mx-auto" />
        </section>

        {/* Cards médicales */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🏥 Cards Médicales
          </h2>
          
          <div className="grid gap-4 max-w-2xl mx-auto">
            <GuardCard
              title="Garde de nuit - Urgences"
              subtitle="Service Urgences"
              description="Prise en charge des urgences et interventions critiques. Patient en détresse respiratoire."
              time="20h00 - 08h00"
              duration="12h"
              location="Bloc 1 & 2"
              status="urgent"
              onClick={() => handleDemoAction('guard')}
            />

            <OnCallCard
              title="Astreinte obstétrique"
              subtitle="Dr. Martin"
              description="Disponibilité pour césariennes et urgences maternité"
              time="18h00 - 08h00"
              location="Maternité"
              status="confirmed"
              onSecondaryAction={() => handleDemoAction('oncall')}
              secondaryActionLabel="Modifier"
            />

            <VacationCard
              title="Bloc orthopédie - Prothèse de hanche"
              subtitle="Salle 3 - Dr. Dubois"
              description="Prothèse totale de hanche droite - Patiente Mme Martin, 68 ans"
              time="14h00 - 16h30"
              duration="2h30"
              location="Bloc C"
              status="normal"
            />

            <RestCard
              title="Congés annuels"
              subtitle="Demande approuvée"
              description="Vacances d'été - 2 semaines"
              time="15/07 - 29/07"
              status="confirmed"
              badge="14 jours"
            />

            <EmergencyCard
              title="URGENCE VITALE"
              subtitle="Polytraumatisé - Déchocage"
              description="Accident de la route - Activation plan blanc - Glasgow 8"
              time="Maintenant"
              location="Déchocage"
              status="urgent"
            />
          </div>
        </section>

        {/* Boutons médicaux */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🔘 Boutons d'Action
          </h2>
          
          <div className="space-y-4 max-w-md mx-auto">
            <GuardButton
              icon={AlertTriangle}
              urgent
              loading={isLoading}
              fullWidth
              onClick={() => handleDemoAction('guard')}
            >
              🚨 Déclencher urgence vitale
            </GuardButton>

            <OnCallButton
              icon={Bell}
              fullWidth
              onClick={() => handleDemoAction('oncall')}
            >
              🔔 Activer astreinte
            </OnCallButton>

            <VacationButton
              icon={Calendar}
              fullWidth
              onClick={() => handleDemoAction('success')}
            >
              📅 Planifier intervention
            </VacationButton>

            <RestButton
              icon={Clock}
              size="sm"
              fullWidth
              onClick={() => handleDemoAction('warning')}
            >
              ✈️ Demander congé
            </RestButton>

            <div className="grid grid-cols-2 gap-3">
              <QuickActionButton
                icon={Stethoscope}
                label="Consultations"
                count={5}
                variant="vacation"
                onClick={() => handleDemoAction('success')}
              />

              <QuickActionButton
                icon={Users}
                label="Équipe"
                count={12}
                variant="rest"
                onClick={() => handleDemoAction('success')}
              />

              <QuickActionButton
                icon={Activity}
                label="Urgences"
                count={3}
                variant="guard"
                onClick={() => handleDemoAction('error')}
              />

              <QuickActionButton
                icon={MapPin}
                label="Localisation"
                variant="oncall"
                onClick={() => handleDemoAction('warning')}
              />
            </div>
          </div>
        </section>

        {/* Panel d'urgence */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🚨 Panel d'Urgence
          </h2>
          <div className="bg-white rounded-medical-lg p-4 max-w-md mx-auto">
            <EmergencyPanel
              isActive={emergencyActive}
              onActivate={() => setEmergencyActive(true)}
              onDeactivate={() => setEmergencyActive(false)}
            />
          </div>
        </section>

        {/* Tests de notifications */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🔔 Notifications Médicales
          </h2>
          
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <MedicalButton
              variant="rest"
              size="sm"
              onClick={() => notifySuccess('Succès', 'Opération réussie')}
            >
              ✅ Succès
            </MedicalButton>

            <MedicalButton
              variant="oncall"
              size="sm"
              onClick={() => notifyWarning('Attention', 'Vérification requise')}
            >
              ⚠️ Warning
            </MedicalButton>

            <MedicalButton
              variant="guard"
              size="sm"
              onClick={() => notifyError('Erreur', 'Action impossible')}
            >
              ❌ Erreur
            </MedicalButton>

            <MedicalButton
              variant="emergency"
              size="sm"
              onClick={() => notifyGuard('URGENCE', 'Intervention immédiate requise')}
            >
              🚨 Urgence
            </MedicalButton>
          </div>
        </section>

        {/* Informations responsive */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📱 Tests Responsive
          </h2>
          
          <div className="bg-white rounded-medical p-4 space-y-3 max-w-md mx-auto">
            <div className="text-sm text-gray-600">
              <strong>Taille d'écran actuelle:</strong>
            </div>
            <div className="text-xs font-mono bg-gray-100 p-2 rounded">
              <div className="block sm:hidden">📱 Mobile (&lt; 640px)</div>
              <div className="hidden sm:block md:hidden">📱 Tablet (640px - 768px)</div>
              <div className="hidden md:block lg:hidden">💻 Desktop (768px - 1024px)</div>
              <div className="hidden lg:block">🖥️ Large (≥ 1024px)</div>
            </div>
            
            <div className="text-xs text-gray-500 space-y-1">
              <div>✅ Touch targets: 44px minimum</div>
              <div>✅ Safe area insets: Actifs</div>
              <div>✅ Scroll optimization: WebKit</div>
              <div>✅ PWA ready: Service Worker</div>
              <div>✅ Design médical: Couleurs thématiques</div>
              <div>✅ Navigation: Bottom tabs mobile</div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">
            🏥 Design System Médical - Mathildanesth v2.0
          </p>
          <p className="text-xs mt-1">
            Optimisé pour les équipes médicales en garde/astreinte
          </p>
        </div>
      </div>

      {/* Conteneur de notifications */}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
        position="bottom-center"
      />
    </div>
  );
}