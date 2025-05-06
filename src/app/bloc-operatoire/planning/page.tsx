'use client';

import { DatePicker } from '@/components/ui';
import BlocPlanningCalendar from '@/modules/planning/bloc-operatoire/components/BlocPlanningCalendar';
import { BlocPeriod, BlocPlanningStatus } from '@/modules/planning/bloc-operatoire/models/BlocModels';
import { useState } from 'react';

// Cette page sera rendue côté client
export default function BlocPlanningPage() {
    // Utilisation de use client après export default
    'use client';

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedPeriod, setSelectedPeriod] = useState<BlocPeriod>(BlocPeriod.MORNING);

    const handleDateChange = (date: Date | undefined) => {
        if (date) {
            setSelectedDate(date);
        }
    };

    const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedPeriod(event.target.value as BlocPeriod);
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Planning du bloc opératoire</h1>
                <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <span>Date:</span>
                        <DatePicker date={selectedDate} onDateChange={handleDateChange} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <span>Période:</span>
                        <select
                            value={selectedPeriod}
                            onChange={handlePeriodChange}
                            className="border rounded p-2"
                        >
                            <option value={BlocPeriod.MORNING}>Matin</option>
                            <option value={BlocPeriod.AFTERNOON}>Après-midi</option>
                            <option value={BlocPeriod.EVENING}>Soir</option>
                            <option value={BlocPeriod.NIGHT}>Nuit</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">
                            Planning du {selectedDate.toLocaleDateString('fr-FR')} - {
                                selectedPeriod === BlocPeriod.MORNING ? 'Matin' :
                                    selectedPeriod === BlocPeriod.AFTERNOON ? 'Après-midi' :
                                        selectedPeriod === BlocPeriod.EVENING ? 'Soir' : 'Nuit'
                            }
                        </h2>
                        <div className="flex gap-2">
                            <button className="bg-blue-500 text-white px-4 py-2 rounded">
                                Valider
                            </button>
                            <button className="border border-gray-300 px-4 py-2 rounded">
                                Sauvegarder
                            </button>
                        </div>
                    </div>

                    <div className="mb-4 flex items-center gap-2">
                        <span className="font-semibold">Statut:</span>
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            {BlocPlanningStatus.DRAFT}
                        </span>
                    </div>

                    <BlocPlanningCalendar
                        date={selectedDate}
                        period={selectedPeriod}
                    />
                </div>
            </div>
        </div>
    );
} 