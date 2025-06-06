'use client';

import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
    // Définir les classes de taille max-w-* en fonction du paramètre size
    const sizeClasses = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
    };

    const maxWidthClass = sizeClasses[size] || 'sm:max-w-md';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose}></div>
                <div className={`relative w-full ${maxWidthClass} transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all`}>
                    <div className="text-lg font-medium leading-6 text-gray-900 mb-4">
                        {title}
                    </div>
                    <div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}