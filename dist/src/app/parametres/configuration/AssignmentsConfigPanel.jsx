"use client";
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
import { Plus, Trash2, Edit, Calendar, Tag, User, Save, X, Clock, Info, CheckCircle2, XCircle, Bell, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
var AssignmentsConfigPanel = function () {
    var _a;
    // États
    var _b = useState([]), assignmentTypes = _b[0], setAssignmentTypes = _b[1];
    var _c = useState(true), isLoading = _c[0], setIsLoading = _c[1];
    var _d = useState(false), isSaving = _d[0], setIsSaving = _d[1];
    var _e = useState(null), editingType = _e[0], setEditingType = _e[1];
    var _f = useState(false), showPropertyForm = _f[0], setShowPropertyForm = _f[1];
    var _g = useState({
        name: '',
        code: '',
        type: 'string',
        required: false
    }), newProperty = _g[0], setNewProperty = _g[1];
    // Formulaire pour l'édition ou la création
    var _h = useState({
        name: '',
        code: '',
        description: '',
        icon: 'Calendar',
        color: '#3B82F6',
        isActive: true,
        allowsMultiple: false,
        requiresLocation: true,
        properties: []
    }), formData = _h[0], setFormData = _h[1];
    // Chargement initial des données
    useEffect(function () {
        fetchAssignmentTypes();
    }, []);
    // Récupérer les types d'affectations depuis l'API
    var fetchAssignmentTypes = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, formattedData, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 5]);
                    setIsLoading(true);
                    return [4 /*yield*/, fetch('/api/assignment-types')];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Erreur lors de la récupération des types d\'affectations');
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    formattedData = data.map(function (type) { return (__assign(__assign({}, type), { createdAt: new Date(type.createdAt), updatedAt: new Date(type.updatedAt), properties: Array.isArray(type.properties) ? type.properties : JSON.parse(type.properties || '[]') })); });
                    setAssignmentTypes(formattedData);
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error('Erreur:', error_1);
                    toast.error('Impossible de charger les types d\'affectations');
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // Ouvrir le formulaire d'édition
    var openEditForm = function (type) {
        setEditingType(type);
        setFormData({
            name: type.name,
            code: type.code,
            description: type.description,
            icon: type.icon,
            color: type.color,
            isActive: type.isActive,
            allowsMultiple: type.allowsMultiple,
            requiresLocation: type.requiresLocation,
            properties: __spreadArray([], type.properties, true)
        });
    };
    // Ouvrir le formulaire de création
    var openNewForm = function () {
        setEditingType(null);
        setFormData({
            name: '',
            code: '',
            description: '',
            icon: 'Calendar',
            color: '#3B82F6',
            isActive: true,
            allowsMultiple: false,
            requiresLocation: true,
            properties: []
        });
    };
    // Gérer les changements de formulaire
    var handleFormChange = function (field, value) {
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = value, _a)));
        });
    };
    // Ajouter ou mettre à jour un type d'affectation
    var saveAssignmentType = function () { return __awaiter(void 0, void 0, void 0, function () {
        var apiUrl, method, response, errorData, savedType_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!formData.name || !formData.code)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    setIsSaving(true);
                    apiUrl = editingType
                        ? "/api/assignment-types/".concat(editingType.id)
                        : '/api/assignment-types';
                    method = editingType ? 'PUT' : 'POST';
                    return [4 /*yield*/, fetch(apiUrl, {
                            method: method,
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(formData),
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    errorData = _a.sent();
                    throw new Error(errorData.error || 'Erreur lors de l\'enregistrement');
                case 4: return [4 /*yield*/, response.json()];
                case 5:
                    savedType_1 = _a.sent();
                    if (editingType) {
                        // Mise à jour dans le state local
                        setAssignmentTypes(function (prev) { return prev.map(function (type) {
                            return type.id === editingType.id ? __assign(__assign({}, savedType_1), { createdAt: new Date(savedType_1.createdAt), updatedAt: new Date(savedType_1.updatedAt), properties: Array.isArray(savedType_1.properties)
                                    ? savedType_1.properties
                                    : JSON.parse(savedType_1.properties || '[]') }) :
                                type;
                        }); });
                        toast.success('Type d\'affectation mis à jour');
                    }
                    else {
                        // Ajout dans le state local
                        setAssignmentTypes(function (prev) { return __spreadArray(__spreadArray([], prev, true), [
                            __assign(__assign({}, savedType_1), { createdAt: new Date(savedType_1.createdAt), updatedAt: new Date(savedType_1.updatedAt), properties: Array.isArray(savedType_1.properties)
                                    ? savedType_1.properties
                                    : JSON.parse(savedType_1.properties || '[]') })
                        ], false); });
                        toast.success('Type d\'affectation créé');
                    }
                    // Fermer le formulaire
                    setEditingType(null);
                    return [3 /*break*/, 8];
                case 6:
                    error_2 = _a.sent();
                    console.error('Erreur:', error_2);
                    toast.error(error_2 instanceof Error ? error_2.message : 'Erreur lors de l\'enregistrement');
                    return [3 /*break*/, 8];
                case 7:
                    setIsSaving(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    // Supprimer un type d'affectation
    var deleteAssignmentType = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var response, errorData, result, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Confirmation
                    if (!confirm('Êtes-vous sûr de vouloir supprimer ce type d\'affectation ?')) {
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, fetch("/api/assignment-types/".concat(id), {
                            method: 'DELETE',
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    errorData = _a.sent();
                    throw new Error(errorData.error || 'Erreur lors de la suppression');
                case 4: return [4 /*yield*/, response.json()];
                case 5:
                    result = _a.sent();
                    // Si le type a été désactivé au lieu d'être supprimé
                    if (result.isActive === false && result.id) {
                        setAssignmentTypes(function (prev) { return prev.map(function (type) {
                            return type.id === id ? __assign(__assign({}, type), { isActive: false }) : type;
                        }); });
                        toast.success(result.message || 'Type d\'affectation désactivé');
                    }
                    else {
                        // Si le type a été supprimé
                        setAssignmentTypes(function (prev) { return prev.filter(function (type) { return type.id !== id; }); });
                        toast.success('Type d\'affectation supprimé');
                    }
                    return [3 /*break*/, 7];
                case 6:
                    error_3 = _a.sent();
                    console.error('Erreur:', error_3);
                    toast.error(error_3 instanceof Error ? error_3.message : 'Erreur lors de la suppression');
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    // Ajouter une propriété
    var addProperty = function () {
        if (!newProperty.name || !newProperty.code)
            return;
        var property = {
            id: Date.now(),
            name: newProperty.name,
            code: newProperty.code,
            type: newProperty.type || 'string',
            required: newProperty.required || false,
            options: newProperty.type === 'select' ? newProperty.options || [] : undefined,
            defaultValue: newProperty.defaultValue
        };
        setFormData(function (prev) { return (__assign(__assign({}, prev), { properties: __spreadArray(__spreadArray([], (prev.properties || []), true), [property], false) })); });
        setNewProperty({
            name: '',
            code: '',
            type: 'string',
            required: false
        });
        setShowPropertyForm(false);
    };
    // Supprimer une propriété
    var removeProperty = function (id) {
        setFormData(function (prev) { return (__assign(__assign({}, prev), { properties: (prev.properties || []).filter(function (p) { return p.id !== id; }) })); });
    };
    // Obtenir l'icône pour un type d'affectation
    var getIcon = function (iconName) {
        switch (iconName) {
            case 'Calendar': return <Calendar className="h-5 w-5"/>;
            case 'Clock': return <Clock className="h-5 w-5"/>;
            case 'Bell': return <Bell className="h-5 w-5"/>;
            case 'Info': return <Info className="h-5 w-5"/>;
            case 'User': return <User className="h-5 w-5"/>;
            case 'Tag': return <Tag className="h-5 w-5"/>;
            default: return <Calendar className="h-5 w-5"/>;
        }
    };
    // Rendu du composant
    return (<div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Gestion des Types d'Affectations</h1>
                <button onClick={openNewForm} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center">
                    <Plus className="h-4 w-4 mr-2"/>
                    Ajouter un type
                </button>
            </div>

            {isLoading ? (<div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600"/>
                    <span className="ml-2 text-gray-600">Chargement des types d'affectations...</span>
                </div>) : (<>
                    {assignmentTypes.length === 0 ? (<div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3"/>
                            <p className="text-gray-600 mb-2">Aucun type d'affectation configuré</p>
                            <p className="text-gray-500 text-sm mb-4">Commencez par créer un type d'affectation pour organiser le planning</p>
                            <button onClick={openNewForm} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                Créer mon premier type d'affectation
                            </button>
                        </div>) : (<>
                            {/* Liste des types d'affectations */}
                            <div className="bg-white shadow rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Code
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Description
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Statut
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Options
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {assignmentTypes.map(function (type) { return (<tr key={type.id} className={!type.isActive ? 'bg-gray-50' : ''}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: type.color + '20' }}>
                                                            <div style={{ color: type.color }}>
                                                                {getIcon(type.icon)}
                                                            </div>
                                                        </div>
                                                        <div className="ml-3">
                                                            <div className={"text-sm font-medium ".concat(type.isActive ? 'text-gray-900' : 'text-gray-500')}>
                                                                {type.name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-500">{type.code}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-500 max-w-xs truncate">{type.description}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {type.isActive ? (<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                            Actif
                                                        </span>) : (<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                            Inactif
                                                        </span>)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs">
                                                    <div className="flex space-x-2">
                                                        {type.allowsMultiple && (<span className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                                                                Multiple
                                                            </span>)}
                                                        {type.requiresLocation && (<span className="px-2 py-1 rounded bg-indigo-100 text-indigo-800">
                                                                Lieu requis
                                                            </span>)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={function () { return openEditForm(type); }} className="text-indigo-600 hover:text-indigo-900 mr-3">
                                                        <Edit className="h-4 w-4"/>
                                                    </button>
                                                    <button onClick={function () { return deleteAssignmentType(type.id); }} className="text-red-600 hover:text-red-900">
                                                        <Trash2 className="h-4 w-4"/>
                                                    </button>
                                                </td>
                                            </tr>); })}
                                    </tbody>
                                </table>
                            </div>
                        </>)}

                    {/* Formulaire d'édition */}
                    {(editingType !== null || formData.name !== '') && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 overflow-hidden shadow-xl">
                                <div className="px-6 py-4 border-b flex justify-between items-center">
                                    <h2 className="text-xl font-bold">
                                        {editingType ? "Modifier le type d'affectation" : "Nouveau type d'affectation"}
                                    </h2>
                                    <button onClick={function () { return setEditingType(null); }} className="text-gray-400 hover:text-gray-600" disabled={isSaving}>
                                        <X className="h-5 w-5"/>
                                    </button>
                                </div>

                                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                                    <div className="space-y-4">
                                        {/* Informations de base */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Nom
                                                </label>
                                                <input type="text" value={formData.name} onChange={function (e) { return handleFormChange('name', e.target.value); }} className="w-full px-3 py-2 border rounded-md" placeholder="Ex: Garde" disabled={isSaving}/>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Code
                                                </label>
                                                <input type="text" value={formData.code} onChange={function (e) { return handleFormChange('code', e.target.value.toUpperCase()); }} className="w-full px-3 py-2 border rounded-md uppercase" placeholder="Ex: GARDE" disabled={isSaving || (editingType !== null)}/>
                                                {editingType && (<p className="text-xs text-gray-500 mt-1">Le code ne peut pas être modifié après création</p>)}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Description
                                            </label>
                                            <textarea value={formData.description} onChange={function (e) { return handleFormChange('description', e.target.value); }} className="w-full px-3 py-2 border rounded-md" rows={3} placeholder="Description détaillée de ce type d'affectation" disabled={isSaving}/>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Icône
                                                </label>
                                                <select value={formData.icon} onChange={function (e) { return handleFormChange('icon', e.target.value); }} className="w-full px-3 py-2 border rounded-md" disabled={isSaving}>
                                                    <option value="Calendar">Calendrier</option>
                                                    <option value="Clock">Horloge</option>
                                                    <option value="Bell">Cloche</option>
                                                    <option value="Info">Information</option>
                                                    <option value="User">Utilisateur</option>
                                                    <option value="Tag">Étiquette</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Couleur
                                                </label>
                                                <input type="color" value={formData.color} onChange={function (e) { return handleFormChange('color', e.target.value); }} className="w-full px-1 py-1 border rounded-md h-10" disabled={isSaving}/>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center">
                                                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={function (e) { return handleFormChange('isActive', e.target.checked); }} className="h-4 w-4 text-indigo-600 rounded" disabled={isSaving}/>
                                                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                                                    Type actif
                                                </label>
                                            </div>
                                            <div className="flex items-center">
                                                <input type="checkbox" id="allowsMultiple" checked={formData.allowsMultiple} onChange={function (e) { return handleFormChange('allowsMultiple', e.target.checked); }} className="h-4 w-4 text-indigo-600 rounded" disabled={isSaving}/>
                                                <label htmlFor="allowsMultiple" className="ml-2 block text-sm text-gray-700">
                                                    Permet plusieurs affectations simultanées
                                                </label>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <input type="checkbox" id="requiresLocation" checked={formData.requiresLocation} onChange={function (e) { return handleFormChange('requiresLocation', e.target.checked); }} className="h-4 w-4 text-indigo-600 rounded" disabled={isSaving}/>
                                            <label htmlFor="requiresLocation" className="ml-2 block text-sm text-gray-700">
                                                Nécessite un lieu d'affectation
                                            </label>
                                        </div>

                                        {/* Propriétés */}
                                        <div className="mt-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-lg font-medium">Propriétés additionnelles</h3>
                                                <button onClick={function () { return setShowPropertyForm(true); }} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 text-sm flex items-center" disabled={isSaving}>
                                                    <Plus className="h-3 w-3 mr-1"/>
                                                    Ajouter
                                                </button>
                                            </div>

                                            {showPropertyForm && (<div className="p-4 border rounded-md bg-gray-50 mb-4">
                                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Nom
                                                            </label>
                                                            <input type="text" value={newProperty.name} onChange={function (e) { return setNewProperty(__assign(__assign({}, newProperty), { name: e.target.value })); }} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="Ex: Type de garde"/>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Code
                                                            </label>
                                                            <input type="text" value={newProperty.code} onChange={function (e) { return setNewProperty(__assign(__assign({}, newProperty), { code: e.target.value.toLowerCase().replace(/\s+/g, '_') })); }} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="Ex: guard_type"/>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Type
                                                            </label>
                                                            <select value={newProperty.type} onChange={function (e) { return setNewProperty(__assign(__assign({}, newProperty), { type: e.target.value })); }} className="w-full px-3 py-2 border rounded-md text-sm">
                                                                <option value="string">Texte</option>
                                                                <option value="number">Nombre</option>
                                                                <option value="boolean">Oui/Non</option>
                                                                <option value="date">Date</option>
                                                                <option value="select">Liste déroulante</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <input type="checkbox" id="propertyRequired" checked={newProperty.required} onChange={function (e) { return setNewProperty(__assign(__assign({}, newProperty), { required: e.target.checked })); }} className="h-4 w-4 text-indigo-600 rounded"/>
                                                            <label htmlFor="propertyRequired" className="ml-2 block text-sm text-gray-700">
                                                                Champ obligatoire
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {newProperty.type === 'select' && (<div className="mb-3">
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Options (séparées par des virgules)
                                                            </label>
                                                            <input type="text" value={((_a = newProperty.options) === null || _a === void 0 ? void 0 : _a.join(', ')) || ''} onChange={function (e) { return setNewProperty(__assign(__assign({}, newProperty), { options: e.target.value.split(',').map(function (o) { return o.trim(); }) })); }} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="Ex: Nuit, Weekend, Jour férié"/>
                                                        </div>)}

                                                    <div className="flex justify-end space-x-2 mt-3">
                                                        <button onClick={function () { return setShowPropertyForm(false); }} className="px-3 py-1 border text-gray-700 rounded-md hover:bg-gray-100 text-sm">
                                                            Annuler
                                                        </button>
                                                        <button onClick={addProperty} className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm" disabled={!newProperty.name || !newProperty.code}>
                                                            Ajouter la propriété
                                                        </button>
                                                    </div>
                                                </div>)}

                                            {formData.properties && formData.properties.length > 0 ? (<div className="overflow-hidden border rounded-md">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Nom
                                                                </th>
                                                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Code
                                                                </th>
                                                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Type
                                                                </th>
                                                                <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Requis
                                                                </th>
                                                                <th scope="col" className="relative px-4 py-2">
                                                                    <span className="sr-only">Actions</span>
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {formData.properties.map(function (property) { return (<tr key={property.id}>
                                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                                        {property.name}
                                                                    </td>
                                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                                                        {property.code}
                                                                    </td>
                                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                                                        {property.type === 'string' && 'Texte'}
                                                                        {property.type === 'number' && 'Nombre'}
                                                                        {property.type === 'boolean' && 'Oui/Non'}
                                                                        {property.type === 'date' && 'Date'}
                                                                        {property.type === 'select' && 'Liste'}
                                                                    </td>
                                                                    <td className="px-4 py-2 whitespace-nowrap text-center">
                                                                        {property.required ? (<CheckCircle2 className="h-4 w-4 text-green-500 mx-auto"/>) : (<XCircle className="h-4 w-4 text-gray-300 mx-auto"/>)}
                                                                    </td>
                                                                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm">
                                                                        <button onClick={function () { return removeProperty(property.id); }} className="text-red-600 hover:text-red-900" disabled={isSaving}>
                                                                            <Trash2 className="h-4 w-4"/>
                                                                        </button>
                                                                    </td>
                                                                </tr>); })}
                                                        </tbody>
                                                    </table>
                                                </div>) : (<div className="text-center py-4 border rounded-md border-dashed text-gray-500">
                                                    Aucune propriété additionnelle
                                                </div>)}
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4 border-t flex justify-end space-x-3">
                                    <button onClick={function () { return setEditingType(null); }} className="px-4 py-2 border rounded-md hover:bg-gray-50" disabled={isSaving}>
                                        Annuler
                                    </button>
                                    <button onClick={saveAssignmentType} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center" disabled={!formData.name || !formData.code || isSaving}>
                                        {isSaving ? (<>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                                                Enregistrement...
                                            </>) : (<>
                                                <Save className="h-4 w-4 mr-2"/>
                                                {editingType ? "Enregistrer" : "Créer"}
                                            </>)}
                                    </button>
                                </div>
                            </div>
                        </div>)}
                </>)}
        </div>);
};
export default AssignmentsConfigPanel;
