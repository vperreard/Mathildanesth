"use client";

import React, { useState, useEffect } from 'react';
import { logger } from "../../../lib/logger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2, TrendingUp, Calendar, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { PredictiveInsight } from '@/services/analyticsService';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export default function PredictiveInsightsWidget() {
    const [insights, setInsights] = useState<PredictiveInsight[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Charger les données
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch('http://localhost:3000/api/analytics/predictive-insights');

                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des données');
                }

                const result = await response.json();
                setInsights(result.data);
            } catch (err: unknown) {
                logger.error('Erreur lors du chargement des insights:', err);
                setError(err.message || 'Erreur inconnue');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Formater la date pour l'affichage
    const formatPeriod = (period: string) => {
        const [year, month] = period.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    };

    // Obtenir l'icône selon le type d'insight
    const getInsightIcon = (type: string) => {
        switch (type) {
            case 'leave_request':
                return <Calendar className="h-5 w-5 text-blue-500" />;
            case 'staffing_issue':
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            case 'guard_imbalance':
                return <Clock className="h-5 w-5 text-amber-500" />;
            default:
                return <TrendingUp className="h-5 w-5 text-gray-500" />;
        }
    };

    // Déterminer la couleur du fond selon la probabilité
    const getAlertVariant = (probability: number) => {
        if (probability >= 0.8) return "destructive";
        if (probability >= 0.7) return "warning";
        return "default";
    };

    // Formater le titre selon le type d'insight
    const formatInsightTitle = (insight: PredictiveInsight) => {
        switch (insight.type) {
            case 'leave_request':
                return `Prévision de congés - ${formatPeriod(insight.affectedPeriod)}`;
            case 'staffing_issue':
                return `Risque de sous-effectif - ${formatPeriod(insight.affectedPeriod)}`;
            case 'guard_imbalance':
                return `Déséquilibre de gardes - ${formatPeriod(insight.affectedPeriod)}`;
            default:
                return `Prévision - ${formatPeriod(insight.affectedPeriod)}`;
        }
    };

    if (isLoading) {
        return (
            <Card className="w-full h-80">
                <CardHeader>
                    <CardTitle>Insights prédictifs</CardTitle>
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
                    <CardTitle>Insights prédictifs</CardTitle>
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
                <CardTitle>Insights prédictifs</CardTitle>
                <CardDescription>Prévisions et alertes pour les 3 prochains mois</CardDescription>
            </CardHeader>
            <CardContent>
                {insights.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                        <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                        <p>Aucun insight prédictif disponible pour le moment.</p>
                        <p className="text-sm mt-1">Les prévisions seront générées automatiquement à mesure que les données s'accumulent.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {insights.sort((a, b) => b.probability - a.probability).map((insight, index) => (
                            <Alert key={index} variant={getAlertVariant(insight.probability)}>
                                <div className="flex items-start gap-3">
                                    {getInsightIcon(insight.type)}
                                    <div className="flex-1">
                                        <AlertTitle className="text-base font-medium">
                                            {formatInsightTitle(insight)}
                                        </AlertTitle>
                                        <AlertDescription className="mt-1">
                                            <p>{insight.description}</p>
                                            {insight.suggestedAction && (
                                                <p className="text-sm font-medium mt-1">
                                                    Suggestion: {insight.suggestedAction}
                                                </p>
                                            )}
                                            <div className="mt-2">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span>Probabilité</span>
                                                    <span>{Math.round(insight.probability * 100)}%</span>
                                                </div>
                                                <Progress value={insight.probability * 100} className="h-1.5" />
                                            </div>
                                        </AlertDescription>
                                    </div>
                                </div>
                            </Alert>
                        ))}

                        <div className="mt-6 text-center">
                            <Button variant="outline" size="sm" className="text-xs">
                                <span>Voir toutes les prévisions</span>
                                <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 