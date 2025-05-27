'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface ServiceWorkerState {
    isSupported: boolean;
    isInstalled: boolean;
    isWaiting: boolean;
    isOnline: boolean;
    registration: ServiceWorkerRegistration | null;
    error: string | null;
    cacheStats: CacheStats | null;
    networkSpeed: NetworkSpeed;
}

export interface CacheStats {
    STATIC: { count: number; size: number };
    DYNAMIC: { count: number; size: number };
    API_USER: { count: number; size: number };
    API_STATIC: { count: number; size: number };
    ASSETS: { count: number; size: number };
    PAGES: { count: number; size: number };
}

export interface NetworkSpeed {
    effectiveType: string;
    downlink: number;
    rtt: number;
}

export function useServiceWorker() {
    const [state, setState] = useState<ServiceWorkerState>({
        isSupported: false,
        isInstalled: false,
        isWaiting: false,
        isOnline: navigator?.onLine ?? true,
        registration: null,
        error: null,
        cacheStats: null,
        networkSpeed: {
            effectiveType: 'unknown',
            downlink: 0,
            rtt: 0
        }
    });

    const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
    const updateCheckInterval = useRef<NodeJS.Timeout | null>(null);

    // Mise à jour du statut réseau
    const updateNetworkStatus = useCallback(() => {
        setState(prev => ({
            ...prev,
            isOnline: navigator.onLine,
            networkSpeed: getNetworkSpeed()
        }));
    }, []);

    // Obtenir les informations de vitesse réseau
    const getNetworkSpeed = useCallback((): NetworkSpeed => {
        if ('connection' in navigator) {
            const connection = (navigator as any).connection;
            return {
                effectiveType: connection.effectiveType || 'unknown',
                downlink: connection.downlink || 0,
                rtt: connection.rtt || 0
            };
        }
        return {
            effectiveType: 'unknown',
            downlink: 0,
            rtt: 0
        };
    }, []);

    // Enregistrement du service worker
    const registerServiceWorker = useCallback(async () => {
        // TEMPORAIRE: Désactiver le service worker pour résoudre les problèmes de connexion
        console.log('[SW] Service Worker temporairement désactivé');
        return;
        
        if (!('serviceWorker' in navigator)) {
            setState(prev => ({
                ...prev,
                isSupported: false,
                error: 'Service Worker non supporté'
            }));
            return;
        }

        try {
            setState(prev => ({ ...prev, isSupported: true, error: null }));

            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none'
            });

            registrationRef.current = registration;

            setState(prev => ({
                ...prev,
                registration,
                isInstalled: !!registration.active
            }));

            // Écouter les mises à jour
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            setState(prev => ({ ...prev, isWaiting: true }));
                        }
                    });
                }
            });

            // Vérifier les mises à jour en développement
            if (process.env.NODE_ENV === 'development') {
                updateCheckInterval.current = setInterval(() => {
                    registration.update();
                }, 30000); // Vérifier toutes les 30 secondes en dev
            }

            console.log('[SW Hook] Service Worker enregistré avec succès');

        } catch (error) {
            console.error('[SW Hook] Erreur lors de l\'enregistrement:', error);
            setState(prev => ({
                ...prev,
                error: `Erreur d'enregistrement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
            }));
        }
    }, []);

    // Activer la mise à jour en attente
    const skipWaiting = useCallback(() => {
        if (registrationRef.current?.waiting) {
            registrationRef.current.waiting.postMessage({ type: 'SKIP_WAITING' });
            setState(prev => ({ ...prev, isWaiting: false }));
        }
    }, []);

    // Obtenir les statistiques du cache
    const getCacheStats = useCallback(async (): Promise<CacheStats | null> => {
        if (!registrationRef.current?.active) return null;

        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();

            messageChannel.port1.onmessage = (event) => {
                if (event.data.type === 'CACHE_STATS') {
                    const stats = event.data.payload;
                    setState(prev => ({ ...prev, cacheStats: stats }));
                    resolve(stats);
                }
            };

            const activeWorker = registrationRef.current?.active;
            if (activeWorker) {
                activeWorker.postMessage(
                    { type: 'GET_CACHE_STATS' },
                    [messageChannel.port2]
                );
            } else {
                resolve(null);
            }
        });
    }, []);

    // Vider le cache
    const clearCache = useCallback(async (): Promise<void> => {
        if (!registrationRef.current?.active) return;

        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();

            messageChannel.port1.onmessage = (event) => {
                if (event.data.type === 'CACHE_CLEARED') {
                    setState(prev => ({ ...prev, cacheStats: null }));
                    resolve();
                }
            };

            const activeWorker = registrationRef.current?.active;
            if (activeWorker) {
                activeWorker.postMessage(
                    { type: 'CLEAR_CACHE' },
                    [messageChannel.port2]
                );
            } else {
                resolve();
            }
        });
    }, []);

    // Précharger des routes
    const prefetchRoutes = useCallback((routes: string[]) => {
        const activeWorker = registrationRef.current?.active;
        if (!activeWorker) return;

        activeWorker.postMessage({
            type: 'PREFETCH_ROUTES',
            payload: { routes }
        });
    }, []);

    // Mesurer la performance du cache
    const measureCachePerformance = useCallback(async (url: string) => {
        const startTime = performance.now();

        try {
            const response = await fetch(url);
            const endTime = performance.now();
            const duration = endTime - startTime;

            const isCached = response.headers.get('cache-control') !== 'no-cache';

            return {
                url,
                duration,
                isCached,
                status: response.status,
                size: parseInt(response.headers.get('content-length') || '0')
            };
        } catch (error) {
            return {
                url,
                duration: performance.now() - startTime,
                isCached: false,
                status: 0,
                size: 0,
                error: error instanceof Error ? error.message : 'Erreur inconnue'
            };
        }
    }, []);

    // Initialisation
    useEffect(() => {
        registerServiceWorker();

        // Écouter les changements de connexion
        window.addEventListener('online', updateNetworkStatus);
        window.addEventListener('offline', updateNetworkStatus);

        // Écouter les changements de connexion réseau
        if ('connection' in navigator) {
            (navigator as any).connection.addEventListener('change', updateNetworkStatus);
        }

        // Mise à jour initiale du statut réseau
        updateNetworkStatus();

        return () => {
            window.removeEventListener('online', updateNetworkStatus);
            window.removeEventListener('offline', updateNetworkStatus);

            if ('connection' in navigator) {
                (navigator as any).connection.removeEventListener('change', updateNetworkStatus);
            }

            if (updateCheckInterval.current) {
                clearInterval(updateCheckInterval.current);
            }
        };
    }, [registerServiceWorker, updateNetworkStatus]);

    // Mise à jour périodique des stats en développement
    useEffect(() => {
        if (process.env.NODE_ENV === 'development' && state.isInstalled) {
            const interval = setInterval(() => {
                getCacheStats();
            }, 10000); // Toutes les 10 secondes en dev

            return () => clearInterval(interval);
        }
    }, [state.isInstalled, getCacheStats]);

    return {
        ...state,
        skipWaiting,
        getCacheStats,
        clearCache,
        prefetchRoutes,
        measureCachePerformance,
        refresh: registerServiceWorker
    };
}

// Hook pour le statut réseau uniquement
export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(navigator?.onLine ?? true);
    const [networkSpeed, setNetworkSpeed] = useState<NetworkSpeed>({
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0
    });

    useEffect(() => {
        const updateStatus = () => {
            setIsOnline(navigator.onLine);

            if ('connection' in navigator) {
                const connection = (navigator as any).connection;
                setNetworkSpeed({
                    effectiveType: connection.effectiveType || 'unknown',
                    downlink: connection.downlink || 0,
                    rtt: connection.rtt || 0
                });
            }
        };

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);

        if ('connection' in navigator) {
            (navigator as any).connection.addEventListener('change', updateStatus);
        }

        updateStatus();

        return () => {
            window.removeEventListener('online', updateStatus);
            window.removeEventListener('offline', updateStatus);

            if ('connection' in navigator) {
                (navigator as any).connection.removeEventListener('change', updateStatus);
            }
        };
    }, []);

    return { isOnline, networkSpeed };
} 