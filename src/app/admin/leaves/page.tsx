'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    ChevronDown,
    AlertCircle,
    FileText,
    User,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    X as XIcon
} from 'lucide-react';

// Type pour les demandes de congés
interface LeaveRequest {
    id: string;
    userId: string;
    user: {
        prenom: string;
        nom: string;
        firstName?: string;
        lastName?: string;
        email: string;
    };
    type: string;
    startDate: string;
    endDate: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    reason?: string;
    countedDays: number;
    createdAt: string;
}

export default function AdminLeavesPage() {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilters, setStatusFilters] = useState<string[]>(['PENDING', 'APPROVED']);
    const [typeFilters, setTypeFilters] = useState<string[]>([]);
    const [types, setTypes] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // Vérifier si l'utilisateur est admin
    useEffect(() => {
        setMounted(true);

        if (mounted && !authLoading) {
            const isAdmin = user && (user.role === 'ADMIN_TOTAL' || user.role === 'ADMIN_PARTIEL');
            if (!isAdmin) {
                router.push('/'); // Rediriger les non-admins
            }
        }
    }, [user, authLoading, mounted, router]);

    // Récupérer les demandes de congés
    useEffect(() => {
        fetchRequests();
        fetchLeaveTypes();
    }, [statusFilters, typeFilters]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            // Modification: utiliser un objet params au lieu de URLSearchParams
            const params: Record<string, any> = {};

            // Si des statuts sont sélectionnés, les ajouter sous forme de tableau
            if (statusFilters.length > 0 && statusFilters.length < 4) {
                params.status = statusFilters;
            }

            if (typeFilters.length > 0) {
                params.type = typeFilters;
            }

            // Passer l'objet params directement à axios
            const response = await axios.get('/api/leaves', { params });
            setRequests(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Erreur lors du chargement des demandes de congés:', error);
            toast.error('Erreur lors du chargement des demandes de congés');
            setLoading(false);
        }
    };

    const fetchLeaveTypes = async () => {
        try {
            const response = await axios.get('/api/leaves/types');
            setTypes(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des types de congés:', error);
        }
    };

    const handleStatusFilterChange = (status: string) => {
        setStatusFilters(prev => {
            if (prev.includes(status)) {
                return prev.filter(s => s !== status);
            } else {
                return [...prev, status];
            }
        });
    };

    const handleTypeFilterChange = (type: string) => {
        setTypeFilters(prev => {
            if (prev.includes(type)) {
                return prev.filter(t => t !== type);
            } else {
                return [...prev, type];
            }
        });
    };

    const handleApprove = async (id: string) => {
        try {
            setProcessingId(id);
            await axios.put(`/api/leaves/${id}/approve`);
            toast.success('Demande approuvée avec succès');

            // Mettre à jour localement
            setRequests(prev =>
                prev.map(req =>
                    req.id === id ? { ...req, status: 'APPROVED' } : req
                )
            );

            if (selectedRequest?.id === id) {
                setSelectedRequest(prev => prev ? { ...prev, status: 'APPROVED' } : null);
            }
        } catch (error) {
            console.error('Erreur lors de l\'approbation de la demande:', error);
            toast.error('Erreur lors de l\'approbation de la demande');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        try {
            setProcessingId(id);
            await axios.put(`/api/leaves/${id}/reject`);
            toast.success('Demande refusée avec succès');

            // Mettre à jour localement
            setRequests(prev =>
                prev.map(req =>
                    req.id === id ? { ...req, status: 'REJECTED' } : req
                )
            );

            if (selectedRequest?.id === id) {
                setSelectedRequest(prev => prev ? { ...prev, status: 'REJECTED' } : null);
            }
        } catch (error) {
            console.error('Erreur lors du refus de la demande:', error);
            toast.error('Erreur lors du refus de la demande');
        } finally {
            setProcessingId(null);
        }
    };

    const openRequestDetails = (request: LeaveRequest) => {
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-50 border-yellow-300 text-yellow-700';
            case 'APPROVED': return 'bg-green-50 border-green-300 text-green-700';
            case 'REJECTED': return 'bg-red-50 border-red-300 text-red-700';
            case 'CANCELLED': return 'bg-gray-50 border-gray-300 text-gray-700';
            default: return 'bg-gray-50 border-gray-300 text-gray-700';
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'APPROVED': return 'bg-green-100 text-green-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            case 'CANCELLED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'PENDING': return 'En attente';
            case 'APPROVED': return 'Approuvé';
            case 'REJECTED': return 'Refusé';
            case 'CANCELLED': return 'Annulé';
            default: return status;
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
        } catch (error) {
            return dateString;
        }
    };

    // Filtrer les résultats par terme de recherche
    const filteredRequests = requests.filter(request => {
        if (!searchTerm) return true;

        const searchLower = searchTerm.toLowerCase();
        const userName = `${request.user.prenom || request.user.firstName || ''} ${request.user.nom || request.user.lastName || ''}`.toLowerCase();
        const userEmail = (request.user.email || '').toLowerCase();

        return userName.includes(searchLower) ||
            userEmail.includes(searchLower) ||
            (request.type || '').toLowerCase().includes(searchLower) ||
            (request.reason || '').toLowerCase().includes(searchLower);
    });

    // Obtenir les compteurs
    const counts = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'PENDING').length,
        approved: requests.filter(r => r.status === 'APPROVED').length,
        rejected: requests.filter(r => r.status === 'REJECTED').length,
        cancelled: requests.filter(r => r.status === 'CANCELLED').length,
    };

    // Animation variants
    const fadeIn = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.4 } }
    };

    if (!mounted || authLoading) {
        return (
            <div className="flex justify-center items-center h-64 w-full">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user || (user.role !== 'ADMIN_TOTAL' && user.role !== 'ADMIN_PARTIEL')) {
        return null; // Redirection gérée par l'useEffect
    }

    return (
        <motion.div
            className="max-w-screen-xl mx-auto px-4 py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                >
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Demandes de congés</h1>
                    <p className="text-gray-600">Gérez les demandes de congés du personnel</p>
                </motion.div>

                <motion.div
                    className="flex flex-wrap gap-2 mt-4 md:mt-0"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <button
                        onClick={() => setStatusFilters(['PENDING', 'APPROVED'])}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${statusFilters.length === 2 && statusFilters.includes('PENDING') && statusFilters.includes('APPROVED')
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                            }`}
                    >
                        Actives
                    </button>
                    <button
                        onClick={() => handleStatusFilterChange('PENDING')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${statusFilters.includes('PENDING')
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                            }`}
                    >
                        <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            En attente ({counts.pending})
                        </div>
                    </button>
                    <button
                        onClick={() => handleStatusFilterChange('APPROVED')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${statusFilters.includes('APPROVED')
                            ? 'bg-green-100 text-green-700'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                            }`}
                    >
                        <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approuvées ({counts.approved})
                        </div>
                    </button>
                    <button
                        onClick={() => handleStatusFilterChange('REJECTED')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${statusFilters.includes('REJECTED')
                            ? 'bg-red-100 text-red-700'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                            }`}
                    >
                        <div className="flex items-center">
                            <XCircle className="w-4 h-4 mr-2" />
                            Refusées ({counts.rejected})
                        </div>
                    </button>
                </motion.div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Rechercher un utilisateur, type, raison..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                            onClick={() => setSearchTerm('')}
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {types.length > 0 && (
                    <div className="relative">
                        <button
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
                        >
                            <Filter className="w-4 h-4" />
                            <span>Types</span>
                            <ChevronDown className="w-4 h-4" />
                        </button>
                        {/* Dropdown pour les types - à implémenter si nécessaire */}
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredRequests.length === 0 ? (
                        <motion.div
                            className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-center"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune demande trouvée</h3>
                            <p className="mt-1 text-gray-500">Aucune demande de congé ne correspond aux critères sélectionnés.</p>
                        </motion.div>
                    ) : (
                        filteredRequests.map((request, index) => (
                            <motion.div
                                key={request.id}
                                className={`border-l-4 ${getStatusColor(request.status)} bg-white shadow-sm rounded-lg overflow-hidden`}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 + index * 0.05, duration: 0.5 }}
                            >
                                <div className="p-5">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center mb-2">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(request.status)}`}>
                                                    {request.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                                                    {request.status === 'APPROVED' && <CheckCircle className="w-3 h-3 mr-1" />}
                                                    {request.status === 'REJECTED' && <XCircle className="w-3 h-3 mr-1" />}
                                                    {getStatusText(request.status)}
                                                </span>
                                                <span className="ml-2 bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                    {request.type}
                                                </span>
                                            </div>
                                            <h2 className="text-lg font-medium text-gray-900 truncate">
                                                {request.user.prenom || request.user.firstName} {request.user.nom || request.user.lastName}
                                            </h2>
                                            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap">
                                                <div className="mt-2 flex items-center text-sm text-gray-500">
                                                    <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                                    {formatDate(request.startDate)} - {formatDate(request.endDate)}
                                                </div>
                                                <div className="mt-2 flex items-center text-sm text-gray-500 sm:ml-4">
                                                    <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                                    {request.countedDays} jour{request.countedDays > 1 ? 's' : ''}
                                                </div>
                                            </div>
                                            {request.reason && (
                                                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{request.reason}</p>
                                            )}
                                        </div>

                                        <div className="mt-4 md:mt-0 flex space-x-2">
                                            {request.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(request.id)}
                                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                                        disabled={processingId === request.id}
                                                    >
                                                        {processingId === request.id ? (
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                        ) : (
                                                            <CheckCircle className="w-4 h-4 mr-2" />
                                                        )}
                                                        Approuver
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(request.id)}
                                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                                        disabled={processingId === request.id}
                                                    >
                                                        {processingId === request.id ? (
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                        ) : (
                                                            <XCircle className="w-4 h-4 mr-2" />
                                                        )}
                                                        Refuser
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => openRequestDetails(request)}
                                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                <FileText className="w-4 h-4 mr-2" />
                                                Détails
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {/* Modal de détails de la demande */}
            {isModalOpen && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">Détails de la demande de congé</h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <XIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-4">
                            <div className="mb-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedRequest.status)}`}>
                                    {selectedRequest.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                                    {selectedRequest.status === 'APPROVED' && <CheckCircle className="w-3 h-3 mr-1" />}
                                    {selectedRequest.status === 'REJECTED' && <XCircle className="w-3 h-3 mr-1" />}
                                    {getStatusText(selectedRequest.status)}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Utilisateur</label>
                                    <div className="mt-1 flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                                            {(selectedRequest.user.prenom?.[0] || selectedRequest.user.firstName?.[0] || '') +
                                                (selectedRequest.user.nom?.[0] || selectedRequest.user.lastName?.[0] || '')}
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900">
                                                {selectedRequest.user.prenom || selectedRequest.user.firstName} {selectedRequest.user.nom || selectedRequest.user.lastName}
                                            </p>
                                            <p className="text-sm text-gray-500">{selectedRequest.user.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Type de congé</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.type}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Jours comptabilisés</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.countedDays} jour{selectedRequest.countedDays > 1 ? 's' : ''}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Date de début</label>
                                        <p className="mt-1 text-sm text-gray-900">{formatDate(selectedRequest.startDate)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Date de fin</label>
                                        <p className="mt-1 text-sm text-gray-900">{formatDate(selectedRequest.endDate)}</p>
                                    </div>
                                </div>

                                {selectedRequest.reason && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Motif</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.reason}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Date de création</label>
                                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedRequest.createdAt)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                            {selectedRequest.status === 'PENDING' && (
                                <>
                                    <button
                                        onClick={() => {
                                            handleApprove(selectedRequest.id);
                                            setIsModalOpen(false);
                                        }}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                        disabled={processingId === selectedRequest.id}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approuver
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleReject(selectedRequest.id);
                                            setIsModalOpen(false);
                                        }}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        disabled={processingId === selectedRequest.id}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Refuser
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Fermer
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
} 