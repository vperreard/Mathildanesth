import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { cn } from '@/lib/utils';

interface DatePickerProps {
    selected: Date | null;
    onSelect: (date: Date | null) => void;
    placeholder?: string;
    className?: string;
}

export const DatePickerComponent: React.FC<DatePickerProps> = ({
    selected,
    onSelect,
    placeholder = 'Sélectionner une date',
    className,
}) => {
    return (
        <DatePicker
            selected={selected}
            onChange={onSelect}
            className={cn(
                'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
            placeholderText={placeholder}
            dateFormat="dd/MM/yyyy"
        />
    );
};

// Export avec l'alias attendu
export { DatePickerComponent as DatePicker };
export default DatePickerComponent; 