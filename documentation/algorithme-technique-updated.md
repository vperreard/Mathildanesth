# Spécification Technique de l'Algorithme de Génération de Planning

## Introduction

L'algorithme de génération de planning constitue le cœur fonctionnel de l'application. Il doit répondre à des contraintes multiples et parfois contradictoires, tout en garantissant une répartition équitable et conforme aux règles établies. Ce document présente l'approche technique retenue pour implémenter cet algorithme complexe avec un focus particulier sur la gestion dynamique des règles.

## Principes généraux

L'algorithme suivra une approche par étapes séquentielles avec optimisation locale et globale :

1. **Chargement des règles dynamiques depuis la base de données**
2. **Pré-traitement et analyse des contraintes**
3. **Génération par couches successives** (gardes → astreintes → consultations → bloc)
4. **Optimisation et vérification**
5. **Résolution des conflits**

## Architecture technique

### 1. Modèle de données pour l'algorithme

```javascript
// Représentation simplifiée des structures de données

// Personnel médical
interface Personnel {
  id: string;
  nom: string;
  prenom: string;
  type: 'MAR' | 'IADE';
  tempsPlein: boolean;
  workPattern: WorkPatternType;
  workOnMonthType: WeekType | null;
  joursTravaillesSemainePaire: DayOfWeek[];
  joursTravaillesSemaineImpaire: DayOfWeek[];
  specialites: string[];
  conges: Periode[];
  indisponibilites: Periode[];
  competences: Record<string, number>; // niveau par spécialité
  historique: {
    gardes: Affectation[];
    astreintes: Affectation[];
    consultations: Affectation[];
    blocs: Affectation[];
  };
  stats: {
    gardesMois: number;
    gardesAn: number;
    // autres stats
  };
}

// Période temporelle
interface Periode {
  debut: Date;
  fin: Date;
  type?: string;
}

// Affectation
interface Affectation {
  date: Date;
  periodeJournee: 'matin' | 'apres-midi' | 'journee';
  personnel: string; // ID du personnel
  type: 'garde' | 'astreinte' | 'consultation' | 'bloc-anesthesie' | 'bloc-supervision';
  salle?: string;
  chirurgien?: string;
  specialite?: string;
  statut: 'genere' | 'valide' | 'manuel';
  exceptionnel: boolean;
}

// Règle de planification
interface PlanningRule {
  id: number;
  category: string; // "GARDE", "CONSULTATION", "BLOC", "SUPERVISION"
  name: string;
  description?: string;
  isActive: boolean;
  priority: number;
  condition: RuleCondition;
  parameters: RuleParameters;
}

// Condition d'une règle
interface RuleCondition {
  type: 'TEMPORAL' | 'EQUITY' | 'SUPERVISION' | 'GEOGRAPHY' | 'PRIORITY';
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'IN' | 'NOT_IN' | 'BETWEEN';
  field: string;
  value: any;
  subConditions?: RuleCondition[];
  logicalOperator?: 'AND' | 'OR';
}

// Paramètres d'une règle
interface RuleParameters {
  [key: string]: any;
}
```

### 2. Organisation du chargeur de règles

