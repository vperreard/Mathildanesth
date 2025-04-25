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
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon, InformationCircleIcon, Cog6ToothIcon, } from "@heroicons/react/24/outline";
import { format, addWeeks, startOfWeek, endOfWeek, isToday, isWeekend, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
// Import du panneau de configuration
import DisplayConfigPanel, { defaultDisplayConfig } from "./DisplayConfigPanel";
// Mock data
var sectors = {
    HYPERASEPTIQUE: "bg-blue-100 dark:bg-blue-950 border-blue-300 dark:border-blue-700",
    SECTEUR_5_8: "bg-green-100 dark:bg-green-950 border-green-300 dark:border-green-700",
    SECTEUR_9_12B: "bg-orange-100 dark:bg-orange-950 border-orange-300 dark:border-orange-700",
    OPHTALMOLOGIE: "bg-pink-100 dark:bg-pink-950 border-pink-300 dark:border-pink-700",
    ENDOSCOPIE: "bg-indigo-100 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-700",
};
var sectorLabels = {
    HYPERASEPTIQUE: "Hyperaseptique",
    SECTEUR_5_8: "Secteur 5-8",
    SECTEUR_9_12B: "Secteur 9-12B",
    OPHTALMOLOGIE: "Ophtalmologie",
    ENDOSCOPIE: "Endoscopie",
};
var roleColors = {
    SURGEON: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
    MAR: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    IADE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};
// Mock data functions
var getMockUsers = function () { return [
    { id: "1", firstName: "Jean", lastName: "Dupont", role: "SURGEON", specialty: "Orthopédie" },
    { id: "2", firstName: "Marie", lastName: "Laurent", role: "SURGEON", specialty: "Cardiologie" },
    { id: "3", firstName: "Sophie", lastName: "Martin", role: "SURGEON", specialty: "Ophtalmologie" },
    { id: "4", firstName: "Paul", lastName: "Petit", role: "MAR" },
    { id: "5", firstName: "Claire", lastName: "Dubois", role: "MAR" },
    { id: "6", firstName: "Thomas", lastName: "Leroy", role: "IADE" },
    { id: "7", firstName: "Laure", lastName: "Garnier", role: "IADE" },
]; };
var getMockRooms = function () { return [
    { id: "1", name: "Salle 1", sector: "HYPERASEPTIQUE" },
    { id: "2", name: "Salle 2", sector: "HYPERASEPTIQUE" },
    { id: "3", name: "Salle 5", sector: "SECTEUR_5_8" },
    { id: "4", name: "Salle 6", sector: "SECTEUR_5_8" },
    { id: "5", name: "Salle 7", sector: "SECTEUR_5_8" },
    { id: "6", name: "Salle 8", sector: "SECTEUR_5_8" },
    { id: "7", name: "Salle 9", sector: "SECTEUR_9_12B" },
    { id: "8", name: "Salle 10", sector: "SECTEUR_9_12B" },
    { id: "9", name: "Salle 11", sector: "SECTEUR_9_12B" },
    { id: "10", name: "Salle 12B", sector: "SECTEUR_9_12B" },
    { id: "11", name: "Salle Ophtalmo", sector: "OPHTALMOLOGIE" },
    { id: "12", name: "Salle Endo 1", sector: "ENDOSCOPIE" },
    { id: "13", name: "Salle Endo 2", sector: "ENDOSCOPIE" },
]; };
var getMockAssignments = function (weekStartDate) {
    var assignments = [];
    var days = eachDayOfInterval({ start: weekStartDate, end: endOfWeek(weekStartDate, { weekStartsOn: 1 }) });
    var rooms = getMockRooms();
    var users = getMockUsers();
    var surgeons = users.filter(function (u) { return u.role === "SURGEON"; });
    var mars = users.filter(function (u) { return u.role === "MAR"; });
    var iades = users.filter(function (u) { return u.role === "IADE"; });
    days.forEach(function (day) {
        if (isWeekend(day))
            return;
        rooms.forEach(function (room, roomIndex) {
            var surgeonIndex = (roomIndex + day.getDate()) % surgeons.length;
            var marIndex = (roomIndex + day.getDate()) % mars.length;
            var iadeIndex = (roomIndex + day.getDate()) % iades.length;
            assignments.push({
                id: "".concat(day.toISOString(), "-").concat(room.id, "-morning"),
                roomId: room.id,
                surgeonId: surgeons[surgeonIndex].id,
                marId: mars[marIndex].id,
                iadeId: iades[iadeIndex].id,
                date: day.toISOString(),
                period: "MORNING",
            });
            if (Math.random() > 0.3) { // Not all rooms have afternoon assignments
                assignments.push({
                    id: "".concat(day.toISOString(), "-").concat(room.id, "-afternoon"),
                    roomId: room.id,
                    surgeonId: surgeons[(surgeonIndex + 1) % surgeons.length].id,
                    marId: mars[marIndex].id,
                    iadeId: iades[(iadeIndex + 1) % iades.length].id,
                    date: day.toISOString(),
                    period: "AFTERNOON",
                });
            }
        });
    });
    return assignments;
};
// Component
export default function WeeklyPlanningPage() {
    var _this = this;
    var _a = useState(function () { return startOfWeek(new Date(), { weekStartsOn: 1 }); }), currentWeekStart = _a[0], setCurrentWeekStart = _a[1];
    var _b = useState(""), searchQuery = _b[0], setSearchQuery = _b[1];
    var _c = useState("ROOMS"), viewMode = _c[0], setViewMode = _c[1];
    var _d = useState(false), showLegend = _d[0], setShowLegend = _d[1];
    var _e = useState(true), isLoading = _e[0], setIsLoading = _e[1];
    var _f = useState(false), compactView = _f[0], setCompactView = _f[1];
    // État pour le panneau de configuration
    var _g = useState(false), showConfigPanel = _g[0], setShowConfigPanel = _g[1];
    var _h = useState(defaultDisplayConfig), displayConfig = _h[0], setDisplayConfig = _h[1];
    // État pour l'ordre personnalisé des salles
    var _j = useState({ orderedRoomIds: [] }), roomOrderConfig = _j[0], setRoomOrderConfig = _j[1];
    // Paramètres d'affichage étendus - à supprimer après migration vers DisplayConfig
    var _k = useState('full'), nameFormat = _k[0], setNameFormat = _k[1];
    var _l = useState('normal'), fontStyle = _l[0], setFontStyle = _l[1];
    var _m = useState('14px'), fontSize = _m[0], setFontSize = _m[1];
    var _o = useState(true), showRoles = _o[0], setShowRoles = _o[1];
    // État pour stocker la configuration active
    var _p = useState(null), activeConfigId = _p[0], setActiveConfigId = _p[1];
    var _q = useState([]), visibleRoomIds = _q[0], setVisibleRoomIds = _q[1];
    var _r = useState([]), visiblePersonnelIds = _r[0], setVisiblePersonnelIds = _r[1];
    var _s = useState([]), rooms = _s[0], setRooms = _s[1];
    var _t = useState([]), users = _t[0], setUsers = _t[1];
    var _u = useState([]), assignments = _u[0], setAssignments = _u[1];
    // Remplacer l'utilisation de useTheme par un useState local
    var _v = useState(typeof window !== 'undefined'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        : 'light'), theme = _v[0], setTheme = _v[1];
    // Load data
    useEffect(function () {
        setIsLoading(true);
        // Simuler un appel API pour les préférences de configuration
        var loadConfigPreferences = function () { return __awaiter(_this, void 0, void 0, function () {
            var defaultConfig;
            return __generator(this, function (_a) {
                defaultConfig = {
                    id: "1",
                    roomIds: [], // vide = toutes les salles
                    personnelIds: [], // vide = tout le personnel
                    displaySettings: {
                        compactView: false,
                        nameFormat: 'full',
                        fontStyle: 'normal',
                        fontSize: '14px',
                        showRoles: true
                    }
                };
                setActiveConfigId(defaultConfig.id);
                setVisibleRoomIds(defaultConfig.roomIds);
                setVisiblePersonnelIds(defaultConfig.personnelIds);
                // Appliquer les paramètres d'affichage
                setCompactView(defaultConfig.displaySettings.compactView);
                setNameFormat(defaultConfig.displaySettings.nameFormat);
                setFontStyle(defaultConfig.displaySettings.fontStyle);
                setFontSize(defaultConfig.displaySettings.fontSize);
                setShowRoles(defaultConfig.displaySettings.showRoles);
                return [2 /*return*/];
            });
        }); };
        var fetchDataAndConfig = function () { return __awaiter(_this, void 0, void 0, function () {
            var fetchedUsers, fetchedRooms, orderedRooms, sortedRooms, fetchedAssignments, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Charger la configuration d'affichage
                        return [4 /*yield*/, loadConfigPreferences()];
                    case 1:
                        // Charger la configuration d'affichage
                        _a.sent();
                        fetchedUsers = getMockUsers();
                        setUsers(fetchedUsers);
                        fetchedRooms = getMockRooms();
                        orderedRooms = fetchedRooms.map(function (room) {
                            // Si la salle est dans l'ordre personnalisé, lui donner cet ordre
                            var orderIndex = roomOrderConfig.orderedRoomIds.indexOf(room.id);
                            if (orderIndex !== -1) {
                                return __assign(__assign({}, room), { order: orderIndex });
                            }
                            return room;
                        });
                        sortedRooms = __spreadArray([], orderedRooms, true).sort(function (a, b) {
                            // Si les deux salles ont un ordre défini, les comparer
                            if (a.order !== undefined && b.order !== undefined) {
                                return a.order - b.order;
                            }
                            // Si seulement a a un ordre, le placer avant
                            if (a.order !== undefined) {
                                return -1;
                            }
                            // Si seulement b a un ordre, le placer avant
                            if (b.order !== undefined) {
                                return 1;
                            }
                            // Sinon, trier par secteur puis par nom
                            if (a.sector !== b.sector) {
                                return a.sector.localeCompare(b.sector);
                            }
                            return a.name.localeCompare(b.name);
                        });
                        setRooms(sortedRooms);
                        fetchedAssignments = getMockAssignments(currentWeekStart);
                        setAssignments(fetchedAssignments);
                        setIsLoading(false);
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Erreur lors du chargement des données:', error_1);
                        setIsLoading(false);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        fetchDataAndConfig();
    }, [currentWeekStart, roomOrderConfig.orderedRoomIds]);
    // Fonction pour sauvegarder l'ordre des salles
    var handleSaveRoomOrder = function (orderedRoomIds) {
        // Convertir tous les IDs en string pour être cohérent
        var stringifiedIds = orderedRoomIds.map(function (id) { return String(id); });
        // Mettre à jour la configuration de l'ordre des salles
        setRoomOrderConfig({ orderedRoomIds: stringifiedIds });
        // Enregistrer cet ordre dans le localStorage (ou l'API dans une implémentation réelle)
        if (typeof window !== 'undefined') {
            localStorage.setItem('roomOrderConfig', JSON.stringify({ orderedRoomIds: stringifiedIds }));
        }
        // Notifier l'utilisateur
        alert('L\'ordre des salles a été sauvegardé avec succès !');
    };
    // Récupérer l'ordre des salles depuis le localStorage au chargement initial
    useEffect(function () {
        if (typeof window !== 'undefined') {
            var savedRoomOrder = localStorage.getItem('roomOrderConfig');
            if (savedRoomOrder) {
                try {
                    var parsedOrder = JSON.parse(savedRoomOrder);
                    setRoomOrderConfig(parsedOrder);
                }
                catch (e) {
                    console.error('Erreur lors de la lecture de l\'ordre des salles :', e);
                }
            }
        }
    }, []);
    // Filter data based on search query AND configuration preferences
    var filteredRooms = rooms.filter(function (room) {
        var matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase());
        var isVisibleByConfig = visibleRoomIds.length === 0 || visibleRoomIds.includes(room.id);
        return matchesSearch && isVisibleByConfig;
    });
    var filteredSurgeons = users
        .filter(function (user) { return user.role === "SURGEON"; })
        .filter(function (surgeon) {
        var matchesSearch = "".concat(surgeon.firstName, " ").concat(surgeon.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
            (surgeon.specialty && surgeon.specialty.toLowerCase().includes(searchQuery.toLowerCase()));
        var isVisibleByConfig = visiblePersonnelIds.length === 0 || visiblePersonnelIds.includes(surgeon.id);
        return matchesSearch && isVisibleByConfig;
    });
    // Filtrer les assignations en fonction de la configuration
    var filteredAssignments = assignments.filter(function (assignment) {
        // Vérifier si la salle est visible selon la configuration
        var roomVisible = visibleRoomIds.length === 0 || visibleRoomIds.includes(assignment.roomId);
        // Vérifier si le chirurgien est visible selon la configuration
        var surgeonVisible = visiblePersonnelIds.length === 0 || visiblePersonnelIds.includes(assignment.surgeonId);
        // L'assignation est visible si la salle ET le chirurgien sont visibles
        return roomVisible && surgeonVisible;
    });
    // Fonction pour formater le nom selon le format choisi
    var formatName = function (firstName, lastName, format, specialty) {
        // Support pour les anciens formats (à conserver pendant la migration)
        switch (format) {
            case 'full':
                return "".concat(firstName, " ").concat(lastName);
            case 'lastName':
                return lastName;
            case 'firstName':
                return firstName;
            case 'initials':
                return "".concat(firstName.charAt(0), ".").concat(lastName.charAt(0), ".");
            case 'firstInitial-lastName':
                return "".concat(firstName.charAt(0), ". ").concat(lastName);
            // Support pour les nouveaux formats du DisplayConfigPanel
            case 'nom':
                return lastName;
            case 'nomPrenom':
                return "".concat(lastName, " ").concat(firstName);
            case 'prenom-nom':
                return "".concat(firstName, " ").concat(lastName);
            case 'nom-specialite':
                return "".concat(lastName).concat(specialty ? " (".concat(specialty, ")") : '');
            case 'initiale-nom':
                return "".concat(firstName.charAt(0), ". ").concat(lastName);
            default:
                return "".concat(firstName, " ").concat(lastName);
        }
    };
    // Fonction pour obtenir la classe CSS pour le style de police
    var getFontStyleClass = function (style) {
        switch (style) {
            case 'bold':
                return 'font-bold';
            case 'italic':
                return 'italic';
            case 'bold-italic':
                return 'font-bold italic';
            default:
                return '';
        }
    };
    // Navigation functions
    var goToPreviousWeek = function () {
        setCurrentWeekStart(function (prev) { return addWeeks(prev, -1); });
    };
    var goToNextWeek = function () {
        setCurrentWeekStart(function (prev) { return addWeeks(prev, 1); });
    };
    var goToCurrentWeek = function () {
        setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    };
    // Helper functions
    var getUserById = function (id) { return users.find(function (user) { return user.id === id; }); };
    var getRoomById = function (id) { return rooms.find(function (room) { return room.id === id; }); };
    var getDailyAssignments = function (date, roomId) {
        return filteredAssignments.filter(function (assignment) {
            return new Date(assignment.date).toDateString() === date.toDateString() &&
                assignment.roomId === roomId;
        });
    };
    var getWeekDays = function () {
        return eachDayOfInterval({
            start: currentWeekStart,
            end: endOfWeek(currentWeekStart, { weekStartsOn: 1 })
        }).filter(function (day) { return !isWeekend(day); });
    };
    // Get assignments for a specific surgeon on a specific day
    var getSurgeonDailyAssignments = function (date, surgeonId) {
        return filteredAssignments.filter(function (assignment) {
            return new Date(assignment.date).toDateString() === date.toDateString() &&
                assignment.surgeonId === surgeonId;
        });
    };
    // Render functions avec les nouveaux formats de nom et styles de police
    var renderAssignment = function (assignment) {
        var surgeon = getUserById(assignment.surgeonId);
        var mar = assignment.marId ? getUserById(assignment.marId) : null;
        var iade = assignment.iadeId ? getUserById(assignment.iadeId) : null;
        var room = getRoomById(assignment.roomId);
        if (!surgeon || !room)
            return null;
        // Extraction du nom de couleur du secteur pour l'utiliser dans les classes d'opacité
        var sectorColorMatch = sectors[room.sector].match(/(bg-\w+-\d+)/);
        var sectorColor = sectorColorMatch ? sectorColorMatch[1] : '';
        // Classe CSS pour le style de police
        var nameStyleClass = getFontStyleClass(fontStyle);
        return (<div key={assignment.id} className={"p-2 mb-1 rounded border ".concat(assignment.period === "MORNING"
                ? "".concat(sectors[room.sector], " border-l-4")
                : "".concat(sectorColor, " bg-opacity-40 dark:bg-opacity-30 border-r-4 border-").concat(room.sector.toLowerCase()))}>
                <div className={"font-semibold text-sm ".concat(nameStyleClass)} style={{ fontSize: fontSize }}>
                    {formatName(surgeon.firstName, surgeon.lastName, nameFormat, surgeon.specialty)}
                </div>

                {showRoles && (<div className="flex flex-wrap gap-1 mt-1">
                        {mar && (<span className={"text-xs px-1 rounded ".concat(roleColors.MAR, " ").concat(nameStyleClass)} style={{ fontSize: "calc(".concat(fontSize, " - 2px)") }}>
                                MAR: {formatName(mar.firstName, mar.lastName, nameFormat, mar.specialty)}
                            </span>)}
                        {iade && (<span className={"text-xs px-1 rounded ".concat(roleColors.IADE, " ").concat(nameStyleClass)} style={{ fontSize: "calc(".concat(fontSize, " - 2px)") }}>
                                IADE: {formatName(iade.firstName, iade.lastName, nameFormat, iade.specialty)}
                            </span>)}
                    </div>)}
            </div>);
    };
    var renderRoomView = function () {
        var weekDays = getWeekDays();
        return (<div className={"mt-4 overflow-x-auto ".concat(compactView ? 'scale-compact' : '')}>
                <table className={"min-w-full border-collapse ".concat(compactView ? 'compact-table' : '')}>
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800">
                            <th className={"py-2 px-3 border border-gray-300 dark:border-gray-700 text-left ".concat(compactView ? 'compact-cell' : '')}>Salles</th>
                            {weekDays.map(function (day) { return (<th key={day.toISOString()} className={"py-2 px-3 border border-gray-300 dark:border-gray-700 text-center ".concat(isToday(day) ? "bg-blue-50 dark:bg-blue-900" : "", " ").concat(compactView ? 'compact-cell' : '')}>
                                    <div className={compactView ? 'text-xs' : ''}>{format(day, "EEEE", { locale: fr })}</div>
                                    <div className={compactView ? 'text-xs' : ''}>{format(day, "dd/MM", { locale: fr })}</div>
                                </th>); })}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRooms.map(function (room) { return (<tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className={"py-2 px-3 border border-gray-300 dark:border-gray-700 ".concat(sectors[room.sector], " font-medium ").concat(compactView ? 'compact-cell' : '')}>
                                    {room.name}
                                </td>
                                {weekDays.map(function (day) {
                    var dayAssignments = getDailyAssignments(day, room.id);
                    var morningAssignment = dayAssignments.find(function (a) { return a.period === "MORNING"; });
                    var afternoonAssignment = dayAssignments.find(function (a) { return a.period === "AFTERNOON"; });
                    return (<td key={day.toISOString()} className={"py-2 px-3 border border-gray-300 dark:border-gray-700 ".concat(compactView ? 'compact-cell' : '')}>
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    {morningAssignment && renderCompactAssignment(morningAssignment)}
                                                </div>
                                                <div className="flex-1">
                                                    {afternoonAssignment && renderCompactAssignment(afternoonAssignment)}
                                                </div>
                                            </div>
                                        </td>);
                })}
                            </tr>); })}
                    </tbody>
                </table>
            </div>);
    };
    // Nouvelle fonction pour rendre les assignations en fonction du mode (compact ou normal)
    var renderCompactAssignment = function (assignment) {
        if (compactView) {
            return renderCompactVersionAssignment(assignment);
        }
        return renderAssignment(assignment);
    };
    // Version compacte de l'affichage des assignations
    var renderCompactVersionAssignment = function (assignment) {
        var surgeon = getUserById(assignment.surgeonId);
        var room = getRoomById(assignment.roomId);
        if (!surgeon || !room)
            return null;
        // Extraction du nom de couleur du secteur pour l'utiliser dans les classes d'opacité
        var sectorColorMatch = sectors[room.sector].match(/(bg-\w+-\d+)/);
        var sectorColor = sectorColorMatch ? sectorColorMatch[1] : '';
        return (<div key={assignment.id} className={"p-1 mb-1 rounded border text-xs ".concat(assignment.period === "MORNING"
                ? "".concat(sectors[room.sector], " border-l-2")
                : "".concat(sectorColor, " bg-opacity-40 dark:bg-opacity-30 border-r-2 border-").concat(room.sector.toLowerCase()))}>
                <div className="font-medium text-xs truncate">
                    {surgeon.firstName.charAt(0)}. {surgeon.lastName}
                </div>
            </div>);
    };
    var renderSurgeonView = function () {
        var weekDays = getWeekDays();
        return (<div className={"mt-4 overflow-x-auto ".concat(compactView ? 'scale-compact' : '')}>
                <table className={"min-w-full border-collapse ".concat(compactView ? 'compact-table' : '')}>
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800">
                            <th className={"py-2 px-3 border border-gray-300 dark:border-gray-700 text-left ".concat(compactView ? 'compact-cell' : '')}>Chirurgiens</th>
                            {weekDays.map(function (day) { return (<th key={day.toISOString()} className={"py-2 px-3 border border-gray-300 dark:border-gray-700 text-center ".concat(isToday(day) ? "bg-blue-50 dark:bg-blue-900" : "", " ").concat(compactView ? 'compact-cell' : '')}>
                                    <div className={compactView ? 'text-xs' : ''}>{format(day, "EEEE", { locale: fr })}</div>
                                    <div className={compactView ? 'text-xs' : ''}>{format(day, "dd/MM", { locale: fr })}</div>
                                </th>); })}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSurgeons.map(function (surgeon) { return (<tr key={surgeon.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className={"py-2 px-3 border border-gray-300 dark:border-gray-700 font-medium ".concat(compactView ? 'compact-cell' : '')}>
                                    <div className={compactView ? 'text-xs' : ''}>{surgeon.firstName} {surgeon.lastName}</div>
                                    {surgeon.specialty && !compactView && (<div className="text-xs text-gray-600 dark:text-gray-400">{surgeon.specialty}</div>)}
                                </td>
                                {weekDays.map(function (day) {
                    var surgeonAssignments = getSurgeonDailyAssignments(day, surgeon.id);
                    var morningAssignments = surgeonAssignments.filter(function (a) { return a.period === "MORNING"; });
                    var afternoonAssignments = surgeonAssignments.filter(function (a) { return a.period === "AFTERNOON"; });
                    return (<td key={day.toISOString()} className={"py-2 px-3 border border-gray-300 dark:border-gray-700 ".concat(compactView ? 'compact-cell' : '')}>
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    {morningAssignments.map(function (assignment) {
                            var room = getRoomById(assignment.roomId);
                            if (!room)
                                return null;
                            return compactView ? (<div key={assignment.id} className={"p-1 mb-1 rounded border text-xs ".concat(sectors[room.sector], " border-l-2")}>
                                                                <div className="font-medium text-xs truncate">{room.name}</div>
                                                            </div>) : (<div key={assignment.id} className={"p-2 mb-1 rounded border ".concat(sectors[room.sector], " border-l-4")}>
                                                                <div className="font-semibold text-sm">{room.name}</div>
                                                                <div className="text-xs text-gray-700 dark:text-gray-300">
                                                                    Matin
                                                                </div>
                                                            </div>);
                        })}
                                                </div>
                                                <div className="flex-1">
                                                    {afternoonAssignments.map(function (assignment) {
                            var room = getRoomById(assignment.roomId);
                            if (!room)
                                return null;
                            // Extraction du nom de couleur pour l'utiliser dans les classes d'opacité
                            var sectorColorMatch = sectors[room.sector].match(/(bg-\w+-\d+)/);
                            var sectorColor = sectorColorMatch ? sectorColorMatch[1] : '';
                            return compactView ? (<div key={assignment.id} className={"p-1 mb-1 rounded border text-xs ".concat(sectorColor, " bg-opacity-40 dark:bg-opacity-30 border-r-2 border-").concat(room.sector.toLowerCase())}>
                                                                <div className="font-medium text-xs truncate">{room.name}</div>
                                                            </div>) : (<div key={assignment.id} className={"p-2 mb-1 rounded border ".concat(sectorColor, " bg-opacity-40 dark:bg-opacity-30 border-r-4 border-").concat(room.sector.toLowerCase())}>
                                                                <div className="font-semibold text-sm">{room.name}</div>
                                                                <div className="text-xs text-gray-700 dark:text-gray-300">
                                                                    Après-midi
                                                                </div>
                                                            </div>);
                        })}
                                                </div>
                                            </div>
                                        </td>);
                })}
                            </tr>); })}
                    </tbody>
                </table>
            </div>);
    };
    var renderLegend = function () {
        return (<div className="mt-4 p-4 bg-white dark:bg-gray-800 shadow rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Légende</h3>

                <div className="space-y-2">
                    <div>
                        <h4 className="font-medium">Secteurs</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                            {Object.entries(sectorLabels).map(function (_a) {
                var key = _a[0], label = _a[1];
                return (<div key={key} className={"p-2 rounded border ".concat(sectors[key], " flex items-center")}>
                                    <span className="text-sm">{label}</span>
                                </div>);
            })}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium">Rôles</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                            {Object.entries(roleColors).map(function (_a) {
                var role = _a[0], colorClass = _a[1];
                return (<div key={role} className={"p-2 rounded ".concat(colorClass, " flex items-center")}>
                                    <span className="text-sm">{role === "SURGEON" ? "Chirurgien" : role}</span>
                                </div>);
            })}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium">Périodes</h4>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            <div className="p-2 rounded border border-l-4 bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 flex items-center">
                                <span className="text-sm">Matin</span>
                            </div>
                            <div className="p-2 rounded border border-r-4 bg-blue-100 bg-opacity-40 dark:bg-blue-900 dark:bg-opacity-30 border-blue-300 dark:border-blue-700 flex items-center">
                                <span className="text-sm">Après-midi</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>);
    };
    // Pour remplacer les tooltips de react-tooltip, vous pouvez créer une simple infobulle avec useState
    var SimpleTooltip = function (_a) {
        var children = _a.children, content = _a.content;
        var _b = useState(false), isVisible = _b[0], setIsVisible = _b[1];
        return (<div className="relative inline-block" onMouseEnter={function () { return setIsVisible(true); }} onMouseLeave={function () { return setIsVisible(false); }}>
                {children}
                {isVisible && (<div className="absolute z-10 px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-md -top-10 left-1/2 transform -translate-x-1/2">
                        {content}
                    </div>)}
            </div>);
    };
    // Pour basculer le thème, au lieu de setTheme('dark') ou setTheme('light')
    var toggleTheme = function () {
        setTheme(theme === 'dark' ? 'light' : 'dark');
        // Si vous voulez aussi appliquer une classe au document pour le mode sombre
        if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', theme === 'light');
        }
    };
    var getRoomsBySector = function (sector) {
        return rooms
            .filter(function (room) { return room.sector === sector; })
            .sort(function (a, b) {
            // Si les deux salles ont un ordre, les comparer
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            // Si seulement a a un ordre, le placer avant
            if (a.order !== undefined) {
                return -1;
            }
            // Si seulement b a un ordre, le placer avant
            if (b.order !== undefined) {
                return 1;
            }
            // Sinon, trier par nom
            return a.name.localeCompare(b.name);
        });
    };
    // Mise à jour de la configuration d'affichage
    var handleConfigChange = function (newConfig) {
        setDisplayConfig(newConfig);
        // Sauvegarder dans le localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('displayConfig', JSON.stringify(newConfig));
        }
    };
    return (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .5 }} className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-4">Planning Hebdomadaire des Blocs Opératoires</h1>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <button onClick={goToPreviousWeek} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Semaine précédente">
                        <ChevronLeftIcon className="h-5 w-5"/>
                    </button>

                    <div className="text-lg font-medium">
                        Semaine du {format(currentWeekStart, "dd/MM/yyyy", { locale: fr })} au{" "}
                        {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "dd/MM/yyyy", { locale: fr })}
                    </div>

                    <button onClick={goToNextWeek} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Semaine suivante">
                        <ChevronRightIcon className="h-5 w-5"/>
                    </button>

                    <button onClick={goToCurrentWeek} className="ml-2 px-3 py-1 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800">
                        Aujourd'hui
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-2 items-center">
                    <div className="relative">
                        <input type="text" value={searchQuery} onChange={function (e) { return setSearchQuery(e.target.value); }} placeholder="Rechercher..." className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"/>
                        <PencilIcon className="h-5 w-5 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2"/>
                    </div>

                    <div className="flex rounded-md shadow-sm">
                        <button onClick={function () { return setViewMode("ROOMS"); }} className={"px-4 py-2 text-sm rounded-l-md ".concat(viewMode === "ROOMS"
            ? "bg-blue-500 text-white"
            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600")}>
                            Par Salles
                        </button>
                        <button onClick={function () { return setViewMode("SURGEONS"); }} className={"px-4 py-2 text-sm rounded-r-md ".concat(viewMode === "SURGEONS"
            ? "bg-blue-500 text-white"
            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600")}>
                            Par Chirurgiens
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="compactView" checked={compactView} onChange={function () { return setCompactView(!compactView); }} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                        <label htmlFor="compactView" className="text-sm text-gray-700 dark:text-gray-300">
                            Vue d'ensemble
                        </label>
                    </div>

                    <SimpleTooltip content="Aide">
                        <button onClick={function () { return setShowLegend(!showLegend); }} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 relative">
                            <InformationCircleIcon className="h-5 w-5"/>
                        </button>
                    </SimpleTooltip>

                    <SimpleTooltip content="Configuration d'affichage">
                        <button onClick={function () { return setShowConfigPanel(true); }} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 relative">
                            <Cog6ToothIcon className="h-5 w-5"/>
                        </button>
                    </SimpleTooltip>
                </div>
            </div>

            {isLoading ? (<div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>) : (<>
                    {viewMode === "ROOMS" ? renderRoomView() : renderSurgeonView()}

                    {searchQuery &&
                (viewMode === "ROOMS" && filteredRooms.length === 0) ||
                (viewMode === "SURGEONS" && filteredSurgeons.length === 0) ? (<div className="text-center py-10 text-gray-500 dark:text-gray-400">
                            Aucun résultat trouvé pour "{searchQuery}"
                        </div>) : null}
                </>)}

            {showLegend && renderLegend()}

            {/* Panneau de configuration */}
            {showConfigPanel && (<DisplayConfigPanel config={displayConfig} onConfigChange={handleConfigChange} onClose={function () { return setShowConfigPanel(false); }} users={users.map(function (u) { return ({
                id: u.id,
                nom: u.lastName,
                prenom: u.firstName,
                role: u.role === 'MAR' ? 'MAR' : u.role === 'IADE' ? 'IADE' : 'SURGEON',
            }); })} surgeons={users
                .filter(function (u) { return u.role === 'SURGEON'; })
                .map(function (s) { return ({
                id: s.id,
                nom: s.lastName,
                prenom: s.firstName,
                specialite: s.specialty || '',
            }); })} rooms={rooms.map(function (r) { return ({
                id: r.id,
                name: r.name,
                sector: r.sector,
                order: r.order,
            }); })} onSaveRoomOrder={handleSaveRoomOrder}/>)}

            {/* Styles pour la vue compacte */}
            <style jsx global>{"\n                .scale-compact {\n                    transform-origin: top left;\n                }\n                .compact-table {\n                    font-size: 0.8rem;\n                }\n                .compact-cell {\n                    padding: 0.25rem 0.5rem !important; \n                }\n                @media (max-width: 1200px) {\n                    .scale-compact {\n                        transform: scale(0.9);\n                        width: 111%;\n                    }\n                }\n                @media (min-width: 1201px) {\n                    .scale-compact {\n                        transform: scale(0.85);\n                        width: 118%;\n                    }\n                }\n            "}</style>
        </motion.div>);
}
