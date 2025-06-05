'use client';

import { TeamConfiguration } from '@/types/team-configuration';
import { useState } from 'react';

interface BlocFormProps {
    config: TeamConfiguration;
    updateConfig: (path: string, value: unknown) => void;
}

export default function BlocForm({ config, updateConfig }: BlocFormProps) {
    const [nouveauSecteur, setNouveauSecteur] = useState('');
    const [nouveauNumero, setNouveauNumero] = useState('');
    const [selectedSalle, setSelectedSalle] = useState<{ secteur: string, index: number } | null>(null);

    const handleNumberInput = (path: string, value: string) => {
        const numValue = value === '' ? 0 : Number(value);
        updateConfig(path, numValue);
    };

    const handleToggle = (path: string, value: boolean) => {
        updateConfig(path, value);
    };

    // Ajouter un nouveau secteur
    const handleAjouterSecteur = () => {
        if (!nouveauSecteur.trim()) return;

        const sallesActuelles = { ...config.bloc.salles };
        if (!sallesActuelles[nouveauSecteur]) {
            sallesActuelles[nouveauSecteur] = {
                nombre: 0,
                numeros: []
            };
            updateConfig('bloc.salles', sallesActuelles);
        }

        setNouveauSecteur('');
    };

    // Supprimer un secteur
    const handleSupprimerSecteur = (secteur: string) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer le secteur "${secteur}" et toutes ses salles ?`)) {
            return;
        }

        const sallesActuelles = { ...config.bloc.salles };
        delete sallesActuelles[secteur];
        updateConfig('bloc.salles', sallesActuelles);
    };

    // Ajouter un numéro de salle à un secteur
    const handleAjouterSalle = (secteur: string) => {
        if (!nouveauNumero.trim()) return;

        const sallesActuelles = { ...config.bloc.salles };
        const numerosSalles = [...sallesActuelles[secteur].numeros];

        if (!numerosSalles.includes(nouveauNumero)) {
            numerosSalles.push(nouveauNumero);

            sallesActuelles[secteur] = {
                ...sallesActuelles[secteur],
                nombre: numerosSalles.length,
                numeros: numerosSalles
            };

            updateConfig('bloc.salles', sallesActuelles);
        }

        setNouveauNumero('');
    };

    // Supprimer un numéro de salle
    const handleSupprimerSalle = (secteur: string, index: number) => {
        const sallesActuelles = { ...config.bloc.salles };
        const numerosSalles = [...sallesActuelles[secteur].numeros];

        numerosSalles.splice(index, 1);

        sallesActuelles[secteur] = {
            ...sallesActuelles[secteur],
            nombre: numerosSalles.length,
            numeros: numerosSalles
        };

        updateConfig('bloc.salles', sallesActuelles);
    };

    return (
        <div className="space-y-8">
            <h2 className="text-xl font-semibold mb-4">Configuration du bloc opératoire</h2>

            {/* Configuration des salles */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Salles d'opération</h3>

                <div className="mb-6">
                    <h4 className="font-medium mb-2">Ajouter un nouveau secteur</h4>
                    <div className="flex mb-4">
                        <input
                            type="text"
                            value={nouveauSecteur}
                            onChange={(e) => setNouveauSecteur(e.target.value)}
                            placeholder="Nom du secteur"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            type="button"
                            onClick={handleAjouterSecteur}
                            className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
                        >
                            Ajouter
                        </button>
                    </div>
                </div>

                {Object.keys(config.bloc.salles).length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Aucun secteur défini</p>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(config.bloc.salles).map(([secteur, data]) => (
                            <div key={secteur} className="border border-gray-200 rounded-md p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-medium">{secteur}</h4>
                                    <button
                                        type="button"
                                        onClick={() => handleSupprimerSecteur(secteur)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        Supprimer
                                    </button>
                                </div>

                                <div className="mb-4">
                                    <div className="flex">
                                        <input
                                            type="text"
                                            value={nouveauNumero}
                                            onChange={(e) => setNouveauNumero(e.target.value)}
                                            placeholder="Numéro de salle"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleAjouterSalle(secteur)}
                                            className="bg-green-500 text-white px-3 py-2 rounded-r-md hover:bg-green-600"
                                        >
                                            Ajouter
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-700 mb-2">Salles ({data.nombre}):</p>
                                    <div className="flex flex-wrap gap-2">
                                        {data.numeros.map((numero, index) => (
                                            <span
                                                key={`${secteur}-${index}`}
                                                className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                                            >
                                                {numero}
                                                <button
                                                    type="button"
                                                    onClick={() => handleSupprimerSalle(secteur, index)}
                                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Règles de supervision */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Règles de supervision</h3>

                <div className="border-b border-gray-200 pb-4 mb-4">
                    <h4 className="font-medium mb-2">Règles de base</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="max-salles" className="block text-sm font-medium text-gray-700 mb-1">
                                Maximum de salles par MAR
                            </label>
                            <input
                                type="number"
                                id="max-salles"
                                min="1"
                                value={config.bloc.supervision.reglesBase.maxSallesParMAR}
                                onChange={(e) => handleNumberInput('bloc.supervision.reglesBase.maxSallesParMAR', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="max-exceptionnel" className="block text-sm font-medium text-gray-700 mb-1">
                                Maximum exceptionnel
                            </label>
                            <input
                                type="number"
                                id="max-exceptionnel"
                                min="1"
                                value={config.bloc.supervision.reglesBase.maxExceptionnel}
                                onChange={(e) => handleNumberInput('bloc.supervision.reglesBase.maxExceptionnel', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="font-medium mb-4">Règles par secteur</h4>
                    <p className="text-sm text-gray-500 mb-4">
                        Les règles de supervision spécifiques par secteur peuvent être configurées dans l'onglet "Autres paramètres".
                    </p>
                </div>
            </div>
        </div>
    );
} 