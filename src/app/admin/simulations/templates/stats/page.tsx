"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, BarChart2, PieChart, Loader2, RefreshCwIcon, DownloadIcon, InfoIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Composant fictif pour les graphiques (à remplacer par un vrai graphique avec Recharts)
const Chart = ({ type, data }: { type: 'bar' | 'pie'; data: any }) => {
    return (
        <div className="bg-gray-50 rounded-md border p-4 flex items-center justify-center h-64">
            <div className="text-center">
                <div className="mb-2">
                    {type === 'bar' ? (
                        <BarChart2 className="h-16 w-16 text-gray-400 mx-auto" />
                    ) : (
                        <PieChart className="h-16 w-16 text-gray-400 mx-auto" />
                    )}
                </div>
                <p className="text-muted-foreground text-sm">
                    Graphique {type === 'bar' ? 'à barres' : 'circulaire'}
                    {' - '}
                    {data?.length || 0} éléments
                </p>
                <p className="text-xs text-gray-400 mt-1">
                    Intégration graphique à implémenter avec Recharts
                </p>
            </div>
        </div>
    );
};

// Types pour les statistiques
interface TemplateUsageStats {
    templateId: string;
    templateName: string;
    usageCount: number;
    lastUsed: string;
}

interface CategoryUsageStats {
    category: string;
    count: number;
    percentage: number;
}

interface TemplateStats {
    totalTemplates: number;
    totalUsage: number;
    mostUsedTemplates: TemplateUsageStats[];
    categoryBreakdown: CategoryUsageStats[];
    recentlyUsed: TemplateUsageStats[];
}

