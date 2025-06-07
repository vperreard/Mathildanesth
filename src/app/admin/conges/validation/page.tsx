'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, Calendar, User, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const pendingRequests = [
  {
    id: 1,
    utilisateur: 'Dr. Marie Dubois',
    type: 'Congés payés',
    dates: '15-22 Mars 2025',
    duree: '7 jours',
    statut: 'EN_ATTENTE',
    urgence: 'normale',
    deposeLe: '2025-03-01',
    motif: 'Vacances familiales'
  },
  {
    id: 2,
    utilisateur: 'IADE Laurent Martin',
    type: 'Récupération',
    dates: '8-9 Mars 2025',
    duree: '2 jours',
    statut: 'EN_ATTENTE',
    urgence: 'élevée',
    deposeLe: '2025-03-05',
    motif: 'Récupération heures supplémentaires'
  },
  {
    id: 3,
    utilisateur: 'MAR Sophie Leroy',
    type: 'Formation',
    dates: '12 Mars 2025',
    duree: '1 jour',
    statut: 'EN_ATTENTE',
    urgence: 'normale',
    deposeLe: '2025-03-03',
    motif: 'Formation continue obligatoire'
  }
];

const getUrgenceBadge = (urgence: string) => {
  switch (urgence) {
    case 'élevée':
      return <Badge variant="destructive">Urgent</Badge>;
    case 'normale':
      return <Badge variant="secondary">Normal</Badge>;
    default:
      return <Badge variant="outline">Standard</Badge>;
  }
};

export default function ValidationCongesPage() {
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Validation des Congés</h1>
          <p className="mt-1 text-sm text-gray-600">
            Validez ou refusez les demandes de congés en attente
          </p>
        </div>
        <Link href="/admin/conges">
          <Button variant="outline">
            Retour aux congés
          </Button>
        </Link>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">En attente</p>
                <p className="text-2xl font-semibold text-gray-900">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Urgentes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {pendingRequests.filter(r => r.urgence === 'élevée').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cette semaine</p>
                <p className="text-2xl font-semibold text-gray-900">5</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des demandes en attente */}
      <div className="space-y-4">
        {pendingRequests.map((request) => (
          <Card key={request.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{request.utilisateur}</CardTitle>
                    {getUrgenceBadge(request.urgence)}
                  </div>
                  <CardDescription className="mt-1">
                    {request.type} • {request.duree}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Dates: {request.dates}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>Déposé le: {request.deposeLe}</span>
                  </div>
                </div>
                <div className="text-sm">
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Motif:</div>
                      <div className="text-gray-600">{request.motif}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button className="flex-1" variant="default">
                  <Check className="mr-2 h-4 w-4" />
                  Valider
                </Button>
                <Button className="flex-1" variant="destructive">
                  <X className="mr-2 h-4 w-4" />
                  Refuser
                </Button>
                <Button variant="outline">
                  Détails
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Message si aucune demande */}
      {pendingRequests.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Check className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune demande en attente
            </h3>
            <p className="text-gray-600 mb-6">
              Toutes les demandes de congés ont été traitées
            </p>
            <Link href="/admin/conges">
              <Button>
                Voir l'historique
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}