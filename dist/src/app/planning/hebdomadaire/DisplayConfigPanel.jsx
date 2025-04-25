'use client';
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
// Configuration par défaut (à déplacer dans le fichier types.ts si nécessaire)
export var defaultDisplayConfig = {
    personnel: {
        chirurgien: {
            format: 'nom',
            style: 'bold',
            casse: 'uppercase',
            fontSize: 'sm',
            colorCode: '#4F46E5' // indigo-600
        },
        mar: {
            format: 'initiale-nom',
            style: 'normal',
            casse: 'default',
            fontSize: 'xs',
            colorCode: '#2563EB' // blue-600
        },
        iade: {
            format: 'nomPrenom',
            style: 'italic',
            casse: 'default',
            fontSize: 'xs',
            colorCode: '#059669' // emerald-600
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
    showRole: true
};
var DisplayConfigPanel = function (_a) {
    var config = _a.config, onConfigChange = _a.onConfigChange, onClose = _a.onClose, _b = _a.users, users = _b === void 0 ? [] : _b, _c = _a.surgeons, surgeons = _c === void 0 ? [] : _c;
    // État local pour les modifications
    var _d = useState(__assign({}, config)), tempConfig = _d[0], setTempConfig = _d[1];
    var _e = useState('general'), activeTab = _e[0], setActiveTab = _e[1];
    // Gestion des changements dans la configuration du personnel
    var handlePersonnelConfigChange = function (role, field, value) {
        setTempConfig(function (prev) {
            var _a, _b;
            return (__assign(__assign({}, prev), { personnel: __assign(__assign({}, prev.personnel), (_a = {}, _a[role] = __assign(__assign({}, prev.personnel[role]), (_b = {}, _b[field] = value, _b)), _a)) }));
        });
    };
    // Gestion des changements dans la configuration des vacations
    var handleVacationConfigChange = function (field, value) {
        setTempConfig(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), { vacation: __assign(__assign({}, prev.vacation), (_a = {}, _a[field] = value, _a)) }));
        });
    };
    // Gestion des changements dans la configuration générale
    var handleGeneralConfigChange = function (field, value) {
        setTempConfig(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = value, _a)));
        });
    };
    // Appliquer les modifications
    var applyChanges = function () {
        onConfigChange(tempConfig);
        onClose();
    };
    // Réinitialiser à la configuration par défaut
    var resetToDefault = function () {
        // On peut définir une configuration par défaut ici, ou laisser le parent s'en occuper
        setTempConfig(__assign({}, defaultDisplayConfig));
        onConfigChange(defaultDisplayConfig);
    };
    // Chirurgien et personnel d'exemple pour l'aperçu
    var exampleSurgeon = surgeons.length > 0 ? surgeons[0] : { id: 0, nom: 'Dupont', prenom: 'Jean', specialite: 'Cardiologie' };
    var exampleMAR = users.find(function (u) { return u.role === 'MAR'; }) || { id: 0, nom: 'Martin', prenom: 'Sophie', role: 'MAR' };
    var exampleIADE = users.find(function (u) { return u.role === 'IADE'; }) || { id: 0, nom: 'Petit', prenom: 'Thomas', role: 'IADE' };
    // Fonction pour formater le nom du personnel selon la configuration
    var formatPersonnelName = function (person, config, role) {
        if (!person)
            return '';
        // Déterminer le format à utiliser
        var name = '';
        var prenom = person.prenom, nom = person.nom;
        var specialite = 'specialite' in person ? person.specialite : '';
        switch (config.format) {
            case 'nom':
                name = nom;
                break;
            case 'nomPrenom':
                name = "".concat(nom, " ").concat(prenom);
                break;
            case 'prenom-nom':
                name = "".concat(prenom, " ").concat(nom);
                break;
            case 'nom-specialite':
                name = "".concat(nom).concat(specialite ? " (".concat(specialite, ")") : '');
                break;
            case 'initiale-nom':
                name = "".concat(prenom.charAt(0), ". ").concat(nom);
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
                name = name.split(' ').map(function (word) {
                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                }).join(' ');
                break;
            default:
                // Laisser tel quel
                break;
        }
        return role ? "".concat(role, ": ").concat(name) : name;
    };
    // Rendu de l'aperçu
    var renderPreview = function () {
        // Styles pour l'aperçu
        var vacationStyle = {
            backgroundColor: tempConfig.vacation.matin,
            borderWidth: tempConfig.borderWidth === 'thin' ? '1px' : tempConfig.borderWidth === 'medium' ? '2px' : '4px',
            borderStyle: tempConfig.borderStyle,
            borderColor: tempConfig.vacation.border,
            borderRadius: tempConfig.cardStyle === 'rounded' ? '0.5rem' : '0',
            boxShadow: tempConfig.cardStyle === 'shadowed' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
            padding: '0.75rem',
        };
        var getPersonStyle = function (role) {
            var config = tempConfig.personnel[role];
            return {
                fontWeight: config.style.includes('bold') ? 'bold' : 'normal',
                fontStyle: config.style.includes('italic') ? 'italic' : 'normal',
                fontSize: config.fontSize === 'xs' ? '0.75rem' : config.fontSize === 'sm' ? '0.875rem' : '1rem',
                color: config.colorCode,
                textTransform: config.casse === 'uppercase' ? 'uppercase' :
                    config.casse === 'lowercase' ? 'lowercase' :
                        config.casse === 'capitalize' ? 'capitalize' :
                            'none'
            };
        };
        return (<div className="mb-6 border rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-medium mb-2 text-gray-700">Aperçu</h3>
                <div style={vacationStyle}>
                    {/* Chirurgien */}
                    <div style={getPersonStyle('chirurgien')} className="mb-1">
                        {formatPersonnelName(exampleSurgeon, tempConfig.personnel.chirurgien)}
                    </div>

                    {/* MAR */}
                    <div style={getPersonStyle('mar')} className="mb-1">
                        {formatPersonnelName(exampleMAR, tempConfig.personnel.mar, 'MAR')}
                    </div>

                    {/* IADE */}
                    <div style={getPersonStyle('iade')}>
                        {formatPersonnelName(exampleIADE, tempConfig.personnel.iade, 'IADE')}
                    </div>
                </div>
            </div>);
    };
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-11/12 max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Configuration de l'affichage</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                        <XMarkIcon className="w-6 h-6"/>
                    </button>
                </div>

                {/* Onglets */}
                <div className="flex border-b mb-4">
                    <button className={"px-4 py-2 ".concat(activeTab === 'general' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600')} onClick={function () { return setActiveTab('general'); }}>
                        Général
                    </button>
                    <button className={"px-4 py-2 ".concat(activeTab === 'chirurgien' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600')} onClick={function () { return setActiveTab('chirurgien'); }}>
                        Chirurgiens
                    </button>
                    <button className={"px-4 py-2 ".concat(activeTab === 'mar' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600')} onClick={function () { return setActiveTab('mar'); }}>
                        MAR
                    </button>
                    <button className={"px-4 py-2 ".concat(activeTab === 'iade' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600')} onClick={function () { return setActiveTab('iade'); }}>
                        IADE
                    </button>
                    <button className={"px-4 py-2 ".concat(activeTab === 'vacation' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600')} onClick={function () { return setActiveTab('vacation'); }}>
                        Vacations
                    </button>
                </div>

                {/* Contenu des onglets */}
                <div className="space-y-4">
                    {/* Onglet général */}
                    {activeTab === 'general' && (<div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Style des cartes
                                </label>
                                <select value={tempConfig.cardStyle} onChange={function (e) { return handleGeneralConfigChange('cardStyle', e.target.value); }} className="block w-full p-2 border rounded">
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
                                <select value={tempConfig.borderStyle} onChange={function (e) { return handleGeneralConfigChange('borderStyle', e.target.value); }} className="block w-full p-2 border rounded">
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
                                <select value={tempConfig.borderWidth} onChange={function (e) { return handleGeneralConfigChange('borderWidth', e.target.value); }} className="block w-full p-2 border rounded">
                                    <option value="thin">Fine</option>
                                    <option value="medium">Moyenne</option>
                                    <option value="thick">Épaisse</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Opacité du fond
                                </label>
                                <input type="range" min="0" max="1" step="0.1" value={tempConfig.backgroundOpacity} onChange={function (e) { return handleGeneralConfigChange('backgroundOpacity', parseFloat(e.target.value)); }} className="w-full"/>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>0%</span>
                                    <span>{Math.round(tempConfig.backgroundOpacity * 100)}%</span>
                                    <span>100%</span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="showRole" checked={tempConfig.showRole} onChange={function (e) { return handleGeneralConfigChange('showRole', e.target.checked); }} className="h-4 w-4 text-blue-600 rounded"/>
                                <label htmlFor="showRole" className="text-sm font-medium text-gray-700">
                                    Afficher le rôle du personnel
                                </label>
                            </div>
                        </div>)}

                    {/* Onglet chirurgien */}
                    {activeTab === 'chirurgien' && (<div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Format d'affichage
                                </label>
                                <select value={tempConfig.personnel.chirurgien.format} onChange={function (e) { return handlePersonnelConfigChange('chirurgien', 'format', e.target.value); }} className="block w-full p-2 border rounded">
                                    <option value="nom">Nom uniquement</option>
                                    <option value="nomPrenom">Nom Prénom</option>
                                    <option value="prenom-nom">Prénom Nom</option>
                                    <option value="nom-specialite">Nom (Spécialité)</option>
                                    <option value="initiale-nom">Initiale. Nom</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Style du texte
                                </label>
                                <select value={tempConfig.personnel.chirurgien.style} onChange={function (e) { return handlePersonnelConfigChange('chirurgien', 'style', e.target.value); }} className="block w-full p-2 border rounded">
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
                                <select value={tempConfig.personnel.chirurgien.casse} onChange={function (e) { return handlePersonnelConfigChange('chirurgien', 'casse', e.target.value); }} className="block w-full p-2 border rounded">
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
                                <select value={tempConfig.personnel.chirurgien.fontSize} onChange={function (e) { return handlePersonnelConfigChange('chirurgien', 'fontSize', e.target.value); }} className="block w-full p-2 border rounded">
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
                                    <input type="color" value={tempConfig.personnel.chirurgien.colorCode} onChange={function (e) { return handlePersonnelConfigChange('chirurgien', 'colorCode', e.target.value); }} className="h-8 w-8 rounded"/>
                                    <span className="text-sm text-gray-500">
                                        {tempConfig.personnel.chirurgien.colorCode}
                                    </span>
                                </div>
                            </div>
                        </div>)}

                    {/* Onglets MAR et IADE - structure similaire à l'onglet chirurgien */}
                    {activeTab === 'mar' && (<div className="space-y-4">
                            {/* Copier/adapter les champs de l'onglet chirurgien */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Format d'affichage (MAR)
                                </label>
                                <select value={tempConfig.personnel.mar.format} onChange={function (e) { return handlePersonnelConfigChange('mar', 'format', e.target.value); }} className="block w-full p-2 border rounded">
                                    {/* Options de format (peuvent être les mêmes ou différentes) */}
                                    <option value="nom">Nom uniquement</option>
                                    <option value="nomPrenom">Nom Prénom</option>
                                    <option value="prenom-nom">Prénom Nom</option>
                                    <option value="initiale-nom">Initiale. Nom</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Style du texte (MAR)
                                </label>
                                <select value={tempConfig.personnel.mar.style} onChange={function (e) { return handlePersonnelConfigChange('mar', 'style', e.target.value); }} className="block w-full p-2 border rounded">
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
                                <select value={tempConfig.personnel.mar.casse} onChange={function (e) { return handlePersonnelConfigChange('mar', 'casse', e.target.value); }} className="block w-full p-2 border rounded">
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
                                <select value={tempConfig.personnel.mar.fontSize} onChange={function (e) { return handlePersonnelConfigChange('mar', 'fontSize', e.target.value); }} className="block w-full p-2 border rounded">
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
                                    <input type="color" value={tempConfig.personnel.mar.colorCode} onChange={function (e) { return handlePersonnelConfigChange('mar', 'colorCode', e.target.value); }} className="h-8 w-8 rounded"/>
                                    <span className="text-sm text-gray-500">
                                        {tempConfig.personnel.mar.colorCode}
                                    </span>
                                </div>
                            </div>
                        </div>)}

                    {activeTab === 'iade' && (<div className="space-y-4">
                            {/* Copier/adapter les champs de l'onglet chirurgien */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Format d'affichage (IADE)
                                </label>
                                <select value={tempConfig.personnel.iade.format} onChange={function (e) { return handlePersonnelConfigChange('iade', 'format', e.target.value); }} className="block w-full p-2 border rounded">
                                    {/* Options de format */}
                                    <option value="nom">Nom uniquement</option>
                                    <option value="nomPrenom">Nom Prénom</option>
                                    <option value="prenom-nom">Prénom Nom</option>
                                    <option value="initiale-nom">Initiale. Nom</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Style du texte (IADE)
                                </label>
                                <select value={tempConfig.personnel.iade.style} onChange={function (e) { return handlePersonnelConfigChange('iade', 'style', e.target.value); }} className="block w-full p-2 border rounded">
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
                                <select value={tempConfig.personnel.iade.casse} onChange={function (e) { return handlePersonnelConfigChange('iade', 'casse', e.target.value); }} className="block w-full p-2 border rounded">
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
                                <select value={tempConfig.personnel.iade.fontSize} onChange={function (e) { return handlePersonnelConfigChange('iade', 'fontSize', e.target.value); }} className="block w-full p-2 border rounded">
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
                                    <input type="color" value={tempConfig.personnel.iade.colorCode} onChange={function (e) { return handlePersonnelConfigChange('iade', 'colorCode', e.target.value); }} className="h-8 w-8 rounded"/>
                                    <span className="text-sm text-gray-500">
                                        {tempConfig.personnel.iade.colorCode}
                                    </span>
                                </div>
                            </div>
                        </div>)}

                    {/* Onglet vacation */}
                    {activeTab === 'vacation' && (<div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Couleur des vacations du matin
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input type="color" value={tempConfig.vacation.matin} onChange={function (e) { return handleVacationConfigChange('matin', e.target.value); }} className="h-8 w-8 rounded"/>
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
                                    <input type="color" value={tempConfig.vacation.apresmidi} onChange={function (e) { return handleVacationConfigChange('apresmidi', e.target.value); }} className="h-8 w-8 rounded"/>
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
                                    <input type="color" value={tempConfig.vacation.full} onChange={function (e) { return handleVacationConfigChange('full', e.target.value); }} className="h-8 w-8 rounded"/>
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
                                    <input type="color" value={tempConfig.vacation.conflit} onChange={function (e) { return handleVacationConfigChange('conflit', e.target.value); }} className="h-8 w-8 rounded"/>
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
                                    <input type="color" value={tempConfig.vacation.recent} onChange={function (e) { return handleVacationConfigChange('recent', e.target.value); }} className="h-8 w-8 rounded"/>
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
                                    <input type="color" value={tempConfig.vacation.vide} onChange={function (e) { return handleVacationConfigChange('vide', e.target.value); }} className="h-8 w-8 rounded"/>
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
                                    <input type="color" value={tempConfig.vacation.border} onChange={function (e) { return handleVacationConfigChange('border', e.target.value); }} className="h-8 w-8 rounded"/>
                                    <span className="text-sm text-gray-500">
                                        {tempConfig.vacation.border}
                                    </span>
                                </div>
                            </div>
                        </div>)}

                    {/* Aperçu */}
                    <div>
                        {renderPreview()}

                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
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
                            <button onClick={resetToDefault} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                                Réinitialiser
                            </button>
                            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                                Annuler
                            </button>
                            <button onClick={applyChanges} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                Appliquer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>);
};
export default DisplayConfigPanel;
