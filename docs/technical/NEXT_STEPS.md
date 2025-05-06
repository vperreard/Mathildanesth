# Prochaines étapes de développement - Mathildanesth

Ce document présente les prochaines étapes prioritaires de développement pour l'application Mathildanesth, basées sur l'analyse du code actuel, de la roadmap, et des fonctionnalités restant à implémenter.

## État actuel (Mai 2025)

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
  - **Découplage Client/Serveur:** Refactorisation des services (`PlanningService`, `SyncService`) et hooks (`useDragDropSync`) pour utiliser des appels API (`fetch`) au lieu d'importer directement du code serveur, résolvant l'erreur `pg package manually`.
  - **API Routes (Partiel):** Création des routes `GET /api/assignments` et `GET /api/public-holidays`.

- ✅ **Tests end-to-end**
  - Tests fonctionnels pour les parcours critiques
  - Tests d'accessibilité avec cypress-axe et pa11y
  - Tests de performance avec lighthouse
  - Tests de compatibilité pour différentes tailles d'écran

### Modules en cours

- 🔄 **Module de planification du bloc opératoire (MVP)**
  - Définition des salles et secteurs
  - Règles de supervision simples
  - Interface de planning bloc V1

- 🔄 **Module de règles dynamiques (MVP)**
  - Interface administrateur simple (CRUD)
  - Moteur pour règles de base

- 🔄 **API Routes Backend:** Implémentation des routes serveur pour la sauvegarde (`PATCH /api/assignments`) et la validation (`POST /api/assignments/validate`) des affectations nécessaires pour le calendrier draggable.

## Priorités immédiates (Juin 2025)

### 1. Finalisation du module bloc opératoire (Haute priorité)

- [x] **Composants de définition des salles et secteurs** (Partiellement complété)
  - ✅ Interface de création et modification des salles d'opération (`src/app/admin/bloc-operatoire/components/OperatingRoomForm.tsx`)
  - ✅ Interface de création et modification des secteurs opératoires (`src/app/admin/bloc-operatoire/components/OperatingSectorForm.tsx`)
  - ✅ Liste des salles avec actions CRUD (`src/app/admin/bloc-operatoire/components/OperatingRoomList.tsx`)
  - ✅ Liste des secteurs avec actions CRUD (`src/app/admin/bloc-operatoire/components/OperatingSectorList.tsx`)
  - ✅ Pages d'administration (`.../salles/page.tsx`, `.../secteurs/page.tsx`)
  - ✅ Hooks React Query pour API (`.../hooks/useOperatingResourceQueries.ts`)
  - 🚧 Association salles-secteurs-spécialités (Formulaires à corriger/compléter)
  - 🚧 Correction des erreurs de type dans les formulaires.
  - 🚧 Remplacement des appels API simulés par les appels réels.
  - 🚧 Remplacement des boutons HTML par les composants UI.

- [ ] **Règles de supervision**
  - Interface de définition des règles de supervision par secteur
  - Système de validation des contraintes de supervision
  - Alertes en cas de non-respect des règles

- [x] **Interface planning bloc V1** (Partiellement complété)
  - ✅ Vue calendrier des affectations par salle (`src/app/planning/hebdomadaire/page.tsx`)
  - ✅ **Fonctionnalités de drag-and-drop pour les affectations** (Implémentation initiale complète)
    - ✅ Utilisation de `react-beautiful-dnd` pour le déplacement.
    - ✅ Gestion de l'état temporaire des modifications (`tempAssignments`).
    - ✅ Modale de confirmation affichant les changements et les résultats de validation.
    - ✅ Validation des règles via l'instance réelle de `RuleEngine`.
    - ✅ Persistance des changements groupés via l'API (`POST /api/assignments/batch`).
  - 🚧 **Affinement DND et UI/UX**
    - [ ] Améliorer le feedback visuel pendant le glisser-déposer.
    - [ ] Gérer les cas limites (ex: tentative de dépôt sur un créneau invalide).
    - [ ] Optimiser les performances pour un grand nombre d'assignations.
  - 🚧 Filtres par salle/secteur/chirurgien

