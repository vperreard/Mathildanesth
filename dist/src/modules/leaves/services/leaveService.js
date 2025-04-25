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
import { LeaveType, LeaveStatus } from '../types/leave';
import { calculateLeaveCountedDays } from './leaveCalculator';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
/**
 * Récupérer les demandes de congés avec filtres
 */
export var fetchLeaves = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (filters) {
        var url_1, response, error_1;
        if (filters === void 0) { filters = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    url_1 = new URL('/api/leaves', window.location.origin);
                    // Ajouter les filtres à l'URL
                    Object.entries(filters).forEach(function (_a) {
                        var key = _a[0], value = _a[1];
                        if (value !== undefined) {
                            if (Array.isArray(value)) {
                                value.forEach(function (v) {
                                    if (v instanceof Date) {
                                        url_1.searchParams.append(key, v.toISOString());
                                    }
                                    else {
                                        url_1.searchParams.append(key, v);
                                    }
                                });
                            }
                            else if (value instanceof Date) {
                                url_1.searchParams.append(key, value.toISOString());
                            }
                            else {
                                url_1.searchParams.append(key, value);
                            }
                        }
                    });
                    return [4 /*yield*/, fetch(url_1.toString())];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Erreur lors de la r\u00E9cup\u00E9ration des cong\u00E9s: ".concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    error_1 = _a.sent();
                    console.error('Erreur dans fetchLeaves:', error_1);
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
};
/**
 * Récupérer une demande de congés par son ID
 */
export var fetchLeaveById = function (leaveId) { return __awaiter(void 0, void 0, void 0, function () {
    var response, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, fetch("/api/leaves/".concat(leaveId))];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    throw new Error("Erreur lors de la r\u00E9cup\u00E9ration du cong\u00E9: ".concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2: return [2 /*return*/, _a.sent()];
            case 3:
                error_2 = _a.sent();
                console.error("Erreur dans fetchLeaveById pour l'ID ".concat(leaveId, ":"), error_2);
                throw error_2;
            case 4: return [2 /*return*/];
        }
    });
}); };
/**
 * Récupérer le solde de congés d'un utilisateur
 */
export var fetchLeaveBalance = function (userId) { return __awaiter(void 0, void 0, void 0, function () {
    var response, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, fetch("/api/leaves/balance?userId=".concat(userId))];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    throw new Error("Erreur lors de la r\u00E9cup\u00E9ration du solde de cong\u00E9s: ".concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2: return [2 /*return*/, _a.sent()];
            case 3:
                error_3 = _a.sent();
                console.error("Erreur dans fetchLeaveBalance pour l'utilisateur ".concat(userId, ":"), error_3);
                throw error_3;
            case 4: return [2 /*return*/];
        }
    });
}); };
/**
 * Créer ou mettre à jour une demande de congés
 */
export var saveLeave = function (leave) { return __awaiter(void 0, void 0, void 0, function () {
    var method, url, response, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                method = leave.id ? 'PUT' : 'POST';
                url = leave.id ? "/api/leaves/".concat(leave.id) : '/api/leaves';
                return [4 /*yield*/, fetch(url, {
                        method: method,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(leave),
                    })];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    throw new Error("Erreur lors de l'enregistrement du cong\u00E9: ".concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2: return [2 /*return*/, _a.sent()];
            case 3:
                error_4 = _a.sent();
                console.error('Erreur dans saveLeave:', error_4);
                throw error_4;
            case 4: return [2 /*return*/];
        }
    });
}); };
/**
 * Soumettre une demande de congés pour approbation
 */
export var submitLeaveRequest = function (leave) { return __awaiter(void 0, void 0, void 0, function () {
    var leaveToSubmit, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                leaveToSubmit = __assign(__assign({}, leave), { status: LeaveStatus.PENDING, requestDate: new Date() });
                return [4 /*yield*/, saveLeave(leaveToSubmit)];
            case 1: 
            // Enregistrer la demande
            return [2 /*return*/, _a.sent()];
            case 2:
                error_5 = _a.sent();
                console.error('Erreur dans submitLeaveRequest:', error_5);
                throw error_5;
            case 3: return [2 /*return*/];
        }
    });
}); };
/**
 * Approuver une demande de congés
 */
export var approveLeave = function (leaveId, comment) { return __awaiter(void 0, void 0, void 0, function () {
    var response, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, fetch("/api/leaves/".concat(leaveId, "/approve"), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ comment: comment }),
                    })];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    throw new Error("Erreur lors de l'approbation du cong\u00E9: ".concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2: return [2 /*return*/, _a.sent()];
            case 3:
                error_6 = _a.sent();
                console.error("Erreur dans approveLeave pour l'ID ".concat(leaveId, ":"), error_6);
                throw error_6;
            case 4: return [2 /*return*/];
        }
    });
}); };
/**
 * Rejeter une demande de congés
 */
