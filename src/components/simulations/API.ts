/**
 * API pour les fonctionnalités de simulation
 */

/**
 * Interface pour les options d'application de simulation
 */
export interface ApplySimulationOptions {
    simulationResultId: string;
    clearExistingAssignments?: boolean;
    includeLeaves?: boolean;
    includeOnCall?: boolean;
    notes?: string;
}

/**
 * Interface pour les résultats de l'application de simulation
 */
export interface ApplySimulationResult {
    success: boolean;
    message?: string;
    error?: string;
    data?: {
        assignmentsCreated: number;
        assignmentsUpdated: number;
        leavesCreated: number;
        conflicts: Array<{
            type: string;
            message: string;
            error?: string;
        }>;
        date: string;
    };
}

/**
 * Applique un résultat de simulation au planning réel
 * @param options Options pour l'application
 * @returns Résultat de l'opération
 */
export async function applySimulationToPlanning(options: ApplySimulationOptions): Promise<ApplySimulationResult> {
    try {
        const response = await fetch('http://localhost:3000/api/simulations/apply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(options),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error || 'Une erreur est survenue lors de l\'application de la simulation',
                data: data.data,
            };
        }

        return {
            success: true,
            message: data.message || 'Simulation appliquée avec succès',
            data: data.data,
        };
    } catch (error) {
        return {
            success: false,
            error: 'Une erreur est survenue lors de la communication avec le serveur',
        };
    }
}

/**
 * Interface pour les options de récupération des résultats de simulation
 */
export interface GetSimulationResultOptions {
    resultId: string;
}

/**
 * Récupère les détails d'un résultat de simulation
 * @param options Options pour la récupération
 * @returns Données du résultat de simulation
 */
export async function getSimulationResult({ resultId }: GetSimulationResultOptions) {
    try {
        const response = await fetch(`http://localhost:3000/api/simulations/results/${resultId}`);

        if (!response.ok) {
            throw new Error('Erreur lors du chargement des données du résultat');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

/**
 * Interface pour les options de visualisation avancée
 */
export interface AdvancedVisualizationOptions {
    resultId: string;
    visualizationType?: 'heatmap' | 'sankey';
    metric?: 'staffing' | 'utilization' | 'satisfaction';
    timeframe?: 'daily' | 'weekly' | 'monthly';
    detailLevel?: 'departments' | 'skills' | 'resources';
}

/**
 * Récupère les données pour les visualisations avancées
 * @param options Options pour les visualisations
 * @returns Données formatées pour les visualisations
 */
export async function getAdvancedVisualizationData(options: AdvancedVisualizationOptions) {
    try {
        const url = new URL('/api/simulations/visualizations', window.location.origin);
        Object.entries(options).forEach(([key, value]) => {
            if (value) url.searchParams.append(key, value.toString());
        });

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error('Erreur lors du chargement des données de visualisation');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
} 