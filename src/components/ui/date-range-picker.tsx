'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import Button from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendrier';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerProps {
    value?: DateRange;
    onChange?: (range: DateRange | undefined) => void;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
}

export function DateRangePicker({
    value,
    onChange,
    className,
    placeholder = "Sélectionner une période",
    disabled = false,
}: DateRangePickerProps) {
    const [date, setDate] = React.useState<DateRange | undefined>(value);

    // Mettre à jour l'état local lorsque la prop value change
    React.useEffect(() => {
        setDate(value);
    }, [value]);

    const handleSelect = (range: DateRange | undefined) => {
        setDate(range);
        onChange?.(range);
    };

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date-range"
                        variant="outline"
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                        disabled={disabled}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "dd/MM/yyyy", { locale: fr })} - {format(date.to, "dd/MM/yyyy", { locale: fr })}
                                </>
                            ) : (
                                format(date.from, "dd/MM/yyyy", { locale: fr })
                            )
                        ) : (
                            placeholder
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={handleSelect}
                        numberOfMonths={2}
                        locale={fr}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}

export default DateRangePicker; 