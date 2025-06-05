import { useState, useCallback } from 'react';
import { logger } from "../../../../lib/logger";
import { RuleV2, RuleSimulation } from '../types/ruleV2.types';

export const useRulePreview = () => {
  const [preview, setPreview] = useState<RuleSimulation>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const runPreview = useCallback(async (rule: Partial<RuleV2>) => {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await fetch('http://localhost:3000/api/admin/rules/v2/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rule,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la prévisualisation');
      }

      const data = await response.json();
      setPreview(data);
    } catch (err: unknown) {
      logger.error('Preview error:', err);
      setError(err.message || 'Erreur lors de la prévisualisation');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearPreview = useCallback(() => {
    setPreview(undefined);
    setError(undefined);
  }, []);

  return {
    preview,
    isLoading,
    error,
    runPreview,
    clearPreview
  };
};