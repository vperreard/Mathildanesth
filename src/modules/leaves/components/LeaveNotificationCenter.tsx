'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { logger } from "../../../lib/logger";
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { useLeaveNotifications } from '../hooks/useNotifications';
import {
    LeaveNotificationType,
    LeaveRelatedNotification,
    NotificationPriority
} from '../types/notification';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LeaveNotificationCenterProps {
    limit?: number;
    compact?: boolean;
    className?: string;
    onNotificationClick?: (notification: LeaveRelatedNotification) => void;
}

export const LeaveNotificationCenter: React.FC<LeaveNotificationCenterProps> = ({
    limit = 10,
    compact = false,
    className = '',
    onNotificationClick
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const {
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications
    } = useLeaveNotifications({
        autoFetch: true,
        limit,
        onNotificationReceived: (notification) => {
            // Faire une notification toast si nécessaire
            if (notification.priority === NotificationPriority.HIGH ||
                notification.priority === NotificationPriority.URGENT) {
                // Vous pouvez ajouter ici une bibliothèque de toast
                logger.info('Notification importante reçue:', notification.title);
            }
        }
    });

    // Rafraîchir les notifications périodiquement
    useEffect(() => {
        const interval = setInterval(() => {
            fetchNotifications();
        }, 60000); // Mise à jour toutes les minutes

        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Fermer le panneau quand on clique à l'extérieur
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (isOpen && !target.closest('.notification-panel')) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Obtenir l'icône en fonction du type de notification
    const getNotificationIcon = (notification: LeaveRelatedNotification) => {
        switch (notification.type) {
            case LeaveNotificationType.LEAVE_REQUEST:
            case LeaveNotificationType.LEAVE_APPROVAL_NEEDED:
                return <Clock className="h-5 w-5 text-blue-500" />;
            case LeaveNotificationType.LEAVE_STATUS_UPDATE:
                return notification.leaveStatus === 'APPROVED'
                    ? <CheckCircle className="h-5 w-5 text-green-500" />
                    : <XCircle className="h-5 w-5 text-red-500" />;
            case LeaveNotificationType.LEAVE_REMINDER:
                return <Calendar className="h-5 w-5 text-purple-500" />;
            case LeaveNotificationType.LEAVE_CONFLICT:
                return <AlertCircle className="h-5 w-5 text-orange-500" />;
            case LeaveNotificationType.QUOTA_LOW:
                return <AlertCircle className="h-5 w-5 text-yellow-500" />;
            default:
                return <Info className="h-5 w-5 text-gray-500" />;
        }
    };

    // Mettre en forme la date de création
    const formatCreationDate = (date: Date) => {
        try {
            return formatDistanceToNow(new Date(date), {
                addSuffix: true,
                locale: fr
            });
        } catch (e) {
            return 'Date inconnue';
        }
    };

    // Grouper les notifications par date
    const groupedNotifications = useMemo(() => {
        const groups: { [key: string]: LeaveRelatedNotification[] } = {
            'Aujourd\'hui': [],
            'Cette semaine': [],
            'Ce mois': [],
            'Plus ancien': [],
        };

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        notifications.forEach(notification => {
            const date = new Date(notification.createdAt);

            if (date >= today) {
                groups['Aujourd\'hui'].push(notification);
            } else if (date >= weekStart) {
                groups['Cette semaine'].push(notification);
            } else if (date >= monthStart) {
                groups['Ce mois'].push(notification);
            } else {
                groups['Plus ancien'].push(notification);
            }
        });

        return Object.entries(groups).filter(([_, items]) => items.length > 0);
    }, [notifications]);

    const handleNotificationClick = (notification: LeaveRelatedNotification) => {
        // Marquer comme lu si non lu
        if (!notification.read) {
            markAsRead(notification.id);
        }

        // Appeler le callback du parent
        if (onNotificationClick) {
            onNotificationClick(notification);
        }

        // Fermer le panneau si en mode compact
        if (compact) {
            setIsOpen(false);
        }

        // Gérer les actions (redirection, etc.)
        if (notification.actions && notification.actions[0]?.url) {
            window.location.href = notification.actions[0].url;
        }
    };

    return (
        <div className={`relative notification-panel ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none transition-colors duration-200"
                aria-label="Notifications"
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute right-0 mt-2 bg-white rounded-lg shadow-lg z-50 border border-gray-200 ${compact ? 'w-80' : 'w-96'
                            }`}
                    >
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                                <div className="flex space-x-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={() => markAllAsRead()}
                                            className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                        >
                                            Tout marquer comme lu
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteAllNotifications()}
                                        className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
                                    >
                                        Tout effacer
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={`overflow-y-auto ${compact ? 'max-h-80' : 'max-h-96'}`}>
                            {loading ? (
                                <div className="p-4 text-center text-gray-500">
                                    Chargement...
                                </div>
                            ) : error ? (
                                <div className="p-4 text-center text-red-500">
                                    Erreur: {error}
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                    Aucune notification
                                </div>
                            ) : (
                                <>
                                    {groupedNotifications.map(([group, items]) => (
                                        <div key={group}>
                                            <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {group}
                                            </div>
                                            {items.map(notification => (
                                                <motion.div
                                                    key={notification.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${!notification.read ? 'bg-blue-50' : ''
                                                        }`}
                                                    onClick={() => handleNotificationClick(notification)}
                                                >
                                                    <div className="flex items-start">
                                                        <div className="flex-shrink-0 mr-3 mt-1">
                                                            {getNotificationIcon(notification)}
                                                        </div>
                                                        <div className="flex-grow min-w-0">
                                                            <div className="flex justify-between items-start">
                                                                <h4 className={`font-medium text-sm ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                                                    {notification.title}
                                                                </h4>
                                                                {!notification.read && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            markAsRead(notification.id);
                                                                        }}
                                                                        className="text-gray-400 hover:text-gray-600 ml-2"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <p className={`text-sm ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}>
                                                                {notification.message}
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                {formatCreationDate(notification.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>

                        <div className="p-2 border-t border-gray-200 text-center">
                            <a
                                href="/notifications"
                                className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
                            >
                                Voir toutes les notifications
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}; 