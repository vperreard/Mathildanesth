import { useState, useCallback, useEffect } from 'react';
import { logger } from "../../../../lib/logger";
import { RuleV2, RuleConflict } from '../types/ruleV2.types';

export const useRuleConflicts = () => {
  const [conflicts, setConflicts] = useState<RuleConflict[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckedRule, setLastCheckedRule] = useState<string>();

  const checkConflicts = useCallback(async (rule: Partial<RuleV2>) => {
    // Skip if rule hasn't changed meaningfully
    const ruleSignature = JSON.stringify({
      conditions: rule.conditions,
      actions: rule.actions,
      type: rule.type
    });
    
    if (ruleSignature === lastCheckedRule) {
      return;
    }

    setIsChecking(true);
    setLastCheckedRule(ruleSignature);

    try {
      const response = await fetch('http://localhost:3000/api/admin/rules/v2/conflicts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rule })
      });

      if (!response.ok) {
        logger.error('Failed to check conflicts');
        return;
      }

      const data = await response.json();
      setConflicts(data.conflicts || []);
    } catch (err: unknown) {
      logger.error('Error checking conflicts:', err);
      setConflicts([]);
    } finally {
      setIsChecking(false);
    }
  }, [lastCheckedRule]);

  const resolveConflict = useCallback(async (
    conflictId: string,
    strategy: 'priority' | 'merge' | 'override' | 'manual',
    resolution?: Partial<RuleV2>
  ) => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/rules/v2/conflicts/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conflictId,
          strategy,
          resolution
        })
      });

      if (!response.ok) {
        throw new Error('Failed to resolve conflict');
      }

      const data = await response.json();
      
      // Update conflicts list
      setConflicts(prev => prev.filter(c => c.id !== conflictId));
      
      return data;
    } catch (err: unknown) {
      logger.error('Error resolving conflict:', err);
      throw err;
    }
  }, []);

  const clearConflicts = useCallback(() => {
    setConflicts([]);
    setLastCheckedRule(undefined);
  }, []);

  return {
    conflicts,
    isChecking,
    checkConflicts,
    resolveConflict,
    clearConflicts
  };
};