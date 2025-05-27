'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import UserForm from '@/components/UserForm';
// Importer les TYPES depuis le fichier centralisé
import { User, UserFormData, Role, ProfessionalRole, UserRole } from '@/types/user';
import { Skill } from '@/types/skill'; // Assumant que vous créerez ce type
import { UserSkill } from '@/types/userSkill'; // Assumant que vous créerez ce type
import { useAuth } from '@/hooks/useAuth'; // Importer useAuth
import ProtectedRoute from '@/components/ProtectedRoute'; // Importer ProtectedRoute
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { Label } from "@/components/ui/label"; // Import Label
import { useToast } from "@/components/ui/use-toast"; // Ajout pour les notifications
import UserTable from '@/components/users/UserTable'; // Import de notre tableau virtualisé

// Type Role et Interface User déplacés vers src/types/user.ts

// Wrapper pour protéger la page entière
function UsersPageContent() {
    const { user: currentUser, isLoading: authLoading } = useAuth(); // Obtenir l'utilisateur connecté
    const { toast } = useToast(); // Initialisation du toast
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null); // Pour les messages de succès (reset mdp)
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [showInactiveUsers, setShowInactiveUsers] = useState<boolean>(false); // Nouvel état

    const [allSkills, setAllSkills] = useState<Skill[]>([]);
    const [editingUserSkills, setEditingUserSkills] = useState<UserSkill[]>([]);
    const [skillsLoading, setSkillsLoading] = useState<boolean>(false);

    // Référence pour le formulaire
    const formRef = useRef<HTMLFormElement>(null);

    // Déterminer si l'utilisateur actuel peut éditer les rôles (utilisation de la chaîne)
    const canEditRole = currentUser?.role === 'ADMIN_TOTAL';

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await axios.get<User[]>('/api/utilisateurs', {
                params: { includeInactive: showInactiveUsers }
            });
            setUsers(response.data);
        } catch (err) {
            console.error("Erreur fetchUsers:", err);
            if (axios.isAxiosError(err) && err.response?.status !== 401) { // Ne pas afficher l'erreur 401 du middleware ici
                setError(`Erreur ${err.response?.status || 'inconnue'}: ${err.response?.data?.message || 'Impossible de récupérer les utilisateurs'}`);
            } else if (!axios.isAxiosError(err)) {
                setError('Une erreur inattendue est survenue');
            }
        } finally {
            setLoading(false);
        }
    }, [showInactiveUsers]);

    // Fetch all available skills
    const fetchAllSkills = useCallback(async () => {
        try {
            const response = await axios.get<Skill[]>('/api/skills');
            setAllSkills(response.data);
        } catch (err) {
            console.error("Erreur fetchAllSkills:", err);
            toast({ title: "Erreur", description: "Impossible de charger la liste des compétences.", variant: "destructive" });
        }
    }, [toast]);

    // Fetch skills for the user being edited
    const fetchUserSkills = useCallback(async (userId: string) => {
        if (!userId) {
            setEditingUserSkills([]);
            return;
        }
        setSkillsLoading(true);
        try {
            const response = await axios.get<UserSkill[]>(`/api/utilisateurs/${userId}/skills`);
            setEditingUserSkills(response.data);
        } catch (err) {
            console.error(`Erreur fetchUserSkills pour ${userId}:`, err);
            toast({ title: "Erreur", description: "Impossible de charger les compétences de l'utilisateur.", variant: "destructive" });
            setEditingUserSkills([]); // Réinitialiser en cas d'erreur
        }
        setSkillsLoading(false);
    }, [toast]);

    useEffect(() => {
        if (!authLoading && currentUser) {
            fetchUsers();
            fetchAllSkills(); // Charger toutes les compétences au montage
        }
    }, [fetchUsers, fetchAllSkills, authLoading, currentUser]);

    useEffect(() => {
        if (editingUser && editingUser.id) {
            fetchUserSkills(editingUser.id);
        } else {
            setEditingUserSkills([]); // Vider si pas d'utilisateur en édition
        }
    }, [editingUser, fetchUserSkills]);

    // --- Effet pour scroller vers le formulaire --- 
    useEffect(() => {
        if (editingUser && formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Ajusté à 'center'
        }
        // Scroller aussi quand on ouvre le formulaire de création
        if (isCreating && formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [editingUser, isCreating]); // Déclencher quand on sélectionne un user ou qu'on crée

    const handleApiResponse = (data: User | { id: string }, isDelete = false) => {
        if (isDelete) {
            const deletedUserId = (data as { id: string }).id;
            setUsers(prevUsers => prevUsers.filter(user => user.id !== deletedUserId));
        } else {
            const updatedUser = data as User;
            setUsers(prevUsers => {
                const existingIndex = prevUsers.findIndex(u => u.id === updatedUser.id);
                if (existingIndex > -1) {
                    const newUsers = [...prevUsers];
                    newUsers[existingIndex] = updatedUser;
                    return newUsers;
                } else {
                    return [...prevUsers, updatedUser];
                }
            });
        }
        setEditingUser(null);
        setIsCreating(false);
        setActionLoading(null);
        setError(null); // Clear error on success
        setSuccessMessage(null); // Clear success message
    };

    const handleCreateUser = async (formData: UserFormData, selectedSkills: string[] = []) => {
        setActionLoading('creating');
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await axios.post<User>('/api/utilisateurs', formData);
            const newUser = response.data;

            // Si des compétences sont sélectionnées, les assigner au nouvel utilisateur
            if (selectedSkills.length > 0) {
                try {
                    // Assigner chaque compétence sélectionnée
                    for (const skillId of selectedSkills) {
                        await axios.post(`/api/utilisateurs/${newUser.id}/skills`, { skillId });
                    }
                    toast({ title: "Succès", description: `${selectedSkills.length} compétence(s) assignée(s) à l'utilisateur.` });
                } catch (err) {
                    console.error("Erreur lors de l'assignation des compétences:", err);
                    toast({
                        title: "Attention",
                        description: "L'utilisateur a été créé mais une erreur est survenue lors de l'assignation des compétences.",
                        variant: "destructive"
                    });
                }
            }

            handleApiResponse(newUser);
        } catch (err: any) {
            setActionLoading(null);
            if (axios.isAxiosError(err) && err.response) {
                throw new Error(err.response.data.message || 'Erreur lors de la création');
            } else {
                throw new Error('Une erreur inattendue est survenue');
            }
        }
    };

    const handleUpdateUser = async (formData: UserFormData, selectedSkills: string[] = []) => {
        if (!editingUser) return;
        const userId = editingUser.id;
        setActionLoading(userId);
        setError(null);
        try {
            // Mettre à jour les infos principales de l'utilisateur
            const response = await axios.put<User>(`/api/utilisateurs/${userId}`, formData);
            const updatedUser = response.data;

            // Gérer la synchronisation des compétences
            try {
                // Récupérer les IDs des compétences actuellement assignées
                const currentSkillsResponse = await axios.get<UserSkill[]>(`/api/utilisateurs/${userId}/skills`);
                const currentSkillIds = currentSkillsResponse.data.map(us => us.skillId);

                // Déterminer les compétences à ajouter et à supprimer
                const skillsToAdd = selectedSkills.filter(id => !currentSkillIds.includes(id));
                const skillsToRemove = currentSkillIds.filter(id => !selectedSkills.includes(id));

                // Ajouter les nouvelles compétences
                for (const skillId of skillsToAdd) {
                    await axios.post(`/api/utilisateurs/${userId}/skills`, { skillId });
                }

                // Supprimer les compétences non sélectionnées
                for (const skillId of skillsToRemove) {
                    await axios.delete(`/api/utilisateurs/${userId}/skills/${skillId}`);
                }

                if (skillsToAdd.length > 0 || skillsToRemove.length > 0) {
                    toast({
                        title: "Succès",
                        description: `${skillsToAdd.length} compétence(s) ajoutée(s) et ${skillsToRemove.length} retirée(s).`
                    });
                }
            } catch (err) {
                console.error("Erreur lors de la synchronisation des compétences:", err);
                toast({
                    title: "Attention",
                    description: "L'utilisateur a été mis à jour mais une erreur est survenue lors de la synchronisation des compétences.",
                    variant: "destructive"
                });
            }

            handleApiResponse(updatedUser);
        } catch (err: any) {
            console.error("Erreur handleUpdateUser:", err);
            setActionLoading(null);
            if (axios.isAxiosError(err) && err.response) {
                throw new Error(err.response.data.message || 'Erreur lors de la modification');
            } else {
                throw new Error('Une erreur inattendue est survenue');
            }
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
        setActionLoading(userId);
        setError(null);
        try {
            await axios.delete(`/api/utilisateurs/${userId}`);
            handleApiResponse({ id: userId }, true);
        } catch (err: any) {
            console.error("Erreur handleDeleteUser:", err);
            setActionLoading(null);
            const message = (axios.isAxiosError(err) && err.response?.data?.message) || 'Erreur lors de la suppression';
            setError(message);
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleResetPassword = async (userId: string) => {
        if (!window.confirm('Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet utilisateur ? Son nouveau mot de passe sera son login.')) return;
        setActionLoading(userId); // Indicate loading state for this specific user
        setError(null);
        setSuccessMessage(null);
        try {
            // Utilisation de la nouvelle route spécifique
            await axios.put(`/api/utilisateurs/${userId}/reset-password`);
            setSuccessMessage(`Mot de passe de l'utilisateur ${userId} réinitialisé avec succès (nouveau mot de passe = login).`);
            // Optionnel: rafraîchir les données ou juste retirer le message après un délai
            setTimeout(() => setSuccessMessage(null), 7000);
        } catch (err: any) {
            console.error("Erreur handleResetPassword:", err);
            const message = (axios.isAxiosError(err) && err.response?.data?.message) || 'Erreur lors de la réinitialisation du mot de passe';
            setError(message);
            setTimeout(() => setError(null), 5000);
        } finally {
            setActionLoading(null); // Clear loading state regardless of outcome
        }
    };

    const openCreateForm = () => {
        setEditingUser(null);
        setIsCreating(true);
    };
    const openEditForm = (user: User) => {
        setIsCreating(false);
        setEditingUser(user);
    };
    const handleCancelForm = () => {
        setEditingUser(null);
        setIsCreating(false);
    };
    const showForm = isCreating || editingUser !== null;

    const getRoleBadgeColor = (role: UserRole | string) => {
        // Convertir UserRole (enum) en string si nécessaire
        const roleString = Object.values(UserRole).includes(role as UserRole) ? role as string : role;

        switch (roleString) {
            case 'ADMIN_TOTAL': return 'bg-red-100 text-red-800';
            case 'ADMIN_PARTIEL': return 'bg-yellow-100 text-yellow-800';
            case 'USER': return 'bg-blue-100 text-blue-800';
            // Gérer les autres cas de UserRole si nécessaire ou retourner une couleur par défaut
            case UserRole.ADMIN: return 'bg-red-200 text-red-900'; // Exemple pour UserRole.ADMIN
            case UserRole.MANAGER: return 'bg-yellow-200 text-yellow-900'; // Exemple pour UserRole.MANAGER
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="container mx-auto px-4 py-4 max-w-7xl min-h-screen"
        >
            {/* Titre et bouton de création */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
                <button
                    onClick={openCreateForm}
                    className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${isCreating || editingUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isCreating || !!editingUser}
                >
                    Nouvel Utilisateur
                </button>
            </div>

            {/* Gestion des erreurs et messages de succès */}
            {successMessage && (
                <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded flex items-start">
                    <div className="flex-1">
                        <p className="font-medium">Succès !</p>
                        <p>{successMessage}</p>
                    </div>
                    <button onClick={() => setSuccessMessage(null)} className="text-green-500 hover:text-green-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Formulaire d'édition/création */}
            {(isCreating || editingUser) && (
                <div className="mb-6">
                    <UserForm
                        ref={formRef}
                        initialData={editingUser || undefined}
                        allSkills={allSkills}
                        userSkills={editingUserSkills}
                        skillsLoading={skillsLoading}
                        onSubmit={isCreating ? handleCreateUser : handleUpdateUser}
                        onCancel={handleCancelForm}
                        isLoading={actionLoading !== null}
                        canEditRole={canEditRole}
                    />
                </div>
            )}

            {/* Liste des utilisateurs */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                {loading && (
                    <div className="p-8 text-center">
                        <p className="text-gray-600">Chargement des utilisateurs...</p>
                    </div>
                )}

                {error && (
                    <div className="p-8 text-center">
                        <p className="text-red-600 font-medium">{error}</p>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50/50">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Liste des utilisateurs ({users.length})
                            </h2>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="showInactiveUsers"
                                    checked={showInactiveUsers}
                                    onCheckedChange={(checked) => setShowInactiveUsers(Boolean(checked))}
                                    className="border-gray-300 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <Label htmlFor="showInactiveUsers" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Afficher les inactifs
                                </Label>
                            </div>
                        </div>

                        {users.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-500">Aucun utilisateur trouvé.</p>
                            </div>
                        ) : (
                            <div className="p-4">
                                <UserTable
                                    users={users}
                                    onEditUser={openEditForm}
                                    onDeleteUser={handleDeleteUser}
                                    onResetPassword={handleResetPassword}
                                    currentUserRole={currentUser?.role}
                                    currentUserId={currentUser?.id}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </motion.div>
    );
}

// --- COMPOSANT EXPORTÉ PAR DÉFAUT (qui gère la protection) ---
export default function ProtectedUsersPage() {
    // Définir les rôles autorisés (chaînes de caractères)
    const allowedRoles: Role[] = ['ADMIN_TOTAL', 'ADMIN_PARTIEL'];

    return (
        <ProtectedRoute allowedRoles={allowedRoles}>
            <UsersPageContent />
        </ProtectedRoute>
    );
}
