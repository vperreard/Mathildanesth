'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LeaveTypeSetting } from '@prisma/client'; // Importer le type généré par Prisma
import LeaveTypeFormModal from '@/components/admin/LeaveTypeFormModal'; // Importer le modal

// Importer des composants UI si vous utilisez une librairie (ex: Shadcn/ui)
// import { Button } from "@/components/ui/button";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { PlusCircle } from "lucide-react";

// Utiliser Partial pour plus de flexibilité
interface LeaveTypeSettingData extends Partial<LeaveTypeSetting> {
    // Ajouter des champs calculés ou formatés si nécessaire
}

export default function ManageLeaveTypesPage() {
    const [leaveTypes, setLeaveTypes] = useState<LeaveTypeSettingData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // --- State pour le formulaire/modal d'ajout/modification ---
    const [showFormModal, setShowFormModal] = useState<boolean>(false);
    // Utiliser Partial ici aussi
    const [editingLeaveType, setEditingLeaveType] = useState<Partial<LeaveTypeSetting> | null>(null);

    const fetchLeaveTypes = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/admin/leave-types');
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}: ${await response.text()}`);
            }
            const data: LeaveTypeSettingData[] = await response.json();
            setLeaveTypes(data);
        } catch (err: any) {
            console.error("Erreur lors de la récupération des types de congés:", err);
            setError(err.message || "Impossible de charger les types de congés.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Récupérer les données au montage du composant
        fetchLeaveTypes();
    }, [fetchLeaveTypes]);

    // --- Fonctions pour gérer l'ouverture/fermeture du formulaire ---
    const handleAddNew = () => {
        setEditingLeaveType(null); // Pas d'édition, c'est un ajout
        setShowFormModal(true);
    };

    const handleEdit = (leaveType: LeaveTypeSettingData) => {
        setEditingLeaveType(leaveType);
        setShowFormModal(true);
    };

    const handleCloseForm = () => {
        setShowFormModal(false);
        setEditingLeaveType(null);
    };

    const handleFormSuccess = () => {
        handleCloseForm();
        fetchLeaveTypes(); // Recharger les données après succès
    };

    // --- Fonction pour gérer la suppression ---
    const handleDelete = async (id: string, label: string) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le type de congé "${label}" ? Cette action est irréversible.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/leave-types/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
            }

            // Succès (status 204 No Content)
            alert(`Le type "${label}" a été supprimé.`);
            fetchLeaveTypes(); // Recharger la liste

        } catch (err: any) {
            console.error("Erreur lors de la suppression:", err);
            alert(`Erreur lors de la suppression: ${err.message}`);
        }
    };


    // --- Rendu ---
    return (
        <div className="container mx-auto p-4 md:p-6">
            <h1 className="text-2xl font-bold mb-4">Gestion des Types de Congés</h1>

            <div className="mb-4 flex justify-end">
                {/* Utiliser Button de Shadcn/ui si disponible */}
                <button
                    onClick={handleAddNew}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
                >
                    {/* <PlusCircle className="mr-2 h-4 w-4" /> */}
                    Ajouter un type
                </button>
            </div>

            {isLoading && <p>Chargement des types de congés...</p>}
            {error && <p className="text-red-500">Erreur: {error}</p>}

            {!isLoading && !error && (
                <div className="overflow-x-auto shadow rounded-lg">
                    {/* Utiliser Table de Shadcn/ui si disponible */}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Libellé</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actif</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sélectionnable</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {leaveTypes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">Aucun type de congé trouvé.</td>
                                </tr>
                            ) : (
                                leaveTypes.map((type) => (
                                    <tr key={type.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{type.code}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{type.label}</td>
                                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs truncate">{type.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${type.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {type.isActive ? 'Oui' : 'Non'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${type.isUserSelectable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {type.isUserSelectable ? 'Oui' : 'Non'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            {/* Boutons Modifier/Supprimer - Utiliser Button de Shadcn/ui si disponible */}
                                            <button
                                                onClick={() => handleEdit(type)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                Modifier
                                            </button>
                                            <button
                                                onClick={() => handleDelete(type.id, type.label)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Supprimer
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- Modal/Formulaire pour Ajout/Modification --- */}
            {showFormModal && (
                <LeaveTypeFormModal
                    isOpen={showFormModal}
                    onClose={handleCloseForm}
                    onSuccess={handleFormSuccess}
                    initialData={editingLeaveType}
                />
            )}

        </div>
    );
} 