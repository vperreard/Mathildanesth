import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Fusionne les classes Tailwind intelligemment en évitant les conflits
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
} 