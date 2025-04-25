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
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
var prisma = new PrismaClient();
/**
 * GET /api/rules/[id]
 * Récupère une règle spécifique
 */
export function GET(request_1, _a) {
    return __awaiter(this, arguments, void 0, function (request, _b) {
        var ruleId, rule, serializedRule, error_1;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    ruleId = params.id;
                    return [4 /*yield*/, prisma.rule.findUnique({
                            where: {
                                id: ruleId
                            },
                            include: {
                                createdByUser: {
                                    select: {
                                        id: true,
                                        nom: true,
                                        prenom: true
                                    }
                                },
                                updatedByUser: {
                                    select: {
                                        id: true,
                                        nom: true,
                                        prenom: true
                                    }
                                }
                            }
                        })];
                case 1:
                    rule = _c.sent();
                    if (!rule) {
                        return [2 /*return*/, NextResponse.json({ error: 'Règle non trouvée' }, { status: 404 })];
                    }
                    serializedRule = __assign(__assign({}, rule), { validFrom: rule.validFrom.toISOString(), validTo: rule.validTo ? rule.validTo.toISOString() : null, createdAt: rule.createdAt.toISOString(), updatedAt: rule.updatedAt.toISOString() });
                    return [2 /*return*/, NextResponse.json(serializedRule)];
                case 2:
                    error_1 = _c.sent();
                    console.error("Erreur lors de la r\u00E9cup\u00E9ration de la r\u00E8gle ".concat(params.id, ":"), error_1);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur serveur lors de la récupération de la règle' }, { status: 500 })];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * PUT /api/rules/[id]
 * Met à jour une règle existante
 */
export function PUT(request_1, _a) {
    return __awaiter(this, arguments, void 0, function (request, _b) {
        var ruleId, data, existingRule, updatedRule, serializedRule, error_2;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 4, , 5]);
                    ruleId = params.id;
                    return [4 /*yield*/, request.json()];
                case 1:
                    data = _c.sent();
                    return [4 /*yield*/, prisma.rule.findUnique({
                            where: {
                                id: ruleId
                            }
                        })];
                case 2:
                    existingRule = _c.sent();
                    if (!existingRule) {
                        return [2 /*return*/, NextResponse.json({ error: 'Règle non trouvée' }, { status: 404 })];
                    }
                    return [4 /*yield*/, prisma.rule.update({
                            where: {
                                id: ruleId
                            },
                            data: {
                                name: data.name || existingRule.name,
                                description: data.description || existingRule.description,
                                type: data.type || existingRule.type,
                                priority: data.priority || existingRule.priority,
                                isActive: data.isActive !== undefined ? data.isActive : existingRule.isActive,
                                validFrom: data.validFrom ? new Date(data.validFrom) : existingRule.validFrom,
                                validTo: data.validTo ? new Date(data.validTo) : existingRule.validTo,
                                updatedBy: data.updatedBy || existingRule.updatedBy,
                                configuration: data.configuration || existingRule.configuration
                            },
                            include: {
                                createdByUser: {
                                    select: {
                                        id: true,
                                        nom: true,
                                        prenom: true
                                    }
                                },
                                updatedByUser: {
                                    select: {
                                        id: true,
                                        nom: true,
                                        prenom: true
                                    }
                                }
                            }
                        })];
                case 3:
                    updatedRule = _c.sent();
                    serializedRule = __assign(__assign({}, updatedRule), { validFrom: updatedRule.validFrom.toISOString(), validTo: updatedRule.validTo ? updatedRule.validTo.toISOString() : null, createdAt: updatedRule.createdAt.toISOString(), updatedAt: updatedRule.updatedAt.toISOString() });
                    return [2 /*return*/, NextResponse.json(serializedRule)];
                case 4:
                    error_2 = _c.sent();
                    console.error("Erreur lors de la mise \u00E0 jour de la r\u00E8gle ".concat(params.id, ":"), error_2);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur serveur lors de la mise à jour de la règle' }, { status: 500 })];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * DELETE /api/rules/[id]
 * Supprime une règle existante
 */
export function DELETE(request_1, _a) {
    return __awaiter(this, arguments, void 0, function (request, _b) {
        var ruleId, existingRule, error_3;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 3, , 4]);
                    ruleId = params.id;
                    return [4 /*yield*/, prisma.rule.findUnique({
                            where: {
                                id: ruleId
                            }
                        })];
                case 1:
                    existingRule = _c.sent();
                    if (!existingRule) {
                        return [2 /*return*/, NextResponse.json({ error: 'Règle non trouvée' }, { status: 404 })];
                    }
                    // Supprimer la règle
                    return [4 /*yield*/, prisma.rule.delete({
                            where: {
                                id: ruleId
                            }
                        })];
                case 2:
                    // Supprimer la règle
                    _c.sent();
                    return [2 /*return*/, NextResponse.json({
                            message: 'Règle supprimée avec succès'
                        })];
                case 3:
                    error_3 = _c.sent();
                    console.error("Erreur lors de la suppression de la r\u00E8gle ".concat(params.id, ":"), error_3);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur serveur lors de la suppression de la règle' }, { status: 500 })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
