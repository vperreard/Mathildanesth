'use client';

import { useState, useEffect } from 'react';
import { logger } from "../../lib/logger";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, CheckCircle, XCircle, AlarmClock, CheckCheck,
    PlusCircle, ChevronDown, ChevronUp, Filter
} from 'lucide-react';

// Types pour les requêtes
enum UserRequestStatus {
    SUBMITTED = 'SUBMITTED',
    IN_PROGRESS = 'IN_PROGRESS',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    COMPLETED = 'COMPLETED',
    CANCELLED_BY_USER = 'CANCELLED_BY_USER'
}

interface RequestType {
    id: string;
    name: string;
    description?: string;
    requiresAdminApproval: boolean;
    isActive: boolean;
}

interface UserProfile {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    professionalRole?: string;
}

interface UserRequest {
    id: string;
    title: string;
    description: string;
    status: UserRequestStatus;
    adminNotes?: string;
    userId: number;
    requestTypeId: string;
    assignedToId?: number;
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
    user?: UserProfile;
    requestType?: RequestType;
    assignedTo?: UserProfile;
}

// Composant de page principale des requêtes utilisateur
export default function UserRequestsPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<UserRequest[]>([]);
    const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // État pour le nouveau formulaire de requête
    const [showNewRequestForm, setShowNewRequestForm] = useState(false);
    const [newRequest, setNewRequest] = useState({
        title: '',
        description: '',
        requestTypeId: ''
    });

    // États pour le filtrage et le tri
    const [selectedStatus, setSelectedStatus] = useState<UserRequestStatus | 'ALL'>('ALL');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [submitting, setSubmitting] = useState(false);

    // Charger les requêtes et les types de requêtes au chargement de la page
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Fetch requests
                const requestsPromise = fetch('http://localhost:3000/api/demandes').then(async res => {
                    if (!res.ok) {
                        let errorMsg = `Erreur ${res.status} lors de la récupération des requêtes.`;
                        try {
                            const errorData = await res.json();
                            errorMsg = errorData.error || errorMsg;
                        } catch (parseError) { /* Do nothing, use statusText based error */ }
                        throw new Error(errorMsg);
                    }
                    return res.json();
                });

                // Fetch request types
                const requestTypesPromise = fetch('http://localhost:3000/api/request-types').then(async res => {
                    if (!res.ok) {
                        let errorMsg = `Erreur ${res.status} lors de la récupération des types de requêtes.`;
                        try {
                            const errorData = await res.json();
                            errorMsg = errorData.error || errorMsg;
                        } catch (parseError) { /* Do nothing, use statusText based error */ }
                        throw new Error(errorMsg);
                    }
                    return res.json();
                });

                const [requestsResult, requestTypesResult] = await Promise.allSettled([
                    requestsPromise,
                    requestTypesPromise
                ]);

                let combinedErrorMessages = '';

                if (requestsResult.status === 'fulfilled') {
                    setRequests(requestsResult.value);
                } else {
                    logger.error('Erreur lors de la récupération des requêtes:', requestsResult.reason);
                    combinedErrorMessages += requestsResult.reason.message + '\n';
                    setRequests([]);
                }

                if (requestTypesResult.status === 'fulfilled') {
                    // Filtrer les types de requêtes actifs pour le formulaire utilisateur
                    const activeTypes = requestTypesResult.value.filter((type: RequestType) => type.isActive);
                    setRequestTypes(activeTypes);
                } else {
                    logger.error('Erreur lors de la récupération des types de requêtes:', requestTypesResult.reason);
                    combinedErrorMessages += requestTypesResult.reason.message + '\n';
                    setRequestTypes([]);
                }

                if (combinedErrorMessages) {
                    setError(combinedErrorMessages.trim());
                }

            } catch (err) { // Catch for unexpected errors not directly from promises
                const errorMessage = err instanceof Error ? err.message : 'Une erreur inattendue est survenue lors du chargement des données.';
                setError(errorMessage);
                logger.error('Erreur inattendue lors du chargement initial des données:', err);
                setRequests([]);
                setRequestTypes([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Soumettre une nouvelle requête
    const handleSubmitRequest = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newRequest.title || !newRequest.description || !newRequest.requestTypeId) {
            setError('Veuillez remplir tous les champs obligatoires.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:3000/api/demandes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newRequest),
            });

            if (!response.ok) {
                let errorMessage = 'Erreur lors de la soumission de la requête.';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || `Erreur ${response.status}: ${response.statusText}`;
                } catch (parseError) {
                    errorMessage = `Erreur ${response.status}: ${response.statusText}. La réponse du serveur n\'est pas au format JSON.`;
                }
                throw new Error(errorMessage);
            }

            const createdRequest = await response.json();

            // Ajouter la nouvelle requête à la liste et réinitialiser le formulaire
            setRequests(prev => [createdRequest, ...prev]);
            setNewRequest({
                title: '',
                description: '',
                requestTypeId: ''
            });
            setShowNewRequestForm(false);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
            logger.error('Erreur lors de la soumission de la requête:', err);
        } finally {
            setSubmitting(false);
        }
    };

    // Annuler une requête utilisateur
    const handleCancelRequest = async (requestId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir annuler cette requête ? Cette action est irréversible.')) {
            return;
        }
        setError(null); // Clear previous errors before attempting cancel

        try {
            const response = await fetch('http://localhost:3000/api/demandes', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: requestId,
                    status: UserRequestStatus.CANCELLED_BY_USER
                }),
            });

            if (!response.ok) {
                let errorMessage = 'Erreur lors de l\'annulation de la requête.';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || `Erreur ${response.status}: ${response.statusText}`;
                } catch (parseError) {
                    errorMessage = `Erreur ${response.status}: ${response.statusText}. La réponse du serveur n\'est pas au format JSON.`;
                }
                throw new Error(errorMessage);
            }

            const updatedRequest = await response.json();

            // Mettre à jour la requête dans la liste
            setRequests(prev =>
                prev.map(req => req.id === requestId ? updatedRequest : req)
            );

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
            logger.error('Erreur lors de l\'annulation de la requête:', err);
        }
    };

    // Filtrer les requêtes par statut
    const filteredRequests = requests.filter(request => {
        if (selectedStatus === 'ALL') return true;
        return request.status === selectedStatus;
    });

    // Trier les requêtes
    const sortedRequests = [...filteredRequests].sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });

    // Statut de la requête formaté en français et avec icône
    const getStatusDisplay = (status: UserRequestStatus) => {
        switch (status) {
            case UserRequestStatus.SUBMITTED:
                return { text: 'Soumise', icon: <Clock className="w-4 h-4 text-blue-500" />, class: 'text-blue-700 bg-blue-50' };
            case UserRequestStatus.IN_PROGRESS:
                return { text: 'En cours', icon: <AlarmClock className="w-4 h-4 text-amber-500" />, class: 'text-amber-700 bg-amber-50' };
            case UserRequestStatus.APPROVED:
                return { text: 'Approuvée', icon: <CheckCircle className="w-4 h-4 text-emerald-500" />, class: 'text-emerald-700 bg-emerald-50' };
            case UserRequestStatus.REJECTED:
                return { text: 'Rejetée', icon: <XCircle className="w-4 h-4 text-red-500" />, class: 'text-red-700 bg-red-50' };
            case UserRequestStatus.COMPLETED:
                return { text: 'Terminée', icon: <CheckCheck className="w-4 h-4 text-emerald-500" />, class: 'text-emerald-700 bg-emerald-50' };
            case UserRequestStatus.CANCELLED_BY_USER:
                return { text: 'Annulée', icon: <XCircle className="w-4 h-4 text-gray-500" />, class: 'text-gray-700 bg-gray-100' };
            default:
                return { text: 'Inconnu', icon: <Clock className="w-4 h-4" />, class: 'text-gray-700 bg-gray-100' };
        }
    };

    // Peut-on annuler la requête ?
    const canCancelRequest = (request: UserRequest) => {
        return (
            request.status === UserRequestStatus.SUBMITTED ||
            request.status === UserRequestStatus.IN_PROGRESS
        );
    };

    // Formater la date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-display font-bold text-gray-900">Mes Requêtes</h1>

                    <button
                        onClick={() => setShowNewRequestForm(prev => !prev)}
                        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
                    >
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Nouvelle requête
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Formulaire de nouvelle requête */}
                <AnimatePresence>
                    {showNewRequestForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-8 overflow-hidden"
                        >
                            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                <h2 className="text-xl font-semibold mb-4">Soumettre une nouvelle requête</h2>

                                <form onSubmit={handleSubmitRequest}>
                                    <div className="mb-4">
                                        <label htmlFor="requestTypeId" className="block text-gray-700 font-medium mb-2">
                                            Type de requête *
                                        </label>
                                        <select
                                            id="requestTypeId"
                                            value={newRequest.requestTypeId}
                                            onChange={e => setNewRequest(prev => ({ ...prev, requestTypeId: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            required
                                        >
                                            <option value="">Sélectionner un type de requête</option>
                                            {requestTypes.map(type => (
                                                <option key={type.id} value={type.id}>
                                                    {type.name}
                                                </option>
                                            ))}
                                        </select>
                                        {newRequest.requestTypeId && requestTypes.find(t => t.id === newRequest.requestTypeId)?.description && (
                                            <p className="mt-1 text-sm text-gray-500">
                                                {requestTypes.find(t => t.id === newRequest.requestTypeId)?.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
                                            Titre *
                                        </label>
                                        <input
                                            type="text"
                                            id="title"
                                            value={newRequest.title}
                                            onChange={e => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="Titre court et descriptif de votre requête"
                                            maxLength={200}
                                            required
                                        />
                                    </div>

                                    <div className="mb-6">
                                        <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
                                            Description détaillée *
                                        </label>
                                        <textarea
                                            id="description"
                                            value={newRequest.description}
                                            onChange={e => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="Décrivez en détail votre requête, incluez toutes les informations pertinentes"
                                            required
                                        />
                                    </div>

                                    <div className="flex items-center justify-end space-x-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowNewRequestForm(false)}
                                            className="px-4 py-2 text-gray-600 font-medium hover:text-gray-800"
                                            disabled={submitting}
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
                                            disabled={submitting}
                                        >
                                            {submitting ? 'Soumission...' : 'Soumettre la requête'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Filtres et options de tri */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-wrap gap-4 items-center">
                    <div className="flex items-center">
                        <Filter className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-gray-700 font-medium mr-2">Filtrer par statut:</span>
                        <select
                            value={selectedStatus}
                            onChange={e => setSelectedStatus(e.target.value as UserRequestStatus | 'ALL')}
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="ALL">Tous les statuts</option>
                            <option value={UserRequestStatus.SUBMITTED}>Soumises</option>
                            <option value={UserRequestStatus.IN_PROGRESS}>En cours</option>
                            <option value={UserRequestStatus.APPROVED}>Approuvées</option>
                            <option value={UserRequestStatus.REJECTED}>Rejetées</option>
                            <option value={UserRequestStatus.COMPLETED}>Terminées</option>
                            <option value={UserRequestStatus.CANCELLED_BY_USER}>Annulées</option>
                        </select>
                    </div>

                    <div className="flex items-center ml-auto">
                        <span className="text-gray-700 font-medium mr-2">Trier par date:</span>
                        <button
                            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="inline-flex items-center text-gray-600 hover:text-gray-900"
                        >
                            {sortDirection === 'desc' ? (
                                <>Plus récent d'abord <ChevronDown className="w-4 h-4 ml-1" /></>
                            ) : (
                                <>Plus ancien d'abord <ChevronUp className="w-4 h-4 ml-1" /></>
                            )}
                        </button>
                    </div>
                </div>

                {/* Liste des requêtes */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
                        <p className="mt-4 text-gray-600">Chargement de vos requêtes...</p>
                    </div>
                ) : sortedRequests.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
                        <p className="text-gray-500 mb-4">
                            {selectedStatus === 'ALL'
                                ? 'Vous n\'avez encore soumis aucune requête.'
                                : `Vous n'avez aucune requête avec le statut "${getStatusDisplay(selectedStatus as UserRequestStatus).text}".`}
                        </p>
                        <button
                            onClick={() => setShowNewRequestForm(true)}
                            className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 font-medium rounded-md hover:bg-primary-200 transition-colors"
                        >
                            <PlusCircle className="w-5 h-5 mr-2" />
                            Soumettre votre première requête
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedRequests.map(request => {
                            const status = getStatusDisplay(request.status);

                            return (
                                <motion.div
                                    key={request.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-lg text-gray-900">{request.title}</h3>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.class}`}>
                                            {status.icon}
                                            <span className="ml-1">{status.text}</span>
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 text-sm">
                                        <div>
                                            <span className="text-gray-500">Type:</span>{' '}
                                            <span className="font-medium">{request.requestType?.name || 'Non spécifié'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Soumise le:</span>{' '}
                                            <span className="font-medium">{formatDate(request.createdAt)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Dernière mise à jour:</span>{' '}
                                            <span className="font-medium">{formatDate(request.updatedAt)}</span>
                                        </div>
                                    </div>

                                    <div className="mt-3 text-gray-700 text-sm">
                                        <p className="whitespace-pre-line">{request.description}</p>
                                    </div>

                                    {request.adminNotes && (
                                        <div className="mt-4 p-3 bg-amber-50 rounded-md border border-amber-100">
                                            <h4 className="font-medium text-amber-800 mb-1">Notes de l'administrateur:</h4>
                                            <p className="text-amber-700 text-sm whitespace-pre-line">{request.adminNotes}</p>
                                        </div>
                                    )}

                                    {canCancelRequest(request) && (
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                onClick={() => handleCancelRequest(request.id)}
                                                className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 font-medium hover:text-red-800 hover:bg-red-50 rounded"
                                            >
                                                <XCircle className="w-4 h-4 mr-1" />
                                                Annuler cette requête
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
} 