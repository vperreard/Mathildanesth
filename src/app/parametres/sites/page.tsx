"use client";

import React, { useState, useEffect } from 'react';
import { logger } from "../../../lib/logger";
import { Plus, Pencil, Trash2, Check, X, ArrowUp, ArrowDown, Info, Users } from 'lucide-react';
import Button from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { apiClient } from '@/utils/apiClient';

interface Site {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    displayOrder?: number;
    colorCode?: string;
    createdAt?: string;
    updatedAt?: string;
}

export default function SitesPage() {
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentSite, setCurrentSite] = useState<Site | null>(null);

    const [newSiteName, setNewSiteName] = useState('');
    const [newSiteDescription, setNewSiteDescription] = useState('');
    const [newSiteColor, setNewSiteColor] = useState('#3B82F6'); // Bleu par défaut

    // Charger les sites au montage du composant
    useEffect(() => {
        fetchSites();
    }, []);

    // Fonction pour récupérer la liste des sites
    const fetchSites = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiClient.get('/api/sites');
            const data = response.data;

            // Trier les sites par ordre d'affichage puis par nom
            const sortedSites = [...data].sort((a, b) => {
                if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
                    return a.displayOrder - b.displayOrder;
                }
                if (a.displayOrder !== undefined) return -1;
                if (b.displayOrder !== undefined) return 1;
                return a.name.localeCompare(b.name);
            });

            setSites(sortedSites);
        } catch (error: unknown) {
            logger.error("Erreur de chargement des sites:", error instanceof Error ? error : new Error(String(error)));
            setError(error instanceof Error ? error.message : "Erreur inconnue lors du chargement des sites");
            toast.error("Impossible de charger les sites");
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour créer un nouveau site
    const handleCreateSite = async () => {
        if (!newSiteName.trim()) {
            toast.error("Le nom du site est requis");
            return;
        }

        try {
            const response = await apiClient.post('/api/sites', {
                name: newSiteName.trim(),
                description: newSiteDescription.trim() || undefined,
                colorCode: newSiteColor || undefined,
                isActive: true,
            });

            const newSite = response.data;

            // Mettre à jour la liste des sites
            setSites(prev => [...prev, newSite].sort((a, b) => a.name.localeCompare(b.name)));

            // Réinitialiser le formulaire et fermer la modal
            setNewSiteName('');
            setNewSiteDescription('');
            setNewSiteColor('#3B82F6');
            setIsCreateModalOpen(false);

            toast.success("Site créé avec succès");
        } catch (error: unknown) {
            logger.error("Erreur lors de la création du site:", error instanceof Error ? error : new Error(String(error)));
            toast.error(error instanceof Error ? error.message : "Erreur lors de la création du site");
        }
    };

    // Fonction pour mettre à jour un site
    const handleUpdateSite = async () => {
        if (!currentSite || !currentSite.name.trim()) {
            toast.error("Le nom du site est requis");
            return;
        }

        try {
            const response = await apiClient.put(`/api/sites/${currentSite.id}`, {
                name: currentSite.name,
                description: currentSite.description || undefined,
                colorCode: currentSite.colorCode || undefined,
                isActive: currentSite.isActive,
            });

            const updatedSite = response.data;

            // Mettre à jour la liste des sites
            setSites(prev =>
                prev.map(site => site.id === updatedSite.id ? updatedSite : site)
                    .sort((a, b) => {
                        if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
                            return a.displayOrder - b.displayOrder;
                        }
                        if (a.displayOrder !== undefined) return -1;
                        if (b.displayOrder !== undefined) return 1;
                        return a.name.localeCompare(b.name);
                    })
            );

            setIsEditModalOpen(false);
            toast.success("Site mis à jour avec succès");
        } catch (error: unknown) {
            logger.error("Erreur lors de la mise à jour du site:", error instanceof Error ? error : new Error(String(error)));
            toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour du site");
        }
    };

    // Fonction pour supprimer un site
    const handleDeleteSite = async () => {
        if (!currentSite) return;

        try {
            await apiClient.delete(`/api/sites/${currentSite.id}`);

            // Mettre à jour la liste des sites
            setSites(prev => prev.filter(site => site.id !== currentSite.id));

            setIsDeleteModalOpen(false);
            toast.success("Site supprimé avec succès");
        } catch (error: unknown) {
            logger.error("Erreur lors de la suppression du site:", error instanceof Error ? error : new Error(String(error)));
            toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression du site");
        }
    };

    // Fonction pour modifier l'ordre d'affichage d'un site
    const handleReorderSite = async (siteId: string, direction: 'up' | 'down') => {
        const siteIndex = sites.findIndex(site => site.id === siteId);
        if (siteIndex === -1) return;

        // Si on monte le premier élément ou on descend le dernier, rien ne se passe
        if ((direction === 'up' && siteIndex === 0) ||
            (direction === 'down' && siteIndex === sites.length - 1)) {
            return;
        }

        const newSites = [...sites];
        const tempSite = newSites[siteIndex];

        if (direction === 'up') {
            newSites[siteIndex] = newSites[siteIndex - 1];
            newSites[siteIndex - 1] = tempSite;
        } else {
            newSites[siteIndex] = newSites[siteIndex + 1];
            newSites[siteIndex + 1] = tempSite;
        }

        // Mettre à jour les displayOrder
        const updatedSites = newSites.map((site, index) => ({
            ...site,
            displayOrder: index
        }));

        setSites(updatedSites);

        // Envoyer la nouvelle ordre au serveur
        try {
            await apiClient.post('/api/sites/reorder', {
                siteOrders: updatedSites.map((site, index) => ({
                    id: site.id,
                    displayOrder: index
                }))
            });

            // Pas besoin de mettre à jour la liste des sites car déjà fait avec setSites
        } catch (error: unknown) {
            logger.error("Erreur lors de la réorganisation des sites:", error instanceof Error ? error : new Error(String(error)));
            toast.error("Erreur lors de la mise à jour de l'ordre des sites");
            // Recharger les sites en cas d'erreur
            fetchSites();
        }
    };

    // Ouvrir la modal d'édition avec les données du site sélectionné
    const openEditModal = (site: Site) => {
        setCurrentSite({ ...site });
        setIsEditModalOpen(true);
    };

    // Ouvrir la modal de suppression avec le site sélectionné
    const openDeleteModal = (site: Site) => {
        setCurrentSite(site);
        setIsDeleteModalOpen(true);
    };

    if (loading) {
        return (
            <div className="p-8 flex justify-center">
                <div className="animate-pulse text-lg">Chargement des sites...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Info className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">
                                {error}
                            </p>
                        </div>
                    </div>
                </div>
                <Button onClick={fetchSites}>Réessayer</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gestion des sites</h1>
                <div className="flex gap-3">
                    <Link href="/admin/site-assignments">
                        <Button variant="outline" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>Gérer les affectations</span>
                        </Button>
                    </Link>
                    <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span>Ajouter un site</span>
                    </Button>
                </div>
            </div>

            {/* Liste des sites */}
            {sites.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">Aucun site n'a encore été créé</p>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        Créer votre premier site
                    </Button>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ordre
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nom
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Couleur
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sites.map((site, index) => (
                                    <tr key={site.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center space-x-1">
                                                <span>{index + 1}</span>
                                                <div className="flex flex-col">
                                                    <button
                                                        onClick={() => handleReorderSite(site.id, 'up')}
                                                        disabled={index === 0}
                                                        className={`p-0.5 ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
                                                    >
                                                        <ArrowUp className="h-3 w-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReorderSite(site.id, 'down')}
                                                        disabled={index === sites.length - 1}
                                                        className={`p-0.5 ${index === sites.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
                                                    >
                                                        <ArrowDown className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {site.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {site.description || <span className="text-gray-400 italic">Non définie</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${site.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {site.isActive ? 'Actif' : 'Inactif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {site.colorCode ? (
                                                <div className="flex items-center">
                                                    <div
                                                        className="h-4 w-4 rounded-full mr-2"
                                                        style={{ backgroundColor: site.colorCode }}
                                                    ></div>
                                                    <span className="text-xs text-gray-500">{site.colorCode}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">Non définie</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => openEditModal(site)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(site)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal pour créer un nouveau site */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Créer un nouveau site</DialogTitle>
                        <DialogDescription>
                            Ajoutez un nouveau site d'anesthésie à votre établissement.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label htmlFor="site-name" className="text-sm font-medium">
                                Nom <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="site-name"
                                value={newSiteName}
                                onChange={(e) => setNewSiteName(e.target.value)}
                                className="w-full p-2 border rounded"
                                placeholder="Nom du site"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="site-description" className="text-sm font-medium">
                                Description
                            </label>
                            <textarea
                                id="site-description"
                                value={newSiteDescription}
                                onChange={(e) => setNewSiteDescription(e.target.value)}
                                className="w-full p-2 border rounded"
                                placeholder="Description du site (optionnel)"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="site-color" className="text-sm font-medium">
                                Couleur
                            </label>
                            <div className="flex items-center space-x-2">
                                <input
                                    id="site-color"
                                    type="color"
                                    value={newSiteColor}
                                    onChange={(e) => setNewSiteColor(e.target.value)}
                                    className="p-1 border rounded h-8"
                                />
                                <input
                                    type="text"
                                    value={newSiteColor}
                                    onChange={(e) => setNewSiteColor(e.target.value)}
                                    className="flex-grow p-2 border rounded"
                                    placeholder="#RRGGBB"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleCreateSite}
                            disabled={!newSiteName.trim()}
                        >
                            Créer le site
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal pour éditer un site existant */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Modifier le site</DialogTitle>
                        <DialogDescription>
                            Modifiez les informations du site sélectionné.
                        </DialogDescription>
                    </DialogHeader>
                    {currentSite && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label htmlFor="edit-site-name" className="text-sm font-medium">
                                    Nom <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="edit-site-name"
                                    value={currentSite.name}
                                    onChange={(e) => setCurrentSite({ ...currentSite, name: e.target.value })}
                                    className="w-full p-2 border rounded"
                                    placeholder="Nom du site"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="edit-site-description" className="text-sm font-medium">
                                    Description
                                </label>
                                <textarea
                                    id="edit-site-description"
                                    value={currentSite.description || ''}
                                    onChange={(e) => setCurrentSite({ ...currentSite, description: e.target.value })}
                                    className="w-full p-2 border rounded"
                                    placeholder="Description du site (optionnel)"
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="edit-site-color" className="text-sm font-medium">
                                    Couleur
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        id="edit-site-color"
                                        type="color"
                                        value={currentSite.colorCode || '#3B82F6'}
                                        onChange={(e) => setCurrentSite({ ...currentSite, colorCode: e.target.value })}
                                        className="p-1 border rounded h-8"
                                    />
                                    <input
                                        type="text"
                                        value={currentSite.colorCode || ''}
                                        onChange={(e) => setCurrentSite({ ...currentSite, colorCode: e.target.value })}
                                        className="flex-grow p-2 border rounded"
                                        placeholder="#RRGGBB"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="edit-site-status" className="text-sm font-medium">
                                    Statut
                                </label>
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            checked={currentSite.isActive}
                                            onChange={() => setCurrentSite({ ...currentSite, isActive: true })}
                                            className="mr-2"
                                        />
                                        <span>Actif</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            checked={!currentSite.isActive}
                                            onChange={() => setCurrentSite({ ...currentSite, isActive: false })}
                                            className="mr-2"
                                        />
                                        <span>Inactif</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditModalOpen(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleUpdateSite}
                            disabled={!currentSite || !currentSite.name.trim()}
                        >
                            Enregistrer les modifications
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal pour confirmer la suppression */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirmer la suppression</DialogTitle>
                        <DialogDescription>
                            Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-700">
                            Êtes-vous sûr de vouloir supprimer le site <strong>{currentSite?.name}</strong> ?
                        </p>
                        <p className="text-sm text-red-600 mt-2">
                            Cette action est irréversible et pourrait affecter les éléments liés à ce site.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteSite}
                        >
                            Supprimer définitivement
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 