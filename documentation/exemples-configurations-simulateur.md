# Exemples de Configurations pour le Simulateur de Planning

Ce document fournit des exemples concrets de configurations du simulateur de planning pour différents scénarios. Utilisez ces exemples comme base pour vos propres configurations.

## 1. Configurations pour Différentes Périodes de l'Année

### Période Standard (Activité Normale)

```json
{
  "dateDebut": "2023-03-01",
  "dateFin": "2023-05-31",
  "etapesActives": ["GARDE", "ASTREINTE", "CONSULTATION", "BLOC"],
  "conserverAffectationsExistantes": true,
  "niveauOptimisation": "standard",
  "appliquerPreferencesPersonnelles": true,
  "poidsEquite": 0.6,
  "poidsPreference": 0.5,
  "poidsQualiteVie": 0.5,
  "reglesConfiguration": {
    "intervalle": {
      "minJoursEntreGardes": 7,
      "minJoursRecommandes": 21,
      "maxGardesMois": 3
    },
    "equite": {
      "poidsGardesWeekend": 1.5,
      "poidsGardesFeries": 2.0,
      "equilibrageSpecialites": true
    }
  }
}
```

### Période Estivale (Vacances d'Été)

```json
{
  "dateDebut": "2023-07-01",
  "dateFin": "2023-08-31",
  "etapesActives": ["GARDE", "ASTREINTE", "CONSULTATION", "BLOC"],
  "conserverAffectationsExistantes": true,
  "niveauOptimisation": "approfondi",
  "appliquerPreferencesPersonnelles": true,
  "poidsEquite": 0.4,
  "poidsPreference": 0.8,
  "poidsQualiteVie": 0.6,
  "reglesConfiguration": {
    "intervalle": {
      "minJoursEntreGardes": 5,
      "minJoursRecommandes": 15,
      "maxGardesMois": 4
    },
    "equite": {
      "poidsGardesWeekend": 2.0,
      "poidsGardesFeries": 2.5,
      "equilibrageSpecialites": true
    }
  }
}
```

### Période des Fêtes (Décembre-Janvier)

```json
{
  "dateDebut": "2023-12-01",
  "dateFin": "2024-01-15",
  "etapesActives": ["GARDE", "ASTREINTE", "CONSULTATION", "BLOC"],
  "conserverAffectationsExistantes": true,
  "niveauOptimisation": "approfondi",
  "appliquerPreferencesPersonnelles": true,
  "poidsEquite": 0.3,
  "poidsPreference": 0.9,
  "poidsQualiteVie": 0.7,
  "reglesConfiguration": {
    "intervalle": {
      "minJoursEntreGardes": 6,
      "minJoursRecommandes": 15,
      "maxGardesMois": 3
    },
    "equite": {
      "poidsGardesWeekend": 2.0,
      "poidsGardesFeries": 3.0,
      "equilibrageSpecialites": true
    },
    "qualiteVie": {
      "poidsPreferences": 0.9,
      "eviterConsecutifs": true
    }
  },
  "fatigueConfig": {
    "points": {
      "garde": 40,
      "astreinte": 15,
      "jour": -25,
      "weekend": -40
    }
  }
}
```

## 2. Configurations pour Différentes Tailles d'Équipe

### Petite Équipe (< 10 personnes)

```json
{
  "dateDebut": "2023-04-01",
  "dateFin": "2023-06-30",
  "etapesActives": ["GARDE", "ASTREINTE", "CONSULTATION", "BLOC"],
  "conserverAffectationsExistantes": true,
  "niveauOptimisation": "approfondi",
  "appliquerPreferencesPersonnelles": true,
  "poidsEquite": 0.7,
  "poidsPreference": 0.6,
  "poidsQualiteVie": 0.8,
  "reglesConfiguration": {
    "intervalle": {
      "minJoursEntreGardes": 5,
      "minJoursRecommandes": 14,
      "maxGardesMois": 4
    },
    "equite": {
      "poidsGardesWeekend": 1.8,
      "poidsGardesFeries": 2.2
    },
    "qualiteVie": {
      "eviterConsecutifs": true,
      "recuperationApresGardeNuit": true
    }
  },
  "fatigueConfig": {
    "points": {
      "garde": 45,
      "astreinte": 20
    },
    "tauxRecuperation": 10
  }
}
```

### Grande Équipe (> 20 personnes)

