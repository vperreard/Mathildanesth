/**
 * Composant pour améliorer le drag & drop avec preview et multi-sélection
 * Améliore l'expérience utilisateur avec des feedbacks visuels
 */

import React, { useState, useCallback, useEffect } from 'react';
import { DraggableStateSnapshot, DraggingStyle, NotDraggingStyle } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';

interface DragPreviewProps {
  children: React.ReactNode;
  isDragging: boolean;
  selectedCount?: number;
}

export const DragPreview: React.FC<DragPreviewProps> = ({ 
  children, 
  isDragging, 
  selectedCount = 1 
}) => {
  if (!isDragging) return <>{children}</>;

  return (
    <div className="relative">
      {children}
      {selectedCount > 1 && (
        <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
          {selectedCount}
        </div>
      )}
    </div>
  );
};

interface SelectionState {
  selectedIds: Set<string>;
  lastSelectedId: string | null;
  isSelecting: boolean;
}

export const useMultiSelection = () => {
  const [selection, setSelection] = useState<SelectionState>({
    selectedIds: new Set(),
    lastSelectedId: null,
    isSelecting: false,
  });

  const toggleSelection = useCallback((id: string, event?: React.MouseEvent) => {
    setSelection(prev => {
      const newSelectedIds = new Set(prev.selectedIds);

      if (event?.shiftKey && prev.lastSelectedId) {
        // Shift+click: sélection en plage
        // TODO: Implémenter la sélection en plage selon l'ordre des éléments
        return prev;
      } else if (event?.ctrlKey || event?.metaKey) {
        // Ctrl/Cmd+click: toggle sélection
        if (newSelectedIds.has(id)) {
          newSelectedIds.delete(id);
        } else {
          newSelectedIds.add(id);
        }
      } else {
        // Click simple: sélectionner uniquement cet élément
        newSelectedIds.clear();
        newSelectedIds.add(id);
      }

      return {
        selectedIds: newSelectedIds,
        lastSelectedId: id,
        isSelecting: newSelectedIds.size > 0,
      };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelection({
      selectedIds: new Set(),
      lastSelectedId: null,
      isSelecting: false,
    });
  }, []);

  const isSelected = useCallback((id: string) => {
    return selection.selectedIds.has(id);
  }, [selection.selectedIds]);

  return {
    selectedIds: selection.selectedIds,
    isSelecting: selection.isSelecting,
    toggleSelection,
    clearSelection,
    isSelected,
  };
};

// Style amélioré pour les éléments en cours de drag
export const getItemStyle = (
  isDragging: boolean,
  draggableStyle: DraggingStyle | NotDraggingStyle | undefined,
  isSelected: boolean = false,
  isGhost: boolean = false
): React.CSSProperties => {
  return {
    ...draggableStyle,
    opacity: isDragging ? (isGhost ? 0.5 : 1) : 1,
    transform: isDragging
      ? `${draggableStyle?.transform || ''} scale(1.05)`
      : draggableStyle?.transform || '',
    transition: isDragging
      ? 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)'
      : 'transform 0.2s ease-in-out',
    boxShadow: isDragging
      ? '0 10px 20px rgba(0, 0, 0, 0.15)'
      : isSelected
      ? '0 0 0 2px #3b82f6'
      : 'none',
    cursor: isDragging ? 'grabbing' : 'grab',
  };
};

// Composant pour afficher un indicateur de drop
interface DropIndicatorProps {
  isOver: boolean;
  canDrop: boolean;
  itemCount?: number;
}

export const DropIndicator: React.FC<DropIndicatorProps> = ({ 
  isOver, 
  canDrop, 
  itemCount = 0 
}) => {
  if (!isOver) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none rounded-md border-2 border-dashed",
        canDrop
          ? "border-blue-500 bg-blue-50/50"
          : "border-red-500 bg-red-50/50"
      )}
    >
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div
          className={cn(
            "px-2 py-1 rounded text-xs font-medium",
            canDrop
              ? "bg-blue-100 text-blue-700"
              : "bg-red-100 text-red-700"
          )}
        >
          {canDrop
            ? itemCount > 1
              ? `Déposer ${itemCount} éléments`
              : "Déposer ici"
            : "Zone interdite"}
        </div>
      </div>
    </div>
  );
};

// Hook pour gérer les raccourcis clavier
export const useKeyboardShortcuts = (
  onUndo?: () => void,
  onRedo?: () => void,
  onDelete?: () => void,
  onCopy?: () => void,
  onPaste?: () => void,
  onSelectAll?: () => void
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd) {
        switch (e.key.toLowerCase()) {
          case 'z':
            if (e.shiftKey && onRedo) {
              e.preventDefault();
              onRedo();
            } else if (!e.shiftKey && onUndo) {
              e.preventDefault();
              onUndo();
            }
            break;
          case 'y':
            if (onRedo) {
              e.preventDefault();
              onRedo();
            }
            break;
          case 'c':
            if (onCopy) {
              e.preventDefault();
              onCopy();
            }
            break;
          case 'v':
            if (onPaste) {
              e.preventDefault();
              onPaste();
            }
            break;
          case 'a':
            if (onSelectAll) {
              e.preventDefault();
              onSelectAll();
            }
            break;
        }
      } else if (e.key === 'Delete' && onDelete) {
        e.preventDefault();
        onDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo, onDelete, onCopy, onPaste, onSelectAll]);
};

// Composant pour afficher un ghost pendant le drag
interface DragGhostProps {
  children: React.ReactNode;
  isDragging: boolean;
}

export const DragGhost: React.FC<DragGhostProps> = ({ children, isDragging }) => {
  return (
    <div className={cn("relative", isDragging && "opacity-50")}>
      {children}
    </div>
  );
};

// Hook pour gérer l'animation du drop
export const useDropAnimation = () => {
  const [isDropping, setIsDropping] = useState(false);

  const startDropAnimation = useCallback(() => {
    setIsDropping(true);
    setTimeout(() => setIsDropping(false), 300);
  }, []);

  return { isDropping, startDropAnimation };
};

// Composant pour la toolbar flottante
interface FloatingToolbarProps {
  selectedCount: number;
  onDelete?: () => void;
  onCopy?: () => void;
  onDuplicate?: () => void;
  onClear?: () => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  selectedCount,
  onDelete,
  onCopy,
  onDuplicate,
  onClear,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white rounded-lg shadow-lg px-4 py-2 flex items-center space-x-2 z-50">
      <span className="text-sm font-medium">
        {selectedCount} élément{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
      </span>
      <div className="h-4 w-px bg-gray-600" />
      <div className="flex items-center space-x-1">
        {onCopy && (
          <button
            onClick={onCopy}
            className="p-1.5 hover:bg-gray-800 rounded transition-colors"
            title="Copier (Ctrl+C)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        )}
        {onDuplicate && (
          <button
            onClick={onDuplicate}
            className="p-1.5 hover:bg-gray-800 rounded transition-colors"
            title="Dupliquer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-700 rounded transition-colors"
            title="Supprimer (Delete)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
        {onClear && (
          <button
            onClick={onClear}
            className="p-1.5 hover:bg-gray-800 rounded transition-colors ml-2"
            title="Annuler la sélection"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};