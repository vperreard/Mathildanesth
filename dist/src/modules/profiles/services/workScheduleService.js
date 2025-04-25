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
import { WorkFrequency, WeekType, MonthType } from '../types/workSchedule';
import { addDays, getWeek, getMonth, getDay, isWithinInterval } from 'date-fns';
/**
 * Vérifier si une date correspond à une semaine paire ou impaire
 * @param date Date à vérifier
 * @returns true si semaine paire, false si semaine impaire
 */
export var isEvenWeek = function (date) {
    return getWeek(date) % 2 === 0;
};
/**
 * Vérifier si une date correspond à un mois pair ou impair
 * @param date Date à vérifier
 * @returns true si mois pair, false si mois impair
 */
export var isEvenMonth = function (date) {
    return (getMonth(date) + 1) % 2 === 0; // +1 car getMonth est 0-indexé
};
/**
 * Vérifier si l'utilisateur est censé travailler à une date spécifique
 * selon son planning de travail
 * @param schedule Planning de travail de l'utilisateur
 * @param date Date à vérifier
 * @returns true si l'utilisateur doit travailler ce jour-là
 */
export var isWorkingDay = function (schedule, date) {
    // Vérifier que la date est dans la période de validité du planning
    if (!isWithinInterval(date, {
        start: schedule.validFrom,
        end: schedule.validTo || new Date(2099, 11, 31) // Date lointaine si pas de date de fin
    })) {
        return false;
    }
    // Si le planning n'est pas actif
    if (!schedule.isActive) {
        return false;
    }
    var weekday = getDay(date);
    var isEven = isEvenWeek(date);
    var isEvenMonthDate = isEvenMonth(date);
    switch (schedule.frequency) {
        case WorkFrequency.FULL_TIME:
            // En temps plein, on travaille tous les jours de la semaine (hors weekend)
            return weekday >= 1 && weekday <= 5;
        case WorkFrequency.PART_TIME:
            // Temps partiel, on vérifie les jours spécifiques
            return schedule.workingDays ? schedule.workingDays.includes(weekday) : false;
        case WorkFrequency.ALTERNATE_WEEKS:
            // Alternance semaines paires/impaires
            if (schedule.weekType === WeekType.BOTH) {
                return schedule.workingDays ? schedule.workingDays.includes(weekday) : (weekday >= 1 && weekday <= 5);
            }
            else if (schedule.weekType === WeekType.EVEN && isEven) {
                return schedule.workingDays ? schedule.workingDays.includes(weekday) : (weekday >= 1 && weekday <= 5);
            }
            else if (schedule.weekType === WeekType.ODD && !isEven) {
                return schedule.workingDays ? schedule.workingDays.includes(weekday) : (weekday >= 1 && weekday <= 5);
            }
            return false;
        case WorkFrequency.ALTERNATE_MONTHS:
            // Alternance mois pairs/impairs
            if (schedule.monthType === MonthType.BOTH) {
                return schedule.workingDays ? schedule.workingDays.includes(weekday) : (weekday >= 1 && weekday <= 5);
            }
            else if (schedule.monthType === MonthType.EVEN && isEvenMonthDate) {
                return schedule.workingDays ? schedule.workingDays.includes(weekday) : (weekday >= 1 && weekday <= 5);
            }
            else if (schedule.monthType === MonthType.ODD && !isEvenMonthDate) {
                return schedule.workingDays ? schedule.workingDays.includes(weekday) : (weekday >= 1 && weekday <= 5);
            }
            return false;
        case WorkFrequency.CUSTOM:
            // Configuration personnalisée
            if (!schedule.customSchedule)
                return false;
            if (isEven && schedule.customSchedule.evenWeeks) {
                return schedule.customSchedule.evenWeeks.includes(weekday);
            }
            else if (!isEven && schedule.customSchedule.oddWeeks) {
                return schedule.customSchedule.oddWeeks.includes(weekday);
            }
            return false;
        default:
            return false;
    }
};
/**
 * Calculer le nombre de jours travaillés dans une période
 * @param schedule Planning de travail
 * @param startDate Date de début de la période
 * @param endDate Date de fin de la période
 * @returns Nombre de jours travaillés dans la période
 */
export var countWorkingDaysInPeriod = function (schedule, startDate, endDate) {
    var count = 0;
    var currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        if (isWorkingDay(schedule, currentDate)) {
            count++;
        }
        currentDate = addDays(currentDate, 1);
    }
    return count;
};
/**
 * Calculer le nombre de jours de congés annuels en fonction du temps de travail
 * @param percentage Pourcentage de temps de travail (100 pour temps plein)
 * @returns Nombre de jours de congés annuels
 */
export var calculateAnnualLeaveAllowance = function (percentage) {
    // Base: 50 jours pour un temps plein
    var baseAllowance = 50;
    return Math.round((percentage / 100) * baseAllowance);
};
/**
 * Calculer le nombre de jours travaillés dans une semaine typique
 * @param schedule Planning de travail
 * @returns Objet contenant le nombre total de jours et la répartition par type de semaine
 */
