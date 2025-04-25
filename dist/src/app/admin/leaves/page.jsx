'use client';
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
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle, XCircle, Search, Filter, ChevronDown, FileText, Calendar as CalendarIcon, X as XIcon } from 'lucide-react';
export default function AdminLeavesPage() {
    var _this = this;
    var _a, _b, _c, _d;
    var _e = useState([]), requests = _e[0], setRequests = _e[1];
    var _f = useState(true), loading = _f[0], setLoading = _f[1];
    var _g = useState('all'), selectedFilter = _g[0], setSelectedFilter = _g[1];
    var _h = useState(''), searchTerm = _h[0], setSearchTerm = _h[1];
    var _j = useState(['PENDING', 'APPROVED']), statusFilters = _j[0], setStatusFilters = _j[1];
    var _k = useState([]), typeFilters = _k[0], setTypeFilters = _k[1];
    var _l = useState([]), types = _l[0], setTypes = _l[1];
    var _m = useState(false), isModalOpen = _m[0], setIsModalOpen = _m[1];
    var _o = useState(null), selectedRequest = _o[0], setSelectedRequest = _o[1];
    var _p = useState(null), processingId = _p[0], setProcessingId = _p[1];
    var _q = useAuth(), user = _q.user, authLoading = _q.isLoading;
    var router = useRouter();
    var _r = useState(false), mounted = _r[0], setMounted = _r[1];
    // Vérifier si l'utilisateur est admin
    useEffect(function () {
        setMounted(true);
        if (mounted && !authLoading) {
            var isAdmin = user && (user.role === 'ADMIN_TOTAL' || user.role === 'ADMIN_PARTIEL');
            if (!isAdmin) {
                router.push('/'); // Rediriger les non-admins
            }
        }
    }, [user, authLoading, mounted, router]);
    // Récupérer les demandes de congés
    useEffect(function () {
        fetchRequests();
        fetchLeaveTypes();
    }, [statusFilters, typeFilters]);
    var fetchRequests = function () { return __awaiter(_this, void 0, void 0, function () {
        var params, response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    setLoading(true);
                    params = {};
                    // Si des statuts sont sélectionnés, les ajouter sous forme de tableau
                    if (statusFilters.length > 0 && statusFilters.length < 4) {
                        params.status = statusFilters;
                    }
                    if (typeFilters.length > 0) {
                        params.type = typeFilters;
                    }
                    return [4 /*yield*/, axios.get('/api/leaves', { params: params })];
                case 1:
                    response = _a.sent();
                    setRequests(response.data);
                    setLoading(false);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error('Erreur lors du chargement des demandes de congés:', error_1);
                    toast.error('Erreur lors du chargement des demandes de congés');
                    setLoading(false);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var fetchLeaveTypes = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios.get('/api/leaves/types')];
                case 1:
                    response = _a.sent();
                    setTypes(response.data);
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error('Erreur lors du chargement des types de congés:', error_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleStatusFilterChange = function (status) {
        setStatusFilters(function (prev) {
            if (prev.includes(status)) {
                return prev.filter(function (s) { return s !== status; });
            }
            else {
                return __spreadArray(__spreadArray([], prev, true), [status], false);
            }
        });
    };
    var handleTypeFilterChange = function (type) {
        setTypeFilters(function (prev) {
            if (prev.includes(type)) {
                return prev.filter(function (t) { return t !== type; });
            }
            else {
                return __spreadArray(__spreadArray([], prev, true), [type], false);
            }
        });
    };
    var handleApprove = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    setProcessingId(id);
                    return [4 /*yield*/, axios.put("/api/leaves/".concat(id, "/approve"))];
                case 1:
                    _a.sent();
                    toast.success('Demande approuvée avec succès');
                    // Mettre à jour localement
                    setRequests(function (prev) {
                        return prev.map(function (req) {
                            return req.id === id ? __assign(__assign({}, req), { status: 'APPROVED' }) : req;
                        });
                    });
                    if ((selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.id) === id) {
                        setSelectedRequest(function (prev) { return prev ? __assign(__assign({}, prev), { status: 'APPROVED' }) : null; });
                    }
                    return [3 /*break*/, 4];
                case 2:
                    error_3 = _a.sent();
                    console.error('Erreur lors de l\'approbation de la demande:', error_3);
                    toast.error('Erreur lors de l\'approbation de la demande');
                    return [3 /*break*/, 4];
                case 3:
                    setProcessingId(null);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleReject = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    setProcessingId(id);
                    return [4 /*yield*/, axios.put("/api/leaves/".concat(id, "/reject"))];
                case 1:
                    _a.sent();
                    toast.success('Demande refusée avec succès');
                    // Mettre à jour localement
                    setRequests(function (prev) {
                        return prev.map(function (req) {
                            return req.id === id ? __assign(__assign({}, req), { status: 'REJECTED' }) : req;
                        });
                    });
                    if ((selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.id) === id) {
                        setSelectedRequest(function (prev) { return prev ? __assign(__assign({}, prev), { status: 'REJECTED' }) : null; });
                    }
                    return [3 /*break*/, 4];
                case 2:
                    error_4 = _a.sent();
                    console.error('Erreur lors du refus de la demande:', error_4);
                    toast.error('Erreur lors du refus de la demande');
                    return [3 /*break*/, 4];
                case 3:
                    setProcessingId(null);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var openRequestDetails = function (request) {
        setSelectedRequest(request);
        setIsModalOpen(true);
    };
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
    var formatDate = function (dateString) {
        try {
            return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
        }
        catch (error) {
            return dateString;
        }
    };
    // Filtrer les résultats par terme de recherche
    var filteredRequests = requests.filter(function (request) {
        if (!searchTerm)
            return true;
        var searchLower = searchTerm.toLowerCase();
        var userName = "".concat(request.user.prenom || request.user.firstName || '', " ").concat(request.user.nom || request.user.lastName || '').toLowerCase();
        var userEmail = (request.user.email || '').toLowerCase();
        return userName.includes(searchLower) ||
            userEmail.includes(searchLower) ||
            (request.type || '').toLowerCase().includes(searchLower) ||
            (request.reason || '').toLowerCase().includes(searchLower);
    });
    // Obtenir les compteurs
    var counts = {
        total: requests.length,
        pending: requests.filter(function (r) { return r.status === 'PENDING'; }).length,
        approved: requests.filter(function (r) { return r.status === 'APPROVED'; }).length,
        rejected: requests.filter(function (r) { return r.status === 'REJECTED'; }).length,
        cancelled: requests.filter(function (r) { return r.status === 'CANCELLED'; }).length,
    };
    // Animation variants
    var fadeIn = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.4 } }
    };
    if (!mounted || authLoading) {
        return (<div className="flex justify-center items-center h-64 w-full">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>);
    }
    if (!user || (user.role !== 'ADMIN_TOTAL' && user.role !== 'ADMIN_PARTIEL')) {
        return null; // Redirection gérée par l'useEffect
    }
    return (<motion.div className="max-w-screen-xl mx-auto px-4 py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.5 }}>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Demandes de congés</h1>
                    <p className="text-gray-600">Gérez les demandes de congés du personnel</p>
                </motion.div>

                <motion.div className="flex flex-wrap gap-2 mt-4 md:mt-0" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
                    <button onClick={function () { return setStatusFilters(['PENDING', 'APPROVED']); }} className={"px-4 py-2 rounded-md text-sm font-medium transition-colors ".concat(statusFilters.length === 2 && statusFilters.includes('PENDING') && statusFilters.includes('APPROVED')
            ? 'bg-indigo-100 text-indigo-700'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300')}>
                        Actives
                    </button>
                    <button onClick={function () { return handleStatusFilterChange('PENDING'); }} className={"px-4 py-2 rounded-md text-sm font-medium transition-colors ".concat(statusFilters.includes('PENDING')
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300')}>
                        <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2"/>
                            En attente ({counts.pending})
                        </div>
                    </button>
                    <button onClick={function () { return handleStatusFilterChange('APPROVED'); }} className={"px-4 py-2 rounded-md text-sm font-medium transition-colors ".concat(statusFilters.includes('APPROVED')
            ? 'bg-green-100 text-green-700'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300')}>
                        <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2"/>
                            Approuvées ({counts.approved})
                        </div>
                    </button>
                    <button onClick={function () { return handleStatusFilterChange('REJECTED'); }} className={"px-4 py-2 rounded-md text-sm font-medium transition-colors ".concat(statusFilters.includes('REJECTED')
            ? 'bg-red-100 text-red-700'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300')}>
                        <div className="flex items-center">
                            <XCircle className="w-4 h-4 mr-2"/>
                            Refusées ({counts.rejected})
                        </div>
                    </button>
                </motion.div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search className="w-5 h-5 text-gray-400"/>
                    </div>
                    <input type="text" className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Rechercher un utilisateur, type, raison..." value={searchTerm} onChange={function (e) { return setSearchTerm(e.target.value); }}/>
                    {searchTerm && (<button className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600" onClick={function () { return setSearchTerm(''); }}>
                            <XIcon className="w-5 h-5"/>
                        </button>)}
                </div>

                {types.length > 0 && (<div className="relative">
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50">
                            <Filter className="w-4 h-4"/>
                            <span>Types</span>
                            <ChevronDown className="w-4 h-4"/>
                        </button>
                        {/* Dropdown pour les types - à implémenter si nécessaire */}
                    </div>)}
            </div>

            {loading ? (<div className="flex justify-center items-center h-64">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>) : (<div className="grid gap-4">
                    {filteredRequests.length === 0 ? (<motion.div className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-center" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                            <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune demande trouvée</h3>
                            <p className="mt-1 text-gray-500">Aucune demande de congé ne correspond aux critères sélectionnés.</p>
                        </motion.div>) : (filteredRequests.map(function (request, index) { return (<motion.div key={request.id} className={"border-l-4 ".concat(getStatusColor(request.status), " bg-white shadow-sm rounded-lg overflow-hidden")} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 + index * 0.05, duration: 0.5 }}>
                                <div className="p-5">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center mb-2">
                                                <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ".concat(getStatusBadgeColor(request.status))}>
                                                    {request.status === 'PENDING' && <Clock className="w-3 h-3 mr-1"/>}
                                                    {request.status === 'APPROVED' && <CheckCircle className="w-3 h-3 mr-1"/>}
                                                    {request.status === 'REJECTED' && <XCircle className="w-3 h-3 mr-1"/>}
                                                    {getStatusText(request.status)}
                                                </span>
                                                <span className="ml-2 bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                    {request.type}
                                                </span>
                                            </div>
                                            <h2 className="text-lg font-medium text-gray-900 truncate">
                                                {request.user.prenom || request.user.firstName} {request.user.nom || request.user.lastName}
                                            </h2>
                                            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap">
                                                <div className="mt-2 flex items-center text-sm text-gray-500">
                                                    <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"/>
                                                    {formatDate(request.startDate)} - {formatDate(request.endDate)}
                                                </div>
                                                <div className="mt-2 flex items-center text-sm text-gray-500 sm:ml-4">
                                                    <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"/>
                                                    {request.countedDays} jour{request.countedDays > 1 ? 's' : ''}
                                                </div>
                                            </div>
                                            {request.reason && (<p className="mt-2 text-sm text-gray-600 line-clamp-2">{request.reason}</p>)}
                                        </div>

                                        <div className="mt-4 md:mt-0 flex space-x-2">
                                            {request.status === 'PENDING' && (<>
                                                    <button onClick={function () { return handleApprove(request.id); }} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50" disabled={processingId === request.id}>
                                                        {processingId === request.id ? (<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>) : (<CheckCircle className="w-4 h-4 mr-2"/>)}
                                                        Approuver
                                                    </button>
                                                    <button onClick={function () { return handleReject(request.id); }} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50" disabled={processingId === request.id}>
                                                        {processingId === request.id ? (<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>) : (<XCircle className="w-4 h-4 mr-2"/>)}
                                                        Refuser
                                                    </button>
                                                </>)}
                                            <button onClick={function () { return openRequestDetails(request); }} className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                                <FileText className="w-4 h-4 mr-2"/>
                                                Détails
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>); }))}
                </div>)}

            {/* Modal de détails de la demande */}
            {isModalOpen && selectedRequest && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">Détails de la demande de congé</h3>
                                <button onClick={function () { return setIsModalOpen(false); }} className="text-gray-400 hover:text-gray-500">
                                    <XIcon className="h-6 w-6"/>
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-4">
                            <div className="mb-4">
                                <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ".concat(getStatusBadgeColor(selectedRequest.status))}>
                                    {selectedRequest.status === 'PENDING' && <Clock className="w-3 h-3 mr-1"/>}
                                    {selectedRequest.status === 'APPROVED' && <CheckCircle className="w-3 h-3 mr-1"/>}
                                    {selectedRequest.status === 'REJECTED' && <XCircle className="w-3 h-3 mr-1"/>}
                                    {getStatusText(selectedRequest.status)}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Utilisateur</label>
                                    <div className="mt-1 flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                                            {(((_a = selectedRequest.user.prenom) === null || _a === void 0 ? void 0 : _a[0]) || ((_b = selectedRequest.user.firstName) === null || _b === void 0 ? void 0 : _b[0]) || '') +
                (((_c = selectedRequest.user.nom) === null || _c === void 0 ? void 0 : _c[0]) || ((_d = selectedRequest.user.lastName) === null || _d === void 0 ? void 0 : _d[0]) || '')}
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900">
                                                {selectedRequest.user.prenom || selectedRequest.user.firstName} {selectedRequest.user.nom || selectedRequest.user.lastName}
                                            </p>
                                            <p className="text-sm text-gray-500">{selectedRequest.user.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Type de congé</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.type}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Jours comptabilisés</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.countedDays} jour{selectedRequest.countedDays > 1 ? 's' : ''}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Date de début</label>
                                        <p className="mt-1 text-sm text-gray-900">{formatDate(selectedRequest.startDate)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Date de fin</label>
                                        <p className="mt-1 text-sm text-gray-900">{formatDate(selectedRequest.endDate)}</p>
                                    </div>
                                </div>

                                {selectedRequest.reason && (<div>
                                        <label className="block text-sm font-medium text-gray-700">Motif</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.reason}</p>
                                    </div>)}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Date de création</label>
                                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedRequest.createdAt)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                            {selectedRequest.status === 'PENDING' && (<>
                                    <button onClick={function () {
                    handleApprove(selectedRequest.id);
                    setIsModalOpen(false);
                }} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500" disabled={processingId === selectedRequest.id}>
                                        <CheckCircle className="w-4 h-4 mr-2"/>
                                        Approuver
                                    </button>
                                    <button onClick={function () {
                    handleReject(selectedRequest.id);
                    setIsModalOpen(false);
                }} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" disabled={processingId === selectedRequest.id}>
                                        <XCircle className="w-4 h-4 mr-2"/>
                                        Refuser
                                    </button>
                                </>)}
                            <button onClick={function () { return setIsModalOpen(false); }} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Fermer
                            </button>
                        </div>
                    </motion.div>
                </div>)}
        </motion.div>);
}
