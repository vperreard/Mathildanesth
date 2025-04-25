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
import { RuleType, RulePriority } from '../types/rule';
import { fetchRules, fetchRuleById, saveRule as apiSaveRule, deleteRule as apiDeleteRule, toggleRuleStatus, checkRuleConflicts as apiCheckRuleConflicts } from '../services/ruleService';
export var useRule = function (_a) {
    var _b = _a === void 0 ? {} : _a, initialRule = _b.initialRule, _c = _b.autoFetch, autoFetch = _c === void 0 ? true : _c;
    // État pour la règle en cours d'édition
    var _d = useState(initialRule || null), rule = _d[0], setRule = _d[1];
    // État pour la liste des règles
    var _e = useState([]), rules = _e[0], setRules = _e[1];
    // États pour le chargement et les erreurs
    var _f = useState(false), loading = _f[0], setLoading = _f[1];
    var _g = useState(null), error = _g[0], setError = _g[1];
    // État pour les conflits détectés
    var _h = useState(null), conflicts = _h[0], setConflicts = _h[1];
    // Charger toutes les règles avec des filtres optionnels
    var loadRules = useCallback(function (filters) { return __awaiter(void 0, void 0, void 0, function () {
        var fetchedRules, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, fetchRules(filters)];
                case 2:
                    fetchedRules = _a.sent();
                    setRules(fetchedRules);
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    setError(err_1 instanceof Error ? err_1 : new Error('Erreur inconnue lors du chargement des règles'));
                    console.error('Erreur dans loadRules:', err_1);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    // Charger les détails d'une règle par son ID
    var fetchRuleDetails = useCallback(function (ruleId) { return __awaiter(void 0, void 0, void 0, function () {
        var fetchedRule, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, fetchRuleById(ruleId)];
                case 2:
                    fetchedRule = _a.sent();
                    setRule(fetchedRule);
                    return [3 /*break*/, 5];
                case 3:
                    err_2 = _a.sent();
                    setError(err_2 instanceof Error ? err_2 : new Error("Erreur inconnue lors du chargement de la r\u00E8gle ".concat(ruleId)));
                    console.error("Erreur dans fetchRuleDetails pour l'ID ".concat(ruleId, ":"), err_2);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    // Mettre à jour un champ spécifique de la règle en cours d'édition
    var updateRuleField = useCallback(function (field, value) {
        setRule(function (prev) {
            var _a;
            if (!prev)
                return prev;
            return __assign(__assign({}, prev), (_a = {}, _a[field] = value, _a));
        });
    }, []);
    // Créer une nouvelle règle d'un type spécifique
    var createNewRule = useCallback(function (type) {
        // Créer une règle avec des valeurs par défaut selon le type
        var newRule = {
            name: '',
            description: '',
            type: type,
            priority: RulePriority.MEDIUM,
            isActive: false,
            validFrom: new Date(),
            createdBy: '', // À remplacer par l'ID de l'utilisateur connecté
        };
        // Ajouter la configuration spécifique au type
        switch (type) {
            case RuleType.DUTY:
                newRule.dutyConfig = {
                    minPersonnel: 1,
                    maxConsecutiveDays: 2,
                    minRestPeriodAfterDuty: 24,
                    dutyPeriods: []
                };
                break;
            case RuleType.CONSULTATION:
                newRule.consultationConfig = {
                    locations: [],
                    specialties: [],
                    durationMinutes: 30,
                    maxPatientsPerDay: 20,
                    availablePeriods: []
                };
                break;
            case RuleType.PLANNING:
                newRule.planningConfig = {
                    planningCycle: 'WEEKLY',
                    advanceNoticeDays: 14,
                    freezePeriodDays: 7,
                    minPersonnelPerShift: 2,
                    personnelDistributionRules: [],
                    autoRebalance: false
                };
                break;
            case RuleType.SUPERVISION:
                newRule.supervisionConfig = {
                    supervisorRoles: [],
                    superviseeRoles: [],
                    maxSuperviseesPerSupervisor: 3,
                    minExperienceYearsToSupervise: 5
                };
                break;
            case RuleType.LOCATION:
                newRule.locationConfig = {
                    location: {
                        id: '',
                        name: '',
                        type: 'OPERATING_ROOM',
                        capacity: 1
                    },
                    constraints: {
                        minStaffing: {
                            doctors: 1,
                            nurses: 1
                        },
                        operatingHours: []
                    }
                };
                break;
        }
        setRule(newRule);
    }, []);
    // Enregistrer la règle en cours d'édition
    var saveCurrentRule = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var savedRule_1, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!rule) {
                        throw new Error('Aucune règle à enregistrer');
                    }
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, apiSaveRule(rule)];
                case 2:
                    savedRule_1 = _a.sent();
                    // Mettre à jour la liste des règles
                    setRules(function (prev) {
                        var existingIndex = prev.findIndex(function (r) { return r.id === savedRule_1.id; });
                        if (existingIndex >= 0) {
                            return __spreadArray(__spreadArray(__spreadArray([], prev.slice(0, existingIndex), true), [
                                savedRule_1
                            ], false), prev.slice(existingIndex + 1), true);
                        }
                        else {
                            return __spreadArray(__spreadArray([], prev, true), [savedRule_1], false);
                        }
                    });
                    // Mettre à jour la règle en cours d'édition
                    setRule(savedRule_1);
                    return [2 /*return*/, savedRule_1];
                case 3:
                    err_3 = _a.sent();
                    setError(err_3 instanceof Error ? err_3 : new Error('Erreur lors de l\'enregistrement de la règle'));
                    console.error('Erreur dans saveCurrentRule:', err_3);
                    throw err_3;
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [rule]);
    // Supprimer une règle
    var removeRule = useCallback(function (ruleId) { return __awaiter(void 0, void 0, void 0, function () {
        var err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, apiDeleteRule(ruleId)];
                case 2:
                    _a.sent();
                    // Mettre à jour la liste des règles
                    setRules(function (prev) { return prev.filter(function (r) { return r.id !== ruleId; }); });
                    // Si la règle supprimée est la règle en cours d'édition, la réinitialiser
                    if (rule && rule.id === ruleId) {
                        setRule(null);
                    }
                    return [3 /*break*/, 5];
                case 3:
                    err_4 = _a.sent();
                    setError(err_4 instanceof Error ? err_4 : new Error("Erreur lors de la suppression de la r\u00E8gle ".concat(ruleId)));
                    console.error("Erreur dans removeRule pour l'ID ".concat(ruleId, ":"), err_4);
                    throw err_4;
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [rule]);
    // Activer/désactiver une règle
    var toggleRuleActiveStatus = useCallback(function (ruleId, isActive) { return __awaiter(void 0, void 0, void 0, function () {
        var updatedRule_1, err_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, toggleRuleStatus(ruleId, isActive)];
                case 2:
                    updatedRule_1 = _a.sent();
                    // Mettre à jour la liste des règles
                    setRules(function (prev) {
                        var existingIndex = prev.findIndex(function (r) { return r.id === updatedRule_1.id; });
                        if (existingIndex >= 0) {
                            return __spreadArray(__spreadArray(__spreadArray([], prev.slice(0, existingIndex), true), [
                                updatedRule_1
                            ], false), prev.slice(existingIndex + 1), true);
                        }
                        return prev;
                    });
                    // Si la règle modifiée est la règle en cours d'édition, la mettre à jour
                    if (rule && rule.id === ruleId) {
                        setRule(updatedRule_1);
                    }
                    return [2 /*return*/, updatedRule_1];
                case 3:
                    err_5 = _a.sent();
                    setError(err_5 instanceof Error ? err_5 : new Error("Erreur lors du changement de statut de la r\u00E8gle ".concat(ruleId)));
                    console.error("Erreur dans toggleRuleActiveStatus pour l'ID ".concat(ruleId, ":"), err_5);
                    throw err_5;
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [rule]);
    // Vérifier les conflits pour la règle en cours d'édition
    var checkRuleConflicts = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var conflictResult, err_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!rule) {
                        setConflicts(null);
                        return [2 /*return*/];
                    }
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, apiCheckRuleConflicts(rule)];
                case 2:
                    conflictResult = _a.sent();
                    setConflicts(conflictResult);
                    return [3 /*break*/, 5];
                case 3:
                    err_6 = _a.sent();
                    setError(err_6 instanceof Error ? err_6 : new Error('Erreur lors de la vérification des conflits'));
                    console.error('Erreur dans checkRuleConflicts:', err_6);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [rule]);
    // Charger toutes les règles au chargement du composant si autoFetch est true
    useEffect(function () {
        if (autoFetch) {
            loadRules();
        }
    }, [autoFetch, loadRules]);
    return {
        rule: rule,
        rules: rules,
        loading: loading,
        error: error,
        conflicts: conflicts,
        setRule: setRule,
        updateRuleField: updateRuleField,
        saveRule: saveCurrentRule,
        deleteRule: removeRule,
        toggleStatus: toggleRuleActiveStatus,
        checkConflicts: checkRuleConflicts,
        fetchRules: loadRules,
        fetchRuleDetails: fetchRuleDetails,
        createNewRule: createNewRule
    };
};
