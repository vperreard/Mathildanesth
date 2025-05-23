# Plan d'Implémentation : Refonte Trames et Affectations

Ce document détaille les étapes prévues pour la refonte du système de gestion des trames de planning et des affectations.

## Objectifs Généraux

1.  **Système de Trames Modèles :**

    - Permettre la création de "trames modèles" réutilisables.
    - Une trame modèle est liée à un **site**.
    - Une trame modèle définit une **récurrence** (ex: hebdomadaire, semaines paires/impaires, jours spécifiques).
    - Une trame modèle contient un ensemble d'**"Affectations Modèles"** (ou "Postes Types").

2.  **Affectations Modèles (Postes Types) :**

    - Définit un besoin/slot à pourvoir au sein d'une trame (ex: "Salle de bloc X", "Consultation Y", "Garde Z").
    - Est caractérisée par un **type d'activité** (ex: BLOC_OPERATOIRE, CONSULTATION, GARDE - via le modèle `ActivityType`).
    - Peut être liée à un **lieu** (ex: `OperatingRoom.id` ou `Location.id`).
    - Définit les **besoins en personnel** pour ce slot (ex: 1 Anesthésiste, 1 Chirurgien Ortho, 1 IADE).
      - Permet d'assigner du **personnel habituel** (optionnel) à ces besoins pour cette trame.

3.  **Application des Trames :**
    - Utiliser les trames modèles pour pré-remplir les plannings lors de la génération (automatique ou manuelle).
    - Permettre d'ouvrir/fermer des affectations au sein d'une trame appliquée pour une période donnée.

## Plan d'Implémentation Détaillé

### Phase 1: Consolidation et Extension des Modèles de Base (Schéma Prisma)

1.  **Modèle `ActivityType` (anciennement `AssignmentType`) :**

    - **Action :** Vérifier et compléter les champs pour couvrir tous les types d'activités (BLOC, CONSULTATION, GARDE, ASTREINTE, etc.).
    - **Champs à considérer/ajouter :** `defaultDurationHours: Float?`, `defaultPeriod: Period?`.
    - **API :** S'assurer que la route `/api/activity-types` (anciennement `/api/assignment-types`) est fonctionnelle (en mettant de côté les erreurs de linter sur le champ `code` si elles s'avèrent être des faux positifs liés à l'environnement).

