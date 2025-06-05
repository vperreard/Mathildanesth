import React, { memo, useState, useCallback } from 'react';
import { CalendarSettings as CalendarSettingsType, UserCalendarSettings } from '../types/event';

interface CalendarSettingsProps {
    settings: CalendarSettingsType;
    userSettings?: UserCalendarSettings;
    onSettingsChange: (settings: Partial<CalendarSettingsType>) => void;
    onUserSettingsChange: (settings: Partial<UserCalendarSettings>) => void;
}

// Utilisation de React.memo pour éviter les re-rendus inutiles
export const CalendarSettings = memo(({
    settings,
    userSettings,
    onSettingsChange,
    onUserSettingsChange
}: CalendarSettingsProps) => {

    // États locaux pour éviter des mises à jour trop fréquentes
    const [showWeekends, setShowWeekends] = useState(userSettings?.showWeekends || true);
    const [startWeekOn, setStartWeekOn] = useState(userSettings?.startWeekOn || 'monday');
    const [timeFormat, setTimeFormat] = useState(userSettings?.timeFormat || '24h');

    // Handler optimisé avec debounce intégré pour les changements de paramètres
    const handleUserSettingChange = useCallback((key: keyof UserCalendarSettings, value: unknown) => {
        // Mise à jour de l'état local immédiatement
        switch (key) {
            case 'showWeekends':
                setShowWeekends(value);
                break;
            case 'startWeekOn':
                setStartWeekOn(value);
                break;
            case 'timeFormat':
                setTimeFormat(value);
                break;
        }

        // Utilisation d'un timer pour éviter des mises à jour trop fréquentes
        // qui pourraient causer des rechargements complets
        const timerId = setTimeout(() => {
            onUserSettingsChange({ [key]: value });
        }, 500); // Délai de 500ms

        return () => clearTimeout(timerId);
    }, [onUserSettingsChange]);

    return (
        <div className="calendar-settings p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Paramètres d&#39;affichage</h3>

            <div className="space-y-4">
                {/* Jour de début de semaine */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Début de la semaine
                    </label>
                    <div className="flex items-center space-x-4">
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                name="startWeekOn"
                                value="monday"
                                checked={startWeekOn === 'monday'}
                                onChange={() => handleUserSettingChange('startWeekOn', 'monday')}
                                className="form-radio h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2 text-sm text-gray-700">Lundi</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                name="startWeekOn"
                                value="sunday"
                                checked={startWeekOn === 'sunday'}
                                onChange={() => handleUserSettingChange('startWeekOn', 'sunday')}
                                className="form-radio h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2 text-sm text-gray-700">Dimanche</span>
                        </label>
                    </div>
                </div>

                {/* Format d'heure */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Format d'heure
                    </label>
                    <div className="flex items-center space-x-4">
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                name="timeFormat"
                                value="12h"
                                checked={timeFormat === '12h'}
                                onChange={() => handleUserSettingChange('timeFormat', '12h')}
                                className="form-radio h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2 text-sm text-gray-700">12h (AM/PM)</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                name="timeFormat"
                                value="24h"
                                checked={timeFormat === '24h'}
                                onChange={() => handleUserSettingChange('timeFormat', '24h')}
                                className="form-radio h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2 text-sm text-gray-700">24h</span>
                        </label>
                    </div>
                </div>

                {/* Affichage des weekends */}
                <div>
                    <label className="inline-flex items-center">
                        <input
                            type="checkbox"
                            checked={showWeekends}
                            onChange={(e) => handleUserSettingChange('showWeekends', e.target.checked)}
                            className="form-checkbox h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">Afficher les weekends</span>
                    </label>
                </div>

                <label htmlFor="calendar-name" className="block text-sm font-medium text-gray-700">
                    Nom du calendrier (ex: &quot;Planning d&#39;anesthésie&quot;)
                </label>
                <span className="text-xs text-gray-500">Ce nom sera visible par l&#39;ensemble des utilisateurs</span>
            </div>
        </div>
    );
});

// Pour éviter le warning "Display Name"
CalendarSettings.displayName = 'CalendarSettings'; 