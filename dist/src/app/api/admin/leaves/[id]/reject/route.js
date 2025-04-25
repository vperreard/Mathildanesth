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
 * POST /api/admin/leaves/[id]/reject
 * Rejette une demande de congé
 */
export function POST(request_1, _a) {
    return __awaiter(this, arguments, void 0, function (request, _b) {
        var leaveId, comment, body, e_1, authResult, adminId, admin, leave, updatedLeave, userName, adminName, error_1;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 9, , 10]);
                    leaveId = params.id;
                    if (!leaveId) {
                        return [2 /*return*/, NextResponse.json({ error: 'ID de congé manquant' }, { status: 400 })];
                    }
                    comment = null;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, request.json()];
                case 2:
                    body = _c.sent();
                    comment = body.comment || null;
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _c.sent();
                    return [3 /*break*/, 4];
                case 4: return [4 /*yield*/, verifyAuthToken()];
                case 5:
                    authResult = _c.sent();
                    if (!authResult.authenticated || !authResult.user) {
                        return [2 /*return*/, NextResponse.json({
                                error: 'Non authentifié',
                                message: authResult.error
                            }, { status: 401 })];
                    }
                    adminId = authResult.user.id;
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { id: Number(adminId) },
                            select: { role: true, prenom: true, nom: true }
                        })];
                case 6:
                    admin = _c.sent();
                    if (!admin || (admin.role !== 'ADMIN_TOTAL' && admin.role !== 'ADMIN_PARTIEL')) {
                        return [2 /*return*/, NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })];
                    }
                    return [4 /*yield*/, prisma.leave.findUnique({
                            where: { id: leaveId },
                            include: { user: { select: { id: true, prenom: true, nom: true } } }
                        })];
                case 7:
                    leave = _c.sent();
                    if (!leave) {
                        return [2 /*return*/, NextResponse.json({ error: 'Demande de congé non trouvée' }, { status: 404 })];
                    }
                    if (leave.status !== LeaveStatus.PENDING) {
                        return [2 /*return*/, NextResponse.json({
                                error: 'Seules les demandes en attente peuvent être rejetées',
                                currentStatus: leave.status
                            }, { status: 400 })];
                    }
                    return [4 /*yield*/, prisma.leave.update({
                            where: { id: leaveId },
                            data: {
                                status: LeaveStatus.REJECTED,
                                approvalDate: new Date(),
                                approvedById: Number(adminId),
                                comment: comment
                            },
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        nom: true,
                                        prenom: true,
                                    }
                                }
                            }
                        })];
                case 8:
                    updatedLeave = _c.sent();
                    userName = leave.user ? "".concat(leave.user.prenom, " ").concat(leave.user.nom) : "Utilisateur #".concat(leave.userId);
                    adminName = "".concat(admin.prenom, " ").concat(admin.nom);
                    return [2 /*return*/, NextResponse.json({
                            success: true,
                            message: "Demande de cong\u00E9 de ".concat(userName, " rejet\u00E9e par ").concat(adminName),
                            leave: {
                                id: updatedLeave.id,
                                status: updatedLeave.status,
                                startDate: updatedLeave.startDate,
                                endDate: updatedLeave.endDate,
                                type: updatedLeave.type,
                                userId: updatedLeave.userId,
                                userName: updatedLeave.user ? "".concat(updatedLeave.user.prenom, " ").concat(updatedLeave.user.nom) : null,
                                comment: updatedLeave.comment
                            }
                        })];
                case 9:
                    error_1 = _c.sent();
                    console.error('[API /api/admin/leaves/reject] Erreur:', error_1);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur serveur lors du rejet de la demande de congé' }, { status: 500 })];
                case 10: return [2 /*return*/];
            }
        });
    });
}
