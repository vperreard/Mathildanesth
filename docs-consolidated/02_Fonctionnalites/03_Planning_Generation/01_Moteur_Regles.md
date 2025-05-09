# Moteur de Règles

## Vue d'ensemble

Le moteur de règles constitue une pierre angulaire de Mathildanesth, permettant la définition, la validation et l'application de règles métier complexes pour la génération et la validation des plannings. Ce système flexible permet aux administrateurs de configurer des règles sans nécessiter de modifications du code.

## Architecture du moteur

Le moteur de règles est structuré autour de trois concepts clés :
1. **Règles** : Définitions des contraintes et logiques métier
2. **Conditions** : Critères d'évaluation déterminant quand une règle s'applique
3. **Actions** : Effets résultant de l'application d'une règle

### Composants principaux

```typescript
// Modèle de règle
interface Rule {
  id: string;
  name: string;
  description: string;
  type: RuleType;
  conditions: Condition[];
  actions: Action[];
  priority: number;
  severity: RuleSeverity;
  isActive: boolean;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
  };
}

// Type de règle
enum RuleType {
  GARDE = 'GARDE',
  CONSULTATION = 'CONSULTATION',
  BLOC = 'BLOC',
  SUPERVISION = 'SUPERVISION',
  CONGE = 'CONGE',
  GENERAL = 'GENERAL'
}

// Sévérité des règles
enum RuleSeverity {
  INFO = 'INFO',           // Information, pas de blocage
  WARNING = 'WARNING',     // Avertissement, validation possible avec confirmation
  ERROR = 'ERROR',         // Erreur, validation impossible
  CRITICAL = 'CRITICAL'    // Critique, nécessite intervention admin
}

// Conditions
interface Condition {
  id: string;
  type: ConditionType;
  parameters: Record<string, any>;
  operator: LogicalOperator;
  children?: Condition[];  // Pour les conditions composées
}

// Actions
interface Action {
  id: string;
  type: ActionType;
  parameters: Record<string, any>;
}
```

## Fonctionnalités implémentées

### Évaluation des règles

Le cœur du moteur est la fonction d'évaluation qui détermine si une règle s'applique à une situation donnée :

```typescript
// Fonction d'évaluation principale
function evaluateRule(rule: Rule, context: RuleEvaluationContext): RuleEvaluationResult {
  // Vérifier si la règle est active
  if (!rule.isActive) {
    return { 
      applicable: false, 
      result: false, 
      reason: 'Rule is not active' 
    };
  }

  // Évaluer chaque condition avec opérateur logique approprié
  const conditionsResult = evaluateConditions(rule.conditions, context);
  
  if (!conditionsResult.result) {
    return { 
      applicable: false, 
      result: false, 
      reason: `Conditions not met: ${conditionsResult.reason}` 
    };
  }

  // Si toutes les conditions sont remplies, la règle est applicable
  return { 
    applicable: true, 
    result: true, 
    actions: rule.actions 
  };
}
```

### Système CRUD pour les règles

L'application dispose d'une interface administrateur complète pour gérer les règles :

- Création de nouvelles règles avec conditions et actions
- Visualisation et filtrage des règles existantes
- Modification et ajustement des paramètres
- Activation/désactivation des règles
- Tests de validation des règles

### Types de conditions disponibles

Le système prend en charge différents types de conditions pour couvrir une large gamme de scénarios :

| Type de condition | Description | Exemple de paramètres |
|-------------------|-------------|------------------------|
| `USER_PROPERTY` | Vérifie une propriété de l'utilisateur | `{ property: "role", value: "MAR" }` |
| `DATE_PROPERTY` | Vérifie une propriété de date | `{ property: "dayOfWeek", value: 5, operator: "=" }` |
| `ASSIGNMENT_COUNT` | Vérifie le nombre d'affectations | `{ period: "MONTH", type: "GARDE", count: 3, operator: "<=" }` |
| `SPECIALITY_MATCH` | Vérifie la correspondance de spécialité | `{ userSpeciality: true, roomSpeciality: "ORTHOPEDIE" }` |
| `TIME_BETWEEN` | Vérifie l'intervalle entre affectations | `{ minHours: 24, type: "GARDE" }` |
| `MAX_CONSECUTIVE` | Vérifie le nombre max consécutif | `{ type: "GARDE", maxCount: 2 }` |
| `CUSTOM_FUNCTION` | Évalue une fonction personnalisée | `{ functionName: "checkUserAvailability" }` |

### Types d'actions disponibles

Les actions permettent au système de réagir lorsqu'une règle est applicable :

| Type d'action | Description | Exemple de paramètres |
|---------------|-------------|------------------------|
| `PREVENT_ASSIGNMENT` | Bloque une affectation | `{ message: "Règle de repos obligatoire non respectée" }` |
| `WARN_USER` | Affiche un avertissement | `{ message: "Attention, 3ème garde du mois", severity: "WARNING" }` |
| `SUGGEST_ALTERNATIVE` | Suggère une alternative | `{ strategy: "NEXT_AVAILABLE_USER", message: "Suggérer un remplaçant" }` |
| `ADJUST_SCORE` | Ajuste le score d'affectation | `{ adjustment: -20, reason: "Préférence utilisateur non respectée" }` |
| `LOG_EVENT` | Journalise un événement | `{ level: "INFO", message: "Règle d'équité appliquée" }` |
| `REQUIRE_APPROVAL` | Nécessite une approbation | `{ approverRole: "ADMIN", message: "Validation manuelle requise" }` |

