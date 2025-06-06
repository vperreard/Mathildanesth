import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Absence, AbsenceType, AbsenceStatus, AbsenceCreateInput } from '@/types/absence';
import { absenceService } from '@/services/absenceService';
import { toast } from 'react-hot-toast';
import { AbsenceForm } from './AbsenceForm';
import { DateSelectArg } from '@fullcalendar/core';

export const AbsenceManager: React.FC = () => {
    const [absences, setAbsences] = useState<Absence[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [filterType, setFilterType] = useState<AbsenceType | 'ALL'>('ALL');
    const [filterStatus, setFilterStatus] = useState<AbsenceStatus | 'ALL'>('ALL');
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        fetchAbsences();
    }, []);

    const fetchAbsences = async () => {
        try {
            const data = await absenceService.getAllAbsences();
            setAbsences(data);
        } catch (error: unknown) {
            toast.error('Impossible de charger les absences');
        }
    };

    const handleCreateAbsence = async (data: AbsenceCreateInput) => {
        try {
            await absenceService.createAbsence(data);
            toast.success('Absence créée avec succès');
            setIsFormOpen(false);
            fetchAbsences();
        } catch (error: unknown) {
            toast.error('Erreur lors de la création de l\'absence');
        }
    };

    const filteredAbsences = absences.filter(absence => {
        if (filterType !== 'ALL' && absence.type !== filterType) return false;
        if (filterStatus !== 'ALL' && absence.status !== filterStatus) return false;
        return true;
    });

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Gestion des Absences</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <FullCalendar
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        selectable={true}
                        selectMirror={true}
                        dayMaxEvents={true}
                        weekends={true}
                        events={filteredAbsences.map(absence => ({
                            id: absence.id.toString(),
                            title: absence.type,
                            start: absence.startDate,
                            end: absence.endDate,
                            backgroundColor:
                                absence.status === 'APPROVED' ? '#10B981' :
                                    absence.status === 'REJECTED' ? '#EF4444' :
                                        '#F59E0B'
                        }))}
                        select={(info: DateSelectArg) => {
                            setSelectedDate(info.start);
                            setIsFormOpen(true);
                        }}
                    />
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Type d'absence</label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as AbsenceType | 'ALL')}
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="ALL">Tous les types</option>
                            <option value="VACATION">Vacances</option>
                            <option value="SICK">Maladie</option>
                            <option value="PERSONAL">Personnel</option>
                            <option value="OTHER">Autre</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Statut</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as AbsenceStatus | 'ALL')}
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="ALL">Tous les statuts</option>
                            <option value="PENDING">En attente</option>
                            <option value="APPROVED">Approuvé</option>
                            <option value="REJECTED">Rejeté</option>
                        </select>
                    </div>

                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Nouvelle absence
                    </button>
                </div>
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">Nouvelle absence</h2>
                        <AbsenceForm
                            onSubmit={handleCreateAbsence}
                            onCancel={() => setIsFormOpen(false)}
                        />
                    </div>
                </div>
            )}

            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Liste des absences</h2>
                <div className="space-y-4">
                    {filteredAbsences.map((absence) => (
                        <div key={absence.id} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{absence.type}</p>
                                    <p className="text-sm text-gray-500">
                                        {new Date(absence.startDate).toLocaleDateString()} - {new Date(absence.endDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 rounded text-sm ${absence.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                    absence.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {absence.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}; 