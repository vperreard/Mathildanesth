'use client';

import React from 'react';
import { RuleViolation } from '@/types/attribution';
import { RuleSeverity } from '@/types/rules';
import { AlertCircle, AlertTriangle, Info, X, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface RuleViolationsPanelProps {
    violations: RuleViolation[];
    onClose?: () => void;
    onFixViolation?: (violation: RuleViolation) => void;
    getSuggestions?: (violation: RuleViolation) => Promise<string[]>;
    className?: string;
}

export function RuleViolationsPanel({
    violations,
    onClose,
    onFixViolation,
    getSuggestions,
    className
}: RuleViolationsPanelProps) {
    const [suggestions, setSuggestions] = React.useState<Record<string, string[]>>({});
    const [expandedViolations, setExpandedViolations] = React.useState<Set<string>>(new Set());

    const criticalViolations = violations.filter(v => v.severity === RuleSeverity.ERROR);
    const warnings = violations.filter(v => v.severity === RuleSeverity.WARNING);
    const infos = violations.filter(v => v.severity === RuleSeverity.INFO);

    const toggleExpanded = (violationId: string) => {
        setExpandedViolations(prev => {
            const newSet = new Set(prev);
            if (newSet.has(violationId)) {
                newSet.delete(violationId);
            } else {
                newSet.add(violationId);
                // Charger les suggestions si disponibles
                if (getSuggestions && !suggestions[violationId]) {
                    const violation = violations.find(v => v.id === violationId);
                    if (violation) {
                        getSuggestions(violation).then(sugg => {
                            setSuggestions(prev => ({ ...prev, [violationId]: sugg }));
                        });
                    }
                }
            }
            return newSet;
        });
    };

    const getViolationIcon = (severity: RuleSeverity) => {
        switch (severity) {
            case RuleSeverity.ERROR:
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            case RuleSeverity.WARNING:
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case RuleSeverity.INFO:
                return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const getViolationStyle = (severity: RuleSeverity) => {
        switch (severity) {
            case RuleSeverity.ERROR:
                return 'border-red-200 bg-red-50';
            case RuleSeverity.WARNING:
                return 'border-yellow-200 bg-yellow-50';
            case RuleSeverity.INFO:
                return 'border-blue-200 bg-blue-50';
        }
    };

    if (violations.length === 0) {
        return null;
    }

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Violations de règles détectées</h3>
                    <p className="text-sm text-gray-600">
                        {criticalViolations.length} erreur{criticalViolations.length !== 1 && 's'}, 
                        {' '}{warnings.length} avertissement{warnings.length !== 1 && 's'}
                    </p>
                </div>
                {onClose && (
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Violations critiques */}
            {criticalViolations.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-red-700">Erreurs critiques</h4>
                    {criticalViolations.map(violation => (
                        <ViolationCard
                            key={violation.id}
                            violation={violation}
                            expanded={expandedViolations.has(violation.id)}
                            onToggle={() => toggleExpanded(violation.id)}
                            onFix={onFixViolation}
                            suggestions={suggestions[violation.id]}
                        />
                    ))}
                </div>
            )}

            {/* Avertissements */}
            {warnings.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-yellow-700">Avertissements</h4>
                    {warnings.map(violation => (
                        <ViolationCard
                            key={violation.id}
                            violation={violation}
                            expanded={expandedViolations.has(violation.id)}
                            onToggle={() => toggleExpanded(violation.id)}
                            onFix={onFixViolation}
                            suggestions={suggestions[violation.id]}
                        />
                    ))}
                </div>
            )}

            {/* Informations */}
            {infos.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-blue-700">Informations</h4>
                    {infos.map(violation => (
                        <ViolationCard
                            key={violation.id}
                            violation={violation}
                            expanded={expandedViolations.has(violation.id)}
                            onToggle={() => toggleExpanded(violation.id)}
                            onFix={onFixViolation}
                            suggestions={suggestions[violation.id]}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface ViolationCardProps {
    violation: RuleViolation;
    expanded: boolean;
    onToggle: () => void;
    onFix?: (violation: RuleViolation) => void;
    suggestions?: string[];
}

function ViolationCard({ 
    violation, 
    expanded, 
    onToggle, 
    onFix,
    suggestions 
}: ViolationCardProps) {
    const getViolationIcon = (severity: RuleSeverity) => {
        switch (severity) {
            case RuleSeverity.ERROR:
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            case RuleSeverity.WARNING:
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case RuleSeverity.INFO:
                return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const getViolationStyle = (severity: RuleSeverity) => {
        switch (severity) {
            case RuleSeverity.ERROR:
                return 'border-red-200 bg-red-50';
            case RuleSeverity.WARNING:
                return 'border-yellow-200 bg-yellow-50';
            case RuleSeverity.INFO:
                return 'border-blue-200 bg-blue-50';
        }
    };

    return (
        <Collapsible open={expanded} onOpenChange={onToggle}>
            <div className={`rounded-lg border p-4 ${getViolationStyle(violation.severity)}`}>
                <CollapsibleTrigger className="w-full">
                    <div className="flex items-start gap-3">
                        {getViolationIcon(violation.severity)}
                        <div className="flex-1 text-left">
                            <p className="font-medium">{violation.message}</p>
                            {violation.metadata?.ruleDescription && (
                                <p className="text-sm text-gray-600 mt-1">
                                    {violation.metadata.ruleDescription}
                                </p>
                            )}
                        </div>
                    </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-4">
                    <div className="space-y-3">
                        {/* Détails de la violation */}
                        <div className="text-sm">
                            <span className="font-medium">Type:</span> {violation.type}
                            {violation.metadata?.ruleName && (
                                <>
                                    <br />
                                    <span className="font-medium">Règle:</span> {violation.metadata.ruleName}
                                </>
                            )}
                            {violation.affectedAssignments.length > 0 && (
                                <>
                                    <br />
                                    <span className="font-medium">Gardes/Vacations concernées:</span>{' '}
                                    {violation.affectedAssignments.length}
                                </>
                            )}
                        </div>

                        {/* Suggestions de correction */}
                        {suggestions && suggestions.length > 0 && (
                            <div className="border-t pt-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <Lightbulb className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium">Suggestions:</span>
                                </div>
                                <ul className="list-disc list-inside text-sm space-y-1 text-gray-600">
                                    {suggestions.map((suggestion, index) => (
                                        <li key={index}>{suggestion}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Bouton de correction */}
                        {onFix && (
                            <div className="flex justify-end pt-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onFix(violation)}
                                >
                                    Corriger
                                </Button>
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}