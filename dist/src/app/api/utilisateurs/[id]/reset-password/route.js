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
import bcrypt from 'bcrypt';
import { headers } from 'next/headers';
// Helper pour vérifier les rôles autorisés (utilisation de chaînes)
var hasRequiredRole = function (allowedRoles) {
    var headersList = headers();
    var userRoleString = headersList.get('x-user-role');
    if (!userRoleString) {
        return false;
    }
    // Comparaison directe des chaînes
    return allowedRoles.includes(userRoleString);
};
// --- Fonction PUT pour réinitialiser le mot de passe ---
export function PUT(request_1, _a) {
    return __awaiter(this, arguments, void 0, function (request, _b) {
        var requestHeaders, requesterRoleString, targetUserIdString, targetUserId, targetUser, newPassword, saltRounds, hashedPassword, error_1;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    requestHeaders = headers();
                    requesterRoleString = requestHeaders.get('x-user-role');
                    targetUserIdString = params.id;
                    // 1. Vérifier le rôle du demandeur
                    if (!requesterRoleString || !['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(requesterRoleString)) {
                        console.log("Acc\u00E8s refus\u00E9 pour r\u00E9initialisation par r\u00F4le: ".concat(requesterRoleString));
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Accès non autorisé (rôle insuffisant pour cette action)' }), { status: 403 })];
                    }
                    targetUserId = parseInt(targetUserIdString, 10);
                    if (isNaN(targetUserId)) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'ID utilisateur cible invalide' }), { status: 400 })];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { id: targetUserId },
                            select: {
                                login: true,
                                role: true // Le rôle sera une chaîne ici (ex: 'ADMIN_TOTAL')
                            }
                        })];
                case 2:
                    targetUser = _c.sent();
                    if (!targetUser) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Utilisateur cible non trouvé' }), { status: 404 })];
                    }
                    // 4. Appliquer la règle d'autorisation spécifique (comparaison de chaînes)
                    if (requesterRoleString === 'ADMIN_PARTIEL' && targetUser.role === 'ADMIN_TOTAL') {
                        console.log("Tentative de r\u00E9initialisation refus\u00E9e: ADMIN_PARTIEL (".concat(requesterRoleString, ") vs ADMIN_TOTAL (").concat(targetUser.role, ")"));
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Un administrateur partiel ne peut pas réinitialiser le mot de passe d\'un administrateur total.' }), { status: 403 })];
                    }
                    // 5. Autorisation OK, procéder à la réinitialisation
                    console.log("Autorisation accord\u00E9e pour r\u00E9initialisation: ".concat(requesterRoleString, " sur utilisateur ").concat(targetUserId, " (r\u00F4le ").concat(targetUser.role, ")"));
                    newPassword = targetUser.login;
                    saltRounds = 10;
                    return [4 /*yield*/, bcrypt.hash(newPassword, saltRounds)];
                case 3:
                    hashedPassword = _c.sent();
                    return [4 /*yield*/, prisma.user.update({
                            where: { id: targetUserId },
                            data: {
                                password: hashedPassword,
                                mustChangePassword: true // Forcer le changement au prochain login
                            },
                        })];
                case 4:
                    _c.sent();
                    return [2 /*return*/, new NextResponse(JSON.stringify({ message: "Mot de passe pour l'utilisateur ".concat(targetUserId, " r\u00E9initialis\u00E9 avec succ\u00E8s.") }), { status: 200 })];
                case 5:
                    error_1 = _c.sent();
                    console.error("Erreur interne PUT /api/utilisateurs/".concat(targetUserIdString, "/reset-password:"), error_1);
                    return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur lors de la réinitialisation.' }), { status: 500 })];
                case 6: return [2 /*return*/];
            }
        });
    });
}
