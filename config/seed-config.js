/**
 * Configuration centralisée pour le seed de la base de données
 * Ce fichier contient toutes les données de référence pour l'initialisation
 * et peut être utilisé pour réinitialiser la base de données à tout moment
 */

// Configuration des secteurs opératoires et des salles
export const operatingConfiguration = {
    site: "Clinique Mathilde",
    sectors: [
        {
            name: "Aseptique",
            colorCode: "#4CAF50", // Vert
            isActive: true,
            description: "Salles 1 à 4",
            rooms: [
                { name: "Salle 1", number: "S1", isActive: true },
                { name: "Salle 2", number: "S2", isActive: true },
                { name: "Salle 3", number: "S3", isActive: true },
                { name: "Salle 4", number: "S4", isActive: true }
            ]
        },
        {
            name: "Intermédiaire",
            colorCode: "#2196F3", // Bleu
            isActive: true,
            description: "Salles 5 à 8 dont la salle 8 qui est la salle d'urgence/césarienne",
            rooms: [
                { name: "Salle 5", number: "S5", isActive: true },
                { name: "Salle 6", number: "S6", isActive: true },
                { name: "Salle 7", number: "S7", isActive: true },
                { name: "Salle 8", number: "S8", isActive: true, description: "Salle d'urgence/césarienne" }
            ]
        },
        {
            name: "Septique",
            colorCode: "#FF5722", // Orange
            isActive: true,
            description: "Salles 9 à 12 et 12bis",
            rooms: [
                { name: "Salle 9", number: "S9", isActive: true },
                { name: "Salle 10", number: "S10", isActive: true },
                { name: "Salle 11", number: "S11", isActive: true },
                { name: "Salle 12", number: "S12", isActive: true },
                { name: "Salle 12bis", number: "S12B", isActive: true }
            ]
        },
        {
            name: "Ophtalmo",
            colorCode: "#9C27B0", // Violet
            isActive: true,
            description: "Salles 14 à 17",
            rooms: [
                { name: "Salle 14", number: "S14", isActive: true },
                { name: "Salle 15", number: "S15", isActive: true },
                { name: "Salle 16", number: "S16", isActive: true },
                { name: "Salle 17", number: "S17", isActive: true }
            ]
        },
        {
            name: "Endoscopie",
            colorCode: "#FFC107", // Ambre
            isActive: true,
            description: "Salles Endo 1 à Endo 4",
            rooms: [
                { name: "Endo 1", number: "E1", isActive: true },
                { name: "Endo 2", number: "E2", isActive: true },
                { name: "Endo 3", number: "E3", isActive: true },
                { name: "Endo 4", number: "E4", isActive: true }
            ]
        }
    ]
};

