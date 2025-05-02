# Documentation Technique Mathildanesth

## Table des matières
1. [Architecture de la base de données](#architecture-de-la-base-de-données)
2. [Structure du projet](#structure-du-projet)
3. [Gestion des données de seeding](#gestion-des-données-de-seeding)
4. [Workflow Git](#workflow-git)
5. [Procédures de maintenance](#procédures-de-maintenance)

## Architecture de la base de données

### Modèle de données principal

Le système utilise une base de données PostgreSQL avec Prisma comme ORM. Les principales entités sont :

#### Utilisateurs et Rôles
- `User` : Utilisateurs du système
  - Rôles : ADMIN_TOTAL, ADMIN_PARTIEL, USER
  - Rôles professionnels : MAR, IADE, SECRETAIRE
  - Gestion des préférences d'affichage
  - Gestion des patterns de travail

#### Gestion des congés
- `Leave` : Congés des utilisateurs
- `LeaveTypeSetting` : Configuration des types de congés
- Statuts : PENDING, APPROVED, REJECTED, CANCELLED

#### Planning et affectations
- `OperatingRoom` : Salles d'opération
- `OperatingSector` : Secteurs opératoires
- `Assignment` : Affectations des utilisateurs
- `Duty` : Gardes
- `OnCall` : Astreintes

#### Chirurgiens et spécialités
- `Surgeon` : Chirurgiens
- `Specialty` : Spécialités médicales
- `SurgeonPreference` : Préférences des chirurgiens

### Relations importantes

1. **Utilisateurs et Rôles**
   - Un utilisateur a un rôle principal (ADMIN_TOTAL, ADMIN_PARTIEL, USER)
   - Un utilisateur a un rôle professionnel (MAR, IADE, SECRETAIRE)
   - Les rôles professionnels ont des préférences d'affichage

2. **Gestion des congés**
   - Un utilisateur peut avoir plusieurs congés
   - Chaque congé a un type et un statut
   - Les types de congés ont des règles spécifiques

3. **Planning**
   - Les salles d'opération appartiennent à des secteurs
   - Les affectations lient utilisateurs, dates et lieux
   - Les gardes et astreintes sont liées aux utilisateurs

## Niveaux de sévérité des règles

### Structure et compatibilité

Le système utilise une énumération `RuleSeverity` qui maintient la compatibilité avec différents contextes :

```typescript
export enum RuleSeverity {
    // Sévérités principales
    ERROR = 'error',    // Erreur critique, ne peut pas être contournée
    WARNING = 'warning', // Avertissement, peut être contourné avec justification
    INFO = 'info',      // Information, peut être ignorée

    // Alias pour la compatibilité avec l'ancien code
    CRITICAL = ERROR,   // Alias pour ERROR
    MAJOR = WARNING,    // Alias pour WARNING
    MINOR = INFO,       // Alias pour INFO

    // Alias pour la compatibilité avec Prisma
    HIGH = ERROR,       // Alias pour ERROR
    MEDIUM = WARNING,   // Alias pour WARNING
    LOW = INFO         // Alias pour INFO
}
```

### Utilisation dans différents contextes

1. **Base de données (Prisma)**
   - Utilise ERROR, WARNING, INFO
   - Stocké dans la table `RuleConflict`
   - Utilisé pour la persistance des conflits

2. **Interface utilisateur**
   - Utilise error, warning, info (en minuscules)
   - Affiché dans le composant `RuleViolationIndicator`
   - Définit les couleurs et styles d'affichage

3. **Logique métier**
   - Utilise les sévérités principales (ERROR, WARNING, INFO)
   - Évalué dans le service `RuleEvaluationService`
   - Utilisé pour le calcul des scores de fatigue

### Fonctions utilitaires

```typescript
// Conversion depuis Prisma
export function fromPrismaSeverity(severity: 'LOW' | 'MEDIUM' | 'HIGH'): RuleSeverity {
    switch (severity) {
        case 'LOW': return RuleSeverity.LOW;
        case 'MEDIUM': return RuleSeverity.MEDIUM;
        case 'HIGH': return RuleSeverity.HIGH;
        default: return RuleSeverity.WARNING;
    }
}

// Conversion vers Prisma
export function toPrismaSeverity(severity: RuleSeverity): 'LOW' | 'MEDIUM' | 'HIGH' {
    switch (severity) {
        case RuleSeverity.LOW:
        case RuleSeverity.INFO:
            return 'LOW';
        case RuleSeverity.MEDIUM:
        case RuleSeverity.WARNING:
            return 'MEDIUM';
        case RuleSeverity.HIGH:
        case RuleSeverity.ERROR:
            return 'HIGH';
        default:
            return 'MEDIUM';
    }
}

// Obtention des couleurs d'affichage
export function getSeverityColor(severity: RuleSeverity): string {
    switch (severity) {
        case RuleSeverity.ERROR:
        case RuleSeverity.CRITICAL:
        case RuleSeverity.HIGH:
            return '#ff4d4f'; // Rouge
        case RuleSeverity.WARNING:
        case RuleSeverity.MAJOR:
        case RuleSeverity.MEDIUM:
            return '#faad14'; // Orange
        case RuleSeverity.INFO:
        case RuleSeverity.MINOR:
        case RuleSeverity.LOW:
            return '#1890ff'; // Bleu
        default:
            return '#1890ff';
    }
}
```

### Bonnes pratiques

1. **Nouveau code**
   - Utiliser les sévérités principales (ERROR, WARNING, INFO)
   - Éviter l'utilisation directe des alias
   - Utiliser les fonctions de conversion pour la compatibilité

2. **Migration**
   - Pour le nouveau code : utiliser ERROR, WARNING, INFO
   - Pour la compatibilité : utiliser les fonctions de conversion
   - Documenter les changements de sévérité

3. **Affichage**
   - Utiliser les couleurs standardisées
   - Maintenir la cohérence visuelle
   - Adapter l'affichage selon le contexte

### Exemples d'utilisation

```typescript
// Évaluation d'une règle
const result = ruleEvaluationService.evaluateRule(rule, context);
if (result.severity === RuleSeverity.ERROR) {
    // Gérer l'erreur critique
}

// Affichage d'une violation
const violation = {
    severity: RuleSeverity.WARNING,
    message: "Intervalle trop court entre gardes"
};
const color = getSeverityColor(violation.severity);

// Conversion pour la base de données
const prismaSeverity = toPrismaSeverity(RuleSeverity.ERROR);
```

## Structure du projet

```
Mathildanesth/
├── prisma/
│   ├── migrations/     # Migrations de la base de données
│   ├── seed_data/     # Données de seeding (ignoré par Git)
│   └── schema.prisma  # Schéma de la base de données
├── src/
│   ├── app/          # Routes et pages Next.js
│   ├── components/   # Composants React réutilisables
│   ├── modules/      # Modules métier
│   └── lib/          # Utilitaires et configurations
├── examples/         # Exemples de fichiers et configurations
└── documentation/    # Documentation du projet
```

## Gestion des données de seeding

### Format des fichiers CSV

Les fichiers CSV doivent suivre ces règles :
1. Utiliser des guillemets doubles pour les valeurs contenant des caractères spéciaux
2. Pour les valeurs JSON, utiliser le format avec doubles guillemets : `{""key"": "value"}`
3. Les clés étrangères doivent être des identifiants numériques

### Exemples de fichiers

Des exemples de fichiers sont disponibles dans `examples/seed_data/` :
- `users.example.csv` : Structure des utilisateurs
- `surgeons.example.csv` : Structure des chirurgiens
- `operating_rooms.example.csv` : Structure des salles
- `leave_types.example.csv` : Structure des types de congés

### Procédure de seeding

1. Vérifier que les fichiers CSV suivent le format correct
2. Exécuter `npx prisma db seed`
3. Vérifier les logs pour s'assurer que toutes les données sont importées

## Workflow Git

### Branches
- `main` : Branche principale
- `develop` : Branche de développement
- `feature/*` : Branches pour les nouvelles fonctionnalités
- `hotfix/*` : Branches pour les corrections urgentes

### Commits
Format des messages de commit :
- `feat:` pour les nouvelles fonctionnalités
- `fix:` pour les corrections de bugs
- `docs:` pour la documentation
- `refactor:` pour les refactorisations
- `test:` pour les tests
- `chore:` pour les tâches de maintenance

### Procédure de contribution
1. Créer une branche depuis `develop`
2. Développer la fonctionnalité
3. Créer une Pull Request
4. Code review
5. Merge dans `develop`
6. Tests
7. Merge dans `main`

## Procédures de maintenance

### Base de données
1. **Backup**
   - Sauvegarder régulièrement la base de données
   - Conserver les backups dans un endroit sécurisé

2. **Migrations**
   - Créer des migrations pour chaque modification du schéma
   - Tester les migrations avant de les appliquer
   - Avoir un plan de rollback

3. **Seeding**
   - Maintenir les fichiers de seeding à jour
   - Tester le seeding sur une base de données propre
   - Vérifier les relations après le seeding

### Application
1. **Dépendances**
   - Mettre à jour régulièrement les dépendances
   - Vérifier la compatibilité
   - Tester après chaque mise à jour

2. **Performance**
   - Monitorer les performances
   - Optimiser les requêtes
   - Vérifier l'utilisation des ressources

3. **Sécurité**
   - Mettre à jour les packages de sécurité
   - Vérifier les permissions
   - Auditer régulièrement le code

### Déploiement
1. **Environnements**
   - Développement
   - Staging
   - Production

2. **Procédure**
   - Tests automatisés
   - Déploiement progressif
   - Monitoring
   - Rollback plan

## Résolution des problèmes courants

### Base de données
1. **Erreurs de migration**
   - Vérifier le schéma Prisma
   - Vérifier les dépendances
   - Utiliser `prisma migrate reset` si nécessaire

2. **Problèmes de seeding**
   - Vérifier le format des fichiers CSV
   - Vérifier les relations
   - Vérifier les logs

### Application
1. **Erreurs de build**
   - Vérifier les dépendances
   - Vérifier la configuration
   - Nettoyer le cache

2. **Problèmes de performance**
   - Vérifier les requêtes
   - Vérifier l'indexation
   - Vérifier le cache

## Contacts et support

- **Développeur principal** : [Contact]
- **Base de connaissances** : [Lien]
- **Issue tracker** : [Lien]
- **Documentation** : [Lien] 