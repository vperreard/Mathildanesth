'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '../../lib/logger';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
// import { useNotifications } from '../../hooks/useNotifications'; // Temporairement désactivé
import { useAuth } from '../../hooks/useAuth';
import Cookies from 'js-cookie';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  // Temporairement désactivé pour éviter les erreurs
  // const { sendNotification } = useNotifications();
  const { user } = useAuth();

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) {
      // Ne pas essayer de récupérer les notifications si l'utilisateur n'est pas connecté
      return;
    }

    try {
      const apiBaseUrl = window.location.origin;
      const token = Cookies.get('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await fetch(`${apiBaseUrl}/api/notifications`, {
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          logger.warn("Erreur d'authentification lors de la récupération des notifications");
          return;
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const notifications = data?.notifications || [];
      setNotifications(notifications);
      setUnreadCount(notifications.filter((n: Notification) => !n.read).length);
    } catch (error: unknown) {
      logger.error('Erreur lors de la récupération des notifications:', { error: error });
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const markAsRead = async (id: number) => {
    if (!user) return;

    try {
      const apiBaseUrl = window.location.origin;
      const token = Cookies.get('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await fetch(`${apiBaseUrl}/api/notifications/${id}/read`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: unknown) {
      logger.error('Erreur lors du marquage de la notification:', { error: error });
    }
  };

  const clearAll = async () => {
    if (!user) return;

    try {
      const apiBaseUrl = window.location.origin;
      const token = Cookies.get('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await fetch(`${apiBaseUrl}/api/notifications/clear`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      setNotifications([]);
      setUnreadCount(0);
    } catch (error: unknown) {
      logger.error('Erreur lors de la suppression des notifications:', { error: error });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:text-blue-600 focus:outline-none"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 max-w-full bg-white rounded-lg shadow-lg z-50"
          >
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">Notifications</h3>
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-xs text-gray-500 hover:text-gray-700">
                  Tout effacer
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">Aucune notification</div>
              ) : (
                notifications.map(notification => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`p-4 border-b hover:bg-gray-50 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{notification.title}</h4>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
