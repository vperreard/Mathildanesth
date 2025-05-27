'use client';

import React, { useState } from 'react';
import { MedicalCard, GuardCard, OnCallCard, VacationCard, RestCard, EmergencyCard } from '@/components/ui/MedicalCard';
import { MedicalButton, GuardButton, OnCallButton, VacationButton, RestButton, QuickActionButton } from '@/components/ui/MedicalButton';
import { MedicalNotification, useNotifications, NotificationContainer } from '@/components/ui/MedicalNotification';
import { 
  Stethoscope, 
  Calendar, 
  Clock, 
  Bell, 
  Heart, 
  Activity,
  Users,
  MapPin,
  AlertTriangle 
} from 'lucide-react';

export default function DemoMobilePage() {
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

  const handleDemoAction = async (type: string) => {
    setIsLoading(true);
    
    // Simule une action
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-safe">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Design System Médical
          </h1>
          <p className="text-gray-600">
            Démonstration mobile responsive
          </p>
        </div>

        {/* Cartes médicales */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📋 Cartes Planning
          </h2>
          
          <div className="space-y-4">
            <GuardCard
              title="Garde de nuit"
              subtitle="Service Urgences"
              description="Prise en charge des urgences et interventions critiques"
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
              onSecondaryAction={() => alert('Modifier l\'astreinte')}
              secondaryActionLabel="Modifier"
            />

            <VacationCard
              title="Bloc orthopédie"
              subtitle="Salle 3"
              description="Prothèse de hanche - Patient: Mme Dubois"
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
              title="Urgence vitale"
              subtitle="Polytraumatisé"
              description="Accident de la route - Activation plan blanc"
              time="Maintenant"
              location="Déchocage"
              status="urgent"
            />
          </div>
        </section>

        {/* Boutons médicaux */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🔘 Boutons Actions
          </h2>
          
          <div className="space-y-3">
            <GuardButton
              icon={AlertTriangle}
              urgent
              loading={isLoading}
              fullWidth
              onClick={() => handleDemoAction('guard')}
            >
              Déclencher garde d'urgence
            </GuardButton>

            <OnCallButton
              icon={Bell}
              fullWidth
              onClick={() => handleDemoAction('oncall')}
            >
              Activer astreinte
            </OnCallButton>

            <VacationButton
              icon={Calendar}
              fullWidth
              onClick={() => handleDemoAction('success')}
            >
              Planifier intervention
            </VacationButton>

            <RestButton
              icon={Clock}
              size="sm"
              fullWidth
              onClick={() => handleDemoAction('warning')}
            >
              Demander congé
            </RestButton>
          </div>
        </section>

        {/* Actions rapides */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ⚡ Actions Rapides
          </h2>
          
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
              onClick={() => alert('Voir équipe')}
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
              label="Blocs"
              variant="oncall"
              onClick={() => alert('Voir blocs')}
            />
          </div>
        </section>

        {/* Tests de notifications */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🔔 Notifications
          </h2>
          
          <div className="grid grid-cols-2 gap-2">
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

        {/* Tailles d'écran de test */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📱 Tests Responsive
          </h2>
          
          <div className="bg-white rounded-medical p-4 space-y-2">
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
              <div>• Touch targets: 44px minimum ✓</div>
              <div>• Safe area insets: Actifs ✓</div>
              <div>• Scroll optimization: WebKit ✓</div>
              <div>• PWA ready: Service Worker ✓</div>
            </div>
          </div>
        </section>
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