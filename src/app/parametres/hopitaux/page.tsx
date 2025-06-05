"use client";

import React, { useState, useEffect } from 'react';
import { logger } from "../../../lib/logger";
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { Hospital, HospitalFormData } from '@/components/HospitalForm';
import HospitalForm from '@/components/HospitalForm';
import Modal from '@/components/Modal';
import { Switch } from '@/components/ui/switch';
import Button from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function HopitauxPage() {
    // État pour les hôpitaux
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showInactive, setShowInactive] = useState(false);

    // État pour le formulaire et le modal
    const [formOpen, setFormOpen] = useState(false);
    const [currentHospital, setCurrentHospital] = useState<Hospital | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [hospitalToDelete, setHospitalToDelete] = useState<Hospital | null>(null);

    // Données mockées pour développement
    const MOCK_HOSPITALS: Hospital[] = [
        {
            id: 1,
            name: 'Hôpital de la Croix-Rousse',
            address: '103 Gd Rue de la Croix-Rousse',
            city: 'Lyon',
            postalCode: '69004',
            phone: '04 72 07 17 17',
            email: 'contact@hopitalcroixrousse.fr',
            isActive: true,
            createdAt: new Date('2022-01-01'),
            updatedAt: new Date('2022-06-15')
        },
        {
            id: 2,
            name: 'Hôpital Édouard Herriot',
            address: '5 Pl. d\'Arsonval',
            city: 'Lyon',
            postalCode: '69003',
            phone: '04 72 11 69 11',
            email: 'contact@hopitalherriot.fr',
            isActive: true,
            createdAt: new Date('2022-01-05'),
            updatedAt: new Date('2022-05-10')
        },
        {
            id: 3,
            name: 'Clinique du Tonkin',
            address: '26 Rue du Tonkin',
            city: 'Villeurbanne',
            postalCode: '69100',
            phone: '04 72 82 66 82',
            email: 'contact@cliniquetonkin.fr',
            isActive: false,
            createdAt: new Date('2022-02-15'),
            updatedAt: new Date('2022-07-20')
        }
    ];

    // Charger les données des hôpitaux
    useEffect(() => {
        // Simuler un chargement API
        setLoading(true);
        setTimeout(() => {
            setHospitals(MOCK_HOSPITALS);
            setLoading(false);
        }, 500);

        // Pour une implémentation API réelle:
        /*
        const fetchHospitals = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/hospitals');
                if (!response.ok) throw new Error('Erreur lors du chargement des hôpitaux');
                const data = await response.json();
                setHospitals(data);
            } catch (error: unknown) {
                logger.error('Erreur:', error instanceof Error ? error : new Error(String(error)));
                toast.error('Impossible de charger les hôpitaux');
            } finally {
                setLoading(false);
            }
        };
        fetchHospitals();
        */
    }, []);

    // Sauvegarder un hôpital (création ou modification)
    const saveHospital = async (data: HospitalFormData) => {
        setSaving(true);
        try {
            // Simuler une requête API
            setTimeout(() => {
                if (currentHospital?.id) {
                    // Mise à jour
                    const updatedHospitals = hospitals.map(h =>
                        h.id === currentHospital.id
                            ? { ...h, ...data, updatedAt: new Date() }
                            : h
                    );
                    setHospitals(updatedHospitals);
                    toast.success(`Hôpital "${data.name}" mis à jour avec succès`);
                } else {
                    // Création
                    const newHospital: Hospital = {
                        id: Math.max(0, ...hospitals.map(h => h.id || 0)) + 1,
                        ...data,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };
                    setHospitals([...hospitals, newHospital]);
                    toast.success(`Hôpital "${data.name}" créé avec succès`);
                }
                closeForm();
                setSaving(false);
            }, 800);

            // Pour une implémentation API réelle:
            /*
            const url = currentHospital?.id 
                ? `/api/hospitals/${currentHospital.id}` 
                : '/api/hospitals';
                
            const method = currentHospital?.id ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error('Erreur lors de la sauvegarde');
            
            const savedHospital = await response.json();
            
            if (currentHospital?.id) {
                setHospitals(hospitals.map(h => h.id === savedHospital.id ? savedHospital : h));
                toast.success(`Hôpital "${savedHospital.name}" mis à jour avec succès`);
            } else {
                setHospitals([...hospitals, savedHospital]);
                toast.success(`Hôpital "${savedHospital.name}" créé avec succès`);
            }
            
            closeForm();
            */
        } catch (error: unknown) {
            logger.error('Erreur:', error instanceof Error ? error : new Error(String(error)));
            toast.error('Erreur lors de la sauvegarde de l\'hôpital');
        } finally {
            setSaving(false);
        }
    };

    // Supprimer un hôpital
    const deleteHospital = async () => {
        if (!hospitalToDelete) return;

        try {
            // Simuler une requête API
            setTimeout(() => {
                setHospitals(hospitals.filter(h => h.id !== hospitalToDelete.id));
                toast.success(`Hôpital "${hospitalToDelete.name}" supprimé avec succès`);
                setDeleteConfirmOpen(false);
                setHospitalToDelete(null);
            }, 500);

            // Pour une implémentation API réelle:
            /*
            const response = await fetch(`http://localhost:3000/api/hospitals/${hospitalToDelete.id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Erreur lors de la suppression');
            
            setHospitals(hospitals.filter(h => h.id !== hospitalToDelete.id));
            toast.success(`Hôpital "${hospitalToDelete.name}" supprimé avec succès`);
            setDeleteConfirmOpen(false);
            setHospitalToDelete(null);
            */
        } catch (error: unknown) {
            logger.error('Erreur:', error instanceof Error ? error : new Error(String(error)));
            toast.error('Erreur lors de la suppression de l\'hôpital');
        }
    };

    // Ouvrir le formulaire pour créer un nouvel hôpital
    const openNewForm = () => {
        setCurrentHospital(null);
        setFormOpen(true);
    };

    // Ouvrir le formulaire pour éditer un hôpital existant
    const openEditForm = (hospital: Hospital) => {
        setCurrentHospital(hospital);
        setFormOpen(true);
    };

    // Fermer le formulaire
    const closeForm = () => {
        setFormOpen(false);
        setCurrentHospital(null);
    };

    // Ouvrir la confirmation de suppression
    const openDeleteConfirm = (hospital: Hospital) => {
        setHospitalToDelete(hospital);
        setDeleteConfirmOpen(true);
    };

    // Filtrer les hôpitaux selon l'état actif/inactif
    const filteredHospitals = showInactive
        ? hospitals
        : hospitals.filter(h => h.isActive);

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gestion des hôpitaux</h1>
                <Button onClick={openNewForm} className="flex items-center gap-2">
                    <Plus size={16} />
                    Ajouter un hôpital
                </Button>
            </div>

            <div className="mb-4 flex items-center space-x-2">
                <Switch
                    checked={showInactive}
                    onChange={() => setShowInactive(prev => !prev)}
                    label="Afficher les établissements inactifs"
                />
            </div>

            {loading ? (
                <div className="text-center py-8">Chargement des hôpitaux...</div>
            ) : filteredHospitals.length === 0 ? (
                <div className="text-center py-8 border rounded-md bg-gray-50">
                    <p className="text-gray-500">Aucun hôpital trouvé.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg overflow-hidden shadow">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ville</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredHospitals.map((hospital) => (
                                <tr key={hospital.id} className={hospital.isActive ? '' : 'bg-gray-50'}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {hospital.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {hospital.address}, {hospital.postalCode}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {hospital.city}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {hospital.phone && <div>{hospital.phone}</div>}
                                        {hospital.email && <div className="text-blue-500">{hospital.email}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${hospital.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {hospital.isActive ? 'Actif' : 'Inactif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => openEditForm(hospital)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => openDeleteConfirm(hospital)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal de formulaire */}
            <Modal
                isOpen={formOpen}
                onClose={closeForm}
                title={currentHospital ? `Modifier ${currentHospital.name}` : 'Ajouter un hôpital'}
            >
                <HospitalForm
                    onSubmit={saveHospital}
                    onCancel={closeForm}
                    isLoading={saving}
                    initialData={currentHospital}
                />
            </Modal>

            {/* Modal de confirmation de suppression */}
            <Modal
                isOpen={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                title="Confirmer la suppression"
            >
                <div className="p-4">
                    <div className="flex items-center text-amber-600 mb-4">
                        <AlertCircle className="mr-2" size={24} />
                        <h3 className="font-medium">Êtes-vous sûr de vouloir supprimer cet hôpital?</h3>
                    </div>

                    {hospitalToDelete && (
                        <p className="text-gray-600 mb-4">
                            Cette action supprimera définitivement l'hôpital "{hospitalToDelete.name}" et toutes ses données associées.
                        </p>
                    )}

                    <div className="flex justify-end space-x-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteConfirmOpen(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={deleteHospital}
                        >
                            Supprimer
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
} 