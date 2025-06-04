'use client';

import { useState, useEffect } from 'react';
import {
    Clock, CheckCircle, XCircle, AlarmClock,
    CheckCheck, Search, Filter, RefreshCw, UserCircle
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

// Composant de tableau de bord des requêtes pour les administrateurs
export default function RequestDashboard() {
    const [requests, setRequests] = useState<UserRequest[]>([]);
    const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);

    // États pour les filtres
    const [filters, setFilters] = useState({
        status: 'ALL',
        requestTypeId: '',
        userId: '',
        assignedToId: '',
        searchTerm: ''
    });

    // État pour le modal de détails/édition de requête
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Notes admin et assignation pour l'édition
    const [adminNotes, setAdminNotes] = useState('');
    const [assignedToId, setAssignedToId] = useState<number | null>(null);
    const [newStatus, setNewStatus] = useState<UserRequestStatus | ''>('');

    // Charger les données nécessaires
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const requestsPromise = fetch('http://localhost:3000/api/demandes').then(async res => {
                    if (!res.ok) {
                        let errorMsg = `Erreur ${res.status} lors du chargement des requêtes.`;
                        try { const errorData = await res.json(); errorMsg = errorData.error || errorMsg; } catch (e) { /*ignore*/ }
                        throw new Error(errorMsg);
                    }
                    return res.json();
                });

                const typesPromise = fetch('http://localhost:3000/api/request-types?includeInactive=true').then(async res => {
                    if (!res.ok) {
                        let errorMsg = `Erreur ${res.status} lors du chargement des types de requêtes.`;
                        try { const errorData = await res.json(); errorMsg = errorData.error || errorMsg; } catch (e) { /*ignore*/ }
                        throw new Error(errorMsg);
                    }
                    return res.json();
                });

                const usersPromise = fetch('http://localhost:3000/api/utilisateurs').then(async res => {
                    if (!res.ok) {
                        let errorMsg = `Erreur ${res.status} lors du chargement des utilisateurs.`;
                        try { const errorData = await res.json(); errorMsg = errorData.error || errorMsg; } catch (e) { /*ignore*/ }
                        throw new Error(errorMsg);
                    }
                    return res.json();
                });

                const [requestsResult, typesResult, usersResult] = await Promise.allSettled([
                    requestsPromise,
                    typesPromise,
                    usersPromise
                ]);

                let combinedErrorMessages = '';

                if (requestsResult.status === 'fulfilled') {
                    setRequests(requestsResult.value);
                } else {
                    console.error('Erreur chargement requêtes:', requestsResult.reason);
                    combinedErrorMessages += requestsResult.reason.message + '\n';
                    setRequests([]);
                }

                if (typesResult.status === 'fulfilled') {
                    setRequestTypes(typesResult.value);
                } else {
                    console.error('Erreur chargement types:', typesResult.reason);
                    combinedErrorMessages += typesResult.reason.message + '\n';
                    setRequestTypes([]);
                }

                if (usersResult.status === 'fulfilled') {
                    setUsers(usersResult.value || []);
                } else {
                    console.error('Erreur chargement utilisateurs:', usersResult.reason);
                    combinedErrorMessages += usersResult.reason.message + '\n';
                    setUsers([]);
                }

                if (combinedErrorMessages) {
                    setError(combinedErrorMessages.trim());
                }

            } catch (err) { // Should not be reached if all promises handle their errors
                const errorMessage = err instanceof Error ? err.message : 'Une erreur inattendue est survenue.';
                setError(errorMessage);
                console.error('Erreur inattendue fetchData:', err);
                setRequests([]);
                setRequestTypes([]);
                setUsers([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filtrer les requêtes
    const filteredRequests = requests.filter(request => {
        // Filtre par statut
        if (filters.status !== 'ALL' && request.status !== filters.status) {
            return false;
        }

        // Filtre par type de requête
        if (filters.requestTypeId && request.requestTypeId !== filters.requestTypeId) {
            return false;
        }

        // Filtre par utilisateur
        if (filters.userId && request.userId !== parseInt(filters.userId)) {
            return false;
        }

        // Filtre par assigné à
        if (filters.assignedToId) {
            if (!request.assignedToId) return false;
            if (request.assignedToId !== parseInt(filters.assignedToId)) return false;
        }

        // Recherche texte (titre ou description)
        if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            return (
                request.title.toLowerCase().includes(searchLower) ||
                request.description.toLowerCase().includes(searchLower) ||
                request.user?.nom.toLowerCase().includes(searchLower) ||
                request.user?.prenom.toLowerCase().includes(searchLower)
            );
        }

        return true;
    });

    // Ouvrir le modal de détail/édition
    const openRequestModal = (request: UserRequest) => {
        setSelectedRequest(request);
        setAdminNotes(request.adminNotes || '');
        setAssignedToId(request.assignedToId || null);
        setNewStatus('');
        setIsModalOpen(true);
    };

    // Fermer le modal
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRequest(null);
    };

    // Mettre à jour une requête
    const updateRequest = async () => {
        if (!selectedRequest) return;

        const updateData: any = { id: selectedRequest.id };

        if (adminNotes !== selectedRequest.adminNotes) {
            updateData.adminNotes = adminNotes;
        }

        if (assignedToId !== selectedRequest.assignedToId) {
            updateData.assignedToId = assignedToId;
        }

        if (newStatus && newStatus !== selectedRequest.status) {
            updateData.status = newStatus;
        }

        // Si aucune modification, ne rien faire
        if (Object.keys(updateData).length === 1) {
            closeModal();
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/demandes', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                let errorMessage = 'Erreur lors de la mise à jour de la requête.';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || `Erreur ${response.status}: ${response.statusText}`;
                } catch (parseError) {
                    errorMessage = `Erreur ${response.status}: ${response.statusText}. La réponse du serveur n\'est pas au format JSON.`;
                }
                throw new Error(errorMessage);
            }

            const updatedRequest = await response.json();

            // Mettre à jour la liste des requêtes
            setRequests(prev =>
                prev.map(r => r.id === updatedRequest.id ? updatedRequest : r)
            );

            closeModal();

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
            console.error('Erreur lors de la mise à jour de la requête:', err);
        }
    };

    // Rafraîchir les données
    const refreshData = async () => {
        setIsLoading(true);
        setError(null); // Clear previous errors
        try {
            const response = await fetch('http://localhost:3000/api/demandes');
            if (!response.ok) {
                let errorMessage = 'Erreur lors du rafraîchissement des données.';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || `Erreur ${response.status}: ${response.statusText}`;
                } catch (parseError) {
                    errorMessage = `Erreur ${response.status}: ${response.statusText}. La réponse du serveur n\'est pas au format JSON.`;
                }
                throw new Error(errorMessage);
            }
            const data = await response.json();
            setRequests(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
            console.error('Erreur lors du rafraîchissement des données:', err);
        } finally {
            setIsLoading(false);
        }
    };

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
        <div className="space-y-6">
            {/* Filtres */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <Filter className="w-5 h-5 mr-2 text-primary-500" />
                    Filtres et recherche
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
                            Statut
                        </label>
                        <select
                            id="statusFilter"
                            value={filters.status}
                            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
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

                    <div>
                        <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 mb-1">
                            Type de requête
                        </label>
                        <select
                            id="typeFilter"
                            value={filters.requestTypeId}
                            onChange={e => setFilters(prev => ({ ...prev, requestTypeId: e.target.value }))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Tous les types</option>
                            {requestTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="userFilter" className="block text-sm font-medium text-gray-700 mb-1">
                            Utilisateur
                        </label>
                        <select
                            id="userFilter"
                            value={filters.userId}
                            onChange={e => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Tous les utilisateurs</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.prenom} {user.nom}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="assignedToFilter" className="block text-sm font-medium text-gray-700 mb-1">
                            Assigné à
                        </label>
                        <select
                            id="assignedToFilter"
                            value={filters.assignedToId}
                            onChange={e => setFilters(prev => ({ ...prev, assignedToId: e.target.value }))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Tous / Non assignées</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.prenom} {user.nom}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-4 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Rechercher par titre, description ou utilisateur"
                        value={filters.searchTerm}
                        onChange={e => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                        className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div className="mt-4 flex justify-between">
                    <span className="text-sm text-gray-500">
                        {filteredRequests.length} requête(s) trouvée(s)
                    </span>
                    <button
                        onClick={() => setFilters({
                            status: 'ALL',
                            requestTypeId: '',
                            userId: '',
                            assignedToId: '',
                            searchTerm: ''
                        })}
                        className="text-sm text-primary-600 hover:text-primary-800"
                    >
                        Réinitialiser les filtres
                    </button>
                </div>
            </div>

            {/* Tableau des requêtes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Liste des requêtes</h2>
                    <button
                        onClick={refreshData}
                        className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        disabled={isLoading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                        Rafraîchir
                    </button>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border-b border-red-100 text-red-700">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="text-center py-20">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
                        <p className="mt-4 text-gray-600">Chargement des requêtes...</p>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-500">Aucune requête ne correspond aux critères sélectionnés.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Requête
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Utilisateur
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRequests.map(request => {
                                    const status = getStatusDisplay(request.status);
                                    return (
                                        <tr
                                            key={request.id}
                                            className="hover:bg-gray-50 cursor-pointer"
                                            onClick={() => openRequestModal(request)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                                    {request.title}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <UserCircle className="w-5 h-5 text-gray-400 mr-2" />
                                                    <div className="text-sm text-gray-900">
                                                        {request.user ? `${request.user.prenom} ${request.user.nom}` : 'Utilisateur inconnu'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {request.requestType?.name || 'Type inconnu'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.class}`}>
                                                    {status.icon}
                                                    <span className="ml-1">{status.text}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(request.updatedAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        openRequestModal(request);
                                                    }}
                                                    className="text-primary-600 hover:text-primary-900"
                                                >
                                                    Détails
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal détails/édition de requête */}
            {isModalOpen && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-semibold text-gray-900">
                                    Détails de la requête
                                </h3>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <span className="sr-only">Fermer</span>
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Titre</h4>
                                    <p className="mt-1 text-base text-gray-900">{selectedRequest.title}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Statut actuel</h4>
                                    <div className="mt-1">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusDisplay(selectedRequest.status).class}`}>
                                            {getStatusDisplay(selectedRequest.status).icon}
                                            <span className="ml-1">{getStatusDisplay(selectedRequest.status).text}</span>
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Utilisateur</h4>
                                    <p className="mt-1 text-base text-gray-900">
                                        {selectedRequest.user ? `${selectedRequest.user.prenom} ${selectedRequest.user.nom}` : 'Utilisateur inconnu'}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Type de requête</h4>
                                    <p className="mt-1 text-base text-gray-900">
                                        {selectedRequest.requestType?.name || 'Type inconnu'}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Date de soumission</h4>
                                    <p className="mt-1 text-base text-gray-900">
                                        {formatDate(selectedRequest.createdAt)}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Dernière mise à jour</h4>
                                    <p className="mt-1 text-base text-gray-900">
                                        {formatDate(selectedRequest.updatedAt)}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                                <p className="mt-1 text-base text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-line">
                                    {selectedRequest.description}
                                </p>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Gérer cette requête</h4>

                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="assignTo" className="block text-sm font-medium text-gray-700 mb-1">
                                            Assigner à
                                        </label>
                                        <select
                                            id="assignTo"
                                            value={assignedToId || ''}
                                            onChange={e => setAssignedToId(e.target.value ? parseInt(e.target.value) : null)}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="">Non assignée</option>
                                            {users.map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.prenom} {user.nom}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="newStatus" className="block text-sm font-medium text-gray-700 mb-1">
                                            Changer le statut
                                        </label>
                                        <select
                                            id="newStatus"
                                            value={newStatus}
                                            onChange={e => setNewStatus(e.target.value as UserRequestStatus)}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="">Conserver le statut actuel</option>
                                            <option value={UserRequestStatus.SUBMITTED}>Soumise</option>
                                            <option value={UserRequestStatus.IN_PROGRESS}>En cours</option>
                                            <option value={UserRequestStatus.APPROVED}>Approuvée</option>
                                            <option value={UserRequestStatus.REJECTED}>Rejetée</option>
                                            <option value={UserRequestStatus.COMPLETED}>Terminée</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700 mb-1">
                                            Notes administratives (visibles par l'utilisateur)
                                        </label>
                                        <textarea
                                            id="adminNotes"
                                            value={adminNotes}
                                            onChange={e => setAdminNotes(e.target.value)}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 h-28 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="Ajoutez des notes ou informations supplémentaires pour l'utilisateur..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={updateRequest}
                                className="px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-md"
                            >
                                Enregistrer les modifications
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 