/**
 * Point d'entrée pour le moteur de règles
 */

// Exporter RuleEngine et ses types
export { RuleEngine } from './rule-engine';
export type {
    RuleEngineConfig,
    RuleValidator,
    RuleSolver,
    Resolution,
    RuleEvaluationSummary
} from './rule-engine';

// Exporter FatigueSystem et ses types
export { FatigueSystem } from './fatigue-system';
export type {
    FatigueConfig,
    Attribution,
    AssignmentType,
    OffPeriod,
    OffPeriodType,
    FatigueState,
    Medecin
} from './fatigue-system';

// Exporter EquitySystem et ses types
export { EquitySystem } from './equity-system';
export type {
    EquityConfig,
    OffSlot,
    Distribution,
    PlanningContext
} from './equity-system';

// Exporter TemporalRules et ses types
export { TemporalRulesService } from './temporal-rules';
export type { TemporalRulesConfig } from './temporal-rules';

// Exporter le service de cache
export { ruleCache } from '../services/ruleCache';
export type { RuleCacheOptions } from '../services/ruleCache';

// Importer les types pour les configurations par défaut
import type { RuleEngineConfig } from './rule-engine';
import type { FatigueConfig } from './fatigue-system';
import type { EquityConfig } from './equity-system';
import type { TemporalRulesConfig } from './temporal-rules';

/**
 * Configuration par défaut pour le moteur de règles
 */
export const defaultRuleEngineConfig: RuleEngineConfig = {
    defaultRules: []
};

/**
 * Configuration par défaut pour le système de fatigue
 */
export const defaultFatigueConfig: FatigueConfig = {
    points: {
        garde: 20,
        astreinte: 10,
        supervisionMultiple: 15,
        pediatrie: 25,
        specialiteLourde: 20
    },
    recovery: {
        jourOff: 15,
        demiJourneeOff: 8,
        weekend: 30
    },
    seuils: {
        alerte: 50,
        critique: 80
    }
};

/**
 * Configuration par défaut pour le système d'équité
 */
export const defaultEquityConfig: EquityConfig = {
    weights: {
        heures: 1.0,
        gardes: 2.0,
        weekends: 1.5,
        fetes: 2.0,
        fatigue: 1.0
    },
    quotas: {
        minOffPerWeek: 2,
        maxOffPerWeek: 4,
        minOffPerMonth: 8
    }
};

/**
 * Configuration par défaut pour les règles temporelles
 */
export const defaultTemporalRulesConfig: TemporalRulesConfig = {
    shiftSpacing: {
        minDaysBetween: 2,
        minDaysBetweenByType: {
            'NIGHT': 3,
            'LONG_DAY': 2
        },
        idealDaysBetween: 7
    },
    mandatoryRest: {
        restAfterDuty: true,
        restDuration: 24,
        specialRestByShiftType: {
            'NIGHT': 36,
            'LONG_DAY': 24
        }
    },
    incompatibilities: {
        shiftTypes: [
            ['NIGHT', 'MORNING'],
            ['NIGHT', 'EVENING']
        ],
        minTimeBetween: {
            'NIGHT': {
                'MORNING': 12,
                'EVENING': 8
            }
        },
        services: []
    }
}; 