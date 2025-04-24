import React from 'react';
import { CalendarEventType } from '../types/event';

interface CalendarLegendProps {
    showEventTypes?: boolean;
    showStatuses?: boolean;
    showLocations?: boolean;
    showTeams?: boolean;
    showSpecialties?: boolean;
    selectedEventTypes?: CalendarEventType[];
}

export const CalendarLegend: React.FC<CalendarLegendProps> = ({
    showEventTypes = true,
    showStatuses = true,
    showLocations = false,
    showTeams = false,
    showSpecialties = false,
    selectedEventTypes = Object.values(CalendarEventType)
}) => {
    return (
        <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Légende</h3>

            {/* Types d'événements */}
            {showEventTypes && (
                <div className="mb-4">
                    <h4 className="text-xs font-medium text-gray-500 mb-2">Types d'événements</h4>
                    <div className="space-y-2">
                        {selectedEventTypes.includes(CalendarEventType.LEAVE) && (
                            <div className="flex items-center">
                                <div
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: '#3B82F6' }} // blue-500
                                ></div>
                                <span className="ml-2 text-sm text-gray-700">Congés</span>
                            </div>
                        )}

                        {selectedEventTypes.includes(CalendarEventType.DUTY) && (
                            <div className="flex items-center">
                                <div
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: '#10B981' }} // emerald-500
                                ></div>
                                <span className="ml-2 text-sm text-gray-700">Gardes</span>
                            </div>
                        )}

                        {selectedEventTypes.includes(CalendarEventType.ON_CALL) && (
                            <div className="flex items-center">
                                <div
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: '#6366F1' }} // indigo-500
                                ></div>
                                <span className="ml-2 text-sm text-gray-700">Astreintes</span>
                            </div>
                        )}

                        {selectedEventTypes.includes(CalendarEventType.ASSIGNMENT) && (
                            <div className="flex items-center">
                                <div
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: '#EC4899' }} // pink-500
                                ></div>
                                <span className="ml-2 text-sm text-gray-700">Affectations</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Statuts */}
            {showStatuses && (
                <div className="mb-4">
                    <h4 className="text-xs font-medium text-gray-500 mb-2">Statuts</h4>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <div className="h-4 w-1 bg-green-500 rounded"></div>
                            <div className="w-4 h-4 ml-1 border border-gray-300 rounded"></div>
                            <span className="ml-2 text-sm text-gray-700">Approuvé</span>
                        </div>

                        <div className="flex items-center">
                            <div className="h-4 w-1 bg-yellow-500 rounded"></div>
                            <div className="w-4 h-4 ml-1 border border-gray-300 rounded"></div>
                            <span className="ml-2 text-sm text-gray-700">En attente</span>
                        </div>

                        <div className="flex items-center">
                            <div className="h-4 w-1 bg-red-500 rounded"></div>
                            <div className="w-4 h-4 ml-1 border border-gray-300 rounded"></div>
                            <span className="ml-2 text-sm text-gray-700">Refusé</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Lieux */}
            {showLocations && (
                <div className="mb-4">
                    <h4 className="text-xs font-medium text-gray-500 mb-2">Lieux</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {/* Exemple de liste de lieux */}
                        {['Salle d\'opération 1', 'Salle d\'opération 2', 'Bloc A', 'Bloc B', 'Urgences'].map((location, index) => (
                            <div key={index} className="flex items-center">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: getColorForIndex(index) }}
                                ></div>
                                <span className="ml-2 text-xs text-gray-700">{location}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Équipes */}
            {showTeams && (
                <div className="mb-4">
                    <h4 className="text-xs font-medium text-gray-500 mb-2">Équipes</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {/* Exemple de liste d'équipes */}
                        {['Équipe A', 'Équipe B', 'Équipe C', 'Équipe D'].map((team, index) => (
                            <div key={index} className="flex items-center">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: getColorForIndex(index + 10) }}
                                ></div>
                                <span className="ml-2 text-xs text-gray-700">{team}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Spécialités */}
            {showSpecialties && (
                <div className="mb-4">
                    <h4 className="text-xs font-medium text-gray-500 mb-2">Spécialités</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {/* Exemple de liste de spécialités */}
                        {['Anesthésie', 'Cardiologie', 'Orthopédie', 'Neurologie', 'Pédiatrie'].map((specialty, index) => (
                            <div key={index} className="flex items-center">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: getColorForIndex(index + 20) }}
                                ></div>
                                <span className="ml-2 text-xs text-gray-700">{specialty}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="mt-4 text-xs text-gray-500 border-t border-gray-200 pt-3">
                <p className="mb-1">
                    • Cliquez sur un événement pour voir les détails
                </p>
                <p>
                    • Utilisez les filtres pour affiner l'affichage
                </p>
            </div>
        </div>
    );
};

// Fonction utilitaire pour obtenir une couleur en fonction d'un index
function getColorForIndex(index: number): string {
    const colors = [
        '#EF4444', // red-500
        '#F59E0B', // amber-500
        '#10B981', // emerald-500
        '#3B82F6', // blue-500
        '#6366F1', // indigo-500
        '#8B5CF6', // violet-500
        '#EC4899', // pink-500
        '#14B8A6', // teal-500
        '#F97316', // orange-500
        '#06B6D4', // cyan-500
        '#84CC16', // lime-500
        '#9333EA', // purple-500
        '#F43F5E', // rose-500
        '#0EA5E9', // sky-500
        '#22D3EE', // cyan-400
        '#4ADE80', // green-400
        '#A78BFA', // violet-400
        '#FB7185', // rose-400
        '#FBBF24', // amber-400
        '#2DD4BF', // teal-400
    ];

    return colors[index % colors.length];
}