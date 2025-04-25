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
// GET : Récupérer un secteur spécifique
export function GET(request, context) {
    return __awaiter(this, void 0, void 0, function () {
        var id, sectorId, tableExists, defaultSectors, defaultSector, sector, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    id = context.params.id;
                    sectorId = parseInt(id);
                    if (isNaN(sectorId)) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'ID invalide' }), { status: 400 })];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, checkIfTableExists('OperatingSector')];
                case 2:
                    tableExists = _a.sent();
                    // Si la table n'existe pas, mais qu'il s'agit d'un ID de secteur par défaut, on le renvoie
                    if (!tableExists && sectorId >= 1 && sectorId <= 5) {
                        defaultSectors = [
                            { id: 1, name: 'Hyperaseptique', colorCode: '#3B82F6', isActive: true, description: 'Salles 1-4', rules: { maxRoomsPerSupervisor: 2 } },
                            { id: 2, name: 'Secteur 5-8', colorCode: '#10B981', isActive: true, description: 'Salles 5-8 et Césarienne', rules: { maxRoomsPerSupervisor: 2 } },
                            { id: 3, name: 'Secteur 9-12B', colorCode: '#F97316', isActive: true, description: 'Salles 9-12 et 12bis', rules: { maxRoomsPerSupervisor: 2 } },
                            { id: 4, name: 'Ophtalmologie', colorCode: '#EC4899', isActive: true, description: 'Salles Ophta 1-4', rules: { maxRoomsPerSupervisor: 3 } },
                            { id: 5, name: 'Endoscopie', colorCode: '#4F46E5', isActive: true, description: 'Salles Endo 1-4', rules: { maxRoomsPerSupervisor: 2 } }
                        ];
                        defaultSector = defaultSectors.find(function (s) { return s.id === sectorId; });
                        if (defaultSector) {
                            return [2 /*return*/, NextResponse.json(defaultSector)];
                        }
                    }
                    if (!tableExists) return [3 /*break*/, 4];
                    return [4 /*yield*/, prisma.$queryRawUnsafe("SELECT * FROM \"OperatingSector\" WHERE id = $1", sectorId)];
                case 3:
                    sector = _a.sent();
                    if (Array.isArray(sector) && sector.length > 0) {
                        return [2 /*return*/, NextResponse.json(sector[0])];
                    }
                    _a.label = 4;
                case 4: return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Secteur non trouvé' }), { status: 404 })];
                case 5:
                    error_1 = _a.sent();
                    console.error("Erreur GET /api/operating-sectors/".concat(id, ":"), error_1);
                    return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 })];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// PUT : Mettre à jour un secteur spécifique
