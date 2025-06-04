import axios from 'axios';
import { NotificationSettings } from '../components/NotificationSettingsForm';

/**
 * Service API pour les préférences de notification
 */
const API_BASE_URL = '/api/notifications';

/**
 * Récupérer les préférences de notification d'un utilisateur
 * @param userId Identifiant de l'utilisateur
 */
export const getUserNotificationSettings = async (userId: string): Promise<NotificationSettings> => {
    try {
        // TODO: À remplacer par un appel API réel
        console.log(`Chargement des préférences pour l'utilisateur ${userId}`);

        // Simuler un délai réseau pour les tests
        await new Promise(resolve => setTimeout(resolve, 800));

        // Exemple de requête API
        // const response = await axios.get(`${API_BASE_URL}/utilisateurs/${userId}/preferences`);
        // return response.data;

        // Retourner des données par défaut pour le moment
        return {
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
    } catch (error) {
        console.error('Erreur lors du chargement des préférences de notification:', error);
        throw new Error('Impossible de charger les préférences de notification');
    }
};

/**
 * Enregistrer les préférences de notification d'un utilisateur
 * @param userId Identifiant de l'utilisateur
 * @param settings Paramètres de notification à enregistrer
 */
export const saveUserNotificationSettings = async (userId: string, settings: NotificationSettings): Promise<void> => {
    try {
        // TODO: À remplacer par un appel API réel
        console.log(`Enregistrement des préférences pour l'utilisateur ${userId}`, settings);

        // Simuler un délai réseau pour les tests
        await new Promise(resolve => setTimeout(resolve, 800));

        // Exemple de requête API
        // await axios.post(`${API_BASE_URL}/utilisateurs/${userId}/preferences`, settings);
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement des préférences de notification:', error);
        throw new Error('Impossible d\'enregistrer les préférences de notification');
    }
};

/**
 * Réinitialiser les préférences de notification d'un utilisateur
 * @param userId Identifiant de l'utilisateur
 */
export const resetUserNotificationSettings = async (userId: string): Promise<void> => {
    try {
        // TODO: À remplacer par un appel API réel
        console.log(`Réinitialisation des préférences pour l'utilisateur ${userId}`);

        // Simuler un délai réseau pour les tests
        await new Promise(resolve => setTimeout(resolve, 800));

        // Exemple de requête API
        // await axios.delete(`${API_BASE_URL}/utilisateurs/${userId}/preferences`);
    } catch (error) {
        console.error('Erreur lors de la réinitialisation des préférences de notification:', error);
        throw new Error('Impossible de réinitialiser les préférences de notification');
    }
}; 