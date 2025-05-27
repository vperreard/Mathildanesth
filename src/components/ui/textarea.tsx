'use client';

import React, { TextareaHTMLAttributes, forwardRef } from 'react';
import { VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Définir les variantes de textarea basées sur les classes Tailwind existantes
export const textareaVariants = cva(
    "px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm",
    {
        variants: {
            variant: {
                default: "",
                filled: "bg-gray-50 border-gray-200",
                outline: "bg-transparent border-2",
                error: "border-red-500 focus:ring-red-500 focus:border-red-500",
            },
            size: {
                sm: "px-2 py-1 text-xs",
                md: "px-3 py-2 text-sm",
                lg: "px-4 py-3 text-base",
            },
            fullWidth: {
                true: "w-full",
            },
            isDisabled: {
                true: "opacity-50 cursor-not-allowed bg-gray-100",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "md",
        },
    }
);

export interface TextareaProps
    extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    Omit<VariantProps<typeof textareaVariants>, 'isDisabled'> {
    error?: string;
    label?: string;
    ariaDescribedBy?: string;
    required?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, variant, size, fullWidth, disabled, error, label, ariaDescribedBy, required, ...props }, ref) => {
        // Si une erreur est présente, utilisez la variante d'erreur
        const variantToUse = error ? "error" : variant;
        const errorId = props.id ? `${props.id}-error` : undefined;
        const describedBy = [ariaDescribedBy, errorId].filter(Boolean).join(' ') || undefined;

        // Wrapper pour formulaire
        return (
            <div className="flex flex-col gap-1">
                {label && (
                    <label
                        htmlFor={props.id}
                        className="block text-sm font-medium text-gray-700"
                    >
                        {label}
                        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
                    </label>
                )}

                <div className="relative">
                    <textarea
                        className={cn(
                            textareaVariants({
                                variant: variantToUse,
                                size,
                                fullWidth,
                                isDisabled: disabled,
                                className
                            })
                        )}
                        ref={ref}
                        disabled={disabled}
                        aria-invalid={error ? "true" : "false"}
                        aria-describedby={describedBy}
                        aria-required={required}
                        {...props}
                    />
                </div>

                {error && (
                    <p
                        id={errorId}
                        className="mt-1 text-sm text-red-600"
                        role="alert"
                    >
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';

export { Textarea };
export default Textarea; 