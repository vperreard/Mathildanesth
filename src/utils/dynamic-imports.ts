import { lazy } from 'react';

// Configuration for dynamic imports with intelligent chunking
export const CHUNK_PRIORITIES = {
    CRITICAL: 'critical',
    HIGH: 'high', 
    MEDIUM: 'medium',
    LOW: 'low'
} as const;

type ChunkPriority = typeof CHUNK_PRIORITIES[keyof typeof CHUNK_PRIORITIES];

interface DynamicImportConfig {
    priority: ChunkPriority;
    preload?: boolean;
    maxRetries?: number;
    chunkName?: string;
}

// Factory pour créer des imports dynamiques optimisés
export function createDynamicImport<T>(
    importFn: () => Promise<{ default: T }>,
    config: DynamicImportConfig = { priority: 'medium' }
) {
    const { maxRetries = 3, chunkName } = config;

    return lazy(async () => {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const startTime = performance.now();
                const module = await importFn();
                const loadTime = performance.now() - startTime;

                // Log performance metrics
                if (typeof window !== 'undefined' && window.performance) {
                    performance.mark(`chunk-loaded-${chunkName || 'unknown'}`);
                    console.debug(`Chunk loaded: ${chunkName || 'unknown'} in ${loadTime.toFixed(2)}ms`);
                }

                return module;
            } catch (error) {
                lastError = error as Error;
                console.warn(`Dynamic import attempt ${attempt}/${maxRetries} failed:`, error);
                
                if (attempt < maxRetries) {
                    // Exponential backoff
                    await new Promise(resolve => 
                        setTimeout(resolve, Math.pow(2, attempt) * 1000)
                    );
                }
            }
        }

        throw new Error(`Failed to load chunk after ${maxRetries} attempts: ${lastError?.message}`);
    });
}

// Modules critiques - chargés immédiatement
export const CriticalComponents = {
    Navigation: createDynamicImport(
        () => import('../components/navigation/Navigation'),
        { priority: 'critical', chunkName: 'navigation' }
    ),
    
    Header: createDynamicImport(
        () => import('../components/Header'),
        { priority: 'critical', chunkName: 'header' }
    ),
    
    ErrorBoundary: createDynamicImport(
        () => import('../components/ErrorBoundary'),
        { priority: 'critical', chunkName: 'error-boundary' }
    )
};

// Modules de planning - priorité haute
export const PlanningComponents = {
    PlanningCalendar: createDynamicImport(
        () => import('../components/calendar/PlanningCalendar'),
        { priority: 'high', chunkName: 'planning-calendar' }
    ),
    
    BlocPlanningCalendar: createDynamicImport(
        () => import('../modules/planning/bloc-operatoire/components/BlocPlanningCalendar'),
        { priority: 'high', chunkName: 'bloc-planning-calendar' }
    ),
    
    PlanningGenerator: createDynamicImport(
        () => import('../components/planning/PlanningGenerator'),
        { priority: 'high', chunkName: 'planning-generator' }
    )
};

// Modules d'administration - priorité moyenne
export const AdminComponents = {
    UserManagement: createDynamicImport(
        () => import('../components/admin/UserManagement'),
        { priority: 'medium', chunkName: 'user-management' }
    ),
    
    SiteManagement: createDynamicImport(
        () => import('../components/admin/SiteManagement'),
        { priority: 'medium', chunkName: 'site-management' }
    ),
    
    AdminDashboard: createDynamicImport(
        () => import('../components/admin/AdminDashboard'),
        { priority: 'medium', chunkName: 'admin-dashboard' }
    )
};

// Modules de congés - priorité moyenne
export const LeaveComponents = {
    LeaveManagement: createDynamicImport(
        () => import('../modules/leaves/components/LeaveManagement'),
        { priority: 'medium', chunkName: 'leave-management' }
    ),
    
    LeaveForm: createDynamicImport(
        () => import('../modules/leaves/components/LeaveForm'),
        { priority: 'medium', chunkName: 'leave-form' }
    ),
    
    LeavesList: createDynamicImport(
        () => import('../modules/leaves/components/LeavesList'),
        { priority: 'medium', chunkName: 'leaves-list' }
    )
};

