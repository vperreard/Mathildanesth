'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import BlocPlanning from './components/BlocPlanning';
import { useRouter } from 'next/navigation';

/**
 * Page principale du module de bloc opératoire
 * 
 * Cette page sert de conteneur pour les différentes sections du module bloc opératoire :
 * - Planning du bloc (par jour, semaine, mois)
 * - Gestion des salles d'opération
 * - Gestion des secteurs
 * - Configuration des règles de supervision
 */
export default function BlocOperatoirePage() {
    const [activeTab, setActiveTab] = useState('planning');
    const router = useRouter();

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Bloc Opératoire</h1>
                    <p className="text-muted-foreground">
                        Gestion des plannings du bloc opératoire, salles d'opération, secteurs et règles de supervision
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/admin/bloc-operatoire">
                        <Settings className="h-4 w-4 mr-2" />
                        Administration
                    </Link>
                </Button>
            </div>

            <Alert variant="info" className="mb-6">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Module en développement (MVP)</AlertTitle>
                <AlertDescription>
                    Ce module est actuellement en phase de développement initial. Des fonctionnalités
                    supplémentaires seront ajoutées progressivement.
                </AlertDescription>
            </Alert>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4 mb-8 w-full max-w-2xl">
                    <TabsTrigger value="planning">Planning</TabsTrigger>
                    <TabsTrigger value="salles">Salles</TabsTrigger>
                    <TabsTrigger value="secteurs">Secteurs</TabsTrigger>
                    <TabsTrigger value="regles">Règles</TabsTrigger>
                </TabsList>

                <TabsContent value="planning" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Planning du Bloc Opératoire</CardTitle>
                            <CardDescription>
                                Visualisez et gérez les affectations dans les salles d'opération
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <BlocPlanning />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="salles" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gestion des Salles d'Opération</CardTitle>
                            <CardDescription>
                                Ajoutez, modifiez et configurez les salles d'opération
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Placeholder pour le composant de gestion des salles */}
                            <div className="border rounded-md p-6 text-center bg-muted/10">
                                <p className="text-muted-foreground">
                                    Le composant de gestion des salles d'opération sera implémenté ici.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="secteurs" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gestion des Secteurs</CardTitle>
                            <CardDescription>
                                Organisez vos salles en secteurs spécialisés
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Placeholder pour le composant de gestion des secteurs */}
                            <div className="border rounded-md p-6 text-center bg-muted/10">
                                <p className="text-muted-foreground">
                                    Le composant de gestion des secteurs sera implémenté ici.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="regles" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Règles de Supervision</CardTitle>
                            <CardDescription>
                                Définissez les règles qui régissent la supervision des salles par le personnel médical
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                variant="default"
                                onClick={() => router.push('/bloc-operatoire/regles-supervision')}
                                className="w-full flex items-center justify-center"
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                Gérer les règles de supervision
                            </Button>
                            <p className="text-sm text-muted-foreground mt-4 text-center">
                                Configurez les règles de supervision pour contrôler le nombre de salles par superviseur,
                                les contraintes par secteur, et les exceptions.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 