import { RuleV2, RuleTemplate, TemplateParameter } from '../types/ruleV2.types';
import { RuleCondition, RuleAction } from '../../types/rule';
import { z, ZodError } from 'zod';

export class RuleValidator {
  private static instance: RuleValidator;

  private constructor() {}

  static getInstance(): RuleValidator {
    if (!RuleValidator.instance) {
      RuleValidator.instance = new RuleValidator();
    }
    return RuleValidator.instance;
  }

  // Main validation schemas
  private readonly conditionSchema = z.object({
    field: z.string().min(1, 'Le champ est requis'),
    operator: z.enum([
      'EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN',
      'GREATER_THAN_OR_EQUALS', 'LESS_THAN_OR_EQUALS',
      'CONTAINS', 'NOT_CONTAINS', 'IN', 'NOT_IN',
      'BETWEEN', 'IS_NULL', 'IS_NOT_NULL', 'REGEX', 'CUSTOM'
    ]),
    value: z.any(),
    customFunction: z.string().optional()
  });

  private readonly actionSchema = z.object({
    type: z.enum([
      'PREVENT', 'ALLOW', 'NOTIFY', 'MODIFY',
      'LOG', 'SUGGEST', 'ESCALATE', 'CUSTOM'
    ]),
    target: z.string().optional(),
    value: z.any().optional(),
    message: z.string().optional(),
    metadata: z.record(z.any()).optional(),
    customFunction: z.string().optional()
  });

  private readonly ruleSchema = z.object({
    name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
    description: z.string().min(1, 'La description est requise').max(500, 'La description est trop longue'),
    type: z.enum(['PLANNING', 'LEAVE', 'CONSTRAINT', 'ALLOCATION', 'SUPERVISION']),
    priority: z.number().min(0).max(100),
    enabled: z.boolean(),
    status: z.enum(['draft', 'active', 'archived', 'pending_approval']),
    conditions: z.array(this.conditionSchema).min(1, 'Au moins une condition est requise'),
    actions: z.array(this.actionSchema).min(1, 'Au moins une action est requise'),
    effectiveDate: z.date(),
    expirationDate: z.date().optional(),
    tags: z.array(z.string()).optional(),
    contexts: z.array(z.string()).optional()
  });

