'use client';

import React from 'react';
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
    ArcElement,
    Filler,
    ChartData,
    ChartOptions,
    ScatterDataPoint,
    ChartTypeRegistry
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { cn } from '@/lib/utils';

// Enregistrer les composants nécessaires pour Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Type pour les types de graphiques supportés
export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut';

interface ChartProps<T extends keyof ChartTypeRegistry = ChartType> {
    data: ChartData<T>;
    options?: ChartOptions<T>;
    type: T;
    className?: string;
    height?: number;
    width?: number;
}

export function Chart<T extends keyof ChartTypeRegistry = ChartType>({
    data,
    options,
    type,
    className,
    height,
    width
}: ChartProps<T>) {
    const chartOptions: ChartOptions<T> = {
        responsive: true,
        maintainAspectRatio: false,
        ...options
    } as ChartOptions<T>;

    const renderChart = () => {
        switch (type) {
            case 'line':
                return <Line data={data as ChartData<'line'>} options={chartOptions as ChartOptions<'line'>} />;
            case 'bar':
                return <Bar data={data as ChartData<'bar'>} options={chartOptions as ChartOptions<'bar'>} />;
            case 'pie':
                return <Pie data={data as ChartData<'pie'>} options={chartOptions as ChartOptions<'pie'>} />;
            case 'doughnut':
                return <Doughnut data={data as ChartData<'doughnut'>} options={chartOptions as ChartOptions<'doughnut'>} />;
            default:
                return <Line data={data as ChartData<'line'>} options={chartOptions as ChartOptions<'line'>} />;
        }
    };

    return (
        <div
            className={cn("relative", className)}
            style={{
                height: height || '100%',
                width: width || '100%'
            }}
        >
            {renderChart()}
        </div>
    );
}

// Exemples de données et options pour faciliter l'utilisation

export const lineChartDefaultOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            text: 'Graphique linéaire',
        },
    },
    scales: {
        y: {
            beginAtZero: true,
        },
    },
};

export const barChartDefaultOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            text: 'Graphique à barres',
        },
    },
    scales: {
        y: {
            beginAtZero: true,
        },
    },
};

export const pieChartDefaultOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            text: 'Graphique circulaire',
        },
    },
};

export const doughnutChartDefaultOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            text: 'Graphique en anneau',
        },
    },
};

// Génère des données aléatoires pour les exemples
export const generateRandomData = (count: number = 7): number[] => {
    return Array.from({ length: count }, () => Math.floor(Math.random() * 100));
};

export const createSampleChartData = (
    labels: string[] = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
): ChartData<'line'> => {
    return {
        labels,
        datasets: [
            {
                label: 'Données 1',
                data: generateRandomData(),
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
            {
                label: 'Données 2',
                data: generateRandomData(),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
        ],
    };
};

export default Chart; 