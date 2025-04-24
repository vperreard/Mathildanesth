"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, CardContent, Switch } from "@/components/ui";
import { Save, Trash2, Plus, Filter, Eye, Layout, Type, MoveVertical } from "lucide-react";
import {
    CheckIcon,
    PlusIcon,
    TrashIcon,
    ArrowPathIcon,
    TagIcon,
    BookmarkIcon,
    StarIcon,
    StarIcon as StarSolidIcon,
} from '@heroicons/react/24/outline';

// Types
type Room = {
    id: string;
    name: string;
    sector: string;
    selected: boolean;
};

type Role = 'surgeon' | 'MAR' | 'IADE';

type Personnel = {
    id: string;
    firstName: string;
    lastName: string;
    role: Role;
    specialty?: string;
    alias?: string;
    selected: boolean;
};

type ConfigPreset = {
    id: string;
    name: string;
    isDefault: boolean;
    settings: DisplaySettings;
    selectedRooms: string[];
    selectedPersonnel: string[];
};

type FontStyle = 'normal' | 'bold' | 'italic' | 'boldItalic';
type NameFormat = 'fullName' | 'firstNameOnly' | 'lastNameOnly' | 'alias';

type RoleStyle = {
    nameFormat: NameFormat;
    fontStyle: FontStyle;
    fontSize: number;
    badgeColor: string;
};

type DisplaySettings = {
    nameFormat: NameFormat;
    fontStyle: FontStyle;
    fontSize: number;
    compactView: boolean;
    showSpecialty: boolean;
    showRole: boolean;
    roleStyles: {
        surgeon: RoleStyle;
        MAR: RoleStyle;
        IADE: RoleStyle;
    };
    visibleRoles: {
        surgeon: boolean;
        MAR: boolean;
        IADE: boolean;
    };
};

