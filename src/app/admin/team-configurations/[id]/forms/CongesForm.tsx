'use client';

import { TeamConfiguration } from '@/types/team-configuration';

interface CongesFormProps {
    config: TeamConfiguration;
    updateConfig: (path: string, value: any) => void;
}

export default function CongesForm({ config, updateConfig }: CongesFormProps) {
    const handleNumberInput = (path: string, value: string) => {
        const numValue = value === '' ? 0 : Number(value);
        updateConfig(path, numValue);
    };

    const handleToggle = (path: string, value: boolean) => {
        updateConfig(path, value);
    };

    const handleSelectChange = (path: string, value: string) => {
        updateConfig(path, value);
    };

    return (
        <div className="space-y-8">
            <h2 className="text-xl font-semibold mb-4">Configuration des congés</h2>

            {/* Quotas */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Quotas de congés</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="temps-plein" className="block text-sm font-medium text-gray-700 mb-1">
                            Jours de congés annuels (temps plein)
                        </label>
                        <input
                            type="number"
                            id="temps-plein"
                            min="0"
                            value={config.conges.quotas.tempsPlein}
                            onChange={(e) => handleNumberInput('conges.quotas.tempsPlein', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="proportionnel"
                            checked={config.conges.quotas.proportionnelTempsPartiel}
                            onChange={(e) => handleToggle('conges.quotas.proportionnelTempsPartiel', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="proportionnel" className="ml-2 block text-sm font-medium text-gray-700">
                            Proportionnel au temps partiel
                        </label>
                    </div>
                </div>
            </div>

            {/* Décompte */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Règles de décompte</h3>
                <div className="space-y-4">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="jours-ouvrables"
                            checked={config.conges.decompte.joursOuvrables}
                            onChange={(e) => handleToggle('conges.decompte.joursOuvrables', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="jours-ouvrables" className="ml-2 block text-sm font-medium text-gray-700">
                            Compter uniquement les jours ouvrables (lundi-vendredi)
                        </label>
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="exclus-feries"
                            checked={config.conges.decompte.exclusFeries}
                            onChange={(e) => handleToggle('conges.decompte.exclusFeries', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="exclus-feries" className="ml-2 block text-sm font-medium text-gray-700">
                            Exclure les jours fériés
                        </label>
                    </div>
                </div>
            </div>

            {/* Validation */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Processus de validation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="workflow" className="block text-sm font-medium text-gray-700 mb-1">
                            Type de workflow
                        </label>
                        <select
                            id="workflow"
                            value={config.conges.validation.workflow}
                            onChange={(e) => handleSelectChange('conges.validation.workflow', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="SIMPLE">Simple (un niveau)</option>
                            <option value="MULTI_NIVEAUX">Multi-niveaux</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="delai-minimum" className="block text-sm font-medium text-gray-700 mb-1">
                            Délai minimum avant demande (jours)
                        </label>
                        <input
                            type="number"
                            id="delai-minimum"
                            min="0"
                            value={config.conges.validation.delaiMinimum}
                            onChange={(e) => handleNumberInput('conges.validation.delaiMinimum', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Restrictions périodes pic */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Restrictions périodes pic</h3>

                <div className="border-b border-gray-200 pb-4 mb-4">
                    <h4 className="font-medium mb-2">Période estivale</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="max-simultane-ete" className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre maximum de personnes simultanément
                            </label>
                            <input
                                type="number"
                                id="max-simultane-ete"
                                min="0"
                                value={config.conges.restrictions.periodePic.ete.maxSimultane}
                                onChange={(e) => handleNumberInput('conges.restrictions.periodePic.ete.maxSimultane', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="priorite-ete" className="block text-sm font-medium text-gray-700 mb-1">
                                Critère de priorité
                            </label>
                            <select
                                id="priorite-ete"
                                value={config.conges.restrictions.periodePic.ete.priorite}
                                onChange={(e) => handleSelectChange('conges.restrictions.periodePic.ete.priorite', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="ANCIENNETE">Ancienneté</option>
                                <option value="ROTATION">Rotation annuelle</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="font-medium mb-2">Période de Noël</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="max-simultane-noel" className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre maximum de personnes simultanément
                            </label>
                            <input
                                type="number"
                                id="max-simultane-noel"
                                min="0"
                                value={config.conges.restrictions.periodePic.noel.maxSimultane}
                                onChange={(e) => handleNumberInput('conges.restrictions.periodePic.noel.maxSimultane', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="priorite-noel" className="block text-sm font-medium text-gray-700 mb-1">
                                Critère de priorité
                            </label>
                            <select
                                id="priorite-noel"
                                value={config.conges.restrictions.periodePic.noel.priorite}
                                onChange={(e) => handleSelectChange('conges.restrictions.periodePic.noel.priorite', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="ANCIENNETE">Ancienneté</option>
                                <option value="ROTATION">Rotation annuelle</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 