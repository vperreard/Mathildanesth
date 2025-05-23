"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Shield, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GuardDutyDistribution } from '@/services/analyticsService';

// Type pour les options de visualisation
type ViewMode = 'guardCount' | 'onCallCount' | 'totalHours' | 'weightedScore';

export default function GuardDutyDistributionWidget() {
    const [data, setData] = useState<GuardDutyDistribution[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('weightedScore');

    // Charger les données
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/analytics/duty-distribution');

                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des données');
                }

                const result = await response.json();
                setData(result.data);
            } catch (err: any) {
                console.error('Erreur lors du chargement des données:', err);
                setError(err.message || 'Erreur inconnue');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Obtenir les labels pour l'axe X et les champs selon le mode de visualisation
    const getAxisConfig = () => {
        switch (viewMode) {
            case 'guardCount':
                return {
                    dataKey: 'guardCount',
                    color: '#8884d8',
                    label: 'Nombre de gardes',
                    icon: <Shield className="h-4 w-4 mr-2" />
                };
            case 'onCallCount':
                return {
                    dataKey: 'onCallCount',
                    color: '#82ca9d',
                    label: 'Nombre d\'astreintes',
                    icon: <Clock className="h-4 w-4 mr-2" />
                };
            case 'totalHours':
                return {
                    dataKey: 'totalHours',
                    color: '#ffc658',
                    label: 'Heures totales',
                    icon: <Clock className="h-4 w-4 mr-2" />
                };
            case 'weightedScore':
            default:
                return {
                    dataKey: 'weightedScore',
                    color: '#ff7300',
                    label: 'Score pondéré',
                    icon: <Shield className="h-4 w-4 mr-2" />
                };
        }
    };

    const { dataKey, color, label, icon } = getAxisConfig();

    // Préparer les données pour le graphique
    const chartData = [...data]
        .sort((a, b) => (b[dataKey as keyof GuardDutyDistribution] as number) - (a[dataKey as keyof GuardDutyDistribution] as number))
        .slice(0, 7); // Limiter à 7 utilisateurs pour la lisibilité

    if (isLoading) {
        return (
            <Card className="w-full h-80">
                <CardHeader>
                    <CardTitle>Distribution des gardes et astreintes</CardTitle>
                    <CardDescription>Chargement des données...</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-56">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="w-full h-80">
                <CardHeader>
                    <CardTitle>Distribution des gardes et astreintes</CardTitle>
                    <CardDescription>Une erreur est survenue</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-56 gap-2">
                    <AlertTriangle className="h-10 w-10 text-red-500" />
                    <p className="text-red-500">{error}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Distribution des gardes et astreintes</CardTitle>
                        <CardDescription>Analyse sur les 3 derniers mois</CardDescription>
                    </div>
                    <Select
                        value={viewMode}
                        onValueChange={(value: string) => setViewMode(value as ViewMode)}
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Choisir une métrique" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="guardCount">Nombre de gardes</SelectItem>
                            <SelectItem value="onCallCount">Nombre d'astreintes</SelectItem>
                            <SelectItem value="totalHours">Heures totales</SelectItem>
                            <SelectItem value="weightedScore">Score pondéré</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center mb-2 text-sm">
                    {icon}
                    <span>{label} par personne</span>
                </div>

                <div className="h-[350px] mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="userName"
                                angle={-45}
                                textAnchor="end"
                                height={70}
                                interval={0}
                            />
                            <YAxis />
                            <Tooltip
                                formatter={(value, name) => [value, label]}
                                labelFormatter={(value) => `Utilisateur: ${value}`}
                            />
                            <Bar
                                dataKey={dataKey}
                                fill={color}
                                name={label}
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
} 