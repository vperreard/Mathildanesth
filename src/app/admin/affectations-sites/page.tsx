'use client';

import React, { useState, useEffect } from 'react';
import { logger } from "../../../lib/logger";
import SiteSelector from '@/components/ui/SiteSelector';
import { useUserSiteAssignments, useSurgeonSiteAssignments } from '@/hooks/useSiteAssignments';
import Link from 'next/link';
import { Settings, Users, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/utils/apiClient';
import { toast } from 'react-hot-toast';

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

export default function SiteAssignmentsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [surgeons, setSurgeons] = useState<Surgeon[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedSurgeon, setSelectedSurgeon] = useState<Surgeon | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'users' | 'surgeons'>('users');
    
    // États pour la sélection multiple
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
    const [selectedSurgeonIds, setSelectedSurgeonIds] = useState<Set<number>>(new Set());
    const [bulkSelectedSites, setBulkSelectedSites] = useState<Site[]>([]);
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);

    const userAssignments = useUserSiteAssignments(selectedUser?.id || 0);
    const surgeonAssignments = useSurgeonSiteAssignments(selectedSurgeon?.id || 0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            const [usersRes, surgeonsRes, sitesRes] = await Promise.all([
                apiClient.get('/api/utilisateurs'),
                apiClient.get('/api/chirurgiens'),
                apiClient.get('/api/sites')
            ]);

            setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
            setSurgeons(Array.isArray(surgeonsRes.data) ? surgeonsRes.data : []);
            setSites(Array.isArray(sitesRes.data) ? sitesRes.data : []);
        } catch (error: unknown) {
            logger.error('Erreur lors du chargement:', { error: error });
        } finally {
            setLoading(false);
        }
    };

    const handleUserSitesUpdate = async (selectedSites: Site[]) => {
        if (!selectedUser) return;
        const siteIds = selectedSites.map(site => site.id);
        await userAssignments.updateSites(siteIds);
    };

    const handleSurgeonSitesUpdate = async (selectedSites: Site[]) => {
        if (!selectedSurgeon) return;
        const siteIds = selectedSites.map(site => site.id);
        await surgeonAssignments.updateSites(siteIds);
    };

    // Fonctions pour la sélection multiple
    const toggleUserSelection = (userId: number) => {
        const newSelection = new Set(selectedUserIds);
        if (newSelection.has(userId)) {
            newSelection.delete(userId);
        } else {
            newSelection.add(userId);
        }
        setSelectedUserIds(newSelection);
    };

    const toggleSurgeonSelection = (surgeonId: number) => {
        const newSelection = new Set(selectedSurgeonIds);
        if (newSelection.has(surgeonId)) {
            newSelection.delete(surgeonId);
        } else {
            newSelection.add(surgeonId);
        }
        setSelectedSurgeonIds(newSelection);
    };

    const selectAll = () => {
        if (activeTab === 'users') {
            setSelectedUserIds(new Set(users.map(u => u.id)));
        } else {
            setSelectedSurgeonIds(new Set(surgeons.map(s => s.id)));
        }
    };

    const deselectAll = () => {
        if (activeTab === 'users') {
            setSelectedUserIds(new Set());
        } else {
            setSelectedSurgeonIds(new Set());
        }
    };

    const handleBulkUpdate = async () => {
        setIsBulkUpdating(true);
        const siteIds = bulkSelectedSites.map(site => site.id);
        
        try {
            if (activeTab === 'users') {
                const promises = Array.from(selectedUserIds).map(userId =>
                    apiClient.put(`/api/utilisateurs/${userId}/sites`, { siteIds })
                );
                await Promise.all(promises);
                toast.success(`${selectedUserIds.size} utilisateur(s) mis à jour avec succès`);
                setSelectedUserIds(new Set());
            } else {
                const promises = Array.from(selectedSurgeonIds).map(surgeonId =>
                    apiClient.put(`/api/chirurgiens/${surgeonId}/sites`, { siteIds })
                );
                await Promise.all(promises);
                toast.success(`${selectedSurgeonIds.size} chirurgien(s) mis à jour avec succès`);
                setSelectedSurgeonIds(new Set());
            }
            
            setIsMultiSelectMode(false);
            setBulkSelectedSites([]);
        } catch (error: unknown) {
            logger.error('Erreur lors de la mise à jour groupée:', { error: error });
            toast.error('Erreur lors de la mise à jour groupée');
        } finally {
            setIsBulkUpdating(false);
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

    const selectedCount = activeTab === 'users' ? selectedUserIds.size : selectedSurgeonIds.size;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Gestion des Affectations de Sites
                        </h1>
                        <p className="text-gray-600">
                            Assignez les utilisateurs et chirurgiens aux différents sites
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => {
                                setIsMultiSelectMode(!isMultiSelectMode);
                                setSelectedUserIds(new Set());
                                setSelectedSurgeonIds(new Set());
                                setBulkSelectedSites([]);
                            }}
                            variant={isMultiSelectMode ? "default" : "outline"}
                            className="flex items-center gap-2"
                        >
                            <Users className="h-4 w-4" />
                            <span>{isMultiSelectMode ? 'Mode simple' : 'Sélection multiple'}</span>
                        </Button>
                        <Link href="/parametres/sites">
                            <Button variant="outline" className="flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                <span>Gérer les sites</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex">
                            <button
                                onClick={() => {
                                    setActiveTab('users');
                                    setSelectedUserIds(new Set());
                                    setSelectedSurgeonIds(new Set());
                                }}
                                className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'users'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Utilisateurs (MARs/IADEs)
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('surgeons');
                                    setSelectedUserIds(new Set());
                                    setSelectedSurgeonIds(new Set());
                                }}
                                className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'surgeons'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Chirurgiens
                            </button>
                        </nav>
                    </div>

                    {isMultiSelectMode && selectedCount > 0 && (
                        <div className="bg-blue-50 border-b border-blue-200 p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-blue-900">
                                    {selectedCount} {activeTab === 'users' ? 'utilisateur(s)' : 'chirurgien(s)'} sélectionné(s)
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={selectAll}
                                    >
                                        Tout sélectionner
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={deselectAll}
                                    >
                                        Tout désélectionner
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {isMultiSelectMode 
                                    ? `Sélectionner des ${activeTab === 'users' ? 'utilisateurs' : 'chirurgiens'}`
                                    : activeTab === 'users' ? 'Sélectionner un utilisateur' : 'Sélectionner un chirurgien'
                                }
                            </h3>
                            <div className="space-y-1 max-h-[500px] overflow-y-auto border rounded-lg p-2">
                                {activeTab === 'users' ? (
                                    users.length > 0 ? (
                                        users.map(user => (
                                            <div
                                                key={user.id}
                                                className={`flex items-center ${
                                                    isMultiSelectMode ? 'hover:bg-gray-50' : ''
                                                }`}
                                            >
                                                {isMultiSelectMode && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUserIds.has(user.id)}
                                                        onChange={() => toggleUserSelection(user.id)}
                                                        className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                )}
                                                <button
                                                    onClick={() => {
                                                        if (isMultiSelectMode) {
                                                            toggleUserSelection(user.id);
                                                        } else {
                                                            setSelectedUser(user);
                                                        }
                                                    }}
                                                    className={`flex-1 text-left px-3 py-1.5 rounded text-sm transition-colors flex items-center justify-between ${
                                                        !isMultiSelectMode && selectedUser?.id === user.id
                                                            ? 'bg-blue-500 text-white'
                                                            : isMultiSelectMode && selectedUserIds.has(user.id)
                                                            ? 'bg-blue-100'
                                                            : 'hover:bg-gray-100'
                                                    }`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium truncate">
                                                                    {user.prenom} {user.nom}
                                                                </div>
                                                                <div className={`text-xs truncate ${
                                                                    !isMultiSelectMode && selectedUser?.id === user.id ? 'text-blue-100' : 'text-gray-500'
                                                                }`}>
                                                                    {user.professionalRole}
                                                                </div>
                                                            </div>
                                                            {user.sites && user.sites.length > 0 && (
                                                                <div className="flex items-center gap-1 flex-shrink-0 mt-1">
                                                                    {user.sites.slice(0, 2).map((site) => (
                                                                        <div
                                                                            key={site.id}
                                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                                                                            style={{ 
                                                                                backgroundColor: site.colorCode ? `${site.colorCode}20` : '#F3F4F6',
                                                                                color: site.colorCode || '#6B7280',
                                                                                border: `1px solid ${site.colorCode || '#E5E7EB'}`
                                                                            }}
                                                                        >
                                                                            <div 
                                                                                className="w-2 h-2 rounded-full"
                                                                                style={{ backgroundColor: site.colorCode || '#6B7280' }}
                                                                            />
                                                                            <span>{site.name}</span>
                                                                        </div>
                                                                    ))}
                                                                    {user.sites.length > 2 && (
                                                                        <span className={`text-xs font-medium ${
                                                                            !isMultiSelectMode && selectedUser?.id === user.id ? 'text-blue-100' : 'text-gray-500'
                                                                        }`}>
                                                                            +{user.sites.length - 2}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 p-4 text-center">Aucun utilisateur trouvé</p>
                                    )
                                ) : (
                                    surgeons.length > 0 ? (
                                        surgeons.map(surgeon => (
                                            <div
                                                key={surgeon.id}
                                                className={`flex items-center ${
                                                    isMultiSelectMode ? 'hover:bg-gray-50' : ''
                                                }`}
                                            >
                                                {isMultiSelectMode && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSurgeonIds.has(surgeon.id)}
                                                        onChange={() => toggleSurgeonSelection(surgeon.id)}
                                                        className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                )}
                                                <button
                                                    onClick={() => {
                                                        if (isMultiSelectMode) {
                                                            toggleSurgeonSelection(surgeon.id);
                                                        } else {
                                                            setSelectedSurgeon(surgeon);
                                                        }
                                                    }}
                                                    className={`flex-1 text-left px-3 py-1.5 rounded text-sm transition-colors ${
                                                        !isMultiSelectMode && selectedSurgeon?.id === surgeon.id
                                                            ? 'bg-blue-500 text-white'
                                                            : isMultiSelectMode && selectedSurgeonIds.has(surgeon.id)
                                                            ? 'bg-blue-100'
                                                            : 'hover:bg-gray-100'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium truncate">
                                                                {surgeon.prenom} {surgeon.nom}
                                                            </div>
                                                            <div className={`text-xs truncate ${
                                                                !isMultiSelectMode && selectedSurgeon?.id === surgeon.id ? 'text-blue-100' : 'text-gray-500'
                                                            }`}>
                                                                {surgeon.specialties.map(s => s.name).join(', ') || 'Aucune spécialité'}
                                                            </div>
                                                        </div>
                                                        {surgeon.sites && surgeon.sites.length > 0 && (
                                                            <div className="flex items-center gap-1 flex-shrink-0 mt-1">
                                                                {surgeon.sites.slice(0, 2).map((site) => (
                                                                    <div
                                                                        key={site.id}
                                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                                                                        style={{ 
                                                                            backgroundColor: site.colorCode ? `${site.colorCode}20` : '#F3F4F6',
                                                                            color: site.colorCode || '#6B7280',
                                                                            border: `1px solid ${site.colorCode || '#E5E7EB'}`
                                                                        }}
                                                                    >
                                                                        <div 
                                                                            className="w-2 h-2 rounded-full"
                                                                            style={{ backgroundColor: site.colorCode || '#6B7280' }}
                                                                        />
                                                                        <span>{site.name}</span>
                                                                    </div>
                                                                ))}
                                                                {surgeon.sites.length > 2 && (
                                                                    <span className={`text-xs font-medium ${
                                                                        !isMultiSelectMode && selectedSurgeon?.id === surgeon.id ? 'text-blue-100' : 'text-gray-500'
                                                                    }`}>
                                                                        +{surgeon.sites.length - 2}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 p-4 text-center">Aucun chirurgien trouvé</p>
                                    )
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Affectation aux sites
                            </h3>
                            {isMultiSelectMode ? (
                                selectedCount > 0 ? (
                                    <div className="space-y-4">
                                        <SiteSelector
                                            selectedSites={bulkSelectedSites}
                                            onSitesChange={setBulkSelectedSites}
                                            availableSites={sites}
                                            placeholder="Sélectionner des sites pour la mise à jour groupée..."
                                        />
                                        <Button
                                            onClick={handleBulkUpdate}
                                            disabled={isBulkUpdating || bulkSelectedSites.length === 0}
                                            className="w-full"
                                        >
                                            {isBulkUpdating ? (
                                                <>Mise à jour en cours...</>
                                            ) : (
                                                <>
                                                    <Check className="h-4 w-4 mr-2" />
                                                    Appliquer à {selectedCount} {activeTab === 'users' ? 'utilisateur(s)' : 'chirurgien(s)'}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">
                                        Sélectionnez des {activeTab === 'users' ? 'utilisateurs' : 'chirurgiens'} pour gérer leurs affectations en groupe
                                    </p>
                                )
                            ) : (
                                (activeTab === 'users' && selectedUser) || (activeTab === 'surgeons' && selectedSurgeon) ? (
                                    <SiteSelector
                                        selectedSites={activeTab === 'users' ? userAssignments.sites : surgeonAssignments.sites}
                                        onSitesChange={activeTab === 'users' ? handleUserSitesUpdate : handleSurgeonSitesUpdate}
                                        availableSites={sites}
                                        loading={activeTab === 'users' ? userAssignments.loading : surgeonAssignments.loading}
                                        placeholder="Sélectionner des sites..."
                                    />
                                ) : (
                                    <p className="text-gray-500">
                                        Sélectionnez un {activeTab === 'users' ? 'utilisateur' : 'chirurgien'} pour gérer ses affectations
                                    </p>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}