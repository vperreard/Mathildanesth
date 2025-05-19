# Plan d'Implémentation : Refonte Trames et Affectations

Ce document détaille les étapes prévues pour la refonte du système de gestion des trames de planning et des affectations.

## Objectifs Généraux

1.  **Système de Trames Modèles :**
    *   Permettre la création de "trames modèles" réutilisables.
    *   Une trame modèle est liée à un **site**.
    *   Une trame modèle définit une **récurrence** (ex: hebdomadaire, semaines paires/impaires, jours spécifiques).
    *   Une trame modèle contient un ensemble d'**"Affectations Modèles"** (ou "Postes Types").

2.  **Affectations Modèles (Postes Types) :**
    *   Définit un besoin/slot à pourvoir au sein d'une trame (ex: "Salle de bloc X", "Consultation Y", "Garde Z").
    *   Est caractérisée par un **type d'activité** (ex: BLOC_OPERATOIRE, CONSULTATION, GARDE - via le modèle `ActivityType`).
    *   Peut être liée à un **lieu** (ex: `OperatingRoom.id` ou `Location.id`).
    *   Définit les **besoins en personnel** pour ce slot (ex: 1 Anesthésiste, 1 Chirurgien Ortho, 1 IADE).
        *   Permet d'assigner du **personnel habituel** (optionnel) à ces besoins pour cette trame.

3.  **Application des Trames :**
    *   Utiliser les trames modèles pour pré-remplir les plannings lors de la génération (automatique ou manuelle).
    *   Permettre d'ouvrir/fermer des affectations au sein d'une trame appliquée pour une période donnée.

## Plan d'Implémentation Détaillé

### Phase 1: Consolidation et Extension des Modèles de Base (Schéma Prisma)

1.  **Modèle `ActivityType` (anciennement `AssignmentType`) :**
    *   **Action :** Vérifier et compléter les champs pour couvrir tous les types d'activités (BLOC, CONSULTATION, GARDE, ASTREINTE, etc.).
    *   **Champs à considérer/ajouter :** `defaultDurationHours: Float?`, `defaultPeriod: Period?`.
    *   **API :** S'assurer que la route `/api/activity-types` (anciennement `/api/assignment-types`) est fonctionnelle (en mettant de côté les erreurs de linter sur le champ `code` si elles s'avèrent être des faux positifs liés à l'environnement).

