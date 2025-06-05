'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Trash2,
  Save,
  Play,
  AlertTriangle,
  CheckCircle,
  Shield,
  Clock,
  Users,
  Calendar,
  Copy,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface RuleCondition {
  id: string;
  field: string;
  operator: string;
  value: unknown;
  logic?: 'AND' | 'OR';
}

interface Rule {
  id?: string;
  name: string;
  description: string;
  category: 'scheduling' | 'safety' | 'workload' | 'custom';
  type: 'constraint' | 'recommendation';
  severity: 'error' | 'warning' | 'info';
  active: boolean;
  conditions: RuleCondition[];
  action: string;
  metadata?: unknown;
}

interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  rule: Partial<Rule>;
}

const RULE_TEMPLATES: RuleTemplate[] = [
  {
    id: 'max-consecutive-guards',
    name: 'Maximum gardes consécutives',
    description: 'Limite le nombre de gardes consécutives',
    icon: <Clock className="h-4 w-4" />,
    rule: {
      name: 'Maximum 2 gardes consécutives',
      category: 'safety',
      type: 'constraint',
      severity: 'error',
      conditions: [
        {
          id: '1',
          field: 'consecutive_guards',
          operator: 'greater_than',
          value: 2
        }
      ],
      action: 'block_assignment'
    }
  },
  {
    id: 'min-experienced-staff',
    name: 'Personnel expérimenté minimum',
    description: 'Assure la présence de personnel expérimenté',
    icon: <Users className="h-4 w-4" />,
    rule: {
      name: 'Minimum 1 MAR expérimenté par garde',
      category: 'safety',
      type: 'constraint',
      severity: 'error',
      conditions: [
        {
          id: '1',
          field: 'experienced_staff_count',
          operator: 'less_than',
          value: 1
        }
      ],
      action: 'require_experienced_staff'
    }
  },
  {
    id: 'rest-time',
    name: 'Temps de repos obligatoire',
    description: 'Impose un temps de repos minimum entre les gardes',
    icon: <Shield className="h-4 w-4" />,
    rule: {
      name: 'Repos minimum 11h entre gardes',
      category: 'safety',
      type: 'constraint',
      severity: 'error',
      conditions: [
        {
          id: '1',
          field: 'rest_hours',
          operator: 'less_than',
          value: 11
        }
      ],
      action: 'block_assignment'
    }
  }
];

const FIELD_OPTIONS = [
  { value: 'consecutive_guards', label: 'Gardes consécutives' },
  { value: 'weekly_hours', label: 'Heures hebdomadaires' },
  { value: 'rest_hours', label: 'Heures de repos' },
  { value: 'experienced_staff_count', label: 'Personnel expérimenté' },
  { value: 'staff_role', label: 'Rôle du personnel' },
  { value: 'room_type', label: 'Type de salle' },
  { value: 'day_of_week', label: 'Jour de la semaine' },
  { value: 'shift_type', label: 'Type de garde' }
];

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Égal à' },
  { value: 'not_equals', label: 'Différent de' },
  { value: 'greater_than', label: 'Supérieur à' },
  { value: 'less_than', label: 'Inférieur à' },
  { value: 'contains', label: 'Contient' },
  { value: 'in', label: 'Dans la liste' }
];

