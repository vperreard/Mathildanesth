import React from 'react';
import { LeaveType } from '../types/leave';
import { LeaveTypeQuota } from '../hooks/useLeaveQuota';

export interface LeaveQuotaDisplayProps {
    quotasByType: LeaveTypeQuota[];
    totalBalance: {
        total: number;
        used: number;
        pending: number;
        remaining: number;
    };
    selectedType?: LeaveType;
    loading?: boolean;
}

/**
 * Composant pour afficher les quotas de congés à l'utilisateur
 * 
 * Affiche:
 * - Solde global
 * - Détail par type de congé
 * - Visualisation graphique des quotas
 */
export const LeaveQuotaDisplay: React.FC<LeaveQuotaDisplayProps> = ({
    quotasByType,
    totalBalance,
    selectedType,
    loading = false
}) => {
    // Détermine si le quota est faible (moins de 20% restant)
    const isLowQuota = (quota: LeaveTypeQuota) => {
        if (quota.total === 0) return false;
        return (quota.remaining / quota.total) < 0.2;
    };

    // Détermine la couleur en fonction du quota restant
    const getQuotaColor = (quota: LeaveTypeQuota) => {
        if (quota.total === 0) return 'bg-gray-200';
        const ratio = quota.remaining / quota.total;
        if (ratio < 0.1) return 'bg-red-500';
        if (ratio < 0.2) return 'bg-orange-400';
        if (ratio < 0.5) return 'bg-yellow-300';
        return 'bg-green-400';
    };

    // Calcule le pourcentage de quota utilisé pour le rendu visuel
    const getQuotaPercentage = (quota: LeaveTypeQuota) => {
        if (quota.total === 0) return 0;
        return Math.min(100, Math.round((quota.used + quota.pending) / quota.total * 100));
    };

    // Filtrer pour n'afficher que les types avec un quota positif ou sélectionné
    const filteredQuotas = quotasByType.filter(
        q => q.total > 0 || q.type === selectedType
    );

    return (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
                Vos quotas de congés
            </h3>

            {loading ? (
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <>
                    {/* Solde global */}
                    <div className="mb-4 bg-blue-50 p-4 rounded-md">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-gray-500">Total</p>
                                <p className="text-lg font-semibold text-gray-900">{totalBalance.total} jours</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Utilisés</p>
                                <p className="text-lg font-semibold text-gray-700">{totalBalance.used} jours</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">En attente</p>
                                <p className="text-lg font-semibold text-orange-500">{totalBalance.pending} jours</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Disponibles</p>
                                <p className="text-lg font-semibold text-green-600">{totalBalance.remaining} jours</p>
                            </div>
                        </div>
                    </div>

                    {/* Détail par type */}
                    <div className="space-y-3">
                        {filteredQuotas.map(quota => (
                            <div
                                key={quota.type}
                                className={`p-3 rounded-md ${quota.type === selectedType ? 'border-2 border-blue-400' : ''}`}
                            >
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700">
                                        {quota.label}
                                    </span>
                                    <span className={`text-sm font-medium ${isLowQuota(quota) ? 'text-red-600' : 'text-green-600'}`}>
                                        {quota.remaining} / {quota.total} jours
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className={`${getQuotaColor(quota)} h-2.5 rounded-full`}
                                        style={{ width: `${getQuotaPercentage(quota)}%` }}
                                    ></div>
                                </div>
                                {quota.pending > 0 && (
                                    <div className="text-xs text-orange-500 mt-1">
                                        {quota.pending} jour(s) en attente d'approbation
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}; 