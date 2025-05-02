import React, { useMemo, useState } from 'react';
import { AnyCalendarEvent, CalendarEventType } from '../types/event';
import { format, parseISO, startOfMonth, endOfMonth, differenceInMinutes, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

// Types pour les statistiques d'opération
export interface OperationStats {
    totalOperations: number;
    totalDuration: number;
    averageDuration: number;
    utilizationRate: number;
    scheduledOperations: number;
    inProgressOperations: number;
    completedOperations: number;
    cancelledOperations: number;
    normalPriorityOperations: number;
    urgentOperations: number;
    emergencyOperations: number;
    operationsByRoom: {
        [roomId: string]: {
            count: number;
            totalDuration: number;
            utilizationRate: number;
        };
    };
    operationsBySector: {
        [sectorId: string]: {
            count: number;
            totalDuration: number;
        };
    };
    operationsByAnesthesiologist: {
        [anesthesiologistId: string]: {
            count: number;
            totalDuration: number;
        };
    };
    operationsBySurgeon: {
        [surgeonId: string]: {
            count: number;
            totalDuration: number;
        };
    };
}

// Type pour les données d'une opération planifiée dans le bloc
export interface Operation extends AnyCalendarEvent {
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

// Types pour les salles et secteurs
export interface Room {
    id: string;
    name: string;
    sector: string;
    capacity: number;
}

export interface Sector {
    id: string;
    name: string;
    color: string;
    rooms: Room[];
}

export interface Staff {
    id: string;
    firstName: string;
    lastName: string;
    role: 'ANESTHESIOLOGIST' | 'SURGEON' | 'NURSE';
}

// Props du composant
interface OperationAnalyticsProps {
    operations: Operation[];
    rooms: Record<string, Room>;
    sectors: Record<string, Sector>;
    staff: Record<string, Staff>;
    period?: 'month' | 'quarter' | 'year';
}

/**
 * Composant d'analyse pour visualiser les statistiques du bloc opératoire
 */
export const OperationAnalytics: React.FC<OperationAnalyticsProps> = ({
    operations,
    rooms,
    sectors,
    staff,
    period = 'month'
}) => {
    // État pour la période en cours
    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    // Calculer les dates de début et de fin de la période
    const { startDate, endDate, periodLabel } = useMemo(() => {
        let start: Date;
        let end: Date;
        let label: string;

        switch (period) {
            case 'quarter':
                // Premier jour du trimestre
                start = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3, 1);
                // Dernier jour du trimestre
                end = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3 + 3, 0);
                label = `T${Math.floor(currentDate.getMonth() / 3) + 1} ${currentDate.getFullYear()}`;
                break;
            case 'year':
                start = new Date(currentDate.getFullYear(), 0, 1);
                end = new Date(currentDate.getFullYear(), 11, 31);
                label = `${currentDate.getFullYear()}`;
                break;
            case 'month':
            default:
                start = startOfMonth(currentDate);
                end = endOfMonth(currentDate);
                label = format(currentDate, 'MMMM yyyy', { locale: fr });
                break;
        }

        return {
            startDate: start,
            endDate: end,
            periodLabel: label
        };
    }, [currentDate, period]);

    // Filtrer les opérations pour la période sélectionnée
    const filteredOperations = useMemo(() => {
        return operations.filter(op => {
            const opDate = new Date(op.start);
            return opDate >= startDate && opDate <= endDate;
        });
    }, [operations, startDate, endDate]);

    // Calculer les statistiques des opérations
    const stats: OperationStats = useMemo(() => {
        // Initialiser les compteurs
        const operationsByRoom: Record<string, { count: number; totalDuration: number; utilizationRate: number }> = {};
        const operationsBySector: Record<string, { count: number; totalDuration: number }> = {};
        const operationsByAnesthesiologist: Record<string, { count: number; totalDuration: number }> = {};
        const operationsBySurgeon: Record<string, { count: number; totalDuration: number }> = {};

        let totalDuration = 0;
        let scheduledCount = 0;
        let inProgressCount = 0;
        let completedCount = 0;
        let cancelledCount = 0;
        let normalPriorityCount = 0;
        let urgentCount = 0;
        let emergencyCount = 0;

        // Initialiser les compteurs par salle
        Object.keys(rooms).forEach(roomId => {
            operationsByRoom[roomId] = { count: 0, totalDuration: 0, utilizationRate: 0 };
        });

        // Initialiser les compteurs par secteur
        Object.keys(sectors).forEach(sectorId => {
            operationsBySector[sectorId] = { count: 0, totalDuration: 0 };
        });

        // Calculer la durée totale en minutes de la période
        const periodDurationMinutes = differenceInMinutes(endDate, startDate);

        // Agréger les données
        filteredOperations.forEach(op => {
            // Calculer la durée effective
            const duration = op.duration || 60;
            totalDuration += duration;

            // Statistiques par statut
            switch (op.status) {
                case 'SCHEDULED':
                    scheduledCount++;
                    break;
                case 'IN_PROGRESS':
                    inProgressCount++;
                    break;
                case 'COMPLETED':
                    completedCount++;
                    break;
                case 'CANCELLED':
                    cancelledCount++;
                    break;
            }

            // Statistiques par priorité
            switch (op.priority) {
                case 'NORMAL':
                    normalPriorityCount++;
                    break;
                case 'URGENT':
                    urgentCount++;
                    break;
                case 'EMERGENCY':
                    emergencyCount++;
                    break;
            }

            // Statistiques par salle
            if (op.room && operationsByRoom[op.room]) {
                operationsByRoom[op.room].count++;
                operationsByRoom[op.room].totalDuration += duration;
            }

            // Statistiques par secteur
            if (op.sector && operationsBySector[op.sector]) {
                operationsBySector[op.sector].count++;
                operationsBySector[op.sector].totalDuration += duration;
            }

            // Statistiques par anesthésiste
            op.staff.anesthesiologists.forEach(id => {
                if (!operationsByAnesthesiologist[id]) {
                    operationsByAnesthesiologist[id] = { count: 0, totalDuration: 0 };
                }
                operationsByAnesthesiologist[id].count++;
                operationsByAnesthesiologist[id].totalDuration += duration;
            });

            // Statistiques par chirurgien
            op.staff.surgeons.forEach(id => {
                if (!operationsBySurgeon[id]) {
                    operationsBySurgeon[id] = { count: 0, totalDuration: 0 };
                }
                operationsBySurgeon[id].count++;
                operationsBySurgeon[id].totalDuration += duration;
            });
        });

        // Calculer les taux d'utilisation par salle (durée des opérations / temps total disponible)
        Object.keys(operationsByRoom).forEach(roomId => {
            // Supposer des horaires de bloc de 8h à 18h (10h par jour, 5 jours par semaine)
            // Calculer le nombre de jours de travail dans la période
            // Ici, on simplifie en considérant tous les jours comme des jours de travail
            const workDays = Math.max(1, Math.round(periodDurationMinutes / (60 * 24)));
            const availableMinutesPerRoom = workDays * 10 * 60; // 10 heures par jour en minutes

            operationsByRoom[roomId].utilizationRate = Math.min(
                100,
                (operationsByRoom[roomId].totalDuration / availableMinutesPerRoom) * 100
            );
        });

        return {
            totalOperations: filteredOperations.length,
            totalDuration,
            averageDuration: filteredOperations.length ? totalDuration / filteredOperations.length : 0,
            utilizationRate: Object.values(operationsByRoom).reduce((acc, { utilizationRate }) => acc + utilizationRate, 0) /
                Math.max(1, Object.keys(operationsByRoom).length),
            scheduledOperations: scheduledCount,
            inProgressOperations: inProgressCount,
            completedOperations: completedCount,
            cancelledOperations: cancelledCount,
            normalPriorityOperations: normalPriorityCount,
            urgentOperations: urgentCount,
            emergencyOperations: emergencyCount,
            operationsByRoom,
            operationsBySector,
            operationsByAnesthesiologist,
            operationsBySurgeon
        };
    }, [filteredOperations, rooms, sectors, startDate, endDate]);

    // Fonction pour aller à la période suivante
    const goToNextPeriod = () => {
        switch (period) {
            case 'quarter':
                setCurrentDate(addMonths(currentDate, 3));
                break;
            case 'year':
                setCurrentDate(new Date(currentDate.getFullYear() + 1, 0, 1));
                break;
            case 'month':
            default:
                setCurrentDate(addMonths(currentDate, 1));
                break;
        }
    };

    // Fonction pour aller à la période précédente
    const goToPreviousPeriod = () => {
        switch (period) {
            case 'quarter':
                setCurrentDate(subMonths(currentDate, 3));
                break;
            case 'year':
                setCurrentDate(new Date(currentDate.getFullYear() - 1, 0, 1));
                break;
            case 'month':
            default:
                setCurrentDate(subMonths(currentDate, 1));
                break;
        }
    };

    // Fonctions d'affichage utilitaires
    const formatMinutes = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h${remainingMinutes.toString().padStart(2, '0')}`;
    };

    const formatPercentage = (value: number) => {
        return `${value.toFixed(1)}%`;
    };

    return (
        <div className="operation-analytics">
            {/* En-tête avec navigation entre périodes */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Statistiques du bloc opératoire</h2>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={goToPreviousPeriod}
                        className="p-2 rounded-full hover:bg-gray-100"
                        title="Période précédente"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <div className="text-lg font-medium">{periodLabel}</div>
                    <button
                        onClick={goToNextPeriod}
                        className="p-2 rounded-full hover:bg-gray-100"
                        title="Période suivante"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${period === 'month' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}
                        onClick={() => period !== 'month' && setCurrentDate(new Date())}
                    >
                        Mois
                    </button>
                    <button
                        className={`px-3 py-1 rounded-md text-sm font-medium ${period === 'quarter' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}
                        onClick={() => period !== 'quarter' && setCurrentDate(new Date())}
                    >
                        Trimestre
                    </button>
                    <button
                        className={`px-3 py-1 rounded-md text-sm font-medium ${period === 'year' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}
                        onClick={() => period !== 'year' && setCurrentDate(new Date())}
                    >
                        Année
                    </button>
                </div>
            </div>

            {/* Indicateurs principaux */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-sm font-medium text-gray-500">Total des opérations</div>
                    <div className="mt-1 text-3xl font-semibold">{stats.totalOperations}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-sm font-medium text-gray-500">Durée moyenne</div>
                    <div className="mt-1 text-3xl font-semibold">{formatMinutes(stats.averageDuration)}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-sm font-medium text-gray-500">Durée totale</div>
                    <div className="mt-1 text-3xl font-semibold">{formatMinutes(stats.totalDuration)}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-sm font-medium text-gray-500">Taux d'utilisation moyen</div>
                    <div className="mt-1 text-3xl font-semibold">{formatPercentage(stats.utilizationRate)}</div>
                </div>
            </div>

            {/* Répartition par statut */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Répartition par statut</h3>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                            <div className="flex-1">Planifiées</div>
                            <div className="font-medium">{stats.scheduledOperations}</div>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                            <div className="flex-1">En cours</div>
                            <div className="font-medium">{stats.inProgressOperations}</div>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                            <div className="flex-1">Terminées</div>
                            <div className="font-medium">{stats.completedOperations}</div>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                            <div className="flex-1">Annulées</div>
                            <div className="font-medium">{stats.cancelledOperations}</div>
                        </div>
                    </div>
                </div>

                {/* Répartition par priorité */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Répartition par priorité</h3>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                            <div className="flex-1">Normale</div>
                            <div className="font-medium">{stats.normalPriorityOperations}</div>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                            <div className="flex-1">Urgente</div>
                            <div className="font-medium">{stats.urgentOperations}</div>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                            <div className="flex-1">Urgence vitale</div>
                            <div className="font-medium">{stats.emergencyOperations}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Utilisation des salles */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h3 className="text-lg font-medium mb-4">Utilisation des salles</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salle</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Secteur</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nb. opérations</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durée totale</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taux d'utilisation</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(stats.operationsByRoom).map(([roomId, roomStats]) => {
                                const room = rooms[roomId];
                                const sector = room ? sectors[room.sector] : undefined;

                                return (
                                    <tr key={roomId}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {room ? room.name : roomId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {sector ? sector.name : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {roomStats.count}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatMinutes(roomStats.totalDuration)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div
                                                        className={`h-2.5 rounded-full ${roomStats.utilizationRate > 80 ? 'bg-red-600' :
                                                                roomStats.utilizationRate > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                                            }`}
                                                        style={{ width: `${Math.min(100, roomStats.utilizationRate)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="ml-2 text-sm font-medium">
                                                    {formatPercentage(roomStats.utilizationRate)}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Répartition par personnel */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
                {/* Anesthésistes */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Anesthésistes les plus actifs</h3>
                    <div className="space-y-2">
                        {Object.entries(stats.operationsByAnesthesiologist)
                            .sort((a, b) => b[1].count - a[1].count)
                            .slice(0, 5)
                            .map(([anesthesiologistId, anesthesiologistStats]) => {
                                const anesthesiologist = staff[anesthesiologistId];

                                return (
                                    <div key={anesthesiologistId} className="flex items-center">
                                        <div className="flex-1">
                                            {anesthesiologist
                                                ? `${anesthesiologist.lastName} ${anesthesiologist.firstName}`
                                                : anesthesiologistId}
                                        </div>
                                        <div className="font-medium">
                                            {anesthesiologistStats.count} op. ({formatMinutes(anesthesiologistStats.totalDuration)})
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>

                {/* Chirurgiens */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Chirurgiens les plus actifs</h3>
                    <div className="space-y-2">
                        {Object.entries(stats.operationsBySurgeon)
                            .sort((a, b) => b[1].count - a[1].count)
                            .slice(0, 5)
                            .map(([surgeonId, surgeonStats]) => {
                                const surgeon = staff[surgeonId];

                                return (
                                    <div key={surgeonId} className="flex items-center">
                                        <div className="flex-1">
                                            {surgeon
                                                ? `${surgeon.lastName} ${surgeon.firstName}`
                                                : surgeonId}
                                        </div>
                                        <div className="font-medium">
                                            {surgeonStats.count} op. ({formatMinutes(surgeonStats.totalDuration)})
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>

            {/* Avertissement si peu d'opérations */}
            {stats.totalOperations < 5 && (
                <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm">
                                Peu d'opérations sur cette période ({stats.totalOperations}).
                                Les statistiques peuvent ne pas être représentatives.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OperationAnalytics; 