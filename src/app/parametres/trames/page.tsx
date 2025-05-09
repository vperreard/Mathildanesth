'use client';

import React from 'react';
import BlocPlanningTemplateEditor from '@/components/trames/BlocPlanningTemplateEditor';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EditeurTramesHebdomadaires from './EditeurTramesHebdomadaires';

export default function TramesPlanningPage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Gestion des trames de planning</h1>

            <Tabs defaultValue="bloc">
                <TabsList className="mb-8">
                    <TabsTrigger value="bloc">Planning de bloc</TabsTrigger>
                    <TabsTrigger value="standard">Planning standard</TabsTrigger>
                    <TabsTrigger value="garde">Gardes et astreintes</TabsTrigger>
                </TabsList>

                <TabsContent value="bloc">
                    <Card>
                        <CardHeader>
                            <CardTitle>Trames de planning de bloc</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <BlocPlanningTemplateEditor />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="standard">
                    <Card>
                        <CardHeader>
                            <CardTitle>Trames de planning standard</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <EditeurTramesHebdomadaires />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="garde">
                    <Card>
                        <CardHeader>
                            <CardTitle>Trames de gardes et astreintes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500">
                                Module en développement. Disponible prochainement.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 