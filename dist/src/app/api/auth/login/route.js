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
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { createToken } from '@/lib/auth';
import { cookies } from 'next/headers';
export function POST(request) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, login, password, user, passwordMatch, logError_1, token, e_1, cookieStore, _, userWithoutPassword, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 12, , 13]);
                    return [4 /*yield*/, request.json()];
                case 1:
                    _a = _b.sent(), login = _a.login, password = _a.password;
                    console.log("DEBUG: DATABASE_URL =", process.env.DATABASE_URL);
                    console.log("DEBUG: JWT_SECRET =", process.env.JWT_SECRET);
                    console.log("DEBUG: login API called for login =", login);
                    if (!login || !password) {
                        return [2 /*return*/, NextResponse.json({ error: 'Login et mot de passe requis' }, { status: 400 })];
                    }
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { login: login },
                        })];
                case 2:
                    user = _b.sent();
                    if (!user) {
                        console.log("DEBUG: Utilisateur non trouv\u00E9 pour login: ".concat(login));
                        return [2 /*return*/, NextResponse.json({ error: 'Login ou mot de passe incorrect' }, { status: 401 })];
                    }
                    return [4 /*yield*/, bcrypt.compare(password, user.password)];
                case 3:
                    passwordMatch = _b.sent();
                    if (!passwordMatch) {
                        console.log("DEBUG: Mot de passe incorrect pour login: ".concat(login));
                        return [2 /*return*/, NextResponse.json({ error: 'Login ou mot de passe incorrect' }, { status: 401 })];
                    }
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, prisma.loginLog.create({
                            data: {
                                userId: user.id,
                                // timestamp est ajouté automatiquement par @default(now())
                            }
                        })];
                case 5:
                    _b.sent();
                    console.log("Login successful and logged for user ID: ".concat(user.id));
                    return [3 /*break*/, 7];
                case 6:
                    logError_1 = _b.sent();
                    console.error("Failed to log login for user ID: ".concat(user.id), logError_1);
                    return [3 /*break*/, 7];
                case 7:
                    token = void 0;
                    _b.label = 8;
                case 8:
                    _b.trys.push([8, 10, , 11]);
                    console.log("DEBUG: Création du token JWT avec payload:", { userId: user.id, login: user.login, role: user.role });
                    return [4 /*yield*/, createToken({ userId: user.id, login: user.login, role: user.role })];
                case 9:
                    token = _b.sent();
                    console.log("DEBUG: Token créé avec succès");
                    return [3 /*break*/, 11];
                case 10:
                    e_1 = _b.sent();
                    console.error("DEBUG: Erreur lors de la création du token JWT:", e_1);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur interne du serveur lors de la création du token' }, { status: 500 })];
                case 11:
                    // Définir le cookie HTTPOnly
                    try {
                        cookieStore = cookies();
                        cookieStore.set('auth_token', token, {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            maxAge: 60 * 60 * 24 * 7, // 7 jours
                            path: '/',
                            sameSite: 'lax',
                        });
                        console.log("DEBUG: Cookie auth_token défini avec succès");
                    }
                    catch (cookieError) {
                        console.error("DEBUG: Erreur lors de la définition du cookie:", cookieError);
                        return [2 /*return*/, NextResponse.json({ error: 'Erreur lors de la définition du cookie d\'authentification' }, { status: 500 })];
                    }
                    _ = user.password, userWithoutPassword = __rest(user, ["password"]);
                    console.log("Login API: Renvoi des données utilisateur:", userWithoutPassword);
                    return [2 /*return*/, NextResponse.json({ user: userWithoutPassword })];
                case 12:
                    error_1 = _b.sent();
                    console.error("Erreur POST /api/auth/login:", error_1);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })];
                case 13: return [2 /*return*/];
            }
        });
    });
}
