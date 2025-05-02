import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress, useTheme, Chip } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions
} from 'chart.js';
import { fr } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import { TrendingDown } from '@mui/icons-material';

// Enregistrer les composants Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface TeamAvailabilityChartProps {
    data?: Array<{
        date: string;
        availabilityPercentage: number;
        totalTeamMembers: number;
        availableMembers: number;
    }>;
    isLoading?: boolean;
    error?: string;
    title?: string;
    departmentName?: string;
}

const TeamAvailabilityChart: React.FC<TeamAvailabilityChartProps> = ({
    data = [],
    isLoading = false,
    error,
    title = 'Prévision de disponibilité d\'équipe',
    departmentName
}) => {
    const theme = useTheme();

    // Trouver la date avec la disponibilité la plus faible
    const lowestAvailability = useMemo(() => {
        if (!data || data.length === 0) return null;

        return data.reduce((lowest, current) => {
            if (current.availabilityPercentage < (lowest?.availabilityPercentage || 100)) {
                return current;
            }
            return lowest;
        }, data[0]);
    }, [data]);

    // Calculer la disponibilité moyenne
    const averageAvailability = useMemo(() => {
        if (!data || data.length === 0) return 0;

        const sum = data.reduce((acc, item) => acc + item.availabilityPercentage, 0);
        return Math.round((sum / data.length) * 10) / 10;
    }, [data]);

    // Préparer les données pour Chart.js
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return { labels: [], datasets: [] };

        const labels = data.map(item => format(parseISO(item.date), 'dd MMM', { locale: fr }));

        // Définir les seuils de couleur
        const backgroundColors = data.map(item => {
            if (item.availabilityPercentage < 60) {
                return 'rgba(244, 67, 54, 0.7)'; // Rouge pour critique
            } else if (item.availabilityPercentage < 80) {
                return 'rgba(255, 152, 0, 0.7)'; // Orange pour attention
            } else {
                return 'rgba(76, 175, 80, 0.7)'; // Vert pour bon
            }
        });

        return {
            labels,
            datasets: [
                {
                    label: 'Disponibilité (%)',
                    data: data.map(item => item.availabilityPercentage),
                    backgroundColor: backgroundColors,
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        };
    }, [data]);

    // Options du graphique
    const options: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const dataIndex = context.dataIndex;
                        const dataPoint = data[dataIndex];
                        return [
                            `Disponibilité: ${dataPoint.availabilityPercentage}%`,
                            `Membres disponibles: ${dataPoint.availableMembers}/${dataPoint.totalTeamMembers}`
                        ];
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                }
            },
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    callback: (value) => `${value}%`
                }
            }
        }
    };

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6">
                        {title}
                        {departmentName && <Typography component="span" color="text.secondary"> - {departmentName}</Typography>}
                    </Typography>

                    {!isLoading && !error && data.length > 0 && (
                        <Chip
                            label={`Moyenne: ${averageAvailability}%`}
                            color={averageAvailability < 70 ? 'warning' : 'success'}
                            size="small"
                        />
                    )}
                </Box>

                {lowestAvailability && lowestAvailability.availabilityPercentage < 60 && (
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 1,
                        mb: 2,
                        bgcolor: 'error.light',
                        borderRadius: 1,
                        color: 'error.contrastText'
                    }}>
                        <TrendingDown sx={{ mr: 1 }} />
                        <Typography variant="body2">
                            Disponibilité critique le {format(parseISO(lowestAvailability.date), 'dd MMMM', { locale: fr })} :
                            seulement {lowestAvailability.availabilityPercentage}% de l'équipe disponible
                            ({lowestAvailability.availableMembers}/{lowestAvailability.totalTeamMembers} membres)
                        </Typography>
                    </Box>
                )}

                <Box sx={{ height: 250, position: 'relative' }}>
                    {isLoading && (
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 1,
                            backgroundColor: 'rgba(255, 255, 255, 0.7)'
                        }}>
                            <CircularProgress />
                        </Box>
                    )}

                    {error && (
                        <Box sx={{
                            p: 2,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%'
                        }}>
                            <Typography color="error">{error}</Typography>
                        </Box>
                    )}

                    {!isLoading && !error && data.length === 0 && (
                        <Box sx={{
                            p: 2,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%'
                        }}>
                            <Typography color="textSecondary">Aucune donnée disponible</Typography>
                        </Box>
                    )}

                    {!isLoading && !error && data.length > 0 && (
                        <Bar data={chartData} options={options} />
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default TeamAvailabilityChart; 