// Règles de planning (complétées avec les informations de la documentation)
export const planningRules = {
    // Règles pour les congés
    leaveRules: [
        {
            name: "Limite congés été",
            description: "Maximum 3 semaines consécutives en juillet-août",
            type: "LEAVE",
            priority: "HIGH",
            isActive: true,
            configuration: {
                maxConsecutiveDays: 21,
                applicablePeriods: [
                    { start: "07-01", end: "08-31" }
                ],
                applicableRoles: ["MAR", "IADE"]
            }
        },
        {
            name: "Limite MAR absents",
            description: "Maximum 30% des MAR absents simultanément",
            type: "LEAVE",
            priority: "CRITICAL",
            isActive: true,
            configuration: {
                maxAbsentPercentage: 30,
                applicableRoles: ["MAR"]
            }
        },
        {
            name: "Quota congés",
            description: "50 jours pour temps plein, proportionnel pour temps partiel",
            type: "LEAVE",
            priority: "HIGH",
            isActive: true,
            configuration: {
                quotaFullTime: 50,
                countingMethod: "WEEKDAYS_ONLY"
            }
        }
    ],

    // Règles pour les gardes et astreintes
    dutyRules: [
        {
            name: "Repos après garde",
            description: "Repos obligatoire le lendemain d'une garde",
            type: "DUTY",
            priority: "HIGH",
            isActive: true,
            configuration: {
                restDaysAfter: 1,
                applicableRoles: ["MAR"],
                incompatibleWith: ["CONSULTATION", "BLOC", "ASTREINTE"]
            }
        },
        {
            name: "Espacement gardes",
            description: "Idéalement 7 jours entre gardes (minimum 3 jours)",
            type: "DUTY",
            priority: "MEDIUM",
            isActive: true,
            configuration: {
                idealGapDays: 7,
                minGapDays: 3
            }
        },
        {
            name: "Maximum gardes",
            description: "3 gardes/30 jours (exceptionnellement 4)",
            type: "DUTY",
            priority: "HIGH",
            isActive: true,
            configuration: {
                maxPerPeriod: 3,
                periodDays: 30,
                exceptionalMax: 4
            }
        },
        {
            name: "Incompatibilité Astreinte",
            description: "Astreinte incompatible avec Garde et Repos de Garde",
            type: "DUTY_INCOMPATIBILITY", // Utiliser un type spécifique ou adapter la logique existante
            priority: "HIGH",
            isActive: true,
            configuration: {
                assignmentType: "ASTREINTE", // Le type d'affectation concerné par la règle
                incompatibleWith: ["GARDE", "REPOS_GARDE"] // Les types avec lesquels elle est incompatible
                // Note: Il faudra peut-être ajuster le moteur de règles pour gérer ce type de règle
            }
        }
    ],

    // Règles pour les affectations
    assignmentRules: [
        {
            name: "Alternance secteurs",
            description: "Ne pas affecter au même secteur plus de 3 jours consécutifs",
            type: "ASSIGNMENT",
            priority: "WARNING",
            isActive: true,
            configuration: {
                maxConsecutiveDaysInSameSector: 3
            }
        },
        {
            name: "Supervision bloc",
            description: "Maximum 2 salles par MAR (exceptionnellement 3)",
            type: "ASSIGNMENT",
            priority: "HIGH",
            isActive: true,
            configuration: {
                maxRoomsByDefault: 2,
                exceptionalMax: 3,
                sectorExceptions: {
                    "Ophtalmo": 3,
                    "Endoscopie": 2
                }
            }
        },
        {
            name: "Consultations hebdomadaires",
            description: "2 consultations par semaine pour temps plein",
            type: "ASSIGNMENT",
            priority: "MEDIUM",
            isActive: true,
            configuration: {
                perWeekFullTime: 2,
                maxPerWeek: 3,
                distribution: "1-2 ou 2-1"
            }
        },
        {
            name: "Règles secteur aseptique",
            description: "Supervision dans le même secteur uniquement",
            type: "ASSIGNMENT",
            priority: "HIGH",
            isActive: true,
            configuration: {
                sectorId: "Aseptique",
                restrictionType: "SAME_SECTOR_ONLY"
            }
        },
        {
            name: "Règles secteur intermédiaire",
            description: "Peuvent superviser l'ophtalmologie",
            type: "ASSIGNMENT",
            priority: "MEDIUM",
            isActive: true,
            configuration: {
                sectorId: "Intermédiaire",
                canSuperviseSectors: ["Ophtalmo"]
            }
        },
        {
            name: "Règles secteur septique",
            description: "Supervision dans salles contiguës",
            type: "ASSIGNMENT",
            priority: "HIGH",
            isActive: true,
            configuration: {
                sectorId: "Septique",
                restrictionType: "CONTIGUOUS_ROOMS_ONLY"
            }
        },
        {
            name: "Supervision Ophtalmo Source",
            description: "Ophtalmo peut être supervisé depuis S6 ou S7",
            type: "ASSIGNMENT_SUPERVISION_SOURCE",
            priority: "MEDIUM",
            isActive: true,
            configuration: {
                targetSectorId: "Ophtalmo",
                allowedSourceRooms: ["S6", "S7"]
            }
        },
        {
            name: "Supervision Endoscopie Source",
            description: "Endoscopie peut être supervisé depuis S10, S11 ou S12B",
            type: "ASSIGNMENT_SUPERVISION_SOURCE",
            priority: "MEDIUM",
            isActive: true,
            configuration: {
                targetSectorId: "Endoscopie",
                allowedSourceRooms: ["S10", "S11", "S12B"]
            }
        }
    ],

    // Règles pour la fatigue (NOUVELLE SECTION)
    fatigueRules: {
        enabled: true,
        points: {
            garde: 30,
            astreinte: 10,
            supervisionMultiple: 15, // Pour 3+ salles
            pediatrie: 10,
            specialiteLourde: 8
        },
        recovery: {
            jourOff: 20,
            weekendOff: 30,
            demiJourneeOff: 10
        },
        thresholds: {
            alert: 80,
            critical: 120
        },
        weighting: { // Pondération pour l'algo d'optimisation
            equity: 0.6,
            fatigue: 0.4
        }
    }
};

// Configuration des types de congés (déjà importée mais conservée ici pour référence)
export const leaveTypes = [
    {
        code: "CP",
        label: "Congés annuels",
        description: "Congés payés annuels",
        isActive: true,
        isUserSelectable: true,
        rules: {
            countingMethod: "WEEKDAYS_IF_WORKING",
            maxDuration: 30,
            minRequestLeadTime: 30,
            approverRoles: ["ADMIN_TOTAL", "ADMIN_PARTIEL"]
        }
    },
    {
        code: "RTT",
        label: "RTT",
        description: "Réduction du temps de travail",
        isActive: true,
        isUserSelectable: true,
        rules: {
            countingMethod: "WEEKDAYS_IF_WORKING",
            maxDuration: 1,
            minRequestLeadTime: 7,
            approverRoles: ["ADMIN_TOTAL", "ADMIN_PARTIEL"]
        }
    },
    {
        code: "FORM",
        label: "Formation",
        description: "Congé pour formation professionnelle",
        isActive: true,
        isUserSelectable: true,
        rules: {
            countingMethod: "CONTINUOUS_ALL_DAYS",
            maxDuration: 30,
            minRequestLeadTime: 30,
            approverRoles: ["ADMIN_TOTAL", "ADMIN_PARTIEL"]
        }
    },
    {
        code: "MAL",
        label: "Maladie",
        description: "Arrêt maladie",
        isActive: true,
        isUserSelectable: true,
        rules: {
            countingMethod: "CONTINUOUS_ALL_DAYS",
            maxDuration: 90,
            minRequestLeadTime: 0,
            approverRoles: ["ADMIN_TOTAL"]
        }
    },
    {
        code: "ABS",
        label: "Absence autre",
        description: "Absence non catégorisée",
        isActive: true,
        isUserSelectable: true,
        rules: {
            countingMethod: "WEEKDAYS_ONLY",
            maxDuration: 5,
            minRequestLeadTime: 14,
            approverRoles: ["ADMIN_TOTAL", "ADMIN_PARTIEL"]
        }
    }
];

// Export d'une fonction pour récupérer toute la configuration
export function getFullSeedConfiguration() {
    return {
        operating: operatingConfiguration,
        planningRules,
        leaveTypes
    };
} 