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
import React from 'react';
export default function DiagnosticPage() {
    return (<div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Page de diagnostic</h1>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Test du middleware</h2>
                <p className="mb-2">
                    Cette section teste si le middleware fonctionne correctement. Elle effectue une requête vers l'API de test et vérifie
                    si les en-têtes du middleware sont présents.
                </p>
                <TestMiddleware />
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Info navigateur et environnement</h2>
                <BrowserInfo />
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Test d'accès API</h2>
                <p className="mb-2">
                    Cette section test l'accès aux endpoints API authentifiés.
                </p>
                <ApiAccessTest />
            </div>
        </div>);
}
// Composant pour tester le middleware
function TestMiddleware() {
    var _this = this;
    var _a = React.useState(null), result = _a[0], setResult = _a[1];
    var _b = React.useState(false), loading = _b[0], setLoading = _b[1];
    var _c = React.useState(null), error = _c[0], setError = _c[1];
    var testMiddleware = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, data, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch('/api/test-middleware')];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    setResult(data);
                    return [3 /*break*/, 6];
                case 4:
                    err_1 = _a.sent();
                    setError('Erreur lors du test: ' + (err_1 instanceof Error ? err_1.message : String(err_1)));
                    return [3 /*break*/, 6];
                case 5:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="border p-4 rounded-lg bg-gray-50">
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={testMiddleware} disabled={loading}>
                {loading ? 'Test en cours...' : 'Tester le middleware'}
            </button>

            {error && (<div className="mt-3 p-3 bg-red-100 text-red-700 rounded">
                    {error}
                </div>)}

            {result && (<div className="mt-3">
                    <h3 className="font-semibold">Résultat:</h3>
                    <div className="p-3 bg-white border rounded mt-2 overflow-auto max-h-60">
                        <p>Middleware exécuté: <strong>{result.middlewareExecuted ? 'Oui ✅' : 'Non ❌'}</strong></p>
                        <p className="mt-2 font-semibold">Headers:</p>
                        <pre className="text-xs mt-1">
                            {JSON.stringify(result.allHeaders, null, 2)}
                        </pre>
                    </div>
                </div>)}
        </div>);
}
// Composant pour afficher les infos du navigateur
function BrowserInfo() {
    var _a = React.useState({
        userAgent: '',
        cookiesEnabled: false,
        language: '',
        screenSize: '',
        timeZone: '',
        timeZoneOffset: '',
    }), browserInfo = _a[0], setBrowserInfo = _a[1];
    React.useEffect(function () {
        setBrowserInfo({
            userAgent: navigator.userAgent,
            cookiesEnabled: navigator.cookieEnabled,
            language: navigator.language,
            screenSize: "".concat(window.innerWidth, "x").concat(window.innerHeight),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timeZoneOffset: new Date().getTimezoneOffset(),
        });
    }, []);
    return (<div className="border p-4 rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div><strong>User Agent:</strong> <span className="text-sm">{browserInfo.userAgent}</span></div>
                <div><strong>Cookies:</strong> {browserInfo.cookiesEnabled ? 'Activés ✅' : 'Désactivés ❌'}</div>
                <div><strong>Langue:</strong> {browserInfo.language}</div>
                <div><strong>Taille d'écran:</strong> {browserInfo.screenSize}</div>
                <div><strong>Fuseau horaire:</strong> {browserInfo.timeZone}</div>
                <div><strong>Décalage UTC:</strong> {-browserInfo.timeZoneOffset / 60} heures</div>
            </div>
        </div>);
}
// Composant pour tester l'accès API
function ApiAccessTest() {
    var _this = this;
    var _a = React.useState({}), results = _a[0], setResults = _a[1];
    var _b = React.useState(false), loading = _b[0], setLoading = _b[1];
    var endpoints = [
        { name: 'Utilisateurs', url: '/api/utilisateurs' },
        { name: 'Auth Me', url: '/api/auth/me' },
    ];
    var testApiAccess = function () { return __awaiter(_this, void 0, void 0, function () {
        var newResults, _i, endpoints_1, endpoint, startTime, response, endTime, responseTime, data, e_1, _a, _b, err_2;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    setLoading(true);
                    newResults = {};
                    _i = 0, endpoints_1 = endpoints;
                    _d.label = 1;
                case 1:
                    if (!(_i < endpoints_1.length)) return [3 /*break*/, 11];
                    endpoint = endpoints_1[_i];
                    _d.label = 2;
                case 2:
                    _d.trys.push([2, 9, , 10]);
                    startTime = performance.now();
                    return [4 /*yield*/, fetch(endpoint.url)];
                case 3:
                    response = _d.sent();
                    endTime = performance.now();
                    responseTime = Math.round(endTime - startTime);
                    _d.label = 4;
                case 4:
                    _d.trys.push([4, 6, , 8]);
                    return [4 /*yield*/, response.json()];
                case 5:
                    data = _d.sent();
                    newResults[endpoint.name] = {
                        status: response.status,
                        ok: response.ok,
                        responseTime: responseTime,
                        data: data,
                    };
                    return [3 /*break*/, 8];
                case 6:
                    e_1 = _d.sent();
                    _a = newResults;
                    _b = endpoint.name;
                    _c = {
                        status: response.status,
                        ok: response.ok,
                        responseTime: responseTime,
                        error: 'Impossible de parser la réponse JSON'
                    };
                    return [4 /*yield*/, response.text()];
                case 7:
                    _a[_b] = (_c.text = _d.sent(),
                        _c);
                    return [3 /*break*/, 8];
                case 8: return [3 /*break*/, 10];
                case 9:
                    err_2 = _d.sent();
                    newResults[endpoint.name] = {
                        error: err_2 instanceof Error ? err_2.message : String(err_2),
                    };
                    return [3 /*break*/, 10];
                case 10:
                    _i++;
                    return [3 /*break*/, 1];
                case 11:
                    setResults(newResults);
                    setLoading(false);
                    return [2 /*return*/];
            }
        });
    }); };
    return (<div className="border p-4 rounded-lg bg-gray-50">
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={testApiAccess} disabled={loading}>
                {loading ? 'Test en cours...' : 'Tester les endpoints API'}
            </button>

            {Object.keys(results).length > 0 && (<div className="mt-4">
                    {endpoints.map(function (endpoint) {
                var _a, _b, _c, _d, _e, _f, _g, _h;
                return (<div key={endpoint.name} className="mt-3 border-t pt-3">
                            <h3 className="font-semibold">{endpoint.name} ({endpoint.url}):</h3>
                            <div className="p-3 bg-white border rounded mt-2 overflow-auto max-h-60">
                                {((_a = results[endpoint.name]) === null || _a === void 0 ? void 0 : _a.error) ? (<div className="text-red-600">
                                        Error: {(_b = results[endpoint.name]) === null || _b === void 0 ? void 0 : _b.error}
                                        {((_c = results[endpoint.name]) === null || _c === void 0 ? void 0 : _c.text) && (<pre className="text-xs mt-2 overflow-auto">{(_d = results[endpoint.name]) === null || _d === void 0 ? void 0 : _d.text}</pre>)}
                                    </div>) : (<div>
                                        <p>
                                            Status: <span className={((_e = results[endpoint.name]) === null || _e === void 0 ? void 0 : _e.ok) ? 'text-green-600' : 'text-red-600'}>
                                                {(_f = results[endpoint.name]) === null || _f === void 0 ? void 0 : _f.status}
                                            </span>
                                        </p>
                                        <p>Temps de réponse: {(_g = results[endpoint.name]) === null || _g === void 0 ? void 0 : _g.responseTime}ms</p>
                                        <p className="mt-2 font-semibold">Données:</p>
                                        <pre className="text-xs mt-1 overflow-auto">
                                            {JSON.stringify((_h = results[endpoint.name]) === null || _h === void 0 ? void 0 : _h.data, null, 2)}
                                        </pre>
                                    </div>)}
                            </div>
                        </div>);
            })}
                </div>)}
        </div>);
}
