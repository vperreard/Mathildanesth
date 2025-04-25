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
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Save, RotateCcw } from 'lucide-react';
var HeaderConfigPanel = function () {
    var _a = useState({
        showOverlappingRequests: true,
        showUserDetails: true,
        highlightOverlappingCount: 3,
        groupRequestsByDate: false,
        showWarningWhenOverlapping: true
    }), config = _a[0], setConfig = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState(false), saving = _c[0], setSaving = _c[1];
    var _d = useState(null), error = _d[0], setError = _d[1];
    var _e = useState(false), success = _e[0], setSuccess = _e[1];
    // Charger la configuration au chargement du composant
    useEffect(function () {
        var fetchConfig = function () { return __awaiter(void 0, void 0, void 0, function () {
            var response, data, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, 4, 5]);
                        setLoading(true);
                        return [4 /*yield*/, fetch('/api/admin/configuration')];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error('Erreur lors de la récupération de la configuration');
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        if (data.header) {
                            setConfig(data.header);
                        }
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _a.sent();
                        setError(err_1.message || 'Une erreur est survenue');
                        return [3 /*break*/, 5];
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        fetchConfig();
    }, []);
    // Sauvegarder les modifications
    var handleSave = function () { return __awaiter(void 0, void 0, void 0, function () {
        var fullConfigResponse, fullConfig, updatedConfig, response, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, 5, 6]);
                    setSaving(true);
                    setError(null);
                    return [4 /*yield*/, fetch('/api/admin/configuration')];
                case 1:
                    fullConfigResponse = _a.sent();
                    if (!fullConfigResponse.ok) {
                        throw new Error('Erreur lors de la récupération de la configuration complète');
                    }
                    return [4 /*yield*/, fullConfigResponse.json()];
                case 2:
                    fullConfig = _a.sent();
                    updatedConfig = __assign(__assign({}, fullConfig), { header: config });
                    return [4 /*yield*/, fetch('/api/admin/configuration', {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(updatedConfig),
                        })];
                case 3:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Erreur lors de la sauvegarde de la configuration');
                    }
                    setSuccess(true);
                    setTimeout(function () { return setSuccess(false); }, 3000);
                    return [3 /*break*/, 6];
                case 4:
                    err_2 = _a.sent();
                    setError(err_2.message || 'Une erreur est survenue');
                    return [3 /*break*/, 6];
                case 5:
                    setSaving(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    // Réinitialiser les modifications
    var handleReset = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 5]);
                    setLoading(true);
                    return [4 /*yield*/, fetch('/api/admin/configuration')];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Erreur lors de la récupération de la configuration');
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    if (data.header) {
                        setConfig(data.header);
                    }
                    return [3 /*break*/, 5];
                case 3:
                    err_3 = _a.sent();
                    setError(err_3.message || 'Une erreur est survenue');
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // Mettre à jour un champ spécifique de la configuration
    var handleChange = function (field, value) {
        setConfig(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = value, _a)));
        });
    };
    if (loading) {
        return <div className="flex justify-center items-center h-64">Chargement des configurations...</div>;
    }
    return (<div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Configuration de l'en-tête des requêtes</h2>

            {error && (<div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                    <div className="flex">
                        <AlertTriangle className="h-5 w-5 text-red-400"/>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>)}

            {success && (<div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-green-700">Configuration sauvegardée avec succès</p>
                        </div>
                    </div>
                </div>)}

            <div className="grid gap-6">
                <div className="flex items-center justify-between border-b pb-4">
                    <div>
                        <h3 className="font-medium">Afficher les requêtes qui se chevauchent</h3>
                        <p className="text-sm text-gray-500">Affiche un récapitulatif des autres absences aux mêmes dates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={config.showOverlappingRequests} onChange={function (e) { return handleChange('showOverlappingRequests', e.target.checked); }} className="sr-only peer"/>
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between border-b pb-4">
                    <div>
                        <h3 className="font-medium">Afficher les détails utilisateur</h3>
                        <p className="text-sm text-gray-500">Montre le nom complet et le type de requête</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={config.showUserDetails} onChange={function (e) { return handleChange('showUserDetails', e.target.checked); }} className="sr-only peer"/>
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between border-b pb-4">
                    <div>
                        <h3 className="font-medium">Seuil d'alerte de chevauchement</h3>
                        <p className="text-sm text-gray-500">Nombre d'absences simultanées avant affichage d'une alerte</p>
                    </div>
                    <div className="flex items-center">
                        <input type="number" min="1" max="10" value={config.highlightOverlappingCount} onChange={function (e) { return handleChange('highlightOverlappingCount', parseInt(e.target.value)); }} className="w-16 p-2 border border-gray-300 rounded-md text-center"/>
                    </div>
                </div>

                <div className="flex items-center justify-between border-b pb-4">
                    <div>
                        <h3 className="font-medium">Grouper les requêtes par date</h3>
                        <p className="text-sm text-gray-500">Regroupe les absences ayant exactement les mêmes dates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={config.groupRequestsByDate} onChange={function (e) { return handleChange('groupRequestsByDate', e.target.checked); }} className="sr-only peer"/>
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between pb-4">
                    <div>
                        <h3 className="font-medium">Afficher un avertissement de chevauchement</h3>
                        <p className="text-sm text-gray-500">Montre une alerte visuelle quand trop de personnes sont absentes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={config.showWarningWhenOverlapping} onChange={function (e) { return handleChange('showWarningWhenOverlapping', e.target.checked); }} className="sr-only peer"/>
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
                <button onClick={handleReset} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 flex items-center hover:bg-gray-50" disabled={loading || saving}>
                    <RotateCcw size={16} className="mr-2"/>
                    Réinitialiser
                </button>
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700" disabled={saving}>
                    {saving ? (<span className="inline-block h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin"></span>) : (<Save size={16} className="mr-2"/>)}
                    Enregistrer
                </button>
            </div>
        </div>);
};
export default HeaderConfigPanel;
