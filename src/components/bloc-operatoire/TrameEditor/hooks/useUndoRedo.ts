import { useState, useCallback, useRef } from 'react';

interface UndoRedoOptions<T> {
    maxHistorySize?: number;
    onUndo?: (state: T) => void;
    onRedo?: (state: T) => void;
}

interface UndoRedoState<T> {
    past: T[];
    present: T;
    future: T[];
}

export const useUndoRedo = <T>(initialState: T, options: UndoRedoOptions<T> = {}) => {
    const { maxHistorySize = 50, onUndo, onRedo } = options;
    
    const [state, setState] = useState<UndoRedoState<T>>({
        past: [],
        present: initialState,
        future: []
    });

    const isUpdating = useRef(false);

    const canUndo = state.past.length > 0;
    const canRedo = state.future.length > 0;

    const addToHistory = useCallback((newPresent: T) => {
        if (isUpdating.current) return;
        
        setState(prevState => {
            const newPast = [...prevState.past, prevState.present];
            
            // Limiter la taille de l'historique
            if (newPast.length > maxHistorySize) {
                newPast.shift();
            }
            
            return {
                past: newPast,
                present: newPresent,
                future: [] // Réinitialiser le future lors d'une nouvelle action
            };
        });
    }, [maxHistorySize]);

    const undo = useCallback(() => {
        if (!canUndo) return;
        
        isUpdating.current = true;
        
        setState(prevState => {
            const previous = prevState.past[prevState.past.length - 1];
            const newPast = prevState.past.slice(0, prevState.past.length - 1);
            
            const newState = {
                past: newPast,
                present: previous,
                future: [prevState.present, ...prevState.future]
            };
            
            // Callback après mise à jour
            setTimeout(() => {
                isUpdating.current = false;
                onUndo?.(previous);
            }, 0);
            
            return newState;
        });
    }, [canUndo, onUndo]);

    const redo = useCallback(() => {
        if (!canRedo) return;
        
        isUpdating.current = true;
        
        setState(prevState => {
            const next = prevState.future[0];
            const newFuture = prevState.future.slice(1);
            
            const newState = {
                past: [...prevState.past, prevState.present],
                present: next,
                future: newFuture
            };
            
            // Callback après mise à jour
            setTimeout(() => {
                isUpdating.current = false;
                onRedo?.(next);
            }, 0);
            
            return newState;
        });
    }, [canRedo, onRedo]);

    const reset = useCallback((newState?: T) => {
        setState({
            past: [],
            present: newState || initialState,
            future: []
        });
    }, [initialState]);

    const jumpToState = useCallback((index: number) => {
        if (index < 0 || index >= state.past.length + 1 + state.future.length) return;
        
        isUpdating.current = true;
        
        setState(prevState => {
            const allStates = [...prevState.past, prevState.present, ...prevState.future];
            const targetState = allStates[index];
            
            const newState = {
                past: allStates.slice(0, index),
                present: targetState,
                future: allStates.slice(index + 1)
            };
            
            setTimeout(() => {
                isUpdating.current = false;
            }, 0);
            
            return newState;
        });
    }, [state.past.length, state.future.length]);

    const getHistory = useCallback(() => {
        return [...state.past, state.present, ...state.future];
    }, [state]);

    const getCurrentIndex = useCallback(() => {
        return state.past.length;
    }, [state.past.length]);

    return {
        state: state.present,
        setState: addToHistory,
        undo,
        redo,
        canUndo,
        canRedo,
        reset,
        jumpToState,
        getHistory,
        getCurrentIndex,
        historySize: state.past.length + state.future.length + 1
    };
};

export default useUndoRedo;