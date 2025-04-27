'use client';

import React, { useState, useEffect } from 'react';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useRuleViolations } from '@/hooks/useRuleViolations';
import { UnsavedChangesIndicator, FormUnsavedIndicator } from '@/components/ui/UnsavedChangesIndicator';
import { RuleViolationIndicator } from '@/components/ui/RuleViolationIndicator';
import { useNotification } from '@/components/ui/notification';

interface FormWithIndicatorsProps {
    title?: string;
    onSave?: (data: any) => Promise<void>;
}

export const FormWithIndicators: React.FC<FormWithIndicatorsProps> = ({
    title = 'Formulaire avec indicateurs',
    onSave
}) => {
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        dateNaissance: '',
        specialite: ''
    });

    const { setHasUnsavedChanges, markAsSaved } = useUnsavedChanges();
    const { violations, addViolation, removeViolation, clearViolations } = useRuleViolations();
    const { showNotification } = useNotification();

    // Mettre à jour le statut des modifications non sauvegardées
    useEffect(() => {
        if (Object.values(formData).some(value => value !== '')) {
            setHasUnsavedChanges(true);
        }
    }, [formData, setHasUnsavedChanges]);

    // Fonction pour valider l'email
    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Fonction pour valider le numéro de téléphone
    const validatePhone = (phone: string) => {
        const phoneRegex = /^(0|\+33)[1-9]([-. ]?[0-9]{2}){4}$/;
        return phoneRegex.test(phone);
    };

    // Valider le formulaire
    const validateForm = () => {
        clearViolations();
        let isValid = true;

        // Vérification de l'email
        if (formData.email && !validateEmail(formData.email)) {
            addViolation({
                id: 'invalid-email',
                title: 'Email invalide',
                description: 'L\'adresse email saisie n\'est pas dans un format valide.',
                severity: 'error',
                suggestion: 'Veuillez saisir une adresse email valide (ex: nom@domaine.com)'
            });
            isValid = false;
        }

        // Vérification du téléphone
        if (formData.telephone && !validatePhone(formData.telephone)) {
            addViolation({
                id: 'invalid-phone',
                title: 'Téléphone invalide',
                description: 'Le numéro de téléphone saisi n\'est pas dans un format valide.',
                severity: 'warning',
                suggestion: 'Veuillez saisir un numéro de téléphone français valide (ex: 06 12 34 56 78)'
            });
            isValid = false;
        }

        // Vérification de l'âge
        if (formData.dateNaissance) {
            const birthDate = new Date(formData.dateNaissance);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();

            if (age < 18) {
                addViolation({
                    id: 'underage',
                    title: 'Utilisateur mineur',
                    description: 'L\'utilisateur semble être mineur.',
                    severity: 'error',
                    suggestion: 'L\'utilisateur doit avoir au moins 18 ans.'
                });
                isValid = false;
            } else if (age > 80) {
                addViolation({
                    id: 'retirement-age',
                    title: 'Âge de retraite dépassé',
                    description: 'L\'utilisateur a dépassé l\'âge normal de retraite.',
                    severity: 'info',
                    suggestion: 'Veuillez vérifier si cette information est correcte.'
                });
            }
        }

        return isValid;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            showNotification({
                type: 'error',
                title: 'Validation échouée',
                message: 'Veuillez corriger les erreurs dans le formulaire.'
            });
            return;
        }

        try {
            if (onSave) {
                await onSave(formData);
            }

            markAsSaved();
            showNotification({
                type: 'success',
                title: 'Sauvegarde réussie',
                message: 'Vos données ont été enregistrées avec succès.'
            });

        } catch (error) {
            showNotification({
                type: 'error',
                title: 'Erreur de sauvegarde',
                message: 'Une erreur est survenue lors de la sauvegarde des données.'
            });
        }
    };

    const handleFixViolation = (violationId: string) => {
        if (violationId === 'invalid-email') {
            setFormData(prev => ({ ...prev, email: '' }));
        } else if (violationId === 'invalid-phone') {
            setFormData(prev => ({ ...prev, telephone: '' }));
        }
        removeViolation(violationId);
    };

    return (
        <div className="bg-white shadow-md rounded-lg p-6 relative">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">{title}</h2>
                <FormUnsavedIndicator />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                        <input
                            type="text"
                            name="nom"
                            value={formData.nom}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                            placeholder="Dupont"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                        <input
                            type="text"
                            name="prenom"
                            value={formData.prenom}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                            placeholder="Jean"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                            placeholder="jean.dupont@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                        <input
                            type="tel"
                            name="telephone"
                            value={formData.telephone}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                            placeholder="06 12 34 56 78"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                        <input
                            type="date"
                            name="dateNaissance"
                            value={formData.dateNaissance}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Spécialité</label>
                        <select
                            name="specialite"
                            value={formData.specialite}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        >
                            <option value="">Sélectionner une spécialité</option>
                            <option value="anesthesie">Anesthésie</option>
                            <option value="cardiologie">Cardiologie</option>
                            <option value="neurologie">Neurologie</option>
                            <option value="pediatrie">Pédiatrie</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                    <button
                        type="button"
                        onClick={() => {
                            setFormData({
                                nom: '',
                                prenom: '',
                                email: '',
                                telephone: '',
                                dateNaissance: '',
                                specialite: ''
                            });
                            markAsSaved();
                            clearViolations();
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Réinitialiser
                    </button>

                    <button
                        type="submit"
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                    >
                        Enregistrer
                    </button>
                </div>
            </form>

            {/* Indicateurs */}
            <UnsavedChangesIndicator
                position="bottom-right"
                onSave={() => handleSubmit({ preventDefault: () => { } } as React.FormEvent)}
            />

            <RuleViolationIndicator
                violations={violations}
                position="bottom-left"
                onFixViolation={handleFixViolation}
                onDismissViolation={removeViolation}
            />
        </div>
    );
}; 