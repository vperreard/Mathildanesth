import React, { useState, useEffect } from 'react';
import { RuleEvaluationResult } from '@/modules/dynamicRules/types/rule';
import { Attribution } from '@/types/attribution';
import { RuleViolation } from '@/components/ui/RuleViolationIndicator';
import { AlertCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types pour les props du composant
interface RuleFeedbackProps {
    /**
     * Résultats d'évaluation des règles
     */
    ruleResults: RuleEvaluationResult[];

    /**
     * Gardes/Vacations concernées
     */
    attributions?: Attribution[];

    /**
     * Filtrer par sévérité (optionnel)
     */
    severityFilter?: ('error' | 'warning' | 'info')[];

    /**
     * Filtrer par type de règle (optionnel)
     */
    ruleTypeFilter?: string[];

    /**
     * Callback appelé quand une règle est cliquée
     */
    onRuleClick?: (ruleId: string) => void;

    /**
     * Affiche les détails complets
     */
    showDetails?: boolean;

    /**
     * Style CSS supplémentaire
     */
    className?: string;
}

/**
 * Type pour les règles groupées par statut
 */
type GroupedRules = {
    passed: RuleEvaluationResult[];
    failed: RuleEvaluationResult[];
};

/**
 * Type pour les violations formatées
 */
type FormattedViolation = RuleViolation & {
    ruleId: string;
};

/**
 * Convertit un niveau de sévérité numérique en type
 */
const getSeverityType = (severity: number): 'error' | 'warning' | 'info' => {
    if (severity >= 8) return 'error';
    if (severity >= 5) return 'warning';
    return 'info';
};

/**
 * Composant de visualisation du respect des règles
 */
const RuleFeedback: React.FC<RuleFeedbackProps> = ({
    ruleResults,
    attributions = [],
    severityFilter,
    ruleTypeFilter,
    onRuleClick,
    showDetails = false,
    className = ''
}) => {
    // État pour les violations formatées
    const [violations, setViolations] = useState<FormattedViolation[]>([]);

    // État pour les règles groupées
    const [groupedRules, setGroupedRules] = useState<GroupedRules>({
        passed: [],
        failed: []
    });

    // Format les résultats d'évaluation en violations
    useEffect(() => {
        // Filtrer les résultats en fonction des filtres
        const filteredResults = ruleResults.filter(result => {
            // Filtrer par type de règle si spécifié
            if (ruleTypeFilter && ruleTypeFilter.length > 0) {
                if (!ruleTypeFilter.includes(result.ruleType)) {
                    return false;
                }
            }

            // Pour le filtre de sévérité, on n'applique que sur les règles non respectées
            if (!result.applicable) {
                const severityType = getSeverityType(result.ruleSeverity || 0);
                if (severityFilter && !severityFilter.includes(severityType)) {
                    return false;
                }
            }

            return true;
        });

        // Grouper les règles par statut
        const grouped: GroupedRules = {
            passed: filteredResults.filter(r => r.applicable),
            failed: filteredResults.filter(r => !r.applicable)
        };

        setGroupedRules(grouped);

        // Transformer les règles non respectées en violations
        const newViolations = grouped.failed.map(result => ({
            id: result.ruleId,
            ruleId: result.ruleId,
            title: result.ruleName || `Règle ${result.ruleId}`,
            description: result.message || 'Règle non respectée',
            severity: getSeverityType(result.ruleSeverity || 0),
            affectedElements: result.affectedItems?.map(item => item.toString()) || [],
            suggestion: result.suggestion || 'Aucune suggestion disponible'
        }));

        setViolations(newViolations);
    }, [ruleResults, severityFilter, ruleTypeFilter]);

    // Calcul du résumé
    const summary = {
        total: ruleResults.length,
        passed: groupedRules.passed.length,
        failed: groupedRules.failed.length,
        critical: violations.filter(v => v.severity === 'error').length,
        warnings: violations.filter(v => v.severity === 'warning').length,
        info: violations.filter(v => v.severity === 'info').length
    };

    // Rendement du badge de statut global
    const renderStatusBadge = () => {
        if (summary.critical > 0) {
            return (
                <div className="flex items-center gap-1 text-red-600 font-medium">
                    <XCircle className="h-5 w-5" />
                    <span>{summary.critical} violations critiques</span>
                </div>
            );
        } else if (summary.warnings > 0) {
            return (
                <div className="flex items-center gap-1 text-amber-500 font-medium">
                    <AlertTriangle className="h-5 w-5" />
                    <span>{summary.warnings} avertissements</span>
                </div>
            );
        } else {
            return (
                <div className="flex items-center gap-1 text-green-600 font-medium">
                    <CheckCircle className="h-5 w-5" />
                    <span>Toutes les règles respectées</span>
                </div>
            );
        }
    };

    return (
        <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
            {/* En-tête avec résumé */}
            <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Conformité aux règles</h3>
                {renderStatusBadge()}
            </div>

            {/* Résumé détaillé */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-50 p-2 rounded text-center">
                    <div className="text-2xl font-bold">{summary.total}</div>
                    <div className="text-sm text-gray-500">Règles évaluées</div>
                </div>
                <div className="bg-green-50 p-2 rounded text-center">
                    <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
                    <div className="text-sm text-gray-500">Respectées</div>
                </div>
                <div className={`p-2 rounded text-center ${summary.failed > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <div className={`text-2xl font-bold ${summary.failed > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {summary.failed}
                    </div>
                    <div className="text-sm text-gray-500">Non respectées</div>
                </div>
            </div>

            {/* Liste des violations */}
            {violations.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-700 mb-2">Règles non respectées</h4>
                    <AnimatePresence>
                        {violations.map(violation => (
                            <motion.div
                                key={violation.id}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`mb-2 p-3 rounded-md border-l-4 ${violation.severity === 'error'
                                        ? 'bg-red-50 border-red-500'
                                        : violation.severity === 'warning'
                                            ? 'bg-amber-50 border-amber-500'
                                            : 'bg-blue-50 border-blue-500'
                                    }`}
                                onClick={() => onRuleClick && onRuleClick(violation.ruleId)}
                            >
                                <div className="flex items-start">
                                    <div className="mr-2 mt-0.5">
                                        {violation.severity === 'error' ? (
                                            <XCircle className="h-5 w-5 text-red-500" />
                                        ) : violation.severity === 'warning' ? (
                                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-blue-500" />
                                        )}
                                    </div>
                                    <div>
                                        <h5 className="font-medium text-gray-900">{violation.title}</h5>
                                        <p className="text-sm text-gray-600">{violation.description}</p>

                                        {/* Détails supplémentaires si demandés */}
                                        {showDetails && (
                                            <>
                                                {violation.affectedElements && violation.affectedElements.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="text-xs font-medium text-gray-500">
                                                            Éléments affectés:
                                                        </p>
                                                        <ul className="text-xs text-gray-600 list-disc pl-4">
                                                            {violation.affectedElements.map((item, index) => (
                                                                <li key={index}>{item}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {violation.suggestion && (
                                                    <div className="mt-2">
                                                        <p className="text-xs font-medium text-gray-500">
                                                            Suggestion:
                                                        </p>
                                                        <p className="text-xs text-gray-600">{violation.suggestion}</p>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Liste des règles respectées (optionnel) */}
            {showDetails && groupedRules.passed.length > 0 && (
                <div>
                    <h4 className="text-md font-medium text-gray-700 mb-2">Règles respectées</h4>
                    <div className="space-y-1">
                        {groupedRules.passed.map(rule => (
                            <div
                                key={rule.ruleId}
                                className="p-2 bg-gray-50 rounded-md text-sm flex items-center"
                                onClick={() => onRuleClick && onRuleClick(rule.ruleId)}
                            >
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                <span>{rule.ruleName || `Règle ${rule.ruleId}`}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RuleFeedback; 