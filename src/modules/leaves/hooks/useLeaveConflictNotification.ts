import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { LeaveConflict, ConflictSeverity, ConflictType } from '../types/conflict';
import { useConflictDetection, UseConflictDetectionReturn } from './useConflictDetection';
import { LeaveConflictNotificationService } from '../services/leaveConflictNotificationService';
import { useNotifications } from '../../notifications/hooks/useNotifications';
import { useUser } from '../../users/hooks/useUser';

// Types d'affichage de notification
type NotificationDisplayType = 'toast' | 'alert' | 'badge' | 'all';

interface UseLeaveConflictNotificationProps {
    userId: string;
    autoNotify?: boolean;
}

interface UseLeaveConflictNotificationReturn {
    // Méthodes de notification
    notifyConflict: (conflict: LeaveConflict, displayType?: NotificationDisplayType) => void;
    notifyConflicts: (conflicts: LeaveConflict[], displayType?: NotificationDisplayType) => void;
    notifyCurrentConflicts: (displayType?: NotificationDisplayType) => void;

    // Méthodes pour afficher des alertes spécifiques
    showBlockingAlert: (conflicts?: LeaveConflict[]) => JSX.Element | null;
    showWarningAlert: (conflicts?: LeaveConflict[]) => JSX.Element | null;
    showInfoAlert: (conflicts?: LeaveConflict[]) => JSX.Element | null;

    // Formatage des messages
    formatConflictMessage: (conflict: LeaveConflict) => string;
    formatConflictTitle: (conflict: LeaveConflict) => string;

    // État des notifications
    notificationsSent: boolean;
    resetNotifications: () => void;

    // Accès au hook de détection de conflits
    conflictDetection: UseConflictDetectionReturn;
}

/**
 * Hook pour la gestion des notifications de conflits de congés
 * S'intègre avec useConflictDetection pour générer et afficher des notifications
 */
