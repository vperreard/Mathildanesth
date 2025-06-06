export type WidgetType = 'stat' | 'chart' | 'list' | 'calendar';

export interface Widget {
    id: string;
    type: WidgetType;
    title: string;
    data: unknown;
    position: { x: number; y: number };
    size: { width: number; height: number };
    config?: Record<string, unknown>;
}

export interface StatWidgetData {
    value: number;
    label: string;
    change?: number;
    changeType?: 'increase' | 'decrease';
    icon?: string;
}

export interface ChartWidgetData {
    type: 'line' | 'bar' | 'pie';
    data: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            backgroundColor?: string[];
            borderColor?: string;
            fill?: boolean;
        }[];
    };
    options?: Record<string, unknown>;
}

export interface ListWidgetData {
    items: {
        id: string;
        title: string;
        description?: string;
        status?: string;
        date?: string;
    }[];
    showStatus?: boolean;
    showDate?: boolean;
}

export interface CalendarWidgetData {
    events: {
        id: string;
        title: string;
        start: string;
        end: string;
        color?: string;
    }[];
    view?: 'month' | 'week' | 'day';
}

export interface DashboardConfig {
    id: string;
    userId: number;
    name: string;
    widgets: Widget[];
    layout: 'grid' | 'free';
    createdAt: string;
    updatedAt: string;
} 