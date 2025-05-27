'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import dynamic from 'next/dynamic';
import { CalendarTab } from './types';
import { Assignment } from '@/types/assignment';
import { Violation } from '@/types/validation';
import toast from 'react-hot-toast';

// Composant de chargement pour les imports dynamiques
const CalendarLoader = () => (
    <div className="flex justify-center items-center h-64 w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
);

// Import dynamique des composants de calendrier (lazy loading)
const CollectiveCalendar = dynamic(
    () => import('@/modules/calendar/components/CollectiveCalendar').then(mod => ({ default: mod.CollectiveCalendar })),
    { 
        loading: () => <CalendarLoader />,
        ssr: false
    }
);

const PersonalCalendar = dynamic(
    () => import('@/modules/calendar/components/PersonalCalendar').then(mod => ({ default: mod.PersonalCalendar })),
    { 
        loading: () => <CalendarLoader />,
        ssr: false
    }
);

const DraggableCalendar = dynamic(
    () => import('@/components/DraggableCalendar'),
    { 
        loading: () => <CalendarLoader />,
        ssr: false
    }
);

// Composant modal léger
const LeaveModal = dynamic(
    () => import('./components/LeaveModal'),
    { ssr: false }
);

// Données simplifiées
const DEMO_USERS = [
    { id: '1', prenom: 'Jean', nom: 'Dupont', email: 'jean.dupont@hopital.fr', role: 'USER' },
    { id: '2', prenom: 'Marie', nom: 'Martin', email: 'marie.martin@hopital.fr', role: 'USER' },
];

const DEMO_RULES = {
    minDaysBetweenAssignments: 2,
    maxAssignmentsPerMonth: 5,
    maxConsecutiveAssignments: 1,
    specialDays: []
};

export default function OptimizedCalendarPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<CalendarTab>('personal');
    const [leaveToEdit, setLeaveToEdit] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

    const isAdmin = user && (user.role === 'ADMIN_TOTAL' || user.role === 'ADMIN_PARTIEL');

    // Lire l'onglet depuis l'URL
    useEffect(() => {
        const tabParam = searchParams?.get('tab') as CalendarTab | null;
        if (tabParam && ['collective', 'personal', 'allocation'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    // Gérer le changement d'onglet
    const handleTabChange = (tab: CalendarTab) => {
        setActiveTab(tab);
        router.push(`/calendrier?tab=${tab}`, { scroll: false });
    };

    // Gérer le clic sur un événement
    const handleEventClick = (event: any) => {
        if (!event?.extendedProps) return;
        
        const { type, id, start, end, leaveType, status, comment, userId } = event.extendedProps;
        
        if (type === 'leave') {
            setLeaveToEdit({
                id,
                type,
                startDate: new Date(start),
                endDate: new Date(end),
                leaveType,
                status,
                comment: comment || '',
                userId
            });
            setIsModalOpen(true);
        }
    };

    // Charger les affectations uniquement pour l'onglet allocation
    useEffect(() => {
        if (activeTab === 'allocation' && isAdmin) {
            fetchAssignments();
        }
    }, [activeTab, isAdmin]);

    const fetchAssignments = async () => {
        setIsLoadingAssignments(true);
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const response = await fetch(
                `/api/affectations?start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`
            );

            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}`);
            }

            const data = await response.json();
            const fetchedAssignments = (data.assignments || []).map((a: any) => ({
                ...a,
                startDate: new Date(a.startDate),
                endDate: new Date(a.endDate),
                createdAt: new Date(a.createdAt),
                updatedAt: new Date(a.updatedAt)
            }));
            setAssignments(fetchedAssignments);
        } catch (error) {
            console.error("Erreur lors du chargement des affectations:", error);
            toast.error("Impossible de charger les affectations.");
            setAssignments([]);
        } finally {
            setIsLoadingAssignments(false);
        }
    };

    const handleSave = async (updatedAssignments: Assignment[]) => {
        try {
            const response = await fetch('http://localhost:3000/api/affectations', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignments: updatedAssignments })
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}`);
            }

            toast.success('Affectations sauvegardées avec succès.');
            setAssignments(updatedAssignments);
        } catch (error) {
            console.error("Erreur lors de la sauvegarde:", error);
            toast.error('Échec de la sauvegarde des affectations.');
        }
    };

    const handleValidationError = (violations: Violation[]) => {
        violations.forEach(v => toast.error(`Validation: ${v.message}`));
    };

    const handleSyncComplete = (success: boolean) => {
        if (!success) {
            toast.error('Échec de la synchronisation');
        }
    };

    // États de chargement
    if (isLoading) {
        return <CalendarLoader />;
    }

    if (!user) {
        return (
            <div className="max-w-screen-2xl mx-auto px-2 py-8 w-full">
                <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-lg shadow-sm">
                    <p className="font-semibold text-amber-800">Veuillez vous connecter</p>
                    <p className="text-amber-700">Vous devez être connecté pour accéder au calendrier.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-screen-2xl mx-auto px-2 md:px-6 lg:px-8 py-8 w-full">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Calendrier</h1>

            {/* Bouton d'action */}
            <div className="mb-6 flex justify-end">
                <button
                    onClick={() => router.push('/conges/nouveau')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out shadow-sm"
                >
                    Demander un congé
                </button>
            </div>

            {/* Onglets */}
            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => handleTabChange('personal')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'personal' 
                                ? 'border-blue-500 text-blue-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Mon Calendrier
                    </button>
                    {isAdmin && (
                        <>
                            <button
                                onClick={() => handleTabChange('collective')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'collective' 
                                        ? 'border-blue-500 text-blue-600' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Calendrier Collectif
                            </button>
                            <button
                                onClick={() => handleTabChange('allocation')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'allocation' 
                                        ? 'border-blue-500 text-blue-600' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Allocation des Gardes
                            </button>
                        </>
                    )}
                </nav>
            </div>

            {/* Contenu de l'onglet actif avec Suspense */}
            <Suspense fallback={<CalendarLoader />}>
                {activeTab === 'personal' && user && (
                    <PersonalCalendar userId={user.id} onEventClick={handleEventClick} />
                )}
                {activeTab === 'collective' && isAdmin && (
                    <CollectiveCalendar onEventClick={handleEventClick} />
                )}
                {activeTab === 'allocation' && isAdmin && (
                    <>
                        {isLoadingAssignments ? (
                            <CalendarLoader />
                        ) : (
                            <DraggableCalendar
                                initialAssignments={assignments}
                                users={DEMO_USERS}
                                rules={DEMO_RULES as any}
                                onSave={handleSave}
                                onValidationError={handleValidationError}
                                onSyncComplete={handleSyncComplete}
                            />
                        )}
                    </>
                )}
            </Suspense>

            {/* Modal */}
            {isModalOpen && leaveToEdit && (
                <LeaveModal
                    leave={leaveToEdit}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
}