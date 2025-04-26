'use client';

import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Tab } from '@headlessui/react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    Input,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose
} from "@/components/ui";
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CheckIcon,
    XMarkIcon,
    UserPlusIcon,
    UserMinusIcon
} from '@heroicons/react/24/outline';
import { UserIcon } from 'lucide-react';
import { ProfessionalRole } from '@prisma/client';

// Types pour les règles de congés
type LeaveRules = {
    id: number;
    professionalRole: ProfessionalRole;
    annualLeaveCount: number;
    maxConsecutiveDays: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

// Types pour les données personnalisées de congés par utilisateur
type UserLeaveData = {
    id: number;
    userId: number;
    userName: string;
    userRole: ProfessionalRole;
    annualLeavesTotal: number;
    annualLeavesUsed: number;
    annualLeavesRemaining: number;
    recoveryLeavesTotal: number;
    recoveryLeavesUsed: number;
    recoveryLeavesRemaining: number;
    isActive: boolean;
};

// Type pour le formulaire de règles de congés
type LeaveRulesFormData = {
    professionalRole: ProfessionalRole;
    annualLeaveCount: number;
    maxConsecutiveDays: number;
    isActive: boolean;
};

// Type pour le formulaire d'ajustement de congés utilisateur
type LeaveAdjustmentFormData = {
    userId: number;
    leaveType: 'annual' | 'recovery';
    adjustmentType: 'add' | 'remove';
    numberOfDays: number;
    reason: string;
};

const LeaveManagementPanel: React.FC = () => {
    const { user, isLoading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState(0);

    // États pour les règles de congés
    const [leaveRules, setLeaveRules] = useState<LeaveRules[]>([]);
    const [isLoadingRules, setIsLoadingRules] = useState(true);
    const [rulesError, setRulesError] = useState<string | null>(null);

    // États pour les congés des utilisateurs
    const [userLeaves, setUserLeaves] = useState<UserLeaveData[]>([]);
    const [isLoadingUserLeaves, setIsLoadingUserLeaves] = useState(true);
    const [userLeavesError, setUserLeavesError] = useState<string | null>(null);
    const [filteredUsers, setFilteredUsers] = useState<UserLeaveData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // États pour les formulaires et modales
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [isEditingRule, setIsEditingRule] = useState<number | null>(null);
    const [rulesFormData, setRulesFormData] = useState<LeaveRulesFormData>({
        professionalRole: ProfessionalRole.MAR,
        annualLeaveCount: 25,
        maxConsecutiveDays: 15,
        isActive: true
    });

    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserLeaveData | null>(null);
    const [adjustmentFormData, setAdjustmentFormData] = useState<LeaveAdjustmentFormData>({
        userId: 0,
        leaveType: 'annual',
        adjustmentType: 'add',
        numberOfDays: 1,
        reason: ''
    });

    // Options pour les rôles professionnels
    const professionalRoleOptions = [
        { value: ProfessionalRole.MAR, label: 'Médecin Anesthésiste Réanimateur' },
        { value: ProfessionalRole.IADE, label: 'Infirmier Anesthésiste' },
        { value: ProfessionalRole.SECRETAIRE, label: 'Secrétaire' }
    ];

    // Chargement des règles de congés
    const fetchLeaveRules = useCallback(async () => {
        setIsLoadingRules(true);
        setRulesError(null);
        try {
            // Simuler la récupération des données depuis une API
            // À remplacer par votre appel API réel
            // const response = await axios.get('/api/leave-rules');
            // setLeaveRules(response.data);

            // Données simulées pour l'exemple
            setTimeout(() => {
                const mockRules = [
                    {
                        id: 1,
                        professionalRole: ProfessionalRole.MAR,
                        annualLeaveCount: 25,
                        maxConsecutiveDays: 15,
                        isActive: true,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    },
                    {
                        id: 2,
                        professionalRole: ProfessionalRole.IADE,
                        annualLeaveCount: 25,
                        maxConsecutiveDays: 15,
                        isActive: true,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    },
                    {
                        id: 3,
                        professionalRole: ProfessionalRole.SECRETAIRE,
                        annualLeaveCount: 25,
                        maxConsecutiveDays: 10,
                        isActive: true,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                ];
                setLeaveRules(mockRules);
                setIsLoadingRules(false);
            }, 500);
        } catch (error: any) {
            console.error("Erreur lors du chargement des règles de congés:", error);
            setRulesError(error.message || "Impossible de charger les règles de congés");
            setIsLoadingRules(false);
        }
    }, []);

    // Chargement des données de congés par utilisateur
    const fetchUserLeaves = useCallback(async () => {
        setIsLoadingUserLeaves(true);
        setUserLeavesError(null);
        try {
            // Simuler la récupération des données depuis une API
            // À remplacer par votre appel API réel
            // const response = await axios.get('/api/user-leaves');
            // setUserLeaves(response.data);

            // Données simulées pour l'exemple
            setTimeout(() => {
                const mockUserLeaves = [
                    {
                        id: 1,
                        userId: 101,
                        userName: "Dupont Marie",
                        userRole: ProfessionalRole.MAR,
                        annualLeavesTotal: 25,
                        annualLeavesUsed: 10,
                        annualLeavesRemaining: 15,
                        recoveryLeavesTotal: 5,
                        recoveryLeavesUsed: 2,
                        recoveryLeavesRemaining: 3,
                        isActive: true
                    },
                    {
                        id: 2,
                        userId: 102,
                        userName: "Martin Pierre",
                        userRole: ProfessionalRole.IADE,
                        annualLeavesTotal: 25,
                        annualLeavesUsed: 15,
                        annualLeavesRemaining: 10,
                        recoveryLeavesTotal: 8,
                        recoveryLeavesUsed: 3,
                        recoveryLeavesRemaining: 5,
                        isActive: true
                    },
                    {
                        id: 3,
                        userId: 103,
                        userName: "Bernard Sophie",
                        userRole: ProfessionalRole.SECRETAIRE,
                        annualLeavesTotal: 25,
                        annualLeavesUsed: 20,
                        annualLeavesRemaining: 5,
                        recoveryLeavesTotal: 3,
                        recoveryLeavesUsed: 0,
                        recoveryLeavesRemaining: 3,
                        isActive: true
                    }
                ];
                setUserLeaves(mockUserLeaves);
                setFilteredUsers(mockUserLeaves);
                setIsLoadingUserLeaves(false);
            }, 500);
        } catch (error: any) {
            console.error("Erreur lors du chargement des congés utilisateurs:", error);
            setUserLeavesError(error.message || "Impossible de charger les données de congés des utilisateurs");
            setIsLoadingUserLeaves(false);
        }
    }, []);

    // Chargement initial des données
    useEffect(() => {
        fetchLeaveRules();
        fetchUserLeaves();
    }, [fetchLeaveRules, fetchUserLeaves]);

    // Filtrage des utilisateurs en fonction du terme de recherche
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredUsers(userLeaves);
        } else {
            const lowercasedFilter = searchTerm.toLowerCase();
            const filtered = userLeaves.filter(user =>
                user.userName.toLowerCase().includes(lowercasedFilter) ||
                user.userRole.toLowerCase().includes(lowercasedFilter)
            );
            setFilteredUsers(filtered);
        }
    }, [searchTerm, userLeaves]);

    // Gestion du changement de formulaire pour les règles
    const handleRulesInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const newValue = type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : type === 'number'
                ? parseInt(value)
                : value;

        setRulesFormData(prev => ({
            ...prev,
            [name]: newValue
        }));
    };

    // Gestion du changement de formulaire pour les ajustements
    const handleAdjustmentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const newValue = type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : type === 'number'
                ? parseInt(value)
                : value;

        setAdjustmentFormData(prev => ({
            ...prev,
            [name]: newValue
        }));
    };

    // Ouverture du formulaire pour ajouter une règle
    const handleAddRule = () => {
        setIsEditingRule(null);
        setRulesFormData({
            professionalRole: ProfessionalRole.MAR,
            annualLeaveCount: 25,
            maxConsecutiveDays: 15,
            isActive: true
        });
        setIsRulesModalOpen(true);
    };

    // Ouverture du formulaire pour modifier une règle
    const handleEditRule = (rule: LeaveRules) => {
        setIsEditingRule(rule.id);
        setRulesFormData({
            professionalRole: rule.professionalRole,
            annualLeaveCount: rule.annualLeaveCount,
            maxConsecutiveDays: rule.maxConsecutiveDays,
            isActive: rule.isActive
        });
        setIsRulesModalOpen(true);
    };

    // Soumission du formulaire de règles
    const handleRulesSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Simuler l'envoi de données à l'API
            // À remplacer par votre appel API réel
            console.log('Données du formulaire à envoyer:', isEditingRule ? 'MODIFICATION' : 'AJOUT', rulesFormData);

            // Mise à jour locale pour démo
            if (isEditingRule) {
                // Modifier une règle existante
                setLeaveRules(prev =>
                    prev.map(rule =>
                        rule.id === isEditingRule
                            ? {
                                ...rule,
                                ...rulesFormData,
                                updatedAt: new Date().toISOString()
                            }
                            : rule
                    )
                );
                toast.success('Règle de congés mise à jour avec succès');
            } else {
                // Ajouter une nouvelle règle
                const newRule = {
                    id: Math.max(0, ...leaveRules.map(r => r.id)) + 1,
                    ...rulesFormData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                setLeaveRules(prev => [...prev, newRule]);
                toast.success('Règle de congés ajoutée avec succès');
            }

            // Fermer le formulaire
            setIsRulesModalOpen(false);
            setIsEditingRule(null);
        } catch (error: any) {
            console.error("Erreur lors de l'enregistrement de la règle:", error);
            toast.error(error.message || "Erreur lors de l'enregistrement");
        }
    };

    // Suppression d'une règle
    const handleDeleteRule = async (id: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette règle de congés ?')) {
            return;
        }

        try {
            // Simuler l'appel API pour la suppression
            // À remplacer par votre appel API réel
            console.log('Suppression de la règle ID:', id);

            // Mise à jour locale pour démo
            setLeaveRules(prev => prev.filter(rule => rule.id !== id));
            toast.success('Règle de congés supprimée avec succès');
        } catch (error: any) {
            console.error("Erreur lors de la suppression de la règle:", error);
            toast.error(error.message || "Erreur lors de la suppression");
        }
    };

    // Ouverture du formulaire d'ajustement de congés
    const handleOpenAdjustment = (user: UserLeaveData) => {
        setSelectedUser(user);
        setAdjustmentFormData({
            userId: user.userId,
            leaveType: 'annual',
            adjustmentType: 'add',
            numberOfDays: 1,
            reason: ''
        });
        setIsAdjustmentModalOpen(true);
    };

    // Soumission du formulaire d'ajustement
    const handleAdjustmentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedUser) return;

        try {
            // Simuler l'envoi de données à l'API
            // À remplacer par votre appel API réel
            console.log('Ajustement de congés à envoyer:', adjustmentFormData);

            // Mise à jour locale pour démo
            const { leaveType, adjustmentType, numberOfDays } = adjustmentFormData;

            setUserLeaves(prev =>
                prev.map(user => {
                    if (user.userId === selectedUser.userId) {
                        if (leaveType === 'annual') {
                            const newRemaining = adjustmentType === 'add'
                                ? user.annualLeavesRemaining + numberOfDays
                                : user.annualLeavesRemaining - numberOfDays;

                            return {
                                ...user,
                                annualLeavesTotal: adjustmentType === 'add'
                                    ? user.annualLeavesTotal + numberOfDays
                                    : user.annualLeavesTotal,
                                annualLeavesRemaining: newRemaining >= 0 ? newRemaining : 0
                            };
                        } else { // recovery
                            const newRemaining = adjustmentType === 'add'
                                ? user.recoveryLeavesRemaining + numberOfDays
                                : user.recoveryLeavesRemaining - numberOfDays;

                            return {
                                ...user,
                                recoveryLeavesTotal: adjustmentType === 'add'
                                    ? user.recoveryLeavesTotal + numberOfDays
                                    : user.recoveryLeavesTotal,
                                recoveryLeavesRemaining: newRemaining >= 0 ? newRemaining : 0
                            };
                        }
                    }
                    return user;
                })
            );

            const actionType = adjustmentFormData.adjustmentType === 'add' ? 'ajoutés' : 'retirés';
            const leaveTypeLabel = adjustmentFormData.leaveType === 'annual' ? 'congés annuels' : 'récupérations';

            toast.success(`${numberOfDays} jour(s) de ${leaveTypeLabel} ${actionType} avec succès`);

            // Fermer le formulaire
            setIsAdjustmentModalOpen(false);
            setSelectedUser(null);
        } catch (error: any) {
            console.error("Erreur lors de l'ajustement des congés:", error);
            toast.error(error.message || "Erreur lors de l'ajustement");
        }
    };

    // Vérifications d'authentification et de rôle
    if (authLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mt-4">
                <div className="text-center text-red-500">
                    <p>Vous devez être connecté pour accéder à cette page.</p>
                </div>
            </div>
        );
    }

    if (user.role !== 'ADMIN_TOTAL' && user.role !== 'ADMIN_PARTIEL') {
        return (
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mt-4">
                <div className="text-center text-red-500">
                    <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Gestion des Congés Annuels</h2>

            <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
                <Tab.List className="flex p-1 space-x-1 bg-gray-100 rounded-xl mb-6">
                    <Tab as={Fragment}>
                        {({ selected }) => (
                            <button
                                className={`w-full py-2.5 text-sm font-medium rounded-lg focus:outline-none ${selected
                                    ? 'bg-white text-blue-700 shadow'
                                    : 'text-gray-600 hover:bg-white/[0.25] hover:text-blue-700'
                                    }`}
                            >
                                Règles des Congés
                            </button>
                        )}
                    </Tab>
                    <Tab as={Fragment}>
                        {({ selected }) => (
                            <button
                                className={`w-full py-2.5 text-sm font-medium rounded-lg focus:outline-none ${selected
                                    ? 'bg-white text-blue-700 shadow'
                                    : 'text-gray-600 hover:bg-white/[0.25] hover:text-blue-700'
                                    }`}
                            >
                                Congés par Personnel
                            </button>
                        )}
                    </Tab>
                </Tab.List>

                <Tab.Panels>
                    {/* Onglet des règles de congés */}
                    <Tab.Panel>
                        <div className="mb-4 flex justify-between items-center">
                            <h3 className="text-lg font-medium">Configuration des règles de congés par type de personnel</h3>
                            <Button onClick={handleAddRule} className="flex items-center">
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Ajouter une règle
                            </Button>
                        </div>

                        {isLoadingRules ? (
                            <p className="text-center py-4">Chargement des règles de congés...</p>
                        ) : rulesError ? (
                            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                                <p className="text-red-700">{rulesError}</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type de Personnel</TableHead>
                                        <TableHead>Congés Annuels (jours)</TableHead>
                                        <TableHead>Jours consécutifs max.</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leaveRules.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-4">
                                                Aucune règle de congés configurée.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        leaveRules.map(rule => (
                                            <TableRow key={rule.id}>
                                                <TableCell>
                                                    {professionalRoleOptions.find(opt => opt.value === rule.professionalRole)?.label || rule.professionalRole}
                                                </TableCell>
                                                <TableCell>{rule.annualLeaveCount}</TableCell>
                                                <TableCell>{rule.maxConsecutiveDays}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rule.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {rule.isActive ? 'Actif' : 'Inactif'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        onClick={() => handleEditRule(rule)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="mr-2"
                                                    >
                                                        <PencilIcon className="h-4 w-4 mr-1" />
                                                        Modifier
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDeleteRule(rule.id)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <TrashIcon className="h-4 w-4 mr-1" />
                                                        Supprimer
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </Tab.Panel>

                    {/* Onglet de gestion personnalisée des congés */}
                    <Tab.Panel>
                        <div className="mb-4">
                            <h3 className="text-lg font-medium mb-4">Gestion des congés par personnel</h3>
                            <div className="mb-4">
                                <Input
                                    placeholder="Rechercher un personnel..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="max-w-md"
                                />
                            </div>
                        </div>

                        {isLoadingUserLeaves ? (
                            <p className="text-center py-4">Chargement des données de congés...</p>
                        ) : userLeavesError ? (
                            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                                <p className="text-red-700">{userLeavesError}</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Personnel</TableHead>
                                        <TableHead>Fonction</TableHead>
                                        <TableHead className="text-center">Congés Annuels</TableHead>
                                        <TableHead className="text-center">Récupérations</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-4">
                                                {searchTerm ? 'Aucun résultat trouvé.' : 'Aucune donnée de congés disponible.'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredUsers.map(user => (
                                            <TableRow key={user.id}>
                                                <TableCell>{user.userName}</TableCell>
                                                <TableCell>
                                                    {professionalRoleOptions.find(opt => opt.value === user.userRole)?.label || user.userRole}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div>
                                                        <span className="font-semibold">{user.annualLeavesRemaining}</span> / {user.annualLeavesTotal} jours restants
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        ({user.annualLeavesUsed} jours posés)
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div>
                                                        <span className="font-semibold">{user.recoveryLeavesRemaining}</span> / {user.recoveryLeavesTotal} jours restants
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        ({user.recoveryLeavesUsed} jours posés)
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        onClick={() => handleOpenAdjustment(user)}
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <PencilIcon className="h-4 w-4 mr-1" />
                                                        Ajuster
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </Tab.Panel>
                </Tab.Panels>
            </Tab.Group>

            {/* Modal pour ajouter/modifier une règle de congés */}
            <Dialog open={isRulesModalOpen} onOpenChange={setIsRulesModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditingRule ? 'Modifier la règle de congés' : 'Ajouter une règle de congés'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleRulesSubmit} className="space-y-4 mt-4">
                        <div>
                            <label htmlFor="professionalRole" className="block text-sm font-medium text-gray-700 mb-1">
                                Type de Personnel
                            </label>
                            <select
                                id="professionalRole"
                                name="professionalRole"
                                value={rulesFormData.professionalRole}
                                onChange={handleRulesInputChange}
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                            >
                                {professionalRoleOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="annualLeaveCount" className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre de jours de congés annuels
                            </label>
                            <input
                                type="number"
                                id="annualLeaveCount"
                                name="annualLeaveCount"
                                min="0"
                                max="50"
                                value={rulesFormData.annualLeaveCount}
                                onChange={handleRulesInputChange}
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                            />
                        </div>

                        <div>
                            <label htmlFor="maxConsecutiveDays" className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre maximum de jours consécutifs
                            </label>
                            <input
                                type="number"
                                id="maxConsecutiveDays"
                                name="maxConsecutiveDays"
                                min="1"
                                max="30"
                                value={rulesFormData.maxConsecutiveDays}
                                onChange={handleRulesInputChange}
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isActive"
                                name="isActive"
                                checked={rulesFormData.isActive}
                                onChange={handleRulesInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                                Règle active
                            </label>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Annuler
                                </Button>
                            </DialogClose>
                            <Button type="submit">
                                {isEditingRule ? 'Enregistrer' : 'Ajouter'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal pour ajuster les congés d'un utilisateur */}
            <Dialog open={isAdjustmentModalOpen} onOpenChange={setIsAdjustmentModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            Ajustement des congés - {selectedUser?.userName}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleAdjustmentSubmit} className="space-y-4 mt-4">
                        <div>
                            <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-1">
                                Type de congé
                            </label>
                            <select
                                id="leaveType"
                                name="leaveType"
                                value={adjustmentFormData.leaveType}
                                onChange={handleAdjustmentInputChange}
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                            >
                                <option value="annual">Congés annuels</option>
                                <option value="recovery">Récupérations</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="adjustmentType" className="block text-sm font-medium text-gray-700 mb-1">
                                Type d'ajustement
                            </label>
                            <select
                                id="adjustmentType"
                                name="adjustmentType"
                                value={adjustmentFormData.adjustmentType}
                                onChange={handleAdjustmentInputChange}
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                            >
                                <option value="add">Ajouter des jours</option>
                                <option value="remove">Retirer des jours</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="numberOfDays" className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre de jours
                            </label>
                            <input
                                type="number"
                                id="numberOfDays"
                                name="numberOfDays"
                                min="1"
                                max="30"
                                value={adjustmentFormData.numberOfDays}
                                onChange={handleAdjustmentInputChange}
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                            />
                        </div>

                        <div>
                            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                                Motif de l'ajustement
                            </label>
                            <textarea
                                id="reason"
                                name="reason"
                                rows={3}
                                value={adjustmentFormData.reason}
                                onChange={handleAdjustmentInputChange}
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                                placeholder="Motif de l'ajustement..."
                            />
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Annuler
                                </Button>
                            </DialogClose>
                            <Button type="submit">
                                Confirmer l'ajustement
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LeaveManagementPanel; 