export default function RuleBuilderInterface() {
  const queryClient = useQueryClient();
  const [currentRule, setCurrentRule] = useState<Rule>({
    name: '',
    description: '',
    category: 'scheduling',
    type: 'constraint',
    severity: 'warning',
    active: true,
    conditions: [],
    action: 'notify'
  });
  const [isTestMode, setIsTestMode] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Récupération des règles existantes
  const { data: existingRules, isLoading } = useQuery({
    queryKey: ['admin-rules'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/rules');
      return response.data;
    }
  });

  // Mutation pour sauvegarder une règle
  const saveRuleMutation = useMutation({
    mutationFn: async (rule: Rule) => {
      if (rule.id) {
        return axios.put(`/api/admin/rules/${rule.id}`, rule);
      }
      return axios.post('/api/admin/rules', rule);
    },
    onSuccess: () => {
      toast.success('Règle sauvegardée avec succès');
      queryClient.invalidateQueries({ queryKey: ['admin-rules'] });
      resetRule();
    },
    onError: () => {
      toast.error('Erreur lors de la sauvegarde de la règle');
    }
  });

  // Mutation pour supprimer une règle
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      return axios.delete(`/api/admin/rules/${ruleId}`);
    },
    onSuccess: () => {
      toast.success('Règle supprimée');
      queryClient.invalidateQueries({ queryKey: ['admin-rules'] });
    }
  });

  const addCondition = () => {
    const newCondition: RuleCondition = {
      id: Date.now().toString(),
      field: 'consecutive_guards',
      operator: 'greater_than',
      value: '',
      logic: currentRule.conditions.length > 0 ? 'AND' : undefined
    };
    
    setCurrentRule(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  };

  const updateCondition = (conditionId: string, updates: Partial<RuleCondition>) => {
    setCurrentRule(prev => ({
      ...prev,
      conditions: prev.conditions.map(c =>
        c.id === conditionId ? { ...c, ...updates } : c
      )
    }));
  };

  const removeCondition = (conditionId: string) => {
    setCurrentRule(prev => ({
      ...prev,
      conditions: prev.conditions.filter(c => c.id !== conditionId)
    }));
  };

  const applyTemplate = (template: RuleTemplate) => {
    setCurrentRule(prev => ({
      ...prev,
      ...template.rule,
      conditions: template.rule.conditions || []
    }));
  };

  const testRule = async () => {
    setIsTestMode(true);
    try {
      const response = await axios.post('/api/admin/rules/test', currentRule);
      setTestResult(response.data);
    } catch (error: unknown) {
      toast.error('Erreur lors du test de la règle');
    } finally {
      setIsTestMode(false);
    }
  };

  const saveRule = () => {
    if (!currentRule.name || currentRule.conditions.length === 0) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    saveRuleMutation.mutate(currentRule);
  };

  const resetRule = () => {
    setCurrentRule({
      name: '',
      description: '',
      category: 'scheduling',
      type: 'constraint',
      severity: 'warning',
      active: true,
      conditions: [],
      action: 'notify'
    });
    setTestResult(null);
  };

  const loadRule = (rule: Rule) => {
    setCurrentRule(rule);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Panneau principal de construction */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Constructeur de Règles</CardTitle>
            <CardDescription>
              Créez et configurez des règles métier pour votre planning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la règle *</Label>
                <Input
                  id="name"
                  value={currentRule.name}
                  onChange={(e) => setCurrentRule(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Maximum 2 gardes consécutives"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select
                  value={currentRule.category}
                  onValueChange={(value: unknown) => setCurrentRule(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduling">Planning</SelectItem>
                    <SelectItem value="safety">Sécurité</SelectItem>
                    <SelectItem value="workload">Charge de travail</SelectItem>
                    <SelectItem value="custom">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={currentRule.description}
                onChange={(e) => setCurrentRule(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez l'objectif de cette règle..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={currentRule.type}
                  onValueChange={(value: unknown) => setCurrentRule(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="constraint">Contrainte</SelectItem>
                    <SelectItem value="recommendation">Recommandation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Sévérité</Label>
                <Select
                  value={currentRule.severity}
                  onValueChange={(value: unknown) => setCurrentRule(prev => ({ ...prev, severity: value }))}
                >
                  <SelectTrigger id="severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="error">Erreur</SelectItem>
                    <SelectItem value="warning">Avertissement</SelectItem>
                    <SelectItem value="info">Information</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="action">Action</Label>
                <Select
                  value={currentRule.action}
                  onValueChange={(value) => setCurrentRule(prev => ({ ...prev, action: value }))}
                >
                  <SelectTrigger id="action">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="block_assignment">Bloquer l'affectation</SelectItem>
                    <SelectItem value="notify">Notifier</SelectItem>
                    <SelectItem value="require_validation">Validation requise</SelectItem>
                    <SelectItem value="suggest_alternative">Suggérer alternative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Conditions</h3>
                <Button size="sm" onClick={addCondition}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter une condition
                </Button>
              </div>

              {currentRule.conditions.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Ajoutez au moins une condition pour définir quand cette règle s'applique
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {currentRule.conditions.map((condition, index) => (
                    <Card key={condition.id} className="p-4">
                      <div className="space-y-3">
                        {index > 0 && (
                          <Select
                            value={condition.logic}
                            onValueChange={(value: unknown) => 
                              updateCondition(condition.id, { logic: value })
                            }
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AND">ET</SelectItem>
                              <SelectItem value="OR">OU</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        
                        <div className="grid grid-cols-3 gap-2">
                          <Select
                            value={condition.field}
                            onValueChange={(value) => 
                              updateCondition(condition.id, { field: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FIELD_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={condition.operator}
                            onValueChange={(value) => 
                              updateCondition(condition.id, { operator: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {OPERATOR_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div className="flex gap-1">
                            <Input
                              value={condition.value}
                              onChange={(e) => 
                                updateCondition(condition.id, { value: e.target.value })
                              }
                              placeholder="Valeur"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeCondition(condition.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={currentRule.active}
                  onCheckedChange={(checked) => 
                    setCurrentRule(prev => ({ ...prev, active: checked }))
                  }
                />
                <Label htmlFor="active">Règle active</Label>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={resetRule}>
                  Réinitialiser
                </Button>
                <Button variant="outline" onClick={testRule} disabled={isTestMode}>
                  <Play className="h-4 w-4 mr-1" />
                  Tester
                </Button>
                <Button onClick={saveRule}>
                  <Save className="h-4 w-4 mr-1" />
                  Sauvegarder
                </Button>
              </div>
            </div>

            {/* Résultats de test */}
            {testResult && (
              <Alert className={testResult.valid ? 'border-green-500' : 'border-red-500'}>
                <AlertDescription>
                  {testResult.valid ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      La règle est valide et prête à être appliquée
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      {testResult.error || 'La règle contient des erreurs'}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Panneau latéral */}
      <div className="space-y-6">
        {/* Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Templates de règles</CardTitle>
            <CardDescription>
              Utilisez un template pour démarrer rapidement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {RULE_TEMPLATES.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => applyTemplate(template)}
              >
                {template.icon}
                <span className="ml-2 text-left">
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs text-gray-600">{template.description}</div>
                </span>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Règles existantes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Règles existantes</CardTitle>
            <CardDescription>
              {existingRules?.length || 0} règles configurées
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="text-center py-4">Chargement...</div>
            ) : existingRules?.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Aucune règle configurée
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {existingRules?.map((rule: Rule) => (
                  <div
                    key={rule.id}
                    className="p-3 border rounded-lg space-y-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => loadRule(rule)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{rule.name}</h4>
                        {rule.active ? (
                          <Eye className="h-3 w-3 text-green-500" />
                        ) : (
                          <EyeOff className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {rule.category}
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            rule.id && deleteRuleMutation.mutate(rule.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">{rule.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}