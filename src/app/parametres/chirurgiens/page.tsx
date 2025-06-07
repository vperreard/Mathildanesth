'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Stethoscope } from 'lucide-react';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserRole } from '@/types/user';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Importer les composants
import SurgeonsListPanel from '../configuration/SurgeonsListPanel';
import SpecialtyManager from '@/components/SpecialtyManager';

// Contenu de la page avec onglets
function SurgeonsPageContent() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {/* Bouton Retour aux Paramètres */}
                <Link href="/parametres" className="inline-flex items-center text-sm text-gray-600 hover:text-indigo-600 mb-6 group">
                    <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                    Retour aux Paramètres
                </Link>


                {/* Interface avec onglets */}
                <Tabs defaultValue="chirurgiens" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-100/80 p-1.5">
                        <TabsTrigger 
                            value="chirurgiens" 
                            className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-lg data-[state=active]:border-indigo-200 data-[state=active]:border"
                        >
                            <Users className="h-4 w-4" />
                            <span className="font-semibold">Chirurgiens</span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="specialites" 
                            className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-lg data-[state=active]:border-indigo-200 data-[state=active]:border"
                        >
                            <Stethoscope className="h-4 w-4" />
                            <span className="font-semibold">Spécialités</span>
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="chirurgiens" className="mt-6">
                        <SurgeonsListPanel />
                    </TabsContent>
                    
                    <TabsContent value="specialites" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Stethoscope className="h-5 w-5" />
                                    <span>Gestion des Spécialités Chirurgicales</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <SpecialtyManager />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </motion.div>
        </div>
    );
}

// Garder la protection de la route
export default function ProtectedSurgeonsPage() {
    return (
        <ProtectedRoute allowedRoles={['ADMIN_TOTAL', 'ADMIN_PARTIEL']}>
            <SurgeonsPageContent />
        </ProtectedRoute>
    );
} 