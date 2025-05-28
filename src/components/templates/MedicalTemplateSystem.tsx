'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Heart, 
  Baby, 
  AlertTriangle, 
  Sun, 
  Moon,
  Clock,
  Users,
  CheckCircle,
  Play,
  Eye
} from 'lucide-react';

// Types pour les templates médicaux
export interface MedicalTemplate {
  id: string;
  name: string;
  specialty: 'cardio' | 'pediatrie' | 'urgences' | 'ambulatoire' | 'gardes';
  description: string;
  icon: React.ComponentType<any>;
  rules: TemplateRule[];
  ratios: StaffRatio[];
  coverage: TemplateCoverage;
  estimatedTime: string;
}

export interface TemplateRule {
  id: string;
  type: 'mandatory' | 'preferred' | 'optional';
  description: string;
  icon: React.ComponentType<any>;
}

export interface StaffRatio {
  role: string;
  minimum: number;
  maximum: number;
  optimal: number;
}

export interface TemplateCoverage {
  hours: string;
  days: string[];
  rotationType: 'continuous' | 'shifts' | 'on-call';
}

// Templates pré-configurés par spécialité
const medicalTemplates: MedicalTemplate[] = [
  {
    id: 'cardio-template',
    name: 'Chirurgie Cardiaque',
    specialty: 'cardio',
    description: 'Planning optimisé pour bloc cardio avec ratio 2:1 MAR/IADE et supervision obligatoire',
    icon: Heart,
    rules: [
      {
        id: 'cardio-supervision',
        type: 'mandatory',
        description: 'Supervision MAR expérimenté obligatoire',
        icon: Users
      },
      {
        id: 'cardio-ratio',
        type: 'mandatory', 
        description: 'Ratio 2 MARs pour 1 IADE minimum',
        icon: Users
      },
      {
        id: 'cardio-repos',
        type: 'mandatory',
        description: 'Repos de 12h minimum entre interventions longues',
        icon: Clock
      }
    ],
    ratios: [
      { role: 'MAR', minimum: 2, maximum: 4, optimal: 3 },
      { role: 'IADE', minimum: 1, maximum: 2, optimal: 1 },
      { role: 'Chirurgien', minimum: 1, maximum: 2, optimal: 1 }
    ],
    coverage: {
      hours: '7h00-19h00',
      days: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'],
      rotationType: 'shifts'
    },
    estimatedTime: '45 min'
  },
  {
    id: 'pediatrie-template',
    name: 'Pédiatrie',
    specialty: 'pediatrie',
    description: 'Planning pédiatrie avec minimum 2 MARs niveau ≥3 et formation continue',
    icon: Baby,
    rules: [
      {
        id: 'pediatrie-competence',
        type: 'mandatory',
        description: 'Minimum 2 MARs niveau pédiatrie ≥3 par vacation',
        icon: Users
      },
      {
        id: 'pediatrie-formation',
        type: 'preferred',
        description: 'Formation continue pédiatrie 20h/an',
        icon: CheckCircle
      },
      {
        id: 'pediatrie-urgence',
        type: 'mandatory',
        description: 'Référent pédiatrie disponible 24/7',
        icon: AlertTriangle
      }
    ],
    ratios: [
      { role: 'MAR Pédiatrie', minimum: 2, maximum: 3, optimal: 2 },
      { role: 'IADE', minimum: 1, maximum: 2, optimal: 1 },
      { role: 'Pédiatre', minimum: 1, maximum: 1, optimal: 1 }
    ],
    coverage: {
      hours: '8h00-18h00 + astreinte',
      days: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'],
      rotationType: 'on-call'
    },
    estimatedTime: '30 min'
  },
  {
    id: 'urgences-template',
    name: 'Urgences',
    specialty: 'urgences',
    description: 'Permanence 24/7 avec mode dégradé et protocoles d\'urgence',
    icon: AlertTriangle,
    rules: [
      {
        id: 'urgences-permanence',
        type: 'mandatory',
        description: 'Permanence médicale 24h/24, 7j/7',
        icon: Clock
      },
      {
        id: 'urgences-backup',
        type: 'mandatory',
        description: 'Équipe de rappel disponible en <30min',
        icon: AlertTriangle
      },
      {
        id: 'urgences-degraded',
        type: 'preferred',
        description: 'Mode dégradé avec effectifs réduits autorisé',
        icon: Users
      }
    ],
    ratios: [
      { role: 'MAR Urgences', minimum: 3, maximum: 6, optimal: 4 },
      { role: 'IADE', minimum: 2, maximum: 4, optimal: 3 },
      { role: 'Médecin Urgences', minimum: 2, maximum: 3, optimal: 2 }
    ],
    coverage: {
      hours: '24h/24',
      days: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
      rotationType: 'continuous'
    },
    estimatedTime: '60 min'
  },
  {
    id: 'ambulatoire-template',
    name: 'Ambulatoire',
    specialty: 'ambulatoire',
    description: 'Planning jour optimisé pour flux ambulatoire rapide',
    icon: Sun,
    rules: [
      {
        id: 'ambulatoire-flux',
        type: 'preferred',
        description: 'Optimisation flux avec rotation rapide',
        icon: Clock
      },
      {
        id: 'ambulatoire-polyvalence',
        type: 'preferred',
        description: 'Personnel polyvalent multi-spécialités',
        icon: Users
      }
    ],
    ratios: [
      { role: 'MAR', minimum: 2, maximum: 4, optimal: 3 },
      { role: 'IADE', minimum: 1, maximum: 2, optimal: 2 },
      { role: 'Chirurgien', minimum: 2, maximum: 4, optimal: 3 }
    ],
    coverage: {
      hours: '7h30-17h30',
      days: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'],
      rotationType: 'shifts'
    },
    estimatedTime: '25 min'
  },
  {
    id: 'gardes-template',
    name: 'Gardes & Astreintes',
    specialty: 'gardes',
    description: 'Planning gardes weekends + nuits avec équité rotation',
    icon: Moon,
    rules: [
      {
        id: 'gardes-equity',
        type: 'mandatory',
        description: 'Équité rotation weekends et jours fériés',
        icon: Users
      },
      {
        id: 'gardes-repos',
        type: 'mandatory',
        description: 'Repos compensateur après garde de nuit',
        icon: Clock
      },
      {
        id: 'gardes-max',
        type: 'mandatory',
        description: 'Maximum 2 gardes consécutives',
        icon: AlertTriangle
      }
    ],
    ratios: [
      { role: 'MAR Garde', minimum: 1, maximum: 2, optimal: 1 },
      { role: 'IADE Garde', minimum: 1, maximum: 1, optimal: 1 },
      { role: 'Médecin Garde', minimum: 1, maximum: 1, optimal: 1 }
    ],
    coverage: {
      hours: '19h00-8h00 + weekends',
      days: ['samedi', 'dimanche', 'jours fériés'],
      rotationType: 'on-call'
    },
    estimatedTime: '40 min'
  }
];