```javascript
class RuleEngine {
  constructor() {
    this.rules = [];
    this.categorizedRules = {
      GARDE: [],
      CONSULTATION: [],
      BLOC: [],
      SUPERVISION: []
    };
  }

  async loadRules() {
    // Charger les règles depuis la base de données
    const rules = await prisma.planningRule.findMany({
      where: { isActive: true },
      orderBy: [
        { priority: 'desc' },
        { category: 'asc' }
      ]
    });
    
    // Transformer les règles JSON en objets utilisables
    this.rules = rules.map(rule => ({
      ...rule,
      condition: JSON.parse(rule.conditionJSON),
      parameters: JSON.parse(rule.parameterJSON)
    }));
    
    // Catégoriser les règles
    this.categorizeRules();
  }

  categorizeRules() {
    // Réinitialiser les catégories
    Object.keys(this.categorizedRules).forEach(key => {
      this.categorizedRules[key] = [];
    });
    
    // Remplir les catégories
    this.rules.forEach(rule => {
      if (this.categorizedRules[rule.category]) {
        this.categorizedRules[rule.category].push(rule);
      }
    });
  }

  evaluateCondition(condition, context) {
    // Évaluer une condition en fonction du contexte
    // ...

    // Si la condition a des sous-conditions, les évaluer récursivement
    if (condition.subConditions && condition.subConditions.length > 0) {
      const subResults = condition.subConditions.map(subCond => 
        this.evaluateCondition(subCond, context)
      );
      
      // Combiner les résultats selon l'opérateur logique
      return condition.logicalOperator === 'OR' 
        ? subResults.some(r => r) 
        : subResults.every(r => r);
    }
    
    // Évaluer une condition simple
    const actualValue = this.getFieldValue(condition.field, context);
    
    switch (condition.operator) {
      case 'EQUALS': return actualValue === condition.value;
      case 'NOT_EQUALS': return actualValue !== condition.value;
      case 'GREATER_THAN': return actualValue > condition.value;
      case 'LESS_THAN': return actualValue < condition.value;
      case 'IN': return Array.isArray(condition.value) && condition.value.includes(actualValue);
      case 'NOT_IN': return Array.isArray(condition.value) && !condition.value.includes(actualValue);
      case 'BETWEEN': return Array.isArray(condition.value) && 
                            condition.value.length === 2 && 
                            actualValue >= condition.value[0] && 
                            actualValue <= condition.value[1];
      default: return false;
    }
  }

  findApplicableRules(category, context) {
    // Trouver toutes les règles applicables pour une catégorie et un contexte donnés
    return this.categorizedRules[category].filter(rule => 
      this.evaluateCondition(rule.condition, context)
    );
  }

  checkConflicts(rules) {
    // Vérifier les conflits potentiels entre règles
    // ...
    return {
      hasConflicts: false,
      conflictingRules: []
    };
  }
}
```

### 3. Implémentation de l'algorithme

L'algorithme sera implémenté selon une approche modulaire pour faciliter la maintenance et l'évolution future :

