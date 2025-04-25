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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import React, { useState, useEffect } from 'react';
import { RuleType, RulePriority } from '../types/rule';
import { getRuleTypeLabel, getRulePriorityLabel } from '../services/ruleService';
import { format } from 'date-fns';
// Importation des formulaires spécifiques par type
import { DutyRuleForm } from './rule-forms/DutyRuleForm';
import { ConsultationRuleForm } from './rule-forms/ConsultationRuleForm';
import { PlanningRuleForm } from './rule-forms/PlanningRuleForm';
import { SupervisionRuleForm } from './rule-forms/SupervisionRuleForm';
import { LocationRuleForm } from './rule-forms/LocationRuleForm';
export var RuleForm = function (_a) {
    var rule = _a.rule, onSave = _a.onSave, onCancel = _a.onCancel, loading = _a.loading, conflicts = _a.conflicts;
    // État pour stocker la règle en cours d'édition
    var _b = useState(rule), currentRule = _b[0], setCurrentRule = _b[1];
    // État pour les erreurs de validation
    var _c = useState([]), validationErrors = _c[0], setValidationErrors = _c[1];
    // Mettre à jour la règle locale lorsque la règle passée en prop change
    useEffect(function () {
        setCurrentRule(rule);
    }, [rule]);
    // Gérer les changements des champs de base
    var handleBaseFieldChange = function (field, value) {
        setCurrentRule(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = value, _a)));
        });
    };
    // Gérer les changements spécifiques au type de règle
    var handleSpecificFieldChange = function (updatedRule) {
        setCurrentRule(updatedRule);
    };
    // Valider le formulaire
    var validateForm = function () {
        var _a;
        var errors = [];
        // Valider les champs de base
        if (!((_a = currentRule.name) === null || _a === void 0 ? void 0 : _a.trim())) {
            errors.push('Le nom de la règle est requis');
        }
        if (!currentRule.validFrom) {
            errors.push('La date de début de validité est requise');
        }
        if (currentRule.validTo && currentRule.validFrom && new Date(currentRule.validTo) < new Date(currentRule.validFrom)) {
            errors.push('La date de fin doit être postérieure à la date de début');
        }
        // Valider les champs spécifiques au type (à compléter selon le type)
        // ...
        setValidationErrors(errors);
        return errors.length === 0;
    };
    // Soumettre le formulaire
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!validateForm()) {
                        return [2 /*return*/];
                    }
                    // Si le formulaire est valide, appeler onSave
                    return [4 /*yield*/, onSave(currentRule)];
                case 1:
                    // Si le formulaire est valide, appeler onSave
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    return (<div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
                {rule.id ? 'Modifier une règle' : 'Créer une nouvelle règle'}
            </h2>

            {/* Afficher les erreurs de validation */}
            {validationErrors.length > 0 && (<div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                Veuillez corriger les erreurs suivantes:
                            </h3>
                            <ul className="mt-1 list-disc list-inside text-sm text-red-600">
                                {validationErrors.map(function (error, index) { return (<li key={index}>{error}</li>); })}
                            </ul>
                        </div>
                    </div>
                </div>)}

            {/* Afficher les conflits détectés */}
            {conflicts && conflicts.hasConflicts && (<div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                                Conflits détectés:
                            </h3>
                            <ul className="mt-1 list-disc list-inside text-sm text-yellow-600">
                                {conflicts.conflicts.map(function (conflict, index) { return (<li key={index}>
                                        {conflict.conflictDescription}
                                        {conflict.ruleName && " (conflit avec: ".concat(conflict.ruleName, ")")}
                                    </li>); })}
                            </ul>
                        </div>
                    </div>
                </div>)}

            <form onSubmit={handleSubmit}>
                {/* Champs communs à tous les types de règles */}
                <div className="space-y-6">
                    {/* Type de règle (en lecture seule si on modifie une règle existante) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type de règle
                        </label>
                        <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                            {getRuleTypeLabel(currentRule.type)}
                        </div>
                    </div>

                    {/* Nom de la règle */}
                    <div>
                        <label htmlFor="rule-name" className="block text-sm font-medium text-gray-700 mb-1">
                            Nom *
                        </label>
                        <input id="rule-name" type="text" value={currentRule.name || ''} onChange={function (e) { return handleBaseFieldChange('name', e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required/>
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="rule-description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea id="rule-description" value={currentRule.description || ''} onChange={function (e) { return handleBaseFieldChange('description', e.target.value); }} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>

                    {/* Priorité */}
                    <div>
                        <label htmlFor="rule-priority" className="block text-sm font-medium text-gray-700 mb-1">
                            Priorité *
                        </label>
                        <select id="rule-priority" value={currentRule.priority || ''} onChange={function (e) { return handleBaseFieldChange('priority', e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                            <option value="">Sélectionner la priorité</option>
                            {Object.values(RulePriority).map(function (priority) { return (<option key={priority} value={priority}>
                                    {getRulePriorityLabel(priority)}
                                </option>); })}
                        </select>
                    </div>

                    {/* Période de validité */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="valid-from" className="block text-sm font-medium text-gray-700 mb-1">
                                Valide à partir du *
                            </label>
                            <input id="valid-from" type="date" value={currentRule.validFrom
            ? format(new Date(currentRule.validFrom), 'yyyy-MM-dd')
            : ''} onChange={function (e) { return handleBaseFieldChange('validFrom', new Date(e.target.value)); }} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required/>
                        </div>
                        <div>
                            <label htmlFor="valid-to" className="block text-sm font-medium text-gray-700 mb-1">
                                Jusqu'au (optionnel)
                            </label>
                            <input id="valid-to" type="date" value={currentRule.validTo
            ? format(new Date(currentRule.validTo), 'yyyy-MM-dd')
            : ''} onChange={function (e) { return handleBaseFieldChange('validTo', e.target.value ? new Date(e.target.value) : undefined); }} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                        </div>
                    </div>

                    {/* Statut */}
                    <div>
                        <div className="flex items-center">
                            <input id="is-active" type="checkbox" checked={currentRule.isActive || false} onChange={function (e) { return handleBaseFieldChange('isActive', e.target.checked); }} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
                            <label htmlFor="is-active" className="ml-2 block text-sm text-gray-700">
                                Règle active
                            </label>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            Les règles inactives sont enregistrées mais ne sont pas appliquées aux plannings
                        </p>
                    </div>
                </div>

                {/* Formulaire spécifique au type de règle */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Configuration spécifique
                    </h3>

                    {/* Charger le formulaire approprié selon le type de règle */}
                    {currentRule.type === RuleType.DUTY && (<DutyRuleForm rule={currentRule} onChange={handleSpecificFieldChange}/>)}

                    {currentRule.type === RuleType.CONSULTATION && (<ConsultationRuleForm rule={currentRule} onChange={handleSpecificFieldChange}/>)}

                    {currentRule.type === RuleType.PLANNING && (<PlanningRuleForm rule={currentRule} onChange={handleSpecificFieldChange}/>)}

                    {currentRule.type === RuleType.SUPERVISION && (<SupervisionRuleForm rule={currentRule} onChange={handleSpecificFieldChange}/>)}

                    {currentRule.type === RuleType.LOCATION && (<LocationRuleForm rule={currentRule} onChange={handleSpecificFieldChange}/>)}
                </div>

                {/* Boutons d'action */}
                <div className="mt-8 flex justify-end space-x-3">
                    <button type="button" onClick={onCancel} disabled={loading} className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Annuler
                    </button>
                    <button type="submit" disabled={loading} className={"px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ".concat(loading ? 'opacity-70 cursor-not-allowed' : '')}>
                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </div>);
};
