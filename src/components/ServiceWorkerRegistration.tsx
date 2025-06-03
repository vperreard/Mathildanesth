'use client';

import { useEffect, useState } from 'react';
import { useServiceWorker, useNetworkStatus } from '@/hooks/useServiceWorker';

const ServiceWorkerRegistration: React.FC = () => {
    // TEMPORAIRE: Désactiver complètement le service worker pour résoudre les erreurs MIME
    // TODO: Réactiver après résolution des conflits avec Next.js
    return null;
    const {
        isSupported,
        isInstalled,
        isWaiting,
        isOnline,
        error,
        cacheStats,
        networkSpeed,
        skipWaiting,
        getCacheStats,
        clearCache,
        prefetchRoutes
    } = useServiceWorker();

    const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
    const [showDevPanel, setShowDevPanel] = useState(false);

    // Afficher une notification en cas de nouvelle version disponible
    useEffect(() => {
        if (isWaiting) {
            setShowUpdatePrompt(true);
        }
    }, [isWaiting]);

    // Précharger les routes critiques une fois installé
    useEffect(() => {
        if (isInstalled && isOnline) {
            const criticalRoutes = [
                '/auth/connexion',
                '/api/auth/me',
                '/api/sites',
                '/api/specialties'
            ];
            prefetchRoutes(criticalRoutes);
        }
    }, [isInstalled, isOnline, prefetchRoutes]);

    // Obtenir les stats du cache périodiquement en développement
    useEffect(() => {
        if (process.env.NODE_ENV === 'development' && isInstalled) {
            getCacheStats();
        }
    }, [isInstalled, getCacheStats]);

    // Log des informations de performance en développement
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('[SW] État:', {
                isSupported,
                isInstalled,
                isWaiting,
                isOnline,
                error,
                networkSpeed,
                cacheStats
            });
        }
    }, [isSupported, isInstalled, isWaiting, isOnline, error, networkSpeed, cacheStats]);

    const handleUpdate = () => {
        skipWaiting();
        setShowUpdatePrompt(false);
        // Recharger après un court délai
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getNetworkQuality = () => {
        if (!isOnline) return { label: 'Hors ligne', color: 'bg-red-500' };

        switch (networkSpeed.effectiveType) {
            case 'slow-2g':
            case '2g':
                return { label: 'Lent', color: 'bg-red-500' };
            case '3g':
                return { label: 'Moyen', color: 'bg-yellow-500' };
            case '4g':
                return { label: 'Rapide', color: 'bg-green-500' };
            default:
                return { label: 'Inconnu', color: 'bg-gray-500' };
        }
    };

    // Prompt de mise à jour
    if (showUpdatePrompt) {
        return (
            <div className="fixed top-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
                <div className="flex items-center gap-3">
                    <div className="text-2xl">🔄</div>
                    <div className="flex-1">
                        <h3 className="font-semibold">Mise à jour disponible</h3>
                        <p className="text-sm opacity-90">
                            Une nouvelle version de l'application est prête.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={handleUpdate}
                        className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100"
                    >
                        Mettre à jour
                    </button>
                    <button
                        onClick={() => setShowUpdatePrompt(false)}
                        className="bg-blue-700 text-white px-3 py-1 rounded text-sm hover:bg-blue-800"
                    >
                        Plus tard
                    </button>
                </div>
            </div>
        );
    }

    // Indicateur de statut hors ligne
    if (!isOnline) {
        return (
            <div className="fixed bottom-4 left-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
                <span className="animate-pulse">📶</span>
                <span className="text-sm font-medium">Mode hors ligne</span>
            </div>
        );
    }

    // Panneau de développement
    if (process.env.NODE_ENV === 'development') {
        const networkQuality = getNetworkQuality();

        return (
            <>
                {/* Bouton pour afficher/masquer le panneau */}
                <button
                    onClick={() => setShowDevPanel(!showDevPanel)}
                    className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg z-50 hover:bg-gray-700"
                    title="Panneau de développement SW"
                >
                    ⚙️
                </button>

                {/* Panneau de développement */}
                {showDevPanel && (
                    <div className="fixed bottom-16 right-4 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4 max-w-sm text-xs">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold text-gray-800">Service Worker</h3>
                            <button
                                onClick={() => setShowDevPanel(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Statut */}
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between">
                                <span>Supporté:</span>
                                <span className={isSupported ? 'text-green-600' : 'text-red-600'}>
                                    {isSupported ? '✓' : '✗'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Installé:</span>
                                <span className={isInstalled ? 'text-green-600' : 'text-red-600'}>
                                    {isInstalled ? '✓' : '✗'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Réseau:</span>
                                <div className="flex items-center gap-1">
                                    <div className={`w-2 h-2 rounded-full ${networkQuality.color}`}></div>
                                    <span>{networkQuality.label}</span>
                                </div>
                            </div>
                            {networkSpeed.downlink > 0 && (
                                <div className="flex justify-between">
                                    <span>Vitesse:</span>
                                    <span>{networkSpeed.downlink} Mbps</span>
                                </div>
                            )}
                        </div>

                        {/* Statistiques du cache */}
                        {cacheStats && (
                            <div className="mb-4">
                                <h4 className="font-medium text-gray-700 mb-2">Cache</h4>
                                <div className="space-y-1">
                                    {Object.entries(cacheStats).map(([name, stats]) => (
                                        <div key={name} className="flex justify-between">
                                            <span>{name}:</span>
                                            <span>{stats.count} ({formatBytes(stats.size)})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="space-y-2">
                            <button
                                onClick={() => getCacheStats()}
                                className="w-full bg-blue-500 text-white py-1 px-2 rounded text-xs hover:bg-blue-600"
                            >
                                Actualiser stats
                            </button>
                            <button
                                onClick={() => clearCache()}
                                className="w-full bg-red-500 text-white py-1 px-2 rounded text-xs hover:bg-red-600"
                            >
                                Vider cache
                            </button>
                        </div>

                        {/* Erreurs */}
                        {error && (
                            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700">
                                {error}
                            </div>
                        )}
                    </div>
                )}
            </>
        );
    }

    return null;
};

export default ServiceWorkerRegistration; 