```javascript
class PlanningGenerator {
  constructor(parameters) {
    this.parameters = parameters;
    this.ruleEngine = new RuleEngine();
    this.personnel = []; // Liste des MARs/IADEs
    this.constraints = {}; // Contraintes globales
    this.existingAssignments = []; // Affectations déjà fixées
    this.results = {
      gardes: [],
      astreintes: [],
      consultations: [],
      blocs: []
    };
  }

  // 1. Initialisation
  async initialize() {
    // Charger les règles
    await this.ruleEngine.loadRules();
    
    // Charger personnel, contraintes, etc.
    await this.loadData();
  }

  // 2. Chargement des données
  async loadData() {
    // Charger le personnel depuis la BDD
    this.personnel = await this.loadPersonnel();
    
    // Charger les affectations existantes
    this.existingAssignments = await this.loadExistingAssignments();
    
    // Charger les contraintes spécifiques
    this.constraints = await this.loadConstraints();
  }

  // 3. Génération des gardes
  async generateGardes() {
    // Pour chaque jour de la période
    for (const day of this.parameters.period) {
      // Contexte d'évaluation pour les règles
      const context = { 
        date: day, 
        existingGardes: this.results.gardes, 
        personnel: this.personnel 
      };
      
      // Trouver les règles applicables pour les gardes
      const applicableRules = this.ruleEngine.findApplicableRules('GARDE', context);
      
      // Vérifier les conflits potentiels
      const conflicts = this.ruleEngine.checkConflicts(applicableRules);
      if (conflicts.hasConflicts) {
        // Gérer les conflits selon la priorité ou signaler à l'utilisateur
        this.handleRuleConflicts(conflicts);
      }
      
      // Trouver les MARs éligibles en appliquant les règles
      const eligibleMARs = this.findEligibleForGarde(day, applicableRules);
      
      // Sélectionner le plus adapté selon priorités et règles d'équité
      const selectedMAR = this.selectBestCandidateForGarde(eligibleMARs, day, applicableRules);
      
      // Affecter la garde
      this.assignGarde(selectedMAR, day);
      
      // Marquer comme indisponible le lendemain (règle standard)
      this.markUnavailable(selectedMAR, this.getNextDay(day));
    }
    
    return this.results.gardes;
  }

  // 4. Génération des astreintes avec approche similaire
  async generateAstreintes() {
    // Similaire aux gardes mais avec règles différentes
    // ...
  }

  // 5. Génération des consultations
  async generateConsultations() {
    // Pour chaque créneau de consultation disponible
    for (const slot of this.getConsultationSlots()) {
      // Contexte d'évaluation
      const context = { 
        date: slot.date, 
        periodOfDay: slot.periodeJournee,
        existingConsultations: this.results.consultations, 
        personnel: this.personnel 
      };
      
      // Trouver les règles applicables
      const applicableRules = this.ruleEngine.findApplicableRules('CONSULTATION', context);
      
      // Trouver les MARs disponibles et prioritaires selon les règles
      const eligibleMARs = this.findEligibleForConsultation(slot, applicableRules);
      
      // Sélectionner selon équité et contraintes
      const selectedMAR = this.selectBestCandidateForConsultation(eligibleMARs, slot, applicableRules);
      
      // Affecter la consultation
      this.assignConsultation(selectedMAR, slot);
    }
    
    return this.results.consultations;
  }

  // 6. Génération des affectations bloc
  async generateBlocAssignments() {
    // Pour chaque jour et demi-journée
    for (const timeSlot of this.getBlocTimeSlots()) {
      // Contexte pour règles de supervision et secteur
      const context = {
        date: timeSlot.date,
        periodOfDay: timeSlot.periodeJournee,
        existingBloc: this.results.blocs,
        personnel: this.getAvailablePersonnel(timeSlot)
      };
      
      // Récupérer les règles de supervision
      const supervisionRules = this.ruleEngine.findApplicableRules('SUPERVISION', context);
      
      // Récupérer les salles ouvertes pour ce créneau
      const openRooms = this.getOpenRooms(timeSlot);
      
      // Distribuer les MARs disponibles selon secteurs et règles
      await this.distributePersonnel(openRooms, timeSlot, supervisionRules);
    }
    
    return this.results.blocs;
  }

  // 7. Optimisation globale
  async optimizeGlobalPlanning() {
    // Équilibrer les types d'affectations
    // Optimiser les supervisions
    // Réduire les situations exceptionnelles
    // ...
  }

  // 8. Résolution de conflits
  handleRuleConflicts(conflicts) {
    // Prioriser selon le niveau de priorité des règles
    // Signaler à l'utilisateur si nécessaire
    // ...
  }

  // 9. Vérification des règles métier
  validateRules() {
    // Vérifier toutes les règles métier
    // Signaler les anomalies
    // ...
  }

  // 10. Méthodes auxiliaires
  findEligibleForGarde(day, rules) {
    // Appliquer dynamiquement les règles au lieu de code en dur
    return this.personnel.filter(p => {
      let eligible = true;
      
      // Vérification de base
      if (p.type !== 'MAR') return false;
      
      // Vérifier si en congé ou indisponible
      if (this.isOnLeave(p, day) || this.isUnavailable(p, day)) return false;
      
      // Appliquer chaque règle
      for (const rule of rules) {
        // Contexte spécifique au personnel
        const personContext = { personnel: p, date: day, allPersonnel: this.personnel };
        
        // Si la condition de la règle est VRAI, appliquer le paramètre
        if (this.ruleEngine.evaluateCondition(rule.condition, personContext)) {
          // Exemple: Règle de temps minimum entre gardes
          if (rule.parameters.minDaysBetweenGardes) {
            const lastGarde = this.getLastGarde(p);
            if (lastGarde && this.daysBetween(lastGarde.date, day) < rule.parameters.minDaysBetweenGardes) {
              eligible = false;
              break;
            }
          }
          
          // Exemple: Règle de nombre max de gardes par mois
          if (rule.parameters.maxGardesPerMonth) {
            const gardesThisMonth = this.countGardesInMonth(p, this.getMonthYear(day));
            if (gardesThisMonth >= rule.parameters.maxGardesPerMonth) {
              eligible = false;
              break;
            }
          }
          
          // Autres règles...
        }
      }
      
      return eligible;
    });
  }
  
  selectBestCandidateForGarde(eligibleMARs, day, rules) {
    // Système de score avec pondération dynamique basée sur les règles
    const scores = eligibleMARs.map(mar => {
      let score = 0;
      
      // Contexte personnel pour évaluation
      const context = { personnel: mar, date: day, allPersonnel: this.personnel };
      
      // Appliquer les règles de scoring
      for (const rule of rules) {
        if (rule.parameters.scoringFactors && this.ruleEngine.evaluateCondition(rule.condition, context)) {
          // Exemple: Points pour temps écoulé depuis dernière garde
          if (rule.parameters.scoringFactors.daysSinceLastGarde) {
            const lastGarde = this.getLastGarde(mar);
            if (lastGarde) {
              const days = this.daysBetween(lastGarde.date, day);
              score += days * rule.parameters.scoringFactors.daysSinceLastGarde;
            }
          }
          
          // Exemple: Points inverses pour le nombre de gardes ce mois
          if (rule.parameters.scoringFactors.inverseMonthlyGardes) {
            const gardesThisMonth = this.countGardesInMonth(mar, this.getMonthYear(day));
            score += (10 - gardesThisMonth) * rule.parameters.scoringFactors.inverseMonthlyGardes;
          }
          
          // Autres facteurs...
        }
      }
      
      return { mar, score };
    });
    
    // Trier par score et retourner le meilleur candidat
    scores.sort((a, b) => b.score - a.score);
    return scores.length > 0 ? scores[0].mar : null;
  }
  
  // Autres méthodes auxiliaires...
}
```

