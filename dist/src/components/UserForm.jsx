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
import React, { useState, useEffect, forwardRef } from 'react';
// Importer les TYPES depuis /types/user
import { DayOfWeek, // Renommer
WorkPatternType, WeekType } from '@/types/user';
// Importer les VALEURS des Enums depuis Prisma pour les valeurs par défaut
import { Role, ProfessionalRole } from '@prisma/client';
import { Eye, EyeOff } from 'lucide-react';
// Helper formatDateForInput
var formatDateForInput = function (date) {
    if (!date)
        return '';
    try {
        return new Date(date).toISOString().split('T')[0];
    }
    catch (e) {
        return '';
    }
};
// Valeurs initiales par défaut pour un nouveau formulaire
// Utilise les VALEURS importées de @prisma/client
var defaultInitialState = {
    nom: '', prenom: '', email: '', phoneNumber: '', login: '',
    role: Role.USER, // Valeur Enum Prisma
    professionalRole: ProfessionalRole.MAR, // Valeur Enum Prisma
    tempsPartiel: false, pourcentageTempsPartiel: '',
    dateEntree: '', dateSortie: '', actif: true, password: '',
    workPattern: WorkPatternType.FULL_TIME, // Type local OK
    workOnMonthType: null, // Type local OK
    joursTravaillesSemainePaire: [],
    joursTravaillesSemaineImpaire: [],
};
// Utiliser forwardRef pour passer la ref à l'élément form
var UserForm = forwardRef(function (_a, ref) {
    var onSubmit = _a.onSubmit, onCancel = _a.onCancel, initialData = _a.initialData, _b = _a.isLoading, isLoading = _b === void 0 ? false : _b;
    var _c = useState(function () {
        var _a;
        if (initialData) {
            // Créer l'état initial à partir de initialData
            return {
                nom: initialData.nom || '',
                prenom: initialData.prenom || '',
                email: initialData.email || '',
                phoneNumber: initialData.phoneNumber || '',
                login: initialData.login || '',
                role: initialData.role, // Le type User a déjà la bonne valeur (string)
                professionalRole: initialData.professionalRole, // Le type User a déjà la bonne valeur (string)
                tempsPartiel: initialData.tempsPartiel || false,
                pourcentageTempsPartiel: ((_a = initialData.pourcentageTempsPartiel) === null || _a === void 0 ? void 0 : _a.toString()) || '',
                dateEntree: formatDateForInput(initialData.dateEntree),
                dateSortie: formatDateForInput(initialData.dateSortie),
                actif: initialData.actif !== undefined ? initialData.actif : true,
                password: '',
                workPattern: initialData.workPattern || WorkPatternType.FULL_TIME,
                workOnMonthType: initialData.workOnMonthType || null,
                joursTravaillesSemainePaire: initialData.joursTravaillesSemainePaire || [],
                joursTravaillesSemaineImpaire: initialData.joursTravaillesSemaineImpaire || [],
            };
        }
        return defaultInitialState; // Utiliser l'état par défaut
    }), formData = _c[0], setFormData = _c[1];
    var _d = useState(false), showPassword = _d[0], setShowPassword = _d[1];
    var _e = useState(null), error = _e[0], setError = _e[1];
    var isEditMode = !!(initialData === null || initialData === void 0 ? void 0 : initialData.id);
    useEffect(function () {
        var _a;
        if (initialData) {
            setFormData({
                nom: initialData.nom || '',
                prenom: initialData.prenom || '',
                email: initialData.email || '',
                phoneNumber: initialData.phoneNumber || '',
                login: initialData.login || '',
                role: initialData.role,
                professionalRole: initialData.professionalRole,
                tempsPartiel: initialData.tempsPartiel || false,
                pourcentageTempsPartiel: ((_a = initialData.pourcentageTempsPartiel) === null || _a === void 0 ? void 0 : _a.toString()) || '',
                dateEntree: formatDateForInput(initialData.dateEntree),
                dateSortie: formatDateForInput(initialData.dateSortie),
                actif: initialData.actif !== undefined ? initialData.actif : true,
                password: '',
                workPattern: initialData.workPattern || WorkPatternType.FULL_TIME,
                workOnMonthType: initialData.workOnMonthType || null,
                joursTravaillesSemainePaire: initialData.joursTravaillesSemainePaire || [],
                joursTravaillesSemaineImpaire: initialData.joursTravaillesSemaineImpaire || [],
            });
        }
        else {
            setFormData(defaultInitialState); // Réinitialiser
        }
        setError(null);
    }, [initialData]);
    // Nouvelle fonction pour gérer les changements des checkboxes de jours
    var handleDayChange = function (day, weekType, checked) {
        setFormData(function (prev) {
            var _a;
            var field = weekType === 'pair' ? 'joursTravaillesSemainePaire' : 'joursTravaillesSemaineImpaire';
            var currentDays = prev[field];
            var newDays;
            if (checked) {
                // Ajouter le jour s'il n'est pas déjà présent
                newDays = currentDays.includes(day) ? currentDays : __spreadArray(__spreadArray([], currentDays, true), [day], false);
            }
            else {
                // Retirer le jour
                newDays = currentDays.filter(function (d) { return d !== day; });
            }
            // Optionnel: trier les jours pour la cohérence
            // newDays.sort(); 
            return __assign(__assign({}, prev), (_a = {}, _a[field] = newDays, _a));
        });
    };
    var handleChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value, type = _a.type;
        if (type === 'checkbox') {
            // Ne pas traiter les checkboxes de jours ici, elles utilisent handleDayChange
            if (name.startsWith('day-'))
                return;
            var checked_1 = e.target.checked;
            setFormData(function (prev) {
                var _a;
                // Actions spéciales pour la checkbox tempsPartiel
                if (name === 'tempsPartiel') {
                    if (!checked_1) {
                        // Réinitialise les champs liés au temps partiel, y compris les nouveaux
                        return __assign(__assign({}, prev), { tempsPartiel: false, pourcentageTempsPartiel: '', joursTravaillesSemainePaire: [], joursTravaillesSemaineImpaire: [], workPattern: WorkPatternType.FULL_TIME, workOnMonthType: null });
                    }
                    else {
                        // Active temps partiel
                        return __assign(__assign({}, prev), { tempsPartiel: true });
                    }
                }
                // Gestion standard des autres checkboxes (ex: actif)
                return __assign(__assign({}, prev), (_a = {}, _a[name] = checked_1, _a));
            });
        }
        else {
            // Gestion des inputs/selects
            setFormData(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
            });
        }
    };
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var dataToSend, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    setError(null);
                    if (!formData.nom || !formData.prenom || !formData.email || /*!formData.login ||*/ !formData.role || !formData.professionalRole) {
                        setError('Veuillez remplir tous les champs obligatoires (marqués d\'une *).');
                        return [2 /*return*/];
                    }
                    // Le login n'est pas dans le formulaire en mode édition, ne pas valider ici
                    if (!isEditMode && !formData.login) {
                        setError('Le login est obligatoire pour la création.');
                        return [2 /*return*/];
                    }
                    if (formData.tempsPartiel && !formData.pourcentageTempsPartiel) {
                        setError('Le pourcentage est requis si \"Temps partiel\" est coché.');
                        return [2 /*return*/];
                    }
                    if (!isEditMode && !formData.password) {
                        setError('Le mot de passe est obligatoire pour la création.');
                        return [2 /*return*/];
                    }
                    if (formData.password && formData.password.length < 6) {
                        setError('Le mot de passe doit contenir au moins 6 caractères.');
                        return [2 /*return*/];
                    }
                    dataToSend = __assign(__assign({ nom: formData.nom, prenom: formData.prenom, email: formData.email, phoneNumber: formData.phoneNumber || null, role: formData.role, professionalRole: formData.professionalRole, tempsPartiel: formData.tempsPartiel, pourcentageTempsPartiel: formData.tempsPartiel ? (parseFloat(formData.pourcentageTempsPartiel) || null) : null, dateEntree: formData.dateEntree || null, dateSortie: formData.dateSortie || null, actif: formData.actif, workPattern: formData.workPattern, workOnMonthType: formData.tempsPartiel ? formData.workOnMonthType : null, 
                        // Envoyer les tableaux de jours
                        joursTravaillesSemainePaire: formData.joursTravaillesSemainePaire, joursTravaillesSemaineImpaire: formData.joursTravaillesSemaineImpaire }, (formData.password && { password: formData.password })), (formData.login && { login: formData.login }));
                    console.log("Data to send:", dataToSend); // Log pour débogage
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, onSubmit(dataToSend)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.error("Form submission error:", err_1);
                    setError(err_1.message || 'Une erreur est survenue lors de la soumission.');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Exposer des méthodes si nécessaire via useImperativeHandle (optionnel)
    // useImperativeHandle(ref, () => ({ ... }));
    return (
    // Attacher la ref à l'élément form
    <form ref={ref} onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow mb-8">
            {/* Titre conditionnel */}
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
                {isEditMode ? "Modifier le profil de ".concat(initialData === null || initialData === void 0 ? void 0 : initialData.prenom, " ").concat(initialData === null || initialData === void 0 ? void 0 : initialData.nom) : 'Créer un nouvel utilisateur'}
            </h2>

            {error && <p className="text-red-500 text-sm font-medium mb-4 p-3 bg-red-50 border border-red-200 rounded-md">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="nom" className="block text-sm font-medium text-gray-700">Nom *</label>
                        <input type="text" id="nom" name="nom" value={formData.nom} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                    </div>
                    <div>
                        <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">Prénom *</label>
                        <input type="text" id="prenom" name="prenom" value={formData.prenom} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                    </div>
                    <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Téléphone</label>
                        <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Optionnel"/>
                    </div>
                    <div>
                        <label htmlFor="login" className="block text-sm font-medium text-gray-700">Login *</label>
                        <input type="text" id="login" name="login" value={formData.login} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">Rôle d'accès *</label>
                        <select id="role" name="role" value={formData.role} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            {Object.values(Role).map(function (r) { return <option key={r} value={r}>{r}</option>; })}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="professionalRole" className="block text-sm font-medium text-gray-700">Rôle Professionnel *</label>
                        <select id="professionalRole" name="professionalRole" value={formData.professionalRole} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            {Object.values(ProfessionalRole).map(function (pr) { return <option key={pr} value={pr}>{pr}</option>; })}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            {isEditMode ? 'Nouveau Mot de Passe (laisser vide pour ne pas changer)' : 'Mot de Passe *'}
                        </label>
                        <div className="relative mt-1">
                            <input type={showPassword ? 'text' : 'password'} id="password" name="password" value={formData.password || ''} onChange={handleChange} required={!isEditMode} minLength={6} className="block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                            <button type="button" onClick={function () { return setShowPassword(!showPassword); }} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700">
                                {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <hr className="my-6"/>

            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Détails administratifs</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex items-center">
                        <input id="actif" name="actif" type="checkbox" checked={formData.actif} onChange={handleChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"/>
                        <label htmlFor="actif" className="ml-2 block text-sm font-medium text-gray-900">Compte Actif</label>
                    </div>
                    <div className="flex items-center">
                        <input id="tempsPartiel" name="tempsPartiel" type="checkbox" checked={formData.tempsPartiel} onChange={handleChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"/>
                        <label htmlFor="tempsPartiel" className="ml-2 block text-sm text-gray-900">Temps Partiel</label>
                    </div>

                    {formData.tempsPartiel && (<div>
                            <label htmlFor="pourcentageTempsPartiel" className="block text-sm font-medium text-gray-700">Pourcentage (%)</label>
                            <input type="number" id="pourcentageTempsPartiel" name="pourcentageTempsPartiel" value={formData.pourcentageTempsPartiel} onChange={handleChange} step="10" min="0" max="100" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                        </div>)}

                    {formData.tempsPartiel && (<div>
                            <label htmlFor="workPattern" className="block text-sm font-medium text-gray-700">Configuration du temps partiel</label>
                            <select id="workPattern" name="workPattern" value={formData.workPattern} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                <option value={WorkPatternType.FULL_TIME}>Temps plein (5j/semaine)</option>
                                <option value={WorkPatternType.SPECIFIC_DAYS}>Jours spécifiques</option>
                            </select>
                        </div>)}

                    {formData.tempsPartiel && (formData.workPattern === WorkPatternType.SPECIFIC_DAYS) && (<div>
                            <label htmlFor="workOnMonthType" className="block text-sm font-medium text-gray-700">Travaille les mois</label>
                            <select id="workOnMonthType" name="workOnMonthType" value={formData.workOnMonthType || WeekType.ALL} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                <option value={WeekType.EVEN}>Pairs (février, avril...)</option>
                                <option value={WeekType.ODD}>Impairs (janvier, mars...)</option>
                                <option value={WeekType.ALL}>Tous</option>
                            </select>
                        </div>)}

                    {formData.tempsPartiel && (<div className="col-span-6 border-t pt-4 mt-4">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Configuration Temps Partiel</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Jours travaillés (Semaines Paires)
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {Object.values(DayOfWeek).map(function (day) { return (<div key={"pair-".concat(day)} className="flex items-center">
                                            <input id={"day-pair-".concat(day)} name={"day-pair-".concat(day)} type="checkbox" checked={formData.joursTravaillesSemainePaire.includes(day)} onChange={function (e) { return handleDayChange(day, 'pair', e.target.checked); }} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"/>
                                            <label htmlFor={"day-pair-".concat(day)} className="ml-2 block text-sm text-gray-900 capitalize">
                                                {day.toLowerCase()}
                                            </label>
                                        </div>); })}
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Jours travaillés (Semaines Impaires)
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {Object.values(DayOfWeek).map(function (day) { return (<div key={"impair-".concat(day)} className="flex items-center">
                                            <input id={"day-impair-".concat(day)} name={"day-impair-".concat(day)} type="checkbox" checked={formData.joursTravaillesSemaineImpaire.includes(day)} onChange={function (e) { return handleDayChange(day, 'impair', e.target.checked); }} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"/>
                                            <label htmlFor={"day-impair-".concat(day)} className="ml-2 block text-sm text-gray-900 capitalize">
                                                {day.toLowerCase()}
                                            </label>
                                        </div>); })}
                                </div>
                            </div>
                        </div>)}
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="dateEntree" className="block text-sm font-medium text-gray-700">Date d'entrée</label>
                        <input type="date" id="dateEntree" name="dateEntree" value={formData.dateEntree} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                    </div>
                    <div>
                        <label htmlFor="dateSortie" className="block text-sm font-medium text-gray-700">Date de sortie</label>
                        <input type="date" id="dateSortie" name="dateSortie" value={formData.dateSortie} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
                <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors">
                    Annuler
                </button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-md shadow-sm hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                    {isLoading
            ? (isEditMode ? 'Enregistrement...' : 'Création...')
            : 'Enregistrer'}
                </button>
            </div>
        </form>);
});
UserForm.displayName = 'UserForm'; // Ajouter displayName pour le HOC forwardRef
export default UserForm;
