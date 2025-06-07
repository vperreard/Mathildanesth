'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '../../../../lib/logger';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface Secteur {
  id: number;
  nom: string;
  description?: string;
  displayOrder?: number;
  siteId?: number;
}

interface Site {
  id: number;
  name: string;
}

const SecteursAdmin: React.FC = () => {
  const [secteurs, setSecteurs] = useState<Secteur[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Charger les secteurs et sites en parallèle
        const [secteursResponse, sitesResponse] = await Promise.all([
          fetch('/api/operating-sectors', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            }
          }),
          fetch('/api/sites', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            }
          })
        ]);

        if (!secteursResponse.ok || !sitesResponse.ok) {
          throw new Error('Erreur lors du chargement des données');
        }

        const secteursData = await secteursResponse.json();
        const sitesData = await sitesResponse.json();

        setSecteurs(secteursData || []);
        setSites(sitesData || []);
      } catch (error) {
        logger.error('Erreur lors du chargement des données:', error);
        setError('Impossible de charger les données');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-center">Chargement des secteurs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestion des Secteurs</h1>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Ajouter un secteur
        </Button>
      </div>

      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
        <p className="font-semibold">Module en cours de réparation</p>
        <p className="text-sm mt-1">
          La fonctionnalité de drag-and-drop est temporairement désactivée suite à la migration des
          dépendances. Les secteurs sont affichés en mode lecture seule.
        </p>
      </div>

      {secteurs.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Aucun secteur trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {secteurs.map(secteur => (
            <Card key={secteur.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{secteur.nom}</h3>
                    {secteur.description && (
                      <p className="text-sm text-gray-600">{secteur.description}</p>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">ID: {secteur.id}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SecteursAdmin;
