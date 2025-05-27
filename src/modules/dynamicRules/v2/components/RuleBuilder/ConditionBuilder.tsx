'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Copy, 
  ChevronRight,
  AlertCircle,
  Layers
} from 'lucide-react';
import { RuleCondition, ConditionGroup, ConditionOperator } from '../../../types/rule';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ConditionBuilderProps {
  conditions: RuleCondition[];
  conditionGroups: ConditionGroup[];
  onAddCondition: (condition: RuleCondition) => void;
  onUpdateCondition: (index: number, condition: RuleCondition) => void;
  onRemoveCondition: (index: number) => void;
  errors?: Record<string, string>;
}

const FIELD_OPTIONS = [
  { value: 'user.role', label: 'Rôle utilisateur' },
  { value: 'user.id', label: 'ID utilisateur' },
  { value: 'date', label: 'Date' },
  { value: 'date.dayOfWeek', label: 'Jour de la semaine' },
  { value: 'date.isWeekend', label: 'Est un weekend' },
  { value: 'date.isHoliday', label: 'Est un jour férié' },
  { value: 'planning.guardCount', label: 'Nombre de gardes' },
  { value: 'planning.consecutiveGuards', label: 'Gardes consécutives' },
  { value: 'planning.hoursWorked', label: 'Heures travaillées' },
  { value: 'leave.type', label: 'Type de congé' },
  { value: 'leave.duration', label: 'Durée du congé' },
  { value: 'attribution.type', label: 'Type d\'affectation' },
  { value: 'attribution.sector', label: 'Secteur' },
  { value: 'attribution.room', label: 'Salle' }
];

const OPERATORS: Record<ConditionOperator, string> = {
  EQUALS: 'Égal à',
  NOT_EQUALS: 'Différent de',
  GREATER_THAN: 'Supérieur à',
  LESS_THAN: 'Inférieur à',
  GREATER_THAN_OR_EQUALS: 'Supérieur ou égal à',
  LESS_THAN_OR_EQUALS: 'Inférieur ou égal à',
  CONTAINS: 'Contient',
  NOT_CONTAINS: 'Ne contient pas',
  IN: 'Dans la liste',
  NOT_IN: 'Pas dans la liste',
  BETWEEN: 'Entre',
  IS_NULL: 'Est vide',
  IS_NOT_NULL: 'N\'est pas vide',
  REGEX: 'Expression régulière',
  CUSTOM: 'Personnalisé'
};

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  conditions,
  conditionGroups,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
  errors = {}
}) => {
  const [showGroupBuilder, setShowGroupBuilder] = useState(false);

  const handleAddCondition = () => {
    const newCondition: RuleCondition = {
      field: '',
      operator: 'EQUALS',
      value: ''
    };
    onAddCondition(newCondition);
  };

  const renderConditionValue = (condition: RuleCondition, index: number) => {
    const field = FIELD_OPTIONS.find(f => f.value === condition.field);
    
    // Special handling for certain operators
    if (condition.operator === 'IS_NULL' || condition.operator === 'IS_NOT_NULL') {
      return null;
    }

    if (condition.operator === 'BETWEEN') {
      const [min, max] = Array.isArray(condition.value) ? condition.value : ['', ''];
      return (
        <div className="flex gap-2 items-center">
          <input
            type="text"
            className="flex-1 px-3 py-2 border rounded-md"
            placeholder="Min"
            value={min}
            onChange={(e) => onUpdateCondition(index, {
              ...condition,
              value: [e.target.value, max]
            })}
          />
          <span className="text-muted-foreground">et</span>
          <input
            type="text"
            className="flex-1 px-3 py-2 border rounded-md"
            placeholder="Max"
            value={max}
            onChange={(e) => onUpdateCondition(index, {
              ...condition,
              value: [min, e.target.value]
            })}
          />
        </div>
      );
    }

    if (condition.operator === 'IN' || condition.operator === 'NOT_IN') {
      const values = Array.isArray(condition.value) ? condition.value : [];
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {values.map((val, idx) => (
              <Badge key={idx} variant="secondary" className="gap-1">
                {val}
                <button
                  onClick={() => {
                    const newValues = values.filter((_, i) => i !== idx);
                    onUpdateCondition(index, { ...condition, value: newValues });
                  }}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Ajouter une valeur et appuyer sur Entrée"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value) {
                e.preventDefault();
                const newValues = [...values, e.currentTarget.value];
                onUpdateCondition(index, { ...condition, value: newValues });
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
      );
    }

    // Boolean fields
    if (field?.value.includes('is')) {
      return (
        <Select
          value={String(condition.value)}
          onValueChange={(value) => onUpdateCondition(index, {
            ...condition,
            value: value === 'true'
          })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Oui</SelectItem>
            <SelectItem value="false">Non</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    // Default input
    return (
      <input
        type="text"
        className="flex-1 px-3 py-2 border rounded-md"
        placeholder="Valeur"
        value={String(condition.value || '')}
        onChange={(e) => onUpdateCondition(index, {
          ...condition,
          value: e.target.value
        })}
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Conditions</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGroupBuilder(!showGroupBuilder)}
          >
            <Layers className="w-4 h-4 mr-2" />
            Groupes de conditions
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddCondition}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une condition
          </Button>
        </div>
      </div>

      {conditions.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune condition définie</p>
            <p className="text-sm mt-2">
              Les conditions déterminent quand cette règle s'applique
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {conditions.map((condition, index) => (
          <Card key={index}>
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 grid grid-cols-12 gap-3">
                  <div className="col-span-4">
                    <Select
                      value={condition.field}
                      onValueChange={(value) => onUpdateCondition(index, {
                        ...condition,
                        field: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un champ" />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-3">
                    <Select
                      value={condition.operator}
                      onValueChange={(value) => onUpdateCondition(index, {
                        ...condition,
                        operator: value as ConditionOperator
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(OPERATORS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-5">
                    {renderConditionValue(condition, index)}
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newCondition = { ...condition };
                      onAddCondition(newCondition);
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveCondition(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {index < conditions.length - 1 && (
                <div className="mt-3 text-center">
                  <Badge variant="outline">ET</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {errors.conditions && (
        <p className="text-sm text-destructive">{errors.conditions}</p>
      )}
    </div>
  );
};