'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionTitleProps {
    title: string;
    icon?: ReactNode;
    className?: string;
    children?: ReactNode;
    description?: string;
}

export function SectionTitle({
    title,
    icon,
    className,
    children,
    description
}: SectionTitleProps) {
    return (
        <div className={cn("mb-6", className)}>
            <div className="flex items-center gap-2">
                {icon && (
                    <div className="text-primary-600 dark:text-primary-400">
                        {icon}
                    </div>
                )}
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-tertiary-600 bg-clip-text text-transparent dark:text-gray-100">
                    {title}
                </h2>
            </div>
            {description && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
            {children && <div className="mt-2">{children}</div>}
        </div>
    );
}

export default SectionTitle; 