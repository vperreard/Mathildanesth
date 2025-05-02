import React from 'react';
import { NotificationSettingsForm, NotificationSettings } from '../components/NotificationSettingsForm';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import './NotificationSettingsPage.css';

const NotificationSettingsPage: React.FC = () => {
    const { user } = useAuth();

    const userId = user?.id || '';
    const {
        settings,
        isLoading,
        error,
        saveSettings
    } = useNotificationSettings({ userId });

    return (
        <div className="notification-settings-page">
            <h1>Paramètres de notification</h1>
            <p className="page-description">
                Configurez vos préférences de notification pour rester informé des événements importants.
            </p>

            {!user && (
                <div className="alert alert-warning">
                    Veuillez vous connecter pour gérer vos préférences de notification.
                </div>
            )}

            {error && (
                <div className="alert alert-error">{error}</div>
            )}

            {user && (
                <div className="content-wrapper">
                    {isLoading && !settings ? (
                        <div className="loading-container">
                            <p>Chargement de vos préférences...</p>
                        </div>
                    ) : (
                        <NotificationSettingsForm
                            userId={user.id}
                            onSave={saveSettings}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationSettingsPage; 