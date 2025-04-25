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
import React, { useState, useEffect, useCallback } from 'react';
import LeaveTypeFormModal from '@/components/admin/LeaveTypeFormModal'; // Importer le modal
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
// Importer les composants UI
import { Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
export default function ManageLeaveTypesPage() {
    var _this = this;
    var _a = useState([]), leaveTypes = _a[0], setLeaveTypes = _a[1];
    var _b = useState(true), isLoading = _b[0], setIsLoading = _b[1];
    var _c = useState(null), error = _c[0], setError = _c[1];
    // --- State pour le formulaire/modal d'ajout/modification ---
    var _d = useState(false), showFormModal = _d[0], setShowFormModal = _d[1];
    // Utiliser Partial ici aussi
    var _e = useState(null), editingLeaveType = _e[0], setEditingLeaveType = _e[1];
    var fetchLeaveTypes = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var response, _a, _b, _c, data, err_1;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    setIsLoading(true);
                    setError(null);
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, fetch('/api/admin/leave-types')];
                case 2:
                    response = _d.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    _a = Error.bind;
                    _c = (_b = "Erreur HTTP ".concat(response.status, ": ")).concat;
                    return [4 /*yield*/, response.text()];
                case 3: throw new (_a.apply(Error, [void 0, _c.apply(_b, [_d.sent()])]))();
                case 4: return [4 /*yield*/, response.json()];
                case 5:
                    data = _d.sent();
                    setLeaveTypes(data);
                    return [3 /*break*/, 8];
                case 6:
                    err_1 = _d.sent();
                    console.error("Erreur lors de la récupération des types de congés:", err_1);
                    setError(err_1.message || "Impossible de charger les types de congés.");
                    return [3 /*break*/, 8];
                case 7:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); }, []);
    useEffect(function () {
        // Récupérer les données au montage du composant
        fetchLeaveTypes();
    }, [fetchLeaveTypes]);
    // --- Fonctions pour gérer l'ouverture/fermeture du formulaire ---
    var handleAddNew = function () {
        setEditingLeaveType(null); // Pas d'édition, c'est un ajout
        setShowFormModal(true);
    };
    var handleEdit = function (leaveType) {
        setEditingLeaveType(leaveType);
        setShowFormModal(true);
    };
    var handleCloseForm = function () {
        setShowFormModal(false);
        setEditingLeaveType(null);
    };
    var handleFormSuccess = function () {
        handleCloseForm();
        fetchLeaveTypes(); // Recharger les données après succès
    };
    // --- Fonction pour gérer la suppression ---
    var handleDelete = function (id, label) { return __awaiter(_this, void 0, void 0, function () {
        var response, errorData, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!window.confirm("\u00CAtes-vous s\u00FBr de vouloir supprimer le type de cong\u00E9 \"".concat(label, "\" ? Cette action est irr\u00E9versible."))) {
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, fetch("/api/admin/leave-types/".concat(id), {
                            method: 'DELETE',
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    errorData = _a.sent();
                    throw new Error(errorData.error || "Erreur HTTP ".concat(response.status));
                case 4:
                    // Succès (status 204 No Content)
                    alert("Le type \"".concat(label, "\" a \u00E9t\u00E9 supprim\u00E9."));
                    fetchLeaveTypes(); // Recharger la liste
                    return [3 /*break*/, 6];
                case 5:
                    err_2 = _a.sent();
                    console.error("Erreur lors de la suppression:", err_2);
                    alert("Erreur lors de la suppression: ".concat(err_2.message));
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    // --- Rendu ---
    return (<div className="container mx-auto p-4 md:p-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Gestion des Types de Congés</CardTitle>
                        <Button onClick={handleAddNew} size="sm">
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Ajouter un type
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading && <p className="text-center py-4 text-gray-500">Chargement des types de congés...</p>}
                    {error && <p className="text-center py-4 text-red-600 bg-red-50 rounded-md">{error}</p>}

                    {!isLoading && !error && (<Table hover striped bordered>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Libellé</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-center">Actif</TableHead>
                                    <TableHead className="text-center">Sélectionnable</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaveTypes.length === 0 ? (<TableRow>
                                        <TableCell colSpan={6} className="text-center">Aucun type de congé trouvé.</TableCell>
                                    </TableRow>) : (leaveTypes.map(function (type) { return (<TableRow key={type.id}>
                                            <TableCell className="font-medium">{type.code}</TableCell>
                                            <TableCell>{type.label}</TableCell>
                                            <TableCell className="max-w-xs truncate">{type.description}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={type.isActive ? "success" : "danger"}>
                                                    {type.isActive ? 'Oui' : 'Non'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={type.isUserSelectable ? "success" : "gray"}>
                                                    {type.isUserSelectable ? 'Oui' : 'Non'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button onClick={function () { return handleEdit(type); }} variant="secondary" size="sm">
                                                        <Edit className="h-4 w-4 mr-1"/>
                                                        Modifier
                                                    </Button>
                                                    <Button onClick={function () { return handleDelete(type.id, type.label); }} variant="danger" size="sm">
                                                        <Trash2 className="h-4 w-4 mr-1"/>
                                                        Supprimer
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>); }))}
                            </TableBody>
                        </Table>)}
                </CardContent>
            </Card>

            {/* --- Modal/Formulaire pour Ajout/Modification --- */}
            {showFormModal && (<LeaveTypeFormModal isOpen={showFormModal} onClose={handleCloseForm} onSuccess={handleFormSuccess} initialData={editingLeaveType}/>)}
        </div>);
}