- [ ] **Tests et documentation**
  - [x] Tests unitaires et d'intégration (Pour CRUD salles/secteurs)
  - ✅ **Squelette de tests pour DND** (`page.test.tsx` créé avec mocks).
  - 🚧 **Implémentation complète des tests DND**
    - [ ] Développer les scénarios de test dans `page.test.tsx`.
    - [ ] Trouver une stratégie pour simuler efficacement les interactions DND ou tester la logique sous-jacente.
    - 🚧 **Résolution des erreurs linter persistantes** (si non faux positifs).
  - [ ] Documentation utilisateur spécifique au bloc opératoire

### 2. Développement du module de règles dynamiques (Haute priorité)

- [x] **Interface d'administration des règles**
  - ✅ CRUD pour différents types de règles (Fonctionnalité existante ou à développer séparément)
  - ✅ Validation et vérification de cohérence (Implémenté dans `RuleEngineService` et `RuleForm`)
  - ✅ Interface intuitive pour définir les priorités (`RuleForm` mis à jour)

- [x] **Moteur de règles**
  - ✅ Système de validation des règles (Implémenté dans `RuleEngineService` et `RuleForm`)
  - ✅ Détection de conflits entre règles (Implémenté dans `RuleEngineService`, intégration UI à faire)
  - ✅ Mécanisme d'application avec journalisation (Moteur existant + logs ajoutés)

