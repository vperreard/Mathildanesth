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
// --- GET : Lister toutes les spécialités ---
export function GET() {
    return __awaiter(this, void 0, void 0, function () {
        var specialties, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, prisma.specialty.findMany({
                            orderBy: {
                                name: 'asc' // Trier par nom pour la liste déroulante
                            }
                        })];
                case 1:
                    specialties = _a.sent();
                    return [2 /*return*/, NextResponse.json(specialties)];
                case 2:
                    error_1 = _a.sent();
                    console.error("Erreur GET /api/specialties:", error_1);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur interne du serveur lors de la récupération des spécialités.' }, { status: 500 })];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// --- POST : Créer une nouvelle spécialité ---
export function POST(request) {
    return __awaiter(this, void 0, void 0, function () {
        var body, name_1, isPediatric, formattedName, newSpecialty, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Seul un admin peut créer
                    if (!hasRequiredRole()) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 })];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, request.json()];
                case 2:
                    body = _a.sent();
                    name_1 = body.name, isPediatric = body.isPediatric;
                    if (!name_1 || typeof name_1 !== 'string' || name_1.trim() === '') {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Le nom de la spécialité est obligatoire.' }), { status: 400 })];
                    }
                    formattedName = name_1.trim();
                    return [4 /*yield*/, prisma.specialty.create({
                            data: {
                                name: formattedName,
                                isPediatric: typeof isPediatric === 'boolean' ? isPediatric : false,
                            },
                        })];
                case 3:
                    newSpecialty = _a.sent();
                    return [2 /*return*/, new NextResponse(JSON.stringify(newSpecialty), { status: 201 })];
                case 4:
                    error_2 = _a.sent();
                    if (error_2.code === 'P2002') { // Contrainte unique sur le nom
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Ce nom de spécialité existe déjà.' }), { status: 409 })];
                    }
                    console.error("Erreur POST /api/specialties:", error_2);
                    return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 })];
                case 5: return [2 /*return*/];
            }
        });
    });
}
