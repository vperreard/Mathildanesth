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
import { prisma } from '@/lib/prisma';
import { LeaveStatus } from '@prisma/client';
import { verifyAuthToken } from '@/lib/auth-utils';
/**
 * GET /api/admin/leaves/pending
 * Récupère les deux plus anciennes demandes de congé en attente pour les administrateurs
 */
export function GET(request) {
    return __awaiter(this, void 0, void 0, function () {
        var authResult, userId, user, pendingLeaves, formattedLeaves, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, verifyAuthToken()];
                case 1:
                    authResult = _a.sent();
                    if (!authResult.authenticated || !authResult.user) {
                        return [2 /*return*/, NextResponse.json({
                                error: 'Non authentifié',
                                message: authResult.error
                            }, { status: 401 })];
                    }
                    userId = authResult.user.id;
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { id: Number(userId) },
                            select: { role: true }
                        })];
                case 2:
                    user = _a.sent();
                    if (!user || (user.role !== 'ADMIN_TOTAL' && user.role !== 'ADMIN_PARTIEL')) {
                        return [2 /*return*/, NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })];
                    }
                    return [4 /*yield*/, prisma.leave.findMany({
                            where: {
                                status: LeaveStatus.PENDING
                            },
                            orderBy: {
                                createdAt: 'asc'
                            },
                            take: 2,
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        nom: true,
                                        prenom: true
                                    }
                                }
                            }
                        })];
                case 3:
                    pendingLeaves = _a.sent();
                    formattedLeaves = pendingLeaves.map(function (leave) {
                        var _a, _b, _c;
                        var firstName = ((_a = leave.user) === null || _a === void 0 ? void 0 : _a.prenom) || '(Prénom non défini)';
                        var lastName = ((_b = leave.user) === null || _b === void 0 ? void 0 : _b.nom) || '(Nom non défini)';
                        return {
                            id: String(leave.id),
                            startDate: leave.startDate.toISOString(),
                            endDate: leave.endDate.toISOString(),
                            status: leave.status,
                            type: leave.type,
                            typeCode: leave.typeCode,
                            reason: leave.reason,
                            createdAt: leave.createdAt.toISOString(),
                            userId: leave.userId,
                            user: {
                                id: ((_c = leave.user) === null || _c === void 0 ? void 0 : _c.id) || leave.userId,
                                firstName: firstName,
                                lastName: lastName,
                                prenom: firstName,
                                nom: lastName
                            }
                        };
                    });
                    return [2 /*return*/, NextResponse.json(formattedLeaves)];
                case 4:
                    error_1 = _a.sent();
                    console.error('[API /api/admin/leaves/pending] Erreur:', error_1);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur serveur lors de la récupération des demandes en attente' }, { status: 500 })];
                case 5: return [2 /*return*/];
            }
        });
    });
}
