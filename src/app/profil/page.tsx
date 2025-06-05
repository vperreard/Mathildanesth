'use client';

import { useState, useEffect } from 'react';
import { logger } from "../../lib/logger";
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserSkill } from '@/types/userSkill';

function ProfilePageContent() {
    const { user } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // États pour gérer la visibilité des mots de passe
    const [currentPasswordType, setCurrentPasswordType] = useState('password');
    const [newPasswordType, setNewPasswordType] = useState('password');
    const [confirmPasswordType, setConfirmPasswordType] = useState('password');

    // Nouvel état pour les compétences
    const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
    const [loadingSkills, setLoadingSkills] = useState(false);
    const [skillsError, setSkillsError] = useState<string | null>(null);

    useEffect(() => {
        // Fonction pour charger les compétences de l'utilisateur
        const fetchUserSkills = async () => {
            if (!user) return;

            setLoadingSkills(true);
            setSkillsError(null);
            try {
                const response = await axios.get<UserSkill[]>(`${window.location.origin}/api/me/skills`);
                setUserSkills(response.data);
            } catch (err: unknown) {
                logger.error('Erreur lors du chargement des compétences:', err);
                setSkillsError('Impossible de charger vos compétences.');
            } finally {
                setLoadingSkills(false);
            }
        };

        fetchUserSkills();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('Tous les champs sont requis.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Le nouveau mot de passe et sa confirmation ne correspondent pas.');
            return;
        }
        if (newPassword.length < 6) {
            setError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
            return;
        }

        setIsLoading(true);
        try {
            await axios.put('http://localhost:3000/api/auth/change-password', {
                currentPassword,
                newPassword
            });
            setSuccessMessage('Mot de passe mis à jour avec succès !');
            // Vider les champs après succès
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setSuccessMessage(null), 5000);

        } catch (err: unknown) {
            logger.error("Erreur changement mot de passe:", err);
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.message || 'Erreur lors de la mise à jour du mot de passe.');
            } else {
                setError('Une erreur inattendue est survenue.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null; // Devrait être géré par ProtectedRoute

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                <h1 className="text-3xl font-bold mb-6">Mon Profil</h1>

                {/* Affichage des informations utilisateur (lecture seule) */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100 mb-8 space-y-3">
                    <h2 className="text-xl font-semibold mb-3">Informations</h2>
                    <p><span className="font-medium text-gray-600">Nom:</span> {user.prenom} {user.nom}</p>
                    <p><span className="font-medium text-gray-600">Login:</span> {user.login}</p>
                    <p><span className="font-medium text-gray-600">Email:</span> {user.email}</p>
                    <p><span className="font-medium text-gray-600">Rôle d'accès:</span> {user.role}</p>
                    <p><span className="font-medium text-gray-600">Rôle Professionnel:</span> {user.professionalRole}</p>
                </div>

                {/* Nouvelle section - Affichage des compétences */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Mes Compétences</h2>

                    {loadingSkills ? (
                        <p className="text-gray-500">Chargement de vos compétences...</p>
                    ) : skillsError ? (
                        <div className="p-3 bg-red-50 text-red-600 rounded-md">
                            {skillsError}
                        </div>
                    ) : userSkills.length === 0 ? (
                        <p className="text-gray-500 italic">
                            Aucune compétence n'est associée à votre profil pour le moment.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {userSkills.map((userSkill) => (
                                <div
                                    key={userSkill.id}
                                    className="flex items-center p-2 bg-primary-50 border border-primary-100 rounded-md text-primary-700"
                                >
                                    <span className="inline-block w-2 h-2 rounded-full bg-primary-500 mr-2"></span>
                                    <div>
                                        <span className="font-medium">{userSkill.skill.name}</span>
                                        {userSkill.skill.description && (
                                            <p className="text-xs text-gray-600 mt-1">{userSkill.skill.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Message si changement de mot de passe requis */}
                {user.mustChangePassword && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
                        <p className="font-semibold">Action requise :</p>
                        <p>Pour des raisons de sécurité, veuillez définir un nouveau mot de passe personnel.</p>
                    </div>
                )}

                {/* Formulaire de changement de mot de passe */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4">Changer le mot de passe</h2>
                    {error && <p className="mb-4 text-center text-red-600 bg-red-50 p-3 rounded-md text-sm">{error}</p>}
                    {successMessage && <p className="mb-4 text-center text-green-600 bg-green-50 p-3 rounded-md text-sm">{successMessage}</p>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Mot de passe actuel</label>
                            <input
                                type={currentPasswordType}
                                id="currentPassword"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                onFocus={() => setCurrentPasswordType('text')}
                                onBlur={() => setCurrentPasswordType('password')}
                                required
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Nouveau mot de passe</label>
                            <input
                                type={newPasswordType}
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                onFocus={() => setNewPasswordType('text')}
                                onBlur={() => setNewPasswordType('password')}
                                required
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirmer le nouveau mot de passe</label>
                            <input
                                type={confirmPasswordType}
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                onFocus={() => setConfirmPasswordType('text')}
                                onBlur={() => setConfirmPasswordType('password')}
                                required
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

export default function ProtectedProfilePage() {
    // Protéger la page, tous les rôles connectés peuvent y accéder
    return (
        <ProtectedRoute>
            <ProfilePageContent />
        </ProtectedRoute>
    );
} 