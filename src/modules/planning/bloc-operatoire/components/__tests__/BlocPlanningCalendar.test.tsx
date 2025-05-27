import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import BlocPlanningCalendar from '../BlocPlanningCalendar';
import { BlocPeriod } from '../../models/BlocModels';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Mock fetch
global.fetch = jest.fn();

// Mock react-beautiful-dnd
jest.mock('react-beautiful-dnd', () => ({
    DragDropContext: ({ children, onDragEnd }: any) => {
        // Store onDragEnd for testing
        (global as any).mockOnDragEnd = onDragEnd;
        return <div data-testid="drag-drop-context">{children}</div>;
    },
    Droppable: ({ children, droppableId }: any) => (
        <div data-testid={`droppable-${droppableId}`}>
            {children({
                draggableProps: {},
                dragHandleProps: {},
                innerRef: jest.fn(),
                placeholder: null
            })}
        </div>
    ),
    Draggable: ({ children, draggableId, index }: any) => (
        <div data-testid={`draggable-${draggableId}`}>
            {children({
                draggableProps: { 'data-index': index },
                dragHandleProps: {},
                innerRef: jest.fn(),
                isDragging: false
            })}
        </div>
    )
}));

// Mock UI components
jest.mock('@/components/ui', () => ({
    Card: ({ children, className }: any) => (
        <div data-testid="card" className={className}>{children}</div>
    ),
    Button: ({ children, onClick, variant, size, disabled, ...props }: any) => (
        <button 
            data-testid="button" 
            onClick={onClick}
            disabled={disabled}
            data-variant={variant}
            data-size={size}
            {...props}
        >
            {children}
        </button>
    )
}));

