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
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
var prisma = new PrismaClient();
// Récupérer un type d'affectation par ID
export function GET(req_1, _a) {
    return __awaiter(this, arguments, void 0, function (req, _b) {
        var session, id, assignmentType, error_1;
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
                    return [4 /*yield*/, prisma.assignmentType.findUnique({
                            where: { id: id },
                        })];
                case 2:
                    assignmentType = _c.sent();
                    if (!assignmentType) {
                        return [2 /*return*/, NextResponse.json({ error: 'Type d\'affectation non trouvé' }, { status: 404 })];
                    }
                    return [2 /*return*/, NextResponse.json(assignmentType)];
                case 3:
                    error_1 = _c.sent();
                    console.error('Erreur lors de la récupération du type d\'affectation:', error_1);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur lors de la récupération du type d\'affectation' }, { status: 500 })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Mettre à jour un type d'affectation
export function PUT(req_1, _a) {
    return __awaiter(this, arguments, void 0, function (req, _b) {
        var session, id, data, existingType, typeWithSameCode, updatedType, error_2;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 7, , 8]);
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
                    if (!data.name || !data.code) {
                        return [2 /*return*/, NextResponse.json({ error: 'Le nom et le code sont requis' }, { status: 400 })];
                    }
                    return [4 /*yield*/, prisma.assignmentType.findUnique({
                            where: { id: id },
                        })];
                case 3:
                    existingType = _c.sent();
                    if (!existingType) {
                        return [2 /*return*/, NextResponse.json({ error: 'Type d\'affectation non trouvé' }, { status: 404 })];
                    }
                    if (!(data.code !== existingType.code)) return [3 /*break*/, 5];
                    return [4 /*yield*/, prisma.assignmentType.findUnique({
                            where: { code: data.code },
                        })];
                case 4:
                    typeWithSameCode = _c.sent();
                    if (typeWithSameCode && typeWithSameCode.id !== id) {
                        return [2 /*return*/, NextResponse.json({ error: 'Un type d\'affectation avec ce code existe déjà' }, { status: 400 })];
                    }
                    _c.label = 5;
                case 5: return [4 /*yield*/, prisma.assignmentType.update({
                        where: { id: id },
                        data: {
                            name: data.name,
                            code: data.code,
                            description: data.description,
                            icon: data.icon,
                            color: data.color,
                            isActive: data.isActive,
                            allowsMultiple: data.allowsMultiple,
                            requiresLocation: data.requiresLocation,
                            properties: data.properties,
                        },
                    })];
                case 6:
                    updatedType = _c.sent();
                    return [2 /*return*/, NextResponse.json(updatedType)];
                case 7:
                    error_2 = _c.sent();
                    console.error('Erreur lors de la mise à jour du type d\'affectation:', error_2);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur lors de la mise à jour du type d\'affectation' }, { status: 500 })];
                case 8: return [2 /*return*/];
            }
        });
    });
}
// Supprimer un type d'affectation
export function DELETE(req_1, _a) {
    return __awaiter(this, arguments, void 0, function (req, _b) {
        var session, id, existingType, assignmentsCount, deactivatedType, error_3;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 7, , 8]);
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
                    return [4 /*yield*/, prisma.assignmentType.findUnique({
                            where: { id: id },
                        })];
                case 2:
                    existingType = _c.sent();
                    if (!existingType) {
                        return [2 /*return*/, NextResponse.json({ error: 'Type d\'affectation non trouvé' }, { status: 404 })];
                    }
                    return [4 /*yield*/, prisma.assignment.count({
                            where: { typeId: id },
                        })];
                case 3:
                    assignmentsCount = _c.sent();
                    if (!(assignmentsCount > 0)) return [3 /*break*/, 5];
                    return [4 /*yield*/, prisma.assignmentType.update({
                            where: { id: id },
                            data: { isActive: false },
                        })];
                case 4:
                    deactivatedType = _c.sent();
                    return [2 /*return*/, NextResponse.json(__assign(__assign({}, deactivatedType), { message: 'Le type d\'affectation a été désactivé car il est utilisé par des affectations existantes' }))];
                case 5: 
                // Supprimer le type d'affectation
                return [4 /*yield*/, prisma.assignmentType.delete({
                        where: { id: id },
                    })];
                case 6:
                    // Supprimer le type d'affectation
                    _c.sent();
                    return [2 /*return*/, NextResponse.json({ success: true })];
                case 7:
                    error_3 = _c.sent();
                    console.error('Erreur lors de la suppression du type d\'affectation:', error_3);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur lors de la suppression du type d\'affectation' }, { status: 500 })];
                case 8: return [2 /*return*/];
            }
        });
    });
}
