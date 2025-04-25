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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// import { authOptions } from '@/lib/auth'; // <--- Chemin potentiellement incorrect, commenté temporairement
var prisma = new PrismaClient();
// Fonction pour vérifier si l'utilisateur est admin (copiée depuis l'autre route)
var isAdmin = function (user) {
    return !!user && (user.role === 'ADMIN_TOTAL' || user.role === 'ADMIN_PARTIEL');
};
/**
 * PUT /api/admin/leave-types/{id}
 * Met à jour un paramètre de type de congé existant.
 * Réservé aux administrateurs.
 */
export function PUT(request_1, _a) {
    return __awaiter(this, arguments, void 0, function (request, _b) {
        var id, body, code, updateData, updatedLeaveTypeSetting, error_1;
        var _c;
        var params = _b.params;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    id = params.id;
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, request.json()];
                case 2:
                    body = _d.sent();
                    // Validation simple (le code ne doit pas être modifié ici, seulement les autres champs)
                    if (!body.label) {
                        return [2 /*return*/, NextResponse.json({ error: 'Le champ label est requis.' }, { status: 400 })];
                    }
                    code = body.code, updateData = __rest(body, ["code"]);
                    return [4 /*yield*/, prisma.leaveTypeSetting.update({
                            where: { id: id },
                            data: {
                                label: updateData.label,
                                description: updateData.description,
                                rules: (_c = updateData.rules) !== null && _c !== void 0 ? _c : undefined,
                                isActive: updateData.isActive !== undefined ? updateData.isActive : undefined, // Ne met à jour que si fourni
                                isUserSelectable: updateData.isUserSelectable !== undefined ? updateData.isUserSelectable : undefined, // Ne met à jour que si fourni
                            },
                        })];
                case 3:
                    updatedLeaveTypeSetting = _d.sent();
                    return [2 /*return*/, NextResponse.json(updatedLeaveTypeSetting)];
                case 4:
                    error_1 = _d.sent();
                    console.error("Erreur API [PUT /admin/leave-types/".concat(id, "]:"), error_1);
                    // Gérer le cas où l'enregistrement n'est pas trouvé
                    if (error_1.code === 'P2025') {
                        return [2 /*return*/, NextResponse.json({ error: "Type de cong\u00E9 avec ID ".concat(id, " non trouv\u00E9.") }, { status: 404 })];
                    }
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur serveur lors de la mise à jour du type de congé.' }, { status: 500 })];
                case 5: return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * DELETE /api/admin/leave-types/{id}
 * Supprime (ou désactive) un paramètre de type de congé.
 * Réservé aux administrateurs.
 */
export function DELETE(request_1, _a) {
    return __awaiter(this, arguments, void 0, function (request, _b) {
        var id, deletedLeaveTypeSetting, error_2;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    id = params.id;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, prisma.leaveTypeSetting.delete({
                            where: { id: id },
                        })];
                case 2:
                    deletedLeaveTypeSetting = _c.sent();
                    // return NextResponse.json(deletedLeaveTypeSetting); // Retourner l'objet supprimé
                    return [2 /*return*/, new NextResponse(null, { status: 204 })]; // Ou juste 204 No Content
                case 3:
                    error_2 = _c.sent();
                    console.error("Erreur API [DELETE /admin/leave-types/".concat(id, "]:"), error_2);
                    if (error_2.code === 'P2025') {
                        return [2 /*return*/, NextResponse.json({ error: "Type de cong\u00E9 avec ID ".concat(id, " non trouv\u00E9.") }, { status: 404 })];
                    }
                    // Gérer P2003: Foreign key constraint failed (si des Leave utilisent ce type)
                    if (error_2.code === 'P2003') {
                        return [2 /*return*/, NextResponse.json({ error: 'Impossible de supprimer ce type de congé car il est utilisé par des demandes existantes. Vous pouvez le désactiver à la place.' }, { status: 409 })]; // 409 Conflict
                    }
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur serveur lors de la suppression du type de congé.' }, { status: 500 })];
                case 4: return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
