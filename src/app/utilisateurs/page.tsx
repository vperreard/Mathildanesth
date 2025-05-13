'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import UserForm from '@/components/UserForm';
// Importer les TYPES depuis le fichier centralisé
import { User, UserFormData, Role, ProfessionalRole, UserRole } from '@/types/user';
import { useAuth } from '@/hooks/useAuth'; // Importer useAuth
import ProtectedRoute from '@/components/ProtectedRoute'; // Importer ProtectedRoute
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { Label } from "@/components/ui/label"; // Import Label

// Type Role et Interface User déplacés vers src/types/user.ts

// Wrapper pour protéger la page entière
function UsersPageContent() {
    const { user: currentUser, isLoading: authLoading } = useAuth(); // Obtenir l'utilisateur connecté
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null); // Pour les messages de succès (reset mdp)
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [showInactiveUsers, setShowInactiveUsers] = useState<boolean>(false); // Nouvel état

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

    useEffect(() => {
        if (!authLoading && currentUser) {
            fetchUsers();
        }
    }, [fetchUsers, authLoading, currentUser]);

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

    const handleCreateUser = async (formData: UserFormData) => {
        setActionLoading('creating');
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await axios.post<User>('/api/utilisateurs', formData);
            handleApiResponse(response.data);
        } catch (err: any) {
            setActionLoading(null);
            if (axios.isAxiosError(err) && err.response) {
                throw new Error(err.response.data.message || 'Erreur lors de la création');
            } else {
                throw new Error('Une erreur inattendue est survenue');
            }
        }
    };

    const handleUpdateUser = async (formData: UserFormData) => {
        if (!editingUser) return;
        setActionLoading(editingUser.id);
        setError(null);
        try {
            const response = await axios.put<User>(`/api/utilisateurs/${editingUser.id}`, formData);
            handleApiResponse(response.data);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="mb-8 flex justify-between items-center">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Gestion des utilisateurs</h1>
                    {!showForm && (
                        <button
                            onClick={openCreateForm}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                        >
                            Ajouter un utilisateur
                        </button>
                    )}
                </div>

                {showForm && (
                    <motion.div
                        className="mb-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <UserForm
                            ref={formRef}
                            onSubmit={isCreating ? handleCreateUser : handleUpdateUser}
                            onCancel={handleCancelForm}
                            isLoading={actionLoading === 'creating' || actionLoading === editingUser?.id}
                            initialData={editingUser}
                        />
                    </motion.div>
                )}

                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100">
                    {loading && <p className="text-center text-gray-600 py-4">Chargement des utilisateurs...</p>}
                    {error && <p className="text-center text-red-600 font-medium py-4">{error}</p>}

                    {!loading && !error && (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">Liste des utilisateurs ({users.length})</h2>
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
                                <p className="text-center text-gray-500 py-4">Aucun utilisateur trouvé.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 table-fixed">
                                        <thead className="bg-gray-50/50">
                                            <tr>
                                                <th className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom Complet</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle Accès</th>
                                                <th className="w-36 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {users.map((user) => {
                                                // Déplacer la logique de désactivation ici pour clarté
                                                const isCurrentUser = currentUser?.id === user.id;
                                                const editDisabled = actionLoading !== null || isCurrentUser; // On ne peut pas s'éditer soi-même ou si une autre action est en cours
                                                const deleteDisabled = actionLoading !== null || isCurrentUser || user.role === 'ADMIN_TOTAL'; // On ne peut pas supprimer un admin total ou soi-même
                                                const resetPwdDisabled = actionLoading !== null; // Pas d'autres contraintes spécifiques pour le reset

                                                return (
                                                    <motion.tr
                                                        key={user.id}
                                                        className="hover:bg-gray-50/50"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ duration: 0.3 }}
                                                    >
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {user.id}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {user.prenom} {user.nom}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate" title={user.email}>
                                                            {user.email}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            {/* --- Bouton Editer --- */}
                                                            <button
                                                                onClick={() => openEditForm(user)}
                                                                className="text-indigo-600 hover:text-indigo-900 mr-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:text-gray-400"
                                                                disabled={editDisabled} // Utiliser la logique calculée
                                                                title={editDisabled ? "Action non autorisée" : "Éditer"}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                                            </button>
                                                            {/* --- Bouton Supprimer --- */}
                                                            <button
                                                                onClick={() => handleDeleteUser(user.id.toString())}
                                                                disabled={deleteDisabled} // Utiliser la logique calculée
                                                                className="text-red-600 hover:text-red-800 mr-3 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:text-gray-400"
                                                                title={deleteDisabled ? "Action non autorisée" : "Supprimer"}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                            </button>
                                                            {/* --- Bouton Réinitialiser MDP --- */}
                                                            <button
                                                                onClick={() => handleResetPassword(user.id.toString())}
                                                                disabled={resetPwdDisabled} // Utiliser la logique calculée
                                                                className="text-yellow-600 hover:text-yellow-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:text-gray-400"
                                                                title={resetPwdDisabled ? "Action non autorisée" : "Réinitialiser le mot de passe (au login)"}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M15.75 15.75a.75.75 0 01-.75.75h-6a.75.75 0 010-1.5h4.19l-6.72-6.72a.75.75 0 111.06-1.06l6.72 6.72V10.5a.75.75 0 011.5 0v5.25zm0-11.5a.75.75 0 01-.75.75H4.5a.75.75 0 010-1.5h10.5a.75.75 0 01.75.75zM4.25 4.25a.75.75 0 01.75-.75h6a.75.75 0 010 1.5H5.81l6.72 6.72a.75.75 0 11-1.06 1.06L4.75 5.81v4.19a.75.75 0 01-1.5 0V4.25z" clipRule="evenodd" /></svg>
                                                            </button>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                    {/* Affichage des messages de succès/erreur */}
                    {successMessage && <p className="mt-4 text-center text-green-600 font-medium py-2 bg-green-50 rounded-md">{successMessage}</p>}
                </div>
            </motion.div>
        </div>
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
