'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface NotificationProps {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    duration?: number;
    onClose: (id: string) => void;
    action?: React.ReactNode;
}

const icons = {
    info: <Info className="h-5 w-5 text-blue-500" />,
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
};

const bgColors = {
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-amber-50 border-amber-200',
    error: 'bg-red-50 border-red-200',
};

export const Notification = ({
    id,
    type = 'info',
    title,
    message,
    duration = 5000,
    onClose,
    action,
}: NotificationProps) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(() => onClose(id), 300);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, id, onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                        'pointer-events-auto w-full max-w-sm rounded-lg border p-4 shadow-md',
                        bgColors[type]
                    )}
                >
                    <div className="flex items-start">
                        <div className="flex-shrink-0">{icons[type]}</div>
                        <div className="ml-3 w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">{title}</p>
                            <p className="mt-1 text-sm text-gray-600">{message}</p>
                            {action && <div className="mt-3">{action}</div>}
                        </div>
                        <button
                            type="button"
                            className="ml-2 inline-flex rounded-md bg-transparent text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            onClick={() => {
                                setIsVisible(false);
                                setTimeout(() => onClose(id), 300);
                            }}
                        >
                            <span className="sr-only">Fermer</span>
                            <X className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Gestionnaire de notifications pour gérer plusieurs notifications
interface NotificationManagerProps {
    children: React.ReactNode;
}

interface NotificationContextProps {
    showNotification: (props: Omit<NotificationProps, 'id' | 'onClose'>) => string;
    closeNotification: (id: string) => void;
}

export const NotificationContext = React.createContext<NotificationContextProps | undefined>(undefined);

export const useNotification = () => {
    const context = React.useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification doit être utilisé dans un NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }: NotificationManagerProps) => {
    const [notifications, setNotifications] = useState<NotificationProps[]>([]);

    const showNotification = (props: Omit<NotificationProps, 'id' | 'onClose'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications((prev) => [...prev, { ...props, id, onClose: closeNotification }]);
        return id;
    };

    const closeNotification = (id: string) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ showNotification, closeNotification }}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col space-y-3 pointer-events-none">
                {notifications.map((notification) => (
                    <Notification key={notification.id} {...notification} />
                ))}
            </div>
        </NotificationContext.Provider>
    );
}; 