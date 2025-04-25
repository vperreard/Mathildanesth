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
import React, { useState } from 'react';
import { RuleType, RulePriority } from '../types/rule';
import { getRuleTypeLabel, getRulePriorityLabel, getRulePriorityColor } from '../services/ruleService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
export var RulesList = function (_a) {
    var rules = _a.rules, loading = _a.loading, onRuleSelect = _a.onRuleSelect, onRuleToggleStatus = _a.onRuleToggleStatus, onRuleDelete = _a.onRuleDelete, onAddNewRule = _a.onAddNewRule, _b = _a.className, className = _b === void 0 ? '' : _b;
    // État pour les filtres
    var _c = useState({
        search: '',
        type: '',
        priority: '',
        status: null
    }), filters = _c[0], setFilters = _c[1];
    // État pour le tri
    var _d = useState('name'), sortField = _d[0], setSortField = _d[1];
    var _e = useState('asc'), sortDirection = _e[0], setSortDirection = _e[1];
    // État pour la règle sélectionnée
    var _f = useState(null), selectedRuleId = _f[0], setSelectedRuleId = _f[1];
    // Confirmation de suppression
    var _g = useState(null), deleteConfirmation = _g[0], setDeleteConfirmation = _g[1];
    // Fonction de filtrage des règles
    var getFilteredRules = function () {
        return rules.filter(function (rule) {
            // Filtre par texte de recherche
            if (filters.search && !rule.name.toLowerCase().includes(filters.search.toLowerCase()) &&
                !rule.description.toLowerCase().includes(filters.search.toLowerCase())) {
                return false;
            }
            // Filtre par type
            if (filters.type && rule.type !== filters.type) {
                return false;
            }
            // Filtre par priorité
            if (filters.priority && rule.priority !== filters.priority) {
                return false;
            }
            // Filtre par statut
            if (filters.status !== null && rule.isActive !== filters.status) {
                return false;
            }
            return true;
        });
    };
    // Fonction de tri des règles
    var getSortedRules = function (filteredRules) {
        return __spreadArray([], filteredRules, true).sort(function (a, b) {
            var aValue = a[sortField];
            var bValue = b[sortField];
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }
            else if (aValue instanceof Date && bValue instanceof Date) {
                return sortDirection === 'asc'
                    ? aValue.getTime() - bValue.getTime()
                    : bValue.getTime() - aValue.getTime();
            }
            else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                return sortDirection === 'asc'
                    ? (aValue ? 1 : 0) - (bValue ? 1 : 0)
                    : (bValue ? 1 : 0) - (aValue ? 1 : 0);
            }
            return 0;
        });
    };
    // Gérer le changement de tri
    var handleSort = function (field) {
        if (field === sortField) {
            setSortDirection(function (prev) { return prev === 'asc' ? 'desc' : 'asc'; });
        }
        else {
            setSortField(field);
            setSortDirection('asc');
        }
    };
    // Gérer le changement de filtre textuel
    var handleSearchChange = function (e) {
        setFilters(function (prev) { return (__assign(__assign({}, prev), { search: e.target.value })); });
    };
    // Gérer le changement de filtre de type
    var handleTypeFilterChange = function (e) {
        setFilters(function (prev) { return (__assign(__assign({}, prev), { type: e.target.value })); });
    };
    // Gérer le changement de filtre de priorité
    var handlePriorityFilterChange = function (e) {
        setFilters(function (prev) { return (__assign(__assign({}, prev), { priority: e.target.value })); });
    };
    // Gérer le changement de filtre de statut
    var handleStatusFilterChange = function (e) {
        var value = e.target.value;
        setFilters(function (prev) { return (__assign(__assign({}, prev), { status: value === '' ? null : value === 'active' })); });
    };
    // Gérer la sélection d'une règle
    var handleRuleClick = function (rule) {
        setSelectedRuleId(rule.id);
        if (onRuleSelect) {
            onRuleSelect(rule);
        }
    };
    // Gérer le changement de statut d'une règle
    var handleToggleStatus = function (rule, e) { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.stopPropagation();
                    if (!onRuleToggleStatus) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, onRuleToggleStatus(rule.id, !rule.isActive)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Erreur lors du changement de statut:', error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Gérer la demande de suppression d'une règle
    var handleDeleteClick = function (ruleId, e) {
        e.stopPropagation();
        setDeleteConfirmation(ruleId);
    };
    // Confirmer la suppression d'une règle
    var confirmDelete = function (ruleId) { return __awaiter(void 0, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!onRuleDelete) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, onRuleDelete(ruleId)];
                case 2:
                    _a.sent();
                    setDeleteConfirmation(null);
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error('Erreur lors de la suppression:', error_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Annuler la suppression
    var cancelDelete = function () {
        setDeleteConfirmation(null);
    };
    // Obtenir les règles filtrées et triées
    var filteredAndSortedRules = getSortedRules(getFilteredRules());
    return (<div className={"bg-white shadow rounded-lg ".concat(className)}>
            {/* En-tête avec filtres */}
            <div className="border-b border-gray-200 p-4">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Règles de planning</h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {/* Recherche */}
                    <div>
                        <label htmlFor="search" className="sr-only">Recherche</label>
                        <input id="search" type="text" placeholder="Rechercher..." value={filters.search} onChange={handleSearchChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>

                    {/* Filtre par type */}
                    <div>
                        <label htmlFor="typeFilter" className="sr-only">Type</label>
                        <select id="typeFilter" value={filters.type} onChange={handleTypeFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                            <option value="">Tous les types</option>
                            {Object.values(RuleType).map(function (type) { return (<option key={type} value={type}>{getRuleTypeLabel(type)}</option>); })}
                        </select>
                    </div>

                    {/* Filtre par priorité */}
                    <div>
                        <label htmlFor="priorityFilter" className="sr-only">Priorité</label>
                        <select id="priorityFilter" value={filters.priority} onChange={handlePriorityFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                            <option value="">Toutes les priorités</option>
                            {Object.values(RulePriority).map(function (priority) { return (<option key={priority} value={priority}>{getRulePriorityLabel(priority)}</option>); })}
                        </select>
                    </div>

                    {/* Filtre par statut */}
                    <div>
                        <label htmlFor="statusFilter" className="sr-only">Statut</label>
                        <select id="statusFilter" value={filters.status === null ? '' : filters.status ? 'active' : 'inactive'} onChange={handleStatusFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                            <option value="">Tous les statuts</option>
                            <option value="active">Actives</option>
                            <option value="inactive">Inactives</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Boutons d'action */}
            {onAddNewRule && (<div className="p-4 border-b border-gray-200">
                    <div className="flex flex-wrap gap-2">
                        {Object.values(RuleType).map(function (type) { return (<button key={type} onClick={function () { return onAddNewRule(type); }} className="px-3 py-1 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                                Ajouter {getRuleTypeLabel(type)}
                            </button>); })}
                    </div>
                </div>)}

            {/* Liste des règles */}
            <div className="overflow-x-auto">
                {loading ? (<div className="p-6 text-center">
                        <div className="inline-block animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
                        <p className="mt-2 text-gray-500">Chargement des règles...</p>
                    </div>) : filteredAndSortedRules.length === 0 ? (<div className="p-6 text-center text-gray-500">
                        {filters.search || filters.type || filters.priority || filters.status !== null
                ? 'Aucune règle ne correspond aux filtres sélectionnés.'
                : 'Aucune règle définie. Cliquez sur "Ajouter" pour créer une nouvelle règle.'}
                    </div>) : (<table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={function () { return handleSort('name'); }}>
                                    <div className="flex items-center">
                                        Nom
                                        {sortField === 'name' && (<span className="ml-1">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>)}
                                    </div>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={function () { return handleSort('type'); }}>
                                    <div className="flex items-center">
                                        Type
                                        {sortField === 'type' && (<span className="ml-1">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>)}
                                    </div>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={function () { return handleSort('priority'); }}>
                                    <div className="flex items-center">
                                        Priorité
                                        {sortField === 'priority' && (<span className="ml-1">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>)}
                                    </div>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={function () { return handleSort('validFrom'); }}>
                                    <div className="flex items-center">
                                        Valide du
                                        {sortField === 'validFrom' && (<span className="ml-1">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>)}
                                    </div>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={function () { return handleSort('isActive'); }}>
                                    <div className="flex items-center">
                                        Statut
                                        {sortField === 'isActive' && (<span className="ml-1">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>)}
                                    </div>
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAndSortedRules.map(function (rule) { return (<tr key={rule.id} onClick={function () { return handleRuleClick(rule); }} className={"".concat(selectedRuleId === rule.id ? 'bg-blue-50' : 'hover:bg-gray-50', " cursor-pointer")}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                                        <div className="text-sm text-gray-500 truncate max-w-xs">{rule.description}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                            {getRuleTypeLabel(rule.type)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={"px-2 inline-flex text-xs leading-5 font-semibold rounded-full ".concat(getRulePriorityColor(rule.priority))}>
                                            {getRulePriorityLabel(rule.priority)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {format(new Date(rule.validFrom), 'dd/MM/yyyy', { locale: fr })}
                                        {rule.validTo && " - ".concat(format(new Date(rule.validTo), 'dd/MM/yyyy', { locale: fr }))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={"px-2 inline-flex text-xs leading-5 font-semibold rounded-full ".concat(rule.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800')}>
                                            {rule.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {onRuleToggleStatus && (<button onClick={function (e) { return handleToggleStatus(rule, e); }} className="text-blue-600 hover:text-blue-900 mr-4">
                                                {rule.isActive ? 'Désactiver' : 'Activer'}
                                            </button>)}
                                        {onRuleDelete && deleteConfirmation !== rule.id && (<button onClick={function (e) { return handleDeleteClick(rule.id, e); }} className="text-red-600 hover:text-red-900">
                                                Supprimer
                                            </button>)}
                                        {deleteConfirmation === rule.id && (<div className="flex space-x-2">
                                                <button onClick={function (e) {
                        e.stopPropagation();
                        confirmDelete(rule.id);
                    }} className="text-red-600 hover:text-red-900">
                                                    Confirmer
                                                </button>
                                                <button onClick={function (e) {
                        e.stopPropagation();
                        cancelDelete();
                    }} className="text-gray-600 hover:text-gray-900">
                                                    Annuler
                                                </button>
                                            </div>)}
                                    </td>
                                </tr>); })}
                        </tbody>
                    </table>)}
            </div>
        </div>);
};
