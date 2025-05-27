import { ErrorDetails } from '../hooks/useErrorHandler';
import { flushErrorQueue } from './errorLoggingService';

interface AlertConfig {
    enableEmailAlerts: boolean;
    enableSlackAlerts: boolean;
    enablePushNotifications: boolean;
    criticalErrorsOnly: boolean;
    slackWebhookUrl: string;
    emailRecipients: string[];
    cooldownPeriod: number; // en minutes
    batchAlerts: boolean;
}

// Configuration par défaut des alertes
let config: AlertConfig = {
    enableEmailAlerts: process.env.NODE_ENV === 'production',
    enableSlackAlerts: process.env.NODE_ENV === 'production',
    enablePushNotifications: process.env.NODE_ENV === 'production',
    criticalErrorsOnly: true,
    slackWebhookUrl: process.env.REACT_APP_SLACK_WEBHOOK_URL || '',
    emailRecipients: (process.env.REACT_APP_ALERT_EMAIL_RECIPIENTS || '').split(','),
    cooldownPeriod: 15, // 15 minutes entre les alertes
    batchAlerts: true,
};

// Suivi des erreurs pour éviter les doublons
const alertHistory: Record<string, Date> = {};
const alertQueue: Array<{ key: string, error: ErrorDetails }> = [];
let alertTimeout: NodeJS.Timeout | null = null;

/**
 * Configure le service d'alertes pour les erreurs
 */
export const configureAlertService = (customConfig: Partial<AlertConfig>) => {
    config = { ...config, ...customConfig };
};

/**
 * Vérifie si une alerte peut être envoyée (pour éviter le spam)
 */
const canSendAlert = (key: string): boolean => {
    if (!alertHistory[key]) {
        return true;
    }

    const now = new Date();
    const lastAlert = alertHistory[key];
    const diffMinutes = (now.getTime() - lastAlert.getTime()) / (1000 * 60);

    return diffMinutes >= config.cooldownPeriod;
};

/**
 * Envoie une alerte par email
 */
const sendEmailAlert = async (errors: Array<{ key: string, error: ErrorDetails }>): Promise<boolean> => {
    try {
        if (!config.emailRecipients.length) {
            return false;
        }

        const response = await fetch('http://localhost:3000/api/alerts/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipients: config.emailRecipients,
                subject: `[ALERTE] ${errors.length} erreur${errors.length > 1 ? 's' : ''} critique${errors.length > 1 ? 's' : ''} détectée${errors.length > 1 ? 's' : ''}`,
                errors: errors.map(({ key, error }) => ({
                    key,
                    message: error.message,
                    severity: error.severity,
                    timestamp: error.timestamp,
                    context: error.context,
                })),
            }),
        });

        return response.ok;
    } catch (e) {
        console.error('Échec de l\'envoi d\'alerte par email:', e);
        return false;
    }
};

/**
 * Envoie une alerte Slack
 */
const sendSlackAlert = async (errors: Array<{ key: string, error: ErrorDetails }>): Promise<boolean> => {
    try {
        if (!config.slackWebhookUrl) {
            return false;
        }

        const blocks = errors.map(({ key, error }) => ({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*${error.severity.toUpperCase()}*: ${error.message}\n*Key:* ${key}\n*Time:* ${error.timestamp.toLocaleString()}`
            }
        }));

        const response = await fetch(config.slackWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: `🚨 *ALERTE*: ${errors.length} erreur${errors.length > 1 ? 's' : ''} critique${errors.length > 1 ? 's' : ''} détectée${errors.length > 1 ? 's' : ''}`,
                blocks: [
                    {
                        type: 'header',
                        text: {
                            type: 'plain_text',
                            text: `🚨 Alerte: ${errors.length} erreur${errors.length > 1 ? 's' : ''} critique${errors.length > 1 ? 's' : ''}`,
                            emoji: true
                        }
                    },
                    ...blocks,
                    {
                        type: 'context',
                        elements: [
                            {
                                type: 'mrkdwn',
                                text: `Environnement: *${process.env.NODE_ENV}* | ${new Date().toLocaleString()}`
                            }
                        ]
                    }
                ]
            }),
        });

        return response.ok;
    } catch (e) {
        console.error('Échec de l\'envoi d\'alerte Slack:', e);
        return false;
    }
};

/**
 * Envoie une notification push
 */
const sendPushNotification = async (errors: Array<{ key: string, error: ErrorDetails }>): Promise<boolean> => {
    try {
        const response = await fetch('http://localhost:3000/api/alerts/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: `Alerte: ${errors.length} erreur(s) critique(s)`,
                body: errors.map(({ error }) => error.message).join('\n'),
                data: {
                    url: '/admin/errors',
                    errors: errors.map(({ key, error }) => ({
                        key,
                        message: error.message,
                        severity: error.severity,
                    })),
                },
            }),
        });

        return response.ok;
    } catch (e) {
        console.error('Échec de l\'envoi de notification push:', e);
        return false;
    }
};

/**
 * Traite la file d'attente des alertes
 */
const processAlertQueue = async () => {
    if (alertQueue.length === 0) {
        return;
    }

    const errors = [...alertQueue];
    alertQueue.length = 0; // Vider la file d'attente

    // Mettre à jour l'historique des alertes
    errors.forEach(({ key }) => {
        alertHistory[key] = new Date();
    });

    // Envoyer les alertes via les différents canaux
    const results = await Promise.all([
        config.enableEmailAlerts ? sendEmailAlert(errors) : Promise.resolve(false),
        config.enableSlackAlerts ? sendSlackAlert(errors) : Promise.resolve(false),
        config.enablePushNotifications ? sendPushNotification(errors) : Promise.resolve(false),
    ]);

    // S'assurer que les erreurs sont bien envoyées au serveur
    flushErrorQueue();

    console.log(`Alertes envoyées: Email: ${results[0]}, Slack: ${results[1]}, Push: ${results[2]}`);
};

/**
 * Déclenche une alerte pour une erreur
 */
export const triggerAlert = (key: string, error: ErrorDetails) => {
    // Vérifier si l'erreur correspond aux critères d'alerte
    if (config.criticalErrorsOnly && error.severity !== 'critical') {
        return;
    }

    // Vérifier si on peut envoyer une alerte (cooldown)
    if (!canSendAlert(key)) {
        return;
    }

    // Ajouter à la file d'attente
    alertQueue.push({ key, error });

    // Si le batching est désactivé ou s'il s'agit d'une erreur critique, traiter immédiatement
    if (!config.batchAlerts || error.severity === 'critical') {
        processAlertQueue();
    } else {
        // Sinon, programmer un traitement différé
        if (alertTimeout) {
            clearTimeout(alertTimeout);
        }

        alertTimeout = setTimeout(() => {
            processAlertQueue();
            alertTimeout = null;
        }, 1000 * 60); // Traiter après 1 minute
    }
};

// Écouteur pour traiter la file d'attente avant que l'utilisateur ne quitte la page
window.addEventListener('beforeunload', () => {
    if (alertQueue.length > 0) {
        processAlertQueue();
    }
}); 