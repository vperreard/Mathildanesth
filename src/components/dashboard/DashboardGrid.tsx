import React, { useState, Suspense, lazy } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Widget } from '@/types/dashboard';
import { StatWidget } from './widgets/StatWidget';
import { ListWidget } from './widgets/ListWidget';
import { CalendarWidget } from './widgets/CalendarWidget';
import { ResizableWidget } from './ResizableWidget';
import { WidgetConfigModal } from './WidgetConfigModal';
import { WidgetCustomizationModal } from './WidgetCustomizationModal';
import { useTheme } from '@/hooks/useTheme';
import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorDisplay from '@/components/ErrorDisplay';
import { DashboardWidgetErrorFallback } from '@/components/Calendar/ErrorFallbacks';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Importer ChartWidget avec React.lazy
const ChartWidget = lazy(() => import('./widgets/ChartWidget').then(module => ({ default: module.ChartWidget })));

interface DashboardGridProps {
    widgets: Widget[];
    onWidgetsReorder: (widgets: Widget[]) => void;
    onWidgetRemove: (id: string) => void;
    onWidgetResize: (id: string, size: { width: number; height: number }) => void;
    onWidgetUpdate: (widget: Widget) => void;
}

const renderWidget = (widget: Widget) => {
    switch (widget.type) {
        case 'stat':
            return <StatWidget title={widget.title} data={widget.data} />;
        case 'chart':
            // Envelopper ChartWidget avec Suspense
            return (
                <Suspense fallback={<LoadingSpinner />}>
                    <ChartWidget title={widget.title} data={widget.data} />
                </Suspense>
            );
        case 'list':
            return <ListWidget title={widget.title} data={widget.data} />;
        case 'calendar':
            return <CalendarWidget title={widget.title} data={widget.data} />;
        default:
            return null;
    }
};

export const DashboardGrid: React.FC<DashboardGridProps> = ({
    widgets,
    onWidgetsReorder,
    onWidgetRemove,
    onWidgetResize,
    onWidgetUpdate
}) => {
    const [configuringWidget, setConfiguringWidget] = useState<Widget | null>(null);
    const [customizingWidget, setCustomizingWidget] = useState<Widget | null>(null);
    const { currentTheme } = useTheme();

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const items = Array.from(widgets);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        onWidgetsReorder(items);
    };

    const getWidgetStyle = (widget: Widget) => {
        const config = widget.config || {};
        return {
            backgroundColor: config.backgroundColor || currentTheme.colors.background,
            color: config.textColor || currentTheme.colors.text,
            borderColor: config.borderColor || currentTheme.colors.border,
            borderWidth: config.borderWidth || '1px',
            borderRadius: config.borderRadius || currentTheme.borderRadius.medium,
            boxShadow: config.shadow || currentTheme.shadows.medium,
            padding: config.padding || currentTheme.spacing.medium,
            fontSize: config.fontSize || '1rem',
            fontFamily: config.fontFamily || currentTheme.fonts.body,
            opacity: config.opacity || 1,
            animation: config.animation || 'none'
        };
    };

    return (
        <>
            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="dashboard-grid" direction="horizontal">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {widgets.map((widget, index) => (
                                <Draggable
                                    key={widget.id}
                                    draggableId={widget.id}
                                    index={index}
                                >
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            style={{
                                                ...provided.draggableProps.style,
                                                gridColumn: `span ${widget.size.width}`,
                                                gridRow: `span ${widget.size.height}`
                                            }}
                                        >
                                            <ResizableWidget
                                                widget={widget}
                                                onResize={(size) => onWidgetResize(widget.id, size)}
                                            >
                                                <ErrorBoundary
                                                    fallbackComponent={(props) =>
                                                        <DashboardWidgetErrorFallback
                                                            {...props}
                                                            widgetTitle={widget.title}
                                                        />
                                                    }
                                                >
                                                    {renderWidget(widget)}
                                                </ErrorBoundary>
                                                <div
                                                    {...provided.dragHandleProps}
                                                    className="transition-shadow"
                                                    style={getWidgetStyle(widget)}
                                                >
                                                    <div
                                                        className="flex justify-between items-center mb-4"
                                                        style={{ marginBottom: currentTheme.spacing.medium }}
                                                    >
                                                        <h3
                                                            className="text-lg font-semibold"
                                                            style={{ fontFamily: currentTheme.fonts.heading }}
                                                        >
                                                            {widget.title}
                                                        </h3>
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() => setCustomizingWidget(widget)}
                                                                className="text-gray-400 hover:text-gray-600"
                                                                style={{ color: currentTheme.colors.secondary }}
                                                            >
                                                                🎨
                                                            </button>
                                                            <button
                                                                onClick={() => setConfiguringWidget(widget)}
                                                                className="text-gray-400 hover:text-gray-600"
                                                                style={{ color: currentTheme.colors.secondary }}
                                                            >
                                                                ⚙️
                                                            </button>
                                                            <button
                                                                onClick={() => onWidgetRemove(widget.id)}
                                                                className="text-gray-400 hover:text-gray-600"
                                                                style={{ color: currentTheme.colors.secondary }}
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </ResizableWidget>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {configuringWidget && (
                <WidgetConfigModal
                    isOpen={true}
                    onClose={() => setConfiguringWidget(null)}
                    widget={configuringWidget}
                    onSave={onWidgetUpdate}
                />
            )}

            {customizingWidget && (
                <WidgetCustomizationModal
                    isOpen={true}
                    onClose={() => setCustomizingWidget(null)}
                    widget={customizingWidget}
                    onSave={onWidgetUpdate}
                />
            )}
        </>
    );
}; 