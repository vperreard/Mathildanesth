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
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { RuleSeverity, RuleType } from '../../../../modules/rules/types/rule';
var prisma = new PrismaClient();
/**
 * POST /api/rules/validate
 * Valide un ensemble de règles pour détecter des conflits potentiels
 */
export function POST(request) {
    return __awaiter(this, void 0, void 0, function () {
        var rules, rulesToValidate, existingRules, conflicts, _loop_1, _i, rulesToValidate_1, rule, validationResult, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    return [4 /*yield*/, request.json()];
                case 1:
                    rules = _a.sent();
                    if (!Array.isArray(rules) && !rules.id) {
                        return [2 /*return*/, NextResponse.json({ error: 'Format invalide. Fournir une règle ou un tableau de règles à valider' }, { status: 400 })];
                    }
                    rulesToValidate = Array.isArray(rules) ? rules : [rules];
                    // Si aucune règle fournie, renvoyer un résultat vide
                    if (rulesToValidate.length === 0) {
                        return [2 /*return*/, NextResponse.json({
                                isValid: true,
                                conflicts: []
                            })];
                    }
                    return [4 /*yield*/, prisma.rule.findMany({
                            where: {
                                isActive: true
                            }
                        })];
                case 2:
                    existingRules = _a.sent();
                    conflicts = [];
                    _loop_1 = function (rule) {
                        var overlappingRules, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    overlappingRules = existingRules.filter(function (existingRule) {
                                        return existingRule.id !== rule.id &&
                                            existingRule.type === rule.type &&
                                            isTimeOverlap(rule, existingRule);
                                    });
                                    _b = rule.type;
                                    switch (_b) {
                                        case RuleType.DUTY: return [3 /*break*/, 1];
                                        case RuleType.LEAVE: return [3 /*break*/, 3];
                                        case RuleType.SUPERVISION: return [3 /*break*/, 5];
                                        case RuleType.ASSIGNMENT: return [3 /*break*/, 7];
                                        case RuleType.ON_CALL: return [3 /*break*/, 9];
                                    }
                                    return [3 /*break*/, 11];
                                case 1: return [4 /*yield*/, validateDutyRule(rule, existingRules, conflicts)];
                                case 2:
                                    _c.sent();
                                    return [3 /*break*/, 11];
                                case 3: return [4 /*yield*/, validateLeaveRule(rule, existingRules, conflicts)];
                                case 4:
                                    _c.sent();
                                    return [3 /*break*/, 11];
                                case 5: return [4 /*yield*/, validateSupervisionRule(rule, existingRules, conflicts)];
                                case 6:
                                    _c.sent();
                                    return [3 /*break*/, 11];
                                case 7: return [4 /*yield*/, validateAssignmentRule(rule, existingRules, conflicts)];
                                case 8:
                                    _c.sent();
                                    return [3 /*break*/, 11];
                                case 9: return [4 /*yield*/, validateOnCallRule(rule, existingRules, conflicts)];
                                case 10:
                                    _c.sent();
                                    return [3 /*break*/, 11];
                                case 11: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, rulesToValidate_1 = rulesToValidate;
                    _a.label = 3;
                case 3:
                    if (!(_i < rulesToValidate_1.length)) return [3 /*break*/, 6];
                    rule = rulesToValidate_1[_i];
                    return [5 /*yield**/, _loop_1(rule)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    validationResult = {
                        isValid: conflicts.length === 0,
                        conflicts: conflicts.map(function (conflict) { return ({
                            id: conflict.id || 'temp-' + Math.random().toString(36).substring(2, 9),
                            ruleIds: conflict.ruleIds || [],
                            description: conflict.description,
                            severity: conflict.severity,
                            detectedAt: conflict.detectedAt || new Date(),
                            resolvedAt: null
                        }); })
                    };
                    return [2 /*return*/, NextResponse.json(validationResult)];
                case 7:
                    error_1 = _a.sent();
                    console.error('Erreur lors de la validation des règles:', error_1);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur serveur lors de la validation des règles' }, { status: 500 })];
                case 8: return [2 /*return*/];
            }
        });
    });
}
/**
 * Vérifie si deux règles se chevauchent dans le temps
 */
function isTimeOverlap(rule1, rule2) {
    var validFrom1 = new Date(rule1.validFrom);
    var validTo1 = rule1.validTo ? new Date(rule1.validTo) : null;
    var validFrom2 = new Date(rule2.validFrom);
    var validTo2 = rule2.validTo ? new Date(rule2.validTo) : null;
    // Si l'une des règles n'a pas de date de fin, elle est valide indéfiniment
    if (!validTo1 && !validTo2)
        return true;
    if (!validTo1)
        return validFrom1 <= validFrom2 || validFrom1 <= validTo2;
    if (!validTo2)
        return validFrom2 <= validFrom1 || validFrom2 <= validTo1;
    // Vérifier le chevauchement des périodes
    return (validFrom1 <= validTo2) && (validFrom2 <= validTo1);
}
/**
 * Validation spécifique pour les règles de garde
 */
