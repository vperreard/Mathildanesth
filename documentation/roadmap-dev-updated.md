## Roadmap Consolidée Mathildanesth (Avec Priorités P1-P4)

**Objectif Général :** Livrer une application de planning robuste, performante, sécurisée et répondant aux besoins spécifiques de l'équipe d'anesthésie.

---

### Phase 1 : Refactorisation Critique & Fondations Solides (Durée estimée : 3 semaines + 1 tampon)

**Objectif :** Stabiliser la base de code, améliorer la maintenabilité, la performance et la fiabilité des composants et systèmes clés. Poser des fondations saines.

- **(P1)** ✅ Refactorisation du composant `Header`.
- **(P1)** ✅ Mise en place/Refactorisation d'un système de **validation des dates robuste** et centralisé.
- **(P1)** ✅ Amélioration significative de la **gestion globale des erreurs** (logging systématique via `errorLoggingService`, messages utilisateurs clairs, stratégies de récupération, `ErrorBoundary` React).
- **(P1)** ✅ Refactorisation du module/composants `Leaves` (gestion des congés).
- **(P1)** ✅ Finalisation de la logique de validation, décompte et gestion des conflits pour les congés.
- **(P1)** ✅ Implémentation du système proactif d'alerte de conflits potentiels avec détection précoce des périodes à risque.
- **(P1)** ✅ Implémentation du système de trames de planning avec affectations configurables.
- **(P1)** ✅ Système de validation, duplication et exportation des trames.
- **(P1)** ✅ Intégration du module de trames avec le module de planning.
- **(P1)** 🔄 Implémentation de **tests unitaires** (Jest) pour tous les composants/fonctions refactorisés (Objectif couverture ≥ 70%).
  - ✅ Tests unitaires pour `useLeaveQuota` corrigés.
  - ✅ Tests unitaires pour `useRecurringLeaveValidation` (16/17 passant, 1 skipped - cache test).
- **(P1)** 🔄 Refactorisation du module/composants `Calendar`.
  - ✅ **Découplage Client/Serveur:** Refactorisation des services et hooks du calendrier pour utiliser les API routes (`fetch`) au lieu d'importer directement du code serveur.
  - ✅ **API Routes (Base):** Création des routes `GET /api/assignments` et `GET /api/public-holidays`.
  - ✅ **Correction appel `getUserPreferences`**: Modification de `ApiService` et `apiConfig` pour utiliser des URLs relatives, résolvant potentiellement `ERR_CONNECTION_REFUSED`.
  - ✅ **Correction méthode `saveUserPreferences`**: Passage de `POST` à `PUT`.
- **(P1)** 🔄 Division des composants majeurs refactorisés en sous-composants réutilisables et plus simples.
- **(P1)** 🔄 Amélioration de la gestion des états (cohérence, éviter mutations directes, cf. `patterns-antipatterns.md`).
- **(P1)** 🔄 Feedback visuel immédiat pour les interactions utilisateur critiques (chargement, succès, erreur).
- **(P1)** Validation interne (tests utilisateurs, revue de code) et corrections.
- **(P1)** Mise à jour de la documentation technique (`codebase-overview.md`, `data-flow.md`, `docs-consolidated/*`) reflétant l'architecture refactorisée et les nouvelles sections.
- **(P1)** ✅ **Correction des tests `useLeaveQuota` qui échouaient avec `TypeError`.**
  - Mise à jour de `useLeaveQuota.ts` pour accepter correctement les paramètres et calculer les jours.
  - Ajout de mocks `calculateLeaveCountedDays` et ajustements de tests.
- **(P2)** Établir des métriques de performance baseline pour les composants clés.
- **(P3)** Mettre en place/Utiliser **Storybook** pour documenter et tester les composants UI refactorisés.
- **(P3)** Améliorer/Implémenter un système de notification basique pour les actions clés (ex: approbation congé).

**Livrables Clés Phase 1 :** Code base stable, composants clés testés, gestion des congés fonctionnelle, documentation technique à jour (incluant `docs-consolidated/01_Architecture_Generale`, `docs-consolidated/03_Guides_Developpement` et `docs-consolidated/02_Fonctionnalites`), base solide pour les fonctionnalités.

---

### Phase 2 : Planification MVP & Fonctionnalités Prioritaires (Durée estimée : 2 mois + 2 semaines tampon)

**Objectif :** Livrer un premier module de planification fonctionnel (gardes/astreintes), incluant les règles de base, la gestion des remplacements et un premier algorithme, ainsi que des outils d'analyse basiques.

- **(P1)** Développement du module de **règles dynamiques (MVP)** :
  - ✅ Structure de base avec types et interfaces (Vérifiée et nettoyée)
  - ✅ Service du moteur de règles implémenté (`RuleEngineService` existant)
  - ✅ Validation des règles (Moteur + `RuleForm`)
  - ✅ Détection des conflits (Moteur, TODO: intégration UI)
  - ✅ Mécanisme d'application et journalisation (Moteur + Logs générateur)
  - ✅ Intégration avec générateur de planning (`RuleBasedPlanningGeneratorService` mis à jour)
  - ✅ Service API pour CRUD (Existant ou à faire)
  - ✅ Interface admin simple (`RuleForm` mis à jour, `RuleList` à faire/vérifier)
  - [ ] Feedback visuel sur respect des règles dans UI planning (À faire)
  - [ ] Amélioration éditeur Conditions/Actions dans `RuleForm` (À faire)
- **(P1)** Implémentation de la gestion des **indisponibilités** utilisateurs.
- **(P1)** Interface de **validation/modification manuelle** des plannings.
- **(P1)** Développement d'un système de **remplacements** / gestion des imprévus.
- **(P1)** Développement de l'**algorithme de génération** des plannings (Version 1, focus sur règles de base).
- **(P1)** Tests d'intégration des règles et de l'algorithme.
- **(P1)** Lancement d'une **phase Bêta** avec utilisateurs clés et collecte structurée des retours.
- **(P1)** Corrections prioritaires basées sur les retours Bêta.
- **(P2)** Mise en place d'un **tableau de bord analytique basique** (ex: répartition heures, taux de remplacement).
- **(P2)** Documentation utilisateur initiale pour les fonctionnalités de planification.
- **(P2)** Gestion détaillée des **profils utilisateurs** (Préférences spécifiques MAR/IADE, temps de travail personnalisé).
- **(P3)** Gestion des **jours fériés** (configurable).
  - ✅ API route `GET /api/public-holidays` implémentée avec calcul local.
