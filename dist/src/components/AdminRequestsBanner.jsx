'use client';
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
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
var AdminRequestsBanner = function () {
    var _a = useState([]), pendingLeaves = _a[0], setPendingLeaves = _a[1];
    var _b = useState(true), isLoading = _b[0], setIsLoading = _b[1];
    var _c = useState(null), error = _c[0], setError = _c[1];
    var _d = useState(null), processingId = _d[0], setProcessingId = _d[1];
    // Effet pour charger les demandes en attente
    useEffect(function () {
        var fetchPendingLeaves = function () { return __awaiter(void 0, void 0, void 0, function () {
            var response, err_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        setIsLoading(true);
                        setError(null);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, axios.get('/api/admin/leaves/pending')];
                    case 2:
                        response = _c.sent();
                        setPendingLeaves(response.data);
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _c.sent();
                        console.error('Erreur lors du chargement des demandes en attente:', err_1);
                        setError(((_b = (_a = err_1.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || 'Erreur lors du chargement des demandes');
                        return [3 /*break*/, 5];
                    case 4:
                        setIsLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        fetchPendingLeaves();
        // Mettre à jour toutes les 3 minutes
        var interval = setInterval(fetchPendingLeaves, 180000);
        return function () { return clearInterval(interval); };
    }, []);
    // Fonction pour approuver une demande
    var handleApprove = function (leaveId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, err_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    setProcessingId(leaveId);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, axios.post("/api/admin/leaves/".concat(leaveId, "/approve"))];
                case 2:
                    _c.sent();
                    // Mettre à jour la liste des demandes en attente
                    setPendingLeaves(pendingLeaves.filter(function (leave) { return leave.id !== leaveId; }));
                    if (!(pendingLeaves.length <= 2)) return [3 /*break*/, 4];
                    return [4 /*yield*/, axios.get('/api/admin/leaves/pending')];
                case 3:
                    response = _c.sent();
                    setPendingLeaves(response.data);
                    _c.label = 4;
                case 4: return [3 /*break*/, 7];
                case 5:
                    err_2 = _c.sent();
                    console.error("Erreur lors de l'approbation:", err_2);
                    setError(((_b = (_a = err_2.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || "Erreur lors de l'approbation");
                    return [3 /*break*/, 7];
                case 6:
                    setProcessingId(null);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    // Fonction pour rejeter une demande
    var handleReject = function (leaveId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, err_3;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    setProcessingId(leaveId);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, axios.post("/api/admin/leaves/".concat(leaveId, "/reject"))];
                case 2:
                    _c.sent();
                    // Mettre à jour la liste des demandes en attente
                    setPendingLeaves(pendingLeaves.filter(function (leave) { return leave.id !== leaveId; }));
                    if (!(pendingLeaves.length <= 2)) return [3 /*break*/, 4];
                    return [4 /*yield*/, axios.get('/api/admin/leaves/pending')];
                case 3:
                    response = _c.sent();
                    setPendingLeaves(response.data);
                    _c.label = 4;
                case 4: return [3 /*break*/, 7];
                case 5:
                    err_3 = _c.sent();
                    console.error("Erreur lors du rejet:", err_3);
                    setError(((_b = (_a = err_3.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || "Erreur lors du rejet");
                    return [3 /*break*/, 7];
                case 6:
                    setProcessingId(null);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    // Fonction pour formatter les dates
    var formatDate = function (dateString) {
        var date = new Date(dateString);
        return format(date, 'PPP', { locale: fr });
    };
    // Si pas de demandes en attente ou chargement, ne rien afficher
    if (isLoading || pendingLeaves.length === 0) {
        return null;
    }
    return (<div className="bg-gradient-to-r from-amber-50 to-amber-100 py-2 px-4 border-b border-amber-200">
            <div className="max-w-7xl mx-auto">
                <h3 className="text-sm font-medium text-amber-800 mb-2">Demandes de congés en attente</h3>

                {error && (<div className="text-xs text-red-600 mb-2 p-1 bg-red-50 rounded">
                        {error}
                    </div>)}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <AnimatePresence>
                        {pendingLeaves.map(function (leave) { return (<motion.div key={leave.id} className="bg-white p-3 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 border border-amber-200" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium">
                                            {leave.user.prenom || leave.user.firstName} {leave.user.nom || leave.user.lastName}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            Type: <span className="font-medium">{leave.type}</span>
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            Période: <span className="font-medium">{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</span>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button onClick={function () { return handleApprove(leave.id); }} disabled={processingId === leave.id} className="flex items-center justify-center bg-green-50 hover:bg-green-100 text-green-700 rounded-full p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Approuver la demande">
                                            <CheckCircleIcon className="h-6 w-6"/>
                                        </button>
                                        <button onClick={function () { return handleReject(leave.id); }} disabled={processingId === leave.id} className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-700 rounded-full p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Rejeter la demande">
                                            <XCircleIcon className="h-6 w-6"/>
                                        </button>
                                    </div>
                                </div>
                                {processingId === leave.id && (<div className="mt-2 text-xs text-gray-500 flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Traitement en cours...
                                    </div>)}
                            </motion.div>); })}
                    </AnimatePresence>
                </div>
            </div>
        </div>);
};
export default AdminRequestsBanner;
