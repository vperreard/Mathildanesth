import React, { useState } from 'react';
import './NotificationSettingsForm.css';

export interface NotificationSettingsFormProps {
    // userId: string; // Supposé venir d'un contexte ou passé autrement?
    onSave: (settings: NotificationSettings) => Promise<void>;
    initialSettings?: NotificationSettings; // Rendre optionnel, utiliser DEFAULT si absent
    isLoading: boolean; // Prop pour l'état de chargement
    errorMessage: string | null; // Prop pour message d'erreur
    successMessage: string | null; // Prop pour message de succès
    // Ajouter d'autres props si nécessaire (ex: onReset)
}

export interface NotificationSettings {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
    digestFrequency: 'never' | 'daily' | 'weekly';
    notifyOn: {
        messages: boolean;
        updates: boolean;
        reminders: boolean;
        mentions: boolean;
    };
}

// Valeurs par défaut pour la réinitialisation manuelle
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
    email: true,
    sms: false,
    push: true,
    inApp: true,
    digestFrequency: 'daily',
    notifyOn: {
        messages: true,
        updates: true,
        reminders: true,
        mentions: true
    }
};

export const NotificationSettingsForm: React.FC<NotificationSettingsFormProps> = ({
    // userId, // Ne pas déstructurer si non utilisé directement
    onSave,
    initialSettings = DEFAULT_NOTIFICATION_SETTINGS, // Utiliser les props
    isLoading, // Utiliser les props
    errorMessage, // Utiliser les props
    successMessage, // Utiliser les props
}) => {
    // Supprimer les états internes redondants
    // const [isLoading, setIsLoading] = useState(false);
    // const [success, setSuccess] = useState<string | null>(null);
    // const [error, setError] = useState<string | null>(null);

    const [settings, setSettings] = useState<NotificationSettings>(initialSettings);

    // Mettre à jour l'état local si les props initialSettings changent
    React.useEffect(() => {
        setSettings(initialSettings);
    }, [initialSettings]);

    const handleToggleChange = (channel: keyof Pick<NotificationSettings, 'email' | 'sms' | 'push' | 'inApp'>) => {
        setSettings(prev => ({
            ...prev,
            [channel]: !prev[channel]
        }));
    };

    const handleNotifyOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = event.target;

        setSettings(prev => ({
            ...prev,
            notifyOn: {
                ...prev.notifyOn,
                [name]: checked
            }
        }));
    };

    const handleDigestChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSettings(prev => ({
            ...prev,
            digestFrequency: event.target.value as NotificationSettings['digestFrequency']
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        // Pas besoin de gérer isLoading/success/error ici, c'est géré par le parent via les props
        // setIsLoading(true);
        // setSuccess(null);
        // setError(null);

        // Appeler onSave directement
        await onSave(settings);

        // La gestion de l'état après sauvegarde (isLoading=false, message) est faite par le parent
    };

    const handleReset = () => {
        setSettings(DEFAULT_NOTIFICATION_SETTINGS);
        // Informer le parent si nécessaire (ex: props.onReset())
    };

    return (
        <div className="notification-settings">
            <h2>Gérer vos préférences de notification</h2>

            {/* Utiliser les props pour afficher les messages */}
            {successMessage && <div className="alert alert-success">{successMessage}</div>}
            {errorMessage && <div className="alert alert-error">{errorMessage}</div>}

            <form onSubmit={handleSubmit}>
                <div className="settings-section">
                    <h3>Canaux de notification</h3>
                    <div className="channel-options">
                        <div className="channel-option">
                            <label>
                                <span>Email</span>
                                <div className="toggle-container">
                                    <div
                                        className={`toggle-switch ${settings.email ? 'active' : ''}`}
                                        onClick={() => handleToggleChange('email')}
                                    >
                                        <div className="toggle-slider"></div>
                                    </div>
                                </div>
                            </label>
                        </div>

                        <div className="channel-option">
                            <label>
                                <span>SMS</span>
                                <div className="toggle-container">
                                    <div
                                        className={`toggle-switch ${settings.sms ? 'active' : ''}`}
                                        onClick={() => handleToggleChange('sms')}
                                    >
                                        <div className="toggle-slider"></div>
                                    </div>
                                </div>
                            </label>
                        </div>

                        <div className="channel-option">
                            <label>
                                <span>Notifications push</span>
                                <div className="toggle-container">
                                    <div
                                        className={`toggle-switch ${settings.push ? 'active' : ''}`}
                                        onClick={() => handleToggleChange('push')}
                                    >
                                        <div className="toggle-slider"></div>
                                    </div>
                                </div>
                            </label>
                        </div>

                        <div className="channel-option">
                            <label>
                                <span>Notifications dans l'application</span>
                                <div className="toggle-container">
                                    <div
                                        className={`toggle-switch ${settings.inApp ? 'active' : ''}`}
                                        onClick={() => handleToggleChange('inApp')}
                                    >
                                        <div className="toggle-slider"></div>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <h3>Fréquence du digest</h3>
                    <div className="select-container">
                        <select
                            value={settings.digestFrequency}
                            onChange={handleDigestChange}
                            className="digest-select"
                        >
                            <option value="never">Jamais</option>
                            <option value="daily">Quotidien</option>
                            <option value="weekly">Hebdomadaire</option>
                        </select>
                    </div>
                </div>

                <div className="settings-section">
                    <h3>Me notifier pour</h3>
                    <div className="preferences-table">
                        <div className="preference-item">
                            <label>
                                <input
                                    type="checkbox"
                                    name="messages"
                                    checked={settings.notifyOn.messages}
                                    onChange={handleNotifyOnChange}
                                />
                                <span>Nouveaux messages</span>
                            </label>
                        </div>

                        <div className="preference-item">
                            <label>
                                <input
                                    type="checkbox"
                                    name="updates"
                                    checked={settings.notifyOn.updates}
                                    onChange={handleNotifyOnChange}
                                />
                                <span>Mises à jour du système</span>
                            </label>
                        </div>

                        <div className="preference-item">
                            <label>
                                <input
                                    type="checkbox"
                                    name="reminders"
                                    checked={settings.notifyOn.reminders}
                                    onChange={handleNotifyOnChange}
                                />
                                <span>Rappels</span>
                            </label>
                        </div>

                        <div className="preference-item">
                            <label>
                                <input
                                    type="checkbox"
                                    name="mentions"
                                    checked={settings.notifyOn.mentions}
                                    onChange={handleNotifyOnChange}
                                />
                                <span>Mentions</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="btn-save"
                        disabled={isLoading} // Utiliser la prop isLoading
                    >
                        {isLoading ? 'Enregistrement...' : 'Enregistrer les préférences'}
                    </button>
                    <button
                        type="button"
                        className="btn-cancel"
                        onClick={handleReset}
                        disabled={isLoading} // Désactiver aussi pendant le chargement?
                    >
                        Réinitialiser
                    </button>
                </div>
            </form>

            <div className="notification-info">
                <p>
                    <strong>Note:</strong> Vous pouvez modifier vos préférences de notification à tout moment.
                    Les modifications prendront effet immédiatement.
                </p>
            </div>
        </div>
    );
}; 