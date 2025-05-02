'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Info } from 'lucide-react';

import SallesAdmin from './components/SallesAdmin';
import SecteursAdmin from './components/SecteursAdmin';
import ReglesSupervisionAdmin from './components/ReglesSupervisionAdmin';

/**
 * Page d'administration du bloc opératoire
 * 
 * Cette page permet de gérer les configurations du bloc opératoire :
 * - Gestion des salles d'opération
 * - Gestion des secteurs
 * - Configuration des règles de supervision
 */
export default function BlocOperatoireAdminPage() {
    const [activeTab, setActiveTab] = useState('salles');

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold">Administration du Bloc Opératoire</h1>
                <p className="text-muted-foreground">
                    Configurez les salles, secteurs et règles de supervision du bloc opératoire
                </p>
                <Separator className="my-4" />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6 flex items-start">
                <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                <div>
                    <h3 className="font-medium text-blue-800">Configuration du bloc opératoire</h3>
                    <p className="text-sm text-blue-700">
                        Les modifications effectuées ici affecteront directement le fonctionnement
                        du module de planification du bloc. Assurez-vous de bien comprendre les
                        implications avant de procéder à des changements.
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 mb-8 w-full max-w-2xl">
                    <TabsTrigger value="salles">Salles d'opération</TabsTrigger>
                    <TabsTrigger value="secteurs">Secteurs</TabsTrigger>
                    <TabsTrigger value="regles">Règles de supervision</TabsTrigger>
                </TabsList>

                <TabsContent value="salles" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gestion des Salles d'Opération</CardTitle>
                            <CardDescription>
                                Ajoutez, modifiez ou supprimez les salles d'opération et leurs attributs
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SallesAdmin />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="secteurs" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gestion des Secteurs</CardTitle>
                            <CardDescription>
                                Organisez les salles en secteurs spécialisés avec des codes couleur
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SecteursAdmin />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="regles" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Règles de Supervision</CardTitle>
                            <CardDescription>
                                Définissez les règles qui régissent la supervision des salles d'opération
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ReglesSupervisionAdmin />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 