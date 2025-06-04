'use client';

import {
    useCallback,
    useRef,
    useEffect,
    useState,
    useMemo
} from 'react';

// Hook pour débouncer les valeurs
export function useDebouncedValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// Hook pour throttler les callbacks
export function useThrottledCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T {
    const lastRun = useRef(Date.now());

    return useCallback(
        ((...args) => {
            if (Date.now() - lastRun.current >= delay) {
                callback(...args);
                lastRun.current = Date.now();
            }
        }) as T,
        [callback, delay]
    );
}

// Hook pour optimiser les listes avec détection de changements intelligente
export function useOptimizedList<T>(
    items: T[],
    keyExtractor: (item: T, index: number) => string | number = (_, index) => index
) {
    const [optimizedItems, setOptimizedItems] = useState(items);
    const previousKeysRef = useRef<Set<string | number>>(new Set());

    useEffect(() => {
        const currentKeys = new Set(items.map(keyExtractor));
        const previousKeys = previousKeysRef.current;

        // Vérifier si les clés ont changé
        const hasChanged =
            currentKeys.size !== previousKeys.size ||
            [...currentKeys].some(key => !previousKeys.has(key));

        if (hasChanged) {
            setOptimizedItems(items);
            previousKeysRef.current = currentKeys;
        }
    }, [items, keyExtractor]);

    return optimizedItems;
}

// Hook pour batcher les mises à jour d'état
export function useBatchedUpdates<T>(initialValue: T) {
    const [value, setValue] = useState<T>(initialValue);
    const pendingUpdatesRef = useRef<((prev: T) => T)[]>([]);
    const timeoutRef = useRef<NodeJS.Timeout>();

    const batchedSetValue = useCallback((updater: T | ((prev: T) => T)) => {
        const updateFunction = typeof updater === 'function'
            ? updater as (prev: T) => T
            : () => updater;

        pendingUpdatesRef.current.push(updateFunction);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            setValue(currentValue => {
                let newValue = currentValue;
                pendingUpdatesRef.current.forEach(update => {
                    newValue = update(newValue);
                });
                pendingUpdatesRef.current = [];
                return newValue;
            });
        }, 0);
    }, []);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return [value, batchedSetValue] as const;
}

// Hook pour mémorisation intelligente avec validation
export function useSmartMemo<T>(
    factory: () => T,
    deps: React.DependencyList,
    validator?: (prev: T, next: T) => boolean
): T {
    const memoizedValue = useMemo(factory, deps);
    const [cachedValue, setCachedValue] = useState<T>(memoizedValue);

    useEffect(() => {
        if (!validator || validator(cachedValue, memoizedValue)) {
            setCachedValue(memoizedValue);
        }
    }, [memoizedValue, validator, cachedValue]);

    return cachedValue;
}

// Hook pour intersection observer optimisé
export function useIntersectionObserver(options: {
    threshold?: number;
    rootMargin?: string;
    onIntersect?: (isIntersecting: boolean) => void;
}) {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const [hasBeenVisible, setHasBeenVisible] = useState(false);
    const elementRef = useRef<Element | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const setRef = useCallback((element: Element | null) => {
        if (elementRef.current && observerRef.current) {
            observerRef.current.unobserve(elementRef.current);
        }

        elementRef.current = element;

        if (element) {
            if (!observerRef.current) {
                observerRef.current = new IntersectionObserver(
                    ([entry]) => {
                        const intersecting = entry.isIntersecting;
                        setIsIntersecting(intersecting);

                        if (intersecting && !hasBeenVisible) {
                            setHasBeenVisible(true);
                        }

                        options.onIntersect?.(intersecting);
                    },
                    {
                        threshold: options.threshold || 0.1,
                        rootMargin: options.rootMargin || '0px'
                    }
                );
            }

            observerRef.current.observe(element);
        }
    }, [options.threshold, options.rootMargin, options.onIntersect, hasBeenVisible]);

    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    return {
        ref: setRef,
        isIntersecting,
        hasBeenVisible
    };
}

// Hook pour animations avec requestAnimationFrame
export function useRequestAnimationFrame(
    callback: (deltaTime: number) => void,
    isActive: boolean = true
) {
    const requestRef = useRef<number>();
    const previousTimeRef = useRef<number>();

    const animate = useCallback((time: number) => {
        if (previousTimeRef.current !== undefined) {
            const deltaTime = time - previousTimeRef.current;
            callback(deltaTime);
        }
        previousTimeRef.current = time;

        if (isActive) {
            requestRef.current = requestAnimationFrame(animate);
        }
    }, [callback, isActive]);

    useEffect(() => {
        if (isActive) {
            requestRef.current = requestAnimationFrame(animate);
        } else {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        }

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isActive, animate]);
}

