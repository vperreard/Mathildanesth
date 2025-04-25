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
import { PrismaClient, Prisma } from '@prisma/client';
import { headers } from 'next/headers';
var prisma = new PrismaClient();
// Fonction utilitaire partagée (identique à l'autre fichier)
function parseRules(rulesJson) {
    var defaultRules = { maxRoomsPerSupervisor: 2 };
    if (typeof rulesJson === 'object' && rulesJson !== null && 'maxRoomsPerSupervisor' in rulesJson && typeof rulesJson.maxRoomsPerSupervisor === 'number') {
        return { maxRoomsPerSupervisor: rulesJson.maxRoomsPerSupervisor };
    }
    if (typeof rulesJson === 'string') {
        try {
            var parsed = JSON.parse(rulesJson);
            if (typeof parsed === 'object' && parsed !== null && 'maxRoomsPerSupervisor' in parsed && typeof parsed.maxRoomsPerSupervisor === 'number') {
                return { maxRoomsPerSupervisor: parsed.maxRoomsPerSupervisor };
            }
        }
        catch (e) {
            console.warn("Failed to parse rules JSON string:", rulesJson, e);
        }
    }
    console.warn("Invalid or missing rules JSON, returning default:", rulesJson);
    return defaultRules;
}
// Fonction utilitaire pour l'authentification (identique à l'autre fichier)
function checkAuth(requestHeaders) {
    var userId = requestHeaders.get('x-user-id');
    var userRole = requestHeaders.get('x-user-role');
    if (!userId || !userRole) {
        return null;
    }
    return { userId: userId, userRole: userRole };
}
// --- GET /api/sectors/[id] (Prisma - JSON Rules) ---
export function GET(request_1, _a) {
    return __awaiter(this, arguments, void 0, function (request, _b) {
        var requestHeaders, auth, id, sector, parsedRules, responseData, error_1;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log("\n--- GET /api/sectors/".concat(params.id, " START (Prisma - JSON Rules) ---"));
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    requestHeaders = headers();
                    auth = checkAuth(requestHeaders);
                    if (!auth) {
                        console.error("GET /api/sectors/".concat(params.id, ": Unauthorized (Middleware headers missing)"));
                        return [2 /*return*/, NextResponse.json({ error: 'Non autorisé' }, { status: 401 })];
                    }
                    console.log("GET /api/sectors/".concat(params.id, ": Auth check passed (Middleware)! User ID: ").concat(auth.userId, ", Role: ").concat(auth.userRole));
                    id = parseInt(params.id);
                    if (isNaN(id)) {
                        console.warn("GET /api/sectors/".concat(params.id, ": Invalid ID format."));
                        return [2 /*return*/, NextResponse.json({ error: 'ID invalide' }, { status: 400 })];
                    }
                    console.log("GET /api/sectors/".concat(id, ": Retrieving sector from DB..."));
                    return [4 /*yield*/, prisma.operatingSector.findUnique({
                            where: { id: id },
                            select: {
                                id: true,
                                name: true,
                                colorCode: true,
                                isActive: true,
                                description: true,
                                rules: true, // Sélectionner le champ JSON
                            }
                        })];
                case 2:
                    sector = _c.sent();
                    if (!sector) {
                        console.warn("GET /api/sectors/".concat(id, ": Sector not found in DB."));
                        return [2 /*return*/, NextResponse.json({ error: 'Secteur non trouvé' }, { status: 404 })];
                    }
                    parsedRules = parseRules(sector.rules);
                    responseData = {
                        id: sector.id,
                        name: sector.name,
                        colorCode: sector.colorCode,
                        color: sector.colorCode,
                        isActive: sector.isActive,
                        description: sector.description,
                        rules: parsedRules
                    };
                    console.log("GET /api/sectors/".concat(id, ": Sector retrieved successfully."));
                    console.log("--- GET /api/sectors/".concat(id, " END (Prisma - JSON Rules) ---\n"));
                    return [2 /*return*/, NextResponse.json(responseData)];
                case 3:
                    error_1 = _c.sent();
                    console.error("Error during GET /api/sectors/".concat(params.id, " (Prisma - JSON Rules):"), error_1);
                    console.log("--- GET /api/sectors/".concat(params.id, " END (Prisma - with error) ---\n"));
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur lors de la récupération du secteur' }, { status: 500 })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// --- PUT /api/sectors/[id] (Prisma - JSON Rules) ---
export function PUT(request_1, _a) {
    return __awaiter(this, arguments, void 0, function (request, _b) {
        var requestHeaders, auth, id, data, maxRooms, parsedMax, rulesData, updatedSector, parsedRules, responseData, error_2, target;
        var _c, _d;
        var params = _b.params;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    console.log("\n--- PUT /api/sectors/".concat(params.id, " START (Prisma - JSON Rules) ---"));
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 4, , 5]);
                    requestHeaders = headers();
                    auth = checkAuth(requestHeaders);
                    if (!auth) {
                        console.error("PUT /api/sectors/".concat(params.id, ": Unauthorized (Middleware headers missing)"));
                        return [2 /*return*/, NextResponse.json({ error: 'Non autorisé' }, { status: 401 })];
                    }
                    if (auth.userRole !== 'ADMIN_TOTAL' && auth.userRole !== 'ADMIN_PARTIEL') {
                        console.error("PUT /api/sectors/".concat(params.id, ": Forbidden (Role '").concat(auth.userRole, "' not allowed)"));
                        return [2 /*return*/, NextResponse.json({ error: 'Accès interdit pour modifier' }, { status: 403 })];
                    }
                    console.log("PUT /api/sectors/".concat(params.id, ": Auth check passed (Middleware)! User ID: ").concat(auth.userId, ", Role: ").concat(auth.userRole));
                    id = parseInt(params.id);
                    if (isNaN(id)) {
                        console.warn("PUT /api/sectors/".concat(params.id, ": Invalid ID format."));
                        return [2 /*return*/, NextResponse.json({ error: 'ID invalide' }, { status: 400 })];
                    }
                    return [4 /*yield*/, request.json()];
                case 2:
                    data = _e.sent();
                    console.log("PUT /api/sectors/".concat(id, " - Received data:"), data);
                    if (!data || typeof data.name !== 'string' || !data.name.trim()) {
                        console.warn("PUT /api/sectors/".concat(id, ": Validation failed - Name is required."));
                        return [2 /*return*/, NextResponse.json({ error: 'Le nom du secteur est requis' }, { status: 400 })];
                    }
                    maxRooms = 2;
                    if (((_c = data.rules) === null || _c === void 0 ? void 0 : _c.maxRoomsPerSupervisor) !== undefined) {
                        parsedMax = parseInt(data.rules.maxRoomsPerSupervisor, 10);
                        if (!isNaN(parsedMax)) {
                            maxRooms = parsedMax;
                        }
                    }
                    rulesData = {
                        maxRoomsPerSupervisor: maxRooms
                    };
                    console.log("PUT /api/sectors/".concat(id, " - Updating sector with rules:"), rulesData);
                    return [4 /*yield*/, prisma.operatingSector.update({
                            where: { id: id },
                            data: {
                                name: data.name.trim(),
                                colorCode: data.colorCode,
                                isActive: data.isActive,
                                description: data.description,
                                rules: rulesData, // Mettre à jour le champ JSON
                            },
                        })];
                case 3:
                    updatedSector = _e.sent();
                    parsedRules = parseRules(updatedSector.rules);
                    responseData = {
                        id: updatedSector.id,
                        name: updatedSector.name,
                        colorCode: updatedSector.colorCode,
                        color: updatedSector.colorCode,
                        isActive: updatedSector.isActive,
                        description: updatedSector.description,
                        rules: parsedRules
                    };
                    console.log("PUT /api/sectors/".concat(id, ": Sector updated successfully."));
                    console.log("--- PUT /api/sectors/".concat(id, " END (Prisma - JSON Rules) ---\n"));
                    return [2 /*return*/, NextResponse.json(responseData)];
                case 4:
                    error_2 = _e.sent();
                    console.error("Error during PUT /api/sectors/".concat(params.id, " (Prisma - JSON Rules):"), error_2);
                    if (error_2 instanceof Prisma.PrismaClientKnownRequestError) {
                        if (error_2.code === 'P2025') {
                            console.error("Prisma Error P2025: Record to update not found (ID: ".concat(params.id, ")"));
                            return [2 /*return*/, NextResponse.json({ error: 'Secteur non trouvé pour la mise à jour.' }, { status: 404 })];
                        }
                        if (error_2.code === 'P2002') {
                            target = (_d = error_2.meta) === null || _d === void 0 ? void 0 : _d.target;
                            if (target && target.includes('name')) {
                                return [2 /*return*/, NextResponse.json({ error: 'Un secteur avec ce nom existe déjà.' }, { status: 409 })];
                            }
                            console.error("Prisma Error P2002: Unique constraint violation on fields:", target);
                            return [2 /*return*/, NextResponse.json({ error: 'Erreur de base de données: Contrainte unique violée.' }, { status: 409 })];
                        }
                    }
                    console.log("--- PUT /api/sectors/".concat(params.id, " END (Prisma - with error) ---\n"));
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur lors de la mise à jour du secteur' }, { status: 500 })];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// --- DELETE /api/sectors/[id] (Prisma - JSON Rules) ---
export function DELETE(request_1, _a) {
    return __awaiter(this, arguments, void 0, function (request, _b) {
        var requestHeaders, auth, id, error_3;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log("\n--- DELETE /api/sectors/".concat(params.id, " START (Prisma - JSON Rules) ---"));
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    requestHeaders = headers();
                    auth = checkAuth(requestHeaders);
                    if (!auth) {
                        console.error("DELETE /api/sectors/".concat(params.id, ": Unauthorized (Middleware headers missing)"));
                        return [2 /*return*/, NextResponse.json({ error: 'Non autorisé' }, { status: 401 })];
                    }
                    if (auth.userRole !== 'ADMIN_TOTAL' && auth.userRole !== 'ADMIN_PARTIEL') {
                        console.error("DELETE /api/sectors/".concat(params.id, ": Forbidden (Role '").concat(auth.userRole, "' not allowed)"));
                        return [2 /*return*/, NextResponse.json({ error: 'Accès interdit pour supprimer' }, { status: 403 })];
                    }
                    console.log("DELETE /api/sectors/".concat(params.id, ": Auth check passed (Middleware)! User ID: ").concat(auth.userId, ", Role: ").concat(auth.userRole));
                    id = parseInt(params.id);
                    if (isNaN(id)) {
                        console.warn("DELETE /api/sectors/".concat(params.id, ": Invalid ID format."));
                        return [2 /*return*/, NextResponse.json({ error: 'ID invalide' }, { status: 400 })];
                    }
                    console.log("DELETE /api/sectors/".concat(id, ": Attempting to delete sector..."));
                    // Supprimer le secteur
                    return [4 /*yield*/, prisma.operatingSector.delete({
                            where: { id: id },
                        })];
                case 2:
                    // Supprimer le secteur
                    _c.sent();
                    console.log("DELETE /api/sectors/".concat(id, ": Sector deleted successfully."));
                    console.log("--- DELETE /api/sectors/".concat(id, " END (Prisma - JSON Rules) ---\n"));
                    return [2 /*return*/, NextResponse.json({ message: 'Secteur supprimé avec succès' })];
                case 3:
                    error_3 = _c.sent();
                    console.error("Error during DELETE /api/sectors/".concat(params.id, " (Prisma - JSON Rules):"), error_3);
                    if (error_3 instanceof Prisma.PrismaClientKnownRequestError && error_3.code === 'P2025') {
                        console.error("Prisma Error P2025: Record to delete not found (ID: ".concat(params.id, ")"));
                        return [2 /*return*/, NextResponse.json({ error: 'Secteur non trouvé pour la suppression.' }, { status: 404 })];
                    }
                    console.log("--- DELETE /api/sectors/".concat(params.id, " END (Prisma - with error) ---\n"));
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur lors de la suppression du secteur' }, { status: 500 })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
