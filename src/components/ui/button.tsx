'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Définir les variantes de bouton basées sur les classes Tailwind existantes
export const buttonVariants = cva(
    "inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium text-sm shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
    {
        variants: {
            variant: {
                default: "bg-gradient-to-r from-primary-500 via-secondary-500 to-tertiary-500 text-white hover:shadow-md hover:-translate-y-0.5",
                primary: "bg-gradient-to-r from-primary-500 via-secondary-500 to-tertiary-500 text-white hover:shadow-md hover:-translate-y-0.5",
                secondary: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-600 dark:hover:border-slate-500",
                outline: "border border-primary-500 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:border-primary-500 dark:hover:bg-primary-500/[.15] dark:hover:text-primary-300",
                ghost: "bg-transparent hover:bg-gray-100 text-gray-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100",
                danger: "bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700",
                destructive: "bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700",
                subtle: "bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:shadow-md hover:-translate-y-0.5",
            },
            size: {
                sm: "px-3 py-1.5 text-xs",
                md: "px-4 py-2 text-sm",
                lg: "px-5 py-2.5 text-base",
                xl: "px-6 py-3 text-lg",
                icon: "h-9 w-9",
            },
            fullWidth: {
                true: "w-full",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "md",
        },
    }
);

export interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    isLoading?: boolean;
    ariaLabel?: string;
    asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, fullWidth, isLoading, children, ariaLabel, asChild, ...props }, ref) => {
        const Comp = asChild ? React.Fragment : 'button';

        if (asChild && React.isValidElement(children)) {
            return React.cloneElement(children, {
                className: cn(buttonVariants({ variant, size, fullWidth }), className, children.props.className),
                ref: ref,
                disabled: isLoading || props.disabled || children.props.disabled,
                'aria-label': ariaLabel || children.props['aria-label'],
                'aria-busy': isLoading || children.props['aria-busy'],
                'aria-disabled': isLoading || props.disabled || children.props['aria-disabled'],
                ...props,
                ...children.props,
            } as any);
        }

        return (
            <button
                className={cn(buttonVariants({ variant, size, fullWidth }), className)}
                ref={ref}
                disabled={isLoading || props.disabled}
                aria-label={ariaLabel}
                aria-busy={isLoading}
                aria-disabled={isLoading || props.disabled}
                role="button"
                tabIndex={0}
                {...props}
            >
                {isLoading ? (
                    <div className="flex items-center" aria-hidden="true">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Chargement...</span>
                    </div>
                ) : (
                    children
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
export { Button }; 