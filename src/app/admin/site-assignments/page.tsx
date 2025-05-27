'use client';

import React, { useState, useEffect } from 'react';
import SiteSelector from '@/components/ui/SiteSelector';
import { useUserSiteAssignments, useSurgeonSiteAssignments } from '@/hooks/useSiteAssignments';

interface User {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    professionalRole: string;
    isActive: boolean;
}

interface Surgeon {
    id: number;
    nom: string;
    prenom: string;
    email?: string;
    status: string;
    specialties: { name: string }[];
}

interface Site {
    id: string;
    name: string;
    description?: string;
    colorCode?: string;
    isActive: boolean;
}

const SiteAssignmentsPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [surgeons, setSurgeons] = useState<Surgeon[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedSurgeon, setSelectedSurgeon] = useState<Surgeon | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'users' | 'surgeons'>('users');

    // Hooks pour les assignments
    const userAssignments = useUserSiteAssignments(selectedUser?.id || 0);
    const surgeonAssignments = useSurgeonSiteAssignments(selectedSurgeon?.id || 0);

    // Charger les données initiales
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            const [usersRes, surgeonsRes, sitesRes] = await Promise.all([
                fetch('http://localhost:3000/api/utilisateurs?limit=50'),
                fetch('http://localhost:3000/api/chirurgiens?limit=100'),
                fetch('http://localhost:3000/api/sites')
            ]);

            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setUsers(usersData.users || usersData.data || []);
            }

            if (surgeonsRes.ok) {
                const surgeonsData = await surgeonsRes.json();
                setSurgeons(surgeonsData.surgeons || surgeonsData.data || []);
            }

            if (sitesRes.ok) {
                const sitesData = await sitesRes.json();
                setSites(sitesData.sites || sitesData.data || []);
            }
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUserSitesUpdate = async (selectedSites: Site[]) => {
        if (!selectedUser) return;

        const siteIds = selectedSites.map(site => site.id);
        const success = await userAssignments.updateSites(siteIds);

        if (success) {
            console.log('Sites utilisateur mis à jour avec succès');
        }
    };

    const handleSurgeonSitesUpdate = async (selectedSites: Site[]) => {
        if (!selectedSurgeon) return;

        const siteIds = selectedSites.map(site => site.id);
        const success = await surgeonAssignments.updateSites(siteIds);

        if (success) {
            console.log('Sites chirurgien mis à jour avec succès');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement des données...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🏥 Gestion des Affectations de Sites
                    </h1>
                    <p className="text-gray-600">
                        Assignez les utilisateurs (MARS/IADEs) et chirurgiens aux différents sites
                    </p>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
                                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                            </div>
                            <div className="text-3xl">👨‍⚕️</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Chirurgiens</p>
                                <p className="text-2xl font-bold text-gray-900">{surgeons.length}</p>
                            </div>
                            <div className="text-3xl">🩺</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Sites disponibles</p>
                                <p className="text-2xl font-bold text-gray-900">{sites.length}</p>
                            </div>
                            <div className="text-3xl">🏢</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Actif</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {selectedUser || selectedSurgeon ? '✓' : '—'}
                                </p>
                            </div>
                            <div className="text-3xl">⚙️</div>
                        </div>
                    </div>
                </div>

                {/* Onglets */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => {
                                    setActiveTab('users');
                                    setSelectedSurgeon(null);
                                }}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'users'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                👨‍⚕️ Utilisateurs (MARS/IADEs)
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('surgeons');
                                    setSelectedUser(null);
                                }}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'surgeons'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                🩺 Chirurgiens
                            </button>
                        </nav>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Colonne de sélection */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {activeTab === 'users' ? 'Sélectionner un utilisateur' : 'Sélectionner un chirurgien'}
                            </h2>
                        </div>
                        <div className="p-6">
                            {activeTab === 'users' ? (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {users.map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => setSelectedUser(user)}
                                            className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedUser?.id === user.id
                                                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="font-medium">
                                                {user.prenom} {user.nom}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {user.email} • {user.professionalRole}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {surgeons.map(surgeon => (
                                        <button
                                            key={surgeon.id}
                                            onClick={() => setSelectedSurgeon(surgeon)}
                                            className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedSurgeon?.id === surgeon.id
                                                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="font-medium">
                                                {surgeon.prenom} {surgeon.nom}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {surgeon.email || 'Pas d\'email'} •
                                                {surgeon.specialties.map(s => s.name).join(', ')}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Colonne de gestion des sites */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Affectation aux sites
                            </h2>
                            {(selectedUser || selectedSurgeon) && (
                                <p className="text-gray-600 mt-1">
                                    Pour {activeTab === 'users'
                                        ? `${selectedUser?.prenom} ${selectedUser?.nom}`
                                        : `${selectedSurgeon?.prenom} ${selectedSurgeon?.nom}`
                                    }
                                </p>
                            )}
                        </div>
                        <div className="p-6">
                            {selectedUser ? (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Sites assignés à l'utilisateur
                                        </label>
                                        <SiteSelector
                                            selectedSites={userAssignments.sites}
                                            onSitesChange={handleUserSitesUpdate}
                                            availableSites={sites}
                                            loading={userAssignments.loading}
                                            placeholder="Sélectionner des sites pour cet utilisateur..."
                                        />
                                        {userAssignments.error && (
                                            <p className="mt-2 text-sm text-red-600">
                                                {userAssignments.error}
                                            </p>
                                        )}
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-gray-900 mb-2">
                                            Impact sur la génération des plannings
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            Cet utilisateur ne sera proposé que pour les créneaux et salles
                                            des sites sélectionnés lors de la génération automatique des plannings.
                                        </p>
                                    </div>
                                </div>
                            ) : selectedSurgeon ? (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Sites assignés au chirurgien
                                        </label>
                                        <SiteSelector
                                            selectedSites={surgeonAssignments.sites}
                                            onSitesChange={handleSurgeonSitesUpdate}
                                            availableSites={sites}
                                            loading={surgeonAssignments.loading}
                                            placeholder="Sélectionner des sites pour ce chirurgien..."
                                        />
                                        {surgeonAssignments.error && (
                                            <p className="mt-2 text-sm text-red-600">
                                                {surgeonAssignments.error}
                                            </p>
                                        )}
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-gray-900 mb-2">
                                            Impact sur la génération des plannings
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            Ce chirurgien ne sera proposé que pour les créneaux et salles
                                            des sites sélectionnés lors de la génération automatique des plannings.
                                            Les spécialités et compatibilités avec les salles seront également prises en compte.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 text-6xl mb-4">🏥</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Sélectionnez un {activeTab === 'users' ? 'utilisateur' : 'chirurgien'}
                                    </h3>
                                    <p className="text-gray-600">
                                        Choisissez un {activeTab === 'users' ? 'utilisateur' : 'chirurgien'}
                                        dans la liste de gauche pour gérer ses affectations de sites.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Résumé des sites */}
                <div className="mt-8 bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">
                            📊 Sites disponibles
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sites.map(site => (
                                <div
                                    key={site.id}
                                    className="border border-gray-200 rounded-lg p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        {site.colorCode && (
                                            <div
                                                className="w-4 h-4 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: site.colorCode }}
                                            />
                                        )}
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {site.name}
                                            </div>
                                            {site.description && (
                                                <div className="text-sm text-gray-600">
                                                    {site.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SiteAssignmentsPage; 