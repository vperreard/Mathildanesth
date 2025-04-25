'use client'; // Nécessaire pour les hooks useState, useRouter, useSearchParams

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Utiliser next/navigation
import { CollectiveCalendar } from '@/modules/calendar/components/CollectiveCalendar'; // Utiliser alias
import { PersonalCalendar } from '@/modules/calendar/components/PersonalCalendar'; // Utiliser alias
import { AllocationCalendar } from '@/modules/calendar/components/AllocationCalendar'; // Utiliser alias
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { CalendarEventType } from '@/modules/calendar/types/event';

// Définition du type CalendarEvent pour l'utiliser avec handleEventClick
interface CalendarEvent {
    id: string;
    type: string;
}

// Type pour les onglets du calendrier
type CalendarTab = 'collective' | 'personal' | 'allocation';

// Renommer la fonction pour suivre la convention page.tsx
export default function CalendarPage() {
    const router = useRouter();
    const searchParams = useSearchParams(); // Hook pour lire les paramètres URL
    const { user, isLoading } = useAuth();

    // Déterminer si l'utilisateur est un admin (total ou partiel)
    const isAdmin = user && (user.role === 'ADMIN_TOTAL' || user.role === 'ADMIN_PARTIEL');

    // État pour l'onglet actif
    const [activeTab, setActiveTab] = useState<CalendarTab>('personal');

    // Lire l'onglet depuis l'URL au chargement et lors des changements
    useEffect(() => {
        const tabParam = searchParams?.get('tab') as CalendarTab | null;
        if (tabParam && ['collective', 'personal', 'allocation'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    // Gérer le changement d'onglet
    const handleTabChange = (tab: CalendarTab) => {
        setActiveTab(tab);
        // Mettre à jour l'URL sans rechargement de la page pour faciliter le partage
        router.push(`/calendar?tab=${tab}`, { scroll: false });
    };

    // Gérer le clic sur un événement du calendrier
    const handleEventClick = (event: CalendarEvent) => {
        // Rediriger vers la page de détails selon le type d'événement
        if (event.type === 'LEAVE') {
            router.push(`/leaves/${event.id}`);
        }
        // Gérer d'autres types d'événements si nécessaire
    };

    // Gérer le clic sur le bouton "Demander un congé"
    const handleRequestLeave = () => {
        router.push('/leaves/new');
    };

    // Animations
    const fadeIn = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.4 } }
    };

    const tabAnimation = {
        hidden: { y: 10, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.3 } }
    };

    // Si en cours de chargement, afficher un indicateur
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64 w-full">
                <div className="calendar-loading-spinner" />
            </div>
        );
    }

    // Si l'utilisateur n'est pas connecté, afficher un message
    if (!user) {
        return (
            <motion.div
                className="max-w-screen-2xl mx-auto px-2 py-8 w-full"
                initial="hidden"
                animate="visible"
                variants={fadeIn}
            >
                <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-lg shadow-sm">
                    <h2 className="text-lg font-semibold text-amber-700 mb-2">Accès restreint</h2>
                    <p className="text-amber-600">Vous devez être connecté pour accéder au calendrier.</p>
                </div>
            </motion.div>
        );
    }

    return (
        <>
            {/* Supprimer l'affichage de AdminRequestsBanner pour éviter la duplication */}
            {/* {isAdmin && <AdminRequestsBanner />} */}

            <motion.div
                className="max-w-screen-2xl mx-auto px-2 py-4 w-full"
                initial="hidden"
                animate="visible"
                variants={fadeIn}
            >
                {/* En-tête de la page */}
                <div className="mb-6">
                    <motion.h1
                        className="text-2xl font-bold text-gray-800 mb-1"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        Calendrier
                    </motion.h1>
                    <p className="text-gray-600 text-sm">Consultez et gérez vos événements dans notre calendrier interactif.</p>
                </div>

                {/* Onglets */}
                <div className="mb-4 border-b border-gray-200">
                    <nav className="-mb-px flex flex-wrap gap-1" aria-label="Tabs">
                        <button
                            onClick={() => handleTabChange('personal')}
                            className={`px-3 sm:px-5 py-2 rounded-t-lg font-medium text-xs sm:text-sm transition-all duration-200 ${activeTab === 'personal'
                                ? 'bg-white text-indigo-600 border-b-2 border-indigo-500 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Mon calendrier
                        </button>

                        <button
                            onClick={() => handleTabChange('collective')}
                            className={`px-3 sm:px-5 py-2 rounded-t-lg font-medium text-xs sm:text-sm transition-all duration-200 ${activeTab === 'collective'
                                ? 'bg-white text-indigo-600 border-b-2 border-indigo-500 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Calendrier des congés
                        </button>

                        {/* Onglet d'affectations visible uniquement pour les admins */}
                        {isAdmin && (
                            <button
                                onClick={() => handleTabChange('allocation')}
                                className={`px-3 sm:px-5 py-2 rounded-t-lg font-medium text-xs sm:text-sm transition-all duration-200 ${activeTab === 'allocation'
                                    ? 'bg-white text-indigo-600 border-b-2 border-indigo-500 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Affectations
                            </button>
                        )}
                    </nav>
                </div>

                {/* Contenu de l'onglet actif */}
                <motion.div
                    key={activeTab}
                    initial="hidden"
                    animate="visible"
                    variants={tabAnimation}
                    className="bg-white rounded-lg shadow-sm p-2 sm:p-3 w-full"
                >
                    {activeTab === 'personal' && user && (
                        <PersonalCalendar
                            userId={user.id.toString()}
                            onEventClick={(eventId, eventType) => handleEventClick({ id: eventId, type: eventType })}
                            onRequestLeave={handleRequestLeave}
                        />
                    )}

                    {activeTab === 'collective' && (
                        <CollectiveCalendar
                            onEventClick={(eventId, eventType) => handleEventClick({ id: eventId, type: eventType })}
                            onRequestLeave={handleRequestLeave}
                        />
                    )}

                    {activeTab === 'allocation' && isAdmin && (
                        <AllocationCalendar />
                    )}
                </motion.div>
            </motion.div>
        </>
    );
} 