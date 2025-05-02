import React, { useState, useEffect } from 'react';
import { useLeaveQuota } from '../hooks/useLeaveQuota';
import { EnhancedQuotaDisplay } from './EnhancedQuotaDisplay';
import { QuotaTransferForm } from './QuotaTransferForm';
import { QuotaCarryOverForm } from './QuotaCarryOverForm';

export interface QuotaManagementPanelProps {
    userId: string;
    year?: number;
}

/**
 * Panneau de gestion complet des quotas de congés
 * Intègre l'affichage des quotas et les actions de transfert/report
 */
export const QuotaManagementPanel: React.FC<QuotaManagementPanelProps> = ({
    userId,
    year = new Date().getFullYear()
}) => {
    const [activeTab, setActiveTab] = useState<'view' | 'transfer' | 'carryover'>('view');

    // Utilisation du hook de quotas existant pour obtenir les quotas de base
    const { quotasByType, loading, error, refreshQuotas } = useLeaveQuota({ userId, year });

    // Fonction pour gérer le rafraîchissement après une action
    const handleActionComplete = () => {
        refreshQuotas(userId);
        // Revenir à l'onglet d'affichage après une action réussie
        setTimeout(() => setActiveTab('view'), 2000);
    };

    return (
        <div className="mt-4">
            {/* Onglets */}
            <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                    <button
                        onClick={() => setActiveTab('view')}
                        className={`py-4 px-6 text-center border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'view'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        État des quotas
                    </button>
                    <button
                        onClick={() => setActiveTab('transfer')}
                        className={`py-4 px-6 text-center border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'transfer'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Transférer des jours
                    </button>
                    <button
                        onClick={() => setActiveTab('carryover')}
                        className={`py-4 px-6 text-center border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'carryover'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Reporter sur l'année suivante
                    </button>
                </nav>
            </div>

            {/* Contenu des onglets */}
            <div className="mt-4">
                {activeTab === 'view' && (
                    <EnhancedQuotaDisplay userId={userId} year={year} />
                )}

                {activeTab === 'transfer' && (
                    <QuotaTransferForm
                        userId={userId}
                        quotasByType={quotasByType}
                        onTransferComplete={handleActionComplete}
                    />
                )}

                {activeTab === 'carryover' && (
                    <QuotaCarryOverForm
                        userId={userId}
                        quotasByType={quotasByType}
                        onCarryOverComplete={handleActionComplete}
                    />
                )}
            </div>

            {/* Informations supplémentaires */}
            <div className="mt-8 bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
                <h4 className="font-medium mb-2">À propos de la gestion des quotas</h4>
                <p className="mb-2">
                    Cette interface vous permet de gérer vos quotas de congés de manière avancée :
                </p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>
                        <strong>Transfert de jours</strong> : Convertissez des jours d'un type de congé à un autre (ex: RTT vers congés payés).
                    </li>
                    <li>
                        <strong>Report de jours</strong> : Reportez vos jours non pris sur l'année suivante, selon les règles en vigueur.
                    </li>
                </ul>
                <p className="mt-2 text-xs text-blue-600">
                    Note: Les actions de transfert et de report sont soumises à des règles spécifiques qui peuvent limiter les montants transférables ou reportables.
                </p>
            </div>
        </div>
    );
}; 