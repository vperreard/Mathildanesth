'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  X,
  Play,
  Eye,
  Settings
} from 'lucide-react';
import { MedicalTemplate } from './MedicalTemplateSystem';

interface TemplateApplicationModalProps {
  template: MedicalTemplate;
  isOpen: boolean;
  onClose: () => void;
  onApply: (config: ApplicationConfig) => void;
}

export interface ApplicationConfig {
  templateId: string;
  period: {
    start: Date;
    end: Date;
    type: 'week' | 'month' | 'custom';
  };
  site: string;
  overrides: TemplateOverride[];
  notifications: boolean;
  dryRun: boolean;
}

interface TemplateOverride {
  ruleId: string;
  action: 'disable' | 'modify';
  value?: unknown;
  reason: string;
}

export function TemplateApplicationModal({ 
  template, 
  isOpen, 
  onClose, 
  onApply 
}: TemplateApplicationModalProps) {
  const [step, setStep] = useState<'period' | 'config' | 'preview' | 'apply'>('period');
  const [config, setConfig] = useState<ApplicationConfig>({
    templateId: template.id,
    period: {
      start: new Date(),
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      type: 'week'
    },
    site: '',
    overrides: [],
    notifications: true,
    dryRun: true
  });
  const [conflicts, setConflicts] = useState<PlanningConflict[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  interface PlanningConflict {
    type: 'staff_shortage' | 'skill_mismatch' | 'schedule_conflict' | 'rule_violation';
    severity: 'high' | 'medium' | 'low';
    description: string;
    affectedPeriod: string;
    suggestions: string[];
  }

  const handleNext = () => {
    switch (step) {
      case 'period': 
        setStep('config');
        break;
      case 'config': 
        analyzeConflicts();
        setStep('preview');
        break;
      case 'preview': 
        setStep('apply');
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'config': setStep('period'); break;
      case 'preview': setStep('config'); break;
      case 'apply': setStep('preview'); break;
    }
  };

  const analyzeConflicts = async () => {
    setIsAnalyzing(true);
    
    // Simulation d'analyse des conflits
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockConflicts: PlanningConflict[] = [
      {
        type: 'staff_shortage',
        severity: 'medium',
        description: 'Manque 1 MAR expérimenté mardi 15h-19h',
        affectedPeriod: 'Mardi 15h-19h',
        suggestions: [
          'Prolonger service MAR du matin',
          'Rappeler MAR disponible',
          'Reporter intervention non-urgente'
        ]
      },
      {
        type: 'skill_mismatch',
        severity: 'low',
        description: 'IADE sans spécialisation cardio affecté',
        affectedPeriod: 'Mercredi 8h-12h',
        suggestions: [
          'Échanger avec IADE qualifié',
          'Supervision renforcée',
          'Formation express'
        ]
      }
    ];
    
    setConflicts(mockConflicts);
    setIsAnalyzing(false);
  };

  const handleApply = () => {
    onApply(config);
    onClose();
  };

  if (!isOpen) return null;

  const getStepIcon = (stepName: string) => {
    switch (stepName) {
      case 'period': return Calendar;
      case 'config': return Settings;
      case 'preview': return Eye;
      case 'apply': return Play;
      default: return Calendar;
    }
  };

  const steps = [
    { id: 'period', name: 'Période', icon: Calendar },
    { id: 'config', name: 'Configuration', icon: Settings },
    { id: 'preview', name: 'Aperçu', icon: Eye },
    { id: 'apply', name: 'Application', icon: Play }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-medical-guard-100 rounded-lg">
                <template.icon className="h-5 w-5 text-medical-guard-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Appliquer Template: {template.name}
                </h2>
                <p className="text-sm text-gray-600">
                  Configuration et aperçu avant application
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Steps Progress */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {steps.map((stepItem, index) => {
                const StepIcon = stepItem.icon;
                const isActive = step === stepItem.id;
                const isCompleted = steps.findIndex(s => s.id === step) > index;
                
                return (
                  <div key={stepItem.id} className="flex items-center">
                    <div className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                      isActive && 'bg-medical-guard-100 text-medical-guard-700',
                      isCompleted && 'bg-green-100 text-green-700',
                      !isActive && !isCompleted && 'text-gray-500'
                    )}>
                      <StepIcon className="h-4 w-4" />
                      <span>{stepItem.name}</span>
                      {isCompleted && <CheckCircle className="h-4 w-4" />}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={cn(
                        'w-8 h-0.5 mx-2',
                        isCompleted ? 'bg-green-300' : 'bg-gray-200'
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Étape 1: Sélection Période */}
            {step === 'period' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Sélectionner la Période d'Application
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {[
                      { type: 'week', label: 'Cette Semaine', duration: '7 jours' },
                      { type: 'month', label: 'Ce Mois', duration: '30 jours' },
                      { type: 'custom', label: 'Personnalisé', duration: 'À définir' }
                    ].map((option) => (
                      <button
                        key={option.type}
                        onClick={() => setConfig(prev => ({ 
                          ...prev, 
                          period: { ...prev.period, type: option.type as any } 
                        }))}
                        className={cn(
                          'p-4 border-2 rounded-lg text-left transition-all',
                          config.period.type === option.type
                            ? 'border-medical-guard-300 bg-medical-guard-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.duration}</div>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de début
                      </label>
                      <input
                        type="date"
                        value={config.period.start.toISOString().split('T')[0]}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          period: { ...prev.period, start: new Date(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-medical-guard-500 focus:border-medical-guard-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de fin
                      </label>
                      <input
                        type="date"
                        value={config.period.end.toISOString().split('T')[0]}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          period: { ...prev.period, end: new Date(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-medical-guard-500 focus:border-medical-guard-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site d'application
                  </label>
                  <select
                    value={config.site}
                    onChange={(e) => setConfig(prev => ({ ...prev, site: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-medical-guard-500 focus:border-medical-guard-500"
                  >
                    <option value="">Sélectionner un site</option>
                    <option value="hopital-central">Hôpital Central</option>
                    <option value="clinique-nord">Clinique Nord</option>
                    <option value="centre-cardiac">Centre Cardiaque</option>
                  </select>
                </div>
              </div>
            )}

            {/* Étape 2: Configuration */}
            {step === 'config' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Configuration du Template
                </h3>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Règles du Template</h4>
                  <div className="space-y-3">
                    {template.rules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <rule.icon className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-700">{rule.description}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-xs px-2 py-1 rounded-full',
                            rule.type === 'mandatory' && 'bg-red-100 text-red-700'
                          )}>
                            {rule.type === 'mandatory' ? 'Obligatoire' : 'Optionnel'}
                          </span>
                          {rule.type !== 'mandatory' && (
                            <button className="text-xs text-gray-500 hover:text-gray-700">
                              Modifier
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="notifications"
                      checked={config.notifications}
                      onChange={(e) => setConfig(prev => ({ ...prev, notifications: e.target.checked }))}
                      className="rounded border-gray-300 text-medical-guard-600 focus:ring-medical-guard-500"
                    />
                    <label htmlFor="notifications" className="text-sm text-gray-700">
                      Envoyer notifications aux équipes concernées
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="dryRun"
                      checked={config.dryRun}
                      onChange={(e) => setConfig(prev => ({ ...prev, dryRun: e.target.checked }))}
                      className="rounded border-gray-300 text-medical-guard-600 focus:ring-medical-guard-500"
                    />
                    <label htmlFor="dryRun" className="text-sm text-gray-700">
                      Mode test (aperçu sans modification)
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Étape 3: Aperçu */}
            {step === 'preview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Aperçu et Analyse des Conflits
                </h3>

                {isAnalyzing ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-guard-600 mx-auto mb-4"></div>
                      <p className="text-sm text-gray-600">Analyse en cours...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {conflicts.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          <h4 className="font-medium text-yellow-800">
                            {conflicts.length} conflit(s) détecté(s)
                          </h4>
                        </div>
                        <div className="space-y-3">
                          {conflicts.map((conflict, index) => (
                            <div key={index} className="bg-white p-3 rounded border">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {conflict.description}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {conflict.affectedPeriod}
                                  </p>
                                </div>
                                <span className={cn(
                                  'text-xs px-2 py-1 rounded-full',
                                  conflict.severity === 'high' && 'bg-red-100 text-red-700',
                                  conflict.severity === 'medium' && 'bg-yellow-100 text-yellow-700',
                                  conflict.severity === 'low' && 'bg-blue-100 text-blue-700'
                                )}>
                                  {conflict.severity === 'high' ? 'Critique' :
                                   conflict.severity === 'medium' ? 'Moyen' : 'Faible'}
                                </span>
                              </div>
                              {conflict.suggestions.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-600 mb-1">Suggestions:</p>
                                  <ul className="text-xs text-gray-600 list-disc list-inside">
                                    {conflict.suggestions.map((suggestion, i) => (
                                      <li key={i}>{suggestion}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h4 className="font-medium text-green-800">Planning Compatible</h4>
                      </div>
                      <p className="text-sm text-green-700">
                        Le template peut être appliqué avec {conflicts.length} ajustement(s) mineur(s).
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Étape 4: Application */}
            {step === 'apply' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Prêt pour l'Application
                </h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Résumé de l'Application</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• Template: {template.name}</p>
                    <p>• Période: {config.period.start.toLocaleDateString()} - {config.period.end.toLocaleDateString()}</p>
                    <p>• Site: {config.site}</p>
                    <p>• Mode: {config.dryRun ? 'Test (aperçu)' : 'Application réelle'}</p>
                    <p>• Notifications: {config.notifications ? 'Activées' : 'Désactivées'}</p>
                  </div>
                </div>

                {!config.dryRun && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        <strong>Attention:</strong> Cette action modifiera le planning existant.
                        Assurez-vous que tous les conflits ont été résolus.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <button
              onClick={step === 'period' ? onClose : handleBack}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {step === 'period' ? 'Annuler' : 'Précédent'}
            </button>
            
            <button
              onClick={step === 'apply' ? handleApply : handleNext}
              disabled={step === 'period' && !config.site}
              className={cn(
                'px-4 py-2 text-sm font-medium text-white rounded-md',
                step === 'apply' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-medical-guard-600 hover:bg-medical-guard-700',
                step === 'period' && !config.site && 'opacity-50 cursor-not-allowed'
              )}
            >
              {step === 'apply' ? 'Appliquer Template' : 'Suivant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}