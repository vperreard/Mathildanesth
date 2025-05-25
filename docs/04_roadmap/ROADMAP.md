# Roadmap Mathildanesth

## Objectif Général
Livrer une application de planning robuste, performante, sécurisée et répondant aux besoins spécifiques de l'équipe d'anesthésie, en améliorant continuellement l'expérience utilisateur et la richesse fonctionnelle.

## Légende des Statuts
- ✅ : Fonctionnalité Implémentée et Testée (ou corrections majeures récentes effectuées)
- 🔄 : En Cours de Développement / Implémentation / Refactorisation Active
- 🚧 : Bloqué / En cours d'Investigation / Problèmes à résoudre
- ⏳ : À Planifier / À Démarrer Prochainement

---

## Phase 1 : Fondations et Fonctionnalités Clés (Focus Actuel)

| Fonctionnalité                         | Statut | Détails / Modules Concernés                                                                 |
|----------------------------------------|--------|---------------------------------------------------------------------------------------------|
| **Gestion des Utilisateurs & Accès**   | ✅     | Authentification, profils (MAR/IADE), rôles de base. (`src/app/auth`, `src/modules/profiles`)   |
| **Gestion des Congés & Absences**      | 🔄     | Demandes, validation, décompte, quotas (`useLeaveQuota`), gestion des conflits de base, API `/api/leaves/balance`. (`src/modules/leaves`) |
| **Système de Règles Dynamiques**     | 🔄     | Moteur de règles (`RuleEngineService`), structure de base, validation, détection conflits (moteur). (`src/modules/dynamicRules`, `src/modules/rules`)|
| **Calendrier & Affichage Planning**  | ✅     | Affichage des affectations, jours fériés, navigation. (`src/modules/calendar`, `src/app/calendar`) |
| **Gestion des Trames de Planning**     | ✅     | Création, édition de modèles de planning (ex: bloc opératoire). (`src/app/parametres/trames`, `EditActivityModal`, `BlocPlanningTemplateEditor`) |
| **Paramétrage de Base**              | ✅     | Gestion des sites, secteurs, salles, spécialités, types de congés. (`src/app/admin`, `src/app/parametres`) |
| **Gestion des Erreurs & Logging**    | ✅     | `errorLoggingService`, `ErrorBoundary`.                                                       |
| **Tests Unitaires & Intégration**    | 🔄     | Couverture en augmentation continue (Jest, MSW).                                              |
| **Thème Sombre**                       | ✅     | Implémentation complète.                                                                      |
| **Drag & Drop Planning Hebdomadaire**  | ✅     | Pour les affectations, avec validation par le moteur de règles.                               |
| **Outils de Simulation Planning**      | ✅     | Module de simulation fonctionnel avec création, exécution et visualisation des résultats (`src/app/admin/simulations`), export PDF/Excel, templates de simulation.  |

---

## Phase 2 : Planification Avancée & Bloc Opératoire (Prochaines Étapes Majeures)

| Fonctionnalité                         | Statut | Détails / Modules Concernés                                                                  |
|----------------------------------------|--------|----------------------------------------------------------------------------------------------|
| **Algorithme de Génération Planning**  | 🔄     | V1 pour gardes/astreintes, focus sur règles de base.                                         |
| **Planification du Bloc Opératoire**   | 🔄     | Gestion affichage salles/secteurs par `displayOrder`, intégration trames, affectations. (`src/app/bloc-operatoire`, `src/app/planning/hebdomadaire`)|
| **Amélioration Interfaces Trames/Affectations** | ⏳ | Refonte UI pour création/édition trames, affectations plus visuelles et intuitives, gestion simplifiée des variations. |
| **Gestion des Indisponibilités**       | ✅     | Module `src/modules/unavailability` fonctionnel.                                               |
| **Validation Manuelle Plannings**    | 🔄     | Interfaces pour ajustements manuels.                                                         |
| **Simulation Avancée de Planning**    | ✅     | Templates de simulation, comparaison de scénarios, dashboard analytique (`src/app/admin/simulations`).                                                         |
| **Gestion des Remplacements**          | ⏳     | Système pour gérer les imprévus et remplacements.                                           |
| **Échanges d'Affectations**           | 🔄     | Fonctionnalité simple d'échange (lié à `add_assignment_swap_request` migration).                |
| **Interface Admin Règles Avancée**   | 🔄     | Amélioration `RuleForm`, `RuleList`.                                                           |
| **Améliorations Gestion Disponibilités** | ⏳   | Expression des préférences utilisateurs, visibilité anticipée des impacts d'absence, vue consolidée des disponibilités (voir `docs-consolidated/04_Roadmap/02_Axes_Amelioration.md`). |

