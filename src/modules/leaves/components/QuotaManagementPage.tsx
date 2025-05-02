import React, { useState } from 'react';
import { QuotaTransferForm } from './QuotaTransferForm';
import { QuotaCarryOverForm } from './QuotaCarryOverForm';
import { SpecialPeriodManager } from './SpecialPeriodManager';

// Types d'onglets disponibles
enum TabType {
    TRANSFER = 'transfer',
    CARRY_OVER = 'carryOver',
    SPECIAL_PERIODS = 'specialPeriods'
}

interface QuotaManagementPageProps {
    userId: string;
    isAdmin?: boolean;
}

export const QuotaManagementPage: React.FC<QuotaManagementPageProps> = ({
    userId,
    isAdmin = false
}) => {
    // État pour suivre l'onglet actif
    const [activeTab, setActiveTab] = useState<TabType>(TabType.TRANSFER);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Gestionnaire pour le changement d'onglet
    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setSuccessMessage(null);
    };

    // Gestionnaire pour le succès d'une opération
    const handleOperationSuccess = (message: string) => {
        setSuccessMessage(message);
        // Réinitialiser après 5 secondes
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Gestion des quotas de congés</h1>

            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 flex justify-between items-center">
                    <span>{successMessage}</span>
                    <button
                        type="button"
                        className="text-green-700"
                        onClick={() => setSuccessMessage(null)}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Navigation par onglets */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex">
                    <button
                        className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === TabType.TRANSFER
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        onClick={() => handleTabChange(TabType.TRANSFER)}
                    >
                        Transfert de quotas
                    </button>
                    <button
                        className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === TabType.CARRY_OVER
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        onClick={() => handleTabChange(TabType.CARRY_OVER)}
                    >
                        Report de quotas
                    </button>
                    {isAdmin && (
                        <button
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === TabType.SPECIAL_PERIODS
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            onClick={() => handleTabChange(TabType.SPECIAL_PERIODS)}
                        >
                            Périodes spéciales
                        </button>
                    )}
                </nav>
            </div>

            {/* Contenu des onglets */}
            <div>
                {activeTab === TabType.TRANSFER && (
                    <QuotaTransferForm
                        userId={userId}
                        onTransferComplete={() => handleOperationSuccess('Transfert de quotas effectué avec succès !')}
                    />
                )}

                {activeTab === TabType.CARRY_OVER && (
                    <QuotaCarryOverForm
                        userId={userId}
                        onCarryOverComplete={() => handleOperationSuccess('Report de quotas effectué avec succès !')}
                    />
                )}

                {activeTab === TabType.SPECIAL_PERIODS && isAdmin && (
                    <SpecialPeriodManager
                        onSaveComplete={() => handleOperationSuccess('Période spéciale enregistrée avec succès !')}
                    />
                )}
            </div>

            {/* Informations générales */}
            <div className="mt-12 bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Gestion avancée des quotas</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Cette page vous permet de gérer vos quotas de congés de manière flexible :
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                    <li>
                        <strong>Transfert de quotas</strong> : Convertissez des jours d'un type de congé vers un autre,
                        selon des règles et ratios prédéfinis.
                    </li>
                    <li>
                        <strong>Report de quotas</strong> : Reportez les jours non utilisés d'une année sur l'autre,
                        selon les règles de report en vigueur.
                    </li>
                    {isAdmin && (
                        <li>
                            <strong>Périodes spéciales</strong> : Configurez des règles particulières pour certaines périodes
                            (été, fêtes, etc.) avec des quotas garantis et règles de priorité.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}; 