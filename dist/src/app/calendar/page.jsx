'use client'; // Nécessaire pour les hooks useState, useRouter, useSearchParams
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Utiliser next/navigation
import { CollectiveCalendar } from '@/modules/calendar/components/CollectiveCalendar'; // Utiliser alias
import { PersonalCalendar } from '@/modules/calendar/components/PersonalCalendar'; // Utiliser alias
import { AllocationCalendar } from '@/modules/calendar/components/AllocationCalendar'; // Utiliser alias
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import AdminRequestsBanner from '@/components/AdminRequestsBanner';
// Renommer la fonction pour suivre la convention page.tsx
export default function CalendarPage() {
    var router = useRouter();
    var searchParams = useSearchParams(); // Hook pour lire les paramètres URL
    var _a = useAuth(), user = _a.user, isLoading = _a.isLoading;
    // Déterminer si l'utilisateur est un admin (total ou partiel)
    var isAdmin = user && (user.role === 'ADMIN_TOTAL' || user.role === 'ADMIN_PARTIEL');
    // État pour l'onglet actif
    var _b = useState('personal'), activeTab = _b[0], setActiveTab = _b[1];
    // Lire l'onglet depuis l'URL au chargement et lors des changements
    useEffect(function () {
        var tabParam = searchParams === null || searchParams === void 0 ? void 0 : searchParams.get('tab');
        if (tabParam && ['collective', 'personal', 'allocation'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);
    // Gérer le changement d'onglet
    var handleTabChange = function (tab) {
        setActiveTab(tab);
        // Mettre à jour l'URL sans rechargement de la page pour faciliter le partage
        router.push("/calendar?tab=".concat(tab), { scroll: false });
    };
    // Gérer le clic sur un événement du calendrier
    var handleEventClick = function (eventId, eventType) {
        console.log("\u00C9v\u00E9nement cliqu\u00E9: ".concat(eventId, " de type ").concat(eventType));
        // Implémenter la logique d'affichage des détails de l'événement
        // Par exemple, naviguer vers une page de détail
    };
    // Animations
    var fadeIn = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.4 } }
    };
    var tabAnimation = {
        hidden: { y: 10, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.3 } }
    };
    // Si en cours de chargement, afficher un indicateur
    if (isLoading) {
        return (<div className="flex justify-center items-center h-64 w-full">
                <div className="calendar-loading-spinner"/>
            </div>);
    }
    // Si l'utilisateur n'est pas connecté, afficher un message
    if (!user) {
        return (<motion.div className="max-w-screen-2xl mx-auto px-2 py-8 w-full" initial="hidden" animate="visible" variants={fadeIn}>
                <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-lg shadow-sm">
                    <h2 className="text-lg font-semibold text-amber-700 mb-2">Accès restreint</h2>
                    <p className="text-amber-600">Vous devez être connecté pour accéder au calendrier.</p>
                </div>
            </motion.div>);
    }
    return (<>
            {isAdmin && <AdminRequestsBanner />}

            <motion.div className="max-w-screen-2xl mx-auto px-2 py-4 w-full" initial="hidden" animate="visible" variants={fadeIn}>
                {/* En-tête de la page */}
                <div className="mb-6">
                    <motion.h1 className="text-2xl font-bold text-gray-800 mb-1" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        Calendrier
                    </motion.h1>
                    <p className="text-gray-600 text-sm">Consultez et gérez vos événements dans notre calendrier interactif.</p>
                </div>

                {/* Onglets */}
                <div className="mb-4 border-b border-gray-200">
                    <nav className="-mb-px flex gap-1" aria-label="Tabs">
                        <button onClick={function () { return handleTabChange('personal'); }} className={"px-5 py-2 rounded-t-lg font-medium text-sm transition-all duration-200 ".concat(activeTab === 'personal'
            ? 'bg-white text-indigo-600 border-b-2 border-indigo-500 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50')}>
                            Mon calendrier
                        </button>

                        <button onClick={function () { return handleTabChange('collective'); }} className={"px-5 py-2 rounded-t-lg font-medium text-sm transition-all duration-200 ".concat(activeTab === 'collective'
            ? 'bg-white text-indigo-600 border-b-2 border-indigo-500 shadow-sm'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50')}>
                            Calendrier des congés
                        </button>

                        {/* Onglet d'affectations visible uniquement pour les admins */}
                        {isAdmin && (<button onClick={function () { return handleTabChange('allocation'); }} className={"px-5 py-2 rounded-t-lg font-medium text-sm transition-all duration-200 ".concat(activeTab === 'allocation'
                ? 'bg-white text-indigo-600 border-b-2 border-indigo-500 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50')}>
                                Affectations
                            </button>)}
                    </nav>
                </div>

                {/* Contenu de l'onglet actif */}
                <motion.div key={activeTab} initial="hidden" animate="visible" variants={tabAnimation} className="bg-white rounded-lg shadow-sm p-3 w-full">
                    {activeTab === 'personal' && user && (<PersonalCalendar userId={user.id.toString()} onEventClick={handleEventClick}/>)}

                    {activeTab === 'collective' && (<CollectiveCalendar onEventClick={handleEventClick}/>)}

                    {activeTab === 'allocation' && isAdmin && (<AllocationCalendar onEventClick={handleEventClick}/>)}
                </motion.div>
            </motion.div>
        </>);
}