---

## Phase 3 : UX, Collaboration & Fonctionnalités Complémentaires

| Fonctionnalité                         | Statut | Détails / Modules Concernés                                                                 |
|----------------------------------------|--------|---------------------------------------------------------------------------------------------|
| **Améliorations UX Générales**         | ✅     | Filtres avancés (`AdvancedFilter.tsx`), transitions (`transitions/index.ts`), requêtes optimisées (`useOptimizedQuery.ts`), cache (`CacheService.ts`). |
| **Design Responsive Complet**          | 🔄     | Adaptation continue pour tablettes et mobiles.                                                |
| **Planification des Consultations**    | ⏳     | Module dédié (MVP) : gestion créneaux, règles simples.                                      |
| **Outils de Collaboration**            | ⏳     | Messagerie contextuelle, commentaires sur planning, historique.                              |
| **Tableaux de Bord & Analytics (V1)**  | 🔄     | Affichage de premières statistiques (`src/app/statistiques`, `src/modules/dashboard`, `src/modules/analytics`). Migration `add_dashboard`. |
| **Système de Notifications Avancé**    | 🔄     | Module `src/modules/notifications`, migration `add_notifications`.                           |
| **Gestion Avancée des Disponibilités** | ⏳     | Alertes proactives, gestion des exceptions, tableaux de bord d'équité. |
| **Assistant IA pour Simulation**       | ⏳     | Analyses automatiques et suggestions d'amélioration basées sur les résultats de simulation.    |

---

## Phase 4 : Optimisation, Tests & Déploiement

| Fonctionnalité                         | Statut | Détails                                                                                       |
|----------------------------------------|--------|-----------------------------------------------------------------------------------------------|
| **Optimisation des Performances**      | 🔄     | Middleware d'authentification (cache), layout principal optimisé, hook WebSocket amélioré, configuration Webpack. Voir plan détaillé ci-dessous. |
| **Tests Approfondis**                  | 🔄     | Performance, Sécurité (RGPD), Accessibilité (WCAG).                                           |
| **Documentation Utilisateur Finale**   | ⏳     | Guides complets pour tous les rôles.                                                          |
| **Préparation au Déploiement**         | ⏳     | Scripts, configuration serveur, etc.                                                          |

### Plan d'optimisation des performances (mai-juin 2025)

#### Phase 1 : Analyse et Optimisations Backend (1 semaine)
- [x] Mise en place d'un système de tests de performance automatisés avec Cypress
- [x] Création d'un tableau de bord de monitoring des performances
- [x] Correction des problèmes identifiés dans les routes API (async/await dans les routes dynamiques)
- [x] Cache Prisma avec invalidation sélective pour les requêtes fréquentes
- [ ] Pagination côté serveur pour toutes les API de listes
- [ ] Création d'index ciblés sur les requêtes fréquentes
- [x] Optimisation du middleware d'authentification (TTL configuré à 5 min)

#### Phase 2 : Pages d'Authentification et de Connexion (1 semaine)
- [ ] Optimisation critique des pages `/auth/login` (10.3s) et `/login` (6.3s)
- [ ] Implémentation de Suspense et chargement progressif
- [ ] Réduction du JavaScript initial pour les pages d'authentification
- [ ] Optimisation des validations de formulaires
- [ ] Préchargement optimisé des ressources critiques

