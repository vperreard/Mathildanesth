# Prochaines étapes de développement - Mathildanesth

Ce document présente les prochaines étapes prioritaires de développement pour l'application Mathildanesth, basées sur l'analyse du code actuel, de la roadmap, et des fonctionnalités restant à implémenter.

## État actuel (Juin 2025)

### Modules complétés

- ✅ **Système de gestion des congés**
  - Validation des demandes
  - Gestion des quotas
  - Système de notifications
  - Détection et gestion des conflits
  - Recommandations automatiques pour résolution des conflits
  
- ✅ **Intégration entre modules**
  - Bus d'événements pour communication inter-modules
  - Service d'audit pour journalisation des actions sensibles
  - Système de permissions granulaires

- ✅ **Système de trames de planning**
  - Éditeur visuel pour les trames de planification
  - Configuration des postes et affectations
  - Duplication et exportation des trames
  
- ✅ **Module Calendar**
  - Composants optimisés et responsive
  - Performances améliorées
  - Support multi-dispositifs

- ✅ **Tests end-to-end**
  - Tests fonctionnels pour les parcours critiques
  - Tests d'accessibilité avec cypress-axe et pa11y
  - Tests de performance avec lighthouse
  - Tests de compatibilité pour différentes tailles d'écran

- ✅ **Service de génération de planning**
  - Gestion améliorée des gardes consécutives
  - Support des shifts multiples dans la même journée
  - Compatibilité avec les interfaces User complètes
  - Tests d'intégration robustes
  
- ✅ **Documentation consolidée**
  - Fusion des documentations mathildanesth et MATHILDA
  - Structure organisée et hiérarchique
  - Documentation technique et fonctionnelle unifiée
  - Base documentaire évolutive pour le développement futur

### Modules en cours

- 🔄 **Module de planification du bloc opératoire (MVP)**
  - Définition des salles et secteurs
  - Règles de supervision simples
  - Interface de planning bloc V1

- 🔄 **Module de règles dynamiques (MVP)**
  - Interface administrateur simple (CRUD)
  - Moteur pour règles de base

## Priorités immédiates (Juin 2025)

### 1. Finalisation du module bloc opératoire (Haute priorité)

- [x] **Composants de définition des salles et secteurs**
  - ✓ Interface de création et modification des salles d'opération
  - ✓ Configuration des secteurs opératoires
  - ✓ Association salles-secteurs-spécialités
  - ✓ Hooks React Query pour la gestion des données
  - ✓ API simulée pour le développement et les tests
  - ✓ Pages d'administration dédiées (/admin/bloc-operatoire/salles et /admin/bloc-operatoire/secteurs)

- [x] **Règles de supervision**
  - ✓ Interface de définition des règles de supervision par secteur
  - ✓ Configuration des conditions de supervision (max salles, supervision interne, etc.)
  - ✓ Gestion des priorités et des exceptions
  - ✓ Page d'administration (/admin/bloc-operatoire/regles-supervision)
  - ✓ Implémentation des services et hooks React Query

- [ ] **Interface planning bloc V1**
  - Vue calendrier des affectations par salle
  - Fonctionnalités de drag-and-drop pour les affectations
  - Filtres par salle/secteur/chirurgien

- [ ] **Tests et documentation**
  - Tests unitaires et d'intégration
  - Documentation utilisateur spécifique au bloc opératoire

### 2. Développement du module de règles dynamiques (Haute priorité)

- [x] **Structure de base du module**
  - Types et interfaces pour les règles
  - Service du moteur de règles (basique)
  - Service API (`src/modules/dynamicRules/services/api.ts`)

- [x] **Interface d'administration des règles (MVP)**
  - CRUD pour les champs principaux des règles (Nom, Description, Type, Priorité, Statut)
  - Composant liste (`src/modules/dynamicRules/components/RuleList.tsx`)
  - Composant formulaire (`src/modules/dynamicRules/components/RuleForm.tsx`)
  - Page d'administration (`src/app/admin/schedule-rules/page.tsx`)
  - Validation de base et notifications toast
  - Tests unitaires pour le formulaire (`src/modules/dynamicRules/components/__tests__/RuleForm.test.tsx`)

