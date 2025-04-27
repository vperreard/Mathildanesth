'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Définir les variantes de bouton basées sur les classes Tailwind existantes
export const buttonVariants = cva(
    "inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium text-sm shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
    {
        variants: {
            variant: {
                primary: "bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-md hover:-translate-y-0.5",
                secondary: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm",
                outline: "border border-primary-500 text-primary-600 hover:bg-primary-50",
                ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
                danger: "bg-red-500 hover:bg-red-600 text-white",
                default: "bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-md hover:-translate-y-0.5",
                destructive: "bg-red-500 hover:bg-red-600 text-white",
            },
            size: {
                sm: "px-3 py-1.5 text-xs",
                md: "px-4 py-2 text-sm",
                lg: "px-5 py-2.5 text-base",
                xl: "px-6 py-3 text-lg",
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
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, fullWidth, isLoading, children, ariaLabel, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, fullWidth, className }))}
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