declare module '@/components/ui/date-picker' {
    import { FC } from 'react';

    interface DatePickerProps {
        selected: Date | null;
        onSelect: (date: Date | null) => void;
        placeholder?: string;
        className?: string;
    }

    export const DatePickerComponent: FC<DatePickerProps>;
}

declare module 'sonner' {
    export const toast: {
        success: (message: string) => void;
        error: (message: string) => void;
        warning: (message: string) => void;
        info: (message: string) => void;
    };
} 