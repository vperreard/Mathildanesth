# Configuration des règles - Équipe d'anesthésie

## Configuration spécifique pour notre équipe

### 1. Paramètres de base

```typescript
const equipeAnesthesieConfig = {
  // Informations de l'équipe
  equipe: {
    nom: "Anesthésie - Hôpital XYZ",
    effectifs: {
      mars: 16,
      iades: 9
    }
  },

  // Configuration des gardes
  gardes: {
    structure: {
      parJour: {
        garde: 1,
        astreinte: 1
      }
    },
    regles: {
      espacementMinimum: 3,        // jours
      espacementIdeal: 7,          // jours
      maxParMois: 3,              // gardes/mois
      maxExceptionnel: 4,         // gardes/mois en situation exceptionnelle
      reposApresGarde: {
        obligatoire: true,
        duree: 24                 // heures
      },
      incompatibilites: [
        "CONSULTATION",
        "BLOC",
        "ASTREINTE"
      ]
    },
    distribution: {
      weekends: {
        poids: 1.5,               // Coefficient multiplicateur
        rotationAnnuelle: true
      },
      joursFeries: {
        poids: 2.0,
        compteSepare: true
      },
      feteFinAnnee: {
        gestionManuelle: true,
        suivi: true
      }
    }
  },

  // Configuration des consultations
  consultations: {
    volume: {
      tempsPlein: 2,              // par semaine
      proportionnelTempsPartiel: true
    },
    limites: {
      maxParSemaine: 3,
      repartitionMaximale: "2-1"  // matin-après-midi
    },
    flexibilite: {
      fermeturePeriodes: true,
      generationPartielle: true
    }
  },

  // Configuration du bloc opératoire
  bloc: {
    salles: {
      chirurgie: {
        nombre: 13,
        numeros: ["1", "2", "3", "4", "5", "6", "7", "9", "10", "11", "12", "12bis"]
      },
      cesarienne: {
        nombre: 1,
        numeros: ["8"]
      },
      ophtalmologie: {
        nombre: 4,
        numeros: ["Ophta 1", "Ophta 2", "Ophta 3", "Ophta 4"]
      },
      endoscopie: {
        nombre: 4,
        numeros: ["Endo 1", "Endo 2", "Endo 3", "Endo 4"]
      }
    },
    supervision: {
      reglesBase: {
        maxSallesParMAR: 2,
        maxExceptionnel: 3
      },
      reglesParSecteur: {
        "HYPERASEPTIQUE": {
          salles: ["1", "2", "3", "4"],
          supervisionInterne: true,
          exceptions: ["MAR_S3_S4_VERS_S5"]
        },
        "SECTEUR_5_8": {
          salles: ["5", "6", "7", "8"],
          supervisionCroisee: ["OPHTALMO"]
        },
        "SECTEUR_9_12B": {
          salles: ["9", "10", "11", "12", "12bis"],
          supervisionContigues: true
        },
        "OPHTALMO": {
          maxParPersonnel: 3,
          supervisionDepuis: ["S6", "S7"]
        },
        "ENDOSCOPIE": {
          maxParPersonnel: 2,
          supervisionDepuis: ["S10", "S11", "S12B"]
        }
      }
    }
  },

  // Configuration des congés
  conges: {
    quotas: {
      tempsPlein: 50,             // jours/an
      proportionnelTempsPartiel: true
    },
    decompte: {
      joursOuvrables: true,       // lundi-vendredi
      exclusFeries: true
    },
    validation: {
      workflow: "SIMPLE",         // ou "MULTI_NIVEAUX"
      delaiMinimum: 30           // jours avant
    },
    restrictions: {
      periodePic: {
        ete: {
          maxSimultane: 3,
          priorite: "ANCIENNETE"
        },
        noel: {
          maxSimultane: 2,
          priorite: "ROTATION"
        }
      }
    }
  },

  // Configuration du système de fatigue
  fatigue: {
    actif: true,
    points: {
      affectations: {
        garde: 30,
        astreinte: 10,
        supervisionMultiple: 15,   // 3+ salles
        pediatrie: 10,
        specialiteLourde: 8
      },
      recuperation: {
        jourOff: 20,
        weekend: 30,
        demiJourneeOff: 10
      }
    },
    seuils: {
      alerte: 80,
      critique: 120
    },
    equilibrage: {
      poidsEquite: 0.6,
      poidsFatigue: 0.4
    }
  },

  // Configuration des temps partiels
  tempsPartiel: {
    proportionnalite: {
      gardes: true,
      astreintes: true,
      consultations: true,
      conges: true
    },
    arrondi: "INFERIEUR"         // ou "SUPERIEUR", "PROCHE"
  },

  // Configuration des IADEs
  iades: {
    regleBase: {
      toujoursAffecte: true,
      absenceExceptionnelle: true
    },
    volant: {
      nombre: 1,                  // par semaine
      regles: {
        flexibiliteJours: true,
        eviterApresmidiUnique: true,
        propositionModifications: true
      }
    }
  },

  // Configuration des remplaçants
  remplacants: {
    gestion: {
      pool: true,
      restrictionsParDefaut: []
    },
    reglesSpecifiques: {
      possibles: true,
      validation: "ADMIN"
    }
  },

  // Configuration des préférences personnelles
  preferences: {
    types: {
      horaires: {
        matinPreference: true,
        apresmidiPreference: true,
        journeeComplete: true
      },
      incompatibilites: {
        personnel: true,
        specialites: true,
        chirurgiens: true
      },
      affinites: {
        niveaux: ["JAMAIS", "EXCEPTIONNELLEMENT", "NEUTRE", "APPRECIE"]
      }
    },
    priorite: "MOYENNE"          // dans l'algorithme
  },

  // Configuration des statistiques
  statistiques: {
    periodes: {
      court: "MOIS",
      moyen: "TRIMESTRE",
      long: "ANNEE"
    },
    indicateurs: {
      equite: {
        gardes: true,
        weekends: true,
        feries: true,
        fetes: true,
        heures: true
      },
      charge: {
        fatigue: true,
        supervisions: true,
        specialites: true
      },
      qualiteVie: {
        offConsecutifs: true,
        weekendsLibres: true,
        variabiliteHoraires: true
      }
    },
    export: {
      formats: ["PDF", "EXCEL", "JSON"],
      periodicite: "MENSUELLE"
    }
  },

  // Configuration des horaires
  horaires: {
    journeeTravail: {
      standard: {
        debut: "08:00",
        fin: "18:30"
      },
      demiJournee: {
        matin: {
          debut: "08:00",
          fin: "13:00"
        },
        apresmidi: {
          debut: "13:00",
          fin: "18:30"
        }
      }
    },
    decompte: {
      precision: 0.5,            // en heures
      arrondi: "QUART_HEURE"
    },
    compteurs: {
      avanceRetard: true,
      integrationConges: true,
      reportAnnuel: true
    }
  },

  // Configuration des affectations pré-définies
  affectationsPreDefinies: {
    actif: true,
    types: [
      "CONSULTATION_FIXE",
      "CHIRURGIEN_ATTRIBUE",
      "BLOC_RESERVE"
    ],
    validation: {
      requise: true,
      niveauValidation: "ADMIN"
    },
    verrouillage: {
      apresValidation: true,
      modificationExceptionnelle: "ADMIN_TOTAL"
    }
  },

  // Configuration des transitions
  transitions: {
    secteurs: {
      eviterChangementJournee: true,
      maxChangementsSemaine: 3
    },
    continuite: {
      chirurgien: {
        favoriser: true,
        maxJoursConsecutifs: 5
      },
      secteur: {
        dureeMinimum: 2,        // jours
        dureeMaximum: 10        // jours
      }
    },
    passation: {
      chevauchement: true,
      duree: 15                 // minutes
    }
  },

  // Configuration de l'équité
  equite: {
    calcul: {
      periodeReference: "TRIMESTRE",
      historique: true
    },
    nouveauxArrivants: {
      methode: "MOYENNE_EQUIPE", // ou "ZERO_AVEC_HISTORIQUE"
      periodeAdaptation: 1       // mois
    },
    distribution: {
      joursOff: {
        quotaMinimum: 0.5,      // demi-journées/semaine
        quotaMaximum: 2.0
      },
      priorites: {
        congesRecents: -0.2,    // malus
        retardHeures: -0.3,     // malus
        avanceHeures: 0.2       // bonus
      }
    }
  },

  // Configuration des alertes
  alertes: {
    types: {
      situationsExceptionnelles: true,
      depassementQuotas: true,
      fatigueCritique: true,
      conflitsRegles: true
    },
    niveaux: {
      information: "VERT",
      attention: "ORANGE",
      critique: "ROUGE"
    },
    destinataires: {
      admin: ["CRITIQUE", "ATTENTION"],
      utilisateur: ["TOUS"]
    }
  },

  // Configuration de l'algorithme
  algorithme: {
    priorites: {
      gardes: 1,
      astreintes: 2,
      consultations: 3,
      bloc: 4
    },
    optimisation: {
      iterations: 1000,
      convergence: 0.01
    },
    resolution: {
      conflits: "PRIORITE",      // ou "COMPROMIS"
      exceptions: {
        autorisees: true,
        validation: "ADMIN"
      }
    }
  },

  // Configuration des rapports
  rapports: {
    types: [
      "PLANNING_MENSUEL",
      "STATISTIQUES_INDIVIDUELLES",
      "EQUILIBRE_EQUIPE",
      "EXCEPTIONS_DEROGATIONS"
    ],
    automatiques: {
      planning: {
        generation: "VALIDATION",
        distribution: "EMAIL"
      },
      statistiques: {
        periodicite: "MENSUELLE",
        destinataires: ["ADMIN", "MARS"]
      }
    }
  },

  // Configuration de l'audit
  audit: {
    actif: true,
    elements: [
      "MODIFICATIONS_PLANNING",
      "DEROGATIONS_REGLES",
      "VALIDATIONS_CONGES",
      "CHANGEMENTS_CONFIGURATION"
    ],
    retention: 24,              // mois
    export: true
  }
};

// Export de la configuration
export default equipeAnesthesieConfig;
```

