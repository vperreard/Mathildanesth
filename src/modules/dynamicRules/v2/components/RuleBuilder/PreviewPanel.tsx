'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, 
  Users, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  BarChart,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { RuleV2, RuleSimulation } from '../../types/ruleV2.types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PreviewPanelProps {
  rule: Partial<RuleV2>;
  preview?: RuleSimulation;
  isLoading: boolean;
  onClose: () => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  rule,
  preview,
  isLoading,
  onClose
}) => {
  const getImpactColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-background shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold">Prévisualisation de la règle</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Simulation sur les 30 prochains jours
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Simulation en cours...</p>
                </div>
              </div>
            ) : preview ? (
              <div className="space-y-6">
                {/* Rule Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Résumé de la règle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Nom</span>
                        <span className="text-sm font-medium">{rule.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Type</span>
                        <Badge variant="outline">{rule.type}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Priorité</span>
                        <Badge variant={rule.priority === 20 ? 'destructive' : 'default'}>
                          {rule.priority === 20 ? 'Critique' : rule.priority === 10 ? 'Élevée' : 'Normale'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Statut</span>
                        <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>
                          {rule.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Impact Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart className="w-5 h-5" />
                      Métriques d'impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">
                          {preview.metrics.affectedUsersCount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Utilisateurs impactés
                        </div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">
                          {preview.metrics.totalViolations}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Violations détectées
                        </div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">
                          {(preview.metrics.complianceRate * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Taux de conformité
                        </div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">
                          {preview.metrics.estimatedWorkloadChange > 0 ? '+' : ''}
                          {preview.metrics.estimatedWorkloadChange.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Variation charge
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Results */}
                <Tabs defaultValue="users" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="users">
                      Utilisateurs impactés ({preview.affectedUsers.length})
                    </TabsTrigger>
                    <TabsTrigger value="violations">
                      Violations ({preview.violations.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="users" className="mt-4">
                    <div className="space-y-2">
                      {preview.affectedUsers.map((user) => (
                        <Card key={user.userId}>
                          <CardContent className="py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{user.userName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {user.affectedDates.length} jour{user.affectedDates.length > 1 ? 's' : ''} impacté{user.affectedDates.length > 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                              <Badge className={getImpactColor(user.impactLevel)}>
                                Impact {user.impactLevel}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="violations" className="mt-4">
                    <div className="space-y-2">
                      {preview.violations.map((violation, idx) => (
                        <Alert key={idx} variant="destructive">
                          <div className="flex items-start gap-3">
                            {getSeverityIcon(violation.severity)}
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {format(new Date(violation.date), 'EEEE d MMMM yyyy', { locale: fr })}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {violation.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Utilisateur: {violation.userId}
                              </p>
                            </div>
                          </div>
                        </Alert>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Timeline visualization */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Chronologie des impacts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      Visualisation de la timeline à implémenter
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Aucune prévisualisation disponible. Veuillez configurer la règle.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-6">
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
              {preview && (
                <Button>
                  Appliquer la règle
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};