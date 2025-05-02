'use client'; // Nécessaire pour les hooks useState, useRouter, useSearchParams

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Utiliser next/navigation
import { CollectiveCalendar } from '@/modules/calendar/components/CollectiveCalendar'; // Utiliser alias
import { PersonalCalendar } from '@/modules/calendar/components/PersonalCalendar'; // Utiliser alias
import { AllocationCalendar } from '@/modules/calendar/components/AllocationCalendar'; // Utiliser alias
import { useAuth } from '@/hooks/useAuth';
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
            <div className="px-2 py-4 sm:p-6 lg:max-w-[1600px] lg:mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-4"
                >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                Calendrier
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Consultez et gérez les événements et affectations
                            </p>
                        </div>

                        {/* Navigation des onglets */}
                        <div className="bg-white rounded-lg shadow-sm p-1 self-stretch sm:self-auto">
                            <div className="flex flex-wrap space-x-1">
                                <button
                                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'personal'
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    onClick={() => handleTabChange('personal')}
                                >
                                    Personnel
                                </button>
                                <button
                                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'collective'
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    onClick={() => handleTabChange('collective')}
                                >
                                    Collectif
                                </button>
                                {isAdmin && (
                                    <button
                                        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'allocation'
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        onClick={() => handleTabChange('allocation')}
                                    >
                                        Affectation
                                    </button>
                                )}
                            </div>
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
            </div>
        </>
    );
}