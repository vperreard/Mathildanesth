'use client';

import { useState, useEffect } from 'react';
import { TeamConfiguration } from '@/types/team-configuration';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

export default function TeamConfigurationsPage() {
    const router = useRouter();
    const [configurations, setConfigurations] = useState<TeamConfiguration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Charger les configurations au chargement de la page
    useEffect(() => {
        const fetchConfigurations = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:3000/api/admin/team-configurations');

                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des configurations');
                }

                const data = await response.json();
                setConfigurations(data);
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchConfigurations();
    }, []);

    // Gérer la suppression d'une configuration
    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette configuration ?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/admin/team-configurations?id=${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la suppression');
            }

            // Mettre à jour la liste des configurations
            setConfigurations(prev => prev.filter(config => config.id !== id));
            toast.success('Configuration supprimée avec succès');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression';
            toast.error(errorMessage);
        }
    };

    // Gérer l'activation/désactivation d'une configuration
    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            const response = await fetch(`http://localhost:3000/api/admin/team-configurations?id=${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isActive: !isActive }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la mise à jour');
            }

            // Mettre à jour la liste des configurations
            setConfigurations(prev =>
                prev.map(config =>
                    config.id === id
                        ? { ...config, isActive: !isActive }
                        : config
                )
            );

            toast.success(`Configuration ${!isActive ? 'activée' : 'désactivée'} avec succès`);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
            toast.error(errorMessage);
        }
    };

    // Gérer la définition de la configuration par défaut
    const handleSetDefault = async (id: string) => {
        try {
            const response = await fetch(`http://localhost:3000/api/admin/team-configurations?id=${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isDefault: true }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la mise à jour');
            }

            // Mettre à jour la liste des configurations
            setConfigurations(prev =>
                prev.map(config => ({
                    ...config,
                    isDefault: config.id === id
                }))
            );

            toast.success('Configuration définie par défaut avec succès');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
            toast.error(errorMessage);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Configurations d'équipe</h1>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Configurations d'équipe</h1>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                    <p>{error}</p>
                </div>
                <Button
                    onClick={() => router.refresh()}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                    Réessayer
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Configurations d'équipe</h1>
                <Link
                    href="/admin/team-configurations/nouveau"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Nouvelle configuration
                </Link>
            </div>

            {configurations.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Aucune configuration disponible.</p>
                    <p className="mt-2">
                        <Link
                            href="/admin/team-configurations/nouveau"
                            className="text-blue-500 hover:underline"
                        >
                            Créer une nouvelle configuration
                        </Link>
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left">Nom</th>
                                <th className="py-3 px-4 text-left">Description</th>
                                <th className="py-3 px-4 text-center">Par défaut</th>
                                <th className="py-3 px-4 text-center">Statut</th>
                                <th className="py-3 px-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {configurations.map((config) => (
                                <tr key={config.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <Link
                                            href={`/admin/team-configurations/${config.id}`}
                                            className="text-blue-500 hover:underline"
                                        >
                                            {config.name}
                                        </Link>
                                    </td>
                                    <td className="py-3 px-4">{config.description || '-'}</td>
                                    <td className="py-3 px-4 text-center">
                                        {config.isDefault ? (
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Par défaut</span>
                                        ) : (
                                            <button
                                                onClick={() => handleSetDefault(config.id!)}
                                                className="text-gray-500 hover:text-blue-500 text-xs underline"
                                            >
                                                Définir par défaut
                                            </button>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs ${config.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {config.isActive ? 'Actif' : 'Inactif'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex justify-center space-x-2">
                                            <Link
                                                href={`/admin/team-configurations/${config.id}`}
                                                className="text-blue-500 hover:bg-blue-100 p-1 rounded"
                                            >
                                                Modifier
                                            </Link>
                                            <button
                                                onClick={() => handleToggleActive(config.id!, config.isActive)}
                                                className={`${config.isActive
                                                        ? 'text-amber-500 hover:bg-amber-100'
                                                        : 'text-green-500 hover:bg-green-100'
                                                    } p-1 rounded`}
                                            >
                                                {config.isActive ? 'Désactiver' : 'Activer'}
                                            </button>
                                            {!config.isDefault && (
                                                <button
                                                    onClick={() => handleDelete(config.id!)}
                                                    className="text-red-500 hover:bg-red-100 p-1 rounded"
                                                >
                                                    Supprimer
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
} 