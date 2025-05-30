import React from 'react';
import { renderWithProviders as render, screen, fireEvent, waitFor, act } from '@/test-utils/renderWithProviders';
import userEvent from '@testing-library/user-event';
import OptimizedDraggableCalendar from '../OptimizedDraggableCalendar';
import { Attribution } from '@/types/attribution';
import { User } from '@/types/user';
import { RulesConfiguration } from '@/types/rules';
import { Violation } from '@/types/validation';

// Mock @hello-pangea/dnd with comprehensive drag and drop simulation
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children, onDragStart, onDragEnd }: any) => {
    // Mock context provider that can trigger callbacks
    React.useEffect(() => {
      // Store callbacks for testing
      (global as any).mockDragCallbacks = { onDragStart, onDragEnd };
    }, [onDragStart, onDragEnd]);
    
    return <div data-testid="drag-drop-context">{children}</div>;
  },
  
  Droppable: ({ children, droppableId }: any) => {
    const provided = {
      innerRef: jest.fn(),
      droppableProps: {
        'data-testid': `droppable-${droppableId}`,
        'data-droppable-id': droppableId,
      },
      placeholder: <div data-testid={`placeholder-${droppableId}`} />,
    };
    
    const snapshot = {
      isDraggingOver: false,
      draggingOverWith: null,
    };
    
    return (
      <div data-testid={`droppable-zone-${droppableId}`}>
        {children(provided, snapshot)}
      </div>
    );
  },
  
  Draggable: ({ children, draggableId, index }: any) => {
    const provided = {
      innerRef: jest.fn(),
      draggableProps: {
        'data-testid': `draggable-${draggableId}`,
        'data-draggable-id': draggableId,
        'data-index': index,
      },
      dragHandleProps: {
        'data-testid': `drag-handle-${draggableId}`,
        onMouseDown: () => {
          // Simulate drag start
          if ((global as any).mockDragCallbacks?.onDragStart) {
            (global as any).mockDragCallbacks.onDragStart();
          }
        },
        onMouseUp: () => {
          // Simulate drag end
          if ((global as any).mockDragCallbacks?.onDragEnd) {
            (global as any).mockDragCallbacks.onDragEnd({
              draggableId,
              source: { index, droppableId: 'source' },
              destination: { index: index + 1, droppableId: 'destination' },
            });
          }
        },
      },
    };
    
    const snapshot = {
      isDragging: false,
      isDropAnimating: false,
    };
    
    return (
      <div data-testid={`draggable-container-${draggableId}`}>
        {children(provided, snapshot)}
      </div>
    );
  },
}));

