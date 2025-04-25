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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LeaveForm } from '@/modules/leaves/components/LeaveForm';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Clock, CheckCircle, XCircle, Search, PlusCircle, FileText, Calendar as CalendarIcon, X as XIcon, AlertTriangle } from 'lucide-react';
export default function LeavesPage() {
    var _this = this;
    var _a = useAuth(), user = _a.user, authLoading = _a.isLoading;
    var _b = useState(null), balance = _b[0], setBalance = _b[1];
    var _c = useState(true), loadingBalance = _c[0], setLoadingBalance = _c[1];
    var _d = useState(null), errorBalance = _d[0], setErrorBalance = _d[1];
    // États pour la gestion des congés
    var _e = useState([]), leaves = _e[0], setLeaves = _e[1];
    var _f = useState(true), isLoadingLeaves = _f[0], setIsLoadingLeaves = _f[1];
    var _g = useState(null), errorLeaves = _g[0], setErrorLeaves = _g[1];
    // État pour le tri et le filtrage
    var _h = useState(''), searchTerm = _h[0], setSearchTerm = _h[1];
    var _j = useState(['PENDING', 'APPROVED']), statusFilter = _j[0], setStatusFilter = _j[1];
    var _k = useState({
        field: 'startDate',
        direction: 'desc'
    }), currentSort = _k[0], setCurrentSort = _k[1];
    // États pour les modales
    var _l = useState(false), isModalOpen = _l[0], setIsModalOpen = _l[1];
    var _m = useState(false), isDetailModalOpen = _m[0], setIsDetailModalOpen = _m[1];
    var _o = useState(false), isConfirmModalOpen = _o[0], setIsConfirmModalOpen = _o[1];
    var _p = useState(null), leaveToEdit = _p[0], setLeaveToEdit = _p[1];
    var _q = useState(null), leaveToCancel = _q[0], setLeaveToCancel = _q[1];
    var _r = useState(null), selectedLeave = _r[0], setSelectedLeave = _r[1];
    var _s = useState(0), refreshCounter = _s[0], setRefreshCounter = _s[1];
    var _t = useState(false), mounted = _t[0], setMounted = _t[1];
    var currentYear = new Date().getFullYear();
    // Récupérer les congés
    var fetchLeaves = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var response, err_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!user)
                        return [2 /*return*/];
                    setIsLoadingLeaves(true);
                    setErrorLeaves(null);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, axios.get('/api/leaves?userId=' + user.id)];
                case 2:
                    response = _c.sent();
                    setLeaves(response.data);
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _c.sent();
                    console.error('Erreur lors de la récupération des congés:', err_1);
                    setErrorLeaves(((_b = (_a = err_1.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || 'Impossible de charger les demandes de congés.');
                    setLeaves([]);
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoadingLeaves(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [user]);
    // Récupérer les données initiales
    useEffect(function () {
        setMounted(true);
        if (user) {
            fetchLeaves();
            // Récupération du solde
            var fetchBalance = function () { return __awaiter(_this, void 0, void 0, function () {
                var response, err_2;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            setLoadingBalance(true);
                            setErrorBalance(null);
                            _c.label = 1;
                        case 1:
                            _c.trys.push([1, 3, 4, 5]);
                            return [4 /*yield*/, axios.get('/api/leaves/balance?userId=' + user.id + '&year=' + currentYear)];
                        case 2:
                            response = _c.sent();
                            setBalance(response.data);
                            return [3 /*break*/, 5];
                        case 3:
                            err_2 = _c.sent();
                            console.error('Erreur lors de la récupération du solde de congés:', err_2);
                            setErrorBalance(((_b = (_a = err_2.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || 'Impossible de charger le solde des congés.');
                            return [3 /*break*/, 5];
                        case 4:
                            setLoadingBalance(false);
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            }); };
            fetchBalance();
        }
        else if (!authLoading) {
            setLoadingBalance(false);
            setErrorBalance('Utilisateur non authentifié.');
            setIsLoadingLeaves(false);
            setErrorLeaves('Utilisateur non authentifié pour charger les congés.');
            setLeaves([]);
        }
    }, [user, currentYear, authLoading, refreshCounter, fetchLeaves]);
    // Gestionnaires d'événements
    var handleStatusFilterChange = function (status) {
        setStatusFilter(function (prev) {
            if (prev.includes(status)) {
                return prev.filter(function (s) { return s !== status; });
            }
            else {
                return __spreadArray(__spreadArray([], prev, true), [status], false);
            }
        });
    };
    var handleSortChange = function (field) {
        setCurrentSort(function (prev) { return ({
            field: field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }); });
    };
    var handleNewLeaveClick = function () {
        setLeaveToEdit(null);
        setIsModalOpen(true);
    };
    var handleEditLeaveClick = function (leave) {
        setLeaveToEdit(leave);
        setIsModalOpen(true);
    };
    var handleCancelLeaveClick = function (leave) {
        setLeaveToCancel(leave);
        setIsConfirmModalOpen(true);
    };
    var handleViewLeaveDetails = function (leave) {
        setSelectedLeave(leave);
        setIsDetailModalOpen(true);
    };
    var handleCloseModal = function () {
        setIsModalOpen(false);
        setLeaveToEdit(null);
    };
    var handleCloseDetailModal = function () {
        setIsDetailModalOpen(false);
        setSelectedLeave(null);
    };
    var handleCloseConfirmModal = function () {
        setIsConfirmModalOpen(false);
        setLeaveToCancel(null);
    };
    var handleLeaveCreatedOrUpdated = function (savedLeave) {
        console.log('Demande sauvegardée:', savedLeave);
        setIsModalOpen(false);
        setLeaveToEdit(null);
        setRefreshCounter(function (prev) { return prev + 1; });
    };
    var handleConfirmCancelLeave = function () { return __awaiter(_this, void 0, void 0, function () {
        var err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!leaveToCancel)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, axios.post("/api/leaves/".concat(leaveToCancel.id, "/cancel"), {})];
                case 2:
                    _a.sent();
                    console.log('Demande annulée:', leaveToCancel.id);
                    setRefreshCounter(function (prev) { return prev + 1; });
                    return [3 /*break*/, 5];
                case 3:
                    err_3 = _a.sent();
                    console.error("Erreur lors de l'annulation de la demande:", err_3);
                    return [3 /*break*/, 5];
                case 4:
                    handleCloseConfirmModal();
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // Formatage des dates
    var formatDate = function (dateString) {
        try {
            return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
        }
        catch (error) {
            return dateString.toString();
        }
    };
    // Filtrer les congés
    var filteredLeaves = leaves.filter(function (leave) {
        // Filtrer par statut
        if (statusFilter.length > 0 && !statusFilter.includes(leave.status)) {
            return false;
        }
        // Filtrer par recherche
        if (searchTerm) {
            var searchLower = searchTerm.toLowerCase();
            var typeMatch = leave.type.toLowerCase().includes(searchLower);
            var statusMatch = getStatusText(leave.status).toLowerCase().includes(searchLower);
            var dateMatch = formatDate(leave.startDate).toLowerCase().includes(searchLower) ||
                formatDate(leave.endDate).toLowerCase().includes(searchLower);
            var reasonMatch = leave.reason ? leave.reason.toLowerCase().includes(searchLower) : false;
            return typeMatch || statusMatch || dateMatch || reasonMatch;
        }
        return true;
    });
    // Trier les congés
    var sortedLeaves = __spreadArray([], filteredLeaves, true).sort(function (a, b) {
        var field = currentSort.field;
        var direction = currentSort.direction === 'asc' ? 1 : -1;
        if (field === 'startDate' || field === 'endDate') {
            return (new Date(a[field]).getTime() - new Date(b[field]).getTime()) * direction;
        }
        if (field === 'type' || field === 'status') {
            return a[field].localeCompare(b[field]) * direction;
        }
        return 0;
    });
    // Formatage et affichage de l'UI
    var getStatusColor = function (status) {
        switch (status) {
            case 'PENDING': return 'bg-yellow-50 border-yellow-300 text-yellow-700';
            case 'APPROVED': return 'bg-green-50 border-green-300 text-green-700';
            case 'REJECTED': return 'bg-red-50 border-red-300 text-red-700';
            case 'CANCELLED': return 'bg-gray-50 border-gray-300 text-gray-700';
            default: return 'bg-gray-50 border-gray-300 text-gray-700';
        }
    };
    var getStatusBadgeColor = function (status) {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'APPROVED': return 'bg-green-100 text-green-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            case 'CANCELLED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    var getStatusText = function (status) {
        switch (status) {
            case 'PENDING': return 'En attente';
            case 'APPROVED': return 'Approuvé';
            case 'REJECTED': return 'Refusé';
            case 'CANCELLED': return 'Annulé';
            default: return status;
        }
    };
    var getStatusIcon = function (status) {
        switch (status) {
            case 'PENDING': return <Clock className="w-3 h-3 mr-1"/>;
            case 'APPROVED': return <CheckCircle className="w-3 h-3 mr-1"/>;
            case 'REJECTED': return <XCircle className="w-3 h-3 mr-1"/>;
            case 'CANCELLED': return <AlertTriangle className="w-3 h-3 mr-1"/>;
            default: return null;
        }
    };
    // Compteurs pour le dashboard
    var counts = {
        total: leaves.length,
        pending: leaves.filter(function (r) { return r.status === 'PENDING'; }).length,
        approved: leaves.filter(function (r) { return r.status === 'APPROVED'; }).length,
        rejected: leaves.filter(function (r) { return r.status === 'REJECTED'; }).length,
        cancelled: leaves.filter(function (r) { return r.status === 'CANCELLED'; }).length,
    };
    // Animation variants
    var fadeIn = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.4 } }
    };
    if (authLoading || !mounted) {
        return (<div className="flex justify-center items-center h-64 w-full">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>);
    }
    if (!user) {
        return (<div className="container mx-auto px-4 py-8">
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
                    <p className="font-bold">Accès refusé</p>
                    <p>Vous devez être connecté pour accéder à cette page.</p>
                </div>
            </div>);
    }
    return (<motion.div className="max-w-screen-xl mx-auto px-4 py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            {/* En-tête */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.5 }}>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Mes demandes de congés</h1>
                    <p className="text-gray-600">Gérez vos demandes de congés facilement</p>
                </motion.div>

                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
                    <button onClick={handleNewLeaveClick} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <PlusCircle className="w-4 h-4 mr-2"/>
                        Nouvelle demande
                    </button>
                </motion.div>
            </div>

            {/* Section Solde */}
            <motion.div className="bg-white shadow rounded-lg p-6 mb-8" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Mon solde de congés ({currentYear})</h2>
                {loadingBalance ? (<div className="flex justify-center py-4">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>) : errorBalance ? (<div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
                        <p className="font-medium">Erreur</p>
                        <p>{errorBalance}</p>
                    </div>) : balance ? (<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <motion.div className="bg-blue-50 p-4 rounded-lg shadow-sm" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                            <p className="text-sm text-blue-600 font-medium mb-1">Total alloué</p>
                            <p className="text-3xl font-bold text-blue-800">{balance.totalDays}</p>
                            <p className="text-xs text-blue-500 mt-1">jours de congés</p>
                        </motion.div>
                        <motion.div className="bg-orange-50 p-4 rounded-lg shadow-sm" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                            <p className="text-sm text-orange-600 font-medium mb-1">Utilisés</p>
                            <p className="text-3xl font-bold text-orange-800">{balance.usedDays}</p>
                            <p className="text-xs text-orange-500 mt-1">jours pris ou planifiés</p>
                        </motion.div>
                        <motion.div className="bg-green-50 p-4 rounded-lg shadow-sm" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                            <p className="text-sm text-green-600 font-medium mb-1">Restants</p>
                            <p className="text-3xl font-bold text-green-800">{balance.remainingDays}</p>
                            <p className="text-xs text-green-500 mt-1">jours disponibles</p>
                        </motion.div>
                    </div>) : null}
            </motion.div>

            {/* Filtres et recherche */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="w-5 h-5 text-gray-400"/>
                        </div>
                        <input type="text" className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Rechercher un congé..." value={searchTerm} onChange={function (e) { return setSearchTerm(e.target.value); }}/>
                        {searchTerm && (<button className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600" onClick={function () { return setSearchTerm(''); }}>
                                <XIcon className="w-5 h-5"/>
                            </button>)}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button onClick={function () { return setStatusFilter(['PENDING', 'APPROVED']); }} className={"px-4 py-2 rounded-md text-sm font-medium transition-colors ".concat(statusFilter.length === 2 && statusFilter.includes('PENDING') && statusFilter.includes('APPROVED')
            ? 'bg-indigo-100 text-indigo-700'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300')}>
                            Actifs
                        </button>
                        <button onClick={function () { return handleStatusFilterChange('PENDING'); }} className={"px-4 py-2 rounded-md text-sm font-medium transition-colors ".concat(statusFilter.includes('PENDING')
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300')}>
                            <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-2"/>
                                En attente ({counts.pending})
                            </div>
                        </button>
                        <button onClick={function () { return handleStatusFilterChange('APPROVED'); }} className={"px-4 py-2 rounded-md text-sm font-medium transition-colors ".concat(statusFilter.includes('APPROVED')
            ? 'bg-green-100 text-green-700'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300')}>
                            <div className="flex items-center">
                                <CheckCircle className="w-4 h-4 mr-2"/>
                                Approuvés ({counts.approved})
                            </div>
                        </button>
                        <button onClick={function () { return handleStatusFilterChange('REJECTED'); }} className={"px-4 py-2 rounded-md text-sm font-medium transition-colors ".concat(statusFilter.includes('REJECTED')
            ? 'bg-red-100 text-red-700'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300')}>
                            <div className="flex items-center">
                                <XCircle className="w-4 h-4 mr-2"/>
                                Refusés ({counts.rejected})
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Liste des congés */}
            {isLoadingLeaves ? (<div className="flex justify-center items-center h-64">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>) : errorLeaves ? (<div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 rounded">
                    <p className="font-medium">Erreur</p>
                    <p>{errorLeaves}</p>
                </div>) : sortedLeaves.length === 0 ? (<motion.div className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-center" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune demande trouvée</h3>
                    <p className="mt-1 text-gray-500">Vous n'avez pas encore de demandes de congés ou aucune ne correspond à vos critères.</p>
                    <button onClick={handleNewLeaveClick} className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <PlusCircle className="w-4 h-4 mr-2"/>
                        Créer une demande
                    </button>
                </motion.div>) : (<div className="grid gap-4">
                    {sortedLeaves.map(function (leave, index) { return (<motion.div key={leave.id} className={"border-l-4 ".concat(getStatusColor(leave.status), " bg-white shadow-sm rounded-lg overflow-hidden")} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 + index * 0.05, duration: 0.5 }}>
                            <div className="p-5">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center mb-2">
                                            <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ".concat(getStatusBadgeColor(leave.status))}>
                                                {getStatusIcon(leave.status)}
                                                {getStatusText(leave.status)}
                                            </span>
                                            <span className="ml-2 bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                {leave.type}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap">
                                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                                <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"/>
                                                {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:ml-4">
                                                <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"/>
                                                {leave.countedDays} jour{leave.countedDays > 1 ? 's' : ''}
                                            </div>
                                        </div>
                                        {leave.reason && (<p className="mt-2 text-sm text-gray-600 line-clamp-2">{leave.reason}</p>)}
                                    </div>

                                    <div className="mt-4 md:mt-0 flex space-x-2">
                                        {leave.status === 'PENDING' && (<button onClick={function () { return handleCancelLeaveClick(leave); }} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                                <XCircle className="w-4 h-4 mr-2"/>
                                                Annuler
                                            </button>)}
                                        <button onClick={function () { return handleViewLeaveDetails(leave); }} className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                            <FileText className="w-4 h-4 mr-2"/>
                                            Détails
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>); })}
                </div>)}

            {/* Modale pour le formulaire de congé (création/édition) */}
            {isModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {leaveToEdit ? 'Modifier la demande' : 'Nouvelle demande de congé'}
                                </h3>
                                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500">
                                    <XIcon className="h-6 w-6"/>
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-4">
                            <LeaveForm userId={user.id} onSuccess={handleLeaveCreatedOrUpdated}/>
                        </div>
                    </motion.div>
                </div>)}

            {/* Modale de détails */}
            {isDetailModalOpen && selectedLeave && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">Détails de la demande</h3>
                                <button onClick={handleCloseDetailModal} className="text-gray-400 hover:text-gray-500">
                                    <XIcon className="h-6 w-6"/>
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-4">
                            <div className="mb-4">
                                <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ".concat(getStatusBadgeColor(selectedLeave.status))}>
                                    {getStatusIcon(selectedLeave.status)}
                                    {getStatusText(selectedLeave.status)}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Type de congé</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedLeave.type}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Jours comptabilisés</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedLeave.countedDays} jour{selectedLeave.countedDays > 1 ? 's' : ''}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Date de début</label>
                                        <p className="mt-1 text-sm text-gray-900">{formatDate(selectedLeave.startDate)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Date de fin</label>
                                        <p className="mt-1 text-sm text-gray-900">{formatDate(selectedLeave.endDate)}</p>
                                    </div>
                                </div>

                                {selectedLeave.reason && (<div>
                                        <label className="block text-sm font-medium text-gray-700">Motif</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedLeave.reason}</p>
                                    </div>)}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Date de création</label>
                                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedLeave.createdAt)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                            {selectedLeave.status === 'PENDING' && (<button onClick={function () {
                    handleCancelLeaveClick(selectedLeave);
                    handleCloseDetailModal();
                }} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                    <XCircle className="w-4 h-4 mr-2"/>
                                    Annuler cette demande
                                </button>)}
                            <button onClick={handleCloseDetailModal} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Fermer
                            </button>
                        </div>
                    </motion.div>
                </div>)}

            {/* Modale de confirmation pour l'annulation */}
            {isConfirmModalOpen && leaveToCancel && (<ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmCancelLeave} title="Confirmer l'annulation" message={"\u00CAtes-vous s\u00FBr de vouloir annuler cette demande de cong\u00E9 ? Cette action est irr\u00E9versible."} confirmButtonText="Oui, annuler" cancelButtonText="Non"/>)}
        </motion.div>);
}
