'use client';

import { useState } from 'react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { toast } from 'react-toastify';

// Composant pour un switch toggle
const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) => (
    <div className="flex items-center justify-between py-2">
        <span className="text-gray-700">{label}</span>
        <div
            className={`relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out rounded-full cursor-pointer ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}
            onClick={() => onChange(!checked)}
        >
            <span
                className={`absolute left-1 top-1 w-4 h-4 transition-transform duration-200 ease-in-out bg-white rounded-full ${checked ? 'transform translate-x-6' : ''}`}
            />
        </div>
    </div>
);

// Composant pour une section avec titre
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-2">{title}</h3>
        <div className="pl-2">{children}</div>
    </div>
);

export default function NotificationPreferencesPage() {
    const {
        preferences,
        isLoading,
        error,
        updatePreferences,
        resetToDefaults,
        disableAllNotifications
    } = useNotificationPreferences();

    const [quietHoursDays, setQuietHoursDays] = useState<string[]>([]);
    const daysOfWeek = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

    // Gérer le changement pour un jour de la semaine dans les heures calmes
    const handleDayToggle = (day: string) => {
        if (preferences) {
            const currentDays = quietHoursDays.length > 0
                ? [...quietHoursDays]
                : preferences.quietHoursDays ? JSON.parse(preferences.quietHoursDays) : [];

            const updatedDays = currentDays.includes(day)
                ? currentDays.filter((d: string) => d !== day)
                : [...currentDays, day];

            setQuietHoursDays(updatedDays);

            // Mettre à jour les préférences
            updatePreferences({
                quietHoursDays: JSON.stringify(updatedDays)
            });
        }
    };

    // Mise à jour d'une préférence
    const handlePreferenceChange = (key: string, value: boolean) => {
        updatePreferences({ [key]: value });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
                <p className="font-semibold">Erreur lors du chargement des préférences</p>
                <p>{error}</p>
                <button
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    onClick={() => window.location.reload()}
                >
                    Réessayer
                </button>
            </div>
        );
    }

    if (!preferences) {
        return null;
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">Préférences de Notifications</h1>

            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
                <Section title="Types de notifications">
                    <Toggle
                        label="Rappels d'affectations"
                        checked={preferences.assignmentReminders}
                        onChange={(value) => handlePreferenceChange('assignmentReminders', value)}
                    />
                    <Toggle
                        label="Demandes d'échange"
                        checked={preferences.assignmentSwapRequests}
                        onChange={(value) => handlePreferenceChange('assignmentSwapRequests', value)}
                    />
                    <Toggle
                        label="Réponses aux demandes d'échange"
                        checked={preferences.assignmentSwapResponses}
                        onChange={(value) => handlePreferenceChange('assignmentSwapResponses', value)}
                    />
                    <Toggle
                        label="Actions administratives sur les échanges"
                        checked={preferences.assignmentSwapAdminActions}
                        onChange={(value) => handlePreferenceChange('assignmentSwapAdminActions', value)}
                    />
                    <Toggle
                        label="Messages contextuels"
                        checked={preferences.contextualMessages}
                        onChange={(value) => handlePreferenceChange('contextualMessages', value)}
                    />
                    <Toggle
                        label="Mentions dans les messages"
                        checked={preferences.mentionsInMessages}
                        onChange={(value) => handlePreferenceChange('mentionsInMessages', value)}
                    />
                    <Toggle
                        label="Mises à jour du planning"
                        checked={preferences.planningUpdates}
                        onChange={(value) => handlePreferenceChange('planningUpdates', value)}
                    />
                    <Toggle
                        label="Changements de statut des demandes de congés"
                        checked={preferences.leaveRequestStatusChanges}
                        onChange={(value) => handlePreferenceChange('leaveRequestStatusChanges', value)}
                    />
                    <Toggle
                        label="Postes ouverts disponibles"
                        checked={preferences.openShifts}
                        onChange={(value) => handlePreferenceChange('openShifts', value)}
                    />
                    <Toggle
                        label="Publication du planning d'équipe"
                        checked={preferences.teamPlanningPublished}
                        onChange={(value) => handlePreferenceChange('teamPlanningPublished', value)}
                    />
                </Section>

                <Section title="Canaux de notification">
                    <Toggle
                        label="Notifications par email"
                        checked={preferences.emailEnabled}
                        onChange={(value) => handlePreferenceChange('emailEnabled', value)}
                    />
                    <Toggle
                        label="Notifications dans l'application"
                        checked={preferences.inAppEnabled}
                        onChange={(value) => handlePreferenceChange('inAppEnabled', value)}
                    />
                    <Toggle
                        label="Notifications push (bientôt disponible)"
                        checked={preferences.pushEnabled}
                        onChange={(value) => handlePreferenceChange('pushEnabled', value)}
                    />
                </Section>

                <Section title="Périodes de non-dérangement">
                    <Toggle
                        label="Activer les heures calmes"
                        checked={preferences.quietHoursEnabled}
                        onChange={(value) => handlePreferenceChange('quietHoursEnabled', value)}
                    />

                    {preferences.quietHoursEnabled && (
                        <>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-gray-700 mb-1">Début</label>
                                    <input
                                        type="time"
                                        className="w-full p-2 border rounded"
                                        value={preferences.quietHoursStart || '22:00'}
                                        onChange={(e) => updatePreferences({ quietHoursStart: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-1">Fin</label>
                                    <input
                                        type="time"
                                        className="w-full p-2 border rounded"
                                        value={preferences.quietHoursEnd || '08:00'}
                                        onChange={(e) => updatePreferences({ quietHoursEnd: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-gray-700 mb-1">Jours de la semaine</label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {daysOfWeek.map(day => {
                                        const currentDays = preferences.quietHoursDays ? JSON.parse(preferences.quietHoursDays) : [];
                                        const isActive = currentDays.includes(day);

                                        return (
                                            <button
                                                key={day}
                                                className={`px-3 py-1 rounded-full text-sm ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                                                onClick={() => handleDayToggle(day)}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </Section>
            </div>

            <div className="flex gap-4 justify-end">
                <button
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    onClick={async () => {
                        if (window.confirm('Êtes-vous sûr de vouloir désactiver toutes les notifications ?')) {
                            await disableAllNotifications();
                            toast.success('Toutes les notifications ont été désactivées');
                        }
                    }}
                >
                    Tout désactiver
                </button>
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={async () => {
                        if (window.confirm('Êtes-vous sûr de vouloir réinitialiser toutes les préférences ?')) {
                            await resetToDefaults();
                            toast.success('Préférences réinitialisées avec succès');
                        }
                    }}
                >
                    Réinitialiser
                </button>
            </div>
        </div>
    );
} 