export var rejectLeave = function (leaveId, comment) { return __awaiter(void 0, void 0, void 0, function () {
    var response, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, fetch("/api/leaves/".concat(leaveId, "/reject"), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ comment: comment }),
                    })];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    throw new Error("Erreur lors du rejet du cong\u00E9: ".concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2: return [2 /*return*/, _a.sent()];
            case 3:
                error_7 = _a.sent();
                console.error("Erreur dans rejectLeave pour l'ID ".concat(leaveId, ":"), error_7);
                throw error_7;
            case 4: return [2 /*return*/];
        }
    });
}); };
/**
 * Annuler une demande de congés
 */
export var cancelLeave = function (leaveId, comment) { return __awaiter(void 0, void 0, void 0, function () {
    var response, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, fetch("/api/leaves/".concat(leaveId, "/cancel"), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ comment: comment }),
                    })];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    throw new Error("Erreur lors de l'annulation du cong\u00E9: ".concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2: return [2 /*return*/, _a.sent()];
            case 3:
                error_8 = _a.sent();
                console.error("Erreur dans cancelLeave pour l'ID ".concat(leaveId, ":"), error_8);
                throw error_8;
            case 4: return [2 /*return*/];
        }
    });
}); };
/**
 * Vérifier les conflits pour une demande de congés
 */
export var checkLeaveConflicts = function (startDate, endDate, userId, leaveId) { return __awaiter(void 0, void 0, void 0, function () {
    var params, response, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                params = new URLSearchParams({
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    userId: userId
                });
                if (leaveId) {
                    params.append('leaveId', leaveId);
                }
                return [4 /*yield*/, fetch("/api/leaves/check-conflicts?".concat(params.toString()))];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    throw new Error("Erreur lors de la v\u00E9rification des conflits: ".concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2: return [2 /*return*/, _a.sent()];
            case 3:
                error_9 = _a.sent();
                console.error('Erreur dans checkLeaveConflicts:', error_9);
                throw error_9;
            case 4: return [2 /*return*/];
        }
    });
}); };
/**
 * Vérifier si l'utilisateur a suffisamment de jours de congés disponibles
 */
export var checkLeaveAllowance = function (userId, leaveType, countedDays) { return __awaiter(void 0, void 0, void 0, function () {
    var response, error_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, fetch('/api/leaves/check-allowance', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            userId: userId,
                            leaveType: leaveType,
                            countedDays: countedDays
                        }),
                    })];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    throw new Error("Erreur lors de la v\u00E9rification des droits \u00E0 cong\u00E9s: ".concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2: return [2 /*return*/, _a.sent()];
            case 3:
                error_10 = _a.sent();
                console.error('Erreur dans checkLeaveAllowance:', error_10);
                throw error_10;
            case 4: return [2 /*return*/];
        }
    });
}); };
/**
 * Calculer le nombre de jours décomptés pour une demande de congés
 */
export var calculateLeaveDays = function (startDate, endDate, schedule) {
    var calculationDetails = calculateLeaveCountedDays(startDate, endDate, schedule);
    var countedDays = 0;
    // Additionner les jours décomptés de chaque semaine
    calculationDetails.weeklyBreakdown.forEach(function (week) {
        countedDays += week.countedDays;
    });
    return countedDays;
};
/**
 * Formatter une période de congés pour l'affichage
 */
export var formatLeavePeriod = function (startDate, endDate) {
    var start = format(new Date(startDate), 'dd MMMM yyyy', { locale: fr });
    var end = format(new Date(endDate), 'dd MMMM yyyy', { locale: fr });
    if (start === end) {
        return start;
    }
    return "Du ".concat(start, " au ").concat(end);
};
/**
 * Obtenir le libellé d'un type de congé
 */
export var getLeaveTypeLabel = function (type) {
    switch (type) {
        case LeaveType.ANNUAL:
            return 'Congé annuel';
        case LeaveType.RECOVERY:
            return 'Récupération (IADE)';
        case LeaveType.TRAINING:
            return 'Formation';
        case LeaveType.SICK:
            return 'Maladie';
        case LeaveType.MATERNITY:
            return 'Maternité';
        case LeaveType.SPECIAL:
            return 'Congé spécial';
        case LeaveType.UNPAID:
            return 'Sans solde';
        case LeaveType.OTHER:
            return 'Autre';
        default:
            var exhaustiveCheck = type;
            console.warn("Libell\u00E9 manquant pour le type de cong\u00E9: ".concat(exhaustiveCheck));
            return 'Inconnu';
    }
};
/**
 * Obtenir le libellé d'un statut de congé
 */
export var getLeaveStatusLabel = function (status) {
    switch (status) {
        case LeaveStatus.DRAFT:
            return 'Brouillon';
        case LeaveStatus.PENDING:
            return 'En attente';
        case LeaveStatus.APPROVED:
            return 'Approuvé';
        case LeaveStatus.REJECTED:
            return 'Refusé';
        case LeaveStatus.CANCELLED:
            return 'Annulé';
        default:
            return 'Inconnu';
    }
};
