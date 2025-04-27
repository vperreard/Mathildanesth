'use client';

import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface RuleViolation {
    id: string;
    title: string;
    description: string;
    severity: 'error' | 'warning' | 'info';
    affectedElements?: string[];
    suggestion?: string;
}

interface RuleViolationIndicatorProps {
    violations: RuleViolation[];
    className?: string;
    onFixViolation?: (violationId: string) => void;
    onDismissViolation?: (violationId: string) => void;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const severityColors = {
    error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        icon: 'text-red-500',
        button: 'bg-red-100 text-red-700 hover:bg-red-200',
    },
    warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        icon: 'text-amber-500',
        button: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
    },
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: 'text-blue-500',
        button: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    },
};

const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
};

export const RuleViolationIndicator: React.FC<RuleViolationIndicatorProps> = ({
    violations,
    className,
    onFixViolation,
    onDismissViolation,
    position = 'bottom-left',
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // S'il n'y a pas de violations, on ne rend rien
    if (!violations || violations.length === 0) {
        return null;
    }

    const highestSeverity = violations.reduce((highest, violation) => {
        if (highest === 'error') return highest;
        if (violation.severity === 'error') return 'error';
        if (highest === 'warning') return highest;
        if (violation.severity === 'warning') return 'warning';
        return 'info';
    }, 'info' as 'error' | 'warning' | 'info');

    const colors = severityColors[highestSeverity];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'fixed z-50 shadow-lg rounded-lg overflow-hidden',
                colors.bg,
                colors.border,
                'border',
                positionClasses[position],
                className
            )}
            style={{ maxWidth: '420px' }}
        >
            <div
                className="flex items-center justify-between p-3 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center">
                    <AlertCircle className={cn('h-5 w-5 mr-2', colors.icon)} />
                    <span className={cn('font-medium', colors.text)}>
                        {violations.length === 1
                            ? '1 problème détecté'
                            : `${violations.length} problèmes détectés`}
                    </span>
                </div>
                <button
                    className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-black/5"
                    aria-label={isExpanded ? 'Réduire' : 'Développer'}
                >
                    {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                </button>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="max-h-80 overflow-y-auto p-3 pt-0 divide-y divide-gray-200">
                            {violations.map((violation) => (
                                <ViolationItem
                                    key={violation.id}
                                    violation={violation}
                                    onFix={onFixViolation ? () => onFixViolation(violation.id) : undefined}
                                    onDismiss={onDismissViolation ? () => onDismissViolation(violation.id) : undefined}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const ViolationItem: React.FC<{
    violation: RuleViolation;
    onFix?: () => void;
    onDismiss?: () => void;
}> = ({ violation, onFix, onDismiss }) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const colors = severityColors[violation.severity];

    return (
        <div className="py-2 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between">
                <div
                    className="flex items-start cursor-pointer flex-1"
                    onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                >
                    <AlertCircle
                        className={cn('h-4 w-4 mt-0.5 mr-2 flex-shrink-0', colors.icon)}
                    />
                    <div>
                        <p className={cn('text-sm font-medium', colors.text)}>{violation.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{violation.description}</p>
                    </div>
                </div>

                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="ml-2 flex-shrink-0 p-1 rounded-full hover:bg-gray-100"
                        aria-label="Ignorer ce problème"
                    >
                        <XCircle className="h-4 w-4 text-gray-400" />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isDetailsOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 overflow-hidden"
                    >
                        {violation.affectedElements && violation.affectedElements.length > 0 && (
                            <div className="mt-1.5">
                                <p className="text-xs font-medium text-gray-700">Éléments affectés:</p>
                                <ul className="text-xs text-gray-600 mt-1 pl-4 list-disc">
                                    {violation.affectedElements.map((element, index) => (
                                        <li key={index}>{element}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {violation.suggestion && (
                            <div className="mt-2">
                                <p className="text-xs font-medium text-gray-700">Suggestion:</p>
                                <p className="text-xs text-gray-600 mt-0.5">{violation.suggestion}</p>
                            </div>
                        )}

                        {onFix && (
                            <button
                                onClick={onFix}
                                className={cn(
                                    'mt-2 px-3 py-1 text-xs font-medium rounded-md transition-colors w-full text-center',
                                    colors.button
                                )}
                            >
                                Résoudre automatiquement
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}; 