'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Copy, 
  AlertCircle,
  Settings,
  Bell,
  Ban,
  Check,
  Edit,
  MessageSquare
} from 'lucide-react';
import { RuleAction, ActionType } from '../../../types/rule';
import { RuleType } from '../../types/ruleV2.types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface ActionBuilderProps {
  actions: RuleAction[];
  onAddAction: (action: RuleAction) => void;
  onUpdateAction: (index: number, action: RuleAction) => void;
  onRemoveAction: (index: number) => void;
  ruleType?: RuleType;
  errors?: Record<string, string>;
}

const ACTION_TYPES: Record<ActionType, { label: string; icon: React.ReactNode; color: string }> = {
  PREVENT: { label: 'Empêcher', icon: <Ban className="w-4 h-4" />, color: 'destructive' },
  ALLOW: { label: 'Autoriser', icon: <Check className="w-4 h-4" />, color: 'success' },
  NOTIFY: { label: 'Notifier', icon: <Bell className="w-4 h-4" />, color: 'default' },
  MODIFY: { label: 'Modifier', icon: <Edit className="w-4 h-4" />, color: 'default' },
  LOG: { label: 'Logger', icon: <MessageSquare className="w-4 h-4" />, color: 'secondary' },
  SUGGEST: { label: 'Suggérer', icon: <MessageSquare className="w-4 h-4" />, color: 'secondary' },
  ESCALATE: { label: 'Escalader', icon: <AlertCircle className="w-4 h-4" />, color: 'warning' },
  CUSTOM: { label: 'Personnalisé', icon: <Settings className="w-4 h-4" />, color: 'default' }
};

const TARGET_OPTIONS = [
  { value: 'attribution', label: 'Affectation' },
  { value: 'leave', label: 'Congé' },
  { value: 'planning', label: 'Planning' },
  { value: 'user', label: 'Utilisateur' },
  { value: 'notification', label: 'Notification' },
  { value: 'workflow', label: 'Workflow' },
  { value: 'guards.count', label: 'Nombre de gardes' },
  { value: 'hours.worked', label: 'Heures travaillées' },
  { value: 'rest.period', label: 'Période de repos' }
];

const NOTIFICATION_TARGETS = [
  { value: 'user', label: 'Utilisateur concerné' },
  { value: 'manager', label: 'Responsable' },
  { value: 'admin', label: 'Administrateur' },
  { value: 'team', label: 'Équipe' },
  { value: 'custom', label: 'Personnalisé' }
];

