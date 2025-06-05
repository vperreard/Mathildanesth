'use client';

import React, { useState, useEffect } from 'react';
import { logger } from "../../lib/logger";
import { Period } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import ConsultationsList, { Consultation } from '@/components/consultations/ConsultationsList';
import ConsultationForm from '@/components/consultations/ConsultationForm';
import Modal from '@/components/Modal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ConsultationsPage: React.FC = () => {
    const router = useRouter();
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [users, setUsers] = useState<{ id: number; nom: string; prenom: string }[]>([]);
    const [specialties, setSpecialties] = useState<{ id: number; name: string }[]>([]);
    const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [consultationToDelete, setConsultationToDelete] = useState<string | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Charger les consultations initiales
    const fetchConsultations = async () => {
        setLoading(true);
        try {
            // Construire les paramètres de requête pour le filtrage
            const queryParams = new URLSearchParams();

            // Ajouter dates par défaut si non spécifiées (30 jours)
            const today = new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 30);

            queryParams.append('start', selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(thirtyDaysAgo, 'yyyy-MM-dd'));
            queryParams.append('end', selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));

            if (selectedPeriod) {
                queryParams.append('period', selectedPeriod);
            }

            const response = await fetch(`http://localhost:3000/api/consultations?${queryParams.toString()}`);
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des consultations');
            }

            const data = await response.json();
            setConsultations(data.consultations.map((item: any) => ({
                ...item,
                date: new Date(item.date),
            })));
        } catch (error) {
            logger.error('Erreur lors du chargement des consultations:', error);
            toast.error('Impossible de charger les consultations');
        } finally {
            setLoading(false);
        }
    };

    // Charger les utilisateurs, spécialités et sites
    const fetchData = async () => {
        try {
            // Charger les utilisateurs (médecins)
            const usersResponse = await fetch('http://localhost:3000/api/utilisateurs');
            if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                setUsers(usersData.users);
            }

            // Charger les spécialités
            const specialtiesResponse = await fetch('http://localhost:3000/api/specialties');
            if (specialtiesResponse.ok) {
                const specialtiesData = await specialtiesResponse.json();
                setSpecialties(specialtiesData.specialties);
            }

            // Charger les sites
            const sitesResponse = await fetch('http://localhost:3000/api/sites');
            if (sitesResponse.ok) {
                const sitesData = await sitesResponse.json();
                setSites(sitesData.sites);
            }
        } catch (error) {
            logger.error('Erreur lors du chargement des données:', error);
            toast.error('Impossible de charger certaines données');
        }
    };

    // Charger les données initiales
    useEffect(() => {
        fetchData();
        fetchConsultations();
    }, []);

    // Recharger les consultations lors du changement des filtres
    useEffect(() => {
        fetchConsultations();
    }, [selectedPeriod, selectedDate]);

    // Gestionnaire pour l'ouverture du formulaire d'ajout
    const handleAddNew = () => {
        setSelectedConsultation(null);
        setIsEditing(false);
        setIsFormOpen(true);
    };

    // Gestionnaire pour l'édition
    const handleEdit = (consultation: Consultation) => {
        setSelectedConsultation(consultation);
        setIsEditing(true);
        setIsFormOpen(true);
    };

    // Gestionnaire pour la visualisation
    const handleView = (consultation: Consultation) => {
        setSelectedConsultation(consultation);
        setIsViewOpen(true);
    };

    // Gestionnaire pour la suppression
    const handleDelete = (id: string) => {
        setConsultationToDelete(id);
        setIsDeleteConfirmOpen(true);
    };

    // Confirmation de suppression
    const confirmDelete = async () => {
        if (consultationToDelete) {
            try {
                const response = await fetch(`http://localhost:3000/api/consultations?id=${consultationToDelete}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de la suppression');
                }

                // Actualiser la liste après suppression
                setConsultations(consultations.filter(c => c.id !== consultationToDelete));
                toast.success('Consultation supprimée');
            } catch (error) {
                logger.error('Erreur de suppression:', error);
                toast.error('Erreur lors de la suppression');
            } finally {
                setIsDeleteConfirmOpen(false);
                setConsultationToDelete(null);
            }
        }
    };

    // Soumission du formulaire (création ou mise à jour)
    const handleSubmit = async (data: any) => {
        try {
            // Si en mode édition, envoyer une requête PATCH
            if (isEditing && selectedConsultation) {
                const response = await fetch('http://localhost:3000/api/consultations', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: selectedConsultation.id,
                        ...data,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de la mise à jour');
                }

                // Actualiser la liste après mise à jour
                await fetchConsultations();
                toast.success('Consultation mise à jour');
            } else {
                // Sinon, envoyer une requête POST pour créer
                const response = await fetch('http://localhost:3000/api/consultations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de la création');
                }

                // Actualiser la liste après création
                await fetchConsultations();
                toast.success('Consultation créée');
            }

            // Fermer le formulaire
            setIsFormOpen(false);
        } catch (error) {
            logger.error('Erreur de soumission:', error);
            toast.error('Erreur lors de la soumission');
        }
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <h1 className="text-3xl font-bold mb-6">Gestion des Consultations</h1>

            <ConsultationsList
                consultations={consultations}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                onNew={handleAddNew}
                isLoading={loading}
                onPeriodFilter={setSelectedPeriod}
                onDateFilter={setSelectedDate}
                selectedPeriod={selectedPeriod}
                selectedDate={selectedDate}
            />

            {/* Modal pour le formulaire d'ajout/édition */}
            <Modal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={isEditing ? 'Modifier la consultation' : 'Nouvelle consultation'}
                size="lg"
            >
                <ConsultationForm
                    initialData={selectedConsultation || undefined}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsFormOpen(false)}
                    isEditing={isEditing}
                    users={users}
                    specialties={specialties}
                    sites={sites}
                />
            </Modal>

            {/* Modal pour la visualisation des détails */}
            <Modal
                isOpen={isViewOpen}
                onClose={() => setIsViewOpen(false)}
                title="Détails de la consultation"
                size="md"
            >
                {selectedConsultation && (
                    <div className="space-y-4 p-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500">Date</h3>
                                <p>{format(selectedConsultation.date, 'PPP', { locale: fr })}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500">Médecin</h3>
                                <p>
                                    {selectedConsultation.user
                                        ? `${selectedConsultation.user.prenom} ${selectedConsultation.user.nom}`
                                        : 'Non assigné'}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500">Période</h3>
                                <p>
                                    {selectedConsultation.period === 'MATIN'
                                        ? 'Matin'
                                        : selectedConsultation.period === 'APRES_MIDI'
                                            ? 'Après-midi'
                                            : 'Journée entière'}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500">Horaires</h3>
                                <p>
                                    {selectedConsultation.heureDebut && selectedConsultation.heureFin
                                        ? `${selectedConsultation.heureDebut} - ${selectedConsultation.heureFin}`
                                        : '-'}
                                </p>
                            </div>
                            {selectedConsultation.site && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500">Site</h3>
                                    <p>{selectedConsultation.site.name}</p>
                                </div>
                            )}
                            {selectedConsultation.specialty && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500">Spécialité</h3>
                                    <p>{selectedConsultation.specialty.name}</p>
                                </div>
                            )}
                        </div>
                        {selectedConsultation.notes && (
                            <div className="mt-4">
                                <h3 className="text-sm font-semibold text-gray-500">Notes</h3>
                                <p className="whitespace-pre-line">{selectedConsultation.notes}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Modal de confirmation de suppression */}
            <Modal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                title="Confirmer la suppression"
                size="sm"
            >
                <div className="p-4">
                    <p className="mb-4">Êtes-vous sûr de vouloir supprimer cette consultation ?</p>
                    <div className="flex justify-end gap-2">
                        <button
                            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                            onClick={() => setIsDeleteConfirmOpen(false)}
                        >
                            Annuler
                        </button>
                        <button
                            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                            onClick={confirmDelete}
                        >
                            Supprimer
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ConsultationsPage; 