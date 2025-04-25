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
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Link from 'next/link';
import { Users, Trash2, Edit, PlusCircle, ArrowLeft, Filter, ChevronDown } from 'lucide-react';
import { UserStatus } from '@prisma/client';
import Modal from '@/components/Modal';
import SurgeonForm from '@/components/SurgeonForm';
import { toast } from 'react-toastify';
import ProtectedRoute from '@/components/ProtectedRoute';
function SurgeonsPageContent() {
    var _this = this;
    var _a = useState([]), surgeons = _a[0], setSurgeons = _a[1];
    var _b = useState([]), specialties = _b[0], setSpecialties = _b[1];
    var _c = useState('all'), selectedSpecialtyId = _c[0], setSelectedSpecialtyId = _c[1];
    var _d = useState(true), loading = _d[0], setLoading = _d[1];
    var _e = useState(null), error = _e[0], setError = _e[1];
    var _f = useState(false), isModalOpen = _f[0], setIsModalOpen = _f[1];
    var _g = useState(null), editingSurgeon = _g[0], setEditingSurgeon = _g[1];
    var _h = useState(false), isLoadingSubmit = _h[0], setIsLoadingSubmit = _h[1];
    var _j = useState({ isOpen: false, surgeonId: null }), deleteConfirmation = _j[0], setDeleteConfirmation = _j[1];
    var fetchSurgeons = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var response, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, axios.get('/api/chirurgiens')];
                case 2:
                    response = _a.sent();
                    setSurgeons(response.data);
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    console.error("Erreur lors de la récupération des chirurgiens:", err_1);
                    setError("Impossible de charger les chirurgiens. Vérifiez la console pour plus de détails.");
                    toast.error("Erreur lors du chargement des chirurgiens.");
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    var fetchSpecialties = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var response, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios.get('/api/specialties')];
                case 1:
                    response = _a.sent();
                    setSpecialties(response.data);
                    return [3 /*break*/, 3];
                case 2:
                    err_2 = _a.sent();
                    console.error("Erreur lors de la récupération des spécialités:", err_2);
                    toast.error("Erreur lors du chargement des spécialités pour le filtre.");
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); }, []);
    useEffect(function () {
        setLoading(true);
        setError(null);
        Promise.all([fetchSurgeons(), fetchSpecialties()])
            .catch(function (err) {
            console.error("Erreur lors du chargement initial:", err);
            setError("Une erreur est survenue lors du chargement initial des données.");
        })
            .finally(function () {
            setLoading(false);
        });
    }, [fetchSurgeons, fetchSpecialties]);
    var handleOpenForm = function (surgeon) {
        if (surgeon === void 0) { surgeon = null; }
        setEditingSurgeon(surgeon);
        setIsModalOpen(true);
    };
    var handleCloseForm = function () {
        setEditingSurgeon(null);
        setIsModalOpen(false);
    };
    var handleCreateSurgeon = function (formData) { return __awaiter(_this, void 0, void 0, function () {
        var err_3, message;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    setIsLoadingSubmit(true);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, axios.post('/api/chirurgiens', formData)];
                case 2:
                    _c.sent();
                    fetchSurgeons();
                    handleCloseForm();
                    return [3 /*break*/, 5];
                case 3:
                    err_3 = _c.sent();
                    console.error("Erreur handleCreateSurgeon:", err_3);
                    message = (axios.isAxiosError(err_3) && ((_b = (_a = err_3.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message)) || 'Erreur lors de la création du chirurgien.';
                    setError(message);
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoadingSubmit(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleUpdateSurgeon = function (formData) { return __awaiter(_this, void 0, void 0, function () {
        var err_4, message;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!editingSurgeon)
                        return [2 /*return*/];
                    setIsLoadingSubmit(true);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, axios.put("/api/chirurgiens/".concat(editingSurgeon.id), formData)];
                case 2:
                    _c.sent();
                    fetchSurgeons();
                    handleCloseForm();
                    return [3 /*break*/, 5];
                case 3:
                    err_4 = _c.sent();
                    console.error("Erreur handleUpdateSurgeon:", err_4);
                    message = (axios.isAxiosError(err_4) && ((_b = (_a = err_4.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message)) || 'Erreur lors de la modification du chirurgien.';
                    setError(message);
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoadingSubmit(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleDeleteSurgeon = function (surgeonId) { return __awaiter(_this, void 0, void 0, function () {
        var err_5;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce chirurgien ?'))
                        return [2 /*return*/];
                    setIsLoadingSubmit(true);
                    setError(null);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, axios.delete("/api/chirurgiens/".concat(surgeonId))];
                case 2:
                    _c.sent();
                    setSurgeons(function (prev) { return prev.filter(function (s) { return s.id !== surgeonId; }); });
                    return [3 /*break*/, 5];
                case 3:
                    err_5 = _c.sent();
                    console.error("Erreur handleDeleteSurgeon:", err_5);
                    setError(axios.isAxiosError(err_5) && ((_b = (_a = err_5.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Erreur lors de la suppression du chirurgien.');
                    setTimeout(function () { return setError(null); }, 5000);
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoadingSubmit(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var filteredSurgeons = surgeons.filter(function (surgeon) {
        if (selectedSpecialtyId === 'all') {
            return true;
        }
        return surgeon.specialties.some(function (spec) { return spec.id === parseInt(selectedSpecialtyId, 10); });
    });
    return (<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {/* Bouton Retour aux Paramètres */}
                <Link href="/parametres" className="inline-flex items-center text-sm text-gray-600 hover:text-indigo-600 mb-6 group">
                    <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform"/>
                    Retour aux Paramètres
                </Link>

                <div className="mb-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold flex items-center space-x-3">
                        <Users className="h-8 w-8 text-indigo-600"/>
                        <span>Gestion des Chirurgiens</span>
                    </h1>
                    <button onClick={function () { return handleOpenForm(); }} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center space-x-2">
                        <PlusCircle className="h-5 w-5"/>
                        <span>Ajouter un Chirurgien</span>
                    </button>
                </div>

                {/* Afficher le SurgeonForm ici si isModalOpen est true */}
                {isModalOpen && (<Modal isOpen={isModalOpen} onClose={handleCloseForm} title={editingSurgeon ? 'Modifier le Chirurgien' : 'Ajouter un Chirurgien'}>
                        <SurgeonForm initialData={editingSurgeon} onSubmit={editingSurgeon ? handleUpdateSurgeon : handleCreateSurgeon} onCancel={handleCloseForm} isLoading={isLoadingSubmit}/>
                    </Modal>)}

                {/* Liste des Chirurgiens */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100">
                    {loading && <p className="text-center text-gray-600 py-4">Chargement...</p>}
                    {error && <p className="text-center text-red-600 font-medium py-4">{error}</p>}
                    {!loading && !error && (<>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">Liste des chirurgiens ({filteredSurgeons.length})</h2>

                                {/* --- Section Filtre --- */}
                                <div className="relative flex items-center space-x-2">
                                    <Filter className="h-5 w-5 text-gray-500 flex-shrink-0"/>
                                    <label htmlFor="specialtyFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap flex-shrink-0">Filtrer par:</label>
                                    <select id="specialtyFilter" name="specialtyFilter" className="block w-auto pl-3 pr-8 py-1.5 text-sm border border-gray-300 bg-white rounded-md shadow-sm 
                                                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                                                   hover:border-gray-400 transition-colors duration-150 
                                                   appearance-none" value={selectedSpecialtyId} onChange={function (e) { return setSelectedSpecialtyId(e.target.value); }}>
                                        <option value="all">Toutes les spécialités</option>
                                        {specialties.map(function (spec) { return (<option key={spec.id} value={spec.id.toString()}>
                                                {spec.name}
                                            </option>); })}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                        <ChevronDown className="h-4 w-4 text-gray-500"/>
                                    </div>
                                </div>
                                {/* --- Fin Section Filtre --- */}
                            </div>

                            {filteredSurgeons.length === 0 ? (<p className="text-center text-gray-500 py-4">Aucun chirurgien trouvé {selectedSpecialtyId !== 'all' ? 'pour cette spécialité' : ''}.</p>) : (<div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom Complet</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spécialités</th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredSurgeons.map(function (surgeon) { return (<motion.tr key={surgeon.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="hover:bg-gray-50/50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{surgeon.id}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{surgeon.prenom} {surgeon.nom}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {(surgeon.specialties && surgeon.specialties.length > 0)
                        ? surgeon.specialties.map(function (spec) { return spec.name; }).join(', ')
                        : <span className="text-gray-400 italic">Aucune</span>}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className={"px-2.5 py-0.5 text-xs font-medium rounded-full ".concat(surgeon.status === UserStatus.ACTIF ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                                                            {surgeon.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button onClick={function () { return handleOpenForm(surgeon); }} className="text-indigo-600 hover:text-indigo-900 mr-3 transition-colors disabled:opacity-50" disabled={isLoadingSubmit} title="Modifier">
                                                            <Edit className="h-4 w-4"/>
                                                        </button>
                                                        <button onClick={function () { return handleDeleteSurgeon(surgeon.id); }} className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50" disabled={isLoadingSubmit} title="Supprimer">
                                                            <Trash2 className="h-4 w-4"/>
                                                        </button>
                                                    </td>
                                                </motion.tr>); })}
                                        </tbody>
                                    </table>
                                </div>)}
                        </>)}
                </div>
            </motion.div>
        </div>);
}
// Protéger la page
export default function ProtectedSurgeonsPage() {
    var allowedRoles = ['ADMIN_TOTAL', 'ADMIN_PARTIEL'];
    return (<ProtectedRoute allowedRoles={allowedRoles}>
            <SurgeonsPageContent />
        </ProtectedRoute>);
}
