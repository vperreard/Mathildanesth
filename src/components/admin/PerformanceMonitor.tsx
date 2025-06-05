"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Statistic, Table, Button, Spin, Alert, Tag, Progress } from 'antd';
import { useQueryPerformance } from '@/hooks/useQueryPerformance';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { usePerformance } from '@/context/PerformanceContext';

// Enregistrer les composants Chart.js nécessaires
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface PerformanceMonitorProps {
    refreshInterval?: number; // Intervalle de rafraîchissement en ms
    showCharts?: boolean; // Afficher les graphiques
}

/**
 * Tableau de bord de monitoring des performances de l'application
 * Affiche les métriques clés et les historiques pour analyser les performances
 * Les données sont persistantes entre les navigations
 */
export default function PerformanceMonitor({
    refreshInterval = 5000,
    showCharts = true,
}: PerformanceMonitorProps) {
    // Utilisation du hook de performance global
    const {
        lastQueryDuration,
        averageQueryDuration,
        slowestQuery,
        cacheStats,
        queryCount,
        pageLoadTimes,
        navigationHistory,
        resetMetrics
    } = useQueryPerformance();

    // Accès direct au contexte pour la simulation
    const { recordPageNavigation, recordQueryPerformance, updateCacheStats } = usePerformance();

    const [timestamp, setTimestamp] = useState<number>(Date.now());
    const [simulationCounter, setSimulationCounter] = useState(0);

    // Rafraîchir l'affichage régulièrement
    useEffect(() => {
        const interval = setInterval(() => {
            setTimestamp(Date.now());
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [refreshInterval]);

    // Formater la durée en ms
    const formatDuration = (ms: number | null): string => {
        if (ms === null) return 'N/A';
        return `${ms.toFixed(2)} ms`;
    };

    // Formater le timestamp en temps relatif
    const formatTime = (timestamp: number | undefined): string => {
        if (!timestamp) return 'N/A';

        const seconds = Math.floor((Date.now() - timestamp) / 1000);

        if (seconds < 60) return `il y a ${seconds}s`;
        if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `il y a ${Math.floor(seconds / 3600)}h`;
        return `il y a ${Math.floor(seconds / 86400)}j`;
    };

    // Fonction pour simuler une navigation et des accès au cache
    const simulateActivity = useCallback(() => {
        // Simuler une navigation
        const from = `/page-${simulationCounter}`;
        const to = `/page-${simulationCounter + 1}`;
        const duration = Math.random() * 500 + 50; // entre 50 et 550 ms
        recordPageNavigation(from, to, duration);

        // Simuler une requête
        const queryName = `getUsers-${simulationCounter}`;
        const queryDuration = Math.random() * 200 + 20; // entre 20 et 220 ms
        recordQueryPerformance(queryName, queryDuration);

        // Simuler des accès au cache
        const currentCacheStats = {
            size: cacheStats.size + 1,
            hits: cacheStats.hits + Math.floor(Math.random() * 3),
            misses: cacheStats.misses + Math.floor(Math.random() * 2),
            hitRate: 0
        };

        // Calculer le nouveau hit rate
        const totalRequests = currentCacheStats.hits + currentCacheStats.misses;
        currentCacheStats.hitRate = totalRequests > 0 ? currentCacheStats.hits / totalRequests : 0;

        updateCacheStats(currentCacheStats);

        // Incrémenter le compteur pour la prochaine simulation
        setSimulationCounter(prev => prev + 1);
    }, [simulationCounter, recordPageNavigation, recordQueryPerformance, updateCacheStats, cacheStats]);

    // Calculer la moyenne des temps de chargement des pages
    const averagePageLoadTime = useMemo(() => {
        if (pageLoadTimes.length === 0) return 0;
        return pageLoadTimes.reduce((sum, item) => sum + item.loadTime, 0) / pageLoadTimes.length;
    }, [pageLoadTimes]);

    // Calculer la moyenne des temps de navigation
    const averageNavigationTime = useMemo(() => {
        if (navigationHistory.length === 0) return 0;
        return navigationHistory.reduce((sum, item) => sum + item.duration, 0) / navigationHistory.length;
    }, [navigationHistory]);

    // Calculer les pages les plus lentes
    const slowestPages = useMemo(() => {
        return [...pageLoadTimes]
            .sort((a, b) => b.loadTime - a.loadTime)
            .slice(0, 5); // Top 5 des pages les plus lentes
    }, [pageLoadTimes]);

    // Calculer les navigations les plus lentes
    const slowestNavigations = useMemo(() => {
        return [...navigationHistory]
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 5); // Top 5 des navigations les plus lentes
    }, [navigationHistory]);

    // Préparer les données pour le graphique des temps de chargement
    const getLoadTimeChartData = () => {
        const lastItems = [...pageLoadTimes].slice(-10); // Derniers 10 éléments

        return {
            labels: lastItems.map(item => item.page.split('/').pop() || 'index'),
            datasets: [
                {
                    label: 'Temps de chargement (ms)',
                    data: lastItems.map(item => item.loadTime),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                },
            ],
        };
    };

    // Préparer les données pour le graphique des temps de navigation
    const getNavigationChartData = () => {
        const lastItems = [...navigationHistory].slice(-10); // Derniers 10 éléments

        return {
            labels: lastItems.map(item => `${item.from.split('/').pop() || 'index'} → ${item.to.split('/').pop() || 'index'}`),
            datasets: [
                {
                    label: 'Temps de navigation (ms)',
                    data: lastItems.map(item => item.duration),
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                },
            ],
        };
    };

    // Corrigeons l'erreur liée au pct au-dessus de la moyenne
    const renderPercentAboveAverage = (value: number, average: number) => {
        if (average <= 0) return <span>-</span>;

        const percent = Math.round((value - average) / average * 100);
        const textColor = percent > 50 ? '#cf1322' : percent > 20 ? '#faad14' : '#3f8600';

        return (
            <span style={{ color: textColor }}>
                {percent}%
            </span>
        );
    };

    // Options pour le graphique de barres
    const barChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Pages les plus lentes',
            },
            tooltip: {
                callbacks: {
                    label: (context: unknown) => {
                        const index = context.dataIndex;
                        const page = slowestPages[index]?.page || '';
                        const loadTime = slowestPages[index]?.loadTime || 0;
                        const percentAboveAverage = averagePageLoadTime > 0
                            ? Math.round((loadTime - averagePageLoadTime) / averagePageLoadTime * 100)
                            : 0;

                        return [
                            `Page: ${page}`,
                            `Temps: ${loadTime.toFixed(2)} ms`,
                            `${percentAboveAverage}% au-dessus de la moyenne`
                        ];
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Temps (ms)'
                }
            },
        },
    };

    // Options communes pour les graphiques
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Performances',
            },
        },
        scales: {
            y: {
                min: 0,
            },
        },
    };

    // Alertes et informations d'état
    const renderAlerts = () => {
        const alerts = [];

        if (navigationHistory.length === 0) {
            alerts.push(
                <Alert
                    key="nav-alert"
                    message="Aucune navigation enregistrée"
                    description="Utilisez le bouton 'Simuler activité' ci-dessous pour tester l'enregistrement des métriques."
                    type="info"
                    showIcon
                    className="mb-4"
                />
            );
        }

        if (cacheStats.size === 0 && cacheStats.hits === 0 && cacheStats.misses === 0) {
            alerts.push(
                <Alert
                    key="cache-alert"
                    message="Statistiques de cache non disponibles"
                    description="Le cache Prisma n'est peut-être pas activé ou les statistiques ne sont pas disponibles."
                    type="warning"
                    showIcon
                    className="mb-4"
                />
            );
        }

        // Alertes basées sur les performances
        if (pageLoadTimes.length > 0) {
            const maxPageLoadTime = Math.max(...pageLoadTimes.map(p => p.loadTime));
            if (maxPageLoadTime > 1000) {
                alerts.push(
                    <Alert
                        key="slow-page-alert"
                        message="Pages lentes détectées"
                        description={`Certaines pages prennent plus de 1 seconde à charger. Voir l'analyse détaillée ci-dessous.`}
                        type="warning"
                        showIcon
                        className="mb-4"
                    />
                );
            }
        }

        return alerts.length > 0 ? <div className="mb-6">{alerts}</div> : null;
    };

    // Préparer les données pour le graphique des temps de chargement pages
    // Utilisons une approche différente pour éviter les erreurs de typage complexes
    const renderSlowestPagesChart = () => {
        if (slowestPages.length === 0) return null;

        return (
            <div className="mb-4">
                <div className="text-sm text-gray-500 mb-2">
                    Temps de chargement moyen: <span className="font-medium">{averagePageLoadTime.toFixed(2)} ms</span>
                </div>
                <div className="h-80">
                    <Bar
                        data={{
                            labels: slowestPages.map(item => item.page.split('/').pop() || 'index'),
                            datasets: [
                                {
                                    type: 'bar' as const,
                                    label: 'Temps de chargement (ms)',
                                    data: slowestPages.map(item => item.loadTime),
                                    backgroundColor: slowestPages.map(item =>
                                        item.loadTime > 1000 ? 'rgba(255, 99, 132, 0.8)' :
                                            item.loadTime > 500 ? 'rgba(255, 159, 64, 0.8)' :
                                                'rgba(75, 192, 192, 0.8)'
                                    ),
                                    borderColor: 'rgba(0, 0, 0, 0.1)',
                                    borderWidth: 1,
                                }
                            ]
                        }}
                        options={barChartOptions}
                    />
                </div>
                <div className="text-xs text-gray-500 mt-2 flex items-center justify-end">
                    <div className="flex items-center mr-4">
                        <div className="w-3 h-3 bg-red-500 opacity-80 rounded mr-1"></div>
                        <span>&gt; 1000ms</span>
                    </div>
                    <div className="flex items-center mr-4">
                        <div className="w-3 h-3 bg-orange-500 opacity-80 rounded mr-1"></div>
                        <span>&gt; 500ms</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 opacity-80 rounded mr-1"></div>
                        <span>&lt; 500ms</span>
                    </div>
                    <div className="ml-4 pl-4 border-l border-gray-300">
                        <span>Moyenne: {averagePageLoadTime.toFixed(0)}ms</span>
                    </div>
                </div>
            </div>
        );
    };

    // Rendu de la section des pages les plus lentes
    const renderSlowestPages = () => {
        if (pageLoadTimes.length < 3) return null;

        return (
            <Card title="Analyse des pages les plus lentes" className="mt-8">
                {slowestPages.length > 0 ? (
                    <>
                        {renderSlowestPagesChart()}
                        <Table
                            dataSource={slowestPages}
                            rowKey={(record, index) => `slow-page-${index}`}
                            pagination={false}
                            size="small"
                        >
                            <Table.Column
                                title="Page"
                                dataIndex="page"
                                key="page"
                                render={(page) => <Tag color="purple">{page}</Tag>}
                            />
                            <Table.Column
                                title="Temps de chargement"
                                dataIndex="loadTime"
                                key="loadTime"
                                render={(loadTime) => (
                                    <span
                                        style={{
                                            color: loadTime > 1000 ? '#cf1322' : loadTime > 500 ? '#faad14' : '#3f8600',
                                        }}
                                    >
                                        {loadTime.toFixed(2)} ms
                                    </span>
                                )}
                                sorter={(a, b) => a.loadTime - b.loadTime}
                            />
                            <Table.Column
                                title="% au-dessus de la moyenne"
                                key="percentAboveAverage"
                                render={(_, record) => {
                                    const percent = averagePageLoadTime > 0
                                        ? ((record.loadTime - averagePageLoadTime) / averagePageLoadTime * 100).toFixed(0)
                                        : 0;
                                    return (
                                        <span style={{
                                            color: parseInt(percent) > 50 ? '#cf1322' :
                                                parseInt(percent) > 20 ? '#faad14' : '#3f8600'
                                        }}>
                                            {percent}%
                                        </span>
                                    );
                                }}
                            />
                            <Table.Column
                                title="Quand"
                                dataIndex="timestamp"
                                key="timestamp"
                                render={(timestamp) => formatTime(timestamp)}
                            />
                        </Table>
                    </>
                ) : (
                    <Alert message="Pas assez de données pour l'analyse" type="info" showIcon />
                )}
            </Card>
        );
    };

    // Rendu de la section des navigations les plus lentes
    const renderSlowestNavigations = () => {
        if (navigationHistory.length < 3) return null;

        return (
            <Card title="Analyse des navigations les plus lentes" className="mt-8">
                <div className="text-sm text-gray-500 mb-4">
                    Temps de navigation moyen: <span className="font-medium">{averageNavigationTime.toFixed(2)} ms</span>
                </div>
                <Table
                    dataSource={slowestNavigations}
                    rowKey={(record, index) => `slow-nav-${index}`}
                    pagination={false}
                    size="small"
                >
                    <Table.Column
                        title="De"
                        dataIndex="from"
                        key="from"
                        render={(from) => <Tag>{from}</Tag>}
                    />
                    <Table.Column
                        title="Vers"
                        dataIndex="to"
                        key="to"
                        render={(to) => <Tag color="blue">{to}</Tag>}
                    />
                    <Table.Column
                        title="Durée"
                        dataIndex="duration"
                        key="duration"
                        render={(duration) => (
                            <span
                                style={{
                                    color: duration > 500 ? '#cf1322' : duration > 200 ? '#faad14' : '#3f8600',
                                }}
                            >
                                {duration.toFixed(2)} ms
                            </span>
                        )}
                    />
                    <Table.Column
                        title="% au-dessus de la moyenne"
                        key="percentAboveAverage"
                        render={(_, record) => {
                            const percent = averageNavigationTime > 0
                                ? ((record.duration - averageNavigationTime) / averageNavigationTime * 100).toFixed(0)
                                : 0;
                            return (
                                <span style={{
                                    color: parseInt(percent) > 50 ? '#cf1322' :
                                        parseInt(percent) > 20 ? '#faad14' : '#3f8600'
                                }}>
                                    {percent}%
                                </span>
                            );
                        }}
                    />
                </Table>
            </Card>
        );
    };

    // Recommandations d'optimisation basées sur les métriques
    const renderOptimizationRecommendations = () => {
        const recommendations = [];

        if (cacheStats.hitRate < 0.5 && (cacheStats.hits > 0 || cacheStats.misses > 0)) {
            recommendations.push({
                id: 'cache',
                title: 'Améliorer la stratégie de cache',
                description: 'Le taux de succès du cache est inférieur à 50%. Envisagez d\'augmenter la durée de vie du cache ou d\'optimiser les clés.',
                priority: 'high'
            });
        }

        if (averagePageLoadTime > 800) {
            recommendations.push({
                id: 'pageload',
                title: 'Réduire le temps de chargement des pages',
                description: 'Le temps moyen de chargement des pages est supérieur à 800ms. Optimisez la taille des bundles JavaScript et le rendu côté serveur.',
                priority: 'high'
            });
        }

        if (slowestPages.some(p => p.loadTime > 1500)) {
            recommendations.push({
                id: 'slowpages',
                title: 'Optimiser les pages les plus lentes',
                description: 'Certaines pages prennent plus de 1,5 seconde à charger. Envisagez la virtualisation des composants ou le chargement différé.',
                priority: 'high'
            });
        }

        if (averageNavigationTime > 300) {
            recommendations.push({
                id: 'navigation',
                title: 'Améliorer les transitions entre pages',
                description: 'Les temps de navigation sont élevés. Optimisez le préchargement des données et la gestion d\'état.',
                priority: 'medium'
            });
        }

        if (slowestQuery && slowestQuery.duration > 500) {
            recommendations.push({
                id: 'queries',
                title: 'Optimiser les requêtes lentes',
                description: `La requête ${slowestQuery.name} a pris ${slowestQuery.duration.toFixed(0)}ms. Vérifiez les indices de la base de données et l'optimisation des requêtes.`,
                priority: 'medium'
            });
        }

        if (recommendations.length === 0) return null;

        return (
            <Card title="Recommandations d'optimisation" className="mt-8">
                {recommendations.map(rec => (
                    <Alert
                        key={rec.id}
                        message={rec.title}
                        description={rec.description}
                        type={rec.priority === 'high' ? 'warning' : 'info'}
                        showIcon
                        className="mb-3"
                    />
                ))}
            </Card>
        );
    };

    return (
        <div className="space-y-8">
            {renderAlerts()}

            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <Statistic
                        title="Cache Hit Rate"
                        value={cacheStats.hitRate * 100}
                        precision={2}
                        suffix="%"
                        valueStyle={{ color: cacheStats.hitRate > 0.7 ? '#3f8600' : '#cf1322' }}
                    />
                    <Progress
                        percent={Math.round(cacheStats.hitRate * 100)}
                        strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                        size="small"
                        className="mt-2"
                    />
                </Card>

                <Card>
                    <Statistic
                        title="Taille du cache"
                        value={cacheStats.size}
                        suffix="entrées"
                    />
                    <div className="mt-2 text-xs text-gray-500">
                        <span className="mr-2">Hits: {cacheStats.hits}</span>
                        <span>Misses: {cacheStats.misses}</span>
                    </div>
                </Card>

                <Card>
                    <Statistic
                        title="Dernière requête"
                        value={formatDuration(lastQueryDuration)}
                        valueStyle={{ color: lastQueryDuration && lastQueryDuration > 100 ? '#cf1322' : '#3f8600' }}
                    />
                    <div className="mt-2 text-xs text-gray-500">
                        <span>Moyenne: {formatDuration(averageQueryDuration)}</span>
                    </div>
                </Card>

                <Card>
                    <Statistic
                        title="Requête la plus lente"
                        value={formatDuration(slowestQuery?.duration || null)}
                        valueStyle={{ color: '#cf1322' }}
                    />
                    <div className="mt-2 text-xs text-gray-500 truncate" title={slowestQuery?.name}>
                        <span>{slowestQuery?.name?.substring(0, 30) || 'Aucune'}</span>
                        <div>{slowestQuery ? formatTime(slowestQuery.timestamp) : ''}</div>
                    </div>
                </Card>
            </div>

            {/* Tableau des dernières navigations */}
            <Card title={`Historique de navigation (${navigationHistory.length})`} className="w-full">
                {navigationHistory.length === 0 ? (
                    <Alert message="Aucune navigation enregistrée" type="info" showIcon />
                ) : (
                    <Table
                        dataSource={navigationHistory.slice().reverse()}
                        rowKey={(record, index) => `nav-${index}`}
                        pagination={{ defaultPageSize: 5 }}
                        size="small"
                    >
                        <Table.Column
                            title="De"
                            dataIndex="from"
                            key="from"
                            render={(from) => <Tag>{from || '/'}</Tag>}
                        />
                        <Table.Column
                            title="Vers"
                            dataIndex="to"
                            key="to"
                            render={(to) => <Tag color="blue">{to || '/'}</Tag>}
                        />
                        <Table.Column
                            title="Durée"
                            dataIndex="duration"
                            key="duration"
                            render={(duration) => (
                                <span
                                    style={{
                                        color: duration > 500 ? '#cf1322' : duration > 200 ? '#faad14' : '#3f8600',
                                    }}
                                >
                                    {duration.toFixed(2)} ms
                                </span>
                            )}
                            sorter={(a, b) => a.duration - b.duration}
                        />
                        <Table.Column
                            title="Quand"
                            dataIndex="timestamp"
                            key="timestamp"
                            render={(timestamp) => formatTime(timestamp)}
                            sorter={(a, b) => a.timestamp - b.timestamp}
                        />
                    </Table>
                )}
            </Card>

            {/* Tableau des temps de chargement */}
            <Card title={`Temps de chargement des pages (${pageLoadTimes.length})`} className="w-full">
                {pageLoadTimes.length === 0 ? (
                    <Alert message="Aucun temps de chargement enregistré" type="info" showIcon />
                ) : (
                    <Table
                        dataSource={pageLoadTimes.slice().reverse()}
                        rowKey={(record, index) => `load-${index}`}
                        pagination={{ defaultPageSize: 5 }}
                        size="small"
                    >
                        <Table.Column
                            title="Page"
                            dataIndex="page"
                            key="page"
                            render={(page) => <Tag color="purple">{page || '/'}</Tag>}
                        />
                        <Table.Column
                            title="Temps de chargement"
                            dataIndex="loadTime"
                            key="loadTime"
                            render={(loadTime) => (
                                <span
                                    style={{
                                        color: loadTime > 1000 ? '#cf1322' : loadTime > 500 ? '#faad14' : '#3f8600',
                                    }}
                                >
                                    {loadTime.toFixed(2)} ms
                                </span>
                            )}
                            sorter={(a, b) => a.loadTime - b.loadTime}
                        />
                        <Table.Column
                            title="Quand"
                            dataIndex="timestamp"
                            key="timestamp"
                            render={(timestamp) => formatTime(timestamp)}
                            sorter={(a, b) => a.timestamp - b.timestamp}
                        />
                    </Table>
                )}
            </Card>

            {/* Analyses avancées */}
            {renderSlowestPages()}
            {renderSlowestNavigations()}
            {renderOptimizationRecommendations()}

            {/* Graphiques */}
            {showCharts && (pageLoadTimes.length > 0 || navigationHistory.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {pageLoadTimes.length > 0 && (
                        <Card title="Graphique des temps de chargement">
                            <Line data={getLoadTimeChartData()} options={chartOptions} />
                        </Card>
                    )}

                    {navigationHistory.length > 0 && (
                        <Card title="Graphique des temps de navigation">
                            <Line data={getNavigationChartData()} options={chartOptions} />
                        </Card>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-4">
                <Button onClick={simulateActivity} type="primary">
                    Simuler activité
                </Button>
                <Button onClick={resetMetrics} danger>
                    Réinitialiser les métriques
                </Button>
            </div>
        </div>
    );
} 