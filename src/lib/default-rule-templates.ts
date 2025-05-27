import { RulesConfiguration, FatigueConfig } from '@/types/rules';
import { ShiftType } from '@/types/common';

export interface RulesTemplate {
    id?: string;
    name: string;
    description: string;
    category: 'STANDARD' | 'INTENSIF' | 'ALLEGE' | 'PEDIATRIE' | 'CUSTOM';
    rules: RulesConfiguration;
    fatigueConfig: FatigueConfig;
    isDefault: boolean;
}

export function getDefaultTemplates(): RulesTemplate[] {
    return [
        {
            name: "Standard - Équipe classique",
            description: "Configuration équilibrée pour une équipe d'anesthésie standard (15-20 personnes)",
            category: 'STANDARD',
            isDefault: true,
            rules: {
                weekdayShifts: [ShiftType.MATIN, ShiftType.APRES_MIDI, ShiftType.GARDE_24H, ShiftType.ASTREINTE],
                weekendShifts: [ShiftType.GARDE_24H, ShiftType.ASTREINTE],
                minimumRestPeriod: 12,
                shiftStartTimes: {
                    [ShiftType.MATIN]: '08:00',
                    [ShiftType.APRES_MIDI]: '14:00',
                    [ShiftType.GARDE_24H]: '08:00',
                    [ShiftType.ASTREINTE]: '18:00',
                    [ShiftType.JOUR]: '08:00',
                    [ShiftType.NUIT]: '20:00',
                    [ShiftType.GARDE_WEEKEND]: '08:00',
                    [ShiftType.ASTREINTE_SEMAINE]: '18:00',
                    [ShiftType.ASTREINTE_WEEKEND]: '08:00',
                    [ShiftType.URGENCE]: '08:00',
                    [ShiftType.CONSULTATION]: '09:00',
                    [ShiftType.JOURNEE]: '08:00'
                },
                shiftEndTimes: {
                    [ShiftType.MATIN]: '13:00',
                    [ShiftType.APRES_MIDI]: '18:30',
                    [ShiftType.GARDE_24H]: '08:00',
                    [ShiftType.ASTREINTE]: '08:00',
                    [ShiftType.JOUR]: '20:00',
                    [ShiftType.NUIT]: '08:00',
                    [ShiftType.GARDE_WEEKEND]: '08:00',
                    [ShiftType.ASTREINTE_SEMAINE]: '08:00',
                    [ShiftType.ASTREINTE_WEEKEND]: '08:00',
                    [ShiftType.URGENCE]: '20:00',
                    [ShiftType.CONSULTATION]: '13:00',
                    [ShiftType.JOURNEE]: '18:00'
                },
                shiftSpecialties: {
                    [ShiftType.MATIN]: ['standard'],
                    [ShiftType.APRES_MIDI]: ['standard'],
                    [ShiftType.GARDE_24H]: ['standard'],
                    [ShiftType.ASTREINTE]: ['standard'],
                    [ShiftType.JOUR]: ['standard'],
                    [ShiftType.NUIT]: ['standard'],
                    [ShiftType.GARDE_WEEKEND]: ['standard'],
                    [ShiftType.ASTREINTE_SEMAINE]: ['standard'],
                    [ShiftType.ASTREINTE_WEEKEND]: ['standard'],
                    [ShiftType.URGENCE]: ['urgence'],
                    [ShiftType.CONSULTATION]: ['consultation'],
                    [ShiftType.JOURNEE]: ['standard']
                },
                intervalle: {
                    minJoursEntreGardes: 7,
                    minJoursRecommandes: 21,
                    maxGardesMois: 3,
                    maxGardesConsecutives: 1,
                    maxAstreintesMois: 5
                },
                supervision: {
                    maxSallesParMAR: {
                        'standard': 2,
                        'ophtalmologie': 3,
                        'endoscopie': 2
                    },
                    maxSallesExceptionnel: 3,
                    reglesSecteursCompatibles: {
                        'standard': ['standard'],
                        'ophtalmologie': ['ophtalmologie', 'standard'],
                        'endoscopie': ['endoscopie']
                    }
                },
                consultations: {
                    maxParSemaine: 2,
                    equilibreMatinApresMidi: true
                },
                equite: {
                    poidsGardesWeekend: 1.5,
                    poidsGardesFeries: 2,
                    equilibrageSpecialites: true
                },
                qualiteVie: {
                    poidsPreferences: 0.5,
                    eviterConsecutifs: true,
                    recuperationApresGardeNuit: true
                }
            },
            fatigueConfig: {
                enabled: true,
                points: {
                    garde: 30,
                    astreinte: 10,
                    supervisionMultiple: 15,
                    pediatrie: 10,
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
            }
        },
        {
            name: "Intensif - Gros CHU",
            description: "Configuration pour un CHU avec forte activité et équipe importante (30+ personnes)",
            category: 'INTENSIF',
            isDefault: true,
            rules: {
                weekdayShifts: [ShiftType.MATIN, ShiftType.APRES_MIDI, ShiftType.GARDE_24H, ShiftType.ASTREINTE],
                weekendShifts: [ShiftType.GARDE_24H, ShiftType.ASTREINTE],
                minimumRestPeriod: 11,
                shiftStartTimes: {
                    [ShiftType.MATIN]: '07:30',
                    [ShiftType.APRES_MIDI]: '13:30',
                    [ShiftType.GARDE_24H]: '08:00',
                    [ShiftType.ASTREINTE]: '18:00',
                    [ShiftType.JOUR]: '07:30',
                    [ShiftType.NUIT]: '19:30',
                    [ShiftType.GARDE_WEEKEND]: '08:00',
                    [ShiftType.ASTREINTE_SEMAINE]: '18:00',
                    [ShiftType.ASTREINTE_WEEKEND]: '08:00',
                    [ShiftType.URGENCE]: '08:00',
                    [ShiftType.CONSULTATION]: '08:00',
                    [ShiftType.JOURNEE]: '07:30'
                },
                shiftEndTimes: {
                    [ShiftType.MATIN]: '13:30',
                    [ShiftType.APRES_MIDI]: '19:30',
                    [ShiftType.GARDE_24H]: '08:00',
                    [ShiftType.ASTREINTE]: '08:00',
                    [ShiftType.JOUR]: '19:30',
                    [ShiftType.NUIT]: '07:30',
                    [ShiftType.GARDE_WEEKEND]: '08:00',
                    [ShiftType.ASTREINTE_SEMAINE]: '08:00',
                    [ShiftType.ASTREINTE_WEEKEND]: '08:00',
                    [ShiftType.URGENCE]: '20:00',
                    [ShiftType.CONSULTATION]: '13:00',
                    [ShiftType.JOURNEE]: '19:30'
                },
                shiftSpecialties: {
                    [ShiftType.MATIN]: ['standard', 'urgence'],
                    [ShiftType.APRES_MIDI]: ['standard', 'urgence'],
                    [ShiftType.GARDE_24H]: ['standard', 'urgence'],
                    [ShiftType.ASTREINTE]: ['standard'],
                    [ShiftType.JOUR]: ['standard'],
                    [ShiftType.NUIT]: ['standard', 'urgence'],
                    [ShiftType.GARDE_WEEKEND]: ['standard', 'urgence'],
                    [ShiftType.ASTREINTE_SEMAINE]: ['standard'],
                    [ShiftType.ASTREINTE_WEEKEND]: ['standard'],
                    [ShiftType.URGENCE]: ['urgence'],
                    [ShiftType.CONSULTATION]: ['consultation'],
                    [ShiftType.JOURNEE]: ['standard']
                },
                intervalle: {
                    minJoursEntreGardes: 6,
                    minJoursRecommandes: 14,
                    maxGardesMois: 4,
                    maxGardesConsecutives: 1,
                    maxAstreintesMois: 6
                },
                supervision: {
                    maxSallesParMAR: {
                        'standard': 3,
                        'ophtalmologie': 4,
                        'endoscopie': 2,
                        'urgence': 2
                    },
                    maxSallesExceptionnel: 4,
                    reglesSecteursCompatibles: {
                        'standard': ['standard', 'urgence'],
                        'ophtalmologie': ['ophtalmologie', 'standard'],
                        'endoscopie': ['endoscopie'],
                        'urgence': ['urgence', 'standard']
                    }
                },
                consultations: {
                    maxParSemaine: 3,
                    equilibreMatinApresMidi: true
                },
                equite: {
                    poidsGardesWeekend: 1.5,
                    poidsGardesFeries: 2,
                    equilibrageSpecialites: true
                },
                qualiteVie: {
                    poidsPreferences: 0.3,
                    eviterConsecutifs: true,
                    recuperationApresGardeNuit: true
                }
            },
            fatigueConfig: {
                enabled: true,
                points: {
                    garde: 35,
                    astreinte: 12,
                    supervisionMultiple: 20,
                    pediatrie: 15,
                    specialiteLourde: 25,
                    urgence: 30
                },
                recovery: {
                    jourOff: 12,
                    demiJourneeOff: 6,
                    weekend: 25
                },
                seuils: {
                    alerte: 60,
                    critique: 90
                }
            }
        },
        {
            name: "Allégé - Petite structure",
            description: "Configuration pour une petite équipe ou clinique privée (8-12 personnes)",
            category: 'ALLEGE',
            isDefault: true,
            rules: {
                weekdayShifts: [ShiftType.JOURNEE, ShiftType.ASTREINTE],
                weekendShifts: [ShiftType.ASTREINTE],
                minimumRestPeriod: 14,
                shiftStartTimes: {
                    [ShiftType.MATIN]: '08:30',
                    [ShiftType.APRES_MIDI]: '14:00',
                    [ShiftType.GARDE_24H]: '08:00',
                    [ShiftType.ASTREINTE]: '18:00',
                    [ShiftType.JOUR]: '08:30',
                    [ShiftType.NUIT]: '20:00',
                    [ShiftType.GARDE_WEEKEND]: '08:00',
                    [ShiftType.ASTREINTE_SEMAINE]: '18:00',
                    [ShiftType.ASTREINTE_WEEKEND]: '08:00',
                    [ShiftType.URGENCE]: '08:00',
                    [ShiftType.CONSULTATION]: '09:00',
                    [ShiftType.JOURNEE]: '08:30'
                },
                shiftEndTimes: {
                    [ShiftType.MATIN]: '12:30',
                    [ShiftType.APRES_MIDI]: '18:00',
                    [ShiftType.GARDE_24H]: '08:00',
                    [ShiftType.ASTREINTE]: '08:00',
                    [ShiftType.JOUR]: '18:00',
                    [ShiftType.NUIT]: '08:00',
                    [ShiftType.GARDE_WEEKEND]: '08:00',
                    [ShiftType.ASTREINTE_SEMAINE]: '08:00',
                    [ShiftType.ASTREINTE_WEEKEND]: '08:00',
                    [ShiftType.URGENCE]: '20:00',
                    [ShiftType.CONSULTATION]: '12:30',
                    [ShiftType.JOURNEE]: '18:00'
                },
                shiftSpecialties: {
                    [ShiftType.MATIN]: ['standard'],
                    [ShiftType.APRES_MIDI]: ['standard'],
                    [ShiftType.GARDE_24H]: ['standard'],
                    [ShiftType.ASTREINTE]: ['standard'],
                    [ShiftType.JOUR]: ['standard'],
                    [ShiftType.NUIT]: ['standard'],
                    [ShiftType.GARDE_WEEKEND]: ['standard'],
                    [ShiftType.ASTREINTE_SEMAINE]: ['standard'],
                    [ShiftType.ASTREINTE_WEEKEND]: ['standard'],
                    [ShiftType.URGENCE]: ['standard'],
                    [ShiftType.CONSULTATION]: ['standard'],
                    [ShiftType.JOURNEE]: ['standard']
                },
                intervalle: {
                    minJoursEntreGardes: 10,
                    minJoursRecommandes: 30,
                    maxGardesMois: 2,
                    maxGardesConsecutives: 1,
                    maxAstreintesMois: 4
                },
                supervision: {
                    maxSallesParMAR: {
                        'standard': 2,
                        'ophtalmologie': 2,
                        'endoscopie': 1
                    },
                    maxSallesExceptionnel: 2,
                    reglesSecteursCompatibles: {
                        'standard': ['standard'],
                        'ophtalmologie': ['ophtalmologie'],
                        'endoscopie': ['endoscopie']
                    }
                },
                consultations: {
                    maxParSemaine: 4,
                    equilibreMatinApresMidi: true
                },
                equite: {
                    poidsGardesWeekend: 2,
                    poidsGardesFeries: 2.5,
                    equilibrageSpecialites: false
                },
                qualiteVie: {
                    poidsPreferences: 0.8,
                    eviterConsecutifs: true,
                    recuperationApresGardeNuit: true
                }
            },
            fatigueConfig: {
                enabled: true,
                points: {
                    garde: 25,
                    astreinte: 8,
                    supervisionMultiple: 10,
                    pediatrie: 8,
                    specialiteLourde: 15
                },
                recovery: {
                    jourOff: 20,
                    demiJourneeOff: 10,
                    weekend: 40
                },
                seuils: {
                    alerte: 40,
                    critique: 70
                }
            }
        },
        {
            name: "Pédiatrie - Hôpital enfants",
            description: "Configuration adaptée pour un service de pédiatrie avec contraintes spécifiques",
            category: 'PEDIATRIE',
            isDefault: true,
            rules: {
                weekdayShifts: [ShiftType.MATIN, ShiftType.APRES_MIDI, ShiftType.GARDE_24H, ShiftType.ASTREINTE],
                weekendShifts: [ShiftType.GARDE_24H, ShiftType.ASTREINTE],
                minimumRestPeriod: 12,
                shiftStartTimes: {
                    [ShiftType.MATIN]: '07:45',
                    [ShiftType.APRES_MIDI]: '13:45',
                    [ShiftType.GARDE_24H]: '08:00',
                    [ShiftType.ASTREINTE]: '18:00',
                    [ShiftType.JOUR]: '07:45',
                    [ShiftType.NUIT]: '19:45',
                    [ShiftType.GARDE_WEEKEND]: '08:00',
                    [ShiftType.ASTREINTE_SEMAINE]: '18:00',
                    [ShiftType.ASTREINTE_WEEKEND]: '08:00',
                    [ShiftType.URGENCE]: '08:00',
                    [ShiftType.CONSULTATION]: '08:30',
                    [ShiftType.JOURNEE]: '07:45'
                },
                shiftEndTimes: {
                    [ShiftType.MATIN]: '13:45',
                    [ShiftType.APRES_MIDI]: '19:45',
                    [ShiftType.GARDE_24H]: '08:00',
                    [ShiftType.ASTREINTE]: '08:00',
                    [ShiftType.JOUR]: '19:45',
                    [ShiftType.NUIT]: '07:45',
                    [ShiftType.GARDE_WEEKEND]: '08:00',
                    [ShiftType.ASTREINTE_SEMAINE]: '08:00',
                    [ShiftType.ASTREINTE_WEEKEND]: '08:00',
                    [ShiftType.URGENCE]: '20:00',
                    [ShiftType.CONSULTATION]: '12:30',
                    [ShiftType.JOURNEE]: '19:45'
                },
                shiftSpecialties: {
                    [ShiftType.MATIN]: ['pediatrie'],
                    [ShiftType.APRES_MIDI]: ['pediatrie'],
                    [ShiftType.GARDE_24H]: ['pediatrie'],
                    [ShiftType.ASTREINTE]: ['pediatrie'],
                    [ShiftType.JOUR]: ['pediatrie'],
                    [ShiftType.NUIT]: ['pediatrie'],
                    [ShiftType.GARDE_WEEKEND]: ['pediatrie'],
                    [ShiftType.ASTREINTE_SEMAINE]: ['pediatrie'],
                    [ShiftType.ASTREINTE_WEEKEND]: ['pediatrie'],
                    [ShiftType.URGENCE]: ['pediatrie'],
                    [ShiftType.CONSULTATION]: ['pediatrie'],
                    [ShiftType.JOURNEE]: ['pediatrie']
                },
                intervalle: {
                    minJoursEntreGardes: 8,
                    minJoursRecommandes: 21,
                    maxGardesMois: 3,
                    maxGardesConsecutives: 1,
                    maxAstreintesMois: 4
                },
                supervision: {
                    maxSallesParMAR: {
                        'pediatrie': 2,
                        'neonatologie': 1,
                        'standard': 2
                    },
                    maxSallesExceptionnel: 2,
                    reglesSecteursCompatibles: {
                        'pediatrie': ['pediatrie', 'neonatologie'],
                        'neonatologie': ['neonatologie'],
                        'standard': ['standard', 'pediatrie']
                    }
                },
                consultations: {
                    maxParSemaine: 2,
                    equilibreMatinApresMidi: true
                },
                equite: {
                    poidsGardesWeekend: 1.8,
                    poidsGardesFeries: 2.2,
                    equilibrageSpecialites: true
                },
                qualiteVie: {
                    poidsPreferences: 0.6,
                    eviterConsecutifs: true,
                    recuperationApresGardeNuit: true
                }
            },
            fatigueConfig: {
                enabled: true,
                points: {
                    garde: 35,
                    astreinte: 12,
                    supervisionMultiple: 18,
                    pediatrie: 15,
                    specialiteLourde: 25,
                    neonatologie: 30
                },
                recovery: {
                    jourOff: 18,
                    demiJourneeOff: 9,
                    weekend: 35
                },
                seuils: {
                    alerte: 45,
                    critique: 75
                }
            }
        }
    ];
}