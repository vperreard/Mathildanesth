'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RequestDashboard from './components/RequestDashboard';
import RequestTypeManager from './components/RequestTypeManager';

// Page principale de l'admin pour gérer les requêtes et types de requêtes
export default function AdminRequestsPage() {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-gray-900">Administration des Requêtes</h1>
                <p className="text-gray-600 mt-2">
                    Gérez les requêtes des utilisateurs et configurez les types de requêtes disponibles.
                </p>
            </div>

            <Tabs
                defaultValue="dashboard"
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-4"
            >
                <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
                    <TabsTrigger value="dashboard">Tableau de bord des requêtes</TabsTrigger>
                    <TabsTrigger value="types">Types de requêtes</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-4">
                    <RequestDashboard />
                </TabsContent>

                <TabsContent value="types" className="space-y-4">
                    <RequestTypeManager />
                </TabsContent>
            </Tabs>
        </div>
    );
} 