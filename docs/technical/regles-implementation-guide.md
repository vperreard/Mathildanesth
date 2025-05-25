# Guide d'implémentation des règles de planning

## Architecture technique recommandée

### 1. Structure de base

```typescript
// src/modules/rules/

├── types/
│   ├── rule-base.ts      // Types de base pour toutes les règles
│   ├── garde-rules.ts    // Types spécifiques aux gardes
│   ├── consultation-rules.ts
│   ├── block-rules.ts
│   └── fatigue-rules.ts
│
├── engine/
│   ├── rule-engine.ts    // Moteur principal
│   ├── rule-validator.ts // Validation des règles
│   ├── rule-solver.ts    // Résolution des conflits
│   └── rule-scorer.ts    // Système de scoring
│
├── services/
│   ├── garde-service.ts
│   ├── consultation-service.ts
│   ├── block-service.ts
│   └── fatigue-service.ts
│
├── configuration/
│   ├── default-rules.ts  // Règles par défaut
│   ├── rule-templates.ts // Templates de règles
│   └── rule-presets.ts   // Préconfigurations
│
└── utils/
    ├── date-utils.ts
    ├── calculation-utils.ts
    └── validation-utils.ts
```

### 2. Modèle de données

```typescript
// Types de base pour les règles
interface BaseRule {
  id: string;
  type: RuleType;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  
  // Métadonnées pour l'adaptabilité
  isCustomizable: boolean;  // Peut être modifié par l'équipe
  isOverridable: boolean;   // Peut être outrepassé
  requiresApproval: boolean; // Nécessite validation
}

// Enumération des types de règles
enum RuleType {
  TEMPORAL = 'temporal',
  EQUITY = 'equity',
  SUPERVISION = 'supervision',
  FATIGUE = 'fatigue',
  PREFERENCE = 'preference',
  CONSTRAINT = 'constraint'
}

// Configuration d'une règle
interface RuleConfiguration {
  parameters: {
    [key: string]: any;
  };
  conditions: RuleCondition[];
  exceptions: RuleException[];
}

// Condition d'application d'une règle
interface RuleCondition {
  field: string;
  operator: ComparisonOperator;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

// Exception à une règle
interface RuleException {
  type: ExceptionType;
  reason: string;
  validUntil?: Date;
  approvedBy?: string;
}
```

### 3. Moteur de règles

```typescript
class RuleEngine {
  private rules: Map<string, BaseRule>;
  private validators: Map<RuleType, RuleValidator>;
  private solvers: Map<RuleType, RuleSolver>;
  
  constructor(config: RuleEngineConfig) {
    this.initializeRules(config.defaultRules);
    this.registerValidators();
    this.registerSolvers();
  }
  
  // Évaluer toutes les règles pour une affectation
  async evaluate(context: PlanningContext): Promise<RuleEvaluationResult> {
    const violations: RuleViolation[] = [];
    const warnings: RuleWarning[] = [];
    
    for (const rule of this.rules.values()) {
      if (!rule.isActive) continue;
      
      const result = await this.evaluateRule(rule, context);
      if (result.isViolated) {
        violations.push(result.violation);
      }
      if (result.hasWarning) {
        warnings.push(result.warning);
      }
    }
    
    return {
      isValid: violations.length === 0,
      violations,
      warnings,
      score: this.calculateScore(context, violations, warnings)
    };
  }
  
  // Résoudre les conflits entre règles
  async resolveConflicts(violations: RuleViolation[]): Promise<Resolution[]> {
    const grouped = this.groupViolationsByPriority(violations);
    const resolutions: Resolution[] = [];
    
    for (const group of grouped) {
      const solver = this.solvers.get(group.type);
      if (solver) {
        const resolution = await solver.resolve(group.violations);
        resolutions.push(resolution);
      }
    }
    
    return resolutions;
  }
}
```

### 4. Système de fatigue