// Modules de simulation et performance - priorité basse
export const AnalyticsComponents = {
    PlanningSimulator: createDynamicImport(
        () => import('../components/PlanningSimulator'),
        { priority: 'low', chunkName: 'planning-simulator' }
    ),
    
    PerformanceDashboard: createDynamicImport(
        () => import('../components/PerformanceDashboard'),
        { priority: 'low', chunkName: 'performance-dashboard' }
    ),
    
    SimulationNotifications: createDynamicImport(
        () => import('../components/notifications/SimulationNotifications'),
        { priority: 'low', chunkName: 'simulation-notifications' }
    )
};

// Système de préchargement intelligent
export class IntelligentPreloader {
    private preloadedChunks = new Set<string>();
    private loadingChunks = new Map<string, Promise<void>>();

    async preloadByPriority(priority: ChunkPriority): Promise<void> {
        const componentsMap = {
            critical: CriticalComponents,
            high: PlanningComponents,
            medium: { ...AdminComponents, ...LeaveComponents },
            low: AnalyticsComponents
        };

        const components = componentsMap[priority];
        if (!components) return;

        const preloadPromises = Object.entries(components).map(([name, Component]) => 
            this.preloadComponent(name, Component)
        );

        await Promise.allSettled(preloadPromises);
    }

    private async preloadComponent(name: string, Component: any): Promise<void> {
        if (this.preloadedChunks.has(name)) {
            return;
        }

        if (this.loadingChunks.has(name)) {
            return this.loadingChunks.get(name);
        }

        const promise = this.doPreload(name, Component);
        this.loadingChunks.set(name, promise);
        
        try {
            await promise;
            this.preloadedChunks.add(name);
        } finally {
            this.loadingChunks.delete(name);
        }
    }

    private async doPreload(name: string, Component: any): Promise<void> {
        try {
            // Précharger lors de l'idle time
            if ('requestIdleCallback' in window) {
                return new Promise((resolve) => {
                    requestIdleCallback(async () => {
                        try {
                            await Component._payload._result();
                            console.debug(`Preloaded component: ${name}`);
                            resolve();
                        } catch (error) {
                            console.warn(`Failed to preload component ${name}:`, error);
                            resolve(); // Ne pas bloquer sur les échecs de préchargement
                        }
                    });
                });
            } else {
                // Fallback pour les navigateurs sans requestIdleCallback
                await new Promise(resolve => setTimeout(resolve, 100));
                await Component._payload._result();
                console.debug(`Preloaded component: ${name}`);
            }
        } catch (error) {
            console.warn(`Failed to preload component ${name}:`, error);
        }
    }

    // Précharger selon la route
    async preloadForRoute(route: string): Promise<void> {
        const routeComponentMap: Record<string, ChunkPriority[]> = {
            '/': ['critical'],
            '/tableau-de-bord': ['critical', 'high'],
            '/planning': ['critical', 'high'],
            '/bloc-operatoire': ['critical', 'high'],
            '/conges': ['critical', 'medium'],
            '/admin': ['critical', 'medium'],
            '/simulation': ['critical', 'low']
        };

        const priorities = routeComponentMap[route] || ['critical'];
        
        for (const priority of priorities) {
            await this.preloadByPriority(priority);
        }
    }
}

// Instance globale du préchargeur
export const preloader = new IntelligentPreloader();

// Hook pour précharger selon la navigation
export function useRoutePreloading(currentRoute: string) {
    if (typeof window !== 'undefined') {
        // Précharger immédiatement les composants critiques
        preloader.preloadByPriority('critical');
        
        // Précharger les composants de la route actuelle
        preloader.preloadForRoute(currentRoute);
        
        // Précharger les routes probables selon l'historique
        const likelyNextRoutes = predictNextRoutes(currentRoute);
        likelyNextRoutes.forEach(route => {
            preloader.preloadForRoute(route);
        });
    }
}

// Prédiction intelligente des prochaines routes
function predictNextRoutes(currentRoute: string): string[] {
    const routeGraph: Record<string, string[]> = {
        '/': ['/tableau-de-bord', '/planning'],
        '/tableau-de-bord': ['/planning', '/conges'],
        '/planning': ['/bloc-operatoire', '/conges'],
        '/bloc-operatoire': ['/planning'],
        '/conges': ['/planning', '/tableau-de-bord'],
        '/admin': ['/admin/utilisateurs', '/admin/sites'],
    };

    return routeGraph[currentRoute] || [];
}