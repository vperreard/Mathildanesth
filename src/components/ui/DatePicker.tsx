import React from 'react';
import DatePickerLib from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DatePickerProps {
    selected: Date | null;
    onChange: (date: Date | null) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    minDate?: Date;
    maxDate?: Date;
}

const DatePicker: React.FC<DatePickerProps> = ({
    selected,
    onChange,
    placeholder = 'Sélectionner une date',
    className,
    disabled = false,
    minDate,
    maxDate,
}) => {
    return (
        <DatePickerLib
            selected={selected}
            onChange={onChange}
            locale={fr}
            dateFormat="dd/MM/yyyy"
            placeholderText={placeholder}
            disabled={disabled}
            minDate={minDate}
            maxDate={maxDate}
            className={cn(
                'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
        />
    );
};

export default DatePicker; 