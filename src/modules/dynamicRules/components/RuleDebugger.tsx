import React, { useState, useEffect, useMemo } from 'react';
import {
    Rule,
    RuleEvaluationResult,
    ActionType
} from '../types/rule';
import { useRuleEvaluation } from '../hooks/useRuleEvaluation';
import { ruleValidationService } from '../services/RuleValidationService';
import { ruleConflictDetectionService } from '../services/RuleConflictDetectionService';

interface RuleDebuggerProps {
    /**
     * Règles à déboguer
     */
    rules: Rule[];

    /**
     * Contexte initial
     */
    initialContext?: Record<string, any>;

    /**
     * Callback appelé lorsqu'une règle est modifiée
     */
    onRuleChange?: (updatedRule: Rule) => void;

    /**
     * Callback appelé lorsque l'utilisateur souhaite sauvegarder les règles
     */
    onSaveRules?: (rules: Rule[]) => void;

    /**
     * Désactive l'édition des règles
     */
    readOnly?: boolean;
}

/**
 * Composant de débogage des règles dynamiques
 */
export const RuleDebugger: React.FC<RuleDebuggerProps> = ({
    rules,
    initialContext = {},
    onRuleChange,
    onSaveRules,
    readOnly = false
}) => {
    // État pour le contexte d'évaluation
    const [context, setContext] = useState<Record<string, any>>(initialContext);

    // État pour le texte JSON du contexte
    const [contextText, setContextText] = useState<string>(JSON.stringify(initialContext, null, 2));

    // État pour la règle sélectionnée
    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(
        rules.length > 0 ? rules[0].id : null
    );

    // État pour les options d'évaluation
    const [enableCaching, setEnableCaching] = useState<boolean>(true);
    const [enablePerformanceTracing, setEnablePerformanceTracing] = useState<boolean>(false);
    const [debounceMs, setDebounceMs] = useState<number>(300);

    // État pour les erreurs de validation du contexte
    const [contextError, setContextError] = useState<string | null>(null);

    // Filtrer les règles activées
    const activeRules = useMemo(() => rules.filter(rule => rule.enabled !== false), [rules]);

    // Règle sélectionnée
    const selectedRule = useMemo(
        () => rules.find(rule => rule.id === selectedRuleId) || null,
        [rules, selectedRuleId]
    );

    // Utiliser le hook d'évaluation des règles
    const {
        results,
        evaluating,
        error,
        evaluateNow,
        clearCache,
        performanceMetrics
    } = useRuleEvaluation({
        rules: activeRules,
        context,
        enableCaching,
        enablePerformanceTracing,
        debounceMs
    });

    // Résultat pour la règle sélectionnée
    const selectedRuleResult = useMemo(
        () => results.find(result => result.ruleId === selectedRuleId) || null,
        [results, selectedRuleId]
    );

    // Validation de la règle sélectionnée
    const [validationResult, setValidationResult] = useState<any>(null);

    // Conflits détectés
    const [conflicts, setConflicts] = useState<any[]>([]);

    // Mettre à jour le contexte lorsque le texte est modifié
    const updateContext = () => {
        try {
            const parsedContext = JSON.parse(contextText);
            setContext(parsedContext);
            setContextError(null);
        } catch (err: any) {
            setContextError(`Erreur de parsing JSON: ${err.message}`);
        }
    };

    // Valider la règle sélectionnée
    const validateSelectedRule = () => {
        if (selectedRule) {
            const result = ruleValidationService.validateRule(selectedRule,
                rules.filter(r => r.id !== selectedRule.id)
            );
            setValidationResult(result);
        }
    };

    // Détecter les conflits
    const detectConflicts = () => {
        const detectedConflicts = ruleConflictDetectionService.detectConflicts(activeRules);
        setConflicts(detectedConflicts);
    };

    // Mettre à jour la validation et les conflits lorsque la règle sélectionnée change
    useEffect(() => {
        if (selectedRule) {
            validateSelectedRule();
            detectConflicts();
        }
    }, [selectedRule?.id]);

    return (
        <div className="rule-debugger">
            <div className="rule-debugger-header">
                <h2>Débogueur de Règles Dynamiques</h2>
                <div className="rule-debugger-actions">
                    <button
                        onClick={evaluateNow}
                        disabled={evaluating}
                        className="primary-button"
                    >
                        {evaluating ? 'Évaluation en cours...' : 'Évaluer les règles'}
                    </button>
                    <button onClick={clearCache} className="secondary-button">
                        Vider le cache
                    </button>
                    {onSaveRules && (
                        <button
                            onClick={() => onSaveRules(rules)}
                            className="success-button"
                            disabled={readOnly}
                        >
                            Sauvegarder les règles
                        </button>
                    )}
                </div>
            </div>

            <div className="rule-debugger-layout">
                {/* Panneau latéral avec la liste des règles */}
                <div className="rule-list-panel">
                    <h3>Règles ({activeRules.length}/{rules.length})</h3>
                    <div className="rule-list">
                        {rules.map(rule => (
                            <div
                                key={rule.id}
                                className={`rule-list-item ${selectedRuleId === rule.id ? 'selected' : ''} ${!rule.enabled ? 'disabled' : ''}`}
                                onClick={() => setSelectedRuleId(rule.id)}
                            >
                                <div className="rule-list-item-name">{rule.name}</div>
                                <div className="rule-list-item-type">{rule.type}</div>
                                <div className={`rule-list-item-status ${results.find(r => r.ruleId === rule.id)?.applicable ? 'applicable' : 'not-applicable'
                                    }`}>
                                    {results.find(r => r.ruleId === rule.id)?.applicable ? 'Applicable' : 'Non applicable'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Panneau principal */}
                <div className="main-panel">
                    {/* Section de configuration du contexte */}
                    <div className="context-panel">
                        <h3>Contexte d'évaluation</h3>
                        <div className="context-editor">
                            <textarea
                                value={contextText}
                                onChange={(e) => setContextText(e.target.value)}
                                onBlur={updateContext}
                                rows={10}
                                className={contextError ? 'error' : ''}
                            />
                            {contextError && (
                                <div className="error-message">{contextError}</div>
                            )}
                            <div className="context-actions">
                                <button onClick={updateContext} className="primary-button">
                                    Appliquer le contexte
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Section des options d'évaluation */}
                    <div className="options-panel">
                        <h3>Options d'évaluation</h3>
                        <div className="options-grid">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={enableCaching}
                                    onChange={(e) => setEnableCaching(e.target.checked)}
                                />
                                Activer la mise en cache
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={enablePerformanceTracing}
                                    onChange={(e) => setEnablePerformanceTracing(e.target.checked)}
                                />
                                Activer le traçage des performances
                            </label>
                            <label>
                                Délai de debounce (ms):
                                <input
                                    type="number"
                                    value={debounceMs}
                                    onChange={(e) => setDebounceMs(parseInt(e.target.value) || 0)}
                                    min={0}
                                    max={2000}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Affichage des résultats d'évaluation */}
                    {selectedRule && selectedRuleResult && (
                        <div className="evaluation-results">
                            <h3>Résultats pour {selectedRule.name}</h3>
                            <div className="result-card">
                                <div className="result-header">
                                    <div className={`result-status ${selectedRuleResult.applicable ? 'applicable' : 'not-applicable'}`}>
                                        {selectedRuleResult.applicable ? 'APPLICABLE' : 'NON APPLICABLE'}
                                    </div>
                                    <div className="result-meta">
                                        Évalué en {selectedRuleResult.evaluationTimeMs?.toFixed(2) || 'N/A'} ms
                                    </div>
                                </div>

                                {/* Conditions */}
                                <div className="result-section">
                                    <h4>Conditions évaluées ({selectedRuleResult.conditionsMatched.length}/{selectedRule.conditions.length})</h4>
                                    <div className="conditions-list">
                                        {selectedRule.conditions.map((condition, index) => (
                                            <div
                                                key={index}
                                                className={`condition-item ${selectedRuleResult.conditionsMatched.some(
                                                    c => c.field === condition.field &&
                                                        c.operator === condition.operator &&
                                                        JSON.stringify(c.value) === JSON.stringify(condition.value)
                                                ) ? 'matched' : 'not-matched'
                                                    }`}
                                            >
                                                <span className="condition-field">{condition.field}</span>
                                                <span className="condition-operator">{condition.operator}</span>
                                                <span className="condition-value">
                                                    {typeof condition.value === 'object'
                                                        ? JSON.stringify(condition.value)
                                                        : String(condition.value)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                {selectedRuleResult.applicable && (
                                    <div className="result-section">
                                        <h4>Actions appliquées ({selectedRuleResult.actionsApplied.length}/{selectedRule.actions.length})</h4>
                                        <div className="actions-list">
                                            {selectedRule.actions.map((action, index) => (
                                                <div
                                                    key={index}
                                                    className={`action-item ${selectedRuleResult.actionsApplied.some(a => a.id === action.id) ? 'applied' : 'not-applied'
                                                        }`}
                                                >
                                                    <span className="action-type">{action.type}</span>
                                                    <span className="action-target">{action.target}</span>
                                                    {action.type === ActionType.MODIFY && (
                                                        <span className="action-value">
                                                            {typeof action.parameters?.value === 'object'
                                                                ? JSON.stringify(action.parameters.value)
                                                                : String(action.parameters?.value)}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Erreurs */}
                                {selectedRuleResult.error && (
                                    <div className="result-section error">
                                        <h4>Erreur d'évaluation</h4>
                                        <div className="error-message">{selectedRuleResult.error}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Affichage de la validation */}
                    {selectedRule && validationResult && (
                        <div className="validation-results">
                            <h3>Validation de la règle</h3>
                            <div className={`validation-card ${validationResult.isValid ? 'valid' : 'invalid'}`}>
                                <div className="validation-header">
                                    <div className={`validation-status ${validationResult.isValid ? 'valid' : 'invalid'}`}>
                                        {validationResult.isValid ? 'VALIDE' : 'INVALIDE'}
                                    </div>
                                </div>

                                {/* Erreurs de validation */}
                                {validationResult.errors.length > 0 && (
                                    <div className="validation-section">
                                        <h4>Erreurs ({validationResult.errors.length})</h4>
                                        <ul className="validation-list">
                                            {validationResult.errors.map((error: any, index: number) => (
                                                <li key={index} className="validation-error">
                                                    <span className="validation-code">{error.code}</span>
                                                    <span className="validation-message">{error.message}</span>
                                                    {error.path && (
                                                        <span className="validation-path">{error.path}</span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Avertissements */}
                                {validationResult.warnings.length > 0 && (
                                    <div className="validation-section">
                                        <h4>Avertissements ({validationResult.warnings.length})</h4>
                                        <ul className="validation-list">
                                            {validationResult.warnings.map((warning: any, index: number) => (
                                                <li key={index} className="validation-warning">
                                                    <span className="validation-code">{warning.code}</span>
                                                    <span className="validation-message">{warning.message}</span>
                                                    {warning.path && (
                                                        <span className="validation-path">{warning.path}</span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Affichage des conflits */}
                    {conflicts.length > 0 && (
                        <div className="conflicts-results">
                            <h3>Conflits détectés ({conflicts.length})</h3>
                            <div className="conflicts-list">
                                {conflicts.map((conflict, index) => (
                                    <div key={index} className={`conflict-item ${conflict.severity.toLowerCase()}`}>
                                        <div className="conflict-header">
                                            <span className="conflict-type">{conflict.conflictType}</span>
                                            <span className="conflict-severity">{conflict.severity}</span>
                                        </div>
                                        <div className="conflict-description">{conflict.description}</div>
                                        <div className="conflict-rules">
                                            <span>Règles concernées: </span>
                                            {conflict.ruleIds.map((ruleId: string) => (
                                                <button
                                                    key={ruleId}
                                                    onClick={() => setSelectedRuleId(ruleId)}
                                                    className="rule-link"
                                                >
                                                    {rules.find(r => r.id === ruleId)?.name || ruleId}
                                                </button>
                                            )).reduce((prev: any, curr: any) => [prev, ', ', curr])}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Métriques de performance */}
                    {enablePerformanceTracing && (
                        <div className="performance-metrics">
                            <h3>Métriques de performance</h3>
                            <div className="metrics-grid">
                                <div className="metric-item">
                                    <span className="metric-label">Temps d'évaluation:</span>
                                    <span className="metric-value">{performanceMetrics.evaluationTimeMs.toFixed(2)} ms</span>
                                </div>
                                <div className="metric-item">
                                    <span className="metric-label">Nombre de règles:</span>
                                    <span className="metric-value">{performanceMetrics.ruleCount}</span>
                                </div>
                                <div className="metric-item">
                                    <span className="metric-label">Nombre de conditions:</span>
                                    <span className="metric-value">{performanceMetrics.conditionCount}</span>
                                </div>
                                <div className="metric-item">
                                    <span className="metric-label">Nombre d'actions:</span>
                                    <span className="metric-value">{performanceMetrics.actionCount}</span>
                                </div>
                                <div className="metric-item">
                                    <span className="metric-label">Cache hits:</span>
                                    <span className="metric-value">{performanceMetrics.cacheHitCount}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Styles CSS intégrés */}
            <style jsx>{`
        .rule-debugger {
          font-family: sans-serif;
          color: #333;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          max-width: 100%;
          overflow: hidden;
        }

        .rule-debugger-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eaeaea;
        }

        .rule-debugger-actions {
          display: flex;
          gap: 0.5rem;
        }

        .rule-debugger-layout {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 1rem;
          height: calc(100vh - 120px);
          overflow: hidden;
        }

        .rule-list-panel {
          border: 1px solid #eaeaea;
          border-radius: 0.5rem;
          padding: 1rem;
          overflow-y: auto;
        }

        .rule-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 1rem;
          overflow-y: auto;
          max-height: calc(100% - 3rem);
        }

        .rule-list-item {
          padding: 0.75rem;
          border-radius: 0.25rem;
          background-color: #f9f9f9;
          cursor: pointer;
          transition: background-color 0.2s ease;
          border-left: 4px solid transparent;
        }

        .rule-list-item.selected {
          background-color: #e6f7ff;
          border-left-color: #1890ff;
        }

        .rule-list-item.disabled {
          opacity: 0.6;
        }

        .rule-list-item-name {
          font-weight: bold;
          margin-bottom: 0.25rem;
        }

        .rule-list-item-type {
          font-size: 0.8rem;
          color: #666;
        }

        .rule-list-item-status {
          font-size: 0.75rem;
          margin-top: 0.25rem;
          padding: 0.125rem 0.375rem;
          border-radius: 1rem;
          display: inline-block;
        }

        .rule-list-item-status.applicable {
          background-color: #e6f7e6;
          color: #52c41a;
        }

        .rule-list-item-status.not-applicable {
          background-color: #fff1f0;
          color: #ff4d4f;
        }

        .main-panel {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .context-panel, .options-panel, .evaluation-results, 
        .validation-results, .conflicts-results, .performance-metrics {
          border: 1px solid #eaeaea;
          border-radius: 0.5rem;
          padding: 1rem;
        }

        .context-editor {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        textarea {
          font-family: monospace;
          padding: 0.5rem;
          border: 1px solid #d9d9d9;
          border-radius: 0.25rem;
          resize: vertical;
        }

        textarea.error {
          border-color: #ff4d4f;
        }

        .error-message {
          color: #ff4d4f;
          font-size: 0.85rem;
        }

        .context-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 0.5rem;
        }

        .options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .options-grid label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .options-grid input[type="number"] {
          width: 80px;
          padding: 0.25rem;
          margin-left: 0.5rem;
        }

        .result-card, .validation-card, .conflict-item {
          background-color: #f9f9f9;
          border-radius: 0.25rem;
          padding: 1rem;
          margin-top: 0.5rem;
        }

        .result-header, .validation-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .result-status, .validation-status {
          font-weight: bold;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
        }

        .result-status.applicable, .validation-status.valid {
          background-color: #e6f7e6;
          color: #52c41a;
        }

        .result-status.not-applicable, .validation-status.invalid {
          background-color: #fff1f0;
          color: #ff4d4f;
        }

        .result-meta {
          font-size: 0.85rem;
          color: #666;
        }

        .result-section, .validation-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #eaeaea;
        }

        .conditions-list, .actions-list, .validation-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .condition-item, .action-item {
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem;
          background-color: white;
          border-radius: 0.25rem;
          border-left: 4px solid transparent;
        }

        .condition-item.matched {
          border-left-color: #52c41a;
        }

        .condition-item.not-matched {
          border-left-color: #ff4d4f;
          opacity: 0.7;
        }

        .action-item.applied {
          border-left-color: #1890ff;
        }

        .action-item.not-applied {
          opacity: 0.7;
        }

        .conflict-item {
          border-left: 4px solid transparent;
          margin-bottom: 0.5rem;
        }

        .conflict-item.high, .conflict-item.critical {
          border-left-color: #ff4d4f;
        }

        .conflict-item.medium {
          border-left-color: #faad14;
        }

        .conflict-item.low {
          border-left-color: #1890ff;
        }

        .conflict-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .conflict-type {
          font-weight: bold;
        }

        .conflict-severity {
          font-size: 0.85rem;
          padding: 0.125rem 0.375rem;
          border-radius: 1rem;
        }

        .conflict-severity.critical, .conflict-severity.high {
          background-color: #fff1f0;
          color: #ff4d4f;
        }

        .conflict-severity.medium {
          background-color: #fffbe6;
          color: #faad14;
        }

        .conflict-severity.low {
          background-color: #e6f7ff;
          color: #1890ff;
        }

        .conflict-description {
          margin: 0.5rem 0;
        }

        .conflict-rules {
          font-size: 0.85rem;
          color: #666;
        }

        .rule-link {
          background: none;
          border: none;
          color: #1890ff;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
          font-size: inherit;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .metric-item {
          background-color: white;
          padding: 0.75rem;
          border-radius: 0.25rem;
          display: flex;
          flex-direction: column;
        }

        .metric-label {
          font-size: 0.85rem;
          color: #666;
        }

        .metric-value {
          font-weight: bold;
          margin-top: 0.25rem;
        }

        button {
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          border: none;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s ease;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .primary-button {
          background-color: #1890ff;
          color: white;
        }

        .primary-button:hover:not(:disabled) {
          background-color: #40a9ff;
        }

        .secondary-button {
          background-color: #f0f0f0;
          color: #333;
        }

        .secondary-button:hover:not(:disabled) {
          background-color: #d9d9d9;
        }

        .success-button {
          background-color: #52c41a;
          color: white;
        }

        .success-button:hover:not(:disabled) {
          background-color: #73d13d;
        }

        h2, h3, h4 {
          margin: 0;
        }

        h3 {
          margin-bottom: 0.5rem;
        }

        h4 {
          font-size: 0.95rem;
          margin-bottom: 0.25rem;
        }
      `}</style>
        </div>
    );
}; 