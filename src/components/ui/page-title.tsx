'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import Button from '@/components/ui/button';

interface PageTitleProps {
    title: string;
    description?: string;
    backUrl?: string;
    actions?: React.ReactNode;
}

/**
 * Composant pour les titres de page avec description optionnelle et bouton de retour
 */
export function PageTitle({ title, description, backUrl, actions }: PageTitleProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
                {backUrl && (
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="mb-2 p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
                    >
                        <Link href={backUrl}>
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Retour
                        </Link>
                    </Button>
                )}
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {description && (
                    <p className="text-muted-foreground">{description}</p>
                )}
            </div>

            {actions && (
                <div className="flex items-center gap-2 mt-2 md:mt-0">
                    {actions}
                </div>
            )}
        </div>
    );
} 