'use client';

import React, { useState, useMemo } from 'react';
import { logger } from '../../../../lib/logger';
import { OperatingRoom } from '@/modules/planning/bloc-operatoire/types';
import {
  useOperatingRoomsQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
  useOperatingSectorsQuery, // Nécessaire pour mapper secteurId en nom
} from '@/modules/planning/bloc-operatoire/hooks/useOperatingResourceQueries';
import { OperatingRoomForm } from './OperatingRoomForm'; // Importer le formulaire
// Remplacer par le vrai import si possible
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
import { PencilIcon, TrashIcon, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';

export function OperatingRoomList() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<OperatingRoom | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<OperatingRoom | null>(null);

  // Récupérer les données des salles et des secteurs
  const {
    data: rooms = [],
    isLoading: isLoadingRooms,
    error: roomsError,
  } = useOperatingRoomsQuery();
  const { data: sectors = [], isLoading: isLoadingSectors } = useOperatingSectorsQuery();

  // Créer un mapping ID de secteur -> Nom de secteur pour affichage facile
  const sectorMap = useMemo(() => {
    const map = new Map<string, string>();
    sectors.forEach(sector => map.set(sector.id, sector.nom));
    return map;
  }, [sectors]);

  // Mutations
  const createMutation = useCreateRoomMutation();
  const updateMutation = useUpdateRoomMutation();
  const deleteMutation = useDeleteRoomMutation();

  const handleOpenForm = (room?: OperatingRoom) => {
    setSelectedRoom(room || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedRoom(null);
  };

  const handleFormSubmit = async (formData: Omit<OperatingRoom, 'id'>, id?: string) => {
    try {
      if (id) {
        await updateMutation.mutateAsync({ id, data: formData });
        toast.success('Salle mise à jour avec succès !');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Salle créée avec succès !');
      }
      handleCloseForm();
    } catch (error) {
      toast.error(
        `Erreur lors de la sauvegarde de la salle: ${error instanceof Error ? error.message : String(error)}`
      );
      logger.error(
        'Erreur sauvegarde salle:',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };

  const openDeleteDialog = (room: OperatingRoom) => {
    setRoomToDelete(room);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setRoomToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!roomToDelete) return;
    try {
      await deleteMutation.mutateAsync(roomToDelete.id);
      toast.success('Salle supprimée avec succès !');
      closeDeleteDialog();
    } catch (error) {
      toast.error(
        `Erreur lors de la suppression de la salle: ${error instanceof Error ? error.message : String(error)}`
      );
      logger.error(
        'Erreur suppression salle:',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };

  const isLoading =
    isLoadingRooms ||
    isLoadingSectors ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestion des Salles Opératoires</h2>
        {/* Utilisation du bouton HTML temporaire */}
        <button
          onClick={() => handleOpenForm()}
          disabled={isLoading}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          <PlusIcon className="mr-2 h-4 w-4" /> Ajouter une Salle
        </button>
      </div>

      {roomsError && (
        <div className="text-red-600 bg-red-100 p-3 rounded-md">
          Erreur de chargement des salles: {roomsError.message}
        </div>
      )}
      {/* On pourrait aussi afficher l'erreur des secteurs si elle existe */}

      {(isLoadingRooms || isLoadingSectors) && <p>Chargement des données...</p>}

      {!isLoadingRooms && !isLoadingSectors && rooms.length === 0 && (
        <p className="text-gray-500 italic">Aucune salle opératoire définie.</p>
      )}

      {!isLoadingRooms && !isLoadingSectors && rooms.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numéro</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Secteur</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actif</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map(room => (
              <TableRow key={room.id}>
                <TableCell className="font-medium">{room.numero}</TableCell>
                <TableCell>{room.nom}</TableCell>
                <TableCell>{sectorMap.get(room.secteurId) || room.secteurId || 'N/A'}</TableCell>
                <TableCell>{room.description || '-'}</TableCell>
                <TableCell>{room.estActif ? 'Oui' : 'Non'}</TableCell>
                <TableCell className="text-right">
                  {/* Utilisation des boutons HTML temporaires */}
                  <button
                    onClick={() => handleOpenForm(room)}
                    disabled={isLoading}
                    aria-label="Modifier"
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openDeleteDialog(room)}
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
      <OperatingRoomForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        initialData={selectedRoom}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Modale de confirmation de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la salle "{roomToDelete?.nom} (
              {roomToDelete?.numero})"? Cette action est irréversible.
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