  async validateRule(rule: Partial<RuleV2>): Promise<{
    isValid: boolean;
    errors: Record<string, string>;
    warnings: string[];
  }> {
    const errors: Record<string, string> = {};
    const warnings: string[] = [];

    try {
      // Basic schema validation
      this.ruleSchema.parse(rule);
    } catch (error) {
      if (error instanceof ZodError) {
        error.errors.forEach(err => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
      }
    }

    // Business logic validation
    const businessErrors = await this.validateBusinessLogic(rule);
    Object.assign(errors, businessErrors);

    // Condition-specific validation
    if (rule.conditions) {
      const conditionErrors = this.validateConditions(rule.conditions);
      Object.assign(errors, conditionErrors);
    }

    // Action-specific validation
    if (rule.actions) {
      const actionErrors = this.validateActions(rule.actions, rule.type);
      Object.assign(errors, actionErrors);
    }

    // Date validation
    if (rule.effectiveDate && rule.expirationDate) {
      if (new Date(rule.expirationDate) <= new Date(rule.effectiveDate)) {
        errors.expirationDate = 'La date d\'expiration doit être après la date d\'effet';
      }
    }

    // Generate warnings
    warnings.push(...this.generateWarnings(rule));

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  }

  private async validateBusinessLogic(rule: Partial<RuleV2>): Promise<Record<string, string>> {
    const errors: Record<string, string> = {};

    // Check for conflicting conditions
    if (rule.conditions && rule.conditions.length > 1) {
      const conflictingConditions = this.findConflictingConditions(rule.conditions);
      if (conflictingConditions.length > 0) {
        errors.conditions = `Conditions contradictoires détectées: ${conflictingConditions.join(', ')}`;
      }
    }

    // Validate action consistency
    if (rule.actions) {
      const inconsistentActions = this.findInconsistentActions(rule.actions);
      if (inconsistentActions.length > 0) {
        errors.actions = `Actions incohérentes: ${inconsistentActions.join(', ')}`;
      }
    }

    // Type-specific validation
    switch (rule.type) {
      case 'PLANNING':
        Object.assign(errors, this.validatePlanningRule(rule));
        break;
      case 'LEAVE':
        Object.assign(errors, this.validateLeaveRule(rule));
        break;
      case 'SUPERVISION':
        Object.assign(errors, this.validateSupervisionRule(rule));
        break;
    }

    return errors;
  }

  private validateConditions(conditions: RuleCondition[]): Record<string, string> {
    const errors: Record<string, string> = {};

    conditions.forEach((condition, index) => {
      // Validate operator-value compatibility
      if (condition.operator === 'IS_NULL' || condition.operator === 'IS_NOT_NULL') {
        if (condition.value !== undefined && condition.value !== null) {
          errors[`conditions.${index}.value`] = 'Cette opération ne nécessite pas de valeur';
        }
      } else if (condition.operator === 'BETWEEN') {
        if (!Array.isArray(condition.value) || condition.value.length !== 2) {
          errors[`conditions.${index}.value`] = 'BETWEEN nécessite un tableau de 2 valeurs';
        }
      } else if (condition.operator === 'IN' || condition.operator === 'NOT_IN') {
        if (!Array.isArray(condition.value)) {
          errors[`conditions.${index}.value`] = 'IN/NOT_IN nécessite un tableau de valeurs';
        }
      } else if (condition.operator === 'REGEX') {
        try {
          new RegExp(String(condition.value));
        } catch {
          errors[`conditions.${index}.value`] = 'Expression régulière invalide';
        }
      } else if (condition.operator === 'CUSTOM') {
        if (!condition.customFunction) {
          errors[`conditions.${index}.customFunction`] = 'Fonction personnalisée requise';
        }
      }

      // Validate field format
      if (!this.isValidFieldPath(condition.field)) {
        errors[`conditions.${index}.field`] = 'Format de champ invalide';
      }
    });

    return errors;
  }

  private validateActions(actions: RuleAction[], ruleType?: string): Record<string, string> {
    const errors: Record<string, string> = {};

    actions.forEach((action, index) => {
      // Type-specific validation
      switch (action.type) {
        case 'PREVENT':
        case 'ALLOW':
          if (!action.target) {
            errors[`actions.${index}.target`] = 'La cible est requise pour cette action';
          }
          if (!action.message) {
            errors[`actions.${index}.message`] = 'Le message est requis pour cette action';
          }
          break;

        case 'NOTIFY':
          if (!action.target) {
            errors[`actions.${index}.target`] = 'Le destinataire est requis';
          }
          if (!action.message) {
            errors[`actions.${index}.message`] = 'Le message de notification est requis';
          }
          break;

        case 'MODIFY':
          if (!action.target) {
            errors[`actions.${index}.target`] = 'Le champ à modifier est requis';
          }
          if (action.value === undefined) {
            errors[`actions.${index}.value`] = 'La valeur est requise';
          }
          break;

        case 'CUSTOM':
          if (!action.customFunction) {
            errors[`actions.${index}.customFunction`] = 'La fonction personnalisée est requise';
          }
          break;
      }

      // Validate metadata
      if (action.metadata) {
        if (action.type === 'NOTIFY' && action.metadata.priority) {
          if (!['low', 'medium', 'high', 'urgent'].includes(action.metadata.priority)) {
            errors[`actions.${index}.metadata.priority`] = 'Priorité invalide';
          }
        }
      }
    });

    return errors;
  }

  private validatePlanningRule(rule: Partial<RuleV2>): Record<string, string> {
    const errors: Record<string, string> = {};

    // Planning rules should have time-based conditions
    const hasTimeCondition = rule.conditions?.some(c => 
      c.field.includes('date') || c.field.includes('time') || c.field.includes('period')
    );

    if (!hasTimeCondition) {
      errors.conditions = 'Les règles de planning doivent inclure des conditions temporelles';
    }

    return errors;
  }

  private validateLeaveRule(rule: Partial<RuleV2>): Record<string, string> {
    const errors: Record<string, string> = {};

    // Leave rules should reference leave-related fields
    const hasLeaveCondition = rule.conditions?.some(c => 
      c.field.includes('leave') || c.field.includes('quota')
    );

    if (!hasLeaveCondition) {
      errors.conditions = 'Les règles de congés doivent référencer des champs liés aux congés';
    }

    return errors;
  }

  private validateSupervisionRule(rule: Partial<RuleV2>): Record<string, string> {
    const errors: Record<string, string> = {};

    // Supervision rules should check roles or experience
    const hasSupervisionCondition = rule.conditions?.some(c => 
      c.field.includes('role') || c.field.includes('senior') || c.field.includes('experience')
    );

    if (!hasSupervisionCondition) {
      errors.conditions = 'Les règles de supervision doivent vérifier les rôles ou l\'expérience';
    }

    return errors;
  }

  private findConflictingConditions(conditions: RuleCondition[]): string[] {
    const conflicts: string[] = [];
    const fieldValues: Map<string, Set<any>> = new Map();

    conditions.forEach(condition => {
      if (condition.operator === 'EQUALS') {
        if (!fieldValues.has(condition.field)) {
          fieldValues.set(condition.field, new Set());
        }
        fieldValues.get(condition.field)!.add(condition.value);
      }
    });

    // Check for multiple different values for same field
    fieldValues.forEach((values, field) => {
      if (values.size > 1) {
        conflicts.push(`${field} ne peut pas être égal à plusieurs valeurs`);
      }
    });

    return conflicts;
  }

  private findInconsistentActions(actions: RuleAction[]): string[] {
    const inconsistencies: string[] = [];
    const targetActions: Map<string, Set<string>> = new Map();

    actions.forEach(action => {
      if (action.target) {
        if (!targetActions.has(action.target)) {
          targetActions.set(action.target, new Set());
        }
        targetActions.get(action.target)!.add(action.type);
      }
    });

    // Check for conflicting actions on same target
    targetActions.forEach((actionTypes, target) => {
      if (actionTypes.has('ALLOW') && actionTypes.has('PREVENT')) {
        inconsistencies.push(`Actions contradictoires (ALLOW/PREVENT) sur ${target}`);
      }
    });

    return inconsistencies;
  }

  private generateWarnings(rule: Partial<RuleV2>): string[] {
    const warnings: string[] = [];

    // High priority warnings
    if (rule.priority && rule.priority >= 20) {
      warnings.push('Cette règle a une priorité très élevée et peut avoir un impact important');
    }

    // Complex conditions warning
    if (rule.conditions && rule.conditions.length > 5) {
      warnings.push('Cette règle contient beaucoup de conditions, considérez la simplifier');
    }

    // Multiple notification actions
    const notifyCount = rule.actions?.filter(a => a.type === 'NOTIFY').length || 0;
    if (notifyCount > 3) {
      warnings.push('Cette règle génère beaucoup de notifications');
    }

    // Custom functions warning
    const hasCustom = rule.conditions?.some(c => c.operator === 'CUSTOM') ||
                     rule.actions?.some(a => a.type === 'CUSTOM');
    if (hasCustom) {
      warnings.push('Cette règle utilise des fonctions personnalisées qui nécessitent une validation supplémentaire');
    }

    return warnings;
  }

  private isValidFieldPath(field: string): boolean {
    const validPattern = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/;
    return validPattern.test(field);
  }

  async validateTemplate(modèle: RuleTemplate): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Validate modèle structure
    if (!modèle.id || !modèle.name || !modèle.baseRule) {
      errors.push('Modèle incomplet');
    }

    // Validate parameters
    modèle.parameters.forEach((param, index) => {
      if (!param.name || !param.type || !param.label) {
        errors.push(`Paramètre ${index + 1} incomplet`);
      }

      // Check parameter references in base rule
      const paramRegex = new RegExp(`\\{${param.name}\\}`, 'g');
      const ruleString = JSON.stringify(modèle.baseRule);
      if (!paramRegex.test(ruleString)) {
        errors.push(`Paramètre ${param.name} non utilisé dans la règle`);
      }
    });

    // Validate examples
    modèle.examples.forEach((example, index) => {
      const missingParams = modèle.parameters
        .filter(p => p.required && !(p.name in example.parameters))
        .map(p => p.name);

      if (missingParams.length > 0) {
        errors.push(`Exemple ${index + 1} manque les paramètres: ${missingParams.join(', ')}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}