'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    X,
    TrendingUp,
    Users,
    Clock,
    MapPin
} from 'lucide-react';

interface Attribution {
    id?: number;
    roomId: number;
    supervisorId: number;
    day: unknown;
    period: unknown;
    activityType: string;
    conflicts: string[];
    isValid: boolean;
}

interface ValidationSummary {
    totalAssignments: number;
    validAssignments: number;
    totalConflicts: number;
    isValid: boolean;
}

interface ValidationPanelProps {
    summary: ValidationSummary;
    attributions: Attribution[];
    onValidate: () => void;
    onClose: () => void;
    className?: string;
}

// Composant pour afficher les statistiques de validation
const ValidationStats: React.FC<{
    summary: ValidationSummary;
}> = ({ summary }) => {
    const validationPercentage = summary.totalAssignments > 0
        ? (summary.validAssignments / summary.totalAssignments) * 100
        : 0;

    return (
        <div className="grid grid-cols-2 gap-4">
            {/* Pourcentage de validation */}
            <Card className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Validation</span>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-gray-900">
                            {Math.round(validationPercentage)}%
                        </span>
                        <Badge
                            variant={validationPercentage === 100 ? 'default' : 'secondary'}
                            className="text-xs"
                        >
                            {summary.validAssignments}/{summary.totalAssignments}
                        </Badge>
                    </div>
                    <Progress
                        value={validationPercentage}
                        className="h-2"
                    />
                </div>
            </Card>

            {/* Nombre de conflits */}
            <Card className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-700">Conflits</span>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className={`text-2xl font-bold ${summary.totalConflicts === 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {summary.totalConflicts}
                        </span>
                        <Badge
                            variant={summary.totalConflicts === 0 ? 'default' : 'destructive'}
                            className="text-xs"
                        >
                            {summary.totalConflicts === 0 ? 'Aucun' : 'À résoudre'}
                        </Badge>
                    </div>
                    <div className="text-xs text-gray-600">
                        {summary.totalConflicts === 0
                            ? 'Toutes les affectations sont valides'
                            : `${summary.totalConflicts} conflit${summary.totalConflicts > 1 ? 's' : ''} détecté${summary.totalConflicts > 1 ? 's' : ''}`
                        }
                    </div>
                </div>
            </Card>
        </div>
    );
};

// Composant pour afficher les détails des affectations
const AssignmentDetails: React.FC<{
    attributions: Attribution[];
}> = ({ attributions }) => {
    const validAssignments = attributions.filter(a => a.isValid);
    const invalidAssignments = attributions.filter(a => !a.isValid);

    return (
        <div className="space-y-4">
            {/* Affectations valides */}
            {validAssignments.length > 0 && (
                <div>
                    <div className="flex items-center space-x-2 mb-3">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <h4 className="font-medium text-gray-900">
                            Affectations valides ({validAssignments.length})
                        </h4>
                    </div>
                    <div className="space-y-2">
                        {validAssignments.map((attribution, index) => (
                            <motion.div
                                key={attribution.id || index}
                                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className="flex items-center space-x-2">
                                    <MapPin className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-900">
                                        Salle {attribution.roomId}
                                    </span>
                                    <span className="text-xs text-green-700">
                                        {attribution.day} - {attribution.period}
                                    </span>
                                </div>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Affectations avec conflits */}
            {invalidAssignments.length > 0 && (
                <div>
                    <div className="flex items-center space-x-2 mb-3">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <h4 className="font-medium text-gray-900">
                            Affectations avec conflits ({invalidAssignments.length})
                        </h4>
                    </div>
                    <div className="space-y-2">
                        {invalidAssignments.map((attribution, index) => (
                            <motion.div
                                key={attribution.id || index}
                                className="p-3 bg-red-50 border border-red-200 rounded-md"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        <MapPin className="w-4 h-4 text-red-600" />
                                        <span className="text-sm font-medium text-red-900">
                                            Salle {attribution.roomId}
                                        </span>
                                        <span className="text-xs text-red-700">
                                            {attribution.day} - {attribution.period}
                                        </span>
                                    </div>
                                    <XCircle className="w-4 h-4 text-red-600" />
                                </div>
                                <div className="space-y-1">
                                    {attribution.conflicts.map((conflict, conflictIndex) => (
                                        <div
                                            key={conflictIndex}
                                            className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded"
                                        >
                                            {conflict}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
    summary,
    attributions,
    onValidate,
    onClose,
    className = ''
}) => {
    const canValidate = summary.isValid && summary.totalAssignments > 0;

    return (
        <motion.div
            className={`border-t border-gray-200 bg-gray-50 ${className}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="p-4">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center space-x-2">
                                {summary.isValid ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                                )}
                                <span>Validation des affectations</span>
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

                    <CardContent className="space-y-6">
                        {/* Statistiques */}
                        <ValidationStats summary={summary} />

                        {/* État global */}
                        <div className={`
              p-4 rounded-lg border-2 
              ${summary.isValid
                                ? 'border-green-200 bg-green-50'
                                : 'border-orange-200 bg-orange-50'
                            }
            `}>
                            <div className="flex items-center space-x-2 mb-2">
                                {summary.isValid ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                                )}
                                <span className={`font-medium ${summary.isValid ? 'text-green-900' : 'text-orange-900'
                                    }`}>
                                    {summary.isValid
                                        ? 'Toutes les affectations sont valides'
                                        : 'Des conflits doivent être résolus'
                                    }
                                </span>
                            </div>
                            <div className={`text-sm ${summary.isValid ? 'text-green-700' : 'text-orange-700'
                                }`}>
                                {summary.isValid
                                    ? 'Vous pouvez valider et appliquer ces affectations au planning.'
                                    : 'Résolvez les conflits avant de pouvoir valider les affectations.'
                                }
                            </div>
                        </div>

                        {/* Détails des affectations */}
                        {attributions.length > 0 && (
                            <AssignmentDetails attributions={attributions} />
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                                {summary.totalAssignments === 0
                                    ? 'Aucune affectation à valider'
                                    : `${summary.totalAssignments} affectation${summary.totalAssignments > 1 ? 's' : ''} à valider`
                                }
                            </div>

                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    size="sm"
                                >
                                    Fermer
                                </Button>
                                <Button
                                    onClick={onValidate}
                                    disabled={!canValidate}
                                    size="sm"
                                    className={canValidate ? 'bg-green-600 hover:bg-green-700' : ''}
                                >
                                    {canValidate ? (
                                        <>
                                            <CheckCircle className="w-4 h-4 mr-1" />
                                            Valider les affectations
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle className="w-4 h-4 mr-1" />
                                            Résoudre les conflits
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
};

export default ValidationPanel; 