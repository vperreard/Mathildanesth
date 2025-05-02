'use client';

import React, { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useDashboard } from '@/hooks/useDashboard';
import { useTheme } from '@/hooks/useTheme';
import { usePreferences } from '@/hooks/usePreferences';
import { Widget } from '@/types/dashboard';
import { DashboardGrid } from './DashboardGrid';
import { ThemeSelector } from './ThemeSelector';
import { PreferencesModal } from './PreferencesModal';

export const Dashboard: React.FC = () => {
    const { dashboard, loading, error, addWidget, removeWidget, updateWidgets, updateWidgetSize, updateWidget } = useDashboard();
    const { sendNotification } = useNotifications();
    const { currentTheme } = useTheme();
    const { preferences } = usePreferences();
    const [showPreferences, setShowPreferences] = useState(false);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Erreur !</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            </div>
        );
    }

    const handleAddWidget = () => {
        const newWidget: Omit<Widget, 'id'> = {
            type: 'stat',
            title: 'Nouveau widget',
            data: {
                value: 0,
                label: 'Valeur',
                change: 0,
                changeType: 'increase'
            },
            position: { x: 0, y: 0 },
            size: { width: 1, height: 1 }
        };

        addWidget(newWidget);
        sendNotification({
            type: 'info',
            title: 'Nouveau widget',
            message: 'Un nouveau widget a été ajouté au tableau de bord'
        });
    };

    const handleWidgetsReorder = (widgets: Widget[]) => {
        updateWidgets(widgets);
        sendNotification({
            type: 'info',
            title: 'Réorganisation',
            message: 'Les widgets ont été réorganisés'
        });
    };

    const handleWidgetResize = (id: string, size: { width: number; height: number }) => {
        updateWidgetSize(id, size);
        sendNotification({
            type: 'info',
            title: 'Redimensionnement',
            message: 'Le widget a été redimensionné'
        });
    };

    const handleWidgetUpdate = (widget: Widget) => {
        updateWidget(widget);
        sendNotification({
            type: 'info',
            title: 'Configuration',
            message: 'Le widget a été mis à jour'
        });
    };

    return (
        <div
            className="p-6 min-h-screen"
            style={{
                backgroundColor: currentTheme.colors.background,
                color: currentTheme.colors.text,
                fontFamily: currentTheme.fonts.body
            }}
        >
            <div className="mb-6 flex justify-between items-center">
                <h1
                    className="text-2xl font-bold"
                    style={{ fontFamily: currentTheme.fonts.heading }}
                >
                    {dashboard?.name || 'Tableau de bord'}
                </h1>
                <div className="flex items-center space-x-4">
                    <ThemeSelector />
                    <button
                        onClick={() => setShowPreferences(true)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        style={{ color: currentTheme.colors.secondary }}
                    >
                        ⚙️
                    </button>
                    <button
                        onClick={handleAddWidget}
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                        style={{
                            backgroundColor: currentTheme.colors.primary,
                            borderRadius: currentTheme.borderRadius.medium,
                            boxShadow: currentTheme.shadows.small
                        }}
                    >
                        Ajouter un widget
                    </button>
                </div>
            </div>

            {dashboard && (
                <DashboardGrid
                    widgets={dashboard.widgets}
                    onWidgetsReorder={handleWidgetsReorder}
                    onWidgetRemove={removeWidget}
                    onWidgetResize={handleWidgetResize}
                    onWidgetUpdate={handleWidgetUpdate}
                />
            )}

            <PreferencesModal
                isOpen={showPreferences}
                onClose={() => setShowPreferences(false)}
            />
        </div>
    );
}; 