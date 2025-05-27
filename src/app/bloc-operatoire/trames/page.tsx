'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Clock, Users, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';

const mockTrames = [
  {
    id: 1,
    nom: 'Planning Standard Semaine',
    description: 'Modèle de planning standard pour une semaine type',
    nbSalles: 8,
    dureeTypique: '7 jours',
    utilisations: 24,
    statut: 'active'
  },
  {
    id: 2,
    nom: 'Planning Urgence',
    description: 'Modèle optimisé pour les situations d\'urgence',
    nbSalles: 12,
    dureeTypique: '24h',
    utilisations: 8,
    statut: 'active'
  },
  {
    id: 3,
    nom: 'Planning Week-end',
    description: 'Configuration réduite pour les week-ends',
    nbSalles: 4,
    dureeTypique: '2 jours',
    utilisations: 15,
    statut: 'active'
  }
];

export default function TramesPage() {
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trames de Planning</h1>
          <p className="mt-1 text-sm text-gray-600">
            Créez et gérez des modèles de planning réutilisables
          </p>
        </div>
        <Link href="/bloc-operatoire/trames/nouveau">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle trame
          </Button>
        </Link>
      </div>

      {/* Vue d'ensemble rapide */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Trames créées</p>
                <p className="text-2xl font-semibold text-gray-900">12</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Utilisations ce mois</p>
                <p className="text-2xl font-semibold text-gray-900">47</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Plannings générés</p>
                <p className="text-2xl font-semibold text-gray-900">156</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Temps économisé</p>
                <p className="text-2xl font-semibold text-gray-900">24h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des trames */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockTrames.map((trame) => (
          <Card key={trame.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{trame.nom}</CardTitle>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                    {trame.statut === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {trame.description}
              </CardDescription>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  {trame.nbSalles} salles configurées
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Durée: {trame.dureeTypique}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {trame.utilisations} utilisations
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Link href={`/bloc-operatoire/trames/${trame.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    Modifier
                  </Button>
                </Link>
                <Link href={`/bloc-operatoire/trames/${trame.id}/utiliser`} className="flex-1">
                  <Button className="w-full">
                    Utiliser
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Call to action si aucune trame */}
      {mockTrames.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune trame de planning
            </h3>
            <p className="text-gray-600 mb-6">
              Créez votre première trame pour commencer à optimiser vos plannings
            </p>
            <Link href="/bloc-operatoire/trames/nouveau">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Créer ma première trame
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}