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
// import { authOptions } from '@/lib/auth'; // <--- Chemin potentiellement incorrect, commenté temporairement
var prisma = new PrismaClient();
// Fonction pour vérifier si l'utilisateur est admin
var isAdmin = function (user) {
    // Adaptez cette logique à votre modèle User et aux rôles admin
    // Vérifier si user n'est pas null avant d'accéder à user.role
    return !!user && (user.role === 'ADMIN_TOTAL' || user.role === 'ADMIN_PARTIEL');
};
/**
 * GET /api/admin/leave-types
 * Récupère la liste de tous les paramètres de types de congés.
 * Réservé aux administrateurs.
 */
export function GET(request) {
    return __awaiter(this, void 0, void 0, function () {
        var leaveTypeSettings, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    return [4 /*yield*/, prisma.leaveTypeSetting.findMany({
                            orderBy: { label: 'asc' },
                        })];
                case 1:
                    leaveTypeSettings = _a.sent();
                    return [2 /*return*/, NextResponse.json(leaveTypeSettings)];
                case 2:
                    error_1 = _a.sent();
                    console.error('Erreur API [GET /admin/leave-types]:', error_1);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur serveur lors de la récupération des types de congés.' }, { status: 500 })];
                case 3: return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// TODO: Implémenter POST, PUT, DELETE avec la même vérification admin
/**
 * POST /api/admin/leave-types
 * Crée un nouveau paramètre de type de congé.
 * Réservé aux administrateurs.
 */
export function POST(request) {
    return __awaiter(this, void 0, void 0, function () {
        var body, existing, newLeaveTypeSetting, error_2;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 4, 5, 6]);
                    return [4 /*yield*/, request.json()];
                case 1:
                    body = _d.sent();
                    if (!body.code || !body.label) {
                        return [2 /*return*/, NextResponse.json({ error: 'Les champs code et label sont requis.' }, { status: 400 })];
                    }
                    return [4 /*yield*/, prisma.leaveTypeSetting.findUnique({ where: { code: body.code } })];
                case 2:
                    existing = _d.sent();
                    if (existing) {
                        return [2 /*return*/, NextResponse.json({ error: "Le code '".concat(body.code, "' existe d\u00E9j\u00E0.") }, { status: 409 })];
                    }
                    return [4 /*yield*/, prisma.leaveTypeSetting.create({
                            data: {
                                code: body.code,
                                label: body.label,
                                description: body.description,
                                rules: (_a = body.rules) !== null && _a !== void 0 ? _a : undefined,
                                isActive: body.isActive !== undefined ? body.isActive : true,
                                isUserSelectable: body.isUserSelectable !== undefined ? body.isUserSelectable : true,
                            },
                        })];
                case 3:
                    newLeaveTypeSetting = _d.sent();
                    return [2 /*return*/, NextResponse.json(newLeaveTypeSetting, { status: 201 })];
                case 4:
                    error_2 = _d.sent();
                    console.error('Erreur API [POST /admin/leave-types]:', error_2);
                    if (error_2.code === 'P2002' && ((_c = (_b = error_2.meta) === null || _b === void 0 ? void 0 : _b.target) === null || _c === void 0 ? void 0 : _c.includes('code'))) {
                        return [2 /*return*/, NextResponse.json({ error: 'Le code fourni existe déjà.' }, { status: 409 })];
                    }
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur serveur lors de la création du type de congé.' }, { status: 500 })];
                case 5: return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
