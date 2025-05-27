'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Calendar, CheckCircle, Clock, Filter, Users, XCircle, ArchiveIcon } from 'lucide-react';

// Types de requêtes possibles (à adapter selon vos besoins)
type RequestType = 'congés' | 'gardes/vacations' | 'autres';
type RequestStatus = 'en-attente' | 'approuvée' | 'refusée';
type TabType = RequestType | 'refusées';

// Interface pour représenter une requête
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

// Données fictives pour la démo - à remplacer par des vraies données de l'API
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
        type: 'gardes/vacations',
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
        status: 'en-attente',
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
        status: 'en-attente',
        userId: 'user4',
        userName: 'Dr. Marc Lambert',
        title: 'Formation spécialisée',
        description: 'Demande de participation à une formation en anesthésie pédiatrique',
        dateSubmitted: '2023-06-10'
    },
    {
        id: '5',
        type: 'congés',
        status: 'refusée',
        userId: 'user5',
        userName: 'Dr. Jean Dupont',
        title: 'Congés de Noël',
        description: 'Demande de congés pour les fêtes de fin d\'année',
        dateSubmitted: '2023-06-08',
        dates: { start: '2023-12-24', end: '2024-01-02' }
    },
    {
        id: '6',
        type: 'gardes/vacations',
        status: 'refusée',
        userId: 'user6',
        userName: 'Dr. Camille Leroy',
        title: 'Changement d\'équipe',
        description: 'Demande de transfert vers l\'équipe de nuit',
        dateSubmitted: '2023-06-05'
    }
];

