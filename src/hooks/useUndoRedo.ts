/**
 * Hook pour gérer l'historique des actions (undo/redo)
 * Permet d'annuler et de refaire les dernières actions
 */

import { useState, useCallback, useRef } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UseUndoRedoOptions {
  maxHistorySize?: number;
}

export function useUndoRedo<T>(
  initialState: T,
  options: UseUndoRedoOptions = {}
) {
  const { maxHistorySize = 50 } = options;
  
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  // Référence pour éviter la création de nouvelles fonctions à chaque render
  const historyRef = useRef(history);
  historyRef.current = history;

  // Ajouter un nouvel état à l'historique
  const pushState = useCallback((newState: T) => {
    setHistory(prev => {
      const newPast = [...prev.past, prev.present];
      
      // Limiter la taille de l'historique
      if (newPast.length > maxHistorySize) {
        newPast.shift();
      }

      return {
        past: newPast,
        present: newState,
        future: [], // Effacer le futur quand on ajoute un nouvel état
      };
    });
  }, [maxHistorySize]);

  // Annuler la dernière action
  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;

      const newPast = [...prev.past];
      const previousState = newPast.pop()!;

      return {
        past: newPast,
        present: previousState,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  // Refaire la dernière action annulée
  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;

      const newFuture = [...prev.future];
      const nextState = newFuture.shift()!;

      return {
        past: [...prev.past, prev.present],
        present: nextState,
        future: newFuture,
      };
    });
  }, []);

  // Réinitialiser l'historique
  const reset = useCallback((newInitialState?: T) => {
    setHistory({
      past: [],
      present: newInitialState || initialState,
      future: [],
    });
  }, [initialState]);

  // Aller à un état spécifique dans l'historique
  const goTo = useCallback((index: number) => {
    setHistory(prev => {
      const allStates = [...prev.past, prev.present, ...prev.future];
      
      if (index < 0 || index >= allStates.length) return prev;

      return {
        past: allStates.slice(0, index),
        present: allStates[index],
        future: allStates.slice(index + 1),
      };
    });
  }, []);

  return {
    state: history.present,
    setState: pushState,
    undo,
    redo,
    reset,
    goTo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    historySize: history.past.length + 1 + history.future.length,
  };
}

// Hook spécialisé pour les affectations de trames
export function useTrameAffectationsHistory<T extends { id: string }[]>(
  initialAffectations: T
) {
  const {
    state: affectations,
    setState: setAffectations,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo(initialAffectations);

  // Helpers spécifiques aux affectations
  const addAffectation = useCallback((affectation: T[0]) => {
    setAffectations([...affectations, affectation] as T);
  }, [affectations, setAffectations]);

  const updateAffectation = useCallback((id: string, updates: Partial<T[0]>) => {
    setAffectations(
      affectations.map(aff => 
        aff.id === id ? { ...aff, ...updates } : aff
      ) as T
    );
  }, [affectations, setAffectations]);

  const deleteAffectation = useCallback((id: string) => {
    setAffectations(
      affectations.filter(aff => aff.id !== id) as T
    );
  }, [affectations, setAffectations]);

  const deleteMultipleAffectations = useCallback((ids: string[]) => {
    const idsSet = new Set(ids);
    setAffectations(
      affectations.filter(aff => !idsSet.has(aff.id)) as T
    );
  }, [affectations, setAffectations]);

  return {
    affectations,
    setAffectations,
    addAffectation,
    updateAffectation,
    deleteAffectation,
    deleteMultipleAffectations,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}