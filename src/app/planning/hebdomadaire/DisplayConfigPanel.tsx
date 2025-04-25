'use client';

import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Importer les types depuis le fichier partagé
import {
    DisplayConfig,
    User,
    Surgeon,
    Room,
    PersonnelDisplayConfig,
    VacationColorConfig,
    BorderStyle,
    BorderWidth,
    CardStyle,
    TextStyle,
    TextCase,
    FontSize,
    PersonnelFormat
} from './types';

// Définir l'interface des props avec les types importés
interface DisplayConfigPanelProps {
    config: DisplayConfig;
    onConfigChange: (newConfig: DisplayConfig) => void;
    onClose: () => void;
    users?: User[];
    surgeons?: Surgeon[];
}

// Configuration par défaut (à déplacer dans le fichier types.ts si nécessaire)
export const defaultDisplayConfig: DisplayConfig = {
    personnel: {
        chirurgien: {
            format: 'nom',
            style: 'bold',
            casse: 'uppercase',
            fontSize: 'sm',
            colorCode: '#4F46E5', // indigo-600
            showRolePrefix: true // Valeur par défaut
        },
        mar: {
            format: 'initiale-nom',
            style: 'normal',
            casse: 'default',
            fontSize: 'xs',
            colorCode: '#2563EB', // blue-600
            showRolePrefix: true // Valeur par défaut
        },
        iade: {
            format: 'nomPrenom',
            style: 'italic',
            casse: 'default',
            fontSize: 'xs',
            colorCode: '#059669', // emerald-600
            showRolePrefix: true // Valeur par défaut
        }
    },
    vacation: {
        matin: '#EFF6FF', // blue-50
        apresmidi: '#FEF3C7', // amber-100
        full: '#E0E7FF', // indigo-100
        conflit: '#FEE2E2', // red-100
        recent: '#ECFDF5', // green-50
        vide: '#F3F4F6', // gray-100
        border: '#E5E7EB' // gray-200
    },
    backgroundOpacity: 0.8,
    borderStyle: 'solid',
    borderWidth: 'medium',
    cardStyle: 'shadowed',
    // showRole: true // Supprimé
};

