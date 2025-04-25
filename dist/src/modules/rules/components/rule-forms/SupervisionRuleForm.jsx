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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React, { useState, useEffect } from 'react';
import { RuleType } from '../../types/rule';
export var SupervisionRuleForm = function (_a) {
    var rule = _a.rule, onChange = _a.onChange;
    // État local pour la configuration de supervision
    var _b = useState(rule.supervisionConfig || {
        supervisorRoles: [],
        superviseeRoles: [],
        maxSuperviseesPerSupervisor: 3,
        minExperienceYearsToSupervise: 5,
        supervisionPeriods: [],
        specialtyRestrictions: [],
        locationRestrictions: []
    }), supervisionConfig = _b[0], setSupervisionConfig = _b[1];
    // Mettre à jour la configuration dans le parent lorsqu'elle change
    useEffect(function () {
        onChange(__assign(__assign({}, rule), { type: RuleType.SUPERVISION, supervisionConfig: supervisionConfig }));
    }, [supervisionConfig, rule, onChange]);
    // Gérer les changements de champs simples
    var handleChange = function (field, value) {
        setSupervisionConfig(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = value, _a)));
        });
    };
    // Gérer les changements de nombre maximum de supervisés
    var handleMaxSuperviseesChange = function (e) {
        var value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0) {
            handleChange('maxSuperviseesPerSupervisor', value);
        }
    };
    // Gérer les changements d'années d'expérience minimales
    var handleExperienceYearsChange = function (e) {
        var value = parseInt(e.target.value);
        if (!isNaN(value) && value >= 0) {
            handleChange('minExperienceYearsToSupervise', value);
        }
    };
    // --- Gestion des rôles de superviseur ---
    // Ajouter un rôle de superviseur
    var handleAddSupervisorRole = function (e) {
        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
            e.preventDefault();
            var newRole = e.currentTarget.value.trim();
            if (!supervisionConfig.supervisorRoles.includes(newRole)) {
                handleChange('supervisorRoles', __spreadArray(__spreadArray([], supervisionConfig.supervisorRoles, true), [newRole], false));
                e.currentTarget.value = '';
            }
        }
    };
    // Supprimer un rôle de superviseur
    var handleRemoveSupervisorRole = function (roleToRemove) {
        handleChange('supervisorRoles', supervisionConfig.supervisorRoles.filter(function (role) { return role !== roleToRemove; }));
    };
    // --- Gestion des rôles de supervisé ---
    // Ajouter un rôle de supervisé
    var handleAddSuperviseeRole = function (e) {
        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
            e.preventDefault();
            var newRole = e.currentTarget.value.trim();
            if (!supervisionConfig.superviseeRoles.includes(newRole)) {
                handleChange('superviseeRoles', __spreadArray(__spreadArray([], supervisionConfig.superviseeRoles, true), [newRole], false));
                e.currentTarget.value = '';
            }
        }
    };
    // Supprimer un rôle de supervisé
    var handleRemoveSuperviseeRole = function (roleToRemove) {
        handleChange('superviseeRoles', supervisionConfig.superviseeRoles.filter(function (role) { return role !== roleToRemove; }));
    };
    // --- Gestion des restrictions de spécialité ---
    // Ajouter une restriction de spécialité
    var handleAddSpecialtyRestriction = function (e) {
        var _a;
        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
            e.preventDefault();
            var newSpecialty = e.currentTarget.value.trim();
            if (!((_a = supervisionConfig.specialtyRestrictions) === null || _a === void 0 ? void 0 : _a.includes(newSpecialty))) {
                handleChange('specialtyRestrictions', __spreadArray(__spreadArray([], (supervisionConfig.specialtyRestrictions || []), true), [newSpecialty], false));
                e.currentTarget.value = '';
            }
        }
    };
    // Supprimer une restriction de spécialité
    var handleRemoveSpecialtyRestriction = function (specialtyToRemove) {
        var _a;
        handleChange('specialtyRestrictions', ((_a = supervisionConfig.specialtyRestrictions) === null || _a === void 0 ? void 0 : _a.filter(function (specialty) { return specialty !== specialtyToRemove; })) || []);
    };
    // --- Gestion des restrictions de lieu ---
    // Ajouter une restriction de lieu
    var handleAddLocationRestriction = function (e) {
        var _a;
        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
            e.preventDefault();
            var newLocation = e.currentTarget.value.trim();
            if (!((_a = supervisionConfig.locationRestrictions) === null || _a === void 0 ? void 0 : _a.includes(newLocation))) {
                handleChange('locationRestrictions', __spreadArray(__spreadArray([], (supervisionConfig.locationRestrictions || []), true), [newLocation], false));
                e.currentTarget.value = '';
            }
        }
    };
    // Supprimer une restriction de lieu
    var handleRemoveLocationRestriction = function (locationToRemove) {
        var _a;
        handleChange('locationRestrictions', ((_a = supervisionConfig.locationRestrictions) === null || _a === void 0 ? void 0 : _a.filter(function (location) { return location !== locationToRemove; })) || []);
    };
    // --- Gestion des périodes de supervision ---
    // Ajouter une période de supervision
    var handleAddSupervisionPeriod = function () {
        handleChange('supervisionPeriods', __spreadArray(__spreadArray([], (supervisionConfig.supervisionPeriods || []), true), [
            { dayOfWeek: 1, startTime: '08:00', endTime: '17:00' }
        ], false));
    };
    // Mettre à jour une période de supervision
    var handleUpdateSupervisionPeriod = function (index, field, value) {
        var _a;
        var updatedPeriods = __spreadArray([], (supervisionConfig.supervisionPeriods || []), true);
        updatedPeriods[index] = __assign(__assign({}, updatedPeriods[index]), (_a = {}, _a[field] = value, _a));
        handleChange('supervisionPeriods', updatedPeriods);
    };
    // Supprimer une période de supervision
    var handleRemoveSupervisionPeriod = function (index) {
        var updatedPeriods = __spreadArray([], (supervisionConfig.supervisionPeriods || []), true);
        updatedPeriods.splice(index, 1);
        handleChange('supervisionPeriods', updatedPeriods);
    };
    // Obtenir le nom du jour de la semaine
    var getDayName = function (dayOfWeek) {
        var days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        return days[dayOfWeek % 7];
    };
    return (<div className="space-y-6">
            {/* Rôles pouvant superviser */}
            <div>
                <label htmlFor="supervisor-roles" className="block text-sm font-medium text-gray-700">
                    Rôles pouvant superviser
                </label>
                <div className="mt-1">
                    <input type="text" id="supervisor-roles" placeholder="Appuyez sur Entrée pour ajouter un rôle" onKeyDown={handleAddSupervisorRole} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                {supervisionConfig.supervisorRoles.length > 0 && (<div className="mt-2 flex flex-wrap gap-2">
                        {supervisionConfig.supervisorRoles.map(function (role, index) { return (<div key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {role}
                                <button type="button" onClick={function () { return handleRemoveSupervisorRole(role); }} className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-green-400 hover:text-green-700 focus:outline-none">
                                    <span className="sr-only">Supprimer {role}</span>
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>); })}
                    </div>)}
                <p className="mt-1 text-xs text-gray-500">
                    Les rôles qui sont autorisés à superviser d'autres professionnels
                </p>
            </div>

            {/* Rôles pouvant être supervisés */}
            <div>
                <label htmlFor="supervisee-roles" className="block text-sm font-medium text-gray-700">
                    Rôles pouvant être supervisés
                </label>
                <div className="mt-1">
                    <input type="text" id="supervisee-roles" placeholder="Appuyez sur Entrée pour ajouter un rôle" onKeyDown={handleAddSuperviseeRole} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                {supervisionConfig.superviseeRoles.length > 0 && (<div className="mt-2 flex flex-wrap gap-2">
                        {supervisionConfig.superviseeRoles.map(function (role, index) { return (<div key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {role}
                                <button type="button" onClick={function () { return handleRemoveSuperviseeRole(role); }} className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-400 hover:text-blue-700 focus:outline-none">
                                    <span className="sr-only">Supprimer {role}</span>
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>); })}
                    </div>)}
                <p className="mt-1 text-xs text-gray-500">
                    Les rôles qui doivent être supervisés
                </p>
            </div>

            {/* Nombre maximum de supervisés par superviseur */}
            <div>
                <label htmlFor="max-supervisees" className="block text-sm font-medium text-gray-700">
                    Nombre maximum de supervisés par superviseur
                </label>
                <div className="mt-1">
                    <input type="number" id="max-supervisees" min="1" value={supervisionConfig.maxSuperviseesPerSupervisor} onChange={handleMaxSuperviseesChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    Le nombre maximum de personnes qu'un superviseur peut superviser simultanément
                </p>
            </div>

            {/* Années d'expérience minimales pour superviser */}
            <div>
                <label htmlFor="min-experience" className="block text-sm font-medium text-gray-700">
                    Années d'expérience minimales pour superviser
                </label>
                <div className="mt-1">
                    <input type="number" id="min-experience" min="0" value={supervisionConfig.minExperienceYearsToSupervise} onChange={handleExperienceYearsChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    Nombre d'années d'expérience requises pour pouvoir superviser
                </p>
            </div>

            {/* Restrictions par spécialité */}
            <div>
                <label htmlFor="specialty-restrictions" className="block text-sm font-medium text-gray-700">
                    Restrictions par spécialité
                </label>
                <div className="mt-1">
                    <input type="text" id="specialty-restrictions" placeholder="Appuyez sur Entrée pour ajouter une spécialité" onKeyDown={handleAddSpecialtyRestriction} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                {supervisionConfig.specialtyRestrictions && supervisionConfig.specialtyRestrictions.length > 0 && (<div className="mt-2 flex flex-wrap gap-2">
                        {supervisionConfig.specialtyRestrictions.map(function (specialty, index) { return (<div key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {specialty}
                                <button type="button" onClick={function () { return handleRemoveSpecialtyRestriction(specialty); }} className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-purple-400 hover:text-purple-700 focus:outline-none">
                                    <span className="sr-only">Supprimer {specialty}</span>
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>); })}
                    </div>)}
                <p className="mt-1 text-xs text-gray-500">
                    Les spécialités concernées par cette règle de supervision
                </p>
            </div>

            {/* Restrictions par lieu */}
            <div>
                <label htmlFor="location-restrictions" className="block text-sm font-medium text-gray-700">
                    Restrictions par lieu
                </label>
                <div className="mt-1">
                    <input type="text" id="location-restrictions" placeholder="Appuyez sur Entrée pour ajouter un lieu" onKeyDown={handleAddLocationRestriction} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                {supervisionConfig.locationRestrictions && supervisionConfig.locationRestrictions.length > 0 && (<div className="mt-2 flex flex-wrap gap-2">
                        {supervisionConfig.locationRestrictions.map(function (location, index) { return (<div key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {location}
                                <button type="button" onClick={function () { return handleRemoveLocationRestriction(location); }} className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-yellow-400 hover:text-yellow-700 focus:outline-none">
                                    <span className="sr-only">Supprimer {location}</span>
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>); })}
                    </div>)}
                <p className="mt-1 text-xs text-gray-500">
                    Les lieux où cette règle de supervision s'applique
                </p>
            </div>

            {/* Périodes de supervision */}
            <div>
                <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">
                        Périodes de supervision
                    </label>
                    <button type="button" onClick={handleAddSupervisionPeriod} className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Ajouter une période
                    </button>
                </div>
                <div className="mt-2 space-y-4">
                    {supervisionConfig.supervisionPeriods && supervisionConfig.supervisionPeriods.length > 0 ? (supervisionConfig.supervisionPeriods.map(function (period, index) { return (<div key={index} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md">
                                <div className="flex-grow">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label htmlFor={"supervision-day-".concat(index)} className="block text-xs font-medium text-gray-500">
                                                Jour
                                            </label>
                                            <select id={"supervision-day-".concat(index)} value={period.dayOfWeek} onChange={function (e) { return handleUpdateSupervisionPeriod(index, 'dayOfWeek', parseInt(e.target.value)); }} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm">
                                                {[0, 1, 2, 3, 4, 5, 6].map(function (day) { return (<option key={day} value={day}>
                                                        {getDayName(day)}
                                                    </option>); })}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor={"supervision-start-".concat(index)} className="block text-xs font-medium text-gray-500">
                                                Début
                                            </label>
                                            <input type="time" id={"supervision-start-".concat(index)} value={period.startTime} onChange={function (e) { return handleUpdateSupervisionPeriod(index, 'startTime', e.target.value); }} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"/>
                                        </div>
                                        <div>
                                            <label htmlFor={"supervision-end-".concat(index)} className="block text-xs font-medium text-gray-500">
                                                Fin
                                            </label>
                                            <input type="time" id={"supervision-end-".concat(index)} value={period.endTime} onChange={function (e) { return handleUpdateSupervisionPeriod(index, 'endTime', e.target.value); }} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"/>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <button type="button" onClick={function () { return handleRemoveSupervisionPeriod(index); }} className="inline-flex items-center p-1.5 border border-transparent rounded-full text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                        <span className="sr-only">Supprimer cette période</span>
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>); })) : (<div className="text-sm text-gray-500 italic">
                            Aucune période de supervision définie. La supervision s'applique à tout moment si aucune période n'est spécifiée.
                        </div>)}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    Définissez les jours et heures pendant lesquels la supervision est requise
                </p>
            </div>
        </div>);
};
