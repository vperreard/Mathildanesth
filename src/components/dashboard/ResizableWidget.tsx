import React from 'react';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { Widget } from '@/types/dashboard';

interface ResizableWidgetProps {
    widget: Widget;
    onResize: (size: { width: number; height: number }) => void;
    children: React.ReactNode;
}

export const ResizableWidget: React.FC<ResizableWidgetProps> = ({
    widget,
    onResize,
    children
}) => {
    const handleResize = (e: any, { size }: { size: { width: number; height: number } }) => {
        // Convertir les pixels en unités de grille
        const gridWidth = Math.ceil(size.width / 200); // 200px par unité de grille
        const gridHeight = Math.ceil(size.height / 200);

        onResize({
            width: Math.max(1, Math.min(3, gridWidth)),
            height: Math.max(1, Math.min(3, gridHeight))
        });
    };

    return (
        <Resizable
            width={widget.size.width * 200}
            height={widget.size.height * 200}
            onResize={handleResize}
            draggableOpts={{ grid: [200, 200] }}
            minConstraints={[200, 200]}
            maxConstraints={[600, 600]}
        >
            <div
                style={{
                    width: widget.size.width * 200,
                    height: widget.size.height * 200
                }}
            >
                {children}
            </div>
        </Resizable>
    );
}; 