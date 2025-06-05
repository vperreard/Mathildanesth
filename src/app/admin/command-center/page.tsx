'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Users, 
  Calendar, 
  Activity,
  Clock,
  UserX,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface MetricData {
  absencesToday: number;
  overloadedStaff: number;
  ruleViolations: number;
  pendingRequests: number;
  criticalAlerts: Alert[];
  weeklyTrends: {
    absences: number;
    violations: number;
    workload: number;
  };
}

interface Alert {
  id: string;
  type: 'absence' | 'overload' | 'violation' | 'urgent';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: Date;
  actionRequired: boolean;
  actionType?: 'replace' | 'validate' | 'adjust';
  relatedId?: string;
}

export default function CommandCenterPage() {
  const router = useRouter();
  const [selectedQuadrant, setSelectedQuadrant] = useState<string | null>(null);
  const [processingAlert, setProcessingAlert] = useState<string | null>(null);

  // Récupération des métriques temps réel
  const { data: metrics, isLoading, refetch } = useQuery<MetricData>({
    queryKey: ['command-center-metrics'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/command-center/metrics');
      return response.data;
    },
    refetchInterval: 30000, // Rafraîchissement toutes les 30 secondes
  });

  // Gestionnaire d'actions rapides
  const handleQuickAction = async (alert: Alert) => {
    setProcessingAlert(alert.id);
    
    try {
      switch (alert.actionType) {
        case 'replace':
          router.push(`/admin/emergency-replacement?alertId=${alert.id}`);
          break;
          
        case 'validate':
          await axios.post(`/api/admin/alerts/${alert.id}/validate`);
          toast.success('Action validée avec succès');
          refetch();
          break;
          
        case 'adjust':
          router.push(`/admin/planning/adjust?alertId=${alert.id}`);
          break;
          
        default:
          router.push(`/admin/alerts/${alert.id}`);
      }
    } catch (error: unknown) {
      toast.error('Erreur lors du traitement de l\'alerte');
    } finally {
      setProcessingAlert(null);
    }
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return null;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse">Chargement du centre de commande...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Centre de Commande</h1>
          <p className="text-gray-600">Vue d'ensemble temps réel de l'activité</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(), 'HH:mm', { locale: fr })}
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
          >
            Actualiser
          </Button>
        </div>
      </div>

      {/* Grille 4 quadrants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quadrant 1: Urgences */}
        <Card 
          className={`cursor-pointer transition-all ${
            selectedQuadrant === 'urgences' ? 'ring-2 ring-red-500' : ''
          }`}
          onClick={() => setSelectedQuadrant('urgences')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Urgences
              </span>
              <Badge variant="destructive">{metrics?.criticalAlerts.length || 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics?.criticalAlerts.slice(0, 3).map((alert) => (
              <div 
                key={alert.id} 
                className="p-3 bg-red-50 rounded-lg space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-xs text-gray-600">{alert.description}</p>
                  </div>
                  <Badge className={getSeverityColor(alert.severity)} />
                </div>
                {alert.actionRequired && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAction(alert);
                    }}
                    disabled={processingAlert === alert.id}
                  >
                    {processingAlert === alert.id ? (
                      'Traitement...'
                    ) : (
                      <>
                        <Zap className="h-3 w-3 mr-1" />
                        Action immédiate
                      </>
                    )}
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quadrant 2: Métriques */}
        <Card 
          className={`cursor-pointer transition-all ${
            selectedQuadrant === 'metriques' ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setSelectedQuadrant('metriques')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Métriques Temps Réel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Absences aujourd'hui</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{metrics?.absencesToday || 0}</p>
                  {getTrendIcon(metrics?.weeklyTrends.absences || 0)}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Personnel surchargé</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-orange-600">
                    {metrics?.overloadedStaff || 0}
                  </p>
                  {getTrendIcon(metrics?.weeklyTrends.workload || 0)}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Charge globale</span>
                <span>{metrics?.weeklyTrends.workload || 0}%</span>
              </div>
              <Progress 
                value={metrics?.weeklyTrends.workload || 0} 
                className="h-2"
              />
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Violations de règles</span>
                <Badge variant="outline" className="text-red-600">
                  {metrics?.ruleViolations || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quadrant 3: Planning */}
        <Card 
          className={`cursor-pointer transition-all ${
            selectedQuadrant === 'planning' ? 'ring-2 ring-green-500' : ''
          }`}
          onClick={() => setSelectedQuadrant('planning')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              Planning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/admin/planning-generator');
                }}
              >
                <Calendar className="h-6 w-6" />
                <span className="text-xs">Générer planning</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/admin/templates');
                }}
              >
                <Shield className="h-6 w-6" />
                <span className="text-xs">Templates</span>
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Prochaines échéances</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Planning semaine 12</span>
                  <span className="text-orange-600">Dans 2 jours</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Validation congés mars</span>
                  <span className="text-gray-600">Dans 5 jours</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quadrant 4: Actions rapides */}
        <Card 
          className={`cursor-pointer transition-all ${
            selectedQuadrant === 'actions' ? 'ring-2 ring-purple-500' : ''
          }`}
          onClick={() => setSelectedQuadrant('actions')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              Actions Rapides
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                router.push('/admin/emergency-replacement');
              }}
            >
              <UserX className="h-4 w-4 mr-2" />
              Remplacement urgent
            </Button>
            <Button
              className="w-full justify-start"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                router.push('/admin/rules');
              }}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Gérer les règles
            </Button>
            <Button
              className="w-full justify-start"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                router.push('/admin/requests');
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Demandes en attente
              {metrics?.pendingRequests && metrics.pendingRequests > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {metrics.pendingRequests}
                </Badge>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Section détails si un quadrant est sélectionné */}
      {selectedQuadrant && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Détails - {selectedQuadrant}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Cliquez sur les actions pour accéder aux fonctionnalités détaillées.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}