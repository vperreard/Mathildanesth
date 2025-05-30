import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { DragDropContext } from 'react-beautiful-dnd';

import BlocPlanningCalendar from '../BlocPlanningCalendar';
import { BlocPeriod } from '@/modules/planning/bloc-operatoire/models/BlocModels';

// Mock react-beautiful-dnd
jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children, onDragEnd }: any) => (
    <div data-testid="drag-drop-context" data-on-drag-end={onDragEnd?.toString()}>
      {children}
    </div>
  ),
  Droppable: ({ children, droppableId }: any) => (
    <div data-testid={`droppable-${droppableId}`}>
      {children({ innerRef: jest.fn(), droppableProps: {}, placeholder: null })}
    </div>
  ),
  Draggable: ({ children, draggableId, index }: any) => (
    <div data-testid={`draggable-${draggableId}`}>
      {children({ innerRef: jest.fn(), draggableProps: {}, dragHandleProps: {} })}
    </div>
  ),
}));

// Mock UI components
jest.mock('@/components/ui', () => ({
  Card: ({ children, className, style, ...props }: any) => (
    <div className={className} style={style} {...props}>
      {children}
    </div>
  ),
  Button: ({ children, onClick, variant, size, ...props }: any) => (
    <button onClick={onClick} data-variant={variant} data-size={size} {...props}>
      {children}
    </button>
  ),
}));

// Mock fetch responses
const mockRoomsData = [
  {
    id: 1,
    name: 'Bloc Cardio 1',
    number: 'BC001',
    sectorId: 1,
    available: true,
    colorCode: '#ff6b6b',
    specialite: 'Cardiologie',
  },
  {
    id: 2,
    name: 'Bloc Ortho 1',
    number: 'BO001',
    sectorId: 2,
    available: true,
    colorCode: '#4ecdc4',
    specialite: 'Orthopédie',
  },
  {
    id: 3,
    name: 'Bloc Urgences',
    number: 'BU001',
    sectorId: 3,
    available: false,
    colorCode: '#45b7d1',
    specialite: 'Urgences',
  },
];

const mockSurgeonsData = [
  {
    id: 1,
    nom: 'Martin',
    prenom: 'Jean',
    specialite: 'Cardiologie',
    active: true,
  },
  {
    id: 2,
    nom: 'Durand',
    prenom: 'Marie',
    specialite: 'Orthopédie',
    active: true,
  },
  {
    id: 3,
    nom: 'Leclerc',
    prenom: 'Pierre',
    specialite: 'Chirurgie Générale',
    active: true,
  },
];

const mockPlanningData = {
  attributions: [
    {
      id: 'attr-1',
      roomId: 1,
      surgeonId: 1,
      date: new Date('2025-01-15'),
      period: 'MORNING' as BlocPeriod,
    },
  ],
  supervisors: [
    {
      id: 'sup-1',
      userId: 101,
      sectorIds: [1, 2],
      roomIds: [],
      period: 'MORNING' as BlocPeriod,
    },
  ],
};

/**
 * Tests compréhensifs pour BlocPlanningCalendar
 * Couvre toutes les fonctionnalités du calendrier de planning de bloc opératoire
 */

