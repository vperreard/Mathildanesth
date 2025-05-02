'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Calendar,
    Users,
    Filter,
    Clock,
    ChevronDown,
    Search,
    CheckCircle,
    XCircle,
    AlertCircle,
    FileText
} from 'lucide-react';

// Types
type RequestType = 'congés' | 'affectations' | 'autres' | 'tous';
type RequestStatus = 'en-attente' | 'approuvée' | 'refusée' | 'tous';

interface Request {
    id: string;
    type: RequestType;
    status: RequestStatus;
    userId: string;
    userName: string;
    userAvatar?: string;
    title: string;
    description: string;
    dateSubmitted: string;
    dates?: { start: string; end: string };
}

// Données fictives pour la démo
const mockRequests: Request[] = [
    {
        id: '1',
        type: 'congés',
        status: 'en-attente',
        userId: 'user1',
        userName: 'Dr. Sophie Martin',
        title: 'Congés d\'été',
        description: 'Demande de congés pour vacances familiales',
        dateSubmitted: '2023-06-15',
        dates: { start: '2023-07-10', end: '2023-07-24' }
    },
    {
        id: '2',
        type: 'affectations',
        status: 'en-attente',
        userId: 'user2',
        userName: 'Dr. Thomas Dubois',
        title: 'Changement de service',
        description: 'Demande de transfert au service de chirurgie',
        dateSubmitted: '2023-06-14'
    },
    {
        id: '3',
        type: 'congés',
        status: 'approuvée',
        userId: 'user3',
        userName: 'Dr. Lucie Bernard',
        title: 'Congé maladie',
        description: 'Prolongation de congé maladie suite à une opération',
        dateSubmitted: '2023-06-12',
        dates: { start: '2023-06-25', end: '2023-07-15' }
    },
    {
        id: '4',
        type: 'autres',
        status: 'refusée',
        userId: 'user4',
        userName: 'Dr. Marc Lambert',
        title: 'Formation spécialisée',
        description: 'Demande de participation à une formation en anesthésie pédiatrique',
        dateSubmitted: '2023-06-10'
    },
    {
        id: '5',
        type: 'congés',
        status: 'en-attente',
        userId: 'user5',
        userName: 'Dr. Claire Petit',
        title: 'Congé parental',
        description: 'Demande de congé parental de 3 mois',
        dateSubmitted: '2023-06-08',
        dates: { start: '2023-09-01', end: '2023-11-30' }
    },
    {
        id: '6',
        type: 'affectations',
        status: 'approuvée',
        userId: 'user6',
        userName: 'Dr. Paul Moreau',
        title: 'Changement d\'horaire',
        description: 'Demande de passage en horaires de jour uniquement',
        dateSubmitted: '2023-06-05'
    },
    {
        id: '7',
        type: 'autres',
        status: 'en-attente',
        userId: 'user7',
        userName: 'Dr. Emilie Roussel',
        title: 'Matériel spécifique',
        description: 'Demande de matériel spécifique pour anesthésie pédiatrique',
        dateSubmitted: '2023-06-03'
    }
];

