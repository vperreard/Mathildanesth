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
    console.log("[Helper hasRequiredRole] Header 'x-user-role': ".concat(userRoleString));
    return !!userRoleString && ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(userRoleString);
};
// --- GET : Lister tous les chirurgiens ---
export function GET(request) {
    return __awaiter(this, void 0, void 0, function () {
        var receivedRole, surgeons, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    receivedRole = headers().get('x-user-role');
                    console.log("[GET /api/chirurgiens] R\u00F4le re\u00E7u dans l'API : ".concat(receivedRole));
                    if (!hasRequiredRole()) {
                        console.log("[GET /api/chirurgiens] Acc\u00E8s refus\u00E9 (403) pour le r\u00F4le : ".concat(receivedRole));
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 })];
                    }
                    console.log("[GET /api/chirurgiens] Acc\u00E8s autoris\u00E9 pour le r\u00F4le : ".concat(receivedRole));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, prisma.surgeon.findMany({
                            orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
                            // Inclure les spécialités liées
                            include: {
                                specialties: {
                                    select: { id: true, name: true } // Sélectionner seulement id et nom de la spécialité
                                },
                                // Optionnel: inclure l'utilisateur lié si besoin
                                // user: { select: { id: true, login: true } }
                            }
                        })];
                case 2:
                    surgeons = _a.sent();
                    return [2 /*return*/, NextResponse.json(surgeons)];
                case 3:
                    error_1 = _a.sent();
                    console.error("Erreur GET /api/chirurgiens:", error_1);
                    return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// --- POST : Créer un nouveau chirurgien ---
export function POST(request) {
    return __awaiter(this, void 0, void 0, function () {
        var body, nom, prenom, status_1, userId, specialtyIds, email, phoneNumber, newSurgeon, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!hasRequiredRole()) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 })];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, request.json()];
                case 2:
                    body = _a.sent();
                    nom = body.nom, prenom = body.prenom, status_1 = body.status, userId = body.userId, specialtyIds = body.specialtyIds, email = body.email, phoneNumber = body.phoneNumber;
                    // Validation basique
                    if (!nom || !prenom) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Nom et prénom sont obligatoires.' }), { status: 400 })];
                    }
                    if (specialtyIds && (!Array.isArray(specialtyIds) || !specialtyIds.every(function (id) { return Number.isInteger(id); }))) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Le format des spécialités est invalide (doit être un tableau d\'IDs numériques).' }), { status: 400 })];
                    }
                    return [4 /*yield*/, prisma.surgeon.create({
                            data: {
                                nom: nom,
                                prenom: prenom,
                                status: status_1 || 'ACTIF',
                                userId: userId && !isNaN(parseInt(userId)) ? parseInt(userId) : null,
                                email: email || null,
                                phoneNumber: phoneNumber || null,
                                specialties: specialtyIds && specialtyIds.length > 0
                                    ? { connect: specialtyIds.map(function (id) { return ({ id: id }); }) }
                                    : undefined,
                            },
                            include: {
                                specialties: { select: { id: true, name: true } }
                            }
                        })];
                case 3:
                    newSurgeon = _a.sent();
                    return [2 /*return*/, new NextResponse(JSON.stringify(newSurgeon), { status: 201 })];
                case 4:
                    error_2 = _a.sent();
                    console.error("Erreur POST /api/chirurgiens:", error_2);
                    // Gérer les erreurs potentielles (ex: contrainte unique si on en ajoute)
                    return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 })];
                case 5: return [2 /*return*/];
            }
        });
    });
}
