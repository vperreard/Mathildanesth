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
import { Button, Input, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Card, CardContent } from '@/components/ui';
export default function SpecialtyManager() {
    var _this = this;
    var _a = useState([]), specialties = _a[0], setSpecialties = _a[1];
    var _b = useState(true), isLoading = _b[0], setIsLoading = _b[1];
    var _c = useState(null), error = _c[0], setError = _c[1];
    // State for the add/edit form
    var _d = useState(null), isEditing = _d[0], setIsEditing = _d[1]; // Store ID of item being edited, null for adding
    var _e = useState({ name: '', isPediatric: false }), formData = _e[0], setFormData = _e[1];
    var _f = useState(null), formError = _f[0], setFormError = _f[1];
    var _g = useState(false), isSubmitting = _g[0], setIsSubmitting = _g[1];
    // Ajout d'un état pour stocker la liste des chirurgiens
    var _h = useState([]), surgeons = _h[0], setSurgeons = _h[1];
    // Fetch specialties function
    var fetchSpecialties = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
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
                    console.error("Fetch specialties error:", err_1);
                    setError(((_b = (_a = err_1.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || err_1.message || 'Impossible de charger les spécialités.');
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    // Fetch on component mount
    useEffect(function () {
        fetchSpecialties();
    }, [fetchSpecialties]);
    // Fetch surgeons function
    useEffect(function () {
        var fetchSurgeons = function () { return __awaiter(_this, void 0, void 0, function () {
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
                        console.error('Fetch surgeons error:', err_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        fetchSurgeons();
    }, []);
    // Handle form input changes
    var handleInputChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value, type = _a.type, checked = _a.checked;
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[name] = type === 'checkbox' ? checked : value, _a)));
        });
    };
    // Reset form and editing state
    var resetForm = function () {
        setIsEditing(null);
        setFormData({ name: '', isPediatric: false });
        setFormError(null);
    };
    // Start editing an existing specialty
    var handleEditClick = function (specialty) {
        setIsEditing(specialty.id);
        setFormData({ name: specialty.name, isPediatric: specialty.isPediatric });
        setFormError(null);
    };
    // Handle form submission (Add or Edit)
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var url, method, err_3;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    e.preventDefault();
                    if (!formData.name.trim()) {
                        setFormError('Le nom ne peut pas être vide.');
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
                    _c.sent(); // Re-fetch the list
                    resetForm(); // Reset form after successful submission
                    return [3 /*break*/, 6];
                case 4:
                    err_3 = _c.sent();
                    console.error("Submit specialty error:", err_3);
                    setFormError(((_b = (_a = err_3.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || err_3.message || 'Une erreur est survenue.');
                    return [3 /*break*/, 6];
                case 5:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    // Handle deletion
    var handleDeleteClick = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var err_4;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!confirm('Êtes-vous sûr de vouloir supprimer cette spécialité ? Cette action est irréversible.\nNote: La suppression échouera si des chirurgiens sont encore liés à cette spécialité.')) {
                        return [2 /*return*/];
                    }
                    setError(null); // Clear previous main errors
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios.delete("/api/specialties/".concat(id))];
                case 2:
                    _c.sent();
                    setSpecialties(function (prev) { return prev.filter(function (s) { return s.id !== id; }); }); // Optimistic update
                    return [3 /*break*/, 4];
                case 3:
                    err_4 = _c.sent();
                    console.error("Delete specialty error:", err_4);
                    setError(((_b = (_a = err_4.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || err_4.message || 'Impossible de supprimer la spécialité (vérifiez si elle est utilisée).');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (<div>
            {/* Add/Edit Form Section */}
            <Card className="mb-8">
                <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">
                        {isEditing ? 'Modifier la Spécialité' : 'Ajouter une Spécialité'}
                    </h2>
                    {formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col md:flex-row md:items-end gap-4">
                            <div className="flex-grow">
                                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} label="Nom" placeholder="Ex: Orthopédie" error={formError && !formData.name.trim() ? "Le nom est requis" : undefined}/>
                            </div>
                            <div className="flex items-center pt-4 md:pt-0 md:pb-1">
                                <input type="checkbox" id="isPediatric" name="isPediatric" checked={formData.isPediatric} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"/>
                                <label htmlFor="isPediatric" className="ml-2 block text-sm font-medium text-gray-700">Pédiatrique</label>
                            </div>
                            <div className="flex items-end space-x-2">
                                <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
                                    {!isSubmitting && (isEditing ? <CheckIcon className="h-5 w-5 mr-1"/> : <PlusIcon className="h-5 w-5 mr-1"/>)}
                                    {isEditing ? 'Enregistrer' : 'Ajouter'}
                                </Button>
                                {isEditing && (<Button type="button" onClick={resetForm} variant="secondary">
                                        <XMarkIcon className="h-5 w-5 mr-1"/> Annuler
                                    </Button>)}
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Display List Section */}
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Liste des Spécialités</h2>
            {isLoading ? (<p className="text-gray-500">Chargement...</p>) : error ? (<p className="text-red-600 bg-red-50 p-3 rounded-md border border-red-200">Erreur: {error}</p>) : specialties.length === 0 ? (<p className="text-gray-500">Aucune spécialité ajoutée pour le moment.</p>) : (<Table bordered hover striped>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Chirurgiens</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {specialties.map(function (specialty) { return (<TableRow key={specialty.id}>
                                <TableCell className="font-medium">{specialty.name}</TableCell>
                                <TableCell>
                                    <Badge variant={specialty.isPediatric ? "info" : "secondary"}>
                                        {specialty.isPediatric ? 'Pédiatrique' : 'Adulte'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {specialty.surgeons && specialty.surgeons.length > 0 ? (<span className="text-sm">
                                            {specialty.surgeons.length} chirurgien{specialty.surgeons.length > 1 ? 's' : ''}
                                        </span>) : (<span className="text-gray-400 text-sm">Aucun</span>)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button onClick={function () { return handleEditClick(specialty); }} variant="secondary" size="sm">
                                            <PencilIcon className="h-4 w-4 mr-1"/> Modifier
                                        </Button>
                                        <Button onClick={function () { return handleDeleteClick(specialty.id); }} variant="danger" size="sm">
                                            <TrashIcon className="h-4 w-4 mr-1"/> Supprimer
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>); })}
                    </TableBody>
                </Table>)}
        </div>);
}