## Utilisation de la configuration

### 1. Chargement initial

```typescript
import equipeAnesthesieConfig from './config/equipe-anesthesie';

// Initialisation de l'application avec la configuration
const app = new PlanningApplication(equipeAnesthesieConfig);
```

### 2. Modification dynamique

```typescript
// Exemple de modification d'une règle
app.updateConfiguration('gardes.regles.maxParMois', 4);

// Exemple d'ajout d'une règle personnalisée
app.addCustomRule({
  type: 'PREFERENCE',
  name: 'Pas de garde le mercredi',
  user: 'dr-martin',
  condition: {
    dayOfWeek: 3,
    assignment: 'GARDE'
  },
  priority: 'HIGH'
});
```

### 3. Export/Import de configuration

```typescript
// Exporter la configuration actuelle
const configExport = app.exportConfiguration();
saveToFile('config-backup.json', configExport);

// Importer une configuration
const configImport = loadFromFile('config-template.json');
app.importConfiguration(configImport);
```

## Personnalisation par équipe

### Template de base

```typescript
// Template pour une nouvelle équipe
const newTeamTemplate = {
  ...defaultConfiguration,
  equipe: {
    nom: "Nouvelle équipe",
    effectifs: {
      mars: 0,
      iades: 0
    }
  }
};
```

