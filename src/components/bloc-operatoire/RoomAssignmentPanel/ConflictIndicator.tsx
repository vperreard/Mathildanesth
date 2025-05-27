'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    AlertTriangle,
    X,
    Clock,
    Users,
    MapPin,
    Info
} from 'lucide-react';

interface ConflictIndicatorProps {
    conflicts: string[];
    severity?: 'warning' | 'error' | 'info';
    showDetails?: boolean;
    className?: string;
}

// Types de conflits avec leurs icônes et couleurs
const CONFLICT_TYPES = {
    'Superviseur non disponible': {
        icon: Users,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
    },
    'Charge de travail élevée': {
        icon: Clock,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
    },
    'Salle occupée': {
        icon: MapPin,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
    },
    'Conflit de planning': {
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
    },
    'Incompatibilité': {
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
    }
};

// Composant pour afficher un conflit individuel
const ConflictItem: React.FC<{
    conflict: string;
    index: number;
}> = ({ conflict, index }) => {
    const conflictType = CONFLICT_TYPES[conflict as keyof typeof CONFLICT_TYPES] || {
        icon: Info,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
    };

    const Icon = conflictType.icon;

    return (
        <motion.div
            className={`
        flex items-start space-x-2 p-2 rounded-md border
        ${conflictType.bgColor} ${conflictType.borderColor}
      `}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <Icon className={`w-4 h-4 mt-0.5 ${conflictType.color}`} />
            <div className="flex-1">
                <div className={`text-sm font-medium ${conflictType.color}`}>
                    {conflict}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                    {getConflictDescription(conflict)}
                </div>
            </div>
        </motion.div>
    );
};

// Fonction pour obtenir une description détaillée du conflit
function getConflictDescription(conflict: string): string {
    switch (conflict) {
        case 'Superviseur non disponible':
            return 'Le superviseur sélectionné n\'est pas disponible pour cette période.';
        case 'Charge de travail élevée':
            return 'Le superviseur a déjà une charge de travail importante.';
        case 'Salle occupée':
            return 'Cette salle est déjà assignée pour cette période.';
        case 'Conflit de planning':
            return 'Il y a un conflit avec le planning existant.';
        case 'Incompatibilité':
            return 'Incompatibilité détectée avec les règles de planification.';
        default:
            return 'Conflit détecté nécessitant une attention.';
    }
}

// Popup de détails des conflits
const ConflictDetailsPopup: React.FC<{
    conflicts: string[];
    onClose: () => void;
}> = ({ conflicts, onClose }) => (
    <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
    >
        <motion.div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
        >
            <Card className="border-0 shadow-none">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center space-x-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <span>Détails des conflits</span>
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="p-1"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {conflicts.map((conflict, index) => (
                            <ConflictItem
                                key={index}
                                conflict={conflict}
                                index={index}
                            />
                        ))}
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-start space-x-2">
                            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                            <div className="text-sm text-blue-800">
                                <div className="font-medium">Recommandations</div>
                                <div className="mt-1">
                                    Résolvez ces conflits avant de valider l'affectation pour éviter
                                    les problèmes de planification.
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    </motion.div>
);

export const ConflictIndicator: React.FC<ConflictIndicatorProps> = ({
    conflicts,
    severity = 'error',
    showDetails = false,
    className = ''
}) => {
    const [showPopup, setShowPopup] = useState(false);

    if (conflicts.length === 0) return null;

    const severityConfig = {
        error: {
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            badgeVariant: 'destructive' as const
        },
        warning: {
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            badgeVariant: 'secondary' as const
        },
        info: {
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            badgeVariant: 'outline' as const
        }
    };

    const config = severityConfig[severity];

    return (
        <>
            <motion.div
                className={`
          flex items-center space-x-2 p-2 rounded-md border cursor-pointer
          ${config.bgColor} ${config.borderColor} ${className}
          hover:shadow-sm transition-shadow duration-200
        `}
                onClick={() => setShowPopup(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <AlertTriangle className={`w-4 h-4 ${config.color}`} />

                <div className="flex-1">
                    <div className={`text-sm font-medium ${config.color}`}>
                        {conflicts.length} conflit{conflicts.length > 1 ? 's' : ''} détecté{conflicts.length > 1 ? 's' : ''}
                    </div>

                    {showDetails && conflicts.length > 0 && (
                        <div className="text-xs text-gray-600 mt-1 truncate">
                            {conflicts[0]}
                            {conflicts.length > 1 && ` +${conflicts.length - 1} autre${conflicts.length > 2 ? 's' : ''}`}
                        </div>
                    )}
                </div>

                <Badge variant={config.badgeVariant} className="text-xs">
                    {conflicts.length}
                </Badge>
            </motion.div>

            {/* Popup de détails */}
            <AnimatePresence>
                {showPopup && (
                    <ConflictDetailsPopup
                        conflicts={conflicts}
                        onClose={() => setShowPopup(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default ConflictIndicator; 