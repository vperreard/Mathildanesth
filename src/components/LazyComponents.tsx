'use client';

import { lazy, Suspense } from 'react';
import { logger } from "../lib/logger";
import { LoadingSpinner } from './ui/loading-spinner';

// Lazy load des composants volumineux identifiés dans l'audit
export const LazySimulationNotifications = lazy(() => 
    import('./notifications/SimulationNotifications').then(module => ({
        default: module.SimulationNotifications
    }))
);

export const LazyHeader = lazy(() => 
    import('./Header').then(module => ({
        default: module.Header || module.default
    }))
);

export const LazyPrefetcher = lazy(() => 
    import('./Prefetcher').then(module => ({
        default: module.Prefetcher || module.default
    }))
);

// TODO: Create PlanningCalendar component
// export const LazyPlanningCalendar = lazy(() => 
//     import('./calendar/PlanningCalendar').then(module => ({
//         default: module.PlanningCalendar || module.default
//     }))
// );

export const LazyBlocPlanningCalendar = lazy(() => 
    import('../modules/planning/bloc-operatoire/components/BlocPlanningCalendar').then(module => ({
        default: module.BlocPlanningCalendar || module.default
    }))
);

// TODO: Create UserManagement component
// export const LazyUserManagement = lazy(() => 
//     import('./admin/UserManagement').then(module => ({
//         default: module.UserManagement || module.default
//     }))
// );

// TODO: Create LeaveManagement component
// export const LazyLeaveManagement = lazy(() => 
//     import('./leaves/LeaveManagement').then(module => ({
//         default: module.LeaveManagement || module.default
//     }))
// );

export const LazyPerformanceDashboard = lazy(() => 
    import('./PerformanceDashboard').then(module => ({
        default: module.PerformanceDashboard || module.default
    }))
);

export const LazyPlanningSimulator = lazy(() => 
    import('./PlanningSimulator').then(module => ({
        default: module.PlanningSimulator || module.default
    }))
);

// Composant wrapper avec fallback loading
interface LazyWrapperProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({ 
    children, 
    fallback = <LoadingSpinner /> 
}) => {
    return (
        <Suspense fallback={fallback}>
            {children}
        </Suspense>
    );
};

// HOC pour lazy loading avec error boundary
export function withLazyLoading<T extends Record<string, unknown>>(
    Component: React.ComponentType<T>,
    fallback?: React.ReactNode
) {
    return function LazyComponent(props: T) {
        return (
            <Suspense fallback={fallback || <LoadingSpinner />}>
                <Component {...props} />
            </Suspense>
        );
    };
}

// Preloader pour critical components
export const preloadCriticalComponents = () => {
    if (typeof window !== 'undefined') {
        // Preload components qui seront utilisés immédiatement
        import('./Header');
        import('./navigation/Navigation');
        
        // Preload au idle time
        requestIdleCallback(() => {
            import('./notifications/SimulationNotifications');
            import('./Prefetcher');
        });
    }
};

// Dynamic imports avec retry logic
export const dynamicImport = async function<T>(
    importFn: () => Promise<{ default: T }>,
    retries = 3
): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            const module = await importFn();
            return module.default;
        } catch (error: unknown) {
            if (i === retries - 1) {
                logger.error('Failed to load component after retries:', { error: error });
                throw error;
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
    throw new Error('Dynamic import failed');
};