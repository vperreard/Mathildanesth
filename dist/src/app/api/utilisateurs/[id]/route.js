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
import { prisma } from '@/lib/prisma'; // Import nommé
import { Role, ProfessionalRole, Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { headers } from 'next/headers';
// const prisma = new PrismaClient(); // Supprimé
// Helper pour vérifier si l'utilisateur a AU MOINS l'un des rôles requis
var hasRequiredRole = function (requiredRoles) {
    if (requiredRoles === void 0) { requiredRoles = [Role.ADMIN_TOTAL, Role.ADMIN_PARTIEL]; }
    var headersList = headers();
    var userRoleString = headersList.get('x-user-role');
    // Vérifier si le rôle existe et est inclus dans les rôles requis
    return !!userRoleString && requiredRoles.includes(userRoleString);
};
// Helper pour récupérer l'ID de l'utilisateur depuis les headers
var getUserIdFromRequest = function () {
    var headersList = headers();
    var userIdString = headersList.get('x-user-id');
    if (!userIdString)
        return null;
    var userId = parseInt(userIdString, 10);
    return isNaN(userId) ? null : userId;
};
// --- Fonction GET (Récupérer un utilisateur par ID) ---
export function GET(request_1, _a) {
    return __awaiter(this, arguments, void 0, function (request, _b) {
        var id, user, error_1;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    id = parseInt(params.id, 10);
                    if (isNaN(id)) {
                        return [2 /*return*/, NextResponse.json({ error: 'ID invalide' }, { status: 400 })];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { id: id },
                            select: {
                                id: true, nom: true, prenom: true, login: true, email: true, role: true, professionalRole: true,
                                tempsPartiel: true, pourcentageTempsPartiel: true, joursTravailles: true,
                                dateEntree: true, dateSortie: true, actif: true, createdAt: true, updatedAt: true,
                            }
                        })];
                case 2:
                    user = _c.sent();
                    if (!user) {
                        return [2 /*return*/, NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })];
                    }
                    return [2 /*return*/, NextResponse.json(user)];
                case 3:
                    error_1 = _c.sent();
                    console.error("Erreur GET /api/utilisateurs/".concat(id, ":"), error_1);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// --- Fonction PUT (Mettre à jour un utilisateur par ID) ---
