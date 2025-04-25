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
import { useState, useEffect, useCallback } from 'react';
import { fetchUserWorkSchedules, saveWorkSchedule, deleteWorkSchedule, calculateWeeklyWorkingDays, isWorkingDay } from '../services/workScheduleService';
export var useWorkSchedule = function (_a) {
    var _b = _a === void 0 ? {} : _a, userId = _b.userId, initialSchedule = _b.initialSchedule;
    // État pour stocker tous les plannings de l'utilisateur
    var _c = useState([]), schedules = _c[0], setSchedules = _c[1];
    // État pour le planning en cours d'édition
    var _d = useState(initialSchedule || null), currentSchedule = _d[0], setCurrentSchedule = _d[1];
    // États de chargement et d'erreur
    var _e = useState(false), loading = _e[0], setLoading = _e[1];
    var _f = useState(null), error = _f[0], setError = _f[1];
    // Charger les plannings de l'utilisateur
    var loadSchedules = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var data, activeSchedule, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!userId)
                        return [2 /*return*/];
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, fetchUserWorkSchedules(userId)];
                case 2:
                    data = _a.sent();
                    setSchedules(data);
                    // Si aucun planning en cours d'édition et des plannings existent, 
                    // définir le planning actif comme courant
                    if (!currentSchedule && data.length > 0) {
                        activeSchedule = data.find(function (s) { return s.isActive; });
                        if (activeSchedule) {
                            setCurrentSchedule(activeSchedule);
                        }
                    }
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    setError(err_1 instanceof Error ? err_1 : new Error('Erreur inconnue'));
                    console.error('Erreur dans useWorkSchedule:', err_1);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [userId, currentSchedule]);
    // Charger les plannings au montage du composant si un userId est fourni
    useEffect(function () {
        if (userId) {
            loadSchedules();
        }
    }, [userId, loadSchedules]);
    // Mettre à jour un champ spécifique du planning courant
    var updateScheduleField = useCallback(function (field, value) {
        setCurrentSchedule(function (prev) {
            var _a;
            if (!prev)
                return prev;
            return __assign(__assign({}, prev), (_a = {}, _a[field] = value, _a));
        });
    }, []);
    // Enregistrer le planning courant
    var saveSchedule = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var savedSchedule_1, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!currentSchedule) {
                        throw new Error('Aucun planning à enregistrer');
                    }
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, saveWorkSchedule(currentSchedule)];
                case 2:
                    savedSchedule_1 = _a.sent();
                    // Mettre à jour la liste des plannings
                    setSchedules(function (prev) {
                        var existingIndex = prev.findIndex(function (s) { return s.id === savedSchedule_1.id; });
                        if (existingIndex >= 0) {
                            return __spreadArray(__spreadArray(__spreadArray([], prev.slice(0, existingIndex), true), [
                                savedSchedule_1
                            ], false), prev.slice(existingIndex + 1), true);
                        }
                        else {
                            return __spreadArray(__spreadArray([], prev, true), [savedSchedule_1], false);
                        }
                    });
                    // Mettre à jour le planning courant
                    setCurrentSchedule(savedSchedule_1);
                    return [2 /*return*/, savedSchedule_1];
                case 3:
                    err_2 = _a.sent();
                    setError(err_2 instanceof Error ? err_2 : new Error('Erreur lors de l\'enregistrement'));
                    console.error('Erreur dans saveSchedule:', err_2);
                    throw err_2;
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [currentSchedule]);
    // Supprimer un planning
    var removeSchedule = useCallback(function (scheduleId) { return __awaiter(void 0, void 0, void 0, function () {
        var err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, deleteWorkSchedule(scheduleId)];
                case 2:
                    _a.sent();
                    // Mettre à jour la liste des plannings
                    setSchedules(function (prev) { return prev.filter(function (s) { return s.id !== scheduleId; }); });
                    // Si le planning supprimé était le planning courant, réinitialiser
                    if (currentSchedule && currentSchedule.id === scheduleId) {
                        setCurrentSchedule(null);
                    }
                    return [3 /*break*/, 5];
                case 3:
                    err_3 = _a.sent();
                    setError(err_3 instanceof Error ? err_3 : new Error('Erreur lors de la suppression'));
                    console.error('Erreur dans removeSchedule:', err_3);
                    throw err_3;
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [currentSchedule]);
    // Vérifier si l'utilisateur travaille à une date donnée
    var isUserWorkingOnDate = useCallback(function (date) {
        // Trouver le planning actif à cette date
        var activeSchedule = schedules.find(function (schedule) {
            return schedule.isActive &&
                date >= schedule.validFrom &&
                (!schedule.validTo || date <= schedule.validTo);
        });
        if (!activeSchedule)
            return false;
        return isWorkingDay(activeSchedule, date);
    }, [schedules]);
    // Obtenir le nombre de jours travaillés par semaine
    var getWeeklyWorkingDays = useCallback(function () {
        if (!currentSchedule)
            return null;
        // Si le currentSchedule ne contient pas tous les champs nécessaires
        if (!('frequency' in currentSchedule))
            return null;
        return calculateWeeklyWorkingDays(currentSchedule);
    }, [currentSchedule]);
    return {
        schedules: schedules,
        currentSchedule: currentSchedule,
        loading: loading,
        error: error,
        setCurrentSchedule: setCurrentSchedule,
        updateScheduleField: updateScheduleField,
        saveSchedule: saveSchedule,
        removeSchedule: removeSchedule,
        isUserWorkingOnDate: isUserWorkingOnDate,
        getWeeklyWorkingDays: getWeeklyWorkingDays,
        refreshSchedules: loadSchedules
    };
};
