"use client";
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
var RequestsPage = function () {
    var _a = useState([]), requests = _a[0], setRequests = _a[1];
    var _b = useState(null), error = _b[0], setError = _b[1];
    var _c = useState(false), isLoading = _c[0], setIsLoading = _c[1];
    var fetchRequests = function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, data, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch('/api/admin/requests')];
                case 2:
                    res = _a.sent();
                    if (!res.ok)
                        throw new Error('Erreur lors de la récupération des requêtes');
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    setRequests(data);
                    return [3 /*break*/, 6];
                case 4:
                    err_1 = _a.sent();
                    setError(err_1.message || 'Erreur inconnue');
                    return [3 /*break*/, 6];
                case 5:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    useEffect(function () {
        fetchRequests();
    }, []);
    var handleValidate = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var res, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("/api/admin/requests/".concat(id), {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'validated' })
                        })];
                case 1:
                    res = _a.sent();
                    if (!res.ok)
                        throw new Error("Erreur lors de la validation de la requête");
                    return [4 /*yield*/, fetchRequests()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error(error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Panneau des Requêtes de Congés</h1>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {isLoading ? (<p>Chargement...</p>) : (<table className="min-w-full border-collapse border border-gray-200">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 border">Demandeur</th>
                            <th className="px-4 py-2 border">Type de congé</th>
                            <th className="px-4 py-2 border">Dates</th>
                            <th className="px-4 py-2 border">Statut</th>
                            <th className="px-4 py-2 border">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (<tr>
                                <td colSpan={5} className="px-4 py-2 border text-center">Aucune requête</td>
                            </tr>) : (requests.map(function (req) { return (<tr key={req.id}>
                                    <td className="px-4 py-2 border">{req.applicant}</td>
                                    <td className="px-4 py-2 border">{req.leaveType}</td>
                                    <td className="px-4 py-2 border">{req.startDate} au {req.endDate}</td>
                                    <td className="px-4 py-2 border">{req.status}</td>
                                    <td className="px-4 py-2 border">
                                        {req.status === 'pending' && (<button onClick={function () { return handleValidate(req.id); }} className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700">
                                                Valider
                                            </button>)}
                                    </td>
                                </tr>); }))}
                    </tbody>
                </table>)}
        </div>);
};
export default RequestsPage;
