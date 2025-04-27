'use client';

import React from 'react';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { Save, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface UnsavedChangesIndicatorProps {
    className?: string;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'floating';
    onSave?: () => void;
}

const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'floating': 'bottom-4 right-4',
};

export const UnsavedChangesIndicator: React.FC<UnsavedChangesIndicatorProps> = ({
    className,
    position = 'floating',
    onSave,
}) => {
    const { hasUnsavedChanges, markAsSaved } = useUnsavedChanges();

    if (!hasUnsavedChanges) {
        return null;
    }

    const handleSave = () => {
        onSave?.();
        if (!onSave) {
            markAsSaved();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
                'fixed z-50 flex items-center shadow-lg bg-amber-50 border border-amber-200 p-3 rounded-lg',
                position === 'floating' && 'shadow-xl',
                positionClasses[position],
                className
            )}
        >
            <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
            <span className="text-sm font-medium">Modifications non sauvegardées</span>
            {onSave && (
                <button
                    onClick={handleSave}
                    className="ml-3 flex items-center justify-center px-3 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 transition-colors"
                >
                    <Save className="h-3 w-3 mr-1" />
                    Sauvegarder
                </button>
            )}
        </motion.div>
    );
};

// Indicateur compact pour les formulaires
export const FormUnsavedIndicator: React.FC<{ className?: string }> = ({ className }) => {
    const { hasUnsavedChanges } = useUnsavedChanges();

    if (!hasUnsavedChanges) {
        return null;
    }

    return (
        <div className={cn('flex items-center text-amber-600 px-2 text-sm', className)}>
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>Non sauvegardé</span>
        </div>
    );
}; 