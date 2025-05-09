'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    className?: string;
    titleClassName?: string;
    descriptionClassName?: string;
    actionsClassName?: string;
}

export function PageHeader({
    title,
    description,
    actions,
    className,
    titleClassName,
    descriptionClassName,
    actionsClassName,
}: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col md:flex-row md:items-center justify-between mb-6 py-3", className)}>
            <div className="flex flex-col gap-1">
                <h1 className={cn("text-2xl font-bold tracking-tight bg-gradient-to-r from-primary-600 via-secondary-600 to-tertiary-600 bg-clip-text text-transparent dark:text-gray-100", titleClassName)}>
                    {title}
                </h1>
                {description && (
                    <p className={cn("text-gray-500 dark:text-slate-400", descriptionClassName)}>
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className={cn("mt-4 md:mt-0 space-x-2 flex items-center", actionsClassName)}>
                    {actions}
                </div>
            )}
        </div>
    );
}

export default PageHeader; 