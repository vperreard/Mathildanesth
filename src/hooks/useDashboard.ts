import { useState, useEffect } from 'react';
import { logger } from "../lib/logger";
import { useSession } from 'next-auth/react';
import { dashboardService, DashboardData } from '@/services/dashboardService';
import { Widget } from '@/types/dashboard';
import { useErrorHandler } from './useErrorHandler';
import { toast } from 'react-toastify';

export const useDashboard = () => {
    const { data: session } = useSession();
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const { handleApiError, errorState, clearAllErrors } = useErrorHandler();

    useEffect(() => {
        if (errorState.globalError) {
            const { message, code, severity } = errorState.globalError;

            const displayMessage = code
                ? `${message} (Code: ${code})`
                : message;

            switch (severity) {
                case 'critical':
                case 'error':
                    toast.error(displayMessage);
                    break;
                case 'warning':
                    toast.warning(displayMessage);
                    break;
                case 'info':
                    toast.info(displayMessage);
                    break;
                default:
                    toast.error(displayMessage);
            }
        }
    }, [errorState.globalError]);

    useEffect(() => {
        const loadDashboard = async () => {
            if (!session?.user?.id) {
                setLoading(false);
                return;
            }
            const userId = parseInt(session.user.id, 10);
            if (isNaN(userId)) {
                logger.error("ID utilisateur invalide dans la session:", session.user.id);
                setLoading(false);
                handleApiError({ message: "ID utilisateur invalide" }, 'useDashboard.loadDashboard.invalidId');
                return;
            }

            clearAllErrors();
            try {
                setLoading(true);
                const data = await dashboardService.getDashboard(userId);
                if (data) {
                    setDashboard(data);
                } else {
                    const defaultDashboard: DashboardData = {
                        userId: userId,
                        name: 'Mon tableau de bord',
                        widgets: [],
                        layout: 'grid'
                    };
                    const newDashboard = await dashboardService.createDashboard(defaultDashboard);
                    setDashboard(newDashboard);
                }
            } catch (err: unknown) {
                handleApiError(err, 'useDashboard.loadDashboard');
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, [session?.user?.id, handleApiError, clearAllErrors]);

    const updateWidgets = async (widgets: Widget[]) => {
        if (!dashboard?.id) return;
        clearAllErrors();
        try {
            const updatedDashboard = await dashboardService.updateDashboard(dashboard.id, {
                widgets
            });
            setDashboard(updatedDashboard);
        } catch (err: unknown) {
            handleApiError(err, 'useDashboard.updateWidgets');
        }
    };

    const addWidget = async (widget: Omit<Widget, 'id'>) => {
        if (!dashboard?.id) return;
        clearAllErrors();
        const newWidget = {
            ...widget,
            id: Math.random().toString(36).substring(2, 9)
        };

        try {
            const updatedDashboard = await dashboardService.updateDashboard(dashboard.id, {
                widgets: [...dashboard.widgets, newWidget]
            });
            setDashboard(updatedDashboard);
        } catch (err: unknown) {
            handleApiError(err, 'useDashboard.addWidget');
        }
    };

    const removeWidget = async (id: string) => {
        if (!dashboard?.id) return;
        clearAllErrors();
        try {
            const updatedDashboard = await dashboardService.updateDashboard(dashboard.id, {
                widgets: dashboard.widgets.filter(widget => widget.id !== id)
            });
            setDashboard(updatedDashboard);
        } catch (err: unknown) {
            handleApiError(err, 'useDashboard.removeWidget');
        }
    };

    const updateWidgetPosition = async (id: string, position: { x: number; y: number }) => {
        if (!dashboard?.id) return;
        clearAllErrors();
        try {
            const updatedWidgets = dashboard.widgets.map(widget =>
                widget.id === id ? { ...widget, position } : widget
            );
            const updatedDashboard = await dashboardService.updateDashboard(dashboard.id, {
                widgets: updatedWidgets
            });
            setDashboard(updatedDashboard);
        } catch (err: unknown) {
            handleApiError(err, 'useDashboard.updateWidgetPosition');
        }
    };

    const updateWidgetSize = async (id: string, size: { width: number; height: number }) => {
        if (!dashboard?.id) return;
        clearAllErrors();
        try {
            const updatedWidgets = dashboard.widgets.map(widget =>
                widget.id === id ? { ...widget, size } : widget
            );
            const updatedDashboard = await dashboardService.updateDashboard(dashboard.id, {
                widgets: updatedWidgets
            });
            setDashboard(updatedDashboard);
        } catch (err: unknown) {
            handleApiError(err, 'useDashboard.updateWidgetSize');
        }
    };

    const updateWidget = async (updatedWidget: Widget) => {
        if (!dashboard?.id) return;
        clearAllErrors();
        try {
            const updatedWidgets = dashboard.widgets.map(widget =>
                widget.id === updatedWidget.id ? updatedWidget : widget
            );
            const updatedDashboard = await dashboardService.updateDashboard(dashboard.id, {
                widgets: updatedWidgets
            });
            setDashboard(updatedDashboard);
        } catch (err: unknown) {
            handleApiError(err, 'useDashboard.updateWidget');
        }
    };

    return {
        dashboard,
        loading,
        errorState,
        updateWidgets,
        addWidget,
        removeWidget,
        updateWidgetPosition,
        updateWidgetSize,
        updateWidget,
        clearDashboardErrors: clearAllErrors
    };
}; 