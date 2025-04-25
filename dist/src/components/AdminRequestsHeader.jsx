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
import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, AlertCircle, User } from 'lucide-react';
import { formatDateRange, groupOverlappingRequests } from '@/lib/dateUtils';
/**
 * Composant header pour l'interface admin présentant un aperçu des congés
 * aux mêmes dates que la requête actuellement consultée
 */
export default function AdminRequestsHeader(_a) {
    var _this = this;
    var activeRequest = _a.activeRequest, allRequests = _a.allRequests, onClose = _a.onClose;
    var _b = useState({
        showOverlappingRequests: true,
        showUserDetails: true,
        highlightOverlappingCount: 3,
        groupRequestsByDate: false,
        showWarningWhenOverlapping: true
    }), config = _b[0], setConfig = _b[1];
    // Charger la configuration
    useEffect(function () {
        var fetchConfig = function () { return __awaiter(_this, void 0, void 0, function () {
            var response, data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, fetch('/api/admin/configuration')];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        if (data.header) {
                            setConfig(data.header);
                        }
                        _a.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        console.error("Erreur lors du chargement de la configuration:", error_1);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        fetchConfig();
    }, []);
    if (!activeRequest || activeRequest.type !== 'congés' || !activeRequest.dates) {
        return null;
    }
    // Filtrer les requêtes qui se chevauchent avec la requête active
    var overlappingRequests = allRequests.filter(function (request) {
        if (request.id === activeRequest.id || request.type !== 'congés' || !request.dates) {
            return false;
        }
        // Vérifier si les dates se chevauchent
        var activeStart = new Date(activeRequest.dates.start);
        var activeEnd = new Date(activeRequest.dates.end);
        var requestStart = new Date(request.dates.start);
        var requestEnd = new Date(request.dates.end);
        return ((requestStart <= activeEnd && requestEnd >= activeStart) &&
            (request.status === 'approuvée' || request.status === 'en-attente'));
    });
    // Si la configuration dit de ne pas afficher les requêtes qui se chevauchent
    if (!config.showOverlappingRequests && overlappingRequests.length === 0) {
        return (<div className="bg-slate-50 border-b border-slate-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                    {config.showUserDetails && (<div className="flex items-center gap-2">
                            <User size={16} className="text-slate-500"/>
                            <span className="font-medium">{activeRequest.userName}</span>
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                                {activeRequest.type}
                            </span>
                            <div className="flex items-center ml-2">
                                <Calendar size={14} className="mr-1 text-slate-500"/>
                                <span>{formatDateRange(activeRequest.dates.start, activeRequest.dates.end, 'short')}</span>
                            </div>
                        </div>)}

                    {onClose && (<button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                            ×
                        </button>)}
                </div>
            </div>);
    }
    // Séparer les requêtes approuvées et en attente
    var approvedRequests = overlappingRequests.filter(function (r) { return r.status === 'approuvée'; });
    var pendingRequests = overlappingRequests.filter(function (r) { return r.status === 'en-attente'; });
    var requestDateRange = formatDateRange(activeRequest.dates.start, activeRequest.dates.end, 'short');
    // Si on doit grouper les requêtes par date
    var groupedApproved = config.groupRequestsByDate
        ? groupOverlappingRequests(approvedRequests)
        : null;
    var groupedPending = config.groupRequestsByDate
        ? groupOverlappingRequests(pendingRequests)
        : null;
    var totalOverlappingCount = approvedRequests.length + pendingRequests.length;
    var showWarning = config.showWarningWhenOverlapping &&
        totalOverlappingCount >= config.highlightOverlappingCount;
    return (<div className="bg-slate-50 border-b border-slate-200 p-3 text-sm">
            <div className="flex items-center justify-between">
                {config.showUserDetails && (<div className="flex items-center gap-2">
                        <User size={16} className="text-slate-500"/>
                        <span className="font-medium">{activeRequest.userName}</span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                            {activeRequest.type}
                        </span>
                        <div className="flex items-center ml-2">
                            <Calendar size={14} className="mr-1 text-slate-500"/>
                            <span>{requestDateRange}</span>
                        </div>
                    </div>)}

                {onClose && (<button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                        ×
                    </button>)}
            </div>

            {config.showOverlappingRequests && (approvedRequests.length > 0 || pendingRequests.length > 0) && (<div className="mt-2 text-xs flex flex-col gap-1.5">
                    <div className="font-medium text-slate-700">Autres absences aux mêmes dates :</div>

                    {approvedRequests.length > 0 && (<div className="flex items-start gap-1.5">
                            <CheckCircle size={14} className="text-green-500 mt-0.5"/>
                            <div>
                                <span className="font-medium text-green-700">Validées :</span>{' '}
                                {config.groupRequestsByDate ? (<div className="flex flex-wrap gap-y-1 gap-x-2 mt-1">
                                        {groupedApproved.map(function (group, idx) { return (<span key={idx} className="bg-green-50 px-2 py-0.5 rounded-md text-green-800">
                                                <span className="font-medium">{group.users.join(', ')}</span>
                                                <span className="ml-1 text-xs">
                                                    ({formatDateRange(group.dates.start, group.dates.end, 'short')})
                                                </span>
                                            </span>); })}
                                    </div>) : (approvedRequests.map(function (req, index) { return (<span key={req.id} className="whitespace-nowrap">
                                            {req.userName}
                                            {index < approvedRequests.length - 1 ? ', ' : ''}
                                        </span>); }))}
                            </div>
                        </div>)}

                    {pendingRequests.length > 0 && (<div className="flex items-start gap-1.5">
                            <Clock size={14} className="text-amber-500 mt-0.5"/>
                            <div>
                                <span className="font-medium text-amber-700">En attente :</span>{' '}
                                {config.groupRequestsByDate ? (<div className="flex flex-wrap gap-y-1 gap-x-2 mt-1">
                                        {groupedPending.map(function (group, idx) { return (<span key={idx} className="bg-amber-50 px-2 py-0.5 rounded-md text-amber-800">
                                                <span className="font-medium">{group.users.join(', ')}</span>
                                                <span className="ml-1 text-xs">
                                                    ({formatDateRange(group.dates.start, group.dates.end, 'short')})
                                                </span>
                                            </span>); })}
                                    </div>) : (pendingRequests.map(function (req, index) { return (<span key={req.id} className="whitespace-nowrap">
                                            {req.userName}
                                            {index < pendingRequests.length - 1 ? ', ' : ''}
                                        </span>); }))}
                            </div>
                        </div>)}

                    {showWarning && (<div className="flex items-start gap-1.5 text-orange-700">
                            <AlertCircle size={14} className="text-orange-500 mt-0.5"/>
                            <div>
                                <span className="font-medium">Attention :</span> {approvedRequests.length + pendingRequests.length} personnes
                                absentes sur cette période
                            </div>
                        </div>)}
                </div>)}
        </div>);
}
