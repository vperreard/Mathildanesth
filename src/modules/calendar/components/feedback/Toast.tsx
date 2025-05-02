import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose?: () => void;
    action?: {
        label: string;
        onClick: () => void;
    };
    icon?: React.ReactNode;
}

/**
 * Composant Toast pour afficher des messages de confirmation ou d'erreur
 */
export const Toast: React.FC<ToastProps> = ({
    message,
    type = 'info',
    duration = 4000,
    onClose,
    action,
    icon
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isLeaving, setIsLeaving] = useState(false);

    // Définir les classes en fonction du type
    const typeClasses = {
        success: 'bg-green-50 border-green-400 text-green-800',
        error: 'bg-red-50 border-red-400 text-red-800',
        warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
        info: 'bg-blue-50 border-blue-400 text-blue-800'
    }[type];

    // Icônes par défaut pour chaque type
    const defaultIcons = {
        success: (
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
        ),
        error: (
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
        ),
        warning: (
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM10 17a1 1 0 100-2 1 1 0 000 2zm0-2a1 1 0 011-1h-2a1 1 0 011 1zm1-3a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V4a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
        ),
        info: (
            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
        )
    };

    // Gérer la fermeture du toast
    const handleClose = useCallback(() => {
        setIsLeaving(true);
        setTimeout(() => {
            setIsVisible(false);
            if (onClose) onClose();
        }, 300); // Durée de l'animation de sortie
    }, [onClose]);

    // Fermer automatiquement après la durée spécifiée
    useEffect(() => {
        if (duration !== Infinity) {
            const timer = setTimeout(handleClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, handleClose]);

    // Ne rien rendre si le toast n'est pas visible
    if (!isVisible) {
        return null;
    }

    return (
        <div
            className={`fixed bottom-4 right-4 z-50 flex items-center p-4 rounded shadow-lg border-l-4 max-w-md transform transition-all duration-300 ease-in-out ${typeClasses} ${isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
                }`}
            role="alert"
        >
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    {icon || defaultIcons[type]}
                </div>
                <div className="ml-3">
                    <p className="text-sm font-medium">{message}</p>
                </div>
            </div>
            {action && (
                <div className="ml-4">
                    <button
                        onClick={action.onClick}
                        className={`text-sm font-medium underline hover:opacity-75 ${type === 'success' ? 'text-green-700' :
                                type === 'error' ? 'text-red-700' :
                                    type === 'warning' ? 'text-yellow-700' : 'text-blue-700'
                            }`}
                    >
                        {action.label}
                    </button>
                </div>
            )}
            <button
                onClick={handleClose}
                className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 hover:bg-opacity-20 hover:bg-gray-500"
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="sr-only">Fermer</span>
            </button>
        </div>
    );
};

/**
 * Hook personnalisé pour gérer les toasts
 */
export const useToast = () => {
    const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);

    // Ajouter un toast
    const addToast = useCallback((toast: ToastProps) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { ...toast, id }]);
        return id;
    }, []);

    // Supprimer un toast par ID
    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    // Méthodes d'ajout de toast par type
    const showSuccess = useCallback((message: string, options?: Omit<ToastProps, 'message' | 'type'>) => {
        return addToast({ message, type: 'success', ...options });
    }, [addToast]);

    const showError = useCallback((message: string, options?: Omit<ToastProps, 'message' | 'type'>) => {
        return addToast({ message, type: 'error', ...options });
    }, [addToast]);

    const showWarning = useCallback((message: string, options?: Omit<ToastProps, 'message' | 'type'>) => {
        return addToast({ message, type: 'warning', ...options });
    }, [addToast]);

    const showInfo = useCallback((message: string, options?: Omit<ToastProps, 'message' | 'type'>) => {
        return addToast({ message, type: 'info', ...options });
    }, [addToast]);

    // Rendu des toasts
    const ToastContainer = useCallback(() => {
        if (typeof document === 'undefined') return null;

        return createPortal(
            <>
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        duration={toast.duration}
                        action={toast.action}
                        icon={toast.icon}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </>,
            document.body
        );
    }, [toasts, removeToast]);

    return {
        addToast,
        removeToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        ToastContainer
    };
};

export default Toast; 