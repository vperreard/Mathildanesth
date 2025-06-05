import React, { useState, useEffect } from 'react';
import { LeaveType } from '../types/leave';
import { EnhancedQuotaState } from '../types/quota';
import { quotaAdvancedService } from '../services/QuotaAdvancedService';
import { formatDate } from '../../../utils/dateUtils';

export interface EnhancedQuotaDisplayProps {
    userId: string;
    year?: number;
}

/**
 * Composant d'affichage des quotas améliorés avec informations de transfert et report
 */
export const EnhancedQuotaDisplay: React.FC<EnhancedQuotaDisplayProps> = ({
    userId,
    year = new Date().getFullYear()
}) => {
    const [quotaStates, setQuotaStates] = useState<EnhancedQuotaState[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedType, setExpandedType] = useState<LeaveType | null>(null);

    // Charger les quotas améliorés
    const loadEnhancedQuotas = async () => {
        setLoading(true);
        setError(null);

        try {
            const enhancedQuotas = await quotaAdvancedService.getEnhancedQuotaState(userId, year);
            setQuotaStates(enhancedQuotas);
        } catch (err: unknown) {
            setError(`Erreur lors du chargement des quotas : ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setLoading(false);
        }
    };

    // Charger les quotas au montage
    useEffect(() => {
        loadEnhancedQuotas();
    }, [userId, year]);

    // Basculer l'état d'expansion d'un type
    const toggleExpand = (type: LeaveType) => {
        setExpandedType(expandedType === type ? null : type);
    };

    // Détermine si le quota est faible (moins de 20% restant)
    const isLowQuota = (quota: EnhancedQuotaState) => {
        if (quota.total === 0) return false;
        return (quota.remaining / quota.total) < 0.2;
    };

    // Détermine la couleur en fonction du quota restant
    const getQuotaColor = (quota: EnhancedQuotaState) => {
        if (quota.total === 0) return 'bg-gray-200';
        const ratio = quota.remaining / quota.total;
        if (ratio < 0.1) return 'bg-red-500';
        if (ratio < 0.2) return 'bg-orange-400';
        if (ratio < 0.5) return 'bg-yellow-300';
        return 'bg-green-400';
    };

    // Calcule le pourcentage de quota utilisé pour le rendu visuel
    const getQuotaPercentage = (quota: EnhancedQuotaState) => {
        if (quota.total === 0) return 0;
        return Math.min(100, Math.round((quota.used + quota.pending) / quota.total * 100));
    };

    // Obtenir le libellé du type de congé
    const getLeaveTypeLabel = (type: LeaveType): string => {
        const labels: Record<string, string> = {
            CONGE_PAYE: 'Congés payés',
            RTT: 'RTT',
            MALADIE: 'Maladie',
            SANS_SOLDE: 'Sans solde',
            MATERNITE: 'Maternité',
            PATERNITE: 'Paternité',
            FORMATION: 'Formation',
            AUTRE: 'Autre',
        };

        return labels[type] || type;
    };

    // Filtrer pour n'afficher que les types avec un quota ou des transferts/reports
    const relevantQuotas = quotaStates.filter(
        q => q.total > 0 || q.totalCarriedOver > 0 || q.totalTransferredIn > 0 || q.totalTransferredOut > 0
    );

    return (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                    Vos quotas de congés {year}
                </h3>
                <select
                    value={year}
                    onChange={(e) => window.location.href = `?year=${e.target.value}`}
                    className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                >
                    {[year - 2, year - 1, year, year + 1].map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : error ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-md">
                    <p>{error}</p>
                </div>
            ) : (
                <>
                    {/* Afficher les quotas qui expirent bientôt */}
                    {quotaStates.some(q => q.expiringCarryOver) && (
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                            <h4 className="text-sm font-medium text-amber-800 mb-1">Jours qui vont bientôt expirer :</h4>
                            <ul className="space-y-1">
                                {quotaStates
                                    .filter(q => q.expiringCarryOver)
                                    .map(q => (
                                        <li key={`exp-${q.type}`} className="text-sm">
                                            <span className="font-medium">{q.expiringCarryOver!.amount} jour(s)</span> de {getLeaveTypeLabel(q.type)} expirent le {formatDate(q.expiringCarryOver!.expiryDate)}
                                            {q.expiringCarryOver!.daysUntilExpiry <= 7 && (
                                                <span className="text-red-600 font-medium"> (dans {q.expiringCarryOver!.daysUntilExpiry} jour{q.expiringCarryOver!.daysUntilExpiry > 1 ? 's' : ''})</span>
                                            )}
                                        </li>
                                    ))}
                            </ul>
                        </div>
                    )}

                    {/* Liste des quotas */}
                    <div className="space-y-3">
                        {relevantQuotas.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">Aucun quota disponible pour cette année</p>
                        ) : (
                            relevantQuotas.map(quota => (
                                <div
                                    key={quota.type}
                                    className="border rounded-md transition-all duration-200"
                                >
                                    {/* Entête avec résumé */}
                                    <div
                                        className="p-3 cursor-pointer hover:bg-gray-50"
                                        onClick={() => toggleExpand(quota.type)}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center">
                                                <span className="text-sm font-medium text-gray-700 mr-1">
                                                    {getLeaveTypeLabel(quota.type)}
                                                </span>
                                                {(quota.totalCarriedOver > 0 || quota.totalTransferredIn > 0) && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                        {quota.totalCarriedOver > 0 && quota.totalTransferredIn > 0
                                                            ? 'Reporté & Transféré'
                                                            : quota.totalCarriedOver > 0
                                                                ? 'Reporté'
                                                                : 'Transféré'}
                                                    </span>
                                                )}
                                            </div>
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

                                    {/* Détails (si expanded) */}
                                    {expandedType === quota.type && (
                                        <div className="px-3 pb-3 pt-1 border-t border-gray-100">
                                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                                                <div>
                                                    <p>Jours utilisés: <span className="font-medium">{quota.used}</span></p>
                                                    <p>Jours en attente: <span className="font-medium">{quota.pending}</span></p>
                                                    <p>Restant: <span className="font-medium">{quota.remaining}</span></p>
                                                </div>
                                                <div>
                                                    {quota.totalTransferredIn > 0 && (
                                                        <p className="text-blue-600">Reçu par transfert: <span className="font-medium">+{quota.totalTransferredIn}</span></p>
                                                    )}
                                                    {quota.totalTransferredOut > 0 && (
                                                        <p className="text-amber-600">Donné par transfert: <span className="font-medium">-{quota.totalTransferredOut}</span></p>
                                                    )}
                                                    {quota.totalCarriedOver > 0 && (
                                                        <p className="text-green-600">Reporté de l'année précédente: <span className="font-medium">+{quota.totalCarriedOver}</span></p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Historique des reports */}
                                            {quota.carriedOverItems.length > 0 && (
                                                <div className="mt-3">
                                                    <h5 className="text-xs font-medium mb-1 text-gray-500">
                                                        REPORTS DE L'ANNÉE PRÉCÉDENTE
                                                    </h5>
                                                    <ul className="text-xs text-gray-600 space-y-1">
                                                        {quota.carriedOverItems.map((item, idx) => (
                                                            <li key={`co-${quota.type}-${idx}`} className="flex justify-between">
                                                                <span>Depuis {item.fromYear}: <span className="font-medium">+{item.amount} jour(s)</span></span>
                                                                {item.expiryDate && (
                                                                    <span className="text-amber-600">Expire le {formatDate(item.expiryDate)}</span>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Historique des transferts */}
                                            {quota.transferItems.length > 0 && (
                                                <div className="mt-3">
                                                    <h5 className="text-xs font-medium mb-1 text-gray-500">
                                                        TRANSFERTS DE L'ANNÉE EN COURS
                                                    </h5>
                                                    <ul className="text-xs text-gray-600 space-y-1">
                                                        {quota.transferItems.map((item, idx) => (
                                                            <li key={`tr-${quota.type}-${idx}`} className="flex justify-between">
                                                                <span>
                                                                    {item.type === 'in'
                                                                        ? `Depuis ${getLeaveTypeLabel(item.relatedType)}: `
                                                                        : `Vers ${getLeaveTypeLabel(item.relatedType)}: `}
                                                                    <span className={`font-medium ${item.type === 'in' ? 'text-blue-600' : 'text-amber-600'}`}>
                                                                        {item.type === 'in' ? '+' : '-'}{item.amount} jour(s)
                                                                    </span>
                                                                </span>
                                                                <span className="text-gray-400">{formatDate(item.date)}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}; 