import { PlanningGenerator } from './planningGenerator';
import {
    Assignment,
    AssignmentType,
    GenerationParameters,
    ValidationResult
} from '../types/assignment';
import { User } from '../types/user';
import {
    RulesConfiguration,
    FatigueConfig,
    defaultRulesConfiguration,
    defaultFatigueConfig
} from '../types/rules';

// Interface pour stocker une simulation de planning
export interface PlanningSimulation {
    id: string;
    name: string;
    description: string;
    parameters: GenerationParameters;
    rulesConfiguration: RulesConfiguration;
    fatigueConfig: FatigueConfig;
    results: {
        gardes: Assignment[];
        astreintes: Assignment[];
        consultations: Assignment[];
        blocs: Assignment[];
    };
    validation: ValidationResult;
    createdAt: Date;
}

// Interface pour les métriques de comparaison
export interface SimulationMetrics {
    equityScore: number;
    fatigueScore: number;
    satisfactionScore: number;
    ruleViolationsCount: {
        critical: number;
        major: number;
        minor: number;
        total: number;
    };
    assignmentCounts: {
        gardes: number;
        astreintes: number;
        consultations: number;
        blocs: number;
        total: number;
    };
}

/**
 * Service de simulation de planning
 * Permet de générer et comparer plusieurs variantes de planning
 */
export class PlanningSimulator {
    private simulations: Map<string, PlanningSimulation> = new Map();
    private personnel: User[] = [];
    private existingAssignments: Assignment[] = [];
    private baseParameters: GenerationParameters;

    constructor(
        baseParameters: GenerationParameters,
        personnel: User[] = [],
        existingAssignments: Assignment[] = []
    ) {
        this.baseParameters = baseParameters;
        this.personnel = personnel;
        this.existingAssignments = existingAssignments;
    }

    /**
     * Génère une nouvelle simulation avec des paramètres personnalisés
     */
    async generateSimulation(
        name: string,
        description: string,
        parameterOverrides: Partial<GenerationParameters> = {},
        rulesOverrides: Partial<RulesConfiguration> = {},
        fatigueOverrides: Partial<FatigueConfig> = {}
    ): Promise<string> {
        // Génère un ID unique
        const simulationId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Combine les paramètres de base avec les remplacements
        const parameters = {
            ...this.baseParameters,
            ...parameterOverrides
        };

        // Combine les configurations des règles avec les remplacements
        const rulesConfig = this.mergeRulesConfig(rulesOverrides);

        // Combine les configurations de fatigue avec les remplacements
        const fatigueConfig = this.mergeFatigueConfig(fatigueOverrides);

        // Crée le générateur de planning avec les paramètres combinés
        const generator = new PlanningGenerator(parameters, rulesConfig, fatigueConfig);

        // Initialise le générateur avec le personnel et les affectations existantes
        await generator.initialize(this.personnel, this.existingAssignments);

        // Génère le planning complet
        const validation = await generator.generateFullPlanning();

        // Récupère les résultats générés
        const results = generator.getResults();

        // Crée l'objet de simulation
        const simulation: PlanningSimulation = {
            id: simulationId,
            name,
            description,
            parameters,
            rulesConfiguration: rulesConfig,
            fatigueConfig,
            results,
            validation,
            createdAt: new Date()
        };

        // Stocke la simulation
        this.simulations.set(simulationId, simulation);

        return simulationId;
    }

    /**
     * Fusionne les configurations de règles
     */
    private mergeRulesConfig(overrides: Partial<RulesConfiguration>): RulesConfiguration {
        const baseConfig = { ...defaultRulesConfiguration };

        // Fusionne récursivement les objets
        return this.deepMerge(baseConfig, overrides) as RulesConfiguration;
    }

    /**
     * Fusionne les configurations de fatigue
     */
    private mergeFatigueConfig(overrides: Partial<FatigueConfig>): FatigueConfig {
        const baseConfig = { ...defaultFatigueConfig };

        // Fusionne récursivement les objets
        return this.deepMerge(baseConfig, overrides) as FatigueConfig;
    }

    /**
     * Fonction utilitaire pour fusionner profondément des objets
     */
    private deepMerge(target: any, source: any): any {
        if (source === null || typeof source !== 'object') return source;
        if (target === null || typeof target !== 'object') return target;

        const result = { ...target };

        Object.keys(source).forEach(key => {
            if (source[key] instanceof Object && key in target) {
                result[key] = this.deepMerge(target[key], source[key]);
            } else {
                result[key] = source[key];
            }
        });

        return result;
    }

    /**
     * Récupère une simulation par son ID
     */
    getSimulation(simulationId: string): PlanningSimulation | undefined {
        return this.simulations.get(simulationId);
    }

    /**
     * Récupère toutes les simulations
     */
    getAllSimulations(): PlanningSimulation[] {
        return Array.from(this.simulations.values());
    }