```typescript
class FatigueSystem {
  private config: FatigueConfig;
  
  constructor(config: FatigueConfig) {
    this.config = config;
  }
  
  // Calculer les points de fatigue pour une affectation
  calculateFatiguePoints(assignment: Assignment): number {
    let points = 0;
    
    switch (assignment.type) {
      case 'GARDE':
        points += this.config.points.garde;
        break;
      case 'ASTREINTE':
        points += this.config.points.astreinte;
        break;
      case 'SUPERVISION':
        if (assignment.supervisionCount > 2) {
          points += this.config.points.supervisionMultiple;
        }
        break;
      case 'PEDIATRIE':
        points += this.config.points.pediatrie;
        break;
    }
    
    return points;
  }
  
  // Calculer la récupération
  calculateRecovery(offPeriod: OffPeriod): number {
    let recovery = 0;
    
    if (offPeriod.type === 'JOUR_COMPLET') {
      recovery = this.config.recovery.jourOff;
    } else if (offPeriod.type === 'DEMI_JOURNEE') {
      recovery = this.config.recovery.demiJourneeOff;
    } else if (offPeriod.type === 'WEEKEND') {
      recovery = this.config.recovery.weekend;
    }
    
    return recovery;
  }
  
  // Vérifier si un médecin peut prendre une affectation
  canTakeAssignment(medecin: Medecin, assignment: Assignment): boolean {
    const currentFatigue = medecin.fatigue.score;
    const additionalFatigue = this.calculateFatiguePoints(assignment);
    const projectedFatigue = currentFatigue + additionalFatigue;
    
    if (projectedFatigue > this.config.seuils.critique) {
      return false;
    }
    
    if (projectedFatigue > this.config.seuils.alerte) {
      // Vérifier si des mesures compensatoires sont prévues
      return this.hasCompensatoryMeasures(medecin, assignment);
    }
    
    return true;
  }
}
```

### 5. Système d'équité hybride

```typescript
class EquitySystem {
  private config: EquityConfig;
  
  // Calculer le score d'équité pour un médecin
  calculateEquityScore(medecin: Medecin, context: PlanningContext): number {
    const scores = {
      heures: this.calculateHoursEquity(medecin),
      gardes: this.calculateDutyEquity(medecin),
      weekends: this.calculateWeekendEquity(medecin),
      fetes: this.calculateHolidayEquity(medecin),
      fatigue: this.calculateFatigueEquity(medecin)
    };
    
    // Appliquer les pondérations
    return Object.entries(scores).reduce((total, [key, value]) => {
      return total + (value * this.config.weights[key]);
    }, 0);
  }
  
  // Distribuer les jours OFF équitablement
  distributeOffDays(medecins: Medecin[], availableSlots: OffSlot[]): Distribution {
    // 1. Garantir le minimum pour tous
    const distribution = this.ensureMinimumOff(medecins, availableSlots);
    
    // 2. Distribuer le reste selon le score combiné
    const remainingSlots = this.getRemainingSlots(availableSlots, distribution);
    
    // 3. Calculer les scores combinés
    const scores = medecins.map(m => ({
      medecin: m,
      score: this.calculateCombinedScore(m),
      currentOff: distribution.get(m.id) || 0
    }));
    
    // 4. Distribuer en respectant les quotas
    return this.distributeByScore(scores, remainingSlots);
  }
}
```

### 6. Interface de configuration

```typescript
// Configuration par défaut pour une nouvelle équipe
const defaultRuleConfig: RuleConfig = {
  gardes: {
    minDaysBetween: 7,
    idealDaysBetween: 14,
    maxPerMonth: 3,
    restAfterDuty: true,
    restDuration: 24 // heures
  },
  
  consultations: {
    perWeekFullTime: 2,
    maxPerWeek: 3,
    distributionPattern: '1-2', // ou '2-1', jamais '3-0'
    allowClosures: true
  },
  
  supervision: {
    maxRoomsPerMAR: 2,
    exceptionalMax: 3,
    sectorRules: {
      'HYPERASEPTIQUE': {
        sameSectorOnly: true,
        exceptions: ['S5_FROM_S3_S4']
      },
      'OPHTALMO': {
        maxRooms: 3,
        supervisorsFrom: ['S6', 'S7']
      },
      'ENDOSCOPIE': {
        maxRooms: 2,
        supervisorsFrom: ['S10', 'S11', 'S12B']
      }
    }
  },
  
  fatigue: {
    enabled: true,
    points: {
      garde: 30,
      astreinte: 10,
      supervisionMultiple: 15,
      pediatrie: 10,
      specialiteLourde: 8
    },
    recovery: {
      jourOff: 20,
      weekend: 30,
      demiJourneeOff: 10
    },
    thresholds: {
      alert: 80,
      critical: 120
    }
  },
  
  equity: {
    weights: {
      heures: 0.3,
      gardes: 0.3,
      weekends: 0.2,
      fatigue: 0.2
    },
    quotas: {
      minOffPerWeek: 0.5, // demi-journées
      maxOffPerWeek: 2,
      minOffPerMonth: 4
    }
  }
};
```