- [ ] **Moteur de règles avancé**
  - Système de validation des règles
  - Détection de conflits entre règles
  - Mécanisme d'application avec journalisation
  - **Prochaine étape :** Implémenter un éditeur visuel simple pour Conditions/Actions dans `RuleForm`.

- [ ] **Intégration avec l'algorithme de génération**
  - Prise en compte des règles dynamiques lors de la génération
  - Feedback visuel sur le respect des règles

### 3. Documentation et gestion des connaissances (Nouvelle priorité haute)

- [x] **Consolidation de la documentation technique**
  - ✓ Création du dossier `docs-consolidated` avec structure hiérarchique
  - ✓ Documentation centralisée des modules clés
  - ✓ Unification des approches de mathildanesth et MATHILDA

- [ ] **Complétion de la documentation manquante**
  - Documentation détaillée de l'algorithme de génération de planning
  - Documentation des interfaces utilisateur avec captures d'écran
  - Diagrammes d'architecture et de flux de données

- [ ] **Guides pour nouveaux développeurs**
  - Guide d'onboarding et de prise en main
  - Documentation des standards de code et conventions
  - Tutoriels pour les composants et modules principaux

- [ ] **Maintenance de la documentation**
  - Processus d'actualisation régulière de la documentation
  - Vérification de la cohérence avec le code source
  - Mise à jour des statuts et prochaines étapes

### 4. Gestion des indisponibilités et validations (Priorité moyenne)

- [ ] **Système d'indisponibilités utilisateurs**
  - Interface de saisie des indisponibilités
  - Validation et approbation des indisponibilités
  - Intégration avec le calendrier et le planning

- [ ] **Interface de validation/modification manuelle des plannings**
  - Tableau de bord pour validation des plannings générés
  - Historique des modifications
  - Système de commentaires et annotations

### 5. Améliorations UX et optimisations (Priorité moyenne)

- [x] **Améliorations UX prioritaires**
  - ✓ Système de filtrage avancé réutilisable (`AdvancedFilter.tsx`)
  - ✓ Transitions fluides pour améliorer le feedback visuel (`transitions/index.ts`)
  - ✓ Optimisation des rendus React
  
- [x] **Optimisations de performance**
  - ✓ Service de cache cohérent pour données fréquemment utilisées (`CacheService.ts`)
  - ✓ Hook optimisé pour requêtes API avec mise en cache (`useOptimizedQuery.ts`)
  - ✓ Réduction des rendus inutiles grâce aux mémoïsations
  - [x] Amélioration du lazy loading des composants
    - `src/components/dashboard/widgets/ChartWidget.tsx` via `src/components/dashboard/DashboardGrid.tsx`
    - `src/modules/leaves/components/LeaveForm.tsx` via `src/app/leaves/page.tsx`
  - [ ] Mise en place d'un service de prefetching pour les données critiques

- [ ] **Retours utilisateurs**
  - Améliorer le feedback visuel lors des interactions
  - Réduire les temps de réponse perçus
  - Implémenter un système robuste de gestion d'erreurs UI

- [ ] **Tests de performance**
  - Mise en place de métriques Web Vitals
  - Lighthouse CI pour suivi continu des performances
  - Tests automatisés de performance avec Playwright

## Objectifs à moyen terme (T3-T4 2025)

### 1. Système de remplacements et gestion des imprévus

- [ ] **Interface dédiée pour les imprévus**
  - Workflow de notification et remplacement
  - Système de proposition automatique de remplaçants
  - Règles de priorité pour les remplacements

- [ ] **Intégration avec notifications**
  - Alertes en temps réel pour les personnes concernées
  - Suivi des acceptations/refus de remplacement
  - Escalade automatique si nécessaire

### 2. Tableau de bord analytique

- [ ] **Indicateurs clés de performance**
  - Répartition des heures de travail
  - Taux de remplacement
  - Respect des contraintes de planning

