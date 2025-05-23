'use client';

import React, { useEffect, useState } from 'react';
import { TemplateManager } from '@/modules/templates/components/TemplateManager';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';

// Chargement dynamique de l'éditeur de trames en grille
const TrameGridEditor = dynamic(
    () => import('./TrameGridEditor').catch(() => () => <div>Erreur de chargement</div>),
    { ssr: false }
);

// Charger dynamiquement le composant de démo pour éviter les problèmes de SSR
const TrameGridDemo = dynamic(
    () => import('@/components/trames/grid-view/TrameGridDemo').catch(() => () => <div>Erreur de chargement</div>),
    { ssr: false }
);

export default function TramesPlanningPage() {
    // Props vides pour TemplateManager pour éviter les erreurs de type
    const emptyProps = {
        availableSitesParam: [],
        availableActivityTypesParam: [],
        availableRolesParam: []
    };

    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('vue-classique');

    // Synchroniser les onglets avec les paramètres d'URL
    useEffect(() => {
        if (searchParams) {
            const tabParam = searchParams.get('tab');
            if (tabParam && ['vue-classique', 'vue-grille', 'vue-demo'].includes(tabParam)) {
                setActiveTab(tabParam);
            }
        }
    }, [searchParams]);

    // Mettre à jour l'URL lorsque l'onglet change
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        router.replace(`/parametres/trames?tab=${value}`);
    };

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-10">Gestion des trames de planning</h1>

            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="mb-8">
                    <TabsTrigger value="vue-classique" className="px-6 py-2">Vue Classique</TabsTrigger>
                    <TabsTrigger value="vue-grille" className="px-6 py-2">Vue Grille</TabsTrigger>
                    <TabsTrigger value="vue-demo" className="px-6 py-2">Vue Démo</TabsTrigger>
                </TabsList>

                <TabsContent value="vue-classique">
                    <Card className="min-h-[600px]">
                        <CardHeader className="border-b">
                            <CardTitle>Vue Classique</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <TemplateManager {...emptyProps} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="vue-grille">
                    <Card className="min-h-[600px]">
                        <CardHeader className="border-b">
                            <CardTitle>Vue Grille</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <TrameGridEditor />
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
                                Cette vue utilise des données simulées pour démontrer les fonctionnalités sans authentification.
                            </p>
                            <TrameGridDemo />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 