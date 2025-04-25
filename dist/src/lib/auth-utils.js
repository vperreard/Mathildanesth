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
import * as jose from 'jose';
import { cookies } from 'next/headers';
// Fonction pour vérifier le token JWT directement dans une route API
export function verifyAuthToken(req) {
    return __awaiter(this, void 0, void 0, function () {
        var cookieStore, token, JWT_SECRET, secret, payload, PrismaClient, prisma_1, user, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    cookieStore = cookies();
                    token = (_a = cookieStore.get('auth_token')) === null || _a === void 0 ? void 0 : _a.value;
                    if (!token) {
                        return [2 /*return*/, {
                                authenticated: false,
                                error: 'Token non trouvé'
                            }];
                    }
                    JWT_SECRET = process.env.JWT_SECRET;
                    if (!JWT_SECRET) {
                        console.error('JWT_SECRET manquant dans les variables d\'environnement');
                        return [2 /*return*/, {
                                authenticated: false,
                                error: 'Configuration serveur incorrecte'
                            }];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, , 7]);
                    secret = new TextEncoder().encode(JWT_SECRET);
                    return [4 /*yield*/, jose.jwtVerify(token, secret)];
                case 2:
                    payload = (_b.sent()).payload;
                    return [4 /*yield*/, import('@prisma/client')];
                case 3:
                    PrismaClient = (_b.sent()).PrismaClient;
                    prisma_1 = new PrismaClient();
                    return [4 /*yield*/, prisma_1.user.findUnique({
                            where: { id: payload.userId }
                        })];
                case 4:
                    user = _b.sent();
                    return [4 /*yield*/, prisma_1.$disconnect()];
                case 5:
                    _b.sent();
                    if (!user) {
                        return [2 /*return*/, {
                                authenticated: false,
                                error: 'Utilisateur non trouvé'
                            }];
                    }
                    return [2 /*return*/, {
                            authenticated: true,
                            user: {
                                id: user.id,
                                login: user.login,
                                role: user.role,
                                prenom: user.prenom,
                                nom: user.nom,
                                email: user.email
                            }
                        }];
                case 6:
                    error_1 = _b.sent();
                    console.error('Erreur de vérification du token:', error_1);
                    return [2 /*return*/, {
                            authenticated: false,
                            error: 'Token invalide ou expiré'
                        }];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Fonction pour vérifier si l'utilisateur a l'un des rôles requis
export function checkUserRole(allowedRoles) {
    return __awaiter(this, void 0, void 0, function () {
        var authResult, userRole, hasRole;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, verifyAuthToken()];
                case 1:
                    authResult = _a.sent();
                    if (!authResult.authenticated || !authResult.user) {
                        return [2 /*return*/, {
                                hasRequiredRole: false,
                                error: authResult.error || 'Utilisateur non authentifié'
                            }];
                    }
                    userRole = authResult.user.role;
                    hasRole = allowedRoles.includes(userRole);
                    return [2 /*return*/, {
                            hasRequiredRole: hasRole,
                            user: authResult.user,
                            error: hasRole ? null : 'Accès non autorisé pour ce rôle'
                        }];
            }
        });
    });
}
