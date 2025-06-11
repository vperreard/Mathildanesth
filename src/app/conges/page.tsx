'use client';

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  PlusCircle,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Calendar,
  RotateCw,
} from 'lucide-react';
import Button from '@/components/ui/button';

// Importation du store et des composants
import { useLeaveStore } from '@/modules/leaves/store/leaveStore';
// Supprimer l'import direct
// import { LeaveForm } from '@/modules/leaves/components/LeaveForm';
import { LeaveCard } from '@/modules/leaves/components/LeaveCard';
import ConfirmationModal from '@/components/ConfirmationModal';
import { LeaveWithUser, LeaveStatus, LeaveType } from '@/modules/leaves/types/leave';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { logger } from '@/lib/logger';

// Importer LeaveForm avec React.lazy (export nommé)
const LeaveForm = lazy(() =>
  import('@/modules/leaves/components/LeaveForm').then(module => ({ default: module.LeaveForm }))
);

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

export default function LeavesPage() {
  // Auth context
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // State pour les modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [leaveToEdit, setLeaveToEdit] = useState<LeaveWithUser | null>(null);
  const [leaveToCancel, setLeaveToCancel] = useState<LeaveWithUser | null>(null);

  // Utilisation du store des congés
  const {
    leaves,
    leaveBalance,
    isLoading,
    error,
    isSubmitting,
    filters,
    searchTerm,
    currentSort,
    fetchLeaves,
    fetchLeaveBalance,
    createLeave,
    updateLeave,
    cancelLeave,
    setSelectedLeave,
    selectedLeave,
    setSearchTerm,
    setFilter,
    resetFilters,
    setSort,
  } = useLeaveStore();

  // Chargement initial des données
  useEffect(() => {
    if (user && !authLoading) {
      fetchLeaves(user.id);
      fetchLeaveBalance(user.id, new Date().getFullYear());
    }
  }, [user, authLoading, fetchLeaves, fetchLeaveBalance]);

  // Vérifier si on doit ouvrir automatiquement le formulaire de demande
  useEffect(() => {
    const newRequest = searchParams?.get('newRequest');
    if (newRequest === 'true' && !isModalOpen) {
      handleNewLeaveClick();
      // Supprimer le paramètre newRequest de l'URL pour éviter la réouverture
      router.replace('/conges', { scroll: false });
    }

    // Vérifier si on doit afficher un congé spécifique
    const leaveId = searchParams?.get('id');
    if (leaveId && Array.isArray(leaves)) {
      const targetLeave = leaves.find(leave => leave.id === leaveId);
      if (targetLeave) {
        setSelectedLeave(targetLeave);
        setIsDetailModalOpen(true);
      }
    }
  }, [searchParams, isModalOpen, router, leaves, setSelectedLeave]);

  // Filtrage et tri des congés
  const filteredLeaves = React.useMemo(() => {
    if (!leaves || !Array.isArray(leaves) || !leaves.length) return [];

    return leaves
      .filter(leave => {
        // Filtrer par statut si un filtre est activé
        if (filters.statuses && Array.isArray(filters.statuses) && filters.statuses.length > 0) {
          if (!filters.statuses.includes(leave.status)) {
            return false;
          }
        }

        // Recherche textuelle
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const userFullName = leave.user
            ? `${leave.user.prenom} ${leave.user.nom}`.toLowerCase()
            : '';
          const leaveType = leave.type.toLowerCase();

          return userFullName.includes(searchLower) || leaveType.includes(searchLower);
        }

        return true;
      })
      .sort((a, b) => {
        const field = currentSort.field;
        const direction = currentSort.direction;

        // Gestion des champs de date
        if (field === 'startDate' || field === 'endDate' || field === 'createdAt') {
          const dateA = new Date(a[field as keyof LeaveWithUser] as Date);
          const dateB = new Date(b[field as keyof LeaveWithUser] as Date);

          return direction === 'asc'
            ? dateA.getTime() - dateB.getTime()
            : dateB.getTime() - dateA.getTime();
        }

        // Traitement pour le tri sur l'utilisateur
        if (field === 'user') {
          const nameA = a.user ? `${a.user.nom} ${a.user.prenom}` : '';
          const nameB = b.user ? `${b.user.nom} ${b.user.prenom}` : '';

          return direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        }

        // Cas général pour les champs textuels
        const valueA = String(a[field as keyof LeaveWithUser] || '');
        const valueB = String(b[field as keyof LeaveWithUser] || '');

        return direction === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      });
  }, [leaves, filters.statuses, searchTerm, currentSort]);

  // Gestionnaires d'événements
  const handleNewLeaveClick = () => {
    setLeaveToEdit(null);
    setIsModalOpen(true);
  };

  const handleNewRecurringLeaveClick = () => {
    router.push('/conges/recurrents');
  };

  const handleQuotaManagementClick = () => {
    router.push('/conges/quotas');
  };

  const handleEditLeaveClick = (leave: LeaveWithUser) => {
    setLeaveToEdit(leave);
    setIsModalOpen(true);
  };

  const handleCancelLeaveClick = (leave: LeaveWithUser) => {
    setLeaveToCancel(leave);
    setIsConfirmModalOpen(true);
  };

  const handleViewLeaveDetails = (leave: LeaveWithUser) => {
    setSelectedLeave(leave);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setLeaveToEdit(null);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedLeave(null);
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setLeaveToCancel(null);
  };

  const handleStatusFilterChange = (status: LeaveStatus) => {
    const currentStatusFilters = (filters.statuses as LeaveStatus[]) || [];

    if (currentStatusFilters.includes(status)) {
      setFilter(
        'statuses',
        currentStatusFilters.filter(s => s !== status)
      );
    } else {
      setFilter('statuses', [...currentStatusFilters, status]);
    }
  };

  const handleSortChange = (field: string) => {
    setSort(field);
  };

  const handleLeaveCreatedOrUpdated = async (leaveData: unknown) => {
    try {
      if (leaveToEdit) {
        await updateLeave(leaveToEdit.id, leaveData);
      } else {
        // LeaveForm renvoie déjà les bonnes données formatées depuis le batch
        // On ne fait que fermer la modal car la création est déjà faite
        logger.info('Congé créé avec succès via batch API');
      }

      setIsModalOpen(false);
      setLeaveToEdit(null);
      // Rafraîchir la liste des congés
      fetchLeaves({ userId: user?.id });
    } catch (error) {
      logger.error('Erreur lors de la création/mise à jour du congé:', error);
      // L'erreur est déjà gérée dans LeaveForm
    }
  };

  const handleConfirmCancelLeave = async () => {
    if (leaveToCancel) {
      await cancelLeave(leaveToCancel.id);
      setIsConfirmModalOpen(false);
      setLeaveToCancel(null);
    }
  };

  // Synthèse des compteurs pour le dashboard
  const counts = {
    total: Array.isArray(leaves) ? leaves.length : 0,
    pending: Array.isArray(leaves)
      ? leaves.filter(r => r.status === LeaveStatus.PENDING).length
      : 0,
    approved: Array.isArray(leaves)
      ? leaves.filter(r => r.status === LeaveStatus.APPROVED).length
      : 0,
    rejected: Array.isArray(leaves)
      ? leaves.filter(r => r.status === LeaveStatus.REJECTED).length
      : 0,
    cancelled: Array.isArray(leaves)
      ? leaves.filter(r => r.status === LeaveStatus.CANCELLED).length
      : 0,
  };

  // Composant d'état et indicateur de chargement préliminaire
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Affichage de l'état de chargement
  if (authLoading || !mounted) {
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Vérification de l'authentification
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4"
          role="alert"
        >
          <p className="font-bold">Accès refusé</p>
          <p>Vous devez être connecté pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  // Rendu du composant sans le SessionProvider car il est déjà dans le provider global
  return (
    <motion.div
      className="max-w-screen-xl mx-auto px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div initial="hidden" animate="visible" variants={fadeIn}>
        <header className="mb-8">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-800">Mes Congés</h1>
            <div className="flex gap-2">
              <Button onClick={handleNewLeaveClick} variant="default" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Nouvelle Demande
              </Button>
              <Button onClick={handleNewRecurringLeaveClick} variant="outline" size="sm">
                <RotateCw className="mr-2 h-4 w-4" /> Demande Récurrente
              </Button>
              <Button onClick={handleQuotaManagementClick} variant="secondary" size="sm">
                <Calendar className="mr-2 h-4 w-4" /> Gérer Quotas
              </Button>
            </div>
          </div>
          {/* Section Résumé Solde */}
          {leaveBalance && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
              <p className="text-sm text-blue-700">
                Solde de congés payés pour {leaveBalance.year} :{' '}
                <span className="font-semibold">
                  {leaveBalance.balances?.ANNUAL?.remaining || 0}
                </span>{' '}
                jours restants sur {leaveBalance.balances?.ANNUAL?.initial || 0}
              </p>
              {/* TODO: Ajouter peut-être un lien vers la gestion des quotas */}
            </div>
          )}
        </header>

        {/* Barre de recherche et filtres */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <div className="relative flex-grow max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher (type, motif...)"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600">Statut:</span>
            {[
              LeaveStatus.PENDING,
              LeaveStatus.APPROVED,
              LeaveStatus.REJECTED,
              LeaveStatus.CANCELLED,
            ].map(status => (
              <button
                key={status}
                onClick={() => handleStatusFilterChange(status)}
                className={`px-3 py-1 text-xs rounded-full border ${
                  ((filters.statuses as LeaveStatus[]) || []).includes(status)
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
              Réinitialiser
            </Button>
          </div>
        </div>

        {/* Liste des congés */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        )}

        {!isLoading && error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Erreur !</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {!isLoading && !error && filteredLeaves.length === 0 && (
          <div className="text-center py-10 text-gray-500">Aucune demande de congé trouvée.</div>
        )}

        {!isLoading && !error && filteredLeaves.length > 0 && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            {filteredLeaves.map(leave => (
              <motion.div key={leave.id} variants={fadeIn}>
                <LeaveCard
                  leave={leave}
                  onEdit={() => handleEditLeaveClick(leave)}
                  onCancel={() => handleCancelLeaveClick(leave)}
                  onView={() => handleViewLeaveDetails(leave)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Modale pour créer/modifier un congé */}
      {isModalOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <LoadingSpinner size="lg" />
            </div>
          }
        >
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-4 text-center">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <div className="inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
                <button
                  type="button"
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-500"
                  onClick={handleCloseModal}
                >
                  <span className="sr-only">Fermer</span>
                  <XCircle className="h-6 w-6" />
                </button>
                <LeaveForm
                  userId={user?.id || 0}
                  initialData={leaveToEdit}
                  onSuccess={handleLeaveCreatedOrUpdated}
                />
              </div>
            </div>
          </div>
        </Suspense>
      )}

      {/* Modale pour voir les détails */}
      {isDetailModalOpen && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
            <button
              onClick={handleCloseDetailModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4">Détails du Congé</h2>
            <LeaveCard
              leave={selectedLeave}
              onEdit={() => {}}
              onCancel={() => {}}
              onView={() => {}}
              isExpanded={true}
            />
            {/* Ajouter ici d'autres détails si nécessaire */}
          </div>
        </div>
      )}

      {/* Modale de confirmation d'annulation */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={handleConfirmCancelLeave}
        title="Confirmer l'annulation"
        message={`Êtes-vous sûr de vouloir annuler cette demande de congé (${leaveToCancel?.type} du ${leaveToCancel ? format(new Date(leaveToCancel.startDate), 'dd/MM/yyyy') : ''}) ?`}
        confirmButtonText="Confirmer l'annulation"
        cancelButtonText="Ne pas annuler"
        isLoading={isSubmitting}
      />
    </motion.div>
  );
}
