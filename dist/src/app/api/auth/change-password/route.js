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
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { headers } from 'next/headers'; // Pour récupérer l'ID utilisateur depuis le middleware
// const prisma = new PrismaClient(); // Supprimé
export function PUT(request) {
    return __awaiter(this, void 0, void 0, function () {
        var requestHeaders, userIdString, userId, _a, currentPassword, newPassword, user, passwordMatch, saltRounds, hashedNewPassword, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("--- Requête PUT /api/auth/change-password reçue ---");
                    requestHeaders = headers();
                    userIdString = requestHeaders.get('x-user-id');
                    console.log("Header x-user-id re\u00E7u: ".concat(userIdString));
                    if (!userIdString) {
                        console.log("Accès refusé: Header x-user-id manquant.");
                        return [2 /*return*/, NextResponse.json({ error: 'Non authentifié ou ID utilisateur manquant' }, { status: 401 })];
                    }
                    userId = parseInt(userIdString, 10);
                    if (isNaN(userId)) {
                        console.log("Erreur: ID utilisateur invalide apr\u00E8s parsing: ".concat(userIdString));
                        return [2 /*return*/, NextResponse.json({ error: 'ID utilisateur invalide' }, { status: 400 })];
                    }
                    console.log("ID utilisateur pars\u00E9: ".concat(userId));
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 7, , 8]);
                    return [4 /*yield*/, request.json()];
                case 2:
                    _a = _b.sent(), currentPassword = _a.currentPassword, newPassword = _a.newPassword;
                    console.log("Tentative de changement pour userId: ".concat(userId));
                    if (!currentPassword || !newPassword) {
                        return [2 /*return*/, NextResponse.json({ error: 'Mot de passe actuel et nouveau requis' }, { status: 400 })];
                    }
                    if (newPassword.length < 6) {
                        return [2 /*return*/, NextResponse.json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' }, { status: 400 })];
                    }
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { id: userId }, // Utiliser l'ID parsé
                        })];
                case 3:
                    user = _b.sent();
                    if (!user) {
                        console.log("Erreur: Utilisateur non trouv\u00E9 pour ID: ".concat(userId));
                        return [2 /*return*/, NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })];
                    }
                    console.log("Utilisateur trouv\u00E9: ".concat(user.login, " (ID: ").concat(user.id, ")"));
                    // Vérifier le mot de passe actuel
                    console.log("Comparaison du mot de passe actuel...");
                    return [4 /*yield*/, bcrypt.compare(currentPassword, user.password)];
                case 4:
                    passwordMatch = _b.sent();
                    console.log("R\u00E9sultat bcrypt.compare: ".concat(passwordMatch)); // Log crucial
                    if (!passwordMatch) {
                        console.log("Acc\u00E8s refus\u00E9: Mot de passe actuel incorrect pour userId: ".concat(userId));
                        return [2 /*return*/, NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 401 })]; // 401 Unauthorized est plus approprié que 403 ici
                    }
                    saltRounds = 10;
                    return [4 /*yield*/, bcrypt.hash(newPassword, saltRounds)];
                case 5:
                    hashedNewPassword = _b.sent();
                    // Mettre à jour le mot de passe et le flag dans la base de données
                    return [4 /*yield*/, prisma.user.update({
                            where: { id: user.id },
                            data: {
                                password: hashedNewPassword,
                                mustChangePassword: false // Mettre le flag à false après changement réussi
                            },
                        })];
                case 6:
                    // Mettre à jour le mot de passe et le flag dans la base de données
                    _b.sent();
                    return [2 /*return*/, NextResponse.json({ message: 'Mot de passe mis à jour avec succès' })];
                case 7:
                    error_1 = _b.sent();
                    console.error("Erreur PUT /api/auth/change-password:", error_1);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })];
                case 8: return [2 /*return*/];
            }
        });
    });
}