```json
{
  "dateDebut": "2023-04-01",
  "dateFin": "2023-06-30",
  "etapesActives": ["GARDE", "ASTREINTE", "CONSULTATION", "BLOC"],
  "conserverAffectationsExistantes": true,
  "niveauOptimisation": "standard",
  "appliquerPreferencesPersonnelles": true,
  "poidsEquite": 0.8,
  "poidsPreference": 0.5,
  "poidsQualiteVie": 0.5,
  "reglesConfiguration": {
    "intervalle": {
      "minJoursEntreGardes": 10,
      "minJoursRecommandes": 28,
      "maxGardesMois": 2
    },
    "equite": {
      "poidsGardesWeekend": 1.5,
      "poidsGardesFeries": 2.0,
      "equilibrageSpecialites": true
    }
  }
}
```

## 3. Configurations pour Situations Spécifiques

### Période de Forte Activité Opératoire

```json
{
  "dateDebut": "2023-03-01",
  "dateFin": "2023-04-30",
  "etapesActives": ["GARDE", "ASTREINTE", "BLOC"],
  "conserverAffectationsExistantes": true,
  "niveauOptimisation": "approfondi",
  "appliquerPreferencesPersonnelles": true,
  "poidsEquite": 0.5,
  "poidsPreference": 0.4,
  "poidsQualiteVie": 0.7,
  "reglesConfiguration": {
    "supervision": {
      "maxSallesParMAR": {
        "Hyperaseptique": 2,
        "Secteur5-8": 3, 
        "Secteur9-12B": 3,
        "Ophtalmo": 3,
        "Endo": 2
      },
      "maxSallesExceptionnel": 4
    },
    "qualiteVie": {
      "eviterConsecutifs": true,
      "recuperationApresGardeNuit": true
    }
  },
  "fatigueConfig": {
    "points": {
      "garde": 40,
      "astreinte": 15,
      "supervisionMultiple": 20
    },
    "tauxRecuperation": 12
  }
}
```

### Gestion d'une Période avec Personnel Réduit

```json
{
  "dateDebut": "2023-08-01",
  "dateFin": "2023-08-31",
  "etapesActives": ["GARDE", "ASTREINTE", "CONSULTATION", "BLOC"],
  "conserverAffectationsExistantes": true,
  "niveauOptimisation": "approfondi",
  "appliquerPreferencesPersonnelles": false,
  "poidsEquite": 0.4,
  "poidsPreference": 0.3,
  "poidsQualiteVie": 0.9,
  "reglesConfiguration": {
    "intervalle": {
      "minJoursEntreGardes": 4,
      "minJoursRecommandes": 10,
      "maxGardesMois": 5
    },
    "supervision": {
      "maxSallesParMAR": {
        "Hyperaseptique": 3,
        "Secteur5-8": 4, 
        "Secteur9-12B": 4,
        "Ophtalmo": 4,
        "Endo": 3
      },
      "maxSallesExceptionnel": 5
    },
    "qualiteVie": {
      "recuperationApresGardeNuit": true
    }
  },
  "fatigueConfig": {
    "points": {
      "garde": 40,
      "astreinte": 15,
      "supervisionMultiple": 15,
      "pediatrie": 10
    },
    "tauxRecuperation": 15
  }
}
```

### Planning Progressif pour Nouveaux Membres

```json
{
  "dateDebut": "2023-05-01",
  "dateFin": "2023-07-31",
  "etapesActives": ["GARDE", "ASTREINTE", "CONSULTATION", "BLOC"],
  "conserverAffectationsExistantes": true,
  "niveauOptimisation": "standard",
  "appliquerPreferencesPersonnelles": true,
  "poidsEquite": 0.5,
  "poidsPreference": 0.6,
  "poidsQualiteVie": 0.7,
  "reglesConfiguration": {
    "intervalle": {
      "minJoursEntreGardes": 10,
      "minJoursRecommandes": 21,
      "maxGardesMois": 2
    },
    "qualiteVie": {
      "eviterConsecutifs": true,
      "recuperationApresGardeNuit": true
    }
  },
  "reglesSpeciales": {
    "nouveauxMembres": {
      "actif": true,
      "progressionGardeMois1": 1,
      "progressionGardeMois2": 2,
      "progressionGardeMois3": 3,
      "supervisonObligatoire": true
    }
  }
}
```

## 4. Configurations pour Optimiser des Métriques Spécifiques

### Optimisation du Score d'Équité

