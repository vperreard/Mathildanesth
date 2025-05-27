import React, { memo, useCallback, useRef, useEffect } from 'react';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { cn } from '@/lib/utils';

interface VirtualizedListItem {
    id: string;
    height?: number;
    data: any;
}

interface VirtualizedListProps {
    items: VirtualizedListItem[];
    renderItem: (item: VirtualizedListItem, index: number) => React.ReactNode;
    estimatedItemSize?: number;
    className?: string;
    overscan?: number;
    onScroll?: (scrollOffset: number) => void;
}

/**
 * Composant de liste virtualisée pour gérer de grandes quantités de données
 * Utilise react-window pour ne rendre que les éléments visibles
 */
export const VirtualizedList = memo<VirtualizedListProps>(({
    items,
    renderItem,
    estimatedItemSize = 50,
    className,
    overscan = 5,
    onScroll
}) => {
    const listRef = useRef<List>(null);
    const itemSizes = useRef<Map<number, number>>(new Map());

    // Fonction pour obtenir la taille d'un élément
    const getItemSize = useCallback((index: number) => {
        return itemSizes.current.get(index) || items[index]?.height || estimatedItemSize;
    }, [items, estimatedItemSize]);

    // Fonction pour mettre à jour la taille d'un élément
    const setItemSize = useCallback((index: number, size: number) => {
        if (itemSizes.current.get(index) !== size) {
            itemSizes.current.set(index, size);
            listRef.current?.resetAfterIndex(index);
        }
    }, []);

    // Composant Row optimisé
    const Row = memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
        const item = items[index];
        const rowRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            if (rowRef.current) {
                const height = rowRef.current.getBoundingClientRect().height;
                setItemSize(index, height);
            }
        }, [index, setItemSize]);

        return (
            <div style={style} ref={rowRef}>
                {renderItem(item, index)}
            </div>
        );
    });

    Row.displayName = 'VirtualizedRow';

    return (
        <div className={cn("w-full h-full", className)}>
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        ref={listRef}
                        height={height}
                        itemCount={items.length}
                        itemSize={getItemSize}
                        width={width}
                        overscanCount={overscan}
                        onScroll={({ scrollOffset }) => onScroll?.(scrollOffset)}
                    >
                        {Row}
                    </List>
                )}
            </AutoSizer>
        </div>
    );
});

VirtualizedList.displayName = 'VirtualizedList';

// Hook personnalisé pour gérer le scroll et le chargement progressif
export const useVirtualScroll = (
    totalItems: number,
    pageSize: number = 50
) => {
    const [loadedItems, setLoadedItems] = React.useState(pageSize);
    const [isLoading, setIsLoading] = React.useState(false);

    const loadMore = useCallback(() => {
        if (isLoading || loadedItems >= totalItems) return;

        setIsLoading(true);
        // Simuler un délai de chargement
        setTimeout(() => {
            setLoadedItems(prev => Math.min(prev + pageSize, totalItems));
            setIsLoading(false);
        }, 300);
    }, [isLoading, loadedItems, totalItems, pageSize]);

    const handleScroll = useCallback((scrollOffset: number, containerHeight: number, contentHeight: number) => {
        const scrollPercentage = (scrollOffset + containerHeight) / contentHeight;
        
        // Charger plus quand on approche de la fin (90%)
        if (scrollPercentage > 0.9) {
            loadMore();
        }
    }, [loadMore]);

    return {
        loadedItems,
        isLoading,
        loadMore,
        handleScroll
    };
};

// Composant de tableau virtualisé
interface VirtualizedTableProps {
    columns: Array<{
        key: string;
        label: string;
        width?: number;
        render?: (item: any) => React.ReactNode;
    }>;
    data: any[];
    rowHeight?: number;
    headerHeight?: number;
    className?: string;
}

export const VirtualizedTable = memo<VirtualizedTableProps>(({
    columns,
    data,
    rowHeight = 48,
    headerHeight = 56,
    className
}) => {
    const Row = memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
        if (index === 0) {
            // Header row
            return (
                <div 
                    style={{ ...style, height: headerHeight }}
                    className="flex items-center bg-gray-50 border-b font-medium"
                >
                    {columns.map(column => (
                        <div
                            key={column.key}
                            className="px-4 py-2 truncate"
                            style={{ width: column.width || `${100 / columns.length}%` }}
                        >
                            {column.label}
                        </div>
                    ))}
                </div>
            );
        }

        const item = data[index - 1];
        return (
            <div 
                style={style}
                className="flex items-center border-b hover:bg-gray-50"
            >
                {columns.map(column => (
                    <div
                        key={column.key}
                        className="px-4 py-2 truncate"
                        style={{ width: column.width || `${100 / columns.length}%` }}
                    >
                        {column.render ? column.render(item) : item[column.key]}
                    </div>
                ))}
            </div>
        );
    });

    Row.displayName = 'VirtualizedTableRow';

    const getItemSize = useCallback((index: number) => {
        return index === 0 ? headerHeight : rowHeight;
    }, [headerHeight, rowHeight]);

    return (
        <div className={cn("w-full h-full border rounded-lg overflow-hidden", className)}>
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        height={height}
                        itemCount={data.length + 1} // +1 for header
                        itemSize={getItemSize}
                        width={width}
                    >
                        {Row}
                    </List>
                )}
            </AutoSizer>
        </div>
    );
});

VirtualizedTable.displayName = 'VirtualizedTable';