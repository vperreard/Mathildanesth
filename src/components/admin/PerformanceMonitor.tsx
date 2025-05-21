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
 * Affiche les métriques de cache et de performance des requêtes
 */
export default function PerformanceMonitor({
    refreshInterval = 10000,
    showCharts = true,
}: PerformanceMonitorProps) {
    const { metrics, isLoading, error, refreshMetrics } = useQueryPerformance();
    const [historicalData, setHistoricalData] = useState<Array<{
        timestamp: number;
        cacheHitRate: number;
        queryDuration: number | null;
    }>>([]);

    // Collecter les données historiques pour les graphiques
    useEffect(() => {
        const intervalId = setInterval(() => {
            setHistoricalData(prev => {
                // Limiter l'historique à 20 points pour éviter de surcharger le graphique
                const newData = [...prev, {
                    timestamp: Date.now(),
                    cacheHitRate: metrics.cacheHitRate * 100,
                    queryDuration: metrics.lastQueryDuration
                }];

                if (newData.length > 20) {
                    return newData.slice(-20);
                }

                return newData;
            });
        }, refreshInterval);

        return () => clearInterval(intervalId);
    }, [metrics, refreshInterval]);

    // Données pour le graphique de taux de cache
    const cacheHitRateChartData = {
        labels: historicalData.map(d => new Date(d.timestamp).toLocaleTimeString()),
        datasets: [
            {
                label: 'Taux de Cache (%)',
                data: historicalData.map(d => d.cacheHitRate),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4,
            }
        ]
    };

    // Données pour le graphique de durée des requêtes
    const queryDurationChartData = {
        labels: historicalData.map(d => new Date(d.timestamp).toLocaleTimeString()),
        datasets: [
            {
                label: 'Durée des requêtes (ms)',
                data: historicalData.map(d => d.queryDuration),
                borderColor: 'rgba(153, 102, 255, 1)',
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                tension: 0.4,
            }
        ]
    };

    return (
        <div className="performance-monitor space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold">Monitoring des Performances</h1>
                <Button
                    type="primary"
                    onClick={refreshMetrics}
                    loading={isLoading}
                >
                    Rafraîchir
                </Button>
            </div>

            {error && (
                <Alert
                    message="Erreur de chargement des métriques"
                    description={error.message}
                    type="error"
                    showIcon
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <Statistic
                        title="Taille du Cache"
                        value={metrics.cacheSize}
                        suffix="entrées"
                        loading={isLoading}
                    />
                </Card>
                <Card>
                    <Statistic
                        title="Hits / Misses"
                        value={`${metrics.cacheHits} / ${metrics.cacheMisses}`}
                        loading={isLoading}
                    />
                </Card>
                <Card>
                    <Statistic
                        title="Taux de Cache"
                        value={metrics.cacheHitRate * 100}
                        precision={2}
                        suffix="%"
                        loading={isLoading}
                        valueStyle={{
                            color: metrics.cacheHitRate > 0.7 ? '#3f8600' :
                                (metrics.cacheHitRate > 0.4 ? '#faad14' : '#cf1322')
                        }}
                    />
                    <Progress
                        percent={Math.round(metrics.cacheHitRate * 100)}
                        status={metrics.cacheHitRate > 0.7 ? 'success' :
                            (metrics.cacheHitRate > 0.4 ? 'normal' : 'exception')}
                    />
                </Card>
                <Card>
                    <Statistic
                        title="Durée moyenne des requêtes"
                        value={metrics.averageQueryDuration || 0}
                        precision={2}
                        suffix="ms"
                        loading={isLoading}
                        valueStyle={{
                            color: (metrics.averageQueryDuration || 0) < 100 ? '#3f8600' :
                                ((metrics.averageQueryDuration || 0) < 300 ? '#faad14' : '#cf1322')
                        }}
                    />
                </Card>
            </div>

            {/* Section de graphiques */}
            {showCharts && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <Card title="Évolution du taux de cache">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <Spin />
                            </div>
                        ) : (
                            <Line
                                data={cacheHitRateChartData}
                                options={{
                                    responsive: true,
                                    scales: {
                                        y: {
                                            min: 0,
                                            max: 100,
                                            ticks: {
                                                callback: (value) => `${value}%`
                                            }
                                        }
                                    }
                                }}
                            />
                        )}
                    </Card>
                    <Card title="Durée des dernières requêtes">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <Spin />
                            </div>
                        ) : (
                            <Line
                                data={queryDurationChartData}
                                options={{
                                    responsive: true,
                                    scales: {
                                        y: {
                                            ticks: {
                                                callback: (value) => `${value}ms`
                                            }
                                        }
                                    }
                                }}
                            />
                        )}
                    </Card>
                </div>
            )}

            {/* Requête la plus lente */}
            {metrics.slowestQuery && (
                <Card title="Requête la plus lente" className="mt-6">
                    <div className="flex justify-between items-center">
                        <span className="font-medium">{metrics.slowestQuery.name}</span>
                        <Tag color={metrics.slowestQuery.duration > 500 ? 'red' :
                            (metrics.slowestQuery.duration > 200 ? 'orange' : 'green')}
                        >
                            {metrics.slowestQuery.duration.toFixed(2)}ms
                        </Tag>
                    </div>
                </Card>
            )}
        </div>
    );
} 