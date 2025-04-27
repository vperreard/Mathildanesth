// Hooks
export { useErrorHandler } from './hooks/useErrorHandler';

// Composants
export { default as ErrorBoundary } from './components/ErrorBoundary';
export { default as ErrorDisplay } from './components/ErrorDisplay';
export { default as ErrorRetry } from './components/ErrorRetry';
export { default as ErrorDashboard } from './components/admin/ErrorDashboard';

// Services
export {
    logError,
    flushErrorQueue,
    configureErrorLogging
} from './services/errorLoggingService';

export {
    triggerAlert,
    configureAlertService
} from './services/errorAlertService';

// Utilitaires
export {
    getErrorMessage,
    getErrorSuggestion,
    getFullErrorInfo,
    translateTechnicalError,
    GENERAL_ERROR_MESSAGES,
    APP_ERROR_MESSAGES
} from './utils/errorMessages';

// Types
export type {
    ErrorSeverity,
    ErrorDetails,
    ErrorState
} from './hooks/useErrorHandler'; 