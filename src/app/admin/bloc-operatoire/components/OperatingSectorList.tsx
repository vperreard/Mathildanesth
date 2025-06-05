'use client';

import React, { useState } from 'react';
import { logger } from "../../../../lib/logger";
import { OperatingSector } from '@/modules/planning/bloc-operatoire/types';
import {
  useOperatingSectorsQuery,
  useCreateSectorMutation,
  useUpdateSectorMutation,
  useDeleteSectorMutation,
} from '@/modules/planning/bloc-operatoire/hooks/useOperatingResourceQueries';
import { OperatingSectorForm } from './OperatingSectorForm'; // Importer le formulaire
// Temporairement retiré l'import Button UI
// import Button from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PencilIcon, TrashIcon, PlusIcon, Circle } from 'lucide-react';
import { toast } from 'sonner'; // Utiliser sonner si configuré, sinon un autre système

export function OperatingSectorList() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState<OperatingSector | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sectorToDelete, setSectorToDelete] = useState<OperatingSector | null>(null);

  // Récupérer les données avec React Query
  const {
    data: sectors = [],
    isLoading: isLoadingSectors,
    error: sectorsError,
  } = useOperatingSectorsQuery();

  // Mutations
  const createMutation = useCreateSectorMutation();
  const updateMutation = useUpdateSectorMutation();
  const deleteMutation = useDeleteSectorMutation();

  const handleOpenForm = (sector?: OperatingSector) => {
    setSelectedSector(sector || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedSector(null);
  };

  const handleFormSubmit = async (
    formData: Omit<OperatingSector, 'id' | 'salles'>,
    id?: string
  ) => {
    try {
      if (id) {
        await updateMutation.mutateAsync({ id, data: formData });
        toast.success('Secteur mis à jour avec succès !');
      } else {
        // Ajout de salles vide par défaut pour la création
        const newSector: Omit<OperatingSector, 'id'> = {
          ...formData,
          salles: []
        };
        await createMutation.mutateAsync(newSector);
        toast.success('Secteur créé avec succès !');
      }
      handleCloseForm();
    } catch (error) {
      toast.error(
        `Erreur lors de la sauvegarde du secteur: ${error instanceof Error ? error.message : String(error)}`
      );
      logger.error('Erreur sauvegarde secteur:', error);
    }
  };

  const openDeleteDialog = (sector: OperatingSector) => {
    setSectorToDelete(sector);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setSectorToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!sectorToDelete) return;
    try {
      await deleteMutation.mutateAsync(sectorToDelete.id);
      toast.success('Secteur supprimé avec succès !');
      closeDeleteDialog();
    } catch (error) {
      toast.error(
        `Erreur lors de la suppression du secteur: ${error instanceof Error ? error.message : String(error)}`
      );
      logger.error('Erreur suppression secteur:', error);
      // Garder la modale ouverte en cas d'erreur pour feedback
    }
  };

  const isLoading =
    isLoadingSectors ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestion des Secteurs Opératoires</h2>
        <button onClick={() => handleOpenForm()} disabled={isLoading}>
          <PlusIcon className="mr-2 h-4 w-4" /> Ajouter un Secteur
        </button>
      </div>

      {sectorsError && (
        <div className="text-red-600 bg-red-100 p-3 rounded-md">
          Erreur de chargement des secteurs: {sectorsError.message}
        </div>
      )}

      {isLoadingSectors && <p>Chargement des secteurs...</p>}

      {!isLoadingSectors && sectors.length === 0 && (
        <p className="text-gray-500 italic">Aucun secteur opératoire défini.</p>
      )}

      {!isLoadingSectors && sectors.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Couleur</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actif</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sectors.map(sector => (
              <TableRow key={sector.id}>
                <TableCell>
                  <Circle size={20} fill={sector.couleur} strokeWidth={0} />
                  <span className="sr-only">{sector.couleur}</span>
                </TableCell>
                <TableCell className="font-medium">{sector.nom}</TableCell>
                <TableCell>{sector.description || '-'}</TableCell>
                <TableCell>{sector.estActif ? 'Oui' : 'Non'}</TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => handleOpenForm(sector)}
                    disabled={isLoading}
                    aria-label="Modifier"
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openDeleteDialog(sector)}
                    disabled={isLoading}
                    aria-label="Supprimer"
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <TrashIcon className="h-4 w-4 text-red-500" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Modale/Dialog pour le formulaire */}
      <OperatingSectorForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        initialData={selectedSector}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Modale de confirmation de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le secteur "{sectorToDelete?.nom}"? Cette action
              est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog} disabled={deleteMutation.isPending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
