import React, { useState, useEffect } from 'react';
import { logger } from "../../lib/logger";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ErrorLog {
    id: string;
    key: string;
    message: string;
    code?: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    timestamp: string;
    context?: Record<string, unknown>;
    resolved: boolean;
    userAgent?: string;
    url?: string;
    userId?: string;
    resolved_at?: string;
    resolved_by?: string;
}

interface ErrorStats {
    total: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    recentErrors: number;
    resolvedCount: number;
}

/**
 * Tableau de bord d'administration pour surveiller les erreurs
 */
const ErrorDashboard: React.FC = () => {
    const [errors, setErrors] = useState<ErrorLog[]>([]);
    const [stats, setStats] = useState<ErrorStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [filter, setFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [timeRange, setTimeRange] = useState<string>('24h');
    const [sortBy, setSortBy] = useState<string>('timestamp');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);

    // Charger les erreurs
    useEffect(() => {
        const fetchErrors = async () => {
            setLoading(true);
            try {
                // Remplacer par un appel API réel
                const response = await fetch(`http://localhost:3000/api/admin/errors?timeRange=${timeRange}&filter=${filter}`);
                if (!response.ok) {
                    throw new Error('Erreur lors du chargement des données');
                }
                const data = await response.json();
                setErrors(data.errors);
                setStats(data.stats);
            } catch (error: unknown) {
                logger.error('Erreur lors du chargement des erreurs:', { error: error });
            } finally {
                setLoading(false);
            }
        };

        fetchErrors();
    }, [timeRange, filter]);

    // Filtrer et trier les erreurs
    const filteredErrors = errors
        .filter(error => {
            if (searchTerm === '') return true;
            return (
                error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                error.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (error.code && error.code.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        })
        .filter(error => {
            if (filter === 'all') return true;
            if (filter === 'resolved') return error.resolved;
            if (filter === 'unresolved') return !error.resolved;
            return error.severity === filter;
        })
        .sort((a, b) => {
            if (sortBy === 'timestamp') {
                return sortOrder === 'asc'
                    ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            }
            if (sortBy === 'severity') {
                const severityOrder = { info: 1, warning: 2, error: 3, critical: 4 };
                return sortOrder === 'asc'
                    ? severityOrder[a.severity] - severityOrder[b.severity]
                    : severityOrder[b.severity] - severityOrder[a.severity];
            }
            // Par défaut, trier par timestamp
            return sortOrder === 'asc'
                ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });

    // Marquer une erreur comme résolue
    const markAsResolved = async (errorId: string) => {
        try {
            // Remplacer par un appel API réel
            const response = await fetch(`http://localhost:3000/api/admin/errors/${errorId}/resolve`, {
                method: 'POST',
            });
            if (!response.ok) {
                throw new Error('Erreur lors de la résolution');
            }

            // Mettre à jour l'état localement
            setErrors(errors.map(error =>
                error.id === errorId ? { ...error, resolved: true, resolved_at: new Date().toISOString() } : error
            ));

            if (selectedError?.id === errorId) {
                setSelectedError({ ...selectedError, resolved: true, resolved_at: new Date().toISOString() });
            }

            // Mettre à jour les stats
            if (stats) {
                setStats({
                    ...stats,
                    resolvedCount: stats.resolvedCount + 1
                });
            }
        } catch (error: unknown) {
            logger.error('Erreur lors de la résolution:', { error: error });
        }
    };

    // Obtenir la classe CSS pour la sévérité
    const getSeverityClass = (severity: string) => {
        switch (severity) {
            case 'info':
                return 'bg-blue-100 text-blue-800';
            case 'warning':
                return 'bg-yellow-100 text-yellow-800';
            case 'error':
                return 'bg-red-100 text-red-800';
            case 'critical':
                return 'bg-red-600 text-white';
            default:
                return 'bg-gray-100';
        }
    };

    // Formater la date
    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'dd MMM yyyy HH:mm:ss', { locale: fr });
        } catch (e: unknown) {
            return dateString;
        }
    };

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-6">Tableau de bord des erreurs</h1>

            {/* Statistiques */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded shadow">
                        <div className="text-sm text-gray-500">Total des erreurs</div>
                        <div className="text-3xl font-bold">{stats.total}</div>
                    </div>
                    <div className="bg-white p-4 rounded shadow">
                        <div className="text-sm text-gray-500">Erreurs critiques</div>
                        <div className="text-3xl font-bold text-red-600">{stats.bySeverity.critical || 0}</div>
                    </div>
                    <div className="bg-white p-4 rounded shadow">
                        <div className="text-sm text-gray-500">Non résolues</div>
                        <div className="text-3xl font-bold text-yellow-600">{stats.total - stats.resolvedCount}</div>
                    </div>
                    <div className="bg-white p-4 rounded shadow">
                        <div className="text-sm text-gray-500">Dernières 24h</div>
                        <div className="text-3xl font-bold">{stats.recentErrors}</div>
                    </div>
                </div>
            )}

            {/* Filtres et recherche */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        className="w-full p-2 border rounded"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="p-2 border rounded"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">Toutes</option>
                        <option value="critical">Critiques</option>
                        <option value="error">Erreurs</option>
                        <option value="warning">Avertissements</option>
                        <option value="info">Info</option>
                        <option value="resolved">Résolues</option>
                        <option value="unresolved">Non résolues</option>
                    </select>
                    <select
                        className="p-2 border rounded"
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                    >
                        <option value="1h">Dernière heure</option>
                        <option value="24h">Dernières 24h</option>
                        <option value="7d">7 derniers jours</option>
                        <option value="30d">30 derniers jours</option>
                        <option value="all">Toutes</option>
                    </select>
                </div>
            </div>

            {/* Tableau d'erreurs */}
            <div className="bg-white rounded shadow overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4">Chargement des erreurs...</p>
                    </div>
                ) : filteredErrors.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Aucune erreur trouvée pour les critères sélectionnés
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <button
                                            className="flex items-center"
                                            onClick={() => {
                                                if (sortBy === 'severity') {
                                                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                } else {
                                                    setSortBy('severity');
                                                    setSortOrder('desc');
                                                }
                                            }}
                                        >
                                            Sévérité
                                            {sortBy === 'severity' && (
                                                <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </button>
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Message
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <button
                                            className="flex items-center"
                                            onClick={() => {
                                                if (sortBy === 'timestamp') {
                                                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                } else {
                                                    setSortBy('timestamp');
                                                    setSortOrder('desc');
                                                }
                                            }}
                                        >
                                            Date
                                            {sortBy === 'timestamp' && (
                                                <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </button>
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredErrors.map((error) => (
                                    <tr
                                        key={error.id}
                                        className={`${error.resolved ? 'bg-gray-50' : ''
                                            } hover:bg-gray-100 cursor-pointer`}
                                        onClick={() => setSelectedError(error)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getSeverityClass(error.severity)}`}>
                                                {error.severity.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                                {error.message}
                                            </div>
                                            <div className="text-sm text-gray-500">{error.key}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(error.timestamp)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {error.resolved ? (
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                    Résolu
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                    Non résolu
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {!error.resolved && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsResolved(error.id);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Marquer comme résolu
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de détails */}
            {selectedError && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start">
                                <h2 className="text-xl font-bold">Détails de l'erreur</h2>
                                <button
                                    onClick={() => setSelectedError(null)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="mb-4">
                                        <h3 className="text-sm font-medium text-gray-500">Message</h3>
                                        <p className="text-base font-medium">{selectedError.message}</p>
                                    </div>

                                    <div className="mb-4">
                                        <h3 className="text-sm font-medium text-gray-500">Clé</h3>
                                        <p className="text-base">{selectedError.key}</p>
                                    </div>

                                    {selectedError.code && (
                                        <div className="mb-4">
                                            <h3 className="text-sm font-medium text-gray-500">Code</h3>
                                            <p className="text-base">{selectedError.code}</p>
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <h3 className="text-sm font-medium text-gray-500">Sévérité</h3>
                                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getSeverityClass(selectedError.severity)}`}>
                                            {selectedError.severity.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="mb-4">
                                        <h3 className="text-sm font-medium text-gray-500">Date</h3>
                                        <p className="text-base">{formatDate(selectedError.timestamp)}</p>
                                    </div>

                                    {selectedError.url && (
                                        <div className="mb-4">
                                            <h3 className="text-sm font-medium text-gray-500">URL</h3>
                                            <p className="text-base truncate">{selectedError.url}</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    {selectedError.context && (
                                        <div className="mb-4">
                                            <h3 className="text-sm font-medium text-gray-500">Contexte</h3>
                                            <pre className="mt-1 text-xs p-2 bg-gray-50 rounded border overflow-auto max-h-40">
                                                {JSON.stringify(selectedError.context, null, 2)}
                                            </pre>
                                        </div>
                                    )}

                                    {selectedError.userAgent && (
                                        <div className="mb-4">
                                            <h3 className="text-sm font-medium text-gray-500">User Agent</h3>
                                            <p className="text-xs truncate">{selectedError.userAgent}</p>
                                        </div>
                                    )}

                                    {selectedError.resolved && (
                                        <div className="mb-4">
                                            <h3 className="text-sm font-medium text-gray-500">Résolu le</h3>
                                            <p className="text-base">{selectedError.resolved_at ? formatDate(selectedError.resolved_at) : 'N/A'}</p>
                                        </div>
                                    )}

                                    {selectedError.resolved && selectedError.resolved_by && (
                                        <div className="mb-4">
                                            <h3 className="text-sm font-medium text-gray-500">Résolu par</h3>
                                            <p className="text-base">{selectedError.resolved_by}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                {!selectedError.resolved ? (
                                    <button
                                        onClick={() => markAsResolved(selectedError.id)}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Marquer comme résolu
                                    </button>
                                ) : (
                                    <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md">
                                        Erreur résolue
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ErrorDashboard; 