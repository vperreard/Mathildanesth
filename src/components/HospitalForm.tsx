import React, { useState, useEffect } from 'react';

// Interface pour représenter un hôpital
export interface Hospital {
    id?: number;
    name: string;
    address: string;
    city: string;
    postalCode: string;
    phone?: string;
    email?: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

// Interface pour les données du formulaire
export interface HospitalFormData {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
    email: string;
    isActive: boolean;
}

interface HospitalFormProps {
    onSubmit: (data: HospitalFormData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    initialData?: Hospital | null;
}

export default function HospitalForm({
    onSubmit,
    onCancel,
    isLoading = false,
    initialData = null,
}: HospitalFormProps) {
    // Initialiser l'état du formulaire
    const [formData, setFormData] = useState<HospitalFormData>(() => ({
        name: initialData?.name || '',
        address: initialData?.address || '',
        city: initialData?.city || '',
        postalCode: initialData?.postalCode || '',
        phone: initialData?.phone || '',
        email: initialData?.email || '',
        isActive: initialData?.isActive ?? true,
    }));

    const [error, setError] = useState<string | null>(null);

    // Mettre à jour le formulaire quand initialData change
    useEffect(() => {
        setFormData({
            name: initialData?.name || '',
            address: initialData?.address || '',
            city: initialData?.city || '',
            postalCode: initialData?.postalCode || '',
            phone: initialData?.phone || '',
            email: initialData?.email || '',
            isActive: initialData?.isActive ?? true,
        });
    }, [initialData]);

    // Gestion des modifications des champs du formulaire
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({
                ...prev,
                [name]: checked
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Soumission du formulaire
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        // Validation des champs requis
        if (!formData.name || !formData.address || !formData.city || !formData.postalCode) {
            setError('Veuillez remplir tous les champs obligatoires.');
            return;
        }

        try {
            await onSubmit(formData);
        } catch (err: unknown) {
            setError(err.response?.data?.message || err.message || 'Une erreur est survenue lors de la sauvegarde.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6" data-testid="hospital-form">
            {error && <p data-testid="error-message" className="text-red-500 text-sm font-medium mb-4 p-3 bg-red-50 border border-red-200 rounded-md">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom de l'hôpital *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Adresse *</label>
                    <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">Ville *</label>
                    <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">Code Postal *</label>
                    <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Téléphone</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="0123456789"
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="contact@hopital.fr"
                    />
                </div>
            </div>

            <div className="flex items-center">
                <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-700">Établissement actif</label>
            </div>

            <div className="flex justify-end space-x-3 pt-5">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                >
                    {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
            </div>
        </form>
    );
} 