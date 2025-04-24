'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LeaveTypeSetting } from '@prisma/client'; // Importer le type généré par Prisma
import LeaveTypeFormModal from '@/components/admin/LeaveTypeFormModal'; // Importer le modal
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

// Importer les composants UI
import {
    Button,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    Badge,
    Card,
    CardHeader,
    CardTitle,
    CardContent
} from '@/components/ui';

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
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Gestion des Types de Congés</CardTitle>
                        <Button
                            onClick={handleAddNew}
                            size="sm"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Ajouter un type
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading && <p className="text-center py-4 text-gray-500">Chargement des types de congés...</p>}
                    {error && <p className="text-center py-4 text-red-600 bg-red-50 rounded-md">{error}</p>}

                    {!isLoading && !error && (
                        <Table hover striped bordered>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Libellé</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-center">Actif</TableHead>
                                    <TableHead className="text-center">Sélectionnable</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaveTypes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center">Aucun type de congé trouvé.</TableCell>
                                    </TableRow>
                                ) : (
                                    leaveTypes.map((type) => (
                                        <TableRow key={type.id}>
                                            <TableCell className="font-medium">{type.code}</TableCell>
                                            <TableCell>{type.label}</TableCell>
                                            <TableCell className="max-w-xs truncate">{type.description}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant={type.isActive ? "success" : "danger"}
                                                >
                                                    {type.isActive ? 'Oui' : 'Non'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant={type.isUserSelectable ? "success" : "gray"}
                                                >
                                                    {type.isUserSelectable ? 'Oui' : 'Non'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        onClick={() => handleEdit(type)}
                                                        variant="secondary"
                                                        size="sm"
                                                    >
                                                        <Edit className="h-4 w-4 mr-1" />
                                                        Modifier
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDelete(type.id!, type.label!)}
                                                        variant="danger"
                                                        size="sm"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                        Supprimer
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

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