interface MedicalTemplateSystemProps {
  onTemplateSelect?: (template: MedicalTemplate) => void;
  onTemplateApply?: (template: MedicalTemplate, period: DateRange) => void;
}

interface DateRange {
  start: Date;
  end: Date;
}

export function MedicalTemplateSystem({ onTemplateSelect, onTemplateApply }: MedicalTemplateSystemProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<MedicalTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(),
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // +1 semaine
  });

  const handleTemplateSelect = (template: MedicalTemplate) => {
    setSelectedTemplate(template);
    onTemplateSelect?.(template);
  };

  const handlePreview = () => {
    if (selectedTemplate) {
      setPreviewMode(true);
    }
  };

  const handleApply = () => {
    if (selectedTemplate) {
      onTemplateApply?.(selectedTemplate, dateRange);
    }
  };

  const getSpecialtyColor = (specialty: string) => {
    switch (specialty) {
      case 'cardio': return 'border-red-200 bg-red-50 hover:bg-red-100';
      case 'pediatrie': return 'border-blue-200 bg-blue-50 hover:bg-blue-100';
      case 'urgences': return 'border-orange-200 bg-orange-50 hover:bg-orange-100';
      case 'ambulatoire': return 'border-green-200 bg-green-50 hover:bg-green-100';
      case 'gardes': return 'border-purple-200 bg-purple-50 hover:bg-purple-100';
      default: return 'border-gray-200 bg-gray-50 hover:bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Templates Médicaux Spécialisés</h2>
          <p className="text-sm text-gray-600">Modèles pré-configurés par spécialité médicale</p>
        </div>
        {selectedTemplate && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreview}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Eye className="h-4 w-4" />
              Aperçu
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-medical-guard-600 rounded-md hover:bg-medical-guard-700"
            >
              <Play className="h-4 w-4" />
              Appliquer
            </button>
          </div>
        )}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {medicalTemplates.map((template) => {
          const Icon = template.icon;
          const isSelected = selectedTemplate?.id === template.id;
          
          return (
            <div
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className={cn(
                'relative p-4 border-2 rounded-lg cursor-pointer transition-all',
                getSpecialtyColor(template.specialty),
                isSelected ? 'ring-2 ring-medical-guard-500 border-medical-guard-300' : '',
                'hover:shadow-md'
              )}
            >
              {/* Template Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  template.specialty === 'cardio' && 'bg-red-100 text-red-600',
                  template.specialty === 'pediatrie' && 'bg-blue-100 text-blue-600',
                  template.specialty === 'urgences' && 'bg-orange-100 text-orange-600',
                  template.specialty === 'ambulatoire' && 'bg-green-100 text-green-600',
                  template.specialty === 'gardes' && 'bg-purple-100 text-purple-600'
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {template.name}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {template.description}
                  </p>
                </div>
              </div>

              {/* Template Stats */}
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Couverture</span>
                  <span className="font-medium">{template.coverage.hours}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Équipe optimale</span>
                  <span className="font-medium">
                    {template.ratios.reduce((sum, ratio) => sum + ratio.optimal, 0)} personnes
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Temps config</span>
                  <span className="font-medium">{template.estimatedTime}</span>
                </div>
              </div>

              {/* Rules Preview */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>{template.rules.filter(r => r.type === 'mandatory').length} règles</span>
                  <span>•</span>
                  <span>{template.ratios.length} rôles</span>
                </div>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="h-3 w-3 bg-medical-guard-500 rounded-full"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Template Details */}
      {selectedTemplate && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <selectedTemplate.icon className="h-6 w-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedTemplate.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedTemplate.description}
              </p>
            </div>
          </div>

          {/* Rules */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Règles de Planification</h4>
            <div className="space-y-2">
              {selectedTemplate.rules.map((rule) => {
                const RuleIcon = rule.icon;
                return (
                  <div key={rule.id} className="flex items-center gap-3 text-sm">
                    <div className={cn(
                      'p-1 rounded',
                      rule.type === 'mandatory' && 'bg-red-100 text-red-600',
                      rule.type === 'preferred' && 'bg-blue-100 text-blue-600',
                      rule.type === 'optional' && 'bg-gray-100 text-gray-600'
                    )}>
                      <RuleIcon className="h-3 w-3" />
                    </div>
                    <span className="text-gray-700">{rule.description}</span>
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-full',
                      rule.type === 'mandatory' && 'bg-red-100 text-red-700',
                      rule.type === 'preferred' && 'bg-blue-100 text-blue-700',
                      rule.type === 'optional' && 'bg-gray-100 text-gray-700'
                    )}>
                      {rule.type === 'mandatory' ? 'Obligatoire' : 
                       rule.type === 'preferred' ? 'Recommandé' : 'Optionnel'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Staff Ratios */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Ratios d'Équipe</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedTemplate.ratios.map((ratio, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-900">{ratio.role}</div>
                  <div className="mt-1 text-xs text-gray-600">
                    Min: {ratio.minimum} • Optimal: {ratio.optimal} • Max: {ratio.maximum}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}