export const useLeaveConflictNotification = ({
    userId,
    autoNotify = false
}: UseLeaveConflictNotificationProps): UseLeaveConflictNotificationReturn => {
    const { t } = useTranslation();
    const { currentUser } = useUser();
    const { markAsRead } = useNotifications();

    // Initialiser le service de notification
    // Note: Dans une application réelle, ce service devrait être injecté via un contexte
    const notificationService = new LeaveConflictNotificationService(
        // Ces services devraient être récupérés depuis un contexte
        {} as any, // emailService
        {} as any, // notificationService
        {
            translate: (key: string, _locale: string, params?: Record<string, any>) => {
                return t(key, params);
            }
        } as any // translationService simulé avec react-i18next
    );

    // Utiliser le hook de détection de conflits
    const conflictDetection = useConflictDetection({ userId });

    // État pour suivre si des notifications ont été envoyées
    const [notificationsSent, setNotificationsSent] = useState<boolean>(false);

    // Réinitialiser l'état des notifications
    const resetNotifications = useCallback((): void => {
        setNotificationsSent(false);
    }, []);

    // Formater le titre d'un conflit pour l'affichage
    const formatConflictTitle = useCallback((conflict: LeaveConflict): string => {
        const template = notificationService.generateNotificationTemplate(conflict);
        return template.title;
    }, [notificationService]);

    // Formater le message d'un conflit pour l'affichage
    const formatConflictMessage = useCallback((conflict: LeaveConflict): string => {
        const template = notificationService.generateNotificationTemplate(conflict);
        return template.message;
    }, [notificationService]);

    // Afficher une notification toast pour un conflit
    const showToastNotification = useCallback((conflict: LeaveConflict): void => {
        const template = notificationService.generateNotificationTemplate(conflict);

        switch (conflict.severity) {
            case ConflictSeverity.BLOQUANT:
                toast.error(template.message, {
                    toastId: `conflict-${conflict.id}`,
                    autoClose: false
                });
                break;
            case ConflictSeverity.AVERTISSEMENT:
                toast.warning(template.message, {
                    toastId: `conflict-${conflict.id}`,
                    autoClose: 5000
                });
                break;
            case ConflictSeverity.INFORMATION:
                toast.info(template.message, {
                    toastId: `conflict-${conflict.id}`,
                    autoClose: 3000
                });
                break;
            default:
                toast(template.message, {
                    toastId: `conflict-${conflict.id}`
                });
        }
    }, [notificationService]);

    // Notifier un conflit spécifique avec l'affichage choisi
    const notifyConflict = useCallback((
        conflict: LeaveConflict,
        displayType: NotificationDisplayType = 'toast'
    ): void => {
        if (displayType === 'toast' || displayType === 'all') {
            showToastNotification(conflict);
        }

        // Marquer qu'une notification a été envoyée
        setNotificationsSent(true);

        // Si l'utilisateur actuel est concerné, envoyer des notifications serveur
        if (currentUser && conflict.affectedUserIds?.includes(currentUser.id)) {
            // Dans un environnement réel, on appellerait ici le service de notification
            // pour envoyer des notifications UI et email via le backend
            notificationService.notifyConflict(conflict, [currentUser.id])
                .catch(error => console.error('Erreur lors de la notification du conflit:', error));
        }
    }, [currentUser, notificationService, showToastNotification]);

    // Notifier plusieurs conflits
    const notifyConflicts = useCallback((
        conflicts: LeaveConflict[],
        displayType: NotificationDisplayType = 'toast'
    ): void => {
        conflicts.forEach(conflict => {
            notifyConflict(conflict, displayType);
        });
    }, [notifyConflict]);

    // Notifier les conflits actuellement détectés
    const notifyCurrentConflicts = useCallback((
        displayType: NotificationDisplayType = 'toast'
    ): void => {
        if (conflictDetection.conflicts.length > 0) {
            notifyConflicts(conflictDetection.conflicts, displayType);
        }
    }, [conflictDetection.conflicts, notifyConflicts]);

    // Composant d'alerte pour les conflits bloquants
    const showBlockingAlert = useCallback((conflicts?: LeaveConflict[]): JSX.Element | null => {
        const blockingConflicts = conflicts || conflictDetection.getBlockingConflicts();
        if (blockingConflicts.length === 0) return null;

        // Note: Ce composant est un placeholder
        // Dans une implémentation réelle, vous utiliseriez un vrai composant d'alerte
        return (
            <div className= "alert alert-danger" role = "alert" >
                <h4>{ t('leaves.conflicts.blocking.title') } </h4>
                <ul>
        {
            blockingConflicts.map(conflict => (
                <li key= { conflict.id } > { formatConflictMessage(conflict) } </li>
            ))
}
</ul>
    </div>
        );
    }, [conflictDetection, formatConflictMessage, t]);

// Composant d'alerte pour les conflits d'avertissement
const showWarningAlert = useCallback((conflicts?: LeaveConflict[]): JSX.Element | null => {
    const warningConflicts = conflicts || conflictDetection.getWarningConflicts();
    if (warningConflicts.length === 0) return null;

    return (
        <div className= "alert alert-warning" role = "alert" >
            <h4>{ t('leaves.conflicts.warning.title') } </h4>
            <ul>
    {
        warningConflicts.map(conflict => (
            <li key= { conflict.id } > { formatConflictMessage(conflict) } </li>
        ))}
</ul>
    </div>
        );
    }, [conflictDetection, formatConflictMessage, t]);

// Composant d'alerte pour les conflits d'information
const showInfoAlert = useCallback((conflicts?: LeaveConflict[]): JSX.Element | null => {
    const infoConflicts = conflicts || conflictDetection.getInfoConflicts();
    if (infoConflicts.length === 0) return null;

    return (
        <div className= "alert alert-info" role = "alert" >
            <h4>{ t('leaves.conflicts.info.title') } </h4>
            <ul>
    {
        infoConflicts.map(conflict => (
            <li key= { conflict.id } > { formatConflictMessage(conflict) } </li>
        ))}
</ul>
    </div>
        );
    }, [conflictDetection, formatConflictMessage, t]);

// Effet pour notifier automatiquement les conflits lorsqu'ils sont détectés
useEffect(() => {
    if (autoNotify && conflictDetection.conflicts.length > 0 && !notificationsSent) {
        notifyCurrentConflicts();
    }
}, [
    autoNotify,
    conflictDetection.conflicts,
    notificationsSent,
    notifyCurrentConflicts
]);

// Réinitialiser les notifications lorsque les conflits sont réinitialisés
useEffect(() => {
    if (conflictDetection.conflicts.length === 0) {
        resetNotifications();
    }
}, [conflictDetection.conflicts, resetNotifications]);

return {
    notifyConflict,
    notifyConflicts,
    notifyCurrentConflicts,
    showBlockingAlert,
    showWarningAlert,
    showInfoAlert,
    formatConflictMessage,
    formatConflictTitle,
    notificationsSent,
    resetNotifications,
    conflictDetection
};
}; 