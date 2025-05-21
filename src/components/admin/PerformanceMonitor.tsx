"use client";

import { useState, useEffect } from 'react';
import { Card, Statistic, Table, Button, Spin, Alert, Tag, Progress } from 'antd';
import { useQueryPerformance } from '@/hooks/useQueryPerformance';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// Enregistrer les composants Chart.js nécessaires
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
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

    const [timestamp, setTimestamp] = useState<number>(Date.now());

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

    return (
        <div className="space-y-8">
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
            </Card>

            {/* Tableau des temps de chargement des pages */}
            <Card title={`Temps de chargement des pages (${pageLoadTimes.length})`} className="w-full">
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
            </Card>

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
                <Button onClick={resetMetrics} danger>
                    Réinitialiser les métriques
                </Button>
            </div>
        </div>
    );
} 