import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
/**
 * Fusionne les classes Tailwind intelligemment en évitant les conflits
 */
export function cn() {
    var inputs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        inputs[_i] = arguments[_i];
    }
    return twMerge(clsx(inputs));
}
