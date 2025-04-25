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
import * as jose from 'jose';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
var prisma = new PrismaClient();
// Configuration JWT existante
var JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET variable d\'environnement manquante!');
}
var secretKey = new TextEncoder().encode(JWT_SECRET);
// Fonction simple pour vérifier le mot de passe
function comparePasswords(plainPassword, hashedPassword) {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, bcrypt.compare(plainPassword, hashedPassword)];
                case 1: 
                // Si bcrypt est utilisé, sinon utiliser votre logique de comparaison
                return [2 /*return*/, _a.sent()];
                case 2:
                    error_1 = _a.sent();
                    console.error("Erreur lors de la comparaison des mots de passe:", error_1);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Configuration NextAuth
export var authOptions = {
    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 24 heures
    },
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                login: { label: "Login", type: "text" },
                password: { label: "Mot de passe", type: "password" }
            },
            authorize: function (credentials) {
                return __awaiter(this, void 0, void 0, function () {
                    var user, isPasswordValid, error_2;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!(credentials === null || credentials === void 0 ? void 0 : credentials.login) || !(credentials === null || credentials === void 0 ? void 0 : credentials.password)) {
                                    return [2 /*return*/, null];
                                }
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 4, , 5]);
                                return [4 /*yield*/, prisma.user.findUnique({
                                        where: { login: credentials.login }
                                    })];
                            case 2:
                                user = _a.sent();
                                if (!user || !user.password) {
                                    return [2 /*return*/, null];
                                }
                                return [4 /*yield*/, comparePasswords(credentials.password, user.password)];
                            case 3:
                                isPasswordValid = _a.sent();
                                if (!isPasswordValid) {
                                    return [2 /*return*/, null];
                                }
                                return [2 /*return*/, {
                                        id: user.id.toString(),
                                        name: "".concat(user.prenom, " ").concat(user.nom),
                                        email: user.email,
                                        // @ts-ignore - ajouter des champs personnalisés
                                        role: user.role
                                    }];
                            case 4:
                                error_2 = _a.sent();
                                console.error("Erreur d'authentification:", error_2);
                                return [2 /*return*/, null];
                            case 5: return [2 /*return*/];
                        }
                    });
                });
            }
        })
    ],
    callbacks: {
        jwt: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var token = _b.token, user = _b.user;
                return __generator(this, function (_c) {
                    if (user) {
                        token.userId = parseInt(user.id);
                        token.role = user.role;
                    }
                    return [2 /*return*/, token];
                });
            });
        },
        session: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var session = _b.session, token = _b.token;
                return __generator(this, function (_c) {
                    if (session.user && token) {
                        session.user.id = token.userId;
                        session.user.role = token.role;
                    }
                    return [2 /*return*/, session];
                });
            });
        }
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    secret: JWT_SECRET,
};
/**
 * Crée un token JWT signé.
 * @param payload - Les données à inclure dans le token.
 * @param expiresIn - La durée de validité (ex: '2h', '7d'). Défaut: '1h'.
 * @returns Le token JWT signé.
 */
export function createToken(payload_1) {
    return __awaiter(this, arguments, void 0, function (payload, expiresIn) {
        var alg;
        if (expiresIn === void 0) { expiresIn = '1h'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    alg = 'HS256';
                    return [4 /*yield*/, new jose.SignJWT(__assign({}, payload))
                            .setProtectedHeader({ alg: alg })
                            .setIssuedAt() // Date d'émission
                            .setExpirationTime(expiresIn) // Date d'expiration
                            // .setSubject(String(payload.userId)) // Sujet (optionnel)
                            // .setIssuer('urn:example:issuer') // Émetteur (optionnel)
                            // .setAudience('urn:example:audience') // Audience (optionnel)
                            .sign(secretKey)];
                case 1: // Algorithme de signature
                return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/**
 * Vérifie un token JWT et retourne le payload décodé.
 * @param token - Le token JWT à vérifier.
 * @returns Le payload du token.
 * @throws {Error} Si le token est invalide, expiré ou malformé.
 */
export function verifyToken(token) {
    return __awaiter(this, void 0, void 0, function () {
        var alg, payload, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    alg = 'HS256';
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, jose.jwtVerify(token, secretKey, {
                            algorithms: [alg],
                            // issuer: 'urn:example:issuer', // Optionnel: vérifier l'émetteur
                            // audience: 'urn:example:audience', // Optionnel: vérifier l'audience
                        })];
                case 2:
                    payload = (_a.sent()).payload;
                    // Vérifier si le payload a la structure attendue (TokenPayload)
                    if (typeof payload.userId !== 'number' || typeof payload.login !== 'string' || typeof payload.role !== 'string') {
                        throw new Error('Payload du token invalide');
                    }
                    return [2 /*return*/, payload];
                case 3:
                    error_3 = _a.sent();
                    // Gérer les erreurs spécifiques de jose (ex: JWTExpired, JWTInvalid)
                    console.error("Erreur de vérification du token:", error_3.code || error_3.message);
                    if (error_3 instanceof jose.errors.JWTExpired) {
                        throw new Error('Token expiré');
                    }
                    throw new Error('Token invalide ou malformé');
                case 4: return [2 /*return*/];
            }
        });
    });
}