// Hook pour gérer le resize de manière optimisée
export function useOptimizedResize(
    callback: (size: { width: number; height: number }) => void,
    delay: number = 250
) {
    const [size, setSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0
    });

    const debouncedCallback = useCallback(
        useDebouncedValue(callback, delay),
        [callback, delay]
    );

    useEffect(() => {
        const handleResize = () => {
            const newSize = {
                width: window.innerWidth,
                height: window.innerHeight
            };
            setSize(newSize);
            debouncedCallback(newSize);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [debouncedCallback]);

    return size;
}

// Hook pour état optimisé avec validation et rollback
export function useOptimizedState<T>(
    initialValue: T,
    validator?: (value: T) => boolean,
    onError?: (error: Error, previousValue: T) => void
) {
    const [value, setValue] = useState<T>(initialValue);
    const [isValid, setIsValid] = useState(true);
    const previousValidValueRef = useRef<T>(initialValue);

    const setOptimizedValue = useCallback((newValue: T | ((prev: T) => T)) => {
        try {
            const resolvedValue = typeof newValue === 'function'
                ? (newValue as (prev: T) => T)(value)
                : newValue;

            if (!validator || validator(resolvedValue)) {
                setValue(resolvedValue);
                setIsValid(true);
                previousValidValueRef.current = resolvedValue;
            } else {
                setIsValid(false);
                onError?.(new Error('Validation failed'), previousValidValueRef.current);
            }
        } catch (error) {
            setIsValid(false);
            onError?.(error as Error, previousValidValueRef.current);
            // Rollback vers la dernière valeur valide
            setValue(previousValidValueRef.current);
        }
    }, [value, validator, onError]);

    const rollback = useCallback(() => {
        setValue(previousValidValueRef.current);
        setIsValid(true);
    }, []);

    return {
        value,
        setValue: setOptimizedValue,
        isValid,
        rollback,
        lastValidValue: previousValidValueRef.current
    };
}

// Hook pour gérer les performances de rendu
export function useRenderPerformance(componentName: string) {
    const renderCountRef = useRef(0);
    const lastRenderTimeRef = useRef(Date.now());
    const [performanceMetrics, setPerformanceMetrics] = useState({
        renderCount: 0,
        averageRenderTime: 0,
        lastRenderDuration: 0
    });

    useEffect(() => {
        const renderStartTime = lastRenderTimeRef.current;
        const renderEndTime = Date.now();
        const renderDuration = renderEndTime - renderStartTime;

        renderCountRef.current += 1;

        setPerformanceMetrics(prev => ({
            renderCount: renderCountRef.current,
            lastRenderDuration: renderDuration,
            averageRenderTime: (prev.averageRenderTime + renderDuration) / 2
        }));

        if (process.env.NODE_ENV === 'development' && renderDuration > 16) {
            console.warn(
                `[Performance] ${componentName} render lent: ${renderDuration}ms (render #${renderCountRef.current})`
            );
        }

        lastRenderTimeRef.current = Date.now();
    });

    return performanceMetrics;
}

// Hook pour lazy loading avec cache
export function useLazyLoad<T>(
    loader: () => Promise<T>,
    deps: React.DependencyList = []
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const cacheRef = useRef<Map<string, T>>(new Map());

    const load = useCallback(async () => {
        const cacheKey = JSON.stringify(deps);

        // Vérifier le cache
        if (cacheRef.current.has(cacheKey)) {
            setData(cacheRef.current.get(cacheKey)!);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await loader();
            cacheRef.current.set(cacheKey, result);
            setData(result);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [loader, ...deps]);

    useEffect(() => {
        load();
    }, [load]);

    const reload = useCallback(() => {
        const cacheKey = JSON.stringify(deps);
        cacheRef.current.delete(cacheKey);
        load();
    }, [load, deps]);

    return { data, loading, error, reload };
}

// Hook pour gérer les mises à jour conditionnelles
export function useConditionalUpdate<T>(
    value: T,
    condition: (prev: T, next: T) => boolean
): T {
    const [conditionalValue, setConditionalValue] = useState<T>(value);

    useEffect(() => {
        if (condition(conditionalValue, value)) {
            setConditionalValue(value);
        }
    }, [value, condition, conditionalValue]);

    return conditionalValue;
}

// Hook pour optimiser les événements de scroll
export function useOptimizedScroll(
    callback: (scrollInfo: {
        scrollTop: number;
        scrollLeft: number;
        scrollHeight: number;
        scrollWidth: number;
        clientHeight: number;
        clientWidth: number;
    }) => void,
    delay: number = 16
) {
    const throttledCallback = useThrottledCallback(callback, delay);

    const handleScroll = useCallback((e: Event) => {
        const target = e.target as HTMLElement;
        if (target) {
            throttledCallback({
                scrollTop: target.scrollTop,
                scrollLeft: target.scrollLeft,
                scrollHeight: target.scrollHeight,
                scrollWidth: target.scrollWidth,
                clientHeight: target.clientHeight,
                clientWidth: target.clientWidth
            });
        }
    }, [throttledCallback]);

    return handleScroll;
}

// Hook pour gérer les états de chargement multiples
export function useMultipleLoadingStates() {
    const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(new Map());

    const setLoading = useCallback((key: string, isLoading: boolean) => {
        setLoadingStates(prev => {
            const newMap = new Map(prev);
            if (isLoading) {
                newMap.set(key, true);
            } else {
                newMap.delete(key);
            }
            return newMap;
        });
    }, []);

    const isLoading = useCallback((key?: string) => {
        if (key) {
            return loadingStates.has(key);
        }
        return loadingStates.size > 0;
    }, [loadingStates]);

    const clearAll = useCallback(() => {
        setLoadingStates(new Map());
    }, []);

    return {
        setLoading,
        isLoading,
        clearAll,
        loadingKeys: Array.from(loadingStates.keys())
    };
} 