function validateDutyRule(rule, existingRules, conflicts) {
    return __awaiter(this, void 0, void 0, function () {
        var dutyRules, _i, dutyRules_1, existingRule, periodsConflict;
        return __generator(this, function (_a) {
            dutyRules = existingRules.filter(function (r) { return r.type === RuleType.DUTY && r.id !== rule.id; });
            // Vérifier les conflits de périodes de garde
            for (_i = 0, dutyRules_1 = dutyRules; _i < dutyRules_1.length; _i++) {
                existingRule = dutyRules_1[_i];
                if (!rule.configuration || !existingRule.configuration)
                    continue;
                periodsConflict = checkDutyPeriodsOverlap(rule.configuration.dutyPeriods, existingRule.configuration.dutyPeriods);
                if (periodsConflict) {
                    conflicts.push({
                        id: '',
                        ruleIds: [rule.id, existingRule.id],
                        description: "Conflit de p\u00E9riodes de garde entre \"".concat(rule.name, "\" et \"").concat(existingRule.name, "\""),
                        severity: RuleSeverity.HIGH,
                        detectedAt: new Date()
                    });
                }
            }
            return [2 /*return*/];
        });
    });
}
/**
 * Vérifie si des périodes de garde se chevauchent
 */
function checkDutyPeriodsOverlap(periods1, periods2) {
    if (!periods1 || !periods2 || !Array.isArray(periods1) || !Array.isArray(periods2)) {
        return false;
    }
    for (var _i = 0, periods1_1 = periods1; _i < periods1_1.length; _i++) {
        var period1 = periods1_1[_i];
        for (var _a = 0, periods2_1 = periods2; _a < periods2_1.length; _a++) {
            var period2 = periods2_1[_a];
            if (period1.dayOfWeek === period2.dayOfWeek) {
                var start1 = convertTimeToMinutes(period1.startTime);
                var end1 = convertTimeToMinutes(period1.endTime);
                var start2 = convertTimeToMinutes(period2.startTime);
                var end2 = convertTimeToMinutes(period2.endTime);
                if ((start1 <= end2) && (start2 <= end1)) {
                    return true;
                }
            }
        }
    }
    return false;
}
/**
 * Convertit une heure au format "HH:MM" en minutes depuis minuit
 */
function convertTimeToMinutes(timeString) {
    var _a = timeString.split(':').map(Number), hours = _a[0], minutes = _a[1];
    return hours * 60 + minutes;
}
/**
 * Validation spécifique pour les règles de congé
 */
function validateLeaveRule(rule, existingRules, conflicts) {
    return __awaiter(this, void 0, void 0, function () {
        var leaveRules, _i, leaveRules_1, existingRule, sameRestrictions;
        return __generator(this, function (_a) {
            leaveRules = existingRules.filter(function (r) { return r.type === RuleType.LEAVE && r.id !== rule.id; });
            for (_i = 0, leaveRules_1 = leaveRules; _i < leaveRules_1.length; _i++) {
                existingRule = leaveRules_1[_i];
                if (!rule.configuration || !existingRule.configuration)
                    continue;
                sameRestrictions = hasOverlappingRestrictions(rule, existingRule);
                if (sameRestrictions) {
                    conflicts.push({
                        id: '',
                        ruleIds: [rule.id, existingRule.id],
                        description: "Conflit de restrictions de cong\u00E9s entre \"".concat(rule.name, "\" et \"").concat(existingRule.name, "\""),
                        severity: RuleSeverity.MEDIUM,
                        detectedAt: new Date()
                    });
                }
            }
            return [2 /*return*/];
        });
    });
}
/**
 * Vérifie si deux règles ont des restrictions qui se chevauchent
 */
function hasOverlappingRestrictions(rule1, rule2) {
    // Si les deux règles ont les mêmes restrictions de rôle ou de spécialité
    var roleOverlap = hasArrayOverlap(rule1.configuration.roleRestrictions, rule2.configuration.roleRestrictions);
    var specialtyOverlap = hasArrayOverlap(rule1.configuration.specialtyRestrictions, rule2.configuration.specialtyRestrictions);
    // Vérifier les périodes restreintes
    var periodsOverlap = checkRestrictedPeriodsOverlap(rule1.configuration.restrictedPeriods, rule2.configuration.restrictedPeriods);
    return roleOverlap && (specialtyOverlap || periodsOverlap);
}
/**
 * Vérifie si deux tableaux ont des éléments en commun
 */
function hasArrayOverlap(array1, array2) {
    if (!array1 || !array2 || !Array.isArray(array1) || !Array.isArray(array2)) {
        return false;
    }
    return array1.some(function (item) { return array2.includes(item); });
}
/**
 * Vérifie si des périodes restreintes se chevauchent
 */
