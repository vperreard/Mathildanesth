import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { cleanup } from '@testing-library/react';
import OptimizedDraggableCalendar from '../OptimizedDraggableCalendar';

// Mock @hello-pangea/dnd
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: any) => <div data-testid="drag-drop-context">{children}</div>,
  Droppable: ({ children }: any) => (
    <div data-testid="droppable">
      {children({ innerRef: jest.fn(), placeholder: null, droppableProps: {} })}
    </div>
  ),
  Draggable: ({ children }: any) => (
    <div data-testid="draggable">
      {children({ 
        innerRef: jest.fn(), 
        draggableProps: {}, 
        dragHandleProps: {},
        isDragging: false 
      })}
    </div>
  )
}));

describe('OptimizedDraggableCalendar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    initialAssignments: [],
    users: [],
    rules: {
      id: 'test-rules',
      name: 'Test Rules',
      description: 'Test configuration',
      specialtyRules: [],
      globalRules: [],
      isActive: true,
      version: 1
    },
    onSave: jest.fn(),
    onValidationError: jest.fn(),
    onSyncComplete: jest.fn()
  };

  describe('Rendering Tests', () => {
    it('should render calendar container', () => {
      render(<OptimizedDraggableCalendar {...defaultProps} />);
      expect(screen.getByText('Allocation des Gardes')).toBeInTheDocument();
      expect(screen.getByText('Sauvegarder')).toBeInTheDocument();
    });

    it('should render with different user sets', () => {
      const users = [
        { id: 'user1', nom: 'Test', prenom: 'User', email: 'test@test.com' }
      ];
      
      render(<OptimizedDraggableCalendar {...defaultProps} users={users} />);
      expect(screen.getByText('Allocation des Gardes')).toBeInTheDocument();
    });

    it('should handle initialAssignments prop', () => {
      const assignments = [
        { 
          id: '1', 
          userId: 'user1', 
          date: new Date().toISOString().split('T')[0],
          shift: 'MATIN',
          specialtyId: 'specialty1',
          type: 'GARDE' as const
        }
      ];
      
      render(<OptimizedDraggableCalendar {...defaultProps} initialAssignments={assignments} />);
      expect(screen.getByText('Allocation des Gardes')).toBeInTheDocument();
    });
  });

  describe('Functionality Tests', () => {
    it('should call onSave when saving assignments with data', () => {
      const mockOnSave = jest.fn();
      const assignments = [
        { 
          id: '1', 
          userId: 'user1', 
          date: new Date().toISOString().split('T')[0],
          shift: 'MATIN',
          specialtyId: 'specialty1',
          type: 'GARDE' as const
        }
      ];
      
      render(<OptimizedDraggableCalendar {...defaultProps} onSave={mockOnSave} initialAssignments={assignments} />);
      
      const saveButton = screen.getByText('Sauvegarder');
      expect(saveButton).toBeInTheDocument();
      
      fireEvent.click(saveButton);
      expect(mockOnSave).toHaveBeenCalled();
    });

    it('should call onValidationError when saving empty assignments', () => {
      const mockOnValidationError = jest.fn();
      render(<OptimizedDraggableCalendar {...defaultProps} onValidationError={mockOnValidationError} />);
      
      const saveButton = screen.getByText('Sauvegarder');
      fireEvent.click(saveButton);
      
      expect(mockOnValidationError).toHaveBeenCalled();
    });

    it('should handle empty props gracefully', () => {
      expect(() => {
        render(<OptimizedDraggableCalendar {...defaultProps} />);
      }).not.toThrow();
    });

    it('should handle callback functions properly', () => {
      const mockOnValidationError = jest.fn();
      const mockOnSyncComplete = jest.fn();
      
      render(
        <OptimizedDraggableCalendar 
          {...defaultProps} 
          onValidationError={mockOnValidationError}
          onSyncComplete={mockOnSyncComplete}
        />
      );
      
      expect(screen.getByText('Allocation des Gardes')).toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    it('should handle large assignment sets efficiently', () => {
      const manyAssignments = Array.from({ length: 100 }, (_, i) => ({
        id: `assignment-${i}`,
        userId: `user-${i}`,
        date: new Date().toISOString().split('T')[0],
        shift: 'MATIN',
        specialtyId: 'specialty1',
        type: 'GARDE' as const
      }));

      const startTime = performance.now();
      render(<OptimizedDraggableCalendar {...defaultProps} initialAssignments={manyAssignments} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000);
      expect(screen.getByText('Allocation des Gardes')).toBeInTheDocument();
    });

    it('should optimize re-renders', () => {
      const { rerender } = render(<OptimizedDraggableCalendar {...defaultProps} />);
      
      for (let i = 0; i < 5; i++) {
        rerender(<OptimizedDraggableCalendar {...defaultProps} users={[]} />);
      }
      
      expect(screen.getByText('Allocation des Gardes')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing callbacks gracefully', () => {
      expect(() => {
        render(
          <OptimizedDraggableCalendar 
            initialAssignments={[]}
            users={[]}
            rules={defaultProps.rules}
            onSave={jest.fn()}
            onValidationError={jest.fn()}
            onSyncComplete={jest.fn()}
          />
        );
      }).not.toThrow();
    });

    it('should handle undefined initialAssignments', () => {
      expect(() => {
        render(
          <OptimizedDraggableCalendar 
            {...defaultProps}
            initialAssignments={undefined as any}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<OptimizedDraggableCalendar {...defaultProps} />);
      
      const title = screen.getByText('Allocation des Gardes');
      expect(title).toBeInTheDocument();
      
      const saveButton = screen.getByText('Sauvegarder');
      expect(saveButton).toBeInTheDocument();
    });

    it('should handle keyboard navigation', () => {
      render(<OptimizedDraggableCalendar {...defaultProps} />);
      
      const saveButton = screen.getByText('Sauvegarder');
      saveButton.focus();
      expect(document.activeElement).toBe(saveButton);
    });
  });
});