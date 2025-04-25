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
import axios from 'axios';
import { addDays, isWeekend } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Check, Info, HelpCircle } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
// Enregistrer la locale française pour le DatePicker
registerLocale('fr', fr);
// Traductions françaises pour les types de congés
var leaveTypeTranslations = {
    'ANNUAL': 'Congé annuel',
    'RECOVERY': 'Récupération (IADE)',
    'TRAINING': 'Formation',
    'SICK': 'Maladie',
    'MATERNITY': 'Maternité',
    'SPECIAL': 'Congé spécial',
    'UNPAID': 'Sans solde',
    'OTHER': 'Autre'
};
export var LeaveForm = function (_a) {
    var userId = _a.userId, onSuccess = _a.onSuccess;
    // State pour les types de congés chargés depuis l'API
    var _b = useState([]), availableLeaveTypes = _b[0], setAvailableLeaveTypes = _b[1];
    var _c = useState(true), isLoadingTypes = _c[0], setIsLoadingTypes = _c[1];
    var _d = useState(null), loadTypeError = _d[0], setLoadTypeError = _d[1];
    // Utiliser des objets Date plutôt que des strings pour les dates
    var _e = useState(null), startDate = _e[0], setStartDate = _e[1];
    var _f = useState(null), endDate = _f[0], setEndDate = _f[1];
    var _g = useState(''), leaveType = _g[0], setLeaveType = _g[1];
    var _h = useState(''), reason = _h[0], setReason = _h[1];
    var _j = useState(null), error = _j[0], setError = _j[1];
    var _k = useState(false), isSubmitting = _k[0], setIsSubmitting = _k[1];
    var _l = useState(null), estimatedDays = _l[0], setEstimatedDays = _l[1];
    // Charger les types de congés au montage
    useEffect(function () {
        var fetchTypes = function () { return __awaiter(void 0, void 0, void 0, function () {
            var response, data, translatedData, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setIsLoadingTypes(true);
                        setLoadTypeError(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, fetch('/api/leaves/types')];
                    case 2:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Erreur HTTP ".concat(response.status));
                        }
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data = _a.sent();
                        translatedData = data.map(function (type) { return (__assign(__assign({}, type), { label: leaveTypeTranslations[type.code] || type.label })); });
                        setAvailableLeaveTypes(translatedData);
                        // Pré-sélectionner le premier type de la liste s'il y en a
                        if (translatedData.length > 0) {
                            setLeaveType(translatedData[0].code);
                        }
                        return [3 /*break*/, 6];
                    case 4:
                        err_1 = _a.sent();
                        console.error("Erreur lors du chargement des types de congés:", err_1);
                        setLoadTypeError("Impossible de charger les types de congés.");
                        return [3 /*break*/, 6];
                    case 5:
                        setIsLoadingTypes(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        fetchTypes();
    }, []);
    // Calculer une estimation du nombre de jours ouvrés entre les dates
    useEffect(function () {
        if (startDate && endDate) {
            var days = 0;
            var currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                if (!isWeekend(currentDate)) {
                    days++;
                }
                currentDate = addDays(currentDate, 1);
            }
            setEstimatedDays(days);
        }
        else {
            setEstimatedDays(null);
        }
    }, [startDate, endDate]);
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var response, err_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    e.preventDefault();
                    setError(null);
                    setIsSubmitting(true);
                    if (!startDate || !endDate) {
                        setError('Veuillez sélectionner une date de début et de fin.');
                        setIsSubmitting(false);
                        return [2 /*return*/];
                    }
                    if (!leaveType) {
                        setError('Veuillez sélectionner un type de congé.');
                        setIsSubmitting(false);
                        return [2 /*return*/];
                    }
                    if (endDate < startDate) {
                        setError('La date de fin ne peut pas être antérieure à la date de début.');
                        setIsSubmitting(false);
                        return [2 /*return*/];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, axios.post('/api/leaves', {
                            userId: userId,
                            startDate: startDate.toISOString(),
                            endDate: endDate.toISOString(),
                            typeCode: leaveType,
                            reason: reason,
                        })];
                case 2:
                    response = _c.sent();
                    onSuccess(response.data);
                    return [3 /*break*/, 5];
                case 3:
                    err_2 = _c.sent();
                    console.error("Erreur lors de la soumission de la demande:", err_2);
                    setError(((_b = (_a = err_2.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || 'Une erreur est survenue.');
                    return [3 /*break*/, 5];
                case 4:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // Fonction pour rendre le calendrier d'une date
    var renderDateInput = function (selected, onChange, id, label, minDate) { return (<div className="relative">
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="relative">
                <DatePicker id={id} selected={selected} onChange={onChange} selectsStart={id === "startDate"} selectsEnd={id === "endDate"} startDate={startDate} endDate={endDate} minDate={minDate || new Date()} dateFormat="dd/MM/yyyy" locale="fr" className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pl-10 pr-4 py-2" placeholderText="Sélectionner une date" autoComplete="off" calendarClassName="shadow-lg rounded-md border border-gray-200" popperClassName="z-50" excludeDates={[]} // Vous pouvez ajouter des dates à exclure ici
     highlightDates={[]} // Vous pouvez ajouter des dates à mettre en évidence ici
    />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400"/>
                </div>
            </div>
        </div>); };
    return (<form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg shadow-sm mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Nouvelle demande de congé</h3>
                <p className="text-sm text-gray-600">Complétez le formulaire ci-dessous pour soumettre votre demande.</p>
            </div>

            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                {/* Type de congé avec bulle d'aide */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700">Type de congé</label>
                        <Tippy content={<span>Sélectionnez le type de congé approprié à votre situation</span>} theme="light" placement="top">
                            <span className="text-gray-400 hover:text-gray-600 cursor-help">
                                <HelpCircle className="h-4 w-4"/>
                            </span>
                        </Tippy>
                    </div>
                    <div className="mt-1 relative">
                        <select id="leaveType" name="leaveType" value={leaveType} onChange={function (e) { return setLeaveType(e.target.value); }} required disabled={isLoadingTypes || availableLeaveTypes.length === 0} className="block w-full rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            {isLoadingTypes ? (<option value="">Chargement...</option>) : loadTypeError ? (<option value="">Erreur</option>) : availableLeaveTypes.length === 0 ? (<option value="">Aucun type disponible</option>) : (<>
                                    <option value="">-- Sélectionner un type --</option>
                                    {availableLeaveTypes.map(function (type) { return (<option key={type.code} value={type.code} title={type.description}>
                                            {type.label}
                                        </option>); })}
                                </>)}
                        </select>
                        {loadTypeError && <p className="text-xs text-red-500 mt-1">{loadTypeError}</p>}
                    </div>
                </div>

                {/* Calendriers de sélection de dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {renderDateInput(startDate, setStartDate, "startDate", "Date de début")}
                    {renderDateInput(endDate, setEndDate, "endDate", "Date de fin", startDate || undefined)}
                </div>

                {/* Affichage de l'estimation des jours */}
                {estimatedDays !== null && (<div className="bg-blue-50 text-blue-800 p-3 rounded-md mb-6 flex items-start">
                        <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5"/>
                        <div>
                            <p className="text-sm font-medium">Estimation : {estimatedDays} jour{estimatedDays > 1 ? 's' : ''} ouvré{estimatedDays > 1 ? 's' : ''}</p>
                            <p className="text-xs mt-1">Cette estimation ne prend pas en compte les jours fériés et votre planning personnel.</p>
                        </div>
                    </div>)}

                {/* Motif */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Motif (optionnel)</label>
                        <span className="text-xs text-gray-500">Max. 200 caractères</span>
                    </div>
                    <textarea id="reason" name="reason" rows={3} maxLength={200} value={reason} onChange={function (e) { return setReason(e.target.value); }} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Précisez le motif de votre demande si nécessaire..."/>
                    <p className="text-xs text-gray-500 mt-1">{reason.length}/200 caractères</p>
                </div>
            </div>

            {error && (<div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                </div>)}

            <div className="flex justify-end pt-4">
                <button type="submit" disabled={isSubmitting || isLoadingTypes} className={"inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white transition-colors ".concat(isSubmitting ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700', " focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50")}>
                    {isSubmitting ? (<>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Envoi en cours...
                        </>) : (<>
                            <Check className="w-4 h-4 mr-2"/>
                            Envoyer la demande
                        </>)}
                </button>
            </div>
        </form>);
};
