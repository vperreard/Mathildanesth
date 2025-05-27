'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';

// Composant de chargement pour la grille hebdomadaire
export const WeeklyGridSkeleton: React.FC = () => (
    <div className="space-y-4">
        {/* En-tête avec jours de la semaine */}
        <div className="grid grid-cols-8 gap-2">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 7 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
            ))}
        </div>

        {/* Grille des slots */}
        {Array.from({ length: 3 }, (_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-8 gap-2">
                <Skeleton className="h-16 w-full" />
                {Array.from({ length: 7 }, (_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        ))}
    </div>
);

// Composant de chargement pour les cartes d'affectation
export const AffectationCardSkeleton: React.FC = () => (
    <Card className="w-full">
        <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
            </div>
        </CardHeader>
        <CardContent className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-28" />
            <div className="flex space-x-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
            </div>
        </CardContent>
    </Card>
);

// Composant de chargement pour la liste des salles
export const RoomListSkeleton: React.FC = () => (
    <div className="space-y-3">
        {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center space-x-4 p-3 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-16" />
            </div>
        ))}
    </div>
);

// Composant de chargement rotatif avec message
export const SpinnerWithMessage: React.FC<{
    message?: string;
    size?: 'sm' | 'md' | 'lg';
}> = ({ message = 'Chargement...', size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-3 p-6">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
                <Loader2 className={`${sizeClasses[size]} text-blue-600`} />
            </motion.div>
            <p className="text-sm text-gray-600">{message}</p>
        </div>
    );
};

// Composant de chargement pour l'éditeur de trameModeles
export const TrameEditorSkeleton: React.FC = () => (
    <div className="space-y-6">
        {/* Barre d'outils */}
        <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-6 w-24" />
            </div>
            <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-24" />
            </div>
        </div>

        {/* Panel d'informations */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50">
            {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-12" />
                </div>
            ))}
        </div>

        {/* Grille principale */}
        <WeeklyGridSkeleton />
    </div>
);

// Composant de chargement pour le planning hebdomadaire
export const PlanningWeekSkeleton: React.FC = () => (
    <div className="space-y-4">
        {/* En-tête avec navigation */}
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-8 w-8" />
            </div>
            <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-16" />
            </div>
        </div>

        {/* Grille du planning */}
        <WeeklyGridSkeleton />
    </div>
);

// Composant de chargement pour les données
export const DataLoadingSkeleton: React.FC<{
    rows?: number;
    cols?: number;
}> = ({ rows = 5, cols = 3 }) => (
    <div className="space-y-4">
        {Array.from({ length: rows }, (_, rowIndex) => (
            <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {Array.from({ length: cols }, (_, colIndex) => (
                    <Skeleton key={colIndex} className="h-12 w-full" />
                ))}
            </div>
        ))}
    </div>
);

// États de chargement avec animations
export const AnimatedLoadingDots: React.FC = () => (
    <div className="flex space-x-1 justify-center items-center">
        {[0, 1, 2].map((i) => (
            <motion.div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.2
                }}
            />
        ))}
    </div>
);

// Composant de rafraîchissement
export const RefreshIndicator: React.FC<{
    isRefreshing?: boolean;
    onRefresh?: () => void;
}> = ({ isRefreshing = false, onRefresh }) => (
    <motion.div
        className="cursor-pointer p-2 rounded-full hover:bg-gray-100 transition-colors"
        animate={isRefreshing ? { rotate: 360 } : {}}
        transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}
        onClick={onRefresh}
    >
        <RefreshCw className="w-4 h-4 text-gray-600" />
    </motion.div>
);

// État de chargement pour les conflits
export const ConflictLoadingSkeleton: React.FC = () => (
    <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 border-l-4 border-yellow-400 bg-yellow-50 rounded">
                <Skeleton className="h-5 w-5 rounded" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                </div>
            </div>
        ))}
    </div>
);

// Composant wrapper pour gérer tous les états de chargement
export const LoadingStateManager: React.FC<{
    isLoading: boolean;
    loadingType: 'grid' | 'editor' | 'planning' | 'rooms' | 'conflicts' | 'data';
    children: React.ReactNode;
    message?: string;
}> = ({ isLoading, loadingType, children, message }) => {
    if (!isLoading) {
        return <>{children}</>;
    }

    const LoadingComponent = {
        grid: WeeklyGridSkeleton,
        editor: TrameEditorSkeleton,
        planning: PlanningWeekSkeleton,
        rooms: RoomListSkeleton,
        conflicts: ConflictLoadingSkeleton,
        data: DataLoadingSkeleton
    }[loadingType];

    return (
        <div className="relative">
            {message && (
                <div className="mb-4 text-center">
                    <SpinnerWithMessage message={message} />
                </div>
            )}
            <LoadingComponent />
        </div>
    );
}; 