import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useCalendarContext, useCalendarEvents, useCalendarNavigation } from '../context/CalendarContext';
import { CalendarViewType, AnyCalendarEvent, CalendarEventType } from '../types/event';
import { format, addDays, startOfWeek, parseISO, isSameDay, subDays } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { SkeletonOperationRoomSchedule, Spinner, Tooltip, TooltipIcon, useToast } from './feedback';
import { motion, AnimatePresence } from 'framer-motion';

// Types pour la planification du bloc opératoire
interface Room {
    id: string;
    name: string;
    sector: string;
    capacity: number;
    equipment: string[];
    isAvailable: boolean;
}

interface Sector {
    id: string;
    name: string;
    color: string;
    rooms: Room[];
}

interface Operation extends AnyCalendarEvent {
    type: CalendarEventType.OPERATION;
    room: string;
    sector: string;
    duration: number; // en minutes
    patient?: {
        id: string;
        name: string;
    };
    staff: {
        anesthesiologists: string[];
        surgeons: string[];
        nurses: string[];
    };
    priority: 'NORMAL' | 'URGENT' | 'EMERGENCY';
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    requiredEquipment?: string[];
}

interface OperationRoomScheduleProps {
    sectors?: Sector[];
    onOperationClick?: (operation: Operation) => void;
    onTimeSlotClick?: (roomId: string, start: Date, end: Date) => void;
    isReadOnly?: boolean;
    defaultDate?: Date;
}

/**
 * Composant pour visualiser et planifier les opérations dans les différentes salles du bloc opératoire
 */
