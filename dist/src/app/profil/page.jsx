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
import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
function ProfilePageContent() {
    var _this = this;
    var user = useAuth().user;
    var _a = useState(''), currentPassword = _a[0], setCurrentPassword = _a[1];
    var _b = useState(''), newPassword = _b[0], setNewPassword = _b[1];
    var _c = useState(''), confirmPassword = _c[0], setConfirmPassword = _c[1];
    var _d = useState(null), error = _d[0], setError = _d[1];
    var _e = useState(null), successMessage = _e[0], setSuccessMessage = _e[1];
    var _f = useState(false), isLoading = _f[0], setIsLoading = _f[1];
    // États pour gérer la visibilité des mots de passe
    var _g = useState('password'), currentPasswordType = _g[0], setCurrentPasswordType = _g[1];
    var _h = useState('password'), newPasswordType = _h[0], setNewPasswordType = _h[1];
    var _j = useState('password'), confirmPasswordType = _j[0], setConfirmPasswordType = _j[1];
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    setError(null);
                    setSuccessMessage(null);
                    if (!currentPassword || !newPassword || !confirmPassword) {
                        setError('Tous les champs sont requis.');
                        return [2 /*return*/];
                    }
                    if (newPassword !== confirmPassword) {
                        setError('Le nouveau mot de passe et sa confirmation ne correspondent pas.');
                        return [2 /*return*/];
                    }
                    if (newPassword.length < 6) {
                        setError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
                        return [2 /*return*/];
                    }
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, axios.put('/api/auth/change-password', {
                            currentPassword: currentPassword,
                            newPassword: newPassword
                        })];
                case 2:
                    _a.sent();
                    setSuccessMessage('Mot de passe mis à jour avec succès !');
                    // Vider les champs après succès
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setTimeout(function () { return setSuccessMessage(null); }, 5000);
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    console.error("Erreur changement mot de passe:", err_1);
                    if (axios.isAxiosError(err_1) && err_1.response) {
                        setError(err_1.response.data.message || 'Erreur lors de la mise à jour du mot de passe.');
                    }
                    else {
                        setError('Une erreur inattendue est survenue.');
                    }
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    if (!user)
        return null; // Devrait être géré par ProtectedRoute
    return (<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                <h1 className="text-3xl font-bold mb-6">Mon Profil</h1>

                {/* Affichage des informations utilisateur (lecture seule) */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100 mb-8 space-y-3">
                    <h2 className="text-xl font-semibold mb-3">Informations</h2>
                    <p><span className="font-medium text-gray-600">Nom:</span> {user.prenom} {user.nom}</p>
                    <p><span className="font-medium text-gray-600">Login:</span> {user.login}</p>
                    <p><span className="font-medium text-gray-600">Email:</span> {user.email}</p>
                    <p><span className="font-medium text-gray-600">Rôle d'accès:</span> {user.role}</p>
                    <p><span className="font-medium text-gray-600">Rôle Professionnel:</span> {user.professionalRole}</p>
                </div>

                {/* Message si changement de mot de passe requis */}
                {user.mustChangePassword && (<div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
                        <p className="font-semibold">Action requise :</p>
                        <p>Pour des raisons de sécurité, veuillez définir un nouveau mot de passe personnel.</p>
                    </div>)}

                {/* Formulaire de changement de mot de passe */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4">Changer le mot de passe</h2>
                    {error && <p className="mb-4 text-center text-red-600 bg-red-50 p-3 rounded-md text-sm">{error}</p>}
                    {successMessage && <p className="mb-4 text-center text-green-600 bg-green-50 p-3 rounded-md text-sm">{successMessage}</p>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Mot de passe actuel</label>
                            <input type={currentPasswordType} id="currentPassword" value={currentPassword} onChange={function (e) { return setCurrentPassword(e.target.value); }} onFocus={function () { return setCurrentPasswordType('text'); }} onBlur={function () { return setCurrentPasswordType('password'); }} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                        </div>
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Nouveau mot de passe</label>
                            <input type={newPasswordType} id="newPassword" value={newPassword} onChange={function (e) { return setNewPassword(e.target.value); }} onFocus={function () { return setNewPasswordType('text'); }} onBlur={function () { return setNewPasswordType('password'); }} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirmer le nouveau mot de passe</label>
                            <input type={confirmPasswordType} id="confirmPassword" value={confirmPassword} onChange={function (e) { return setConfirmPassword(e.target.value); }} onFocus={function () { return setConfirmPasswordType('text'); }} onBlur={function () { return setConfirmPasswordType('password'); }} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>);
}
export default function ProtectedProfilePage() {
    // Protéger la page, tous les rôles connectés peuvent y accéder
    return (<ProtectedRoute>
            <ProfilePageContent />
        </ProtectedRoute>);
}
