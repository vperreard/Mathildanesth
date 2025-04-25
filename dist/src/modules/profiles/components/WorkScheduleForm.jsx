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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React, { useEffect, useState } from 'react';
import { WorkFrequency, WeekType, MonthType } from '../types/workSchedule';
import { useWorkSchedule } from '../hooks/useWorkSchedule';
import { calculateAnnualLeaveAllowance } from '../services/workScheduleService';
export var WorkScheduleForm = function (_a) {
    var userId = _a.userId, initialSchedule = _a.initialSchedule, onSave = _a.onSave, onCancel = _a.onCancel;
    var _b = useWorkSchedule({ userId: userId, initialSchedule: initialSchedule }), currentSchedule = _b.currentSchedule, loading = _b.loading, error = _b.error, updateScheduleField = _b.updateScheduleField, saveSchedule = _b.saveSchedule;
    var _c = useState([]), selectedWeekdays = _c[0], setSelectedWeekdays = _c[1];
    var _d = useState([]), selectedEvenWeekdays = _d[0], setSelectedEvenWeekdays = _d[1];
    var _e = useState([]), selectedOddWeekdays = _e[0], setSelectedOddWeekdays = _e[1];
    // Initialiser les jours sélectionnés à partir du schedule actuel
    useEffect(function () {
        if (currentSchedule === null || currentSchedule === void 0 ? void 0 : currentSchedule.workingDays) {
            setSelectedWeekdays(currentSchedule.workingDays);
        }
        else {
            // Par défaut: jours de semaine (lundi-vendredi)
            setSelectedWeekdays([1, 2, 3, 4, 5]);
        }
        if (currentSchedule === null || currentSchedule === void 0 ? void 0 : currentSchedule.customSchedule) {
            setSelectedEvenWeekdays(currentSchedule.customSchedule.evenWeeks || []);
            setSelectedOddWeekdays(currentSchedule.customSchedule.oddWeeks || []);
        }
    }, [currentSchedule]);
    // Gérer le changement de type de fréquence
    var handleFrequencyChange = function (e) {
        var frequency = e.target.value;
        updateScheduleField('frequency', frequency);
        // Réinitialiser les champs spécifiques à certains types de fréquence
        if (frequency !== WorkFrequency.PART_TIME) {
            updateScheduleField('workingTimePercentage', undefined);
        }
        if (frequency !== WorkFrequency.ALTERNATE_WEEKS) {
            updateScheduleField('weekType', undefined);
        }
        if (frequency !== WorkFrequency.ALTERNATE_MONTHS) {
            updateScheduleField('monthType', undefined);
        }
        if (frequency !== WorkFrequency.CUSTOM) {
            updateScheduleField('customSchedule', undefined);
        }
    };
    // Gérer la sélection/désélection des jours de la semaine
    var handleWeekdayToggle = function (day) {
        var newSelectedDays = selectedWeekdays.includes(day)
            ? selectedWeekdays.filter(function (d) { return d !== day; })
            : __spreadArray(__spreadArray([], selectedWeekdays, true), [day], false);
        setSelectedWeekdays(newSelectedDays);
        updateScheduleField('workingDays', newSelectedDays);
        // Mettre à jour également le pourcentage de temps de travail
        if ((currentSchedule === null || currentSchedule === void 0 ? void 0 : currentSchedule.frequency) === WorkFrequency.PART_TIME) {
            var percentage = Math.round((newSelectedDays.length / 5) * 100);
            updateScheduleField('workingTimePercentage', percentage);
            updateScheduleField('annualLeaveAllowance', calculateAnnualLeaveAllowance(percentage));
        }
    };
    // Gérer la sélection/désélection des jours pour semaines paires
    var handleEvenWeekdayToggle = function (day) {
        var newSelectedDays = selectedEvenWeekdays.includes(day)
            ? selectedEvenWeekdays.filter(function (d) { return d !== day; })
            : __spreadArray(__spreadArray([], selectedEvenWeekdays, true), [day], false);
        setSelectedEvenWeekdays(newSelectedDays);
        updateScheduleField('customSchedule', __assign(__assign({}, currentSchedule === null || currentSchedule === void 0 ? void 0 : currentSchedule.customSchedule), { evenWeeks: newSelectedDays }));
        // Mettre à jour le pourcentage de temps de travail pour la configuration personnalisée
        if ((currentSchedule === null || currentSchedule === void 0 ? void 0 : currentSchedule.frequency) === WorkFrequency.CUSTOM) {
            var totalPercentage = Math.round(((newSelectedDays.length + ((selectedOddWeekdays === null || selectedOddWeekdays === void 0 ? void 0 : selectedOddWeekdays.length) || 0)) / 10) * 100);
            updateScheduleField('workingTimePercentage', totalPercentage);
            updateScheduleField('annualLeaveAllowance', calculateAnnualLeaveAllowance(totalPercentage));
        }
    };
    // Gérer la sélection/désélection des jours pour semaines impaires
    var handleOddWeekdayToggle = function (day) {
        var newSelectedDays = selectedOddWeekdays.includes(day)
            ? selectedOddWeekdays.filter(function (d) { return d !== day; })
            : __spreadArray(__spreadArray([], selectedOddWeekdays, true), [day], false);
        setSelectedOddWeekdays(newSelectedDays);
        updateScheduleField('customSchedule', __assign(__assign({}, currentSchedule === null || currentSchedule === void 0 ? void 0 : currentSchedule.customSchedule), { oddWeeks: newSelectedDays }));
        // Mettre à jour le pourcentage de temps de travail pour la configuration personnalisée
        if ((currentSchedule === null || currentSchedule === void 0 ? void 0 : currentSchedule.frequency) === WorkFrequency.CUSTOM) {
            var totalPercentage = Math.round(((((selectedEvenWeekdays === null || selectedEvenWeekdays === void 0 ? void 0 : selectedEvenWeekdays.length) || 0) + newSelectedDays.length) / 10) * 100);
            updateScheduleField('workingTimePercentage', totalPercentage);
            updateScheduleField('annualLeaveAllowance', calculateAnnualLeaveAllowance(totalPercentage));
        }
    };
    // Gérer la soumission du formulaire
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var savedSchedule, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    // Vérifier si les champs requis sont remplis
                    if (!(currentSchedule === null || currentSchedule === void 0 ? void 0 : currentSchedule.frequency)) {
                        throw new Error('Le type de planning est requis');
                    }
                    // Si pas déjà défini, mettre à jour l'ID utilisateur
                    if (!currentSchedule.userId) {
                        updateScheduleField('userId', userId);
                    }
                    // Si c'est un nouveau planning, définir les dates de création/modification
                    if (!currentSchedule.id) {
                        updateScheduleField('createdAt', new Date());
                        updateScheduleField('isActive', true);
                    }
                    updateScheduleField('updatedAt', new Date());
                    return [4 /*yield*/, saveSchedule()];
                case 2:
                    savedSchedule = _a.sent();
                    if (onSave) {
                        onSave(savedSchedule);
                    }
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.error('Erreur lors de l\'enregistrement du planning:', err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Obtenir les libellés des jours de la semaine
    var getWeekdayLabel = function (day) {
        switch (day) {
            case 1: return 'Lundi';
            case 2: return 'Mardi';
            case 3: return 'Mercredi';
            case 4: return 'Jeudi';
            case 5: return 'Vendredi';
            case 6: return 'Samedi';
            case 0: return 'Dimanche';
            default: return '';
        }
    };
    return (<div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
                {(currentSchedule === null || currentSchedule === void 0 ? void 0 : currentSchedule.id) ? 'Modifier le planning de travail' : 'Nouveau planning de travail'}
            </h2>

            {error && (<div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                    <p className="text-red-700">{error.message}</p>
                </div>)}

            <form onSubmit={handleSubmit}>
                {/* Type de fréquence */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de planning
                    </label>
                    <select value={(currentSchedule === null || currentSchedule === void 0 ? void 0 : currentSchedule.frequency) || ''} onChange={handleFrequencyChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                        <option value="">Sélectionner...</option>
                        <option value={WorkFrequency.FULL_TIME}>Temps plein</option>
                        <option value={WorkFrequency.PART_TIME}>Temps partiel</option>
                        <option value={WorkFrequency.ALTERNATE_WEEKS}>Alternance semaines paires/impaires</option>
                        <option value={WorkFrequency.ALTERNATE_MONTHS}>Alternance mois pairs/impairs</option>
                        <option value={WorkFrequency.CUSTOM}>Configuration personnalisée</option>
                    </select>
                </div>

                {/* Champs spécifiques en fonction de la fréquence */}
                {(currentSchedule === null || currentSchedule === void 0 ? void 0 : currentSchedule.frequency) === WorkFrequency.PART_TIME && (<>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pourcentage de temps de travail
                            </label>
                            <div className="flex items-center">
                                <input type="number" min="0" max="100" value={(currentSchedule === null || currentSchedule === void 0 ? void 0 : currentSchedule.workingTimePercentage) || 0} onChange={function (e) { return updateScheduleField('workingTimePercentage', parseInt(e.target.value)); }} className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                                <span className="ml-2">%</span>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jours travaillés
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4, 5].map(function (day) { return (<button key={day} type="button" onClick={function () { return handleWeekdayToggle(day); }} className={"px-3 py-1 rounded-md ".concat(selectedWeekdays.includes(day)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700')}>
                                        {getWeekdayLabel(day)}
                                    </button>); })}
                            </div>
                        </div>
                    </>)}

                {(currentSchedule === null || currentSchedule === void 0 ? void 0 : currentSchedule.frequency) === WorkFrequency.ALTERNATE_WEEKS && (<>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type de semaine
                            </label>
                            <select value={(currentSchedule === null || currentSchedule === void 0 ? void 0 : currentSchedule.weekType) || ''} onChange={function (e) { return updateScheduleField('weekType', e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                                <option value="">Sélectionner...</option>
                                <option value={WeekType.BOTH}>Toutes les semaines</option>
                                <option value={WeekType.EVEN}>Semaines paires uniquement</option>
                                <option value={WeekType.ODD}>Semaines impaires uniquement</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jours travaillés
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4, 5].map(function (day) { return (<button key={day} type="button" onClick={function () { return handleWeekdayToggle(day); }} className={"px-3 py-1 rounded-md ".concat(selectedWeekdays.includes(day)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700')}>
                                        {getWeekdayLabel(day)}
                                    </button>); })}
                            </div>
                        </div>
                    </>)}

                {(currentSchedule === null || currentSchedule === void 0 ? void 0 : currentSchedule.frequency) === WorkFrequency.ALTERNATE_MONTHS && (<>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type de mois
                            </label>
                            <select value={(currentSchedule === null || currentSchedule === void 0 ? void 0 : currentSchedule.monthType) || ''} onChange={function (e) { return updateScheduleField('monthType', e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                                <option value="">Sélectionner...</option>
                                <option value={MonthType.BOTH}>Tous les mois</option>
                                <option value={MonthType.EVEN}>Mois pairs uniquement</option>
                                <option value={MonthType.ODD}>Mois impairs uniquement</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jours travaillés
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4, 5].map(function (day) { return (<button key={day} type="button" onClick={function () { return handleWeekdayToggle(day); }} className={"px-3 py-1 rounded-md ".concat(selectedWeekdays.includes(day)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700')}>
                                        {getWeekdayLabel(day)}
                                    </button>); })}
                            </div>
                        </div>
                    </>)}

                {(currentSchedule === null || currentSchedule === void 0 ? void 0 : currentSchedule.frequency) === WorkFrequency.CUSTOM && (<>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jours travaillés (semaines paires)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4, 5].map(function (day) { return (<button key={day} type="button" onClick={function () { return handleEvenWeekdayToggle(day); }} className={"px-3 py-1 rounded-md ".concat(selectedEvenWeekdays.includes(day)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700')}>
                                        {getWeekdayLabel(day)}
                                    </button>); })}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jours travaillés (semaines impaires)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4, 5].map(function (day) { return (<button key={day} type="button" onClick={function () { return handleOddWeekdayToggle(day); }} className={"px-3 py-1 rounded-md ".concat(selectedOddWeekdays.includes(day)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700')}>
                                        {getWeekdayLabel(day)}
                                    </button>); })}
                            </div>
                        </div>
                    </>)}

                {/* Dates de validité */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de début de validité
                    </label>
                    <input type="date" value={(currentSchedule === null || currentSchedule === void 0 ? void 0 : currentSchedule.validFrom) ? new Date(currentSchedule.validFrom).toISOString().split('T')[0] : ''} onChange={function (e) { return updateScheduleField('validFrom', new Date(e.target.value)); }} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required/>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de fin de validité (optionnel)
                    </label>
                    <input type="date" value={(currentSchedule === null || currentSchedule === void 0 ? void 0 : currentSchedule.validTo) ? new Date(currentSchedule.validTo).toISOString().split('T')[0] : ''} onChange={function (e) { return updateScheduleField('validTo', e.target.value ? new Date(e.target.value) : undefined); }} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>

                {/* Nombre de jours de congés annuels */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jours de congés annuels
                    </label>
                    <input type="number" min="0" max="100" value={(currentSchedule === null || currentSchedule === void 0 ? void 0 : currentSchedule.annualLeaveAllowance) || 0} onChange={function (e) { return updateScheduleField('annualLeaveAllowance', parseInt(e.target.value)); }} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required/>
                    <p className="mt-1 text-sm text-gray-500">
                        Pour un temps plein: 50 jours
                    </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                    {onCancel && (<button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Annuler
                        </button>)}
                    <button type="submit" disabled={loading} className={"px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ".concat(loading ? 'opacity-70 cursor-not-allowed' : '')}>
                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </div>);
};
