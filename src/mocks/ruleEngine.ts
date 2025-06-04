// Crée le fichier mock pour RuleEngine
import { RuleEngine } from '@/modules/rules/engine/rule-engine';
import { RuleEvaluationContext } from '@/modules/rules/types/rule';
import { RuleEvaluationResult, RuleSeverity } from '@/modules/rules/types/rule';
import { Attribution } from '@/types/attribution';
import { Rule } from '@/modules/rules/types/rule';

// Mock minimal pour les dépendances non utilisées directement dans l'évaluation simple
const mockValidator = { validate: async () => ({ passed: true, severity: RuleSeverity.INFO, message: 'Mock validation', ruleId: 'mock-val' }) };
const mockSolver = { resolve: async () => ({ description: 'Mock resolution' }) };

// Interface simplifiée pour le mock, ne contenant que ce qui est utilisé
interface MockRuleEngineEvaluator {
    evaluate(context: RuleEvaluationContext): Promise<any>; // Utiliser any pour RuleEvaluationSummary pour l'instant
}

export const mockRuleEngine: MockRuleEngineEvaluator = {
    evaluate: async (context: RuleEvaluationContext): Promise<any> => {
        console.log("Mock RuleEngine evaluate called with context:", context);

        // Assurer context.attributions est un tableau
        const attributions = Array.isArray(context.attributions) ? context.attributions as Attribution[] : [];

        const violations: RuleEvaluationResult[] = [
            {
                ruleId: 'mock-rule-1',
                passed: false,
                severity: RuleSeverity.WARNING,
                message: 'Violation simulée : Repos insuffisant pour Dr. Exemple.',
                details: { affectedAssignments: attributions.length > 0 && attributions[0]?.id ? [String(attributions[0].id)] : [] }
            },
            {
                ruleId: 'mock-rule-2',
                passed: false,
                severity: RuleSeverity.ERROR,
                message: 'Violation simulée critique : Charge de travail inéquitable détectée.',
                details: { affectedAssignments: attributions.map((a: Attribution) => String(a.id)) }
            }
        ];

        const isValid = !violations.some(v => v.severity === RuleSeverity.ERROR);
        const score = Math.random() * 100;

        await new Promise(resolve => setTimeout(resolve, 300));

        // Structure alignée avec RuleEvaluationSummary attendue par page.tsx
        return {
            isValid,
            violations,
            warnings: violations.filter(v => v.severity === RuleSeverity.WARNING),
            score,
            details: "Evaluation simulée effectuée."
        };
    },
}; 