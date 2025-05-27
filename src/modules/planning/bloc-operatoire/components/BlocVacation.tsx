'use client';

import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, UserCheck } from 'lucide-react';

interface BlocVacationProps {
    title: string;
    status: 'OPEN' | 'CLOSED';
    surgeon?: { id: string; name: string; };
    mar?: { id: string; name: string; };
    iade?: { id: string; name: string; };
    onClick?: () => void;
    notes?: string;
}

/**
 * Composant pour afficher une vacation de bloc opératoire (demi-journée)
 */
export default function BlocVacation({
    title,
    status,
    surgeon,
    mar,
    iade,
    onClick,
    notes
}: BlocVacationProps) {
    return (
        <Card
            className={`w-full cursor-pointer hover:shadow-md transition-shadow ${status === 'CLOSED' ? 'bg-gray-100 dark:bg-slate-900' : 'bg-white dark:bg-slate-800'
                }`}
            onClick={onClick}
        >
            <CardContent className="p-3">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium">{title}</h3>
                    <Badge variant={status === 'OPEN' ? 'success' : 'secondary'}>
                        {status === 'OPEN' ? 'Ouverte' : 'Fermée'}
                    </Badge>
                </div>

                <div className="space-y-1.5 mt-2">
                    {surgeon && (
                        <div className="flex items-center text-xs">
                            <User className="h-3 w-3 mr-1 text-blue-500" />
                            <span className="truncate">{surgeon.name}</span>
                        </div>
                    )}

                    {mar && (
                        <div className="flex items-center text-xs">
                            <UserCheck className="h-3 w-3 mr-1 text-emerald-500" />
                            <span className="truncate">MAR: {mar.name}</span>
                        </div>
                    )}

                    {iade && (
                        <div className="flex items-center text-xs">
                            <UserCheck className="h-3 w-3 mr-1 text-purple-500" />
                            <span className="truncate">IADE: {iade.name}</span>
                        </div>
                    )}

                    {!surgeon && !mar && !iade && status === 'OPEN' && (
                        <div className="text-xs text-muted-foreground italic">
                            Aucun personnel assigné
                        </div>
                    )}

                    {status === 'CLOSED' && (
                        <div className="text-xs text-muted-foreground italic">
                            Vacation fermée
                        </div>
                    )}
                </div>
            </CardContent>

            {notes && (
                <CardFooter className="px-3 py-1.5 border-t text-xs text-muted-foreground">
                    {notes.length > 40 ? `${notes.substring(0, 40)}...` : notes}
                </CardFooter>
            )}
        </Card>
    );
}