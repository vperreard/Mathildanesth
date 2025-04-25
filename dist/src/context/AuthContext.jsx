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
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
// Configuration de l'intercepteur Axios pour ajouter le token d'authentification
// à toutes les requêtes sortantes
axios.interceptors.request.use(function (config) {
    // Ne pas ajouter d'en-têtes pour les requêtes vers d'autres domaines (CORS)
    if (config.url && (config.url.startsWith('/api/') || config.url.startsWith('api/'))) {
        // Le token est déjà envoyé via les cookies sécurisés par le navigateur
        // Ajoutons des entêtes supplémentaires pour le debug
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        // Ajoutons un timestamp pour éviter les problèmes de cache
        var timestamp = new Date().getTime();
        config.url += config.url.includes('?') ? "&_t=".concat(timestamp) : "?_t=".concat(timestamp);
    }
    return config;
}, function (error) {
    return Promise.reject(error);
});
// Intercepteur pour gérer les erreurs d'authentification globalement
axios.interceptors.response.use(function (response) { return response; }, function (error) {
    // Si nous recevons une erreur 401, l'utilisateur n'est pas authentifié
    if (error.response && error.response.status === 401) {
        console.log("Intercepteur Axios: Erreur 401 détectée");
        // Rediriger vers la page de connexion seulement si nous ne sommes pas déjà sur la page de connexion
        var currentPath = window.location.pathname;
        if (currentPath !== '/auth/login' && currentPath !== '/login') {
            window.location.href = '/auth/login';
        }
    }
    return Promise.reject(error);
});
var AuthContext = createContext(undefined);
export var AuthProvider = function (_a) {
    var children = _a.children;
    var _b = useState(null), user = _b[0], setUser = _b[1];
    var _c = useState(true), isLoading = _c[0], setIsLoading = _c[1];
    var router = useRouter();
    var fetchCurrentUser = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    console.log("AuthContext: Tentative de récupération de l'utilisateur courant");
                    return [4 /*yield*/, axios.get('/api/auth/me')];
                case 2:
                    response = _a.sent();
                    console.log("AuthContext: Réponse de l'API:", response.data);
                    // Vérifier si la réponse contient la structure attendue
                    if (response.data.authenticated && response.data.user) {
                        // Extraire l'utilisateur de la réponse qui a la structure {authenticated: true, user: {...}}
                        console.log("AuthContext: Utilisateur récupéré avec succès", response.data.user);
                        setUser(response.data.user);
                    }
                    else if (response.data.id) {
                        // Si l'API renvoie directement l'utilisateur sans structure englobante
                        console.log("AuthContext: Utilisateur récupéré avec succès (format direct)", response.data);
                        setUser(response.data);
                    }
                    else {
                        console.log("AuthContext: Format de réponse inattendu", response.data);
                        setUser(null);
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error("AuthContext: Erreur lors de la récupération de l'utilisateur", error_1);
                    setUser(null);
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    useEffect(function () {
        fetchCurrentUser();
    }, [fetchCurrentUser]);
    var login = function (loginData) { return __awaiter(void 0, void 0, void 0, function () {
        var response, loggedInUser, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios.post('/api/auth/login', loginData)];
                case 1:
                    response = _a.sent();
                    loggedInUser = response.data.user;
                    // Vérifier le flag mustChangePassword
                    if (loggedInUser.mustChangePassword) {
                        console.log("AuthContext: Changement de mot de passe requis, redirection vers /profil");
                        setUser(loggedInUser); // Stocker l'utilisateur pour afficher ses infos sur /profil
                        router.push('/profil'); // Rediriger vers la page de profil
                    }
                    else {
                        console.log("AuthContext: Connexion réussie, redirection vers /");
                        setUser(loggedInUser); // Stocker l'utilisateur connecté normalement
                        router.push('/'); // Rediriger vers la page d'accueil après connexion réussie
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error("Erreur de connexion dans le context:", error_2);
                    // Propager l'erreur pour l'afficher dans le formulaire de login
                    if (axios.isAxiosError(error_2) && error_2.response) {
                        throw new Error(error_2.response.data.message || 'Échec de la connexion.');
                    }
                    else {
                        throw new Error('Une erreur inattendue est survenue.');
                    }
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var logout = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios.post('/api/auth/logout')];
                case 1:
                    _a.sent();
                    setUser(null);
                    router.push('/auth/login'); // Rediriger vers la page de login après déconnexion
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error("Erreur lors de la déconnexion:", error_3);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var value = {
        user: user,
        isLoading: isLoading,
        login: login,
        logout: logout,
        refetchUser: fetchCurrentUser // Exposer la fonction pour rafraîchir
    };
    return (<AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>);
};
// Hook personnalisé pour utiliser le contexte
export var useAuth = function () {
    var context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
    }
    return context;
};