2.  **Modèle `TrameModele` (généralisation de `BlocTramePlanning`) :**

    - **Action :** Renommer `BlocTramePlanning` en `TrameModele`.
    - **Champs à conserver/modifier :**
      - `id`, `name`, `description`, `siteId` (et relation `site`).
      - `isActive`, `createdAt`, `updatedAt`.
    - **Gestion de la récurrence (approche simplifiée pour commencer) :**
      - `dateDebutEffet`: `DateTime` (date de début d'application de la trame).
      - `dateFinEffet`: `DateTime?` (date de fin d'application, si applicable).
      - `recurrenceType`: `String` (enum implicite : `AUCUNE`, `HEBDOMADAIRE`). _Pour l'instant, on se concentre sur HEBDOMADAIRE._
      - `joursSemaineActifs`: `Int[]` (ex: `[0,1,2,3,4]` pour Lundi à Vendredi, si Dimanche=0, Lundi=1...).
      - `typeSemaine`: `String` (enum implicite : `TOUTES`, `PAIRES`, `IMPAIRES`).
    - **Relation :** `affectations: AffectationModele[]`.
    - **Map DB :** `@@map("trame_modeles")`.

3.  **Modèle `AffectationModele` (généralisation de `BlocAffectationHabituelle`) :**

    - **Action :** Renommer `BlocAffectationHabituelle` en `AffectationModele`.
    - **Champs à conserver/modifier :**
      - `id`.
      - Lien vers `TrameModele`: `trameModeleId`, `trameModele`.
      - `activityTypeId`: `String` (lien vers `ActivityType.id` ou `ActivityType.code` - préférer `id` si possible pour la performance des jointures, mais `code` est plus stable si les ID peuvent changer lors d'imports/exports). _À discuter, pour l'instant, supposons `String` pour `ActivityType.code` si c'est l'identifiant métier fort._
      - `operatingRoomId`: `Int?` (conserver pour le bloc).
      - `locationId`: `Int?` (ajouter pour une notion de lieu plus générique, à lier à un futur modèle `Location` si différent d'OperatingRoom).
      - `periode`: `Period` (enum : MATIN, APRES_MIDI, JOURNEE_ENTIERE, NUIT).
      - `jourSemaineOverride`: `DayOfWeek?` (pour surcharger le jour si la trame est globale mais cette affectation est spécifique).
      - `typeSemaineOverride`: `WeekType?` (pour surcharger le type de semaine).
      - `priorite`: `Int @default(5)`.
      - `detailsJson`: `Json?`.
      - `isActive`: `Boolean @default(true)` (permet "d'ouvrir/fermer" ce slot dans la trame modèle).
      - `createdAt`, `updatedAt`.
    - **Relation vers personnel requis :** `personnelRequis: PersonnelRequisModele[]`.
    - **Supprimer :** `userId`, `chirurgienId`, `roleInAffectation`, `typeAffectation`, `specialiteChir` (ces notions seront portées par `PersonnelRequisModele` et `ActivityType`).
    - **Map DB :** `@@map("affectation_modeles")`.

4.  **Nouveau Modèle `PersonnelRequisModele` :**

    - **Action :** Créer ce nouveau modèle.
    - **Champs :**
      - `id: Int @id @default(autoincrement())`.
      - `affectationModeleId: Int`, et relation `affectationModele: AffectationModele`.
      - `roleGenerique: String` (Texte libre décrivant le rôle requis, ex: "Anesthésiste Réanimateur", "Chirurgien (Ortho)", "IBODE", "Personnel externe de nettoyage", etc. Ce champ est clé pour les personnels non `User`/`Surgeon`).
      - `professionalRoleId: String?` (Optionnel: Lien vers `ProfessionalRoleConfig.code` si le `roleGenerique` correspond à un rôle structuré d'un `User`).
      - `specialtyId: Int?` (Optionnel: Lien vers `Specialty.id` si le rôle est lié à une spécialité spécifique).
      - `nombreRequis: Int @default(1)`.
      - `personnelHabituelUserId: Int?` (Optionnel: Lien vers `User.id`).
      - `personnelHabituelSurgeonId: Int?` (Optionnel: Lien vers `Surgeon.id`).
      - `personnelHabituelNomExterne: String?` (Optionnel: Nom texte si ni User ni Surgeon).
      - `notes: String?`.
    - **Relations (à définir avec `relation(...)` pour les champs optionnels) :**
      - `professionalRole: ProfessionalRoleConfig?`
      - `specialty: Specialty?`
      - `userHabituel: User?`
      - `surgeonHabituel: Surgeon?`
    - **Map DB :** `@@map("personnel_requis_modeles")`.

5.  **Dépréciation/Migration des Anciens Modèles de Trames :**
    - **Action :** Identifier les fonctionnalités de `RegularAssignment`, `TrameAffectation`, `TramePeriod`, `TrameAssignment`, `TramePost` qui ne sont pas couvertes par la nouvelle structure.
    - **Stratégie :** Pour l'instant, ne pas les supprimer. Se concentrer sur la construction de la nouvelle structure. La migration ou dépréciation sera une étape ultérieure.

### Phase 2: APIs pour la Gestion des Trames Modèles

1.  **API `/api/activity-types` (ex `/api/assignment-types`) :**

    - **Action :** S'assurer que le CRUD est complet et fonctionnel pour `ActivityType`.

2.  **API `/api/trame-modeles` (CRUD pour `TrameModele` et ses `AffectationModele`/`PersonnelRequisModele` imbriqués) :**
    - **`POST /api/trame-modeles` :**
      - Crée un `TrameModele`.
      - Peut optionnellement créer des `AffectationModele` et leurs `PersonnelRequisModele` associés en une seule transaction (nested writes).
    - **`GET /api/trame-modeles` :**
      - Liste les `TrameModele`.
      - Filtres : `siteId`, `isActive`.
      - Pagination.
    - **`GET /api/trame-modeles/{id}` :**
      - Récupère un `TrameModele` par son ID.
      - Inclut les `AffectationModele` et leurs `PersonnelRequisModele` (via `include` Prisma).
    - **`PUT /api/trame-modeles/{id}` :**
      - Met à jour un `TrameModele`.
      - Permet de gérer les mises à jour, créations, suppressions des `AffectationModele` et `PersonnelRequisModele` imbriqués.
    - **`DELETE /api/trame-modeles/{id}` :**
      - Supprime un `TrameModele` (et ses enfants en cascade si configuré).

### Phase 3: Interface Utilisateur (UI)

1.  **Gestion des "Types d'Activité" (`ActivityType`) :**

    - **Page :** `/parametres/types-activites` (ou similaire).
    - **Fonctionnalités :** Tableau listant les `ActivityType`, boutons pour créer, éditer, supprimer. Formulaire modal/page pour l'édition.

2.  **Gestion des "Trames Modèles" (`TrameModele`) :**
    - **Page :** `/parametres/trames-modeles` (ou similaire).
    - **Fonctionnalités :**
      - Tableau listant les `TrameModele` (nom, site, description, statut actif).
      - Bouton "Créer une trame modèle".
      - Actions : Éditer, Dupliquer, Supprimer une trame.
    - **Vue/Édition d'une Trame Modèle (ex: `/parametres/trames-modeles/{id}`) :**
      - **Onglet 1: Informations Générales**
        - Formulaire: Nom, description, site, dates d'effet, paramètres de récurrence (jours actifs, type de semaine).
      - **Onglet 2: Structure de la Trame (Affectations/Postes)**
        - Affichage tabulaire (ou grille) représentant la semaine type (ou la structure de la trame).
        - Chaque cellule (ou ligne) représente une `AffectationModele` (un poste type) pour une `periode` (matin, AM, journée).
        - Permettre d'ajouter une "Affectation Modèle" :
          - Choisir le type d'activité (`ActivityType`).
          - Spécifier le lieu (`OperatingRoom` ou `Location`).
          - Définir le(s) `PersonnelRequisModele` (rôle générique, nb, personnel habituel).
          - Spécifier la période et les jours concernés dans la trame.
        - Permettre d'éditer/supprimer une `AffectationModele`.
        - Permettre de marquer une `AffectationModele` comme `isActive` (ouverte/fermée par défaut dans cette trame).

### Phase 4: Logique d'Application des Trames au Planning

1.  **Service `TrameApplicationService` :**
    - **Fonction :** `applyTrameToDateRange(trameModeleId: Int, siteId: String, startDate: Date, endDate: Date): Promise<GeneratedAssignment[]>`
    - **Logique :**
      - Récupère le `TrameModele` et ses `AffectationModele` / `PersonnelRequisModele`.
      - Pour chaque jour dans `startDate` à `endDate`:
        - Vérifie si la trame s'applique (selon sa récurrence et ses dates d'effet).
        - Si oui, pour chaque `AffectationModele` active dans la trame :
          - Crée une instance d'affectation concrète (ex: `Assignment` ou `BlocDayPlanning` / `BlocRoomAssignment` pour le bloc).
          - Pré-remplit avec les infos de l'`AffectationModele` (type, lieu, personnel habituel).
    - Gère les conflits potentiels (ex: si une affectation existe déjà).

### Phase 5: Documentation

- **Action :** Mettre à jour la documentation technique (modèles de données Prisma, endpoints API Swagger/OpenAPI) au fur et à mesure de l'implémentation.
- Créer/mettre à jour les guides utilisateurs pour les nouvelles fonctionnalités de gestion des trames.

---

Ce plan sera affiné au fur et à mesure de l'avancement.
Prochaine étape : Commencer la Phase 1, en particulier les modifications du schéma Prisma.
Je vais me concentrer sur `ActivityType`, `TrameModele`, `AffectationModele`, et `PersonnelRequisModele`.
Concernant la liaison `activityTypeId` dans `AffectationModele` à `ActivityType`, j'utiliserai `ActivityType.id` (qui est un `String` car `@default(uuid())`) pour la cohérence et les performances, en assumant que les `id` sont stables.
La `RRULE` sera mise de côté pour l'instant au profit de champs de récurrence hebdomadaire simples.
La gestion du personnel se fera via le nouveau modèle `PersonnelRequisModele` comme discuté.

# Plan d'Amélioration des Interfaces Trames et Affectations

En parallèle de l'implémentation technique du système de trames et affectations, une refonte complète des interfaces utilisateur est prévue. Ce plan d'amélioration vise à rendre le système plus intuitif, visuel et efficace pour les utilisateurs.

## Problématiques identifiées

- Interfaces actuelles complexes et peu intuitives
- Manque de visualisation claire des patterns d'affectation
- Difficulté à configurer les variations (semaines paires/impaires)
- Ambiguïté dans la gestion des gardes 24h et leur représentation
- Gestion laborieuse des rôles au bloc opératoire

## Améliorations prévues

### 1. Interface visuelle en grille pour les trames

- **Objectif :** Créer une vue calendrier hebdomadaire pour éditer visuellement les trames
- **Fonctionnalités clés :**
  - Salles/postes en lignes, jours/périodes en colonnes
  - Code couleur pour différencier les types d'affectations
  - Glisser-déposer pour rapide configuration

### 2. Simplification de la création des trames

- **Objectif :** Créer un assistant par étapes pour guider les utilisateurs
- **Étapes :**
  1. Définition de la période et du type (semaines paires/impaires/toutes)
  2. Configuration des salles ouvertes/fermées par défaut
  3. Affectation du personnel habituel
- **Ajouts :**
  - Possibilité de dupliquer une trame existante
  - Templates prédéfinis pour accélérer la création

### 3. Gestion spécifique des gardes et astreintes

- **Objectif :** Créer une interface dédiée pour les gardes/astreintes
- **Fonctionnalités :**
  - Visualisation claire du format 24h
  - Représentation automatique du repos post-garde
  - Distinction visuelle entre gardes et affectations journée complète au bloc

### 4. Intégration des vacances scolaires

- **Objectif :** Permettre la récupération automatique des dates de vacances scolaires
- **Solution :** Intégrer l'API data.education.gouv.fr ou équivalent
- **Configuration :** Interface pour sélectionner les zones scolaires (A, B, C)

### 5. Interface optimisée pour les chirurgiens

- **Objectif :** Faciliter la gestion des 70 chirurgiens sur 21 salles
- **Approche :**
  - Vue en grille avec manipulation rapide
  - Menu contextuel pour étendre les périodes (matin→journée)
  - Sélection multiple pour modifications en bloc

## Séquence de développement recommandée

1. **Conception des maquettes UI** pour validation du concept (Figma)
2. **Prototype interactif** pour tester l'approche en grille et glisser-déposer
3. **Implémentation progressive** en commençant par la vue calendrier
4. **Intégration de l'API vacances scolaires** et configuration des zones
5. **Tests utilisateurs** avec feedback itératif

Un document détaillé des spécifications UI est disponible dans `docs-consolidated/02_Fonctionnalites/07_Gestion_Affectations/02_Refonte_UI_Trames_Affectations.md`.

# Améliorations des Modules d'Analytique et de Simulation

Suite à l'implémentation réussie des modules d'Analytique Avancée & Prédictions (V1) et de Simulation de Planning, plusieurs axes d'amélioration sont prévus pour enrichir ces fonctionnalités et optimiser leur utilisation.

## 1. Finalisation du module de Simulation

### 1.1. Clonage et duplication des templates
- **Objectif :** Permettre de créer rapidement des variantes de templates de simulation
- **Actions prioritaires :**
  - [x] Développer l'API de duplication `/api/simulations/scenarios/duplicate`
  - [x] Ajouter la fonction de clonage dans l'interface utilisateur avec options de personnalisation
  - [x] Implémenter la possibilité de modifier les paramètres clés lors du clonage

### 1.2. Tableau de bord analytique pour comparer les scénarios
- **Objectif :** Faciliter l'analyse comparative entre différentes simulations
- **Actions prioritaires :**
  - [x] Créer une interface de comparaison multi-scénarios (`/admin/simulations/compare`)
  - [x] Développer des visualisations côte-à-côte pour les métriques clés
  - [x] Implémenter des graphiques comparatifs (barres, lignes, radars)

### 1.3. Filtres avancés pour l'analyse des résultats
- **Objectif :** Permettre une analyse plus fine et ciblée des résultats de simulation
- **Actions prioritaires :**
  - [x] Implémenter un composant `AdvancedFilters` réutilisable
  - [x] Ajouter des filtres pour la période, les services, le personnel, et les seuils de score
  - [x] Permettre la sauvegarde des configurations de filtres fréquemment utilisées

## 2. Optimisation des performances

### 2.1. Amélioration des temps de réponse pour les simulations
- **Objectif :** Réduire significativement le temps d'attente pour les résultats de simulation
- **Actions prioritaires :**
  - [x] Développer un service optimisé (`optimizedSimulationService.ts`)
  - [x] Implémenter différentes stratégies d'optimisation (cache, parallèle, incrémental)
  - [x] Créer une page de démonstration pour tester et comparer les performances

### 2.2. Système de mise en cache des résultats intermédiaires
- **Objectif :** Accélérer les calculs en réutilisant les résultats déjà calculés
- **Actions prioritaires :**
  - [x] Créer un service de cache (`simulationCacheService.ts`)
  - [x] Ajouter un modèle de données pour le stockage persistent (`SimulationIntermediateResult`)
  - [x] Implémenter des mécanismes d'invalidation intelligents pour le cache

### 2.3. Traitement parallèle pour les simulations volumineuses
- **Objectif :** Exploiter les capacités multi-cœurs pour accélérer les simulations complexes
- **Actions prioritaires :**
  - [x] Implémenter un système de workers avec `workerpool`
  - [x] Développer une stratégie de découpage des données pour le traitement parallèle
  - [x] Créer un mécanisme de fusion des résultats partiels

## 3. Expérience utilisateur avancée

### 3.1. Visualisations graphiques plus riches
- **Objectif :** Offrir des visualisations plus intuitives et interactives des résultats
- **Actions prioritaires :**
  - [ ] Ajouter des graphiques de type heat map pour visualiser les affectations
  - [ ] Implémenter des diagrammes de Sankey pour montrer les flux de personnel
  - [ ] Créer des tableaux de bord personnalisables avec des métriques configurables

### 3.2. Système de notifications pour les simulations longues
- **Objectif :** Informer l'utilisateur de l'avancement et de la fin des simulations longues
- **Actions prioritaires :**
  - [ ] Développer un système d'événements WebSocket pour les mises à jour en temps réel
  - [ ] Créer un composant de notification in-app pour les simulations terminées
  - [ ] Ajouter une option d'alerte par email pour les simulations particulièrement longues

### 3.3. Raccourcis pour appliquer un résultat de simulation au planning réel
- **Objectif :** Faciliter la transition d'une simulation réussie vers le planning opérationnel
- **Actions prioritaires :**
  - [ ] Implémenter une fonctionnalité "Appliquer au planning" sur les résultats de simulation
  - [ ] Créer un processus de validation avec aperçu des changements proposés
  - [ ] Développer un mécanisme de fusion intelligent pour résoudre les conflits potentiels

## 4. Intégration avec d'autres modules

### 4.1. Intégration automatique des données des congés validés
- **Objectif :** Synchroniser automatiquement les congés validés avec les simulations
- **Actions prioritaires :**
  - [ ] Créer un connecteur entre le module de congés et la simulation
  - [ ] Développer une option pour inclure/exclure les congés validés, en attente ou refusés
  - [ ] Implémenter une mise à jour automatique des simulations lors de changements de congés

### 4.2. Création de liens avec le module de génération de planning
- **Objectif :** Améliorer la cohérence entre les simulations et la génération réelle de planning
- **Actions prioritaires :**
  - [ ] Unifier les algorithmes de base entre simulation et génération
  - [ ] Permettre de définir des paramètres de simulation basés sur les règles de génération
  - [ ] Créer un flux de travail intégré entre simulation et génération

### 4.3. Synchronisation des templates avec les trames de planning
- **Objectif :** Assurer la cohérence entre les templates de simulation et les trames de planning
- **Actions prioritaires :**
  - [ ] Développer une fonctionnalité d'importation de trames vers les templates
  - [ ] Créer un mécanisme de synchronisation bidirectionnelle
  - [ ] Ajouter des alertes de divergence entre trames et templates synchronisés

---

Ce plan d'amélioration sera mis en œuvre progressivement, en commençant par les fonctionnalités à plus forte valeur ajoutée pour les utilisateurs. Les priorités seront ajustées en fonction des retours utilisateurs et des besoins opérationnels.

# Prochaines Étapes pour Mathildanesth

Ce document liste les actions prioritaires et les points d'attention pour les prochaines semaines de développement. Il est basé sur la [ROADMAP.md](ROADMAP.md) et l'état actuel du projet.

## Focus Principal : Stabilisation & Finalisation Phase 1 / Démarrage Phase 2

### 1. Gestion des Congés & Absences (Finalisation)

    - **Objectif :** S'assurer que toute la logique de décompte, validation, et gestion des conflits est robuste et sans bugs.
    - **Actions Immédiates :**
        - 🚧 **Finalisation `GET /api/leaves/balance` :**
            - [ ] **Investigation `acquired`**: Confirmer le modèle et le processus Prisma pour les ajustements manuels de solde (ex: `LeaveBalanceAdjustment` ou équivalent) afin de calculer correctement le champ `acquired`.
            - [ ] **Implémentation `acquired`**: Intégrer la lecture et l'agrégation de ces ajustements dans `src/pages/api/leaves/balance.ts`.
            - [ ] **Mise à jour Doc API**: Actualiser la documentation de l'API `/api/leaves/balance` (Swagger/OpenAPI) pour refléter l'implémentation actuelle, y compris la gestion (ou l'absence actuelle) du champ `acquired`.
        - ✅ **Refactorisation `LeaveForm.tsx` et `useLeaveCalculation`**: Intégration des demi-journées et améliorations de robustesse terminées.
        - 🚧 **Solidification des Tests Unitaires et d'Intégration (Module `leaves`)**:
            - [ ] **Configuration Jest**: Résoudre les problèmes de configuration Jest/TypeScript affectant les assertions (erreurs `Property 'toBe' does not exist...`).
            - [ ] **Couverture `useLeaveCalculation.test.ts`**: Étendre les cas de test (cas limites, demi-journées, horaires spécifiques).
            - [ ] **Couverture `LeaveForm.test.tsx`**: Compléter les tests d'interaction, de validation et de soumission.
            - [ ] **Couverture `conflictDetectionService.test.ts`**: Tester exhaustivement les types de conflits, les règles et le comportement du cache (structure de base prête).
            - [ ] **Tests d'Intégration**: Développer des tests pour le flux complet de demande de congés (de la soumission à la mise à jour des soldes).
        - 🚧 **Revue et Fiabilisation du Modèle `LeaveBalance`**:
            - [ ] **Validation Schéma**: Confirmer la structure définitive du modèle `LeaveBalance` dans `schema.prisma` et s'assurer de sa cohérence à travers le projet.
            - [ ] **Fiabilisation des Mises à Jour**: S'assurer que tous les processus modifiant les soldes (demandes, transferts, reports, ajustements) mettent à jour `LeaveBalance` de manière fiable et atomique.
            - [ ] **Optimisation API Balance**: Envisager de simplifier l'API `/api/leaves/balance` si `LeaveBalance` devient une source de vérité complète et constamment à jour.
            - [ ] **Amélioration UX et Gestion des Erreurs (Formulaire de Congés)**:
                - [ ] Afficher des messages d'erreur plus précis et informatifs dans `LeaveForm.tsx`.
                - [ ] Améliorer le retour visuel pendant les phases de calcul et de soumission du formulaire de congé.

### 2. Système de Règles Dynamiques (Avancement)

    - **Objectif :** Avoir un moteur de règles pleinement fonctionnel avec une interface d'administration basique pour les règles de planification.
    - **Actions Immédiates :**
        - 🔄 **Interface Admin Règles :**
            - Finaliser `

# Mise à jour des Travaux Réalisés (Simulation Planning)

Suite à l'implémentation des templates de simulation, nous avons considérablement amélioré la fonctionnalité de simulation. Voici un résumé des avancées récentes:

## Travaux Réalisés

### 1. Module de Simulation
- ✅ **Interface de Création de Simulation :**
    - Interface à onglets pour remplacer l'éditeur JSON brut
    - Sélection intuitive de dates, sites, règles et utilisateurs
- ✅ **Visualisation des Résultats :**
    - Présentation structurée avec des onglets (Résumé, Conflits, Participants, Détails)
    - Visualisations graphiques des statistiques clés
    - Système d'auto-refresh pour les simulations en cours
- ✅ **Export des Résultats :**
    - Export PDF et Excel avec mise en forme
    - Exportation des statistiques, conflits et affectations
- ✅ **Templates de simulation :**
    - Système permettant de sauvegarder des configurations types pour accélérer la création de scénarios
    - Interface de gestion des templates avec création, édition et suppression
    - Catégorisation des templates et permissions (public/privé)

## Prochaines Tâches Prioritaires

### 1. Simulation Planning (Optimisations)
- [ ] **Optimisations UI :**
    - Améliorer la réactivité de l'interface pour les grandes simulations
    - Ajouter des filtres plus avancés pour les résultats de simulation
- [ ] **Moteur de Simulation :**
    - Optimiser l'algorithme pour réduire les temps de calcul
    - Ajouter des options avancées pour la distribution de charge
- [ ] **Dashboard Analytique :**
    - Développer une interface de visualisation consolidée des statistiques
    - Permettre la comparaison visuelle des différents scénarios

Ces améliorations continueront à renforcer le module de simulation, le rendant plus flexible, performant et utile pour la planification hospitalière.

# Système de Notifications pour les Simulations Longues (Implémentation Terminée)

Pour améliorer l'expérience utilisateur lors de l'exécution de simulations de planning qui peuvent prendre du temps, nous avons implémenté un système complet de notifications temps réel. Voici un résumé des composants développés :

## 1. Architecture du système de notifications

- **Service de notification de simulation** : `notificationService.ts`
  - Gestion des événements de simulation (démarrage, progression, fin, erreur)
  - Envoi de notifications persistantes dans la base de données
  - Communication en temps réel via Pusher

- **Intégration Pusher** : `pusher.ts`
  - Configuration du serveur et client Pusher
  - Fonctions utilitaires pour l'abonnement aux canaux et déclenchement d'événements

- **Composant d'interface utilisateur** : `SimulationNotifications.tsx`
  - Affichage des notifications en temps réel dans l'interface
  - Barres de progression pour suivre l'avancement des simulations
  - Estimation du temps restant

## 2. Intégration avec le Service de Simulation

- Mise à jour de `optimizedSimulationService.ts` pour envoyer des notifications à chaque étape clé
- Ajout de fonctionnalités de suivi de progression pour chaque stratégie de simulation 
- Estimation intelligente du temps d'exécution en fonction de la stratégie et de la taille des données

## 3. Modifications API

- Ajout de l'ID utilisateur dans les paramètres envoyés au service de simulation
- Récupération de l'utilisateur connecté pour l'envoi de notifications personnalisées

## Résultats et Bénéfices

- Interface utilisateur réactive qui indique la progression des simulations en temps réel
- Notifications persistantes pour les événements importants (démarrage, jalons, fin)
- Possibilité pour les utilisateurs de continuer à travailler pendant l'exécution des simulations
- Estimation du temps restant pour mieux planifier le travail

## Prochaines étapes potentielles

- Amélioration des estimations de temps en fonction des performances historiques
- Ajout d'options de notification par email pour les simulations très longues
- Intégration avec d'autres processus longs de l'application

# Raccourcis pour Appliquer un Résultat de Simulation au Planning Réel (Implémentation Terminée)

Pour permettre aux utilisateurs d'exploiter concrètement les résultats des simulations, nous avons développé une fonctionnalité permettant d'appliquer directement un résultat de simulation au planning réel. Cette fonctionnalité est maintenant terminée et entièrement opérationnelle.

## 1. Service d'application de simulation

- **Service principal** : `applySimulationService.ts`
  - Conversion des résultats de simulation en affectations réelles
  - Gestion des options d'application (suppression des affectations existantes, inclusion des congés, etc.)
  - Traitement des conflits potentiels lors de l'application

## 2. API d'application

- **Endpoint API** : `/api/simulations/apply`
  - Traitement des requêtes POST avec vérification d'authentification et de droits
  - Validation des paramètres d'application
  - Utilisation du service d'application pour exécuter la conversion

## 3. Interface utilisateur

- **Modal d'application** : `ApplySimulationModal.tsx`
  - Interface intuitive avec options configurables pour l'application
  - Alertes et confirmations pour éviter les applications accidentelles
  - Gestion et affichage des conflits potentiels

- **Intégration dans les résultats de simulation** : 
  - Bouton "Appliquer au planning" sur la page de détails des résultats
  - Workflow complet depuis la visualisation jusqu'à l'application

## 4. Aspects sécurité et droits

- Vérification des droits utilisateurs avant l'application
- Journalisation des opérations d'application dans l'audit log
- Notifications transparentes sur les résultats de l'application

Cette fonctionnalité complète le module de simulation, permettant d'aller du "quoi si?" à l'application concrète, facilitant ainsi l'utilisation des résultats des simulations pour améliorer la planification réelle.

# Visualisations Graphiques Avancées pour les Simulations (Implémentation Terminée)

Pour améliorer l'analyse et l'interprétation des résultats de simulation, nous avons développé un ensemble de visualisations graphiques avancées. Ces outils permettent aux utilisateurs de mieux comprendre les implications des différents scénarios de planification.

## 1. Composants de Visualisation

- **HeatMapChart** : Visualisation sous forme de carte de chaleur
  - Représentation intuitive des taux de couverture 
  - Identification rapide des zones sur/sous-dotées en personnel
  - Suivi temporel (journalier, hebdomadaire, mensuel) des indicateurs clés

- ✅ **SankeyChart** : Diagrammes de flux pour l'analyse des mouvements de personnel
  - Visualisation des échanges entre services/unités avec des options avancées (valeur/pourcentage)
  - Analyse interactive des flux basée sur les compétences et ressources
  - Identification des goulots d'étranglement dans la distribution du personnel
  - Affichage des statistiques d'entrées/sorties pour chaque nœud

## 2. Page de Visualisations Avancées

- **Interface unifiée** : `/admin/simulations/advanced-visualizations`
  - Accès direct depuis la page de détails d'un résultat de simulation
  - Navigation intuitive entre les différents types de visualisation

- **Filtres et options configurables**
  - Sélection des métriques (couverture, utilisation, satisfaction)
  - Différentes vues temporelles (jour, semaine, mois)
  - Niveaux de détail ajustables (services, compétences, ressources individuelles)

## 3. Export et Partage des Visualisations

- Fonctionnalités d'export au format PNG, SVG et CSV
- Capacité à inclure les visualisations dans les rapports générés
- Partage facilité pour les présentations et réunions de planification

Ces visualisations avancées complètent le module de simulation en transformant des données complexes en représentations visuelles facilement compréhensibles, aidant ainsi à la prise de décision et à la communication des résultats.