2.  **Modèle `TrameModele` (généralisation de `BlocTramePlanning`) :**
    *   **Action :** Renommer `BlocTramePlanning` en `TrameModele`.
    *   **Champs à conserver/modifier :**
        *   `id`, `name`, `description`, `siteId` (et relation `site`).
        *   `isActive`, `createdAt`, `updatedAt`.
    *   **Gestion de la récurrence (approche simplifiée pour commencer) :**
        *   `dateDebutEffet`: `DateTime` (date de début d'application de la trame).
        *   `dateFinEffet`: `DateTime?` (date de fin d'application, si applicable).
        *   `recurrenceType`: `String` (enum implicite : `AUCUNE`, `HEBDOMADAIRE`). *Pour l'instant, on se concentre sur HEBDOMADAIRE.*
        *   `joursSemaineActifs`: `Int[]` (ex: `[0,1,2,3,4]` pour Lundi à Vendredi, si Dimanche=0, Lundi=1...).
        *   `typeSemaine`: `String` (enum implicite : `TOUTES`, `PAIRES`, `IMPAIRES`).
    *   **Relation :** `affectations: AffectationModele[]`.
    *   **Map DB :** `@@map("trame_modeles")`.

3.  **Modèle `AffectationModele` (généralisation de `BlocAffectationHabituelle`) :**
    *   **Action :** Renommer `BlocAffectationHabituelle` en `AffectationModele`.
    *   **Champs à conserver/modifier :**
        *   `id`.
        *   Lien vers `TrameModele`: `trameModeleId`, `trameModele`.
        *   `activityTypeId`: `String` (lien vers `ActivityType.id` ou `ActivityType.code` - préférer `id` si possible pour la performance des jointures, mais `code` est plus stable si les ID peuvent changer lors d'imports/exports). *À discuter, pour l'instant, supposons `String` pour `ActivityType.code` si c'est l'identifiant métier fort.*
        *   `operatingRoomId`: `Int?` (conserver pour le bloc).
        *   `locationId`: `Int?` (ajouter pour une notion de lieu plus générique, à lier à un futur modèle `Location` si différent d'OperatingRoom).
        *   `periode`: `Period` (enum : MATIN, APRES_MIDI, JOURNEE_ENTIERE, NUIT).
        *   `jourSemaineOverride`: `DayOfWeek?` (pour surcharger le jour si la trame est globale mais cette affectation est spécifique).
        *   `typeSemaineOverride`: `WeekType?` (pour surcharger le type de semaine).
        *   `priorite`: `Int @default(5)`.
        *   `detailsJson`: `Json?`.
        *   `isActive`: `Boolean @default(true)` (permet "d'ouvrir/fermer" ce slot dans la trame modèle).
        *   `createdAt`, `updatedAt`.
    *   **Relation vers personnel requis :** `personnelRequis: PersonnelRequisModele[]`.
    *   **Supprimer :** `userId`, `chirurgienId`, `roleInAffectation`, `typeAffectation`, `specialiteChir` (ces notions seront portées par `PersonnelRequisModele` et `ActivityType`).
    *   **Map DB :** `@@map("affectation_modeles")`.

4.  **Nouveau Modèle `PersonnelRequisModele` :**
    *   **Action :** Créer ce nouveau modèle.
    *   **Champs :**
        *   `id: Int @id @default(autoincrement())`.
        *   `affectationModeleId: Int`, et relation `affectationModele: AffectationModele`.
        *   `roleGenerique: String` (Texte libre décrivant le rôle requis, ex: "Anesthésiste Réanimateur", "Chirurgien (Ortho)", "IBODE", "Personnel externe de nettoyage", etc. Ce champ est clé pour les personnels non `User`/`Surgeon`).
        *   `professionalRoleId: String?` (Optionnel: Lien vers `ProfessionalRoleConfig.code` si le `roleGenerique` correspond à un rôle structuré d'un `User`).
        *   `specialtyId: Int?` (Optionnel: Lien vers `Specialty.id` si le rôle est lié à une spécialité spécifique).
        *   `nombreRequis: Int @default(1)`.
        *   `personnelHabituelUserId: Int?` (Optionnel: Lien vers `User.id`).
        *   `personnelHabituelSurgeonId: Int?` (Optionnel: Lien vers `Surgeon.id`).
        *   `personnelHabituelNomExterne: String?` (Optionnel: Nom texte si ni User ni Surgeon).
        *   `notes: String?`.
    *   **Relations (à définir avec `relation(...)` pour les champs optionnels) :**
        *   `professionalRole: ProfessionalRoleConfig?`
        *   `specialty: Specialty?`
        *   `userHabituel: User?`
        *   `surgeonHabituel: Surgeon?`
    *   **Map DB :** `@@map("personnel_requis_modeles")`.

5.  **Dépréciation/Migration des Anciens Modèles de Trames :**
    *   **Action :** Identifier les fonctionnalités de `RegularAssignment`, `TrameAffectation`, `TramePeriod`, `TrameAssignment`, `TramePost` qui ne sont pas couvertes par la nouvelle structure.
    *   **Stratégie :** Pour l'instant, ne pas les supprimer. Se concentrer sur la construction de la nouvelle structure. La migration ou dépréciation sera une étape ultérieure.

### Phase 2: APIs pour la Gestion des Trames Modèles

1.  **API `/api/activity-types` (ex `/api/assignment-types`) :**
    *   **Action :** S'assurer que le CRUD est complet et fonctionnel pour `ActivityType`.

2.  **API `/api/trame-modeles` (CRUD pour `TrameModele` et ses `AffectationModele`/`PersonnelRequisModele` imbriqués) :**
    *   **`POST /api/trame-modeles` :**
        *   Crée un `TrameModele`.
        *   Peut optionnellement créer des `AffectationModele` et leurs `PersonnelRequisModele` associés en une seule transaction (nested writes).
    *   **`GET /api/trame-modeles` :**
        *   Liste les `TrameModele`.
        *   Filtres : `siteId`, `isActive`.
        *   Pagination.
    *   **`GET /api/trame-modeles/{id}` :**
        *   Récupère un `TrameModele` par son ID.
        *   Inclut les `AffectationModele` et leurs `PersonnelRequisModele` (via `include` Prisma).
    *   **`PUT /api/trame-modeles/{id}` :**
        *   Met à jour un `TrameModele`.
        *   Permet de gérer les mises à jour, créations, suppressions des `AffectationModele` et `PersonnelRequisModele` imbriqués.
    *   **`DELETE /api/trame-modeles/{id}` :**
        *   Supprime un `TrameModele` (et ses enfants en cascade si configuré).

### Phase 3: Interface Utilisateur (UI)

1.  **Gestion des "Types d'Activité" (`ActivityType`) :**
    *   **Page :** `/parametres/types-activites` (ou similaire).
    *   **Fonctionnalités :** Tableau listant les `ActivityType`, boutons pour créer, éditer, supprimer. Formulaire modal/page pour l'édition.

2.  **Gestion des "Trames Modèles" (`TrameModele`) :**
    *   **Page :** `/parametres/trames-modeles` (ou similaire).
    *   **Fonctionnalités :**
        *   Tableau listant les `TrameModele` (nom, site, description, statut actif).
        *   Bouton "Créer une trame modèle".
        *   Actions : Éditer, Dupliquer, Supprimer une trame.
    *   **Vue/Édition d'une Trame Modèle (ex: `/parametres/trames-modeles/{id}`) :**
        *   **Onglet 1: Informations Générales**
            *   Formulaire: Nom, description, site, dates d'effet, paramètres de récurrence (jours actifs, type de semaine).
        *   **Onglet 2: Structure de la Trame (Affectations/Postes)**
            *   Affichage tabulaire (ou grille) représentant la semaine type (ou la structure de la trame).
            *   Chaque cellule (ou ligne) représente une `AffectationModele` (un poste type) pour une `periode` (matin, AM, journée).
            *   Permettre d'ajouter une "Affectation Modèle" :
                *   Choisir le type d'activité (`ActivityType`).
                *   Spécifier le lieu (`OperatingRoom` ou `Location`).
                *   Définir le(s) `PersonnelRequisModele` (rôle générique, nb, personnel habituel).
                *   Spécifier la période et les jours concernés dans la trame.
            *   Permettre d'éditer/supprimer une `AffectationModele`.
            *   Permettre de marquer une `AffectationModele` comme `isActive` (ouverte/fermée par défaut dans cette trame).

### Phase 4: Logique d'Application des Trames au Planning

1.  **Service `TrameApplicationService` :**
    *   **Fonction :** `applyTrameToDateRange(trameModeleId: Int, siteId: String, startDate: Date, endDate: Date): Promise<GeneratedAssignment[]>`
    *   **Logique :**
        *   Récupère le `TrameModele` et ses `AffectationModele` / `PersonnelRequisModele`.
        *   Pour chaque jour dans `startDate` à `endDate`:
            *   Vérifie si la trame s'applique (selon sa récurrence et ses dates d'effet).
            *   Si oui, pour chaque `AffectationModele` active dans la trame :
                *   Crée une instance d'affectation concrète (ex: `Assignment` ou `BlocDayPlanning` / `BlocRoomAssignment` pour le bloc).
                *   Pré-remplit avec les infos de l'`AffectationModele` (type, lieu, personnel habituel).
    *   Gère les conflits potentiels (ex: si une affectation existe déjà).

### Phase 5: Documentation

*   **Action :** Mettre à jour la documentation technique (modèles de données Prisma, endpoints API Swagger/OpenAPI) au fur et à mesure de l'implémentation.
*   Créer/mettre à jour les guides utilisateurs pour les nouvelles fonctionnalités de gestion des trames.

---

Ce plan sera affiné au fur et à mesure de l'avancement.
Prochaine étape : Commencer la Phase 1, en particulier les modifications du schéma Prisma.
Je vais me concentrer sur `ActivityType`, `TrameModele`, `AffectationModele`, et `PersonnelRequisModele`.
Concernant la liaison `activityTypeId` dans `AffectationModele` à `ActivityType`, j'utiliserai `ActivityType.id` (qui est un `String` car `@default(uuid())`) pour la cohérence et les performances, en assumant que les `id` sont stables.
La `RRULE` sera mise de côté pour l'instant au profit de champs de récurrence hebdomadaire simples.
La gestion du personnel se fera via le nouveau modèle `PersonnelRequisModele` comme discuté.

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
            - Finaliser `RuleForm` pour l'édition complète des conditions et actions.
            - Développer/Vérifier `RuleList` pour l'affichage et la gestion (activation/désactivation) des règles.
            - S'assurer que le CRUD via API pour les règles est fonctionnel (si marqué comme [ ] dans la roadmap détaillée, le développer).
        - 🔄 **Intégration UI Planning :** Commencer l'intégration du feedback visuel sur le respect (ou non) des règles directement dans l'interface du planning.
        - 🚧 **Résoudre interférence tests `blocPlanningService.test.ts` :** Isoler les tests pour qu'ils passent de manière fiable.

### 3. Algorithme de Génération de Planning (V1 - Démarrage/Continuation)
    - **Objectif :** Produire une première version de l'algorithme capable de générer des plannings de gardes/astreintes en respectant les règles de base.
    - **Actions Immédiates :**
        - 🔄 **Développement Algorithme :** Poursuivre le développement en s'appuyant sur `RuleBasedPlanningGeneratorService`.
        - 🔄 **Intégration Moteur de Règles :** S'assurer que l'algorithme utilise correctement le `RuleEngineService`.
        - ⏳ **Tests d'Intégration :** Planifier et commencer à écrire des tests d'intégration pour l'algorithme avec différents jeux de règles.

### 4. Planification du Bloc Opératoire (Continuation)
    - **Objectif :** Stabiliser et enrichir les fonctionnalités du planning hebdomadaire du bloc.
    - **Actions Immédiates :**
        - 🔄 **Amélioration Feedback DND :** Améliorer le retour visuel lors du glisser-déposer dans le planning hebdomadaire.
        - 🔄 **Validation Manuelle :** Poursuivre le développement des interfaces pour la validation et la modification manuelle des plannings du bloc.
        - ⏳ **Gestion des affectations complexes :** Étudier l'ajout de logique pour les affectations complexes (ex: plusieurs anesthésistes par salle, types d'actes).

### 5. Tests et Qualité (Continu)
    - **Objectif :** Maintenir et améliorer la qualité globale du code.
    - **Actions Immédiates :**
        - 🔄 **Couverture de Tests :** Continuer d'augmenter la couverture de tests pour tous les modules critiques.
        - 🚧 **Problème d'environnement `npm`/`npx` :** Identifier et résoudre le problème bloquant l'exécution des tests (mentionné dans `roadmap-dev-updated.md`).
        - 🔄 **Accessibilité & Performance :** Garder ces aspects à l'esprit lors des nouveaux développements et planifier des passes de tests dédiées.

### 6. Documentation (Mise à jour)
    - **Objectif :** S'assurer que la documentation reflète l'état actuel du projet.
    - **Actions Immédiates :**
        - Mettre à jour `docs-consolidated/*` pour refléter les dernières avancées (notamment sur le bloc opératoire, les règles, les congés).
        - Commencer à esquisser la documentation utilisateur pour les fonctionnalités stabilisées.
        - 🚧 **Documentation spécifique Module Congés**:
            - [ ] Rédiger ou mettre à jour les guides utilisateurs pour la fonctionnalité des demi-journées.
            - [ ] Documenter le processus interne de calcul et de mise à jour des soldes de congés.

## Points d'Attention Particuliers
- **Communication :** Maintenir une communication fluide sur les blocages et les avancées.
- **Priorisation :** Revoir régulièrement les priorités en fonction des retours et des difficultés rencontrées. 