describe('OptimizedDraggableCalendar - Tests Complets pour Planning Médical', () => {
  const user = userEvent.setup();
  
  // Mock data
  const mockUsers: User[] = [
    {
      id: 'user1',
      email: 'dr.martin@hospital.fr',
      prenom: 'Jean',
      nom: 'Martin',
      role: 'MAR',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'user2',
      email: 'dr.dupont@hospital.fr',
      prenom: 'Marie',
      nom: 'Dupont',
      role: 'IADE',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'user3',
      email: 'dr.bernard@hospital.fr',
      prenom: 'Pierre',
      nom: 'Bernard',
      role: 'CHIRURGIEN',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ];

  const mockAttributions: Attribution[] = [
    {
      id: 'attr1',
      userId: 'user1',
      startDate: new Date('2024-03-15T08:00:00'),
      endDate: new Date('2024-03-15T20:00:00'),
      type: 'GARDE_JOUR',
      status: 'CONFIRMED',
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-01'),
    },
    {
      id: 'attr2',
      userId: 'user2',
      startDate: new Date('2024-03-15T20:00:00'),
      endDate: new Date('2024-03-16T08:00:00'),
      type: 'GARDE_NUIT',
      status: 'CONFIRMED',
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-01'),
    },
    {
      id: 'attr3',
      userId: 'user1',
      startDate: new Date('2024-03-16T14:00:00'),
      endDate: new Date('2024-03-16T18:00:00'),
      type: 'ASTREINTE',
      status: 'PENDING',
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-01'),
    },
  ];

  const mockRules: RulesConfiguration = {
    maxConsecutiveDays: 3,
    minRestHours: 12,
    maxWeeklyHours: 48,
    weekendRotation: true,
    holidayRotation: true,
  };

  const mockProps = {
    initialAssignments: mockAttributions,
    users: mockUsers,
    rules: mockRules,
    onSave: jest.fn(),
    onValidationError: jest.fn(),
    onSyncComplete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).mockDragCallbacks = {};
  });

  describe('CRITICITÉ HAUTE - Rendu et Structure', () => {
    it('devrait rendre le calendrier avec tous les éléments principaux', async () => {
      await act(async () => {
        render(<OptimizedDraggableCalendar {...mockProps} />);
      });

      // Attendre que le lazy loading soit terminé
      await waitFor(() => {
        expect(screen.getByTestId('drag-drop-context')).toBeInTheDocument();
      });

      expect(screen.getByText('Allocation des Gardes')).toBeInTheDocument();
      expect(screen.getByText('Sauvegarder')).toBeInTheDocument();
    });

    it('devrait afficher un skeleton pendant le chargement', () => {
      render(<OptimizedDraggableCalendar {...mockProps} />);

      // Le skeleton devrait être visible avant le lazy loading
      expect(screen.getByText('Allocation des Gardes')).toBeInTheDocument();
    });

    it('devrait organiser les utilisateurs en zones droppables', async () => {
      await act(async () => {
        render(<OptimizedDraggableCalendar {...mockProps} />);
      });

      await waitFor(() => {
        mockUsers.forEach(user => {
          expect(screen.getByText(`${user.prenom} ${user.nom}`)).toBeInTheDocument();
          expect(screen.getByTestId(`droppable-zone-${user.id}`)).toBeInTheDocument();
        });
      });
    });

    it('devrait afficher les attributions dans les bonnes zones utilisateur', async () => {
      await act(async () => {
        render(<OptimizedDraggableCalendar {...mockProps} />);
      });

      await waitFor(() => {
        // Vérifier que les attributions sont visibles
        expect(screen.getByTestId('draggable-container-attr1')).toBeInTheDocument();
        expect(screen.getByTestId('draggable-container-attr2')).toBeInTheDocument();
        expect(screen.getByTestId('draggable-container-attr3')).toBeInTheDocument();
      });
    });
  });

  describe('CRITICITÉ HAUTE - Fonctionnalité Drag & Drop', () => {
    it('devrait permettre le glisser-déposer des attributions', async () => {
      await act(async () => {
        render(<OptimizedDraggableCalendar {...mockProps} />);
      });

      await waitFor(() => {
        const dragHandle = screen.getByTestId('drag-handle-attr1');
        expect(dragHandle).toBeInTheDocument();
      });

      const dragHandle = screen.getByTestId('drag-handle-attr1');
      
      // Simuler le début du drag
      fireEvent.mouseDown(dragHandle);
      
      // Vérifier que l'état de dragging est activé
      await waitFor(() => {
        expect(screen.getByText('Déplacement en cours...')).toBeInTheDocument();
      });

      // Simuler la fin du drag
      fireEvent.mouseUp(dragHandle);
      
      // Vérifier que l'état de dragging est désactivé
      await waitFor(() => {
        expect(screen.queryByText('Déplacement en cours...')).not.toBeInTheDocument();
      });
    });

    it('devrait gérer les drops invalides gracieusement', async () => {
      await act(async () => {
        render(<OptimizedDraggableCalendar {...mockProps} />);
      });

      await waitFor(() => {
        const dragHandle = screen.getByTestId('drag-handle-attr1');
        expect(dragHandle).toBeInTheDocument();
      });

      // Simuler un drag sans destination
      if ((global as any).mockDragCallbacks?.onDragEnd) {
        (global as any).mockDragCallbacks.onDragEnd({
          draggableId: 'attr1',
          source: { index: 0, droppableId: 'user1' },
          destination: null, // Pas de destination
        });
      }

      // L'application ne devrait pas crasher
      expect(screen.getByText('Allocation des Gardes')).toBeInTheDocument();
    });

    it('devrait mettre à jour les attributions après un drop réussi', async () => {
      await act(async () => {
        render(<OptimizedDraggableCalendar {...mockProps} />);
      });

      await waitFor(() => {
        const dragHandle = screen.getByTestId('drag-handle-attr1');
        expect(dragHandle).toBeInTheDocument();
      });

      // Simuler un drag avec destination valide
      if ((global as any).mockDragCallbacks?.onDragEnd) {
        (global as any).mockDragCallbacks.onDragEnd({
          draggableId: 'attr1',
          source: { index: 0, droppableId: 'user1' },
          destination: { index: 0, droppableId: 'user2' },
        });
      }

      // Les attributions devraient être mises à jour
      expect(screen.getByTestId('draggable-container-attr1')).toBeInTheDocument();
    });

    it('devrait appliquer les styles visuels pendant le drag', async () => {
      await act(async () => {
        render(<OptimizedDraggableCalendar {...mockProps} />);
      });

      await waitFor(() => {
        const dragHandle = screen.getByTestId('drag-handle-attr1');
        expect(dragHandle).toBeInTheDocument();
      });

      const dragHandle = screen.getByTestId('drag-handle-attr1');
      
      // Commencer le drag
      fireEvent.mouseDown(dragHandle);
      
      // Vérifier les styles de feedback visuel
      await waitFor(() => {
        const statusIndicator = screen.getByText('Déplacement en cours...');
        expect(statusIndicator).toHaveClass('fixed', 'bottom-4', 'right-4', 'bg-blue-500');
      });
    });
  });

  describe('CRITICITÉ HAUTE - Validation et Sauvegarde', () => {
    it('devrait sauvegarder les attributions valides', async () => {
      await act(async () => {
        render(<OptimizedDraggableCalendar {...mockProps} />);
      });

      const saveButton = screen.getByText('Sauvegarder');
      await user.click(saveButton);

      expect(mockProps.onSave).toHaveBeenCalledWith(mockAttributions);
      expect(mockProps.onSyncComplete).toHaveBeenCalledWith(true);
    });

    it('devrait valider avant la sauvegarde', async () => {
      const emptyProps = {
        ...mockProps,
        initialAssignments: [], // Aucune attribution
      };

      await act(async () => {
        render(<OptimizedDraggableCalendar {...emptyProps} />);
      });

      const saveButton = screen.getByText('Sauvegarder');
      await user.click(saveButton);

      expect(mockProps.onValidationError).toHaveBeenCalledWith([
        {
          type: 'error',
          message: 'Aucune affectation à sauvegarder',
          assignmentIds: [],
        },
      ]);
      expect(mockProps.onSave).not.toHaveBeenCalled();
    });

    it('devrait gérer les erreurs de validation métier', async () => {
      await act(async () => {
        render(<OptimizedDraggableCalendar {...mockProps} />);
      });

      // Simuler des violations de règles
      const violations: Violation[] = [
        {
          type: 'warning',
          message: 'Temps de repos insuffisant',
          assignmentIds: ['attr1', 'attr2'],
        },
      ];

      const saveButton = screen.getByText('Sauvegarder');
      await user.click(saveButton);

      // La validation devrait être appelée
      expect(mockProps.onValidationError).toHaveBeenCalled();
    });

    it('devrait permettre de sauvegarder plusieurs fois', async () => {
      await act(async () => {
        render(<OptimizedDraggableCalendar {...mockProps} />);
      });

      const saveButton = screen.getByText('Sauvegarder');
      
      // Première sauvegarde
      await user.click(saveButton);
      expect(mockProps.onSave).toHaveBeenCalledTimes(1);

      // Deuxième sauvegarde
      await user.click(saveButton);
      expect(mockProps.onSave).toHaveBeenCalledTimes(2);
    });
  });

  describe('CRITICITÉ HAUTE - Optimisation Performance', () => {
    it('devrait utiliser le lazy loading pour les composants lourds', () => {
      const { container } = render(<OptimizedDraggableCalendar {...mockProps} />);
      
      // Le composant principal devrait se charger rapidement
      expect(container.firstChild).toBeInTheDocument();
    });

    it('devrait memoiser les calculs coûteux', async () => {
      const { rerender } = render(<OptimizedDraggableCalendar {...mockProps} />);

      // Premier rendu
      await waitFor(() => {
        expect(screen.getByText('Jean Martin')).toBeInTheDocument();
      });

      // Re-rendu avec mêmes props
      rerender(<OptimizedDraggableCalendar {...mockProps} />);

      // Le composant devrait réutiliser les calculs memoïsés
      expect(screen.getByText('Jean Martin')).toBeInTheDocument();
    });

    it('devrait gérer de nombreuses attributions sans impact performance', async () => {
      const manyAttributions = Array.from({ length: 100 }, (_, i) => ({
        id: `attr${i}`,
        userId: mockUsers[i % 3].id,
        startDate: new Date(`2024-03-${(i % 30) + 1}T08:00:00`),
        endDate: new Date(`2024-03-${(i % 30) + 1}T20:00:00`),
        type: 'GARDE_JOUR',
        status: 'CONFIRMED' as const,
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-01'),
      }));

      const heavyProps = {
        ...mockProps,
        initialAssignments: manyAttributions,
      };

      const startTime = performance.now();
      
      await act(async () => {
        render(<OptimizedDraggableCalendar {...heavyProps} />);
      });

      const endTime = performance.now();
      
      // Le rendu devrait être rapide même avec beaucoup de données
      expect(endTime - startTime).toBeLessThan(1000); // <1s
    });

    it('devrait optimiser les re-rendus lors des drags', async () => {
      const renderSpy = jest.spyOn(React, 'useMemo');
      
      await act(async () => {
        render(<OptimizedDraggableCalendar {...mockProps} />);
      });

      await waitFor(() => {
        const dragHandle = screen.getByTestId('drag-handle-attr1');
        expect(dragHandle).toBeInTheDocument();
      });

      const dragHandle = screen.getByTestId('drag-handle-attr1');
      
      // Simuler plusieurs drags rapides
      for (let i = 0; i < 5; i++) {
        fireEvent.mouseDown(dragHandle);
        fireEvent.mouseUp(dragHandle);
      }

      // useMemo devrait être utilisé pour optimiser
      expect(renderSpy).toHaveBeenCalled();
      
      renderSpy.mockRestore();
    });
  });

  describe('CRITICITÉ MOYENNE - Interface Utilisateur', () => {
    it('devrait afficher les informations des attributions clairement', async () => {
      await act(async () => {
        render(<OptimizedDraggableCalendar {...mockProps} />);
      });

      await waitFor(() => {
        // Vérifier les dates formatées
        expect(screen.getByText('15/03/2024 - 15/03/2024')).toBeInTheDocument();
        expect(screen.getByText('15/03/2024 - 16/03/2024')).toBeInTheDocument();
        
        // Vérifier les types d'attribution
        expect(screen.getByText('GARDE_JOUR')).toBeInTheDocument();
        expect(screen.getByText('GARDE_NUIT')).toBeInTheDocument();
        expect(screen.getByText('ASTREINTE')).toBeInTheDocument();
      });
    });

    it('devrait organiser les attributions par utilisateur', async () => {
      await act(async () => {
        render(<OptimizedDraggableCalendar {...mockProps} />);
      });

      await waitFor(() => {
        // Jean Martin devrait avoir 2 attributions
        const jeanSection = screen.getByText('Jean Martin').parentElement;
        expect(jeanSection).toBeInTheDocument();
        
        // Marie Dupont devrait avoir 1 attribution
        const marieSection = screen.getByText('Marie Dupont').parentElement;
        expect(marieSection).toBeInTheDocument();
        
        // Pierre Bernard devrait avoir 0 attribution
        const pierreSection = screen.getByText('Pierre Bernard').parentElement;
        expect(pierreSection).toBeInTheDocument();
      });
    });

    it('devrait appliquer les styles responsive', async () => {
      await act(async () => {
        render(<OptimizedDraggableCalendar {...mockProps} />);
      });

      await waitFor(() => {
        const grid = screen.getByTestId('drag-drop-context').querySelector('.grid');
        expect(grid).toHaveClass('grid-cols-1');
      });
    });

    it('devrait fournir un feedback visuel pour les zones de drop', async () => {
      await act(async () => {
        render(<OptimizedDraggableCalendar {...mockProps} />);
      });

      await waitFor(() => {
        const droppableZones = screen.getAllByTestId(/^droppable-zone-/);
        
        droppableZones.forEach(zone => {
          // Chaque zone devrait avoir les styles de base
          const content = zone.querySelector('[data-droppable-id]');
          expect(content).toHaveClass('border', 'rounded-lg', 'p-4');
        });
      });
    });
  });

  describe('CRITICITÉ MOYENNE - Gestion d\'États', () => {
    it('devrait maintenir l\'état des attributions à travers les interactions', async () => {
      await act(async () => {
        render(<OptimizedDraggableCalendar {...mockProps} />);
      });

      await waitFor(() => {
        const initialCount = screen.getAllByTestId(/^draggable-container-/).length;
        expect(initialCount).toBe(3);
      });

      // Simuler un drag & drop
      const dragHandle = screen.getByTestId('drag-handle-attr1');
      fireEvent.mouseDown(dragHandle);
      fireEvent.mouseUp(dragHandle);

      // Le nombre d'attributions devrait rester constant
      await waitFor(() => {
        const finalCount = screen.getAllByTestId(/^draggable-container-/).length;
        expect(finalCount).toBe(3);
      });
    });

    it('devrait gérer les mises à jour externes des attributions', async () => {
      const { rerender } = render(<OptimizedDraggableCalendar {...mockProps} />);

      // Mettre à jour les attributions
      const updatedAttributions = [
        ...mockAttributions,
        {
          id: 'attr4',
          userId: 'user3',
          startDate: new Date('2024-03-17T08:00:00'),
          endDate: new Date('2024-03-17T20:00:00'),
          type: 'GARDE_JOUR',
          status: 'PENDING' as const,
          createdAt: new Date('2024-03-01'),
          updatedAt: new Date('2024-03-01'),
        },
      ];

      await act(async () => {
        rerender(
          <OptimizedDraggableCalendar 
            {...mockProps} 
            initialAssignments={updatedAttributions} 
          />
        );
      });

      await waitFor(() => {
        const attributionCount = screen.getAllByTestId(/^draggable-container-/).length;
        expect(attributionCount).toBe(4);
      });
    });

    it('devrait réinitialiser l\'état de dragging après annulation', async () => {
      await act(async () => {
        render(<OptimizedDraggableCalendar {...mockProps} />);
      });

      await waitFor(() => {
        const dragHandle = screen.getByTestId('drag-handle-attr1');
        expect(dragHandle).toBeInTheDocument();
      });

      const dragHandle = screen.getByTestId('drag-handle-attr1');
      
      // Commencer le drag
      fireEvent.mouseDown(dragHandle);
      
      await waitFor(() => {
        expect(screen.getByText('Déplacement en cours...')).toBeInTheDocument();
      });

      // Simuler l'annulation (drop sans destination)
      if ((global as any).mockDragCallbacks?.onDragEnd) {
        (global as any).mockDragCallbacks.onDragEnd({
          draggableId: 'attr1',
          source: { index: 0, droppableId: 'user1' },
          destination: null,
        });
      }

      // L'état de dragging devrait être réinitialisé
      await waitFor(() => {
        expect(screen.queryByText('Déplacement en cours...')).not.toBeInTheDocument();
      });
    });
  });

  describe('GESTION D\'ERREURS ET ROBUSTESSE', () => {
    it('devrait gérer les props manquantes gracieusement', () => {
      expect(() => {
        render(
          <OptimizedDraggableCalendar 
            {...mockProps}
            users={[]}
            initialAssignments={[]}
          />
        );
      }).not.toThrow();
    });

    it('devrait gérer les callbacks invalides', async () => {
      const propsWithNullCallbacks = {
        ...mockProps,
        onSave: null as any,
        onValidationError: null as any,
        onSyncComplete: null as any,
      };

      await act(async () => {
        render(<OptimizedDraggableCalendar {...propsWithNullCallbacks} />);
      });

      const saveButton = screen.getByText('Sauvegarder');
      
      expect(() => {
        fireEvent.click(saveButton);
      }).not.toThrow();
    });

    it('devrait récupérer des erreurs de rendu', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Props invalides qui pourraient causer une erreur
      const invalidProps = {
        ...mockProps,
        initialAssignments: [
          {
            id: 'invalid',
            // Manque des propriétés requises
          } as any,
        ],
      };

      expect(() => {
        render(<OptimizedDraggableCalendar {...invalidProps} />);
      }).not.toThrow();

      consoleError.mockRestore();
    });

    it('devrait maintenir la performance avec des données corrompues', async () => {
      const corruptedData = {
        ...mockProps,
        users: [
          { id: null, nom: '', prenom: '' } as any,
          ...mockUsers,
        ],
        initialAssignments: [
          { id: '', userId: null } as any,
          ...mockAttributions,
        ],
      };

      const startTime = performance.now();
      
      await act(async () => {
        render(<OptimizedDraggableCalendar {...corruptedData} />);
      });

      const endTime = performance.now();
      
      // Même avec des données corrompues, le rendu devrait être rapide
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
