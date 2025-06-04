import React, { useState, useEffect } from 'react';
import { RuleViolation, Attribution, ValidationResult } from '../types/attribution';
import { User } from '../types/user';

interface PlanningValidatorProps {
    validationResult: ValidationResult;
    attributions: Attribution[];
    users: User[];
    onResolveViolation: (violation: RuleViolation, assignmentIds?: string[]) => void;
    onApprove: () => void;
    onRegenerate: () => void;
}

const PlanningValidator: React.FC<PlanningValidatorProps> = ({
    validationResult,
    attributions,
    users,
    onResolveViolation,
    onApprove,
    onRegenerate
}) => {
    const [expandedViolations, setExpandedViolations] = useState<Record<string, boolean>>({});
    const [filteredViolations, setFilteredViolations] = useState<RuleViolation[]>([]);
    const [filterSeverity, setFilterSeverity] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');

    // Grouper les violations par type
    const violationsByType: Record<string, RuleViolation[]> = {};
    validationResult.violations.forEach(violation => {
        if (!violationsByType[violation.type]) {
            violationsByType[violation.type] = [];
        }
        violationsByType[violation.type].push(violation);
    });

    // Appliquer les filtres aux violations
    useEffect(() => {
        let filtered = [...validationResult.violations];

        if (filterSeverity !== 'all') {
            filtered = filtered.filter(v => v.severity === filterSeverity);
        }

        if (filterType !== 'all') {
            filtered = filtered.filter(v => v.type === filterType);
        }

        setFilteredViolations(filtered);
    }, [validationResult.violations, filterSeverity, filterType]);

    // Basculer l'expansion d'une violation
    const toggleViolation = (id: string) => {
        setExpandedViolations(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Obtenir le nom d'utilisateur à partir de l'ID
    const getUserName = (userId: number): string => {
        const user = users.find(u => u.id === userId);
        return user ? `${user.prenom} ${user.nom}` : `Utilisateur #${userId}`;
    };

    // Obtenir les assignations concernées par une violation
    const getAssignmentsForViolation = (violation: RuleViolation): Attribution[] => {
        return attributions.filter(a => violation.affectedAssignments.includes(a.id));
    };

    // Formater une date
    const formatDate = (date: Date): string => {
        return new Date(date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Obtenir la couleur selon la sévérité
    const getSeverityColor = (severity: string): string => {
        switch (severity) {
            case 'CRITICAL':
                return 'bg-red-100 border-red-500 text-red-700';
            case 'MAJOR':
                return 'bg-amber-100 border-amber-500 text-amber-700';
            case 'MINOR':
                return 'bg-blue-100 border-blue-500 text-blue-700';
            default:
                return 'bg-gray-100 border-gray-500 text-gray-700';
        }
    };

    // Calculer le pourcentage d'approbation
    const approvalPercentage = (): number => {
        if (validationResult.violations.length === 0) return 100;

        const criticalCount = validationResult.violations.filter(v => v.severity === 'CRITICAL').length;
        const majorCount = validationResult.violations.filter(v => v.severity === 'MAJOR').length;
        const minorCount = validationResult.violations.filter(v => v.severity === 'MINOR').length;

        // Pondération des violations
        const weightedTotal = criticalCount * 5 + majorCount * 2 + minorCount;
        const maxPossibleScore = validationResult.violations.length * 5;

        return Math.max(0, 100 - (weightedTotal / maxPossibleScore * 100));
    };

    // Décider si le planning peut être approuvé malgré les violations
    const canApprove = (): boolean => {
        // Ne pas autoriser l'approbation s'il y a des violations critiques
        return !validationResult.violations.some(v => v.severity === 'CRITICAL');
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Validation du planning</h2>
                <div className="flex items-center space-x-2">
                    <div className="text-right">
                        <div className="text-3xl font-bold">{Math.round(approvalPercentage())}%</div>
                        <div className="text-sm text-gray-500">Score d'approbation</div>
                    </div>
                    <div className="h-16 w-16 rounded-full flex items-center justify-center border-4"
                        style={{
                            borderColor: approvalPercentage() > 80 ? 'green' :
                                approvalPercentage() > 50 ? 'orange' : 'red',
                            color: approvalPercentage() > 80 ? 'green' :
                                approvalPercentage() > 50 ? 'orange' : 'red'
                        }}>
                        {validationResult.valid ? '✓' : '!'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Équité</div>
                    <div className="text-2xl font-semibold">{Math.round(validationResult.metrics.equiteScore)}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${validationResult.metrics.equiteScore}%` }}></div>
                    </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Niveau de fatigue</div>
                    <div className="text-2xl font-semibold">{Math.round(validationResult.metrics.fatigueScore)}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${validationResult.metrics.fatigueScore}%` }}></div>
                    </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Satisfaction estimée</div>
                    <div className="text-2xl font-semibold">{Math.round(validationResult.metrics.satisfactionScore)}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${validationResult.metrics.satisfactionScore}%` }}></div>
                    </div>
                </div>
            </div>

            {validationResult.violations.length > 0 ? (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">Alertes et conflits ({validationResult.violations.length})</h3>
                        <div className="flex space-x-2">
                            <select
                                className="border rounded px-3 py-2 text-sm"
                                value={filterSeverity}
                                onChange={(e) => setFilterSeverity(e.target.value)}
                            >
                                <option value="all">Toutes les sévérités</option>
                                <option value="CRITICAL">Critique</option>
                                <option value="MAJOR">Majeure</option>
                                <option value="MINOR">Mineure</option>
                            </select>

                            <select
                                className="border rounded px-3 py-2 text-sm"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="all">Tous les types</option>
                                {Object.keys(violationsByType).map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
                        {filteredViolations.map((violation) => (
                            <div
                                key={violation.id}
                                className={`border-l-4 rounded p-4 ${getSeverityColor(violation.severity)}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <span className="font-semibold">{violation.type}</span>
                                            <span className="text-xs px-2 py-1 rounded-full bg-white">
                                                {violation.severity === 'CRITICAL' ? 'Critique' :
                                                    violation.severity === 'MAJOR' ? 'Majeure' : 'Mineure'}
                                            </span>
                                        </div>
                                        <p className="mt-1">{violation.message}</p>
                                    </div>
                                    <button
                                        className="text-gray-500 hover:text-gray-700"
                                        onClick={() => toggleViolation(violation.id)}
                                    >
                                        {expandedViolations[violation.id] ? '▼' : '▶'}
                                    </button>
                                </div>

                                {expandedViolations[violation.id] && (
                                    <div className="mt-4 pl-4 border-l-2 border-gray-200">
                                        <h4 className="font-semibold mb-2">Assignations concernées:</h4>
                                        <ul className="space-y-2">
                                            {getAssignmentsForViolation(violation).map(attribution => (
                                                <li key={attribution.id} className="bg-white p-2 rounded shadow-sm">
                                                    <div>{getUserName(attribution.userId)}</div>
                                                    <div className="text-sm text-gray-600">{formatDate(attribution.date)}</div>
                                                    <div className="text-sm text-gray-600">{attribution.type} - {attribution.shift}</div>
                                                </li>
                                            ))}
                                        </ul>

                                        {violation.possibleResolutions && violation.possibleResolutions.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="font-semibold mb-2">Résolutions possibles:</h4>
                                                <div className="space-y-2">
                                                    {violation.possibleResolutions.map((resolution, index) => (
                                                        <button
                                                            key={index}
                                                            className="block w-full text-left px-3 py-2 border rounded hover:bg-gray-50"
                                                            onClick={() => onResolveViolation(violation)}
                                                        >
                                                            <div className="flex justify-between">
                                                                <span>{resolution.description}</span>
                                                                <span className="text-sm text-gray-500">
                                                                    Impact: {resolution.impact}/100
                                                                </span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            className="mt-4 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded"
                                            onClick={() => onResolveViolation(violation, violation.affectedAssignments)}
                                        >
                                            Résoudre manuellement
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6">
                    <div className="flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span className="font-semibold">Aucun conflit détecté ! Le planning est valide.</span>
                    </div>
                </div>
            )}

            <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                    className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded"
                    onClick={onRegenerate}
                >
                    Régénérer le planning
                </button>

                <button
                    className={`px-4 py-2 rounded ${canApprove()
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    onClick={canApprove() ? onApprove : undefined}
                    disabled={!canApprove()}
                >
                    {canApprove()
                        ? 'Approuver le planning'
                        : 'Résoudre les problèmes critiques'}
                </button>
            </div>
        </div>
    );
};

export default PlanningValidator; 