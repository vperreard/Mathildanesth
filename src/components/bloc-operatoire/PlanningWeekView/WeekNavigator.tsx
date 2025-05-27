'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { format, addWeeks, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WeekNavigatorProps {
    currentWeek: Date;
    onWeekChange: (date: Date) => void;
    className?: string;
}

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({
    currentWeek,
    onWeekChange,
    className = ''
}) => {
    const handlePreviousWeek = () => {
        onWeekChange(subWeeks(currentWeek, 1));
    };

    const handleNextWeek = () => {
        onWeekChange(addWeeks(currentWeek, 1));
    };

    return (
        <motion.div
            className={`flex items-center space-x-2 ${className}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousWeek}
                className="p-2"
            >
                <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="text-center min-w-48">
                <div className="font-medium text-gray-900">
                    Semaine du {format(currentWeek, 'd MMMM yyyy', { locale: fr })}
                </div>
                <div className="text-sm text-gray-600">
                    {format(currentWeek, 'EEEE', { locale: fr })}
                </div>
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={handleNextWeek}
                className="p-2"
            >
                <ChevronRight className="w-4 h-4" />
            </Button>
        </motion.div>
    );
};

export default WeekNavigator; 