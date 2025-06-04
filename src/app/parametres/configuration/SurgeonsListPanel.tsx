'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
// Pas besoin de Link ici car nous sommes dans un panneau, pas une page séparée
// import Link from 'next/link';
import { Users, Trash2, Edit, PlusCircle, Filter, ChevronDown } from 'lucide-react';
import { Specialty, Surgeon, UserStatus, User } from '@prisma/client';
// Pas besoin de Role ou ProtectedRoute ici
// import { Role } from '@/types/user';
// import ProtectedRoute from '@/components/ProtectedRoute';
import Modal from '@/components/Modal';
import SurgeonForm, { SurgeonSubmitData } from '@/components/SurgeonForm';
import ConfirmationModal from '@/components/ConfirmationModal'; // Si utilisé pour la suppression
import { toast } from 'react-toastify';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Interface pour les sites
interface Site {
    id: string;
    name: string;
    description?: string;
    colorCode?: string;
    isActive: boolean;
}

// Type pour un chirurgien incluant les spécialités et l'utilisateur lié
// Assurer la cohérence avec le type attendu par SurgeonForm
// On garde Omit<Surgeon, 'specialties'> et on type specialties séparément
interface SurgeonWithSpecialties extends Omit<Surgeon, 'specialties'> {
    specialties: Pick<Specialty, 'id' | 'name'>[]; // Type précis pour les spécialités liées
    user: User | null; // Garder l'utilisateur lié s'il existe
}

