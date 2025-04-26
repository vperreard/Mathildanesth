'use client';

import React, { forwardRef, HTMLAttributes } from 'react';
import { VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Définir les variantes de carte basées sur les classes Tailwind existantes
export const cardVariants = cva(
    "rounded-xl shadow-soft border border-gray-100 p-6 bg-white",
    {
        variants: {
            variant: {
                default: "",
                outline: "shadow-none border-2 border-gray-200",
                filled: "bg-primary-50 border-primary-100",
                elevated: "shadow-lg hover:shadow-xl transition-shadow duration-300",
            },
            size: {
                sm: "p-4",
                md: "p-6",
                lg: "p-8",
            },
            fullWidth: {
                true: "w-full",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "md",
        },
    }
);

export interface CardProps
    extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
    ariaLabel?: string;
    ariaDescribedBy?: string;
}

// Composant Card
const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant, size, fullWidth, children, ariaLabel, ariaDescribedBy, ...props }, ref) => {
        return (
            <div
                className={cn(cardVariants({ variant, size, fullWidth, className }))}
                ref={ref}
                role="article"
                aria-label={ariaLabel}
                aria-describedby={ariaDescribedBy}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

// Composant CardHeader
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> { }

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <header
                className={cn("mb-4", className)}
                ref={ref}
                {...props}
            >
                {children}
            </header>
        );
    }
);

CardHeader.displayName = 'CardHeader';

// Composant CardTitle
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> { }

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <h3
                className={cn("text-lg font-semibold text-gray-900", className)}
                ref={ref}
                {...props}
            >
                {children}
            </h3>
        );
    }
);

CardTitle.displayName = 'CardTitle';

// Composant CardDescription
interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> { }

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <p
                className={cn("text-sm text-gray-600 mt-1", className)}
                ref={ref}
                {...props}
            >
                {children}
            </p>
        );
    }
);

CardDescription.displayName = 'CardDescription';

// Composant CardContent
interface CardContentProps extends HTMLAttributes<HTMLDivElement> { }

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <main
                className={cn("py-2", className)}
                ref={ref}
                {...props}
            >
                {children}
            </main>
        );
    }
);

CardContent.displayName = 'CardContent';

// Composant CardFooter
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> { }

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <footer
                className={cn("pt-4 flex justify-end items-center gap-2", className)}
                ref={ref}
                {...props}
            >
                {children}
            </footer>
        );
    }
);

CardFooter.displayName = 'CardFooter';

export {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter
}; 