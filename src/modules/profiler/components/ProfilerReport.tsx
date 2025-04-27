import React, { useMemo, useState } from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { ProfilerReport as ProfilerReportType, MetricType, PerformanceMetric } from '../types';

interface ProfilerReportProps {
    report: ProfilerReportType;
}

// Couleurs pour les différents types de métriques
const COLORS = {
    [MetricType.RULE_EVALUATION]: '#8884d8',
    [MetricType.RULE_EVALUATION_CACHED]: '#82ca9d',
    [MetricType.COMPONENT_RENDER]: '#ffc658',
    [MetricType.MEMORY_USAGE]: '#ff8042',
    [MetricType.API_CALL]: '#0088fe',
    [MetricType.DATABASE_QUERY]: '#00c49f'
};

const COLORS_ARRAY = Object.values(COLORS);

// Format pour les millisecondes
const formatMs = (value: number) => `${value.toFixed(2)} ms`;

// Format pour les octets en Megaoctets
const formatBytes = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;

/**
 * Composant pour afficher le rapport de profilage
 */
export const ProfilerReport: React.FC<ProfilerReportProps> = ({ report }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'components' | 'memory' | 'recommendations'>('overview');

    // Préparer les données pour les graphiques

    // Données de temps moyen par type de métrique
    const averageData = useMemo(() => {
        return Object.entries(report.averages).map(([type, data]) => ({
            type,
            avgDuration: data.avgDuration,
            count: data.count
        }));
    }, [report.averages]);

    // Données de mémoire
    const memoryData = useMemo(() => {
        return report.memoryUsage.samples.map((sample, index) => ({
            id: index,
            time: Math.round((sample.timestamp - Number(report.sessionId)) / 1000), // Convertir en secondes depuis le début
            value: sample.usedJSHeapSize || 0,
            percent: sample.usagePercentage || 0
        }));
    }, [report.memoryUsage.samples, report.sessionId]);

    // Top des opérations les plus lentes
    const topSlowOperations = useMemo(() => {
        return report.topDurations.slice(0, 10);
    }, [report.topDurations]);

    // Données pour la comparaison des règles avec/sans cache
    const cacheComparisonData = useMemo(() => {
        const ruleEval = report.averages[MetricType.RULE_EVALUATION];
        const ruleEvalCached = report.averages[MetricType.RULE_EVALUATION_CACHED];

        if (!ruleEval || !ruleEvalCached) return [];

        return [
            { name: 'Sans cache', value: ruleEval.avgDuration },
            { name: 'Avec cache', value: ruleEvalCached.avgDuration }
        ];
    }, [report.averages]);

    // Composants avec le temps de rendu moyen
    const componentRenderData = useMemo(() => {
        // Grouper les métriques par nom de composant
        const componentMetrics: Record<string, PerformanceMetric[]> = {};

        report.topDurations
            .filter(metric => metric.type === MetricType.COMPONENT_RENDER)
            .forEach(metric => {
                const name = metric.name.split('.')[0]; // Extraire le nom du composant
                if (!componentMetrics[name]) {
                    componentMetrics[name] = [];
                }
                componentMetrics[name].push(metric);
            });

        // Calculer le temps moyen pour chaque composant
        return Object.entries(componentMetrics).map(([name, metrics]) => {
            const totalDuration = metrics.reduce((sum, metric) => sum + (metric.duration || 0), 0);
            return {
                name,
                avgDuration: totalDuration / metrics.length,
                count: metrics.length
            };
        }).sort((a, b) => b.avgDuration - a.avgDuration);
    }, [report.topDurations]);

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Rapport de Profilage</h2>

            <div className="flex justify-between mb-6">
                <div className="bg-gray-100 rounded p-4 flex-1 mr-2">
                    <h3 className="text-lg font-semibold">Durée de session</h3>
                    <p className="text-2xl">{(report.duration / 1000).toFixed(2)} s</p>
                </div>
                <div className="bg-gray-100 rounded p-4 flex-1 mx-2">
                    <h3 className="text-lg font-semibold">Métriques collectées</h3>
                    <p className="text-2xl">{report.metricsCount}</p>
                </div>
                <div className="bg-gray-100 rounded p-4 flex-1 ml-2">
                    <h3 className="text-lg font-semibold">Utilisation mémoire</h3>
                    <p className="text-2xl">{formatBytes(report.memoryUsage.peak)}</p>
                </div>
            </div>

            {/* Navigation par onglets */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-2 px-1 border-b-2 ${activeTab === 'overview' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Vue d'ensemble
                    </button>
                    <button
                        onClick={() => setActiveTab('rules')}
                        className={`py-2 px-1 border-b-2 ${activeTab === 'rules' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Règles
                    </button>
                    <button
                        onClick={() => setActiveTab('components')}
                        className={`py-2 px-1 border-b-2 ${activeTab === 'components' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Composants
                    </button>
                    <button
                        onClick={() => setActiveTab('memory')}
                        className={`py-2 px-1 border-b-2 ${activeTab === 'memory' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Mémoire
                    </button>
                    <button
                        onClick={() => setActiveTab('recommendations')}
                        className={`py-2 px-1 border-b-2 ${activeTab === 'recommendations' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Recommandations
                    </button>
                </nav>
            </div>

            {/* Contenu de l'onglet */}
            <div className="mt-6">
                {/* Vue d'ensemble */}
                {activeTab === 'overview' && (
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Temps moyen par type d'opération</h3>
                        <div className="h-80 mb-8">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={averageData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="type" />
                                    <YAxis tickFormatter={formatMs} />
                                    <Tooltip formatter={(value: number) => formatMs(value)} />
                                    <Legend />
                                    <Bar dataKey="avgDuration" name="Temps moyen" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <h3 className="text-xl font-semibold mb-4">Top 10 des opérations les plus lentes</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="py-2 px-4 text-left">Nom</th>
                                        <th className="py-2 px-4 text-left">Type</th>
                                        <th className="py-2 px-4 text-right">Durée (ms)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topSlowOperations.map((op) => (
                                        <tr key={op.id} className="border-t">
                                            <td className="py-2 px-4">{op.name}</td>
                                            <td className="py-2 px-4">{op.type}</td>
                                            <td className="py-2 px-4 text-right">{op.duration?.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Onglet des règles */}
                {activeTab === 'rules' && (
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Comparaison d'évaluation des règles : avec vs sans cache</h3>
                        <div className="h-80 mb-8">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={cacheComparisonData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={formatMs} />
                                    <Tooltip formatter={(value: number) => formatMs(value)} />
                                    <Legend />
                                    <Bar dataKey="value" name="Temps moyen" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="bg-gray-100 rounded p-4">
                                <h3 className="text-lg font-semibold mb-2">Évaluation sans cache</h3>
                                <p className="font-mono">
                                    <span className="font-semibold">Temps moyen :</span> {formatMs(report.averages[MetricType.RULE_EVALUATION]?.avgDuration || 0)}
                                </p>
                                <p className="font-mono">
                                    <span className="font-semibold">Min :</span> {formatMs(report.averages[MetricType.RULE_EVALUATION]?.min || 0)}
                                </p>
                                <p className="font-mono">
                                    <span className="font-semibold">Max :</span> {formatMs(report.averages[MetricType.RULE_EVALUATION]?.max || 0)}
                                </p>
                                <p className="font-mono">
                                    <span className="font-semibold">Count :</span> {report.averages[MetricType.RULE_EVALUATION]?.count || 0}
                                </p>
                            </div>
                            <div className="bg-gray-100 rounded p-4">
                                <h3 className="text-lg font-semibold mb-2">Évaluation avec cache</h3>
                                <p className="font-mono">
                                    <span className="font-semibold">Temps moyen :</span> {formatMs(report.averages[MetricType.RULE_EVALUATION_CACHED]?.avgDuration || 0)}
                                </p>
                                <p className="font-mono">
                                    <span className="font-semibold">Min :</span> {formatMs(report.averages[MetricType.RULE_EVALUATION_CACHED]?.min || 0)}
                                </p>
                                <p className="font-mono">
                                    <span className="font-semibold">Max :</span> {formatMs(report.averages[MetricType.RULE_EVALUATION_CACHED]?.max || 0)}
                                </p>
                                <p className="font-mono">
                                    <span className="font-semibold">Count :</span> {report.averages[MetricType.RULE_EVALUATION_CACHED]?.count || 0}
                                </p>
                            </div>
                        </div>

                        {report.averages[MetricType.RULE_EVALUATION] && report.averages[MetricType.RULE_EVALUATION_CACHED] && (
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                                <h3 className="text-lg font-semibold text-blue-700 mb-2">Analyse du cache</h3>
                                <p className="text-blue-700">
                                    {report.averages[MetricType.RULE_EVALUATION].avgDuration > 0 && report.averages[MetricType.RULE_EVALUATION_CACHED].avgDuration > 0 ? (
                                        `Le cache des règles accélère le traitement d'un facteur x${(report.averages[MetricType.RULE_EVALUATION].avgDuration / report.averages[MetricType.RULE_EVALUATION_CACHED].avgDuration).toFixed(2)}`
                                    ) : (
                                        "Données insuffisantes pour analyser l'efficacité du cache"
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Onglet des composants */}
                {activeTab === 'components' && (
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Temps de rendu des composants</h3>
                        <div className="h-80 mb-8">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={componentRenderData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={formatMs} />
                                    <Tooltip formatter={(value: number) => formatMs(value)} />
                                    <Legend />
                                    <Bar dataKey="avgDuration" name="Temps moyen de rendu" fill="#ffc658" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <h3 className="text-xl font-semibold mb-4">Détails par composant</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="py-2 px-4 text-left">Composant</th>
                                        <th className="py-2 px-4 text-right">Temps moyen (ms)</th>
                                        <th className="py-2 px-4 text-right">Nombre de rendus</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {componentRenderData.map((comp, index) => (
                                        <tr key={index} className="border-t">
                                            <td className="py-2 px-4">{comp.name}</td>
                                            <td className="py-2 px-4 text-right">{comp.avgDuration.toFixed(2)}</td>
                                            <td className="py-2 px-4 text-right">{comp.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Onglet de la mémoire */}
                {activeTab === 'memory' && (
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Utilisation de la mémoire au fil du temps</h3>
                        <div className="h-80 mb-8">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={memoryData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="time"
                                        label={{ value: 'Temps (s)', position: 'insideBottomRight', offset: -10 }}
                                    />
                                    <YAxis
                                        tickFormatter={formatBytes}
                                        label={{ value: 'Mémoire utilisée (Mo)', angle: -90, position: 'insideLeft' }}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => formatBytes(value)}
                                        labelFormatter={(label) => `Temps: ${label}s`}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        name="Mémoire utilisée"
                                        stroke="#ff8042"
                                        activeDot={{ r: 8 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-3 gap-6 mb-8">
                            <div className="bg-gray-100 rounded p-4">
                                <h3 className="text-lg font-semibold mb-2">Mémoire moyenne</h3>
                                <p className="text-2xl">{formatBytes(report.memoryUsage.average)}</p>
                            </div>
                            <div className="bg-gray-100 rounded p-4">
                                <h3 className="text-lg font-semibold mb-2">Pic de mémoire</h3>
                                <p className="text-2xl">{formatBytes(report.memoryUsage.peak)}</p>
                            </div>
                            <div className="bg-gray-100 rounded p-4">
                                <h3 className="text-lg font-semibold mb-2">Échantillons</h3>
                                <p className="text-2xl">{report.memoryUsage.samples.length}</p>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                            <h3 className="text-lg font-semibold text-yellow-700 mb-2">Analyse de la mémoire</h3>
                            <p className="text-yellow-700">
                                {report.memoryUsage.peak > 0 && report.memoryUsage.samples[0]?.jsHeapSizeLimit ? (
                                    `L'application utilise ${((report.memoryUsage.peak / report.memoryUsage.samples[0].jsHeapSizeLimit) * 100).toFixed(2)}% de la limite de mémoire JavaScript.`
                                ) : (
                                    "Données insuffisantes pour analyser l'utilisation de la mémoire"
                                )}
                            </p>
                        </div>
                    </div>
                )}

                {/* Onglet des recommandations */}
                {activeTab === 'recommendations' && (
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Recommandations d'optimisation</h3>

                        {report.recommendations.length > 0 ? (
                            <ul className="space-y-4">
                                {report.recommendations.map((recommendation, index) => (
                                    <li key={index} className="bg-green-50 border-l-4 border-green-500 p-4">
                                        <p className="text-green-700">{recommendation}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 italic">Aucune recommandation disponible.</p>
                        )}

                        {report.averages[MetricType.COMPONENT_RENDER] && report.averages[MetricType.COMPONENT_RENDER].avgDuration > 30 && (
                            <div className="mt-6">
                                <h4 className="text-lg font-semibold mb-2">Optimisations générales des composants</h4>
                                <ul className="list-disc list-inside space-y-2 text-gray-700">
                                    <li>Utiliser React.memo pour les composants qui se re-rendent trop souvent sans changements</li>
                                    <li>Utiliser useMemo pour mémoriser les calculs coûteux</li>
                                    <li>Utiliser useCallback pour éviter les recréations de fonctions inutiles</li>
                                    <li>Réduire le nombre de state updates inutiles</li>
                                    <li>Considérer l'utilisation de la virtualisation pour les listes longues</li>
                                </ul>
                            </div>
                        )}

                        {report.averages[MetricType.RULE_EVALUATION] && (
                            <div className="mt-6">
                                <h4 className="text-lg font-semibold mb-2">Optimisations du moteur de règles</h4>
                                <ul className="list-disc list-inside space-y-2 text-gray-700">
                                    <li>Optimiser les algorithmes d'évaluation des règles complexes</li>
                                    <li>Augmenter la durée de vie du cache si les règles changent peu</li>
                                    <li>Réduire le nombre de règles évaluées en utilisant des règles préalables</li>
                                    <li>Utiliser des stratégies de lazy-loading pour les règles rarement utilisées</li>
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}; 