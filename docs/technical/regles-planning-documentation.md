# Documentation des Règles de Planning - Mathildanesth

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du système de règles](#architecture-du-système-de-règles)
3. [Types de règles](#types-de-règles)
4. [Règles spécifiques](#règles-spécifiques)
5. [Système de compteurs](#système-de-compteurs)
6. [Gestion de la fatigue](#gestion-de-la-fatigue)
7. [Configuration et personnalisation](#configuration-et-personnalisation)

## Vue d'ensemble

### Objectif
Ce document décrit l'ensemble des règles de planification pour l'application Mathildanesth. Le système est conçu pour être adaptable à différentes équipes tout en répondant aux besoins spécifiques de notre équipe d'anesthésie.

### Principes fondamentaux
- **Adaptabilité** : Les règles sont paramétrables pour s'adapter à différentes équipes
- **Équité** : Distribution équitable des charges de travail et du temps de repos
- **Qualité de vie** : Prise en compte de la fatigue et des préférences personnelles
- **Flexibilité** : Gestion des cas particuliers et des exceptions

## Architecture du système de règles

### Structure en couches
1. **Règles universelles** : Incompatibilités fondamentales, structures de base
2. **Règles paramétrables** : Spécifiques à chaque équipe
3. **Règles personnalisables** : Préférences individuelles

### Hiérarchie des règles
1. **Règles absolues** : Repos de sécurité, congés validés
2. **Règles fortes** : Espacement minimal des gardes
3. **Règles préférentielles** : Préférences personnelles
4. **Règles d'optimisation** : Équité, qualité de vie

## Types de règles

### 1. Règles temporelles
- Espacement entre affectations
- Nombre maximum par période
- Repos obligatoire après certaines affectations

### 2. Règles d'équité
- Distribution équitable des gardes et astreintes
- Répartition des weekends et jours fériés
- Équilibrage des types d'affectations

### 3. Règles de supervision
- Nombre maximum de salles supervisées
- Règles spécifiques par secteur
- Contraintes géographiques

### 4. Règles de qualité de vie
- Gestion de la fatigue
- Préférences personnelles
- Incompatibilités personnelles

## Règles spécifiques

### Gardes et Astreintes
- **Espacement** : Idéalement 7 jours entre gardes (minimum 3 jours)
- **Maximum** : 3 gardes/30 jours (exceptionnellement 4)
- **Repos** : Le MAR de garde doit être OFF le lendemain
- **Structure** : Un médecin de garde + un d'astreinte par jour

### Consultations
- **Volume** : 2 consultations par semaine pour temps plein (proportionnel pour temps partiel)
- **Répartition** : Maximum 3 consultations/semaine, répartition 1-2 ou 2-1
- **Flexibilité** : Possibilité de fermer des créneaux

### Bloc Opératoire
- **Supervision** : Maximum 2 salles par MAR (exceptionnellement 3)
- **Règles par secteur** :
  - Salles 1-4 : supervision dans le même secteur
  - Salles 6-7 : peuvent superviser l'ophtalmologie
  - Salles 9-12B : supervision dans salles contiguës
  - Ophtalmologie : maximum 3 salles par personnel
  - Endoscopie : 2 salles par personnel

### Congés
- **Quota** : 50 jours pour temps plein, proportionnel pour temps partiel
- **Décompte** : Uniquement sur jours travaillés (lundi-vendredi, hors fériés)

### Incompatibilités
- **Garde/Repos de garde** : Incompatible avec toute autre affectation
- **Astreinte** : Compatible avec la plupart des affectations sauf garde

## Système de compteurs

### Compteurs principaux
```typescript
interface CompteurPersonnel {
  // Compteurs de base
  gardes: {
    total: number;
    weekends: number;
    feries: number;
    noel: number;
    historique: HistoriqueAffectation[];
  };
  
  // Compteurs d'heures
  heures: {
    theoriques: number;
    realisees: number;
    solde: number;
    congesDecomptes: number;
  };
  
  // Compteurs de charge
  charge: {
    supervisions: number;
    specialitesLourdes: number;
    pediatrie: number;
  };
}
```

### Gestion des nouveaux arrivants
- Option 1 : Décompte égal à la moyenne des autres MARs
- Option 2 : Période repart à zéro en gardant l'historique des autres

## Gestion de la fatigue

### Système de points de fatigue
```typescript
interface PointsFatigue {
  score: number;
  historique: HistoriqueFatigue[];
  seuilAlerte: number;
  seuilCritique: number;
  tauxRecuperation: number;
}
```

### Configuration des points
- **Garde** : +30 points
- **Astreinte** : +10 points
- **Supervision multiple** : +15 points
- **Pédiatrie** : +10 points
- **Jour OFF** : -20 points
- **Weekend OFF** : -30 points

### Équilibrage fatigue/équité
- Quota minimum/maximum de jours OFF par semaine
- Pondération entre fatigue et équité
- Garde-fous contre les situations extrêmes

## Gestion des urgences et imprévus

### Système de remplacement intelligent
```typescript
interface GestionUrgence {
  // Proposition automatique de modifications de planning
  proposerModifications(absence: Absence): {
    modifications: ModificationProposee[];
    impact: AnalyseImpact;
    score: number;
  };
  
  // Analyse des remplaçants disponibles
  analyserRemplacants(): {
    disponibles: Personnel[];
    contraintes: Contrainte[];
    recommendations: string[];
  };
  
  // Redistribution automatique des tâches
  redistribuerTaches(taches: Tache[]): {
    nouvellleDistribution: Distribution;
    alertes: Alerte[];
  };
}
```

### Machine Learning pour amélioration continue
```typescript
interface ApprentissageSysteme {
  // Apprentissage des modifications manuelles
  enregistrerModification(modification: {
    avant: Affectation;
    apres: Affectation;
    raison: string;
    utilisateur: string;
  }): void;
  
  // Analyse des patterns
  analyserPatterns(): {
    tendances: Tendance[];
    ajustementsRecommandes: AjustementRegle[];
  };
  
  // Feedback utilisateur
  collecterFeedback(planning: Planning): {
    satisfaction: number;
    commentaires: string[];
    problemes: string[];
  };
}
```

## Configuration et personnalisation

### Interface utilisateur avancée
```typescript
interface InterfaceUtilisateur {
  // Pour l'utilisateur standard
  utilisateurStandard: {
    preferences: {
      horaires: PreferencesHoraires;
      incompatibilites: Incompatibilites;
      feedback: InterfaceFeedback;
    };
  };
  
  // Pour l'administrateur
  administrateur: {
    gestionRegles: {
      creation: InterfaceCreationRegle;
      modification: InterfaceModificationRegle;
      visualisation: InterfaceVisualisationRegle;
    };
    
    generationPlanning: {
      parCouches: {
        gardes: EtapeGeneration;
        consultations: EtapeGeneration;
        bloc: EtapeGeneration;
      };
      validation: {
        commentaires: CommentaireGeneration[];
        alertes: AlerteVisuelle[];
        metriques: MetriqueGeneration;
      };
      visualisation: {
        codeCouleur: {
          normal: string;          // Vert
          attention: string;       // Orange
          critique: string;        // Rouge
        };
        indicateurs: {
          supervisionExcessive: boolean;
        };
        repetitionSpecialite: boolean;
        surchargeConsultation: boolean;
        };
      };
    };
  };
}
```

### Accessibilité
- Conformité WCAG 2.1 AA (contraste, navigation clavier, lecteurs d'écran)
- Tailles de texte ajustables
- Alternatives textuelles pour les codes couleur
- Navigation simplifiée

### Préférences personnelles
```typescript
interface PreferencesPersonnelles {
  matinPreferee: boolean;
  apresmidiPreferee: boolean;
  journeeComplete: boolean;
  
  incompatibilites: {
    personnel: string[];
    specialites: string[];
    chirurgiens: string[];
  };
  
  affinites: {
    personnel: { id: string; niveau: NiveauAffinite }[];
    specialites: { id: string; niveau: NiveauAffinite }[];
  };
}

type NiveauAffinite = 'jamais' | 'exceptionnellement' | 'neutre' | 'apprecie';
```

### Règles spécifiques

#### IADE
- Toujours affecté si présent
- Système de "volant" : un par semaine avec planning modifiable
- Éviter de faire venir un volant uniquement pour l'après-midi

#### Remplaçants
- Restrictions spécifiques possibles (postes/spécialités exclus)
- Configuration personnalisée par remplaçant

#### Affectations pré-définies
- Possibilité de verrouiller certaines affectations
- Validation requise avant verrouillage
- Non modifiable après génération du planning

### Optimisation du temps OFF
- Priorité à la maximisation du temps OFF
- Distribution équitable selon la quotité de travail
- Prise en compte des congés dans la priorité

## Intégration externe

### API standardisée
```typescript
interface APIExterne {
  // Endpoints REST pour intégration
  endpoints: {
    planning: {
      get: '/api/v1/planning/{date}';
      post: '/api/v1/planning/generate';
      put: '/api/v1/planning/{id}';
    };
    personnel: {
      get: '/api/v1/personnel';
      post: '/api/v1/personnel/preferences';
    };
    regles: {
      get: '/api/v1/rules';
      post: '/api/v1/rules';
    };
  };
  
  // Webhooks pour notifications
  webhooks: {
    onPlanningChange: WebhookConfig;
    onAbsenceDeclaree: WebhookConfig;
    onRegleModifiee: WebhookConfig;
  };
}
```

## Optimisation des performances

### Cache intelligent
```typescript
interface SystemeCache {
  // Cache des calculs récurrents
  cacheCalculs: {
    scoreEquite: CacheStrategy;
    pointsFatigue: CacheStrategy;
    disponibilites: CacheStrategy;
  };
  
  // Invalidation sélective
  invalidation: {
    surModification: boolean;
    periodique: number; // minutes
    selective: boolean;
  };
}
```

### Calcul incrémental
```typescript
interface CalculIncremental {
  // Ne recalculer que les changements
  miseAJourSelective(modification: Modification): {
    elementsAffectes: string[];
    nouveauxCalculs: Calcul[];
  };
  
  // Optimisation des requêtes
  optimiserRequetes(): {
    indexes: IndexOptimise[];
    partitions: PartitionStrategy;
  };
}
```

## Base de données optimisée

### TimescaleDB pour historique
```typescript
interface ConfigurationBDD {
  // Extension TimescaleDB pour données temporelles
  timescale: {
    actif: boolean;
    tables: {
      historique_affectations: boolean;
      metriques_fatigue: boolean;
      logs_modifications: boolean;
    };
  };
  
  // Partitionnement des données
  partitionnement: {
    parAnnee: boolean;
    parType: boolean;
    retention: number; // mois
  };
}
```

## Mise en œuvre technique

### Interface de configuration
```typescript
interface ConfigurationRegle {
  id: string;
  type: TypeRegle;
  priorite: number;
  actif: boolean;
  parametres: {
    [key: string]: any;
  };
  conditions: ConditionRegle[];
}
```

### Système de validation
- Vérification des conflits entre règles
- Alertes pour situations exceptionnelles
- Journal des dérogations

### Outils statistiques
- Visualisation des compteurs
- Comparaison inter-périodes
- Suivi des fêtes de fin d'année
- Analyse de l'équité

## Notes importantes

1. **Adaptabilité** : Toutes les valeurs numériques (jours, points, etc.) sont paramétrables
2. **Exceptions** : Un système de dérogation permet de gérer les cas particuliers
3. **Historique** : Toutes les modifications sont tracées pour audit
4. **Évolutivité** : L'architecture permet l'ajout de nouvelles règles sans refonte

Cette documentation sera mise à jour régulièrement pour refléter les évolutions du système de règles.