const defaultDisplaySettings: DisplaySettings = {
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
const badgeColorOptions = [
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
const getBadgeColorLabel = (colorValue: string) => {
    const option = badgeColorOptions.find(opt => opt.value === colorValue);
    return option ? option.label : 'Couleur personnalisée';
};

const WeeklyPlanningConfigPanel: React.FC = () => {
    // États
    const [rooms, setRooms] = useState<Room[]>([]);
    const [personnel, setPersonnel] = useState<Personnel[]>([]);
    const [presets, setPresets] = useState<ConfigPreset[]>([]);
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
    const [newPresetName, setNewPresetName] = useState("");
    const [isCreatingPreset, setIsCreatingPreset] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'presets' | 'display'>('presets');

    // État pour les paramètres d'affichage
    const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
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
    });

    // Filtres
    const [roomFilter, setRoomFilter] = useState("");
    const [personnelFilter, setPersonnelFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState<string | null>(null);

    // États pour la recherche
    const [roomSearchQuery, setRoomSearchQuery] = useState('');
    const [personnelSearchQuery, setPersonnelSearchQuery] = useState('');

    // État pour le traitement
    const [saveMessage, setSaveMessage] = useState('');

    // Effet pour charger les données (simulées pour l'instant)
    useEffect(() => {
        // Dans un cas réel, ces données proviendraient d'une API
        const mockRooms: Room[] = [
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

        const mockPersonnel: Personnel[] = [
            { id: "1", firstName: "Jean", lastName: "Dupont", role: "surgeon", selected: true, specialty: "Orthopédie", alias: "JD" },
            { id: "2", firstName: "Marie", lastName: "Laurent", role: "surgeon", selected: true, specialty: "Cardiologie", alias: "MM" },
            { id: "3", firstName: "Sophie", lastName: "Martin", role: "surgeon", selected: true, specialty: "Neurologie", alias: "SM" },
            { id: "4", firstName: "Paul", lastName: "Petit", role: "MAR", selected: true, alias: "PB" },
            { id: "5", firstName: "Claire", lastName: "Dubois", role: "MAR", selected: true, alias: "CD" },
            { id: "6", firstName: "Thomas", lastName: "Leroy", role: "IADE", selected: true, alias: "TL" },
            { id: "7", firstName: "Laure", lastName: "Garnier", role: "IADE", selected: true, alias: "LG" },
        ];

        const mockPresets: ConfigPreset[] = [
            {
                id: "1",
                name: "Tous les blocs",
                isDefault: true,
                settings: defaultDisplaySettings,
                selectedRooms: mockRooms.map(r => r.id),
                selectedPersonnel: mockPersonnel.map(p => p.id),
            },
            {
                id: "2",
                name: "Bloc Hyperaseptique",
                isDefault: false,
                settings: {
                    ...defaultDisplaySettings,
                    compactView: true,
                    nameFormat: 'alias',
                    showSpecialty: false,
                },
                selectedRooms: mockRooms.filter(r => r.sector === "HYPERASEPTIQUE").map(r => r.id),
                selectedPersonnel: mockPersonnel.map(p => p.id),
            },
            {
                id: "3",
                name: "Secteur 5-8",
                isDefault: false,
                settings: {
                    ...defaultDisplaySettings,
                    nameFormat: 'alias',
                    fontStyle: 'bold',
                },
                selectedRooms: mockRooms.filter(r => r.sector === "SECTEUR_5_8").map(r => r.id),
                selectedPersonnel: mockPersonnel.map(p => p.id),
            },
        ];

        setRooms(mockRooms);
        setPersonnel(mockPersonnel);
        setPresets(mockPresets);

        // Sélectionner le preset par défaut et charger ses paramètres d'affichage
        const defaultPreset = mockPresets.find(p => p.isDefault) || mockPresets[0];
        if (defaultPreset) {
            setSelectedPreset(defaultPreset.id);
            setDisplaySettings(defaultPreset.settings);
        }
    }, []);

    // Fonction pour filtrer les salles
    const filteredRooms = rooms.filter(room => {
        return room.name.toLowerCase().includes(roomFilter.toLowerCase()) ||
            room.sector.toLowerCase().includes(roomFilter.toLowerCase());
    });

    // Fonction pour filtrer le personnel
    const filteredPersonnel = personnel.filter(person => {
        const nameMatch = `${person.firstName} ${person.lastName}`.toLowerCase().includes(personnelFilter.toLowerCase());
        const roleMatch = roleFilter ? person.role === roleFilter : true;
        return nameMatch && roleMatch;
    });

    // Fonction pour cocher/décocher une salle
    const toggleRoomSelection = (roomId: string) => {
        if (!selectedPreset) return;

        const currentRoomIds = [...presets.find(p => p.id === selectedPreset)?.selectedRooms || []];

        // Si la liste est vide (tout est sélectionné), on ajoute toutes les salles sauf celle-ci
        if (currentRoomIds.length === 0) {
            const allRoomsExceptThis = rooms.filter(r => r.id !== roomId).map(r => r.id);
            setPresets(presets.map(p => ({
                ...p,
                selectedRooms: allRoomsExceptThis
            })));
            return;
        }

        // Si cette salle est déjà dans la liste, on la retire
        if (currentRoomIds.includes(roomId)) {
            // Si après suppression il ne reste qu'une seule salle, on passe à la sélection de toutes les salles
            if (currentRoomIds.length === 1) {
                setPresets(presets.map(p => ({
                    ...p,
                    selectedRooms: []
                })));
            } else {
                setPresets(presets.map(p => ({
                    ...p,
                    selectedRooms: currentRoomIds.filter(id => id !== roomId)
                })));
            }
        } else {
            // Sinon on l'ajoute
            setPresets(presets.map(p => ({
                ...p,
                selectedRooms: [...currentRoomIds, roomId]
            })));
        }
    };

    // Fonction pour cocher/décocher tout le personnel
    const toggleAllRooms = (checked: boolean) => {
        setRooms(rooms.map(room => ({ ...room, selected: checked })));
    };

    // Fonction pour sélectionner/désélectionner un membre du personnel
    const togglePersonnelSelection = (personnelId: string) => {
        if (!selectedPreset) return;

        const currentPersonnelIds = [...presets.find(p => p.id === selectedPreset)?.selectedPersonnel || []];

        // Si la liste est vide (tout est sélectionné), on ajoute tous les personnels sauf celui-ci
        if (currentPersonnelIds.length === 0) {
            const allPersonnelExceptThis = personnel.filter(p => p.id !== personnelId).map(p => p.id);
            setPresets(presets.map(p => ({
                ...p,
                selectedPersonnel: allPersonnelExceptThis
            })));
            return;
        }

        // Si ce personnel est déjà dans la liste, on le retire
        if (currentPersonnelIds.includes(personnelId)) {
            // Si après suppression il ne reste qu'un seul personnel, on passe à la sélection de tout le personnel
            if (currentPersonnelIds.length === 1) {
                setPresets(presets.map(p => ({
                    ...p,
                    selectedPersonnel: []
                })));
            } else {
                setPresets(presets.map(p => ({
                    ...p,
                    selectedPersonnel: currentPersonnelIds.filter(id => id !== personnelId)
                })));
            }
        } else {
            // Sinon on l'ajoute
            setPresets(presets.map(p => ({
                ...p,
                selectedPersonnel: [...currentPersonnelIds, personnelId]
            })));
        }
    };

    // Fonction pour cocher/décocher tout le personnel
    const toggleAllPersonnel = (checked: boolean) => {
        setPersonnel(personnel.map(person => ({ ...person, selected: checked })));
    };

    // Fonction pour sélectionner un preset
    const selectPreset = (preset: ConfigPreset) => {
        setSelectedPreset(preset.id);
        setDisplaySettings(preset.settings);
    };

    // Fonction pour créer un nouveau preset
    const createPreset = () => {
        if (!newPresetName.trim()) return;

        const newPreset: ConfigPreset = {
            id: Date.now().toString(),
            name: newPresetName,
            isDefault: false,
            settings: displaySettings,
            selectedRooms: rooms.filter(r => r.selected).map(r => r.id),
            selectedPersonnel: personnel.filter(p => p.selected).map(p => p.id),
        };

        setPresets([...presets, newPreset]);
        setSelectedPreset(newPreset.id);
        setNewPresetName("");
        setIsCreatingPreset(false);
    };

    // Fonction pour définir un preset comme défaut
    const setPresetAsDefault = (presetId: string) => {
        setPresets(presets.map(preset => ({
            ...preset,
            isDefault: preset.id === presetId
        })));
    };

    // Fonction pour supprimer un preset
    const deletePreset = (presetId: string) => {
        const filteredPresets = presets.filter(p => p.id !== presetId);
        setPresets(filteredPresets);

        if (selectedPreset === presetId) {
            const defaultPreset = filteredPresets.find(p => p.isDefault && p.id !== presetId);
            if (defaultPreset) {
                setSelectedPreset(defaultPreset.id);
                setDisplaySettings(defaultPreset.settings);
            } else if (filteredPresets.length > 1) {
                const remainingPreset = filteredPresets.find(p => p.id !== presetId);
                if (remainingPreset) {
                    setSelectedPreset(remainingPreset.id);
                    setDisplaySettings(remainingPreset.settings);
                }
            } else {
                setSelectedPreset(null);
                setDisplaySettings(defaultDisplaySettings);
            }
        }
    };

    // Fonction pour mettre à jour les paramètres d'affichage
    const updateDisplaySetting = <K extends keyof DisplaySettings>(
        setting: K,
        value: DisplaySettings[K]
    ) => {
        setDisplaySettings(prev => ({
            ...prev,
            [setting]: value
        }));

        // Si un preset est sélectionné, mettre à jour ses paramètres d'affichage
        if (selectedPreset) {
            setPresets(presets.map(preset =>
                preset.id === selectedPreset
                    ? {
                        ...preset,
                        settings: {
                            ...preset.settings,
                            [setting]: value
                        }
                    }
                    : preset
            ));
        }
    };

    // Fonction pour sauvegarder les modifications
    const saveChanges = async () => {
        if (!selectedPreset) return;

        setIsSaving(true);
        setSaveMessage('');

        try {
            // Simuler un appel API avec un délai
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mettre à jour les presets avec les modifications
            const updatedPresets = presets.map(preset =>
                preset.id === selectedPreset ? {
                    ...preset,
                    settings: displaySettings,
                    selectedRooms: presets.find(p => p.id === selectedPreset)?.selectedRooms || [],
                    selectedPersonnel: presets.find(p => p.id === selectedPreset)?.selectedPersonnel || []
                } : preset
            );

            setPresets(updatedPresets);
            setSaveMessage('Configuration enregistrée avec succès.');

            // Réinitialiser le message après 3 secondes
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            setSaveMessage('Erreur lors de l\'enregistrement. Veuillez réessayer.');
        } finally {
            setIsSaving(false);
        }
    };

    const getPresetById = (id: string | null) => {
        return id ? presets.find(p => p.id === id) : null;
    };

    // Fonction pour formater le nom selon le format choisi (pour l'aperçu)
    const formatName = (person: Personnel, format: NameFormat = displaySettings.nameFormat): string => {
        switch (format) {
            case 'fullName':
                return `${person.firstName} ${person.lastName}`;
            case 'firstNameOnly':
                return person.firstName;
            case 'lastNameOnly':
                return person.lastName;
            case 'alias':
                return person.alias || `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`;
            default:
                return `${person.firstName} ${person.lastName}`;
        }
    };

    // Fonction pour obtenir la classe CSS pour le style de police
    const getFontStyleClass = (style: FontStyle): string => {
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
    const renderDisplayPreview = () => {
        const examplePersons: Record<Role, Personnel> = {
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

        const nameClass = getFontStyleClass(displaySettings.fontStyle);

        return (
            <div className="bg-white p-3 rounded-md shadow">
                <h4 className="text-sm font-medium mb-2">Aperçu:</h4>
                <div className={`space-y-1 ${displaySettings.compactView ? 'text-xs' : 'text-sm'}`}>
                    {displaySettings.visibleRoles.surgeon && (
                        <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span style={{ fontSize: `${displaySettings.roleStyles.surgeon.fontSize}px` }}>
                                <strong>Chirurgien:</strong> {formatName(examplePersons.surgeon, displaySettings.roleStyles.surgeon.nameFormat)}
                            </span>
                            {displaySettings.showSpecialty && <span className="text-gray-500 text-xs">({examplePersons.surgeon.specialty})</span>}
                            {displaySettings.showRole && <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded">Chirurgien</span>}
                        </div>
                    )}
                    {displaySettings.visibleRoles.MAR && (
                        <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span style={{ fontSize: `${displaySettings.roleStyles.MAR.fontSize}px` }}>
                                <strong>MAR:</strong> {formatName(examplePersons.MAR, displaySettings.roleStyles.MAR.nameFormat)}
                            </span>
                            {displaySettings.showRole && <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded">MAR</span>}
                        </div>
                    )}
                    {displaySettings.visibleRoles.IADE && (
                        <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            <span style={{ fontSize: `${displaySettings.roleStyles.IADE.fontSize}px` }}>
                                <strong>IADE:</strong> {formatName(examplePersons.IADE, displaySettings.roleStyles.IADE.nameFormat)}
                            </span>
                            {displaySettings.showRole && <span className="bg-purple-100 text-purple-800 text-xs px-1.5 py-0.5 rounded">IADE</span>}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Ajouter une fonction pour mettre à jour la visibilité des rôles
    const toggleRoleVisibility = (role: keyof DisplaySettings['visibleRoles']) => {
        setDisplaySettings({
            ...displaySettings,
            visibleRoles: {
                ...displaySettings.visibleRoles,
                [role]: !displaySettings.visibleRoles[role]
            }
        });
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Configuration du Planning Hebdomadaire</h1>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setActiveTab('presets')}
                        className={activeTab === 'presets' ? 'bg-gray-100' : ''}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Filtres & Préréglages
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setActiveTab('display')}
                        className={activeTab === 'display' ? 'bg-gray-100' : ''}
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        Affichage
                    </Button>
                    <Button variant="primary" onClick={saveChanges} disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        Enregistrer
                    </Button>
                </div>
            </div>

            {/* Message de succès */}
            {saveMessage && (
                <div className="mb-4 p-2 bg-green-100 text-green-800 rounded border border-green-300">
                    {saveMessage}
                </div>
            )}

            {/* Onglets */}
            {activeTab === 'presets' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Section des préréglages */}
                    <Card className="lg:col-span-1">
                        <CardContent className="p-4">
                            <h2 className="text-lg font-medium mb-4">Préréglages</h2>

                            {/* Liste des préréglages */}
                            <div className="space-y-2 mb-6">
                                {presets.map(preset => (
                                    <div
                                        key={preset.id}
                                        className={`p-3 border rounded-md cursor-pointer flex items-center justify-between ${selectedPreset === preset.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                            }`}
                                        onClick={() => selectPreset(preset)}
                                    >
                                        <div className="flex items-center">
                                            <span className="mr-2">{preset.name}</span>
                                            {preset.isDefault && (
                                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">Par défaut</span>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                className="p-1 text-gray-400 hover:text-blue-500"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPresetAsDefault(preset.id);
                                                }}
                                                disabled={preset.isDefault}
                                                title="Définir comme préréglage par défaut"
                                            >
                                                {preset.isDefault ? <StarSolidIcon className="h-4 w-4 text-yellow-500" /> : <StarIcon className="h-4 w-4" />}
                                            </button>
                                            <button
                                                className="p-1 text-gray-400 hover:text-red-500"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deletePreset(preset.id);
                                                }}
                                                disabled={preset.isDefault || presets.length <= 1}
                                                title="Supprimer ce préréglage"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Bouton pour ajouter un préréglage */}
                            {isCreatingPreset ? (
                                <div className="flex flex-col gap-2">
                                    <input
                                        type="text"
                                        value={newPresetName}
                                        onChange={(e) => setNewPresetName(e.target.value)}
                                        placeholder="Nom du préréglage"
                                        className="p-2 border rounded-md"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsCreatingPreset(false)}
                                            className="flex-1"
                                        >
                                            Annuler
                                        </Button>
                                        <Button
                                            variant="primary"
                                            onClick={createPreset}
                                            className="flex-1"
                                            disabled={!newPresetName.trim()}
                                        >
                                            Créer
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCreatingPreset(true)}
                                    className="w-full"
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Ajouter un préréglage
                                </Button>
                            )}
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
                </div>
            ) : (
                /* Onglet d'affichage */
                <div>
                    {/* ... */}
                </div>
            )}
        </div>
    );
};

export default WeeklyPlanningConfigPanel; 