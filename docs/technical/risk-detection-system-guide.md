# Guide Technique du Système de Détection des Risques

## Vue d'ensemble

Le Système de Détection des Risques est un composant proactif conçu pour identifier les périodes à haut risque de conflits dans la planification des congés. Il analyse diverses sources de données pour prédire quand des conflits pourraient survenir, permettant ainsi aux administrateurs de prendre des mesures préventives.

## Architecture

Le système est composé de trois composants principaux :

1. **RiskPeriodDetectionService** - Service central qui analyse les données et détecte les périodes à risque
2. **RiskPeriodAlert** - Composant UI pour afficher les alertes de périodes à risque
3. **ConflictStatsDashboard** - Tableau de bord pour visualiser les statistiques liées aux conflits
4. **TeamCalendarConflictView** - Vue calendrier qui intègre les informations sur les périodes à risque

### Diagramme de flux de données

```
┌────────────────┐       ┌─────────────────┐       ┌────────────────┐
│ Données congés │─────▶ │ EventBusService │─────▶ │ Détection des  │
└────────────────┘       └─────────────────┘       │    risques     │
                                 ▲                  └───────┬────────┘
┌────────────────┐               │                          │
│Données conflits│───────────────┘                          │
└────────────────┘                                          │
                                                            │
┌────────────────┐       ┌─────────────────┐       ┌───────▼────────┐
│  Composants    │◀────┐ │  Alertes de     │◀─────┐│ Périodes à     │
│  d'affichage   │      │  risque          │       │ risque         │
└────────────────┘      └─────────────────┘       └────────────────┘
```

## RiskPeriodDetectionService

### Fonctionnalités clés

- Analyse continue des données pour détecter les périodes à risque
- Calcul de scores de risque basé sur plusieurs facteurs
- Catégorisation des périodes selon leur niveau de risque (LOW, MEDIUM, HIGH, CRITICAL)
- Prédiction des types de conflits probables
- Émission d'événements pour notifier de nouvelles périodes à risque

### Facteurs analysés

- **Jours fériés et vacances scolaires** - Périodes typiquement à haute demande de congés
- **Saisonnalité** - Tendances saisonnières (été, fin d'année, etc.)
- **Capacité d'équipe** - Analyse de la capacité disponible par équipe
- **Données historiques** - Analyse des conflits survenus à des périodes similaires par le passé
- **Facteurs externes** - Proximité des weekends, etc.

### Algorithme de calcul du score de risque

L'algorithme attribue un score entre 0 et 100 à chaque période, en combinant les facteurs ci-dessus :

```typescript
// Pseudocode simplifié
function calculateRiskScore(date) {
  let score = 0;
  
  // 1. Vérifier si c'est un jour férié
  if (isHoliday(date)) score += 25;
  
  // 2. Analyse saisonnière
  score += calculateSeasonalityScore(date);
  
  // 3. Analyse de la capacité d'équipe
  score += calculateTeamCapacityScore(date);
  
  // 4. Données historiques
  score += calculateHistoricalConflictScore(date);
  
  // 5. Facteurs externes
  score += calculateExternalFactorsScore(date);
  
  return Math.min(100, score);
}
```

### Niveaux de risque

Les niveaux de risque sont déterminés selon des seuils configurables :

- **LOW** : Score < 40
- **MEDIUM** : Score entre 40 et 64
- **HIGH** : Score entre 65 et 84
- **CRITICAL** : Score ≥ 85

## Composants UI

### RiskPeriodAlert

Composant d'affichage des alertes de périodes à risque :

- Affichage des périodes actuelles et à venir
- Code couleur selon le niveau de risque
- Possibilité d'expansion pour voir les détails
- Fonctionnalité de rejet d'alertes

### ConflictStatsDashboard

Tableau de bord analytique pour les conflits et périodes à risque :

- Vue d'ensemble avec graphiques de répartition par sévérité
- Tendances des conflits sur différentes périodes
- Distribution des types de conflits
- Liste des périodes à risque à venir
- Conseils de prévention

### TeamCalendarConflictView

Vue calendrier améliorée intégrant les informations sur les périodes à risque :

- Visualisation des congés avec code couleur selon les conflits
- Arrière-plan coloré pour les périodes à risque
- Filtrage par sévérité, type de conflit et utilisateurs
- Tooltips informatifs sur les conflits et périodes à risque

## Intégration avec le système d'événements

Le service utilise `EventBusService` pour :

1. **S'abonner** aux événements de changement de congés (`leave.created`, `leave.updated`, `leave.deleted`)
2. **Émettre** des événements lorsqu'une nouvelle période à risque est détectée (`risk.period.detected`)
3. **Émettre** des événements lorsqu'une période à risque est désactivée (`risk.period.deactivated`)

## Configuration et personnalisation

Le service accepte plusieurs options de configuration via `updateOptions()` :

```typescript
// Exemple de configuration
riskService.updateOptions({
  lookAheadDays: 90,              // Jours à regarder en avance
  historicalAnalysisMonths: 12,   // Mois d'historique à analyser
  minimumRiskScoreThreshold: 30,  // Seuil minimum pour considérer une période à risque
  enableHolidayDetection: true,   // Activer la détection des jours fériés
  enableSeasonalityAnalysis: true, // Activer l'analyse de saisonnalité
  enableTeamCapacityAnalysis: true, // Activer l'analyse de capacité d'équipe
  riskLevelThresholds: {          // Seuils pour les niveaux de risque
    medium: 40,
    high: 65,
    critical: 85
  }
});
```

## Tests

Le système inclut deux types de tests spécifiques :

1. **Tests d'intégration** - Vérifient l'interaction entre le service et les autres composants
2. **Tests de performance** - Garantissent que le système reste performant même avec un grand volume de données

## Exemple d'utilisation

```typescript
// Obtenir une instance du service
const riskService = RiskPeriodDetectionService.getInstance();

// Déclencher une analyse
const riskPeriods = riskService.analyzeRiskPeriods();

// Récupérer les périodes actuelles
const currentPeriods = riskService.getCurrentRiskPeriods();

// Récupérer les périodes à venir (30 jours par défaut)
const upcomingPeriods = riskService.getUpcomingRiskPeriods();

// Désactiver une période à risque
riskService.deactivateRiskPeriod(periodId);
```

## Notes techniques

### Performance

- L'analyse est conçue pour être efficace même avec un grand nombre de congés
- Le service met en cache certains résultats pour éviter des calculs répétitifs
- L'analyse complète est programmée quotidiennement, mais également déclenchée lors de changements de congés

### Maintenance et évolution

Pour étendre le système :

1. Ajout de nouveaux facteurs d'analyse : ajouter une méthode de calcul dans `RiskPeriodDetectionService`
2. Modification des seuils : utiliser `updateOptions()` pour ajuster les seuils de risque
3. Nouvelles visualisations : les composants UI peuvent être étendus indépendamment

## FAQ technique

**Q: Comment le système gère-t-il les faux positifs ?**  
R: Les administrateurs peuvent désactiver manuellement une période à risque. De plus, le système apprend des résolutions de conflits passées pour affiner ses prédictions.

**Q: Quelle est la fréquence d'analyse ?**  
R: Une analyse complète est effectuée quotidiennement, mais également à chaque création/modification/suppression de congé.

**Q: Comment optimiser le système pour une grande organisation ?**  
R: Ajuster `lookAheadDays` et `historicalAnalysisMonths` pour équilibrer précision et performance. Pour les très grandes organisations, envisager d'implémenter une analyse par département plutôt que globale. 