export const OperationRoomSchedule: React.FC<OperationRoomScheduleProps> = ({
    sectors: propSectors,
    onOperationClick,
    onTimeSlotClick,
    isReadOnly = false,
    defaultDate = new Date()
}) => {
    // Utiliser le contexte du calendrier
    const { state } = useCalendarContext();
    const { events, loading, error } = useCalendarEvents();
    const { currentDate, goToDate, goToPrevious, goToNext } = useCalendarNavigation();
    const { showSuccess, showError, ToastContainer } = useToast();

    // État local pour les secteurs et salles
    const [sectors, setSectors] = useState<Sector[]>(propSectors || []);
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
    const [hoveredTimeSlot, setHoveredTimeSlot] = useState<{ roomId: string; hour: number } | null>(null);
    const [isLoadingSectors, setIsLoadingSectors] = useState<boolean>(!propSectors);
    const [dateTransition, setDateTransition] = useState<'next' | 'prev' | 'none'>('none');
    const [direction, setDirection] = useState<number>(0); // Pour l'animation

    // Charger les secteurs et salles depuis le serveur si non fournis par les props
    useEffect(() => {
        if (propSectors) {
            setSectors(propSectors);
            return;
        }

        // Fonction de récupération des données (à remplacer par un appel API réel)
        const fetchSectorsAndRooms = async () => {
            setIsLoadingSectors(true);
            try {
                // Simuler un délai réseau
                await new Promise(resolve => setTimeout(resolve, 800));

                // Simulation de données pour le moment
                const mockSectors: Sector[] = [
                    {
                        id: 'sector1',
                        name: 'Bloc A - Orthopédie',
                        color: '#4F46E5',
                        rooms: [
                            {
                                id: 'room1',
                                name: 'Salle 101',
                                sector: 'sector1',
                                capacity: 6,
                                equipment: ['Arthroscope', 'Table orthopédique', 'C-Arm'],
                                isAvailable: true
                            },
                            {
                                id: 'room2',
                                name: 'Salle 102',
                                sector: 'sector1',
                                capacity: 8,
                                equipment: ['Table orthopédique', 'C-Arm', 'Navigation'],
                                isAvailable: true
                            }
                        ]
                    },
                    {
                        id: 'sector2',
                        name: 'Bloc B - Chirurgie générale',
                        color: '#10B981',
                        rooms: [
                            {
                                id: 'room3',
                                name: 'Salle 201',
                                sector: 'sector2',
                                capacity: 5,
                                equipment: ['Laparoscope', 'Robot chirurgical'],
                                isAvailable: true
                            },
                            {
                                id: 'room4',
                                name: 'Salle 202',
                                sector: 'sector2',
                                capacity: 4,
                                equipment: ['Laparoscope', 'Électrocautère avancé'],
                                isAvailable: true
                            }
                        ]
                    }
                ];

                setSectors(mockSectors);
                showSuccess('Secteurs et salles chargés avec succès');
            } catch (error) {
                console.error('Erreur lors du chargement des secteurs et salles:', error);
                showError('Erreur lors du chargement des secteurs et salles');
            } finally {
                setIsLoadingSectors(false);
            }
        };

        fetchSectorsAndRooms();
    }, [propSectors, showSuccess, showError]);

    // Extraire les opérations des événements
    const operations = useMemo(() => {
        return events.filter(
            (event): event is Operation =>
                event.type === CalendarEventType.OPERATION
        );
    }, [events]);

    // Organiser les opérations par salle
    const operationsByRoom = useMemo(() => {
        const result: Record<string, Operation[]> = {};
        operations.forEach(operation => {
            const { room } = operation;
            if (!result[room]) {
                result[room] = [];
            }
            result[room].push(operation);
        });
        return result;
    }, [operations]);

    // Fonction pour formater les dates
    const formatDate = useCallback((date: Date | string) => {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        return format(dateObj, 'EEEE d MMMM', { locale: fr });
    }, []);

    // Générer les heures pour la vue horaire
    const hours = useMemo(() => {
        return Array.from({ length: 24 }, (_, i) => i);
    }, []);

    // Vérifier si un créneau horaire est disponible
    const isTimeSlotAvailable = useCallback(
        (roomId: string, hour: number) => {
            const roomOperations = operationsByRoom[roomId] || [];
            const startHour = new Date(currentDate);
            startHour.setHours(hour, 0, 0, 0);
            const endHour = new Date(currentDate);
            endHour.setHours(hour + 1, 0, 0, 0);

            return !roomOperations.some(operation => {
                const opStart = new Date(operation.start);
                const opEnd = new Date(operation.end);
                return (
                    (opStart < endHour && opEnd > startHour) || // Chevauchement
                    (opStart.getHours() === hour) // Commence à cette heure
                );
            });
        },
        [currentDate, operationsByRoom]
    );

    // Obtenir l'opération pour un créneau horaire donné
    const getOperationForTimeSlot = useCallback(
        (roomId: string, hour: number): Operation | null => {
            const roomOperations = operationsByRoom[roomId] || [];
            const startHour = new Date(currentDate);
            startHour.setHours(hour, 0, 0, 0);
            const endHour = new Date(currentDate);
            endHour.setHours(hour + 1, 0, 0, 0);

            return (
                roomOperations.find(operation => {
                    const opStart = new Date(operation.start);
                    const opEnd = new Date(operation.end);
                    return (
                        (opStart < endHour && opEnd > startHour) || // Chevauchement
                        (opStart.getHours() === hour) // Commence à cette heure
                    );
                }) || null
            );
        },
        [currentDate, operationsByRoom]
    );

    // Gérer le clic sur un créneau horaire
    const handleTimeSlotClick = useCallback(
        (roomId: string, hour: number) => {
            if (isReadOnly) return;

            const operation = getOperationForTimeSlot(roomId, hour);

            if (operation) {
                // Si une opération existe, appeler le gestionnaire de clic d'opération
                onOperationClick && onOperationClick(operation);
            } else {
                // Sinon, appeler le gestionnaire de clic de créneau horaire
                const startHour = new Date(currentDate);
                startHour.setHours(hour, 0, 0, 0);
                const endHour = new Date(currentDate);
                endHour.setHours(hour + 1, 0, 0, 0);

                onTimeSlotClick && onTimeSlotClick(roomId, startHour, endHour);
            }
        },
        [currentDate, getOperationForTimeSlot, isReadOnly, onOperationClick, onTimeSlotClick]
    );

    // Gérer le survol d'un créneau horaire
    const handleTimeSlotHover = useCallback(
        (roomId: string, hour: number) => {
            setHoveredTimeSlot({ roomId, hour });
        },
        []
    );

    // Terminer le survol
    const handleTimeSlotLeave = useCallback(() => {
        setHoveredTimeSlot(null);
    }, []);

    // Déterminer la couleur du créneau horaire
    const getTimeSlotColor = useCallback(
        (roomId: string, hour: number) => {
            const operation = getOperationForTimeSlot(roomId, hour);

            if (!operation) {
                // Créneau disponible
                return isTimeSlotAvailable(roomId, hour) ? 'bg-gray-100 hover:bg-gray-200' : 'bg-red-100 hover:bg-red-200';
            }

            // Si c'est une opération, utiliser la couleur selon la priorité
            switch (operation.priority) {
                case 'URGENT':
                    return 'bg-orange-200 hover:bg-orange-300';
                case 'EMERGENCY':
                    return 'bg-red-200 hover:bg-red-300';
                default:
                    // Trouver la couleur du secteur
                    const sector = sectors.find(s => s.id === operation.sector);
                    return sector ? `bg-opacity-70 hover:bg-opacity-90` : 'bg-blue-200 hover:bg-blue-300';
            }
        },
        [getOperationForTimeSlot, isTimeSlotAvailable, sectors]
    );

    // Style pour le créneau horaire avec la couleur du secteur
    const getTimeSlotStyle = useCallback(
        (roomId: string, hour: number) => {
            const operation = getOperationForTimeSlot(roomId, hour);

            if (!operation) {
                return {};
            }

            // Trouver la couleur du secteur
            const sector = sectors.find(s => s.id === operation.sector);
            return sector ? { backgroundColor: sector.color, opacity: 0.7 } : {};
        },
        [getOperationForTimeSlot, sectors]
    );

    // Rendu des informations de l'opération pour un tooltip
    const renderOperationInfo = useCallback(
        (operation: Operation) => {
            return (
                <div className="p-2 text-sm">
                    <div className="font-bold">{operation.title}</div>
                    <div>Durée: {operation.duration} min</div>
                    {operation.patient && <div>Patient: {operation.patient.name}</div>}
                    <div>
                        Anesthésistes: {operation.staff.anesthesiologists.join(', ')}
                    </div>
                    <div>Chirurgiens: {operation.staff.surgeons.join(', ')}</div>
                    <div>
                        Statut: <span className="font-medium">{operation.status}</span>
                    </div>
                </div>
            );
        },
        []
    );

    // Gérer la navigation entre les dates avec animation
    const handlePrevious = useCallback(() => {
        setDirection(-1);
        setDateTransition('prev');
        setTimeout(() => {
            goToPrevious();
            setDateTransition('none');
        }, 300);
    }, [goToPrevious]);

    const handleNext = useCallback(() => {
        setDirection(1);
        setDateTransition('next');
        setTimeout(() => {
            goToNext();
            setDateTransition('none');
        }, 300);
    }, [goToNext]);

    const handleToday = useCallback(() => {
        const today = new Date();
        if (!isSameDay(today, currentDate)) {
            setDateTransition(today > currentDate ? 'next' : 'prev');
            setTimeout(() => {
                goToDate(today);
                setDateTransition('none');
            }, 300);
        }
    }, [currentDate, goToDate]);

    // Animation variants pour framer-motion
    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            x: direction > 0 ? '-100%' : '100%',
            opacity: 0
        })
    };

    // Si nous chargeons les données, afficher un loading state
    if (loading || isLoadingSectors) {
        return <SkeletonOperationRoomSchedule />;
    }

    // Si erreur, afficher un message d'erreur
    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded shadow">
                <div className="flex">
                    <div className="flex-shrink-0 text-red-500">
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-red-700">Erreur : {error.message}</p>
                        <p className="text-sm text-red-600 mt-1">Veuillez réessayer ultérieurement ou contacter le support.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Notifications */}
            <ToastContainer />

            {/* Header avec navigation */}
            <div className="p-4 border-b flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-semibold">Planning du bloc opératoire</h2>
                    <TooltipIcon
                        content="Vue du planning des salles d'opération par jour"
                        className="text-gray-500"
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={handlePrevious}
                        className="p-2 rounded-full hover:bg-gray-100"
                        aria-label="Jour précédent"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <h3 className="text-lg font-medium px-4">
                        {format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
                    </h3>

                    <button
                        onClick={handleNext}
                        className="p-2 rounded-full hover:bg-gray-100"
                        aria-label="Jour suivant"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Indicateur de chargement */}
            {loading && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                    <Spinner size="lg" label="Chargement du planning..." />
                </div>
            )}

            {/* Message d'erreur */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md m-4">
                    <p className="text-red-600">{error}</p>
                    <button
                        className="mt-2 text-red-700 underline"
                        onClick={() => {
                            // Réessayer le chargement
                            setDateTransition('none');
                            setIsLoadingSectors(true);
                        }}
                    >
                        Réessayer
                    </button>
                </div>
            )}

            {/* Contenu principal avec animation */}
            <div className="overflow-hidden relative" style={{ minHeight: '600px' }}>
                <AnimatePresence initial={false} mode="wait" custom={direction}>
                    <motion.div
                        key={currentDate.toISOString()}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'tween', duration: 0.3 }}
                        className="w-full"
                    >
                        <div className="grid grid-cols-[150px_1fr] gap-0">
                            {/* En-tête des heures */}
                            <div className="col-span-1 bg-gray-50"></div>
                            <div className="grid grid-cols-11 bg-gray-50">
                                {hours.map(hour => (
                                    <div
                                        key={hour}
                                        className="py-2 px-1 text-center text-sm text-gray-500 font-medium border-l"
                                    >
                                        {hour}:00
                                    </div>
                                ))}
                            </div>

                            {/* Contenu par secteur et salle */}
                            {sectors.map(sector => (
                                <React.Fragment key={sector.id}>
                                    {/* En-tête du secteur */}
                                    <div className="col-span-2 bg-gray-100 py-2 px-4 font-semibold">
                                        {sector.name}
                                    </div>

                                    {/* Salles du secteur */}
                                    {sector.rooms.map(room => (
                                        <React.Fragment key={room.id}>
                                            {/* Nom de la salle */}
                                            <div className="py-2 px-4 border-t">
                                                {room.name}
                                            </div>

                                            {/* Grille des créneaux horaires */}
                                            <div className="grid grid-cols-11 border-t">
                                                {hours.map(hour => {
                                                    // Filtrer les opérations pour cette salle et ce créneau
                                                    const slotOperations = operations.filter(op => {
                                                        return op.room === room.id &&
                                                            op.start.getHours() <= hour &&
                                                            op.end.getHours() > hour;
                                                    });

                                                    return (
                                                        <div
                                                            key={`${room.id}-${hour}`}
                                                            className="py-2 px-1 border-l h-16 relative"
                                                            onClick={() => handleTimeSlotClick(room.id, hour)}
                                                        >
                                                            {slotOperations.map(operation => (
                                                                <Tooltip
                                                                    key={operation.id}
                                                                    position="top"
                                                                    content={
                                                                        <div>
                                                                            <p className="font-medium">{operation.title}</p>
                                                                            <p>Patient: {operation.patient?.name}</p>
                                                                            <p>Horaire: {format(operation.start, 'HH:mm')} - {format(operation.end, 'HH:mm')}</p>
                                                                        </div>
                                                                    }
                                                                >
                                                                    <motion.div
                                                                        initial={{ scale: 0.95, opacity: 0 }}
                                                                        animate={{ scale: 1, opacity: 1 }}
                                                                        className={`cursor-pointer px-2 py-1 text-xs rounded border ${getTimeSlotColor(room.id, hour)} text-white absolute inset-1`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onOperationClick && onOperationClick(operation);
                                                                        }}
                                                                    >
                                                                        <div className="font-medium truncate">{operation.title}</div>
                                                                        <div className="truncate">{operation.patient?.name}</div>
                                                                    </motion.div>
                                                                </Tooltip>
                                                            ))}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </React.Fragment>
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Légende des couleurs */}
            <div className="p-4 border-t">
                <p className="text-sm font-medium mb-2">Priorités :</p>
                <div className="flex space-x-4">
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-red-600 mr-1"></div>
                        <span className="text-xs">Urgente</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-orange-500 mr-1"></div>
                        <span className="text-xs">Haute</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-yellow-400 mr-1"></div>
                        <span className="text-xs">Moyenne</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-green-400 mr-1"></div>
                        <span className="text-xs">Basse</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OperationRoomSchedule; 