export const ActionBuilder: React.FC<ActionBuilderProps> = ({
  actions,
  onAddAction,
  onUpdateAction,
  onRemoveAction,
  ruleType,
  errors = {}
}) => {
  const [expandedActions, setExpandedActions] = useState<number[]>([]);

  const handleAddAction = () => {
    const newAction: RuleAction = {
      type: 'NOTIFY',
      target: '',
      value: '',
      message: ''
    };
    onAddAction(newAction);
    setExpandedActions([...expandedActions, actions.length]);
  };

  const toggleExpanded = (index: number) => {
    setExpandedActions(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const renderActionConfig = (action: RuleAction, index: number) => {
    switch (action.type) {
      case 'PREVENT':
      case 'ALLOW':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Cible de l'action</label>
              <Select
                value={action.target}
                onValueChange={(value) => onUpdateAction(index, {
                  ...action,
                  target: value
                })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner une cible" />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                className="mt-1"
                placeholder="Message à afficher à l'utilisateur"
                value={action.message || ''}
                onChange={(e) => onUpdateAction(index, {
                  ...action,
                  message: e.target.value
                })}
                rows={2}
              />
            </div>
          </div>
        );

      case 'NOTIFY':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Destinataire</label>
              <Select
                value={action.target}
                onValueChange={(value) => onUpdateAction(index, {
                  ...action,
                  target: value
                })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner le destinataire" />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_TARGETS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {action.target === 'custom' && (
              <div>
                <label className="text-sm font-medium">Email/ID personnalisé</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  placeholder="email@example.com ou user-id"
                  value={action.value || ''}
                  onChange={(e) => onUpdateAction(index, {
                    ...action,
                    value: e.target.value
                  })}
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Message de notification</label>
              <Textarea
                className="mt-1"
                placeholder="Contenu de la notification"
                value={action.message || ''}
                onChange={(e) => onUpdateAction(index, {
                  ...action,
                  message: e.target.value
                })}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Priorité</label>
              <Select
                value={action.metadata?.priority || 'medium'}
                onValueChange={(value) => onUpdateAction(index, {
                  ...action,
                  metadata: { ...action.metadata, priority: value }
                })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'MODIFY':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Champ à modifier</label>
              <Select
                value={action.target}
                onValueChange={(value) => onUpdateAction(index, {
                  ...action,
                  target: value
                })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner le champ" />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Nouvelle valeur</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="Valeur"
                value={action.value || ''}
                onChange={(e) => onUpdateAction(index, {
                  ...action,
                  value: e.target.value
                })}
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={action.metadata?.relative || false}
                  onChange={(e) => onUpdateAction(index, {
                    ...action,
                    metadata: { ...action.metadata, relative: e.target.checked }
                  })}
                />
                <span className="text-sm">Valeur relative (ex: +2, -1)</span>
              </label>
            </div>
          </div>
        );

      case 'SUGGEST':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Type de suggestion</label>
              <Select
                value={action.target || 'alternative'}
                onValueChange={(value) => onUpdateAction(index, {
                  ...action,
                  target: value
                })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alternative">Alternative</SelectItem>
                  <SelectItem value="optimization">Optimisation</SelectItem>
                  <SelectItem value="correction">Correction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Suggestion</label>
              <Textarea
                className="mt-1"
                placeholder="Décrivez la suggestion"
                value={action.message || ''}
                onChange={(e) => onUpdateAction(index, {
                  ...action,
                  message: e.target.value
                })}
                rows={3}
              />
            </div>
          </div>
        );

      case 'LOG':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Niveau de log</label>
              <Select
                value={action.metadata?.level || 'info'}
                onValueChange={(value) => onUpdateAction(index, {
                  ...action,
                  metadata: { ...action.metadata, level: value }
                })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Message de log</label>
              <Textarea
                className="mt-1"
                placeholder="Message à logger"
                value={action.message || ''}
                onChange={(e) => onUpdateAction(index, {
                  ...action,
                  message: e.target.value
                })}
                rows={2}
              />
            </div>
          </div>
        );

      case 'CUSTOM':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Nom de la fonction</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="customActionHandler"
                value={action.customFunction || ''}
                onChange={(e) => onUpdateAction(index, {
                  ...action,
                  customFunction: e.target.value
                })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Paramètres (JSON)</label>
              <Textarea
                className="mt-1 font-mono text-sm"
                placeholder='{"param1": "value1", "param2": 123}'
                value={action.value || '{}'}
                onChange={(e) => onUpdateAction(index, {
                  ...action,
                  value: e.target.value
                })}
                rows={3}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Actions</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddAction}
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une action
        </Button>
      </div>

      {actions.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune action définie</p>
            <p className="text-sm mt-2">
              Les actions définissent ce qui se passe quand la règle est déclenchée
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {actions.map((action, index) => {
          const actionType = ACTION_TYPES[action.type];
          const isExpanded = expandedActions.includes(index);

          return (
            <Card key={index}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant={actionType.color as any} className="gap-1">
                      {actionType.icon}
                      {actionType.label}
                    </Badge>
                    {action.target && (
                      <span className="text-sm text-muted-foreground">
                        → {TARGET_OPTIONS.find(t => t.value === action.target)?.label || action.target}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(index)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newAction = { ...action };
                        onAddAction(newAction);
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveAction(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-3 border-t">
                    <div className="mb-3">
                      <label className="text-sm font-medium">Type d'action</label>
                      <Select
                        value={action.type}
                        onValueChange={(value) => onUpdateAction(index, {
                          ...action,
                          type: value as ActionType
                        })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ACTION_TYPES).map(([value, config]) => (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center gap-2">
                                {config.icon}
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {renderActionConfig(action, index)}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {errors.actions && (
        <p className="text-sm text-destructive">{errors.actions}</p>
      )}
    </div>
  );
};