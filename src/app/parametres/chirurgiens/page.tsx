'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Link from 'next/link';
import { Users, Trash2, Edit, PlusCircle, ArrowLeft, Filter, ChevronDown } from 'lucide-react';
import { Specialty, Surgeon, UserStatus, User } from '@prisma/client';
import { Role } from '@/types/user';
import Modal from '@/components/Modal';
import SurgeonForm, { SurgeonSubmitData } from '@/components/SurgeonForm';
import ConfirmationModal from '@/components/ConfirmationModal';
import { toast } from 'react-toastify';

import ProtectedRoute from '@/components/ProtectedRoute';

// Type pour un chirurgien incluant les spécialités et l'utilisateur lié
interface SurgeonWithSpecialties extends Omit<Surgeon, 'userId'> {
    specialties: Specialty[];
    user: User | null;
}

function SurgeonsPageContent() {
    const [surgeons, setSurgeons] = useState<SurgeonWithSpecialties[]>([]);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>('all');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingSurgeon, setEditingSurgeon] = useState<SurgeonWithSpecialties | null>(null);
    const [isLoadingSubmit, setIsLoadingSubmit] = useState<boolean>(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; surgeonId: number | null }>({ isOpen: false, surgeonId: null });

    const fetchSurgeons = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get<SurgeonWithSpecialties[]>('/api/chirurgiens');
            setSurgeons(response.data);
        } catch (err) {
            console.error("Erreur lors de la récupération des chirurgiens:", err);
            setError("Impossible de charger les chirurgiens. Vérifiez la console pour plus de détails.");
            toast.error("Erreur lors du chargement des chirurgiens.");
        } finally {
            setLoading(false);
        }
    }, []);

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
        setLoading(true);
        setError(null);
        Promise.all([fetchSurgeons(), fetchSpecialties()])
            .catch((err) => {
                console.error("Erreur lors du chargement initial:", err);
                setError("Une erreur est survenue lors du chargement initial des données.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [fetchSurgeons, fetchSpecialties]);

    const handleOpenForm = (surgeon: SurgeonWithSpecialties | null = null) => {
        setEditingSurgeon(surgeon);
        setIsModalOpen(true);
    };

    const handleCloseForm = () => {
        setEditingSurgeon(null);
        setIsModalOpen(false);
    };

    const handleCreateSurgeon = async (formData: SurgeonSubmitData) => {
        setIsLoadingSubmit(true);
        try {
            await axios.post<SurgeonWithSpecialties>('/api/chirurgiens', formData);
            fetchSurgeons();
            handleCloseForm();
        } catch (err: any) {
            console.error("Erreur handleCreateSurgeon:", err);
            const message = (axios.isAxiosError(err) && err.response?.data?.message) || 'Erreur lors de la création du chirurgien.';
            setError(message);
        } finally {
            setIsLoadingSubmit(false);
        }
    };

    const handleUpdateSurgeon = async (formData: SurgeonSubmitData) => {
        if (!editingSurgeon) return;
        setIsLoadingSubmit(true);
        try {
            await axios.put<SurgeonWithSpecialties>(`/api/chirurgiens/${editingSurgeon.id}`, formData);
            fetchSurgeons();
            handleCloseForm();
        } catch (err: any) {
            console.error("Erreur handleUpdateSurgeon:", err);
            const message = (axios.isAxiosError(err) && err.response?.data?.message) || 'Erreur lors de la modification du chirurgien.';
            setError(message);
        } finally {
            setIsLoadingSubmit(false);
        }
    };

    const handleDeleteSurgeon = async (surgeonId: number) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce chirurgien ?')) return;
        setIsLoadingSubmit(true);
        setError(null);
        try {
            await axios.delete(`/api/chirurgiens/${surgeonId}`);
            setSurgeons(prev => prev.filter(s => s.id !== surgeonId));
        } catch (err: any) {
            console.error("Erreur handleDeleteSurgeon:", err);
            setError(axios.isAxiosError(err) && err.response?.data?.message || 'Erreur lors de la suppression du chirurgien.');
            setTimeout(() => setError(null), 5000);
        } finally {
            setIsLoadingSubmit(false);
        }
    };

    const filteredSurgeons = surgeons.filter(surgeon => {
        if (selectedSpecialtyId === 'all') {
            return true;
        }
        return surgeon.specialties.some(spec => spec.id === parseInt(selectedSpecialtyId, 10));
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {/* Bouton Retour aux Paramètres */}
                <Link href="/parametres" className="inline-flex items-center text-sm text-gray-600 hover:text-indigo-600 mb-6 group">
                    <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                    Retour aux Paramètres
                </Link>

                <div className="mb-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold flex items-center space-x-3">
                        <Users className="h-8 w-8 text-indigo-600" />
                        <span>Gestion des Chirurgiens</span>
                    </h1>
                    <button
                        onClick={() => handleOpenForm()}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center space-x-2"
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
                            onSubmit={editingSurgeon ? handleUpdateSurgeon : handleCreateSurgeon}
                            onCancel={handleCloseForm}
                            isLoading={isLoadingSubmit}
                        />
                    </Modal>
                )}

                {/* Liste des Chirurgiens */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100">
                    {loading && <p className="text-center text-gray-600 py-4">Chargement...</p>}
                    {error && <p className="text-center text-red-600 font-medium py-4">{error}</p>}
                    {!loading && !error && (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">Liste des chirurgiens ({filteredSurgeons.length})</h2>

                                {/* --- Section Filtre --- */}
                                <div className="relative flex items-center space-x-2">
                                    <Filter className="h-5 w-5 text-gray-500 flex-shrink-0" />
                                    <label htmlFor="specialtyFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap flex-shrink-0">Filtrer par:</label>
                                    <select
                                        id="specialtyFilter"
                                        name="specialtyFilter"
                                        className="block w-auto pl-3 pr-8 py-1.5 text-sm border border-gray-300 bg-white rounded-md shadow-sm 
                                                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                                                   hover:border-gray-400 transition-colors duration-150 
                                                   appearance-none"
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
                            </div>

                            {filteredSurgeons.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">Aucun chirurgien trouvé {selectedSpecialtyId !== 'all' ? 'pour cette spécialité' : ''}.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom Complet</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spécialités</th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredSurgeons.map((surgeon) => (
                                                <motion.tr key={surgeon.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="hover:bg-gray-50/50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{surgeon.id}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{surgeon.prenom} {surgeon.nom}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {(surgeon.specialties && surgeon.specialties.length > 0)
                                                            ? surgeon.specialties.map(spec => spec.name).join(', ')
                                                            : <span className="text-gray-400 italic">Aucune</span>
                                                        }
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${surgeon.status === UserStatus.ACTIF ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {surgeon.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => handleOpenForm(surgeon)}
                                                            className="text-indigo-600 hover:text-indigo-900 mr-3 transition-colors disabled:opacity-50"
                                                            disabled={isLoadingSubmit}
                                                            title="Modifier"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSurgeon(surgeon.id)}
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
                </div>
            </motion.div>
        </div>
    );
}

// Protéger la page
export default function ProtectedSurgeonsPage() {
    const allowedRoles: Role[] = ['ADMIN_TOTAL', 'ADMIN_PARTIEL'];
    return (
        <ProtectedRoute allowedRoles={allowedRoles}>
            <SurgeonsPageContent />
        </ProtectedRoute>
    );
} 