/*
 * Note: Ce fichier devrait idéalement être converti en .tsx puisqu'il contient du JSX.
 */

import { useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ConflictType, ConflictSeverity, LeaveConflict } from '../types/conflict';
import { useConflictDetection } from './useConflictDetection';
import { LeaveConflictNotificationService } from '../services/leaveConflictNotificationService';
import { useNotifications } from '../../notifications/hooks/useNotifications';
import { useUser } from '../../utilisateurs/hooks/useUser';

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
 * Hook pour gérer les notifications de conflits de congés
 * @returns {Object} Méthodes pour notifier et afficher les conflits
 */
export const useLeaveConflictNotification = (options = {}) => {
    const { t } = useTranslation();
    const conflictDetection = useConflictDetection();
    const [notificationsSent, setNotificationsSent] = useState(false);
    const { autoNotify = true } = options;

    // Formatage du message de conflit pour l'affichage
    const formatConflictMessage = useCallback((conflict: LeaveConflict): string => {
        const baseMessage = conflict.message || t(`leaves.conflicts.types.${conflict.type}.message`);
        let formattedMessage = baseMessage;

        // Enrichir le message avec des détails supplémentaires si disponibles
        if (conflict.details) {
            formattedMessage += `: ${conflict.details}`;
        }

        // Ajouter la date si disponible
        if (conflict.date) {
            const dateStr = new Date(conflict.date).toLocaleDateString();
            formattedMessage += ` (${dateStr})`;
        }

        return formattedMessage;
    }, [t]);

    // Formatage du titre du conflit pour l'affichage
    const formatConflictTitle = useCallback((conflict: LeaveConflict): string => {
        return conflict.title || t(`leaves.conflicts.types.${conflict.type}.title`);
    }, [t]);

    // Notification d'un conflit individuel
    const notifyConflict = useCallback((conflict: LeaveConflict) => {
        const message = formatConflictMessage(conflict);
        const title = formatConflictTitle(conflict);

        // Adapter le style de notification selon la sévérité du conflit
        switch (conflict.severity) {
            case ConflictSeverity.BLOCKING:
                toast.error(`${title}: ${message}`, { duration: 5000 });
                break;
            case ConflictSeverity.WARNING:
                toast.warning(`${title}: ${message}`, { duration: 4000 });
                break;
            case ConflictSeverity.INFO:
                toast.info(`${title}: ${message}`, { duration: 3000 });
                break;
            default:
                toast(`${title}: ${message}`);
        }
    }, [formatConflictMessage, formatConflictTitle]);

    // Notification d'une liste de conflits
    const notifyConflicts = useCallback((conflicts: LeaveConflict[]) => {
        if (conflicts.length === 0) return;

        // Regrouper les conflits par sévérité pour un affichage ordonné
        const blockingConflicts = conflicts.filter(c => c.severity === ConflictSeverity.BLOCKING);
        const warningConflicts = conflicts.filter(c => c.severity === ConflictSeverity.WARNING);
        const infoConflicts = conflicts.filter(c => c.severity === ConflictSeverity.INFO);

        // Afficher les conflits du plus critique au moins critique
        blockingConflicts.forEach(notifyConflict);
        warningConflicts.forEach(notifyConflict);
        infoConflicts.forEach(notifyConflict);

        setNotificationsSent(true);
    }, [notifyConflict]);

    // Notification des conflits détectés actuellement
    const notifyCurrentConflicts = useCallback(() => {
        if (conflictDetection.conflicts.length > 0) {
            notifyConflicts(conflictDetection.conflicts);
        }
    }, [conflictDetection.conflicts, notifyConflicts]);

    // Réinitialisation de l'état des notifications
    const resetNotifications = useCallback(() => {
        setNotificationsSent(false);
    }, []);

    // Composant d'alerte pour les conflits bloquants - RETOURNE UN ÉLÉMENT JSX
    const showBlockingAlert = useCallback((conflicts?: LeaveConflict[]) => {
        const blockingConflicts = conflicts || conflictDetection.getBlockingConflicts();
        if (blockingConflicts.length === 0) return null;

        // On retourne une description du JSX plutôt que du JSX directement
        // Le JSX réel sera créé dans un composant dédié
        return {
            type: 'blocking',
            conflicts: blockingConflicts,
            title: t('leaves.conflicts.blocking.title'),
            messages: blockingConflicts.map(conflict => ({
                id: conflict.id,
                message: formatConflictMessage(conflict)
            }))
        };
    }, [conflictDetection, formatConflictMessage, t]);

    // Composant d'alerte pour les conflits d'avertissement - RETOURNE UN ÉLÉMENT JSX
    const showWarningAlert = useCallback((conflicts?: LeaveConflict[]) => {
        const warningConflicts = conflicts || conflictDetection.getWarningConflicts();
        if (warningConflicts.length === 0) return null;

        // On retourne une description du JSX plutôt que du JSX directement
        return {
            type: 'warning',
            conflicts: warningConflicts,
            title: t('leaves.conflicts.warning.title'),
            messages: warningConflicts.map(conflict => ({
                id: conflict.id,
                message: formatConflictMessage(conflict)
            }))
        };
    }, [conflictDetection, formatConflictMessage, t]);

    // Composant d'alerte pour les conflits d'information - RETOURNE UN ÉLÉMENT JSX
    const showInfoAlert = useCallback((conflicts?: LeaveConflict[]) => {
        const infoConflicts = conflicts || conflictDetection.getInfoConflicts();
        if (infoConflicts.length === 0) return null;

        // On retourne une description du JSX plutôt que du JSX directement
        return {
            type: 'info',
            conflicts: infoConflicts,
            title: t('leaves.conflicts.info.title'),
            messages: infoConflicts.map(conflict => ({
                id: conflict.id,
                message: formatConflictMessage(conflict)
            }))
        };
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