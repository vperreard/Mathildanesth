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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React, { useState } from 'react';
import { CalendarEventType, CalendarExportFormat } from '../types/event';
import { exportCalendarEvents, downloadBlob } from '../services/calendarService';
import { format } from 'date-fns';
export var CalendarExport = function (_a) {
    var events = _a.events, currentRange = _a.currentRange;
    var _b = useState(false), isModalOpen = _b[0], setIsModalOpen = _b[1];
    var _c = useState(false), isLoading = _c[0], setIsLoading = _c[1];
    var _d = useState(CalendarExportFormat.PDF), exportFormat = _d[0], setExportFormat = _d[1];
    var _e = useState("calendrier_".concat(format(new Date(), 'yyyy-MM-dd'))), fileName = _e[0], setFileName = _e[1];
    var _f = useState(true), includeAllEvents = _f[0], setIncludeAllEvents = _f[1];
    var _g = useState(Object.values(CalendarEventType)), selectedEventTypes = _g[0], setSelectedEventTypes = _g[1];
    var _h = useState(false), useCustomDateRange = _h[0], setUseCustomDateRange = _h[1];
    var _j = useState({
        start: format(currentRange.start, 'yyyy-MM-dd'),
        end: format(currentRange.end, 'yyyy-MM-dd')
    }), customDateRange = _j[0], setCustomDateRange = _j[1];
    var handleOpenModal = function () {
        setIsModalOpen(true);
        // Réinitialiser les valeurs par défaut
        setExportFormat(CalendarExportFormat.PDF);
        setFileName("calendrier_".concat(format(new Date(), 'yyyy-MM-dd')));
        setIncludeAllEvents(true);
        setSelectedEventTypes(Object.values(CalendarEventType));
        setUseCustomDateRange(false);
        setCustomDateRange({
            start: format(currentRange.start, 'yyyy-MM-dd'),
            end: format(currentRange.end, 'yyyy-MM-dd')
        });
    };
    var handleCloseModal = function () {
        setIsModalOpen(false);
    };
    var handleExport = function () { return __awaiter(void 0, void 0, void 0, function () {
        var options, blob, fileExtension, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    setIsLoading(true);
                    options = {
                        format: exportFormat,
                        fileName: fileName,
                        includeAllEvents: includeAllEvents,
                        eventTypes: includeAllEvents ? undefined : selectedEventTypes,
                        dateRange: useCustomDateRange
                            ? {
                                start: new Date(customDateRange.start),
                                end: new Date(customDateRange.end)
                            }
                            : currentRange
                    };
                    return [4 /*yield*/, exportCalendarEvents(options)];
                case 1:
                    blob = _a.sent();
                    fileExtension = '';
                    switch (exportFormat) {
                        case CalendarExportFormat.PDF:
                            fileExtension = '.pdf';
                            break;
                        case CalendarExportFormat.EXCEL:
                            fileExtension = '.xlsx';
                            break;
                        case CalendarExportFormat.CSV:
                            fileExtension = '.csv';
                            break;
                        case CalendarExportFormat.ICS:
                            fileExtension = '.ics';
                            break;
                    }
                    // Télécharger le fichier
                    downloadBlob(blob, "".concat(fileName).concat(fileExtension));
                    // Fermer le modal
                    handleCloseModal();
                    return [3 /*break*/, 4];
                case 2:
                    error_1 = _a.sent();
                    console.error('Erreur lors de l\'export:', error_1);
                    return [3 /*break*/, 4];
                case 3:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleEventTypeToggle = function (type) {
        setSelectedEventTypes(function (prevTypes) {
            if (prevTypes.includes(type)) {
                return prevTypes.filter(function (t) { return t !== type; });
            }
            else {
                return __spreadArray(__spreadArray([], prevTypes, true), [type], false);
            }
        });
    };
    var handleFormatChange = function (format) {
        setExportFormat(format);
        // Mettre à jour l'extension du fichier si le nom de fichier est basique
        if (fileName.match(/^calendrier_\d{4}-\d{2}-\d{2}$/)) {
            setFileName("calendrier_".concat(format(new Date(), 'yyyy-MM-dd')));
        }
    };
    return (<>
            <button onClick={handleOpenModal} className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <svg className="mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Exporter
            </button>

            {/* Modal d'export */}
            {isModalOpen && (<div className="fixed z-50 inset-0 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                                            Exporter le calendrier
                                        </h3>

                                        <div className="mt-4 space-y-4">
                                            {/* Format d'export */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Format
                                                </label>
                                                <div className="mt-1 grid grid-cols-2 gap-2">
                                                    <button type="button" onClick={function () { return handleFormatChange(CalendarExportFormat.PDF); }} className={"px-3 py-2 text-sm font-medium rounded-md ".concat(exportFormat === CalendarExportFormat.PDF
                ? 'bg-blue-50 text-blue-700 border border-blue-300'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50')}>
                                                        PDF
                                                    </button>

                                                    <button type="button" onClick={function () { return handleFormatChange(CalendarExportFormat.EXCEL); }} className={"px-3 py-2 text-sm font-medium rounded-md ".concat(exportFormat === CalendarExportFormat.EXCEL
                ? 'bg-blue-50 text-blue-700 border border-blue-300'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50')}>
                                                        Excel
                                                    </button>

                                                    <button type="button" onClick={function () { return handleFormatChange(CalendarExportFormat.CSV); }} className={"px-3 py-2 text-sm font-medium rounded-md ".concat(exportFormat === CalendarExportFormat.CSV
                ? 'bg-blue-50 text-blue-700 border border-blue-300'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50')}>
                                                        CSV
                                                    </button>

                                                    <button type="button" onClick={function () { return handleFormatChange(CalendarExportFormat.ICS); }} className={"px-3 py-2 text-sm font-medium rounded-md ".concat(exportFormat === CalendarExportFormat.ICS
                ? 'bg-blue-50 text-blue-700 border border-blue-300'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50')}>
                                                        iCalendar (.ics)
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Nom du fichier */}
                                            <div>
                                                <label htmlFor="file-name" className="block text-sm font-medium text-gray-700">
                                                    Nom du fichier
                                                </label>
                                                <div className="mt-1">
                                                    <input type="text" name="file-name" id="file-name" value={fileName} onChange={function (e) { return setFileName(e.target.value); }} className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"/>
                                                </div>
                                            </div>

                                            {/* Sélection des événements */}
                                            <div>
                                                <div className="flex items-start">
                                                    <div className="flex items-center h-5">
                                                        <input id="include-all-events" name="include-all-events" type="checkbox" checked={includeAllEvents} onChange={function () { return setIncludeAllEvents(!includeAllEvents); }} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"/>
                                                    </div>
                                                    <div className="ml-3 text-sm">
                                                        <label htmlFor="include-all-events" className="font-medium text-gray-700">
                                                            Inclure tous les événements
                                                        </label>
                                                    </div>
                                                </div>

                                                {!includeAllEvents && (<div className="mt-2 pl-7">
                                                        <p className="text-sm text-gray-500 mb-2">
                                                            Sélectionnez les types d'événements à inclure:
                                                        </p>
                                                        <div className="space-y-2">
                                                            {Object.values(CalendarEventType).map(function (type) { return (<div key={type} className="flex items-start">
                                                                    <div className="flex items-center h-5">
                                                                        <input id={"event-type-".concat(type)} name={"event-type-".concat(type)} type="checkbox" checked={selectedEventTypes.includes(type)} onChange={function () { return handleEventTypeToggle(type); }} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"/>
                                                                    </div>
                                                                    <div className="ml-3 text-sm">
                                                                        <label htmlFor={"event-type-".concat(type)} className="font-medium text-gray-700">
                                                                            {getEventTypeLabel(type)}
                                                                        </label>
                                                                    </div>
                                                                </div>); })}
                                                        </div>
                                                    </div>)}
                                            </div>

                                            {/* Plage de dates personnalisée */}
                                            <div>
                                                <div className="flex items-start">
                                                    <div className="flex items-center h-5">
                                                        <input id="custom-date-range" name="custom-date-range" type="checkbox" checked={useCustomDateRange} onChange={function () { return setUseCustomDateRange(!useCustomDateRange); }} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"/>
                                                    </div>
                                                    <div className="ml-3 text-sm">
                                                        <label htmlFor="custom-date-range" className="font-medium text-gray-700">
                                                            Utiliser une plage de dates personnalisée
                                                        </label>
                                                    </div>
                                                </div>

                                                {useCustomDateRange && (<div className="mt-2 pl-7 grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label htmlFor="date-start" className="block text-sm font-medium text-gray-700">
                                                                Date de début
                                                            </label>
                                                            <div className="mt-1">
                                                                <input type="date" name="date-start" id="date-start" value={customDateRange.start} onChange={function (e) { return setCustomDateRange(__assign(__assign({}, customDateRange), { start: e.target.value })); }} className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"/>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label htmlFor="date-end" className="block text-sm font-medium text-gray-700">
                                                                Date de fin
                                                            </label>
                                                            <div className="mt-1">
                                                                <input type="date" name="date-end" id="date-end" value={customDateRange.end} onChange={function (e) { return setCustomDateRange(__assign(__assign({}, customDateRange), { end: e.target.value })); }} className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"/>
                                                            </div>
                                                        </div>
                                                    </div>)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button type="button" onClick={handleExport} disabled={isLoading} className={"w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ".concat(isLoading
                ? 'bg-blue-300 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500', " sm:ml-3 sm:w-auto sm:text-sm")}>
                                    {isLoading ? (<>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Exportation...
                                        </>) : ('Exporter')}
                                </button>

                                <button type="button" onClick={handleCloseModal} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                                    Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                </div>)}
        </>);
};
// Fonction utilitaire pour obtenir l'étiquette d'un type d'événement
function getEventTypeLabel(type) {
    switch (type) {
        case CalendarEventType.LEAVE:
            return 'Congés';
        case CalendarEventType.DUTY:
            return 'Gardes';
        case CalendarEventType.ON_CALL:
            return 'Astreintes';
        case CalendarEventType.ASSIGNMENT:
            return 'Affectations';
        default:
            return 'Événement';
    }
}
