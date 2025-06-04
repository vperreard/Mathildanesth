'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  Users,
  Shield,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Heart,
  Baby,
  Zap
} from 'lucide-react';
import { format, addWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-toastify';
import axios from 'axios';

interface PlanningTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  constraints: string[];
  recommended: boolean;
}

interface Constraint {
  id: string;
  name: string;
  description: string;
  type: 'mandatory' | 'optional';
  enabled: boolean;
}

interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  score: number;
}

const TEMPLATES: PlanningTemplate[] = [
  {
    id: 'cardio',
    name: 'Cardiologie',
    icon: <Heart className="h-6 w-6 text-red-500" />,
    description: 'Planning optimisé pour les services de cardiologie',
    constraints: ['Garde 24h', 'Astreinte weekend', 'Rotation équipes'],
    recommended: true
  },
  {
    id: 'pediatrie',
    name: 'Pédiatrie',
    icon: <Baby className="h-6 w-6 text-pink-500" />,
    description: 'Planning adapté aux spécificités pédiatriques',
    constraints: ['Gardes courtes', 'Doublons obligatoires', 'Rotation douce'],
    recommended: false
  },
  {
    id: 'urgences',
    name: 'Urgences',
    icon: <Zap className="h-6 w-6 text-yellow-500" />,
    description: 'Planning haute intensité pour services d\'urgence',
    constraints: ['3x8h', 'Chevauchements', 'Pool de remplacement'],
    recommended: false
  }
];

const DEFAULT_CONSTRAINTS: Constraint[] = [
  {
    id: 'max-consecutive',
    name: 'Maximum 2 gardes consécutives',
    description: 'Limite le nombre de gardes consécutives pour éviter la fatigue',
    type: 'mandatory',
    enabled: true
  },
  {
    id: 'min-experienced',
    name: 'Minimum 1 MAR expérimenté par garde',
    description: 'Assure la présence d\'au moins un anesthésiste senior',
    type: 'mandatory',
    enabled: true
  },
  {
    id: 'weekend-rotation',
    name: 'Rotation équitable des weekends',
    description: 'Distribue équitablement les gardes de weekend',
    type: 'optional',
    enabled: true
  },
  {
    id: 'preference-respect',
    name: 'Respecter les préférences individuelles',
    description: 'Prend en compte les préférences déclarées par le personnel',
    type: 'optional',
    enabled: false
  }
];