describe('BlocPlanningCalendar', () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    const mockDate = new Date('2025-01-15');
    const mockPeriod = BlocPeriod.MORNING;
    const mockOnAssignmentChange = jest.fn();

    const mockRooms = [
        { id: 'room-1', name: 'Salle 1', type: 'SURGERY', available: true },
        { id: 'room-2', name: 'Salle 2', type: 'SURGERY', available: true },
        { id: 'room-3', name: 'Salle 3', type: 'ENDOSCOPY', available: false }
    ];

    const mockSurgeons = [
        { id: 'surgeon-1', name: 'Dr. Smith', specialties: ['ORTHO'] },
        { id: 'surgeon-2', name: 'Dr. Jones', specialties: ['CARDIO'] },
        { id: 'surgeon-3', name: 'Dr. Brown', specialties: ['GENERAL'] }
    ];

    const mockAssignments = [
        {
            id: 'assignment-1',
            roomId: 'room-1',
            surgeonId: 'surgeon-1',
            startTime: '08:00',
            endTime: '12:00',
            procedureType: 'SURGERY'
        }
    ];

    const mockSupervisors = [
        {
            id: 'supervisor-1',
            userId: 'user-1',
            sectorId: 'sector-1',
            role: 'SENIOR'
        }
    ];

    const defaultProps = {
        date: mockDate,
        period: mockPeriod,
        onAssignmentChange: mockOnAssignmentChange
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockFetch.mockImplementation((url) => {
            if (url.toString().includes('/api/operating-rooms')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockRooms
                } as Response);
            }
            if (url.toString().includes('/api/surgeons')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockSurgeons
                } as Response);
            }
            if (url.toString().includes('/api/planning/bloc')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        assignments: mockAssignments,
                        supervisors: mockSupervisors
                    })
                } as Response);
            }
            return Promise.resolve({
                ok: false,
                json: async () => ({})
            } as Response);
        });
    });

    describe('data loading', () => {
        it('should load rooms, surgeons and planning on mount', async () => {
            render(<BlocPlanningCalendar {...defaultProps} />);

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith('/api/operating-rooms');
                expect(mockFetch).toHaveBeenCalledWith('/api/surgeons');
                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining('2025-01-15')
                );
            });

            // Check if rooms are displayed
            expect(screen.getByText('Salle 1')).toBeInTheDocument();
            expect(screen.getByText('Salle 2')).toBeInTheDocument();
            expect(screen.getByText('Salle 3')).toBeInTheDocument();
        });

        it('should handle loading state', () => {
            render(<BlocPlanningCalendar {...defaultProps} />);

            expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        });

        it('should handle error when fetching rooms fails', async () => {
            mockFetch.mockImplementationOnce(() => 
                Promise.resolve({
                    ok: false,
                    status: 500
                } as Response)
            );

            render(<BlocPlanningCalendar {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('Erreur lors de la récupération des salles')).toBeInTheDocument();
            });
        });

        it('should handle empty responses gracefully', async () => {
            mockFetch.mockImplementation((url) => {
                if (url.toString().includes('/api/operating-rooms')) {
                    return Promise.resolve({
                        ok: true,
                        json: async () => []
                    } as Response);
                }
                return Promise.resolve({
                    ok: true,
                    json: async () => ({})
                } as Response);
            });

            render(<BlocPlanningCalendar {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('Aucune salle disponible')).toBeInTheDocument();
            });
        });
    });

    describe('room display', () => {
        it('should display available rooms differently from unavailable ones', async () => {
            render(<BlocPlanningCalendar {...defaultProps} />);

            await waitFor(() => {
                const room1 = screen.getByTestId('room-room-1');
                const room3 = screen.getByTestId('room-room-3');

                expect(room1).toHaveClass('available');
                expect(room3).toHaveClass('unavailable');
            });
        });

        it('should show room type indicators', async () => {
            render(<BlocPlanningCalendar {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('SURGERY')).toBeInTheDocument();
                expect(screen.getByText('ENDOSCOPY')).toBeInTheDocument();
            });
        });
    });

    describe('assignments display', () => {
        it('should display existing assignments', async () => {
            render(<BlocPlanningCalendar {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
                expect(screen.getByText('08:00 - 12:00')).toBeInTheDocument();
            });
        });

        it('should show empty slots for unassigned rooms', async () => {
            render(<BlocPlanningCalendar {...defaultProps} />);

            await waitFor(() => {
                const room2Slot = screen.getByTestId('room-room-2-slot');
                expect(room2Slot).toHaveTextContent('Libre');
            });
        });
    });

    describe('drag and drop functionality', () => {
        it('should allow dragging surgeons to rooms', async () => {
            render(<BlocPlanningCalendar {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('Dr. Jones')).toBeInTheDocument();
            });

            // Simulate drag end
            const dragResult = {
                draggableId: 'surgeon-2',
                source: { droppableId: 'surgeons', index: 1 },
                destination: { droppableId: 'room-2', index: 0 }
            };

            act(() => {
                (global as any).mockOnDragEnd(dragResult);
            });

            await waitFor(() => {
                expect(mockOnAssignmentChange).toHaveBeenCalledWith(
                    expect.arrayContaining([
                        expect.objectContaining({
                            roomId: 'room-2',
                            surgeonId: 'surgeon-2'
                        })
                    ])
                );
            });
        });

        it('should prevent dropping on unavailable rooms', async () => {
            render(<BlocPlanningCalendar {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('Dr. Jones')).toBeInTheDocument();
            });

            const dragResult = {
                draggableId: 'surgeon-2',
                source: { droppableId: 'surgeons', index: 1 },
                destination: { droppableId: 'room-3', index: 0 } // Unavailable room
            };

            act(() => {
                (global as any).mockOnDragEnd(dragResult);
            });

            expect(mockOnAssignmentChange).not.toHaveBeenCalled();
            expect(screen.getByText('Cette salle n\'est pas disponible')).toBeInTheDocument();
        });

        it('should allow reordering assignments between rooms', async () => {
            render(<BlocPlanningCalendar {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
            });

            const dragResult = {
                draggableId: 'assignment-1',
                source: { droppableId: 'room-1', index: 0 },
                destination: { droppableId: 'room-2', index: 0 }
            };

            act(() => {
                (global as any).mockOnDragEnd(dragResult);
            });

            await waitFor(() => {
                expect(mockOnAssignmentChange).toHaveBeenCalledWith(
                    expect.arrayContaining([
                        expect.objectContaining({
                            id: 'assignment-1',
                            roomId: 'room-2'
                        })
                    ])
                );
            });
        });

        it('should handle dropping outside droppable areas', async () => {
            render(<BlocPlanningCalendar {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('Dr. Jones')).toBeInTheDocument();
            });

            const dragResult = {
                draggableId: 'surgeon-2',
                source: { droppableId: 'surgeons', index: 1 },
                destination: null
            };

            act(() => {
                (global as any).mockOnDragEnd(dragResult);
            });

            expect(mockOnAssignmentChange).not.toHaveBeenCalled();
        });
    });

    describe('supervisor management', () => {
        it('should display assigned supervisors', async () => {
            render(<BlocPlanningCalendar {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('supervisor-sector-1')).toBeInTheDocument();
            });
        });

        it('should allow adding supervisors', async () => {
            render(<BlocPlanningCalendar {...defaultProps} />);

            await waitFor(() => {
                const addSupervisorButton = screen.getByText('Ajouter un superviseur');
                fireEvent.click(addSupervisorButton);
            });

            expect(screen.getByTestId('supervisor-modal')).toBeInTheDocument();
        });
    });

    describe('time slot management', () => {
        it('should display time slots based on period', async () => {
            render(<BlocPlanningCalendar {...defaultProps} />);

            await waitFor(() => {
                // Morning slots
                expect(screen.getByText('08:00')).toBeInTheDocument();
                expect(screen.getByText('12:00')).toBeInTheDocument();
            });
        });

        it('should display afternoon slots for AFTERNOON period', async () => {
            render(<BlocPlanningCalendar {...defaultProps} period={BlocPeriod.AFTERNOON} />);

            await waitFor(() => {
                expect(screen.getByText('13:00')).toBeInTheDocument();
                expect(screen.getByText('18:00')).toBeInTheDocument();
            });
        });

        it('should display all day slots for ALL_DAY period', async () => {
            render(<BlocPlanningCalendar {...defaultProps} period={BlocPeriod.ALL_DAY} />);

            await waitFor(() => {
                expect(screen.getByText('08:00')).toBeInTheDocument();
                expect(screen.getByText('18:00')).toBeInTheDocument();
            });
        });
    });

    describe('assignment actions', () => {
        it('should allow editing assignments', async () => {
            render(<BlocPlanningCalendar {...defaultProps} />);

            await waitFor(() => {
                const editButton = screen.getByTestId('edit-assignment-1');
                fireEvent.click(editButton);
            });

            expect(screen.getByTestId('assignment-edit-modal')).toBeInTheDocument();
        });

        it('should allow deleting assignments', async () => {
            render(<BlocPlanningCalendar {...defaultProps} />);

            await waitFor(() => {
                const deleteButton = screen.getByTestId('delete-assignment-1');
                fireEvent.click(deleteButton);
            });

            // Confirm deletion
            const confirmButton = screen.getByText('Confirmer');
            fireEvent.click(confirmButton);

            await waitFor(() => {
                expect(mockOnAssignmentChange).toHaveBeenCalledWith(
                    expect.not.arrayContaining([
                        expect.objectContaining({ id: 'assignment-1' })
                    ])
                );
            });
        });
    });

    describe('save functionality', () => {
        it('should save changes when save button is clicked', async () => {
            mockFetch.mockImplementation((url, options) => {
                if (options?.method === 'POST' && url.toString().includes('/api/planning/bloc')) {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({ success: true })
                    } as Response);
                }
                return Promise.resolve({
                    ok: true,
                    json: async () => ({})
                } as Response);
            });

            render(<BlocPlanningCalendar {...defaultProps} />);

            await waitFor(() => {
                const saveButton = screen.getByText('Enregistrer');
                fireEvent.click(saveButton);
            });

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/planning/bloc'),
                    expect.objectContaining({
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: expect.stringContaining('assignments')
                    })
                );
            });

            expect(screen.getByText('Planning enregistré avec succès')).toBeInTheDocument();
        });

        it('should handle save errors', async () => {
            mockFetch.mockImplementation((url, options) => {
                if (options?.method === 'POST') {
                    return Promise.resolve({
                        ok: false,
                        status: 500
                    } as Response);
                }
                return Promise.resolve({
                    ok: true,
                    json: async () => ({})
                } as Response);
            });

            render(<BlocPlanningCalendar {...defaultProps} />);

            await waitFor(() => {
                const saveButton = screen.getByText('Enregistrer');
                fireEvent.click(saveButton);
            });

            await waitFor(() => {
                expect(screen.getByText('Erreur lors de l\'enregistrement')).toBeInTheDocument();
            });
        });
    });

    describe('validation', () => {
        it('should validate assignments before saving', async () => {
            render(<BlocPlanningCalendar {...defaultProps} />);

            // Add conflicting assignment
            const dragResult = {
                draggableId: 'surgeon-3',
                source: { droppableId: 'surgeons', index: 2 },
                destination: { droppableId: 'room-1', index: 0 } // Already has assignment
            };

            act(() => {
                (global as any).mockOnDragEnd(dragResult);
            });

            await waitFor(() => {
                expect(screen.getByText('Conflit de planning détecté')).toBeInTheDocument();
            });
        });

        it('should check surgeon availability', async () => {
            // Mock surgeon already assigned elsewhere
            mockFetch.mockImplementation((url) => {
                if (url.toString().includes('/api/surgeons/surgeon-1/availability')) {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({ available: false })
                    } as Response);
                }
                return Promise.resolve({
                    ok: true,
                    json: async () => ({})
                } as Response);
            });

            render(<BlocPlanningCalendar {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('Dr. Smith (Non disponible)')).toBeInTheDocument();
            });
        });
    });

    describe('filtering and search', () => {
        it('should filter rooms by type', async () => {
            render(<BlocPlanningCalendar {...defaultProps} />);

            await waitFor(() => {
                const filterSelect = screen.getByTestId('room-type-filter');
                fireEvent.change(filterSelect, { target: { value: 'SURGERY' } });
            });

            expect(screen.getByText('Salle 1')).toBeInTheDocument();
            expect(screen.getByText('Salle 2')).toBeInTheDocument();
            expect(screen.queryByText('Salle 3')).not.toBeInTheDocument();
        });

        it('should search surgeons by name', async () => {
            render(<BlocPlanningCalendar {...defaultProps} />);

            await waitFor(() => {
                const searchInput = screen.getByPlaceholderText('Rechercher un chirurgien');
                fireEvent.change(searchInput, { target: { value: 'Smith' } });
            });

            expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
            expect(screen.queryByText('Dr. Jones')).not.toBeInTheDocument();
        });
    });

    describe('accessibility', () => {
        it('should have proper ARIA labels', async () => {
            render(<BlocPlanningCalendar {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByRole('region', { name: 'Planning du bloc opératoire' })).toBeInTheDocument();
                expect(screen.getByRole('list', { name: 'Salles disponibles' })).toBeInTheDocument();
                expect(screen.getByRole('list', { name: 'Chirurgiens disponibles' })).toBeInTheDocument();
            });
        });

        it('should announce drag and drop operations', async () => {
            render(<BlocPlanningCalendar {...defaultProps} />);

            await waitFor(() => {
                const draggableItem = screen.getByTestId('draggable-surgeon-2');
                expect(draggableItem).toHaveAttribute('aria-label', 'Dr. Jones - Glisser pour assigner');
            });
        });
    });
});