function checkRestrictedPeriodsOverlap(periods1, periods2) {
    if (!periods1 || !periods2 || !Array.isArray(periods1) || !Array.isArray(periods2)) {
        return false;
    }
    for (var _i = 0, periods1_2 = periods1; _i < periods1_2.length; _i++) {
        var period1 = periods1_2[_i];
        var start1 = new Date(period1.startDate);
        var end1 = new Date(period1.endDate);
        for (var _a = 0, periods2_2 = periods2; _a < periods2_2.length; _a++) {
            var period2 = periods2_2[_a];
            var start2 = new Date(period2.startDate);
            var end2 = new Date(period2.endDate);
            if ((start1 <= end2) && (start2 <= end1)) {
                return true;
            }
        }
    }
    return false;
}
/**
 * Validation spécifique pour les règles de supervision
 */
function validateSupervisionRule(rule, existingRules, conflicts) {
    return __awaiter(this, void 0, void 0, function () {
        var supervisionRules, _i, supervisionRules_1, existingRule, supervisorOverlap, superviseeOverlap, periodsOverlap;
        return __generator(this, function (_a) {
            supervisionRules = existingRules.filter(function (r) { return r.type === RuleType.SUPERVISION && r.id !== rule.id; });
            for (_i = 0, supervisionRules_1 = supervisionRules; _i < supervisionRules_1.length; _i++) {
                existingRule = supervisionRules_1[_i];
                if (!rule.configuration || !existingRule.configuration)
                    continue;
                supervisorOverlap = hasArrayOverlap(rule.configuration.supervisorRoles, existingRule.configuration.supervisorRoles);
                superviseeOverlap = hasArrayOverlap(rule.configuration.superviseeRoles, existingRule.configuration.superviseeRoles);
                if (supervisorOverlap && superviseeOverlap) {
                    periodsOverlap = checkDutyPeriodsOverlap(rule.configuration.supervisionPeriods, existingRule.configuration.supervisionPeriods);
                    if (periodsOverlap) {
                        conflicts.push({
                            id: '',
                            ruleIds: [rule.id, existingRule.id],
                            description: "Conflit de p\u00E9riodes de supervision entre \"".concat(rule.name, "\" et \"").concat(existingRule.name, "\""),
                            severity: RuleSeverity.MEDIUM,
                            detectedAt: new Date()
                        });
                    }
                }
            }
            return [2 /*return*/];
        });
    });
}
/**
 * Validation spécifique pour les règles d'affectation
 */
function validateAssignmentRule(rule, existingRules, conflicts) {
    return __awaiter(this, void 0, void 0, function () {
        var assignmentRules, _i, assignmentRules_1, existingRule, preferredOverlap;
        return __generator(this, function (_a) {
            assignmentRules = existingRules.filter(function (r) { return r.type === RuleType.ASSIGNMENT && r.id !== rule.id; });
            for (_i = 0, assignmentRules_1 = assignmentRules; _i < assignmentRules_1.length; _i++) {
                existingRule = assignmentRules_1[_i];
                if (!rule.configuration || !existingRule.configuration)
                    continue;
                preferredOverlap = hasArrayOverlap(rule.configuration.preferredRoles, existingRule.configuration.restrictedRoles);
                if (preferredOverlap) {
                    conflicts.push({
                        id: '',
                        ruleIds: [rule.id, existingRule.id],
                        description: "Conflit entre r\u00F4les pr\u00E9f\u00E9r\u00E9s et restreints entre \"".concat(rule.name, "\" et \"").concat(existingRule.name, "\""),
                        severity: RuleSeverity.HIGH,
                        detectedAt: new Date()
                    });
                }
            }
            return [2 /*return*/];
        });
    });
}
/**
 * Validation spécifique pour les règles de garde
 */
function validateOnCallRule(rule, existingRules, conflicts) {
    return __awaiter(this, void 0, void 0, function () {
        var onCallRules, _i, onCallRules_1, existingRule, periodsConflict, rolesOverlap;
        return __generator(this, function (_a) {
            onCallRules = existingRules.filter(function (r) { return r.type === RuleType.ON_CALL && r.id !== rule.id; });
            for (_i = 0, onCallRules_1 = onCallRules; _i < onCallRules_1.length; _i++) {
                existingRule = onCallRules_1[_i];
                if (!rule.configuration || !existingRule.configuration)
                    continue;
                periodsConflict = checkDutyPeriodsOverlap(rule.configuration.onCallPeriods, existingRule.configuration.onCallPeriods);
                rolesOverlap = hasArrayOverlap(rule.configuration.onCallRoles, existingRule.configuration.onCallRoles);
                if (periodsConflict && rolesOverlap) {
                    conflicts.push({
                        id: '',
                        ruleIds: [rule.id, existingRule.id],
                        description: "Conflit de p\u00E9riodes d'astreinte entre \"".concat(rule.name, "\" et \"").concat(existingRule.name, "\""),
                        severity: RuleSeverity.HIGH,
                        detectedAt: new Date()
                    });
                }
            }
            return [2 /*return*/];
        });
    });
}
