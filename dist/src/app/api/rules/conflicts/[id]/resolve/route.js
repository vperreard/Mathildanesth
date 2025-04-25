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
 * POST /api/rules/conflicts/[id]/resolve
 * Résout un conflit entre règles
 */
export function POST(request_1, _a) {
    return __awaiter(this, arguments, void 0, function (request, _b) {
        var conflictId, data, existingConflict, _c, resolvedConflict, serializedConflict, error_1;
        var _this = this;
        var params = _b.params;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 11, , 12]);
                    conflictId = params.id;
                    return [4 /*yield*/, request.json()];
                case 1:
                    data = _d.sent();
                    // Vérifier si le type d'action est fourni
                    if (!data.actionType) {
                        return [2 /*return*/, NextResponse.json({ error: 'Le type d\'action est requis' }, { status: 400 })];
                    }
                    return [4 /*yield*/, prisma.ruleConflict.findUnique({
                            where: {
                                id: conflictId,
                                resolvedAt: null
                            },
                            include: {
                                rules: true
                            }
                        })];
                case 2:
                    existingConflict = _d.sent();
                    if (!existingConflict) {
                        return [2 /*return*/, NextResponse.json({ error: 'Conflit non trouvé ou déjà résolu' }, { status: 404 })];
                    }
                    _c = data.actionType;
                    switch (_c) {
                        case 'MODIFY_RULES': return [3 /*break*/, 3];
                        case 'DELETE_RULES': return [3 /*break*/, 5];
                        case 'IGNORE_CONFLICT': return [3 /*break*/, 7];
                    }
                    return [3 /*break*/, 8];
                case 3:
                    // Vérifier si des règles modifiées sont fournies
                    if (!data.modifiedRules || !Array.isArray(data.modifiedRules) || data.modifiedRules.length === 0) {
                        return [2 /*return*/, NextResponse.json({ error: 'Des règles modifiées doivent être fournies pour ce type d\'action' }, { status: 400 })];
                    }
                    // Mettre à jour les règles modifiées
                    return [4 /*yield*/, Promise.all(data.modifiedRules.map(function (rule) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!rule.id)
                                            return [2 /*return*/];
                                        return [4 /*yield*/, prisma.rule.update({
                                                where: { id: rule.id },
                                                data: {
                                                    name: rule.name,
                                                    description: rule.description,
                                                    priority: rule.priority,
                                                    isActive: rule.isActive,
                                                    validFrom: rule.validFrom ? new Date(rule.validFrom) : undefined,
                                                    validTo: rule.validTo ? new Date(rule.validTo) : undefined,
                                                    updatedBy: rule.updatedBy || undefined,
                                                    configuration: rule.configuration || undefined
                                                }
                                            })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 4:
                    // Mettre à jour les règles modifiées
                    _d.sent();
                    return [3 /*break*/, 9];
                case 5:
                    // Vérifier si des règles à supprimer sont fournies
                    if (!data.rulesToDelete || !Array.isArray(data.rulesToDelete) || data.rulesToDelete.length === 0) {
                        return [2 /*return*/, NextResponse.json({ error: 'Des règles à supprimer doivent être fournies pour ce type d\'action' }, { status: 400 })];
                    }
                    // Supprimer les règles spécifiées
                    return [4 /*yield*/, Promise.all(data.rulesToDelete.map(function (ruleId) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, prisma.rule.delete({
                                            where: { id: ruleId }
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 6:
                    // Supprimer les règles spécifiées
                    _d.sent();
                    return [3 /*break*/, 9];
                case 7:
                    // Optionnellement enregistrer la raison d'ignorer le conflit
                    if (!data.ignoreReason) {
                        return [2 /*return*/, NextResponse.json({ error: 'Une raison est requise pour ignorer un conflit' }, { status: 400 })];
                    }
                    return [3 /*break*/, 9];
                case 8: return [2 /*return*/, NextResponse.json({ error: 'Type d\'action non valide' }, { status: 400 })];
                case 9: return [4 /*yield*/, prisma.ruleConflict.update({
                        where: {
                            id: conflictId
                        },
                        data: {
                            resolvedAt: new Date(),
                            resolution: data.actionType,
                            resolutionDetails: data.ignoreReason || "R\u00E9solu par ".concat(data.actionType),
                        },
                        include: {
                            rules: {
                                select: {
                                    id: true,
                                    name: true,
                                    type: true
                                }
                            }
                        }
                    })];
                case 10:
                    resolvedConflict = _d.sent();
                    serializedConflict = __assign(__assign({}, resolvedConflict), { detectedAt: resolvedConflict.detectedAt.toISOString(), resolvedAt: resolvedConflict.resolvedAt ? resolvedConflict.resolvedAt.toISOString() : null });
                    return [2 /*return*/, NextResponse.json(serializedConflict)];
                case 11:
                    error_1 = _d.sent();
                    console.error("Erreur lors de la r\u00E9solution du conflit ".concat(params.id, ":"), error_1);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur serveur lors de la résolution du conflit' }, { status: 500 })];
                case 12: return [2 /*return*/];
            }
        });
    });
}
