'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Trash, Database, Key, AlertTriangle } from 'lucide-react';
import { getClientAuthToken } from '@/lib/auth-client-utils';

// Types pour les statistiques du cache
interface CacheStats {
    keys: number;
    hits: number;
    misses: number;
    ksize: number;
    vsize: number;
    hitRate: string;
    timestamp: string;
}

// Types pour les messages d'erreur/succès
interface StatusMessage {
    type: 'success' | 'error';
    text: string;
}

export default function CacheStatsPanel() {
    // États locaux
    const [stats, setStats] = useState<CacheStats | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [modelName, setModelName] = useState<string>('');
    const [cacheKey, setCacheKey] = useState<string>('');
    const [message, setMessage] = useState<StatusMessage | null>(null);
    const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
    const { toast } = useToast();

    // Charger les statistiques initiales
    useEffect(() => {
        fetchStats();
    }, []);

    // Configurer l'actualisation automatique
    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;

        if (autoRefresh) {
            intervalId = setInterval(() => {
                fetchStats();
            }, 10000); // Actualiser toutes les 10 secondes
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [autoRefresh]);

    // Récupérer les statistiques du cache
    const fetchStats = async () => {
        setLoading(true);
        try {
            const token = getClientAuthToken();

            if (!token) {
                throw new Error('Authentification requise');
            }

            const response = await fetch('http://localhost:3000/api/cache-stats', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de la récupération des statistiques du cache');
            }

            const data = await response.json();
            setStats(data.stats);
            setMessage(null);
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Erreur inconnue'
            });
        } finally {
            setLoading(false);
        }
    };

    // Invalider le cache (tout, un template ou une clé)
    const invalidateCache = async (action: 'invalidateAll' | 'invalidateModel' | 'invalidateKey') => {
        setLoading(true);
        try {
            const token = getClientAuthToken();

            if (!token) {
                throw new Error('Authentification requise');
            }

            const payload: Record<string, string> = { action };

            if (action === 'invalidateModel' && modelName) {
                payload.model = modelName;
            } else if (action === 'invalidateKey' && cacheKey) {
                payload.key = cacheKey;
            }

            const response = await fetch('http://localhost:3000/api/cache-stats', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de l\'invalidation du cache');
            }

            const data = await response.json();

            toast({
                title: 'Succès',
                description: data.message,
                variant: 'default',
            });

            // Rafraîchir les statistiques après invalidation
            fetchStats();
        } catch (error) {
            console.error('Erreur lors de l\'invalidation du cache:', error);
            toast({
                title: 'Erreur',
                description: error instanceof Error ? error.message : 'Erreur inconnue',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    // Afficher un message d'erreur si les statistiques ne sont pas disponibles
    if (!stats && message?.type === 'error') {
        return (
            <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{message.text}</AlertDescription>
            </Alert>
        );
    }

    // Calculer le pourcentage de hit rate pour la barre de progression
    const hitRatePercentage = stats ? parseFloat(stats.hitRate.replace('%', '')) : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Statistiques du Cache Prisma</span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchStats}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Actualiser
                        </Button>
                        <Button
                            variant={autoRefresh ? "default" : "outline"}
                            size="sm"
                            onClick={() => setAutoRefresh(!autoRefresh)}
                        >
                            {autoRefresh ? 'Auto: ON' : 'Auto: OFF'}
                        </Button>
                    </div>
                </CardTitle>
                <CardDescription>
                    Monitoring et gestion du cache de requêtes Prisma pour optimiser les performances
                </CardDescription>
            </CardHeader>

            <CardContent>
                {stats && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Entrées</p>
                                <p className="text-2xl font-bold">{stats.keys}</p>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Hits</p>
                                <p className="text-2xl font-bold text-green-600">{stats.hits}</p>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Misses</p>
                                <p className="text-2xl font-bold text-red-600">{stats.misses}</p>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Taille</p>
                                <p className="text-2xl font-bold">{Math.round(stats.vsize / 1024)} KB</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>Hit Rate</Label>
                                <span className="text-sm font-medium">{stats.hitRate}</span>
                            </div>
                            <Progress value={hitRatePercentage} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">
                                Mise à jour: {new Date(stats.timestamp).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                )}

                <Tabs defaultValue="all" className="mt-6">
                    <TabsList className="grid grid-cols-3">
                        <TabsTrigger value="all">Tout</TabsTrigger>
                        <TabsTrigger value="model">Par Modèle</TabsTrigger>
                        <TabsTrigger value="key">Par Clé</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="py-4">
                        <Alert>
                            <Database className="h-4 w-4" />
                            <AlertTitle>Attention</AlertTitle>
                            <AlertDescription>
                                Cette action va vider entièrement le cache Prisma. Toutes les requêtes suivantes
                                devront récupérer les données directement depuis la base de données.
                            </AlertDescription>
                        </Alert>

                        <Button
                            variant="destructive"
                            className="mt-4 w-full"
                            onClick={() => invalidateCache('invalidateAll')}
                            disabled={loading}
                        >
                            <Trash className="h-4 w-4 mr-2" />
                            Vider le cache complet
                        </Button>
                    </TabsContent>

                    <TabsContent value="model" className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="modelName">Nom du template</Label>
                            <Input
                                id="modelName"
                                placeholder="Ex: User, ActivityType, Attribution"
                                value={modelName}
                                onChange={(e) => setModelName(e.target.value)}
                            />
                            <p className="text-xs text-gray-500">
                                Entrez le nom exact du template Prisma dont vous souhaitez invalider le cache.
                            </p>
                        </div>

                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => invalidateCache('invalidateModel')}
                            disabled={loading || !modelName}
                        >
                            <Database className="h-4 w-4 mr-2" />
                            Vider le cache du template
                        </Button>
                    </TabsContent>

                    <TabsContent value="key" className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="cacheKey">Clé de cache</Label>
                            <Input
                                id="cacheKey"
                                placeholder="Ex: User:findMany:{...}"
                                value={cacheKey}
                                onChange={(e) => setCacheKey(e.target.value)}
                            />
                            <p className="text-xs text-gray-500">
                                Entrez la clé exacte du cache que vous souhaitez invalider.
                            </p>
                        </div>

                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => invalidateCache('invalidateKey')}
                            disabled={loading || !cacheKey}
                        >
                            <Key className="h-4 w-4 mr-2" />
                            Invalider cette clé
                        </Button>
                    </TabsContent>
                </Tabs>
            </CardContent>

            <CardFooter className="text-sm text-gray-500">
                Le cache Prisma améliore les performances en réduisant les requêtes à la base de données.
            </CardFooter>
        </Card>
    );
} 