const DisplayConfigPanel: React.FC<DisplayConfigPanelProps> = ({
    config,
    onConfigChange,
    onClose,
    users = [],
    surgeons = []
}) => {
    // État local pour les modifications
    const [tempConfig, setTempConfig] = useState<DisplayConfig>({ ...config });
    const [activeTab, setActiveTab] = useState<'chirurgien' | 'mar' | 'iade' | 'vacation' | 'general'>('general');

    // Gestion des changements dans la configuration du personnel
    const handlePersonnelConfigChange = (
        role: 'chirurgien' | 'mar' | 'iade',
        field: keyof PersonnelDisplayConfig['chirurgien'],
        value: any
    ) => {
        setTempConfig(prev => ({
            ...prev,
            personnel: {
                ...prev.personnel,
                [role]: {
                    ...prev.personnel[role],
                    [field]: value
                }
            }
        }));
    };

    // Gestion des changements dans la configuration des vacations
    const handleVacationConfigChange = (field: keyof VacationColorConfig, value: string) => {
        setTempConfig(prev => ({
            ...prev,
            vacation: {
                ...prev.vacation,
                [field]: value
            }
        }));
    };

    // Gestion des changements dans la configuration générale
    const handleGeneralConfigChange = <K extends keyof Omit<DisplayConfig, 'personnel' | 'vacation'>>(
        field: K,
        value: DisplayConfig[K]
    ) => {
        setTempConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Appliquer les modifications
    const applyChanges = () => {
        onConfigChange(tempConfig);
        onClose();
    };

    // Réinitialiser à la configuration par défaut
    const resetToDefault = () => {
        // On peut définir une configuration par défaut ici, ou laisser le parent s'en occuper
        setTempConfig({ ...defaultDisplayConfig });
        onConfigChange(defaultDisplayConfig);
    };

    // Chirurgien et personnel d'exemple pour l'aperçu
    const exampleSurgeon = surgeons.length > 0 ? surgeons[0] : { id: 0, nom: 'Dupont', prenom: 'Jean', specialite: 'Cardiologie' };
    const exampleMAR = users.find(u => u.role === 'MAR') || { id: 0, nom: 'Martin', prenom: 'Sophie', role: 'MAR' as const };
    const exampleIADE = users.find(u => u.role === 'IADE') || { id: 0, nom: 'Petit', prenom: 'Thomas', role: 'IADE' as const };

    // Fonction pour formater le nom du personnel selon la configuration
    const formatPersonnelName = (
        person: User | Surgeon,
        config: PersonnelDisplayConfig['chirurgien'] | PersonnelDisplayConfig['mar'] | PersonnelDisplayConfig['iade'],
        personRole: 'chirurgien' | 'mar' | 'iade'
    ): string => {
        if (!person) return '';

        // Déterminer le format à utiliser
        let name = '';
        const prenom = 'prenom' in person ? person.prenom : '';
        const nom = 'nom' in person ? person.nom : '';
        const alias = 'alias' in person ? person.alias : undefined;
        const specialite = 'specialite' in person ? person.specialite : '';

        switch (config.format) {
            case 'nom':
                name = nom;
                break;
            case 'nomPrenom':
                name = `${nom} ${prenom}`;
                break;
            case 'prenom-nom':
                name = `${prenom} ${nom}`;
                break;
            case 'nom-specialite':
                name = `${nom}${specialite ? ` (${specialite})` : ''}`;
                break;
            case 'initiale-nom':
                name = prenom.length > 0 ? `${prenom.charAt(0)}. ${nom}` : nom;
                break;
            case 'alias':
                if (alias && alias.trim() !== '') {
                    name = alias;
                } else {
                    name = prenom.length > 0 ? `${prenom.charAt(0)}. ${nom}` : nom;
                }
                break;
            default:
                name = nom;
        }

        // Appliquer la casse
        switch (config.casse) {
            case 'uppercase':
                name = name.toUpperCase();
                break;
            case 'lowercase':
                name = name.toLowerCase();
                break;
            case 'capitalize':
                name = name.split(' ').map(word =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ');
                break;
            default:
                break;
        }

        // Afficher le rôle si l'option est activée DANS LA CONFIG SPECIFIQUE AU ROLE
        if (config.showRolePrefix) { // Utilise le flag spécifique
            let rolePrefix = '';
            switch (personRole) {
                case 'chirurgien': rolePrefix = 'Chir: '; break;
                case 'mar': rolePrefix = 'MAR: '; break;
                case 'iade': rolePrefix = 'IADE: '; break;
            }
            return `${rolePrefix}${name}`;
        } else {
            return name;
        }
    };

    // Rendu de l'aperçu
    const renderPreview = () => {
        // Styles pour l'aperçu
        const vacationStyle = {
            backgroundColor: tempConfig.vacation.matin,
            borderWidth: tempConfig.borderWidth === 'thin' ? '1px' : tempConfig.borderWidth === 'medium' ? '2px' : '4px',
            borderStyle: tempConfig.borderStyle,
            borderColor: tempConfig.vacation.border,
            borderRadius: tempConfig.cardStyle === 'rounded' ? '0.5rem' : '0',
            boxShadow: tempConfig.cardStyle === 'shadowed' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
            padding: '0.75rem',
        };

        const getPersonStyle = (role: 'chirurgien' | 'mar' | 'iade') => {
            const config = tempConfig.personnel[role];
            return {
                fontWeight: config.style.includes('bold') ? 'bold' : 'normal',
                fontStyle: config.style.includes('italic') ? 'italic' : 'normal',
                fontSize: config.fontSize === 'xs' ? '0.75rem' : config.fontSize === 'sm' ? '0.875rem' : '1rem',
                color: config.colorCode,
                textTransform: config.casse === 'uppercase' ? 'uppercase' as const :
                    config.casse === 'lowercase' ? 'lowercase' as const :
                        config.casse === 'capitalize' ? 'capitalize' as const :
                            'none' as const
            };
        };

        return (
            <div className="mb-6 border rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-medium mb-2 text-gray-700">Aperçu</h3>
                <div style={vacationStyle}>
                    {/* Chirurgien */}
                    <div style={getPersonStyle('chirurgien')} className="mb-1">
                        {formatPersonnelName(exampleSurgeon, tempConfig.personnel.chirurgien, 'chirurgien')}
                    </div>

                    {/* MAR */}
                    <div style={getPersonStyle('mar')} className="mb-1">
                        {formatPersonnelName(exampleMAR, tempConfig.personnel.mar, 'mar')}
                    </div>

                    {/* IADE */}
                    <div style={getPersonStyle('iade')}>
                        {formatPersonnelName(exampleIADE, tempConfig.personnel.iade, 'iade')}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-11/12 max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Configuration de l'affichage</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Onglets */}
                <div className="flex border-b mb-4">
                    <button
                        className={`px-4 py-2 ${activeTab === 'general' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('general')}
                    >
                        Général
                    </button>
                    <button
                        className={`px-4 py-2 ${activeTab === 'chirurgien' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('chirurgien')}
                    >
                        Chirurgiens
                    </button>
                    <button
                        className={`px-4 py-2 ${activeTab === 'mar' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('mar')}
                    >
                        MAR
                    </button>
                    <button
                        className={`px-4 py-2 ${activeTab === 'iade' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('iade')}
                    >
                        IADE
                    </button>
                    <button
                        className={`px-4 py-2 ${activeTab === 'vacation' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('vacation')}
                    >
                        Vacations
                    </button>
                </div>

                {/* Contenu des onglets */}
                <div className="space-y-4">
                    {/* Onglet général */}
                    {activeTab === 'general' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Style des cartes
                                </label>
                                <select
                                    value={tempConfig.cardStyle}
                                    onChange={(e) => handleGeneralConfigChange('cardStyle', e.target.value as any)}
                                    className="block w-full p-2 border rounded"
                                >
                                    <option value="flat">Plat</option>
                                    <option value="shadowed">Ombré</option>
                                    <option value="bordered">Bordé</option>
                                    <option value="rounded">Arrondi</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Style de bordure
                                </label>
                                <select
                                    value={tempConfig.borderStyle}
                                    onChange={(e) => handleGeneralConfigChange('borderStyle', e.target.value as any)}
                                    className="block w-full p-2 border rounded"
                                >
                                    <option value="solid">Continu</option>
                                    <option value="dashed">Tirets</option>
                                    <option value="dotted">Pointillés</option>
                                    <option value="double">Double</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Épaisseur de bordure
                                </label>
                                <select
                                    value={tempConfig.borderWidth}
                                    onChange={(e) => handleGeneralConfigChange('borderWidth', e.target.value as any)}
                                    className="block w-full p-2 border rounded"
                                >
                                    <option value="thin">Fine</option>
                                    <option value="medium">Moyenne</option>
                                    <option value="thick">Épaisse</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Opacité du fond
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={tempConfig.backgroundOpacity}
                                    onChange={(e) => handleGeneralConfigChange('backgroundOpacity', parseFloat(e.target.value))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>0%</span>
                                    <span>{Math.round(tempConfig.backgroundOpacity * 100)}%</span>
                                    <span>100%</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Onglet chirurgien */}
                    {activeTab === 'chirurgien' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Format d'affichage
                                </label>
                                <select
                                    value={tempConfig.personnel.chirurgien.format}
                                    onChange={(e) => handlePersonnelConfigChange('chirurgien', 'format', e.target.value)}
                                    className="block w-full p-2 border rounded"
                                >
                                    <option value="nom">Nom uniquement</option>
                                    <option value="nomPrenom">Nom Prénom</option>
                                    <option value="prenom-nom">Prénom Nom</option>
                                    <option value="nom-specialite">Nom (Spécialité)</option>
                                    <option value="initiale-nom">Initiale. Nom</option>
                                    <option value="alias">Alias (ou P. Nom si vide)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Style du texte
                                </label>
                                <select
                                    value={tempConfig.personnel.chirurgien.style}
                                    onChange={(e) => handlePersonnelConfigChange('chirurgien', 'style', e.target.value)}
                                    className="block w-full p-2 border rounded"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="bold">Gras</option>
                                    <option value="italic">Italique</option>
                                    <option value="boldItalic">Gras Italique</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Casse du texte
                                </label>
                                <select
                                    value={tempConfig.personnel.chirurgien.casse}
                                    onChange={(e) => handlePersonnelConfigChange('chirurgien', 'casse', e.target.value)}
                                    className="block w-full p-2 border rounded"
                                >
                                    <option value="default">Par défaut</option>
                                    <option value="uppercase">MAJUSCULES</option>
                                    <option value="lowercase">minuscules</option>
                                    <option value="capitalize">Majuscules Initiales</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Taille du texte
                                </label>
                                <select
                                    value={tempConfig.personnel.chirurgien.fontSize}
                                    onChange={(e) => handlePersonnelConfigChange('chirurgien', 'fontSize', e.target.value)}
                                    className="block w-full p-2 border rounded"
                                >
                                    <option value="xs">Petit</option>
                                    <option value="sm">Moyen</option>
                                    <option value="base">Grand</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Couleur du texte
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        value={tempConfig.personnel.chirurgien.colorCode}
                                        onChange={(e) => handlePersonnelConfigChange('chirurgien', 'colorCode', e.target.value)}
                                        className="h-8 w-8 rounded"
                                    />
                                    <span className="text-sm text-gray-500">
                                        {tempConfig.personnel.chirurgien.colorCode}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="showRoleChirurgien"
                                    checked={tempConfig.personnel.chirurgien.showRolePrefix ?? true}
                                    onChange={(e) => handlePersonnelConfigChange('chirurgien', 'showRolePrefix', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 rounded"
                                />
                                <label htmlFor="showRoleChirurgien" className="text-sm font-medium text-gray-700">
                                    Afficher le préfixe du rôle (ex: "Chir:")
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Onglets MAR et IADE - structure similaire à l'onglet chirurgien */}
                    {activeTab === 'mar' && (
                        <div className="space-y-4">
                            {/* Copier/adapter les champs de l'onglet chirurgien */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Format d'affichage (MAR)
                                </label>
                                <select
                                    value={tempConfig.personnel.mar.format}
                                    onChange={(e) => handlePersonnelConfigChange('mar', 'format', e.target.value)}
                                    className="block w-full p-2 border rounded"
                                >
                                    {/* Options de format (peuvent être les mêmes ou différentes) */}
                                    <option value="nom">Nom uniquement</option>
                                    <option value="nomPrenom">Nom Prénom</option>
                                    <option value="prenom-nom">Prénom Nom</option>
                                    <option value="initiale-nom">Initiale. Nom</option>
                                    <option value="alias">Alias (ou P. Nom si vide)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Style du texte (MAR)
                                </label>
                                <select
                                    value={tempConfig.personnel.mar.style}
                                    onChange={(e) => handlePersonnelConfigChange('mar', 'style', e.target.value)}
                                    className="block w-full p-2 border rounded"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="bold">Gras</option>
                                    <option value="italic">Italique</option>
                                    <option value="boldItalic">Gras Italique</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Casse du texte (MAR)
                                </label>
                                <select
                                    value={tempConfig.personnel.mar.casse}
                                    onChange={(e) => handlePersonnelConfigChange('mar', 'casse', e.target.value)}
                                    className="block w-full p-2 border rounded"
                                >
                                    <option value="default">Par défaut</option>
                                    <option value="uppercase">MAJUSCULES</option>
                                    <option value="lowercase">minuscules</option>
                                    <option value="capitalize">Majuscules Initiales</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Taille du texte (MAR)
                                </label>
                                <select
                                    value={tempConfig.personnel.mar.fontSize}
                                    onChange={(e) => handlePersonnelConfigChange('mar', 'fontSize', e.target.value)}
                                    className="block w-full p-2 border rounded"
                                >
                                    <option value="xs">Petit</option>
                                    <option value="sm">Moyen</option>
                                    <option value="base">Grand</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Couleur du texte (MAR)
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        value={tempConfig.personnel.mar.colorCode}
                                        onChange={(e) => handlePersonnelConfigChange('mar', 'colorCode', e.target.value)}
                                        className="h-8 w-8 rounded"
                                    />
                                    <span className="text-sm text-gray-500">
                                        {tempConfig.personnel.mar.colorCode}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="showRoleMar"
                                    checked={tempConfig.personnel.mar.showRolePrefix ?? true}
                                    onChange={(e) => handlePersonnelConfigChange('mar', 'showRolePrefix', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 rounded"
                                />
                                <label htmlFor="showRoleMar" className="text-sm font-medium text-gray-700">
                                    Afficher le préfixe du rôle (ex: "MAR:")
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'iade' && (
                        <div className="space-y-4">
                            {/* Copier/adapter les champs de l'onglet chirurgien */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Format d'affichage (IADE)
                                </label>
                                <select
                                    value={tempConfig.personnel.iade.format}
                                    onChange={(e) => handlePersonnelConfigChange('iade', 'format', e.target.value)}
                                    className="block w-full p-2 border rounded"
                                >
                                    {/* Options de format */}
                                    <option value="nom">Nom uniquement</option>
                                    <option value="nomPrenom">Nom Prénom</option>
                                    <option value="prenom-nom">Prénom Nom</option>
                                    <option value="initiale-nom">Initiale. Nom</option>
                                    <option value="alias">Alias (ou P. Nom si vide)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Style du texte (IADE)
                                </label>
                                <select
                                    value={tempConfig.personnel.iade.style}
                                    onChange={(e) => handlePersonnelConfigChange('iade', 'style', e.target.value)}
                                    className="block w-full p-2 border rounded"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="bold">Gras</option>
                                    <option value="italic">Italique</option>
                                    <option value="boldItalic">Gras Italique</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Casse du texte (IADE)
                                </label>
                                <select
                                    value={tempConfig.personnel.iade.casse}
                                    onChange={(e) => handlePersonnelConfigChange('iade', 'casse', e.target.value)}
                                    className="block w-full p-2 border rounded"
                                >
                                    <option value="default">Par défaut</option>
                                    <option value="uppercase">MAJUSCULES</option>
                                    <option value="lowercase">minuscules</option>
                                    <option value="capitalize">Majuscules Initiales</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Taille du texte (IADE)
                                </label>
                                <select
                                    value={tempConfig.personnel.iade.fontSize}
                                    onChange={(e) => handlePersonnelConfigChange('iade', 'fontSize', e.target.value)}
                                    className="block w-full p-2 border rounded"
                                >
                                    <option value="xs">Petit</option>
                                    <option value="sm">Moyen</option>
                                    <option value="base">Grand</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Couleur du texte (IADE)
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        value={tempConfig.personnel.iade.colorCode}
                                        onChange={(e) => handlePersonnelConfigChange('iade', 'colorCode', e.target.value)}
                                        className="h-8 w-8 rounded"
                                    />
                                    <span className="text-sm text-gray-500">
                                        {tempConfig.personnel.iade.colorCode}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="showRoleIade"
                                    checked={tempConfig.personnel.iade.showRolePrefix ?? true}
                                    onChange={(e) => handlePersonnelConfigChange('iade', 'showRolePrefix', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 rounded"
                                />
                                <label htmlFor="showRoleIade" className="text-sm font-medium text-gray-700">
                                    Afficher le préfixe du rôle (ex: "IADE:")
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Onglet vacation */}
                    {activeTab === 'vacation' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Couleur des vacations du matin
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        value={tempConfig.vacation.matin}
                                        onChange={(e) => handleVacationConfigChange('matin', e.target.value)}
                                        className="h-8 w-8 rounded"
                                    />
                                    <span className="text-sm text-gray-500">
                                        {tempConfig.vacation.matin}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Couleur des vacations de l'après-midi
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        value={tempConfig.vacation.apresmidi}
                                        onChange={(e) => handleVacationConfigChange('apresmidi', e.target.value)}
                                        className="h-8 w-8 rounded"
                                    />
                                    <span className="text-sm text-gray-500">
                                        {tempConfig.vacation.apresmidi}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Couleur des vacations journée complète
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        value={tempConfig.vacation.full}
                                        onChange={(e) => handleVacationConfigChange('full', e.target.value)}
                                        className="h-8 w-8 rounded"
                                    />
                                    <span className="text-sm text-gray-500">
                                        {tempConfig.vacation.full}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Couleur des conflits
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        value={tempConfig.vacation.conflit}
                                        onChange={(e) => handleVacationConfigChange('conflit', e.target.value)}
                                        className="h-8 w-8 rounded"
                                    />
                                    <span className="text-sm text-gray-500">
                                        {tempConfig.vacation.conflit}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Couleur des modifications récentes
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        value={tempConfig.vacation.recent}
                                        onChange={(e) => handleVacationConfigChange('recent', e.target.value)}
                                        className="h-8 w-8 rounded"
                                    />
                                    <span className="text-sm text-gray-500">
                                        {tempConfig.vacation.recent}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Couleur des cases vides
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        value={tempConfig.vacation.vide}
                                        onChange={(e) => handleVacationConfigChange('vide', e.target.value)}
                                        className="h-8 w-8 rounded"
                                    />
                                    <span className="text-sm text-gray-500">
                                        {tempConfig.vacation.vide}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Couleur des bordures
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        value={tempConfig.vacation.border}
                                        onChange={(e) => handleVacationConfigChange('border', e.target.value)}
                                        className="h-8 w-8 rounded"
                                    />
                                    <span className="text-sm text-gray-500">
                                        {tempConfig.vacation.border}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Aperçu */}
                    <div>
                        {renderPreview()}

                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        Les modifications seront appliquées à toutes les assignations du planning.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={resetToDefault}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Réinitialiser
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={applyChanges}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Appliquer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DisplayConfigPanel; 