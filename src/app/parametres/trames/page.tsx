'use client';

import React, { useEffect, useState } from 'react';
import { logger } from '../../../lib/logger';
import { TemplateManager } from '@/modules/templates/components/TemplateManager';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { getClientAuthToken } from '@/lib/auth-client-utils';

// Chargement dynamique de l'éditeur de trameModeles en grille
const TrameGridEditor = dynamic(
  () =>
    import('./TrameGridEditor').catch(() => {
      const ErrorComponent = () => <div>Erreur de chargement</div>;
      ErrorComponent.displayName = 'TrameGridEditorError';
      return ErrorComponent;
    }),
  { ssr: false }
);

// Charger dynamiquement le composant de démo pour éviter les problèmes de SSR
const TrameGridDemo = dynamic(
  () =>
    import('@/components/trames/grid-view/TrameGridDemo').catch(() => {
      const ErrorComponent = () => <div>Erreur de chargement</div>;
      ErrorComponent.displayName = 'TrameGridDemoError';
      return ErrorComponent;
    }),
  { ssr: false }
);

// Chargement dynamique de l'éditeur de vacations par chirurgien
const SurgeonVacationsEditor = dynamic(
  () =>
    import('./SurgeonVacationsEditor').catch(() => {
      const ErrorComponent = () => <div>Erreur de chargement</div>;
      ErrorComponent.displayName = 'SurgeonVacationsEditorError';
      return ErrorComponent;
    }),
  { ssr: false }
);

export default function TramesPlanningPage() {
  const [operatingSectors, setOperatingSectors] = useState<unknown[]>([]);
  const [operatingRooms, setOperatingRooms] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Props vides pour TemplateManager pour éviter les erreurs de type
  const emptyProps = {
    availableSitesParam: [],
    availableActivityTypesParam: [],
    availableRolesParam: [],
  };

  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('vue-classique');
  const [refreshKey, setRefreshKey] = useState(Date.now());

  // Charger les secteurs et salles d'opération
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await getClientAuthToken();

        // Charger les secteurs
        const sectorsResponse = await fetch('/api/operating-sectors', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (sectorsResponse.ok) {
          const sectorsData = await sectorsResponse.json();
          setOperatingSectors(sectorsData);
          logger.info('[TramesPlanningPage] Sectors loaded:', sectorsData.length);
        } else {
          logger.error('[TramesPlanningPage] Failed to load sectors:', sectorsResponse.status);
        }

        // Charger les salles
        const roomsResponse = await fetch('/api/operating-rooms', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (roomsResponse.ok) {
          const roomsData = await roomsResponse.json();
          setOperatingRooms(roomsData);
          logger.info('[TramesPlanningPage] Rooms loaded:', roomsData.length);
        } else {
          logger.error('[TramesPlanningPage] Failed to load rooms:', roomsResponse.status);
        }
      } catch (error) {
        logger.error('[TramesPlanningPage] Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Synchroniser les onglets avec les paramètres d'URL
  useEffect(() => {
    if (searchParams) {
      const tabParam = searchParams.get('tab');
      if (
        tabParam &&
        ['vue-classique', 'vue-grille', 'vue-demo', 'vacations-chirurgien'].includes(tabParam)
      ) {
        setActiveTab(tabParam);
      }
    }
  }, [searchParams]);

  // Mettre à jour l'URL lorsque l'onglet change et forcer le rechargement
  const handleTabChange = (value: string) => {
    logger.info(`🔄 [TramesPlanningPage] Changement d'onglet: ${activeTab} → ${value}`);
    setActiveTab(value);
    router.replace(`/parametres/trames?tab=${value}`);

    // Forcer le rechargement des données quand on change d'onglet
    // pour synchroniser les vues
    setRefreshKey(Date.now());
    logger.info(`🔄 [TramesPlanningPage] Nouveau refreshKey: ${Date.now()}`);
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-10">Gestion des trameModeles de planning</h1>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-8">
          <TabsTrigger value="vue-classique" className="px-6 py-2">
            Vue Classique
          </TabsTrigger>
          <TabsTrigger value="vue-grille" className="px-6 py-2">
            Vue Grille
          </TabsTrigger>
          <TabsTrigger value="vacations-chirurgien" className="px-6 py-2">
            Vacations par Chirurgien
          </TabsTrigger>
          <TabsTrigger value="vue-demo" className="px-6 py-2">
            Vue Démo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vue-classique">
          <Card className="min-h-[600px]">
            <CardHeader className="border-b">
              <CardTitle>Vue Classique</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <TemplateManager
                key={`template-${refreshKey}`}
                {...emptyProps}
                operatingRoomsParam={operatingRooms}
                operatingSectorsParam={operatingSectors}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vue-grille">
          <Card className="min-h-[600px]">
            <CardHeader className="border-b">
              <CardTitle>Vue Grille</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <TrameGridEditor key={`grid-${refreshKey}`} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vacations-chirurgien">
          <Card className="min-h-[600px]">
            <CardHeader className="border-b">
              <CardTitle>Configuration des Vacations par Chirurgien</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-sm text-muted-foreground px-6 py-4">
                Configurez directement les vacations opératoires pour chaque chirurgien. Les
                affectations seront automatiquement créées dans la trame.
              </p>
              <SurgeonVacationsEditor key={`vacations-${refreshKey}`} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vue-demo">
          <Card className="min-h-[600px]">
            <CardHeader className="border-b">
              <CardTitle>Démonstration (données simulées)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-sm text-muted-foreground px-6 py-4">
                Cette vue utilise des données simulées pour démontrer les fonctionnalités sans
                authentification.
              </p>
              <TrameGridDemo key={`demo-${refreshKey}`} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
