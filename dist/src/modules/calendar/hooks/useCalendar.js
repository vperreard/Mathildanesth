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
import { useState, useEffect, useCallback } from 'react';
import { CalendarViewType } from '../types/event';
import { fetchCalendarEvents } from '../services/calendarService';
import { fr } from 'date-fns/locale';
import { addMonths, addWeeks, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';
// Hook pour gérer les événements du calendrier
export var useCalendar = function (initialFilters) {
    if (initialFilters === void 0) { initialFilters = {}; }
    // État des événements
    var _a = useState([]), events = _a[0], setEvents = _a[1];
    var _b = useState(false), loading = _b[0], setLoading = _b[1];
    var _c = useState(null), error = _c[0], setError = _c[1];
    // Filtres
    var _d = useState({
        eventTypes: initialFilters.eventTypes || [],
        userIds: initialFilters.userIds || [],
        userRoles: initialFilters.userRoles || [],
        leaveTypes: initialFilters.leaveTypes || [],
        leaveStatuses: initialFilters.leaveStatuses || [],
        locationIds: initialFilters.locationIds || [],
        teamIds: initialFilters.teamIds || [],
        specialtyIds: initialFilters.specialtyIds || [],
        searchTerm: initialFilters.searchTerm || '',
        dateRange: initialFilters.dateRange || {
            start: startOfMonth(new Date()),
            end: endOfMonth(new Date())
        }
    }), filters = _d[0], setFilters = _d[1];
    // Vue du calendrier
    var _e = useState(CalendarViewType.MONTH), view = _e[0], setView = _e[1];
    var _f = useState(filters.dateRange || {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    }), currentRange = _f[0], setCurrentRange = _f[1];
    // Paramètres par défaut du calendrier
    var defaultSettings = {
        locale: 'fr',
        firstDay: 1, // Lundi
        businessHours: {
            startTime: '08:00',
            endTime: '18:00',
            daysOfWeek: [1, 2, 3, 4, 5] // Lundi à vendredi
        },
        nowIndicator: true,
        snapDuration: '00:15:00',
        slotDuration: '00:30:00',
        slotLabelInterval: '01:00:00',
        slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        },
        slotMinTime: '08:00:00',
        slotMaxTime: '20:00:00'
    };
    var _g = useState(defaultSettings), settings = _g[0], setSettings = _g[1];
    // Fonction pour récupérer les événements
    var fetchEvents = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var data, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, fetchCalendarEvents(filters)];
                case 2:
                    data = _a.sent();
                    setEvents(data);
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    setError(err_1 instanceof Error ? err_1 : new Error('Erreur inconnue'));
                    console.error('Erreur dans useCalendar:', err_1);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [filters]);
    // Récupérer les événements au chargement et quand les filtres changent
    useEffect(function () {
        fetchEvents();
    }, [fetchEvents]);
    // Mettre à jour les filtres
    var updateFilters = useCallback(function (newFilters) {
        setFilters(function (prevFilters) { return (__assign(__assign({}, prevFilters), newFilters)); });
    }, []);
    // Gérer le changement de vue
    var handleViewChange = useCallback(function (newView) {
        setView(newView);
        // Mettre à jour la plage de dates en fonction de la nouvelle vue
        setCurrentRange(function (prevRange) {
            var currentDate = new Date();
            switch (newView) {
                case CalendarViewType.MONTH:
                    return {
                        start: startOfMonth(currentDate),
                        end: endOfMonth(currentDate)
                    };
                case CalendarViewType.WEEK:
                    return {
                        start: startOfWeek(currentDate, { locale: fr }),
                        end: endOfWeek(currentDate, { locale: fr })
                    };
                case CalendarViewType.DAY:
                    return {
                        start: startOfDay(currentDate),
                        end: endOfDay(currentDate)
                    };
                default:
                    return prevRange;
            }
        });
    }, []);
    // Gérer le changement de plage de dates
    var handleDateRangeChange = useCallback(function (start, end) {
        setCurrentRange({ start: start, end: end });
        updateFilters({ dateRange: { start: start, end: end } });
    }, [updateFilters]);
    // Navigation: précédent
    var navigateToPrevious = useCallback(function () {
        setCurrentRange(function (prevRange) {
            var newStart;
            var newEnd;
            switch (view) {
                case CalendarViewType.MONTH:
                    newStart = addMonths(prevRange.start, -1);
                    newEnd = endOfMonth(newStart);
                    break;
                case CalendarViewType.WEEK:
                    newStart = addWeeks(prevRange.start, -1);
                    newEnd = endOfWeek(newStart, { locale: fr });
                    break;
                case CalendarViewType.DAY:
                    newStart = addDays(prevRange.start, -1);
                    newEnd = endOfDay(newStart);
                    break;
                default:
                    newStart = addMonths(prevRange.start, -1);
                    newEnd = endOfMonth(newStart);
            }
            // Mettre à jour les filtres avec la nouvelle plage
            updateFilters({ dateRange: { start: newStart, end: newEnd } });
            return { start: newStart, end: newEnd };
        });
    }, [view, updateFilters]);
    // Navigation: suivant
    var navigateToNext = useCallback(function () {
        setCurrentRange(function (prevRange) {
            var newStart;
            var newEnd;
            switch (view) {
                case CalendarViewType.MONTH:
                    newStart = addMonths(prevRange.start, 1);
                    newEnd = endOfMonth(newStart);
                    break;
                case CalendarViewType.WEEK:
                    newStart = addWeeks(prevRange.start, 1);
                    newEnd = endOfWeek(newStart, { locale: fr });
                    break;
                case CalendarViewType.DAY:
                    newStart = addDays(prevRange.start, 1);
                    newEnd = endOfDay(newStart);
                    break;
                default:
                    newStart = addMonths(prevRange.start, 1);
                    newEnd = endOfMonth(newStart);
            }
            // Mettre à jour les filtres avec la nouvelle plage
            updateFilters({ dateRange: { start: newStart, end: newEnd } });
            return { start: newStart, end: newEnd };
        });
    }, [view, updateFilters]);
    // Navigation: aujourd'hui
    var navigateToToday = useCallback(function () {
        var today = new Date();
        var start;
        var end;
        switch (view) {
            case CalendarViewType.MONTH:
                start = startOfMonth(today);
                end = endOfMonth(today);
                break;
            case CalendarViewType.WEEK:
                start = startOfWeek(today, { locale: fr });
                end = endOfWeek(today, { locale: fr });
                break;
            case CalendarViewType.DAY:
                start = startOfDay(today);
                end = endOfDay(today);
                break;
            default:
                start = startOfMonth(today);
                end = endOfMonth(today);
        }
        setCurrentRange({ start: start, end: end });
        updateFilters({ dateRange: { start: start, end: end } });
    }, [view, updateFilters]);
    // Mettre à jour les paramètres du calendrier
    var updateSettings = useCallback(function (newSettings) {
        setSettings(function (prevSettings) { return (__assign(__assign({}, prevSettings), newSettings)); });
    }, []);
    return {
        events: events,
        loading: loading,
        error: error,
        filters: filters,
        view: view,
        currentRange: currentRange,
        settings: settings,
        updateFilters: updateFilters,
        handleViewChange: handleViewChange,
        handleDateRangeChange: handleDateRangeChange,
        navigateToPrevious: navigateToPrevious,
        navigateToNext: navigateToNext,
        navigateToToday: navigateToToday,
        updateSettings: updateSettings,
        refreshEvents: fetchEvents
    };
};