export function PUT(request_1, _a) {
    return __awaiter(this, arguments, void 0, function (request, _b) {
        var userId, isAdmin, requestingUserId, isTotalAdmin, isPartialAdmin, userToEdit, body, nom, prenom, email, role, professionalRole, tempsPartiel, pourcentageTempsPartiel, joursTravaillesSemainePaire, joursTravaillesSemaineImpaire, dateEntree, dateSortie, actif, password, phoneNumber, 
        // Récupérer explicitement workPattern et workOnMonthType si envoyés
        workPattern, workOnMonthType, dataToUpdate, saltRounds, _c, updatedUser, error_2, field;
        var _d, _e, _f, _g;
        var params = _b.params;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    userId = parseInt(params.id, 10);
                    if (isNaN(userId)) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'ID utilisateur invalide' }), { status: 400 })];
                    }
                    isAdmin = hasRequiredRole([Role.ADMIN_TOTAL, Role.ADMIN_PARTIEL]);
                    requestingUserId = getUserIdFromRequest();
                    if (!requestingUserId) {
                        // Si on ne peut pas identifier l'utilisateur, on refuse
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Identification utilisateur échouée' }), { status: 401 })];
                    }
                    // Soit un admin modifie, soit l'utilisateur modifie son propre profil
                    if (!isAdmin && requestingUserId !== userId) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 })];
                    }
                    isTotalAdmin = hasRequiredRole([Role.ADMIN_TOTAL]);
                    isPartialAdmin = hasRequiredRole([Role.ADMIN_PARTIEL]);
                    if (!(isPartialAdmin && !isTotalAdmin)) return [3 /*break*/, 2];
                    return [4 /*yield*/, prisma.user.findUnique({ where: { id: userId } })];
                case 1:
                    userToEdit = _h.sent();
                    if ((userToEdit === null || userToEdit === void 0 ? void 0 : userToEdit.role) === Role.ADMIN_TOTAL) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Accès non autorisé à modifier un ADMIN_TOTAL' }), { status: 403 })];
                    }
                    _h.label = 2;
                case 2:
                    _h.trys.push([2, 7, , 8]);
                    return [4 /*yield*/, request.json()];
                case 3:
                    body = _h.sent();
                    nom = body.nom, prenom = body.prenom, email = body.email, role = body.role, professionalRole = body.professionalRole, tempsPartiel = body.tempsPartiel, pourcentageTempsPartiel = body.pourcentageTempsPartiel, joursTravaillesSemainePaire = body.joursTravaillesSemainePaire, joursTravaillesSemaineImpaire = body.joursTravaillesSemaineImpaire, dateEntree = body.dateEntree, dateSortie = body.dateSortie, actif = body.actif, password = body.password, phoneNumber = body.phoneNumber, workPattern = body.workPattern, workOnMonthType = body.workOnMonthType;
                    // --- Validation --- 
                    if (!nom || !prenom || !email || !professionalRole) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Nom, prénom, email et rôle professionnel sont requis.' }), { status: 400 })];
                    }
                    // Seul un admin peut changer le rôle
                    if (role && !isAdmin) { // Utiliser la variable isAdmin calculée plus haut
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Seul un admin peut modifier le rôle.' }), { status: 403 })];
                    }
                    if (role && !Object.values(Role).includes(role)) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Rôle invalide.' }), { status: 400 })];
                    }
                    if (professionalRole && !Object.values(ProfessionalRole).includes(professionalRole)) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Rôle professionnel invalide.' }), { status: 400 })];
                    }
                    dataToUpdate = {};
                    // Ajouter les champs seulement s'ils sont définis dans le body
                    if (nom !== undefined)
                        dataToUpdate.nom = nom;
                    if (prenom !== undefined)
                        dataToUpdate.prenom = prenom;
                    if (email !== undefined)
                        dataToUpdate.email = email;
                    if (professionalRole !== undefined)
                        dataToUpdate.professionalRole = professionalRole;
                    if (tempsPartiel !== undefined)
                        dataToUpdate.tempsPartiel = !!tempsPartiel;
                    if (pourcentageTempsPartiel !== undefined) {
                        dataToUpdate.pourcentageTempsPartiel = tempsPartiel === false ? null : (parseFloat(pourcentageTempsPartiel) || null);
                    }
                    if (joursTravaillesSemainePaire !== undefined)
                        dataToUpdate.joursTravaillesSemainePaire = joursTravaillesSemainePaire;
                    if (joursTravaillesSemaineImpaire !== undefined)
                        dataToUpdate.joursTravaillesSemaineImpaire = joursTravaillesSemaineImpaire;
                    if (dateEntree !== undefined)
                        dataToUpdate.dateEntree = dateEntree ? new Date(dateEntree) : null;
                    if (dateSortie !== undefined)
                        dataToUpdate.dateSortie = dateSortie ? new Date(dateSortie) : null;
                    if (actif !== undefined)
                        dataToUpdate.actif = !!actif;
                    if (phoneNumber !== undefined)
                        dataToUpdate.phoneNumber = phoneNumber || null;
                    if (workPattern !== undefined)
                        dataToUpdate.workPattern = workPattern;
                    if (workOnMonthType !== undefined) {
                        dataToUpdate.workOnMonthType = tempsPartiel === false ? null : workOnMonthType;
                    }
                    // Ajouter le rôle seulement si l'utilisateur est admin
                    if (role && isAdmin) { // Utiliser la variable isAdmin
                        dataToUpdate.role = role;
                    }
                    if (!password) return [3 /*break*/, 5];
                    saltRounds = 10;
                    _c = dataToUpdate;
                    return [4 /*yield*/, bcrypt.hash(password, saltRounds)];
                case 4:
                    _c.password = _h.sent();
                    if (requestingUserId === userId) {
                        dataToUpdate.mustChangePassword = false;
                    }
                    _h.label = 5;
                case 5: return [4 /*yield*/, prisma.user.update({
                        where: { id: userId },
                        data: dataToUpdate,
                        select: {
                            id: true, nom: true, prenom: true, email: true, login: true, role: true,
                            professionalRole: true, actif: true, mustChangePassword: true,
                            tempsPartiel: true, pourcentageTempsPartiel: true,
                            joursTravaillesSemainePaire: true,
                            joursTravaillesSemaineImpaire: true,
                            dateEntree: true, dateSortie: true, phoneNumber: true,
                            workPattern: true,
                            workOnMonthType: true,
                        }
                    })];
                case 6:
                    updatedUser = _h.sent();
                    return [2 /*return*/, NextResponse.json(updatedUser)];
                case 7:
                    error_2 = _h.sent();
                    console.error("Erreur PUT /api/utilisateurs/".concat(userId, ":"), error_2);
                    if (error_2 instanceof Prisma.PrismaClientKnownRequestError) {
                        if (error_2.code === 'P2002') {
                            field = 'inconnu';
                            if ((_e = (_d = error_2.meta) === null || _d === void 0 ? void 0 : _d.target) === null || _e === void 0 ? void 0 : _e.includes('email'))
                                field = 'email';
                            if ((_g = (_f = error_2.meta) === null || _f === void 0 ? void 0 : _f.target) === null || _g === void 0 ? void 0 : _g.includes('login'))
                                field = 'login';
                            return [2 /*return*/, new NextResponse(JSON.stringify({ message: "Le champ ".concat(field, " existe d\u00E9j\u00E0.") }), { status: 409 })];
                        }
                        else if (error_2.code === 'P2025') {
                            return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Utilisateur non trouvé' }), { status: 404 })];
                        }
                    }
                    else if (error_2 instanceof Prisma.PrismaClientValidationError) {
                        console.error("Erreur de validation Prisma:", error_2.message);
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Données invalides fournies.', details: error_2.message }), { status: 400 })];
                    }
                    // Autres erreurs
                    return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 })];
                case 8: return [2 /*return*/];
            }
        });
    });
}
// --- Fonction DELETE (Supprimer un utilisateur par ID) ---
export function DELETE(request_1, _a) {
    return __awaiter(this, arguments, void 0, function (request, _b) {
        var id, error_3;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    id = parseInt(params.id, 10);
                    if (isNaN(id)) {
                        return [2 /*return*/, NextResponse.json({ error: 'ID invalide' }, { status: 400 })];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, prisma.user.update({
                            where: { id: id },
                            data: { actif: false, dateSortie: new Date() },
                        })];
                case 2:
                    _c.sent();
                    return [2 /*return*/, NextResponse.json({ message: 'Utilisateur désactivé avec succès' }, { status: 200 })];
                case 3:
                    error_3 = _c.sent();
                    console.error("Erreur DELETE /api/utilisateurs/".concat(id, ":"), error_3);
                    if (error_3.code === 'P2025') { // Record to delete does not exist
                        return [2 /*return*/, NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })];
                    }
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur lors de la suppression de l\'utilisateur', details: error_3.message }, { status: 500 })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// --- Fonction POST pour le reset de mot de passe par Admin ---
export function POST(request_1, _a) {
    return __awaiter(this, arguments, void 0, function (request, _b) {
        var targetUserId, targetUser, newPassword, saltRounds, hashedPassword, error_4;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    targetUserId = parseInt(params.id, 10);
                    if (!hasRequiredRole([Role.ADMIN_TOTAL, Role.ADMIN_PARTIEL])) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 })];
                    }
                    if (isNaN(targetUserId)) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'ID utilisateur invalide' }), { status: 400 })];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { id: targetUserId },
                            select: { login: true }
                        })];
                case 2:
                    targetUser = _c.sent();
                    if (!targetUser) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Utilisateur cible non trouvé' }), { status: 404 })];
                    }
                    newPassword = targetUser.login;
                    saltRounds = 10;
                    return [4 /*yield*/, bcrypt.hash(newPassword, saltRounds)];
                case 3:
                    hashedPassword = _c.sent();
                    return [4 /*yield*/, prisma.user.update({
                            where: { id: targetUserId },
                            data: { password: hashedPassword },
                        })];
                case 4:
                    _c.sent();
                    return [2 /*return*/, new NextResponse(JSON.stringify({ message: "Mot de passe r\u00E9initialis\u00E9 \u00E0 '".concat(newPassword, "'") }), { status: 200 })];
                case 5:
                    error_4 = _c.sent();
                    console.error("Erreur POST reset-password /api/utilisateurs/".concat(targetUserId, ":"), error_4);
                    return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur lors de la réinitialisation' }), { status: 500 })];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// TODO: Ajouter GET (pour récupérer un seul utilisateur) 
