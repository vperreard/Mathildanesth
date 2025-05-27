'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, Lightbulb } from 'lucide-react';
import { RuleSeverity } from '@/types/rules';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ValidationViolation {
    ruleId: string;
    ruleName: string;
    message: string;
    severity: RuleSeverity;
}

interface LeaveRulesValidationPanelProps {
    violations: ValidationViolation[];
    suggestions: string[];
    isValidating?: boolean;
    className?: string;
}

export function LeaveRulesValidationPanel({
    violations,
    suggestions,
    isValidating = false,
    className
}: LeaveRulesValidationPanelProps) {
    const errors = violations.filter(v => v.severity === RuleSeverity.ERROR);
    const warnings = violations.filter(v => v.severity === RuleSeverity.WARNING);
    const infos = violations.filter(v => v.severity === RuleSeverity.INFO);

    if (isValidating) {
        return (
            <Card className={className}>
                <CardContent className="py-6">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="text-sm text-muted-foreground">
                            Validation en cours...
                        </span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (violations.length === 0 && suggestions.length === 0) {
        return (
            <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">
                    Validation réussie
                </AlertTitle>
                <AlertDescription className="text-green-700">
                    Votre demande de congé respecte toutes les règles en vigueur.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                        Validation des règles
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                        {errors.length > 0 && (
                            <Badge variant="destructive" className="text-xs">
                                {errors.length} erreur{errors.length > 1 ? 's' : ''}
                            </Badge>
                        )}
                        {warnings.length > 0 && (
                            <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                                {warnings.length} avertissement{warnings.length > 1 ? 's' : ''}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
                {/* Erreurs critiques */}
                {errors.length > 0 && (
                    <div className="space-y-2">
                        {errors.map((violation) => (
                            <Alert 
                                key={violation.ruleId} 
                                variant="destructive"
                                className="border-red-200 bg-red-50"
                            >
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle className="text-sm font-medium">
                                    {violation.ruleName}
                                </AlertTitle>
                                <AlertDescription className="text-sm">
                                    {violation.message}
                                </AlertDescription>
                            </Alert>
                        ))}
                    </div>
                )}

                {/* Avertissements */}
                {warnings.length > 0 && (
                    <>
                        {errors.length > 0 && <Separator />}
                        <div className="space-y-2">
                            {warnings.map((violation) => (
                                <Alert 
                                    key={violation.ruleId}
                                    className="border-yellow-200 bg-yellow-50"
                                >
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                    <AlertTitle className="text-sm font-medium text-yellow-800">
                                        {violation.ruleName}
                                    </AlertTitle>
                                    <AlertDescription className="text-sm text-yellow-700">
                                        {violation.message}
                                    </AlertDescription>
                                </Alert>
                            ))}
                        </div>
                    </>
                )}

                {/* Informations */}
                {infos.length > 0 && (
                    <>
                        {(errors.length > 0 || warnings.length > 0) && <Separator />}
                        <div className="space-y-2">
                            {infos.map((violation) => (
                                <Alert 
                                    key={violation.ruleId}
                                    className="border-blue-200 bg-blue-50"
                                >
                                    <Info className="h-4 w-4 text-blue-600" />
                                    <AlertTitle className="text-sm font-medium text-blue-800">
                                        {violation.ruleName}
                                    </AlertTitle>
                                    <AlertDescription className="text-sm text-blue-700">
                                        {violation.message}
                                    </AlertDescription>
                                </Alert>
                            ))}
                        </div>
                    </>
                )}

                {/* Suggestions */}
                {suggestions.length > 0 && (
                    <>
                        {violations.length > 0 && <Separator />}
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-start space-x-2">
                                <Lightbulb className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                                        Suggestions
                                    </h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        {suggestions.map((suggestion, index) => (
                                            <li key={index} className="flex items-start">
                                                <span className="mr-2">•</span>
                                                <span>{suggestion}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

// Composant pour afficher un résumé compact
export function LeaveRulesValidationSummary({
    violations,
    className
}: {
    violations: ValidationViolation[];
    className?: string;
}) {
    const errors = violations.filter(v => v.severity === RuleSeverity.ERROR);
    const warnings = violations.filter(v => v.severity === RuleSeverity.WARNING);

    if (violations.length === 0) {
        return (
            <div className={`flex items-center space-x-2 text-sm ${className}`}>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-green-700">Validation réussie</span>
            </div>
        );
    }

    return (
        <div className={`flex items-center space-x-3 ${className}`}>
            {errors.length > 0 && (
                <div className="flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700">
                        {errors.length} erreur{errors.length > 1 ? 's' : ''}
                    </span>
                </div>
            )}
            {warnings.length > 0 && (
                <div className="flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-700">
                        {warnings.length} avertissement{warnings.length > 1 ? 's' : ''}
                    </span>
                </div>
            )}
        </div>
    );
}