export default function TemplateStatsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<TemplateStats | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Charger les statistiques (données fictives pour le moment)
    useEffect(() => {
        const loadStats = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Simuler un appel API
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Données factices de statistiques
                const mockStats: TemplateStats = {
                    totalTemplates: 24,
                    totalUsage: 187,
                    mostUsedTemplates: [
                        { templateId: '1', templateName: 'Planning vacances d\'été', usageCount: 42, lastUsed: '2023-08-15' },
                        { templateId: '2', templateName: 'Planning Noël', usageCount: 38, lastUsed: '2023-12-10' },
                        { templateId: '3', templateName: 'Planning vacances scolaires', usageCount: 31, lastUsed: '2023-10-22' },
                        { templateId: '4', templateName: 'Effectif réduit weekend', usageCount: 27, lastUsed: '2023-11-05' },
                        { templateId: '5', templateName: 'Période formation', usageCount: 21, lastUsed: '2023-09-18' },
                    ],
                    categoryBreakdown: [
                        { category: 'Vacances scolaires', count: 8, percentage: 33 },
                        { category: 'Effectif réduit', count: 6, percentage: 25 },
                        { category: 'Planning été', count: 4, percentage: 17 },
                        { category: 'Congés exceptionnels', count: 3, percentage: 12.5 },
                        { category: 'Autre', count: 3, percentage: 12.5 },
                    ],
                    recentlyUsed: [
                        { templateId: '7', templateName: 'Planning hiver 2024', usageCount: 12, lastUsed: '2023-12-18' },
                        { templateId: '9', templateName: 'Effectif weekend janvier', usageCount: 8, lastUsed: '2023-12-15' },
                        { templateId: '2', templateName: 'Planning Noël', usageCount: 38, lastUsed: '2023-12-10' },
                    ]
                };

                setStats(mockStats);
            } catch (err: any) {
                console.error('Erreur lors du chargement des statistiques:', err);
                setError(err.message || 'Erreur lors du chargement des statistiques');
                toast.error('Erreur lors du chargement des statistiques');
            } finally {
                setIsLoading(false);
            }
        };

        loadStats();
    }, []);

    const handleRefreshStats = () => {
        toast.info('Actualisation des statistiques...');
        // Rechargement des statistiques
        // Pour l'instant, nous réutilisons le même effet
        setIsLoading(true);
        setTimeout(() => {
            // Simuler un rechargement
            setIsLoading(false);
            toast.success('Statistiques actualisées');
        }, 1000);
    };

    const handleExportStats = () => {
        toast.info('Cette fonctionnalité sera disponible prochainement');
    };

    if (isLoading) {
        return (
            <div className="container p-4 mx-auto flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p>Chargement des statistiques...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container p-4 mx-auto flex flex-col items-center justify-center min-h-[60vh]">
                <InfoIcon className="h-10 w-10 text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Erreur</h2>
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={() => router.push('/admin/simulations/templates')}>
                    Retour à la liste des templates
                </Button>
            </div>
        );
    }

    return (
        <div className="container p-4 mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Link href="/admin/simulations/templates" className="inline-flex items-center text-sm text-primary hover:underline mb-2">
                        <ArrowLeftIcon className="mr-2 h-4 w-4" />
                        Retour à la liste des templates
                    </Link>
                    <h1 className="text-2xl font-bold">Statistiques d'Utilisation des Templates</h1>
                    <p className="text-muted-foreground">
                        Analyse de l'utilisation et des tendances des templates de simulation
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={handleRefreshStats}
                        disabled={isLoading}
                    >
                        <RefreshCwIcon className="h-4 w-4 mr-2" />
                        Actualiser
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExportStats}
                    >
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Exporter
                    </Button>
                </div>
            </div>

            {/* Résumé des statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Nombre total de templates</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{stats?.totalTemplates || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Utilisations totales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{stats?.totalUsage || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Moyenne d'utilisation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">
                            {stats && stats.totalTemplates > 0
                                ? Math.round((stats.totalUsage / stats.totalTemplates) * 10) / 10
                                : 0}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Onglets pour différentes vues */}
            <Tabs defaultValue="usage" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="usage">Utilisation</TabsTrigger>
                    <TabsTrigger value="categories">Catégories</TabsTrigger>
                    <TabsTrigger value="recent">Récemment utilisés</TabsTrigger>
                </TabsList>

                <TabsContent value="usage">
                    <Card>
                        <CardHeader>
                            <CardTitle>Templates les plus utilisés</CardTitle>
                            <CardDescription>
                                Classement des templates par nombre d'utilisations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Chart type="bar" data={stats?.mostUsedTemplates} />

                            {/* Tableau des données */}
                            <div className="mt-6 overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 font-medium">Template</th>
                                            <th className="text-center py-2 font-medium">Utilisations</th>
                                            <th className="text-right py-2 font-medium">Dernière utilisation</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats?.mostUsedTemplates.map((item) => (
                                            <tr key={item.templateId} className="border-b hover:bg-gray-50">
                                                <td className="py-2">
                                                    <Link
                                                        href={`/admin/simulations/templates/${item.templateId}/edit`}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {item.templateName}
                                                    </Link>
                                                </td>
                                                <td className="text-center py-2">{item.usageCount}</td>
                                                <td className="text-right py-2">
                                                    {new Date(item.lastUsed).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="categories">
                    <Card>
                        <CardHeader>
                            <CardTitle>Répartition par catégorie</CardTitle>
                            <CardDescription>
                                Distribution des templates par catégorie
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Chart type="pie" data={stats?.categoryBreakdown} />

                            {/* Tableau des données */}
                            <div className="mt-6 overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 font-medium">Catégorie</th>
                                            <th className="text-center py-2 font-medium">Nombre de templates</th>
                                            <th className="text-right py-2 font-medium">Pourcentage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats?.categoryBreakdown.map((item) => (
                                            <tr key={item.category} className="border-b hover:bg-gray-50">
                                                <td className="py-2">{item.category}</td>
                                                <td className="text-center py-2">{item.count}</td>
                                                <td className="text-right py-2">{item.percentage}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="recent">
                    <Card>
                        <CardHeader>
                            <CardTitle>Templates récemment utilisés</CardTitle>
                            <CardDescription>
                                Templates utilisés au cours des 30 derniers jours
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 font-medium">Template</th>
                                            <th className="text-center py-2 font-medium">Utilisations</th>
                                            <th className="text-right py-2 font-medium">Dernière utilisation</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats?.recentlyUsed.map((item) => (
                                            <tr key={item.templateId} className="border-b hover:bg-gray-50">
                                                <td className="py-2">
                                                    <Link
                                                        href={`/admin/simulations/templates/${item.templateId}/edit`}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {item.templateName}
                                                    </Link>
                                                </td>
                                                <td className="text-center py-2">{item.usageCount}</td>
                                                <td className="text-right py-2">
                                                    {new Date(item.lastUsed).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                        <CardFooter className="text-muted-foreground text-sm">
                            Note: Ces statistiques sont mises à jour quotidiennement
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 