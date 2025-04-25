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
import { UserStatus } from '@prisma/client';
import axios from 'axios';
import { PlusIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
var STATUS_OPTIONS = Object.values(UserStatus);
export default function SurgeonForm(_a) {
    var _this = this;
    var _b, _c, _d, _e;
    var onSubmit = _a.onSubmit, onCancel = _a.onCancel, _f = _a.isLoading, isLoading = _f === void 0 ? false : _f, _g = _a.initialData, initialData = _g === void 0 ? null : _g;
    // Initialiser l'état interne du formulaire
    var _h = useState(function () {
        var _a, _b, _c, _d;
        return ({
            nom: (initialData === null || initialData === void 0 ? void 0 : initialData.nom) || '',
            prenom: (initialData === null || initialData === void 0 ? void 0 : initialData.prenom) || '',
            email: (initialData === null || initialData === void 0 ? void 0 : initialData.email) || '',
            phoneNumber: (initialData === null || initialData === void 0 ? void 0 : initialData.phoneNumber) || '',
            status: (initialData === null || initialData === void 0 ? void 0 : initialData.status) || UserStatus.ACTIF,
            userId: (initialData === null || initialData === void 0 ? void 0 : initialData.userId) || null,
            specialty1Id: ((_b = (_a = initialData === null || initialData === void 0 ? void 0 : initialData.specialties) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id) || null,
            specialty2Id: ((_d = (_c = initialData === null || initialData === void 0 ? void 0 : initialData.specialties) === null || _c === void 0 ? void 0 : _c[1]) === null || _d === void 0 ? void 0 : _d.id) || null,
        });
    }), formData = _h[0], setFormData = _h[1];
    // Nouvel état pour contrôler l'affichage du champ Spécialité 2
    var _j = useState(!!((_c = (_b = initialData === null || initialData === void 0 ? void 0 : initialData.specialties) === null || _b === void 0 ? void 0 : _b[1]) === null || _c === void 0 ? void 0 : _c.id)), showSpecialty2 = _j[0], setShowSpecialty2 = _j[1];
    var _k = useState([]), linkableUsers = _k[0], setLinkableUsers = _k[1];
    var _l = useState(false), loadingUsers = _l[0], setLoadingUsers = _l[1];
    var _m = useState(null), error = _m[0], setError = _m[1];
    var _o = useState(false), loadingSpecialties = _o[0], setLoadingSpecialties = _o[1];
    var _p = useState([]), availableSpecialties = _p[0], setAvailableSpecialties = _p[1];
    var isEditMode = initialData !== null;
    // Mise à jour de l'état si initialData change
    useEffect(function () {
        var _a, _b, _c, _d;
        var initialSpecialty1 = ((_b = (_a = initialData === null || initialData === void 0 ? void 0 : initialData.specialties) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id) || null;
        var initialSpecialty2 = ((_d = (_c = initialData === null || initialData === void 0 ? void 0 : initialData.specialties) === null || _c === void 0 ? void 0 : _c[1]) === null || _d === void 0 ? void 0 : _d.id) || null;
        setFormData({
            nom: (initialData === null || initialData === void 0 ? void 0 : initialData.nom) || '',
            prenom: (initialData === null || initialData === void 0 ? void 0 : initialData.prenom) || '',
            email: (initialData === null || initialData === void 0 ? void 0 : initialData.email) || '',
            phoneNumber: (initialData === null || initialData === void 0 ? void 0 : initialData.phoneNumber) || '',
            status: (initialData === null || initialData === void 0 ? void 0 : initialData.status) || UserStatus.ACTIF,
            userId: (initialData === null || initialData === void 0 ? void 0 : initialData.userId) || null,
            specialty1Id: initialSpecialty1,
            specialty2Id: initialSpecialty2,
        });
        // Mettre à jour showSpecialty2 basé sur les données initiales
        setShowSpecialty2(!!initialSpecialty2);
        setError(null);
    }, [initialData]);
    // Fetch linkable users on mount
    useEffect(function () {
        var fetchUsers = function () { return __awaiter(_this, void 0, void 0, function () {
            var response, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setLoadingUsers(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, axios.get('/api/users/linkable')];
                    case 2:
                        response = _a.sent();
                        setLinkableUsers(response.data);
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _a.sent();
                        console.error("Erreur fetch linkable users:", err_1);
                        return [3 /*break*/, 5];
                    case 4:
                        setLoadingUsers(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        fetchUsers();
    }, []);
    // Récupérer la liste des spécialités au montage
    useEffect(function () {
        var fetchSpecialties = function () { return __awaiter(_this, void 0, void 0, function () {
            var response, errorData, data, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setLoadingSpecialties(true);
                        setError(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, 7, 8]);
                        return [4 /*yield*/, fetch('/api/specialties')];
                    case 2:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                    case 3:
                        errorData = _a.sent();
                        throw new Error(errorData.message || 'Erreur lors de la récupération des spécialités');
                    case 4: return [4 /*yield*/, response.json()];
                    case 5:
                        data = _a.sent();
                        setAvailableSpecialties(data);
                        return [3 /*break*/, 8];
                    case 6:
                        err_2 = _a.sent();
                        console.error("Fetch specialties error:", err_2);
                        setError(err_2.message || 'Impossible de charger la liste des spécialités.');
                        return [3 /*break*/, 8];
                    case 7:
                        setLoadingSpecialties(false);
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        }); };
        fetchSpecialties();
    }, []);
    // Handler générique pour les champs (input, select)
    var handleChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value, type = _a.type;
        if (name === 'userId') {
            setFormData(function (prev) { return (__assign(__assign({}, prev), { userId: value ? parseInt(value, 10) : null })); });
        }
        else if (name === 'status') {
            var statusValue_1 = value;
            if (Object.values(UserStatus).includes(statusValue_1)) {
                setFormData(function (prev) { return (__assign(__assign({}, prev), { status: statusValue_1 })); });
            }
        }
        else if (name === 'specialty1Id') {
            var idValue_1 = (value && value !== "null") ? parseInt(value, 10) : null;
            setFormData(function (prev) {
                if (idValue_1 === null && prev.specialty2Id !== null) {
                    setShowSpecialty2(false);
                    return __assign(__assign({}, prev), { specialty1Id: prev.specialty2Id, specialty2Id: null });
                }
                else {
                    return __assign(__assign({}, prev), { specialty1Id: idValue_1 });
                }
            });
        }
        else if (name === 'specialty2Id') {
            var idValue_2 = (value && value !== "null") ? parseInt(value, 10) : null;
            setFormData(function (prev) { return (__assign(__assign({}, prev), { specialty2Id: idValue_2 })); });
        }
        else {
            setFormData(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
            });
        }
    };
    // Soumission du formulaire
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var specialtyIds, uniqueSpecialtyIds, dataToSubmit, err_3;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    e.preventDefault();
                    setError(null);
                    if (!formData.nom || !formData.prenom) {
                        setError('Nom et prénom sont obligatoires.');
                        return [2 /*return*/];
                    }
                    specialtyIds = [
                        formData.specialty1Id,
                        formData.specialty2Id
                    ].filter(function (id) { return id !== null && !isNaN(id); });
                    uniqueSpecialtyIds = Array.from(new Set(specialtyIds));
                    dataToSubmit = {
                        nom: formData.nom,
                        prenom: formData.prenom,
                        email: formData.email || null,
                        phoneNumber: formData.phoneNumber || null,
                        status: formData.status,
                        userId: formData.userId,
                        specialtyIds: uniqueSpecialtyIds,
                    };
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, onSubmit(dataToSubmit)];
                case 2:
                    _c.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_3 = _c.sent();
                    setError(((_b = (_a = err_3.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || err_3.message || 'Une erreur est survenue lors de la sauvegarde.');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (<form onSubmit={handleSubmit} className="space-y-6">
            {error && <p className="text-red-500 text-sm font-medium mb-4 p-3 bg-red-50 border border-red-200 rounded-md">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <div>
                    <label htmlFor="nom" className="block text-sm font-medium text-gray-700">Nom</label>
                    <input type="text" id="nom" name="nom" value={formData.nom} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                </div>
                <div>
                    <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">Prénom</label>
                    <input type="text" id="prenom" name="prenom" value={formData.prenom} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email (Optionnel)</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="contact@example.com"/>
                </div>
                <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Téléphone (Optionnel)</label>
                    <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="0612345678"/>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 items-end">
                <div>
                    <label htmlFor="specialty1Id" className="block text-sm font-medium text-gray-700 mb-1">Spécialité Principale</label>
                    <div className="flex items-center space-x-2">
                        <select id="specialty1Id" name="specialty1Id" value={(_d = formData.specialty1Id) !== null && _d !== void 0 ? _d : 'null'} onChange={handleChange} disabled={loadingSpecialties} className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100">
                            <option value="null">-- Aucune --</option>
                            {availableSpecialties.map(function (specialty) { return (<option key={specialty.id} value={specialty.id}>
                                    {specialty.name}{specialty.isPediatric ? ' (Péd.)' : ''}
                                </option>); })}
                        </select>
                        {formData.specialty1Id !== null && !showSpecialty2 && (<motion.button type="button" onClick={function () { return setShowSpecialty2(true); }} className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-full transition-colors flex-shrink-0" title="Ajouter une seconde spécialité" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}>
                                <PlusIcon className="h-5 w-5"/>
                            </motion.button>)}
                    </div>
                </div>

                <div className="min-h-[62px]">
                    <AnimatePresence>
                        {showSpecialty2 && (<motion.div key="specialty2-field" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                                <label htmlFor="specialty2Id" className="block text-sm font-medium text-gray-700 mb-1">Spécialité Secondaire</label>
                                <select id="specialty2Id" name="specialty2Id" value={(_e = formData.specialty2Id) !== null && _e !== void 0 ? _e : 'null'} onChange={handleChange} disabled={loadingSpecialties} className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100">
                                    <option value="null">-- Aucune --</option>
                                    {availableSpecialties.map(function (specialty) { return (<option key={specialty.id} value={specialty.id} disabled={specialty.id === formData.specialty1Id}>
                                            {specialty.name}{specialty.isPediatric ? ' (Péd.)' : ''}
                                        </option>); })}
                                </select>
                            </motion.div>)}
                    </AnimatePresence>
                </div>
            </div>
            {loadingSpecialties && <p className="text-xs text-gray-500 -mt-4 mb-4">Chargement des spécialités...</p>}

            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Statut</label>
                <select id="status" name="status" value={formData.status} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    {STATUS_OPTIONS.map(function (statusValue) { return (<option key={statusValue} value={statusValue}>{statusValue}</option>); })}
                </select>
            </div>

            <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700">Lier au compte utilisateur (Optionnel)</label>
                <select id="userId" name="userId" value={formData.userId === null ? '' : formData.userId} onChange={handleChange} disabled={loadingUsers} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100">
                    <option value="">-- Non lié --</option>
                    {(initialData === null || initialData === void 0 ? void 0 : initialData.userId) && !linkableUsers.some(function (u) { return u.id === initialData.userId; }) && (<option value={initialData.userId} disabled style={{ fontStyle: 'italic', color: 'gray' }}>
                            (Lié actuellement - ID: {initialData.userId})
                        </option>)}
                    {linkableUsers.map(function (user) { return (<option key={user.id} value={user.id}>
                            {user.prenom} {user.nom} ({user.login})
                        </option>); })}
                </select>
                {loadingUsers && <p className="text-xs text-gray-500 mt-1">Chargement des utilisateurs...</p>}
                {(initialData === null || initialData === void 0 ? void 0 : initialData.userId) && (<p className="text-xs text-gray-500 mt-1">Pour délier, sélectionnez "-- Non lié --".</p>)}
            </div>

            <div className="flex justify-end space-x-3 pt-6">
                <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors">
                    Annuler
                </button>
                <button type="submit" disabled={isLoading || loadingSpecialties} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-md shadow-sm hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                    {isLoading
            ? (isEditMode ? 'Enregistrement...' : 'Création...')
            : (isEditMode ? 'Enregistrer' : 'Ajouter Chirurgien')}
                </button>
            </div>
        </form>);
}