export default function RequetesAdminPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [typeFilter, setTypeFilter] = useState<RequestType>('tous');
    const [statusFilter, setStatusFilter] = useState<RequestStatus>('tous');
    const [searchQuery, setSearchQuery] = useState('');
    const [requests, setRequests] = useState<Request[]>(mockRequests);
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
    const [showRequestDetails, setShowRequestDetails] = useState(false);

    // Vérifier si l'utilisateur est admin
    useEffect(() => {
        setMounted(true);

        if (mounted && !isLoading) {
            const isAdmin = user && (user.role === 'ADMIN_TOTAL' || user.role === 'ADMIN_PARTIEL');
            if (!isAdmin) {
                router.push('/'); // Rediriger les non-admins
            }
        }
    }, [user, isLoading, mounted, router]);

    // Filtrer les requêtes
    const filteredRequests = requests.filter(request => {
        // Filtre par type
        if (typeFilter !== 'tous' && request.type !== typeFilter) return false;

        // Filtre par statut
        if (statusFilter !== 'tous' && request.status !== statusFilter) return false;

        // Recherche textuelle
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                request.title.toLowerCase().includes(query) ||
                request.description.toLowerCase().includes(query) ||
                request.userName.toLowerCase().includes(query)
            );
        }

        return true;
    });

    // Nombre de requêtes par type et statut
    const counts = {
        total: requests.length,
        enAttente: requests.filter(r => r.status === 'en-attente').length,
        approuvées: requests.filter(r => r.status === 'approuvée').length,
        refusées: requests.filter(r => r.status === 'refusée').length,
    };

    // Fonctions pour les actions sur les requêtes
    const approveRequest = (requestId: string) => {
        setRequests(prevRequests =>
            prevRequests.map(req =>
                req.id === requestId ? { ...req, status: 'approuvée' } : req
            )
        );

        if (selectedRequest?.id === requestId) {
            setSelectedRequest(prev => prev ? { ...prev, status: 'approuvée' } : null);
        }
    };

    const rejectRequest = (requestId: string) => {
        setRequests(prevRequests =>
            prevRequests.map(req =>
                req.id === requestId ? { ...req, status: 'refusée' } : req
            )
        );

        if (selectedRequest?.id === requestId) {
            setSelectedRequest(prev => prev ? { ...prev, status: 'refusée' } : null);
        }
    };

    const openRequestDetails = (request: Request) => {
        setSelectedRequest(request);
        setShowRequestDetails(true);
    };

    const closeRequestDetails = () => {
        setShowRequestDetails(false);
    };

    // Animation variants
    const fadeIn = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } }
    };

    if (!mounted || isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    // Si l'utilisateur n'est pas admin, la redirection sera gérée par l'effet
    if (!user || (user.role !== 'ADMIN_TOTAL' && user.role !== 'ADMIN_PARTIEL')) {
        return null;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-display font-bold text-gray-900">Gestion des requêtes</h1>
                <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-2">Total:</span>
                    <span className="font-semibold text-gray-900 mr-4">{counts.total}</span>

                    <span className="mr-2">En attente:</span>
                    <span className="font-semibold text-primary-600 mr-4">{counts.enAttente}</span>

                    <span className="mr-2">Approuvées:</span>
                    <span className="font-semibold text-green-600 mr-4">{counts.approuvées}</span>

                    <span className="mr-2">Refusées:</span>
                    <span className="font-semibold text-red-600">{counts.refusées}</span>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft p-6 mb-8">
                {/* Filtres et recherche */}
                <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative inline-block">
                            <div className="flex items-center">
                                <button
                                    className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    onClick={() => setTypeFilter(typeFilter === 'tous' ? 'congés' : 'tous')}
                                >
                                    <div className="flex items-center">
                                        {typeFilter === 'congés' && <Calendar className="w-4 h-4 mr-2 text-primary-500" />}
                                        {typeFilter === 'affectations' && <Users className="w-4 h-4 mr-2 text-primary-500" />}
                                        {typeFilter === 'autres' && <Filter className="w-4 h-4 mr-2 text-primary-500" />}
                                        {typeFilter === 'tous' ? 'Tous les types' :
                                            typeFilter === 'congés' ? 'Congés' :
                                                typeFilter === 'affectations' ? 'Affectations' : 'Autres'
                                        }
                                    </div>
                                    <ChevronDown className="w-4 h-4 ml-2" />
                                </button>
                                {typeFilter !== 'tous' && (
                                    <button
                                        onClick={() => setTypeFilter('tous')}
                                        className="ml-2 text-gray-400 hover:text-gray-600"
                                        title="Réinitialiser le filtre"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            <div className="absolute z-10 w-48 mt-1 bg-white border border-gray-200 rounded-md shadow-lg hidden">
                                <div className="py-1">
                                    <button
                                        className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                        onClick={() => setTypeFilter('tous')}
                                    >
                                        Tous les types
                                    </button>
                                    <button
                                        className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                        onClick={() => setTypeFilter('congés')}
                                    >
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 text-primary-500" />
                                            Congés
                                        </div>
                                    </button>
                                    <button
                                        className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                        onClick={() => setTypeFilter('affectations')}
                                    >
                                        <div className="flex items-center">
                                            <Users className="w-4 h-4 mr-2 text-primary-500" />
                                            Affectations
                                        </div>
                                    </button>
                                    <button
                                        className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                        onClick={() => setTypeFilter('autres')}
                                    >
                                        <div className="flex items-center">
                                            <Filter className="w-4 h-4 mr-2 text-primary-500" />
                                            Autres
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="relative inline-block">
                            <div className="flex items-center">
                                <button
                                    className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    onClick={() => setStatusFilter(statusFilter === 'tous' ? 'en-attente' : 'tous')}
                                >
                                    <div className="flex items-center">
                                        {statusFilter === 'en-attente' && <Clock className="w-4 h-4 mr-2 text-yellow-500" />}
                                        {statusFilter === 'approuvée' && <CheckCircle className="w-4 h-4 mr-2 text-green-500" />}
                                        {statusFilter === 'refusée' && <XCircle className="w-4 h-4 mr-2 text-red-500" />}
                                        {statusFilter === 'tous' ? 'Tous les statuts' :
                                            statusFilter === 'en-attente' ? 'En attente' :
                                                statusFilter === 'approuvée' ? 'Approuvées' : 'Refusées'
                                        }
                                    </div>
                                    <ChevronDown className="w-4 h-4 ml-2" />
                                </button>
                                {statusFilter !== 'tous' && (
                                    <button
                                        onClick={() => setStatusFilter('tous')}
                                        className="ml-2 text-gray-400 hover:text-gray-600"
                                        title="Réinitialiser le filtre"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            <div className="absolute z-10 w-48 mt-1 bg-white border border-gray-200 rounded-md shadow-lg hidden">
                                <div className="py-1">
                                    <button
                                        className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                        onClick={() => setStatusFilter('tous')}
                                    >
                                        Tous les statuts
                                    </button>
                                    <button
                                        className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                        onClick={() => setStatusFilter('en-attente')}
                                    >
                                        <div className="flex items-center">
                                            <Clock className="w-4 h-4 mr-2 text-yellow-500" />
                                            En attente
                                        </div>
                                    </button>
                                    <button
                                        className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                        onClick={() => setStatusFilter('approuvée')}
                                    >
                                        <div className="flex items-center">
                                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                            Approuvées
                                        </div>
                                    </button>
                                    <button
                                        className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                        onClick={() => setStatusFilter('refusée')}
                                    >
                                        <div className="flex items-center">
                                            <XCircle className="w-4 h-4 mr-2 text-red-500" />
                                            Refusées
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {statusFilter === 'refusée' && (
                        <div className="mt-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p>
                                    Les requêtes refusées sont archivées et ne sont pas visibles sur le calendrier. Elles sont conservées uniquement à des fins d'historique.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="input pl-10 w-full sm:w-64"
                            placeholder="Rechercher dans les requêtes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                onClick={() => setSearchQuery('')}
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Liste des requêtes */}
                {filteredRequests.length === 0 ? (
                    <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Aucune requête trouvée</h3>
                        <p className="text-gray-500">Essayez de modifier vos filtres ou votre recherche</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre / Description</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRequests.map((request) => (
                                    <tr
                                        key={request.id}
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => openRequestDetails(request)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold">
                                                    {request.userName.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{request.userName}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{request.title}</div>
                                            <div className="text-sm text-gray-500 line-clamp-1">{request.description}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${request.type === 'congés' ? 'bg-blue-100 text-blue-800' :
                                                    request.type === 'affectations' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-gray-100 text-gray-800'}`}
                                            >
                                                {request.type === 'congés' && <Calendar className="w-3 h-3 mr-1" />}
                                                {request.type === 'affectations' && <Users className="w-3 h-3 mr-1" />}
                                                {request.type === 'autres' && <Filter className="w-3 h-3 mr-1" />}
                                                {request.type === 'congés' ? 'Congés' :
                                                    request.type === 'affectations' ? 'Affectations' : 'Autre'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${request.status === 'en-attente' ? 'bg-yellow-100 text-yellow-800' :
                                                    request.status === 'approuvée' ? 'bg-green-100 text-green-800' :
                                                        'bg-red-100 text-red-800'}`}
                                            >
                                                {request.status === 'en-attente' && <Clock className="w-3 h-3 mr-1" />}
                                                {request.status === 'approuvée' && <CheckCircle className="w-3 h-3 mr-1" />}
                                                {request.status === 'refusée' && <XCircle className="w-3 h-3 mr-1" />}
                                                {request.status === 'en-attente' ? 'En attente' :
                                                    request.status === 'approuvée' ? 'Approuvée' : 'Refusée'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(request.dateSubmitted).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => approveRequest(request.id)}
                                                    className={`p-1 rounded-full ${request.status === 'approuvée'
                                                        ? 'text-green-600 bg-green-50'
                                                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                                        } transition-colors`}
                                                    disabled={request.status === 'approuvée'}
                                                    title="Approuver"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => rejectRequest(request.id)}
                                                    className={`p-1 rounded-full ${request.status === 'refusée'
                                                        ? 'text-red-600 bg-red-50'
                                                        : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                                        } transition-colors`}
                                                    disabled={request.status === 'refusée'}
                                                    title="Refuser"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => openRequestDetails(request)}
                                                    className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                                                    title="Détails"
                                                >
                                                    <FileText className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal pour afficher les détails d'une requête */}
            {showRequestDetails && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                        className="absolute inset-0 bg-black bg-opacity-30"
                        onClick={closeRequestDetails}
                    ></motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 z-10"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedRequest.title}</h2>
                                    <div className="flex mt-2 space-x-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${selectedRequest.type === 'congés' ? 'bg-blue-100 text-blue-800' :
                                                selectedRequest.type === 'affectations' ? 'bg-purple-100 text-purple-800' :
                                                    'bg-gray-100 text-gray-800'}`}
                                        >
                                            {selectedRequest.type === 'congés' && <Calendar className="w-3 h-3 mr-1" />}
                                            {selectedRequest.type === 'affectations' && <Users className="w-3 h-3 mr-1" />}
                                            {selectedRequest.type === 'autres' && <Filter className="w-3 h-3 mr-1" />}
                                            {selectedRequest.type === 'congés' ? 'Congés' :
                                                selectedRequest.type === 'affectations' ? 'Affectations' : 'Autre'}
                                        </span>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${selectedRequest.status === 'en-attente' ? 'bg-yellow-100 text-yellow-800' :
                                                selectedRequest.status === 'approuvée' ? 'bg-green-100 text-green-800' :
                                                    'bg-red-100 text-red-800'}`}
                                        >
                                            {selectedRequest.status === 'en-attente' && <Clock className="w-3 h-3 mr-1" />}
                                            {selectedRequest.status === 'approuvée' && <CheckCircle className="w-3 h-3 mr-1" />}
                                            {selectedRequest.status === 'refusée' && <XCircle className="w-3 h-3 mr-1" />}
                                            {selectedRequest.status === 'en-attente' ? 'En attente' :
                                                selectedRequest.status === 'approuvée' ? 'Approuvée' : 'Refusée'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={closeRequestDetails}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-center mb-4">
                                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold">
                                        {selectedRequest.userName.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-lg font-medium text-gray-900">{selectedRequest.userName}</div>
                                        <div className="text-sm text-gray-500">
                                            Soumis le {new Date(selectedRequest.dateSubmitted).toLocaleDateString('fr-FR')}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                    <div className="text-sm text-gray-700 whitespace-pre-line">
                                        {selectedRequest.description}
                                    </div>
                                </div>

                                {selectedRequest.dates && (
                                    <div className="border border-gray-200 p-4 rounded-lg mb-4">
                                        <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 text-primary-500" />
                                            Période demandée
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-xs text-gray-500">Date de début</div>
                                                <div className="text-sm font-medium">{new Date(selectedRequest.dates.start).toLocaleDateString('fr-FR')}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500">Date de fin</div>
                                                <div className="text-sm font-medium">{new Date(selectedRequest.dates.end).toLocaleDateString('fr-FR')}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedRequest.status === 'refusée' && (
                                    <div className="bg-red-50 border border-red-100 p-4 rounded-lg mb-4">
                                        <h3 className="font-medium text-red-800 mb-2 flex items-center">
                                            <XCircle className="w-4 h-4 mr-2 text-red-500" />
                                            Requête refusée
                                        </h3>
                                        <p className="text-sm text-red-700">
                                            Cette requête a été refusée et n'apparaît pas sur le calendrier. Elle est conservée uniquement à des fins d'archivage.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4">
                                <button
                                    onClick={closeRequestDetails}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Fermer
                                </button>

                                {selectedRequest.status !== 'refusée' && (
                                    <button
                                        onClick={() => rejectRequest(selectedRequest.id)}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                                    >
                                        Refuser
                                    </button>
                                )}

                                {selectedRequest.status !== 'approuvée' && (
                                    <button
                                        onClick={() => approveRequest(selectedRequest.id)}
                                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                                    >
                                        Approuver
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
} 