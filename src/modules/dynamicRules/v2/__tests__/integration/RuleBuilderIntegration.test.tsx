import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RuleBuilder } from '../../components/RuleBuilder/RuleBuilder';
import { RuleV2, RuleTemplate } from '../../types/ruleV2.types';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('RuleBuilder Integration', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ conflicts: [] })
    });
  });

  describe('Creating a new rule', () => {
    it('should create a rule from scratch', async () => {
      const user = userEvent.setup();
      
      render(
        <RuleBuilder 
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Fill basic information
      await user.type(screen.getByPlaceholderText('Ex: Limite gardes hebdomadaires'), 'Test Rule');
      await user.selectOptions(screen.getByRole('combobox', { name: /type/i }), 'PLANNING');
      await user.type(screen.getByPlaceholderText(/décrivez/i), 'Test description');

      // Switch to conditions tab
      await user.click(screen.getByText('Conditions'));

      // Add a condition
      await user.click(screen.getByText('Ajouter une condition'));
      
      // Wait for condition form to appear
      await waitFor(() => {
        expect(screen.getByText('Sélectionner un champ')).toBeInTheDocument();
      });

      // Save the rule
      await user.click(screen.getByText('Enregistrer'));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Rule',
            type: 'PLANNING',
            description: 'Test description'
          })
        );
      });
    });

    it('should create a rule from template', async () => {
      const template: RuleTemplate = {
        id: 'test-template',
        name: 'Test Modèle',
        category: 'Test',
        description: 'Modèle description',
        baseRule: {
          name: 'Rule from template',
          description: 'Modèle rule',
          type: 'PLANNING',
          priority: 10,
          conditions: [
            { field: 'user.role', operator: 'EQUALS', value: 'IADE' }
          ],
          actions: [
            { type: 'PREVENT', target: 'attribution', message: 'Not allowed' }
          ]
        },
        parameters: [],
        examples: []
      };

      render(
        <RuleBuilder 
          template={template}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Modèle info should be displayed
      expect(screen.getByText('Basé sur le template : Test Modèle')).toBeInTheDocument();

      // Fields should be pre-filled
      expect(screen.getByDisplayValue('Rule from template')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Modèle rule')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should show validation errors', async () => {
      const user = userEvent.setup();
      
      render(
        <RuleBuilder 
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Try to save without filling required fields
      await user.click(screen.getByText('Enregistrer'));

      // Should not call onSave
      expect(mockOnSave).not.toHaveBeenCalled();

      // Fill name only
      await user.type(screen.getByPlaceholderText('Ex: Limite gardes hebdomadaires'), 'Test');
      
      // Try to save again
      await user.click(screen.getByText('Enregistrer'));

      // Still should not save (missing conditions/actions)
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should show status indicators', async () => {
      const user = userEvent.setup();
      
      render(
        <RuleBuilder 
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Make a change
      await user.type(screen.getByPlaceholderText('Ex: Limite gardes hebdomadaires'), 'Test');

      // Should show dirty indicator
      expect(screen.getByText('Modifications non sauvegardées')).toBeInTheDocument();
    });
  });

  describe('Conflict detection', () => {
    it('should display conflicts', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          conflicts: [{
            id: 'conflict-1',
            ruleIds: ['rule-1', 'rule-2'],
            type: 'condition_overlap',
            severity: 'high',
            description: 'Rules have overlapping conditions',
            detectedAt: new Date()
          }]
        })
      });

      const user = userEvent.setup();
      
      render(
        <RuleBuilder 
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Add rule details that would trigger conflict check
      await user.type(screen.getByPlaceholderText('Ex: Limite gardes hebdomadaires'), 'Test Rule');
      
      // Switch to conditions
      await user.click(screen.getByText('Conditions'));
      await user.click(screen.getByText('Ajouter une condition'));

      // Wait for conflict to be displayed
      await waitFor(() => {
        expect(screen.getByText('1 conflit détecté')).toBeInTheDocument();
        expect(screen.getByText('Rules have overlapping conditions')).toBeInTheDocument();
      });
    });
  });

  describe('Preview functionality', () => {
    it('should open preview panel', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'sim-1',
          ruleId: 'preview',
          startDate: new Date(),
          endDate: new Date(),
          affectedUsers: [],
          violations: [],
          metrics: {
            totalViolations: 0,
            affectedUsersCount: 0,
            complianceRate: 1,
            estimatedWorkloadChange: 0
          },
          status: 'completed'
        })
      });

      render(
        <RuleBuilder 
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Fill minimum required fields
      await user.type(screen.getByPlaceholderText('Ex: Limite gardes hebdomadaires'), 'Test Rule');
      await user.selectOptions(screen.getByRole('combobox', { name: /type/i }), 'PLANNING');
      await user.type(screen.getByPlaceholderText(/décrivez/i), 'Test');

      // Click preview
      await user.click(screen.getByText('Prévisualiser'));

      // Preview panel should open
      await waitFor(() => {
        expect(screen.getByText('Prévisualisation de la règle')).toBeInTheDocument();
        expect(screen.getByText('Simulation sur les 30 prochains jours')).toBeInTheDocument();
      });
    });
  });

  describe('Advanced features', () => {
    it('should handle tags input', async () => {
      const user = userEvent.setup();
      
      render(
        <RuleBuilder 
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Go to advanced tab
      await user.click(screen.getByText('Avancé'));

      // Add tags
      await user.type(screen.getByPlaceholderText('garde, weekend, IADE'), 'test, planning, critical');

      // Save
      await user.click(screen.getByText('Enregistrer'));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: ['test', 'planning', 'critical']
          })
        );
      });
    });

    it('should handle date inputs', async () => {
      const user = userEvent.setup();
      
      render(
        <RuleBuilder 
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Go to advanced tab
      await user.click(screen.getByText('Avancé'));

      // Set dates
      const effectiveInput = screen.getByLabelText("Date d'effet");
      const expirationInput = screen.getByLabelText('Date d\'expiration (optionnel)');

      await user.type(effectiveInput, '2024-01-01T00:00');
      await user.type(expirationInput, '2024-12-31T23:59');

      // Verify dates are set
      expect(effectiveInput).toHaveValue('2024-01-01T00:00');
      expect(expirationInput).toHaveValue('2024-12-31T23:59');
    });
  });
});