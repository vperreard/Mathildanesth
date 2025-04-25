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
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
var prisma = new PrismaClient();
// Récupérer une règle de planning par ID
export function GET(req_1, _a) {
    return __awaiter(this, arguments, void 0, function (req, _b) {
        var session, id, planningRule, error_1;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, getServerSession(authOptions)];
                case 1:
                    session = _c.sent();
                    // Vérifier l'authentification
                    if (!session) {
                        return [2 /*return*/, NextResponse.json({ error: 'Non autorisé' }, { status: 401 })];
                    }
                    id = parseInt(params.id);
                    if (isNaN(id)) {
                        return [2 /*return*/, NextResponse.json({ error: 'ID invalide' }, { status: 400 })];
                    }
                    return [4 /*yield*/, prisma.planningRule.findUnique({
                            where: { id: id },
                            include: {
                                createdByUser: {
                                    select: {
                                        id: true,
                                        nom: true,
                                        prenom: true
                                    }
                                }
                            }
                        })];
                case 2:
                    planningRule = _c.sent();
                    if (!planningRule) {
                        return [2 /*return*/, NextResponse.json({ error: 'Règle de planning non trouvée' }, { status: 404 })];
                    }
                    return [2 /*return*/, NextResponse.json(planningRule)];
                case 3:
                    error_1 = _c.sent();
                    console.error('Erreur lors de la récupération de la règle de planning:', error_1);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur lors de la récupération de la règle de planning' }, { status: 500 })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Mettre à jour une règle de planning
export function PUT(req_1, _a) {
    return __awaiter(this, arguments, void 0, function (req, _b) {
        var session, id, data, validTypes, existingRule, updatedRule, error_2;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, getServerSession(authOptions)];
                case 1:
                    session = _c.sent();
                    // Vérifier l'authentification et les droits d'admin
                    if (!session || !session.user || !["ADMIN_TOTAL", "ADMIN_PARTIEL"].includes(session.user.role)) {
                        return [2 /*return*/, NextResponse.json({ error: 'Non autorisé' }, { status: 401 })];
                    }
                    id = parseInt(params.id);
                    if (isNaN(id)) {
                        return [2 /*return*/, NextResponse.json({ error: 'ID invalide' }, { status: 400 })];
                    }
                    return [4 /*yield*/, req.json()];
                case 2:
                    data = _c.sent();
                    // Validation des données
                    if (!data.name || !data.type) {
                        return [2 /*return*/, NextResponse.json({ error: 'Le nom et le type sont requis' }, { status: 400 })];
                    }
                    validTypes = ['bloc', 'garde', 'astreinte', 'consultation', 'autre'];
                    if (!validTypes.includes(data.type)) {
                        return [2 /*return*/, NextResponse.json({ error: 'Type invalide. Valeurs valides: ' + validTypes.join(', ') }, { status: 400 })];
                    }
                    return [4 /*yield*/, prisma.planningRule.findUnique({
                            where: { id: id },
                        })];
                case 3:
                    existingRule = _c.sent();
                    if (!existingRule) {
                        return [2 /*return*/, NextResponse.json({ error: 'Règle de planning non trouvée' }, { status: 404 })];
                    }
                    return [4 /*yield*/, prisma.planningRule.update({
                            where: { id: id },
                            data: {
                                name: data.name,
                                description: data.description,
                                type: data.type,
                                isActive: data.isActive,
                                priority: data.priority,
                                configuration: data.configuration,
                            },
                        })];
                case 4:
                    updatedRule = _c.sent();
                    return [2 /*return*/, NextResponse.json(updatedRule)];
                case 5:
                    error_2 = _c.sent();
                    console.error('Erreur lors de la mise à jour de la règle de planning:', error_2);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur lors de la mise à jour de la règle de planning' }, { status: 500 })];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Supprimer une règle de planning
export function DELETE(req_1, _a) {
    return __awaiter(this, arguments, void 0, function (req, _b) {
        var session, id, existingRule, error_3;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, getServerSession(authOptions)];
                case 1:
                    session = _c.sent();
                    // Vérifier l'authentification et les droits d'admin
                    if (!session || !session.user || !["ADMIN_TOTAL", "ADMIN_PARTIEL"].includes(session.user.role)) {
                        return [2 /*return*/, NextResponse.json({ error: 'Non autorisé' }, { status: 401 })];
                    }
                    id = parseInt(params.id);
                    if (isNaN(id)) {
                        return [2 /*return*/, NextResponse.json({ error: 'ID invalide' }, { status: 400 })];
                    }
                    return [4 /*yield*/, prisma.planningRule.findUnique({
                            where: { id: id },
                        })];
                case 2:
                    existingRule = _c.sent();
                    if (!existingRule) {
                        return [2 /*return*/, NextResponse.json({ error: 'Règle de planning non trouvée' }, { status: 404 })];
                    }
                    // Supprimer la règle de planning
                    return [4 /*yield*/, prisma.planningRule.delete({
                            where: { id: id },
                        })];
                case 3:
                    // Supprimer la règle de planning
                    _c.sent();
                    return [2 /*return*/, NextResponse.json({ success: true })];
                case 4:
                    error_3 = _c.sent();
                    console.error('Erreur lors de la suppression de la règle de planning:', error_3);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur lors de la suppression de la règle de planning' }, { status: 500 })];
                case 5: return [2 /*return*/];
            }
        });
    });
}