### 7. Gestion des urgences et imprévus

```typescript
class EmergencyManager {
  private planningService: PlanningService;
  private ruleEngine: RuleEngine;
  private suggestionEngine: SuggestionEngine;
  
  // Proposer des modifications automatiques en cas d'absence
  async proposeEmergencyModifications(absence: {
    personnel: Personnel;
    dateDebut: Date;
    dateFin: Date;
    type: 'MALADIE' | 'URGENCE' | 'AUTRE';
  }): Promise<ModificationProposal[]> {
    // 1. Identifier les affectations à remplacer
    const affectationsImpactees = await this.getAffectedAssignments(absence);
    
    // 2. Générer plusieurs scénarios de remplacement
    const scenarios = await this.generateReplacementScenarios(affectationsImpactees);
    
    // 3. Évaluer chaque scénario
    const evaluatedScenarios = await Promise.all(
      scenarios.map(async scenario => {
        const impact = await this.evaluateScenarioImpact(scenario);
        const score = this.calculateScenarioScore(scenario, impact);
        
        return {
          scenario,
          impact,
          score,
          commentaires: this.generateComments(scenario, impact)
        };
      })
    );
    
    // 4. Trier par score et retourner les meilleures propositions
    return evaluatedScenarios
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Top 3 propositions
  }
  
  // Générer des commentaires explicatifs pour chaque proposition
  private generateComments(scenario: Scenario, impact: Impact): string[] {
    const comments: string[] = [];
    
    // Analyser les impacts sur l'équité
    if (impact.equite.desequilibre > 0.2) {
      comments.push(`⚠️ ${scenario.personnel.nom} aura une charge plus importante cette semaine`);
    }
    
    // Analyser les impacts sur la fatigue
    if (impact.fatigue.augmentation > 15) {
      comments.push(`⚠️ Augmentation significative de la fatigue pour ${scenario.personnel.nom}`);
    }
    
    // Analyser les compensations
    if (scenario.compensations.length > 0) {
      comments.push(`✅ Compensé par ${scenario.compensations.map(c => c.description).join(', ')}`);
    }
    
    return comments;
  }
}
```

### 8. Machine Learning pour amélioration continue

```typescript
class LearningEngine {
  private modificationHistory: ModificationHistory;
  private feedbackCollector: FeedbackCollector;
  private patternAnalyzer: PatternAnalyzer;
  
  // Enregistrer chaque modification manuelle pour apprentissage
  async recordManualModification(modification: {
    before: Assignment;
    after: Assignment;
    reason: string;
    user: string;
    context: ModificationContext;
  }): Promise<void> {
    await this.modificationHistory.save(modification);
    
    // Analyser immédiatement pour détecter des patterns
    const patterns = await this.patternAnalyzer.analyzeNewModification(modification);
    
    if (patterns.length > 0) {
      await this.updateLearningModel(patterns);
    }
  }
  
  // Analyser les patterns de modifications
  async analyzeModificationPatterns(): Promise<Pattern[]> {
    const modifications = await this.modificationHistory.getAll();
    
    return this.patternAnalyzer.detectPatterns(modifications, {
      minOccurrences: 3,
      confidenceThreshold: 0.7,
      timeWindow: '6months'
    });
  }
  
  // Suggérer des ajustements de règles basés sur l'apprentissage
  async suggestRuleAdjustments(): Promise<RuleAdjustment[]> {
    const patterns = await this.analyzeModificationPatterns();
    const currentRules = await this.ruleEngine.getAllRules();
    
    return patterns.map(pattern => ({
      rule: this.findMatchingRule(pattern, currentRules),
      suggestedChange: this.generateSuggestion(pattern),
      confidence: pattern.confidence,
      basedOn: `${pattern.occurrences} modifications similaires`,
      impact: this.estimateImpact(pattern)
    }));
  }
}
```

### 9. Interface utilisateur avancée

