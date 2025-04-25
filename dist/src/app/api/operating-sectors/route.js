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
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
var prisma = new PrismaClient();
// GET tous les secteurs
export function GET() {
    return __awaiter(this, void 0, void 0, function () {
        var session, sectors, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, getServerSession(authOptions)];
                case 1:
                    session = _a.sent();
                    if (!session || !session.user) {
                        return [2 /*return*/, NextResponse.json({ error: 'Non autorisé' }, { status: 401 })];
                    }
                    return [4 /*yield*/, prisma.operatingSector.findMany({
                            orderBy: {
                                name: 'asc',
                            },
                        })];
                case 2:
                    sectors = _a.sent();
                    return [2 /*return*/, NextResponse.json(sectors)];
                case 3:
                    error_1 = _a.sent();
                    console.error('Erreur lors de la récupération des secteurs:', error_1);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur lors de la récupération des secteurs' }, { status: 500 })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// POST pour créer un nouveau secteur
export function POST(request) {
    return __awaiter(this, void 0, void 0, function () {
        var session, data, newSector, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, getServerSession(authOptions)];
                case 1:
                    session = _a.sent();
                    if (!session || !session.user) {
                        return [2 /*return*/, NextResponse.json({ error: 'Non autorisé' }, { status: 401 })];
                    }
                    return [4 /*yield*/, request.json()];
                case 2:
                    data = _a.sent();
                    // Validation des données
                    if (!data.name) {
                        return [2 /*return*/, NextResponse.json({ error: 'Le nom du secteur est requis' }, { status: 400 })];
                    }
                    return [4 /*yield*/, prisma.operatingSector.create({
                            data: {
                                name: data.name,
                                colorCode: data.colorCode || '#000000',
                                isActive: data.isActive !== undefined ? data.isActive : true,
                                description: data.description || '',
                                maxRoomsPerSupervisor: data.maxRoomsPerSupervisor || 1,
                            },
                        })];
                case 3:
                    newSector = _a.sent();
                    return [2 /*return*/, NextResponse.json(newSector, { status: 201 })];
                case 4:
                    error_2 = _a.sent();
                    console.error('Erreur lors de la création du secteur:', error_2);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur lors de la création du secteur' }, { status: 500 })];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// PUT pour mettre à jour un secteur existant
export function PUT(request) {
    return __awaiter(this, void 0, void 0, function () {
        var session, data, updatedSector, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, getServerSession(authOptions)];
                case 1:
                    session = _a.sent();
                    if (!session || !session.user) {
                        return [2 /*return*/, NextResponse.json({ error: 'Non autorisé' }, { status: 401 })];
                    }
                    return [4 /*yield*/, request.json()];
                case 2:
                    data = _a.sent();
                    if (!data.id) {
                        return [2 /*return*/, NextResponse.json({ error: 'ID du secteur requis' }, { status: 400 })];
                    }
                    return [4 /*yield*/, prisma.operatingSector.update({
                            where: { id: data.id },
                            data: {
                                name: data.name,
                                colorCode: data.colorCode,
                                isActive: data.isActive,
                                description: data.description,
                                maxRoomsPerSupervisor: data.maxRoomsPerSupervisor,
                            },
                        })];
                case 3:
                    updatedSector = _a.sent();
                    return [2 /*return*/, NextResponse.json(updatedSector)];
                case 4:
                    error_3 = _a.sent();
                    console.error('Erreur lors de la mise à jour du secteur:', error_3);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur lors de la mise à jour du secteur' }, { status: 500 })];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// DELETE pour supprimer un secteur
export function DELETE(request) {
    return __awaiter(this, void 0, void 0, function () {
        var session, url, id, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, getServerSession(authOptions)];
                case 1:
                    session = _a.sent();
                    if (!session || !session.user) {
                        return [2 /*return*/, NextResponse.json({ error: 'Non autorisé' }, { status: 401 })];
                    }
                    url = new URL(request.url);
                    id = url.searchParams.get('id');
                    if (!id) {
                        return [2 /*return*/, NextResponse.json({ error: 'ID du secteur requis' }, { status: 400 })];
                    }
                    return [4 /*yield*/, prisma.operatingSector.delete({
                            where: { id: id },
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, NextResponse.json({ message: 'Secteur supprimé avec succès' })];
                case 3:
                    error_4 = _a.sent();
                    console.error('Erreur lors de la suppression du secteur:', error_4);
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur lors de la suppression du secteur' }, { status: 500 })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
