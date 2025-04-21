'use client'; // Nécessaire pour les hooks useState, useRouter, useSearchParams

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Utiliser next/navigation
import { CollectiveCalendar } from '@/modules/calendar/components/CollectiveCalendar'; // Utiliser alias
import { PersonalCalendar } from '@/modules/calendar/components/PersonalCalendar'; // Utiliser alias
import { AllocationCalendar } from '@/modules/calendar/components/AllocationCalendar'; // Utiliser alias
import { useAuth } from '@/context/AuthContext';

// Type pour les onglets du calendrier
type CalendarTab = 'collective' | 'personal' | 'allocation';

// Renommer la fonction pour suivre la convention page.tsx
export default function CalendarPage() {
    const router = useRouter();
    const searchParams = useSearchParams(); // Hook pour lire les paramètres URL
    const { user } = useAuth();

    // Déterminer si l'utilisateur est un admin (total ou partiel)
    const isAdmin = user && (user.role === 'ADMIN_TOTAL' || user.role === 'ADMIN_PARTIEL');

    // État pour l'onglet actif
    const [activeTab, setActiveTab] = useState<CalendarTab>('personal');

    // Lire l'onglet depuis l'URL au chargement et lors des changements
    useEffect(() => {
        const tabParam = searchParams.get('tab') as CalendarTab;
        if (tabParam && ['collective', 'personal', 'allocation'].includes(tabParam)) {
            setActiveTab(tabParam);
        } else {
            // Si l'onglet n'est pas valide ou absent, définir sur 'personal' par défaut
            // et mettre à jour l'URL sans recharger la page
            setActiveTab('personal');
            router.replace('/calendar?tab=personal');
        }
    }, [searchParams, router]);

    // Changer d'onglet (met à jour l'URL)
    const handleTabChange = (newTab: CalendarTab) => {
        setActiveTab(newTab);
        // Met à jour l'URL sans navigation complète
        router.push(`/calendar?tab=${newTab}`);
    };

    // Gestionnaire de clic sur un événement
    const handleEventClick = (eventId: string, eventType: string) => {
        // Rediriger vers la page appropriée en fonction du type d'événement
        if (eventType === 'LEAVE') {
            router.push(`/leaves/${eventId}`);
        } else if (eventType === 'ASSIGNMENT') {
            router.push(`/assignments/${eventId}`);
        } else if (eventType === 'DUTY') {
            router.push(`/duties/${eventId}`);
        } else if (eventType === 'ON_CALL') {
            router.push(`/on-calls/${eventId}`);
        }
    };

    // Si l'utilisateur n'est pas connecté, afficher un message
    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                    <p className="text-yellow-700">Vous devez être connecté pour accéder au calendrier.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Onglets */}
            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => handleTabChange('personal')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'personal'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Mon calendrier
                    </button>

                    <button
                        onClick={() => handleTabChange('collective')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'collective'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Calendrier des congés
                    </button>

                    {/* Onglet d'affectations visible uniquement pour les admins */}
                    {isAdmin && (
                        <button
                            onClick={() => handleTabChange('allocation')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'allocation'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Affectations
                        </button>
                    )}
                </nav>
            </div>

            {/* Contenu de l'onglet actif */}
            <div>
                {activeTab === 'personal' && user && (
                    <PersonalCalendar
                        userId={user.id.toString()}
                        onEventClick={handleEventClick}
                    />
                )}

                {activeTab === 'collective' && (
                    <CollectiveCalendar
                        onEventClick={handleEventClick}
                    />
                )}

                {activeTab === 'allocation' && isAdmin && (
                    <AllocationCalendar
                        onEventClick={handleEventClick}
                    />
                )}
            </div>
        </div>
    );
} 