'use client';

import React, { useState } from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BlocDayPlanningView from '../components/BlocDayPlanningView';

// Enum pour les périodes (matin, après-midi, etc.)
enum Period {
    MATIN = 'MATIN',
    APRES_MIDI = 'APRES_MIDI',
    JOURNEE_ENTIERE = 'JOURNEE_ENTIERE'
}

export default function BlocPlanningPage() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedSiteId, setSelectedSiteId] = useState<string>('1'); // ID du site par défaut

    const handleDateChange = (date: Date | undefined) => {
        if (date) {
            setSelectedDate(date);
        }
    };

    const handleSiteChange = (value: string) => {
        setSelectedSiteId(value);
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
                        <span>Site:</span>
                        <Select value={selectedSiteId} onValueChange={handleSiteChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Sélectionner un site" />
                            </SelectTrigger>
                            <SelectContent>
                                {/* Ces valeurs devraient être chargées dynamiquement */}
                                <SelectItem value="1">Hôpital Principal</SelectItem>
                                <SelectItem value="2">Clinique Sud</SelectItem>
                                <SelectItem value="3">Centre Médical Est</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Card className="bg-white rounded-lg shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl">Planning du bloc opératoire</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <BlocDayPlanningView
                            date={selectedDate}
                            siteId={selectedSiteId}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 