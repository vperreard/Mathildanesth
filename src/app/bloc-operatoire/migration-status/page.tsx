'use client';

import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';
import { getMigrationSummary, migrationStatus } from '../_services/migrationService';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function MigrationStatusPage() {
  const { user } = useAuth();
  
  // Redirect if not admin or not in development
  if (process.env.NODE_ENV !== 'development' || user?.role !== 'ADMIN') {
    redirect('/bloc-operatoire');
  }

  const summary = getMigrationSummary();

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'completed': 'default',
      'in-progress': 'secondary',
      'pending': 'outline'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">État de la Migration</h1>
        <p className="mt-1 text-sm text-gray-600">
          Suivi de la fusion des composants bloc-opératoire
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progression Globale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={summary.percentage} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
                <div className="text-sm text-gray-600">Complétés</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{summary.inProgress}</div>
                <div className="text-sm text-gray-600">En cours</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-400">{summary.pending}</div>
                <div className="text-sm text-gray-600">En attente</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Détail des Composants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {migrationStatus.map((item) => (
              <div key={item.component} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                {statusIcon(item.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{item.component}</h3>
                    {statusBadge(item.status)}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    <div>De: {item.oldPath}</div>
                    <div>Vers: {item.newPath}</div>
                  </div>
                  {item.issues && item.issues.length > 0 && (
                    <div className="mt-2">
                      {item.issues.map((issue, idx) => (
                        <div key={idx} className="flex items-center text-xs text-amber-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {issue}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Note de développement</p>
              <p className="mt-1">
                Cette page est uniquement visible en mode développement pour suivre la progression de la migration.
                Elle sera supprimée une fois la migration terminée.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}