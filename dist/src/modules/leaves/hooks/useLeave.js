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
import { LeaveStatus } from '../types/leave';
import { fetchLeaves, fetchLeaveById, saveLeave, submitLeaveRequest, approveLeave, rejectLeave, cancelLeave, checkLeaveConflicts, checkLeaveAllowance, calculateLeaveDays } from '../services/leaveService';
export var useLeave = function (_a) {
    var _b = _a === void 0 ? {} : _a, userId = _b.userId, initialLeave = _b.initialLeave, userSchedule = _b.userSchedule;
    // État pour le congé en cours d'édition
    var _c = useState(initialLeave || null), leave = _c[0], setLeave = _c[1];
    // État pour la liste des congés
    var _d = useState([]), leaves = _d[0], setLeaves = _d[1];
    // États de chargement et d'erreur
    var _e = useState(false), loading = _e[0], setLoading = _e[1];
    var _f = useState(null), error = _f[0], setError = _f[1];
    // État pour les résultats de vérification
    var _g = useState(null), conflictCheckResult = _g[0], setConflictCheckResult = _g[1];
    var _h = useState(null), allowanceCheckResult = _h[0], setAllowanceCheckResult = _h[1];
    // Mettre à jour un champ du congé
    var updateLeaveField = useCallback(function (field, value) {
        setLeave(function (prev) {
            var _a, _b;
            if (!prev)
                return prev;
            // Si on modifie les dates de début ou de fin, recalculer le nombre de jours
            if ((field === 'startDate' || field === 'endDate') && userSchedule && prev.startDate && prev.endDate) {
                var startDate = field === 'startDate' ? new Date(value) : new Date(prev.startDate);
                var endDate = field === 'endDate' ? new Date(value) : new Date(prev.endDate);
                // Vérifier que les dates sont valides et dans le bon ordre
                if (startDate <= endDate) {
                    var countedDays = calculateLeaveDays(startDate, endDate, userSchedule);
                    return __assign(__assign({}, prev), (_a = {}, _a[field] = value, _a.countedDays = countedDays, _a));
                }
            }
            return __assign(__assign({}, prev), (_b = {}, _b[field] = value, _b));
        });
    }, [userSchedule]);
    // Calculer la durée du congé en jours décomptés
    var calculateLeaveDuration = useCallback(function () {
        if (!(leave === null || leave === void 0 ? void 0 : leave.startDate) || !(leave === null || leave === void 0 ? void 0 : leave.endDate) || !userSchedule) {
            return 0;
        }
        var startDate = new Date(leave.startDate);
        var endDate = new Date(leave.endDate);
        return calculateLeaveDays(startDate, endDate, userSchedule);
    }, [leave === null || leave === void 0 ? void 0 : leave.startDate, leave === null || leave === void 0 ? void 0 : leave.endDate, userSchedule]);
    // Vérifier les conflits
    var checkConflicts = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var startDate, endDate, result, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(leave === null || leave === void 0 ? void 0 : leave.startDate) || !(leave === null || leave === void 0 ? void 0 : leave.endDate) || !userId) {
                        throw new Error('Informations manquantes pour vérifier les conflits');
                    }
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    startDate = new Date(leave.startDate);
                    endDate = new Date(leave.endDate);
                    return [4 /*yield*/, checkLeaveConflicts(startDate, endDate, userId, leave.id)];
                case 2:
                    result = _a.sent();
                    setConflictCheckResult(result);
                    return [2 /*return*/, result];
                case 3:
                    err_1 = _a.sent();
                    setError(err_1 instanceof Error ? err_1 : new Error('Erreur lors de la vérification des conflits'));
                    console.error('Erreur dans checkConflicts:', err_1);
                    throw err_1;
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [leave === null || leave === void 0 ? void 0 : leave.startDate, leave === null || leave === void 0 ? void 0 : leave.endDate, leave === null || leave === void 0 ? void 0 : leave.id, userId]);
    // Vérifier les droits à congés
    var checkAllowance = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(leave === null || leave === void 0 ? void 0 : leave.type) || !userId || leave.countedDays === undefined) {
                        throw new Error('Informations manquantes pour vérifier les droits à congés');
                    }
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, checkLeaveAllowance(userId, leave.type, leave.countedDays)];
                case 2:
                    result = _a.sent();
                    setAllowanceCheckResult(result);
                    return [2 /*return*/, result];
                case 3:
                    err_2 = _a.sent();
                    setError(err_2 instanceof Error ? err_2 : new Error('Erreur lors de la vérification des droits à congés'));
                    console.error('Erreur dans checkAllowance:', err_2);
                    throw err_2;
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [leave === null || leave === void 0 ? void 0 : leave.type, leave === null || leave === void 0 ? void 0 : leave.countedDays, userId]);
    // Enregistrer le congé comme brouillon
    var saveLeaveAsDraft = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var leaveToSave, savedLeave, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!leave) {
                        throw new Error('Aucun congé à enregistrer');
                    }
                    if (!userId && !leave.userId) {
                        throw new Error('ID utilisateur manquant');
                    }
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    leaveToSave = __assign(__assign({}, leave), { userId: leave.userId || userId, status: LeaveStatus.DRAFT, createdAt: leave.createdAt || new Date(), updatedAt: new Date() });
                    return [4 /*yield*/, saveLeave(leaveToSave)];
                case 2:
                    savedLeave = _a.sent();
                    // Mettre à jour l'état
                    setLeave(savedLeave);
                    return [2 /*return*/, savedLeave];
                case 3:
                    err_3 = _a.sent();
                    setError(err_3 instanceof Error ? err_3 : new Error('Erreur lors de l\'enregistrement'));
                    console.error('Erreur dans saveLeaveAsDraft:', err_3);
                    throw err_3;
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [leave, userId]);
    // Soumettre le congé pour approbation
    var submitLeave = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var leaveToSubmit, submittedLeave, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!leave) {
                        throw new Error('Aucun congé à soumettre');
                    }
                    if (!userId && !leave.userId) {
                        throw new Error('ID utilisateur manquant');
                    }
                    // Vérifier que les informations nécessaires sont présentes
                    if (!leave.startDate || !leave.endDate || !leave.type) {
                        throw new Error('Informations manquantes (dates ou type de congé)');
                    }
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    leaveToSubmit = __assign(__assign({}, leave), { userId: leave.userId || userId, status: LeaveStatus.PENDING, requestDate: new Date(), createdAt: leave.createdAt || new Date(), updatedAt: new Date() });
                    return [4 /*yield*/, submitLeaveRequest(leaveToSubmit)];
                case 2:
                    submittedLeave = _a.sent();
                    // Mettre à jour l'état
                    setLeave(submittedLeave);
                    return [2 /*return*/, submittedLeave];
                case 3:
                    err_4 = _a.sent();
                    setError(err_4 instanceof Error ? err_4 : new Error('Erreur lors de la soumission'));
                    console.error('Erreur dans submitLeave:', err_4);
                    throw err_4;
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [leave, userId]);
    // Approuver une demande de congés
    var approveLeaveRequest = useCallback(function (comment) { return __awaiter(void 0, void 0, void 0, function () {
        var approvedLeave, err_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(leave === null || leave === void 0 ? void 0 : leave.id)) {
                        throw new Error('ID de congé manquant');
                    }
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, approveLeave(leave.id, comment)];
                case 2:
                    approvedLeave = _a.sent();
                    // Mettre à jour l'état
                    setLeave(approvedLeave);
                    return [2 /*return*/, approvedLeave];
                case 3:
                    err_5 = _a.sent();
                    setError(err_5 instanceof Error ? err_5 : new Error('Erreur lors de l\'approbation'));
                    console.error('Erreur dans approveLeaveRequest:', err_5);
                    throw err_5;
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [leave === null || leave === void 0 ? void 0 : leave.id]);
    // Rejeter une demande de congés
    var rejectLeaveRequest = useCallback(function (comment) { return __awaiter(void 0, void 0, void 0, function () {
        var rejectedLeave, err_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(leave === null || leave === void 0 ? void 0 : leave.id)) {
                        throw new Error('ID de congé manquant');
                    }
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, rejectLeave(leave.id, comment)];
                case 2:
                    rejectedLeave = _a.sent();
                    // Mettre à jour l'état
                    setLeave(rejectedLeave);
                    return [2 /*return*/, rejectedLeave];
                case 3:
                    err_6 = _a.sent();
                    setError(err_6 instanceof Error ? err_6 : new Error('Erreur lors du rejet'));
                    console.error('Erreur dans rejectLeaveRequest:', err_6);
                    throw err_6;
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [leave === null || leave === void 0 ? void 0 : leave.id]);
    // Annuler une demande de congés
    var cancelLeaveRequest = useCallback(function (comment) { return __awaiter(void 0, void 0, void 0, function () {
        var cancelledLeave, err_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(leave === null || leave === void 0 ? void 0 : leave.id)) {
                        throw new Error('ID de congé manquant');
                    }
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, cancelLeave(leave.id, comment)];
                case 2:
                    cancelledLeave = _a.sent();
                    // Mettre à jour l'état
                    setLeave(cancelledLeave);
                    return [2 /*return*/, cancelledLeave];
                case 3:
                    err_7 = _a.sent();
                    setError(err_7 instanceof Error ? err_7 : new Error('Erreur lors de l\'annulation'));
                    console.error('Erreur dans cancelLeaveRequest:', err_7);
                    throw err_7;
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [leave === null || leave === void 0 ? void 0 : leave.id]);
    // Récupérer les congés d'un utilisateur
    var fetchUserLeaves = useCallback(function () {
        var args_1 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args_1[_i] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (filters) {
            var fetchedLeaves, err_8;
            if (filters === void 0) { filters = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!userId && !filters.userId && !filters.userIds) {
                            throw new Error('ID utilisateur manquant');
                        }
                        setLoading(true);
                        setError(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        // Si l'utilisateur n'est pas spécifié dans les filtres, l'ajouter
                        if (!filters.userId && !filters.userIds && userId) {
                            filters.userId = userId;
                        }
                        return [4 /*yield*/, fetchLeaves(filters)];
                    case 2:
                        fetchedLeaves = _a.sent();
                        setLeaves(fetchedLeaves);
                        return [3 /*break*/, 5];
                    case 3:
                        err_8 = _a.sent();
                        setError(err_8 instanceof Error ? err_8 : new Error('Erreur lors de la récupération des congés'));
                        console.error('Erreur dans fetchUserLeaves:', err_8);
                        throw err_8;
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }, [userId]);
    // Récupérer les détails d'un congé
    var fetchLeaveDetails = useCallback(function (leaveId) { return __awaiter(void 0, void 0, void 0, function () {
        var fetchedLeave, err_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, fetchLeaveById(leaveId)];
                case 2:
                    fetchedLeave = _a.sent();
                    setLeave(fetchedLeave);
                    return [3 /*break*/, 5];
                case 3:
                    err_9 = _a.sent();
                    setError(err_9 instanceof Error ? err_9 : new Error('Erreur lors de la récupération du congé'));
                    console.error('Erreur dans fetchLeaveDetails:', err_9);
                    throw err_9;
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    // Charger les congés de l'utilisateur au montage
    useEffect(function () {
        if (userId && !initialLeave) {
            fetchUserLeaves();
        }
    }, [userId, fetchUserLeaves, initialLeave]);
    // Calculer le nombre de jours décomptés quand les dates changent
    useEffect(function () {
        if ((leave === null || leave === void 0 ? void 0 : leave.startDate) && (leave === null || leave === void 0 ? void 0 : leave.endDate) && userSchedule) {
            var startDate = new Date(leave.startDate);
            var endDate = new Date(leave.endDate);
            if (startDate <= endDate) {
                var countedDays_1 = calculateLeaveDays(startDate, endDate, userSchedule);
                // Mettre à jour le congé si le nombre de jours a changé
                if (leave.countedDays !== countedDays_1) {
                    setLeave(function (prev) { return prev ? __assign(__assign({}, prev), { countedDays: countedDays_1 }) : null; });
                }
            }
        }
    }, [leave === null || leave === void 0 ? void 0 : leave.startDate, leave === null || leave === void 0 ? void 0 : leave.endDate, userSchedule, calculateLeaveDays]);
    return {
        leave: leave,
        leaves: leaves,
        loading: loading,
        error: error,
        conflictCheckResult: conflictCheckResult,
        allowanceCheckResult: allowanceCheckResult,
        setLeave: setLeave,
        updateLeaveField: updateLeaveField,
        saveLeaveAsDraft: saveLeaveAsDraft,
        submitLeave: submitLeave,
        approveLeaveRequest: approveLeaveRequest,
        rejectLeaveRequest: rejectLeaveRequest,
        cancelLeaveRequest: cancelLeaveRequest,
        calculateLeaveDuration: calculateLeaveDuration,
        checkConflicts: checkConflicts,
        checkAllowance: checkAllowance,
        fetchUserLeaves: fetchUserLeaves,
        fetchLeaveDetails: fetchLeaveDetails
    };
};