## Intégration avec l'algorithme de génération

Le moteur de règles est intégré au cœur de l'algorithme de génération de planning :

1. **Phase de pré-traitement** : Analyse préalable des contraintes via les règles
2. **Phase de génération** : Application des règles pour filtrer les affectations invalides
3. **Phase de validation** : Vérification finale du planning contre toutes les règles actives
4. **Phase d'optimisation** : Utilisation des scores ajustés par les règles pour prioriser

```typescript
// Intégration dans le générateur de planning
class PlanningGenerator {
  private ruleEngine: RuleEngine;
  
  // Évaluation pendant la génération
  private validateAssignment(assignment: Assignment, context: GenerationContext): ValidationResult {
    const applicableRules = this.ruleEngine.getApplicableRules(
      assignment.type, 
      context.currentDate,
      assignment.user
    );
    
    for (const rule of applicableRules) {
      const evaluation = this.ruleEngine.evaluateRule(rule, {
        assignment,
        user: assignment.user,
        date: context.currentDate,
        existingAssignments: context.assignments,
        parameters: this.parameters
      });
      
      if (evaluation.applicable && !evaluation.result) {
        return {
          isValid: false,
          rule: rule,
          reason: evaluation.reason
        };
      }
    }
    
    return { isValid: true };
  }
}
```

## État actuel et prochaines étapes

### Implémentation actuelle

- **Statut** : Partiellement implémenté (MVP fonctionnel)
- **Localisation** :
  - `src/modules/rules/engine/RuleEngineService.ts` : Service du moteur de règles
  - `src/modules/dynamicRules/components/RuleForm.tsx` : Interface d'édition
  - `src/app/admin/schedule-rules/page.tsx` : Page d'administration des règles

### Fonctionnalités à développer

1. **Éditeur visuel de conditions et actions**
   - Interface intuitive type "flowchart" pour configurer les conditions complexes
   - Prévisualisation des effets des règles
   - Validation en temps réel des configurations

2. **Détection avancée des conflits entre règles**
   - Analyse des contradictions potentielles
   - Suggestion de résolutions
   - Hiérarchisation intelligente basée sur les priorités

3. **Extension des types de conditions et actions**
   - Conditions basées sur des métriques avancées (fatigue, équité)
   - Actions avec impact sur d'autres modules (notifications, rapports)
   - Conditions temporelles plus sophistiquées

4. **Intégration avec l'historique des affectations**
   - Prise en compte des tendances historiques
   - Apprentissage des modèles préférentiels
   - Optimisation sur de longues périodes

## Exemples de règles métier

### Règle de repos après garde

```json
{
  "name": "Repos minimum après garde de nuit",
  "description": "Un MAR doit avoir au moins 24h de repos après une garde de nuit",
  "type": "GARDE",
  "severity": "ERROR",
  "priority": 100,
  "isActive": true,
  "conditions": [
    {
      "type": "USER_PROPERTY",
      "parameters": { "property": "type", "value": "MAR" }
    },
    {
      "type": "PREVIOUS_ASSIGNMENT",
      "parameters": { "type": "GARDE_NUIT", "withinHours": 24 }
    }
  ],
  "actions": [
    {
      "type": "PREVENT_ASSIGNMENT",
      "parameters": { 
        "message": "Repos obligatoire de 24h après garde de nuit non respecté" 
      }
    },
    {
      "type": "LOG_EVENT",
      "parameters": { 
        "level": "WARNING", 
        "message": "Tentative d'affectation pendant période de repos obligatoire" 
      }
    }
  ]
}
```

### Règle d'équité des gardes de weekend

```json
{
  "name": "Équité des gardes de weekend",
  "description": "Les gardes de weekend doivent être réparties équitablement",
  "type": "GARDE",
  "severity": "WARNING",
  "priority": 50,
  "isActive": true,
  "conditions": [
    {
      "type": "DATE_PROPERTY",
      "parameters": { "property": "isWeekend", "value": true }
    },
    {
      "type": "ASSIGNMENT_COUNT_COMPARISON",
      "parameters": { 
        "period": "TRIMESTER", 
        "type": "GARDE_WEEKEND",
        "comparisonType": "AVERAGE_TEAM",
        "operator": ">", 
        "threshold": 1.5
      }
    }
  ],
  "actions": [
    {
      "type": "WARN_USER",
      "parameters": { 
        "message": "Déséquilibre dans la répartition des gardes de weekend",
        "severity": "WARNING"
      }
    },
    {
      "type": "ADJUST_SCORE",
      "parameters": { 
        "adjustment": -15, 
        "reason": "Répartition inéquitable des gardes de weekend" 
      }
    },
    {
      "type": "SUGGEST_ALTERNATIVE",
      "parameters": { 
        "strategy": "LEAST_WEEKEND_SHIFTS",
        "message": "Envisager plutôt un MAR ayant effectué moins de gardes de weekend"  
      }
    }
  ]
}
``` 