'use client';

import React, { useState } from 'react';
import { useNotificationsWebSocket } from '@/hooks/useNotificationsWebSocket';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Check, Bell, X, Clock, ExternalLink, Filter } from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
    const {
        notifications,
        unreadCount,
        isLoading,
        error,
        markAsRead,
        markAllAsRead,
        refresh
    } = useNotificationsWebSocket({ autoConnect: true });

    // Fonction pour formater la date relative
    const formatRelativeTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return formatDistanceToNow(date, { addSuffix: true, locale: fr });
        } catch (err: unknown) {
            return 'Date inconnue';
        }
    };

    // Fonction pour obtenir l'icône en fonction du type de notification
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS':
                return <Check className="h-5 w-5 text-green-500" />;
            case 'WARNING':
                return <Clock className="h-5 w-5 text-amber-500" />;
            case 'ERROR':
                return <X className="h-5 w-5 text-red-500" />;
            case 'INFO':
            default:
                return <Bell className="h-5 w-5 text-blue-500" />;
        }
    };

    // Filtrer les notifications selon le critère sélectionné
    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'unread') return !notification.isRead;
        if (filter === 'read') return notification.isRead;
        return true; // 'all'
    });

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Notifications
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                    Consultez toutes vos notifications et restez informé des activités importantes.
                </p>
            </header>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden mb-6">
                <div className="p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center space-x-2">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                            Vos notifications
                        </h2>
                        {unreadCount > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300">
                                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center space-x-2">
                            <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as 'all' | 'unread' | 'read')}
                                className="block w-full py-2 pl-3 pr-10 text-base border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                            >
                                <option value="all">Toutes</option>
                                <option value="unread">Non lues</option>
                                <option value="read">Lues</option>
                            </select>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => refresh()}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-slate-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-white bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                Actualiser
                            </button>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                >
                                    Tout marquer comme lu
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 dark:border-slate-600 border-t-primary-600" />
                        <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des notifications...</p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="p-8 text-center">
                        <Bell className="h-12 w-12 mx-auto text-gray-300 dark:text-slate-600" />
                        <p className="mt-4 text-gray-600 dark:text-gray-300">
                            {filter === 'all'
                                ? "Vous n'avez aucune notification pour le moment."
                                : filter === 'unread'
                                    ? "Vous n'avez aucune notification non lue."
                                    : "Vous n'avez aucune notification lue."}
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-slate-700">
                        {filteredNotifications.map((notification) => (
                            <li key={notification.id} className={`relative ${!notification.isRead ? 'bg-blue-50 dark:bg-slate-700/50' : ''}`}>
                                <div className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 mt-1">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <div className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                                                {notification.message}
                                            </div>

                                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {formatRelativeTime(notification.createdAt)}
                                                    </span>
                                                    {notification.triggeredByUser && (
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            Par <span className="font-medium">{notification.triggeredByUser.login}</span>
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex space-x-3">
                                                    {!notification.isRead && (
                                                        <button
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="text-xs sm:text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                                                        >
                                                            Marquer comme lu
                                                        </button>
                                                    )}

                                                    {notification.link && (
                                                        <Link
                                                            href={notification.link}
                                                            className="text-xs sm:text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium flex items-center"
                                                            onClick={() => !notification.isRead && markAsRead(notification.id)}
                                                        >
                                                            <span>Voir le détail</span>
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
        </div>
    );
} 