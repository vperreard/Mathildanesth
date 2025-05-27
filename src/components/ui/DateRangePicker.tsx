'use client';

import * as React from 'react';
import { useMemo, useCallback, memo } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import Button from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendrier';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

export interface DateRangePickerProps {
    value?: DateRange;
    onChange?: (date: DateRange | undefined) => void;
    placeholder?: string;
    className?: string;
    showCompactLabels?: boolean;
}

// Mémoïsation du composant Calendar pour éviter les re-rendus inutiles
const MemoizedCalendar = memo(({
    selected,
    defaultMonth,
    onSelect
}: {
    selected?: DateRange;
    defaultMonth?: Date;
    onSelect?: (range: DateRange | undefined) => void;
}) => (
    <Calendar
        initialFocus
        mode="range"
        defaultMonth={defaultMonth}
        selected={selected}
        onSelect={onSelect}
        numberOfMonths={2}
        locale={fr}
        classNames={{
            caption_label: 'text-sm font-medium',
            caption_dropdowns: 'flex justify-center gap-1',
            dropdown: 'border border-input rounded-md p-1 flex flex-col gap-1',
            vhidden: 'hidden',
        }}
    />
));

MemoizedCalendar.displayName = 'MemoizedCalendar';

export const DateRangePicker = memo(({
    value,
    onChange,
    placeholder = 'Sélectionner une période',
    className,
    showCompactLabels = false,
}: DateRangePickerProps) => {
    // Formatage des dates pour l'affichage, mémoïsé pour éviter des recalculs inutiles
    const formatDate = useCallback((date: Date) => {
        if (showCompactLabels) {
            return format(date, 'dd/MM/yy');
        }
        return format(date, 'PPP', { locale: fr });
    }, [showCompactLabels]);

    // Préparer le texte à afficher dans le bouton de sélection, mémoïsé pour éviter des recalculs
    const buttonText = useMemo(() => {
        if (!value?.from) {
            return placeholder;
        }

        if (!value.to) {
            return formatDate(value.from);
        }

        return `${formatDate(value.from)} - ${formatDate(value.to)}`;
    }, [value, placeholder, formatDate]);

    // Handler mémoïsé pour le changement de date
    const handleDateChange = useCallback((range: DateRange | undefined) => {
        if (onChange) {
            onChange(range);
        }
    }, [onChange]);

    return (
        <div className={cn('grid gap-2', className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant="outline"
                        className={cn(
                            'w-full justify-start text-left font-normal',
                            !value && 'text-muted-foreground'
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {buttonText}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                    <MemoizedCalendar
                        selected={value}
                        defaultMonth={value?.from}
                        onSelect={handleDateChange}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
});

DateRangePicker.displayName = 'DateRangePicker'; 