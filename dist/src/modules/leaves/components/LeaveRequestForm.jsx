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
import React, { useState } from 'react';
import { LeaveType } from '../types/leave';
import { useLeave } from '../hooks/useLeave';
import { useConflictDetection } from '../hooks/useConflictDetection';
import { getLeaveTypeLabel } from '../services/leaveService';
import { format, differenceInDays, addDays } from 'date-fns';
export var LeaveRequestForm = function (_a) {
    var userId = _a.userId, userSchedule = _a.userSchedule, initialLeave = _a.initialLeave, onSubmit = _a.onSubmit, onSaveDraft = _a.onSaveDraft, onCancel = _a.onCancel;
    var _b = useLeave({
        userId: userId,
        initialLeave: initialLeave,
        userSchedule: userSchedule
    }), leave = _b.leave, leaveLoading = _b.loading, leaveError = _b.error, updateLeaveField = _b.updateLeaveField, saveLeaveAsDraft = _b.saveLeaveAsDraft, submitLeave = _b.submitLeave, calculateLeaveDuration = _b.calculateLeaveDuration;
    var _c = useConflictDetection({ userId: userId }), conflicts = _c.conflicts, hasBlockingConflicts = _c.hasBlockingConflicts, conflictLoading = _c.loading, conflictError = _c.error, checkConflicts = _c.checkConflicts, getBlockingConflicts = _c.getBlockingConflicts, getWarningConflicts = _c.getWarningConflicts;
    var _d = useState([]), formErrors = _d[0], setFormErrors = _d[1];
    var _e = useState(false), showConflictWarning = _e[0], setShowConflictWarning = _e[1];
    // Gérer le changement de type de congé
    var handleTypeChange = function (e) {
        updateLeaveField('type', e.target.value);
    };
    // Gérer le changement de dates
    var handleDateChange = function (field, value) {
        updateLeaveField(field, new Date(value));
        // Vérifier les conflits automatiquement lorsque les deux dates sont définies
        if ((leave === null || leave === void 0 ? void 0 : leave.startDate) && leave.endDate) {
            var start = field === 'startDate' ? new Date(value) : new Date(leave.startDate);
            var end = field === 'endDate' ? new Date(value) : new Date(leave.endDate);
            if (start <= end) {
                checkConflicts(start, end, leave.id).catch(function (error) {
                    console.error('Erreur lors de la vérification des conflits:', error);
                });
            }
        }
    };
    // Gérer le changement de motif
    var handleReasonChange = function (e) {
        updateLeaveField('reason', e.target.value);
    };
    // Vérifier le formulaire
    var validateForm = function () {
        var errors = [];
        if (!(leave === null || leave === void 0 ? void 0 : leave.type)) {
            errors.push('Le type de congé est requis');
        }
        if (!(leave === null || leave === void 0 ? void 0 : leave.startDate)) {
            errors.push('La date de début est requise');
        }
        if (!(leave === null || leave === void 0 ? void 0 : leave.endDate)) {
            errors.push('La date de fin est requise');
        }
        if ((leave === null || leave === void 0 ? void 0 : leave.startDate) && leave.endDate && new Date(leave.startDate) > new Date(leave.endDate)) {
            errors.push('La date de début doit être antérieure ou égale à la date de fin');
        }
        if (hasBlockingConflicts) {
            errors.push('Il y a des conflits bloquants qui doivent être résolus');
        }
        setFormErrors(errors);
        return errors.length === 0;
    };
    // Soumettre la demande
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var warningConflicts, submittedLeave, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!validateForm()) {
                        return [2 /*return*/];
                    }
                    warningConflicts = getWarningConflicts();
                    if (warningConflicts.length > 0 && !showConflictWarning) {
                        setShowConflictWarning(true);
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, submitLeave()];
                case 2:
                    submittedLeave = _a.sent();
                    if (onSubmit) {
                        onSubmit(submittedLeave);
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Erreur lors de la soumission de la demande:', error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Enregistrer comme brouillon
    var handleSaveDraft = function () { return __awaiter(void 0, void 0, void 0, function () {
        var savedLeave, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, saveLeaveAsDraft()];
                case 1:
                    savedLeave = _a.sent();
                    if (onSaveDraft) {
                        onSaveDraft(savedLeave);
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error('Erreur lors de l\'enregistrement du brouillon:', error_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // Calculer des informations supplémentaires sur la demande
    var getDurationInfo = function () {
        if (!(leave === null || leave === void 0 ? void 0 : leave.startDate) || !(leave === null || leave === void 0 ? void 0 : leave.endDate)) {
            return { totalDays: 0, weekendDays: 0, countedDays: 0 };
        }
        var startDate = new Date(leave.startDate);
        var endDate = new Date(leave.endDate);
        var totalDays = differenceInDays(endDate, startDate) + 1;
        // Calculer le nombre de jours de weekend
        var weekendDays = 0;
        var currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            var dayOfWeek = currentDate.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) { // 0 = dimanche, 6 = samedi
                weekendDays++;
            }
            currentDate = addDays(currentDate, 1);
        }
        var countedDays = leave.countedDays || calculateLeaveDuration();
        return { totalDays: totalDays, weekendDays: weekendDays, countedDays: countedDays };
    };
    // Récupérer les informations sur la durée
    var durationInfo = getDurationInfo();
    return (<div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
                {(leave === null || leave === void 0 ? void 0 : leave.id) ? 'Modifier la demande de congé' : 'Nouvelle demande de congé'}
            </h2>

            {/* Afficher les erreurs de formulaire */}
            {formErrors.length > 0 && (<div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
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
                                {formErrors.map(function (error, index) { return (<li key={index}>{error}</li>); })}
                            </ul>
                        </div>
                    </div>
                </div>)}

            {/* Afficher les erreurs d'API */}
            {(leaveError || conflictError) && (<div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                    <p className="text-red-700">
                        {(leaveError === null || leaveError === void 0 ? void 0 : leaveError.message) || (conflictError === null || conflictError === void 0 ? void 0 : conflictError.message)}
                    </p>
                </div>)}

            <form onSubmit={handleSubmit}>
                {/* Type de congé */}
                <div className="mb-4">
                    <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-2">
                        Type de congé *
                    </label>
                    <select id="leaveType" value={(leave === null || leave === void 0 ? void 0 : leave.type) || ''} onChange={handleTypeChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                        <option value="">Sélectionner...</option>
                        {Object.values(LeaveType).map(function (type) { return (<option key={type} value={type}>{getLeaveTypeLabel(type)}</option>); })}
                    </select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                            Date de début *
                        </label>
                        <input type="date" id="startDate" value={(leave === null || leave === void 0 ? void 0 : leave.startDate) ? format(new Date(leave.startDate), 'yyyy-MM-dd') : ''} onChange={function (e) { return handleDateChange('startDate', e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required/>
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                            Date de fin *
                        </label>
                        <input type="date" id="endDate" value={(leave === null || leave === void 0 ? void 0 : leave.endDate) ? format(new Date(leave.endDate), 'yyyy-MM-dd') : ''} onChange={function (e) { return handleDateChange('endDate', e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required/>
                    </div>
                </div>

                {/* Récapitulatif de la durée */}
                {(leave === null || leave === void 0 ? void 0 : leave.startDate) && (leave === null || leave === void 0 ? void 0 : leave.endDate) && (<div className="mb-6 bg-gray-50 p-4 rounded-md">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Récapitulatif</h3>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <div>
                                <p className="text-xs text-gray-500">Jours calendaires</p>
                                <p className="text-lg font-semibold text-gray-900">{durationInfo.totalDays}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Dont weekends/fériés</p>
                                <p className="text-lg font-semibold text-gray-900">{durationInfo.weekendDays}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Jours décomptés</p>
                                <p className="text-lg font-semibold text-blue-600">{durationInfo.countedDays}</p>
                            </div>
                        </div>
                    </div>)}

                {/* Afficher les conflits */}
                {conflicts.length > 0 && (<div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Conflits détectés</h3>
                        <div className="space-y-2">
                            {getBlockingConflicts().map(function (conflict) { return (<div key={conflict.id} className="bg-red-50 border-l-4 border-red-400 p-3 rounded-md">
                                    <p className="text-red-700">
                                        <span className="font-semibold">Conflit bloquant: </span>
                                        {conflict.description}
                                    </p>
                                </div>); })}
                            {getWarningConflicts().map(function (conflict) { return (<div key={conflict.id} className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-md">
                                    <p className="text-yellow-700">
                                        <span className="font-semibold">Avertissement: </span>
                                        {conflict.description}
                                    </p>
                                </div>); })}
                        </div>
                    </div>)}

                {/* Motif */}
                <div className="mb-6">
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                        Motif
                    </label>
                    <textarea id="reason" value={(leave === null || leave === void 0 ? void 0 : leave.reason) || ''} onChange={handleReasonChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                    {onCancel && (<button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Annuler
                        </button>)}
                    <button type="button" onClick={handleSaveDraft} disabled={leaveLoading || conflictLoading} className={"px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ".concat((leaveLoading || conflictLoading) ? 'opacity-70 cursor-not-allowed' : '')}>
                        Enregistrer comme brouillon
                    </button>
                    <button type="submit" disabled={leaveLoading || conflictLoading} className={"px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ".concat((leaveLoading || conflictLoading) ? 'opacity-70 cursor-not-allowed' : '')}>
                        {showConflictWarning && getWarningConflicts().length > 0
            ? 'Confirmer malgré les avertissements'
            : 'Soumettre la demande'}
                    </button>
                </div>
            </form>
        </div>);
};
