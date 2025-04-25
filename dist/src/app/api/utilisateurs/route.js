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
import { prisma } from '@/lib/prisma'; // Import nommé
import bcrypt from 'bcrypt';
import { checkUserRole } from '@/lib/auth-utils';
// Importer les types d'erreurs spécifiques
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
// Définir les enums localement pour éviter les problèmes d'import
var Role;
(function (Role) {
    Role["ADMIN_TOTAL"] = "ADMIN_TOTAL";
    Role["ADMIN_PARTIEL"] = "ADMIN_PARTIEL";
    Role["USER"] = "USER";
})(Role || (Role = {}));
var ProfessionalRole;
(function (ProfessionalRole) {
    ProfessionalRole["MAR"] = "MAR";
    ProfessionalRole["IADE"] = "IADE";
    ProfessionalRole["SECRETAIRE"] = "SECRETAIRE";
})(ProfessionalRole || (ProfessionalRole = {}));
// const prisma = new PrismaClient(); // Supprimé
// --- Fonction GET ---
export function GET() {
    return __awaiter(this, void 0, void 0, function () {
        var users, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    return [4 /*yield*/, prisma.user.findMany({
                            orderBy: [
                                { nom: 'asc' },
                                { prenom: 'asc' },
                            ],
                            // Exclure le champ password des résultats par défaut
                            select: {
                                id: true,
                                nom: true,
                                prenom: true,
                                login: true,
                                email: true,
                                role: true,
                                professionalRole: true,
                                tempsPartiel: true,
                                pourcentageTempsPartiel: true,
                                dateEntree: true,
                                dateSortie: true,
                                actif: true,
                                createdAt: true,
                                updatedAt: true,
                            }
                        })];
                case 1:
                    users = _a.sent();
                    return [2 /*return*/, NextResponse.json(users)];
                case 2:
                    error_1 = _a.sent();
                    console.error("Erreur GET /api/utilisateurs:", error_1);
                    return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 })];
                case 3: return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// --- Fonction POST ---
export function POST(request) {
    return __awaiter(this, void 0, void 0, function () {
        var authCheck, body, nom, prenom, email, role, professionalRole, tempsPartiel, pourcentageTempsPartiel, joursTravaillesSemainePaire, joursTravaillesSemaineImpaire, dateEntree, dateSortie, actif, password, phoneNumber, alias, login, saltRounds, hashedPassword, newUser, error_2, target, message;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("Requête POST /api/utilisateurs reçue"); // Log requête reçue
                    return [4 /*yield*/, checkUserRole(['ADMIN_TOTAL', 'ADMIN_PARTIEL'])];
                case 1:
                    authCheck = _b.sent();
                    if (!authCheck.hasRequiredRole) {
                        console.log("Vérification d'autorisation échouée:", authCheck.error);
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Accès non autorisé', error: authCheck.error }), { status: 403 })];
                    }
                    console.log("Vérification d'autorisation réussie pour utilisateur:", authCheck.user.login);
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 6, , 7]);
                    return [4 /*yield*/, request.json()];
                case 3:
                    body = _b.sent();
                    nom = body.nom, prenom = body.prenom, email = body.email, role = body.role, professionalRole = body.professionalRole, tempsPartiel = body.tempsPartiel, pourcentageTempsPartiel = body.pourcentageTempsPartiel, joursTravaillesSemainePaire = body.joursTravaillesSemainePaire, joursTravaillesSemaineImpaire = body.joursTravaillesSemaineImpaire, dateEntree = body.dateEntree, dateSortie = body.dateSortie, actif = body.actif, password = body.password, phoneNumber = body.phoneNumber, alias = body.alias;
                    // Validation basique
                    if (!nom || !prenom || !email || !role || !professionalRole || !password) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Nom, prénom, email, rôle, rôle pro et mot de passe sont obligatoires.' }), { status: 400 })];
                    }
                    if (!Object.values(Role).includes(role) || !Object.values(ProfessionalRole).includes(professionalRole)) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Rôle ou Rôle Professionnel invalide' }), { status: 400 })];
                    }
                    if (tempsPartiel && (pourcentageTempsPartiel === null || pourcentageTempsPartiel === undefined)) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Le pourcentage est requis si temps partiel est coché.' }), { status: 400 })];
                    }
                    login = (prenom.charAt(0) + nom).toLowerCase().replace(/\s+/g, '');
                    saltRounds = 10;
                    return [4 /*yield*/, bcrypt.hash(password, saltRounds)];
                case 4:
                    hashedPassword = _b.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                nom: nom,
                                prenom: prenom,
                                login: login,
                                email: email,
                                alias: alias || null,
                                phoneNumber: phoneNumber || null,
                                password: hashedPassword,
                                role: role,
                                professionalRole: professionalRole,
                                tempsPartiel: tempsPartiel !== null && tempsPartiel !== void 0 ? tempsPartiel : false,
                                pourcentageTempsPartiel: pourcentageTempsPartiel ? parseFloat(pourcentageTempsPartiel) : null,
                                joursTravaillesSemainePaire: joursTravaillesSemainePaire || [],
                                joursTravaillesSemaineImpaire: joursTravaillesSemaineImpaire || [],
                                dateEntree: dateEntree ? new Date(dateEntree) : null,
                                dateSortie: dateSortie ? new Date(dateSortie) : null,
                                actif: actif !== undefined ? !!actif : true,
                                mustChangePassword: true,
                            },
                            select: {
                                id: true,
                                nom: true,
                                prenom: true,
                                login: true,
                                email: true,
                                alias: true,
                                phoneNumber: true,
                                role: true,
                                professionalRole: true,
                                tempsPartiel: true,
                                pourcentageTempsPartiel: true,
                                joursTravaillesSemainePaire: true,
                                joursTravaillesSemaineImpaire: true,
                                dateEntree: true,
                                dateSortie: true,
                                actif: true,
                                createdAt: true,
                                updatedAt: true,
                                mustChangePassword: true,
                            }
                        })];
                case 5:
                    newUser = _b.sent();
                    return [2 /*return*/, new NextResponse(JSON.stringify(newUser), { status: 201 })];
                case 6:
                    error_2 = _b.sent();
                    console.error("Erreur POST /api/utilisateurs:", error_2);
                    // Utiliser les types importés directement
                    if (error_2 instanceof PrismaClientValidationError) {
                        console.error("Erreur de validation Prisma:", error_2.message);
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Données invalides fournies.', details: error_2.message }), { status: 400 })];
                    }
                    if (error_2 instanceof PrismaClientKnownRequestError && error_2.code === 'P2002') {
                        target = (_a = error_2.meta) === null || _a === void 0 ? void 0 : _a.target;
                        message = 'Erreur de contrainte unique.';
                        if (target === null || target === void 0 ? void 0 : target.includes('email'))
                            message = 'Cet email est déjà utilisé';
                        if (target === null || target === void 0 ? void 0 : target.includes('login'))
                            message = 'Ce login est déjà utilisé';
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: message }), { status: 409 })];
                    }
                    // Autres erreurs
                    return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 })];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// TODO: Ajouter les fonctions PUT, DELETE 
