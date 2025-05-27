"use client";

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Save, RotateCcw } from 'lucide-react';

interface HeaderConfig {
    showOverlappingRequests: boolean;
    showUserDetails: boolean;
    highlightOverlappingCount: number;
    groupRequestsByDate: boolean;
    showWarningWhenOverlapping: boolean;
}

interface AdminConfig {
    header: HeaderConfig;
    [key: string]: any;
}

const HeaderConfigPanel: React.FC = () => {
    const [config, setConfig] = useState<HeaderConfig>({
        showOverlappingRequests: true,
        showUserDetails: true,
        highlightOverlappingCount: 3,
        groupRequestsByDate: false,
        showWarningWhenOverlapping: true
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    // Charger la configuration au chargement du composant
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:3000/api/admin/configuration');
                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération de la configuration');
                }
                const data: AdminConfig = await response.json();
                if (data.header) {
                    setConfig(data.header);
                }
            } catch (err: any) {
                setError(err.message || 'Une erreur est survenue');
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    // Sauvegarder les modifications
    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);

            // Récupérer d'abord la configuration complète
            const fullConfigResponse = await fetch('http://localhost:3000/api/admin/configuration');
            if (!fullConfigResponse.ok) {
                throw new Error('Erreur lors de la récupération de la configuration complète');
            }
            const fullConfig = await fullConfigResponse.json();

            // Mettre à jour seulement la partie header
            const updatedConfig = {
                ...fullConfig,
                header: config
            };

            const response = await fetch('http://localhost:3000/api/admin/configuration', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedConfig),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la sauvegarde de la configuration');
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setSaving(false);
        }
    };

    // Réinitialiser les modifications
    const handleReset = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3000/api/admin/configuration');
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération de la configuration');
            }
            const data: AdminConfig = await response.json();
            if (data.header) {
                setConfig(data.header);
            }
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    // Mettre à jour un champ spécifique de la configuration
    const handleChange = (field: keyof HeaderConfig, value: any) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Chargement des configurations...</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Configuration de l'en-tête des requêtes</h2>

            {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                    <div className="flex">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {success && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-green-700">Configuration sauvegardée avec succès</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-6">
                <div className="flex items-center justify-between border-b pb-4">
                    <div>
                        <h3 className="font-medium">Afficher les requêtes qui se chevauchent</h3>
                        <p className="text-sm text-gray-500">Affiche un récapitulatif des autres absences aux mêmes dates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.showOverlappingRequests}
                            onChange={(e) => handleChange('showOverlappingRequests', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between border-b pb-4">
                    <div>
                        <h3 className="font-medium">Afficher les détails utilisateur</h3>
                        <p className="text-sm text-gray-500">Montre le nom complet et le type de requête</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.showUserDetails}
                            onChange={(e) => handleChange('showUserDetails', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between border-b pb-4">
                    <div>
                        <h3 className="font-medium">Seuil d'alerte de chevauchement</h3>
                        <p className="text-sm text-gray-500">Nombre d'absences simultanées avant affichage d'une alerte</p>
                    </div>
                    <div className="flex items-center">
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={config.highlightOverlappingCount}
                            onChange={(e) => handleChange('highlightOverlappingCount', parseInt(e.target.value))}
                            className="w-16 p-2 border border-gray-300 rounded-md text-center"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between border-b pb-4">
                    <div>
                        <h3 className="font-medium">Grouper les requêtes par date</h3>
                        <p className="text-sm text-gray-500">Regroupe les absences ayant exactement les mêmes dates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.groupRequestsByDate}
                            onChange={(e) => handleChange('groupRequestsByDate', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between pb-4">
                    <div>
                        <h3 className="font-medium">Afficher un avertissement de chevauchement</h3>
                        <p className="text-sm text-gray-500">Montre une alerte visuelle quand trop de personnes sont absentes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.showWarningWhenOverlapping}
                            onChange={(e) => handleChange('showWarningWhenOverlapping', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
                <button
                    onClick={handleReset}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 flex items-center hover:bg-gray-50"
                    disabled={loading || saving}
                >
                    <RotateCcw size={16} className="mr-2" />
                    Réinitialiser
                </button>
                <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700"
                    disabled={saving}
                >
                    {saving ? (
                        <span className="inline-block h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                    ) : (
                        <Save size={16} className="mr-2" />
                    )}
                    Enregistrer
                </button>
            </div>
        </div>
    );
};

export default HeaderConfigPanel; 