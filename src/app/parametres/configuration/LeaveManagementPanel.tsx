'use client';

import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Tab } from '@headlessui/react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTheme } from '@/context/ThemeContext';
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
    const { theme } = useTheme();
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
        <div className={`leave-management-panel p-1 ${theme === 'dark' ? 'bg-slate-850' : 'bg-gray-50'}`}>
            <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
                <Tab.List className="flex space-x-1 rounded-xl bg-primary-500/20 dark:bg-slate-700 p-1 mb-6 shadow">
                    {['Règles Générales des Congés', 'Soldes Individuels des Congés'].map((category) => (
                        <Tab as={Fragment} key={category}>
                            {({ selected }) => (
                                <button
                                    className={`
                                        w-full rounded-lg py-2.5 px-4 text-sm font-medium leading-5 
                                        ring-white ring-opacity-60 ring-offset-2 ring-offset-primary-400 focus:outline-none focus:ring-2
                                        transition-all duration-200 ease-in-out
                                        ${selected
                                            ? 'bg-white dark:bg-primary-600 text-primary-700 dark:text-white shadow-md'
                                            : 'text-primary-200 hover:bg-white/[0.2] hover:text-white dark:text-slate-300 dark:hover:bg-slate-600 dark:hover:text-slate-100'
                                        }`}
                                >
                                    {category}
                                </button>
                            )}
                        </Tab>
                    ))}
                </Tab.List>
                <Tab.Panels className="mt-2">
                    <Tab.Panel className="focus:outline-none">
                        {/* Contenu pour Règles Générales */}
                        <Card className="dark:bg-slate-800 dark:border-slate-700">
                            <CardHeader className="dark:border-slate-700">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="dark:text-slate-100">Règles Générales des Congés</CardTitle>
                                    <Button onClick={handleAddRule} size="sm" className="dark:bg-primary-600 dark:hover:bg-primary-700 dark:text-white">
                                        <PlusIcon className="mr-2 h-4 w-4" />
                                        Ajouter une Règle
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoadingRules && <p className="text-center py-4 text-gray-500 dark:text-slate-400">Chargement...</p>}
                                {rulesError && <p className="text-center py-4 text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30 rounded-md">{rulesError}</p>}
                                {!isLoadingRules && !rulesError && (
                                    <Table className="dark:border-slate-700">
                                        <TableHeader className="dark:border-slate-600">
                                            <TableRow className="dark:border-slate-600">
                                                <TableHead className="dark:text-slate-300">Rôle Professionnel</TableHead>
                                                <TableHead className="dark:text-slate-300 text-center">Congés Annuels (j)</TableHead>
                                                <TableHead className="dark:text-slate-300 text-center">Max Jours Consécutifs</TableHead>
                                                <TableHead className="dark:text-slate-300 text-center">Statut</TableHead>
                                                <TableHead className="dark:text-slate-300 text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {leaveRules.map((rule) => (
                                                <TableRow key={rule.id} className="dark:border-slate-700 hover:dark:bg-slate-700/50">
                                                    <TableCell className="font-medium dark:text-slate-200">{professionalRoleOptions.find(opt => opt.value === rule.professionalRole)?.label || rule.professionalRole}</TableCell>
                                                    <TableCell className="text-center dark:text-slate-200">{rule.annualLeaveCount}</TableCell>
                                                    <TableCell className="text-center dark:text-slate-200">{rule.maxConsecutiveDays}</TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${rule.isActive ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-200' : 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-200'}`}>
                                                            {rule.isActive ? 'Actif' : 'Inactif'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button onClick={() => handleEditRule(rule)} variant="secondary" size="sm" className="mr-2 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500 dark:border-slate-500">
                                                            <PencilIcon className="h-4 w-4" />
                                                        </Button>
                                                        <Button onClick={() => handleDeleteRule(rule.id)} variant="danger" size="sm" className="dark:bg-red-700 dark:text-red-200 dark:hover:bg-red-600 dark:border-red-600">
                                                            <TrashIcon className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </Tab.Panel>
                    <Tab.Panel className="focus:outline-none">
                        {/* Contenu pour Soldes Individuels */}
                        <Card className="dark:bg-slate-800 dark:border-slate-700">
                            <CardHeader className="dark:border-slate-700">
                                <CardTitle className="dark:text-slate-100">Soldes Individuels des Congés</CardTitle>
                                <div className="mt-4">
                                    <Input
                                        type="search"
                                        placeholder="Rechercher un utilisateur (nom, rôle)..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="max-w-sm dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:placeholder-slate-400"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoadingUserLeaves && <p className="text-center py-4 text-gray-500 dark:text-slate-400">Chargement...</p>}
                                {userLeavesError && <p className="text-center py-4 text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30 rounded-md">{userLeavesError}</p>}
                                {!isLoadingUserLeaves && !userLeavesError && (
                                    <Table className="dark:border-slate-700">
                                        <TableHeader className="dark:border-slate-600">
                                            <TableRow className="dark:border-slate-600">
                                                <TableHead className="dark:text-slate-300">Utilisateur</TableHead>
                                                <TableHead className="dark:text-slate-300">Rôle</TableHead>
                                                <TableHead className="dark:text-slate-300 text-center">Congés Annuels (Rest./Total)</TableHead>
                                                <TableHead className="dark:text-slate-300 text-center">Congés Récup. (Rest./Total)</TableHead>
                                                <TableHead className="dark:text-slate-300 text-center">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredUsers.map((userLeave) => (
                                                <TableRow key={userLeave.id} className="dark:border-slate-700 hover:dark:bg-slate-700/50">
                                                    <TableCell className="font-medium dark:text-slate-200">{userLeave.userName}</TableCell>
                                                    <TableCell className="dark:text-slate-300">{professionalRoleOptions.find(opt => opt.value === userLeave.userRole)?.label || userLeave.userRole}</TableCell>
                                                    <TableCell className="text-center dark:text-slate-200">{userLeave.annualLeavesRemaining} / {userLeave.annualLeavesTotal}</TableCell>
                                                    <TableCell className="text-center dark:text-slate-200">{userLeave.recoveryLeavesRemaining} / {userLeave.recoveryLeavesTotal}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Button onClick={() => handleOpenAdjustment(userLeave)} variant="outline" size="sm" className="dark:bg-sky-600 dark:hover:bg-sky-500 dark:text-white dark:border-sky-500">
                                                            <UserPlusIcon className="h-4 w-4 mr-1" /> Ajuster Solde
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </Tab.Panel>
                </Tab.Panels>
            </Tab.Group>

            {/* Modale pour Règles de Congés */}
            {isRulesModalOpen && (
                <Dialog open={isRulesModalOpen} onOpenChange={setIsRulesModalOpen}>
                    <DialogContent className="sm:max-w-[425px] dark:bg-slate-800 dark:border-slate-700">
                        <DialogHeader>
                            <DialogTitle className="dark:text-slate-100">{isEditingRule !== null ? 'Modifier la Règle' : 'Ajouter une Règle'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleRulesSubmit} className="space-y-4 py-4">
                            <div>
                                <label htmlFor="professionalRole" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Rôle Professionnel</label>
                                <select
                                    id="professionalRole"
                                    name="professionalRole"
                                    value={rulesFormData.professionalRole}
                                    onChange={handleRulesInputChange}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                    disabled={isEditingRule !== null}
                                >
                                    {professionalRoleOptions.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="annualLeaveCount" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Nombre de jours de congés annuels</label>
                                <Input
                                    type="number"
                                    id="annualLeaveCount"
                                    name="annualLeaveCount"
                                    value={rulesFormData.annualLeaveCount}
                                    onChange={handleRulesInputChange}
                                    className="mt-1 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"
                                    min={0}
                                />
                            </div>
                            <div>
                                <label htmlFor="maxConsecutiveDays" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Nombre max. de jours consécutifs</label>
                                <Input
                                    type="number"
                                    id="maxConsecutiveDays"
                                    name="maxConsecutiveDays"
                                    value={rulesFormData.maxConsecutiveDays}
                                    onChange={handleRulesInputChange}
                                    className="mt-1 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"
                                    min={0}
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isActiveRule"
                                    name="isActive"
                                    checked={rulesFormData.isActive}
                                    onChange={handleRulesInputChange}
                                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:border-slate-500 dark:focus:ring-primary-400 dark:text-primary-400 dark:checked:bg-primary-400"
                                />
                                <label htmlFor="isActiveRule" className="ml-2 block text-sm text-gray-900 dark:text-slate-200">Règle active</label>
                            </div>
                            <DialogFooter className="mt-6">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline" className="dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700 dark:hover:border-slate-500">Annuler</Button>
                                </DialogClose>
                                <Button type="submit" className="dark:bg-primary-600 dark:hover:bg-primary-700 dark:text-white">Enregistrer</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            {/* Modale pour Ajustement de Solde Utilisateur */}
            {isAdjustmentModalOpen && selectedUser && (
                <Dialog open={isAdjustmentModalOpen} onOpenChange={setIsAdjustmentModalOpen}>
                    <DialogContent className="sm:max-w-md dark:bg-slate-800 dark:border-slate-700">
                        <DialogHeader>
                            <DialogTitle className="dark:text-slate-100">Ajuster le Solde de {selectedUser.userName}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAdjustmentSubmit} className="space-y-4 py-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Type de congé</label>
                                <select
                                    name="leaveType"
                                    value={adjustmentFormData.leaveType}
                                    onChange={handleAdjustmentInputChange}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                >
                                    <option value="annual">Congés Annuels</option>
                                    <option value="recovery">Congés de Récupération</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Type d'ajustement</label>
                                <select
                                    name="adjustmentType"
                                    value={adjustmentFormData.adjustmentType}
                                    onChange={handleAdjustmentInputChange}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                >
                                    <option value="add">Ajouter des jours</option>
                                    <option value="remove">Retirer des jours</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="numberOfDays" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Nombre de jours</label>
                                <Input
                                    type="number"
                                    id="numberOfDays"
                                    name="numberOfDays"
                                    value={adjustmentFormData.numberOfDays}
                                    onChange={handleAdjustmentInputChange}
                                    className="mt-1 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"
                                    min={1}
                                />
                            </div>
                            <div>
                                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Raison de l'ajustement</label>
                                <textarea
                                    id="reason"
                                    name="reason"
                                    rows={3}
                                    value={adjustmentFormData.reason}
                                    onChange={handleAdjustmentInputChange}
                                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                />
                            </div>
                            <DialogFooter className="mt-6">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline" className="dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700 dark:hover:border-slate-500">Annuler</Button>
                                </DialogClose>
                                <Button type="submit" className="dark:bg-primary-600 dark:hover:bg-primary-700 dark:text-white">Appliquer l'Ajustement</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default LeaveManagementPanel; 