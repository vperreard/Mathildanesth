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
export var DutyRuleForm = function (_a) {
    var rule = _a.rule, onChange = _a.onChange;
    // État local pour la configuration de garde
    var _b = useState(rule.dutyConfig || {
        minPersonnel: 1,
        maxConsecutiveDays: 2,
        minRestPeriodAfterDuty: 24,
        dutyPeriods: [],
        specificRoles: [],
        rotationStrategy: 'SEQUENTIAL'
    }), dutyConfig = _b[0], setDutyConfig = _b[1];
    // Mettre à jour la configuration dans le parent lorsqu'elle change
    useEffect(function () {
        onChange(__assign(__assign({}, rule), { type: RuleType.DUTY, dutyConfig: dutyConfig }));
    }, [dutyConfig, rule, onChange]);
    // Gérer les changements de champs simples
    var handleChange = function (field, value) {
        setDutyConfig(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = value, _a)));
        });
    };
    // Gérer les changements de personnel minimum
    var handlePersonnelChange = function (e) {
        var value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0) {
            handleChange('minPersonnel', value);
        }
    };
    // Gérer les changements de jours consécutifs maximum
    var handleConsecutiveDaysChange = function (e) {
        var value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0) {
            handleChange('maxConsecutiveDays', value);
        }
    };
    // Gérer les changements de période de repos
    var handleRestPeriodChange = function (e) {
        var value = parseInt(e.target.value);
        if (!isNaN(value) && value >= 0) {
            handleChange('minRestPeriodAfterDuty', value);
        }
    };
    // Gérer les changements de stratégie de rotation
    var handleRotationStrategyChange = function (e) {
        handleChange('rotationStrategy', e.target.value);
    };
    // Ajouter un rôle spécifique
    var handleAddRole = function (e) {
        var _a;
        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
            e.preventDefault();
            var newRole = e.currentTarget.value.trim();
            if (!((_a = dutyConfig.specificRoles) === null || _a === void 0 ? void 0 : _a.includes(newRole))) {
                handleChange('specificRoles', __spreadArray(__spreadArray([], (dutyConfig.specificRoles || []), true), [newRole], false));
                e.currentTarget.value = '';
            }
        }
    };
    // Supprimer un rôle spécifique
    var handleRemoveRole = function (roleToRemove) {
        var _a;
        handleChange('specificRoles', ((_a = dutyConfig.specificRoles) === null || _a === void 0 ? void 0 : _a.filter(function (role) { return role !== roleToRemove; })) || []);
    };
    // Ajouter une période de garde
    var handleAddDutyPeriod = function () {
        handleChange('dutyPeriods', __spreadArray(__spreadArray([], (dutyConfig.dutyPeriods || []), true), [
            { dayOfWeek: 1, startTime: '08:00', endTime: '20:00' }
        ], false));
    };
    // Mettre à jour une période de garde
    var handleUpdateDutyPeriod = function (index, field, value) {
        var _a;
        var updatedPeriods = __spreadArray([], (dutyConfig.dutyPeriods || []), true);
        updatedPeriods[index] = __assign(__assign({}, updatedPeriods[index]), (_a = {}, _a[field] = value, _a));
        handleChange('dutyPeriods', updatedPeriods);
    };
    // Supprimer une période de garde
    var handleRemoveDutyPeriod = function (index) {
        var updatedPeriods = __spreadArray([], (dutyConfig.dutyPeriods || []), true);
        updatedPeriods.splice(index, 1);
        handleChange('dutyPeriods', updatedPeriods);
    };
    // Obtenir le nom du jour de la semaine
    var getDayName = function (dayOfWeek) {
        var days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        return days[dayOfWeek % 7];
    };
    return (<div className="space-y-6">
            {/* Nombre minimum de personnel */}
            <div>
                <label htmlFor="min-personnel" className="block text-sm font-medium text-gray-700">
                    Personnel minimum requis
                </label>
                <div className="mt-1">
                    <input type="number" id="min-personnel" min="1" value={dutyConfig.minPersonnel} onChange={handlePersonnelChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    Nombre minimum de personnes requises pour assurer la garde
                </p>
            </div>

            {/* Jours consécutifs maximum */}
            <div>
                <label htmlFor="max-consecutive-days" className="block text-sm font-medium text-gray-700">
                    Jours consécutifs maximum
                </label>
                <div className="mt-1">
                    <input type="number" id="max-consecutive-days" min="1" value={dutyConfig.maxConsecutiveDays} onChange={handleConsecutiveDaysChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    Nombre maximum de jours consécutifs de garde autorisés
                </p>
            </div>

            {/* Période de repos minimum */}
            <div>
                <label htmlFor="min-rest-period" className="block text-sm font-medium text-gray-700">
                    Repos minimum après garde (heures)
                </label>
                <div className="mt-1">
                    <input type="number" id="min-rest-period" min="0" value={dutyConfig.minRestPeriodAfterDuty} onChange={handleRestPeriodChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    Durée minimale de repos requise après une garde (en heures)
                </p>
            </div>

            {/* Stratégie de rotation */}
            <div>
                <label htmlFor="rotation-strategy" className="block text-sm font-medium text-gray-700">
                    Stratégie de rotation
                </label>
                <div className="mt-1">
                    <select id="rotation-strategy" value={dutyConfig.rotationStrategy || 'SEQUENTIAL'} onChange={handleRotationStrategyChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        <option value="SEQUENTIAL">Séquentielle</option>
                        <option value="BALANCED">Équilibrée</option>
                        <option value="CUSTOM">Personnalisée</option>
                    </select>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    Comment les gardes sont attribuées aux membres du personnel
                </p>
            </div>

            {/* Rôles spécifiques */}
            <div>
                <label htmlFor="specific-roles" className="block text-sm font-medium text-gray-700">
                    Rôles spécifiques requis
                </label>
                <div className="mt-1">
                    <input type="text" id="specific-roles" placeholder="Appuyez sur Entrée pour ajouter un rôle" onKeyDown={handleAddRole} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                {dutyConfig.specificRoles && dutyConfig.specificRoles.length > 0 && (<div className="mt-2 flex flex-wrap gap-2">
                        {dutyConfig.specificRoles.map(function (role, index) { return (<div key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {role}
                                <button type="button" onClick={function () { return handleRemoveRole(role); }} className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-400 hover:text-blue-700 focus:outline-none">
                                    <span className="sr-only">Supprimer {role}</span>
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>); })}
                    </div>)}
                <p className="mt-1 text-xs text-gray-500">
                    Rôles spécifiques nécessaires pour cette garde
                </p>
            </div>

            {/* Périodes de garde */}
            <div>
                <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">
                        Périodes de garde
                    </label>
                    <button type="button" onClick={handleAddDutyPeriod} className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Ajouter une période
                    </button>
                </div>
                <div className="mt-2 space-y-4">
                    {dutyConfig.dutyPeriods && dutyConfig.dutyPeriods.length > 0 ? (dutyConfig.dutyPeriods.map(function (period, index) { return (<div key={index} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md">
                                <div className="flex-grow">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label htmlFor={"day-of-week-".concat(index)} className="block text-xs font-medium text-gray-500">
                                                Jour
                                            </label>
                                            <select id={"day-of-week-".concat(index)} value={period.dayOfWeek} onChange={function (e) { return handleUpdateDutyPeriod(index, 'dayOfWeek', parseInt(e.target.value)); }} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm">
                                                {[0, 1, 2, 3, 4, 5, 6].map(function (day) { return (<option key={day} value={day}>
                                                        {getDayName(day)}
                                                    </option>); })}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor={"start-time-".concat(index)} className="block text-xs font-medium text-gray-500">
                                                Début
                                            </label>
                                            <input type="time" id={"start-time-".concat(index)} value={period.startTime} onChange={function (e) { return handleUpdateDutyPeriod(index, 'startTime', e.target.value); }} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"/>
                                        </div>
                                        <div>
                                            <label htmlFor={"end-time-".concat(index)} className="block text-xs font-medium text-gray-500">
                                                Fin
                                            </label>
                                            <input type="time" id={"end-time-".concat(index)} value={period.endTime} onChange={function (e) { return handleUpdateDutyPeriod(index, 'endTime', e.target.value); }} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"/>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <button type="button" onClick={function () { return handleRemoveDutyPeriod(index); }} className="inline-flex items-center p-1.5 border border-transparent rounded-full text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                        <span className="sr-only">Supprimer cette période</span>
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>); })) : (<div className="text-sm text-gray-500 italic">
                            Aucune période de garde définie. Cliquez sur "Ajouter une période" pour en créer une.
                        </div>)}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    Définissez les jours et heures de garde
                </p>
            </div>
        </div>);
};
