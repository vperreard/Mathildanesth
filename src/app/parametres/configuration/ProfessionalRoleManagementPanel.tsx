'use client';

import React, { useState, useEffect } from 'react';
import { logger } from "../../../lib/logger";
import { useAuth } from '@/hooks/useAuth';
import { ProfessionalRole } from '@prisma/client';
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
// TODO: Replace with lucide-react icons

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
    const { theme } = useTheme();
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
            const response = await fetch('http://localhost:3000/api/admin/professional-roles');
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des rôles professionnels');
            }
            const data = await response.json();
            setRoles(data);
        } catch (error: unknown) {
            logger.error("Erreur lors du chargement des rôles:", { error: error });
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
            const response = await fetch('http://localhost:3000/api/admin/professional-roles', {
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
        } catch (error: unknown) {
            logger.error("Erreur lors de l'enregistrement du rôle:", { error: error });
            toast.error(error.message || "Erreur lors de l'enregistrement");
        }
    };

    // Suppression d'un rôle
    const handleDeleteRole = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce rôle professionnel ?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/admin/professional-roles/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la suppression du rôle');
            }

            setRoles(prev => prev.filter(role => role.id !== id));
            toast.success('Rôle professionnel supprimé avec succès');
        } catch (error: unknown) {
            logger.error("Erreur lors de la suppression du rôle:", { error: error });
            toast.error(error.message || "Erreur lors de la suppression");
        }
    };

    // Vérifications d'authentification et de rôle
    if (authLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 dark:border-primary-400"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <Card className="mt-4 dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="pt-6">
                    <div className="text-center text-red-500 dark:text-red-400">
                        <p>Vous devez être connecté pour accéder à cette page.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (user.role !== 'ADMIN_TOTAL') {
        return (
            <Card className="mt-4 dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="pt-6">
                    <div className="text-center text-red-500 dark:text-red-400">
                        <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={`professional-roles-panel ${theme === 'dark' ? 'bg-slate-850' : 'bg-gray-50'} p-1 rounded-lg`}>
            <Card className={theme === 'dark' ? "" : "bg-white"}>
                <CardHeader className="dark:border-slate-700">
                    <div className="flex justify-between items-center">
                        <CardTitle className="dark:text-slate-100">Gestion des Rôles Professionnels</CardTitle>
                        <Button
                            onClick={handleAddRole}
                            size="sm"
                            className="dark:bg-primary-600 dark:hover:bg-primary-700 dark:text-white"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Ajouter un rôle
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-center py-4 dark:text-slate-400">Chargement des rôles professionnels...</p>
                    ) : error ? (
                        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 dark:border-red-600 p-4 mb-4">
                            <p className="text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    ) : (
                        <Table className={theme === 'dark' ? "dark:border-slate-700" : "bg-white border border-gray-200"}>
                            <TableHeader className={theme === 'dark' ? "dark:border-slate-600" : "border-b border-gray-200"}>
                                <TableRow className={theme === 'dark' ? "dark:border-slate-600" : "border-b border-gray-200"}>
                                    <TableHead className={theme === 'dark' ? "dark:text-slate-300" : "text-gray-900"}>Code</TableHead>
                                    <TableHead className={theme === 'dark' ? "dark:text-slate-300" : "text-gray-900"}>Libellé</TableHead>
                                    <TableHead className={theme === 'dark' ? "dark:text-slate-300" : "text-gray-900"}>Description</TableHead>
                                    <TableHead className={theme === 'dark' ? "dark:text-slate-300" : "text-gray-900"}>Statut</TableHead>
                                    <TableHead className={theme === 'dark' ? "text-right dark:text-slate-300" : "text-right text-gray-900"}>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roles.length === 0 ? (
                                    <TableRow className={theme === 'dark' ? "dark:border-slate-700" : "border-b border-gray-200"}>
                                        <TableCell colSpan={5} className={theme === 'dark' ? "text-center py-4 dark:text-slate-400" : "text-center py-4 text-gray-600"}>
                                            Aucun rôle professionnel configuré.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    roles.map(role => (
                                        <TableRow key={role.id} className={theme === 'dark' ? "dark:border-slate-700 hover:bg-slate-700/50" : "hover:bg-gray-50"}>
                                            <TableCell className={theme === 'dark' ? "dark:text-slate-200" : "text-gray-900"}>{role.code}</TableCell>
                                            <TableCell className={theme === 'dark' ? "dark:text-slate-200" : "text-gray-900"}>{role.label}</TableCell>
                                            <TableCell className={theme === 'dark' ? "dark:text-slate-300" : "text-gray-600"}>{role.description}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${role.isActive ? (theme === 'dark' ? 'bg-green-700 text-green-200' : 'bg-green-100 text-green-800') : (theme === 'dark' ? 'bg-red-700 text-red-200' : 'bg-red-100 text-red-800')}`}>
                                                    {role.isActive ? 'Actif' : 'Inactif'}
                                                </span>
                                            </TableCell>
                                            <TableCell className={theme === 'dark' ? "text-right dark:text-slate-300" : "text-right text-gray-900"}>
                                                <Button
                                                    onClick={() => handleEditRole(role)}
                                                    variant="outline"
                                                    size="sm"
                                                    className={theme === 'dark' ? "mr-2 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500 dark:border-slate-500" : "mr-2 bg-primary-600 hover:bg-primary-700 text-white"}
                                                >
                                                    <PencilIcon className="h-4 w-4 mr-1" />
                                                    Modifier
                                                </Button>
                                                <Button
                                                    onClick={() => handleDeleteRole(role.id)}
                                                    variant="danger"
                                                    size="sm"
                                                    className={theme === 'dark' ? "dark:bg-red-700 dark:text-red-200 dark:hover:bg-red-600 dark:border-red-600" : "bg-red-700 hover:bg-red-800 text-white"}
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
                </CardContent>
            </Card>

            {isModalOpen && (
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className={theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white"}>
                        <DialogHeader>
                            <DialogTitle className={theme === 'dark' ? "text-slate-100" : "text-gray-900"}>{isEditing ? 'Modifier le rôle' : 'Ajouter un rôle'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div>
                                <label htmlFor="code" className={`block text-sm font-medium ${theme === 'dark' ? "text-slate-300" : "text-gray-700"}`}>Code</label>
                                <select
                                    id="code"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    className={`mt-1 block w-full pl-3 pr-10 py-2 text-base rounded-md focus:outline-none sm:text-sm ${theme === 'dark' ? "bg-slate-700 text-slate-200 border-slate-600 focus:ring-primary-500 focus:border-primary-500" : "border-gray-300 focus:ring-primary-500 focus:border-primary-500"}`}
                                    disabled={!!isEditing}
                                >
                                    {Object.values(ProfessionalRole).map(roleCode => (
                                        <option key={roleCode} value={roleCode}>{roleCode}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="label" className={`block text-sm font-medium ${theme === 'dark' ? "text-slate-300" : "text-gray-700"}`}>Libellé</label>
                                <Input
                                    type="text"
                                    id="label"
                                    name="label"
                                    value={formData.label || ''}
                                    onChange={handleInputChange}
                                    className={`mt-1 ${theme === 'dark' ? "bg-slate-700 text-slate-200 border-slate-600" : "border-gray-300"}`}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="description" className={`block text-sm font-medium ${theme === 'dark' ? "text-slate-300" : "text-gray-700"}`}>Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={3}
                                    value={formData.description || ''}
                                    onChange={handleInputChange}
                                    className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${theme === 'dark' ? "bg-slate-700 text-slate-200 border-slate-600 focus:ring-primary-500 focus:border-primary-500" : "border-gray-300 focus:ring-primary-500 focus:border-primary-500"}`}
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isActiveRole"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                    className={`h-4 w-4 rounded focus:ring-offset-0 ${theme === 'dark' ? "text-primary-400 border-slate-500 focus:ring-primary-400 bg-slate-700" : "text-primary-600 border-gray-300 focus:ring-primary-500"}`}
                                />
                                <label htmlFor="isActiveRole" className={`ml-2 block text-sm ${theme === 'dark' ? "text-slate-200" : "text-gray-900"}`}>Rôle actif</label>
                            </div>
                            <DialogFooter className="mt-6">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline" className={theme === 'dark' ? "text-slate-200 border-slate-600 hover:bg-slate-700 hover:border-slate-500" : "border-gray-300 hover:bg-gray-50"}>Annuler</Button>
                                </DialogClose>
                                <Button type="submit" className={theme === 'dark' ? "bg-primary-600 hover:bg-primary-700 text-white" : "bg-primary-600 hover:bg-primary-700 text-white"}>Enregistrer</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default ProfessionalRoleManagementPanel; 