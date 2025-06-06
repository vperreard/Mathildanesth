'use client';

import React, { useState, useEffect } from 'react';
import { logger } from "../../../lib/logger";
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import axios from 'axios';

interface CalendarSettings {
    defaultView: 'month' | 'week' | 'day' | 'list';
    showWeekends: boolean;
    showHolidays: boolean;
    showRejectedLeaves: boolean;
    colorScheme: 'default' | 'highContrast' | 'colorBlind';
    startWeekOn: 'monday' | 'sunday';
    timeFormat: '12h' | '24h';
    notifications: {
        email: boolean;
        browser: boolean;
        sound: boolean;
    };
}

export default function CalendarSettingsPage() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<CalendarSettings>({
        defaultView: 'month',
        showWeekends: true,
        showHolidays: true,
        showRejectedLeaves: false,
        colorScheme: 'default',
        startWeekOn: 'monday',
        timeFormat: '24h',
        notifications: {
            email: true,
            browser: true,
            sound: false
        }
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Charger les paramètres de l'utilisateur
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/api/utilisateurs/${user?.id}/calendrier-settings`);
                if (response.data) {
                    setSettings(response.data);
                }
            } catch (error: unknown) {
                logger.error('Erreur lors du chargement des paramètres:', { error: error });
                toast.error('Impossible de charger les paramètres');
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            loadSettings();
        }
    }, [user]);

    // Sauvegarder les paramètres
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await axios.put(`http://localhost:3000/api/utilisateurs/${user?.id}/calendrier-settings`, settings);
            toast.success('Paramètres sauvegardés avec succès');
        } catch (error: unknown) {
            logger.error('Erreur lors de la sauvegarde des paramètres:', { error: error });
            toast.error('Impossible de sauvegarder les paramètres');
        } finally {
            setIsSaving(false);
        }
    };

    // Gérer les changements de paramètres
    const handleSettingChange = (key: keyof CalendarSettings, value: unknown) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Gérer les changements de notifications
    const handleNotificationChange = (key: keyof CalendarSettings['notifications'], value: boolean) => {
        setSettings(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [key]: value
            }
        }));
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="calendar-loading-spinner" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto px-4 py-8"
        >
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Paramètres du calendrier</h1>

                {/* Vue par défaut */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vue par défaut
                    </label>
                    <select
                        value={settings.defaultView}
                        onChange={(e) => handleSettingChange('defaultView', e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="month">Mois</option>
                        <option value="week">Semaine</option>
                        <option value="day">Jour</option>
                        <option value="list">Liste</option>
                    </select>
                </div>

                {/* Options d'affichage */}
                <div className="mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Options d'affichage</h2>
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="showWeekends"
                                checked={settings.showWeekends}
                                onChange={(e) => handleSettingChange('showWeekends', e.target.checked)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="showWeekends" className="ml-2 block text-sm text-gray-900">
                                Afficher les weekends
                            </label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="showHolidays"
                                checked={settings.showHolidays}
                                onChange={(e) => handleSettingChange('showHolidays', e.target.checked)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="showHolidays" className="ml-2 block text-sm text-gray-900">
                                Afficher les jours fériés
                            </label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="showRejectedLeaves"
                                checked={settings.showRejectedLeaves}
                                onChange={(e) => handleSettingChange('showRejectedLeaves', e.target.checked)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="showRejectedLeaves" className="ml-2 block text-sm text-gray-900">
                                Afficher les congés refusés
                            </label>
                        </div>
                    </div>
                </div>

                {/* Schéma de couleurs */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Schéma de couleurs
                    </label>
                    <select
                        value={settings.colorScheme}
                        onChange={(e) => handleSettingChange('colorScheme', e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="default">Par défaut</option>
                        <option value="highContrast">Contraste élevé</option>
                        <option value="colorBlind">Daltonien</option>
                    </select>
                </div>

                {/* Début de la semaine */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Début de la semaine
                    </label>
                    <select
                        value={settings.startWeekOn}
                        onChange={(e) => handleSettingChange('startWeekOn', e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="monday">Lundi</option>
                        <option value="sunday">Dimanche</option>
                    </select>
                </div>

                {/* Format de l'heure */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Format de l'heure
                    </label>
                    <select
                        value={settings.timeFormat}
                        onChange={(e) => handleSettingChange('timeFormat', e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="24h">24 heures</option>
                        <option value="12h">12 heures</option>
                    </select>
                </div>

                {/* Notifications */}
                <div className="mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Notifications</h2>
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="emailNotifications"
                                checked={settings.notifications.email}
                                onChange={(e) => handleNotificationChange('email', e.target.checked)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                                Notifications par email
                            </label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="browserNotifications"
                                checked={settings.notifications.browser}
                                onChange={(e) => handleNotificationChange('browser', e.target.checked)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="browserNotifications" className="ml-2 block text-sm text-gray-900">
                                Notifications du navigateur
                            </label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="soundNotifications"
                                checked={settings.notifications.sound}
                                onChange={(e) => handleNotificationChange('sound', e.target.checked)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="soundNotifications" className="ml-2 block text-sm text-gray-900">
                                Sons de notification
                            </label>
                        </div>
                    </div>
                </div>

                {/* Bouton de sauvegarde */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        {isSaving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
} 