# Système de Recommandation Automatique pour les Conflits de Congés

## Vue d'ensemble

Le système de recommandation automatique pour la résolution des conflits de congés est une extension du système existant de détection des conflits. Il analyse les conflits détectés, propose des stratégies de résolution adaptées et peut appliquer automatiquement les résolutions pour les cas simples, réduisant ainsi la charge de travail des gestionnaires.

## Architecture

Le système se compose des éléments suivants :

1. **Types de données** (`src/modules/leaves/types/recommendation.ts`)
   - Définition des priorités, stratégies et règles de résolution
   - Interfaces pour les recommandations et les résultats d'analyse

2. **Service de recommandation** (`src/modules/leaves/services/conflictRecommendationService.ts`)
   - Analyse des conflits et génération de recommandations
   - Détermination des priorités et stratégies adaptées
   - Gestion des règles de résolution automatique

3. **Hook React** (`src/modules/leaves/hooks/useConflictRecommendation.ts`)
   - Extension du hook `useConflictDetection` existant
   - Gestion de l'état des recommandations
   - Interface pour appliquer ou rejeter les recommandations

4. **Composants UI** 
   - `LeaveConflictRecommendation.tsx` : Affichage d'une recommandation spécifique
   - `LeaveConflictRecommendationList.tsx` : Liste des recommandations avec actions groupées

5. **Bus d'événements** (`src/services/eventBusService.ts`)
   - Communication entre les différents composants du système
   - Pattern Singleton et Observer pour la gestion des événements

## Fonctionnement

### Détection et Analyse des Conflits

1. Lorsqu'un utilisateur sélectionne une période de congé, le hook `useConflictRecommendation` utilise le système de détection de conflits existant pour identifier les potentiels problèmes.
2. Pour chaque conflit détecté, le service `ConflictRecommendationService` est sollicité pour analyser et générer des recommandations.
3. L'analyse prend en compte :
   - Le type et la sévérité du conflit
   - Le rôle de l'utilisateur demandeur
   - Les périodes spéciales (haute priorité)
   - Les règles spécifiques par département

### Génération des Recommandations

Pour chaque conflit, le système :

1. Détermine une priorité de résolution (de TRÈS BASSE à TRÈS HAUTE)
2. Génère plusieurs stratégies de résolution adaptées au type de conflit
3. Évalue la confiance de chaque stratégie (pourcentage)
4. Détermine si le conflit peut être résolu automatiquement
5. Fournit une explication détaillée pour aider à la décision

### Types de Stratégies Supportées

- `APPROVE` : Approuver malgré le conflit
- `REJECT` : Rejeter la demande
- `RESCHEDULE_BEFORE` : Reprogrammer avant la période demandée
- `RESCHEDULE_AFTER` : Reprogrammer après la période demandée
- `SHORTEN` : Raccourcir la période de congé
- `SPLIT` : Diviser la période en plusieurs congés
- `SWAP` : Échanger avec un autre congé
- `REASSIGN` : Réassigner des responsabilités
- `MANUAL` : Résolution manuelle requise

### Résolution Automatique

Le système peut résoudre automatiquement certains conflits en fonction de règles configurables :

1. Seuil de confiance minimal (par défaut 80%)
2. Sévérité maximale (par défaut AVERTISSEMENT)
3. Stratégies autorisées pour l'auto-résolution

Les résolutions automatiques sont toujours visibles et peuvent être annulées par un gestionnaire.

### Interface Utilisateur

L'interface utilisateur présente :

1. Une liste des conflits regroupés par priorité
2. Des options détaillées pour chaque conflit
3. Des boutons d'action pour appliquer ou rejeter les recommandations
4. Un bouton pour appliquer toutes les résolutions automatiques
5. Des explications et visualisations pour aider à la décision

## Configuration et Personnalisation

Le système est hautement configurable via des règles de résolution :

```typescript
// Exemple de configuration
service.configure({
    rules: {
        priorityRules: {
            // Règles de priorité par type et sévérité
            [ConflictType.TEAM_ABSENCE]: {
                [ConflictSeverity.BLOQUANT]: ConflictPriority.VERY_HIGH
            }
        },
        userRolePriorities: {
            // Priorités par rôle utilisateur
            'CHEF_SERVICE': ConflictPriority.VERY_HIGH
        },
        preferredStrategies: {
            // Stratégies préférées par type de conflit
            [ConflictType.USER_LEAVE_OVERLAP]: [
                ResolutionStrategy.RESCHEDULE_BEFORE,
                ResolutionStrategy.RESCHEDULE_AFTER
            ]
        },
        autoResolutionThresholds: {
            // Paramètres pour la résolution automatique
            minConfidence: 80,
            maxSeverity: ConflictSeverity.AVERTISSEMENT,
            enabledStrategies: [
                ResolutionStrategy.APPROVE,
                ResolutionStrategy.RESCHEDULE_AFTER
            ]
        },
        specialPeriods: [
            // Périodes spéciales avec priorités modifiées
            {
                name: "Vacances d'été",
                startDate: "2025-07-01",
                endDate: "2025-08-31",
                priorityModifier: 1 // Augmente la priorité
            }
        ]
    }
});
```

## Communication par Événements

Le système utilise le pattern Observer via `EventBusService` pour communiquer entre ses composants :

- `conflict.recommendations.updated` : Nouvelles recommandations disponibles
- `conflict.resolved` : Un conflit a été résolu
- `conflict.recommendation.rejected` : Une recommandation a été rejetée

## Apprentissage et Amélioration Continue

Le service de recommandation peut apprendre des résolutions passées pour améliorer les futures recommandations :

1. Stockage de l'historique des résolutions
2. Ajustement des niveaux de confiance basé sur les choix précédents
3. Adaptation des stratégies préférées selon leur taux de succès

## Extension

Pour ajouter de nouvelles stratégies de résolution :

1. Ajouter la nouvelle stratégie dans l'enum `ResolutionStrategy`
2. Implémenter la logique de génération dans `generateResolutionStrategies()`
3. Mettre à jour l'interface utilisateur pour prendre en charge la nouvelle stratégie

## Bonnes Pratiques d'Utilisation

- Configurer les règles selon les besoins spécifiques de l'organisation
- Commencer avec des seuils d'auto-résolution conservateurs
- Réviser régulièrement les règles en fonction des retours utilisateurs
- Utiliser la fonction d'apprentissage pour améliorer progressivement les recommandations

## Tests

Le système inclut des tests unitaires et d'intégration complets :

- Tests unitaires pour le service `ConflictRecommendationService`
- Tests pour le hook `useConflictRecommendation`
- Tests des composants UI
- Tests de bout en bout pour valider l'intégration

## Dépendances

- `date-fns` : Manipulation des dates
- `EventBusService` : Communication entre composants
- `useConflictDetection` : Détection des conflits sous-jacente

## Perspectives d'Évolution

- Intégration avec un système d'intelligence artificielle pour des recommandations plus avancées
- Personnalisation des règles par utilisateur
- Tableaux de bord analytiques sur l'efficacité des recommandations
- Intégration avec d'autres modules (planning, quotas) pour des recommandations plus globales 