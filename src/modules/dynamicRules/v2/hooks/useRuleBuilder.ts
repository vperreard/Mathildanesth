import { useState, useCallback, useEffect } from 'react';
import { RuleV2, RuleBuilderState, RuleTemplate } from '../types/ruleV2.types';
import { RuleCondition, RuleAction } from '../../types/rule';

export const useRuleBuilder = (
  initialRule?: RuleV2,
  template?: RuleTemplate
) => {
  const [state, setState] = useState<RuleBuilderState>(() => {
    const baseRule = template?.baseRule || initialRule || {};
    return {
      rule: {
        ...baseRule,
        name: baseRule.name || '',
        type: baseRule.type || 'PLANNING',
        status: baseRule.status || 'draft',
        enabled: baseRule.enabled ?? true,
        priority: baseRule.priority || 5,
        conditions: baseRule.conditions || [],
        actions: baseRule.actions || [],
        effectiveDate: baseRule.effectiveDate || new Date(),
        createdBy: baseRule.createdBy || '',
        updatedBy: baseRule.updatedBy || ''
      },
      isValid: false,
      errors: {},
      isDirty: false,
      preview: undefined,
      conflicts: []
    };
  });

  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    const { rule } = state;

    // Validate required fields
    if (!rule.name?.trim()) {
      errors.name = 'Le nom est requis';
    }

    if (!rule.type) {
      errors.type = 'Le type est requis';
    }

    if (!rule.description?.trim()) {
      errors.description = 'La description est requise';
    }

    // Validate conditions
    if (!rule.conditions || rule.conditions.length === 0) {
      errors.conditions = 'Au moins une condition est requise';
    } else {
      rule.conditions.forEach((condition, index) => {
        if (!condition.field) {
          errors[`condition_${index}_field`] = 'Le champ est requis';
        }
        if (!condition.operator) {
          errors[`condition_${index}_operator`] = 'L\'opérateur est requis';
        }
        if (
          condition.operator !== 'IS_NULL' && 
          condition.operator !== 'IS_NOT_NULL' &&
          (condition.value === undefined || condition.value === '')
        ) {
          errors[`condition_${index}_value`] = 'La valeur est requise';
        }
      });
    }

    // Validate actions
    if (!rule.actions || rule.actions.length === 0) {
      errors.actions = 'Au moins une action est requise';
    } else {
      rule.actions.forEach((action, index) => {
        if (!action.type) {
          errors[`action_${index}_type`] = 'Le type d\'action est requis';
        }
        if (action.type === 'NOTIFY' && !action.target) {
          errors[`action_${index}_target`] = 'Le destinataire est requis';
        }
        if (action.type === 'MODIFY' && !action.target) {
          errors[`action_${index}_target`] = 'Le champ à modifier est requis';
        }
      });
    }

    // Validate dates
    if (rule.effectiveDate && rule.expirationDate) {
      if (new Date(rule.expirationDate) <= new Date(rule.effectiveDate)) {
        errors.expirationDate = 'La date d\'expiration doit être après la date d\'effet';
      }
    }

    const isValid = Object.keys(errors).length === 0;
    setState(prev => ({ ...prev, errors, isValid }));
    return isValid;
  }, [state]);

  const updateRule = useCallback((updates: Partial<RuleV2>) => {
    setState(prev => ({
      ...prev,
      rule: { ...prev.rule, ...updates },
      isDirty: true
    }));
  }, []);

  const addCondition = useCallback((condition: RuleCondition) => {
    setState(prev => ({
      ...prev,
      rule: {
        ...prev.rule,
        conditions: [...(prev.rule.conditions || []), condition]
      },
      isDirty: true
    }));
  }, []);

  const updateCondition = useCallback((index: number, condition: RuleCondition) => {
    setState(prev => {
      const conditions = [...(prev.rule.conditions || [])];
      conditions[index] = condition;
      return {
        ...prev,
        rule: { ...prev.rule, conditions },
        isDirty: true
      };
    });
  }, []);

  const removeCondition = useCallback((index: number) => {
    setState(prev => {
      const conditions = [...(prev.rule.conditions || [])];
      conditions.splice(index, 1);
      return {
        ...prev,
        rule: { ...prev.rule, conditions },
        isDirty: true
      };
    });
  }, []);

  const addAction = useCallback((action: RuleAction) => {
    setState(prev => ({
      ...prev,
      rule: {
        ...prev.rule,
        actions: [...(prev.rule.actions || []), action]
      },
      isDirty: true
    }));
  }, []);

  const updateAction = useCallback((index: number, action: RuleAction) => {
    setState(prev => {
      const actions = [...(prev.rule.actions || [])];
      actions[index] = action;
      return {
        ...prev,
        rule: { ...prev.rule, actions },
        isDirty: true
      };
    });
  }, []);

  const removeAction = useCallback((index: number) => {
    setState(prev => {
      const actions = [...(prev.rule.actions || [])];
      actions.splice(index, 1);
      return {
        ...prev,
        rule: { ...prev.rule, actions },
        isDirty: true
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      rule: initialRule || {},
      isValid: false,
      errors: {},
      isDirty: false,
      preview: undefined,
      conflicts: []
    });
  }, [initialRule]);

  // Auto-validate on changes
  useEffect(() => {
    if (state.isDirty) {
      validate();
    }
  }, [state.rule, state.isDirty, validate]);

  // Apply template parameters if provided
  useEffect(() => {
    if (template && template.parameters.length > 0) {
      // Apply default values from template parameters
      const updates: any = {};
      template.parameters.forEach(param => {
        if (param.default !== undefined) {
          updates[param.name] = param.default;
        }
      });
      if (Object.keys(updates).length > 0) {
        updateRule(updates);
      }
    }
  }, [template, updateRule]);

  return {
    state,
    updateRule,
    addCondition,
    updateCondition,
    removeCondition,
    addAction,
    updateAction,
    removeAction,
    validate,
    reset
  };
};