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
import React, { useEffect, useState } from 'react';
var AdminNotificationBar = function () {
    var _a = useState([]), pendingRequests = _a[0], setPendingRequests = _a[1];
    var _b = useState(0), currentIndex = _b[0], setCurrentIndex = _b[1];
    var fetchPendingRequests = function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, data, pending, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch('/api/admin/requests')];
                case 1:
                    res = _a.sent();
                    if (!res.ok)
                        throw new Error('Erreur lors de la récupération des demandes');
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _a.sent();
                    pending = data.filter(function (req) { return req.status === 'pending'; });
                    setPendingRequests(pending);
                    setCurrentIndex(0);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error(error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    useEffect(function () {
        fetchPendingRequests();
        var interval = setInterval(fetchPendingRequests, 60000); // Rafraîchit toutes les 60s
        return function () { return clearInterval(interval); };
    }, []);
    var handleValidate = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var res, error_2;
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
                        throw new Error('Erreur lors de la validation');
                    return [4 /*yield*/, fetchPendingRequests()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error(error_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    if (pendingRequests.length === 0) {
        return null;
    }
    var currentRequest = pendingRequests[currentIndex];
    return (<div className="bg-yellow-100 p-4 flex items-center justify-between">
            <div>
                <p className="font-semibold">Nouvelle demande :</p>
                <p>{currentRequest.applicant} - {currentRequest.leaveType} du {currentRequest.startDate} au {currentRequest.endDate}</p>
            </div>
            <div className="flex items-center">
                <button onClick={function () { return handleValidate(currentRequest.id); }} className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700">
                    Valider rapidement
                </button>
                {pendingRequests.length > 1 && (<button onClick={function () { return setCurrentIndex((currentIndex + 1) % pendingRequests.length); }} className="ml-4 bg-gray-300 text-gray-800 py-1 px-3 rounded hover:bg-gray-400">
                        Suivant
                    </button>)}
            </div>
        </div>);
};
export default AdminNotificationBar;
