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
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useRule } from '../../modules/rules/hooks/useRule';
import { RulesList } from '../../modules/rules/components/RulesList';
import { RuleForm } from '../../modules/rules/components/RuleForm';
import AdminLayout from '../../components/layouts/AdminLayout';
export default function RulesAdminPage() {
    var _this = this;
    var router = useRouter();
    var _a = useState(false), showForm = _a[0], setShowForm = _a[1];
    var _b = useRule(), rule = _b.rule, rules = _b.rules, loading = _b.loading, error = _b.error, conflicts = _b.conflicts, setRule = _b.setRule, saveRule = _b.saveRule, deleteRule = _b.deleteRule, toggleStatus = _b.toggleStatus, fetchRules = _b.fetchRules, createNewRule = _b.createNewRule, checkConflicts = _b.checkConflicts;
    // Gérer la sélection d'une règle pour l'édition
    var handleRuleSelect = function (selectedRule) {
        setRule(selectedRule);
        setShowForm(true);
    };
    // Gérer l'ajout d'une nouvelle règle
    var handleAddRule = function (type) {
        createNewRule(type);
        setShowForm(true);
    };
    // Sauvegarder une règle
    var handleSaveRule = function (updatedRule) { return __awaiter(_this, void 0, void 0, function () {
        var hasHighSeverityConflicts, confirm_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    // Vérifier les conflits avant de sauvegarder
                    return [4 /*yield*/, checkConflicts()];
                case 1:
                    // Vérifier les conflits avant de sauvegarder
                    _a.sent();
                    // Si des conflits bloquants sont détectés, confirmer avec l'utilisateur
                    if (conflicts && conflicts.hasConflicts) {
                        hasHighSeverityConflicts = conflicts.conflicts.some(function (c) { return c.severity === 'HIGH'; });
                        if (hasHighSeverityConflicts) {
                            confirm_1 = window.confirm("Des conflits importants ont été détectés. Êtes-vous sûr de vouloir enregistrer cette règle quand même?");
                            if (!confirm_1)
                                return [2 /*return*/];
                        }
                    }
                    // Sauvegarder la règle
                    return [4 /*yield*/, saveRule()];
                case 2:
                    // Sauvegarder la règle
                    _a.sent();
                    setShowForm(false);
                    return [4 /*yield*/, fetchRules()];
                case 3:
                    _a.sent(); // Rafraîchir la liste
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error('Erreur lors de la sauvegarde de la règle:', error_1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // Annuler le formulaire
    var handleCancelForm = function () {
        setRule(null);
        setShowForm(false);
    };
    // Gérer la suppression d'une règle
    var handleDeleteRule = function (ruleId) { return __awaiter(_this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, deleteRule(ruleId)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, fetchRules()];
                case 2:
                    _a.sent(); // Rafraîchir la liste
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error('Erreur lors de la suppression de la règle:', error_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Gérer l'activation/désactivation d'une règle
    var handleToggleRuleStatus = function (ruleId, isActive) { return __awaiter(_this, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, toggleStatus(ruleId, isActive)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, fetchRules()];
                case 2:
                    _a.sent(); // Rafraîchir la liste
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _a.sent();
                    console.error('Erreur lors du changement de statut de la règle:', error_3);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (<AdminLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Administration des règles de planning
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Gérez les règles qui définissent le fonctionnement du planning (gardes, consultations, supervisions, etc.)
                    </p>
                </div>

                {error && (<div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">
                                    {error.message}
                                </p>
                            </div>
                        </div>
                    </div>)}

                <div className="grid grid-cols-1 gap-6">
                    {showForm ? (<RuleForm rule={rule || {}} onSave={handleSaveRule} onCancel={handleCancelForm} loading={loading} conflicts={conflicts}/>) : (<RulesList rules={rules} loading={loading} onRuleSelect={handleRuleSelect} onRuleDelete={handleDeleteRule} onRuleToggleStatus={handleToggleRuleStatus} onAddNewRule={handleAddRule} className="mb-6"/>)}
                </div>
            </div>
        </AdminLayout>);
}
export var getServerSideProps = function (context) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        // Vérifier l'authentification et les permissions ici
        // Rediriger vers la page de connexion si non authentifié ou non autorisé
        // ...
        return [2 /*return*/, {
                props: {}
            }];
    });
}); };