## Algorithmes spécifiques

### Répartition des gardes et astreintes avec règles dynamiques

Nous utiliserons un algorithme de scoring avec poids variables définis par les règles en base de données :

1. **Chargement des règles applicables**
   - Récupérer les règles de la catégorie "GARDE" qui sont actives
   - Trier par priorité pour gérer les conflits potentiels

2. **Calcul des scores pour chaque médecin éligible**
   - Facteurs définis dans les paramètres des règles, par exemple:
     - Temps écoulé depuis dernière garde : +1 point par jour
     - Nombre de gardes ce mois (inversement proportionnel) : 0-10 points
     - Affectation sur jour normalement travaillé : +5 points
     - Équité de la répartition globale : 0-10 points

3. **Système de pénalités**
   - Défini également par des règles, par exemple:
     - Garde récente (<7 jours) : -20 points (disqualification)
     - Garde dans la même semaine : -15 points
     - Jour non travaillé habituellement : -8 points
     - A déjà fait une garde weekend/férié ce mois : -5 points

4. **Sélection du candidat avec le meilleur score**

5. **Gestion des cas bloquants**
   - Si aucun candidat ne satisfait les contraintes strictes, alerte pour décision manuelle
   - Proposition des candidats les "moins mauvais" avec explications

### Planification du bloc opératoire avec règles de supervision configurables

Algorithme de "bin packing" adapté avec contraintes de supervision définies par les règles :

