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
import { prisma } from '../../../lib/prisma';
import { CalendarEventType } from '../../../modules/calendar/types/event';
import { formatISO } from 'date-fns';
// Helper function to parse and convert IDs to numbers
var parseIds = function (ids) {
    if (!ids)
        return undefined;
    if (Array.isArray(ids)) {
        return ids.map(function (id) { return parseInt(id, 10); }).filter(function (id) { return !isNaN(id); });
    }
    var parsedId = parseInt(ids, 10);
    return isNaN(parsedId) ? undefined : parsedId;
};
export default function handler(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, userIds, userRoles, eventTypes, startDate, endDate, leaveTypes, leaveStatuses, locationIds, teamIds, specialtyIds, searchTerm, start, end, events, parsedUserIds, userIdFilterCondition, parsedLocationIds, locationIdFilterCondition, parsedSpecialtyIds, specialtyIdFilterCondition, requestedEventTypes, leaveFilter, leaves, leaveEvents, dutyFilter, duties, dutyEvents, onCallFilter, onCalls, onCallEvents, assignmentFilter, assignments, assignmentEvents, filteredEvents, term_1, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 10, , 11]);
                    if (!(req.method === 'GET')) return [3 /*break*/, 9];
                    _a = req.query, userIds = _a.userIds, userRoles = _a.userRoles, eventTypes = _a.eventTypes, startDate = _a.startDate, endDate = _a.endDate, leaveTypes = _a.leaveTypes, leaveStatuses = _a.leaveStatuses, locationIds = _a.locationIds, teamIds = _a.teamIds, specialtyIds = _a.specialtyIds, searchTerm = _a.searchTerm;
                    start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                    end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
                    events = [];
                    parsedUserIds = parseIds(userIds);
                    userIdFilterCondition = parsedUserIds !== undefined ?
                        (Array.isArray(parsedUserIds) ? { in: parsedUserIds } : parsedUserIds)
                        : undefined;
                    parsedLocationIds = parseIds(locationIds);
                    locationIdFilterCondition = parsedLocationIds !== undefined ?
                        (Array.isArray(parsedLocationIds) ? { in: parsedLocationIds } : parsedLocationIds)
                        : undefined;
                    parsedSpecialtyIds = parseIds(specialtyIds);
                    specialtyIdFilterCondition = parsedSpecialtyIds !== undefined ?
                        (Array.isArray(parsedSpecialtyIds) ? { in: parsedSpecialtyIds } : parsedSpecialtyIds)
                        : undefined;
                    requestedEventTypes = [];
                    if (eventTypes) {
                        requestedEventTypes = (Array.isArray(eventTypes) ? eventTypes : [eventTypes]);
                    }
                    else {
                        // Par défaut, récupérer tous les types
                        requestedEventTypes = Object.values(CalendarEventType);
                    }
                    if (!requestedEventTypes.includes(CalendarEventType.LEAVE)) return [3 /*break*/, 2];
                    leaveFilter = {
                        AND: [
                            { startDate: { lte: end } },
                            { endDate: { gte: start } }
                        ],
                    };
                    if (userIdFilterCondition !== undefined) {
                        leaveFilter.userId = userIdFilterCondition;
                    }
                    // Filtres de types de congés
                    if (leaveTypes && (Array.isArray(leaveTypes) ? leaveTypes.length > 0 : leaveTypes)) {
                        leaveFilter.type = Array.isArray(leaveTypes)
                            ? { in: leaveTypes }
                            : leaveTypes;
                    }
                    // Filtres de statuts de congés
                    if (leaveStatuses && (Array.isArray(leaveStatuses) ? leaveStatuses.length > 0 : leaveStatuses)) {
                        leaveFilter.status = Array.isArray(leaveStatuses)
                            ? { in: leaveStatuses }
                            : leaveStatuses;
                    }
                    return [4 /*yield*/, prisma.leave.findMany({
                            where: leaveFilter,
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        prenom: true,
                                        nom: true,
                                        email: true,
                                        role: true
                                    }
                                }
                            },
                            orderBy: {
                                startDate: 'asc'
                            }
                        })];
                case 1:
                    leaves = _b.sent();
                    leaveEvents = leaves.map(function (leave) { return ({
                        id: "leave-".concat(leave.id),
                        title: "".concat(leave.user.prenom, " ").concat(leave.user.nom, " - Cong\u00E9 (").concat(leave.type, ")"),
                        start: formatISO(leave.startDate),
                        end: formatISO(leave.endDate),
                        allDay: true,
                        userId: leave.userId,
                        user: leave.user,
                        type: CalendarEventType.LEAVE,
                        leaveId: leave.id,
                        leaveType: leave.type,
                        status: leave.status,
                        countedDays: leave.countedDays,
                        description: leave.reason || ''
                    }); });
                    events.push.apply(events, leaveEvents);
                    _b.label = 2;
                case 2:
                    if (!requestedEventTypes.includes(CalendarEventType.DUTY)) return [3 /*break*/, 4];
                    dutyFilter = {
                        date: {
                            gte: start,
                            lte: end
                        },
                    };
                    if (userIdFilterCondition !== undefined) {
                        dutyFilter.userId = userIdFilterCondition;
                    }
                    if (locationIdFilterCondition !== undefined) {
                        dutyFilter.locationId = locationIdFilterCondition;
                    }
                    return [4 /*yield*/, prisma.duty.findMany({
                            where: dutyFilter,
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        prenom: true,
                                        nom: true,
                                        email: true,
                                        role: true
                                    }
                                },
                                location: true
                            },
                            orderBy: {
                                date: 'asc'
                            }
                        })];
                case 3:
                    duties = _b.sent();
                    dutyEvents = duties.map(function (duty) {
                        var _a, _b;
                        var startDate = new Date(duty.date);
                        var endDate = new Date(duty.date);
                        endDate.setHours(23, 59, 59);
                        return {
                            id: "duty-".concat(duty.id),
                            title: "".concat(duty.user.prenom, " ").concat(duty.user.nom, " - Garde (").concat(((_a = duty.location) === null || _a === void 0 ? void 0 : _a.name) || 'N/A', ")"),
                            start: formatISO(startDate),
                            end: formatISO(endDate),
                            allDay: true,
                            userId: duty.userId,
                            user: duty.user,
                            type: CalendarEventType.DUTY,
                            dutyId: duty.id,
                            locationId: duty.locationId,
                            locationName: ((_b = duty.location) === null || _b === void 0 ? void 0 : _b.name) || 'Non spécifié',
                            description: ''
                        };
                    });
                    events.push.apply(events, dutyEvents);
                    _b.label = 4;
                case 4:
                    if (!requestedEventTypes.includes(CalendarEventType.ON_CALL)) return [3 /*break*/, 6];
                    onCallFilter = {
                        AND: [
                            { startDate: { lte: end } },
                            { endDate: { gte: start } }
                        ],
                    };
                    if (userIdFilterCondition !== undefined) {
                        onCallFilter.userId = userIdFilterCondition;
                    }
                    if (locationIdFilterCondition !== undefined) {
                        onCallFilter.locationId = locationIdFilterCondition;
                    }
                    return [4 /*yield*/, prisma.onCall.findMany({
                            where: onCallFilter,
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        prenom: true,
                                        nom: true,
                                        email: true,
                                        role: true
                                    }
                                },
                                location: true
                            },
                            orderBy: {
                                startDate: 'asc'
                            }
                        })];
                case 5:
                    onCalls = _b.sent();
                    onCallEvents = onCalls.map(function (onCall) {
                        var _a, _b;
                        return ({
                            id: "oncall-".concat(onCall.id),
                            title: "".concat(onCall.user.prenom, " ").concat(onCall.user.nom, " - Astreinte (").concat(((_a = onCall.location) === null || _a === void 0 ? void 0 : _a.name) || 'N/A', ")"),
                            start: formatISO(onCall.startDate),
                            end: formatISO(onCall.endDate),
                            allDay: true,
                            userId: onCall.userId,
                            user: onCall.user,
                            type: CalendarEventType.ON_CALL,
                            onCallId: onCall.id,
                            locationId: onCall.locationId,
                            locationName: ((_b = onCall.location) === null || _b === void 0 ? void 0 : _b.name) || 'Non spécifié',
                            description: ''
                        });
                    });
                    events.push.apply(events, onCallEvents);
                    _b.label = 6;
                case 6:
                    if (!requestedEventTypes.includes(CalendarEventType.ASSIGNMENT)) return [3 /*break*/, 8];
                    assignmentFilter = {
                        date: {
                            gte: start,
                            lte: end
                        },
                    };
                    if (userIdFilterCondition !== undefined) {
                        assignmentFilter.userId = userIdFilterCondition;
                    }
                    if (locationIdFilterCondition !== undefined) {
                        assignmentFilter.locationId = locationIdFilterCondition;
                    }
                    if (specialtyIdFilterCondition !== undefined) {
                        assignmentFilter.specialtyId = specialtyIdFilterCondition;
                    }
                    return [4 /*yield*/, prisma.assignment.findMany({
                            where: assignmentFilter,
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        prenom: true,
                                        nom: true,
                                        email: true,
                                        role: true
                                    }
                                },
                                location: true,
                                specialty: true
                            },
                            orderBy: {
                                date: 'asc'
                            }
                        })];
                case 7:
                    assignments = _b.sent();
                    assignmentEvents = assignments.map(function (assignment) {
                        var _a, _b;
                        var startDate = new Date(assignment.date);
                        var endDate = new Date(assignment.date);
                        endDate.setHours(23, 59, 59);
                        return {
                            id: "assign-".concat(assignment.id),
                            title: "".concat(assignment.user.prenom, " ").concat(assignment.user.nom, " - Affectation: ").concat(assignment.location.name, " (").concat(((_a = assignment.specialty) === null || _a === void 0 ? void 0 : _a.name) || 'Général', ")"),
                            start: formatISO(startDate),
                            end: formatISO(endDate),
                            allDay: true,
                            userId: assignment.userId,
                            user: assignment.user,
                            type: CalendarEventType.ASSIGNMENT,
                            assignmentId: assignment.id,
                            locationId: assignment.locationId,
                            locationName: assignment.location.name,
                            specialtyId: assignment.specialtyId,
                            specialtyName: ((_b = assignment.specialty) === null || _b === void 0 ? void 0 : _b.name) || null,
                            description: assignment.description || ''
                        };
                    });
                    events.push.apply(events, assignmentEvents);
                    _b.label = 8;
                case 8:
                    filteredEvents = events;
                    if (searchTerm) {
                        term_1 = searchTerm.toLowerCase();
                        filteredEvents = events.filter(function (event) {
                            return event.title.toLowerCase().includes(term_1) ||
                                (event.description && event.description.toLowerCase().includes(term_1)) ||
                                (event.user && "".concat(event.user.prenom, " ").concat(event.user.nom).toLowerCase().includes(term_1)) ||
                                (event.locationName && event.locationName.toLowerCase().includes(term_1)) ||
                                (event.teamName && event.teamName.toLowerCase().includes(term_1));
                        });
                    }
                    // Tri final des événements par date de début
                    filteredEvents.sort(function (a, b) { return new Date(a.start).getTime() - new Date(b.start).getTime(); });
                    return [2 /*return*/, res.status(200).json(filteredEvents)];
                case 9: 
                // Méthode non autorisée
                return [2 /*return*/, res.status(405).json({ error: 'Méthode non autorisée' })];
                case 10:
                    error_1 = _b.sent();
                    console.error('Erreur API calendrier:', error_1);
                    return [2 /*return*/, res.status(500).json({ error: 'Erreur serveur' })];
                case 11: return [2 /*return*/];
            }
        });
    });
}