```typescript
class PlanningGenerationUI {
  private generationSteps: GenerationStep[];
  private validationService: ValidationService;
  private visualizationService: VisualizationService;
  
  // Interface de génération par couches avec validation
  async generateWithValidation(): Promise<void> {
    for (const step of this.generationSteps) {
      // 1. Générer la couche
      const result = await step.generate();
      
      // 2. Afficher les résultats avec commentaires
      const visualization = this.visualizationService.createStepVisualization(result, {
        highlightIssues: true,
        showComments: true,
        colorCoding: {
          normal: '#4CAF50',      // Vert
          warning: '#FF9800',     // Orange
          critical: '#F44336'     // Rouge
        }
      });
      
      // 3. Générer les commentaires explicatifs
      const comments = this.generateStepComments(result);
      
      // 4. Attendre la validation de l'administrateur
      const validation = await this.showValidationDialog({
        visualization,
        comments,
        metrics: result.metrics,
        options: ['Valider', 'Modifier', 'Régénérer']
      });
      
      if (validation.action === 'Modifier') {
        await this.handleManualModifications(result);
      } else if (validation.action === 'Régénérer') {
        await step.regenerate(validation.parameters);
      }
    }
  }
  
  // Générer des commentaires explicatifs pour chaque étape
  private generateStepComments(result: GenerationResult): Comment[] {
    const comments: Comment[] = [];
    
    // Analyser les situations problématiques
    result.issues.forEach(issue => {
      comments.push({
        type: issue.severity,
        message: issue.description,
        suggestion: issue.suggestedFix,
        affectedPersonnel: issue.personnel
      });
    });
    
    // Analyser les compensations
    result.compensations.forEach(comp => {
      comments.push({
        type: 'info',
        message: `${comp.personnel} a une charge importante mais compensée par ${comp.compensation}`,
        affectedPersonnel: [comp.personnel]
      });
    });
    
    return comments;
  }
}
```

### 10. API pour la gestion des règles

```typescript
// API pour manipuler les règles
class RuleManagementAPI {
  // Créer une nouvelle règle
  async createRule(rule: RuleDefinition): Promise<Rule> {
    const validated = await this.validateRule(rule);
    if (!validated.isValid) {
      throw new ValidationError(validated.errors);
    }
    
    return await this.ruleRepository.create(rule);
  }
  
  // Modifier une règle existante
  async updateRule(id: string, updates: Partial<Rule>): Promise<Rule> {
    const existing = await this.ruleRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Rule ${id} not found`);
    }
    
    if (existing.requiresApproval) {
      await this.requestApproval(existing, updates);
    }
    
    return await this.ruleRepository.update(id, updates);
  }
  
  // Activer/désactiver une règle
  async toggleRule(id: string, active: boolean): Promise<Rule> {
    return await this.ruleRepository.update(id, { isActive: active });
  }
  
  // Exporter la configuration des règles
  async exportConfiguration(): Promise<RuleConfiguration> {
    const rules = await this.ruleRepository.findAll();
    return this.serializeConfiguration(rules);
  }
  
  // Importer une configuration
  async importConfiguration(config: RuleConfiguration): Promise<void> {
    await this.validateConfiguration(config);
    await this.ruleRepository.importBulk(config.rules);
  }
}
```

## Mise en œuvre progressive

### Phase 1 : Core Rules Engine
1. Implémenter les types de base
2. Créer le moteur de règles minimal
3. Ajouter les règles essentielles (gardes, repos)

### Phase 2 : Advanced Features
1. Système de fatigue
2. Gestion de l'équité
3. Préférences personnelles

### Phase 3 : Optimization
1. Algorithmes d'optimisation
2. Résolution de conflits avancée
3. Interface de configuration

### Phase 4 : Integration
1. API complète
2. Interface utilisateur
3. Outils statistiques

## Points d'attention

1. **Performance** : Optimiser les calculs pour les grands plannings
2. **Flexibilité** : Permettre l'ajout de nouvelles règles sans refonte
3. **Traçabilité** : Logger toutes les décisions importantes
4. **Tests** : Couvrir tous les cas limites
5. **Documentation** : Maintenir à jour avec les évolutions

## Outils recommandés

1. **Tests** : Jest pour les tests unitaires, Cypress pour les tests E2E
2. **Validation** : Joi ou Zod pour la validation des données
3. **Logging** : Winston ou Pino pour les logs structurés
4. **Monitoring** : Prometheus pour les métriques

Cette architecture permet une implémentation progressive tout en garantissant la robustesse et l'évolutivité du système.
