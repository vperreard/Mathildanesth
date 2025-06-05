"use client";

import React, { useState, useEffect } from 'react';
import { logger } from "../../../lib/logger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, BarChart, ReferenceLine } from 'recharts';
import { Calendar, Loader2, AlertTriangle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LeavePeakAnalysis } from '@/services/analyticsService';

export default function LeavePeakAnalysisWidget() {
    const [data, setData] = useState<LeavePeakAnalysis[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Charger les données
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch('http://localhost:3000/api/analytics/leave-peak-analysis');

                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des données');
                }

                const result = await response.json();
                setData(result.data);
            } catch (err: any) {
                logger.error('Erreur lors du chargement des données:', err);
                setError(err.message || 'Erreur inconnue');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Formater l'étiquette du mois pour l'affichage
    const formatPeriod = (period: string) => {
        const [year, month] = period.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    };

    // Analyse des périodes de pics
    const getPeakPeriods = () => {
        if (!data.length) return [];

        return data
            .filter(item => item.requestCount > data.reduce((sum, d) => sum + d.requestCount, 0) / data.length)
            .sort((a, b) => b.requestCount - a.requestCount)
            .map(item => ({
                period: item.period,
                formattedPeriod: formatPeriod(item.period),
                requestCount: item.requestCount,
                isHolidayPeriod: item.isHolidayPeriod,
                isSchoolHoliday: item.isSchoolHoliday
            }));
    };

    const peakPeriods = getPeakPeriods();

    // Obtenir le taux moyen d'approbation
    const getAverageApprovalRate = () => {
        if (!data.length) return 0;
        return data.reduce((sum, item) => sum + item.approvalRate, 0) / data.length;
    };

    // Données formatées pour les graphiques
    const chartData = data.map(item => ({
        name: formatPeriod(item.period),
        period: item.period,
        demandes: item.requestCount,
        tauxApprobation: Math.round(item.approvalRate * 100),
        variation: item.previousPeriodDelta,
        isHolidayPeriod: item.isHolidayPeriod,
        isSchoolHoliday: item.isSchoolHoliday,
        trend: item.trend,
        fill: item.isHolidayPeriod ? '#ff8f00' : (item.isSchoolHoliday ? '#9c27b0' : '#2196f3')
    }));

    if (isLoading) {
        return (
            <Card className="w-full h-80">
                <CardHeader>
                    <CardTitle>Analyse des pics de demandes de congés</CardTitle>
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
                    <CardTitle>Analyse des pics de demandes de congés</CardTitle>
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
                <CardTitle>Analyse des pics de demandes de congés</CardTitle>
                <CardDescription>Tendance sur les 12 derniers mois</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="trends">
                    <TabsList className="mb-4">
                        <TabsTrigger value="trends">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Tendances
                        </TabsTrigger>
                        <TabsTrigger value="approval">
                            <Clock className="h-4 w-4 mr-2" />
                            Taux d'approbation
                        </TabsTrigger>
                        <TabsTrigger value="correlation">
                            <Calendar className="h-4 w-4 mr-2" />
                            Corrélations
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="trends">
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="name"
                                        angle={-45}
                                        textAnchor="end"
                                        height={70}
                                        interval={0}
                                    />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value, name) => {
                                            if (name === 'demandes') return [value, 'Demandes'];
                                            if (name === 'variation') return [`${value > 0 ? '+' : ''}${value.toFixed(1)}%`, 'Variation'];
                                            return [value, name];
                                        }}
                                        labelFormatter={(value) => `Période: ${value}`}
                                    />
                                    <Legend />
                                    <ReferenceLine y={data.reduce((sum, d) => sum + d.requestCount, 0) / data.length}
                                        stroke="#ff0000"
                                        strokeDasharray="3 3"
                                        label={{ value: 'Moyenne', position: 'left' }}
                                    />
                                    <Bar
                                        dataKey="demandes"
                                        fill="#8884d8"
                                        name="Demandes"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {peakPeriods.length > 0 && (
                            <div className="mt-4">
                                <h4 className="font-medium text-sm mb-2">Périodes de pics identifiées:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {peakPeriods.map(peak => (
                                        <Badge key={peak.period} variant={peak.isHolidayPeriod || peak.isSchoolHoliday ? "secondary" : "outline"}>
                                            {peak.formattedPeriod} ({peak.requestCount} demandes)
                                            {peak.isHolidayPeriod && <span className="ml-1">🎯</span>}
                                            {peak.isSchoolHoliday && <span className="ml-1">🏫</span>}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                    <div className="flex items-center">
                                        <span className="mr-1">🎯</span>
                                        <span>Jour férié</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="mr-1">🏫</span>
                                        <span>Vacances scolaires</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="approval">
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={chartData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="name"
                                        angle={-45}
                                        textAnchor="end"
                                        height={70}
                                        interval={0}
                                    />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip
                                        formatter={(value) => [`${value}%`, 'Taux d\'approbation']}
                                        labelFormatter={(value) => `Période: ${value}`}
                                    />
                                    <Legend />
                                    <ReferenceLine y={getAverageApprovalRate() * 100}
                                        stroke="#ff0000"
                                        strokeDasharray="3 3"
                                        label={{ value: 'Moyenne', position: 'left' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="tauxApprobation"
                                        stroke="#82ca9d"
                                        name="Taux d'approbation"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-4 flex justify-between text-sm">
                            <div>
                                <span className="font-medium">Taux moyen d'approbation: </span>
                                <span>{(getAverageApprovalRate() * 100).toFixed(1)}%</span>
                            </div>
                            <div>
                                <span className="font-medium">Taux le plus bas: </span>
                                <span>{(Math.min(...data.map(item => item.approvalRate)) * 100).toFixed(1)}% ({formatPeriod(data.reduce((min, item) => item.approvalRate < min.approvalRate ? item : min, data[0]).period)})</span>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="correlation">
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="name"
                                        angle={-45}
                                        textAnchor="end"
                                        height={70}
                                        interval={0}
                                    />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value, name) => {
                                            if (name === 'demandes') return [value, 'Demandes'];
                                            return [value, name];
                                        }}
                                        labelFormatter={(value, payload) => {
                                            const item = payload && payload[0] ? payload[0].payload : null;
                                            let label = `Période: ${value}`;
                                            if (item) {
                                                if (item.isHolidayPeriod) label += ' | Jour férié';
                                                if (item.isSchoolHoliday) label += ' | Vacances scolaires';
                                            }
                                            return label;
                                        }}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="demandes"
                                        name="Demandes"
                                        fill={(entry) => entry.fill}
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-4">
                            <h4 className="font-medium text-sm mb-2">Légende des couleurs:</h4>
                            <div className="flex gap-4 mt-2 text-xs">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-[#ff8f00] mr-1"></div>
                                    <span>Période de jours fériés</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-[#9c27b0] mr-1"></div>
                                    <span>Vacances scolaires</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-[#2196f3] mr-1"></div>
                                    <span>Période normale</span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
} 