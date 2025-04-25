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
// Récupérer tous les événements du calendrier avec filtrage
export var fetchCalendarEvents = function (filters) { return __awaiter(void 0, void 0, void 0, function () {
    var url_1, response, events, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                url_1 = new URL('/api/calendar', window.location.origin);
                // Ajouter les types d'événements
                if (filters.eventTypes.length > 0) {
                    filters.eventTypes.forEach(function (type) {
                        url_1.searchParams.append('eventTypes', type);
                    });
                }
                // Ajouter les utilisateurs
                if (filters.userIds && filters.userIds.length > 0) {
                    filters.userIds.forEach(function (id) {
                        url_1.searchParams.append('userIds', id);
                    });
                }
                // Ajouter les rôles d'utilisateurs
                if (filters.userRoles && filters.userRoles.length > 0) {
                    filters.userRoles.forEach(function (role) {
                        url_1.searchParams.append('userRoles', role);
                    });
                }
                // Ajouter les types de congés
                if (filters.leaveTypes && filters.leaveTypes.length > 0) {
                    filters.leaveTypes.forEach(function (type) {
                        url_1.searchParams.append('leaveTypes', type);
                    });
                }
                // Ajouter les statuts de congés
                if (filters.leaveStatuses && filters.leaveStatuses.length > 0) {
                    filters.leaveStatuses.forEach(function (status) {
                        url_1.searchParams.append('leaveStatuses', status);
                    });
                }
                // Ajouter les lieux
                if (filters.locationIds && filters.locationIds.length > 0) {
                    filters.locationIds.forEach(function (id) {
                        url_1.searchParams.append('locationIds', id);
                    });
                }
                // Ajouter les équipes
                if (filters.teamIds && filters.teamIds.length > 0) {
                    filters.teamIds.forEach(function (id) {
                        url_1.searchParams.append('teamIds', id);
                    });
                }
                // Ajouter les spécialités
                if (filters.specialtyIds && filters.specialtyIds.length > 0) {
                    filters.specialtyIds.forEach(function (id) {
                        url_1.searchParams.append('specialtyIds', id);
                    });
                }
                // Ajouter le terme de recherche
                if (filters.searchTerm) {
                    url_1.searchParams.append('searchTerm', filters.searchTerm);
                }
                // Ajouter les dates
                if (filters.dateRange) {
                    url_1.searchParams.append('startDate', filters.dateRange.start.toISOString());
                    url_1.searchParams.append('endDate', filters.dateRange.end.toISOString());
                }
                return [4 /*yield*/, fetch(url_1.toString())];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    throw new Error("Erreur lors de la r\u00E9cup\u00E9ration des \u00E9v\u00E9nements: ".concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                events = _a.sent();
                return [2 /*return*/, events];
            case 3:
                error_1 = _a.sent();
                console.error('Erreur dans fetchCalendarEvents:', error_1);
                throw error_1;
            case 4: return [2 /*return*/];
        }
    });
}); };
// Exporter les événements du calendrier
export var exportCalendarEvents = function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var response, blob, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, fetch('/api/calendar/export', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(options),
                    })];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    throw new Error("Erreur lors de l'export: ".concat(response.statusText));
                }
                return [4 /*yield*/, response.blob()];
            case 2:
                blob = _a.sent();
                return [2 /*return*/, blob];
            case 3:
                error_2 = _a.sent();
                console.error('Erreur dans exportCalendarEvents:', error_2);
                throw error_2;
            case 4: return [2 /*return*/];
        }
    });
}); };
// Télécharger le blob généré
export var downloadBlob = function (blob, fileName) {
    // Créer un lien temporaire pour le téléchargement
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    // Ajouter, cliquer et supprimer le lien
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Libérer l'URL
    window.URL.revokeObjectURL(url);
};
