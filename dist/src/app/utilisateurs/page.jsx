'use client';
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
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import UserForm from '@/components/UserForm';
import { useAuth } from '@/context/AuthContext'; // Importer useAuth
import ProtectedRoute from '@/components/ProtectedRoute'; // Importer ProtectedRoute
// Type Role et Interface User déplacés vers src/types/user.ts
// Wrapper pour protéger la page entière
function UsersPageContent() {
    var _this = this;
    var _a = useAuth(), currentUser = _a.user, authLoading = _a.isLoading; // Obtenir l'utilisateur connecté
    var _b = useState([]), users = _b[0], setUsers = _b[1];
    var _c = useState(true), loading = _c[0], setLoading = _c[1];
    var _d = useState(null), actionLoading = _d[0], setActionLoading = _d[1];
    var _e = useState(null), error = _e[0], setError = _e[1];
    var _f = useState(null), successMessage = _f[0], setSuccessMessage = _f[1]; // Pour les messages de succès (reset mdp)
    var _g = useState(null), editingUser = _g[0], setEditingUser = _g[1];
    var _h = useState(false), isCreating = _h[0], setIsCreating = _h[1];
    // Référence pour le formulaire
    var formRef = useRef(null);
    // Déterminer si l'utilisateur actuel peut éditer les rôles (utilisation de la chaîne)
    var canEditRole = (currentUser === null || currentUser === void 0 ? void 0 : currentUser.role) === 'ADMIN_TOTAL';
    var fetchUsers = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var response, err_1;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    setSuccessMessage(null);
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, axios.get('/api/utilisateurs')];
                case 2:
                    response = _e.sent();
                    setUsers(response.data);
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _e.sent();
                    console.error("Erreur fetchUsers:", err_1);
                    if (axios.isAxiosError(err_1) && ((_a = err_1.response) === null || _a === void 0 ? void 0 : _a.status) !== 401) { // Ne pas afficher l'erreur 401 du middleware ici
                        setError("Erreur ".concat(((_b = err_1.response) === null || _b === void 0 ? void 0 : _b.status) || 'inconnue', ": ").concat(((_d = (_c = err_1.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message) || 'Impossible de récupérer les utilisateurs'));
                    }
                    else if (!axios.isAxiosError(err_1)) {
                        setError('Une erreur inattendue est survenue');
                    }
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    useEffect(function () {
        if (!authLoading && currentUser) {
            fetchUsers();
        }
    }, [fetchUsers, authLoading, currentUser]);
    // --- Effet pour scroller vers le formulaire --- 
    useEffect(function () {
        if (editingUser && formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Ajusté à 'center'
        }
        // Scroller aussi quand on ouvre le formulaire de création
        if (isCreating && formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [editingUser, isCreating]); // Déclencher quand on sélectionne un user ou qu'on crée
    var handleApiResponse = function (updatedOrDeletedUser, isDelete) {
        if (isDelete === void 0) { isDelete = false; }
        if (isDelete) {
            setUsers(function (prevUsers) { return prevUsers.filter(function (user) { return user.id !== updatedOrDeletedUser.id; }); });
        }
        else {
            setUsers(function (prevUsers) {
                var existingIndex = prevUsers.findIndex(function (u) { return u.id === updatedOrDeletedUser.id; });
                if (existingIndex > -1) {
                    var newUsers = __spreadArray([], prevUsers, true);
                    newUsers[existingIndex] = updatedOrDeletedUser;
                    return newUsers;
                }
                else {
                    return __spreadArray(__spreadArray([], prevUsers, true), [updatedOrDeletedUser], false);
                }
            });
        }
        setEditingUser(null);
        setIsCreating(false);
        setActionLoading(null);
        setError(null); // Clear error on success
        setSuccessMessage(null); // Clear success message
    };
    var handleCreateUser = function (formData) { return __awaiter(_this, void 0, void 0, function () {
        var response, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setActionLoading(-1);
                    setError(null);
                    setSuccessMessage(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios.post('/api/utilisateurs', formData)];
                case 2:
                    response = _a.sent();
                    handleApiResponse(response.data);
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    setActionLoading(null);
                    if (axios.isAxiosError(err_2) && err_2.response) {
                        throw new Error(err_2.response.data.message || 'Erreur lors de la création');
                    }
                    else {
                        throw new Error('Une erreur inattendue est survenue');
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleUpdateUser = function (formData) { return __awaiter(_this, void 0, void 0, function () {
        var response, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!editingUser)
                        return [2 /*return*/];
                    setActionLoading(editingUser.id);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios.put("/api/utilisateurs/".concat(editingUser.id), formData)];
                case 2:
                    response = _a.sent();
                    handleApiResponse(response.data);
                    return [3 /*break*/, 4];
                case 3:
                    err_3 = _a.sent();
                    console.error("Erreur handleUpdateUser:", err_3);
                    setActionLoading(null);
                    if (axios.isAxiosError(err_3) && err_3.response) {
                        throw new Error(err_3.response.data.message || 'Erreur lors de la modification');
                    }
                    else {
                        throw new Error('Une erreur inattendue est survenue');
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleDeleteUser = function (userId) { return __awaiter(_this, void 0, void 0, function () {
        var err_4, message;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?'))
                        return [2 /*return*/];
                    setActionLoading(userId);
                    setError(null);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios.delete("/api/utilisateurs/".concat(userId))];
                case 2:
                    _c.sent();
                    handleApiResponse({ id: userId }, true);
                    return [3 /*break*/, 4];
                case 3:
                    err_4 = _c.sent();
                    console.error("Erreur handleDeleteUser:", err_4);
                    setActionLoading(null);
                    message = (axios.isAxiosError(err_4) && ((_b = (_a = err_4.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message)) || 'Erreur lors de la suppression';
                    setError(message);
                    setTimeout(function () { return setError(null); }, 5000);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleResetPassword = function (userId) { return __awaiter(_this, void 0, void 0, function () {
        var err_5, message;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!window.confirm('Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet utilisateur ? Son nouveau mot de passe sera son login.'))
                        return [2 /*return*/];
                    setActionLoading(userId); // Indicate loading state for this specific user
                    setError(null);
                    setSuccessMessage(null);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, 4, 5]);
                    // Utilisation de la nouvelle route spécifique
                    return [4 /*yield*/, axios.put("/api/utilisateurs/".concat(userId, "/reset-password"))];
                case 2:
                    // Utilisation de la nouvelle route spécifique
                    _c.sent();
                    setSuccessMessage("Mot de passe de l'utilisateur ".concat(userId, " r\u00E9initialis\u00E9 avec succ\u00E8s (nouveau mot de passe = login)."));
                    // Optionnel: rafraîchir les données ou juste retirer le message après un délai
                    setTimeout(function () { return setSuccessMessage(null); }, 7000);
                    return [3 /*break*/, 5];
                case 3:
                    err_5 = _c.sent();
                    console.error("Erreur handleResetPassword:", err_5);
                    message = (axios.isAxiosError(err_5) && ((_b = (_a = err_5.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message)) || 'Erreur lors de la réinitialisation du mot de passe';
                    setError(message);
                    setTimeout(function () { return setError(null); }, 5000);
                    return [3 /*break*/, 5];
                case 4:
                    setActionLoading(null); // Clear loading state regardless of outcome
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var openCreateForm = function () {
        setEditingUser(null);
        setIsCreating(true);
    };
    var openEditForm = function (user) {
        setIsCreating(false);
        setEditingUser(user);
    };
    var handleCancelForm = function () {
        setEditingUser(null);
        setIsCreating(false);
    };
    var showForm = isCreating || editingUser !== null;
    var getRoleBadgeColor = function (role) {
        switch (role) {
            case 'ADMIN_TOTAL': return 'bg-red-100 text-red-800';
            case 'ADMIN_PARTIEL': return 'bg-yellow-100 text-yellow-800';
            case 'USER': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    var getProfessionalRoleBadgeColor = function (role) {
        switch (role) {
            case 'MAR': return 'bg-cyan-100 text-cyan-800';
            case 'IADE': return 'bg-teal-100 text-teal-800';
            case 'SECRETAIRE': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    return (<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="mb-8 flex justify-between items-center">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Gestion des utilisateurs</h1>
                    {!showForm && (<button onClick={openCreateForm} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300">
                            Ajouter un utilisateur
                        </button>)}
                </div>

                {showForm && (<motion.div className="mb-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                        <UserForm ref={formRef} onSubmit={isCreating ? handleCreateUser : handleUpdateUser} onCancel={handleCancelForm} isLoading={actionLoading === -1 || actionLoading === (editingUser === null || editingUser === void 0 ? void 0 : editingUser.id)} initialData={editingUser}/>
                    </motion.div>)}

                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100">
                    {loading && <p className="text-center text-gray-600 py-4">Chargement des utilisateurs...</p>}
                    {error && <p className="text-center text-red-600 font-medium py-4">{error}</p>}

                    {!loading && !error && (<>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Liste des utilisateurs ({users.length})</h2>
                            {users.length === 0 ? (<p className="text-center text-gray-500 py-4">Aucun utilisateur trouvé.</p>) : (<div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 table-fixed">
                                        <thead className="bg-gray-50/50">
                                            <tr>
                                                <th className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom Complet</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle Accès</th>
                                                <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle Pro</th>
                                                <th className="w-24 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Temps Partiel</th>
                                                <th className="w-16 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actif</th>
                                                <th className="w-32 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {users.map(function (user) {
                    var _a;
                    // Logique de désactivation basée sur les rôles
                    var isSelf = (currentUser === null || currentUser === void 0 ? void 0 : currentUser.id) === user.id;
                    var isTargetAdminTotal = user.role === 'ADMIN_TOTAL';
                    var isTargetAdminPartiel = user.role === 'ADMIN_PARTIEL';
                    var isTargetUser = user.role === 'USER';
                    var isRequesterAdminTotal = (currentUser === null || currentUser === void 0 ? void 0 : currentUser.role) === 'ADMIN_TOTAL';
                    var isRequesterAdminPartiel = (currentUser === null || currentUser === void 0 ? void 0 : currentUser.role) === 'ADMIN_PARTIEL';
                    // Qui peut éditer qui ?
                    var canEditTarget = (isRequesterAdminTotal && !isSelf) || // ADMIN_TOTAL peut éditer tout le monde sauf lui-même (pour éviter des clics bizarres, l'édition se fait via formulaire)
                        (isRequesterAdminPartiel && isTargetUser); // ADMIN_PARTIEL peut éditer USER
                    var editDisabled = showForm || actionLoading === user.id || !canEditTarget;
                    // Qui peut supprimer qui ?
                    var canDeleteTarget = (isRequesterAdminTotal && !isSelf) || // ADMIN_TOTAL peut supprimer tout le monde sauf lui-même
                        (isRequesterAdminPartiel && isTargetUser); // ADMIN_PARTIEL peut supprimer USER
                    var deleteDisabled = actionLoading === user.id || !canDeleteTarget;
                    // Qui peut réinitialiser qui ?
                    var canResetTargetPwd = (isRequesterAdminTotal && !isSelf) || // ADMIN_TOTAL peut reset tout le monde sauf lui-même
                        (isRequesterAdminPartiel && !isTargetAdminTotal && !isSelf); // ADMIN_PARTIEL peut reset tout le monde sauf ADMIN_TOTAL et lui-même
                    var resetPwdDisabled = actionLoading === user.id || !canResetTargetPwd;
                    return (<motion.tr key={user.id} className="hover:bg-gray-50/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {user.id}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {user.prenom} {user.nom}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate" title={user.login}>
                                                            {user.login}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate" title={user.email}>
                                                            {user.email}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <span className={"px-2.5 py-0.5 text-xs font-medium rounded-full ".concat(getRoleBadgeColor(user.role))}>
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <span className={"px-2.5 py-0.5 text-xs font-medium rounded-full ".concat(getProfessionalRoleBadgeColor(user.professionalRole))}>
                                                                {user.professionalRole}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                                            {user.tempsPartiel ? "".concat((_a = user.pourcentageTempsPartiel) !== null && _a !== void 0 ? _a : 100, "%") : 'Non'}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-center">
                                                            <span className={"px-2.5 py-0.5 text-xs font-medium rounded-full ".concat(user.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                                                                {user.actif ? 'Oui' : 'Non'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            {/* --- Bouton Editer --- */}
                                                            <button onClick={function () { return openEditForm(user); }} className="text-indigo-600 hover:text-indigo-900 mr-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:text-gray-400" disabled={editDisabled} // Utiliser la logique calculée
                     title={editDisabled ? "Action non autorisée" : "Éditer"}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"/><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd"/></svg>
                                                            </button>
                                                            {/* --- Bouton Supprimer --- */}
                                                            <button onClick={function () { return handleDeleteUser(user.id); }} disabled={deleteDisabled} // Utiliser la logique calculée
                     className="text-red-600 hover:text-red-800 mr-3 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:text-gray-400" title={deleteDisabled ? "Action non autorisée" : "Supprimer"}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                                                            </button>
                                                            {/* --- Bouton Réinitialiser MDP --- */}
                                                            <button onClick={function () { return handleResetPassword(user.id); }} disabled={resetPwdDisabled} // Utiliser la logique calculée
                     className="text-yellow-600 hover:text-yellow-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:text-gray-400" title={resetPwdDisabled ? "Action non autorisée" : "Réinitialiser le mot de passe (au login)"}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M15.75 15.75a.75.75 0 01-.75.75h-6a.75.75 0 010-1.5h4.19l-6.72-6.72a.75.75 0 111.06-1.06l6.72 6.72V10.5a.75.75 0 011.5 0v5.25zm0-11.5a.75.75 0 01-.75.75H4.5a.75.75 0 010-1.5h10.5a.75.75 0 01.75.75zM4.25 4.25a.75.75 0 01.75-.75h6a.75.75 0 010 1.5H5.81l6.72 6.72a.75.75 0 11-1.06 1.06L4.75 5.81v4.19a.75.75 0 01-1.5 0V4.25z" clipRule="evenodd"/></svg>
                                                            </button>
                                                        </td>
                                                    </motion.tr>);
                })}
                                        </tbody>
                                    </table>
                                </div>)}
                        </>)}
                    {/* Affichage des messages de succès/erreur */}
                    {successMessage && <p className="mt-4 text-center text-green-600 font-medium py-2 bg-green-50 rounded-md">{successMessage}</p>}
                </div>
            </motion.div>
        </div>);
}
// --- COMPOSANT EXPORTÉ PAR DÉFAUT (qui gère la protection) ---
export default function ProtectedUsersPage() {
    // Définir les rôles autorisés (chaînes de caractères)
    var allowedRoles = ['ADMIN_TOTAL', 'ADMIN_PARTIEL'];
    return (<ProtectedRoute allowedRoles={allowedRoles}>
            <UsersPageContent />
        </ProtectedRoute>);
}
