'use client';

import React, { useEffect } from 'react';
import { toast, ToastContainer, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNotificationsWebSocket, Notification } from '@/hooks/useNotificationsWebSocket';
import { Bell, Check, X, AlertTriangle, Info } from 'lucide-react';
import Link from 'next/link';

type NotificationPriority = 'low' | 'medium' | 'high';

// Fonction pour déterminer la priorité d'une notification
const getNotificationPriority = (notification: Notification): NotificationPriority => {
    // Logique pour déterminer la priorité en fonction du type de notification
    switch (notification.type) {
        case 'ASSIGNMENT_SWAP_REQUEST_ACCEPTED':
        case 'ASSIGNMENT_SWAP_REQUEST_APPROVED_ADMIN':
        case 'ASSIGNMENT_SWAP_REQUEST_REJECTED':
            return 'high';
        case 'ASSIGNMENT_SWAP_REQUEST_RECEIVED':
        case 'NEW_CONTEXTUAL_MESSAGE':
        case 'MENTION_IN_MESSAGE':
            return 'medium';
        default:
            return 'low';
    }
};

// Configurer les options de toast en fonction de la priorité
const getToastOptions = (priority: NotificationPriority): ToastOptions => {
    const baseOptions: ToastOptions = {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
    };

    switch (priority) {
        case 'high':
            return {
                ...baseOptions,
                autoClose: 8000,
                className: 'notification-toast-high',
            };
        case 'medium':
            return {
                ...baseOptions,
                autoClose: 6000,
                className: 'notification-toast-medium',
            };
        case 'low':
        default:
            return {
                ...baseOptions,
                autoClose: 4000,
                className: 'notification-toast-low',
            };
    }
};

// Récupérer l'icône pour un type de notification
const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'ASSIGNMENT_SWAP_REQUEST_ACCEPTED':
        case 'ASSIGNMENT_SWAP_REQUEST_APPROVED_ADMIN':
        case 'LEAVE_REQUEST_STATUS_CHANGED':
            return <Check className="h-5 w-5 text-green-500" />;
        case 'ASSIGNMENT_SWAP_REQUEST_REJECTED':
        case 'SYSTEM_ALERT':
            return <X className="h-5 w-5 text-red-500" />;
        case 'ASSIGNMENT_SWAP_REQUEST_RECEIVED':
        case 'NEW_CONTEXTUAL_MESSAGE':
        case 'MENTION_IN_MESSAGE':
            return <Info className="h-5 w-5 text-blue-500" />;
        case 'ASSIGNMENT_REMINDER':
        case 'PLANNING_UPDATED_IMPACTING_YOU':
            return <AlertTriangle className="h-5 w-5 text-amber-500" />;
        default:
            return <Bell className="h-5 w-5 text-gray-500" />;
    }
};

export const NotificationToast: React.FC = () => {
    const { notifications } = useNotificationsWebSocket({
        autoConnect: true,
    });

    // Afficher un toast à chaque nouvelle notification
    useEffect(() => {
        if (notifications.length > 0) {
            // On suppose que les notifications sont triées par date (la plus récente en premier)
            const latestNotification = notifications[0];

            // Vérifier si c'est une nouvelle notification (moins de 5 secondes)
            const notificationTime = new Date(latestNotification.createdAt).getTime();
            const currentTime = new Date().getTime();
            const isNew = (currentTime - notificationTime) < 5000; // 5 secondes

            if (isNew && !latestNotification.isRead) {
                const priority = getNotificationPriority(latestNotification);
                const options = getToastOptions(priority);

                // Personnaliser le contenu du toast
                const NotificationContent = () => (
                    <div className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(latestNotification.type)}
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">
                                {latestNotification.message}
                            </p>
                            {latestNotification.link && (
                                <Link
                                    href={latestNotification.link}
                                    className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                >
                                    Voir les détails
                                </Link>
                            )}
                        </div>
                    </div>
                );

                toast(<NotificationContent />, options);
            }
        }
    }, [notifications]);

    return <ToastContainer />;
};

export default NotificationToast; 