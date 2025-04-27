'use client'; // Nécessaire pour les hooks useState, useRouter, useSearchParams

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Utiliser next/navigation
import { CollectiveCalendar } from '@/modules/calendar/components/CollectiveCalendar'; // Utiliser alias
import { PersonalCalendar } from '@/modules/calendar/components/PersonalCalendar'; // Utiliser alias
import { AllocationCalendar } from '@/modules/calendar/components/AllocationCalendar'; // Utiliser alias
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { CalendarEventType } from '@/modules/calendar/types/event';
import DraggableCalendar from '../../components/DraggableCalendar';
import { Assignment, ShiftType, AssignmentStatus } from '../../types/assignment';
import { RulesConfiguration } from '../../types/rules';
import { User } from '../../types/user';
import { Doctor } from '../../types/doctor';
import toast from 'react-hot-toast';

// Définition du type CalendarEvent pour l'utiliser avec handleEventClick
interface CalendarEvent {
    id: string;
    type: string;
    startDate: Date;
    endDate: Date;
    leaveType?: string;
    status?: string;
    comment?: string;
    userId?: string;
}

// Type pour les onglets du calendrier
type CalendarTab = 'collective' | 'personal' | 'allocation';

const users: User[] = [
    { id: 1, prenom: 'Jean', nom: 'Dupont', email: 'jean.dupont@hopital.fr' },
    { id: 2, prenom: 'Marie', nom: 'Martin', email: 'marie.martin@hopital.fr' },
    { id: 3, prenom: 'Pierre', nom: 'Dubois', email: 'pierre.dubois@hopital.fr' }
];

// Exemple de règles de planification
const rules: RulesConfiguration = {
    minDaysBetweenAssignments: 2,
    maxAssignmentsPerMonth: 5,
    maxConsecutiveAssignments: 1,
    specialDays: []
};

// Renommer la fonction pour suivre la convention page.tsx
export default function CalendarPage() {
    const router = useRouter();
    const searchParams = useSearchParams(); // Hook pour lire les paramètres URL
    const { user, isLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<CalendarTab>('personal');
    const [leaveToEdit, setLeaveToEdit] = useState<CalendarEvent | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [syncErrors, setSyncErrors] = useState<any[]>([]);
    const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

    // Déterminer si l'utilisateur est un admin (total ou partiel)
    const isAdmin = user && (user.role === 'ADMIN_TOTAL' || user.role === 'ADMIN_PARTIEL');

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
    const handleEventClick = (event: any) => {
        if (!event || !event.extendedProps) {
            console.warn('Événement invalide reçu:', event);
            return;
        }

        const { type, id, start, end, leaveType, status, comment, userId } = event.extendedProps;

        if (type === 'leave') {
            const leave: CalendarEvent = {
                id,
                type,
                startDate: new Date(start),
                endDate: new Date(end),
                leaveType,
                status,
                comment: comment || '',
                userId
            };
            setLeaveToEdit(leave);
            setIsModalOpen(true);
        }
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

    // Charger les affectations au chargement de la page
    useEffect(() => {
        // Simulation d'un chargement depuis une API
        setIsLoadingAssignments(true);
        setTimeout(() => {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            // Générer des affectations aléatoires pour le mois en cours
            const generatedAssignments: Assignment[] = [];

            // Pour chaque utilisateur
            users.forEach((user, userIndex) => {
                // Attribuer 3 à 5 gardes aléatoires dans le mois
                const assignmentCount = 3 + Math.floor(Math.random() * 3);

                for (let i = 0; i < assignmentCount; i++) {
                    // Jour aléatoire entre 1 et 28
                    const day = 1 + Math.floor(Math.random() * 28);
                    const date = new Date(currentYear, currentMonth, day);

                    // Alterner les types de garde
                    const shiftTypes = [ShiftType.DAY, ShiftType.NIGHT, ShiftType.WEEKEND, ShiftType.HOLIDAY];
                    const shiftType = shiftTypes[Math.floor(Math.random() * shiftTypes.length)];

                    generatedAssignments.push({
                        id: `assignment-${userIndex}-${i}`,
                        doctorId: user.id.toString(),
                        date: date,
                        shiftType: shiftType,
                        status: AssignmentStatus.SCHEDULED,
                        notes: ''
                    });
                }
            });

            setAssignments(generatedAssignments);
            setIsLoadingAssignments(false);
        }, 1000);
    }, []);

    // Gérer la sauvegarde des affectations
    const handleSave = (updatedAssignments: Assignment[]) => {
        console.log('Affectations sauvegardées:', updatedAssignments);
        // Dans une application réelle, on pourrait envoyer ces données à une API
    };

    // Gérer les erreurs de validation
    const handleValidationError = (violations: any[]) => {
        console.error('Violations des règles:', violations);
        setSyncErrors(violations);
    };

    // Gérer la fin de la synchronisation
    const handleSyncComplete = (success: boolean) => {
        if (success) {
            toast.success('Synchronisation avec le calendrier principal réussie');
            setSyncErrors([]);
        } else {
            toast.error('Échec de la synchronisation avec le calendrier principal');
        }
    };

    // Si en cours de chargement, afficher un indicateur
    if (isLoading || isLoadingAssignments) {
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

                    {/* Boutons d'action supplémentaires */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        <button
                            onClick={() => router.push('/leaves/history')}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Historique
                            </span>
                        </button>

                        <button
                            onClick={() => router.push('/leaves/stats')}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Statistiques
                            </span>
                        </button>

                        <button
                            onClick={() => router.push('/calendar/export')}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Exporter
                            </span>
                        </button>

                        <button
                            onClick={() => router.push('/calendar/settings')}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Paramètres
                            </span>
                        </button>
                    </div>
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
                            onEventClick={handleEventClick}
                            onRequestLeave={handleRequestLeave}
                        />
                    )}

                    {activeTab === 'collective' && (
                        <CollectiveCalendar
                            onEventClick={handleEventClick}
                            onRequestLeave={handleRequestLeave}
                        />
                    )}

                    {activeTab === 'allocation' && isAdmin && (
                        <DraggableCalendar
                            initialAssignments={assignments}
                            users={users}
                            rules={rules}
                            onSave={handleSave}
                            onValidationError={handleValidationError}
                            onSyncComplete={handleSyncComplete}
                        />
                    )}
                </motion.div>
            </motion.div>
        </>
    );
}