'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { logger } from "../../../../../lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Eye, 
  AlertTriangle, 
  Check, 
  History,
  Copy,
  Trash2,
  Play
} from 'lucide-react';
import { RuleV2, RuleBuilderState, RuleTemplate } from '../../types/ruleV2.types';
import { ConditionBuilder } from './ConditionBuilder';
import { ActionBuilder } from './ActionBuilder';
import { PreviewPanel } from './PreviewPanel';
import { useRuleBuilder } from '../../hooks/useRuleBuilder';
import { useRulePreview } from '../../hooks/useRulePreview';
import { useRuleConflicts } from '../../hooks/useRuleConflicts';

interface RuleBuilderProps {
  rule?: RuleV2;
  template?: RuleTemplate;
  onSave: (rule: Partial<RuleV2>) => Promise<void>;
  onCancel: () => void;
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({
  rule,
  template,
  onSave,
  onCancel
}) => {
  const {
    state,
    updateRule,
    addCondition,
    removeCondition,
    updateCondition,
    addAction,
    removeAction,
    updateAction,
    validate
  } = useRuleBuilder(rule, template);

  const { preview, isLoading: previewLoading, runPreview } = useRulePreview();
  const { conflicts, checkConflicts } = useRuleConflicts();

  const [activeTab, setActiveTab] = useState('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (state.rule.conditions?.length || state.rule.actions?.length) {
      checkConflicts(state.rule);
    }
  }, [state.rule, checkConflicts]);

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(state.rule);
    } catch (error: unknown) {
      logger.error('Error saving rule:', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!validate()) {
      return;
    }

    setShowPreview(true);
    await runPreview(state.rule);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {rule ? 'Modifier la règle' : 'Créer une nouvelle règle'}
          </h2>
          {template && (
            <p className="text-muted-foreground">
              Basé sur le template : {template.name}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={!state.isValid}
          >
            <Eye className="w-4 h-4 mr-2" />
            Prévisualiser
          </Button>
          <Button
            onClick={handleSave}
            disabled={!state.isValid || isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      </div>

      {/* Status indicators */}
      <div className="flex gap-4 items-center">
        {state.isDirty && (
          <Badge variant="secondary">Modifications non sauvegardées</Badge>
        )}
        {conflicts.length > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {conflicts.length} conflit{conflicts.length > 1 ? 's' : ''} détecté{conflicts.length > 1 ? 's' : ''}
          </Badge>
        )}
        {state.isValid && (
          <Badge variant="default" className="flex items-center gap-1">
            <Check className="w-3 h-3" />
            Règle valide
          </Badge>
        )}
      </div>

      {/* Conflict alerts */}
      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Conflits détectés :</p>
              {conflicts.map((conflict, idx) => (
                <div key={conflict.id} className="text-sm">
                  {idx + 1}. {conflict.description}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main content */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Informations</TabsTrigger>
              <TabsTrigger value="conditions">
                Conditions
                {state.rule.conditions?.length > 0 && (
                  <Badge className="ml-2" variant="secondary">
                    {state.rule.conditions.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="actions">
                Actions
                {state.rule.actions?.length > 0 && (
                  <Badge className="ml-2" variant="secondary">
                    {state.rule.actions.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="advanced">Avancé</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nom de la règle</label>
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    value={state.rule.name || ''}
                    onChange={(e) => updateRule({ name: e.target.value })}
                    placeholder="Ex: Limite gardes hebdomadaires"
                  />
                  {state.errors.name && (
                    <p className="text-sm text-destructive mt-1">{state.errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    value={state.rule.type || ''}
                    onChange={(e) => updateRule({ type: e.target.value as any })}
                  >
                    <option value="">Sélectionner un type</option>
                    <option value="PLANNING">Planning</option>
                    <option value="LEAVE">Congés</option>
                    <option value="CONSTRAINT">Contrainte</option>
                    <option value="ALLOCATION">Allocation</option>
                    <option value="SUPERVISION">Supervision</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  rows={3}
                  value={state.rule.description || ''}
                  onChange={(e) => updateRule({ description: e.target.value })}
                  placeholder="Décrivez l'objectif et le comportement de cette règle..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Priorité</label>
                  <select
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    value={state.rule.priority || ''}
                    onChange={(e) => updateRule({ priority: parseInt(e.target.value) })}
                  >
                    <option value="1">Faible</option>
                    <option value="5">Normale</option>
                    <option value="10">Élevée</option>
                    <option value="20">Critique</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Statut</label>
                  <select
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    value={state.rule.status || 'draft'}
                    onChange={(e) => updateRule({ status: e.target.value as any })}
                  >
                    <option value="draft">Brouillon</option>
                    <option value="active">Active</option>
                    <option value="archived">Archivée</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={state.rule.enabled ?? true}
                      onChange={(e) => updateRule({ enabled: e.target.checked })}
                    />
                    <span className="text-sm font-medium">Activée</span>
                  </label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="conditions" className="mt-6">
              <ConditionBuilder
                conditions={state.rule.conditions || []}
                conditionGroups={state.rule.conditionGroups || []}
                onAddCondition={addCondition}
                onUpdateCondition={updateCondition}
                onRemoveCondition={removeCondition}
                errors={state.errors}
              />
            </TabsContent>

            <TabsContent value="actions" className="mt-6">
              <ActionBuilder
                actions={state.rule.actions || []}
                onAddAction={addAction}
                onUpdateAction={updateAction}
                onRemoveAction={removeAction}
                ruleType={state.rule.type}
                errors={state.errors}
              />
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Date d'effet</label>
                  <input
                    type="datetime-local"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    value={state.rule.effectiveDate ? 
                      new Date(state.rule.effectiveDate).toISOString().slice(0, -8) : ''
                    }
                    onChange={(e) => updateRule({ 
                      effectiveDate: new Date(e.target.value) 
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Date d'expiration (optionnel)</label>
                  <input
                    type="datetime-local"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    value={state.rule.expirationDate ? 
                      new Date(state.rule.expirationDate).toISOString().slice(0, -8) : ''
                    }
                    onChange={(e) => updateRule({ 
                      expirationDate: e.target.value ? new Date(e.target.value) : undefined
                    })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Tags (séparés par des virgules)</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={state.rule.tags?.join(', ') || ''}
                  onChange={(e) => updateRule({ 
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  })}
                  placeholder="garde, weekend, IADE"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Contextes d'application</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['planning', 'leaves', 'attributions', 'bloc'].map(context => (
                    <label key={context} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={state.rule.contexts?.includes(context) || false}
                        onChange={(e) => {
                          const contexts = state.rule.contexts || [];
                          updateRule({
                            contexts: e.target.checked 
                              ? [...contexts, context]
                              : contexts.filter(c => c !== context)
                          });
                        }}
                      />
                      <span className="text-sm capitalize">{context}</span>
                    </label>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      {showPreview && (
        <PreviewPanel
          rule={state.rule}
          preview={preview}
          isLoading={previewLoading}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};