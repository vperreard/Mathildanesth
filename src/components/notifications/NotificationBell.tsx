'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, ExternalLink, Clock } from 'lucide-react';
import { useNotificationsWebSocket, Notification } from '@/hooks/useNotificationsWebSocket';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

interface NotificationBellProps {
    className?: string;
    limit?: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
    className = '',
    limit = 10
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const {
        notifications,
        unreadCount,
        isLoading,
        error,
        markAsRead,
        markAllAsRead,
        refresh
    } = useNotificationsWebSocket({ autoConnect: true });

    // Ferme le panneau quand on clique à l'extérieur
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node) && isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Fonction pour formater la date relative
    const formatRelativeTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return formatDistanceToNow(date, { addSuffix: true, locale: fr });
        } catch (err) {
            return 'Date inconnue';
        }
    };

    // Fonction pour obtenir la couleur en fonction du type de notification
    const getNotificationTypeColor = (type: string) => {
        switch (type) {
            case 'SUCCESS':
                return 'bg-green-50 text-green-700 border-green-200';
            case 'WARNING':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'ERROR':
                return 'bg-red-50 text-red-700 border-red-200';
            case 'INFO':
            default:
                return 'bg-blue-50 text-blue-700 border-blue-200';
        }
    };

    // Fonction pour obtenir l'icône en fonction du type de notification
    const getNotificationIcon = (notification: Notification) => {
        switch (notification.type) {
            case 'SUCCESS':
                return <Check className="h-4 w-4 text-green-500" />;
            case 'WARNING':
                return <Clock className="h-4 w-4 text-amber-500" />;
            case 'ERROR':
                return <X className="h-4 w-4 text-red-500" />;
            case 'INFO':
            default:
                return <Bell className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <div className={`relative ${className}`} ref={panelRef}>
            {/* Bouton de notification avec badge */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
                aria-label="Notifications"
            >
                <Bell className="h-7 w-7 text-gray-600" />

                {/* Badge compteur de notifications */}
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Panneau de notifications */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg overflow-hidden z-50 border border-gray-200"
                    >
                        {/* En-tête du panneau */}
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => refresh()}
                                        className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
                                        aria-label="Rafraîchir"
                                    >
                                        Actualiser
                                    </button>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-sm text-blue-500 hover:text-blue-700 focus:outline-none"
                                            aria-label="Tout marquer comme lu"
                                        >
                                            Tout marquer comme lu
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Corps du panneau */}
                        <div className="max-h-96 overflow-y-auto">
                            {isLoading ? (
                                <div className="p-4 text-center text-gray-500">
                                    Chargement des notifications...
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">
                                    <Bell className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                    <p>Aucune notification pour le moment</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-200">
                                    {notifications.map((notification) => (
                                        <li key={notification.id} className={`relative ${notification.isRead ? '' : 'bg-blue-50'}`}>
                                            <div className="p-4 hover:bg-gray-50 transition-colors">
                                                {/* Contenu de la notification */}
                                                <div className="flex items-start">
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        {getNotificationIcon(notification)}
                                                    </div>
                                                    <div className="ml-3 flex-1">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {notification.message}
                                                        </div>
                                                        <div className="mt-1 flex items-center justify-between">
                                                            <span className="text-xs text-gray-500">
                                                                {formatRelativeTime(notification.createdAt)}
                                                            </span>

                                                            {/* Actions */}
                                                            <div className="flex space-x-2">
                                                                {!notification.isRead && (
                                                                    <button
                                                                        onClick={() => markAsRead(notification.id)}
                                                                        className="text-xs text-blue-500 hover:text-blue-700"
                                                                    >
                                                                        Marquer comme lu
                                                                    </button>
                                                                )}

                                                                {notification.link && (
                                                                    <Link
                                                                        href={notification.link}
                                                                        className="text-xs text-blue-500 hover:text-blue-700 flex items-center"
                                                                        onClick={() => !notification.isRead && markAsRead(notification.id)}
                                                                    >
                                                                        <span>Voir</span>
                                                                        <ExternalLink className="ml-1 h-3 w-3" />
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Pied du panneau avec lien vers toutes les notifications */}
                        <div className="p-3 bg-gray-50 border-t border-gray-200">
                            <Link
                                href="/notifications"
                                className="block w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                                onClick={() => setIsOpen(false)}
                            >
                                Voir toutes les notifications
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}; 