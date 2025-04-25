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
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, ArrowsUpDownIcon as HeroArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { AlertTriangle } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui"; // Assurez-vous que ces composants existent
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// Liste des secteurs prédéfinis
var SECTORS = [
    'Hyperaseptique', // Salles 1-4
    'Secteur 5-8',
    'Secteur 9-12B',
    'Ophtalmologie',
    'Endoscopie'
];
// Couleurs suggérées par secteur
var SECTOR_COLORS = {
    'Hyperaseptique': '#3B82F6', // Bleu
    'Secteur 5-8': '#10B981', // Vert
    'Secteur 9-12B': '#F97316', // Orange
    'Ophtalmologie': '#EC4899', // Rose
    'Endoscopie': '#4F46E5' // Bleu roi
};
var OperatingRoomsConfigPanel = function () {
    var _a;
    var _b = useState([]), rooms = _b[0], setRooms = _b[1];
    var _c = useState(true), isLoading = _c[0], setIsLoading = _c[1];
    var _d = useState(null), error = _d[0], setError = _d[1];
    // États pour le formulaire et la modale
    var _e = useState(null), isEditing = _e[0], setIsEditing = _e[1];
    var _f = useState(false), isModalOpen = _f[0], setIsModalOpen = _f[1];
    var _g = useState({
        name: '',
        number: '',
        sector: SECTORS[0],
        colorCode: SECTOR_COLORS[SECTORS[0]],
        isActive: true,
        supervisionRules: {
            maxRoomsPerSupervisor: 2
        }
    }), formData = _g[0], setFormData = _g[1];
    var _h = useState(null), formError = _h[0], setFormError = _h[1];
    var _j = useState(false), isSubmitting = _j[0], setIsSubmitting = _j[1];
    var _k = useState(false), showSuccess = _k[0], setShowSuccess = _k[1];
    // Nouveaux états pour la réorganisation des salles
    var _l = useState(false), showRoomOrderPanel = _l[0], setShowRoomOrderPanel = _l[1];
    var _m = useState({ orderedRoomIds: [] }), roomOrder = _m[0], setRoomOrder = _m[1];
    var _o = useState(''), saveMessage = _o[0], setSaveMessage = _o[1];
    // Récupération des salles
    var fetchRooms = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
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
                    return [4 /*yield*/, axios.get('/api/operating-rooms')];
                case 2:
                    response = _c.sent();
                    setRooms(response.data);
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _c.sent();
                    console.error("Erreur lors du chargement des salles:", err_1);
                    setError(((_b = (_a = err_1.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || err_1.message || 'Impossible de charger les salles opératoires.');
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    // Chargement initial des données
    useEffect(function () {
        fetchRooms();
    }, [fetchRooms]);
    // Charger l'ordre des salles depuis le localStorage au démarrage
    useEffect(function () {
        if (typeof window !== 'undefined') {
            var savedRoomOrder = localStorage.getItem('operatingRoomOrderConfig');
            if (savedRoomOrder) {
                try {
                    var parsedOrder = JSON.parse(savedRoomOrder);
                    parsedOrder.orderedRoomIds = parsedOrder.orderedRoomIds.map(function (id) { return Number(id); });
                    setRoomOrder(parsedOrder);
                }
                catch (e) {
                    console.error('Erreur lors de la lecture de l\'ordre des salles :', e);
                    localStorage.removeItem('operatingRoomOrderConfig');
                }
            }
        }
    }, []);
    // Gestion des changements de formulaire
    var handleInputChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value, type = _a.type;
        var newValue = type === 'checkbox' ? e.target.checked : value;
        // Si le secteur change, suggérer une couleur par défaut
        if (name === 'sector' && SECTOR_COLORS[value]) {
            setFormData(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a.colorCode = SECTOR_COLORS[value], _a)));
            });
        }
        else {
            setFormData(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = newValue, _a)));
            });
        }
    };
    // Réinitialisation du formulaire et fermeture de la modale
    var resetFormAndCloseModal = function () {
        setIsEditing(null);
        setIsModalOpen(false);
        setFormData({
            name: '',
            number: '',
            sector: SECTORS[0],
            colorCode: SECTOR_COLORS[SECTORS[0]],
            isActive: true,
            supervisionRules: {
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
            number: '',
            sector: SECTORS[0],
            colorCode: SECTOR_COLORS[SECTORS[0]],
            isActive: true,
            supervisionRules: {
                maxRoomsPerSupervisor: 2
            }
        });
        setFormError(null);
        setIsModalOpen(true);
    };
    // Ouverture de la modale pour MODIFICATION
    var handleEditClick = function (room) {
        setIsEditing(room.id);
        setFormData({
            name: room.name,
            number: room.number,
            sector: room.sector,
            colorCode: room.colorCode || '',
            isActive: room.isActive,
            supervisionRules: room.supervisionRules
        });
        setFormError(null);
        setIsModalOpen(true);
    };
    // Soumission du formulaire (Ajout ou Modification)
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var url, method, err_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    e.preventDefault();
                    if (!formData.name.trim()) {
                        setFormError('Le nom de la salle est obligatoire.');
                        return [2 /*return*/];
                    }
                    if (!formData.number.trim()) {
                        setFormError('Le numéro de la salle est obligatoire.');
                        return [2 /*return*/];
                    }
                    if (!formData.sector.trim()) {
                        setFormError('Le secteur de la salle est obligatoire.');
                        return [2 /*return*/];
                    }
                    setIsSubmitting(true);
                    setFormError(null);
                    url = isEditing ? "/api/operating-rooms/".concat(isEditing) : '/api/operating-rooms';
                    method = isEditing ? 'PUT' : 'POST';
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, axios({ method: method, url: url, data: formData })];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, fetchRooms()];
                case 3:
                    _c.sent();
                    resetFormAndCloseModal();
                    setShowSuccess(true);
                    setTimeout(function () { return setShowSuccess(false); }, 3000);
                    return [3 /*break*/, 6];
                case 4:
                    err_2 = _c.sent();
                    console.error("Erreur lors de la soumission:", err_2);
                    setFormError(((_b = (_a = err_2.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || err_2.message || 'Une erreur est survenue.');
                    return [3 /*break*/, 6];
                case 5:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    // Suppression d'une salle
    var handleDeleteClick = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var err_3;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!confirm('Êtes-vous sûr de vouloir supprimer cette salle ? Cette action est irréversible.')) {
                        return [2 /*return*/];
                    }
                    setError(null);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios.delete("/api/operating-rooms/".concat(id))];
                case 2:
                    _c.sent();
                    setRooms(function (prev) { return prev.filter(function (r) { return r.id !== id; }); });
                    setShowSuccess(true);
                    setTimeout(function () { return setShowSuccess(false); }, 3000);
                    return [3 /*break*/, 4];
                case 3:
                    err_3 = _c.sent();
                    console.error("Erreur lors de la suppression:", err_3);
                    setError(((_b = (_a = err_3.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || err_3.message || 'Impossible de supprimer la salle.');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Fonction pour sauvegarder l'ordre des salles
    var handleSaveRoomOrder = function (orderedRoomIdsAsString) {
        var orderedRoomIds = orderedRoomIdsAsString.map(function (id) { return Number(id); });
        setRoomOrder({ orderedRoomIds: orderedRoomIds });
        if (typeof window !== 'undefined') {
            localStorage.setItem('operatingRoomOrderConfig', JSON.stringify({ orderedRoomIds: orderedRoomIds }));
        }
        setSaveMessage('L\'ordre des salles a été enregistré avec succès');
        setTimeout(function () { return setSaveMessage(''); }, 3000);
        setShowRoomOrderPanel(false);
    };
    // Préparer les données pour le RoomOrderPanel (convertir ID en string)
    var roomsForPanel = rooms.map(function (room) { return ({
        id: String(room.id),
        name: room.name,
        sector: room.sector
    }); });
    // Préparer l'ordre pour le RoomOrderPanel (convertir ID en string)
    var roomOrderForPanel = {
        orderedRoomIds: roomOrder.orderedRoomIds.map(function (id) { return String(id); })
    };
    return (<div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Configuration du Bloc Opératoire</h2>
                <Button onClick={handleAddClick} className="flex items-center">
                    <PlusIcon className="h-5 w-5 mr-2"/>
                    Ajouter une Salle
                </Button>
            </div>

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

            {/* Formulaire d'ajout/modification dans une modale */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Modifier la Salle' : 'Ajouter une Salle'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="mt-4">
                        {formError && (<div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded-md">
                                <p className="text-sm text-red-700">{formError}</p>
                            </div>)}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nom de la salle</label>
                                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Ex: Salle de Chirurgie 1"/>
                            </div>

                            <div>
                                <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">Numéro</label>
                                <input type="text" id="number" name="number" value={formData.number} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Ex: 1, 10, Ophta 3"/>
                            </div>

                            <div>
                                <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-1">Secteur</label>
                                <select id="sector" name="sector" value={formData.sector} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                                    {SECTORS.map(function (sector) { return (<option key={sector} value={sector}>{sector}</option>); })}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="colorCode" className="block text-sm font-medium text-gray-700 mb-1">Code couleur</label>
                                <div className="flex items-center space-x-2">
                                    <input type="color" id="colorCode" name="colorCode" value={formData.colorCode || '#000000'} onChange={handleInputChange} className="h-10 w-10 border border-gray-300 rounded"/>
                                    <input type="text" value={formData.colorCode || ''} onChange={handleInputChange} name="colorCode" className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Ex: #3B82F6"/>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={function (e) { return handleInputChange(e); }} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
                                <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-700">
                                    Salle active
                                </label>
                            </div>

                            <div>
                                <label htmlFor="maxRooms" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre max. de salles supervisées
                                </label>
                                <input type="number" id="maxRooms" min="1" max="5" value={((_a = formData.supervisionRules) === null || _a === void 0 ? void 0 : _a.maxRoomsPerSupervisor) || 2} onChange={function (e) {
            var value = parseInt(e.target.value);
            setFormData(function (prev) { return (__assign(__assign({}, prev), { supervisionRules: __assign(__assign({}, prev.supervisionRules), { maxRoomsPerSupervisor: value }) })); });
        }} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
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

            {/* Liste des salles */}
            <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-700">Liste des Salles</h3>
                    <Button variant="outline" onClick={function () { return setShowRoomOrderPanel(true); }} className="flex items-center gap-1 text-sm" disabled={isLoading || rooms.length < 2}>
                        <HeroArrowsUpDownIcon className="h-4 w-4"/>
                        Réorganiser les salles
                    </Button>
                </div>

                {isLoading ? (<div className="text-center py-6">
                        <div className="inline-block h-6 w-6 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                        <p className="mt-2 text-sm text-gray-500">Chargement des salles...</p>
                    </div>) : rooms.length === 0 ? (<p className="text-center py-8 text-gray-500 italic">Aucune salle configurée</p>) : (<div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                                        Nom
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Numéro
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Secteur
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Couleur
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Statut
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Max. Supervision
                                    </th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 text-right">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {rooms.map(function (room) {
                var _a;
                return (<tr key={room.id} className="hover:bg-gray-50">
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                                            {room.name}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {room.number}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {room.sector}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {room.colorCode ? (<span className="inline-flex items-center space-x-2">
                                                    <span className="h-4 w-4 rounded-full border border-gray-300" style={{ backgroundColor: room.colorCode }}></span>
                                                    <span>{room.colorCode}</span>
                                                </span>) : (<span className="text-gray-400 italic">N/A</span>)}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            {room.isActive ? (<span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                                                    Active
                                                </span>) : (<span className="inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800">
                                                    Inactive
                                                </span>)}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {((_a = room.supervisionRules) === null || _a === void 0 ? void 0 : _a.maxRoomsPerSupervisor) || 'N/A'}
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                                            <button onClick={function () { return handleEditClick(room); }} // Ouvre la modale ici
                 className="text-blue-600 hover:text-blue-800 mr-3" title="Modifier">
                                                <PencilIcon className="h-5 w-5"/>
                                            </button>
                                            <button onClick={function () { return handleDeleteClick(room.id); }} className="text-red-600 hover:text-red-800" title="Supprimer">
                                                <TrashIcon className="h-5 w-5"/>
                                            </button>
                                        </td>
                                    </tr>);
            })}
                            </tbody>
                        </table>
                    </div>)}
            </div>

            {saveMessage && (<div className="mt-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-green-700">{saveMessage}</p>
                        </div>
                    </div>
                </div>)}

            {showRoomOrderPanel && (<RoomOrderPanel rooms={roomsForPanel} roomOrder={roomOrderForPanel} onSave={handleSaveRoomOrder} onClose={function () { return setShowRoomOrderPanel(false); }}/>)}
        </div>);
};
var RoomOrderPanel = function (_a) {
    var rooms = _a.rooms, roomOrder = _a.roomOrder, onSave = _a.onSave, onClose = _a.onClose;
    var _b = useState({}), sectorRooms = _b[0], setSectorRooms = _b[1];
    var _c = useState([]), orderedSectors = _c[0], setOrderedSectors = _c[1];
    useEffect(function () {
        var groupedRooms = {};
        var initialOrderedSectors = [];
        // Utiliser l'ordre existant dans roomOrder.orderedRoomIds pour déterminer l'ordre initial des secteurs et des salles
        var orderedRoomIds = roomOrder.orderedRoomIds;
        var roomMap = new Map(rooms.map(function (r) { return [r.id, r]; }));
        orderedRoomIds.forEach(function (roomId) {
            var room = roomMap.get(roomId);
            if (room) {
                if (!groupedRooms[room.sector]) {
                    groupedRooms[room.sector] = [];
                    initialOrderedSectors.push(room.sector);
                }
                groupedRooms[room.sector].push(room);
                roomMap.delete(roomId); // Marquer comme traité
            }
        });
        // Ajouter les salles restantes (non présentes dans l'ordre sauvegardé)
        roomMap.forEach(function (room) {
            if (!groupedRooms[room.sector]) {
                groupedRooms[room.sector] = [];
                initialOrderedSectors.push(room.sector);
            }
            groupedRooms[room.sector].push(room);
        });
        // S'assurer que toutes les salles dans chaque secteur sont triées selon l'ordre global si possible
        Object.keys(groupedRooms).forEach(function (sector) {
            groupedRooms[sector].sort(function (a, b) {
                var indexA = orderedRoomIds.indexOf(a.id);
                var indexB = orderedRoomIds.indexOf(b.id);
                if (indexA !== -1 && indexB !== -1)
                    return indexA - indexB;
                if (indexA !== -1)
                    return -1;
                if (indexB !== -1)
                    return 1;
                return a.name.localeCompare(b.name); // Fallback
            });
        });
        setSectorRooms(groupedRooms);
        setOrderedSectors(initialOrderedSectors);
    }, [rooms, roomOrder]);
    var handleDragEnd = function (result) {
        console.log('Drag End Result:', result);
        var source = result.source, destination = result.destination, draggableId = result.draggableId, type = result.type;
        if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
            return;
        }
        // --- Déplacement d'un SECTEUR --- (Identifié par type="SECTOR" sur le Droppable source/destination)
        if (type === 'SECTOR') {
            // draggableId est le nom du secteur
            var newOrderedSectors = Array.from(orderedSectors);
            // On retire l'élément à l'index source (l'index correspond à l'ordre des secteurs)
            newOrderedSectors.splice(source.index, 1);
            // On insère l'élément (draggableId = nom du secteur) à l'index de destination
            newOrderedSectors.splice(destination.index, 0, draggableId);
            setOrderedSectors(newOrderedSectors);
            return;
        }
        // --- Déplacement d'une SALLE --- (Identifié par type="ROOM")
        if (type === 'ROOM') {
            var startSector_1 = source.droppableId;
            var endSector = destination.droppableId;
            // Si déplacement dans le même secteur
            if (startSector_1 === endSector) {
                var currentRooms = sectorRooms[startSector_1] || [];
                var updatedRooms_1 = Array.from(currentRooms);
                var movedRoom = updatedRooms_1.splice(source.index, 1)[0];
                updatedRooms_1.splice(destination.index, 0, movedRoom);
                setSectorRooms(function (prev) {
                    var _a;
                    return (__assign(__assign({}, prev), (_a = {}, _a[startSector_1] = updatedRooms_1, _a)));
                });
            }
            else {
                // Déplacement inter-secteurs (optionnel, non implémenté)
                // console.log("Déplacement inter-secteurs non géré pour le moment");
            }
        }
    };
    var saveRoomOrder = function () {
        var finalOrderedRoomIds = [];
        orderedSectors.forEach(function (sector) {
            if (sectorRooms[sector]) {
                sectorRooms[sector].forEach(function (room) {
                    finalOrderedRoomIds.push(room.id);
                });
            }
        });
        onSave(finalOrderedRoomIds);
    };
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-11/12 max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Réorganisation des salles de bloc
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <div className="mb-4 flex items-center text-gray-600 dark:text-gray-300">
                    <HeroArrowsUpDownIcon className="h-5 w-5 mr-2"/>
                    <span>Faire glisser les secteurs ou les salles pour réorganiser leur ordre d'affichage</span>
                </div>

                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="all-sectors" type="SECTOR">
                        {function (provided) { return (<div {...provided.droppableProps} ref={provided.innerRef}>
                                {orderedSectors.map(function (sector, index) { return (<Draggable key={sector} draggableId={sector} index={index}>
                                        {function (providedSector, snapshotSector) { return (<div ref={providedSector.innerRef} {...providedSector.draggableProps} className={"mb-6 border rounded-md ".concat(snapshotSector.isDragging ? 'border-blue-300 shadow-lg' : 'border-gray-200 dark:border-gray-700')}>
                                                <div {...providedSector.dragHandleProps} className={"flex items-center text-lg font-medium mb-0 text-gray-800 dark:text-gray-200 p-2 rounded-t-md cursor-grab ".concat(snapshotSector.isDragging ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700')}>
                                                    <HeroArrowsUpDownIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400"/>
                                                    {sector}
                                                </div>

                                                <Droppable droppableId={sector} type="ROOM">
                                                    {function (providedRoomList) { return (<div {...providedRoomList.droppableProps} ref={providedRoomList.innerRef} className={"bg-gray-50 dark:bg-gray-800 rounded-b-md p-2 min-h-[50px] ".concat(snapshotSector.isDragging ? 'opacity-50' : '')}>
                                                            {(sectorRooms[sector] || []).map(function (room, roomIndex) { return (<Draggable key={room.id} draggableId={room.id} index={roomIndex} isDragDisabled={snapshotSector.isDragging}>
                                                                    {function (providedRoom, snapshotRoom) { return (<div ref={providedRoom.innerRef} {...providedRoom.draggableProps} {...providedRoom.dragHandleProps} className={"p-3 mb-2 rounded-md flex justify-between items-center shadow-sm ".concat(snapshotRoom.isDragging
                                    ? "bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 scale-105"
                                    : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600", " ").concat(snapshotSector.isDragging ? 'cursor-not-allowed' : 'cursor-grab')}>
                                                                            <span className="font-medium text-gray-800 dark:text-gray-200">
                                                                                {room.name}
                                                                            </span>
                                                                            <HeroArrowsUpDownIcon className="h-5 w-5 text-gray-400 dark:text-gray-500"/>
                                                                        </div>); }}
                                                                </Draggable>); })}
                                                            {providedRoomList.placeholder}
                                                        </div>); }}
                                                </Droppable>
                                            </div>); }}
                                    </Draggable>); })}
                                {provided.placeholder}
                            </div>); }}
                    </Droppable>
                </DragDropContext>

                <div className="flex justify-end mt-6 space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        Annuler
                    </button>
                    <button onClick={saveRoomOrder} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        Enregistrer l'ordre
                    </button>
                </div>
            </div>
        </div>);
};
export default OperatingRoomsConfigPanel;
