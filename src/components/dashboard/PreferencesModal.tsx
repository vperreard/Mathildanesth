import React from 'react';
import { Dialog } from '@headlessui/react';
import { usePreferences } from '@/hooks/usePreferences';
import { useTheme } from '@/hooks/useTheme';
import { Theme } from '@/config/themes';

interface PreferencesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
    isOpen,
    onClose
}) => {
    const { preferences, updatePreferences } = usePreferences();
    const { themes, changeTheme } = useTheme();

    const handleThemeChange = (themeId: string) => {
        changeTheme(themeId);
        updatePreferences({ theme: themeId });
    };

    const handleLayoutChange = (layout: 'grid' | 'free') => {
        updatePreferences({ layout });
    };

    const handleNotificationChange = (key: string, value: boolean) => {
        updatePreferences({
            notifications: {
                ...preferences.notifications,
                [key]: value
            }
        });
    };

    const handleDisplayChange = (key: string, value: any) => {
        updatePreferences({
            display: {
                ...preferences.display,
                [key]: value
            }
        });
    };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            className="fixed inset-0 z-10 overflow-y-auto"
        >
            <div className="flex min-h-screen items-center justify-center">
                <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

                <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 p-6">
                    <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
                        Préférences
                    </Dialog.Title>

                    <div className="space-y-6">
                        {/* Thème */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Thème</h3>
                            <select
                                value={preferences.theme}
                                onChange={(e) => handleThemeChange(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                {themes.map((theme: Theme) => (
                                    <option key={theme.id} value={theme.id}>
                                        {theme.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Mise en page */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Mise en page</h3>
                            <div className="flex space-x-4">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        value="grid"
                                        checked={preferences.layout === 'grid'}
                                        onChange={(e) => handleLayoutChange(e.target.value as 'grid')}
                                        className="form-radio text-primary-600"
                                    />
                                    <span className="ml-2">Grille</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        value="free"
                                        checked={preferences.layout === 'free'}
                                        onChange={(e) => handleLayoutChange(e.target.value as 'free')}
                                        className="form-radio text-primary-600"
                                    />
                                    <span className="ml-2">Libre</span>
                                </label>
                            </div>
                        </div>

                        {/* Notifications */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Notifications</h3>
                            <div className="space-y-2">
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={preferences.notifications.enabled}
                                        onChange={(e) => handleNotificationChange('enabled', e.target.checked)}
                                        className="form-checkbox text-primary-600"
                                    />
                                    <span className="ml-2">Activer les notifications</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={preferences.notifications.sound}
                                        onChange={(e) => handleNotificationChange('sound', e.target.checked)}
                                        className="form-checkbox text-primary-600"
                                    />
                                    <span className="ml-2">Son</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={preferences.notifications.email}
                                        onChange={(e) => handleNotificationChange('email', e.target.checked)}
                                        className="form-checkbox text-primary-600"
                                    />
                                    <span className="ml-2">Email</span>
                                </label>
                            </div>
                        </div>

                        {/* Affichage */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Affichage</h3>
                            <div className="space-y-2">
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={preferences.display.showWeekends}
                                        onChange={(e) => handleDisplayChange('showWeekends', e.target.checked)}
                                        className="form-checkbox text-primary-600"
                                    />
                                    <span className="ml-2">Afficher les week-ends</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={preferences.display.showHolidays}
                                        onChange={(e) => handleDisplayChange('showHolidays', e.target.checked)}
                                        className="form-checkbox text-primary-600"
                                    />
                                    <span className="ml-2">Afficher les jours fériés</span>
                                </label>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Format de l'heure</label>
                                    <select
                                        value={preferences.display.timeFormat}
                                        onChange={(e) => handleDisplayChange('timeFormat', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    >
                                        <option value="12h">12 heures</option>
                                        <option value="24h">24 heures</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}; 