export function PUT(request, context) {
    return __awaiter(this, void 0, void 0, function () {
        var id, sectorId, body, name_1, colorCode, isActive, description, rules, tableExists, existingSector, sectorWithSameName, updatedSector, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Vérifier les permissions
                    if (!hasRequiredRole()) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 })];
                    }
                    id = context.params.id;
                    sectorId = parseInt(id);
                    if (isNaN(sectorId)) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'ID invalide' }), { status: 400 })];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 9]);
                    return [4 /*yield*/, request.json()];
                case 2:
                    body = _a.sent();
                    name_1 = body.name, colorCode = body.colorCode, isActive = body.isActive, description = body.description, rules = body.rules;
                    // Vérifications de base
                    if (!name_1 || typeof name_1 !== 'string' || name_1.trim() === '') {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Le nom du secteur est obligatoire.' }), { status: 400 })];
                    }
                    return [4 /*yield*/, checkIfTableExists('OperatingSector')];
                case 3:
                    tableExists = _a.sent();
                    if (!tableExists) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Table des secteurs non trouvée' }), { status: 404 })];
                    }
                    return [4 /*yield*/, prisma.$queryRawUnsafe("SELECT * FROM \"OperatingSector\" WHERE id = $1", sectorId)];
                case 4:
                    existingSector = _a.sent();
                    if (!Array.isArray(existingSector) || existingSector.length === 0) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Secteur non trouvé' }), { status: 404 })];
                    }
                    if (!(name_1 !== existingSector[0].name)) return [3 /*break*/, 6];
                    return [4 /*yield*/, prisma.$queryRawUnsafe("SELECT * FROM \"OperatingSector\" WHERE name = $1 AND id != $2", name_1.trim(), sectorId)];
                case 5:
                    sectorWithSameName = _a.sent();
                    if (Array.isArray(sectorWithSameName) && sectorWithSameName.length > 0) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Un autre secteur avec ce nom existe déjà.' }), { status: 409 })];
                    }
                    _a.label = 6;
                case 6: return [4 /*yield*/, prisma.$queryRawUnsafe("UPDATE \"OperatingSector\" SET \n             name = $1, \n             \"colorCode\" = $2, \n             \"isActive\" = $3, \n             description = $4, \n             rules = $5, \n             \"updatedAt\" = NOW() \n             WHERE id = $6 \n             RETURNING *", name_1.trim(), colorCode || '#000000', isActive === undefined ? true : isActive, description || '', JSON.stringify(rules || {}), sectorId)];
                case 7:
                    updatedSector = _a.sent();
                    if (Array.isArray(updatedSector) && updatedSector.length > 0) {
                        return [2 /*return*/, NextResponse.json(updatedSector[0])];
                    }
                    return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Erreur lors de la mise à jour du secteur' }), { status: 500 })];
                case 8:
                    error_2 = _a.sent();
                    console.error("Erreur PUT /api/operating-sectors/".concat(id, ":"), error_2);
                    return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 })];
                case 9: return [2 /*return*/];
            }
        });
    });
}
// DELETE : Supprimer un secteur spécifique
export function DELETE(request, context) {
    return __awaiter(this, void 0, void 0, function () {
        var headersList, userRoleString, id, sectorId, tableExists, sector, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    headersList = headers();
                    userRoleString = headersList.get('x-user-role');
                    if (userRoleString !== 'ADMIN_TOTAL') {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Accès non autorisé. Seul un administrateur total peut supprimer un secteur.' }), { status: 403 })];
                    }
                    id = context.params.id;
                    sectorId = parseInt(id);
                    if (isNaN(sectorId)) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'ID invalide' }), { status: 400 })];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, checkIfTableExists('OperatingSector')];
                case 2:
                    tableExists = _a.sent();
                    if (!tableExists) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Table des secteurs non trouvée' }), { status: 404 })];
                    }
                    return [4 /*yield*/, prisma.$queryRawUnsafe("SELECT * FROM \"OperatingSector\" WHERE id = $1", sectorId)];
                case 3:
                    sector = _a.sent();
                    if (!Array.isArray(sector) || sector.length === 0) {
                        return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Secteur non trouvé' }), { status: 404 })];
                    }
                    // TODO: Vérifier si le secteur est utilisé dans des salles existantes
                    // Si c'est le cas, on pourrait renvoyer une erreur ou proposer une solution alternative
                    // Supprimer le secteur
                    return [4 /*yield*/, prisma.$queryRawUnsafe("DELETE FROM \"OperatingSector\" WHERE id = $1", sectorId)];
                case 4:
                    // TODO: Vérifier si le secteur est utilisé dans des salles existantes
                    // Si c'est le cas, on pourrait renvoyer une erreur ou proposer une solution alternative
                    // Supprimer le secteur
                    _a.sent();
                    return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Secteur supprimé avec succès' }), { status: 200 })];
                case 5:
                    error_3 = _a.sent();
                    console.error("Erreur DELETE /api/operating-sectors/".concat(id, ":"), error_3);
                    return [2 /*return*/, new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 })];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Helper pour vérifier si une table existe dans la base de données
function checkIfTableExists(tableName) {
    return __awaiter(this, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    // On essaye de récupérer un enregistrement, s'il y a une erreur PrismaClientKnownRequestError
                    // avec le code P2010, cela signifie que la table n'existe pas
                    return [4 /*yield*/, prisma.$queryRawUnsafe("SELECT * FROM \"".concat(tableName, "\" LIMIT 1"))];
                case 1:
                    // On essaye de récupérer un enregistrement, s'il y a une erreur PrismaClientKnownRequestError
                    // avec le code P2010, cela signifie que la table n'existe pas
                    _a.sent();
                    return [2 /*return*/, true];
                case 2:
                    error_4 = _a.sent();
                    if (error_4.code === 'P2010') {
                        return [2 /*return*/, false];
                    }
                    // Une autre erreur s'est produite
                    throw error_4;
                case 3: return [2 /*return*/];
            }
        });
    });
}
