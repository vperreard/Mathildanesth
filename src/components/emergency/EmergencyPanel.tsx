'use client';

import React, { useState } from 'react';
import { EmergencyButton, GuardButton } from '@/components/ui/MedicalButton';
import { EmergencyCard } from '@/components/ui/MedicalCard';
import { useNotifications } from '@/components/ui/MedicalNotification';
import { 
  AlertTriangle, 
  Phone, 
  Radio, 
  MapPin, 
  Clock,
  Users,
  Activity,
  Stethoscope,
  Shield,
  Zap
} from 'lucide-react';

interface EmergencyAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  priority: 'critical' | 'high' | 'medium';
  estimated_time: string;
  team_required: string[];
  onClick: () => void;
}

interface EmergencyPanelProps {
  isActive?: boolean;
  onActivate?: () => void;
  onDeactivate?: () => void;
  className?: string;
}

export function EmergencyPanel({
  isActive = false,
  onActivate,
  onDeactivate,
  className = ''
}: EmergencyPanelProps) {
  const [activeEmergency, setActiveEmergency] = useState<string | null>(null);
  const { notifyGuard, notifyError, notifySuccess } = useNotifications();

  const emergencyActions: EmergencyAction[] = [
    {
      id: 'code-blue',
      title: 'Code Bleu - Arrêt Cardiaque',
      description: 'Réanimation cardio-pulmonaire immédiate',
      icon: Activity,
      priority: 'critical',
      estimated_time: '< 3 min',
      team_required: ['Anesthésiste', 'Cardiologue', 'Infirmier'],
      onClick: () => handleEmergencyAction('code-blue')
    },
    {
      id: 'code-red',
      title: 'Code Rouge - Hémorragie',
      description: 'Hémorragie massive, transfusion urgente',
      icon: AlertTriangle,
      priority: 'critical',
      estimated_time: '< 5 min',
      team_required: ['Chirurgien', 'Anesthésiste', 'Laboratoire'],
      onClick: () => handleEmergencyAction('code-red')
    },
    {
      id: 'emergency-intubation',
      title: 'Intubation d\'urgence',
      description: 'Détresse respiratoire aiguë',
      icon: Stethoscope,
      priority: 'high',
      estimated_time: '< 2 min',
      team_required: ['Anesthésiste', 'Infirmier'],
      onClick: () => handleEmergencyAction('emergency-intubation')
    },
    {
      id: 'trauma-alert',
      title: 'Alerte Trauma',
      description: 'Polytraumatisé grave en admission',
      icon: Shield,
      priority: 'high',
      estimated_time: '< 10 min',
      team_required: ['Équipe trauma', 'Chirurgien', 'Anesthésiste'],
      onClick: () => handleEmergencyAction('trauma-alert')
    }
  ];

  const quickContacts = [
    {
      id: 'samu',
      name: 'SAMU',
      number: '15',
      description: 'Urgences médicales',
      icon: Phone
    },
    {
      id: 'pompiers',
      name: 'Pompiers',
      number: '18',
      description: 'Secours d\'urgence',
      icon: Shield
    },
    {
      id: 'securite',
      name: 'Sécurité',
      number: '3333',
      description: 'Sécurité hôpital',
      icon: Radio
    },
    {
      id: 'cadre-garde',
      name: 'Cadre de garde',
      number: '3456',
      description: 'Responsable de garde',
      icon: Users
    }
  ];

  const handleEmergencyAction = (actionId: string) => {
    setActiveEmergency(actionId);
    const action = emergencyActions.find(a => a.id === actionId);
    
    if (action) {
      notifyGuard(
        `🚨 ${action.title}`,
        `Équipe requise: ${action.team_required.join(', ')} - ETA: ${action.estimated_time}`
      );
      
      // Simulation d'activation
      setTimeout(() => {
        notifySuccess('Équipe alertée', 'Les équipes ont été notifiées et se dirigent vers vous');
      }, 2000);
    }
  };

  const handleQuickCall = (contact: typeof quickContacts[0]) => {
    // En production, déclencher l'appel téléphonique
    if (typeof window !== 'undefined' && window.navigator) {
      window.location.href = `tel:${contact.number}`;
    }
    
    notifySuccess(
      `Appel ${contact.name}`,
      `Numérotation en cours: ${contact.number}`
    );
  };

  const toggleEmergencyMode = () => {
    if (isActive) {
      onDeactivate?.();
      notifySuccess('Mode urgence désactivé', 'Retour au mode normal');
    } else {
      onActivate?.();
      notifyGuard('MODE URGENCE ACTIVÉ', 'Toutes les équipes sont alertées');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Activation/Désactivation mode urgence */}
      <div className="text-center">
        <EmergencyButton
          size="lg"
          fullWidth
          onClick={toggleEmergencyMode}
          icon={isActive ? Zap : AlertTriangle}
        >
          {isActive ? '🔴 URGENCE ACTIVE' : '🚨 ACTIVER MODE URGENCE'}
        </EmergencyButton>
        
        {isActive && (
          <div className="mt-3 p-3 bg-medical-emergency-50 rounded-medical border border-medical-emergency-200">
            <div className="flex items-center justify-center space-x-2 text-medical-emergency-700">
              <Clock className="w-4 h-4 animate-pulse" />
              <span className="text-sm font-medium">Mode urgence actif</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions d'urgence */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          ⚡ Protocoles d'urgence
        </h3>
        
        <div className="space-y-3">
          {emergencyActions.map((action) => (
            <EmergencyCard
              key={action.id}
              title={action.title}
              subtitle={`ETA: ${action.estimated_time}`}
              description={action.description}
              location={action.team_required.join(', ')}
              status={action.priority === 'critical' ? 'urgent' : 'pending'}
              icon={action.icon}
              onClick={action.onClick}
              badge={action.priority.toUpperCase()}
              className={activeEmergency === action.id ? 'ring-2 ring-medical-emergency-500' : ''}
            />
          ))}
        </div>
      </div>

      {/* Contacts rapides */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          📞 Contacts d'urgence
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {quickContacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => handleQuickCall(contact)}
              className="
                bg-white rounded-medical-lg p-4 border border-gray-200
                hover:shadow-medical hover:border-medical-guard-300
                transition-all duration-200 touch-target
                text-left active:scale-95
              "
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-medical-guard-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <contact.icon className="w-5 h-5 text-medical-guard-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">
                    {contact.name}
                  </div>
                  <div className="text-lg font-bold text-medical-guard-600">
                    {contact.number}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {contact.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Localisation et informations */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          📍 Informations de localisation
        </h3>
        
        <div className="bg-medical-vacation-50 rounded-medical-lg p-4 border-l-4 border-l-medical-vacation-500">
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-medical-vacation-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-medical-vacation-800">
                Position actuelle
              </div>
              <div className="text-sm text-medical-vacation-700">
                Bloc C - Salle 3<br />
                Niveau 2 - Aile Est
              </div>
              <div className="text-xs text-medical-vacation-600 mt-2">
                Dernière mise à jour: il y a 2 min
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions d'urgence */}
      <div className="bg-gray-50 rounded-medical-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2 text-sm">
          📋 Rappel procédures
        </h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Toujours sécuriser la voie aérienne en priorité</li>
          <li>• Appeler l'équipe avant de commencer les manœuvres</li>
          <li>• Documenter toutes les actions entreprises</li>
          <li>• Communiquer clairement avec l'équipe</li>
        </ul>
      </div>
    </div>
  );
}

export default EmergencyPanel;