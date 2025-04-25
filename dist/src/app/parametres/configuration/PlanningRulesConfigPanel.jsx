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
import { Plus, Trash2, Edit, Settings, Save, X, Loader2, MenuSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
var PlanningRulesConfigPanel = function () {
    var _a;
    // États
    var _b = useState('all'), activeTab = _b[0], setActiveTab = _b[1];
    var _c = useState([]), rules = _c[0], setRules = _c[1];
    var _d = useState([]), assignmentTypes = _d[0], setAssignmentTypes = _d[1];
    var _e = useState(true), isLoading = _e[0], setIsLoading = _e[1];
    var _f = useState(false), isSaving = _f[0], setIsSaving = _f[1];
    var _g = useState(null), editingRule = _g[0], setEditingRule = _g[1];
    // Formulaire pour l'édition ou la création
    var _h = useState({
        name: '',
        description: '',
        type: '',
        isActive: true,
        priority: 1,
        configuration: { rules: [] }
    }), formData = _h[0], setFormData = _h[1];
    // Chargement initial des données
    useEffect(function () {
        Promise.all([
            fetchRules(),
            fetchAssignmentTypes()
        ]).finally(function () { return setIsLoading(false); });
    }, []);
    // Récupérer les règles de planning depuis l'API
    var fetchRules = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, formattedData, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch('/api/planning-rules')];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Erreur lors de la récupération des règles de planning');
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    formattedData = data.map(function (rule) { return (__assign(__assign({}, rule), { createdAt: new Date(rule.createdAt), updatedAt: new Date(rule.updatedAt), configuration: typeof rule.configuration === 'string'
                            ? JSON.parse(rule.configuration)
                            : rule.configuration })); });
                    setRules(formattedData);
                    return [2 /*return*/, formattedData];
                case 3:
                    error_1 = _a.sent();
                    console.error('Erreur:', error_1);
                    toast.error('Impossible de charger les règles de planning');
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Récupérer les types d'affectations depuis l'API
    var fetchAssignmentTypes = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch('/api/assignment-types?active=true')];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Erreur lors de la récupération des types d\'affectations');
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setAssignmentTypes(data);
                    return [2 /*return*/, data];
                case 3:
                    error_2 = _a.sent();
                    console.error('Erreur:', error_2);
                    toast.error('Impossible de charger les types d\'affectations');
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Filtrer les règles selon l'onglet actif
    var filteredRules = activeTab === 'all'
        ? rules
        : rules.filter(function (rule) { return rule.type === activeTab; });
    // Ouvrir le formulaire d'édition
    var openEditForm = function (rule) {
        setEditingRule(rule);
        setFormData({
            name: rule.name,
            description: rule.description,
            type: rule.type,
            isActive: rule.isActive,
            priority: rule.priority,
            configuration: rule.configuration
        });
    };
    // Ouvrir le formulaire de création
    var openNewForm = function (typeCode) {
        setEditingRule(null);
        setFormData({
            name: '',
            description: '',
            type: typeCode || '',
            isActive: true,
            priority: 1,
            configuration: { rules: [] }
        });
    };
    // Gérer les changements de formulaire
    var handleFormChange = function (field, value) {
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = value, _a)));
        });
    };
    // Ajouter ou mettre à jour une règle
    var saveRule = function () { return __awaiter(void 0, void 0, void 0, function () {
        var apiUrl, method, response, errorData, savedRule_1, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!formData.name || !formData.type)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    setIsSaving(true);
                    apiUrl = editingRule
                        ? "/api/planning-rules/".concat(editingRule.id)
                        : '/api/planning-rules';
                    method = editingRule ? 'PUT' : 'POST';
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
                    savedRule_1 = _a.sent();
                    if (editingRule) {
                        // Mise à jour dans le state local
                        setRules(function (prev) { return prev.map(function (rule) {
                            return rule.id === editingRule.id ? __assign(__assign({}, savedRule_1), { createdAt: new Date(savedRule_1.createdAt), updatedAt: new Date(savedRule_1.updatedAt), configuration: typeof savedRule_1.configuration === 'string'
                                    ? JSON.parse(savedRule_1.configuration)
                                    : savedRule_1.configuration }) :
                                rule;
                        }); });
                        toast.success('Règle mise à jour');
                    }
                    else {
                        // Ajout dans le state local
                        setRules(function (prev) { return __spreadArray(__spreadArray([], prev, true), [
                            __assign(__assign({}, savedRule_1), { createdAt: new Date(savedRule_1.createdAt), updatedAt: new Date(savedRule_1.updatedAt), configuration: typeof savedRule_1.configuration === 'string'
                                    ? JSON.parse(savedRule_1.configuration)
                                    : savedRule_1.configuration })
                        ], false); });
                        toast.success('Règle créée');
                    }
                    // Fermer le formulaire
                    setEditingRule(null);
                    return [3 /*break*/, 8];
                case 6:
                    error_3 = _a.sent();
                    console.error('Erreur:', error_3);
                    toast.error(error_3 instanceof Error ? error_3.message : 'Erreur lors de l\'enregistrement');
                    return [3 /*break*/, 8];
                case 7:
                    setIsSaving(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    // Supprimer une règle
    var deleteRule = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var response, errorData, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Confirmation
                    if (!confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) {
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, fetch("/api/planning-rules/".concat(id), {
                            method: 'DELETE',
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    errorData = _a.sent();
                    throw new Error(errorData.error || 'Erreur lors de la suppression');
                case 4:
                    // Mise à jour du state local
                    setRules(function (prev) { return prev.filter(function (rule) { return rule.id !== id; }); });
                    toast.success('Règle supprimée');
                    return [3 /*break*/, 6];
                case 5:
                    error_4 = _a.sent();
                    console.error('Erreur:', error_4);
                    toast.error(error_4 instanceof Error ? error_4.message : 'Erreur lors de la suppression');
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    // Obtenir les détails d'un type d'affectation
    var getAssignmentType = function (code) {
        return assignmentTypes.find(function (type) { return type.code === code; });
    };
    // Rendu de l'interface
    return (<div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Règles de Planning</h1>
                <button onClick={function () { return openNewForm(); }} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center">
                    <Plus className="h-4 w-4 mr-2"/>
                    Ajouter une règle
                </button>
            </div>

            {isLoading ? (<div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600"/>
                    <span className="ml-2 text-gray-600">Chargement des règles de planning...</span>
                </div>) : (<>
                    {/* Onglets de filtrage */}
                    <div className="flex border-b">
                        <button className={"px-4 py-2 ".concat(activeTab === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-blue-500')} onClick={function () { return setActiveTab('all'); }}>
                            Toutes les règles
                        </button>
                        {assignmentTypes.map(function (type) { return (<button key={type.code} className={"px-4 py-2 ".concat(activeTab === type.code ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-blue-500')} onClick={function () { return setActiveTab(type.code); }}>
                                {type.name}
                            </button>); })}
                    </div>

                    {filteredRules.length === 0 ? (<div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <MenuSquare className="h-10 w-10 text-gray-400 mx-auto mb-3"/>
                            <p className="text-gray-600 mb-2">Aucune règle définie pour cette catégorie</p>
                            <button onClick={function () { return openNewForm(activeTab !== 'all' ? activeTab : undefined); }} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mt-4">
                                {activeTab !== 'all'
                    ? "Cr\u00E9er une r\u00E8gle pour ".concat(((_a = getAssignmentType(activeTab)) === null || _a === void 0 ? void 0 : _a.name) || activeTab)
                    : 'Créer une nouvelle règle'}
                            </button>
                        </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {filteredRules.map(function (rule) {
                    var _a, _b;
                    return (<div key={rule.id} className="border rounded-lg overflow-hidden shadow-sm bg-white">
                                    <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
                                        <div className="flex items-center space-x-2">
                                            <span className={"inline-block w-3 h-3 rounded-full ".concat(rule.isActive ? 'bg-green-500' : 'bg-gray-400')}></span>
                                            <h2 className="font-medium text-gray-800">{rule.name}</h2>
                                        </div>
                                        <div>
                                            <button onClick={function () { return openEditForm(rule); }} className="text-indigo-600 hover:text-indigo-900 p-1">
                                                <Edit className="h-4 w-4"/>
                                            </button>
                                            <button onClick={function () { return deleteRule(rule.id); }} className="text-red-600 hover:text-red-900 p-1 ml-1">
                                                <Trash2 className="h-4 w-4"/>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-center text-sm text-gray-500 mb-2">
                                            <Settings className="h-4 w-4 mr-1"/>
                                            <span>Type: {((_a = getAssignmentType(rule.type)) === null || _a === void 0 ? void 0 : _a.name) || rule.type}</span>
                                            <span className="mx-2">•</span>
                                            <span>Priorité: {rule.priority}</span>
                                        </div>
                                        {rule.description && (<p className="text-gray-600 text-sm mb-3">{rule.description}</p>)}
                                        <div className="mt-2 text-xs text-gray-500">
                                            Créée par {((_b = rule.createdByUser) === null || _b === void 0 ? void 0 : _b.name) || 'un utilisateur'} • Mise à jour {new Date(rule.updatedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>);
                })}
                        </div>)}

                    {/* Formulaire d'édition */}
                    {(editingRule !== null || formData.name !== '') && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 overflow-hidden shadow-xl">
                                <div className="px-6 py-4 border-b flex justify-between items-center">
                                    <h2 className="text-xl font-bold">
                                        {editingRule ? "Modifier la règle" : "Nouvelle règle"}
                                    </h2>
                                    <button onClick={function () { return setEditingRule(null); }} className="text-gray-400 hover:text-gray-600" disabled={isSaving}>
                                        <X className="h-5 w-5"/>
                                    </button>
                                </div>

                                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nom de la règle
                                            </label>
                                            <input type="text" value={formData.name} onChange={function (e) { return handleFormChange('name', e.target.value); }} className="w-full px-3 py-2 border rounded-md" placeholder="Ex: Limite de gardes par mois" disabled={isSaving}/>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Description
                                            </label>
                                            <textarea value={formData.description} onChange={function (e) { return handleFormChange('description', e.target.value); }} className="w-full px-3 py-2 border rounded-md" rows={3} placeholder="Description détaillée de cette règle" disabled={isSaving}/>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Type d'affectation
                                                </label>
                                                <select value={formData.type} onChange={function (e) { return handleFormChange('type', e.target.value); }} className="w-full px-3 py-2 border rounded-md" disabled={isSaving || (editingRule !== null)}>
                                                    <option value="">-- Sélectionner --</option>
                                                    {assignmentTypes.map(function (type) { return (<option key={type.code} value={type.code}>
                                                            {type.name}
                                                        </option>); })}
                                                </select>
                                                {editingRule && (<p className="text-xs text-gray-500 mt-1">Le type ne peut pas être modifié après création</p>)}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Priorité
                                                </label>
                                                <input type="number" min="1" max="100" value={formData.priority} onChange={function (e) { return handleFormChange('priority', parseInt(e.target.value) || 1); }} className="w-full px-3 py-2 border rounded-md" disabled={isSaving}/>
                                                <p className="text-xs text-gray-500 mt-1">Les règles de priorité plus élevée sont appliquées en premier</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={function (e) { return handleFormChange('isActive', e.target.checked); }} className="h-4 w-4 text-indigo-600 rounded" disabled={isSaving}/>
                                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                                                Règle active
                                            </label>
                                        </div>

                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Configuration JSON
                                            </label>
                                            <div className="relative">
                                                <div className="absolute top-0 right-0 p-2 text-xs text-gray-500">
                                                    Structure JSON
                                                </div>
                                                <textarea value={JSON.stringify(formData.configuration, null, 2)} onChange={function (e) {
                    try {
                        var config = JSON.parse(e.target.value);
                        handleFormChange('configuration', config);
                    }
                    catch (error) {
                        // Ne rien faire si le JSON est invalide
                    }
                }} className="w-full px-3 py-2 border rounded-md font-mono text-sm" rows={8} disabled={isSaving}/>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Configuration de la règle au format JSON. Consultez la documentation pour les formats disponibles.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4 border-t flex justify-end space-x-3">
                                    <button onClick={function () { return setEditingRule(null); }} className="px-4 py-2 border rounded-md hover:bg-gray-50" disabled={isSaving}>
                                        Annuler
                                    </button>
                                    <button onClick={saveRule} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center" disabled={!formData.name || !formData.type || isSaving}>
                                        {isSaving ? (<>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                                                Enregistrement...
                                            </>) : (<>
                                                <Save className="h-4 w-4 mr-2"/>
                                                {editingRule ? "Enregistrer" : "Créer"}
                                            </>)}
                                    </button>
                                </div>
                            </div>
                        </div>)}
                </>)}
        </div>);
};
export default PlanningRulesConfigPanel;
