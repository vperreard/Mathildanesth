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
// Helper pour vérifier les rôles admin
var hasRequiredRole = function () {
    var headersList = headers();
    var userRoleString = headersList.get('x-user-role');
    return !!userRoleString && ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(userRoleString);
};
// --- PUT : Modifier une spécialité ---
export function PUT(request_1, _a) {
    return __awaiter(this, arguments, void 0, function (request, _b) {
        var specialtyId, body, name_1, isPediatric, formattedName, updatedSpecialty, error_1;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!hasRequiredRole()) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 })];
                    }
                    specialtyId = parseInt(params.id, 10);
                    if (isNaN(specialtyId)) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'ID spécialité invalide' }), { status: 400 })];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, request.json()];
                case 2:
                    body = _c.sent();
                    name_1 = body.name, isPediatric = body.isPediatric;
                    if (!name_1 || typeof name_1 !== 'string' || name_1.trim() === '') {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Le nom de la spécialité est obligatoire.' }), { status: 400 })];
                    }
                    formattedName = name_1.trim();
                    return [4 /*yield*/, prisma.specialty.update({
                            where: { id: specialtyId },
                            data: {
                                name: formattedName,
                                isPediatric: typeof isPediatric === 'boolean' ? isPediatric : undefined,
                            },
                        })];
                case 3:
                    updatedSpecialty = _c.sent();
                    return [2 /*return*/, NextResponse.json(updatedSpecialty)];
                case 4:
                    error_1 = _c.sent();
                    if (error_1.code === 'P2002') { // Contrainte unique sur le nom
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Ce nom de spécialité existe déjà.' }), { status: 409 })];
                    }
                    if (error_1.code === 'P2025') { // Enregistrement non trouvé
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Spécialité non trouvée' }), { status: 404 })];
                    }
                    console.error("Erreur PUT /api/specialties/".concat(specialtyId, ":"), error_1);
                    return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 })];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// --- DELETE : Supprimer une spécialité ---
export function DELETE(request_1, _a) {
    return __awaiter(this, arguments, void 0, function (request, _b) {
        var specialtyId, error_2;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!hasRequiredRole()) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 })];
                    }
                    specialtyId = parseInt(params.id, 10);
                    if (isNaN(specialtyId)) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'ID spécialité invalide' }), { status: 400 })];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    // Important: La suppression échouera si des chirurgiens sont encore liés à cette spécialité
                    // en raison de la relation many-to-many. Il faudrait idéalement vérifier cela
                    // ou informer l'utilisateur de délier les chirurgiens d'abord.
                    // Pour l'instant, on laisse Prisma gérer l'erreur P2014 (relation constraint).
                    return [4 /*yield*/, prisma.specialty.delete({
                            where: { id: specialtyId },
                        })];
                case 2:
                    // Important: La suppression échouera si des chirurgiens sont encore liés à cette spécialité
                    // en raison de la relation many-to-many. Il faudrait idéalement vérifier cela
                    // ou informer l'utilisateur de délier les chirurgiens d'abord.
                    // Pour l'instant, on laisse Prisma gérer l'erreur P2014 (relation constraint).
                    _c.sent();
                    return [2 /*return*/, new NextResponse(null, { status: 204 })]; // No Content
                case 3:
                    error_2 = _c.sent();
                    if (error_2.code === 'P2025') { // Enregistrement non trouvé
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Spécialité non trouvée' }), { status: 404 })];
                    }
                    // Gérer l'erreur si la spécialité est encore utilisée (contrainte de relation)
                    if (error_2.code === 'P2014' || (error_2.code === 'P2003' && error_2.message.includes('constraint'))) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Impossible de supprimer: cette spécialité est utilisée par au moins un chirurgien.' }), { status: 409 })]; // Conflict
                    }
                    console.error("Erreur DELETE /api/specialties/".concat(specialtyId, ":"), error_2);
                    return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
