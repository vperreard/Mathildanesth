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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { promises as fs } from 'fs';
import path from 'path';
import { CalendarExportFormat } from '../../../modules/calendar/types/event';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import ical from 'ical-generator';
// Fonction pour obtenir un chemin de fichier temporaire
var getTempFilePath = function (extension) {
    var tempDir = path.join(process.cwd(), 'tmp');
    // Créer le répertoire temporaire s'il n'existe pas
    if (!fs.existsSync(tempDir)) {
        fs.mkdir(tempDir, { recursive: true });
    }
    return path.join(tempDir, "calendar_export_".concat(Date.now(), ".").concat(extension));
};
export default function handler(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var options_1, eventsResponse, events, filteredEvents, startDate_1, endDate_1, filePath, fileName, contentType, _a, fileBuffer, error_1;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (req.method !== 'POST') {
                        return [2 /*return*/, res.status(405).json({ error: 'Méthode non autorisée' })];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 16, , 17]);
                    options_1 = req.body;
                    return [4 /*yield*/, fetch("".concat(process.env.NEXT_PUBLIC_API_URL || '', "/api/calendar"), {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Cookie': req.headers.cookie || ''
                            }
                        })];
                case 2:
                    eventsResponse = _c.sent();
                    if (!eventsResponse.ok) {
                        throw new Error("Erreur lors de la r\u00E9cup\u00E9ration des \u00E9v\u00E9nements: ".concat(eventsResponse.statusText));
                    }
                    return [4 /*yield*/, eventsResponse.json()];
                case 3:
                    events = _c.sent();
                    filteredEvents = events;
                    // Filtrer par types d'événements
                    if (!options_1.includeAllEvents && ((_b = options_1.eventTypes) === null || _b === void 0 ? void 0 : _b.length) > 0) {
                        filteredEvents = filteredEvents.filter(function (event) { return options_1.eventTypes.includes(event.type); });
                    }
                    // Filtrer par plage de dates
                    if (options_1.dateRange) {
                        startDate_1 = new Date(options_1.dateRange.start);
                        endDate_1 = new Date(options_1.dateRange.end);
                        filteredEvents = filteredEvents.filter(function (event) {
                            var eventStart = new Date(event.start);
                            var eventEnd = new Date(event.end);
                            return (eventStart <= endDate_1 && eventEnd >= startDate_1);
                        });
                    }
                    filePath = void 0;
                    fileName = void 0;
                    contentType = void 0;
                    _a = options_1.format;
                    switch (_a) {
                        case CalendarExportFormat.EXCEL: return [3 /*break*/, 4];
                        case CalendarExportFormat.PDF: return [3 /*break*/, 6];
                        case CalendarExportFormat.CSV: return [3 /*break*/, 8];
                        case CalendarExportFormat.ICS: return [3 /*break*/, 10];
                    }
                    return [3 /*break*/, 12];
                case 4: return [4 /*yield*/, exportToExcel(filteredEvents, options_1)];
                case 5:
                    filePath = _c.sent();
                    fileName = (options_1.fileName || "calendrier_".concat(format(new Date(), 'yyyy-MM-dd'))) + '.xlsx';
                    contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    return [3 /*break*/, 13];
                case 6: return [4 /*yield*/, exportToPDF(filteredEvents, options_1)];
                case 7:
                    filePath = _c.sent();
                    fileName = (options_1.fileName || "calendrier_".concat(format(new Date(), 'yyyy-MM-dd'))) + '.pdf';
                    contentType = 'application/pdf';
                    return [3 /*break*/, 13];
                case 8: return [4 /*yield*/, exportToCSV(filteredEvents, options_1)];
                case 9:
                    filePath = _c.sent();
                    fileName = (options_1.fileName || "calendrier_".concat(format(new Date(), 'yyyy-MM-dd'))) + '.csv';
                    contentType = 'text/csv';
                    return [3 /*break*/, 13];
                case 10: return [4 /*yield*/, exportToICS(filteredEvents, options_1)];
                case 11:
                    filePath = _c.sent();
                    fileName = (options_1.fileName || "calendrier_".concat(format(new Date(), 'yyyy-MM-dd'))) + '.ics';
                    contentType = 'text/calendar';
                    return [3 /*break*/, 13];
                case 12: return [2 /*return*/, res.status(400).json({ error: 'Format d\'export non pris en charge' })];
                case 13: return [4 /*yield*/, fs.readFile(filePath)];
                case 14:
                    fileBuffer = _c.sent();
                    // Configurer les en-têtes de réponse
                    res.setHeader('Content-Type', contentType);
                    res.setHeader('Content-Disposition', "attachment; filename=\"".concat(fileName, "\""));
                    // Envoyer le fichier
                    res.send(fileBuffer);
                    // Supprimer le fichier temporaire
                    return [4 /*yield*/, fs.unlink(filePath)];
                case 15:
                    // Supprimer le fichier temporaire
                    _c.sent();
                    return [3 /*break*/, 17];
                case 16:
                    error_1 = _c.sent();
                    console.error('Erreur lors de l\'export du calendrier:', error_1);
                    res.status(500).json({ error: 'Erreur lors de l\'export du calendrier' });
                    return [3 /*break*/, 17];
                case 17: return [2 /*return*/];
            }
        });
    });
}
// Fonction pour exporter au format Excel
function exportToExcel(events, options) {
    return __awaiter(this, void 0, void 0, function () {
        var filePath, rows, worksheet, workbook;
        return __generator(this, function (_a) {
            filePath = getTempFilePath('xlsx');
            rows = events.map(function (event) { return ({
                'Type': getEventTypeLabel(event.type),
                'Titre': event.title,
                'Début': format(new Date(event.start), 'dd/MM/yyyy HH:mm', { locale: fr }),
                'Fin': format(new Date(event.end), 'dd/MM/yyyy HH:mm', { locale: fr }),
                'Utilisateur': event.user ? "".concat(event.user.firstName, " ").concat(event.user.lastName) : '',
                'Description': event.description || ''
            }); });
            worksheet = XLSX.utils.json_to_sheet(rows);
            workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Calendrier');
            // Écrire le fichier
            XLSX.writeFile(workbook, filePath);
            return [2 /*return*/, filePath];
        });
    });
}
// Fonction pour exporter au format PDF
function exportToPDF(events, options) {
    return __awaiter(this, void 0, void 0, function () {
        var filePath, doc, fromDate, toDate, tableRows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filePath = getTempFilePath('pdf');
                    doc = new jsPDF();
                    // Ajouter un titre
                    doc.setFontSize(16);
                    doc.text('Calendrier', 14, 20);
                    // Ajouter la période
                    if (options.dateRange) {
                        doc.setFontSize(11);
                        fromDate = format(new Date(options.dateRange.start), 'dd/MM/yyyy', { locale: fr });
                        toDate = format(new Date(options.dateRange.end), 'dd/MM/yyyy', { locale: fr });
                        doc.text("P\u00E9riode: du ".concat(fromDate, " au ").concat(toDate), 14, 30);
                    }
                    tableRows = events.map(function (event) { return [
                        getEventTypeLabel(event.type),
                        event.title,
                        format(new Date(event.start), 'dd/MM/yyyy HH:mm', { locale: fr }),
                        format(new Date(event.end), 'dd/MM/yyyy HH:mm', { locale: fr }),
                        event.user ? "".concat(event.user.firstName, " ").concat(event.user.lastName) : '',
                        event.description || ''
                    ]; });
                    // Ajouter le tableau
                    doc.autoTable({
                        startY: 40,
                        head: [['Type', 'Titre', 'Début', 'Fin', 'Utilisateur', 'Description']],
                        body: tableRows,
                        theme: 'striped',
                        headStyles: { fillColor: [33, 150, 243] }
                    });
                    // Sauvegarder le PDF
                    return [4 /*yield*/, fs.writeFile(filePath, Buffer.from(doc.output('arraybuffer')))];
                case 1:
                    // Sauvegarder le PDF
                    _a.sent();
                    return [2 /*return*/, filePath];
            }
        });
    });
}
// Fonction pour exporter au format CSV
function exportToCSV(events, options) {
    return __awaiter(this, void 0, void 0, function () {
        var filePath, headers, rows, csvContent;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filePath = getTempFilePath('csv');
                    headers = ['Type', 'Titre', 'Début', 'Fin', 'Utilisateur', 'Description'];
                    rows = events.map(function (event) { return [
                        getEventTypeLabel(event.type),
                        event.title,
                        format(new Date(event.start), 'dd/MM/yyyy HH:mm', { locale: fr }),
                        format(new Date(event.end), 'dd/MM/yyyy HH:mm', { locale: fr }),
                        event.user ? "".concat(event.user.firstName, " ").concat(event.user.lastName) : '',
                        event.description || ''
                    ]; });
                    csvContent = __spreadArray([
                        headers.join(',')
                    ], rows.map(function (row) { return row.join(','); }), true).join('\n');
                    // Écrire le fichier
                    return [4 /*yield*/, fs.writeFile(filePath, csvContent, 'utf8')];
                case 1:
                    // Écrire le fichier
                    _a.sent();
                    return [2 /*return*/, filePath];
            }
        });
    });
}
// Fonction pour exporter au format iCalendar
function exportToICS(events, options) {
    return __awaiter(this, void 0, void 0, function () {
        var filePath, cal, icsString;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filePath = getTempFilePath('ics');
                    cal = ical({
                        domain: 'mathildanesth.com',
                        name: 'Calendrier Mathildanesth',
                        timezone: 'Europe/Paris'
                    });
                    // Ajouter les événements au calendrier
                    events.forEach(function (event) {
                        cal.createEvent({
                            start: new Date(event.start),
                            end: new Date(event.end),
                            summary: event.title,
                            description: event.description || '',
                            allDay: event.allDay,
                            location: getEventLocation(event),
                            categories: [getEventTypeLabel(event.type)]
                        });
                    });
                    icsString = cal.toString();
                    // Écrire le fichier
                    return [4 /*yield*/, fs.writeFile(filePath, icsString, 'utf8')];
                case 1:
                    // Écrire le fichier
                    _a.sent();
                    return [2 /*return*/, filePath];
            }
        });
    });
}
// Fonction utilitaire pour obtenir l'étiquette du type d'événement
function getEventTypeLabel(type) {
    switch (type) {
        case 'LEAVE':
            return 'Congé';
        case 'DUTY':
            return 'Garde';
        case 'ON_CALL':
            return 'Astreinte';
        case 'ASSIGNMENT':
            return 'Affectation';
        default:
            return 'Événement';
    }
}
// Fonction utilitaire pour obtenir la localisation d'un événement
function getEventLocation(event) {
    if (event.locationName) {
        return event.locationName;
    }
    return '';
}
