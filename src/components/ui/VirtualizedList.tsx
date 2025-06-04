'use client';

import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
    ReactNode
} from 'react';
import { useIntersectionObserver } from '@/hooks/useOptimizedUpdates';

export interface VirtualizedListProps<T> {
    items: T[];
    itemHeight: number;
    containerHeight: number;
    renderItem: (item: T, index: number) => ReactNode;
    onLoadMore?: () => void;
    hasMore?: boolean;
    loading?: boolean;
    overscan?: number;
    className?: string;
    emptyMessage?: string;
    loadingComponent?: ReactNode;
    errorComponent?: ReactNode;
    onItemClick?: (item: T, index: number) => void;
    keyExtractor?: (item: T, index: number) => string | number;
}

export function VirtualizedList<T>({
    items,
    itemHeight,
    containerHeight,
    renderItem,
    onLoadMore,
    hasMore = false,
    loading = false,
    overscan = 5,
    className = '',
    emptyMessage = 'Aucun élément à afficher',
    loadingComponent,
    errorComponent,
    onItemClick,
    keyExtractor = (_, index) => index
}: VirtualizedListProps<T>) {
    const [scrollTop, setScrollTop] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollElementRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout>();

    // Calculer les éléments visibles
    const visibleRange = useMemo(() => {
        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
        const endIndex = Math.min(
            items.length - 1,
            Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
        );

        return { startIndex, endIndex };
    }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

    // Éléments visibles
    const visibleItems = useMemo(() => {
        return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
    }, [items, visibleRange]);

    // Hauteur totale de la liste
    const totalHeight = items.length * itemHeight;

    // Offset pour positionner les éléments visibles
    const offsetY = visibleRange.startIndex * itemHeight;

    // Gestionnaire de scroll optimisé
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        setScrollTop(scrollTop);
        setIsScrolling(true);

        // Débounce pour détecter la fin du scroll
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
        }, 150);

        // Charger plus d'éléments si nécessaire
        if (
            onLoadMore &&
            hasMore &&
            !loading &&
            scrollTop + containerHeight >= totalHeight - itemHeight * 3
        ) {
            onLoadMore();
        }
    }, [onLoadMore, hasMore, loading, totalHeight, containerHeight, itemHeight]);

    // Nettoyage
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    // Scroll vers un élément spécifique
    const scrollToIndex = useCallback((index: number) => {
        if (scrollElementRef.current) {
            const scrollTop = index * itemHeight;
            scrollElementRef.current.scrollTop = scrollTop;
        }
    }, [itemHeight]);

    // Scroll vers le haut
    const scrollToTop = useCallback(() => {
        if (scrollElementRef.current) {
            scrollElementRef.current.scrollTop = 0;
        }
    }, []);

    // Rendu des éléments avec optimisations
    const renderVisibleItems = useCallback(() => {
        return visibleItems.map((item, relativeIndex) => {
            const absoluteIndex = visibleRange.startIndex + relativeIndex;
            const key = keyExtractor(item, absoluteIndex);

            return (
                <VirtualizedListItem
                    key={key}
                    index={absoluteIndex}
                    item={item}
                    height={itemHeight}
                    onClick={onItemClick}
                    isScrolling={isScrolling}
                >
                    {renderItem(item, absoluteIndex)}
                </VirtualizedListItem>
            );
        });
    }, [visibleItems, visibleRange.startIndex, keyExtractor, itemHeight, onItemClick, isScrolling, renderItem]);

    // Composant de chargement par défaut
    const defaultLoadingComponent = (
        <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Chargement...</span>
        </div>
    );

    // Affichage si la liste est vide
    if (items.length === 0 && !loading) {
        return (
            <div className={`flex items-center justify-center ${className}`} style={{ height: containerHeight }}>
                <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">📋</div>
                    <p>{emptyMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {/* Container principal avec scroll */}
            <div
                ref={scrollElementRef}
                className="overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                style={{ height: containerHeight }}
                onScroll={handleScroll}
            >
                {/* Container virtuel avec la hauteur totale */}
                <div style={{ height: totalHeight, position: 'relative' }}>
                    {/* Éléments visibles positionnés absolument */}
                    <div
                        style={{
                            transform: `translateY(${offsetY}px)`,
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                        }}
                    >
                        {renderVisibleItems()}
                    </div>
                </div>

                {/* Indicateur de chargement en bas */}
                {loading && (
                    <div className="sticky bottom-0 bg-white border-t">
                        {loadingComponent || defaultLoadingComponent}
                    </div>
                )}
            </div>

            {/* Contrôles de navigation */}
            <VirtualizedListControls
                onScrollToTop={scrollToTop}
                onScrollToIndex={scrollToIndex}
                totalItems={items.length}
                currentRange={visibleRange}
                isScrolling={isScrolling}
            />
        </div>
    );
}

// Composant pour un élément de liste optimisé
interface VirtualizedListItemProps<T> {
    item: T;
    index: number;
    height: number;
    children: React.ReactNode;
    onClick?: (item: T, index: number) => void;
    isScrolling: boolean;
}

function VirtualizedListItem<T>({
    item,
    index,
    height,
    children,
    onClick,
    isScrolling
}: VirtualizedListItemProps<T>) {
    const handleClick = useCallback(() => {
        if (onClick) {
            onClick(item, index);
        }
    }, [onClick, item, index]);

    return (
        <div
            className={`border-b border-gray-200 transition-colors duration-150 ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''
                } ${isScrolling ? 'pointer-events-none' : ''}`}
            style={{ height }}
            onClick={handleClick}
        >
            <div className="h-full flex items-center px-4">
                {children}
            </div>
        </div>
    );
}

// Contrôles de navigation pour la liste
interface VirtualizedListControlsProps {
    onScrollToTop: () => void;
    onScrollToIndex: (index: number) => void;
    totalItems: number;
    currentRange: { startIndex: number; endIndex: number };
    isScrolling: boolean;
}

function VirtualizedListControls({
    onScrollToTop,
    onScrollToIndex,
    totalItems,
    currentRange,
    isScrolling
}: VirtualizedListControlsProps) {
    const [showControls, setShowControls] = useState(false);
    const [jumpToIndex, setJumpToIndex] = useState('');

    const handleJumpTo = useCallback(() => {
        const index = parseInt(jumpToIndex);
        if (!isNaN(index) && index >= 0 && index < totalItems) {
            onScrollToIndex(index);
            setJumpToIndex('');
        }
    }, [jumpToIndex, totalItems, onScrollToIndex]);

    // Afficher les contrôles seulement si nécessaire
    if (totalItems < 50) return null;

    return (
        <div className="absolute top-2 right-2 z-10">
            <button
                onClick={() => setShowControls(!showControls)}
                className="bg-white border border-gray-300 rounded-full p-2 shadow-lg hover:bg-gray-50"
                title="Contrôles de navigation"
            >
                ⚙️
            </button>

            {showControls && (
                <div className="absolute top-12 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-48">
                    <div className="space-y-3">
                        {/* Informations */}
                        <div className="text-xs text-gray-600">
                            <div>Total: {totalItems} éléments</div>
                            <div>
                                Visible: {currentRange.startIndex + 1}-{currentRange.endIndex + 1}
                            </div>
                        </div>

                        {/* Bouton retour en haut */}
                        <button
                            onClick={onScrollToTop}
                            className="w-full bg-blue-500 text-white py-1 px-2 rounded text-sm hover:bg-blue-600"
                            disabled={isScrolling}
                        >
                            ⬆️ Haut
                        </button>

                        {/* Aller à un index */}
                        <div className="flex gap-1">
                            <input
                                type="number"
                                value={jumpToIndex}
                                onChange={(e) => setJumpToIndex(e.target.value)}
                                placeholder="Index"
                                className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
                                min="0"
                                max={totalItems - 1}
                            />
                            <button
                                onClick={handleJumpTo}
                                className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                                disabled={isScrolling}
                            >
                                Aller
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Hook pour utiliser la liste virtualisée avec intersection observer
export function useVirtualizedList<T>(
    items: T[],
    options: {
        itemHeight: number;
        containerHeight: number;
        threshold?: number;
    }
) {
    const [visibleItems, setVisibleItems] = useState<T[]>([]);
    const [isIntersecting, setIsIntersecting] = useState(false);

    const { ref: intersectionRef } = useIntersectionObserver({
        threshold: options.threshold || 0.1,
        onIntersect: setIsIntersecting
    });

    useEffect(() => {
        if (isIntersecting) {
            // Charger les éléments seulement quand visible
            setVisibleItems(items);
        }
    }, [isIntersecting, items]);

    return {
        visibleItems: isIntersecting ? visibleItems : [],
        intersectionRef,
        isVisible: isIntersecting
    };
}

// Composant exemple pour les utilisateurs
export interface UserListItemProps {
    user: {
        id: number;
        nom: string;
        prenom: string;
        email: string;
        role: string;
    };
    index: number;
}

export function UserListItem({ user, index }: UserListItemProps) {
    return (
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user.prenom[0]}{user.nom[0]}
                </div>
                <div>
                    <div className="font-medium text-gray-900">
                        {user.prenom} {user.nom}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {user.role}
                </span>
                <span className="text-xs text-gray-400">#{index + 1}</span>
            </div>
        </div>
    );
}

export default VirtualizedList; 