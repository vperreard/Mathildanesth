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

# Améliorations des Simulations de Planning

Avec l'implémentation des templates de simulation, nous avons franchi une étape importante dans la gestion des simulations de planning. Voici les prochaines étapes d'amélioration prévues:

## Améliorations à Court Terme

### 1. Renforcement des Templates de Simulation
- **Objectif :** Enrichir les fonctionnalités des templates pour maximiser leur utilité
- **Actions Prioritaires :**
  - [ ] Ajouter des filtres supplémentaires sur la liste des templates (récemment créés, les plus utilisés)
  - [ ] Implémenter une fonctionnalité de clonage/duplication de templates
  - [ ] Ajouter des indicateurs d'utilisation (combien de fois un template a été utilisé)
  - [ ] Permettre l'importation/exportation de templates entre environnements

### 2. Dashboard de Simulation
- **Objectif :** Créer un tableau de bord analytique pour faciliter la comparaison des scénarios
- **Fonctionnalités à Développer :**
  - [ ] Vue comparative de plusieurs scénarios côte à côte
  - [ ] Indicateurs clés de performance (KPIs) configurables
  - [ ] Visualisation graphique des résultats (graphiques de répartition des charges de travail, etc.)
  - [ ] Analyse d'impact des changements de paramètres

### 3. Amélioration des Exports
- **Objectif :** Renforcer les options d'export pour faciliter le partage des résultats
- **Actions :**
  - [ ] Enrichir les exports PDF avec plus d'indicateurs visuels
  - [ ] Améliorer la mise en page des exports Excel pour une meilleure analyse
  - [ ] Permettre l'export sélectif de parties spécifiques des résultats
  - [ ] Implémenter l'export automatique par email à une liste de destinataires

## Évolutions à Moyen Terme

### 1. Intégration IA Assistive
- **Objectif :** Incorporer des fonctionnalités d'IA pour analyser et optimiser les scénarios
- **Fonctionnalités :**
  - [ ] Analyser automatiquement les résultats pour détecter des opportunités d'optimisation
  - [ ] Suggérer des paramètres alternatifs pour améliorer les résultats
  - [ ] Prédire l'impact des changements avant leur application

### 2. Mode Collaboratif
- **Objectif :** Permettre la collaboration sur les simulations entre plusieurs utilisateurs
- **Fonctionnalités :**
  - [ ] Partage contrôlé de templates et scénarios avec d'autres utilisateurs
  - [ ] Annotations et commentaires sur les résultats
  - [ ] Historique des modifications et des versions

### 3. Tests Automatisés
- **Objectif :** Vérifier automatiquement la robustesse des templates face à différentes situations
- **Fonctionnalités :**
  - [ ] Tests de stress (simulation avec nombre élevé d'utilisateurs/contraintes)
  - [ ] Tests de sensibilité (analyse de l'impact des variations de paramètres)
  - [ ] Rapports automatiques de validité des templates

---

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
        - 🚧 **Amélioration UX et Gestion des Erreurs (Formulaire de Congés)**:
            - [ ] Afficher des messages d'erreur plus précis et informatifs dans `LeaveForm.tsx`.
            - [ ] Améliorer le retour visuel pendant les phases de calcul et de soumission du formulaire de congé.

### 2. Système de Règles Dynamiques (Avancement)

    - **Objectif :** Avoir un moteur de règles pleinement fonctionnel avec une interface d'administration basique pour les règles de planification.
    - **Actions Immédiates :**
        - 🔄 **Interface Admin Règles :**
            - Finaliser `