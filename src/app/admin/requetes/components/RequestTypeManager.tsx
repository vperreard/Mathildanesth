'use client';

import { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, CheckCircle, AlertCircle,
    XCircle, Save, ToggleLeft, ToggleRight
} from 'lucide-react';

interface RequestType {
    id: string;
    name: string;
    description?: string;
    requiresAdminApproval: boolean;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export default function RequestTypeManager() {
    const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // État pour le formulaire d'ajout/édition
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Omit<RequestType, 'id' | 'createdAt' | 'updatedAt'>>({
        name: '',
        description: '',
        requiresAdminApproval: true,
        isActive: true
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    // Charger les types de requêtes
    useEffect(() => {
        const fetchRequestTypes = async () => {
            setIsLoading(true);
            setError(null); // Clear previous errors
            try {
                const response = await fetch('http://localhost:3000/api/request-types?includeInactive=true');
                if (!response.ok) {
                    let errorMsg = `Erreur ${response.status} lors du chargement des types de requêtes.`;
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.error || errorMsg;
                    } catch (e) { /*ignore parsing error, use statusText based one*/ }
                    throw new Error(errorMsg);
                }
                const data = await response.json();
                setRequestTypes(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erreur inconnue');
                console.error('Erreur lors du chargement des types de requêtes:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRequestTypes();
    }, []);

    // Réinitialiser le formulaire
    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            requiresAdminApproval: true,
            isActive: true
        });
        setIsEditing(false);
        setEditingId(null);
        setIsFormOpen(false);
    };

    // Ouvrir le formulaire en mode édition
    const openEditForm = (requestType: RequestType) => {
        setFormData({
            name: requestType.name,
            description: requestType.description || '',
            requiresAdminApproval: requestType.requiresAdminApproval,
            isActive: requestType.isActive
        });
        setIsEditing(true);
        setEditingId(requestType.id);
        setIsFormOpen(true);
    };

    // Gérer la soumission du formulaire
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name) {
            setError('Le nom du type de requête est obligatoire');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (isEditing && editingId) {
                // Mise à jour d'un type existant
                const response = await fetch('http://localhost:3000/api/request-types', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: editingId,
                        ...formData
                    })
                });

                if (!response.ok) {
                    let errorMessage = 'Erreur lors de la mise à jour du type de requête';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.error || `Erreur ${response.status}: ${response.statusText}`;
                    } catch (parseError) {
                        errorMessage = `Erreur ${response.status}: ${response.statusText}. La réponse du serveur n\'est pas au format JSON.`;
                    }
                    throw new Error(errorMessage);
                }

                const updatedType = await response.json();

