'use client';

import { TeamConfiguration } from '@/types/team-configuration';

interface ConsultationsFormProps {
    config: TeamConfiguration;
    updateConfig: (path: string, value: any) => void;
}

export default function ConsultationsForm({ config, updateConfig }: ConsultationsFormProps) {
    const handleNumberInput = (path: string, value: string) => {
        const numValue = value === '' ? 0 : Number(value);
        updateConfig(path, numValue);
    };

    const handleToggle = (path: string, value: boolean) => {
        updateConfig(path, value);
    };

    return (
        <div className="space-y-8">
            <h2 className="text-xl font-semibold mb-4">Configuration des consultations</h2>

            {/* Volume des consultations */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Volume des consultations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="temps-plein" className="block text-sm font-medium text-gray-700 mb-1">
                            Consultations par semaine (temps plein)
                        </label>
                        <input
                            type="number"
                            id="temps-plein"
                            min="0"
                            value={config.consultations.volume.tempsPlein}
                            onChange={(e) => handleNumberInput('consultations.volume.tempsPlein', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="proportionnel"
                            checked={config.consultations.volume.proportionnelTempsPartiel}
                            onChange={(e) => handleToggle('consultations.volume.proportionnelTempsPartiel', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="proportionnel" className="ml-2 block text-sm font-medium text-gray-700">
                            Proportionnel au temps partiel
                        </label>
                    </div>
                </div>
            </div>

            {/* Limites des consultations */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Limites des consultations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="max-semaine" className="block text-sm font-medium text-gray-700 mb-1">
                            Maximum de consultations par semaine
                        </label>
                        <input
                            type="number"
                            id="max-semaine"
                            min="0"
                            value={config.consultations.limites.maxParSemaine}
                            onChange={(e) => handleNumberInput('consultations.limites.maxParSemaine', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="repartition" className="block text-sm font-medium text-gray-700 mb-1">
                            Répartition maximale (format: "matin-après-midi")
                        </label>
                        <input
                            type="text"
                            id="repartition"
                            value={config.consultations.limites.repartitionMaximale}
                            onChange={(e) => updateConfig('consultations.limites.repartitionMaximale', e.target.value)}
                            placeholder="Ex: 2-1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Format: nombre de matins-nombre d'après-midis (ex: 2-1)</p>
                    </div>
                </div>
            </div>

            {/* Flexibilité des consultations */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Flexibilité des consultations</h3>
                <div className="space-y-4">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="fermeture-periodes"
                            checked={config.consultations.flexibilite.fermeturePeriodes}
                            onChange={(e) => handleToggle('consultations.flexibilite.fermeturePeriodes', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="fermeture-periodes" className="ml-2 block text-sm font-medium text-gray-700">
                            Permettre la fermeture de certaines périodes
                        </label>
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="generation-partielle"
                            checked={config.consultations.flexibilite.generationPartielle}
                            onChange={(e) => handleToggle('consultations.flexibilite.generationPartielle', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="generation-partielle" className="ml-2 block text-sm font-medium text-gray-700">
                            Permettre la génération partielle du planning
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
} 