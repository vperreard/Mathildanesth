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
// Importer les types nécessaires (ajuster les chemins si besoin)
import { ProfessionalRole, Role as AdminRole } from '@prisma/client';
// --- Constantes et Types ---
var ALL_ROLES = [ProfessionalRole.MAR, ProfessionalRole.IADE, ProfessionalRole.SECRETAIRE];
var ADMIN_ROLES = [AdminRole.ADMIN_TOTAL, AdminRole.ADMIN_PARTIEL];
var COUNTING_METHODS = [
    { value: 'WEEKDAYS_IF_WORKING', label: 'Jours Ouvrés (Lu-Ve, si travaillé)' },
    { value: 'MONDAY_TO_SATURDAY', label: 'Jours Ouvrés (Lu-Sa)' },
    { value: 'CONTINUOUS_ALL_DAYS', label: 'Jours Calendaires Continus' },
    { value: 'NONE', label: 'Non Décompté' },
];
// Valeurs par défaut pour un nouveau type
var getDefaultFormData = function () { return ({
    code: '', label: '', description: '', isActive: true, isUserSelectable: true,
    // Règles par défaut
    counting_method: 'WEEKDAYS_IF_WORKING', counting_excludePublicHolidays: true,
    balance_deducts: true,
    balance_annual_enabled: false, balance_annual_defaultDays_MAR: 0, balance_annual_defaultDays_IADE: 0, balance_annual_defaultDays_SECRETAIRE: 0,
    balance_annual_seniorityBonus_enabled: false, balance_annual_seniorityBonus_yearsRequired: 0, balance_annual_seniorityBonus_bonusDaysPerThreshold: 0, balance_annual_seniorityBonus_maxBonusDays: 0, balance_annual_seniorityBonus_applicableRoles: [],
    eligibility_roles: null, eligibility_minSeniorityMonths: 0,
    request_minNoticeDays: 0, request_requiresReason: false, request_allowHalfDays: false,
    approval_autoApprove: false, approval_requiredRole: '',
    conflicts_checkMaxOverlap: false, conflicts_maxOverlapSameRole: 1,
}); };
export default function LeaveTypeFormModal(_a) {
    var _this = this;
    var isOpen = _a.isOpen, onClose = _a.onClose, onSuccess = _a.onSuccess, initialData = _a.initialData;
    var _b = useState(getDefaultFormData()), formData = _b[0], setFormData = _b[1];
    var _c = useState(false), isSubmitting = _c[0], setIsSubmitting = _c[1];
    var _d = useState(null), error = _d[0], setError = _d[1];
    var isEditing = !!(initialData === null || initialData === void 0 ? void 0 : initialData.id);
    // Pré-remplir/Réinitialiser le formulaire
    useEffect(function () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7;
        if (isOpen) {
            if (isEditing && initialData) {
                var rules = (_a = initialData.rules) !== null && _a !== void 0 ? _a : {}; // Utiliser any temporairement pour accès flexible
                var counting = (_b = rules.counting) !== null && _b !== void 0 ? _b : {};
                var balance = (_c = rules.balance) !== null && _c !== void 0 ? _c : {};
                var annual = (_d = balance.annualAllowance) !== null && _d !== void 0 ? _d : {};
                var seniority = (_e = annual.seniorityBonus) !== null && _e !== void 0 ? _e : {};
                var eligibility = (_f = rules.eligibility) !== null && _f !== void 0 ? _f : {};
                var request = (_g = rules.request) !== null && _g !== void 0 ? _g : {};
                var approval = (_h = rules.approval) !== null && _h !== void 0 ? _h : {};
                var conflicts = (_j = rules.conflicts) !== null && _j !== void 0 ? _j : {};
                setFormData({
                    code: initialData.code || '',
                    label: initialData.label || '',
                    description: initialData.description || '',
                    isActive: (_k = initialData.isActive) !== null && _k !== void 0 ? _k : true,
                    isUserSelectable: (_l = initialData.isUserSelectable) !== null && _l !== void 0 ? _l : true,
                    // --- Règles ---
                    counting_method: counting.method || 'WEEKDAYS_IF_WORKING',
                    counting_excludePublicHolidays: (_m = counting.excludePublicHolidays) !== null && _m !== void 0 ? _m : true,
                    balance_deducts: (_o = balance.deducts) !== null && _o !== void 0 ? _o : true,
                    balance_annual_enabled: !!balance.annualAllowance, // Déduit de la présence de l'objet
                    balance_annual_defaultDays_MAR: (_q = (_p = annual.defaultDaysByRole) === null || _p === void 0 ? void 0 : _p.MAR) !== null && _q !== void 0 ? _q : 0,
                    balance_annual_defaultDays_IADE: (_s = (_r = annual.defaultDaysByRole) === null || _r === void 0 ? void 0 : _r.IADE) !== null && _s !== void 0 ? _s : 0,
                    balance_annual_defaultDays_SECRETAIRE: (_u = (_t = annual.defaultDaysByRole) === null || _t === void 0 ? void 0 : _t.SECRETAIRE) !== null && _u !== void 0 ? _u : 0,
                    balance_annual_seniorityBonus_enabled: (_v = seniority.enabled) !== null && _v !== void 0 ? _v : false,
                    balance_annual_seniorityBonus_yearsRequired: (_w = seniority.yearsRequired) !== null && _w !== void 0 ? _w : 0,
                    balance_annual_seniorityBonus_bonusDaysPerThreshold: (_x = seniority.bonusDaysPerThreshold) !== null && _x !== void 0 ? _x : 0,
                    balance_annual_seniorityBonus_maxBonusDays: (_y = seniority.maxBonusDays) !== null && _y !== void 0 ? _y : 0,
                    balance_annual_seniorityBonus_applicableRoles: (_z = seniority.applicableRoles) !== null && _z !== void 0 ? _z : [],
                    eligibility_roles: eligibility.roles === undefined ? null : eligibility.roles, // Gérer null explicitement vs undefined
                    eligibility_minSeniorityMonths: (_0 = eligibility.minSeniorityMonths) !== null && _0 !== void 0 ? _0 : 0,
                    request_minNoticeDays: (_1 = request.minNoticeDays) !== null && _1 !== void 0 ? _1 : 0,
                    request_requiresReason: (_2 = request.requiresReason) !== null && _2 !== void 0 ? _2 : false,
                    request_allowHalfDays: (_3 = request.allowHalfDays) !== null && _3 !== void 0 ? _3 : false,
                    approval_autoApprove: (_4 = approval.autoApprove) !== null && _4 !== void 0 ? _4 : false,
                    approval_requiredRole: (_5 = approval.requiredRole) !== null && _5 !== void 0 ? _5 : '',
                    conflicts_checkMaxOverlap: (_6 = conflicts.checkMaxOverlap) !== null && _6 !== void 0 ? _6 : false,
                    conflicts_maxOverlapSameRole: (_7 = conflicts.maxOverlapSameRole) !== null && _7 !== void 0 ? _7 : 1,
                });
            }
            else {
                // Réinitialiser pour l'ajout
                setFormData(getDefaultFormData());
            }
        }
        setError(null); // Toujours effacer l'erreur à l'ouverture/changement
    }, [initialData, isEditing, isOpen]);
    // Handler générique pour la plupart des champs
    var handleChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value, type = _a.type;
        if (type === 'checkbox') {
            var checked_1 = e.target.checked;
            setFormData(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = checked_1, _a)));
            });
        }
        else if (type === 'number') {
            setFormData(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = value === '' ? 0 : parseInt(value, 10), _a)));
            }); // Gérer champ vide
        }
        else {
            setFormData(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
            });
        }
        // Gérer la visibilité des champs liés à l'approbation manuelle
        if (name === 'approval_autoApprove' && e.target.checked) {
            setFormData(function (prev) { return (__assign(__assign({}, prev), { approval_requiredRole: '' })); }); // Effacer si autoApprove
        }
        // Gérer la visibilité des champs liés aux conflits
        if (name === 'conflicts_checkMaxOverlap' && !e.target.checked) {
            setFormData(function (prev) { return (__assign(__assign({}, prev), { conflicts_maxOverlapSameRole: 1 })); }); // Reset si check désactivé
        }
    };
    // Handler spécifique pour les checkboxes de rôles (multi-sélection)
    var handleRoleCheckboxChange = function (e, fieldName) {
        var _a;
        var _b = e.target, value = _b.value, checked = _b.checked;
        var role = value; // ou AdminRole selon le champ
        var currentRoles = formData[fieldName]; // Peut être null pour eligibility_roles
        var updatedRoles = null; // Initialiser à null
        if (fieldName === 'eligibility_roles') {
            var allPossibleRoles = ALL_ROLES; // Utiliser ALL_ROLES pour éligibilité
            if (checked) {
                // Ajouter le rôle coché
                if (currentRoles === null) {
                    // Si on coche alors que "tous" est sélectionné, cela n'a pas de sens, on reste à "tous".
                    updatedRoles = null;
                }
                else {
                    // Ajouter le rôle à la liste existante
                    var rolesSet = new Set(currentRoles);
                    rolesSet.add(role);
                    updatedRoles = Array.from(rolesSet);
                    // Si tous les rôles sont maintenant cochés, repasser à null (signifie "tous")
                    if (updatedRoles.length === allPossibleRoles.length) {
                        updatedRoles = null;
                    }
                }
            }
            else {
                // Retirer le rôle décoché
                if (currentRoles === null) {
                    // Si on décoche depuis l'état "tous", sélectionner explicitement tous les *autres* rôles.
                    updatedRoles = allPossibleRoles.filter(function (r) { return r !== role; });
                }
                else {
                    // Si on décoche depuis une sélection partielle, retirer simplement le rôle.
                    updatedRoles = currentRoles.filter(function (r) { return r !== role; });
                    // Si la liste devient vide après avoir décoché, cela signifie qu'aucun rôle spécifique n'est sélectionné.
                    // Selon notre convention (null = tous), une liste vide n'a pas de sens ici. 
                    // On pourrait soit interdire de tout décocher, soit revenir à null (tous).
                    // Pour l'instant, on laisse la possibilité d'avoir un tableau vide (signifiant aucun rôle éligible dans ce cas).
                    // ATTENTION: vérifier si la logique backend interprète bien [] comme "aucun" et null comme "tous".
                    // Si on veut que décocher la dernière case = revenir à null (tous), décommenter la ligne suivante :
                    // if (updatedRoles.length === 0) { updatedRoles = null; }
                }
            }
        }
        else if (fieldName === 'balance_annual_seniorityBonus_applicableRoles') {
            // Logique pour les rôles du bonus (ne peut pas être null, commence par [])
            var currentBonusRoles = (_a = formData.balance_annual_seniorityBonus_applicableRoles) !== null && _a !== void 0 ? _a : [];
            if (checked) {
                // Utiliser un Set pour éviter les doublons si jamais
                var rolesSet = new Set(currentBonusRoles);
                rolesSet.add(role);
                updatedRoles = Array.from(rolesSet);
            }
            else {
                updatedRoles = currentBonusRoles.filter(function (r) { return r !== role; });
            }
        }
        // Mettre à jour l'état
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[fieldName] = updatedRoles, _a)));
        });
    };
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var rules, apiUrl, method, bodyToSend, response, errorData, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    setIsSubmitting(true);
                    setError(null);
                    rules = {
                        counting: {
                            method: formData.counting_method,
                            excludePublicHolidays: formData.counting_excludePublicHolidays
                        },
                        balance: {
                            deducts: formData.balance_deducts,
                            sourceTypeCode: formData.code.startsWith("RECOVERY") ? formData.code : null // Logique simple pour sourceTypeCode
                        },
                        eligibility: {
                            roles: formData.eligibility_roles, // null signifie tous
                            minSeniorityMonths: formData.eligibility_minSeniorityMonths
                        },
                        request: {
                            minNoticeDays: formData.request_minNoticeDays,
                            requiresReason: formData.request_requiresReason,
                            allowHalfDays: formData.request_allowHalfDays
                        },
                        approval: {
                            autoApprove: formData.approval_autoApprove,
                            requiredRole: !formData.approval_autoApprove ? formData.approval_requiredRole || undefined : undefined // Seulement si pas autoApprove
                        },
                        conflicts: {
                            checkMaxOverlap: formData.conflicts_checkMaxOverlap,
                            maxOverlapSameRole: formData.conflicts_checkMaxOverlap ? formData.conflicts_maxOverlapSameRole : undefined // Seulement si checkMaxOverlap
                        }
                    };
                    // Ajouter la section annualAllowance seulement si nécessaire
                    if (formData.code.startsWith('ANNUAL')) { // Ou utiliser formData.balance_annual_enabled
                        rules.balance.annualAllowance = {
                            defaultDaysByRole: {
                                MAR: formData.balance_annual_defaultDays_MAR,
                                IADE: formData.balance_annual_defaultDays_IADE,
                                SECRETAIRE: formData.balance_annual_defaultDays_SECRETAIRE
                            },
                            seniorityBonus: {
                                enabled: formData.balance_annual_seniorityBonus_enabled,
                                yearsRequired: formData.balance_annual_seniorityBonus_enabled ? formData.balance_annual_seniorityBonus_yearsRequired : undefined,
                                bonusDaysPerThreshold: formData.balance_annual_seniorityBonus_enabled ? formData.balance_annual_seniorityBonus_bonusDaysPerThreshold : undefined,
                                maxBonusDays: formData.balance_annual_seniorityBonus_enabled ? formData.balance_annual_seniorityBonus_maxBonusDays : undefined,
                                applicableRoles: formData.balance_annual_seniorityBonus_enabled ? formData.balance_annual_seniorityBonus_applicableRoles : undefined,
                            }
                        };
                    }
                    apiUrl = isEditing ? "/api/admin/leave-types/".concat(initialData === null || initialData === void 0 ? void 0 : initialData.id) : '/api/admin/leave-types';
                    method = isEditing ? 'PUT' : 'POST';
                    if (isEditing) {
                        bodyToSend = {
                            label: formData.label,
                            description: formData.description,
                            isActive: formData.isActive,
                            isUserSelectable: formData.isUserSelectable,
                            rules: rules // Envoyer l'objet rules reconstruit
                        };
                    }
                    else {
                        bodyToSend = {
                            code: formData.code, // Inclure le code pour la création
                            label: formData.label,
                            description: formData.description,
                            isActive: formData.isActive,
                            isUserSelectable: formData.isUserSelectable,
                            rules: rules
                        };
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, fetch(apiUrl, {
                            method: method,
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(bodyToSend),
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    errorData = _a.sent();
                    throw new Error(errorData.error || "Erreur HTTP ".concat(response.status));
                case 4:
                    alert("Type de cong\u00E9 ".concat(isEditing ? 'mis à jour' : 'créé', " avec succ\u00E8s !"));
                    onSuccess();
                    return [3 /*break*/, 7];
                case 5:
                    err_1 = _a.sent();
                    console.error("Erreur lors de la soumission:", err_1);
                    setError(err_1.message || "Une erreur est survenue.");
                    return [3 /*break*/, 7];
                case 6:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    if (!isOpen)
        return null;
    // --- Rendu JSX --- 
    return (
    // Backdrop:
    <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex', /* alignItems: 'center', // Retiré */ justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem 0' // Ajout padding vertical pour l'espacement
            // overflowY: 'auto' // Retiré du backdrop
        }}>
            {/* Conteneur du Modal Blanc: */}
            <div style={{
            background: 'white', padding: '2rem',
            borderRadius: '8px', width: '90%', maxWidth: '600px',
            overflowY: 'auto', // Ajout du scroll sur le modal lui-même
            maxHeight: '90vh' // Limite la hauteur à 90% de la vue
        }}>
                <h2 className="text-xl font-bold mb-6">{isEditing ? 'Modifier le Type de Congé' : 'Ajouter un Type de Congé'}</h2>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* --- Informations Générales --- */}
                    <fieldset className="space-y-4 border p-4 rounded">
                        <legend className="text-lg font-medium px-1">Informations Générales</legend>
                        {/* Code (non modifiable en édition) */}
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700">Code <span className="text-red-500">*</span></label>
                            <input type="text" id="code" name="code" value={formData.code} onChange={handleChange} required disabled={isEditing} className={"mt-1 block w-full border rounded-md shadow-sm py-2 px-3 sm:text-sm ".concat(isEditing ? 'bg-gray-100' : 'border-gray-300')} pattern="[A-Z0-9_]+" title="Majuscules, chiffres, underscores (_)."/>
                            {!isEditing && <p className="text-xs text-gray-500 mt-1">Identifiant unique (ANNUAL_MAR, SICK...). Non modifiable.</p>}
                        </div>
                        {/* Libellé */}
                        <div>
                            <label htmlFor="label" className="block text-sm font-medium text-gray-700">Libellé <span className="text-red-500">*</span></label>
                            <input type="text" id="label" name="label" value={formData.label} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"/>
                            <p className="text-xs text-gray-500 mt-1">Nom affiché.</p>
                        </div>
                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea id="description" name="description" rows={2} value={formData.description} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"/>
                        </div>
                        {/* Checkboxes Actif / Sélectionnable */}
                        <div className="flex space-x-4">
                            <div className="flex items-center">
                                <input id="isActive" name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Actif</label>
                            </div>
                            <div className="flex items-center">
                                <input id="isUserSelectable" name="isUserSelectable" type="checkbox" checked={formData.isUserSelectable} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                                <label htmlFor="isUserSelectable" className="ml-2 block text-sm text-gray-900">Sélectionnable par l'utilisateur</label>
                            </div>
                        </div>
                    </fieldset>

                    {/* --- Règles de Décompte --- */}
                    <fieldset className="space-y-4 border p-4 rounded">
                        <legend className="text-lg font-medium px-1">Règles de Décompte</legend>
                        <div>
                            <label htmlFor="counting_method" className="block text-sm font-medium text-gray-700">Méthode de décompte</label>
                            <select id="counting_method" name="counting_method" value={formData.counting_method} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm">
                                {COUNTING_METHODS.map(function (opt) { return <option key={opt.value} value={opt.value}>{opt.label}</option>; })}
                            </select>
                        </div>
                        <div className="flex items-center">
                            <input id="counting_excludePublicHolidays" name="counting_excludePublicHolidays" type="checkbox" checked={formData.counting_excludePublicHolidays} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                            <label htmlFor="counting_excludePublicHolidays" className="ml-2 block text-sm text-gray-900">Exclure les jours fériés du décompte</label>
                        </div>
                    </fieldset>

                    {/* --- Règles de Solde --- */}
                    <fieldset className="space-y-4 border p-4 rounded">
                        <legend className="text-lg font-medium px-1">Règles de Solde</legend>
                        <div className="flex items-center">
                            <input id="balance_deducts" name="balance_deducts" type="checkbox" checked={formData.balance_deducts} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                            <label htmlFor="balance_deducts" className="ml-2 block text-sm text-gray-900">Ce congé déduit d'un solde</label>
                        </div>

                        {/* Section Spécifique Annuel (Conditionnelle) */}
                        {formData.code.startsWith('ANNUAL') && (<div className="border-t pt-4 mt-4 space-y-4">
                                <p className="text-sm font-medium text-gray-600">Configuration Solde Annuel</p>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Jours annuels par défaut par rôle</label>
                                    <div className="grid grid-cols-3 gap-2 mt-1">
                                        <div><label htmlFor="balance_annual_defaultDays_MAR" className="text-xs">MAR</label><input type="number" id="balance_annual_defaultDays_MAR" name="balance_annual_defaultDays_MAR" value={formData.balance_annual_defaultDays_MAR} onChange={handleChange} className="w-full border-gray-300 rounded-md sm:text-sm"/></div>
                                        <div><label htmlFor="balance_annual_defaultDays_IADE" className="text-xs">IADE</label><input type="number" id="balance_annual_defaultDays_IADE" name="balance_annual_defaultDays_IADE" value={formData.balance_annual_defaultDays_IADE} onChange={handleChange} className="w-full border-gray-300 rounded-md sm:text-sm"/></div>
                                        <div><label htmlFor="balance_annual_defaultDays_SECRETAIRE" className="text-xs">SEC</label><input type="number" id="balance_annual_defaultDays_SECRETAIRE" name="balance_annual_defaultDays_SECRETAIRE" value={formData.balance_annual_defaultDays_SECRETAIRE} onChange={handleChange} className="w-full border-gray-300 rounded-md sm:text-sm"/></div>
                                    </div>
                                </div>
                                {/* Bonus Ancienneté */}
                                <div className="flex items-center pt-2">
                                    <input id="balance_annual_seniorityBonus_enabled" name="balance_annual_seniorityBonus_enabled" type="checkbox" checked={formData.balance_annual_seniorityBonus_enabled} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                                    <label htmlFor="balance_annual_seniorityBonus_enabled" className="ml-2 block text-sm font-medium text-gray-900">Activer Bonus Ancienneté</label>
                                </div>
                                {formData.balance_annual_seniorityBonus_enabled && (<div className="pl-6 space-y-3 border-l ml-2">
                                        <div className="grid grid-cols-3 gap-2">
                                            <div><label htmlFor="balance_annual_seniorityBonus_yearsRequired" className="text-xs">Années Req.</label><input type="number" id="balance_annual_seniorityBonus_yearsRequired" name="balance_annual_seniorityBonus_yearsRequired" value={formData.balance_annual_seniorityBonus_yearsRequired} onChange={handleChange} className="w-full border-gray-300 rounded-md sm:text-sm"/></div>
                                            <div><label htmlFor="balance_annual_seniorityBonus_bonusDaysPerThreshold" className="text-xs">Jours / Palier</label><input type="number" id="balance_annual_seniorityBonus_bonusDaysPerThreshold" name="balance_annual_seniorityBonus_bonusDaysPerThreshold" value={formData.balance_annual_seniorityBonus_bonusDaysPerThreshold} onChange={handleChange} className="w-full border-gray-300 rounded-md sm:text-sm"/></div>
                                            <div><label htmlFor="balance_annual_seniorityBonus_maxBonusDays" className="text-xs">Bonus Max</label><input type="number" id="balance_annual_seniorityBonus_maxBonusDays" name="balance_annual_seniorityBonus_maxBonusDays" value={formData.balance_annual_seniorityBonus_maxBonusDays} onChange={handleChange} className="w-full border-gray-300 rounded-md sm:text-sm"/></div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Rôles concernés par le bonus</label>
                                            <div className="flex space-x-4">
                                                {[ProfessionalRole.IADE, ProfessionalRole.SECRETAIRE].map(function (role) { return (<div key={role} className="flex items-center">
                                                        <input type="checkbox" id={"bonusRole_".concat(role)} name="balance_annual_seniorityBonus_applicableRoles" value={role} checked={formData.balance_annual_seniorityBonus_applicableRoles.includes(role)} onChange={function (e) { return handleRoleCheckboxChange(e, 'balance_annual_seniorityBonus_applicableRoles'); }} className="h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                                                        <label htmlFor={"bonusRole_".concat(role)} className="ml-2 text-sm text-gray-600">{role}</label>
                                                    </div>); })}
                                            </div>
                                        </div>
                                    </div>)}
                            </div>)}
                    </fieldset>


                    {/* --- Règles d'Éligibilité --- */}
                    <fieldset className="space-y-4 border p-4 rounded">
                        <legend className="text-lg font-medium px-1">Éligibilité</legend>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rôles autorisés à demander</label>
                            <div className="flex space-x-4">
                                {ALL_ROLES.map(function (role) { return (<div key={role} className="flex items-center">
                                        <input type="checkbox" id={"eligRole_".concat(role)} name="eligibility_roles" value={role} checked={formData.eligibility_roles === null || formData.eligibility_roles.includes(role)} onChange={function (e) { return handleRoleCheckboxChange(e, 'eligibility_roles'); }} className="h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                                        <label htmlFor={"eligRole_".concat(role)} className="ml-2 text-sm text-gray-600">{role}</label>
                                    </div>); })}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Si aucune case n'est cochée, tous les rôles sont autorisés.</p>
                        </div>
                        <div>
                            <label htmlFor="eligibility_minSeniorityMonths" className="block text-sm font-medium text-gray-700">Ancienneté minimale requise (mois)</label>
                            <input type="number" id="eligibility_minSeniorityMonths" name="eligibility_minSeniorityMonths" value={formData.eligibility_minSeniorityMonths} onChange={handleChange} min="0" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"/>
                        </div>
                    </fieldset>

                    {/* --- Règles de Demande --- */}
                    <fieldset className="space-y-4 border p-4 rounded">
                        <legend className="text-lg font-medium px-1">Règles de Demande</legend>
                        <div>
                            <label htmlFor="request_minNoticeDays" className="block text-sm font-medium text-gray-700">Délai de prévenance minimum (jours)</label>
                            <input type="number" id="request_minNoticeDays" name="request_minNoticeDays" value={formData.request_minNoticeDays} onChange={handleChange} min="0" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"/>
                        </div>
                        <div className="flex space-x-4">
                            <div className="flex items-center">
                                <input id="request_requiresReason" name="request_requiresReason" type="checkbox" checked={formData.request_requiresReason} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                                <label htmlFor="request_requiresReason" className="ml-2 block text-sm text-gray-900">Motif obligatoire</label>
                            </div>
                            <div className="flex items-center">
                                <input id="request_allowHalfDays" name="request_allowHalfDays" type="checkbox" checked={formData.request_allowHalfDays} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                                <label htmlFor="request_allowHalfDays" className="ml-2 block text-sm text-gray-900">Autoriser les demi-journées</label>
                            </div>
                        </div>
                    </fieldset>


                    {/* --- Règles d'Approbation --- */}
                    <fieldset className="space-y-4 border p-4 rounded">
                        <legend className="text-lg font-medium px-1">Approbation</legend>
                        <div className="flex items-center">
                            <input id="approval_autoApprove" name="approval_autoApprove" type="checkbox" checked={formData.approval_autoApprove} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                            <label htmlFor="approval_autoApprove" className="ml-2 block text-sm text-gray-900">Approbation Automatique</label>
                        </div>
                        {!formData.approval_autoApprove && (<div>
                                <label htmlFor="approval_requiredRole" className="block text-sm font-medium text-gray-700">Rôle requis pour approbation manuelle</label>
                                <select id="approval_requiredRole" name="approval_requiredRole" value={formData.approval_requiredRole} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm">
                                    <option value="">-- Sélectionner un rôle --</option>
                                    {ADMIN_ROLES.map(function (role) { return <option key={role} value={role}>{role}</option>; })}
                                </select>
                            </div>)}
                    </fieldset>

                    {/* --- Règles de Conflits --- */}
                    <fieldset className="space-y-4 border p-4 rounded">
                        <legend className="text-lg font-medium px-1">Conflits d'effectif</legend>
                        <div className="flex items-center">
                            <input id="conflicts_checkMaxOverlap" name="conflicts_checkMaxOverlap" type="checkbox" checked={formData.conflicts_checkMaxOverlap} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                            <label htmlFor="conflicts_checkMaxOverlap" className="ml-2 block text-sm text-gray-900">Vérifier le nombre maximum d'absents simultanés (même rôle)</label>
                        </div>
                        {formData.conflicts_checkMaxOverlap && (<div>
                                <label htmlFor="conflicts_maxOverlapSameRole" className="block text-sm font-medium text-gray-700">Nombre maximum d'absents autorisés</label>
                                <input type="number" id="conflicts_maxOverlapSameRole" name="conflicts_maxOverlapSameRole" value={formData.conflicts_maxOverlapSameRole} onChange={handleChange} min="0" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"/>
                            </div>)}
                        {/* Note: La vérification d'effectif minimum (checkMinStaff) n'est pas incluse ici pour simplifier, mais pourrait être ajoutée */}
                    </fieldset>


                    {/* Affichage Erreur Générale */}
                    {error && (<p className="text-sm text-red-600">{error}</p>)}

                    {/* Boutons d'action */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded disabled:opacity-50">Annuler</button>
                        <button type="submit" disabled={isSubmitting} className={"bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 ".concat(isSubmitting ? 'animate-pulse' : '')}> {isSubmitting ? 'Enregistrement...' : (isEditing ? 'Mettre à jour' : 'Créer')} </button>
                    </div>
                </form>
            </div>
        </div>);
}
