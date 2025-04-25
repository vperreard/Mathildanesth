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
import { RuleSeverity } from '../../../../modules/rules/types/rule';
var prisma = new PrismaClient();
/**
 * GET /api/rules/conflicts
 * Récupère tous les conflits entre règles
 */
export function GET(request) {
    return __awaiter(this, void 0, void 0, function () {
        var conflicts, serializedConflicts, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, prisma.ruleConflict.findMany({
                            where: {
                                resolvedAt: null
                            },
                            orderBy: {
                                detectedAt: 'desc'
                            },
                            include: {
                                rules: {
                                    select: {
                                        id: true,
                                        name: true,
                                        type: true,
                                        isActive: true
                                    }
                                }
                            }
                        })];
                case 1:
                    conflicts = _a.sent();
                    serializedConflicts = conflicts.map(function (conflict) { return (__assign(__assign({}, conflict), { detectedAt: conflict.detectedAt.toISOString(), resolvedAt: conflict.resolvedAt ? conflict.resolvedAt.toISOString() : null })); });
                    return [2 /*return*/, NextResponse.json(serializedConflicts)];
                case 2:
                    error_1 = _a.sent();
                    console.error('Erreur lors de la récupération des conflits:', error_1);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur serveur lors de la récupération des conflits' }, { status: 500 })];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * POST /api/rules/conflicts
 * Crée un nouveau conflit entre règles
 */
export function POST(request) {
    return __awaiter(this, void 0, void 0, function () {
        var data, conflictData, createdConflict, serializedConflict, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, request.json()];
                case 1:
                    data = _a.sent();
                    // Validation de base des données reçues
                    if (!data.ruleIds || !Array.isArray(data.ruleIds) || data.ruleIds.length < 2) {
                        return [2 /*return*/, NextResponse.json({ error: 'Au moins deux règles en conflit doivent être spécifiées' }, { status: 400 })];
                    }
                    conflictData = {
                        description: data.description || 'Conflit entre règles',
                        severity: data.severity || RuleSeverity.MEDIUM,
                        rules: {
                            connect: data.ruleIds.map(function (id) { return ({ id: id }); })
                        }
                    };
                    return [4 /*yield*/, prisma.ruleConflict.create({
                            data: conflictData,
                            include: {
                                rules: {
                                    select: {
                                        id: true,
                                        name: true,
                                        type: true,
                                        isActive: true
                                    }
                                }
                            }
                        })];
                case 2:
                    createdConflict = _a.sent();
                    serializedConflict = __assign(__assign({}, createdConflict), { detectedAt: createdConflict.detectedAt.toISOString(), resolvedAt: createdConflict.resolvedAt ? createdConflict.resolvedAt.toISOString() : null });
                    return [2 /*return*/, NextResponse.json(serializedConflict, { status: 201 })];
                case 3:
                    error_2 = _a.sent();
                    console.error('Erreur lors de la création du conflit:', error_2);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur serveur lors de la création du conflit' }, { status: 500 })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
