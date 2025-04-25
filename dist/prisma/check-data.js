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
import { PrismaClient } from '@prisma/client';
var prisma = new PrismaClient();
function checkData() {
    return __awaiter(this, void 0, void 0, function () {
        var userCount, users, surgeonCount, surgeons, specialtyCount, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, 7, 9]);
                    console.log('Vérification des données dans la base de données...');
                    return [4 /*yield*/, prisma.user.count()];
                case 1:
                    userCount = _a.sent();
                    console.log("Nombre d'utilisateurs dans la base de donn\u00E9es: ".concat(userCount));
                    return [4 /*yield*/, prisma.user.findMany({ take: 5 })];
                case 2:
                    users = _a.sent();
                    console.log('Exemple d\'utilisateurs:');
                    users.forEach(function (user) {
                        console.log("- ".concat(user.prenom, " ").concat(user.nom, " (").concat(user.login, ", ").concat(user.email, ")"));
                    });
                    return [4 /*yield*/, prisma.surgeon.count()];
                case 3:
                    surgeonCount = _a.sent();
                    console.log("Nombre de chirurgiens dans la base de donn\u00E9es: ".concat(surgeonCount));
                    return [4 /*yield*/, prisma.surgeon.findMany({ take: 5 })];
                case 4:
                    surgeons = _a.sent();
                    console.log('Exemple de chirurgiens:');
                    surgeons.forEach(function (surgeon) {
                        console.log("- ".concat(surgeon.prenom, " ").concat(surgeon.nom, " (").concat(surgeon.email || 'Pas d\'email', ")"));
                    });
                    return [4 /*yield*/, prisma.specialty.count()];
                case 5:
                    specialtyCount = _a.sent();
                    console.log("Nombre de sp\u00E9cialit\u00E9s dans la base de donn\u00E9es: ".concat(specialtyCount));
                    return [3 /*break*/, 9];
                case 6:
                    error_1 = _a.sent();
                    console.error('Erreur lors de la vérification des données:', error_1);
                    return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, prisma.$disconnect()];
                case 8:
                    _a.sent();
                    console.log('Prisma Client déconnecté.');
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    });
}
checkData();
