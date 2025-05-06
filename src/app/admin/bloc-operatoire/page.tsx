'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTitle } from '@/components/ui/page-title';
import { ArrowRight, Building2, Layout, Settings } from 'lucide-react';
import Link from 'next/link';

/**
 * Page d'administration du bloc opératoire
 * 
 * Cette page permet d'accéder aux différentes fonctionnalités de gestion du bloc opératoire :
 * - Gestion des salles d'opération
 * - Gestion des secteurs
 * - Configuration des règles de supervision
 */
export default function BlocOperatoireAdminPage() {
    return (
        <div className="container mx-auto p-6 space-y-8">
            <PageTitle
                title="Administration du Bloc Opératoire"
                description="Gérez les paramètres du bloc opératoire"
                backUrl="/admin"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Carte pour la gestion des salles */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl">Salles d'opération</CardTitle>
                            <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <CardDescription>
                            Gérez les salles du bloc opératoire
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Ajoutez, modifiez ou supprimez les salles d'opération et configurez leurs caractéristiques.
                        </p>
                    </CardContent>
                    <CardFooter className="pt-2">
                        <Link href="/admin/bloc-operatoire/salles" className="flex items-center text-primary hover:underline ml-auto">
                            Accéder <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                    </CardFooter>
                </Card>

                {/* Carte pour la gestion des secteurs */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl">Secteurs</CardTitle>
                            <Layout className="h-6 w-6 text-primary" />
                        </div>
                        <CardDescription>
                            Organisez les salles en secteurs
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Définissez des secteurs avec codes couleur pour faciliter la planification et l'organisation du bloc opératoire.
                        </p>
                    </CardContent>
                    <CardFooter className="pt-2">
                        <Link href="/admin/bloc-operatoire/secteurs" className="flex items-center text-primary hover:underline ml-auto">
                            Accéder <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                    </CardFooter>
                </Card>

                {/* Carte pour les règles de supervision */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl">Règles de supervision</CardTitle>
                            <Settings className="h-6 w-6 text-primary" />
                        </div>
                        <CardDescription>
                            Configurez les règles d'affectation
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Définissez les règles de supervision et d'attribution des salles pour votre établissement.
                        </p>
                    </CardContent>
                    <CardFooter className="pt-2">
                        <Link href="/admin/bloc-operatoire/regles-supervision" className="flex items-center text-primary hover:underline ml-auto">
                            Accéder <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
} 