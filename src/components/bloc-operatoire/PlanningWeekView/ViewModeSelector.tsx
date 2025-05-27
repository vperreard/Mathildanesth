'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Grid, List, Maximize2 } from 'lucide-react';

type ViewMode = 'grid' | 'list' | 'compact';

interface ViewModeSelectorProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    className?: string;
}

export const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({
    viewMode,
    onViewModeChange,
    className = ''
}) => {
    const modes = [
        { key: 'grid' as ViewMode, icon: Grid, label: 'Grille' },
        { key: 'list' as ViewMode, icon: List, label: 'Liste' },
        { key: 'compact' as ViewMode, icon: Maximize2, label: 'Compact' }
    ];

    return (
        <motion.div
            className={`flex items-center border border-gray-300 rounded-md ${className}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
        >
            {modes.map((mode, index) => {
                const Icon = mode.icon;
                const isActive = viewMode === mode.key;

                return (
                    <Button
                        key={mode.key}
                        variant={isActive ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => onViewModeChange(mode.key)}
                        className={`
              relative px-3 py-2 rounded-none
              ${index === 0 ? 'rounded-l-md' : ''}
              ${index === modes.length - 1 ? 'rounded-r-md' : ''}
              ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}
            `}
                        title={mode.label}
                    >
                        <Icon className="w-4 h-4" />
                        {isActive && (
                            <motion.div
                                className="absolute inset-0 bg-blue-600 rounded-md -z-10"
                                layoutId="activeMode"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </Button>
                );
            })}
        </motion.div>
    );
};

export default ViewModeSelector; 