#### Phase 3 : Composants React & State (1 semaine)
- [ ] Virtualisation des listes et tableaux volumineux
- [ ] Optimisation du rendu conditionnel des composants complexes
- [ ] Fragmentation du store global en sous-stores spécifiques
- [ ] Implémentation de sélecteurs memoizés pour les accès fréquents
- [x] Fix configuration Turbopack (migration de `experimental.turbo` vers `turbopack: true`)

#### Phase 4 : Assets & Ressources (1 semaine)
- [ ] Généralisation du composant OptimizedImage
- [ ] Automatisation de l'optimisation des images au build
- [ ] Lazy loading intelligent pour les images
- [ ] Optimisation des polices et nettoyage des styles CSS inutilisés
- [x] Correction des avertissements de métadonnées viewport

#### Phase 5 : Service Worker & Offline (1 semaine)
- [ ] Cache des ressources statiques critiques
- [ ] Préchargement des chemins probables
- [ ] Mode hors ligne pour les fonctionnalités essentielles
- [ ] Synchronisation en arrière-plan lors du retour en ligne
- [ ] Intégration avec le système de notifications

**Résultats des tests de performance actuels (après corrections)**:
| Page/API | Temps de chargement initial | Temps après optimisations | Amélioration |
|----------|---------------------|--------|-------|
| Page `/` (accueil) | 1702ms | 277ms | -84% |
| Page `/login` | 6321ms | 1876ms | -70% |
| Page `/auth/login` | 10321ms | 3035ms | -71% |
| Chargement initial | 696ms | 273ms | -61% |
| APIs (moyenne) | 4-11ms | 4-11ms | 0% |

**Documentation technique**: Pour plus de détails sur les optimisations implémentées et les bonnes pratiques à suivre, consultez `docs/technique/performance-optimization.md`.

---

## Phase 5 : Évolutions Futures

| Fonctionnalité                         | Statut | Détails                                                                                       |
|----------------------------------------|--------|-----------------------------------------------------------------------------------------------|
| **Applications Mobiles Natives**       | ⏳     | React Native (MVP : consultation planning/congés, notifications).                             |
| **Intégrations Externes**              | ⏳     | Avec d'autres systèmes hospitaliers (si besoin).                                               |
| **Analytics Avancés & Prédictions**    | ⏳     | Fonctionnalités d'analyse prédictive, IA.                                                      |

---

## Tableau de Bord Analytique & Simulation (juin - août 2025)

### Phase 1: Fondations Analytiques (juin 2025) - TERMINÉ ✅
- [x] Création des modèles de données pour les métriques clés
- [x] Développement d'APIs pour les statistiques d'utilisation
- [x] Interface utilisateur basique pour la visualisation des métriques

### Phase 2: Module de Simulation (juillet 2025) - EN COURS ⏳
- [x] Conception des templates de simulation
- [x] Implémentation du moteur de simulation
- [x] Duplication/clonage des templates 
- [x] Tableau de bord analytique comparatif
- [x] Filtres avancés pour l'analyse des résultats
- [x] Optimisation des performances des simulations
- [x] Système de mise en cache des résultats
- [x] Traitement parallèle pour les simulations volumineuses
- [x] Visualisations graphiques avancées
- [x] Système de notifications pour les simulations longues
- [x] Raccourcis pour appliquer un résultat de simulation au planning réel

### Phase 3: Intégration & Prédictions Avancées (août 2025) - PLANIFIÉ 📅
- [ ] Intégration des données des congés validés
- [ ] Création de liens avec le module de génération de planning
- [ ] Synchronisation des templates avec les trames de planning
- [ ] Algorithmes prédictifs pour l'analyse des tendances
- [ ] Recommandations automatisées basées sur les résultats de simulation
- [ ] Optimisation des plannings via intelligence artificielle

---
_Cette roadmap est un document vivant et sera mise à jour régulièrement en fonction de l'avancement et des priorités._