export var calculateWeeklyWorkingDays = function (schedule) {
    var _a, _b, _c, _d, _e, _f, _g;
    var evenWeekDays = 0;
    var oddWeekDays = 0;
    switch (schedule.frequency) {
        case WorkFrequency.FULL_TIME:
            // 5 jours par semaine (lundi-vendredi)
            evenWeekDays = oddWeekDays = 5;
            break;
        case WorkFrequency.PART_TIME:
            // Jours spécifiques
            var workingDays = schedule.workingDays || [];
            evenWeekDays = oddWeekDays = workingDays.length;
            break;
        case WorkFrequency.ALTERNATE_WEEKS:
            if (schedule.weekType === WeekType.BOTH) {
                evenWeekDays = oddWeekDays = ((_a = schedule.workingDays) === null || _a === void 0 ? void 0 : _a.length) || 5;
            }
            else if (schedule.weekType === WeekType.EVEN) {
                evenWeekDays = ((_b = schedule.workingDays) === null || _b === void 0 ? void 0 : _b.length) || 5;
                oddWeekDays = 0;
            }
            else if (schedule.weekType === WeekType.ODD) {
                evenWeekDays = 0;
                oddWeekDays = ((_c = schedule.workingDays) === null || _c === void 0 ? void 0 : _c.length) || 5;
            }
            break;
        case WorkFrequency.ALTERNATE_MONTHS:
            // Simplifié pour la calculation hebdomadaire
            if (schedule.monthType === MonthType.BOTH) {
                evenWeekDays = oddWeekDays = ((_d = schedule.workingDays) === null || _d === void 0 ? void 0 : _d.length) || 5;
            }
            else {
                evenWeekDays = oddWeekDays = (((_e = schedule.workingDays) === null || _e === void 0 ? void 0 : _e.length) || 5) / 2;
            }
            break;
        case WorkFrequency.CUSTOM:
            if (schedule.customSchedule) {
                evenWeekDays = ((_f = schedule.customSchedule.evenWeeks) === null || _f === void 0 ? void 0 : _f.length) || 0;
                oddWeekDays = ((_g = schedule.customSchedule.oddWeeks) === null || _g === void 0 ? void 0 : _g.length) || 0;
            }
            break;
    }
    return {
        totalDays: (evenWeekDays + oddWeekDays) / 2, // Moyenne sur 2 semaines
        evenWeekDays: evenWeekDays,
        oddWeekDays: oddWeekDays
    };
};
/**
 * Récupérer les plannings de travail d'un utilisateur
 * @param userId ID de l'utilisateur
 * @returns Promise avec les plannings de travail
 */
export var fetchUserWorkSchedules = function (userId) { return __awaiter(void 0, void 0, void 0, function () {
    var response, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, fetch("/api/profiles/work-schedules?userId=".concat(userId))];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    throw new Error("Erreur lors de la r\u00E9cup\u00E9ration des plannings de travail: ".concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2: return [2 /*return*/, _a.sent()];
            case 3:
                error_1 = _a.sent();
                console.error('Erreur dans fetchUserWorkSchedules:', error_1);
                throw error_1;
            case 4: return [2 /*return*/];
        }
    });
}); };
/**
 * Créer ou mettre à jour un planning de travail
 * @param schedule Planning de travail à créer ou mettre à jour
 * @returns Promise avec le planning créé ou mis à jour
 */
export var saveWorkSchedule = function (schedule) { return __awaiter(void 0, void 0, void 0, function () {
    var method, url, response, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                method = schedule.id ? 'PUT' : 'POST';
                url = schedule.id
                    ? "/api/profiles/work-schedules/".concat(schedule.id)
                    : '/api/profiles/work-schedules';
                return [4 /*yield*/, fetch(url, {
                        method: method,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(schedule),
                    })];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    throw new Error("Erreur lors de l'enregistrement du planning de travail: ".concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2: return [2 /*return*/, _a.sent()];
            case 3:
                error_2 = _a.sent();
                console.error('Erreur dans saveWorkSchedule:', error_2);
                throw error_2;
            case 4: return [2 /*return*/];
        }
    });
}); };
/**
 * Supprimer un planning de travail
 * @param scheduleId ID du planning à supprimer
 * @returns Promise avec le résultat de la suppression
 */
export var deleteWorkSchedule = function (scheduleId) { return __awaiter(void 0, void 0, void 0, function () {
    var response, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fetch("/api/profiles/work-schedules/".concat(scheduleId), {
                        method: 'DELETE',
                    })];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    throw new Error("Erreur lors de la suppression du planning de travail: ".concat(response.statusText));
                }
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('Erreur dans deleteWorkSchedule:', error_3);
                throw error_3;
            case 3: return [2 /*return*/];
        }
    });
}); };