export default function AdminRequestsDashboard() {
    const [activeTab, setActiveTab] = useState<TabType>('congés');
    const [requests, setRequests] = useState<Request[]>(mockRequests);
    const [showRefused, setShowRefused] = useState(false);

    // Fonction pour filtrer les requêtes en fonction de l'onglet actif
    const filteredRequests = requests.filter(request => {
        if (activeTab === 'refusées') {
            return request.status === 'refusée';
        }

        return request.type === activeTab && request.status === 'en-attente';
    });

    // Fonctions pour traiter les requêtes
    const approveRequest = (requestId: string) => {
        setRequests(prevRequests =>
            prevRequests.map(req =>
                req.id === requestId ? { ...req, status: 'approuvée' } : req
            )
        );
    };

    const rejectRequest = (requestId: string) => {
        setRequests(prevRequests =>
            prevRequests.map(req =>
                req.id === requestId ? { ...req, status: 'refusée' } : req
            )
        );
    };

    // Nombre de requêtes par type (seulement les requêtes en attente)
    const requestCounts = {
        congés: requests.filter(r => r.type === 'congés' && r.status === 'en-attente').length,
        gardes/vacations: requests.filter(r => r.type === 'gardes/vacations' && r.status === 'en-attente').length,
        autres: requests.filter(r => r.type === 'autres' && r.status === 'en-attente').length,
        refusées: requests.filter(r => r.status === 'refusée').length
    };

    return (
        <div className="card bg-white dark:bg-black shadow-soft border border-gray-100 dark:border-gray-700 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-slate-100">Requêtes en attente</h2>
                <Link
                    href="/admin/requetes"
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium text-sm flex items-center"
                >
                    Gérer toutes les requêtes
                    <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 border-b border-gray-200 dark:border-slate-700 mb-6 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('congés')}
                    className={`px-4 py-2 font-medium text-sm rounded-t-lg flex items-center ${activeTab === 'congés'
                        ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50 dark:text-primary-400 dark:border-primary-400 dark:bg-slate-700'
                        : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:text-primary-400 dark:hover:bg-slate-700'
                        }`}
                >
                    <Calendar className="w-4 h-4 mr-2" />
                    Congés
                    {requestCounts.congés > 0 && (
                        <span className="ml-2 bg-primary-100 text-primary-700 dark:bg-primary-700 dark:text-primary-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                            {requestCounts.congés}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('gardes/vacations')}
                    className={`px-4 py-2 font-medium text-sm rounded-t-lg flex items-center ${activeTab === 'gardes/vacations'
                        ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50 dark:text-primary-400 dark:border-primary-400 dark:bg-slate-700'
                        : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:text-primary-400 dark:hover:bg-slate-700'
                        }`}
                >
                    <Users className="w-4 h-4 mr-2" />
                    Gardes/Vacations
                    {requestCounts.gardes/vacations > 0 && (
                        <span className="ml-2 bg-primary-100 text-primary-700 dark:bg-primary-700 dark:text-primary-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                            {requestCounts.gardes/vacations}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('autres')}
                    className={`px-4 py-2 font-medium text-sm rounded-t-lg flex items-center ${activeTab === 'autres'
                        ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50 dark:text-primary-400 dark:border-primary-400 dark:bg-slate-700'
                        : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:text-primary-400 dark:hover:bg-slate-700'
                        }`}
                >
                    <Filter className="w-4 h-4 mr-2" />
                    Autres
                    {requestCounts.autres > 0 && (
                        <span className="ml-2 bg-primary-100 text-primary-700 dark:bg-primary-700 dark:text-primary-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                            {requestCounts.autres}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('refusées')}
                    className={`px-4 py-2 font-medium text-sm rounded-t-lg flex items-center ${activeTab === 'refusées'
                        ? 'text-red-600 border-b-2 border-red-500 bg-red-50 dark:text-red-400 dark:border-red-400 dark:bg-red-900/50'
                        : 'text-gray-600 hover:text-red-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:text-red-400 dark:hover:bg-slate-700'
                        }`}
                >
                    <XCircle className="w-4 h-4 mr-2" />
                    Refusées
                    {requestCounts.refusées > 0 && (
                        <span className="ml-2 bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                            {requestCounts.refusées}
                        </span>
                    )}
                </button>
            </div>

            {/* Liste des requêtes */}
            <div className="space-y-4">
                {filteredRequests.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-slate-400">
                            {activeTab === 'refusées'
                                ? "Aucune requête refusée."
                                : "Aucune requête en attente de ce type."}
                        </p>
                    </div>
                ) : (
                    filteredRequests.map((request) => (
                        <motion.div
                            key={request.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`p-4 border rounded-xl hover:shadow-md transition-all duration-200 ${activeTab === 'refusées'
                                ? 'border-red-100 bg-white/95 dark:border-red-700/50 dark:bg-red-900/30'
                                : 'border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold text-sm">
                                        {request.userName.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                                            {request.title}
                                            {activeTab === 'refusées' && (
                                                <span className="ml-2 text-xs inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200">
                                                    <XCircle className="w-3 h-3 mr-1" />
                                                    Refusée
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">{request.description}</p>

                                        <div className="mt-2 flex items-center flex-wrap gap-2 text-xs text-gray-500 dark:text-slate-400">
                                            <div className="flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                Soumis le {new Date(request.dateSubmitted).toLocaleDateString('fr-FR')}
                                            </div>
                                            {request.dates && (
                                                <div className="flex items-center">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    Du {new Date(request.dates.start).toLocaleDateString('fr-FR')} au {new Date(request.dates.end).toLocaleDateString('fr-FR')}
                                                </div>
                                            )}
                                            <div className="flex items-center">
                                                <Users className="w-3 h-3 mr-1" />
                                                {request.userName}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
                                    {request.status === 'en-attente' && (
                                        <>
                                            <button
                                                onClick={() => rejectRequest(request.id)}
                                                className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 dark:bg-red-700/50 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-600/50 rounded-lg transition-colors flex items-center"
                                            >
                                                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                                                Refuser
                                            </button>
                                            <button
                                                onClick={() => approveRequest(request.id)}
                                                className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 dark:bg-green-700/50 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-600/50 rounded-lg transition-colors flex items-center"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                                Approuver
                                            </button>
                                        </>
                                    )}
                                    {request.status !== 'en-attente' && (
                                        <button
                                            onClick={() => console.log("Archiver la requête:", request.id)} // Remplacer par la vraie logique d'archivage
                                            className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center"
                                        >
                                            <ArchiveIcon className="w-3.5 h-3.5 mr-1.5" />
                                            Archiver
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {filteredRequests.length > 0 && activeTab !== 'refusées' && (
                <div className="mt-6 text-center">
                    <button
                        className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                    >
                        Voir plus de requêtes
                    </button>
                </div>
            )}
        </div>
    );
} 