const SurgeonsListPanel: React.FC = () => {
    const [surgeons, setSurgeons] = useState<SurgeonWithSpecialties[]>([]);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>('all');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingSurgeon, setEditingSurgeon] = useState<SurgeonWithSpecialties | null>(null);
    const [isLoadingSubmit, setIsLoadingSubmit] = useState<boolean>(false);
    // Gardons la confirmation de suppression si elle est utilisée
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; surgeonId: number | null }>({ isOpen: false, surgeonId: null });
    const [showInactive, setShowInactive] = useState<boolean>(false);
    const [editingSurgeonSites, setEditingSurgeonSites] = useState<Site[]>([]);

    const fetchSurgeons = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get<SurgeonWithSpecialties[]>('/api/chirurgiens', {
                params: { includeInactive: showInactive }
            });
            setSurgeons(response.data);
        } catch (err) {
            console.error("Erreur lors de la récupération des chirurgiens:", err);
            setError("Impossible de charger les chirurgiens. Vérifiez la console pour plus de détails.");
            toast.error("Erreur lors du chargement des chirurgiens.");
        } finally {
            setLoading(false);
        }
    }, [showInactive]);

    const fetchSpecialties = useCallback(async () => {
        try {
            const response = await axios.get<Specialty[]>('/api/specialties');
            setSpecialties(response.data);
        } catch (err) {
            console.error("Erreur lors de la récupération des spécialités:", err);
            toast.error("Erreur lors du chargement des spécialités pour le filtre.");
        }
    }, []);

    useEffect(() => {
        fetchSurgeons();
    }, [fetchSurgeons]);

    useEffect(() => {
        fetchSpecialties();
    }, [fetchSpecialties]);

    // Fetch sites for the surgeon being edited
    const fetchSurgeonSites = useCallback(async (surgeonId: number) => {
        try {
            const response = await axios.get<Site[]>(`/api/chirurgiens/${surgeonId}/sites`);
            setEditingSurgeonSites(response.data);
        } catch (err) {
            console.error(`Erreur fetchSurgeonSites pour ${surgeonId}:`, err);
            setEditingSurgeonSites([]); // Réinitialiser en cas d'erreur
        }
    }, []);

    const handleOpenForm = async (surgeon: SurgeonWithSpecialties | null = null) => {
        setEditingSurgeon(surgeon);
        if (surgeon && surgeon.id) {
            await fetchSurgeonSites(surgeon.id);
        } else {
            setEditingSurgeonSites([]);
        }
        setIsModalOpen(true);
    };

    const handleCloseForm = () => {
        setEditingSurgeon(null);
        setIsModalOpen(false);
    };

    const handleCreateSurgeon = async (formData: SurgeonSubmitData, selectedSites?: Site[]) => {
        setIsLoadingSubmit(true);
        setError(null); // Clear previous errors
        try {
            const response = await axios.post<SurgeonWithSpecialties>('/api/chirurgiens', formData);
            const newSurgeon = response.data;
            
            // Si des sites sont sélectionnés, les assigner au nouveau chirurgien
            if (selectedSites && selectedSites.length > 0) {
                try {
                    await axios.put(`/api/chirurgiens/${newSurgeon.id}/sites`, {
                        siteIds: selectedSites.map(site => site.id)
                    });
                    toast.success(`Chirurgien créé avec ${selectedSites.length} site(s) assigné(s) !`);
                } catch (siteErr) {
                    console.error("Erreur lors de l'assignation des sites:", siteErr);
                    toast.warning("Chirurgien créé mais erreur lors de l'assignation des sites.");
                }
            } else {
                toast.success("Chirurgien créé avec succès !");
            }
            
            fetchSurgeons();
            handleCloseForm();
        } catch (err: any) {
            console.error("Erreur handleCreateSurgeon:", err);
            const message = (axios.isAxiosError(err) && err.response?.data?.message) || 'Erreur lors de la création du chirurgien.';
            setError(message);
            toast.error(message);
        } finally {
            setIsLoadingSubmit(false);
        }
    };

    const handleUpdateSurgeon = async (formData: SurgeonSubmitData, selectedSites?: Site[]) => {
        if (!editingSurgeon) return;
        setIsLoadingSubmit(true);
        setError(null); // Clear previous errors
        try {
            await axios.put<SurgeonWithSpecialties>(`/api/chirurgiens/${editingSurgeon.id}`, formData);
            
            // Gérer la synchronisation des sites
            if (selectedSites) {
                try {
                    await axios.put(`/api/chirurgiens/${editingSurgeon.id}/sites`, {
                        siteIds: selectedSites.map(site => site.id)
                    });
                    toast.success(`Chirurgien modifié avec ${selectedSites.length} site(s) assigné(s) !`);
                } catch (siteErr) {
                    console.error("Erreur lors de la synchronisation des sites:", siteErr);
                    toast.warning("Chirurgien modifié mais erreur lors de la synchronisation des sites.");
                }
            } else {
                toast.success("Chirurgien modifié avec succès !");
            }
            
            fetchSurgeons();
            handleCloseForm();
        } catch (err: any) {
            console.error("Erreur handleUpdateSurgeon:", err);
            const message = (axios.isAxiosError(err) && err.response?.data?.message) || 'Erreur lors de la modification du chirurgien.';
            setError(message);
            toast.error(message);
        } finally {
            setIsLoadingSubmit(false);
        }
    };

    const openDeleteConfirmation = (surgeonId: number) => {
        setDeleteConfirmation({ isOpen: true, surgeonId });
    };

    const closeDeleteConfirmation = () => {
        setDeleteConfirmation({ isOpen: false, surgeonId: null });
    };

    const handleDeleteSurgeon = async () => {
        if (deleteConfirmation.surgeonId === null) return;

        setIsLoadingSubmit(true);
        setError(null);
        try {
            await axios.delete(`http://localhost:3000/api/chirurgiens/${deleteConfirmation.surgeonId}`);
            toast.success('Chirurgien supprimé avec succès.');
            setSurgeons(prev => prev.filter(s => s.id !== deleteConfirmation.surgeonId));
            closeDeleteConfirmation();
        } catch (err: any) {
            console.error("Erreur handleDeleteSurgeon:", err);
            const message = (axios.isAxiosError(err) && err.response?.data?.message) || 'Erreur lors de la suppression du chirurgien.';
            setError(message);
            toast.error(message);
            // Ne pas fermer la modale de confirmation en cas d'erreur pour que l'utilisateur voie le message
            // setTimeout(() => setError(null), 5000); // On peut laisser le toast gérer ça
        } finally {
            setIsLoadingSubmit(false);
        }
    };

    const filteredSurgeons = surgeons.filter(surgeon => {
        if (selectedSpecialtyId === 'all') {
            return true;
        }
        // Assurez-vous que surgeon.specialties existe avant d'appeler .some
        return surgeon.specialties?.some(spec => spec.id === parseInt(selectedSpecialtyId, 10));
    });

    // Le JSX principal est extrait de SurgeonsPageContent
    // On retire le bouton retour et l'en-tête de page spécifique
    return (
        <div className="w-full">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

                <div className="mb-6 flex justify-between items-center">
                    {/* Titre principal harmonisé */}
                    <h2 className="text-2xl font-bold flex items-center space-x-3 text-gray-800">
                        <Users className="h-7 w-7 text-indigo-600" />
                        <span>Gestion des Chirurgiens</span>
                    </h2>
                    <button
                        onClick={() => handleOpenForm()}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                        disabled={isLoadingSubmit}
                    >
                        <PlusCircle className="h-5 w-5" />
                        <span>Ajouter un Chirurgien</span>
                    </button>
                </div>

                {/* Afficher le SurgeonForm ici si isModalOpen est true */}
                {isModalOpen && (
                    <Modal isOpen={isModalOpen} onClose={handleCloseForm} title={editingSurgeon ? 'Modifier le Chirurgien' : 'Ajouter un Chirurgien'}>
                        <SurgeonForm
                            initialData={editingSurgeon}
                            surgeonSites={editingSurgeonSites}
                            onSubmit={editingSurgeon ? handleUpdateSurgeon : handleCreateSurgeon}
                            onCancel={handleCloseForm}
                            isLoading={isLoadingSubmit}
                        />
                    </Modal>
                )}

                {/* Confirmation de suppression */}
                <ConfirmationModal
                    isOpen={deleteConfirmation.isOpen}
                    onClose={closeDeleteConfirmation}
                    onConfirm={handleDeleteSurgeon}
                    title="Confirmer la suppression"
                    message="Êtes-vous sûr de vouloir supprimer ce chirurgien ? Cette action est irréversible."
                    confirmButtonText="Supprimer"
                    cancelButtonText="Annuler"
                    isLoading={isLoadingSubmit}
                />

                {/* Liste des Chirurgiens - style ajusté pour s'intégrer au panneau */}
                {/* Retrait de la div d'encadrement car elle est maintenant gérée par SurgeonAndSpecialtyPanel */}
                {/* <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 border border-gray-100"> */}
                {loading && <p className="text-center text-gray-600 py-4">Chargement...</p>}
                {error && <p className="text-center text-red-600 font-medium py-4">{error}</p>}
                {!loading && !error && (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            {/* Sous-titre harmonisé */}
                            <h3 className="text-lg font-medium text-gray-700">Chirurgiens enregistrés ({filteredSurgeons.length})</h3>

                            {/* --- Section Filtre --- */}
                            <div className="flex items-center space-x-4">
                                <div className="relative flex items-center space-x-2">
                                    <Filter className="h-5 w-5 text-gray-500 flex-shrink-0" />
                                    <label htmlFor="specialtyFilterPanel" className="text-sm font-medium text-gray-700 whitespace-nowrap flex-shrink-0">Filtrer par:</label>
                                    <select
                                        id="specialtyFilterPanel" // ID unique pour le select dans le panneau
                                        name="specialtyFilterPanel"
                                        className="block w-auto pl-3 pr-8 py-1.5 text-sm border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 transition-colors duration-150 appearance-none"
                                        value={selectedSpecialtyId}
                                        onChange={(e) => setSelectedSpecialtyId(e.target.value)}
                                    >
                                        <option value="all">Toutes les spécialités</option>
                                        {specialties.map((spec) => (
                                            <option key={spec.id} value={spec.id.toString()}>
                                                {spec.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                    </div>
                                </div>
                                {/* --- Fin Section Filtre --- */}

                                {/* --- Nouvelle Case à cocher --- */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="showInactiveSurgeons"
                                        checked={showInactive}
                                        onCheckedChange={(checked) => setShowInactive(Boolean(checked))}
                                        className="border-gray-300 rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <Label htmlFor="showInactiveSurgeons" className="text-sm font-medium text-gray-700 cursor-pointer">
                                        Afficher les inactifs
                                    </Label>
                                </div>
                                {/* --- Fin Nouvelle Case à cocher --- */}
                            </div>
                        </div>

                        {filteredSurgeons.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">Aucun chirurgien trouvé {selectedSpecialtyId !== 'all' ? 'pour cette spécialité' : ''}.</p>
                        ) : (
                            <div className="overflow-x-auto border border-gray-200 rounded-md shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {/* Ajustement padding et taille texte thead */}
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom Complet</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spécialités</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredSurgeons.map((surgeon) => (
                                            <motion.tr key={surgeon.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="hover:bg-gray-50/50">
                                                {/* Ajustement padding tbody pour cohérence */}
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{surgeon.id}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{surgeon.prenom} {surgeon.nom}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {(surgeon.specialties && surgeon.specialties.length > 0)
                                                        ? surgeon.specialties.map(spec => spec.name).join(', ')
                                                        : <span className="text-gray-400 italic">Aucune</span>
                                                    }
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${surgeon.status === UserStatus.ACTIF ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {surgeon.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                    <button
                                                        onClick={() => handleOpenForm(surgeon)}
                                                        className="text-indigo-600 hover:text-indigo-900 transition-colors disabled:opacity-50"
                                                        disabled={isLoadingSubmit}
                                                        title="Modifier"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteConfirmation(surgeon.id)} // Utilise la modale de confirmation
                                                        className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                                                        disabled={isLoadingSubmit}
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
                {/* </div> */}
            </motion.div>
        </div>
    );
};

export default SurgeonsListPanel; 