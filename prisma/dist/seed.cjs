"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
// prisma/seed.ts
// Import standard
var client_1 = require("@prisma/client");
var bcrypt = __importStar(require("bcrypt"));
var fs = __importStar(require("fs")); // Module Node.js pour lire les fichiers
var path = __importStar(require("path")); // Module Node.js pour gérer les chemins de fichiers
var sync_1 = require("csv-parse/sync"); // Fonction pour parser le CSV
var prisma = new client_1.PrismaClient();
var saltRounds = 10;
// --- Configuration ---
var usersCsvPath = path.join(__dirname, '..', 'seed_data', 'users.csv');
var surgeonsCsvPath = path.join(__dirname, '..', 'seed_data', 'surgeons.csv');
var specialtySeparator = ';'; // Caractère utilisé pour séparer les spécialités dans surgeons.csv
// Liste des spécialités à créer (gardé pour référence et cohérence)
var specialtiesToSeed = [
    { name: "Endoscopies digestives", isPediatric: false },
    { name: "Endoscopie interventionnelle", isPediatric: false },
    { name: "Orthopédie", isPediatric: false },
    { name: "Orthopédie pédiatrique", isPediatric: true },
    { name: "Chirurgie plastique", isPediatric: false },
    { name: "Chirurgie vasculaire", isPediatric: false },
    { name: "Chirurgie ORL", isPediatric: false },
    { name: "Chirurgie ORL pédiatrique", isPediatric: true },
    { name: "Chirurgie dentaire", isPediatric: false },
    { name: "Chirurgie maxillo-faciale", isPediatric: false },
    { name: "Chirurgie gynécologique", isPediatric: false },
    { name: "Procréation médicalement assistée", isPediatric: false }, // Ajout de PMA ici aussi
    { name: "Chirurgie digestive", isPediatric: false },
    { name: "Urologie", isPediatric: false },
    { name: "Chirurgie digestive et Urologie pédiatrique", isPediatric: true },
    { name: "Ophtalmologie", isPediatric: false },
    { name: "Ophtalmologie pédiatrique", isPediatric: true },
];
// --- Fonction pour lire et parser un CSV ---
function parseCsv(filePath) {
    if (!fs.existsSync(filePath)) {
        console.warn("WARN: Fichier CSV non trouv\u00E9: ".concat(filePath, ". Skipping."));
        return [];
    }
    var csvContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
    var records = (0, sync_1.parse)(csvContent, {
        columns: true, // Utilise la première ligne comme en-tête
        skip_empty_lines: true,
        trim: true, // Enlève les espaces autour des valeurs
        bom: true // Gère le Byte Order Mark (souvent ajouté par Excel)
    });
    return records;
}
// --- Fonction principale ---
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var seededSpecialties, _i, specialtiesToSeed_1, specData, specialty, usersData, usersCreated, usersUpdated, _a, usersData_1, userData, hashedPassword, dateEntree, dateSortie, tempsPartiel, actif, mustChangePassword, pourcentage, jours, existingUser, userDataForCreate, userDataForUpdate, user, error_1, surgeonsData, surgeonsCreated, surgeonsUpdated, _b, surgeonsData_1, surgeonData, specialtyIds, status_1, email, existingSurgeon, surgeonDataForCreate, surgeonDataForUpdate, surgeon, error_2;
        var _c, _d, _e, _f, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    console.log("Start seeding ...");
                    // 1. Seed Spécialités
                    console.log("Seeding specialties...");
                    seededSpecialties = new Map();
                    _i = 0, specialtiesToSeed_1 = specialtiesToSeed;
                    _j.label = 1;
                case 1:
                    if (!(_i < specialtiesToSeed_1.length)) return [3 /*break*/, 4];
                    specData = specialtiesToSeed_1[_i];
                    return [4 /*yield*/, prisma.specialty.upsert({
                            where: { name: specData.name },
                            update: { isPediatric: specData.isPediatric },
                            create: { name: specData.name, isPediatric: specData.isPediatric },
                        })];
                case 2:
                    specialty = _j.sent();
                    seededSpecialties.set(specialty.name, specialty.id);
                    _j.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log("Specialties seeding finished. ".concat(seededSpecialties.size, " specialties processed."));
                    // 2. Seed Utilisateurs depuis CSV
                    console.log("Seeding users from ".concat(usersCsvPath, "..."));
                    usersData = parseCsv(usersCsvPath);
                    usersCreated = 0;
                    usersUpdated = 0;
                    _a = 0, usersData_1 = usersData;
                    _j.label = 5;
                case 5:
                    if (!(_a < usersData_1.length)) return [3 /*break*/, 14];
                    userData = usersData_1[_a];
                    if (!userData.login || !userData.password || !userData.role || !userData.professionalRole) {
                        console.warn("WARN: Skipping user row due to missing essential data (login, password, role, professionalRole):", userData);
                        return [3 /*break*/, 13];
                    }
                    return [4 /*yield*/, bcrypt.hash(userData.password, saltRounds)];
                case 6:
                    hashedPassword = _j.sent();
                    dateEntree = userData.dateEntree ? new Date(userData.dateEntree) : null;
                    dateSortie = userData.dateSortie ? new Date(userData.dateSortie) : null;
                    tempsPartiel = ((_c = userData.tempsPartiel) === null || _c === void 0 ? void 0 : _c.toLowerCase()) === 'true';
                    actif = ((_d = userData.actif) === null || _d === void 0 ? void 0 : _d.toLowerCase()) === 'true';
                    mustChangePassword = ((_e = userData.mustChangePassword) === null || _e === void 0 ? void 0 : _e.toLowerCase()) === 'true';
                    pourcentage = tempsPartiel && userData.pourcentageTempsPartiel ? parseFloat(userData.pourcentageTempsPartiel) : null;
                    jours = tempsPartiel && userData.joursTravailles ? userData.joursTravailles : null;
                    _j.label = 7;
                case 7:
                    _j.trys.push([7, 12, , 13]);
                    return [4 /*yield*/, prisma.user.findUnique({ where: { login: userData.login } })];
                case 8:
                    existingUser = _j.sent();
                    userDataForCreate = {
                        nom: userData.nom || '',
                        prenom: userData.prenom || '',
                        login: userData.login,
                        email: userData.email || "".concat(userData.login, "@example.local"),
                        alias: userData.alias || null,
                        phoneNumber: userData.phoneNumber || null,
                        password: hashedPassword,
                        role: userData.role,
                        professionalRole: userData.professionalRole,
                        tempsPartiel: tempsPartiel,
                        pourcentageTempsPartiel: pourcentage,
                        joursTravailles: jours,
                        dateEntree: dateEntree,
                        dateSortie: dateSortie,
                        actif: actif,
                        mustChangePassword: mustChangePassword,
                    };
                    userDataForUpdate = {
                        nom: userData.nom || '',
                        prenom: userData.prenom || '',
                        email: userData.email || "".concat(userData.login, "@example.local"),
                        alias: userData.alias || null,
                        phoneNumber: userData.phoneNumber || null,
                        role: userData.role,
                        professionalRole: userData.professionalRole,
                        tempsPartiel: tempsPartiel,
                        pourcentageTempsPartiel: pourcentage,
                        joursTravailles: jours,
                        dateEntree: dateEntree,
                        dateSortie: dateSortie,
                        actif: actif,
                    };
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { login: userData.login },
                            update: userDataForUpdate,
                            create: userDataForCreate,
                        })];
                case 9:
                    user = _j.sent();
                    if (existingUser) {
                        usersUpdated++;
                    }
                    else {
                        usersCreated++;
                    }
                    if (!(user.role === client_1.Role.ADMIN_TOTAL && user.mustChangePassword)) return [3 /*break*/, 11];
                    return [4 /*yield*/, prisma.user.update({ where: { id: user.id }, data: { mustChangePassword: false } })];
                case 10:
                    _j.sent();
                    _j.label = 11;
                case 11: return [3 /*break*/, 13];
                case 12:
                    error_1 = _j.sent();
                    console.error("Erreur lors de l'upsert de l'utilisateur ".concat(userData.login, ":"), error_1.message);
                    return [3 /*break*/, 13];
                case 13:
                    _a++;
                    return [3 /*break*/, 5];
                case 14:
                    console.log("Users seeding finished. ".concat(usersCreated, " created, ").concat(usersUpdated, " updated."));
                    // 3. Seed Chirurgiens depuis CSV
                    console.log("Seeding surgeons from ".concat(surgeonsCsvPath, "..."));
                    surgeonsData = parseCsv(surgeonsCsvPath);
                    surgeonsCreated = 0;
                    surgeonsUpdated = 0;
                    _b = 0, surgeonsData_1 = surgeonsData;
                    _j.label = 15;
                case 15:
                    if (!(_b < surgeonsData_1.length)) return [3 /*break*/, 21];
                    surgeonData = surgeonsData_1[_b];
                    if (!surgeonData.nom || !surgeonData.prenom) {
                        console.warn("WARN: Skipping surgeon row due to missing nom/prenom:", surgeonData);
                        return [3 /*break*/, 20];
                    }
                    specialtyIds = (surgeonData.specialtyNames || '')
                        .split(specialtySeparator)
                        .map(function (name) { return name.trim(); })
                        .filter(function (name) { return seededSpecialties.has(name); })
                        .map(function (name) { return ({ id: seededSpecialties.get(name) }); });
                    if (surgeonData.specialtyNames && specialtyIds.length !== surgeonData.specialtyNames.split(specialtySeparator).length) {
                        console.warn("WARN: Certaines sp\u00E9cialit\u00E9s non trouv\u00E9es pour ".concat(surgeonData.nom, " ").concat(surgeonData.prenom, " (list\u00E9es: '").concat(surgeonData.specialtyNames, "')"));
                    }
                    status_1 = (((_f = surgeonData.status) === null || _f === void 0 ? void 0 : _f.toUpperCase()) || 'ACTIF');
                    email = surgeonData.email || "".concat(surgeonData.nom, ".").concat(surgeonData.prenom, "@chir.example.local").toLowerCase().replace(/\s+/g, '.');
                    _j.label = 16;
                case 16:
                    _j.trys.push([16, 19, , 20]);
                    return [4 /*yield*/, prisma.surgeon.findUnique({ where: { email: email } })];
                case 17:
                    existingSurgeon = _j.sent();
                    surgeonDataForCreate = {
                        nom: surgeonData.nom,
                        prenom: surgeonData.prenom,
                        email: email,
                        phoneNumber: surgeonData.phoneNumber || null,
                        status: status_1,
                        specialties: specialtyIds.length > 0 ? { connect: specialtyIds } : undefined,
                        googleSheetName: surgeonData.googleSheetName || null,
                    };
                    surgeonDataForUpdate = {
                        nom: surgeonData.nom,
                        prenom: surgeonData.prenom,
                        phoneNumber: surgeonData.phoneNumber || null,
                        status: status_1,
                        specialties: { set: specialtyIds },
                        googleSheetName: surgeonData.googleSheetName || null,
                    };
                    return [4 /*yield*/, prisma.surgeon.upsert({
                            where: { email: email },
                            update: surgeonDataForUpdate,
                            create: surgeonDataForCreate,
                        })];
                case 18:
                    surgeon = _j.sent();
                    if (existingSurgeon) {
                        surgeonsUpdated++;
                    }
                    else {
                        surgeonsCreated++;
                    }
                    return [3 /*break*/, 20];
                case 19:
                    error_2 = _j.sent();
                    console.error("Erreur lors de l'upsert du chirurgien ".concat(surgeonData.nom, " ").concat(surgeonData.prenom, ":"), error_2.message);
                    if (error_2.code === 'P2002' && ((_h = (_g = error_2.meta) === null || _g === void 0 ? void 0 : _g.target) === null || _h === void 0 ? void 0 : _h.includes('email'))) {
                        console.error("  -> Email potentiellement dupliqu\u00E9: ".concat(email));
                    }
                    return [3 /*break*/, 20];
                case 20:
                    _b++;
                    return [3 /*break*/, 15];
                case 21:
                    console.log("Surgeons seeding finished. ".concat(surgeonsCreated, " created, ").concat(surgeonsUpdated, " updated."));
                    console.log("Seeding termin\u00E9.");
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.error("ERREUR lors du seeding:", e);
                return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                process.exit(1);
                return [2 /*return*/];
        }
    });
}); })
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                console.log("Prisma Client déconnecté.");
                return [2 /*return*/];
        }
    });
}); });