    /**
     * Supprime une simulation
     */
    deleteSimulation(simulationId: string): boolean {
        return this.simulations.delete(simulationId);
    }

    /**
     * Calcule les métriques détaillées pour une simulation
     */
    calculateMetrics(simulationId: string): SimulationMetrics | null {
        const simulation = this.simulations.get(simulationId);
        if (!simulation) return null;

        // Extrait les métriques de la validation
        const { equiteScore, fatigueScore, satisfactionScore } = simulation.validation.metrics;

        // Compte les violations par niveau de gravité
        const ruleViolationsCount = {
            critical: 0,
            major: 0,
            minor: 0,
            total: simulation.validation.violations.length
        };

        simulation.validation.violations.forEach(violation => {
            switch (violation.severity) {
                case 'CRITICAL': ruleViolationsCount.critical++; break;
                case 'MAJOR': ruleViolationsCount.major++; break;
                case 'MINOR': ruleViolationsCount.minor++; break;
            }
        });

        // Compte les affectations par type
        const assignmentCounts = {
            gardes: simulation.results.gardes.length,
            astreintes: simulation.results.astreintes.length,
            consultations: simulation.results.consultations.length,
            blocs: simulation.results.blocs.length,
            total: simulation.results.gardes.length +
                simulation.results.astreintes.length +
                simulation.results.consultations.length +
                simulation.results.blocs.length
        };

        return {
            equityScore,
            fatigueScore,
            satisfactionScore,
            ruleViolationsCount,
            assignmentCounts
        };
    }

    /**
     * Compare deux simulations et retourne les différences
     */
    compareSimulations(simulationId1: string, simulationId2: string): {
        metrics1: SimulationMetrics | null,
        metrics2: SimulationMetrics | null,
        parameterDifferences: Record<string, { value1: any, value2: any }>,
        ruleDifferences: Record<string, { value1: any, value2: any }>,
    } {
        const sim1 = this.simulations.get(simulationId1);
        const sim2 = this.simulations.get(simulationId2);

        const metrics1 = sim1 ? this.calculateMetrics(simulationId1) : null;
        const metrics2 = sim2 ? this.calculateMetrics(simulationId2) : null;

        const parameterDifferences: Record<string, { value1: any, value2: any }> = {};
        const ruleDifferences: Record<string, { value1: any, value2: any }> = {};

        // Compare les paramètres si les deux simulations existent
        if (sim1 && sim2) {
            // Compare les paramètres de génération
            this.findObjectDifferences(
                sim1.parameters,
                sim2.parameters,
                parameterDifferences,
                ''
            );

            // Compare les configurations de règles
            this.findObjectDifferences(
                sim1.rulesConfiguration,
                sim2.rulesConfiguration,
                ruleDifferences,
                ''
            );
        }

        return {
            metrics1,
            metrics2,
            parameterDifferences,
            ruleDifferences
        };
    }

    /**
     * Trouve récursivement les différences entre deux objets
     */
    private findObjectDifferences(
        obj1: any,
        obj2: any,
        differences: Record<string, { value1: any, value2: any }>,
        path: string
    ): void {
        // Pour chaque clé dans le premier objet
        Object.keys(obj1).forEach(key => {
            const currentPath = path ? `${path}.${key}` : key;

            // Si la clé existe dans les deux objets
            if (key in obj2) {
                if (obj1[key] instanceof Object && obj2[key] instanceof Object) {
                    // Récursion pour les objets imbriqués
                    this.findObjectDifferences(obj1[key], obj2[key], differences, currentPath);
                } else if (obj1[key] !== obj2[key]) {
                    // Stocke la différence pour les valeurs primitives
                    differences[currentPath] = {
                        value1: obj1[key],
                        value2: obj2[key]
                    };
                }
            } else {
                // Clé présente uniquement dans le premier objet
                differences[currentPath] = {
                    value1: obj1[key],
                    value2: undefined
                };
            }
        });

        // Pour chaque clé uniquement dans le deuxième objet
        Object.keys(obj2).forEach(key => {
            const currentPath = path ? `${path}.${key}` : key;

            if (!(key in obj1)) {
                differences[currentPath] = {
                    value1: undefined,
                    value2: obj2[key]
                };
            }
        });
    }

    /**
     * Applique une simulation comme planning définitif
     * Retourne les affectations combinées qui constituent le planning final
     */
    applySimulation(simulationId: string): Assignment[] | null {
        const simulation = this.simulations.get(simulationId);
        if (!simulation) return null;

        // Combine toutes les affectations
        const allAssignments = [
            ...simulation.results.gardes,
            ...simulation.results.astreintes,
            ...simulation.results.consultations,
            ...simulation.results.blocs
        ];

        return allAssignments;
    }
} 