                // Mettre à jour la liste
                setRequestTypes(prev =>
                    prev.map(type => type.id === updatedType.id ? updatedType : type)
                );

            } else {
                // Création d'un nouveau type
                const response = await fetch('http://localhost:3000/api/request-types', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    let errorMessage = 'Erreur lors de la création du type de requête';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.error || `Erreur ${response.status}: ${response.statusText}`;
                    } catch (parseError) {
                        errorMessage = `Erreur ${response.status}: ${response.statusText}. La réponse du serveur n\'est pas au format JSON.`;
                    }
                    throw new Error(errorMessage);
                }

                const newType = await response.json();

                // Ajouter à la liste
                setRequestTypes(prev => [...prev, newType]);
            }

            resetForm();

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
            console.error('Erreur lors de la soumission du formulaire:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Gérer la suppression d'un type
    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce type de requête ? Cette action est irréversible. Les requêtes existantes de ce type ne seront pas supprimées, mais ce type ne sera plus disponible pour de nouvelles requêtes.')) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`http://localhost:3000/api/request-types?id=${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                let errorMessage = 'Erreur lors de la suppression du type de requête.';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || `Erreur ${response.status}: ${response.statusText}`;
                } catch (parseError) {
                    errorMessage = `Erreur ${response.status}: ${response.statusText}. La réponse du serveur n\'est pas au format JSON.`;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();

            // Si le type a été désactivé plutôt que supprimé
            if (result.message.includes('désactivé')) {
                // Mettre à jour le statut dans la liste
                setRequestTypes(prev =>
                    prev.map(type => type.id === id ? { ...type, isActive: false } : type)
                );
            } else {
                // Supprimer de la liste
                setRequestTypes(prev => prev.filter(type => type.id !== id));
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
            console.error('Erreur lors de la suppression du type de requête:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Basculer rapidement l'état actif
    const toggleActive = async (requestType: RequestType) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:3000/api/request-types', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: requestType.id,
                    isActive: !requestType.isActive
                })
            });

            if (!response.ok) {
                let errorMessage = 'Erreur lors de la mise à jour du statut.';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || `Erreur ${response.status}: ${response.statusText}`;
                } catch (parseError) {
                    errorMessage = `Erreur ${response.status}: ${response.statusText}. La réponse du serveur n\'est pas au format JSON.`;
                }
                throw new Error(errorMessage);
            }

            const updatedType = await response.json();

            // Mettre à jour la liste
            setRequestTypes(prev =>
                prev.map(type => type.id === updatedType.id ? updatedType : type)
            );

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
            console.error('Erreur lors de la mise à jour du statut:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Formater la date
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Types de requêtes disponibles</h2>
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
                        disabled={isLoading}
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Ajouter un type
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Formulaire d'ajout/édition */}
                {isFormOpen && (
                    <div className="mb-6 p-5 bg-gray-50 border border-gray-200 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">
                            {isEditing ? 'Modifier le type de requête' : 'Ajouter un nouveau type de requête'}
                        </h3>

                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label htmlFor="typeName" className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom du type de requête *
                                    </label>
                                    <input
                                        type="text"
                                        id="typeName"
                                        value={formData.name}
                                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Ex: Changement de planning"
                                        required
                                    />
                                </div>

                                <div className="flex items-center space-x-8 mt-6">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="requiresApproval"
                                            checked={formData.requiresAdminApproval}
                                            onChange={e => setFormData(prev => ({ ...prev, requiresAdminApproval: e.target.checked }))}
                                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                        />
                                        <label htmlFor="requiresApproval" className="ml-2 block text-sm text-gray-700">
                                            Nécessite approbation admin
                                        </label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="isActive"
                                            checked={formData.isActive}
                                            onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                        />
                                        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                                            Actif
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="typeDescription" className="block text-sm font-medium text-gray-700 mb-1">
                                    Description (optionnelle)
                                </label>
                                <textarea
                                    id="typeDescription"
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Décrivez ce type de requête pour aider les utilisateurs à comprendre son usage..."
                                />
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 text-gray-600 font-medium hover:text-gray-800"
                                    disabled={isLoading}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
                                    disabled={isLoading}
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Liste des types de requêtes */}
                {isLoading && !requestTypes.length ? (
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
                        <p className="mt-4 text-gray-600">Chargement des types de requêtes...</p>
                    </div>
                ) : requestTypes.length === 0 ? (
                    <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                        <p className="text-gray-500">Aucun type de requête n'a été défini.</p>
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="mt-4 inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 font-medium rounded-md hover:bg-primary-200 transition-colors"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Ajouter votre premier type de requête
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nom
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Approbation
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date de création
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {requestTypes.map(type => (
                                    <tr key={type.id} className={`${!type.isActive ? 'bg-gray-50 text-gray-500' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {type.name}
                                            {!type.isActive && <span className="ml-2 text-xs text-gray-500">(inactif)</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="max-w-xs truncate">
                                                {type.description || <span className="italic">Aucune description</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {type.requiresAdminApproval ? (
                                                <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-gray-400 mx-auto" />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => toggleActive(type)}
                                                className="inline-flex items-center text-sm"
                                                title={type.isActive ? 'Cliquez pour désactiver' : 'Cliquez pour activer'}
                                            >
                                                {type.isActive ? (
                                                    <ToggleRight className="h-6 w-6 text-emerald-500" />
                                                ) : (
                                                    <ToggleLeft className="h-6 w-6 text-gray-400" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(type.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => openEditForm(type)}
                                                className="text-primary-600 hover:text-primary-900 mr-4"
                                            >
                                                <Edit className="h-5 w-5 inline" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(type.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 className="h-5 w-5 inline" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-amber-800 font-medium mb-2 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Notes sur les types de requêtes
                </h3>
                <ul className="text-amber-700 text-sm space-y-1 ml-7 list-disc">
                    <li>La désactivation d'un type de requête le rend indisponible pour de nouvelles requêtes, mais ne supprime pas les requêtes existantes.</li>
                    <li>La suppression est possible uniquement pour les types qui n'ont pas de requêtes associées.</li>
                    <li>Lorsque vous modifiez un type, les requêtes existantes conservent les anciennes valeurs.</li>
                </ul>
            </div>
        </div>
    );
} 