### Assistant de configuration

```typescript
// Interface pour configurer une nouvelle équipe
interface ConfigurationWizard {
  step1_teamInfo(): TeamInfo;
  step2_dutyRules(): DutyRules;
  step3_consultationRules(): ConsultationRules;
  step4_blockRules(): BlockRules;
  step5_fatigueSystem(): FatigueConfig;
  step6_preferences(): PreferencesConfig;
  
  generateConfiguration(): TeamConfiguration;
}
```

## Maintenance et évolution

### 1. Versioning de la configuration

```typescript
const configVersion = {
  version: "1.0.0",
  lastUpdated: "2025-04-27",
  compatibility: ">=1.0.0"
};
```

### 2. Migration des configurations

```typescript
// Outil de migration entre versions
class ConfigurationMigrator {
  migrate(oldConfig: any, fromVersion: string, toVersion: string): any {
    // Logique de migration
  }
}
```

### 3. Validation de la configuration

```typescript
// Validation de la cohérence
class ConfigurationValidator {
  validate(config: TeamConfiguration): ValidationResult {
    const errors = [];
    const warnings = [];
    
    // Vérifications diverses
    if (config.gardes.regles.maxParMois < 1) {
      errors.push("Le maximum de gardes par mois doit être >= 1");
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  }
}
```
