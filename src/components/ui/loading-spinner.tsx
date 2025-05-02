"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps {
    className?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    variant?: "primary" | "secondary" | "white";
}

const sizeClasses = {
    xs: "h-3 w-3 border-[1.5px]",
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-[3px]",
    xl: "h-12 w-12 border-4"
};

const variantClasses = {
    primary: "border-blue-600 border-t-transparent",
    secondary: "border-gray-600 border-t-transparent",
    white: "border-white border-t-transparent"
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    className,
    size = "md",
    variant = "primary"
}) => {
    return (
        <div
            className={cn(
                "inline-block animate-spin rounded-full",
                sizeClasses[size],
                variantClasses[variant],
                className
            )}
            role="status"
            aria-label="Chargement"
        >
            <span className="sr-only">Chargement...</span>
        </div>
    );
};

export default LoadingSpinner; 