- **(P3)** Implémentation d'une fonctionnalité simple d'**échange/permutation** de gardes entre médecins.

**Livrables Clés Phase 2 :** Module planification gardes/astreintes (MVP) opérationnel, Algorithme V1 fonctionnel, Analytics basiques, Version Bêta testée.

---

### Phase 3 : Améliorations UX, Consultations & Collaboration (Durée estimée : 2 mois + 2 semaines tampon)

**Objectif :** Raffiner l'expérience utilisateur, rendre l'application pleinement utilisable sur mobile (web responsive), livrer un MVP du module de consultations et améliorer la collaboration.

- **(P1)** Améliorations **UX prioritaires** :
  - ✅ système de filtrage avancé (`AdvancedFilter.tsx`)
  - ✅ feedback visuel amélioré via transitions fluides (`transitions/index.ts`)
  - ✅ optimisation des requêtes avec hook personnalisé (`useOptimizedQuery.ts`)
  - ✅ mise en cache cohérente des données (`CacheService.ts`)
  - 🔄 recherche performante
  - ✅ Réorganisation du menu principal pour améliorer la clarté de la navigation (déplacement de "Gestion de la fatigue" vers "Panneau de configuration").
- **(P1)** Adaptation **responsive complète** de l'interface web pour une expérience optimale sur tablettes et mobiles.
- **(P2)** Développement du module de **planification des consultations (MVP)** : gestion créneaux, règles répartition simples, intégration planning/congés.
- **(P2)** Tests utilisateurs dédiés aux améliorations UX et au module consultations.
- **(P2)** Vérifications et corrections d'**accessibilité** (WCAG).
- **(P3)** Implémentation de fonctionnalités de **collaboration** : messagerie contextuelle simple, commentaires/annotations sur planning, historique modifications basique.
- **(P3)** Début des vérifications de conformité **RGPD**.
- **(P4)** Mise en place d'un système de **thème** (Clair/Sombre).
  - ✅ Configuration de Tailwind CSS (`darkMode: 'class').
  - ✅ Création du `ThemeContext`, `ThemeProvider` et hook `useTheme`.
  - ✅ Intégration du `ThemeProvider` dans le layout global (`src/app/layout.tsx`).
  - ✅ Création et intégration d'un composant `ThemeSwitcher` dans le `Header`.
  - ✅ Application complète des styles `dark:` aux composants de l'application (boutons, badges, cartes, entrées, navigation, en-tête, pied de page, bannières, modales, etc.).
  - ✅ Optimisation des transitions de thème et support du focus, survol et états actifs en mode sombre.
- **(P4)** Implémentation de l'authentification **2FA** (si non faite avant et si jugée nécessaire à ce stade).

**Livrables Clés Phase 3 :** Interface optimisée et responsive, Module consultations (MVP), Documentation utilisateur mise à jour, Thème sombre implémenté.

---

### Phase 4 : Stabilisation et Tests Approfondis

- **Statut :** En cours
- **Objectifs :**
  - Identifier et corriger les bugs restants.
  - Améliorer la couverture de tests.
  - Optimiser les performances.
  - Valider l'accessibilité.
- **Actions récentes :**
  - Analyse détaillée de la structure des tests existants (Unitaires, Intégration, E2E, Composants, Performance, Accessibilité).
  - Définition d'une stratégie de correction des bugs basée sur les tests (priorisation E2E, reproduction par tests, descente dans la pyramide de tests).
  - ✅ **Implémentation initiale du Drag & Drop (DND)** pour les affectations dans le planning hebdomadaire (planning hebdo), incluant intégration RuleEngine et sauvegarde API batch.
  - ✅ **Correction des tests `useLeaveQuota`** (erreurs TypeError dues aux paramètres manquants et à la logique de calcul).
  - ✅ **Stabilisation des tests pour `planning/hebdomadaire/page.test.tsx`** (erreurs `date-fns` et DND).
  - ✅ **Correction des erreurs de Linter et de mock pour `QuotaAdvancedService.test.ts` et `blocPlanningApi.test.ts`** (migration vers MSW v2 `http`, correction des imports et utilisation des mocks).
  - ✅ **Suppression de `SimpleButton.test.tsx`** (composant inexistant).
  - ✅ **Correction partielle des erreurs `toBeInTheDocument`** (via `jest.polyfills.js` et stabilisation de `quotaManagementService.test.ts`, `EventBusService.test.ts`).
  - ✅ **Correction des erreurs de mock dans `quotaManagementService.test.ts`** (gestion de `EventBusService.publish`). Corrigé plus en profondeur par injection de dépendance du EventBusService et modification du constructeur du service. Tous les tests (20/20) passent.
  - ✅ **Correction des erreurs de logique et de timers dans `EventBusService.test.ts`**.
  - 🚧 **Stabilisation des mocks Jest dans `useCalendarEvents.test.tsx`** (erreurs de typage `jest.fn()` et `mockImplementation` largement corrigées, mais des erreurs de linter sur le nombre d'arguments persistent).
  - 🚧 **Investigation bug `react-beautiful-dnd`**: `isDropDisabled must be a boolean` dans les paramètres du planning hebdomadaire. Tentative de correction appliquée (`OperatingRoomsConfigPanel.tsx`).
  - ✅ **Stabilisation des tests unitaires et d'intégration (Jest/MSW)** :
    - Correction `EventBusService.test.ts` (logique, timers, mocks).
    - ✅ `quotaManagementService.test.ts` : Tous les tests passent après correction de l'injection de dépendance EventBus.
    - 🔄 `blocPlanningService.test.ts` : Ajout de la validation des `salleId` inexistantes dans `validateDayPlanning`. Logique pour salles sans superviseurs vérifiée et test correspondant corrigé. Le test échoue toujours (1/24) en exécution normale mais passe avec `.only()`, indiquant un problème d'interférence entre tests à résoudre (isolation via `beforeEach`).
    - ✅ `useDateValidation.test.ts` : Les assertions `mockSetError` ont été corrigées, logique `blackoutPeriods` ajoutée, tests adaptés. Tous les tests (58/58) passent.
    - Migration de `QuotaAdvancedService.test.ts` et `blocPlanningApi.test.ts` vers MSW v2 (`http`).
    - ✅ Amélioration des mocks dans `useCalendarEvents.test.tsx` (typage, `mockImplementation`) et résolution des erreurs de linter sur le nombre d'arguments.
  - ✅ **Module Trames - `EditActivityModal.tsx`** : Reconnexion des spécialités chirurgicales aux données réelles (API `/api/specialties`).
  - ✅ **Module Trames - `BlocPlanningTemplateEditor.tsx`**: Affichage des salles d'opérations réelles (depuis API `/api/operating-rooms`) et utilisation de leur `colorCode` pour le fond des lignes dans la grille.
  - ✅ **Correction `TypeError` dans `LeaveForm.tsx`** : Appel initial de `useLeaveCalculation` corrigé pour inclure `startDate` et `endDate`, résolvant l'erreur `Cannot read properties of undefined (reading 'startDate')`. Un refactoring plus complet du composant est nécessaire pour utiliser pleinement le hook.
  - 🚧 **Tentatives de correction de l'erreur 500 sur `GET /api/leaves/balance`** :
    - ✅ Identification que l'API est gérée par `src/pages/api/leaves/balance.ts` (Pages Router).
    - ✅ Correction de la requête SQL pour sommer `countedDays` au lieu de `workingDaysCount`.
    - ✅ Modification de la requête SQL et du code JS pour utiliser `typeCode` au lieu de `type` pour le groupement et le traitement, afin d'être cohérent avec `defaultAllowances` et les données DB.
    - ✅ Section `LeaveQuotaAdjustment` commentée (table inexistante dans `schema.prisma`).
    - 🚧 **À VÉRIFIER :** Les clés littérales dans `defaultAllowances` (ex: 'CP', 'RTT') dans `balance.ts` doivent correspondre aux `typeCode` de la table `Leave`.
    - 🚧 **À FAIRE :** Réimplémenter la gestion des ajustements de quota (la table `LeaveQuotaAdjustment` étant absente, voir si `QuotaTransfer`, `QuotaCarryOver` ou `LeaveBalance` doivent être utilisés).
    - Ajout de logs, `try...catch` et robustification de la requête SQL `$queryRawUnsafe` dans le handler API (déjà indiqué comme fait précédemment mais confirmé et affiné).
  - ✅ **Correction de l'ordre d'affichage des secteurs opératoires** :
    - ✅ Modification de `src/app/api/operating-sectors/route.ts` pour utiliser le service `BlocPlanningService` qui trie correctement les secteurs par `displayOrder` et par site
    - ✅ Mise à jour de `src/app/parametres/configuration/OperatingRoomsConfigPanel.tsx` pour conserver l'ordre des secteurs tel que retourné par l'API
    - ✅ Refactorisation complète des services `OperatingSectorService` et `OperatingRoomService` pour utiliser le `BlocPlanningService` au lieu de données mockées en mémoire
    - ✅ Correction des routes `/api/operating-rooms` et `/api/operating-rooms/[id]` pour utiliser également `BlocPlanningService`
    - ✅ Modification de la page du planning hebdomadaire pour préserver l'ordre displayOrder des secteurs et salles
    - ✅ **Ajout des fonctionnalités de gestion de l'ordre d'affichage** :
      - ✅ Script `scripts/update-display-order.js` pour initialiser les valeurs `displayOrder` dans la base de données
      - ✅ Boutons "Réorganiser" dans les interfaces de configuration des secteurs et salles
      - ✅ Routes d'API `/api/sectors/reorder` et `/api/operating-rooms/reorder` pour la mise à jour des ordres
  - ✅ **Amélioration de l'ordre d'affichage des secteurs et salles dans le planning hebdomadaire** :
    - ✅ Modification de `src/app/api/operating-rooms/route.ts` pour utiliser le service `BlocPlanningService` avec tri correct par `displayOrder`
    - ✅ Optimisation du code de `src/app/planning/hebdomadaire/page.tsx` pour préserver l'ordre des secteurs et des salles fourni par l'API
    - ✅ Amélioration de la gestion des préférences utilisateur tout en respectant l'ordre par défaut des secteurs et salles
  - ✅ **Implémentation complète du thème sombre** :
    - ✅ Adaptation de tous les composants majeurs pour supporter le thème sombre via les classes Tailwind `dark:`.
    - ✅ Mise à jour de `globals.css` avec des variables CSS pour le mode sombre.
    - ✅ Optimisation des transitions et des états interactifs (focus, hover, active) en mode sombre.
    - ✅ Application cohérente du thème sombre à travers l'application, y compris les bannières, modales et menus déroulants.
- **Prochaines étapes :**
  - Ajouter un bouton « Actualiser » dans l'en-tête du planning hebdomadaire pour déclencher manuellement le rechargement des données.
  - Exécution systématique des suites de tests pour identifier les régressions et les bugs.
  - Application de la stratégie de correction de bugs.
  - Augmentation de la couverture de tests pour les modules critiques ou peu couverts.
  - Correction des tests d'accessibilité (`pa11y`).
  - **Affinement UI/UX et tests complets pour le DND du planning hebdomadaire.**
    - ✅ Implémentation des tests complets pour le drag & drop dans `page.test.tsx`.
    - ✅ Simulation efficace des événements DND via mocks de react-beautiful-dnd.
    - ✅ Tests pour la validation des règles et l'enregistrement des modifications.
    - 🔄 Amélioration visuelle du feedback pendant les opérations de glisser-déposer.
  - **Poursuivre la stabilisation des tests :**
    - [x] Resolver les erreurs de typage dans `planningHooks.integration.test.ts` (Vérifié, les tests passent. Noter l'incohérence `AbortSignal` - voir `NEXT_STEPS.md`).
    - Finaliser la correction des erreurs `toBeInTheDocument` (si encore présentes après les dernières corrections).
    - [x] Corriger les erreurs dans `quotaManagementService.test.ts` (`this.eventBus.publish`) - **FAIT**.
    - [x] Investiguer et résoudre les erreurs de linter restantes dans `useCalendarEvents.test.tsx` (nombre d'arguments résolus).
    - Migrer les tests restants qui pourraient encore utiliser MSW v1 (si `grep` n'a pas tout couvert).
    - 🚧 Résoudre le problème d'interférence des tests dans `blocPlanningService.test.ts`.
  - 🚧 Résoudre l'erreur 500 sur `GET /api/leaves/balance` (investigation manuelle de la requête SQL et du handler API).
    - ✅ Problème principal corrigé (utilisation de `countedDays` et `typeCode`).
    - 🚧 Investigation restante pour les ajustements de quota et validation des `typeCode` dans `defaultAllowances`.
    - 🚧 Terminer le refactoring de `LeaveForm.tsx` pour utiliser correctement `useLeaveCalculation`.

**Livrables Clés Phase 4 :** Module bloc opératoire (MVP+), Application sécurisée et performante, Documentation finale, Utilisateurs clés formés, Application prête pour production.

---

### Phase 5 : Applications Mobiles Natives & Évolutions Futures (Durée estimée : 3 mois + 3 semaines tampon)

**Objectif :** Fournir des applications mobiles natives pour un accès facilité et envisager les évolutions futures et intégrations.

- **(P2)** Développement de l'**application mobile native React Native (MVP)** : consultation planning/congés, notifications push.
- **(P3)** Complétion de l'**application mobile native** : fonctionnalités étendues, mode hors-ligne, optimisations UI/UX mobile.
- **(P3)** **Intégrations** avec d'autres systèmes hospitaliers (si requis et priorisé).
- **(P4)** Fonctionnalités avancées d'Analytics (prédictions, etc.).
- **(P4)** Nouvelles fonctionnalités basées sur les retours post-déploiement.

**Livrables Clés Phase 5 :** Applications mobiles natives (iOS/Android), Intégrations externes (si applicable).

---

### Amélioration Continue (En parallèle de toutes les phases)

- **(P1)** **Corrections de bugs** critiques et bloquants découverts.
  - ✅ Correction des tests `useLeaveQuota` (erreurs TypeError).
  - ✅ Correction des tests `useRecurringLeaveValidation` (16/17 passant, cache test skipped).
  - ✅ Stabilisation des tests `planning/hebdomadaire/page.test.tsx` (erreurs `date-fns` et DND).
  - 🚧 **Investigation bug `react-beautiful-dnd`**: `isDropDisabled must be a boolean` dans les paramètres du planning hebdomadaire. Tentative de correction appliquée (`OperatingRoomsConfigPanel.tsx`).
  - ✅ **Stabilisation des tests unitaires et d'intégration (Jest/MSW)** :
    - Correction `EventBusService.test.ts` (logique, timers, mocks).
    - ✅ `quotaManagementService.test.ts` : Tous les tests passent après correction de l'injection de dépendance EventBus.
    - 🔄 `blocPlanningService.test.ts` : Ajout de la validation des `salleId` inexistantes dans `validateDayPlanning`. Logique pour salles sans superviseurs vérifiée et test correspondant corrigé. Le test échoue toujours (1/24) en exécution normale mais passe avec `.only()`, indiquant un problème d'interférence entre tests à résoudre (isolation via `beforeEach`).
    - ✅ `useDateValidation.test.ts` : Les assertions `mockSetError` ont été corrigées, logique `blackoutPeriods` ajoutée, tests adaptés. Tous les tests (58/58) passent.
    - Migration de `QuotaAdvancedService.test.ts` et `blocPlanningApi.test.ts` vers MSW v2 (`http`).
    - ✅ Amélioration des mocks dans `useCalendarEvents.test.tsx` (typage, `mockImplementation`) et résolution des erreurs de linter sur le nombre d'arguments.
  - ✅ **Module Trames - `EditActivityModal.tsx`** : Reconnexion des spécialités chirurgicales aux données réelles (API `/api/specialties`).
  - ✅ **Module Trames - `BlocPlanningTemplateEditor.tsx`**: Affichage des salles d'opérations réelles (depuis API `/api/operating-rooms`) et utilisation de leur `colorCode` pour le fond des lignes dans la grille.
- **(P1)** **Monitoring** performance et erreurs en continu.
- **(P2)** **Mise à jour régulière de la documentation** technique et utilisateur.
- **(P2)** Extension progressive de la **couverture de tests** unitaires et d'intégration.
- **(P2)** Revue et mise à jour des **dépendances** (sécurité, versions).
- **(P3)** **Optimisations de performance** incrémentales.
- **(P3)** **Améliorations mineures** basées sur les retours continus.
- **(P4)** **Revue régulière des logs** et des métriques d'utilisation.

---

**Note Importante :** Cette roadmap consolidée met fortement l'accent sur la **Phase 1 : Refactorisation Critique**. Il est essentiel de la mener à bien avant de s'engager pleinement dans les phases suivantes pour garantir la qualité et la pérennité du projet. Les durées sont indicatives et la roadmap devrait être revue régulièrement.

**Statut actuel :** Nous avons avancé sur plusieurs tâches de la Phase 1 et commençons à travailler sur le développement du module de planification du bloc opératoire (Phase 4) en parallèle, tout en continuant l'implémentation des tests unitaires et la refactorisation du module Calendar. Le découplage client/serveur a été initié pour le module calendrier.

---

_Dernière mise à jour: Juin 2025 - Implémentation complète du thème sombre et stabilisation du planning hebdomadaire._

#### Intégrations et Améliorations du Bloc Opératoire

- [x] Intégration des données réelles de salles opératoires dans le planning hebdomadaire
- [x] **Implémentation initiale du Drag & Drop (DND)** pour les affectations dans le planning hebdomadaire (avec validation `RuleEngine` et sauvegarde API `batch`)
- [ ] Optimisation du moteur de règles pour le bloc opératoire
- [ ] Gestion améliorée des trames de planning répétitives
- [ ] Affinement UI/UX et tests complets pour le DND du planning

### Tâches Techniques Récentes / Prochaines Étapes

- **Résolution du problème de configuration Babel** ✅
  - Correction du conflit entre `"type": "module"` dans package.json et la configuration Babel
  - Adaptation du fichier `babel.config.js` pour utiliser la syntaxe ES Module
- **Correction du système d'authentification** ✅
  - Résolution des problèmes 401 Unauthorized dans les routes d'API
  - Amélioration des logs serveur pour le débogage de l'authentification
  - Ajout d'un utilisateur de test et correction du flux de connexion
  - Standardisation de la gestion des cookies HTTP-only pour l'authentification
  - Correction de l'utilisation de `cookies()` (passage à `await cookies()`) dans `auth-utils.ts` et les routes API dépendantes
- **Correction des problèmes d'affichage dans le planning hebdomadaire** ✅
  - Résolution de l'erreur de sérialisation dans `/api/user/preferences`
  - Création d'un fichier dédié `defaultConfig.ts` pour les configurations d'affichage
  - Séparation de la configuration statique des composants client pour une meilleure compatibilité serveur
- **Implémentation du thème sombre** ✅
  - Configuration de Tailwind avec `darkMode: 'class'`
  - Création et intégration du système de gestion de thème
  - Application des classes `dark:` à tous les composants majeurs
  - Amélioration de l'accessibilité et des transitions entre les thèmes

### Finalisation de l'implémentation du thème sombre (Juin 2025)

L'implémentation complète du thème sombre représente une avancée significative pour l'accessibilité et l'expérience utilisateur de l'application. Cette fonctionnalité répond à plusieurs enjeux importants :

- **Accessibilité améliorée** : Le mode sombre réduit considérablement la fatigue visuelle lors d'une utilisation prolongée, particulièrement en environnement peu éclairé ou en soirée. Il est spécialement bénéfique pour les utilisateurs souffrant de photophobie ou de sensibilité à la lumière bleue.
- **Optimisation énergétique** : Sur les appareils dotés d'écrans OLED/AMOLED, le mode sombre permet une réduction de la consommation d'énergie allant jusqu'à 20-30%, les pixels noirs consommant significativement moins d'électricité.
- **Ergonomie adaptative** : L'interface s'adapte automatiquement aux préférences système de l'utilisateur via la media query `prefers-color-scheme`, tout en offrant la possibilité de changer manuellement le thème via un bouton dédié dans le header.
- **Transitions fluides** : L'implémentation inclut des transitions douces entre les thèmes pour éviter les changements brusques de luminosité, préservant ainsi le confort visuel lors du basculement.
- **Contraste optimisé** : Tous les éléments d'interface ont été ajustés pour maintenir un ratio de contraste conforme aux normes WCAG 2.1 niveau AA (minimum 4.5:1 pour le texte standard), garantissant la lisibilité pour tous les utilisateurs.

- **Préservation de l'identité visuelle** : Le thème clair conserve les élégants dégradés bleu-violet-rose qui caractérisent l'application, renforçant son identité visuelle distinctive. Cette esthétique soignée se retrouve dans :

  - Les boutons avec dégradés fluides et interaction dynamique
  - Les titres de section avec effet de texte en dégradé (via `bg-clip-text` et `text-transparent`)
  - Les menus de configuration avec transitions douces entre états
  - Les cartes et composants d'interface avec bordures et ombres harmonisées
  - Les éléments interactifs avec retour visuel amélioré (survol, focus, sélection)

- **Nouveaux composants UI** : L'implémentation inclut de nouveaux composants réutilisables comme `SectionTitle`, `CardTitle` amélioré, et une variante de bouton "colorful" avec dégradés, enrichissant la bibliothèque de composants de l'application.

Cette évolution renforce notre engagement à offrir une application inclusive, adaptée aux différents contextes d'utilisation et aux préférences individuelles des utilisateurs, tout en s'alignant sur les meilleures pratiques actuelles en matière d'éco-conception et d'accessibilité numérique.

## Stratégie de stabilisation par les tests

### Objectifs

- Rendre la base de code plus stable
- Faciliter l'identification précoce des régressions
- Assurer la qualité des nouvelles fonctionnalités

### Plan d'action

1. **T1 2026** : Mise à jour de l'infrastructure de test

   - Corriger la configuration de Jest et Babel pour le support JSX/React
   - Mettre à jour les mocks obsolètes
   - Réactiver les tests unitaires essentiels

2. **T2 2026** : Expansion des tests

   - Augmenter la couverture des tests unitaires sur les modules critiques
   - Développer de nouveaux tests d'intégration pour les workflows principaux
   - Ajouter des tests de performance pour les fonctionnalités sensibles

3. **T3 2026** : Automatisation et CI/CD
   - Mettre en place une CI robuste avec validation automatique des tests
   - Implémenter des tests de non-régression automatiques
   - Documenter les procédures de test pour les développeurs

### Priorités

1. Module de gestion des congés (useLeaveQuota, conflictDetection)
2. Générateur de planning et moteur de règles
3. Calendrier et affichage des événements
4. Interface utilisateur et composants partagés

- **Refactorisation du hook useDateValidation** pour corriger la signature de `setError` et la logique de logging d'erreur alignée avec `useErrorHandler`.

## Infrastructure de test

### Amélioration des tests unitaires

- ✅ Configuration de Jest pour les fichiers JSX/TSX
  - Support correct des fichiers .tsx/.jsx
  - Configuration Babel intégrée avec ts-jest
  - Polyfills pour les environnements de test (TextEncoder, TransformStream, etc.)
- ✅ Support de React Hooks et Context dans les tests
  - Tests validés avec useState, useEffect, useContext
  - Structure de fichiers de test pour les composants complexes
- ✅ Déclarations de types pour jest-dom
  - Résolution des erreurs TypeScript liées aux matchers jest-dom (toBeInTheDocument, etc.)
  - Fichier global de déclaration pour une meilleure DX
- ✅ **Mise à jour vers MSW v2 pour les mocks d'API**
  - Migration des handlers globaux (`src/tests/mocks/handlers.ts`) vers `http` et `HttpResponse`.
  - Mise à jour de `src/tests/mocks/server.ts` pour exporter `http`.
  - Migration des tests spécifiques (`QuotaAdvancedService.test.ts`, `blocPlanningApi.test.ts`) pour utiliser `http`.

## Bugs critiques à corriger

- [x] **Correction des tests `useLeaveQuota` qui échouaient avec `TypeError`.**

# Feuille de route de développement - Mise à jour

## Sprint actuel (Juin 2025)

### Corrections et maintenance

- ✅ Correction du parsing des données API dans le planning hebdomadaire
- ✅ Support de différents formats de réponse API pour assurer la compatibilité
- ✅ Correction de l'erreur de tri des salles avec secteurs null/undefined
- ✅ Implémentation complète du thème sombre avec adaptation de tous les composants
- ✅ Optimisation des dégradés bleu-violet-rose sur l'interface en mode clair
- ✅ Création de nouveaux composants UI réutilisables (SectionTitle, CardTitle amélioré)
- ✅ Amélioration des transitions et effets visuels pour une meilleure expérience utilisateur
- ⬜ Corriger les erreurs 401 persistantes sur les endpoints d'API
- ⬜ Corriger les problèmes de performance sur les grands volumes de données

### Nouvelles fonctionnalités

- ⬜ Finalisation de l'export PDF du planning
- ⬜ Intégration des notifications en temps réel
- ⬜ Amélioration de l'interface mobile

## Sprint précédent (Mai 2025)

- ✅ Migration vers Next.js 15.3.1
- ✅ Refactorisation du système d'authentification
- ✅ Séparation de la configuration d'affichage du planning dans un fichier dédié
- ✅ Correction des problèmes de chargement des données du planning
- ✅ Configuration initiale du thème sombre (création du ThemeContext)

## Prochains sprints

- Développement du module de statistiques avancées
- Intégration avec les systèmes hospitaliers externes
- Migration complète vers Typescript pour les modules restants
- Tests automatisés pour les fonctionnalités critiques

## Juin 2025 (Corrections Planning Hebdomadaire)

- ✅ **Planning Hebdomadaire**: Correction de l'erreur `react-beautiful-dnd` ("isDropDisabled must be a boolean") en s'assurant que `isDropDisabled` est toujours un booléen.
- ✅ **Planning Hebdomadaire**: Modification du comportement de mise à jour des dates pour que le rechargement des données ne se fasse que via le bouton "Actualiser" ou au chargement initial, et non plus automatiquement au changement de date dans les sélecteurs.
- ✅ **Thème Sombre**: Implémentation complète du thème sombre à travers l'application avec adaptation des composants, optimisation des transitions et support des états interactifs.

## Mai 2024

- Correction critique : affichage du planning hebdomadaire restauré (normalisation du champ sector dans le mapping des salles, bug JS sur localeCompare résolu)
- Refonte de l'interface du planning hebdomadaire : passage d'un format en cartes à un tableau chronologique structuré avec jours en colonnes et salles/types spéciaux en lignes

## Module Trames de Planning

### Amélioration de l'éditeur de trames de bloc

- **Statut**: En cours
- **Détails**:
  - Correction de bugs d'affichage et améliorations UI dans l'éditeur (`BlocPlanningTemplateEditor.tsx`):
    - Erreur d'hydratation React liée au tableau : Résolue.
    - Erreur de linter pour `toast.info` dans `handleClearTrameAssignments` : Remplacée par `toast` simple.
    - Affichage des indicateurs MAR/IADE : Amélioré pour une meilleure lisibilité ("MI").
    - Style des onglets "Éditer Trame" / "Gérer Affectations (Bloc)" : Amélioré pour un look d'onglet plus traditionnel (correspondant au style de "Configuration / Chirurgiens - Spécialités") et une meilleure indication de l'onglet actif.
    - Bouton "Enregistrer" et espacement des boutons d'action :
      - Le bouton "Enregistrer" est plus visible (variante `default`).
      - L'espacement entre les boutons d'action a été augmenté.
      - Le bouton "Enregistrer" est mis en évidence (bordure verte, ombre, astérisque au libellé) si des modifications sont non sauvegardées (via un nouvel état `hasUnsavedChanges`).
    - **Affichage des salles réelles et couleurs**: Les salles d'opération sont maintenant chargées depuis la base de données (`OperatingRoom.colorCode` utilisé pour le fond des lignes de salle).
  - Investigation sur la résolution des noms du personnel (problème "ID:chir") : En cours, logs ajoutés pour diagnostic.
  - Correction de la modale d'édition d'activité (`EditActivityModal.tsx`):
    - Problème: Champs de formulaire affichés horizontalement, rendant l'interface peu intuitive. Gestion de la sauvegarde "Journée entière" perfectible.
    - Solution: Restructuration complète avec Flexbox vertical, standardisation des styles et largeurs.
    - Améliorations:
      - Ajout de logs de diagnostic pour la construction du nomAffichage.
      - Vérifications supplémentaires des données avant sauvegarde.
      - Titre de la modale dynamique: affiche "MATIN & APRÈS-MIDI" en rouge si "Journée entière" est cochée.
      - Confirmation utilisateur par alerte `window.confirm` avant d'écraser les données de l'autre demi-journée lors d'une sauvegarde "Journée entière".
    - Impact: Interface plus claire et conforme aux standards UX de l'application. Meilleure gestion et prévention des erreurs pour la sauvegarde des journées entières.
  - Correction de la sauvegarde "Journée entière" (`BlocPlanningTemplateEditor.tsx`):
    - Problème: La deuxième sauvegarde (matin ou après-midi) pouvait écraser la première.
    - Solution: Utilisation de la forme fonctionnelle de `setTrames` dans `handleSaveActivity` pour garantir l'utilisation de l'état le plus récent.
    - Impact: La sauvegarde en mode "Journée entière" applique correctement l'activité aux deux demi-journées.
  - Ajout d'une fonctionnalité "Vider la trame" (`BlocPlanningTemplateEditor.tsx`):
    - Ajout d'un bouton rouge "Vider" avec icône dans la barre d'outils.
    - Implémentation de `handleClearTrameAssignments` qui supprime toutes les affectations de la trame sélectionnée après confirmation.
    - Impact: Permet de réinitialiser facilement une trame.

## Stabilisation et Amélioration - T3 2025

### Correction des bugs critiques (TERMINÉ)

- ✅ **Correction du composant LeaveForm**: Résolution du problème "Cannot read properties of undefined (reading 'startDate')"
- ✅ **API des congés**: Résolution de l'erreur 500 sur /api/leaves/balance
- ✅ **Thème sombre**: Correction des problèmes d'affichage en mode sombre

### Stabilisation des tests (EN COURS)

- ✅ **Tests de base**: Correction des problèmes avec le ThemeProvider dans UserProfile
- ✅ **Tests de service**: Correction de l'utilisation du BlocPlanningService dans les tests
- ✅ **Tests de composants**: Correction des tests NotificationSettingsForm et ErrorRetry
- ⏳ **Tests de hooks**: Finalisation des corrections pour useOptimizedQuery
- ⏳ **Types de test**: Résolution des problèmes de typages pour les assertions Jest
- ⏳ **Mocks incomplets**: Correction des tests où les mocks de fonctions ne sont pas appelés
- ⏳ **Isolation des tests**: Améliorer la reproductibilité et l'indépendance des tests

### Documentation technique (À VENIR)

- ⏳ **Documentation des tests**: Guide des bonnes pratiques pour les tests
- ⏳ **Documentation de l'architecture**: Mise à jour de la documentation technique

* ✅ **Module Trames - API Routes** :
  _ ✅ Implémentation complète du endpoint `PUT /api/trames/[id]` pour la mise à jour des trames avec leurs relations imbriquées.
  _ ✅ Utilisation de transactions Prisma pour garantir l'intégrité des données lors de mises à jour complexes.
  _ ✅ Support de la gestion des périodes, assignations et postes en cascade (création, mise à jour, suppression).
  _ ✅ Gestion robuste des erreurs et des cas limites dans les routes API. \* ✅ Validation des permissions utilisateur et adaptations nécessaires pour le mode développement.

# Roadmap de développement - Mathildanesth

## Version 2.5.0 (Juin 2025) - Actuelle

### Améliorations et corrections

- ✅ **Résolution Problèmes de Seed & Services Docker**
  - Démarrage des conteneurs Docker manquants (Redis, MongoDB).
  - Correction des scripts de seed MongoDB (`npm run seed`) bloqués par `import.meta.resolve`.
  - Ajout de l'initialisation des types de congés (`LeaveTypeSetting`) au script de seed Prisma (`npm run db:seed`).
  - Impact : Les données de base (types de congés, etc.) devraient maintenant être correctement initialisées, résolvant les erreurs "aucun type de congé disponible".
- ❗ **Investigation Erreurs Critiques Serveur (Redis & Prisma)**
  - Erreur de connexion à Redis (`ECONNREFUSED`) empêchant potentiellement la gestion de session.
  - Erreur Prisma (`relation "Leave" does not exist`) indiquant une table de base de données manquante pour les congés.
  - Impact : indisponibilité des fonctionnalités de congés, erreurs 500.
  - _Statut : Diagnostic en cours. Priorité haute._
- ✅ Correction Configuration NextAuth.js manquante.
  - Création du handler API `src/app/api/auth/[...nextauth]/route.ts`.
  - Résolution des erreurs 404 sur les endpoints NextAuth et `CLIENT_FETCH_ERROR`.
  - Impact attendu : Correction des problèmes de session utilisateur et des erreurs dépendantes (ex: chargement des types de congés).
- ✅ Nettoyage des logs et analyse avertissement React 19.
  - Log des headers Axios commenté dans `AuthContext.tsx`.
  - Avertissement `tippy-react` / React 19 identifié comme dette technique (migration future vers `Floating UI`).
- ✅ Correction du bug critique dans le module des congés lié au SessionProvider
  - Ajout global du SessionProvider dans l'application
  - Restructuration de la gestion de l'authentification
  - Résolution des problèmes d'affichage dans les formulaires de congés
- ✅ Implémentation du thème sombre (dark mode)
- ✅ Optimisation du chargement initial des composants
- ✅ Refactorisation de la structure des hooks partagés

### Fonctionnalités en développement

- 🔄 Finalisation du module de congés récurrents (80%)
- 🔄 Amélioration du système de notification pour les utilisateurs (65%)
- 🔄 Optimisation des performances générales de l'application (50%)

## Version 2.6.0 (Prévue pour Août 2025)

### Fonctionnalités principales

- 📅 Intégration avec les systèmes hospitaliers externes
- 📅 Mise à jour du module de génération de planning
- 📅 Amélioration de l'interface administrateur
- 📅 Nouvelles options de personnalisation pour les utilisateurs

### Améliorations techniques

- 📅 Passage à Next.js 15
- 📅 Mise à jour des dépendances majeures
- 📅 Restructuration de l'architecture de state management
- 📅 Traitement de la dette technique (ex: migration `tippy-react` vers `Floating UI`).

## Version 3.0.0 (Prévue pour Novembre 2025)

### Nouvelles fonctionnalités majeures

- 📅 Module d'intelligence artificielle pour recommandations de planning
- 📅 Interface mobile native (iOS/Android)
- 📅 Système avancé de gestion des urgences et remplacements
- 📅 Nouvelle architecture pour la planification multi-sites

### Améliorations d'infrastructure

- 📅 Passage à une architecture serverless complète
- 📅 Amélioration des performances et de la scalabilité
- 📅 Système de déploiement continu amélioré

## Légende

- ✅ Terminé
- 🔄 En cours de développement
- 📅 Planifié
- ❌ Reporté/Annulé

## Priorités à court terme

1. Finaliser les fonctionnalités de congés récurrents
2. Régler les problèmes de performance identifiés
3. Améliorer la couverture de tests automatisés
4. Optimiser l'expérience utilisateur sur mobile

## Notes pour les développeurs

- Toujours consulter la documentation technique dans `/docs/technique/` avant de contribuer
- Les PRs doivent inclure des tests unitaires et d'intégration appropriés
- Suivre les conventions de code et design patterns établis

# Roadmap de Développement Mathildanesth - Version Mise à Jour

Cette roadmap présente l'état actuel du développement de l'application Mathildanesth et définit les prochaines étapes et priorités.

## État d'avancement - Juin 2025

### Fonctionnalités complétées

- ✅ Authentification et gestion des utilisateurs (base)
- ✅ Système de congés complet
- ✅ Validation des dates et détection des conflits
- ✅ Maquettes et prototypes des interfaces principales
- ✅ Architecture des services et API
- ✅ Structure de base de données initiale
- ✅ Système de notifications (V1)
- ✅ Trames et modèles de planning
- ✅ Documentation consolidée et centralisée

### Fonctionnalités en cours

- 🔄 Administration du bloc opératoire (configuration des salles, règles de supervision)
- 🔄 Planification hebdomadaire (interface drag and drop)
- 🔄 Module de règles dynamiques
- 🔄 Tests et couverture des nouveaux modules

## T3-T4 2025 : Règles et Génération de Planning

### Priorité 1: Règles, Conditions et Contraintes

- **(P1)** 🔄 Développement du système de règles dynamiques
  - Éditeur visuel de règles
  - Validation des contraintes
  - Système de priorités
- **(P1)** Détection de conflits entre règles
  - Alertes et suggestions de résolution
  - Tableaux de bord récapitulatifs
- **(P1)** Documentation complète des règles métier
  - Liens vers les implémentations techniques
  - Explicitation pour non-développeurs

### Priorité 2: Algorithme de Génération de Planning

- **(P1)** Finalisation de l'algorithme de génération V1
  - Moteur intégrant les règles et contraintes
  - Optimisations pour situations complexes
- **(P1)** Métriques de qualité et d'équité
  - Score de satisfaction des contraintes
  - Indicateurs d'équilibre entre utilisateurs
- **(P2)** Interface d'ajustement manuel
  - Modification post-génération
  - Visualisation des impacts

### Priorité 3: Documentation et Consolidation

- **(P1)** ✅ Consolidation de la documentation des projets Mathildanesth et MATHILDA
  - Documentation technique et fonctionnelle unifiée
  - Structure organisée par modules
  - Séparation claire entre architecture et implémentation
- **(P1)** Complétion de la documentation manquante
  - Documentation de l'algorithme de génération
  - Documentation des interfaces utilisateur
  - Diagrammes de flux et d'architecture
- **(P2)** Processus de maintenance documentaire
  - Mise à jour systématique avec le développement
  - Vérification de cohérence code/documentation

### Priorité 4: Bloc Opératoire

- **(P1)** Finalisation de l'interface planning du bloc
  - Vue hebdomadaire par salle
  - Filtres et visualisations spécifiques
- **(P2)** 🔄 Intégration des règles de supervision
  - Validation en temps réel
  - Suggestions d'optimisation
- **(P3)** Tableau de bord du bloc opératoire
  - KPIs par salle et par secteur
  - Alertes et notifications spécifiques

## T1-T2 2026 : Expérience Utilisateur et Applications Mobile

### Priorité 1: Amélioration de l'Expérience Utilisateur

- **(P1)** Amélioration de la réactivité de l'interface
- **(P1)** Améliorations d'accessibilité WCAG
- **(P2)** Mode hors-ligne pour fonctions critiques
- **(P2)** Optimisations de performance

### Priorité 2: Développement Mobile

- **(P1)** Version responsive de l'application web
- **(P2)** Application mobile native (React Native)
  - Fonctionnalités de base
  - Notifications push
- **(P3)** Fonctionnalités avancées mobile
  - Widgets pour écran d'accueil
  - Intégration calendrier téléphone

### Priorité 3: Analytics et Rapports

- **(P1)** Tableau de bord principal
- **(P2)** Rapports exportables (PDF, Excel)
- **(P3)** Visualisations avancées
  - Tendances historiques
  - Analyse prédictive

### Priorité 4: Intégrations Externes

- **(P2)** API pour intégrations externes
- **(P3)** Intégration avec systèmes hospitaliers

## T3-T4 2026 : Finalisation et Production

### Priorité 1: Tests Approfondis

- **(P1)** Tests de charge
- **(P1)** Tests de sécurité
- **(P1)** Tests d'accessibilité

### Priorité 2: Automatisations et DevOps

- **(P1)** CI/CD complet
- **(P2)** Déploiement automatisé
- **(P2)** Monitoring de production

### Priorité 3: Documentation Utilisateur

- **(P1)** Guides utilisateurs
- **(P2)** Vidéos tutorielles
- **(P3)** Base de connaissances

## 2027 : Évolutions et Nouvelles Fonctionnalités

### Priorité 1: Évolutions Fonctionnelles

- **(P2)** Module d'IA pour recommandations
- **(P2)** Système avancé de métriques RH
- **(P3)** Fonctionnalités collaboratives avancées

### Priorité 2: Extensions

- **(P2)** Support multi-établissements
- **(P3)** Module de facturation
- **(P3)** API publique documentée

## Notes et Compléments

### Glossaire des Priorités

- **(P1)** : Critique pour le fonctionnement - À implémenter en priorité absolue
- **(P2)** : Important pour l'expérience complète - À développer après P1
- **(P3)** : Fonctionnalités d'amélioration - À développer quand P1 et P2 sont stables
- **(P4)** : Nice-to-have - Dernières priorités de développement

### Statuts

- ✅ : Complété
- 🔄 : En cours de développement
- ❌ : Retardé ou bloqué

_Dernière mise à jour : Juin 2025_

_Ce document est évolutif et sera mis à jour régulièrement pour refléter l'avancement du projet et les changements de priorités._

### Q3 2024: Stabilisation et Performance

- **Objectif**: Fiabiliser l'existant, optimiser les performances, améliorer l'expérience développeur.
- **Projets Clés**:
  - **Revue et Amélioration des Tests (En cours)**:
    - Finaliser la correction des tests unitaires pour le module de congés (`leaveService.test.ts` - problèmes de mocking Prisma résolus, vérification des assertions en cours).
    - Passer en revue et corriger les tests d'intégration et e2e existants.
    - Augmenter la couverture de test sur les modules critiques.
  - **Optimisation des requêtes Prisma**: Identifier et optimiser les requêtes lentes.
  - **Migration `tippy-react` vers `Floating UI`**: Résoudre l'avertissement React 19 et moderniser les tooltips/popovers.
  - **Gestion de la configuration (Redis, etc.)**: Clarifier et documenter la configuration des services externes comme Redis.
  - **Documentation Technique**: Maintenir à jour `codebase-overview.md` et `NEXT_STEPS.md`.

_Dernière mise à jour après correction des mocks Prisma dans `leaveService.test.ts`_
