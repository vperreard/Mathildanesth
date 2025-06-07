'use client';

import React, { useState } from 'react';
import { X as XMarkIcon, ArrowsUpDown as ArrowsUpDownIcon } from 'lucide-react';
// TODO: Replace @heroicons with lucide-react
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
    PersonnelFormat,
    RoomOrderConfig
} from './types';

// Importer la configuration par défaut depuis le fichier dédié
import { defaultDisplayConfig } from './defaultConfig';

// Importer le composant pour les trameModeles
// import { TrameAffectation } from '@/components/trames/TrameAffectation'; // On commente à nouveau, car ce n'est pas le bon composant/endroit

// Définir l'interface des props avec les types importés
interface DisplayConfigPanelProps {
    config: DisplayConfig;
    onConfigChange: (newConfig: DisplayConfig) => void;
    onClose: () => void;
    users?: User[];
    surgeons?: Surgeon[];
    rooms?: Room[];
    roomOrderConfig?: RoomOrderConfig;
    onSaveRoomOrder?: (orderedRoomIds: string[]) => void;
}

const DisplayConfigPanel: React.FC<DisplayConfigPanelProps> = ({
    config,
    onConfigChange,
    onClose,
    users = [],
    surgeons = [],
    rooms = [],
    roomOrderConfig,
    onSaveRoomOrder
}) => {
    // État local pour les modifications
    const [tempConfig, setTempConfig] = useState<DisplayConfig>({ ...config });
    // On retire 'trameModeles' du type de activeTab pour l'instant
    const [activeTab, setActiveTab] = useState<'chirurgien' | 'mar' | 'iade' | 'vacation' | 'general'>('general');

    // Gestion des changements dans la configuration du personnel
    const handlePersonnelConfigChange = (
        role: 'chirurgien' | 'mar' | 'iade',
        field: keyof PersonnelDisplayConfig['chirurgien'],
        value: unknown
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

    // Gestion de la sauvegarde de l'ordre des salles (si la fonction est fournie)
    const handleInternalSaveRoomOrder = (orderedIds: string[]) => {
        if (onSaveRoomOrder) {
            onSaveRoomOrder(orderedIds);
        }
    };

    return (
        // On retire les divs externes (fixed inset-0 et bg-white)
        // Le contenu est maintenant directement rendu dans le DialogContent parent
        <>
            {/* On retire l'en-tête interne car DialogHeader est fourni par page.tsx */}
            {/* <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Configuration de l'affichage</h2>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div> */}

            {/* Système d'onglets */}
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

            {/* Contenu des onglets et Preview */}
            {/* Le parent DialogContent gère le scroll */}
            <div className="space-y-4">
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

                {activeTab === 'mar' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Format d'affichage (MAR)
                            </label>
                            <select
                                value={tempConfig.personnel.mar.format}
                                onChange={(e) => handlePersonnelConfigChange('mar', 'format', e.target.value)}
                                className="block w-full p-2 border rounded"
                            >
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Format d'affichage (IADE)
                            </label>
                            <select
                                value={tempConfig.personnel.iade.format}
                                onChange={(e) => handlePersonnelConfigChange('iade', 'format', e.target.value)}
                                className="block w-full p-2 border rounded"
                            >
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

                {/* On commente la section pour l'onglet trameModeles
                {activeTab === 'trameModeles' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-700">Configuration des TrameModeles Hebdomadaires</h3>
                        <p className="text-sm text-gray-600">
                            Définissez ici les affectations récurrentes pour les semaines paires/impaires.
                            L'interface visuelle de type planning sera intégrée ici.
                        </p>
                        <div className="p-4 border rounded-md bg-gray-100">
                            <p className="text-gray-700">Placeholder pour le futur composant d'édition de trameModeles visuelles.</p>
                        </div>
                    </div>
                )}
                */}

                {/* Section Aperçu */}
                {renderPreview()}
            </div>

            {/* Pied de page avec boutons d'action */}
            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
                <button onClick={resetToDefault} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Réinitialiser
                </button>
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Annuler
                </button>
                <button
                    onClick={applyChanges}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Appliquer
                </button>
            </div>
        </>
    );
};

export default DisplayConfigPanel; 