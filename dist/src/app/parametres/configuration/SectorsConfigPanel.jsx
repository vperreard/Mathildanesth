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
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui"; // Assurez-vous que ces composants existent
var SectorsConfigPanel = function () {
    var _a;
    var router = useRouter();
    var _b = useAuth(), user = _b.user, authLoading = _b.isLoading;
    var _c = useState([]), sectors = _c[0], setSectors = _c[1];
    var _d = useState(true), isLoadingSectors = _d[0], setIsLoadingSectors = _d[1];
    var _e = useState(null), error = _e[0], setError = _e[1];
    // États pour le formulaire et la modale
    var _f = useState(null), isEditing = _f[0], setIsEditing = _f[1];
    var _g = useState(false), isModalOpen = _g[0], setIsModalOpen = _g[1];
    var _h = useState({
        name: '',
        colorCode: '#3B82F6',
        isActive: true,
        description: '',
        rules: {
            maxRoomsPerSupervisor: 2
        }
    }), formData = _h[0], setFormData = _h[1];
    var _j = useState(null), formError = _j[0], setFormError = _j[1];
    var _k = useState(false), isSubmitting = _k[0], setIsSubmitting = _k[1];
    var _l = useState(false), showSuccess = _l[0], setShowSuccess = _l[1];
    useEffect(function () {
        console.log("SectorsConfigPanel - Mounted. Fetching sectors...");
        fetchSectors();
    }, []);
    var fetchSectors = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoadingSectors(true);
                    console.log("SectorsConfigPanel - fetchSectors: START");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, axios.get('/api/sectors')];
                case 2:
                    response = _a.sent();
                    console.log("SectorsConfigPanel - fetchSectors: SUCCESS", { data: response.data });
                    setSectors(response.data || []); // Assurer que sectors est toujours un tableau
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error("SectorsConfigPanel - fetchSectors: ERROR", error_1);
                    toast.error('Erreur lors de la récupération des secteurs');
                    setError('Impossible de charger les secteurs.'); // Définir un message d'erreur générique
                    return [3 /*break*/, 5];
                case 4:
                    console.log("SectorsConfigPanel - fetchSectors: END");
                    setIsLoadingSectors(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // Gestion des changements de formulaire
    var handleInputChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value, type = _a.type;
        var newValue = type === 'checkbox' ? e.target.checked : value;
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[name] = newValue, _a)));
        });
    };
    // Gestion du changement de nombre max de salles par superviseur
    var handleMaxRoomsChange = function (value) {
        setFormData(function (prev) { return (__assign(__assign({}, prev), { rules: __assign(__assign({}, prev.rules), { maxRoomsPerSupervisor: value }) })); });
    };
    // Réinitialisation du formulaire et fermeture de la modale
    var resetFormAndCloseModal = function () {
        setIsEditing(null);
        setIsModalOpen(false);
        setFormData({
            name: '',
            colorCode: '#3B82F6',
            isActive: true,
            description: '',
            rules: {
                maxRoomsPerSupervisor: 2
            }
        });
        setFormError(null);
    };
    // Ouverture de la modale pour AJOUT
    var handleAddClick = function () {
        setIsEditing(null);
        setFormData({
            name: '',
            colorCode: '#3B82F6',
            isActive: true,
            description: '',
            rules: {
                maxRoomsPerSupervisor: 2
            }
        });
        setFormError(null);
        setIsModalOpen(true);
    };
    // Ouverture de la modale pour MODIFICATION
    var handleEditClick = function (sector) {
        setIsEditing(sector.id);
        setFormData({
            name: sector.name,
            colorCode: sector.colorCode || '#3B82F6',
            isActive: sector.isActive,
            description: sector.description || '',
            rules: sector.rules || { maxRoomsPerSupervisor: 2 }
        });
        setFormError(null);
        setIsModalOpen(true);
    };
    // Soumission du formulaire (Ajout ou Modification)
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var url, method, err_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    e.preventDefault();
                    if (!formData.name.trim()) {
                        setFormError('Le nom du secteur est requis');
                        return [2 /*return*/];
                    }
                    setIsSubmitting(true);
                    setFormError(null);
                    url = isEditing ? "/api/sectors/".concat(isEditing) : '/api/sectors';
                    method = isEditing ? 'PUT' : 'POST';
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, axios({ method: method, url: url, data: formData })];
                case 2:
                    _c.sent();
                    toast.success("Secteur ".concat(isEditing ? 'mis à jour' : 'ajouté', " avec succ\u00E8s"));
                    resetFormAndCloseModal();
                    fetchSectors();
                    setShowSuccess(true); // Afficher le message global de succès
                    setTimeout(function () { return setShowSuccess(false); }, 3000);
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _c.sent();
                    console.error("Erreur lors de l'enregistrement du secteur:", err_1);
                    toast.error("Erreur lors de l'enregistrement du secteur");
                    setFormError(((_b = (_a = err_1.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || err_1.message || 'Une erreur est survenue.');
                    return [3 /*break*/, 5];
                case 4:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // Suppression d'un secteur
    var handleDeleteClick = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var err_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!confirm('Êtes-vous sûr de vouloir supprimer ce secteur ? Les salles associées à ce secteur pourraient ne plus fonctionner correctement.')) {
                        return [2 /*return*/];
                    }
                    setError(null);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios.delete("/api/sectors/".concat(id))];
                case 2:
                    _c.sent();
                    toast.success('Secteur supprimé avec succès');
                    setSectors(function (prev) { return prev.filter(function (s) { return s.id !== id; }); });
                    setShowSuccess(true); // Afficher le message global de succès
                    setTimeout(function () { return setShowSuccess(false); }, 3000);
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _c.sent();
                    console.error("Erreur lors de la suppression du secteur:", err_2);
                    toast.error('Erreur lors de la suppression du secteur');
                    setError(((_b = (_a = err_2.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || err_2.message || 'Impossible de supprimer le secteur.');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Vérifications d'authentification et de rôle...
    if (authLoading) {
        return (<div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>);
    }
    if (!user) {
        return (<div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mt-4">
                <div className="text-center text-red-500">
                    <p>Vous devez être connecté pour accéder à cette page.</p>
                </div>
            </div>);
    }
    if (user.role !== 'ADMIN_TOTAL' && user.role !== 'ADMIN_PARTIEL') {
        return (<div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mt-4">
                <div className="text-center text-red-500">
                    <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                </div>
            </div>);
    }
    return (<div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Configuration des Secteurs du Bloc Opératoire</h2>
                <Button onClick={handleAddClick} className="flex items-center">
                    <PlusIcon className="h-5 w-5 mr-2"/>
                    Ajouter un Secteur
                </Button>
            </div>

            {error && !isLoadingSectors && (<div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
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

            {/* Formulaire d'ajout/modification dans une modale */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Modifier le Secteur' : 'Ajouter un Secteur'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="mt-4">
                        {formError && (<div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded-md">
                                <p className="text-sm text-red-700">{formError}</p>
                            </div>)}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nom du secteur</label>
                                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Ex: Hyperaseptique"/>
                            </div>

                            <div>
                                <label htmlFor="colorCode" className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                                <input type="color" id="colorCode" name="colorCode" value={formData.colorCode || '#3B82F6'} onChange={handleInputChange} className="h-10 w-full border border-gray-300 rounded"/>
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (facultatif)</label>
                                <textarea id="description" name="description" rows={3} value={formData.description} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Décrire brièvement le secteur..."></textarea>
                            </div>

                            <div className="flex items-center">
                                <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={function (e) { return handleInputChange(e); }} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
                                <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-700">
                                    Secteur actif
                                </label>
                            </div>

                            <div>
                                <label htmlFor="maxRooms" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre max. de salles par superviseur
                                </label>
                                <input type="number" id="maxRooms" min="1" max="5" value={((_a = formData.rules) === null || _a === void 0 ? void 0 : _a.maxRoomsPerSupervisor) || 2} onChange={function (e) { return handleMaxRoomsChange(parseInt(e.target.value)); }} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" onClick={resetFormAndCloseModal}>
                                    Annuler
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting} className="inline-flex items-center">
                                {isSubmitting ? (<span className="inline-block h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin"></span>) : isEditing ? (<CheckIcon className="h-4 w-4 mr-2"/>) : (<PlusIcon className="h-4 w-4 mr-2"/>)}
                                {isEditing ? 'Enregistrer' : 'Ajouter'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Liste des secteurs */}
            <div className="mt-6">
                <h3 className="text-lg font-medium mb-4 text-gray-700">Liste des Secteurs</h3>

                {isLoadingSectors ? (<div className="text-center py-6">
                        <div className="inline-block h-6 w-6 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                        <p className="mt-2 text-sm text-gray-500">Chargement des secteurs...</p>
                    </div>) : sectors.length === 0 ? (<p className="text-center py-8 text-gray-500 italic">Aucun secteur configuré</p>) : (<div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                                        Nom
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Couleur
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Description
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Statut
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Max. Salles / Sup.
                                    </th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 text-right">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {sectors.map(function (sector) {
                var _a;
                return (<tr key={sector.id} className="hover:bg-gray-50">
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                                            {sector.name}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            <span className="inline-flex items-center space-x-2">
                                                <span className="h-4 w-4 rounded-full border border-gray-300" style={{ backgroundColor: sector.colorCode }}></span>
                                                <span>{sector.colorCode}</span>
                                            </span>
                                        </td>
                                        <td className="whitespace-normal px-3 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {sector.description || <span className="italic text-gray-400">N/A</span>}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            {sector.isActive ? (<span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                                                    Actif
                                                </span>) : (<span className="inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800">
                                                    Inactif
                                                </span>)}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {((_a = sector.rules) === null || _a === void 0 ? void 0 : _a.maxRoomsPerSupervisor) || 'N/A'}
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                                            <button onClick={function () { return handleEditClick(sector); }} // Ouvre la modale ici
                 className="text-blue-600 hover:text-blue-800 mr-3" title="Modifier">
                                                <PencilIcon className="h-5 w-5"/>
                                            </button>
                                            <button onClick={function () { return handleDeleteClick(sector.id); }} className="text-red-600 hover:text-red-800" title="Supprimer">
                                                <TrashIcon className="h-5 w-5"/>
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
export default SectorsConfigPanel;
