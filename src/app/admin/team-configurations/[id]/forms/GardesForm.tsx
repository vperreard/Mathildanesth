'use client';

import { TeamConfiguration } from '@/types/team-configuration';
import { useState } from 'react';

interface GardesFormProps {
    config: TeamConfiguration;
    updateConfig: (path: string, value: any) => void;
}

export default function GardesForm({ config, updateConfig }: GardesFormProps) {
    const [incompatibiliteEnCours, setIncompatibiliteEnCours] = useState('');

    const handleNumberInput = (path: string, value: string) => {
        const numValue = value === '' ? 0 : Number(value);
        updateConfig(path, numValue);
    };

    const handleFloatInput = (path: string, value: string) => {
        const numValue = value === '' ? 0 : parseFloat(value);
        updateConfig(path, numValue);
    };

    const handleToggle = (path: string, value: boolean) => {
        updateConfig(path, value);
    };

    const handleAddIncompatibilite = () => {
        if (!incompatibiliteEnCours.trim()) return;

        const currentIncompatibilites = [...config.gardes.regles.incompatibilites];
        if (!currentIncompatibilites.includes(incompatibiliteEnCours)) {
            currentIncompatibilites.push(incompatibiliteEnCours);
            updateConfig('gardes.regles.incompatibilites', currentIncompatibilites);
        }

        setIncompatibiliteEnCours('');
    };

    const handleRemoveIncompatibilite = (item: string) => {
        const currentIncompatibilites = [...config.gardes.regles.incompatibilites];
        const updatedIncompatibilites = currentIncompatibilites.filter(i => i !== item);
        updateConfig('gardes.regles.incompatibilites', updatedIncompatibilites);
    };

    return (
        <div className="space-y-8">
            <h2 className="text-xl font-semibold mb-4">Configuration des gardes</h2>

            {/* Structure des gardes */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Structure des gardes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="nombre-garde" className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre de gardes par jour
                        </label>
                        <input
                            type="number"
                            id="nombre-garde"
                            min="0"
                            value={config.gardes.structure.parJour.garde}
                            onChange={(e) => handleNumberInput('gardes.structure.parJour.garde', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="nombre-astreinte" className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre d'astreintes par jour
                        </label>
                        <input
                            type="number"
                            id="nombre-astreinte"
                            min="0"
                            value={config.gardes.structure.parJour.astreinte}
                            onChange={(e) => handleNumberInput('gardes.structure.parJour.astreinte', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Règles des gardes */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Règles des gardes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="espacement-min" className="block text-sm font-medium text-gray-700 mb-1">
                            Espacement minimum entre gardes (jours)
                        </label>
                        <input
                            type="number"
                            id="espacement-min"
                            min="0"
                            value={config.gardes.regles.espacementMinimum}
                            onChange={(e) => handleNumberInput('gardes.regles.espacementMinimum', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="espacement-ideal" className="block text-sm font-medium text-gray-700 mb-1">
                            Espacement idéal entre gardes (jours)
                        </label>
                        <input
                            type="number"
                            id="espacement-ideal"
                            min="0"
                            value={config.gardes.regles.espacementIdeal}
                            onChange={(e) => handleNumberInput('gardes.regles.espacementIdeal', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="max-par-mois" className="block text-sm font-medium text-gray-700 mb-1">
                            Maximum de gardes par mois (normal)
                        </label>
                        <input
                            type="number"
                            id="max-par-mois"
                            min="0"
                            value={config.gardes.regles.maxParMois}
                            onChange={(e) => handleNumberInput('gardes.regles.maxParMois', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="max-exceptionnel" className="block text-sm font-medium text-gray-700 mb-1">
                            Maximum de gardes par mois (exceptionnel)
                        </label>
                        <input
                            type="number"
                            id="max-exceptionnel"
                            min="0"
                            value={config.gardes.regles.maxExceptionnel}
                            onChange={(e) => handleNumberInput('gardes.regles.maxExceptionnel', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <div className="flex items-center mb-2">
                        <input
                            type="checkbox"
                            id="repos-obligatoire"
                            checked={config.gardes.regles.reposApresGarde.obligatoire}
                            onChange={(e) => handleToggle('gardes.regles.reposApresGarde.obligatoire', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="repos-obligatoire" className="ml-2 block text-sm font-medium text-gray-700">
                            Repos obligatoire après garde
                        </label>
                    </div>

                    {config.gardes.regles.reposApresGarde.obligatoire && (
                        <div className="ml-6 mt-2">
                            <label htmlFor="duree-repos" className="block text-sm font-medium text-gray-700 mb-1">
                                Durée du repos (heures)
                            </label>
                            <input
                                type="number"
                                id="duree-repos"
                                min="0"
                                value={config.gardes.regles.reposApresGarde.duree}
                                onChange={(e) => handleNumberInput('gardes.regles.reposApresGarde.duree', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    )}
                </div>

                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Incompatibilités (ne pas planifier en même temps)
                    </label>

                    <div className="flex mb-2">
                        <input
                            type="text"
                            value={incompatibiliteEnCours}
                            onChange={(e) => setIncompatibiliteEnCours(e.target.value)}
                            placeholder="Ex: CONSULTATION"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            type="button"
                            onClick={handleAddIncompatibilite}
                            className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
                        >
                            Ajouter
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                        {config.gardes.regles.incompatibilites.map((item) => (
                            <span
                                key={item}
                                className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                            >
                                {item}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveIncompatibilite(item)}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Distribution des gardes */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Distribution des gardes</h3>

                <div className="border-b border-gray-200 pb-4 mb-4">
                    <h4 className="font-medium mb-2">Week-ends</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="poids-weekend" className="block text-sm font-medium text-gray-700 mb-1">
                                Coefficient multiplicateur
                            </label>
                            <input
                                type="number"
                                id="poids-weekend"
                                min="0"
                                step="0.1"
                                value={config.gardes.distribution.weekends.poids}
                                onChange={(e) => handleFloatInput('gardes.distribution.weekends.poids', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="rotation-weekend"
                                checked={config.gardes.distribution.weekends.rotationAnnuelle}
                                onChange={(e) => handleToggle('gardes.distribution.weekends.rotationAnnuelle', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="rotation-weekend" className="ml-2 block text-sm font-medium text-gray-700">
                                Rotation annuelle
                            </label>
                        </div>
                    </div>
                </div>

                <div className="border-b border-gray-200 pb-4 mb-4">
                    <h4 className="font-medium mb-2">Jours fériés</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="poids-feries" className="block text-sm font-medium text-gray-700 mb-1">
                                Coefficient multiplicateur
                            </label>
                            <input
                                type="number"
                                id="poids-feries"
                                min="0"
                                step="0.1"
                                value={config.gardes.distribution.joursFeries.poids}
                                onChange={(e) => handleFloatInput('gardes.distribution.joursFeries.poids', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="compte-separe"
                                checked={config.gardes.distribution.joursFeries.compteSepare}
                                onChange={(e) => handleToggle('gardes.distribution.joursFeries.compteSepare', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="compte-separe" className="ml-2 block text-sm font-medium text-gray-700">
                                Compte séparé pour les fériés
                            </label>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="font-medium mb-2">Fêtes de fin d'année</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="gestion-manuelle"
                                checked={config.gardes.distribution.feteFinAnnee.gestionManuelle}
                                onChange={(e) => handleToggle('gardes.distribution.feteFinAnnee.gestionManuelle', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="gestion-manuelle" className="ml-2 block text-sm font-medium text-gray-700">
                                Gestion manuelle
                            </label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="suivi-fetes"
                                checked={config.gardes.distribution.feteFinAnnee.suivi}
                                onChange={(e) => handleToggle('gardes.distribution.feteFinAnnee.suivi', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="suivi-fetes" className="ml-2 block text-sm font-medium text-gray-700">
                                Suivi sur plusieurs années
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 