```json
{
  "dateDebut": "2023-06-01",
  "dateFin": "2023-08-31",
  "etapesActives": ["GARDE", "ASTREINTE", "CONSULTATION", "BLOC"],
  "conserverAffectationsExistantes": true,
  "niveauOptimisation": "approfondi",
  "appliquerPreferencesPersonnelles": true,
  "poidsEquite": 0.9,
  "poidsPreference": 0.3,
  "poidsQualiteVie": 0.4,
  "reglesConfiguration": {
    "equite": {
      "poidsGardesWeekend": 2.0,
      "poidsGardesFeries": 2.5,
      "equilibrageSpecialites": true
    },
    "qualiteVie": {
      "poidsPreferences": 0.3
    }
  },
  "optimisationSpeciale": {
    "reequilibrageForce": true,
    "prioriteEquite": true
  }
}
```

### Optimisation du Score de Fatigue

```json
{
  "dateDebut": "2023-05-01",
  "dateFin": "2023-07-31",
  "etapesActives": ["GARDE", "ASTREINTE", "CONSULTATION", "BLOC"],
  "conserverAffectationsExistantes": true,
  "niveauOptimisation": "approfondi",
  "appliquerPreferencesPersonnelles": true,
  "poidsEquite": 0.3,
  "poidsPreference": 0.4,
  "poidsQualiteVie": 0.9,
  "reglesConfiguration": {
    "intervalle": {
      "minJoursEntreGardes": 14,
      "minJoursRecommandes": 28,
      "maxGardesMois": 2
    },
    "qualiteVie": {
      "eviterConsecutifs": true,
      "recuperationApresGardeNuit": true
    }
  },
  "fatigueConfig": {
    "points": {
      "garde": 45,
      "astreinte": 20,
      "supervisionMultiple": 25,
      "pediatrie": 15,
      "jour": -30,
      "weekend": -45
    },
    "tauxRecuperation": 15,
    "seuilAlerte": 70,
    "seuilCritique": 90
  },
  "optimisationSpeciale": {
    "maximiserRecuperation": true,
    "minimiserFatigue": true
  }
}
```

### Optimisation du Score de Satisfaction

```json
{
  "dateDebut": "2023-12-01",
  "dateFin": "2024-01-31",
  "etapesActives": ["GARDE", "ASTREINTE", "CONSULTATION", "BLOC"],
  "conserverAffectationsExistantes": true,
  "niveauOptimisation": "approfondi",
  "appliquerPreferencesPersonnelles": true,
  "poidsEquite": 0.2,
  "poidsPreference": 0.9,
  "poidsQualiteVie": 0.6,
  "reglesConfiguration": {
    "qualiteVie": {
      "poidsPreferences": 0.9,
      "eviterConsecutifs": true
    }
  },
  "optimisationSpeciale": {
    "prioritePreferences": true,
    "respecterAffinites": true
  }
}
```

## 5. Guide d'Ajustement des Paramètres

### Comment Ajuster les Poids d'Équité, Préférences et Qualité de Vie

Pour obtenir le meilleur équilibre entre ces trois critères, suivez ces recommandations :

1. **Équité** (poidsEquite) :
   - Augmentez pour une répartition plus égale des gardes
   - Diminuez si d'autres critères sont plus importants
   - Valeurs typiques : 0.4 à 0.8

2. **Préférences** (poidsPreference) :
   - Augmentez pour respecter davantage les souhaits personnels
   - Diminuez si l'équité ou la qualité de vie sont prioritaires
   - Valeurs typiques : 0.3 à 0.9

3. **Qualité de vie** (poidsQualiteVie) :
   - Augmentez pour réduire la fatigue et optimiser les temps de repos
   - Diminuez si d'autres contraintes sont plus importantes
   - Valeurs typiques : 0.4 à 0.9

### Conseils d'Ajustement pour les Règles d'Intervalle

1. **Jours minimum entre gardes** (minJoursEntreGardes) :
   - Standard : 7 jours
   - Équipe réduite : 4-5 jours
   - Équipe importante : 10 jours ou plus

2. **Espacement optimal** (minJoursRecommandes) :
   - Standard : 21 jours
   - Équipe réduite : 14-17 jours
   - Équipe importante : 28 jours ou plus

3. **Maximum de gardes par mois** (maxGardesMois) :
   - Standard : 3 gardes
   - Équipe réduite : 4-5 gardes
   - Équipe importante : 1-2 gardes

### Ajustement des Points de Fatigue

1. **Points de garde** (garde) :
   - Standard : 40 points
   - Gardes difficiles : 45-50 points
   - Gardes légères : 30-35 points

2. **Points d'astreinte** (astreinte) :
   - Standard : 15 points
   - Astreintes actives : 20-25 points
   - Astreintes calmes : 10 points

3. **Taux de récupération** (tauxRecuperation) :
   - Standard : 12 points/jour
   - Récupération rapide : 15-20 points/jour
   - Récupération lente : 8-10 points/jour 