'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Layout, MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';

// Import dynamique des composants pour éviter les problèmes de SSR
const SallesAdmin = dynamic(
  () => import('../../salles/components/SallesAdmin').then(mod => ({ default: mod.default })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">Chargement des salles...</div>
    ),
    ssr: false,
  }
);

const SecteursAdmin = dynamic(() => import('../../secteurs/components/SecteursAdminWithDndKit'), {
  loading: () => (
    <div className="flex items-center justify-center p-8">Chargement des secteurs...</div>
  ),
  ssr: false,
});

const SitesAdmin = dynamic(() => import('../../../parametres/sites/page'), {
  loading: () => (
    <div className="flex items-center justify-center p-8">Chargement des sites...</div>
  ),
  ssr: false,
});

export default function BlocConfigurationAdmin() {
  const [activeTab, setActiveTab] = useState('sites');

  const tabs = [
    {
      id: 'sites',
      label: "Sites d'anesthésie",
      icon: MapPin,
      description: "Gérez les différents sites d'anesthésie",
      component: <SitesAdmin />,
    },
    {
      id: 'secteurs',
      label: 'Secteurs',
      icon: Layout,
      description: 'Organisez les secteurs et spécialités du bloc',
      component: <SecteursAdmin />,
    },
    {
      id: 'salles',
      label: "Salles d'opération",
      icon: Building2,
      description: "Configurez et gérez les salles d'opération",
      component: <SallesAdmin />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuration du Bloc Opératoire</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gérez les sites, secteurs et salles d'opération en un seul endroit
        </p>
      </div>

      {/* Interface à onglets */}
      <Card className="w-full shadow-lg">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader className="pb-0 px-0">
            <TabsList className="grid w-full grid-cols-3 bg-gray-50 rounded-none border-b">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={`
                      relative flex items-center justify-center gap-2 px-4 py-4 transition-all rounded-none
                      ${
                        isActive
                          ? 'bg-white text-blue-600 font-semibold shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                    `}
                  >
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                    <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="hidden sm:inline text-sm">{tab.label}</span>
                    <span className="sm:hidden text-sm">{tab.label.split(' ')[0]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </CardHeader>

          <CardContent className="pt-6 px-0">
            {tabs.map(tab => (
              <TabsContent key={tab.id} value={tab.id} className="mt-0 px-6">
                <div className="space-y-4">{tab.component}</div>
              </TabsContent>
            ))}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
