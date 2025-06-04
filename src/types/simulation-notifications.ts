// Types pour les notifications de simulation côté client
export enum SimulationEvent {
    STARTED = 'simulation.started',
    PROGRESS = 'simulation.progress',
    COMPLETED = 'simulation.completed',
    FAILED = 'simulation.failed'
}

export interface SimulationProgress {
    scenarioId: string;
    progress: number; // 0-100
    status: 'queued' | 'running' | 'completed' | 'failed';
    currentStep?: string;
    totalSteps?: number;
    estimatedTimeRemaining?: number;
    message?: string;
}

export interface SimulationNotification {
    type: 'started' | 'progress' | 'completed' | 'failed';
    scenarioId: string;
    scenarioName?: string;
    progress?: number;
    message?: string;
    userId?: number;
    timestamp?: Date;
}

// Export explicite des types
export type { SimulationProgress as SimulationProgressType };