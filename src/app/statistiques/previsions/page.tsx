"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, BarChart2, TrendingUp, Clock } from 'lucide-react';
import GuardDutyDistributionWidget from '@/components/dashboard/widgets/GuardDutyDistributionWidget';
import LeavePeakAnalysisWidget from '@/components/dashboard/widgets/LeavePeakAnalysisWidget';
import PredictiveInsightsWidget from '@/components/dashboard/widgets/PredictiveInsightsWidget';

export default function PredictiveAnalyticsPage() {
    return (
        <div className="container mx-auto py-6 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Analytique Avancée & Prévisions</h1>
                <p className="text-muted-foreground">
                    Analyse prédictive et statistiques avancées pour anticiper les besoins et optimiser la planification
                </p>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="overview">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Vue d'ensemble
                    </TabsTrigger>
                    <TabsTrigger value="guardDuty">
                        <Clock className="h-4 w-4 mr-2" />
                        Gardes & Astreintes
                    </TabsTrigger>
                    <TabsTrigger value="leaveTrends">
                        <Calendar className="h-4 w-4 mr-2" />
                        Tendances Congés
                    </TabsTrigger>
                    <TabsTrigger value="insights">
                        <BarChart2 className="h-4 w-4 mr-2" />
                        Insights Prédictifs
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h2 className="text-lg font-medium mb-4">Prévisions et Alertes</h2>
                            <PredictiveInsightsWidget />
                        </div>
                        <div>
                            <h2 className="text-lg font-medium mb-4">Distribution des Gardes</h2>
                            <GuardDutyDistributionWidget />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-medium mb-4">Tendances des Congés</h2>
                        <LeavePeakAnalysisWidget />
                    </div>
                </TabsContent>

                <TabsContent value="guardDuty">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-lg font-medium mb-4">Analyse Détaillée des Gardes et Astreintes</h2>
                            <GuardDutyDistributionWidget />
                        </div>
                        <div className="p-6 bg-muted rounded-lg">
                            <h3 className="text-lg font-medium mb-2">À propos de cette analyse</h3>
                            <p className="text-muted-foreground">
                                Cette analyse montre la répartition des gardes et astreintes par personne sur les 3 derniers mois.
                                Le score pondéré tient compte du type d'activité (les gardes comptant davantage que les astreintes)
                                et de la durée totale des services.
                            </p>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-card p-4 rounded-md">
                                    <h4 className="font-medium mb-1">Équilibre des gardes</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Un écart de plus de 30% dans le score pondéré entre les personnels
                                        peut indiquer un déséquilibre qui devrait être corrigé dans les plannings futurs.
                                    </p>
                                </div>
                                <div className="bg-card p-4 rounded-md">
                                    <h4 className="font-medium mb-1">Optimisation</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Utilisez ces données pour établir une rotation plus équitable des gardes
                                        et garantir le respect des temps de repos.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="leaveTrends">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-lg font-medium mb-4">Analyse Des Tendances de Congés</h2>
                            <LeavePeakAnalysisWidget />
                        </div>
                        <div className="p-6 bg-muted rounded-lg">
                            <h3 className="text-lg font-medium mb-2">Comprendre les pics de demandes</h3>
                            <p className="text-muted-foreground">
                                Cette analyse met en évidence les périodes où les demandes de congés sont les plus nombreuses
                                et leur corrélation avec des périodes spéciales (vacances scolaires, jours fériés).
                            </p>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-card p-4 rounded-md">
                                    <h4 className="font-medium mb-1">Anticipation des besoins</h4>
                                    <p className="text-sm text-muted-foreground">
                                        En identifiant les périodes de forte demande à l'avance, vous pouvez
                                        ajuster les quotas et prévoir des renforts si nécessaire.
                                    </p>
                                </div>
                                <div className="bg-card p-4 rounded-md">
                                    <h4 className="font-medium mb-1">Optimisation des approbations</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Le taux d'approbation peut être optimisé en établissant des quotas
                                        adaptés aux périodes de forte demande.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="insights">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-lg font-medium mb-4">Insights Prédictifs</h2>
                            <PredictiveInsightsWidget />
                        </div>
                        <div className="p-6 bg-muted rounded-lg">
                            <h3 className="text-lg font-medium mb-2">À propos des prédictions</h3>
                            <p className="text-muted-foreground">
                                Les insights prédictifs sont générés à partir de l'analyse des données historiques,
                                des tendances saisonnières et des corrélations identifiées. Ils vous aident à anticiper
                                les situations potentiellement problématiques.
                            </p>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-card p-4 rounded-md">
                                    <h4 className="font-medium mb-1">Modèle prédictif</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Notre template s'améliore avec le temps en apprenant des données collectées.
                                        Plus vous utilisez le système, plus les prédictions seront précises.
                                    </p>
                                </div>
                                <div className="bg-card p-4 rounded-md">
                                    <h4 className="font-medium mb-1">Actions recommandées</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Chaque insight s'accompagne de suggestions d'actions concrètes pour
                                        atténuer les risques identifiés.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
} 