export default function PlanningGeneratorWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfWeek(new Date(), { locale: fr }),
    to: endOfWeek(addWeeks(new Date(), 4), { locale: fr })
  });
  const [constraints, setConstraints] = useState<Constraint[]>(DEFAULT_CONSTRAINTS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  const steps = [
    { title: 'Spécialité', icon: <Users className="h-5 w-5" /> },
    { title: 'Période', icon: <CalendarIcon className="h-5 w-5" /> },
    { title: 'Contraintes', icon: <Shield className="h-5 w-5" /> },
    { title: 'Génération', icon: <Sparkles className="h-5 w-5" /> }
  ];

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, steps.length]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleConstraintToggle = (constraintId: string) => {
    setConstraints(prev => 
      prev.map(c => 
        c.id === constraintId ? { ...c, enabled: !c.enabled } : c
      )
    );
  };

  const validatePlanning = async () => {
    try {
      const response = await axios.post('/api/admin/planning/validate', {
        template: selectedTemplate,
        dateRange,
        constraints: constraints.filter(c => c.enabled)
      });
      
      setValidationResult(response.data);
      return response.data;
    } catch (error) {
      toast.error('Erreur lors de la validation');
      return null;
    }
  };

  const generatePlanning = async () => {
    setIsGenerating(true);
    
    try {
      // Validation d'abord
      const validation = await validatePlanning();
      if (!validation || !validation.valid) {
        setIsGenerating(false);
        return;
      }

      // Génération du planning
      const response = await axios.post('/api/admin/planning/generate', {
        template: selectedTemplate,
        dateRange,
        constraints: constraints.filter(c => c.enabled),
        autoAssign: true
      });

      setPreviewData(response.data);
      toast.success('Planning généré avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la génération du planning');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Sélection de la spécialité
        return (
          <div className="space-y-4">
            <RadioGroup value={selectedTemplate} onValueChange={setSelectedTemplate}>
              {TEMPLATES.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <CardHeader 
                    className="cursor-pointer"
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value={template.id} id={template.id} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {template.icon}
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            {template.recommended && (
                              <Badge variant="secondary" className="ml-2">
                                Recommandé
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="mt-1">
                            {template.description}
                          </CardDescription>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.constraints.map((constraint) => (
                              <Badge key={constraint} variant="outline" className="text-xs">
                                {constraint}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </RadioGroup>
          </div>
        );

      case 1: // Sélection de la période
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Date de début</Label>
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                  locale={fr}
                  className="rounded-md border"
                />
              </div>
              <div>
                <Label>Date de fin</Label>
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                  locale={fr}
                  className="rounded-md border"
                  disabled={(date) => date < dateRange.from}
                />
              </div>
            </div>
            
            <Alert>
              <AlertDescription>
                Période sélectionnée : {format(dateRange.from, 'dd MMMM yyyy', { locale: fr })} 
                {' '}au {format(dateRange.to, 'dd MMMM yyyy', { locale: fr })}
              </AlertDescription>
            </Alert>
          </div>
        );

      case 2: // Configuration des contraintes
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Configurez les règles qui seront appliquées lors de la génération du planning
            </p>
            
            <div className="space-y-3">
              {constraints.map((constraint) => (
                <Card key={constraint.id} className="p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id={constraint.id}
                      checked={constraint.enabled}
                      onCheckedChange={() => handleConstraintToggle(constraint.id)}
                      disabled={constraint.type === 'mandatory'}
                    />
                    <div className="flex-1 space-y-1">
                      <Label 
                        htmlFor={constraint.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {constraint.name}
                        {constraint.type === 'mandatory' && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Obligatoire
                          </Badge>
                        )}
                      </Label>
                      <p className="text-xs text-gray-600">{constraint.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3: // Génération et preview
        return (
          <div className="space-y-4">
            {!previewData ? (
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold mb-2">
                  Prêt à générer votre planning
                </h3>
                <p className="text-gray-600 mb-6">
                  Template : {TEMPLATES.find(t => t.id === selectedTemplate)?.name}
                  <br />
                  Période : {format(dateRange.from, 'dd/MM', { locale: fr })} - 
                  {format(dateRange.to, 'dd/MM/yyyy', { locale: fr })}
                </p>
                
                {validationResult && (
                  <div className="mb-6 space-y-2">
                    {validationResult.errors.map((error, idx) => (
                      <Alert key={idx} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ))}
                    {validationResult.warnings.map((warning, idx) => (
                      <Alert key={idx}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{warning}</AlertDescription>
                      </Alert>
                    ))}
                    {validationResult.valid && (
                      <Alert className="border-green-500">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertDescription>
                          Validation réussie - Score de qualité : {validationResult.score}%
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
                
                <Button
                  size="lg"
                  onClick={generatePlanning}
                  disabled={isGenerating}
                  className="w-full max-w-md"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Générer le planning
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert className="border-green-500">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    Planning généré avec succès ! Vous pouvez maintenant le visualiser et l'ajuster.
                  </AlertDescription>
                </Alert>
                
                <div className="flex gap-2">
                  <Button onClick={() => window.open('/planning/preview', '_blank')}>
                    Visualiser le planning
                  </Button>
                  <Button variant="outline" onClick={() => setPreviewData(null)}>
                    Générer un nouveau planning
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Assistant de Création de Planning</CardTitle>
        <CardDescription>
          Générez un planning optimisé en quelques étapes
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between mb-1">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 text-sm ${
                  index <= currentStep ? 'text-primary' : 'text-gray-400'
                }`}
              >
                {step.icon}
                <span className="hidden sm:inline">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={((currentStep + 1) / steps.length) * 100} />
        </div>

        {/* Step content */}
        <div className="min-h-[400px]">
          {renderStep()}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Précédent
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={
                (currentStep === 0 && !selectedTemplate) ||
                (currentStep === 1 && (!dateRange.from || !dateRange.to))
              }
            >
              Suivant
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}