'use client'; // Nécessaire pour les hooks useState, useRouter, useSearchParams

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Utiliser next/navigation
import { CollectiveCalendar } from '@/modules/calendar/components/CollectiveCalendar'; // Utiliser alias
import { PersonalCalendar } from '@/modules/calendar/components/PersonalCalendar'; // Utiliser alias
import { AllocationCalendar } from '@/modules/calendar/components/AllocationCalendar'; // Utiliser alias
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { CalendarEventType } from '@/modules/calendar/types/event';
import DraggableCalendar from '@/components/DraggableCalendar'; // Correction chemin relatif si nécessaire
import { Assignment, AssignmentStatus } from '@/types/assignment'; // Utiliser alias
import { ShiftType } from '@/types/common'; // Utiliser l'alias
import { RulesConfiguration } from '@/types/rules'; // Utiliser alias
import { User } from '@/types/user'; // Utiliser alias
import { Violation } from '@/types/validation'; // Importer Violation
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

// Données de démo pour les utilisateurs (avec userId en string et role string)
const users: User[] = [
    { id: '1', prenom: 'Jean', nom: 'Dupont', email: 'jean.dupont@hopital.fr', role: 'USER' },
    { id: '2', prenom: 'Marie', nom: 'Martin', email: 'marie.martin@hopital.fr', role: 'USER' },
    { id: '3', prenom: 'Pierre', nom: 'Dubois', email: 'pierre.dubois@hopital.fr', role: 'ADMIN_PARTIEL' } // Exemple admin
];

// Exemple de règles de planification (simplifié pour la démo, à compléter si nécessaire)
const rules: Partial<RulesConfiguration> = { // Utiliser Partial pour les démos incomplètes
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
    const [syncErrors, setSyncErrors] = useState<Violation[]>([]); // Utiliser Violation[]
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

    // Charger les affectations au chargement de la page via API
    useEffect(() => {
        const fetchAssignments = async () => {
            setIsLoadingAssignments(true);
            try {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

                // Appel fetch direct vers l'API
                const response = await fetch(`/api/assignments?start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Erreur HTTP ${response.status} lors de la récupération des affectations`);
                }

                const data = await response.json();
                // Assurer que les dates sont des objets Date
                const fetchedAssignments = (data.assignments || []).map((a: any) => ({
                    ...a,
                    startDate: new Date(a.startDate),
                    endDate: new Date(a.endDate),
                    createdAt: new Date(a.createdAt), // Convertir aussi createdAt/updatedAt
                    updatedAt: new Date(a.updatedAt)
                }));
                setAssignments(fetchedAssignments);

            } catch (error: any) {
                console.error("Erreur lors du chargement des affectations:", error);
                toast.error(error.message || "Impossible de charger les affectations.");
                setAssignments([]);
            } finally {
                setIsLoadingAssignments(false);
            }
        };

        fetchAssignments();
    }, []); // Déclenché une seule fois au montage

    // Gérer la sauvegarde des affectations via API
    const handleSave = async (updatedAssignments: Assignment[]) => {
        console.log('Sauvegarde demandée pour:', updatedAssignments);
        try {
            const response = await fetch('/api/assignments', {
                method: 'PATCH', // ou POST
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignments: updatedAssignments })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erreur HTTP ${response.status} lors de la sauvegarde`);
            }

            const result = await response.json();
            toast.success(result.message || 'Affectations sauvegardées avec succès.');
            // Re-fetcher ou mettre à jour l'état local de manière optimiste si l'API renvoie les données sauvegardées
            setAssignments(updatedAssignments); // Mise à jour optimiste simple

        } catch (error: any) {
            console.error("Erreur lors de la sauvegarde des affectations via API:", error);
            toast.error(error.message || 'Échec de la sauvegarde des affectations via API.');
        }
    };

    // Gérer les erreurs de validation
    const handleValidationError = (violations: Violation[]) => { // Utiliser le type Violation
        console.error('Violations des règles:', violations);
        setSyncErrors(violations); // Stocker les violations typées
        violations.forEach(v => toast.error(`Validation: ${v.message}`));
    };

    // Gérer la fin de la synchronisation (peut être intégré dans handleSave)
    const handleSyncComplete = (success: boolean) => {
        if (success) {
            // toast.success('Synchronisation avec le calendrier principal réussie'); // Redondant avec handleSave
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
                    <p className="font-semibold text-amber-800">Veuillez vous connecter</p>
                    <p className="text-amber-700">Vous devez être connecté pour accéder au calendrier.</p>
                </div>
            </motion.div>
        );
    }

    // Rendu principal de la page
    return (
        <motion.div
            className="max-w-screen-2xl mx-auto px-2 md:px-6 lg:px-8 py-8 w-full"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
        >
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Calendrier</h1>

            {/* Boutons d'action (Demander un congé) */}
            <div className="mb-6 flex justify-end">
                <button
                    onClick={handleRequestLeave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out shadow-sm"
                >
                    Demander un congé
                </button>
            </div>

            {/* Onglets de navigation */}
            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => handleTabChange('personal')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'personal' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Mon Calendrier
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => handleTabChange('collective')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'collective' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Calendrier Collectif
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            onClick={() => handleTabChange('allocation')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'allocation' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Allocation des Gardes
                        </button>
                    )}
                </nav>
            </div>

            {/* Contenu de l'onglet actif */}
            <motion.div initial="hidden" animate="visible" variants={tabAnimation} key={activeTab}>
                {activeTab === 'personal' && user && (
                    <PersonalCalendar userId={user.id} onEventClick={handleEventClick} />
                )}
                {activeTab === 'collective' && isAdmin && (
                    <CollectiveCalendar onEventClick={handleEventClick} />
                )}
                {activeTab === 'allocation' && isAdmin && rules && (
                    <DraggableCalendar
                        initialAssignments={assignments} // Chargées depuis l'API
                        users={users} // Données de démo pour l'instant
                        rules={rules as RulesConfiguration} // Assurer le type ici
                        onSave={handleSave} // Utilise l'API
                        onValidationError={handleValidationError}
                        onSyncComplete={handleSyncComplete}
                    />
                )}
            </motion.div>

            {/* Modal pour éditer les congés (Exemple) */}
            {isModalOpen && leaveToEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
                        <h2 className="text-xl font-semibold mb-4">Détails du Congé</h2>
                        <p><strong>Type:</strong> {leaveToEdit.leaveType}</p>
                        <p><strong>Statut:</strong> {leaveToEdit.status}</p>
                        <p><strong>Début:</strong> {leaveToEdit.startDate.toLocaleDateString()}</p>
                        <p><strong>Fin:</strong> {leaveToEdit.endDate.toLocaleDateString()}</p>
                        {leaveToEdit.comment && <p><strong>Commentaire:</strong> {leaveToEdit.comment}</p>}
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                            >
                                Fermer
                            </button>
                            {/* Ajouter des boutons pour modifier/annuler si nécessaire */}
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}