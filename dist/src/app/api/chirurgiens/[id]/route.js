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
import { headers } from 'next/headers';
// Helper pour vérifier les rôles autorisés (ADMIN_TOTAL ou ADMIN_PARTIEL)
var hasRequiredRole = function () {
    var headersList = headers();
    var userRoleString = headersList.get('x-user-role');
    return !!userRoleString && ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(userRoleString);
};
// --- PUT : Modifier un chirurgien existant ---
export function PUT(request_1, _a) {
    return __awaiter(this, arguments, void 0, function (request, _b) {
        var surgeonId, body, nom, prenom, status_1, userId, specialtyIds, email, phoneNumber, updatedSurgeon, error_1;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!hasRequiredRole()) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 })];
                    }
                    surgeonId = parseInt(params.id, 10);
                    if (isNaN(surgeonId)) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'ID chirurgien invalide' }), { status: 400 })];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, request.json()];
                case 2:
                    body = _c.sent();
                    nom = body.nom, prenom = body.prenom, status_1 = body.status, userId = body.userId, specialtyIds = body.specialtyIds, email = body.email, phoneNumber = body.phoneNumber;
                    // Validation basique
                    if (!nom || !prenom) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Nom et prénom sont obligatoires.' }), { status: 400 })];
                    }
                    if (specialtyIds && (!Array.isArray(specialtyIds) || !specialtyIds.every(function (id) { return Number.isInteger(id); }))) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Le format des spécialités est invalide.' }), { status: 400 })];
                    }
                    return [4 /*yield*/, prisma.surgeon.update({
                            where: { id: surgeonId },
                            data: {
                                nom: nom,
                                prenom: prenom,
                                status: status_1 || 'ACTIF',
                                userId: userId === undefined ? undefined : (userId && !isNaN(parseInt(userId)) ? parseInt(userId) : null),
                                email: email === undefined ? undefined : (email || null),
                                phoneNumber: phoneNumber === undefined ? undefined : (phoneNumber || null),
                                specialties: specialtyIds
                                    ? { set: specialtyIds.map(function (id) { return ({ id: id }); }) }
                                    : undefined,
                            },
                            include: {
                                specialties: { select: { id: true, name: true } }
                            }
                        })];
                case 3:
                    updatedSurgeon = _c.sent();
                    return [2 /*return*/, NextResponse.json(updatedSurgeon)];
                case 4:
                    error_1 = _c.sent();
                    if (error_1.code === 'P2025') { // Code d'erreur Prisma pour enregistrement non trouvé
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Chirurgien non trouvé' }), { status: 404 })];
                    }
                    console.error("Erreur PUT /api/chirurgiens/".concat(surgeonId, ":"), error_1);
                    return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 })];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// --- DELETE : Supprimer un chirurgien ---
export function DELETE(request_1, _a) {
    return __awaiter(this, arguments, void 0, function (request, _b) {
        var surgeonId, error_2;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!hasRequiredRole()) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 })];
                    }
                    surgeonId = parseInt(params.id, 10);
                    if (isNaN(surgeonId)) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'ID chirurgien invalide' }), { status: 400 })];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, prisma.surgeon.delete({
                            where: { id: surgeonId },
                        })];
                case 2:
                    _c.sent();
                    return [2 /*return*/, new NextResponse(null, { status: 204 })]; // No Content
                case 3:
                    error_2 = _c.sent();
                    if (error_2.code === 'P2025') { // Code d'erreur Prisma pour enregistrement non trouvé
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Chirurgien non trouvé' }), { status: 404 })];
                    }
                    console.error("Erreur DELETE /api/chirurgiens/".concat(surgeonId, ":"), error_2);
                    return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
