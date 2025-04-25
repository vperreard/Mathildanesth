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
// prisma/seed.ts
console.log("[SEED DEBUG] Début du script seed.ts");
import { PrismaClient, WorkPatternType, WeekType } from '@prisma/client';
import bcrypt from 'bcrypt';
console.log("[SEED DEBUG] Import bcrypt OK");
import fs from 'fs';
console.log("[SEED DEBUG] Import fs OK");
import path from 'path';
console.log("[SEED DEBUG] Import path OK");
import { fileURLToPath } from 'url';
console.log("[SEED DEBUG] Import fileURLToPath OK");
import { dirname } from 'path';
console.log("[SEED DEBUG] Import dirname OK");
import { parse } from 'csv-parse/sync';
console.log("[SEED DEBUG] Import csv-parse/sync OK");
// Équivalent ESM à __dirname
console.log("[SEED DEBUG] Calcul de __filename...");
var __filename = fileURLToPath(import.meta.url);
console.log("[SEED DEBUG] __filename OK:", __filename);
console.log("[SEED DEBUG] Calcul de __dirname...");
var __dirname = dirname(__filename);
console.log("[SEED DEBUG] __dirname OK:", __dirname);
console.log("[SEED DEBUG] Instanciation PrismaClient...");
var prisma = new PrismaClient();
console.log("[SEED DEBUG] PrismaClient OK");
var saltRounds = 10;
console.log("[SEED DEBUG] saltRounds OK");
console.log("[SEED DEBUG] Calcul usersCsvPath...");
var usersCsvPath = path.join(__dirname, 'seed_data', 'users.csv');
console.log("[SEED DEBUG] usersCsvPath OK:", usersCsvPath);
console.log("[SEED DEBUG] Calcul surgeonsCsvPath...");
var surgeonsCsvPath = path.join(__dirname, 'seed_data', 'surgeons.csv');
console.log("[SEED DEBUG] surgeonsCsvPath OK:", surgeonsCsvPath);
var specialtySeparator = ';';
console.log("[SEED DEBUG] specialtySeparator OK");
var specialtiesToSeed = [
    { name: "Endoscopie digestive", isPediatric: false },
    { name: "Endoscopies digestives", isPediatric: false },
    { name: "Endoscopie interventionnelle", isPediatric: false },
    { name: "Orthopédie", isPediatric: false },
    { name: "Orthopédie Pédiatrique", isPediatric: true },
    { name: "Orthopédie pédiatrique", isPediatric: true },
    { name: "Chirurgie plastique", isPediatric: false },
    { name: "Chirurgie vasculaire", isPediatric: false },
    { name: "ORL", isPediatric: false },
    { name: "ORL pédiatrique", isPediatric: true },
    { name: "Chirurgie dentaire", isPediatric: false },
    { name: "Chirurgie maxillo-faciale", isPediatric: false },
    { name: "Chirurgie gynécologique", isPediatric: false },
    { name: "Procréation médicalement assistée", isPediatric: false },
    { name: "Chirurgie digestive", isPediatric: false },
    { name: "Chirurgie urologique", isPediatric: false },
    { name: "Chirurgie urologique pédiatrique", isPediatric: true },
    { name: "Ophtalmologie", isPediatric: false },
    { name: "Ophtalmologie pédiatrique", isPediatric: true },
    { name: "Chirurgie dentaire pédiatrique", isPediatric: true },
];
function parseCsv(filePath) {
    if (!fs.existsSync(filePath)) {
        console.warn("WARN: Fichier CSV non trouv\u00E9: ".concat(filePath, ". Skipping."));
        return [];
    }
    var csvContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
    var records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true
    });
    return records;
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var seededSpecialties, _i, specialtiesToSeed_1, specData, specialty, usersData, usersCreated, usersUpdated, adminLogin, adminPassword, adminEmail, adminExists, hashedAdminPassword, _a, usersData_1, userData, hashedPassword, dateEntree, dateSortie, tempsPartiel, actif, mustChangePassword, pourcentage, workPattern, workOnWeekType, workOnMonthType, workMonday, workTuesday, workWednesday, workThursday, workFriday, workSaturday, workSunday, joursDesc, existingUser, userDataForCreate, userDataForUpdate, user, error_1;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    console.log("[SEED DEBUG] Début de la fonction main()");
                    console.log("Start seeding ...");
                    // 1. Seed Spécialités // Décommenter ce bloc
                    console.log("Seeding specialties...");
                    seededSpecialties = new Map();
                    _i = 0, specialtiesToSeed_1 = specialtiesToSeed;
                    _e.label = 1;
                case 1:
                    if (!(_i < specialtiesToSeed_1.length)) return [3 /*break*/, 4];
                    specData = specialtiesToSeed_1[_i];
                    return [4 /*yield*/, prisma.specialty.upsert({
                            where: { name: specData.name },
                            update: { isPediatric: specData.isPediatric },
                            create: { name: specData.name, isPediatric: specData.isPediatric },
                        })];
                case 2:
                    specialty = _e.sent();
                    seededSpecialties.set(specialty.name, specialty.id);
                    _e.label = 3;
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
                    adminLogin = 'admin';
                    adminPassword = 'admin';
                    adminEmail = 'admin@example.local';
                    return [4 /*yield*/, prisma.user.findUnique({ where: { login: adminLogin } })];
                case 5:
                    adminExists = _e.sent();
                    if (!!adminExists) return [3 /*break*/, 8];
                    return [4 /*yield*/, bcrypt.hash(adminPassword, saltRounds)];
                case 6:
                    hashedAdminPassword = _e.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                nom: 'Super',
                                prenom: 'Admin',
                                login: adminLogin,
                                email: adminEmail,
                                password: hashedAdminPassword,
                                role: 'ADMIN_TOTAL', // Note: Utilise string ici, car type Role non fiable
                                professionalRole: 'MAR', // Note: Utilise string ici, car type ProfRole non fiable
                                actif: true,
                                mustChangePassword: false,
                                tempsPartiel: false,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            }
                        })];
                case 7:
                    _e.sent();
                    console.log('Super admin (admin/admin) créé.');
                    return [3 /*break*/, 9];
                case 8:
                    console.log('Super admin déjà existant, non recréé.');
                    _e.label = 9;
                case 9:
                    _a = 0, usersData_1 = usersData;
                    _e.label = 10;
                case 10:
                    if (!(_a < usersData_1.length)) return [3 /*break*/, 19];
                    userData = usersData_1[_a];
                    if (!userData.login || !userData.password /* || !userData.role || !userData.professionalRole */) {
                        console.warn("WARN: Skipping user row due to missing essential data (login, password):", userData);
                        return [3 /*break*/, 18];
                    }
                    return [4 /*yield*/, bcrypt.hash(userData.password, saltRounds)];
                case 11:
                    hashedPassword = _e.sent();
                    dateEntree = userData.dateEntree ? new Date(userData.dateEntree) : null;
                    dateSortie = userData.dateSortie ? new Date(userData.dateSortie) : null;
                    tempsPartiel = ((_b = userData.tempsPartiel) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === 'true';
                    actif = ((_c = userData.actif) === null || _c === void 0 ? void 0 : _c.toLowerCase()) === 'true';
                    mustChangePassword = ((_d = userData.mustChangePassword) === null || _d === void 0 ? void 0 : _d.toLowerCase()) === 'true';
                    pourcentage = tempsPartiel && userData.pourcentageTempsPartiel ? parseFloat(userData.pourcentageTempsPartiel) : null;
                    workPattern = WorkPatternType.FULL_TIME;
                    workOnWeekType = null;
                    workOnMonthType = null;
                    workMonday = true;
                    workTuesday = true;
                    workWednesday = true;
                    workThursday = true;
                    workFriday = true;
                    workSaturday = false;
                    workSunday = false;
                    if (tempsPartiel && userData.joursTravailles) {
                        joursDesc = userData.joursTravailles.toLowerCase();
                        workMonday = false;
                        workTuesday = false;
                        workWednesday = false;
                        workThursday = false;
                        workFriday = false;
                        if (joursDesc.includes("mois impairs")) {
                            workPattern = WorkPatternType.ALTERNATING_MONTHS;
                            workOnMonthType = WeekType.ODD;
                            workMonday = true;
                            workTuesday = true;
                            workWednesday = true;
                            workThursday = true;
                            workFriday = true;
                        }
                        else if (joursDesc.includes("mois pair")) {
                            workPattern = WorkPatternType.ALTERNATING_MONTHS;
                            workOnMonthType = WeekType.EVEN;
                            workMonday = true;
                            workTuesday = true;
                            workWednesday = true;
                            workThursday = true;
                            workFriday = true;
                        }
                        else if (joursDesc.includes("lundis- mardis")) {
                            workPattern = WorkPatternType.SPECIFIC_DAYS;
                            workMonday = true;
                            workTuesday = true;
                            workOnWeekType = WeekType.ALL;
                        }
                        else if (joursDesc.includes("jeudis- vendredis")) {
                            workPattern = WorkPatternType.SPECIFIC_DAYS;
                            workThursday = true;
                            workFriday = true;
                            workOnWeekType = WeekType.ALL;
                        }
                        else {
                            console.warn("WARN: Description joursTravailles non reconnue: '".concat(userData.joursTravailles, "' pour ").concat(userData.login, ". Utilisation de SPECIFIC_DAYS par d\u00E9faut sans jours sp\u00E9cifiques."));
                            workPattern = WorkPatternType.SPECIFIC_DAYS;
                            workOnWeekType = WeekType.ALL;
                        }
                        if (workPattern === WorkPatternType.SPECIFIC_DAYS) {
                            if (joursDesc.includes("semaines paires")) {
                                workOnWeekType = WeekType.EVEN;
                            }
                            else if (joursDesc.includes("semaines impaires")) {
                                workOnWeekType = WeekType.ODD;
                            }
                        }
                    }
                    else if (!tempsPartiel) {
                        workPattern = WorkPatternType.FULL_TIME;
                        workMonday = true;
                        workTuesday = true;
                        workWednesday = true;
                        workThursday = true;
                        workFriday = true;
                        workSaturday = false;
                        workSunday = false;
                        workOnWeekType = null;
                        workOnMonthType = null;
                    }
                    _e.label = 12;
                case 12:
                    _e.trys.push([12, 17, , 18]);
                    return [4 /*yield*/, prisma.user.findUnique({ where: { login: userData.login } })];
                case 13:
                    existingUser = _e.sent();
                    userDataForCreate = {
                        nom: userData.nom || '',
                        prenom: userData.prenom || '',
                        login: userData.login,
                        email: userData.email || "".concat(userData.login, "@example.local"),
                        alias: userData.alias || null,
                        phoneNumber: userData.phoneNumber || null,
                        password: hashedPassword,
                        // role: userData.role as Role, // Commenté
                        // professionalRole: userData.professionalRole as ProfessionalRole, // Commenté
                        tempsPartiel: tempsPartiel,
                        pourcentageTempsPartiel: pourcentage,
                        dateEntree: dateEntree,
                        dateSortie: dateSortie,
                        actif: actif,
                        mustChangePassword: mustChangePassword,
                        workPattern: workPattern,
                        workOnMonthType: workOnMonthType,
                    };
                    userDataForUpdate = {
                        nom: userData.nom || '',
                        prenom: userData.prenom || '',
                        email: userData.email || "".concat(userData.login, "@example.local"),
                        alias: userData.alias || null,
                        phoneNumber: userData.phoneNumber || null,
                        // role: userData.role as Role, // Commenté
                        // professionalRole: userData.professionalRole as ProfessionalRole, // Commenté
                        tempsPartiel: tempsPartiel,
                        pourcentageTempsPartiel: pourcentage,
                        dateEntree: dateEntree,
                        dateSortie: dateSortie,
                        actif: actif,
                        workPattern: workPattern,
                        workOnMonthType: workOnMonthType,
                    };
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { login: userData.login },
                            update: __assign(__assign({}, userDataForUpdate), { role: userData.role, professionalRole: userData.professionalRole }),
                            create: __assign(__assign({}, userDataForCreate), { role: userData.role, professionalRole: userData.professionalRole }),
                        })];
                case 14:
                    user = _e.sent();
                    if (existingUser) {
                        usersUpdated++;
                    }
                    else {
                        usersCreated++;
                    }
                    if (!(user.login === 'admin' && user.mustChangePassword)) return [3 /*break*/, 16];
                    return [4 /*yield*/, prisma.user.update({ where: { id: user.id }, data: { mustChangePassword: false } })];
                case 15:
                    _e.sent();
                    _e.label = 16;
                case 16: return [3 /*break*/, 18];
                case 17:
                    error_1 = _e.sent();
                    console.error("Erreur lors de l'upsert de l'utilisateur ".concat(userData.login, ":"), error_1.message);
                    return [3 /*break*/, 18];
                case 18:
                    _a++;
                    return [3 /*break*/, 10];
                case 19:
                    console.log("Users seeding finished. ".concat(usersCreated, " created, ").concat(usersUpdated, " updated."));
                    return [2 /*return*/];
            }
        });
    });
}
console.log("[SEED DEBUG] Appel de main()...");
main()
    .catch(function (e) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.error("[SEED DEBUG] ERREUR lors de l'appel de main():", e);
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
                console.log("[SEED DEBUG] Prisma Client déconnecté. Fin du script.");
                return [2 /*return*/];
        }
    });
}); });
