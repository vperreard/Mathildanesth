'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from 'next/dynamic';

// Charger dynamiquement les panneaux pour améliorer le chargement initial
const SpecialtiesConfigPanel = dynamic(() => import('./SpecialtiesConfigPanel'), {
    loading: () => <div className="p-4 text-center">Chargement des spécialités...</div>
});

// Placeholder pour le panneau des chirurgiens (sera implémenté)
const SurgeonsListPanel = dynamic(() => import('./SurgeonsListPanel'), {
    loading: () => <div className="p-4 text-center">Chargement des chirurgiens...</div>
});

const SurgeonAndSpecialtyPanel: React.FC = () => {
    return (
        // Utilisation d'une Card pour l'encadrement général et le style
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
            <Tabs defaultValue="specialties" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-md p-1 mb-6">
                    <TabsTrigger
                        value="specialties"
                        className="px-3 py-1.5 text-sm font-medium rounded-sm 
                                   data-[state=active]:bg-white data-[state=active]:text-indigo-700 
                                   data-[state=active]:shadow-sm transition-all duration-150
                                   focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 outline-none"
                    >
                        Spécialités Chirurgicales
                    </TabsTrigger>
                    <TabsTrigger
                        value="surgeons"
                        className="px-3 py-1.5 text-sm font-medium rounded-sm 
                                   data-[state=active]:bg-white data-[state=active]:text-indigo-700 
                                   data-[state=active]:shadow-sm transition-all duration-150
                                   focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 outline-none"
                    >
                        Chirurgiens
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="specialties">
                    <SpecialtiesConfigPanel />
                </TabsContent>
                <TabsContent value="surgeons">
                    <SurgeonsListPanel />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default SurgeonAndSpecialtyPanel; 