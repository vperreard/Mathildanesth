'use client';

import { useState, useEffect, useCallback } from 'react';

import { logger } from "../lib/logger";
interface NetworkSpeed {
    effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | undefined;
    downlink: number;
    rtt: number;
}

interface CacheStats {
    [cacheName: string]: {
        count: number;
        size: number;
    };
}

interface ServiceWorkerState {
    isSupported: boolean;
    isInstalled: boolean;
    isWaiting: boolean;
    isOnline: boolean;
    error: string | null;
    cacheStats: CacheStats | null;
    networkSpeed: NetworkSpeed;
}

export const useServiceWorker = () => {
    const [state, setState] = useState<ServiceWorkerState>({
        isSupported: false,
        isInstalled: false,
        isWaiting: false,
        isOnline: true,
        error: null,
        cacheStats: null,
        networkSpeed: {
            effectiveType: undefined,
            downlink: 0,
            rtt: 0
        }
    });

    // Vérifier le support des Service Workers
    useEffect(() => {
        const checkSupport = () => {
            setState(prev => ({
                ...prev,
                isSupported: 'serviceWorker' in navigator
            }));
        };

        checkSupport();
    }, []);

    // Enregistrer le Service Worker
    useEffect(() => {
        if (!state.isSupported) return;

        const registerSW = async () => {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });

                // Vérifier si installé
                const isInstalled = !!registration.active;
                
                // Vérifier si en attente
                const isWaiting = !!registration.waiting;

                setState(prev => ({
                    ...prev,
                    isInstalled,
                    isWaiting,
                    error: null
                }));

                // Écouter les changements d'état
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && registration.active) {
                                setState(prev => ({
                                    ...prev,
                                    isWaiting: true
                                }));
                            }
                        });
                    }
                });

                // Écouter les messages du Service Worker
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data.type === 'CACHE_STATS') {
                        setState(prev => ({
                            ...prev,
                            cacheStats: event.data.stats
                        }));
                    }
                });

            } catch (error) {
                logger.error('Erreur lors de l\'enregistrement du Service Worker:', error);
                setState(prev => ({
                    ...prev,
                    error: error instanceof Error ? error.message : 'Erreur inconnue'
                }));
            }
        };

        registerSW();
    }, [state.isSupported]);

    // Surveiller le statut en ligne/hors ligne
    useEffect(() => {
        const updateOnlineStatus = () => {
            setState(prev => ({
                ...prev,
                isOnline: navigator.onLine
            }));
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        // État initial
        updateOnlineStatus();

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    // Surveiller la vitesse du réseau
    useEffect(() => {
        const updateNetworkSpeed = () => {
            const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
            
            if (connection) {
                setState(prev => ({
                    ...prev,
                    networkSpeed: {
                        effectiveType: connection.effectiveType,
                        downlink: connection.downlink || 0,
                        rtt: connection.rtt || 0
                    }
                }));
            }
        };

        updateNetworkSpeed();

        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        if (connection) {
            connection.addEventListener('change', updateNetworkSpeed);
            return () => connection.removeEventListener('change', updateNetworkSpeed);
        }
    }, []);

    // Forcer la mise à jour
    const skipWaiting = useCallback(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
            });
        }
    }, []);

    // Obtenir les statistiques du cache
    const getCacheStats = useCallback(() => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'GET_CACHE_STATS' });
        }
    }, []);

    // Vider le cache
    const clearCache = useCallback(async () => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
            // Recharger après un court délai
            setTimeout(() => window.location.reload(), 500);
        }
    }, []);

    // Précharger des routes
    const prefetchRoutes = useCallback((routes: string[]) => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ 
                type: 'PREFETCH_ROUTES', 
                routes 
            });
        }
    }, []);

    return {
        ...state,
        skipWaiting,
        getCacheStats,
        clearCache,
        prefetchRoutes
    };
};

export const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(true);
    const [networkSpeed, setNetworkSpeed] = useState<NetworkSpeed>({
        effectiveType: undefined,
        downlink: 0,
        rtt: 0
    });

    useEffect(() => {
        const updateOnlineStatus = () => setIsOnline(navigator.onLine);
        const updateNetworkSpeed = () => {
            const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
            
            if (connection) {
                setNetworkSpeed({
                    effectiveType: connection.effectiveType,
                    downlink: connection.downlink || 0,
                    rtt: connection.rtt || 0
                });
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        const connection = (navigator as any).connection;
        if (connection) {
            connection.addEventListener('change', updateNetworkSpeed);
        }

        // États initiaux
        updateOnlineStatus();
        updateNetworkSpeed();

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
            if (connection) {
                connection.removeEventListener('change', updateNetworkSpeed);
            }
        };
    }, []);

    return { isOnline, networkSpeed };
};