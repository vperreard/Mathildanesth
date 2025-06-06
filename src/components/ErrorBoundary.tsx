"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '../services/errorLoggingService';
import ErrorDisplay from './ErrorDisplay';

// Utiliser des types qui ne sont pas des fonctions pour éviter l'erreur de sérialisation
interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    fallbackComponent?: React.ComponentType<{ error: Error; resetError: () => void }>;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    resetOnPropsChange?: boolean;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Composant ErrorBoundary pour capturer les erreurs de rendu React
 * 
 * Usage:
 * ```jsx
 * <ErrorBoundary fallback={<p>Une erreur est survenue</p>}>
 *   <MonComposant />
 * </ErrorBoundary>
 * ```
 * 
 * Ou avec un composant personnalisé:
 * ```jsx
 * <ErrorBoundary 
 *   fallbackComponent={CustomErrorComponent}
 * >
 *   <MonComposant />
 * </ErrorBoundary>
 * ```
 * 
 * Où CustomErrorComponent est défini comme:
 * ```jsx
 * const CustomErrorComponent = ({ error, resetError }) => (
 *   <div>
 *     <p>Erreur: {error.message}</p>
 *     <button onClick={resetError}>Réessayer</button>
 *   </div>
 * );
 * ```
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Logging de l'erreur
        logError('react_error_boundary', {
            message: error.message,
            severity: 'error',
            timestamp: new Date(),
            context: {
                componentStack: errorInfo.componentStack,
                stack: error.stack,
            },
        });

        // Appel du handler personnalisé si fourni
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    componentDidUpdate(prevProps: Props): void {
        // Réinitialiser l'état d'erreur si les props changent
        if (
            this.state.hasError &&
            this.props.resetOnPropsChange &&
            prevProps.children !== this.props.children
        ) {
            this.resetError();
        }
    }

    resetError = (): void => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    render(): ReactNode {
        const { hasError, error } = this.state;
        const { children, fallback, fallbackComponent: FallbackComponent } = this.props;

        if (hasError && error) {
            // Utiliser le composant fallback personnalisé s'il est fourni
            if (FallbackComponent) {
                return <FallbackComponent error={error} resetError={this.resetError} />;
            }

            // Sinon, utiliser le fallback simple (non-fonction)
            if (fallback) {
                return fallback;
            }

            // Fallback par défaut
            return <ErrorDisplay error={error} resetError={this.resetError} />;
        }

        return children;
    }
}

export default ErrorBoundary; 