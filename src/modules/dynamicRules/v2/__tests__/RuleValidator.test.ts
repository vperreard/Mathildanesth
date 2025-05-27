import { RuleValidator } from '../services/RuleValidator';
import { RuleV2, RuleTemplate } from '../types/ruleV2.types';

describe('RuleValidator', () => {
  let validator: RuleValidator;

  beforeEach(() => {
    validator = RuleValidator.getInstance();
  });

  describe('validateRule', () => {
    const validRule: Partial<RuleV2> = {
      name: 'Valid Rule',
      description: 'A valid test rule',
      type: 'PLANNING',
      priority: 10,
      enabled: true,
      status: 'active',
      conditions: [
        { field: 'user.role', operator: 'EQUALS', value: 'IADE' }
      ],
      actions: [
        { type: 'PREVENT', target: 'assignment', message: 'Not allowed' }
      ],
      effectiveDate: new Date()
    };

    it('should validate a correct rule', async () => {
      const result = await validator.validateRule(validRule);
      
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should detect missing required fields', async () => {
      const invalidRule = { ...validRule, name: '' };
      const result = await validator.validateRule(invalidRule);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('Le nom est requis');
    });

    it('should detect invalid date range', async () => {
      const invalidRule = {
        ...validRule,
        effectiveDate: new Date('2024-12-31'),
        expirationDate: new Date('2024-01-01')
      };
      const result = await validator.validateRule(invalidRule);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.expirationDate).toContain('après la date d\'effet');
    });

    describe('condition validation', () => {
      it('should validate BETWEEN operator', async () => {
        const rule = {
          ...validRule,
          conditions: [
            { field: 'value', operator: 'BETWEEN', value: [1, 10] }
          ]
        };
        const result = await validator.validateRule(rule);
        expect(result.isValid).toBe(true);
      });

      it('should reject invalid BETWEEN value', async () => {
        const rule = {
          ...validRule,
          conditions: [
            { field: 'value', operator: 'BETWEEN', value: 'invalid' }
          ]
        };
        const result = await validator.validateRule(rule);
        expect(result.isValid).toBe(false);
        expect(result.errors['conditions.0.value']).toContain('tableau de 2 valeurs');
      });

      it('should validate IN operator', async () => {
        const rule = {
          ...validRule,
          conditions: [
            { field: 'value', operator: 'IN', value: ['A', 'B', 'C'] }
          ]
        };
        const result = await validator.validateRule(rule);
        expect(result.isValid).toBe(true);
      });

      it('should validate REGEX operator', async () => {
        const rule = {
          ...validRule,
          conditions: [
            { field: 'value', operator: 'REGEX', value: '^test.*' }
          ]
        };
        const result = await validator.validateRule(rule);
        expect(result.isValid).toBe(true);
      });

      it('should reject invalid regex', async () => {
        const rule = {
          ...validRule,
          conditions: [
            { field: 'value', operator: 'REGEX', value: '[invalid' }
          ]
        };
        const result = await validator.validateRule(rule);
        expect(result.isValid).toBe(false);
        expect(result.errors['conditions.0.value']).toContain('Expression régulière invalide');
      });

      it('should validate NULL operators without value', async () => {
        const rule = {
          ...validRule,
          conditions: [
            { field: 'value', operator: 'IS_NULL' }
          ]
        };
        const result = await validator.validateRule(rule);
        expect(result.isValid).toBe(true);
      });
    });

    describe('action validation', () => {
      it('should require target for PREVENT/ALLOW', async () => {
        const rule = {
          ...validRule,
          actions: [
            { type: 'PREVENT', message: 'Not allowed' }
          ]
        };
        const result = await validator.validateRule(rule);
        expect(result.isValid).toBe(false);
        expect(result.errors['actions.0.target']).toContain('cible est requise');
      });

      it('should require message for NOTIFY', async () => {
        const rule = {
          ...validRule,
          actions: [
            { type: 'NOTIFY', target: 'user' }
          ]
        };
        const result = await validator.validateRule(rule);
        expect(result.isValid).toBe(false);
        expect(result.errors['actions.0.message']).toContain('message de notification est requis');
      });

      it('should require value for MODIFY', async () => {
        const rule = {
          ...validRule,
          actions: [
            { type: 'MODIFY', target: 'quota' }
          ]
        };
        const result = await validator.validateRule(rule);
        expect(result.isValid).toBe(false);
        expect(result.errors['actions.0.value']).toContain('valeur est requise');
      });

      it('should validate notification priority', async () => {
        const rule = {
          ...validRule,
          actions: [
            {
              type: 'NOTIFY',
              target: 'user',
              message: 'Test',
              metadata: { priority: 'invalid' }
            }
          ]
        };
        const result = await validator.validateRule(rule);
        expect(result.isValid).toBe(false);
        expect(result.errors['actions.0.metadata.priority']).toContain('Priorité invalide');
      });
    });

    describe('business logic validation', () => {
      it('should detect conflicting conditions', async () => {
        const rule = {
          ...validRule,
          conditions: [
            { field: 'status', operator: 'EQUALS', value: 'active' },
            { field: 'status', operator: 'EQUALS', value: 'inactive' }
          ]
        };
        const result = await validator.validateRule(rule);
        expect(result.isValid).toBe(false);
        expect(result.errors.conditions).toContain('Conditions contradictoires');
      });

      it('should detect inconsistent actions', async () => {
        const rule = {
          ...validRule,
          actions: [
            { type: 'ALLOW', target: 'leave' },
            { type: 'PREVENT', target: 'leave' }
          ]
        };
        const result = await validator.validateRule(rule);
        expect(result.isValid).toBe(false);
        expect(result.errors.actions).toContain('Actions incohérentes');
      });

      it('should validate planning rules have time conditions', async () => {
        const rule = {
          ...validRule,
          type: 'PLANNING' as const,
          conditions: [
            { field: 'user.role', operator: 'EQUALS', value: 'IADE' }
          ]
        };
        const result = await validator.validateRule(rule);
        expect(result.isValid).toBe(false);
        expect(result.errors.conditions).toContain('conditions temporelles');
      });

      it('should validate leave rules have leave conditions', async () => {
        const rule = {
          ...validRule,
          type: 'LEAVE' as const,
          conditions: [
            { field: 'user.role', operator: 'EQUALS', value: 'IADE' }
          ]
        };
        const result = await validator.validateRule(rule);
        expect(result.isValid).toBe(false);
        expect(result.errors.conditions).toContain('champs liés aux congés');
      });
    });

    describe('warnings generation', () => {
      it('should warn about high priority', async () => {
        const rule = { ...validRule, priority: 25 };
        const result = await validator.validateRule(rule);
        
        expect(result.warnings).toContain('Cette règle a une priorité très élevée et peut avoir un impact important');
      });

      it('should warn about complex conditions', async () => {
        const rule = {
          ...validRule,
          conditions: Array(6).fill({ field: 'test', operator: 'EQUALS', value: 'test' })
        };
        const result = await validator.validateRule(rule);
        
        expect(result.warnings).toContain('Cette règle contient beaucoup de conditions, considérez la simplifier');
      });

      it('should warn about many notifications', async () => {
        const rule = {
          ...validRule,
          actions: Array(4).fill({ type: 'NOTIFY', target: 'user', message: 'Test' })
        };
        const result = await validator.validateRule(rule);
        
        expect(result.warnings).toContain('Cette règle génère beaucoup de notifications');
      });

      it('should warn about custom functions', async () => {
        const rule = {
          ...validRule,
          conditions: [
            { field: 'test', operator: 'CUSTOM', customFunction: 'testFunc' }
          ]
        };
        const result = await validator.validateRule(rule);
        
        expect(result.warnings).toContain('Cette règle utilise des fonctions personnalisées');
      });
    });
  });

  describe('validateTemplate', () => {
    const validTemplate: RuleTemplate = {
      id: 'test-template',
      name: 'Test Template',
      category: 'Test',
      description: 'A test template',
      baseRule: {
        name: 'Rule from {param1}',
        description: 'Description with {param2}',
        type: 'PLANNING',
        conditions: [
          { field: 'value', operator: 'EQUALS', value: '{param1}' }
        ],
        actions: []
      },
      parameters: [
        {
          name: 'param1',
          type: 'string',
          label: 'Parameter 1',
          required: true
        },
        {
          name: 'param2',
          type: 'string',
          label: 'Parameter 2',
          required: false
        }
      ],
      examples: [
        {
          title: 'Example 1',
          description: 'Test example',
          parameters: { param1: 'test' },
          expectedBehavior: 'Test behavior'
        }
      ]
    };

    it('should validate a correct template', async () => {
      const result = await validator.validateTemplate(validTemplate);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect unused parameters', async () => {
      const template = {
        ...validTemplate,
        parameters: [
          ...validTemplate.parameters,
          { name: 'unused', type: 'string', label: 'Unused', required: false }
        ]
      };
      const result = await validator.validateTemplate(template);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Paramètre unused non utilisé dans la règle');
    });

    it('should detect missing required parameters in examples', async () => {
      const template = {
        ...validTemplate,
        examples: [
          {
            title: 'Bad Example',
            description: 'Missing required param',
            parameters: {},
            expectedBehavior: 'Should fail'
          }
        ]
      };
      const result = await validator.validateTemplate(template);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('manque les paramètres: param1');
    });
  });
});