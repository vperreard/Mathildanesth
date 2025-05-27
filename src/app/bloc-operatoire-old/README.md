# Module de Bloc Opératoire

## Vue d'ensemble

Le module de Bloc Opératoire permet de gérer les plannings des salles d'opération, les affectations des médecins anesthésistes, et d'appliquer des règles de supervision spécifiques au contexte hospitalier.

Ce module fait partie de la phase 4 du développement de Mathildanesth comme indiqué dans la roadmap (P2).

## Modèle du MVP

Dans cette version MVP, le planning gère uniquement des **vacations par demi-journées** (matin/après-midi) :
- Les vacations sont définies comme ouvertes ou fermées
- Chaque vacation peut être affectée à :
  - 1 chirurgien 
  - 1 MAR (Médecin Anesthésiste-Réanimateur)
  - +/- 1 IADE (Infirmier Anesthésiste)
- Les interventions chirurgicales détaillées ne sont pas gérées dans cette version

## Structure du module

Le module est organisé en plusieurs sections :

```
src/app/bloc-operatoire/
├── components/          # Composants réutilisables spécifiques au bloc
├── planning/            # Interfaces de planification du bloc
├── regles-supervision/  # Configuration des règles de supervision
├── salles/              # Gestion des salles d'opération
├── secteurs/            # Organisation des secteurs
├── page.tsx             # Page principale du module
└── README.md            # Documentation (ce fichier)
```

## Modèles de données

Les modèles de données pour ce module sont définis dans `src/types/bloc-planning-types.ts` et incluent :

- `OperatingRoom` : Définition d'une salle d'opération
- `BlocSector` : Groupement logique de salles (ex: chirurgie cardiaque, orthopédie)
- `SupervisionRule` : Règles gouvernant la supervision des salles par les médecins
- `BlocDayPlanning` : Planning journalier du bloc opératoire
- `BlocSupervisor` : Affectation d'un médecin à la supervision d'une salle

## Services

Le module utilise le service `blocPlanningService` (dans `src/services/blocPlanningService.ts`) qui fournit :

- Méthodes CRUD pour la gestion des salles et secteurs
- Validation des règles de supervision
- Intégration avec le module de planning général

## Règles de supervision

La configuration des règles de supervision permet de :

1. Définir un nombre maximum de salles par MAR (règle globale)
2. Créer des règles spécifiques par secteur (ex: supervision interne uniquement)
3. Établir des exceptions pour des situations particulières

Les règles sont évaluées par priorité et peuvent être configurées depuis l'interface d'administration.

## Prochaines évolutions

Les évolutions futures après le MVP pourront inclure :
- Gestion détaillée des interventions chirurgicales avec durée et équipe complète
- Planification des équipements spécifiques
- Intégration avec le système de gestion des patients
- Statistiques d'occupation et d'efficience

## Intégration avec d'autres modules

Le module de bloc opératoire s'intègre avec :

- **Module de planning** : Pour vérifier les disponibilités des médecins
- **Module de congés** : Pour prendre en compte les absences
- **Module de règles** : Pour appliquer les règles spécifiques à l'équipe

## Développement futur

Les fonctionnalités planifiées pour les phases ultérieures incluent :

- Intégration optionnelle avec Google Sheets (pour compatibilité avec systèmes existants)
- Trames hebdomadaires pour le bloc opératoire
- Règles de supervision avancées (basées sur les compétences, expérience, etc.)
- Simulation et optimisation des affectations
- Annotations et notes contextuelles
- Interface pour les chirurgiens

## Utilisation

Pour accéder au module : `/bloc-operatoire`

## Documentation technique

Pour plus de détails sur l'implémentation :
- Voir les types définis dans `src/types/bloc-planning-types.ts`
- Consulter le service `blocPlanningService` pour les opérations disponibles
- Se référer aux modèles de données existants dans `src/types/team-configuration.ts` (BlocConfig) 