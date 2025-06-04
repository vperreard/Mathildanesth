'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  XCircle, 
  AlertCircle,
  CheckCircle,
  GitMerge,
  Layers,
  Zap,
  Edit
} from 'lucide-react';
import { RuleConflict, ConflictResolution } from '../types/ruleV2.types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ConflictResolutionPanelProps {
  conflicts: RuleConflict[];
}

export const ConflictResolutionPanel: React.FC<ConflictResolutionPanelProps> = ({ conflicts }) => {
  const [selectedConflict, setSelectedConflict] = useState<RuleConflict | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const queryClient = useQueryClient();

  const resolveMutation = useMutation({
    mutationFn: async ({ conflictId, strategy }: { conflictId: string; strategy: string }) => {
      const response = await fetch('http://localhost:3000/api/admin/rules/v2/conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve',
          conflictId,
          strategy
        })
      });

      if (!response.ok) throw new Error('Failed to resolve conflict');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rule-conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      toast.success('Conflit résolu avec succès');
      setSelectedConflict(null);
      setSelectedStrategy('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'orange';
      case 'medium':
        return 'yellow';
      default:
        return 'secondary';
    }
  };

  const getConflictTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'condition_overlap': 'Chevauchement de conditions',
      'action_contradiction': 'Actions contradictoires',
      'resource_conflict': 'Conflit de ressources',
      'timing_conflict': 'Conflit temporel'
    };
    return labels[type] || type;
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'priority':
        return <Zap className="w-4 h-4" />;
      case 'merge':
        return <GitMerge className="w-4 h-4" />;
      case 'override':
        return <Layers className="w-4 h-4" />;
      case 'manual':
        return <Edit className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const groupedConflicts = conflicts.reduce((acc, conflict) => {
    if (!acc[conflict.severity]) {
      acc[conflict.severity] = [];
    }
    acc[conflict.severity].push(conflict);
    return acc;
  }, {} as Record<string, RuleConflict[]>);

  const severityOrder = ['critical', 'high', 'medium', 'low'];

  if (conflicts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-medium">Aucun conflit détecté</p>
          <p className="text-sm text-muted-foreground mt-2">
            Toutes les règles sont compatibles entre elles
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé des conflits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {severityOrder.map(severity => {
              const count = groupedConflicts[severity]?.length || 0;
              if (count === 0) return null;
              
              return (
                <div key={severity} className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {getSeverityIcon(severity)}
                  </div>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground capitalize">{severity}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Conflicts List */}
      <div className="space-y-4">
        {severityOrder.map(severity => {
          const severityConflicts = groupedConflicts[severity];
          if (!severityConflicts || severityConflicts.length === 0) return null;

          return (
            <div key={severity}>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                {getSeverityIcon(severity)}
                Conflits {severity}
                <Badge variant={getSeverityColor(severity) as any}>
                  {severityConflicts.length}
                </Badge>
              </h3>

              <div className="space-y-3">
                {severityConflicts.map(conflict => (
                  <Card key={conflict.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline">
                              {getConflictTypeLabel(conflict.type)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Détecté {format(new Date(conflict.detectedAt), 'dd MMM à HH:mm', { locale: fr })}
                            </span>
                          </div>
                          
                          <p className="text-sm mb-3">{conflict.description}</p>

                          <div className="text-sm text-muted-foreground">
                            Règles impliquées: 
                            {conflict.ruleIds.map((ruleId, idx) => (
                              <span key={ruleId}>
                                {idx > 0 && ', '}
                                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                  {ruleId}
                                </code>
                              </span>
                            ))}
                          </div>

                          {conflict.resolution && (
                            <Alert className="mt-3">
                              <CheckCircle className="h-4 w-4" />
                              <AlertDescription>
                                Résolu par stratégie "{conflict.resolution.strategy}"
                                {conflict.resolution.resolvedAt && (
                                  <> le {format(new Date(conflict.resolution.resolvedAt), 'dd MMM yyyy', { locale: fr })}</>
                                )}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>

                        {!conflict.resolution && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedConflict(conflict);
                              setSelectedStrategy('');
                            }}
                          >
                            Résoudre
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resolution Modal */}
      {selectedConflict && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed inset-x-4 top-[20%] max-w-lg mx-auto bg-background border rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Résoudre le conflit</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Type de conflit</p>
                <p className="font-medium">{getConflictTypeLabel(selectedConflict.type)}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">{selectedConflict.description}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-3">Stratégies de résolution disponibles</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                    <input
                      type="radio"
                      name="strategy"
                      value="priority"
                      checked={selectedStrategy === 'priority'}
                      onChange={(e) => setSelectedStrategy(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      {getStrategyIcon('priority')}
                      <span className="font-medium">Priorité</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Appliquer la règle avec la plus haute priorité
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                    <input
                      type="radio"
                      name="strategy"
                      value="merge"
                      checked={selectedStrategy === 'merge'}
                      onChange={(e) => setSelectedStrategy(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      {getStrategyIcon('merge')}
                      <span className="font-medium">Fusion</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Combiner les règles en une seule
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                    <input
                      type="radio"
                      name="strategy"
                      value="override"
                      checked={selectedStrategy === 'override'}
                      onChange={(e) => setSelectedStrategy(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      {getStrategyIcon('override')}
                      <span className="font-medium">Remplacement</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Garder uniquement la règle prioritaire
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedConflict(null);
                  setSelectedStrategy('');
                }}
              >
                Annuler
              </Button>
              <Button
                disabled={!selectedStrategy || resolveMutation.isPending}
                onClick={() => {
                  if (selectedStrategy) {
                    resolveMutation.mutate({
                      conflictId: selectedConflict.id,
                      strategy: selectedStrategy
                    });
                  }
                }}
              >
                {resolveMutation.isPending ? 'Résolution...' : 'Résoudre'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};