var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
// Importer Prisma Client (adapter le chemin si nécessaire)
import { prisma } from '@/lib/prisma';
// Importer les types Prisma directement
import { LeaveStatus, LeaveType as PrismaLeaveType } from '@prisma/client';
// Mapping du code (string) vers l'enum Prisma LeaveType pour la compatibilité
var mapCodeToLeaveType = function (code) {
    switch (code) {
        case 'CP': return PrismaLeaveType.ANNUAL;
        case 'RTT': return PrismaLeaveType.RECOVERY;
        case 'FORM': return PrismaLeaveType.TRAINING;
        case 'MAL': return PrismaLeaveType.SICK;
        case 'MAT': return PrismaLeaveType.MATERNITY;
        case 'CSS': return PrismaLeaveType.SPECIAL;
        case 'RECUP': return PrismaLeaveType.RECOVERY;
        case 'OTHER': return PrismaLeaveType.OTHER;
        // Garder les anciennes mappings pour rétrocompatibilité
        case 'ANNUAL': return PrismaLeaveType.ANNUAL;
        case 'RECOVERY': return PrismaLeaveType.RECOVERY;
        case 'TRAINING': return PrismaLeaveType.TRAINING;
        case 'SICK': return PrismaLeaveType.SICK;
        case 'MATERNITY': return PrismaLeaveType.MATERNITY;
        case 'SPECIAL': return PrismaLeaveType.SPECIAL;
        case 'UNPAID': return PrismaLeaveType.UNPAID;
        default: return PrismaLeaveType.OTHER; // Valeur par défaut pour les codes inconnus
    }
};
export function GET(request) {
    return __awaiter(this, void 0, void 0, function () {
        var searchParams, userId, userIdInt, leaves, adaptUserFields_1, formattedLeaves, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    searchParams = request.nextUrl.searchParams;
                    userId = searchParams.get('userId');
                    console.log("[API /api/leaves] Requ\u00EAte GET re\u00E7ue pour userId: ".concat(userId));
                    if (!userId) {
                        return [2 /*return*/, NextResponse.json({ error: 'Le paramètre userId est manquant' }, { status: 400 })];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    userIdInt = parseInt(userId, 10);
                    if (isNaN(userIdInt)) {
                        return [2 /*return*/, NextResponse.json({ error: 'Le paramètre userId doit être un nombre valide' }, { status: 400 })];
                    }
                    return [4 /*yield*/, prisma.leave.findMany({
                            where: {
                                userId: userIdInt,
                            },
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        nom: true,
                                        prenom: true,
                                    }
                                }
                            },
                            orderBy: {
                                startDate: 'desc',
                            },
                        })];
                case 2:
                    leaves = _a.sent();
                    adaptUserFields_1 = function (user) {
                        if (!user)
                            return null;
                        return __assign(__assign({}, user), { firstName: user.firstName || user.prenom, lastName: user.lastName || user.nom, prenom: user.prenom || user.firstName, nom: user.nom || user.lastName });
                    };
                    formattedLeaves = leaves
                        .map(function (leave) {
                        if (!leave.user) {
                            console.error("Utilisateur non trouv\u00E9 pour le cong\u00E9 ID: ".concat(leave.id));
                            return null; // Marquer pour filtrage
                        }
                        // Adapter les données utilisateur
                        var adaptedUser = adaptUserFields_1(leave.user);
                        // S'assurer que les valeurs de nom et prénom ne sont jamais undefined
                        var firstName = adaptedUser.firstName || adaptedUser.prenom || '(Prénom non défini)';
                        var lastName = adaptedUser.lastName || adaptedUser.nom || '(Nom non défini)';
                        // Créer l'objet formaté
                        var formattedLeave = {
                            id: String(leave.id), // Convertir l'ID en string
                            startDate: leave.startDate.toISOString(),
                            endDate: leave.endDate.toISOString(),
                            // Assurer la conversion explicite vers les types enum attendus
                            status: leave.status,
                            type: leave.type,
                            typeCode: leave.typeCode,
                            reason: leave.reason,
                            createdAt: leave.createdAt.toISOString(),
                            updatedAt: leave.updatedAt.toISOString(),
                            userId: leave.userId,
                            user: {
                                id: adaptedUser.id,
                                firstName: firstName,
                                lastName: lastName,
                                // Ajouter également les noms originaux pour compatibilité
                                prenom: firstName,
                                nom: lastName
                            }
                        };
                        return formattedLeave;
                    })
                        .filter(function (leave) { return leave !== null; });
                    return [2 /*return*/, NextResponse.json(formattedLeaves)];
                case 3:
                    error_1 = _a.sent();
                    console.error("[API /api/leaves] Erreur lors de la r\u00E9cup\u00E9ration des cong\u00E9s pour userId ".concat(userId, ":"), error_1);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur serveur lors de la récupération des congés.' }, { status: 500 })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * POST /api/leaves
 * Crée une nouvelle demande de congé.
 */
export function POST(request) {
    return __awaiter(this, void 0, void 0, function () {
        var body, userId, startDate, endDate, typeCode, reason, start, end, leaveType, userIdInt, countedDays, newLeave, adaptUserFields, adaptedUser, firstName, lastName, formattedLeave, error_2, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, request.json()];
                case 1:
                    body = _a.sent();
                    console.log('[API /leaves POST] Corps de la requête reçu:', JSON.stringify(body, null, 2));
                    userId = body.userId, startDate = body.startDate, endDate = body.endDate, typeCode = body.typeCode, reason = body.reason;
                    console.log('[API /leaves POST] Valeurs extraites:', {
                        userId: userId,
                        startDate: startDate,
                        endDate: endDate,
                        typeCode: typeCode,
                        reason: reason,
                        userIdType: typeof userId,
                        startDateType: typeof startDate,
                        endDateType: typeof endDate,
                        typeCodeType: typeof typeCode
                    });
                    // --- Validation des données --- 
                    if (!userId || !startDate || !endDate || !typeCode) {
                        console.log('[API /leaves POST] Validation échouée:', {
                            hasUserId: !!userId,
                            hasStartDate: !!startDate,
                            hasEndDate: !!endDate,
                            hasTypeCode: !!typeCode
                        });
                        return [2 /*return*/, NextResponse.json({ error: 'Données manquantes (userId, startDate, endDate, typeCode sont requis)' }, { status: 400 })];
                    }
                    start = new Date(startDate);
                    end = new Date(endDate);
                    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                        return [2 /*return*/, NextResponse.json({ error: 'Format de date invalide.' }, { status: 400 })];
                    }
                    if (end < start) {
                        return [2 /*return*/, NextResponse.json({ error: 'La date de fin ne peut être antérieure à la date de début.' }, { status: 400 })];
                    }
                    leaveType = mapCodeToLeaveType(typeCode);
                    userIdInt = parseInt(String(userId), 10);
                    if (isNaN(userIdInt)) {
                        return [2 /*return*/, NextResponse.json({ error: 'Format userId invalide.' }, { status: 400 })];
                    }
                    countedDays = 1;
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, prisma.leave.create({
                            data: {
                                userId: userIdInt,
                                startDate: start,
                                endDate: end,
                                // Utiliser le type convertit depuis mapCodeToLeaveType
                                type: leaveType,
                                typeCode: typeCode,
                                status: LeaveStatus.PENDING,
                                reason: reason !== null && reason !== void 0 ? reason : null,
                                countedDays: countedDays,
                            },
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        nom: true,
                                        prenom: true,
                                    }
                                }
                            },
                        })];
                case 3:
                    newLeave = _a.sent();
                    console.log('[API /leaves POST] Données utilisateur récupérées:', JSON.stringify({
                        userId: userIdInt,
                        userIncluded: !!newLeave.user,
                        userData: newLeave.user
                    }, null, 2));
                    adaptUserFields = function (user) {
                        if (!user)
                            return null;
                        return __assign(__assign({}, user), { firstName: user.firstName || user.prenom, lastName: user.lastName || user.nom, prenom: user.prenom || user.firstName, nom: user.nom || user.lastName });
                    };
                    adaptedUser = adaptUserFields(newLeave.user);
                    console.log('[API /leaves POST] Utilisateur adapté:', JSON.stringify(adaptedUser, null, 2));
                    firstName = (adaptedUser === null || adaptedUser === void 0 ? void 0 : adaptedUser.prenom) || (adaptedUser === null || adaptedUser === void 0 ? void 0 : adaptedUser.firstName) || '(Prénom non défini)';
                    lastName = (adaptedUser === null || adaptedUser === void 0 ? void 0 : adaptedUser.nom) || (adaptedUser === null || adaptedUser === void 0 ? void 0 : adaptedUser.lastName) || '(Nom non défini)';
                    formattedLeave = {
                        id: String(newLeave.id),
                        startDate: newLeave.startDate.toISOString(),
                        endDate: newLeave.endDate.toISOString(),
                        status: newLeave.status,
                        type: newLeave.type,
                        typeCode: newLeave.typeCode,
                        reason: newLeave.reason,
                        createdAt: newLeave.createdAt.toISOString(),
                        updatedAt: newLeave.updatedAt.toISOString(),
                        userId: newLeave.userId,
                        user: {
                            id: (adaptedUser === null || adaptedUser === void 0 ? void 0 : adaptedUser.id) || userIdInt,
                            firstName: firstName,
                            lastName: lastName,
                            // Ajouter également les noms originaux pour compatibilité complète
                            prenom: firstName,
                            nom: lastName
                        }
                    };
                    console.log('[API /leaves POST] Congé créé avec succès:', JSON.stringify(formattedLeave, null, 2));
                    return [2 /*return*/, NextResponse.json(formattedLeave, { status: 201 })]; // 201 Created
                case 4:
                    error_2 = _a.sent();
                    console.error('[API /leaves POST] Erreur lors de la création du congé:', error_2);
                    return [2 /*return*/, NextResponse.json({ error: "Erreur lors de la création du congé dans la base de données." }, { status: 500 })];
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_3 = _a.sent();
                    console.error('[API /leaves POST] Erreur générale:', error_3);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur serveur lors de la création de la demande de congé.' }, { status: 500 })];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Ajouter d'autres méthodes (PUT, DELETE) si nécessaire pour modifier/annuler
// export async function PUT(request: NextRequest) { ... } // ou /api/leaves/[id]
// export async function DELETE(request: NextRequest) { ... } // ou /api/leaves/[id] 