1. **Chargement de la configuration des salles**
   - Récupération des salles depuis le modèle `OperatingRoomConfig`
   - Organisation par secteur selon la configuration

2. **Chargement des règles de supervision**
   - Récupération des règles de la catégorie "SUPERVISION"
   - Application selon le secteur et les contraintes

3. **Classification des salles par secteur**
   - Selon les secteurs définis en configuration

4. **Tri des salles par priorité**
   - Selon les priorités définies dans les règles

5. **Affectation des MARs disponibles par secteur**
   - En respectant les contraintes de supervision

6. **Optimisation des supervisions**
   - Regroupement des supervisions selon règles par secteur
   - Minimisation du nombre de supervisions exceptionnelles
   - Application des exceptions autorisées par les règles

7. **Affectation des IADEs supervisés**
   - Répartition selon compétences et règles

## Optimisations techniques

### Performances

- **Mise en cache** des résultats intermédiaires
- **Calcul incrémental** lors des modifications manuelles
- **Précalcul des contraintes** pour chaque date
- **Indexation** des disponibilités/indisponibilités
- **Précompilation des règles** pour une évaluation plus rapide

### Flexibilité et extensibilité

- Architecture modulaire avec moteur de règles séparé
- Modèle de données pour règles et paramètres
- Interface utilisateur pour configurer les règles
- Système de gestion des conflits entre règles

## Gestion des cas complexes

### Conflits de règles

Pour résoudre les conflits entre règles contradictoires, nous suivrons cette logique de priorité :

1. Priorité explicite définie dans le modèle de règle
2. Indisponibilités et congés (absolus)
3. Contraintes réglementaires (repos après garde)
4. Règles locales (espacement gardes)
5. Préférences d'équité

### Gestion des exceptions

L'algorithme détectera et signalera les situations exceptionnelles définies par les règles :

- Supervision de 3+ salles (si autorisé par une règle)
- Gardes rapprochées (<7 jours)
- Plusieurs consultations consécutives
- Autres exceptions définies dynamiquement

### Ajustements manuels

Après génération automatique, l'interface permettra :

- Modifications ponctuelles avec vérification des règles
- Échanges de gardes entre médecins
- Verrouillage de certaines affectations pour futures générations
- Dérogations explicites à certaines règles avec journalisation

## Tests et validation

### Jeux de tests

Création de scénarios de test :

- Effectifs complets / réduits
- Périodes de congés multiples
- Situations complexes de charge opératoire
- Vérification automatisée des règles
- Tests unitaires du moteur de règles
- Tests d'intégration de l'algorithme complet

### Mesures de qualité

Métriques pour évaluer la qualité du planning généré :

- Écart-type des gardes par médecin
- Pourcentage de situations exceptionnelles
- Respect des préférences
- Équité de répartition des spécialités
- Conformité aux règles définies

## Évolutions futures

### V1.1 - Apprentissage des préférences

Adaptation de l'algorithme selon l'historique :

- Analyse des modifications manuelles fréquentes
- Ajustement des poids du scoring
- Détection des préférences implicites
- Suggestion de nouvelles règles basées sur l'historique

### V1.2 - Optimisation avancée

- Algorithmes génétiques pour optimisation globale
- Propagation de contraintes
- Simulation de Monte-Carlo pour tester robustesse
- Optimisation multi-objectifs avec poids configurables

### V2.0 - Intelligence artificielle

- Apprentissage automatique pour prédiction des besoins
- Anticipation des congés/absences probables
- Optimisation multi-objectifs avancée
- Adaptation autonome des règles selon résultats

## Conclusion

L'algorithme proposé combine une approche par règles configurables et optimisation incrémentale pour générer des plannings équitables et conformes. Sa conception modulaire avec un moteur de règles dynamiques permettra des évolutions progressives et l'adaptation aux retours utilisateurs sans nécessiter de modifications du code source pour chaque changement de règle métier.