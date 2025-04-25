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
import { RuleType, RulePriority, RuleSeverity, RotationStrategy } from '../types/rule';
/**
 * Service pour la gestion des règles de planning
 */
var RuleService = /** @class */ (function () {
    function RuleService() {
        this.API_BASE_URL = '/api/rules';
    }
    /**
     * Récupère toutes les règles avec filtres optionnels
     */
    RuleService.prototype.getAllRules = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var url_1, response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        url_1 = new URL(this.API_BASE_URL, window.location.origin);
                        // Ajouter les filtres à l'URL
                        if (filters) {
                            Object.entries(filters).forEach(function (_a) {
                                var key = _a[0], value = _a[1];
                                if (value !== undefined) {
                                    if (Array.isArray(value)) {
                                        value.forEach(function (v) { return url_1.searchParams.append(key, String(v)); });
                                    }
                                    else {
                                        url_1.searchParams.append(key, String(value));
                                    }
                                }
                            });
                        }
                        return [4 /*yield*/, fetch(url_1.toString())];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Erreur lors de la r\u00E9cup\u00E9ration des r\u00E8gles: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Erreur dans getAllRules:', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Récupère les règles par type
     */
    RuleService.prototype.getRulesByType = function (type) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getAllRules({ type: type })];
            });
        });
    };
    /**
     * Récupère une règle par son ID
     */
    RuleService.prototype.getRuleById = function (ruleId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(this.API_BASE_URL, "/").concat(ruleId))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Erreur lors de la r\u00E9cup\u00E9ration de la r\u00E8gle: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_2 = _a.sent();
                        console.error("Erreur dans getRuleById pour l'ID ".concat(ruleId, ":"), error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Crée une nouvelle règle
     */
    RuleService.prototype.createRule = function (rule) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch(this.API_BASE_URL, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(rule),
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Erreur lors de la cr\u00E9ation de la r\u00E8gle: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_3 = _a.sent();
                        console.error('Erreur dans createRule:', error_3);
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Met à jour une règle existante
     */
    RuleService.prototype.updateRule = function (ruleId, rule) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(this.API_BASE_URL, "/").concat(ruleId), {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(rule),
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Erreur lors de la mise \u00E0 jour de la r\u00E8gle: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_4 = _a.sent();
                        console.error("Erreur dans updateRule pour l'ID ".concat(ruleId, ":"), error_4);
                        throw error_4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Active ou désactive une règle
     */
    RuleService.prototype.toggleRuleStatus = function (ruleId, isActive) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(this.API_BASE_URL, "/").concat(ruleId, "/toggle-status"), {
                                method: 'PATCH',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ isActive: isActive }),
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Erreur lors du changement de statut de la r\u00E8gle: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_5 = _a.sent();
                        console.error("Erreur dans toggleRuleStatus pour l'ID ".concat(ruleId, ":"), error_5);
                        throw error_5;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Supprime une règle
     */
    RuleService.prototype.deleteRule = function (ruleId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fetch("".concat(this.API_BASE_URL, "/").concat(ruleId), {
                                method: 'DELETE',
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Erreur lors de la suppression de la r\u00E8gle: ".concat(response.statusText));
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _a.sent();
                        console.error("Erreur dans deleteRule pour l'ID ".concat(ruleId, ":"), error_6);
                        throw error_6;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Valide un ensemble de règles pour détecter des conflits potentiels
     */
    RuleService.prototype.validateRules = function (rules) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(this.API_BASE_URL, "/validate"), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(rules),
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Erreur lors de la validation des r\u00E8gles: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_7 = _a.sent();
                        console.error('Erreur dans validateRules:', error_7);
                        throw error_7;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Récupère tous les conflits de règles
     */
    RuleService.prototype.getAllConflicts = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(this.API_BASE_URL, "/conflicts"))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Erreur lors de la r\u00E9cup\u00E9ration des conflits: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_8 = _a.sent();
                        console.error('Erreur dans getAllConflicts:', error_8);
                        throw error_8;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Résout un conflit de règles
     */
    RuleService.prototype.resolveConflict = function (conflictId, resolution) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fetch("".concat(this.API_BASE_URL, "/conflicts/").concat(conflictId, "/resolve"), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(resolution),
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Erreur lors de la r\u00E9solution du conflit: ".concat(response.statusText));
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_9 = _a.sent();
                        console.error("Erreur dans resolveConflict pour l'ID ".concat(conflictId, ":"), error_9);
                        throw error_9;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Crée une nouvelle règle de congé
     */
    RuleService.prototype.createLeaveRule = function (rule) {
        return __awaiter(this, void 0, void 0, function () {
            var fullRule;
            return __generator(this, function (_a) {
                fullRule = __assign(__assign({}, rule), { type: RuleType.LEAVE, validFrom: rule.validFrom || new Date(), validTo: rule.validTo || null });
                return [2 /*return*/, this.createRule(fullRule)];
            });
        });
    };
    /**
     * Crée une nouvelle règle de garde
     */
    RuleService.prototype.createDutyRule = function (rule) {
        return __awaiter(this, void 0, void 0, function () {
            var fullRule;
            return __generator(this, function (_a) {
                fullRule = __assign(__assign({}, rule), { type: RuleType.DUTY, validFrom: rule.validFrom || new Date(), validTo: rule.validTo || null });
                return [2 /*return*/, this.createRule(fullRule)];
            });
        });
    };
    /**
     * Crée une nouvelle règle de supervision
     */
    RuleService.prototype.createSupervisionRule = function (rule) {
        return __awaiter(this, void 0, void 0, function () {
            var fullRule;
            return __generator(this, function (_a) {
                fullRule = __assign(__assign({}, rule), { type: RuleType.SUPERVISION, validFrom: rule.validFrom || new Date(), validTo: rule.validTo || null });
                return [2 /*return*/, this.createRule(fullRule)];
            });
        });
    };
    /**
     * Crée une nouvelle règle d'assignation
     */
    RuleService.prototype.createAssignmentRule = function (rule) {
        return __awaiter(this, void 0, void 0, function () {
            var fullRule;
            return __generator(this, function (_a) {
                fullRule = __assign(__assign({}, rule), { type: RuleType.ASSIGNMENT, validFrom: rule.validFrom || new Date(), validTo: rule.validTo || null });
                return [2 /*return*/, this.createRule(fullRule)];
            });
        });
    };
    /**
     * Crée une nouvelle règle d'astreinte
     */
    RuleService.prototype.createOnCallRule = function (rule) {
        return __awaiter(this, void 0, void 0, function () {
            var fullRule;
            return __generator(this, function (_a) {
                fullRule = __assign(__assign({}, rule), { type: RuleType.ON_CALL, validFrom: rule.validFrom || new Date(), validTo: rule.validTo || null });
                return [2 /*return*/, this.createRule(fullRule)];
            });
        });
    };
    /**
     * Obtient le libellé d'un type de règle
     */
    RuleService.prototype.getRuleTypeLabel = function (type) {
        switch (type) {
            case RuleType.LEAVE:
                return 'Règle de congé';
            case RuleType.DUTY:
                return 'Règle de garde';
            case RuleType.SUPERVISION:
                return 'Règle de supervision';
            case RuleType.ASSIGNMENT:
                return 'Règle d\'assignation';
            case RuleType.ON_CALL:
                return 'Règle d\'astreinte';
            default:
                return 'Type inconnu';
        }
    };
    /**
     * Obtient le libellé de sévérité
     */
    RuleService.prototype.getRuleSeverityLabel = function (severity) {
        switch (severity) {
            case RuleSeverity.LOW:
                return 'Faible';
            case RuleSeverity.MEDIUM:
                return 'Moyenne';
            case RuleSeverity.HIGH:
                return 'Élevée';
            default:
                return 'Inconnue';
        }
    };
    /**
     * Obtient la couleur CSS associée à une sévérité
     */
    RuleService.prototype.getRuleSeverityColor = function (severity) {
        switch (severity) {
            case RuleSeverity.LOW:
                return 'bg-blue-100 text-blue-800';
            case RuleSeverity.MEDIUM:
                return 'bg-yellow-100 text-yellow-800';
            case RuleSeverity.HIGH:
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    /**
     * Obtient le libellé d'une priorité
     */
    RuleService.prototype.getRulePriorityLabel = function (priority) {
        switch (priority) {
            case RulePriority.LOW:
                return 'Basse';
            case RulePriority.MEDIUM:
                return 'Moyenne';
            case RulePriority.HIGH:
                return 'Haute';
            case RulePriority.CRITICAL:
                return 'Critique';
            default:
                return 'Inconnue';
        }
    };
    /**
     * Obtient la couleur CSS associée à une priorité
     */
    RuleService.prototype.getRulePriorityColor = function (priority) {
        switch (priority) {
            case RulePriority.LOW:
                return 'bg-blue-100 text-blue-800';
            case RulePriority.MEDIUM:
                return 'bg-yellow-100 text-yellow-800';
            case RulePriority.HIGH:
                return 'bg-orange-100 text-orange-800';
            case RulePriority.CRITICAL:
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    /**
     * Obtient le libellé d'une stratégie de rotation
     */
    RuleService.prototype.getRotationStrategyLabel = function (strategy) {
        switch (strategy) {
            case RotationStrategy.ROUND_ROBIN:
                return 'Tour de rôle';
            case RotationStrategy.LEAST_RECENTLY_ASSIGNED:
                return 'Moins récemment assigné';
            case RotationStrategy.BALANCED_LOAD:
                return 'Charge équilibrée';
            default:
                return 'Inconnue';
        }
    };
    return RuleService;
}());
export { RuleService };
// Exporter une instance par défaut pour faciliter l'utilisation
export var ruleService = new RuleService();
