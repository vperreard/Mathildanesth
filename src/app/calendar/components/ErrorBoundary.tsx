import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Composant de limite d'erreur qui capture les erreurs dans le cycle de vie des composants
 * et affiche un composant de secours en cas d'erreur.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // Mise à jour de l'état pour afficher le fallback UI
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Vous pouvez également enregistrer l'erreur dans un service de reporting d'erreurs
        console.error('Calendar error caught by ErrorBoundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // Vous pouvez rendre n'importe quel UI de secours personnalisé
            return this.props.fallback;
        }

        return this.props.children;
    }
}

export default ErrorBoundary; 