- [x] **Intégration avec l'algorithme de génération**
  - ✅ Prise en compte des règles dynamiques lors de la génération (Intégré dans `RuleBasedPlanningGeneratorService`)
  - [ ] Feedback visuel sur le respect des règles (À améliorer dans l'UI)

### 3. Finalisation API Routes (Priorité Moyenne)

- [x] **Vérification et correction `ApiService` pour `getUserPreferences`**
  - ✅ Modification de `src/config/api.ts` pour que `baseUrl` utilise `'/api'` par défaut, rendant l'appel relatif.
  - ✅ Correction de la méthode HTTP pour `saveUserPreferences` de `POST` à `PUT` dans `src/services/api.ts`.
- [ ] **Implémenter `PATCH /api/assignments`:** Route pour sauvegarder les affectations modifiées depuis le calendrier draggable.
- [ ] **Implémenter `POST /api/assignments/validate`:** Route pour valider un ensemble d'affectations selon les règles serveur.
- [ ] **Vérifier/Compléter `GET /api/assignments`:** S'assurer que la récupération des données depuis la base est bien implémentée.
- [ ] **Vérifier `GET /api/admin/leaves/pending` pour l'erreur 400 et l'URL sur port 3001**
  - L'URL anormale `localhost:3001` nécessite une vérification de la configuration de l'environnement de l'utilisateur (`NEXT_PUBLIC_API_URL`).
  - L'erreur 400 pourrait être liée à un ID utilisateur invalide dans le token/session.

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

- [ ] **Améliorations UX prioritaires**
  - Système de filtrage avancé
  - Feedback visuel amélioré
  - Transitions plus fluides
  
- [ ] **Optimisations de performance**
  - Optimisation des requêtes base de données
  - Système de cache avancé
  - Réduction des rendus inutiles

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

- [x] **Problème de configuration Babel/Module avec Next.js**
  - ✅ Suppression de `"type": "module"` de `package.json`
  - ✅ Retour à la syntaxe CommonJS (`module.exports`) pour `babel.config.js` et `next.config.js`
  - ✅ Suppression du fichier incompatible `babel.config.cjs` (si existant)

- [x] **Conflit `next/font` avec Babel personnalisé**
  - ✅ Désactivation temporaire de `next/font` dans `src/app/layout.tsx` pour permettre l'utilisation de Babel (nécessaire pour les tests `ts-jest`).

- [ ] **Avertissements `Unsupported metadata viewport` Next.js**
  - ✅ Corrigé dans `src/app/layout.tsx`.
  - Le warning pour `/planning/hebdomadaire/layout.tsx` devrait être résolu (configuration déjà correcte).
  - Le warning pour `/parametres/configuration` (lié à `Navigation.tsx`) nécessite une investigation plus poussée si persistant (potentiel conflit `next/router` vs `next/navigation`).

- [x] **Problèmes d'authentification et de gestion des tokens**
  - ✅ Correction de la route API `/api/auth/login` pour prendre en charge à la fois l'authentification par login et par email
  - ✅ Amélioration des logs serveur pour faciliter le débogage des problèmes d'authentification
  - ✅ Correction de la route `/api/auth/me` pour récupérer correctement les informations utilisateur
  - ✅ Ajout d'un utilisateur de test pour faciliter les tests d'authentification
  - ✅ Correction du contexte d'authentification (AuthContext) pour utiliser correctement les cookies HTTP-only

- [x] **Initialisation des données de base**
  - ✅ Exécution du script de seed pour ajouter les données nécessaires à l'application
  - ✅ Import de 20 spécialités chirurgicales
  - ✅ Import de 29 utilisateurs avec leurs rôles professionnels
  - ✅ Import de 70 chirurgiens avec leurs spécialités
  - ✅ Création des secteurs opératoires et des salles d'opération
  - ✅ Configuration des types de congés et des règles de quotas

- [ ] **Calcul des jours ouvrables et jours fériés** (#253)
  - Revoir l'algorithme de calcul des jours ouvrables
  - Intégrer correctement les jours fériés
  - Tests unitaires exhaustifs pour les cas limites

- [ ] **Performance du tableau de bord analytique** (#312)
  - Optimiser les requêtes pour grandes quantités de données
  - Implémenter une stratégie de mise en cache
  - Chargement progressif des données

- [ ] **Erreur Import `DialogClose` (À surveiller)** (#XYZ)
    - L'erreur `Attempted import error: 'DialogClose' is not exported from '@/components/ui'` dans `LeaveManagementPanel.tsx` pourrait être résolue par le nettoyage du cache `.next`. Si elle persiste, investiguer l'import et l'export.

## Améliorations techniques prioritaires

- [ ] **Système de cache pour données fréquemment utilisées**
  - Mise en place d'une stratégie de cache cohérente
  - Cache invalidation intelligente
  - Métriques de performance du cache

- [ ] **Documentation API complète**
  - Documenter toutes les API internes et externes (y compris les nouvelles routes `/api/assignments` et `/api/public-holidays`)
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
  - Refléter les changements récents dans l'architecture (découplage client/serveur, nouvelles API routes)
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

## Tâches récemment terminées

- **[Planning hebdomadaire DND]** Implémentation initiale de la fonctionnalité de glisser-déposer pour les assignations.
  - Intégration de `react-beautiful-dnd`.
  - Gestion de l'état temporaire et modale de confirmation.
  - Validation via `RuleEngine`.
  - Sauvegarde via API (`/api/assignments/batch`).
  - Création du squelette de tests (`page.test.tsx`).

- **[Planning hebdomadaire]** Implémentation des salles d'opération réelles dans le planning hebdomadaire
  - Le planning hebdomadaire utilise maintenant les salles configurées dans "Configuration / Bloc opératoire" au lieu des données hardcodées
  - Ajout d'une fonction `fetchRooms()` pour récupérer les salles depuis l'API `/api/operating-rooms`
  - Fallback vers les données mockées en cas d'erreur de communication avec l'API

## Analyse et Stratégie de Tests

- **Analyse Complète Effectuée (Aujourd'hui) :**
    - Examen des configurations Jest (`jest.config.js`) et Cypress (`cypress.config.ts`).
    - Identification des différentes couches de tests :
        - Unitaires (`src/**/__tests__/`)
        - Intégration (`tests/integration/`, `tests/modules/`)
        - E2E (`cypress/e2e/` par catégorie : auth, planning, calendar, leaves, performance, accessibilité, etc.)
        - Composants (`cypress/component/`)
    - **Stratégie de Débogage Proposée :**
        1. Prioriser les échecs des tests E2E Cypress.
        2. Écrire des tests (E2E, intégration, unitaire) pour reproduire les bugs non couverts.
        3. Utiliser les tests d'intégration et unitaires pour localiser la source des erreurs identifiées par les E2E.
        4. Déboguer de manière ciblée.
        5. Corriger et vérifier avec les tests concernés + suites de non-régression.
        6. Exécuter périodiquement les tests de performance et d'accessibilité.
- **Prochaines Étapes Tests :**
    - Appliquer la stratégie pour corriger les bugs existants.
    - S'assurer que les nouveaux développements incluent une couverture de tests adéquate (unitaire, intégration, E2E si pertinent).
    - Réactiver/corriger les tests d'accessibilité `pa11y` dans `

## Prochaines étapes techniques immédiates

- **✅ Résolution des problèmes de build Next.js :**
    - ✅ Correction du fichier next.config.js pour utiliser la syntaxe ES modules (`export default` au lieu de `module.exports`)
    - ✅ Configuration du port 3000 fixe pour le serveur Next.js
    - ✅ Correction des problèmes de vendor-chunks avec l'option `optimizeCss` et `optimizePackageImports`
    - ✅ Suppression du fichier [...nextauth]/route.ts qui causait des erreurs
    - 🔄 Le warning `Attempted import error: 'isWeekend' is not exported from '@/utils/dateUtils'` reste à corriger

- **✅ Réparer les tests Cypress `quota-management.spec.ts` :**
    - ✅ Correction de l'API login pour détecter les requêtes Cypress et utiliser la base de données de test
    - ✅ Modification des tests pour vérifier l'authentification et l'accès à la page des congés
    - ✅ Création d'un script `scripts/run-cypress-tests.sh` pour exécuter les tests dans un environnement propre
    - 🔄 La fonction `isWeekend` manquante dans `@/utils/dateUtils` doit être corrigée
    - 🔄 Réactiver et corriger les autres tests un par un

- **Prochaines corrections :**
    - Ajouter la fonction `isWeekend` dans le fichier `src/utils/dateUtils.ts`
    - Corriger les problèmes d'importation dans les composants comme `LeaveForm.tsx`
    - Réactiver les autres tests Cypress désactivés
    - Mettre à jour les versions de dépendances critiques (notamment Next.js)

## Stabilisation des tests

### Problèmes identifiés
- Configuration de Jest pour les fichiers JSX/TSX non fonctionnelle
- Erreurs dans les tests unitaires existants
- Mocks obsolètes ou incorrects (axios, EventBus, WebSocket, etc.)

### Actions à entreprendre
1. **Configuration de Jest et Babel**
   - Mettre à jour la configuration de Babel pour le support JSX/React
   - Modifier la configuration Jest pour mieux gérer les imports de modules
   - Ajouter des transformations pour les fichiers CSS et autres ressources

2. **Correction des mocks**
   - Mettre à jour les mocks pour axios, socket.io et autres dépendances externes
   - Standardiser l'approche de mocking dans tous les tests

3. **Correction des tests unitaires**
   - Mettre à jour les tests unitaires pour utiliser les dernières versions des API
   - Corriger les assertions incorrectes

4. **Mise en place d'une CI robuste**
   - Ajouter une étape de validation dans le workflow CI pour les tests unitaires
   - Créer des tests de référence pour chaque module principal

Une fois ces actions complétées, nous pourrons progressivement améliorer la couverture de tests et assurer la stabilité de l'application.