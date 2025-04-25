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
// Fonction utilitaire pour parser les règles JSON en toute sécurité
function parseRules(rulesJson) {
    var defaultRules = { maxRoomsPerSupervisor: 2 };
    if (typeof rulesJson === 'object' && rulesJson !== null && 'maxRoomsPerSupervisor' in rulesJson && typeof rulesJson.maxRoomsPerSupervisor === 'number') {
        return { maxRoomsPerSupervisor: rulesJson.maxRoomsPerSupervisor };
    }
    // Essayer de parser si c'est une chaîne JSON
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
export function GET(request) {
    return __awaiter(this, void 0, void 0, function () {
        var requestHeaders, userId, userRole, sectorsFromDb, formattedSectors, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\n--- GET /api/sectors START (Prisma - operatingSector - JSON Rules) ---");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    requestHeaders = headers();
                    userId = requestHeaders.get('x-user-id');
                    userRole = requestHeaders.get('x-user-role');
                    console.log("GET /api/sectors - Reading Middleware Headers:", { userId: userId, userRole: userRole });
                    if (!userId || !userRole) {
                        console.error('GET /api/sectors: Unauthorized (Middleware headers missing)');
                        return [2 /*return*/, NextResponse.json({ error: 'Non autorisé - Headers manquants' }, { status: 401 })];
                    }
                    console.log("GET /api/sectors: Auth check passed (Middleware)! User ID: ".concat(userId, ", Role: ").concat(userRole));
                    console.log('GET /api/sectors: Retrieving sectors from DB using operatingSector model...');
                    return [4 /*yield*/, prisma.operatingSector.findMany({
                            orderBy: {
                                name: 'asc',
                            },
                            select: {
                                id: true,
                                name: true,
                                colorCode: true,
                                isActive: true,
                                description: true,
                                rules: true,
                            }
                        })];
                case 2:
                    sectorsFromDb = _a.sent();
                    formattedSectors = sectorsFromDb.map(function (sector) {
                        var parsedRules = parseRules(sector.rules);
                        return {
                            id: sector.id,
                            name: sector.name,
                            colorCode: sector.colorCode,
                            color: sector.colorCode,
                            isActive: sector.isActive,
                            description: sector.description,
                            rules: parsedRules
                        };
                    });
                    console.log("GET /api/sectors: ".concat(formattedSectors.length, " sectors retrieved from DB."));
                    console.log("--- GET /api/sectors END (Prisma - operatingSector - JSON Rules) ---\n");
                    return [2 /*return*/, NextResponse.json(formattedSectors)];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error during GET /api/sectors (Prisma - operatingSector): ', error_1);
                    if (error_1 instanceof Prisma.PrismaClientKnownRequestError && error_1.code === 'P2021') {
                        console.error("Prisma Error P2021: Table or Model 'OperatingSector' not found.");
                        return [2 /*return*/, NextResponse.json({ error: 'Erreur de base de données: La table des secteurs est introuvable.' }, { status: 500 })];
                    }
                    console.log("--- GET /api/sectors END (Prisma - operatingSector - with error) ---\n");
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur lors de la récupération des secteurs' }, { status: 500 })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
export function POST(request) {
    return __awaiter(this, void 0, void 0, function () {
        var requestHeaders, userId, userRole, data, maxRooms, parsedMax, rulesData, newSector, parsedRules, responseData, error_2, target;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log("\n--- POST /api/sectors START (Prisma - operatingSector - JSON Rules) ---");
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    requestHeaders = headers();
                    userId = requestHeaders.get('x-user-id');
                    userRole = requestHeaders.get('x-user-role');
                    console.log("POST /api/sectors - Reading Middleware Headers:", { userId: userId, userRole: userRole });
                    if (!userId || !userRole) {
                        console.error('POST /api/sectors: Unauthorized (Middleware headers missing)');
                        return [2 /*return*/, NextResponse.json({ error: 'Non autorisé' }, { status: 401 })];
                    }
                    if (userRole !== 'ADMIN_TOTAL' && userRole !== 'ADMIN_PARTIEL') {
                        console.error("POST /api/sectors: Forbidden (Role '".concat(userRole, "' not allowed)"));
                        return [2 /*return*/, NextResponse.json({ error: 'Accès interdit pour créer' }, { status: 403 })];
                    }
                    console.log("POST /api/sectors: Auth check passed (Middleware)! User ID: ".concat(userId, ", Role: ").concat(userRole));
                    return [4 /*yield*/, request.json()];
                case 2:
                    data = _c.sent();
                    console.log("POST /api/sectors - Received data:", data);
                    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
                        console.warn("POST /api/sectors: Validation failed - Name is required");
                        return [2 /*return*/, NextResponse.json({ error: 'Le nom du secteur est requis' }, { status: 400 })];
                    }
                    maxRooms = 2;
                    if (((_a = data.rules) === null || _a === void 0 ? void 0 : _a.maxRoomsPerSupervisor) !== undefined) {
                        parsedMax = parseInt(data.rules.maxRoomsPerSupervisor, 10);
                        if (!isNaN(parsedMax)) {
                            maxRooms = parsedMax;
                        }
                    }
                    rulesData = {
                        maxRoomsPerSupervisor: maxRooms
                    };
                    console.log("POST /api/sectors - Creating sector with rules:", rulesData);
                    return [4 /*yield*/, prisma.operatingSector.create({
                            data: {
                                name: data.name.trim(),
                                colorCode: data.colorCode || '#000000',
                                isActive: data.isActive !== undefined ? data.isActive : true,
                                description: data.description || '',
                                rules: rulesData,
                            },
                        })];
                case 3:
                    newSector = _c.sent();
                    parsedRules = parseRules(newSector.rules);
                    responseData = {
                        id: newSector.id,
                        name: newSector.name,
                        colorCode: newSector.colorCode,
                        color: newSector.colorCode,
                        isActive: newSector.isActive,
                        description: newSector.description,
                        rules: parsedRules
                    };
                    console.log("POST /api/sectors: Sector created in DB:", responseData);
                    console.log("--- POST /api/sectors END (Prisma - operatingSector - JSON Rules) ---\n");
                    return [2 /*return*/, NextResponse.json(responseData, { status: 201 })];
                case 4:
                    error_2 = _c.sent();
                    console.error('Error during POST /api/sectors (Prisma - operatingSector): ', error_2);
                    if (error_2 instanceof Prisma.PrismaClientKnownRequestError) {
                        if (error_2.code === 'P2002') {
                            target = (_b = error_2.meta) === null || _b === void 0 ? void 0 : _b.target;
                            if (target && target.includes('name')) {
                                return [2 /*return*/, NextResponse.json({ error: 'Un secteur avec ce nom existe déjà.' }, { status: 409 })];
                            }
                            console.error("Prisma Error P2002: Unique constraint violation on fields:", target);
                            return [2 /*return*/, NextResponse.json({ error: 'Erreur de base de données: Contrainte unique violée.' }, { status: 409 })];
                        }
                        if (error_2.code === 'P2021') {
                            console.error("Prisma Error P2021: Table or Model 'OperatingSector' not found.");
                            return [2 /*return*/, NextResponse.json({ error: 'Erreur de base de données: La table des secteurs est introuvable.' }, { status: 500 })];
                        }
                    }
                    console.log("--- POST /api/sectors END (Prisma - operatingSector - with error) ---\n");
                    return [2 /*return*/, NextResponse.json({ error: 'Erreur lors de la création du secteur' }, { status: 500 })];
                case 5: return [2 /*return*/];
            }
        });
    });
}
