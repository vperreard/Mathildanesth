'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ProfessionalRole } from '@prisma/client';
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
    TrashIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

// Type pour les rôles professionnels
type ProfessionalRoleData = {
    id: string;
    code: ProfessionalRole;
    label: string;
    description: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

const ProfessionalRoleManagementPanel: React.FC = () => {
    const { user, isLoading: authLoading } = useAuth();
    const [roles, setRoles] = useState<ProfessionalRoleData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<ProfessionalRoleData>>({
        code: ProfessionalRole.MAR,
        label: '',
        description: '',
        isActive: true
    });

    // Chargement des rôles
    const fetchRoles = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/admin/professional-roles');
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des rôles professionnels');
            }
            const data = await response.json();
            setRoles(data);
        } catch (error: any) {
            console.error("Erreur lors du chargement des rôles:", error);
            setError(error.message || "Impossible de charger les rôles professionnels");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    // Gestion du formulaire
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: newValue }));
    };

    // Ouverture du formulaire pour ajouter un rôle
    const handleAddRole = () => {
        setIsEditing(null);
        setFormData({
            code: ProfessionalRole.MAR,
            label: '',
            description: '',
            isActive: true
        });
        setIsModalOpen(true);
    };

    // Ouverture du formulaire pour modifier un rôle
    const handleEditRole = (role: ProfessionalRoleData) => {
        setIsEditing(role.id);
        setFormData(role);
        setIsModalOpen(true);
    };

    // Soumission du formulaire
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/admin/professional-roles', {
                method: isEditing ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de l\'enregistrement du rôle');
            }

            const data = await response.json();
            if (isEditing) {
                setRoles(prev =>
                    prev.map(role =>
                        role.id === isEditing
                            ? { ...role, ...data }
                            : role
                    )
                );
                toast.success('Rôle professionnel mis à jour avec succès');
            } else {
                setRoles(prev => [...prev, data]);
                toast.success('Rôle professionnel ajouté avec succès');
            }

            setIsModalOpen(false);
            setIsEditing(null);
        } catch (error: any) {
            console.error("Erreur lors de l'enregistrement du rôle:", error);
            toast.error(error.message || "Erreur lors de l'enregistrement");
        }
    };

    // Suppression d'un rôle
    const handleDeleteRole = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce rôle professionnel ?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/professional-roles/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la suppression du rôle');
            }

            setRoles(prev => prev.filter(role => role.id !== id));
            toast.success('Rôle professionnel supprimé avec succès');
        } catch (error: any) {
            console.error("Erreur lors de la suppression du rôle:", error);
            toast.error(error.message || "Erreur lors de la suppression");
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

    if (user.role !== 'ADMIN_TOTAL') {
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
            <h2 className="text-2xl font-bold mb-6">Gestion des Rôles Professionnels</h2>

            <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-medium">Configuration des rôles professionnels</h3>
                <Button onClick={handleAddRole} className="flex items-center">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Ajouter un rôle
                </Button>
            </div>

            {isLoading ? (
                <p className="text-center py-4">Chargement des rôles professionnels...</p>
            ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                    <p className="text-red-700">{error}</p>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Libellé</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-4">
                                    Aucun rôle professionnel configuré.
                                </TableCell>
                            </TableRow>
                        ) : (
                            roles.map(role => (
                                <TableRow key={role.id}>
                                    <TableCell>{role.code}</TableCell>
                                    <TableCell>{role.label}</TableCell>
                                    <TableCell>{role.description}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${role.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {role.isActive ? 'Actif' : 'Inactif'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            onClick={() => handleEditRole(role)}
                                            variant="outline"
                                            size="sm"
                                            className="mr-2"
                                        >
                                            <PencilIcon className="h-4 w-4 mr-1" />
                                            Modifier
                                        </Button>
                                        <Button
                                            onClick={() => handleDeleteRole(role.id)}
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

            {/* Modal pour ajouter/modifier un rôle */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing ? 'Modifier le rôle professionnel' : 'Ajouter un rôle professionnel'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                                Code
                            </label>
                            <select
                                id="code"
                                name="code"
                                value={formData.code}
                                onChange={handleInputChange}
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                            >
                                {Object.values(ProfessionalRole).map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
                                Libellé
                            </label>
                            <input
                                type="text"
                                id="label"
                                name="label"
                                value={formData.label}
                                onChange={handleInputChange}
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isActive"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                                Rôle actif
                            </label>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Annuler
                                </Button>
                            </DialogClose>
                            <Button type="submit">
                                {isEditing ? 'Enregistrer' : 'Ajouter'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProfessionalRoleManagementPanel; 