'use client';

import React, { useState } from 'react';
import { FormWithIndicators } from '@/components/FormWithIndicators';
import { useNotification } from '@/components/ui/notification';

const DemoPage: React.FC = () => {
    const { showNotification } = useNotification();
    const [demoState, setDemoState] = useState({
        notifications: 0,
    });

    const handleDemoNotification = (type: 'info' | 'success' | 'warning' | 'error') => {
        const typeLabels = {
            info: 'Information',
            success: 'Succès',
            warning: 'Avertissement',
            error: 'Erreur'
        };

        const messages = {
            info: 'Ceci est une notification d\'information pour montrer les fonctionnalités du système.',
            success: 'L\'opération a été effectuée avec succès. Tout s\'est passé comme prévu.',
            warning: 'Attention, cette action pourrait avoir des conséquences inattendues.',
            error: 'Une erreur s\'est produite lors de l\'exécution de cette opération.'
        };

        showNotification({
            type,
            title: `${typeLabels[type]} #${demoState.notifications + 1}`,
            message: messages[type],
            duration: 5000,
        });

        setDemoState(prev => ({
            ...prev,
            notifications: prev.notifications + 1
        }));
    };

    const handleFormSave = async (data: any) => {
        // Simuler un appel API
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('Données sauvegardées:', data);
        return data;
    };

    return (
        <div className="container mx-auto py-10 px-4">
            <header className="mb-12 text-center">
                <h1 className="text-4xl font-bold mb-4">Démonstration des indicateurs visuels</h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Cette page démontre les nouveaux composants d'indicateurs visuels pour améliorer l'expérience utilisateur.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
                <div>
                    <h2 className="text-2xl font-semibold mb-6">Notifications non-intrusives</h2>
                    <div className="bg-white shadow-md rounded-lg p-6">
                        <p className="mb-4 text-gray-700">
                            Cliquez sur les boutons ci-dessous pour afficher différents types de notifications:
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => handleDemoNotification('info')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Information
                            </button>
                            <button
                                onClick={() => handleDemoNotification('success')}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                                Succès
                            </button>
                            <button
                                onClick={() => handleDemoNotification('warning')}
                                className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
                            >
                                Avertissement
                            </button>
                            <button
                                onClick={() => handleDemoNotification('error')}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                Erreur
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-semibold mb-6">Guide d'utilisation</h2>
                    <div className="bg-white shadow-md rounded-lg p-6">
                        <ul className="space-y-3">
                            <li className="flex items-start">
                                <div className="min-w-[24px] text-green-500 mr-2">✓</div>
                                <p>Modifiez les champs du formulaire pour voir l'indicateur de modifications non sauvegardées</p>
                            </li>
                            <li className="flex items-start">
                                <div className="min-w-[24px] text-green-500 mr-2">✓</div>
                                <p>Saisissez un email invalide ou un numéro de téléphone incorrect pour voir les violations de règles</p>
                            </li>
                            <li className="flex items-start">
                                <div className="min-w-[24px] text-green-500 mr-2">✓</div>
                                <p>Cliquez sur "Enregistrer" pour voir les notifications de validation et de sauvegarde</p>
                            </li>
                            <li className="flex items-start">
                                <div className="min-w-[24px] text-green-500 mr-2">✓</div>
                                <p>Cliquez sur les indicateurs pour voir les options de résolution proposées</p>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="mb-12">
                <h2 className="text-2xl font-semibold mb-6">Formulaire avec indicateurs visuels</h2>
                <FormWithIndicators
                    title="Ajouter un anesthésiste"
                    onSave={handleFormSave}
                />
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-12">
                <h2 className="text-xl font-semibold mb-4">À propos des indicateurs</h2>
                <p className="mb-4">
                    Ces composants ont été conçus pour améliorer l'expérience utilisateur en fournissant des retours visuels clairs sur:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>L'état des modifications non sauvegardées</li>
                    <li>Les erreurs de validation et les violations de règles</li>
                    <li>Les notifications d'événements du système</li>
                </ul>
                <p>
                    Ils sont non-intrusifs et offrent des suggestions de résolution pour aider l'utilisateur à corriger rapidement les problèmes.
                </p>
            </div>
        </div>
    );
};

export default DemoPage; 