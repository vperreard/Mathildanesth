import { v4 as uuidv4 } from 'uuid';
import { Rule, RuleType, RuleSeverity } from '../types/rule';

export const defaultRules: Rule[] = [
    // Règles d'équipe
    {
        id: uuidv4(),
        name: "Capacité minimale équipe Anesthésie",
        description: "Maintient une capacité minimale de 50% pendant la semaine",
        type: RuleType.TEAM_CAPACITY,
        severity: RuleSeverity.HIGH,
        enabled: true,
        isDefault: true,
        configuration: {
            teamId: "anesthesie",
            minCapacity: 50,
            applyDuring: ["WEEKDAYS", "WEEKENDS"]
        },
        createdAt: new Date(),
        updatedAt: new Date()
    },

    // Règles de repos après garde
    {
        id: uuidv4(),
        name: "Repos post-garde obligatoire",
        description: "Impose un repos de 24h après une garde",
        type: RuleType.DUTY_REST,
        severity: RuleSeverity.HIGH,
        enabled: true,
        isDefault: true,
        configuration: {
            minHoursAfterDuty: 24,
            enforcedForLeaves: true,
            enforcedForConsultations: true,
            enforcedForSurgery: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
    },

    // Règles de congés pour périodes spéciales
    {
        id: uuidv4(),
        name: "Restrictions congés périodes scolaires",
        description: "Limite les absences pendant les vacances scolaires",
        type: RuleType.LEAVE_RESTRICTION,
        severity: RuleSeverity.MEDIUM,
        enabled: true,
        isDefault: true,
        configuration: {
            specialPeriods: [
                {
                    name: "Vacances d'été",
                    startDate: new Date("2025-07-01"),
                    endDate: new Date("2025-08-31"),
                    maxTeamAbsence: 30,
                    restrictionLevel: "MEDIUM"
                },
                {
                    name: "Vacances de Noël",
                    startDate: new Date("2025-12-21"),
                    endDate: new Date("2026-01-04"),
                    maxTeamAbsence: 30,
                    restrictionLevel: "MEDIUM"
                }
            ],
            minDaysBetweenLeaves: 14,
            requestDeadlineDays: 30
        },
        createdAt: new Date(),
        updatedAt: new Date()
    },

    // Règles de supervision
    {
        id: uuidv4(),
        name: "Supervision minimale",
        description: "Au moins un superviseur doit être présent par jour",
        type: RuleType.SUPERVISION,
        severity: RuleSeverity.HIGH,
        enabled: true,
        isDefault: true,
        configuration: {
            minSupervisorsPresent: 1,
            supervisionRatio: 5, // 5 supervisés maximum par superviseur
            includeSeniorsAsSupervised: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
    }
]; 