'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
    Calendar, 
    Clock, 
    Moon, 
    Sun,
    Activity,
    TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatItem {
    label: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

interface MedicalQuickStatsProps {
    stats: {
        totalShifts: number;
        gardes24h: number;
        astreintes: number;
        bloc: number;
        conges: number;
        urgent: number;
        needReplacement: number;
    };
    className?: string;
}

export default function MedicalQuickStats({ stats, className }: MedicalQuickStatsProps) {
    const statItems: StatItem[] = [
        {
            label: "Cette semaine",
            value: stats.totalShifts,
            icon: Calendar,
            color: "text-blue-600 dark:text-blue-400",
        },
        {
            label: "Gardes 24h",
            value: stats.gardes24h,
            icon: Moon,
            color: "text-red-600 dark:text-red-400",
        },
        {
            label: "Astreintes",
            value: stats.astreintes,
            icon: Clock,
            color: "text-orange-600 dark:text-orange-400",
        },
        {
            label: "Bloc opératoire",
            value: stats.bloc,
            icon: Activity,
            color: "text-purple-600 dark:text-purple-400",
        }
    ];

    return (
        <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-4", className)}>
            {statItems.map((item, index) => {
                const Icon = item.icon;
                return (
                    <Card key={index} className="overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        {item.label}
                                    </p>
                                    <p className="text-2xl font-bold mt-1">
                                        {item.value}
                                    </p>
                                    {item.trend && (
                                        <div className={cn(
                                            "flex items-center text-xs mt-1",
                                            item.trend.isPositive 
                                                ? "text-green-600 dark:text-green-400" 
                                                : "text-red-600 dark:text-red-400"
                                        )}>
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            {item.trend.value}%
                                        </div>
                                    )}
                                </div>
                                <Icon className={cn("h-8 w-8 opacity-20", item.color)} />
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}