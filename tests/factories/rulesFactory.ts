import { faker } from '@faker-js/faker';
import { ShiftType } from '@/types/common';
import { RulesConfiguration, FatigueConfig, defaultRulesConfiguration, defaultFatigueConfig } from '@/types/rules';

// Génère un objet RulesConfiguration complet, basé sur les valeurs par défaut
export function createRulesConfig(overrides: Partial<RulesConfiguration> = {}): RulesConfiguration {
    // Utiliser une deep copy des valeurs par défaut pour éviter les mutations accidentelles
    const defaults: RulesConfiguration = JSON.parse(JSON.stringify(defaultRulesConfiguration));

    // Appliquer des modifications aléatoires ou spécifiques si nécessaire (exemple)
    // defaults.intervalle.minJoursEntreGardes = faker.number.int({ min: 5, max: 10 });

    return { ...defaults, ...overrides };
}

// Génère un objet FatigueConfig complet, basé sur les valeurs par défaut
export function createFatigueConfig(overrides: Partial<FatigueConfig> = {}): FatigueConfig {
    const defaults: FatigueConfig = JSON.parse(JSON.stringify(defaultFatigueConfig));

    // Appliquer des modifications aléatoires ou spécifiques (exemple)
    // defaults.points.garde = faker.number.int({ min: 25, max: 40 });
    // defaults.seuils.critique = faker.number.int({ min: 70, max: 90 });

    // Gérer la fusion des objets imbriqués comme points, recovery, seuils
    const finalConfig = { ...defaults };
    if (overrides.points) {
        finalConfig.points = { ...defaults.points, ...overrides.points };
    }
    if (overrides.recovery) {
        finalConfig.recovery = { ...defaults.recovery, ...overrides.recovery };
    }
    if (overrides.seuils) {
        finalConfig.seuils = { ...defaults.seuils, ...overrides.seuils };
    }

    // Appliquer les autres overrides de premier niveau
    delete overrides.points;
    delete overrides.recovery;
    delete overrides.seuils;
    Object.assign(finalConfig, overrides);

    return finalConfig;
} 