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
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { AlertTriangle } from 'lucide-react';
var SpecialtiesConfigPanel = function () {
    var _a = useState([]), specialties = _a[0], setSpecialties = _a[1];
    var _b = useState(true), isLoading = _b[0], setIsLoading = _b[1];
    var _c = useState(null), error = _c[0], setError = _c[1];
    var _d = useState([]), surgeons = _d[0], setSurgeons = _d[1];
    // États pour le formulaire
    var _e = useState(null), isEditing = _e[0], setIsEditing = _e[1];
    var _f = useState({ name: '', isPediatric: false }), formData = _f[0], setFormData = _f[1];
    var _g = useState(null), formError = _g[0], setFormError = _g[1];
    var _h = useState(false), isSubmitting = _h[0], setIsSubmitting = _h[1];
    var _j = useState(false), showSuccess = _j[0], setShowSuccess = _j[1];
    // Récupération des spécialités
    var fetchSpecialties = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
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
                    return [4 /*yield*/, axios.get('/api/specialties')];
                case 2:
                    response = _c.sent();
                    setSpecialties(response.data);
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _c.sent();
                    console.error("Erreur lors du chargement des spécialités:", err_1);
                    setError(((_b = (_a = err_1.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || err_1.message || 'Impossible de charger les spécialités.');
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    // Récupération des chirurgiens
    var fetchSurgeons = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios.get('/api/surgeons')];
                case 1:
                    response = _a.sent();
                    setSurgeons(response.data);
                    return [3 /*break*/, 3];
                case 2:
                    err_2 = _a.sent();
                    console.error('Erreur lors du chargement des chirurgiens:', err_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); }, []);
    // Chargement initial des données
    useEffect(function () {
        fetchSpecialties();
        fetchSurgeons();
    }, [fetchSpecialties, fetchSurgeons]);
    // Gestion des changements de formulaire
    var handleInputChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value, type = _a.type, checked = _a.checked;
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[name] = type === 'checkbox' ? checked : value, _a)));
        });
    };
    // Réinitialisation du formulaire
    var resetForm = function () {
        setIsEditing(null);
        setFormData({ name: '', isPediatric: false });
        setFormError(null);
    };
    // Début de modification d'une spécialité
    var handleEditClick = function (specialty) {
        setIsEditing(specialty.id);
        setFormData({ name: specialty.name, isPediatric: specialty.isPediatric });
        setFormError(null);
    };
    // Soumission du formulaire (Ajout ou Modification)
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var url, method, err_3;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    e.preventDefault();
                    if (!formData.name.trim()) {
                        setFormError('Le nom de la spécialité ne peut pas être vide.');
                        return [2 /*return*/];
                    }
                    setIsSubmitting(true);
                    setFormError(null);
                    url = isEditing ? "/api/specialties/".concat(isEditing) : '/api/specialties';
                    method = isEditing ? 'PUT' : 'POST';
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, axios({ method: method, url: url, data: formData })];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, fetchSpecialties()];
                case 3:
                    _c.sent();
                    resetForm();
                    setShowSuccess(true);
                    setTimeout(function () { return setShowSuccess(false); }, 3000);
                    return [3 /*break*/, 6];
                case 4:
                    err_3 = _c.sent();
                    console.error("Erreur lors de la soumission:", err_3);
                    setFormError(((_b = (_a = err_3.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || err_3.message || 'Une erreur est survenue.');
                    return [3 /*break*/, 6];
                case 5:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    // Suppression d'une spécialité
    var handleDeleteClick = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var err_4;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!confirm('Êtes-vous sûr de vouloir supprimer cette spécialité ? Cette action est irréversible.\nNote: La suppression échouera si des chirurgiens sont encore liés à cette spécialité.')) {
                        return [2 /*return*/];
                    }
                    setError(null);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios.delete("/api/specialties/".concat(id))];
                case 2:
                    _c.sent();
                    setSpecialties(function (prev) { return prev.filter(function (s) { return s.id !== id; }); });
                    setShowSuccess(true);
                    setTimeout(function () { return setShowSuccess(false); }, 3000);
                    return [3 /*break*/, 4];
                case 3:
                    err_4 = _c.sent();
                    console.error("Erreur lors de la suppression:", err_4);
                    setError(((_b = (_a = err_4.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || err_4.message || 'Impossible de supprimer la spécialité (vérifiez si elle est utilisée).');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Recherche de chirurgiens liés à une spécialité
    var getLinkedSurgeons = function (specialtyId) {
        return surgeons.filter(function (surgeon) {
            if (surgeon.specialties && Array.isArray(surgeon.specialties)) {
                return surgeon.specialties.some(function (s) { return s.id === specialtyId; });
            }
            return (surgeon.specialty1Id === specialtyId) || (surgeon.specialty2Id === specialtyId);
        });
    };
    return (<div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Gestion des Spécialités Chirurgicales</h2>

            {error && (<div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                    <div className="flex">
                        <AlertTriangle className="h-5 w-5 text-red-400"/>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>)}

            {showSuccess && (<div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-green-700">Opération réalisée avec succès</p>
                        </div>
                    </div>
                </div>)}

            {/* Formulaire d'ajout/modification */}
            <form onSubmit={handleSubmit} className="mb-8 p-5 border border-gray-200 rounded-md bg-gray-50">
                <h3 className="text-lg font-medium mb-4 text-gray-700">
                    {isEditing ? 'Modifier la Spécialité' : 'Ajouter une Spécialité'}
                </h3>

                {formError && (<div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded-md">
                        <p className="text-sm text-red-700">{formError}</p>
                    </div>)}

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nom de la spécialité</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Ex: Orthopédie"/>
                    </div>

                    <div className="flex items-center">
                        <input type="checkbox" id="isPediatric" name="isPediatric" checked={formData.isPediatric} onChange={handleInputChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
                        <label htmlFor="isPediatric" className="ml-2 block text-sm font-medium text-gray-700">
                            Spécialité pédiatrique
                        </label>
                    </div>
                </div>

                <div className="mt-5 flex justify-end space-x-3">
                    {isEditing && (<button type="button" onClick={resetForm} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            <XMarkIcon className="h-4 w-4 mr-2"/>
                            Annuler
                        </button>)}
                    <button type="submit" disabled={isSubmitting} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                        {isSubmitting ? (<span className="inline-block h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin"></span>) : isEditing ? (<CheckIcon className="h-4 w-4 mr-2"/>) : (<PlusIcon className="h-4 w-4 mr-2"/>)}
                        {isEditing ? 'Enregistrer' : 'Ajouter'}
                    </button>
                </div>
            </form>

            {/* Liste des spécialités */}
            <div className="mt-6">
                <h3 className="text-lg font-medium mb-4 text-gray-700">Liste des Spécialités</h3>

                {isLoading ? (<div className="text-center py-6">
                        <div className="inline-block h-6 w-6 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                        <p className="mt-2 text-sm text-gray-500">Chargement des spécialités...</p>
                    </div>) : specialties.length === 0 ? (<p className="text-center py-8 text-gray-500 italic">Aucune spécialité trouvée</p>) : (<div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                                        Nom
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Type
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Chirurgiens assignés
                                    </th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 text-right">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {specialties.map(function (specialty) {
                var linkedSurgeons = getLinkedSurgeons(specialty.id);
                return (<tr key={specialty.id} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                                                {specialty.name}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {specialty.isPediatric ? (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        Pédiatrique
                                                    </span>) : (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        Adulte
                                                    </span>)}
                                            </td>
                                            <td className="px-3 py-4 text-sm text-gray-500">
                                                {linkedSurgeons.length === 0 ? (<span className="text-gray-400 italic">Aucun</span>) : (<div className="max-h-16 overflow-y-auto">
                                                        {linkedSurgeons.map(function (surgeon) { return (<div key={surgeon.id} className="text-xs py-0.5">
                                                                {surgeon.prenom} {surgeon.nom}
                                                            </div>); })}
                                                    </div>)}
                                            </td>
                                            <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                                                <button onClick={function () { return handleEditClick(specialty); }} className="text-blue-600 hover:text-blue-900 mr-3" title="Modifier">
                                                    <PencilIcon className="h-4 w-4"/>
                                                </button>
                                                <button onClick={function () { return handleDeleteClick(specialty.id); }} className="text-red-600 hover:text-red-900" title="Supprimer" disabled={linkedSurgeons.length > 0}>
                                                    <TrashIcon className={"h-4 w-4 ".concat(linkedSurgeons.length > 0 ? 'opacity-30 cursor-not-allowed' : '')}/>
                                                </button>
                                            </td>
                                        </tr>);
            })}
                            </tbody>
                        </table>
                    </div>)}
            </div>
        </div>);
};
export default SpecialtiesConfigPanel;