- [ ] **Visualisations interactives**
  - Graphiques de tendances
  - Tableaux comparatifs
  - Filtres temporels et par service

### 3. Adaptation responsive complète

- [ ] **Optimisation mobile de toutes les interfaces**
  - Layout adaptatif à toutes les tailles d'écran
  - Contrôles tactiles optimisés
  - Performance mobile améliorée

- [ ] **Adaptation des fonctionnalités pour usage mobile**
  - Workflows simplifiés pour mobile
  - Accès rapide aux actions fréquentes
  - Synchronisation hors-ligne basique

### 4. Module de gestion des quotas avancé

- [ ] **Système de transfert de quotas**
  - Interface pour transfert entre types de congés
  - Règles et contraintes configurables
  - Historique et audit des transferts

- [ ] **Gestion des reports annuels**
  - Configuration des règles de report
  - Calcul automatique des reports
  - Notifications de soldes et dates limites

## Bugs critiques à corriger

- [ ] **Calcul des jours ouvrables et jours fériés** (#253)
  - Revoir l'algorithme de calcul des jours ouvrables
  - Intégrer correctement les jours fériés
  - Tests unitaires exhaustifs pour les cas limites

- [ ] **Performance du tableau de bord analytique** (#312)
  - Optimiser les requêtes pour grandes quantités de données
  - Implémenter une stratégie de mise en cache
  - Chargement progressif des données

## Améliorations techniques prioritaires

- [ ] **Système de cache pour données fréquemment utilisées**
  - Mise en place d'une stratégie de cache cohérente
  - Cache invalidation intelligente
  - Métriques de performance du cache

- [ ] **Documentation API complète**
  - Documenter toutes les API internes et externes
  - Exemples d'utilisation pour chaque endpoint
  - Tests automatisés de la documentation

- [ ] **Refactoring du module Dashboard avec React Query**
  - Conversion des requêtes data vers React Query
  - Optimisation des visualisations
  - Amélioration de la réactivité de l'interface

- [ ] **Migration vers Next.js 13 avec App Router**
  - Plan de migration progressif
  - Adaptation des composants existants
  - Tests de régression pour garantir la stabilité

## Tests et qualité

- [ ] **Extension de la couverture de tests unitaires**
  - Atteindre 80% de couverture pour tous les modules
  - Tests spécifiques pour les règles métier complexes
  - Tests de performance pour les fonctionnalités critiques

- [ ] **Mise en place de Lighthouse CI**
  - Intégration dans le workflow GitHub Actions
  - Seuils de performance, accessibilité et bonnes pratiques
  - Rapports automatisés de régression

- [ ] **Tests d'intégration pour nouveaux modules**
  - Tests pour le module bloc opératoire
  - Tests pour le module de règles dynamiques
  - Tests pour le système d'indisponibilités

## Documentation

- [ ] **Guide utilisateur détaillé pour bloc opératoire**
  - Workflows spécifiques documentés
  - Cas d'utilisation et exemples
  - FAQ basée sur les retours initiaux

- [ ] **Documentation technique des nouveaux modules**
  - Architecture du module de règles dynamiques
  - Flow de données du module bloc opératoire
  - Diagrammes d'interaction entre modules

- [ ] **Mise à jour de la documentation existante**
  - Refléter les changements récents dans l'architecture
  - Nouveaux patterns et bonnes pratiques
  - Exemples de code mis à jour

## Plan d'action à long terme (2026)

- **Application mobile native (React Native)**
  - Fonctionnalités prioritaires pour mobile
  - Support hors-ligne
  - Notifications push

- **Algorithme avancé de génération des plannings**
  - Optimisation multi-objectifs
  - Apprentissage des préférences implicites
  - Améliorations basées sur le feedback utilisateur

- **Intégrations avec les systèmes hospitaliers**
  - Connecteurs pour systèmes RH
  - Intégration avec outils de planification chirurgicale
  - API publique pour extensions tierces

## Notes

Ce document sera révisé mensuellement pour refléter l'avancement du projet et l'évolution des priorités. La prochaine mise à jour majeure est prévue pour fin juin 2025.

*Dernière mise à jour : Juin 2025*

*   **(P1)** ✅ Mise en place/Refactorisation d'un système de validation des dates robuste et centralisé.
-   ✓ Correction du hook `useDateValidation` pour alignement avec `useErrorHandler` et correction de la signature et des props d'erreur. 

## Améliorations récentes (Juin 2025)

### Correction du bug de SessionProvider dans le module des congés (Juin 2025)

- **Récemment achevé ✅**
  - Identification et correction d'une erreur critique dans le module de congés : `Error: [next-auth]: useSession must be wrapped in a <SessionProvider />`
  - Ajout du composant `SessionProvider` de next-auth/react dans le fichier `src/app/providers.tsx`
  - Suppression du `SessionProvider` redondant au niveau de la page `src/app/leaves/page.tsx` qui créait des conflits
  - Corrections des propriétés des composants pour respecter les interfaces TypeScript
  - Structure de l'authentification maintenant plus robuste pour l'ensemble de l'application

### Implémentation du thème sombre (dark mode) avec préservation des dégradés élégants (Mai 2025)

- **Récemment achevé ✅** 
  - Configuration de Tailwind avec `darkMode: 'class'` dans `tailwind.config.js`.
  - Création d'un contexte `ThemeContext` avec un `ThemeProvider` pour gérer l'état du thème.
  - Intégration du `ThemeProvider` dans `src/app/layout.tsx`.
  - Développement d'un composant `ThemeSwitcher` avec icônes soleil/lune pour alterner entre les thèmes.
  - Ajout du `ThemeSwitcher` dans le `Header` et le menu utilisateur `UserProfile`.
  - Ajout de variables CSS personnalisées pour le mode sombre dans `globals.css`.
  - Application complète du thème sombre à tous les composants majeurs tout en préservant le thème clair original avec ses beaux dégradés bleu-violet-rose:
    - Éléments d'interface: boutons, badges, cartes, entrées
    - Navigation et menus
    - En-tête et pied de page
    - Bannières de notifications

## Prochaines étapes prioritaires

### 1. Finalisation du module de gestion des congés récurrents

- **Statut**: En cours
- **Priorité**: Haute
- **Tâches**:
  - Compléter les tests unitaires et d'intégration pour le module de congés récurrents
  - Finaliser l'interface administrateur pour la gestion des congés récurrents
  - Implémenter le système de notification pour les congés récurrents
  - Ajouter une visualisation calendrier pour les congés récurrents

### 2. Optimisation des performances de l'application

- **Statut**: À faire
- **Priorité**: Haute
- **Tâches**:
  - Réduire le temps de chargement initial des pages principales
  - Optimiser les requêtes API avec la mise en cache
  - Implémenter le chargement progressif des données volumineuses
  - Analyser et corriger les problèmes de rerenders inutiles

### 3. Intégration avec le système de planning hospitalier externe

- **Statut**: À faire
- **Priorité**: Moyenne
- **Tâches**:
  - Développer l'API d'intégration avec le système externe
  - Implémenter la synchronisation bidirectionnelle des plannings
  - Gérer les conflits de planning entre les deux systèmes
  - Tester l'intégration dans un environnement de préproduction

## Bugs et problèmes connus

- Problème d'affichage des graphiques dans le dashboard sur certains navigateurs mobiles
- Performances ralenties sur les grands ensembles de données dans le module de planning
- Quelques problèmes UI/UX mineurs identifiés dans le module de paramètres administrateur

## Comment contribuer

Pour contribuer au développement de Mathildanesth, veuillez suivre ces étapes:

1. Consultez la documentation technique dans le dossier `/docs/technique/`
2. Vérifiez les issues ouvertes dans le système de gestion de projet
3. Créez une branche par fonctionnalité ou correction
4. Assurez-vous que vos changements respectent les standards de code
5. Soumettez une PR avec une description détaillée de vos modifications 