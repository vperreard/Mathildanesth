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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React, { useState, useEffect } from "react";
import { Button, Card, CardContent } from "@/components/ui";
import { Save, Filter, Eye } from "lucide-react";
import { PlusIcon, TrashIcon, StarIcon, StarIcon as StarSolidIcon, } from '@heroicons/react/24/outline';
var defaultDisplaySettings = {
    nameFormat: 'fullName',
    fontStyle: 'normal',
    fontSize: 14,
    compactView: false,
    showSpecialty: true,
    showRole: true,
    roleStyles: {
        surgeon: {
            nameFormat: 'fullName',
            fontStyle: 'bold',
            fontSize: 14,
            badgeColor: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
        },
        MAR: {
            nameFormat: 'firstNameOnly',
            fontStyle: 'normal',
            fontSize: 13,
            badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        },
        IADE: {
            nameFormat: 'lastNameOnly',
            fontStyle: 'italic',
            fontSize: 12,
            badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        }
    },
    visibleRoles: {
        surgeon: true,
        MAR: true,
        IADE: true
    }
};
// Liste des couleurs disponibles pour les badges
var badgeColorOptions = [
    { value: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200', label: 'Violet', color: '#8b5cf6' },
    { value: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Bleu', color: '#3b82f6' },
    { value: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Vert', color: '#10b981' },
    { value: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Jaune', color: '#f59e0b' },
    { value: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Rouge', color: '#ef4444' },
    { value: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200', label: 'Rose', color: '#ec4899' },
    { value: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200', label: 'Indigo', color: '#6366f1' },
    { value: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200', label: 'Turquoise', color: '#14b8a6' },
    { value: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', label: 'Orange', color: '#f97316' },
    { value: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', label: 'Gris', color: '#6b7280' },
];
// Fonction pour obtenir le label d'une couleur depuis sa valeur CSS
var getBadgeColorLabel = function (colorValue) {
    var option = badgeColorOptions.find(function (opt) { return opt.value === colorValue; });
    return option ? option.label : 'Couleur personnalisée';
};
var WeeklyPlanningConfigPanel = function () {
    // États
    var _a = useState([]), rooms = _a[0], setRooms = _a[1];
    var _b = useState([]), personnel = _b[0], setPersonnel = _b[1];
    var _c = useState([]), presets = _c[0], setPresets = _c[1];
    var _d = useState(null), selectedPreset = _d[0], setSelectedPreset = _d[1];
    var _e = useState(""), newPresetName = _e[0], setNewPresetName = _e[1];
    var _f = useState(false), isCreatingPreset = _f[0], setIsCreatingPreset = _f[1];
    var _g = useState(false), isSaving = _g[0], setIsSaving = _g[1];
    var _h = useState('presets'), activeTab = _h[0], setActiveTab = _h[1];
    // État pour les paramètres d'affichage
    var _j = useState({
        nameFormat: "fullName",
        fontStyle: "normal",
        fontSize: 14,
        compactView: false,
        showSpecialty: true,
        showRole: true,
        roleStyles: {
            surgeon: {
                nameFormat: 'fullName',
                fontStyle: 'bold',
                fontSize: 14,
                badgeColor: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
            },
            MAR: {
                nameFormat: 'firstNameOnly',
                fontStyle: 'normal',
                fontSize: 13,
                badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            },
            IADE: {
                nameFormat: 'lastNameOnly',
                fontStyle: 'italic',
                fontSize: 12,
                badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            }
        },
        visibleRoles: {
            surgeon: true,
            MAR: true,
            IADE: true
        }
    }), displaySettings = _j[0], setDisplaySettings = _j[1];
    // Filtres
    var _k = useState(""), roomFilter = _k[0], setRoomFilter = _k[1];
    var _l = useState(""), personnelFilter = _l[0], setPersonnelFilter = _l[1];
    var _m = useState(null), roleFilter = _m[0], setRoleFilter = _m[1];
    // États pour la recherche
    var _o = useState(''), roomSearchQuery = _o[0], setRoomSearchQuery = _o[1];
    var _p = useState(''), personnelSearchQuery = _p[0], setPersonnelSearchQuery = _p[1];
    // État pour le traitement
    var _q = useState(''), saveMessage = _q[0], setSaveMessage = _q[1];
    // Effet pour charger les données (simulées pour l'instant)
    useEffect(function () {
        // Dans un cas réel, ces données proviendraient d'une API
        var mockRooms = [
            { id: "1", name: "Salle 1", sector: "HYPERASEPTIQUE", selected: true },
            { id: "2", name: "Salle 2", sector: "HYPERASEPTIQUE", selected: true },
            { id: "3", name: "Salle 5", sector: "SECTEUR_5_8", selected: true },
            { id: "4", name: "Salle 6", sector: "SECTEUR_5_8", selected: true },
            { id: "5", name: "Salle 7", sector: "SECTEUR_5_8", selected: true },
            { id: "6", name: "Salle 8", sector: "SECTEUR_5_8", selected: true },
            { id: "7", name: "Salle 9", sector: "SECTEUR_9_12B", selected: true },
            { id: "8", name: "Salle 10", sector: "SECTEUR_9_12B", selected: true },
            { id: "9", name: "Salle 11", sector: "SECTEUR_9_12B", selected: true },
            { id: "10", name: "Salle 12B", sector: "SECTEUR_9_12B", selected: true },
            { id: "11", name: "Salle Ophtalmo", sector: "OPHTALMOLOGIE", selected: true },
            { id: "12", name: "Salle Endo 1", sector: "ENDOSCOPIE", selected: true },
            { id: "13", name: "Salle Endo 2", sector: "ENDOSCOPIE", selected: true },
        ];
        var mockPersonnel = [
            { id: "1", firstName: "Jean", lastName: "Dupont", role: "surgeon", selected: true, specialty: "Orthopédie", alias: "JD" },
            { id: "2", firstName: "Marie", lastName: "Laurent", role: "surgeon", selected: true, specialty: "Cardiologie", alias: "MM" },
            { id: "3", firstName: "Sophie", lastName: "Martin", role: "surgeon", selected: true, specialty: "Neurologie", alias: "SM" },
            { id: "4", firstName: "Paul", lastName: "Petit", role: "MAR", selected: true, alias: "PB" },
            { id: "5", firstName: "Claire", lastName: "Dubois", role: "MAR", selected: true, alias: "CD" },
            { id: "6", firstName: "Thomas", lastName: "Leroy", role: "IADE", selected: true, alias: "TL" },
            { id: "7", firstName: "Laure", lastName: "Garnier", role: "IADE", selected: true, alias: "LG" },
        ];
        var mockPresets = [
            {
                id: "1",
                name: "Tous les blocs",
                isDefault: true,
                settings: defaultDisplaySettings,
                selectedRooms: mockRooms.map(function (r) { return r.id; }),
                selectedPersonnel: mockPersonnel.map(function (p) { return p.id; }),
            },
            {
                id: "2",
                name: "Bloc Hyperaseptique",
                isDefault: false,
                settings: __assign(__assign({}, defaultDisplaySettings), { compactView: true, nameFormat: 'alias', showSpecialty: false }),
                selectedRooms: mockRooms.filter(function (r) { return r.sector === "HYPERASEPTIQUE"; }).map(function (r) { return r.id; }),
                selectedPersonnel: mockPersonnel.map(function (p) { return p.id; }),
            },
            {
                id: "3",
                name: "Secteur 5-8",
                isDefault: false,
                settings: __assign(__assign({}, defaultDisplaySettings), { nameFormat: 'alias', fontStyle: 'bold' }),
                selectedRooms: mockRooms.filter(function (r) { return r.sector === "SECTEUR_5_8"; }).map(function (r) { return r.id; }),
                selectedPersonnel: mockPersonnel.map(function (p) { return p.id; }),
            },
        ];
        setRooms(mockRooms);
        setPersonnel(mockPersonnel);
        setPresets(mockPresets);
        // Sélectionner le preset par défaut et charger ses paramètres d'affichage
        var defaultPreset = mockPresets.find(function (p) { return p.isDefault; }) || mockPresets[0];
        if (defaultPreset) {
            setSelectedPreset(defaultPreset.id);
            setDisplaySettings(defaultPreset.settings);
        }
    }, []);
    // Fonction pour filtrer les salles
    var filteredRooms = rooms.filter(function (room) {
        return room.name.toLowerCase().includes(roomFilter.toLowerCase()) ||
            room.sector.toLowerCase().includes(roomFilter.toLowerCase());
    });
    // Fonction pour filtrer le personnel
    var filteredPersonnel = personnel.filter(function (person) {
        var nameMatch = "".concat(person.firstName, " ").concat(person.lastName).toLowerCase().includes(personnelFilter.toLowerCase());
        var roleMatch = roleFilter ? person.role === roleFilter : true;
        return nameMatch && roleMatch;
    });
    // Fonction pour cocher/décocher une salle
    var toggleRoomSelection = function (roomId) {
        var _a;
        if (!selectedPreset)
            return;
        var currentRoomIds = __spreadArray([], ((_a = presets.find(function (p) { return p.id === selectedPreset; })) === null || _a === void 0 ? void 0 : _a.selectedRooms) || [], true);
        // Si la liste est vide (tout est sélectionné), on ajoute toutes les salles sauf celle-ci
        if (currentRoomIds.length === 0) {
            var allRoomsExceptThis_1 = rooms.filter(function (r) { return r.id !== roomId; }).map(function (r) { return r.id; });
            setPresets(presets.map(function (p) { return (__assign(__assign({}, p), { selectedRooms: allRoomsExceptThis_1 })); }));
            return;
        }
        // Si cette salle est déjà dans la liste, on la retire
        if (currentRoomIds.includes(roomId)) {
            // Si après suppression il ne reste qu'une seule salle, on passe à la sélection de toutes les salles
            if (currentRoomIds.length === 1) {
                setPresets(presets.map(function (p) { return (__assign(__assign({}, p), { selectedRooms: [] })); }));
            }
            else {
                setPresets(presets.map(function (p) { return (__assign(__assign({}, p), { selectedRooms: currentRoomIds.filter(function (id) { return id !== roomId; }) })); }));
            }
        }
        else {
            // Sinon on l'ajoute
            setPresets(presets.map(function (p) { return (__assign(__assign({}, p), { selectedRooms: __spreadArray(__spreadArray([], currentRoomIds, true), [roomId], false) })); }));
        }
    };
    // Fonction pour cocher/décocher tout le personnel
    var toggleAllRooms = function (checked) {
        setRooms(rooms.map(function (room) { return (__assign(__assign({}, room), { selected: checked })); }));
    };
    // Fonction pour sélectionner/désélectionner un membre du personnel
    var togglePersonnelSelection = function (personnelId) {
        var _a;
        if (!selectedPreset)
            return;
        var currentPersonnelIds = __spreadArray([], ((_a = presets.find(function (p) { return p.id === selectedPreset; })) === null || _a === void 0 ? void 0 : _a.selectedPersonnel) || [], true);
        // Si la liste est vide (tout est sélectionné), on ajoute tous les personnels sauf celui-ci
        if (currentPersonnelIds.length === 0) {
            var allPersonnelExceptThis_1 = personnel.filter(function (p) { return p.id !== personnelId; }).map(function (p) { return p.id; });
            setPresets(presets.map(function (p) { return (__assign(__assign({}, p), { selectedPersonnel: allPersonnelExceptThis_1 })); }));
            return;
        }
        // Si ce personnel est déjà dans la liste, on le retire
        if (currentPersonnelIds.includes(personnelId)) {
            // Si après suppression il ne reste qu'un seul personnel, on passe à la sélection de tout le personnel
            if (currentPersonnelIds.length === 1) {
                setPresets(presets.map(function (p) { return (__assign(__assign({}, p), { selectedPersonnel: [] })); }));
            }
            else {
                setPresets(presets.map(function (p) { return (__assign(__assign({}, p), { selectedPersonnel: currentPersonnelIds.filter(function (id) { return id !== personnelId; }) })); }));
            }
        }
        else {
            // Sinon on l'ajoute
            setPresets(presets.map(function (p) { return (__assign(__assign({}, p), { selectedPersonnel: __spreadArray(__spreadArray([], currentPersonnelIds, true), [personnelId], false) })); }));
        }
    };
    // Fonction pour cocher/décocher tout le personnel
    var toggleAllPersonnel = function (checked) {
        setPersonnel(personnel.map(function (person) { return (__assign(__assign({}, person), { selected: checked })); }));
    };
    // Fonction pour sélectionner un preset
    var selectPreset = function (preset) {
        setSelectedPreset(preset.id);
        setDisplaySettings(preset.settings);
    };
    // Fonction pour créer un nouveau preset
    var createPreset = function () {
        if (!newPresetName.trim())
            return;
        var newPreset = {
            id: Date.now().toString(),
            name: newPresetName,
            isDefault: false,
            settings: displaySettings,
            selectedRooms: rooms.filter(function (r) { return r.selected; }).map(function (r) { return r.id; }),
            selectedPersonnel: personnel.filter(function (p) { return p.selected; }).map(function (p) { return p.id; }),
        };
        setPresets(__spreadArray(__spreadArray([], presets, true), [newPreset], false));
        setSelectedPreset(newPreset.id);
        setNewPresetName("");
        setIsCreatingPreset(false);
    };
    // Fonction pour définir un preset comme défaut
    var setPresetAsDefault = function (presetId) {
        setPresets(presets.map(function (preset) { return (__assign(__assign({}, preset), { isDefault: preset.id === presetId })); }));
    };
    // Fonction pour supprimer un preset
    var deletePreset = function (presetId) {
        var filteredPresets = presets.filter(function (p) { return p.id !== presetId; });
        setPresets(filteredPresets);
        if (selectedPreset === presetId) {
            var defaultPreset = filteredPresets.find(function (p) { return p.isDefault && p.id !== presetId; });
            if (defaultPreset) {
                setSelectedPreset(defaultPreset.id);
                setDisplaySettings(defaultPreset.settings);
            }
            else if (filteredPresets.length > 1) {
                var remainingPreset = filteredPresets.find(function (p) { return p.id !== presetId; });
                if (remainingPreset) {
                    setSelectedPreset(remainingPreset.id);
                    setDisplaySettings(remainingPreset.settings);
                }
            }
            else {
                setSelectedPreset(null);
                setDisplaySettings(defaultDisplaySettings);
            }
        }
    };
    // Fonction pour mettre à jour les paramètres d'affichage
    var updateDisplaySetting = function (setting, value) {
        setDisplaySettings(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[setting] = value, _a)));
        });
        // Si un preset est sélectionné, mettre à jour ses paramètres d'affichage
        if (selectedPreset) {
            setPresets(presets.map(function (preset) {
                var _a;
                return preset.id === selectedPreset
                    ? __assign(__assign({}, preset), { settings: __assign(__assign({}, preset.settings), (_a = {}, _a[setting] = value, _a)) }) : preset;
            }));
        }
    };
    // Fonction pour sauvegarder les modifications
    var saveChanges = function () { return __awaiter(void 0, void 0, void 0, function () {
        var updatedPresets, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selectedPreset)
                        return [2 /*return*/];
                    setIsSaving(true);
                    setSaveMessage('');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    // Simuler un appel API avec un délai
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 2:
                    // Simuler un appel API avec un délai
                    _a.sent();
                    updatedPresets = presets.map(function (preset) {
                        var _a, _b;
                        return preset.id === selectedPreset ? __assign(__assign({}, preset), { settings: displaySettings, selectedRooms: ((_a = presets.find(function (p) { return p.id === selectedPreset; })) === null || _a === void 0 ? void 0 : _a.selectedRooms) || [], selectedPersonnel: ((_b = presets.find(function (p) { return p.id === selectedPreset; })) === null || _b === void 0 ? void 0 : _b.selectedPersonnel) || [] }) : preset;
                    });
                    setPresets(updatedPresets);
                    setSaveMessage('Configuration enregistrée avec succès.');
                    // Réinitialiser le message après 3 secondes
                    setTimeout(function () { return setSaveMessage(''); }, 3000);
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    setSaveMessage('Erreur lors de l\'enregistrement. Veuillez réessayer.');
                    return [3 /*break*/, 5];
                case 4:
                    setIsSaving(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var getPresetById = function (id) {
        return id ? presets.find(function (p) { return p.id === id; }) : null;
    };
    // Fonction pour formater le nom selon le format choisi (pour l'aperçu)
    var formatName = function (person, format) {
        if (format === void 0) { format = displaySettings.nameFormat; }
        switch (format) {
            case 'fullName':
                return "".concat(person.firstName, " ").concat(person.lastName);
            case 'firstNameOnly':
                return person.firstName;
            case 'lastNameOnly':
                return person.lastName;
            case 'alias':
                return person.alias || "".concat(person.firstName.charAt(0)).concat(person.lastName.charAt(0));
            default:
                return "".concat(person.firstName, " ").concat(person.lastName);
        }
    };
    // Fonction pour obtenir la classe CSS pour le style de police
    var getFontStyleClass = function (style) {
        switch (style) {
            case 'bold':
                return 'font-bold';
            case 'italic':
                return 'italic';
            case 'boldItalic':
                return 'font-bold italic';
            default:
                return '';
        }
    };
    // Rendu de l'aperçu des paramètres d'affichage
    var renderDisplayPreview = function () {
        var examplePersons = {
            surgeon: {
                id: 'preview-surgeon',
                firstName: 'Jean',
                lastName: 'Dupont',
                role: 'surgeon',
                specialty: 'Orthopédie',
                alias: 'JD',
                selected: true
            },
            MAR: {
                id: 'preview-mar',
                firstName: 'Marie',
                lastName: 'Laurent',
                role: 'MAR',
                alias: 'ML',
                selected: true
            },
            IADE: {
                id: 'preview-iade',
                firstName: 'Paul',
                lastName: 'Petit',
                role: 'IADE',
                alias: 'PP',
                selected: true
            }
        };
        var nameClass = getFontStyleClass(displaySettings.fontStyle);
        return (<div className="bg-white p-3 rounded-md shadow">
                <h4 className="text-sm font-medium mb-2">Aperçu:</h4>
                <div className={"space-y-1 ".concat(displaySettings.compactView ? 'text-xs' : 'text-sm')}>
                    {displaySettings.visibleRoles.surgeon && (<div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span style={{ fontSize: "".concat(displaySettings.roleStyles.surgeon.fontSize, "px") }}>
                                <strong>Chirurgien:</strong> {formatName(examplePersons.surgeon, displaySettings.roleStyles.surgeon.nameFormat)}
                            </span>
                            {displaySettings.showSpecialty && <span className="text-gray-500 text-xs">({examplePersons.surgeon.specialty})</span>}
                            {displaySettings.showRole && <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded">Chirurgien</span>}
                        </div>)}
                    {displaySettings.visibleRoles.MAR && (<div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span style={{ fontSize: "".concat(displaySettings.roleStyles.MAR.fontSize, "px") }}>
                                <strong>MAR:</strong> {formatName(examplePersons.MAR, displaySettings.roleStyles.MAR.nameFormat)}
                            </span>
                            {displaySettings.showRole && <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded">MAR</span>}
                        </div>)}
                    {displaySettings.visibleRoles.IADE && (<div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            <span style={{ fontSize: "".concat(displaySettings.roleStyles.IADE.fontSize, "px") }}>
                                <strong>IADE:</strong> {formatName(examplePersons.IADE, displaySettings.roleStyles.IADE.nameFormat)}
                            </span>
                            {displaySettings.showRole && <span className="bg-purple-100 text-purple-800 text-xs px-1.5 py-0.5 rounded">IADE</span>}
                        </div>)}
                </div>
            </div>);
    };
    // Ajouter une fonction pour mettre à jour la visibilité des rôles
    var toggleRoleVisibility = function (role) {
        var _a;
        setDisplaySettings(__assign(__assign({}, displaySettings), { visibleRoles: __assign(__assign({}, displaySettings.visibleRoles), (_a = {}, _a[role] = !displaySettings.visibleRoles[role], _a)) }));
    };
    return (<div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Configuration du Planning Hebdomadaire</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={function () { return setActiveTab('presets'); }} className={activeTab === 'presets' ? 'bg-gray-100' : ''}>
                        <Filter className="h-4 w-4 mr-2"/>
                        Filtres & Préréglages
                    </Button>
                    <Button variant="outline" onClick={function () { return setActiveTab('display'); }} className={activeTab === 'display' ? 'bg-gray-100' : ''}>
                        <Eye className="h-4 w-4 mr-2"/>
                        Affichage
                    </Button>
                    <Button variant="primary" onClick={saveChanges} disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2"/>
                        Enregistrer
                    </Button>
                </div>
            </div>

            {/* Message de succès */}
            {saveMessage && (<div className="mb-4 p-2 bg-green-100 text-green-800 rounded border border-green-300">
                    {saveMessage}
                </div>)}

            {/* Onglets */}
            {activeTab === 'presets' ? (<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Section des préréglages */}
                    <Card className="lg:col-span-1">
                        <CardContent className="p-4">
                            <h2 className="text-lg font-medium mb-4">Préréglages</h2>

                            {/* Liste des préréglages */}
                            <div className="space-y-2 mb-6">
                                {presets.map(function (preset) { return (<div key={preset.id} className={"p-3 border rounded-md cursor-pointer flex items-center justify-between ".concat(selectedPreset === preset.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200')} onClick={function () { return selectPreset(preset); }}>
                                        <div className="flex items-center">
                                            <span className="mr-2">{preset.name}</span>
                                            {preset.isDefault && (<span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">Par défaut</span>)}
                                        </div>
                                        <div className="flex gap-1">
                                            <button className="p-1 text-gray-400 hover:text-blue-500" onClick={function (e) {
                    e.stopPropagation();
                    setPresetAsDefault(preset.id);
                }} disabled={preset.isDefault} title="Définir comme préréglage par défaut">
                                                {preset.isDefault ? <StarSolidIcon className="h-4 w-4 text-yellow-500"/> : <StarIcon className="h-4 w-4"/>}
                                            </button>
                                            <button className="p-1 text-gray-400 hover:text-red-500" onClick={function (e) {
                    e.stopPropagation();
                    deletePreset(preset.id);
                }} disabled={preset.isDefault || presets.length <= 1} title="Supprimer ce préréglage">
                                                <TrashIcon className="h-4 w-4"/>
                                            </button>
                                        </div>
                                    </div>); })}
                            </div>

                            {/* Bouton pour ajouter un préréglage */}
                            {isCreatingPreset ? (<div className="flex flex-col gap-2">
                                    <input type="text" value={newPresetName} onChange={function (e) { return setNewPresetName(e.target.value); }} placeholder="Nom du préréglage" className="p-2 border rounded-md"/>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={function () { return setIsCreatingPreset(false); }} className="flex-1">
                                            Annuler
                                        </Button>
                                        <Button variant="primary" onClick={createPreset} className="flex-1" disabled={!newPresetName.trim()}>
                                            Créer
                                        </Button>
                                    </div>
                                </div>) : (<Button variant="outline" onClick={function () { return setIsCreatingPreset(true); }} className="w-full">
                                    <PlusIcon className="h-4 w-4 mr-2"/>
                                    Ajouter un préréglage
                                </Button>)}
                        </CardContent>
                    </Card>

                    {/* Section des salles et personnel sélectionnés */}
                    <Card className="lg:col-span-2">
                        <CardContent className="p-4">
                            <div className="flex justify-between mb-4">
                                <h2 className="text-lg font-medium">Sélection des ressources</h2>
                            </div>

                            {/* Reste du contenu de ce panel */}
                            {/* ... */}
                        </CardContent>
                    </Card>
                </div>) : (
        /* Onglet d'affichage */
        <div>
                    {/* ... */}
                </div>)}
        </div>);
};
export default WeeklyPlanningConfigPanel;