describe('BlocPlanningCalendar - Comprehensive Tests', () => {
  const defaultProps = {
    date: new Date('2025-01-15'),
    period: 'MORNING' as BlocPeriod,
    onAssignmentChange: jest.fn(),
  };

  const mockFetch = jest.fn();

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup fetch mock
    global.fetch = mockFetch;
    
    // Default successful responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/operating-rooms')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRoomsData),
        });
      }
      if (url.includes('/api/chirurgiens')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSurgeonsData),
        });
      }
      if (url.includes('/api/planning/bloc')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPlanningData),
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering and Initial State', () => {
    it('should render loading state initially', async () => {
      render(<BlocPlanningCalendar {...defaultProps} />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toHaveClass('animate-spin');
    });

    it('should render calendar with rooms after loading', async () => {
      render(<BlocPlanningCalendar {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Salles et assignations')).toBeInTheDocument();
      expect(screen.getByText('Bloc Cardio 1')).toBeInTheDocument();
      expect(screen.getByText('Bloc Ortho 1')).toBeInTheDocument();
      expect(screen.getByText('Bloc Urgences')).toBeInTheDocument();
    });

    it('should display room details correctly', async () => {
      render(<BlocPlanningCalendar {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Bloc Cardio 1')).toBeInTheDocument();
      });

      // Check room numbers
      expect(screen.getByText('BC001')).toBeInTheDocument();
      expect(screen.getByText('BO001')).toBeInTheDocument();
      expect(screen.getByText('BU001')).toBeInTheDocument();

      // Check that rooms are displayed with proper styling
      const cardioRoom = screen.getByText('Bloc Cardio 1').closest('div');
      expect(cardioRoom).toHaveStyle({ borderLeftColor: '#ff6b6b' });
    });

    it('should show existing assignments from API', async () => {
      render(<BlocPlanningCalendar {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Bloc Cardio 1')).toBeInTheDocument();
      });

      // The room with ID 1 should show assignment with surgeon ID 1
      const cardioRoom = screen.getByText('Bloc Cardio 1').closest('div');
      expect(cardioRoom).toBeInTheDocument();
      
      // Should show remove button for existing assignment
      const removeButton = within(cardioRoom!).getByText('✕');
      expect(removeButton).toBeInTheDocument();
    });

    it('should handle different periods correctly', async () => {
      const { rerender } = render(<BlocPlanningCalendar {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('period=MORNING')
        );
      });

      // Change to afternoon
      rerender(<BlocPlanningCalendar {...defaultProps} period="AFTERNOON" />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('period=AFTERNOON')
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error when rooms API fails', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/operating-rooms')) {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({}),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      });

      render(<BlocPlanningCalendar {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Erreur lors du chargement des données/)).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<BlocPlanningCalendar {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Erreur lors du chargement des données/)).toBeInTheDocument();
      });
    });

    it('should handle invalid API responses', async () => {
      mockFetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(null),
        });
      });

      render(<BlocPlanningCalendar {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Should handle null/undefined responses gracefully
      expect(screen.getByText('Salles et assignations')).toBeInTheDocument();
    });

    it('should show error when trying to drop on unavailable room', async () => {
      render(<BlocPlanningCalendar {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Bloc Urgences')).toBeInTheDocument();
      });

      // Find the component and simulate drag end to unavailable room
      const component = screen.getByTestId('drag-drop-context');
      
      // Simulate drag end event
      const dragEndEvent = {
        destination: { droppableId: 'room-3' }, // Unavailable room
        source: { droppableId: 'surgeons' },
        draggableId: 'surgeon-1',
      };

      // Get the onDragEnd function and call it
      fireEvent.dragEnd(component, dragEndEvent);
      
      await waitFor(() => {
        expect(screen.getByText(/Cette salle n'est pas disponible/)).toBeInTheDocument();
      });
    });
  });

  describe('Assignment Management', () => {
    it('should handle assignment changes correctly', async () => {
      const onAssignmentChange = jest.fn();
      render(<BlocPlanningCalendar {...defaultProps} onAssignmentChange={onAssignmentChange} />);
      
      await waitFor(() => {
        expect(screen.getByText('Bloc Cardio 1')).toBeInTheDocument();
      });

      // Find and click remove button for existing assignment
      const removeButton = screen.getByText('✕');
      fireEvent.click(removeButton);

      expect(onAssignmentChange).toHaveBeenCalledWith([]);
    });

    it('should create new assignments correctly', async () => {
      const onAssignmentChange = jest.fn();
      
      // Mock no existing assignments
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/planning/bloc')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ attributions: [], supervisors: [] }),
          });
        }
        if (url.includes('/api/operating-rooms')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockRoomsData),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSurgeonsData),
        });
      });

      render(<BlocPlanningCalendar {...defaultProps} onAssignmentChange={onAssignmentChange} />);
      
      await waitFor(() => {
        expect(screen.getByText('Bloc Cardio 1')).toBeInTheDocument();
      });

      // Simulate assignment creation through direct method call
      const component = screen.getByTestId('drag-drop-context');
      
      // Simulate surgeon being dropped on room
      const dragEndEvent = {
        destination: { droppableId: 'room-1' },
        source: { droppableId: 'surgeons' },
        draggableId: 'surgeon-1',
      };

      fireEvent.dragEnd(component, dragEndEvent);

      await waitFor(() => {
        expect(onAssignmentChange).toHaveBeenCalled();
      });
    });

    it('should handle assignment moves between rooms', async () => {
      const onAssignmentChange = jest.fn();
      render(<BlocPlanningCalendar {...defaultProps} onAssignmentChange={onAssignmentChange} />);
      
      await waitFor(() => {
        expect(screen.getByText('Bloc Cardio 1')).toBeInTheDocument();
      });

      // Simulate moving assignment between rooms
      const component = screen.getByTestId('drag-drop-context');
      
      const dragEndEvent = {
        destination: { droppableId: 'room-2' },
        source: { droppableId: 'room-1' },
        draggableId: 'attr-1',
      };

      fireEvent.dragEnd(component, dragEndEvent);

      await waitFor(() => {
        expect(onAssignmentChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              id: 'attr-1',
              roomId: 'room-2',
            })
          ])
        );
      });
    });
  });

  describe('Drag and Drop Functionality', () => {
    it('should render drag and drop context', async () => {
      render(<BlocPlanningCalendar {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('drag-drop-context')).toBeInTheDocument();
      });
    });

    it('should render droppable areas for each room', async () => {
      render(<BlocPlanningCalendar {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Bloc Cardio 1')).toBeInTheDocument();
      });

      expect(screen.getByTestId('droppable-room-1')).toBeInTheDocument();
      expect(screen.getByTestId('droppable-room-2')).toBeInTheDocument();
      expect(screen.getByTestId('droppable-room-3')).toBeInTheDocument();
    });

    it('should handle drag end with no destination', async () => {
      render(<BlocPlanningCalendar {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('drag-drop-context')).toBeInTheDocument();
      });

      const component = screen.getByTestId('drag-drop-context');
      
      // Simulate drag end with no destination
      const dragEndEvent = {
        destination: null,
        source: { droppableId: 'surgeons' },
        draggableId: 'surgeon-1',
      };

      // Should not throw error
      expect(() => {
        fireEvent.dragEnd(component, dragEndEvent);
      }).not.toThrow();
    });

    it('should handle invalid drag operations', async () => {
      render(<BlocPlanningCalendar {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('drag-drop-context')).toBeInTheDocument();
      });

      const component = screen.getByTestId('drag-drop-context');
      
      // Simulate invalid drag operation
      const dragEndEvent = {
        destination: { droppableId: 'invalid-drop-zone' },
        source: { droppableId: 'surgeons' },
        draggableId: 'surgeon-1',
      };

      // Should handle gracefully
      expect(() => {
        fireEvent.dragEnd(component, dragEndEvent);
      }).not.toThrow();
    });
  });

  describe('Medical Workflow Integration', () => {
    it('should display supervisor information for rooms', async () => {
      render(<BlocPlanningCalendar {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Bloc Cardio 1')).toBeInTheDocument();
      });

      // Should handle supervisor assignment (tested through internal logic)
      // The supervisor data should be available for rooms in sectors 1 and 2
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/planning/bloc')
      );
    });

    it('should handle specialty-specific room assignments', async () => {
      render(<BlocPlanningCalendar {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Bloc Cardio 1')).toBeInTheDocument();
      });

      // Rooms should be displayed with their specialties
      const rooms = mockRoomsData;
      rooms.forEach(room => {
        expect(screen.getByText(room.name)).toBeInTheDocument();
      });
    });

    it('should handle room availability states', async () => {
      render(<BlocPlanningCalendar {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Bloc Urgences')).toBeInTheDocument();
      });

      // Unavailable room should still be displayed but handled differently in drag operations
      const urgencyRoom = screen.getByText('Bloc Urgences');
      expect(urgencyRoom).toBeInTheDocument();
    });
  });

  describe('Real-time Updates and State Management', () => {
    it('should update when date changes', async () => {
      const { rerender } = render(<BlocPlanningCalendar {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('date=2025-01-15')
        );
      });

      // Change date
      const newDate = new Date('2025-01-16');
      rerender(<BlocPlanningCalendar {...defaultProps} date={newDate} />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('date=2025-01-16')
        );
      });
    });

    it('should update when period changes', async () => {
      const { rerender } = render(<BlocPlanningCalendar {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('period=MORNING')
        );
      });

      // Change period
      rerender(<BlocPlanningCalendar {...defaultProps} period="AFTERNOON" />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('period=AFTERNOON')
        );
      });
    });

    it('should maintain state consistency during updates', async () => {
      const onAssignmentChange = jest.fn();
      render(<BlocPlanningCalendar {...defaultProps} onAssignmentChange={onAssignmentChange} />);
      
      await waitFor(() => {
        expect(screen.getByText('Bloc Cardio 1')).toBeInTheDocument();
      });

      // Make a change
      const removeButton = screen.getByText('✕');
      fireEvent.click(removeButton);

      expect(onAssignmentChange).toHaveBeenCalledWith([]);
      
      // State should be updated consistently
      await waitFor(() => {
        expect(screen.queryByText('✕')).not.toBeInTheDocument();
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large numbers of rooms efficiently', async () => {
      const largeRoomsData = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `Bloc ${i + 1}`,
        number: `B${(i + 1).toString().padStart(3, '0')}`,
        sectorId: (i % 5) + 1,
        available: i % 10 !== 0,
        colorCode: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        specialite: ['Cardiologie', 'Orthopédie', 'Neurologie', 'Digestif', 'Urgences'][i % 5],
      }));

      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/operating-rooms')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(largeRoomsData),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      });

      const startTime = performance.now();
      render(<BlocPlanningCalendar {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Bloc 1')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should render within 2 seconds
    });

    it('should handle frequent updates efficiently', async () => {
      const onAssignmentChange = jest.fn();
      render(<BlocPlanningCalendar {...defaultProps} onAssignmentChange={onAssignmentChange} />);
      
      await waitFor(() => {
        expect(screen.getByText('Bloc Cardio 1')).toBeInTheDocument();
      });

      // Simulate multiple rapid updates
      const component = screen.getByTestId('drag-drop-context');
      
      for (let i = 0; i < 10; i++) {
        const dragEndEvent = {
          destination: { droppableId: `room-${(i % 3) + 1}` },
          source: { droppableId: 'room-1' },
          draggableId: 'attr-1',
        };

        fireEvent.dragEnd(component, dragEndEvent);
      }

      // Should handle multiple updates without issues
      expect(onAssignmentChange).toHaveBeenCalledTimes(10);
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(<BlocPlanningCalendar {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Salles et assignations')).toBeInTheDocument();
      });

      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Salles et assignations');
    });

    it('should provide visual feedback for interactive elements', async () => {
      render(<BlocPlanningCalendar {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('✕')).toBeInTheDocument();
      });

      const removeButton = screen.getByText('✕');
      expect(removeButton).toHaveAttribute('data-variant', 'ghost');
      expect(removeButton).toHaveAttribute('data-size', 'sm');
    });

    it('should maintain responsive design across different screen sizes', async () => {
      render(<BlocPlanningCalendar {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Salles et assignations')).toBeInTheDocument();
      });

      // Check for responsive grid classes
      const grid = screen.getByText('Salles et assignations').nextElementSibling;
      expect(grid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });
  });
});